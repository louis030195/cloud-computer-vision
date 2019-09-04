
# Standard libs
import os
import json
import base64
import time

# Vectors
import numpy as np

# Google Cloud client libraries
from google.cloud import datastore
from google.cloud import storage

from utils import count_duplicates, get_entity, random_id, chunks, frame_to_input
from utils import make_batch_job_body, batch_predict, online_predict, get_no_response, any_job_running

BUCKET_NAME = os.environ['BUCKET_NAME']
PROJECT_ID = os.environ['PROJECT_ID']
MODEL_NAME = os.environ['MODEL_NAME']
REGION = os.environ['REGION']
TRESHOLD = int(os.environ['TRESHOLD'])
BATCH_CHUNK = int(os.environ['BATCH_CHUNK'])
ONLINE_TIMEOUT = int(os.environ['ONLINE_TIMEOUT'])



def predictor(_):
    """Triggered by HTTP.
    """
    start_time = time.time()
    client_datastore = datastore.Client()
    # Then get by key for this entity
    query_queue = client_datastore.query(kind='Queue')
    queue = list(query_queue.fetch())

    if len(queue) == 0:
        print("No frames to process")
        return
    print("{} frames to process".format(len(queue)))

    # test
    print('Number of duplicates in the queue', count_duplicates(list(map(lambda x: dict(x)['frame'], queue))))
    
    # Above a certain amount of frames in the queue we pick batch instead of online predictions
    # Or if there is currently a batch being prepared and other input files are waiting
    # to be written (checking if any queued frame has the key 'batch')
    if len(queue) >= TRESHOLD or any(map(lambda x: 'batch' in dict(x), queue)):
        if any_job_running(PROJECT_ID): # TODO: think about how to plan for later a job launch (after end of this one)
            print("A job is already running, exiting")
            return

        # Instantiates a GCS client
        storage_client = storage.Client()

        # Required in case building an input takes multiple predictor execution,
        # We want to keep the same jobId than previous execution because
        # jobId is used for the input / output folder (we want all inputs in the same folder)
        jobIds = list(filter(lambda x: 'batch' in dict(x), queue))

        # The model to prepare inputs is either the first of the list
        # either it's the first element of the list which has 'batch' property (means that a job was being prepared already)
        model = jobIds[0]['model'] if len(jobIds) > 0 else dict(queue[0])['model']
        body = make_batch_job_body(project_name=PROJECT_ID,
                                   bucket_name=BUCKET_NAME,
                                   model_name=MODEL_NAME,
                                   region=REGION,
                                   version_name=model,
                                   max_worker_count=72)
        # Filtering the queue to launch a batch job only for the asked model
        filtered_queue = list(filter(lambda x: model in dict(x)['model'], queue))
        if len(jobIds) > 0:
            body['jobId'] =  jobIds[0]['batch']

            # Also need to update paths
            body['predictionInput']['inputPaths'] = 'gs://{}/{}/batches/*'.format(BUCKET_NAME, body['jobId'])
            body['predictionInput']['outputPath'] = 'gs://{}/{}/batch_results'.format(BUCKET_NAME, body['jobId'])
        else: # Optimization, so we do it only once
            # We want to signal that all these frames have to be put into input files
            # Doing it first right away because it takes some execution time
            # Actually we just need to tag the last element of the batch
            filtered_queue[-1]['batch'] = body['jobId']
            client_datastore.put(filtered_queue[-1])

        # Creating multiple small input files (better scalability)
        for i, chunk in enumerate(chunks(filtered_queue, BATCH_CHUNK)):
            print('Chunk n°{}'.format(i + 1))
            elapsed_time = time.time() - start_time
            print('Elapsed time {0:.2f}'.format(elapsed_time))
            # Avoid timeout (40s)
            if elapsed_time > 40:
                # Resursive until everything into input files
                get_no_response('https://{}-{}.cloudfunctions.net/predictor'.format(REGION, PROJECT_ID))
                print(f'{len(filtered_queue) - (1 + i) * BATCH_CHUNK} frames left to write to input file for model {model}')
                return
            random_file_id = random_id()
            for i, q in enumerate(chunk):
                frame_entity = get_entity(client_datastore, 'Frame', dict(q)['frame'])

                json_frame = frame_to_input(frame_entity)

                # Random name, must be different from other input files
                file_name = "inputs-{}.json".format(random_file_id)
                file_path = os.path.join("/tmp", file_name)

                # Open file with "a" = append the file
                with open(file_path, "a+") as json_file:
                    json_file.write(json.dumps(json_frame) + "\n")

                client_datastore.delete(q.key)

            bucket = storage_client.get_bucket(BUCKET_NAME)
            blob = bucket.blob(os.path.join(body['jobId'], 'batches', file_name))
            # Upload the input
            blob.upload_from_filename(file_path)

        # Launch the batch prediction job
        response = batch_predict(PROJECT_ID, body)
        # Dismiss processed messages from the  queue in case the job has been queued only
        if 'QUEUED' in response:
            pass
            
        return

    else:
        import socket
        # https://stackoverflow.com/questions/48969145/how-to-set-the-request-timeout-in-google-ml-api-python-client
        socket.setdefaulttimeout(ONLINE_TIMEOUT)
        # Iterate through the frames to process
        for i, q in enumerate(queue):

            elapsed_time = time.time() - start_time
            print('Elapsed time {0:.2f}'.format(elapsed_time))

            # Avoid timeout (40s)
            if elapsed_time > 30: # TODO: handle timeout treshold in relation to image size (model takes longer for bigger image)
                # Resursive until everything processed
                get_no_response('https://{}-{}.cloudfunctions.net/predictor'.format(REGION, PROJECT_ID))
                print('{} frames left to process'.format(len(queue) - i))
                return
                
            frame_entity = get_entity(client_datastore, 'Frame', dict(q)['frame'])
            json_frame = frame_to_input(frame_entity)
            instances = [json_frame]

            # Query AI Platform with the input
            result = online_predict(PROJECT_ID, MODEL_NAME, instances, dict(q)['model'])

            # Put the prediction in Datastore
            key_prediction = client_datastore.key('Prediction')
            entity_prediction = datastore.Entity(key=key_prediction)

            keys_object = list()

            # For each object detected ...
            # Assuming there is only one prediction possible even though there is a 's' at predictions ?
            for i in range(int(result['predictions'][0]['num_detections'])):
                if result['predictions'][0]['detection_scores'][i] > 0.1:
                    # Create a new dict that will be put in datastore in a clean format
                    object_detected = dict()
                    object_detected['detection_classes'] = int(result['predictions'][0]['detection_classes'][i])
                    object_detected['detection_boxes'] = result['predictions'][0]['detection_boxes'][i]
                    object_detected['detection_scores'] = result['predictions'][0]['detection_scores'][i]

                    # Put the information about the object into a new table row ...
                    key_object = client_datastore.key('Object')
                    entity_object = datastore.Entity(key=key_object)
                    entity_object.update(object_detected)
                    client_datastore.put(entity_object)

                    # Store the id generated for reference in Prediction table
                    keys_object.append(entity_object.id)

            # Put a list of objects detected in prediction row
            entity_prediction.update({'model': dict(q)['model'], 'objects': keys_object})
            client_datastore.put(entity_prediction)

            # Update the predictions properties of the Frame row
            if 'processing' in frame_entity['predictions']:
                frame_entity['predictions'] = [] # Reset it
            # If it doesn't go in the if, it means that it already has predictions from another model
            frame_entity['predictions'].append(entity_prediction.id)

            # Push into datastore
            client_datastore.put(frame_entity)

            # Dismiss processed messages from the  queue
            # Remove from datastore
            client_datastore.delete(q.key)


    return