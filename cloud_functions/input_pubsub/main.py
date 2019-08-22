
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

from utils import download_Image, Image_to_b64

BUCKET_NAME = os.environ['BUCKET_NAME']
PROJECT_ID = os.environ['PROJECT_ID']
TOPIC_EXTRACTOR = os.environ['TOPIC_EXTRACTOR']
TOPIC_INPUT = os.environ['TOPIC_INPUT']
INPUT_TYPE = os.environ['INPUT_TYPE']
WIDTH = int(os.environ['WIDTH'])
HEIGHT = int(os.environ['HEIGHT'])

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
    if 'batch_results/' in event['name'].lower() or 'batches/' in event['name'].lower(): # (e.g. batch results put here, we skip)
        return

    publisher = pubsub_v1.PublisherClient()
    if any(ex in event['name'].lower() for ex in ['.avi', '.mp4']):
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
    if all(ex not in event['name'].lower() for ex in ['.png', '.jpg', '.jpeg']):
        print("Unhandled file type", event)
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
        img = download_Image(frame['imageUrl'], WIDTH)

        if 'encoded_image_string_tensor' in INPUT_TYPE:
            # Model input is b64
            # Compose a JSON Predict request (send JPEG image in base64).
            img = {"b64":Image_to_b64(img).decode('utf-8')}
        else: # image_tensor
            # Cast into nparray
            img = np.array(img)

        # Create an object containing the data
        image_byte_dict = {"inputs": img, "input_keys": str(frame.id)}

        # Publish the frame id
        topic_path = publisher.topic_path(PROJECT_ID, TOPIC_INPUT)
        response = publisher.publish(
            topic_path,
            data=str(image_byte_dict).encode('utf-8')  # data must be a bytestring.
        )
        print('Pushed', response)
