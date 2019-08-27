
# Standard libs
import os
import json
import base64
from datetime import datetime

# Requests
import requests

# Vectors
import numpy as np

# Google Cloud client libraries
from google.cloud import datastore
from google.cloud import storage

from utils import create_subscription, synchronous_pull, acknowledge_messages, make_batch_job_body, batch_predict, online_predict

BUCKET_NAME = os.environ['BUCKET_NAME']
PROJECT_ID = os.environ['PROJECT_ID']
MODEL_NAME = os.environ['MODEL_NAME']
VERSION_NAME = os.environ['VERSION_NAME']
REGION = os.environ['REGION']
TRESHOLD = int(os.environ['TRESHOLD'])
TOPIC_INPUT = os.environ['TOPIC_INPUT']
SUBSCRIPTION_INPUT = os.environ['SUBSCRIPTION_INPUT']



def predictor(request):
    """Triggered by a PubSub subscription.
    Args:
         event (dict): Event payload.
         context (google.cloud.functions.Context): Metadata for the event.
    """
    #print(request.get_json(silent=True))
    #pubsub_data = base64.b64decode(event['data']).decode('utf-8')
    #pubsub_json = json.loads(pubsub_data)

    frames_to_process, ack_ids = synchronous_pull(PROJECT_ID, TOPIC_INPUT, SUBSCRIPTION_INPUT, TRESHOLD)
    if len(frames_to_process) == 0:
        print("No frames to process")
        return
    client_datastore = datastore.Client()
    # Above which amount of frames in the queue we pick batch instead of online predictions
    if len(frames_to_process) >= TRESHOLD:
        # Instantiates a GCS client
        storage_client = storage.Client()
        body = make_batch_job_body(PROJECT_ID,
                                   'gs://{}/batches/*'.format(BUCKET_NAME),
                                   'gs://{}/batch_results'.format(BUCKET_NAME),
                                   MODEL_NAME,
                                   REGION,
                                   version_name=VERSION_NAME,
                                   max_worker_count=72)
        # TODO: handle case where the batch is too big to be written to a single file
        #def chunks(l, n):
        #"""Yield successive n-sized chunks from l."""
        #for i in range(0, len(l), n):
        #    yield l[i:i + n]
        # for frames_chunk in chunks(frames_to_process, TRESHOLD):
        for frame in frames_to_process:
            json_frame = json.loads(frame.replace("'", "\""))
            file_path = "/tmp/inputs.json"

            # Open file with "a" = append the file
            with open(file_path, "a+") as json_file:
                json_file.write(json.dumps(json_frame) + "\n")

            # Get the frame key in Datastore
            query = client_datastore.query(kind='Frame')
            key_frame = client_datastore.key('Frame', int(json_frame['input_keys']))
            query.key_filter(key_frame, '=')
            frame = list(query.fetch())[0]

            # Useless
            # Update the predictions properties of the Frame row to stop launching jobs
            # frame['predictions'] = 'processing' #TODO: handle case where multiple job ended => #
            # frame['job'] = body['jobId']

            # Push into datastore
            client_datastore.put(frame)

        bucket = storage_client.get_bucket(BUCKET_NAME)
        blob = bucket.blob('batches/inputs.json')
        # Upload the input
        blob.upload_from_filename(file_path)

        # Launch the batch prediction job
        response = batch_predict(PROJECT_ID, body)
        # Dismiss processed messages from the  queue in case the job has been queued only
        if 'QUEUED' in response:
            acknowledge_messages(PROJECT_ID, SUBSCRIPTION_INPUT, ack_ids)
            _, x = synchronous_pull(PROJECT_ID, TOPIC_INPUT, SUBSCRIPTION_INPUT, TRESHOLD)
            print('Number of messages in the queue after acknowledgement: {}'.format(len(x)))
        return

    else:
        # Iterate through the frames to process
        #for index, frame in enumerate(frames_to_process):
        json_frame = json.loads(frames_to_process[0].replace("'", "\""))
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

        # Get the frame key in Datastore
        query = client_datastore.query(kind='Frame')
        key_frame = client_datastore.key('Frame', int(json_frame['input_keys']))
        query.key_filter(key_frame, '=')
        query_result = list(query.fetch())

        # Happens when debugging and removing while predicting ...
        # Just to avoid having irrelevant errors in logs
        if len(query_result) == 0:
            print("It appears that frame {} isn't in datastore, probably deleted".format(json_frame['input_keys']))
            return
            
        frame = query_result[0]

        # Update the predictions properties of the Frame row
        frame['predictions'] = entity_prediction.id

        # Push into datastore
        client_datastore.put(frame)

        # Dismiss processed messages from the  queue
        acknowledge_messages(PROJECT_ID, SUBSCRIPTION_INPUT, [ack_ids[0]])
