
# Standard libs
import os
import time
import json
import re
from datetime import datetime
import base64

# Vectors
import numpy as np

# Images
import cv2

# Requests
import requests

# Google Cloud client libraries
from google.cloud import datastore
from google.cloud import pubsub_v1

BUCKET_NAME = os.environ['BUCKET_NAME']
PROJECT_ID = os.environ['PROJECT_ID']
TOPIC_EXTRACTOR = os.environ['TOPIC_EXTRACTOR']
TOPIC_INPUT = os.environ['TOPIC_INPUT']
INPUT_TYPE = os.environ['INPUT_TYPE']

def create_topic(project_id, topic_name):
    """Create a new Pub/Sub topic if it doesn't exist"""
    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(project_id, topic_name)
    try:
        publisher.create_topic(topic_path)
        print('This topic doesn\'t exist {}, created it'.format(t.name))
    except: # Means already exist
        pass





def input_pubsub(event, context):
    """Triggered by a change to a Cloud Storage bucket.
    Args:
         event (dict): Event payload.
         context (google.cloud.functions.Context): Metadata for the event.
    """
    # GCP doesn't handle trigger on folder level, so either change architecture
    # either multiple bucket (is that more expensive or ? ...)
    # https://googlecloud.tips/tips/018-trigger-cloud-functions-on-gcs-folders/
    if event['name'].startswith('batch_results/') or event['name'].startswith('batches/'): # (e.g. batch results put here, we skip)
        return

    publisher = pubsub_v1.PublisherClient()
    if event['contentType'].startswith('video'):
        # Checking if the pubsub topic exist, if it doesn't, create it
        create_topic(PROJECT_ID, TOPIC_EXTRACTOR)

        # Publish the video url to extract
        topic_path = publisher.topic_path(PROJECT_ID, TOPIC_EXTRACTOR)
        publisher.publish(
            topic_path,
            data=os.path.join('gs://{}'.format(BUCKET_NAME),
                              event['name']).encode('utf-8')  # data must be a bytestring.
        )

    # A file has been added to the bucket but it's either an image or a video (split into frames)
    if not event['contentType'].startswith('image'):
        print("Unhandled file type")
        return

    # The public url of the file that triggered this cloud function
    frameUrl = os.path.join('https://storage.googleapis.com', BUCKET_NAME, event['name'])

    client = datastore.Client()
    # Then get by key for this entity
    query_frame = client.query(kind='Frame')
    query_frame.add_filter('imageUrl', '=', frameUrl)
    frames_to_process = list(query_frame.fetch())
    
    # Checking if the pubsub topic exist, if it doesn't, create it
    create_topic(PROJECT_ID, TOPIC_INPUT)

    for frame in frames_to_process:
        # Download
        dl_request = requests.get(frame['imageUrl'], stream=True)
        dl_request.raise_for_status()

        if 'encoded_image_string_tensor' in INPUT_TYPE:
            # Model input is b64
            # Compose a JSON Predict request (send JPEG image in base64).
            img = {"b64":base64.b64encode(dl_request.content).decode('utf-8')}
        else: # image_tensor
            # Load into array
            arr = np.asarray(bytearray(dl_request.content), dtype=np.uint8)

            # Preprocessing
            # TODO:calculate the scaling that has been done and put into the image datastore in order to rescale boxes etc
            img = cv2.resize(cv2.cvtColor(cv2.imdecode(arr, -1), cv2.COLOR_BGR2RGB), (100, 100)).tolist()


        # Create an object containing the data
        image_byte_dict = {"inputs": img, "input_keys": str(frame.id)}
        #json_object = json.dumps(image_byte_dict)

        # Publish the frame id
        topic_path = publisher.topic_path(PROJECT_ID, TOPIC_INPUT)
        publisher.publish(
            topic_path,
            data=str(image_byte_dict).encode('utf-8')  # data must be a bytestring.
        )
