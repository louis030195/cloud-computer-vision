
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
TOPIC_EXTRACTOR = os.environ['TOPIC_EXTRACTOR']
REGION = os.environ['REGION']



def create_topic(publisher, project_id, topic_name):
    """Create a new Pub/Sub topic if it doesn't exist"""
    topic_path = publisher.topic_path(project_id, topic_name)
    try:
        publisher.create_topic(topic_path)
        print('This topic doesn\'t exist {}, created it'.format(t.name))
    except: # Means already exist
        pass

# TODO: https://cloud.google.com/functions/docs/bestpractices/networking
def queue_input(request):
    """Triggered by a change to a Cloud Storage bucket.
    Args:
         request
    """
    start_time = time.time()
    
    client = datastore.Client()

    # Checking if there is any video that haven't been extracted
    """
    query_video = client.query(kind='Video')
    query_video.add_filter('frames', '=', None)
    videos_to_process = list(query_video.fetch())
    for video in videos_to_process:
        print('Video {} frames will be extracted'.format(video['imageUrl']))

        publisher = pubsub_v1.PublisherClient()
        # Checking if the pubsub topic exist, if it doesn't, create it
        create_topic(publisher, PROJECT_ID, TOPIC_EXTRACTOR)

        # Publish the video url to extract
        topic_path = publisher.topic_path(PROJECT_ID, TOPIC_EXTRACTOR)
        publisher.publish(
            topic_path,
            data=os.path.join(video['imageUrl']).encode('utf-8')  # data must be a bytestring.
        )
    """


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

        

        key_queue = client.key('Queue')
        entity_queue = datastore.Entity(key=key_queue)
        #entity_queue['input'] = image_byte_dict
        entity_queue['frame'] = frame.id
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
