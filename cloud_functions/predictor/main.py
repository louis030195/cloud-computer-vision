
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

from utils import count_duplicates, get_entity, random_id, chunks, frame_to_input, make_batch_job_body, batch_predict, online_predict, get_no_response

BUCKET_NAME = os.environ['BUCKET_NAME']
PROJECT_ID = os.environ['PROJECT_ID']
MODEL_NAME = os.environ['MODEL_NAME']
VERSION_NAME = os.environ['VERSION_NAME']
REGION = os.environ['REGION']
TRESHOLD = int(os.environ['TRESHOLD'])
BATCH_CHUNK = int(os.environ['BATCH_CHUNK'])



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
        # Instantiates a GCS client
        storage_client = storage.Client()
        body = make_batch_job_body(project_name=PROJECT_ID,
                                   bucket_name=BUCKET_NAME,
                                   model_name=MODEL_NAME,
                                   region=REGION,
                                   version_name=VERSION_NAME,
                                   max_worker_count=72)
        # Creating multiple small input files (better scalability)
        for i, chunk in enumerate(chunks(queue, BATCH_CHUNK)):
            print('Chunk n°{}'.format(i + 1))
            elapsed_time = time.time() - start_time
            print('Elapsed time {0:.2f}'.format(elapsed_time))
            # Avoid timeout (40s)
            if elapsed_time > 40:
                # We want to signal that these frames have to be put into input files
                # Starting the loop at queue[current chunk index * chunk size], for all frames in the queue
                for j in range(i * BATCH_CHUNK, len(queue)):
                    queue[j]['batch'] = 'batch'
                    client_datastore.put(queue[j])
                # Resursive until everything into input files
                get_no_response('https://{}-{}.cloudfunctions.net/predictor'.format(REGION, PROJECT_ID))
                print('{} frames left to write to input file'.format(len(queue) - i * BATCH_CHUNK))
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
        # Iterate through the frames to process
        for i, q in enumerate(queue):

            elapsed_time = time.time() - start_time
            print('Elapsed time {0:.2f}'.format(elapsed_time))

            # Avoid timeout (40s)
            if elapsed_time > 40:
                # Resursive until everything processed
                get_no_response('https://{}-{}.cloudfunctions.net/predictor'.format(REGION, PROJECT_ID))
                print('{} frames left to process'.format(len(queue) - i))
                return
                
            frame_entity = get_entity(client_datastore, 'Frame', dict(q)['frame'])
            json_frame = frame_to_input(frame_entity)
            instances = [json_frame]

            # Query AI Platform with the input
            result = online_predict(PROJECT_ID, MODEL_NAME, instances, VERSION_NAME)

            # Put the prediction in Datastore
            key_prediction = client_datastore.key('Prediction')
            entity_prediction = datastore.Entity(key=key_prediction)

            keys_object = list()

            # For each object detected ...
            # Assuming there is only one prediction possible even though there is a 's' at predictions ?
            for i in range(int(result['predictions'][0]['num_detections'])):
                object_detected = dict()
                object_detected['detection_classes'] = int(
                    result['predictions'][0]['detection_classes'][i])
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
            entity_prediction.update({'objects': keys_object})
            client_datastore.put(entity_prediction)

            # Update the predictions properties of the Frame row
            frame_entity['predictions'] = entity_prediction.id

            # Push into datastore
            client_datastore.put(frame_entity)

            # Dismiss processed messages from the  queue
            # Remove from datastore
            client_datastore.delete(q.key)


    return 'Success'