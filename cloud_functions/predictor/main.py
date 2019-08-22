
# Standard libs
import os
import json
import base64
from datetime import datetime


# Requests
import requests

# Vectors
import numpy as np

# Images
import cv2

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
WIDTH = int(os.environ['WIDTH'])
HEIGHT = int(os.environ['HEIGHT'])
DELAY_ONLINE = int(os.environ['DELAY_ONLINE'])
TOPIC_INPUT = os.environ['TOPIC_INPUT']
SUBSCRIPTION_INPUT = os.environ['SUBSCRIPTION_INPUT']



def predictor(event, context):
    """Triggered by a PubSub subscription.
    Args:
         event (dict): Event payload.
         context (google.cloud.functions.Context): Metadata for the event.
    """
    pubsub_data = base64.b64decode(event['data']).decode('utf-8')
    pubsub_json = json.loads(pubsub_data)

    frames_to_process, ack_ids = synchronous_pull(PROJECT_ID, TOPIC_INPUT, SUBSCRIPTION_INPUT)
    client_datastore = datastore.Client()
    # Above which amount of frames we pick batch instead of online predictions
    if len(frames_to_process) > TRESHOLD:
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
        for frame in frames_to_process:
            json_object = json.dumps(frame)
            file_path = "/tmp/inputs.json"

            # Open file with "a" = append the file
            with open(file_path, "a+") as json_file:
                json_file.write(json_object + "\n")

            # Get the frame key in Datastore
            key_frame = client_datastore.key('Frame', frame.id)
            entity_frame = datastore.Entity(key=key_frame)

            # Create an object to put in datastore
            obj = dict(frame)

            # Update the predictions properties of the Frame row to stop launching jobs
            obj['predictions'] = 'processing' #TODO: handle case where multiple job ended => #
            obj['job'] = body['jobId']

            # Push into datastore
            entity_frame.update(obj)
            client_datastore.put(entity_frame)

        bucket = storage_client.get_bucket(BUCKET_NAME)
        blob = bucket.blob('batches/inputs.json')

        blob.upload_from_filename(file_path)

        print('File uploaded')
        # TODO: messages shouldn't be acknowledged if batch_predict failed
        # Dismiss processed messages from the  queue
        acknowledge_messages(PROJECT_ID, SUBSCRIPTION_INPUT, ack_ids)
        print('Response', batch_predict(PROJECT_ID, body))
        return

    # Avoid jumping on online prediction too early
    elif (datetime.now() - datetime.strptime(event['timeCreated'], '%Y-%m-%dT%H:%M:%S.%fZ')).total_seconds() < DELAY_ONLINE:
        print('Waiting more frames',
              (datetime.now() - datetime.strptime(event['timeCreated'], '%Y-%m-%dT%H:%M:%S.%fZ')).total_seconds())
        return
    else:
        # Iterate through the media to process
        for frame in frames_to_process:
            instances = [frame]

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
            key_frame = client_datastore.key('Frame', frame.id)
            entity_frame = datastore.Entity(key=key_frame)

            # Create an object to put in datastore
            obj = dict(frame)

            # Update the predictions properties of the Frame row
            obj['predictions'] = entity_prediction.id

            # Push into datastore
            entity_frame.update(obj)
            client_datastore.put(entity_frame)

            # Dismiss processed messages from the  queue
            acknowledge_messages(PROJECT_ID, SUBSCRIPTION_INPUT, ack_ids)
