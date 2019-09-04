
# Standard libs
import os
import time

# Vectors
import numpy as np

# Google Cloud client libraries
from google.cloud import datastore
from google.cloud import pubsub_v1

from utils import get_no_response

BUCKET_NAME = os.environ['BUCKET_NAME']
PROJECT_ID = os.environ['PROJECT_ID']
REGION = os.environ['REGION']
VERSIONS_NAME = os.environ['VERSIONS_NAME']

# TODO: https://cloud.google.com/functions/docs/bestpractices/networking
def queue_input(request):
    """Triggered by a change to a Cloud Storage bucket.
    Args:
         request
    """
    start_time = time.time()
    
    client = datastore.Client()

    # Then get by key for this entity
    query_frame = client.query(kind='Frame')
    query_frame.add_filter('predictions', '=', None)
    frames_to_process = list(query_frame.fetch())
    if len(frames_to_process) == 0:
        print("No frames to queue")
        return
    
    print("{} frames to queue".format(len(frames_to_process)))

    published_messages = 0
    for index, frame in enumerate(frames_to_process):
        elapsed_time = time.time() - start_time
        

        # Avoid timeout (40s)
        if elapsed_time > 40:
            print('Timeout, elapsed time {0:.2f}'.format(elapsed_time))
            # Recursive call until everything is in the queue
            get_no_response('https://{}-{}.cloudfunctions.net/queue_input'.format(REGION, PROJECT_ID))
            print('Recursive call, {} frames left to queue'.format(len(frames_to_process) - index))
            return

        # TODO: check if version_name is an existing version ?
        # Do we need to do smthing with model names ? or all models are gonna be put under version?
        for version_name in VERSIONS_NAME.split(';'):
            key_queue = client.key('Queue')
            entity_queue = datastore.Entity(key=key_queue)
            entity_queue['frame'] = frame.id
            # We want this frame processed by version_name model
            entity_queue['model'] = version_name
            client.put(entity_queue)

            published_messages += 1

        # Get the frame key in Datastore
        key_frame = client.key('Frame', frame.id)
        entity_frame = datastore.Entity(key=key_frame)

        # Create an object to put in datastore
        obj = dict(frame)

        # Update the predictions properties of the Frame row to avoid duplicating
        obj['predictions'] = 'processing'

        # Push into datastore
        entity_frame.update(obj)
        client.put(entity_frame)
    

    print('Published {} messages'.format(published_messages))
    get_no_response('https://{}-{}.cloudfunctions.net/predictor'.format(REGION, PROJECT_ID))
    return
