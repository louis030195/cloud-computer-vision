
# Standard libs
import os
import time

# Vectors
import numpy as np

# Google Cloud client libraries
from google.cloud import datastore
from google.cloud import pubsub_v1

from utils import download_Image, Image_to_b64, get_no_response

BUCKET_NAME = os.environ['BUCKET_NAME']
PROJECT_ID = os.environ['PROJECT_ID']
TOPIC_EXTRACTOR = os.environ['TOPIC_EXTRACTOR']
REGION = os.environ['REGION']
TOPIC_INPUT = os.environ['TOPIC_INPUT']
INPUT_TYPE = os.environ['INPUT_TYPE']
WIDTH = int(os.environ['WIDTH'])
HEIGHT = int(os.environ['HEIGHT'])

def create_topic(publisher, project_id, topic_name):
    """Create a new Pub/Sub topic if it doesn't exist"""
    topic_path = publisher.topic_path(project_id, topic_name)
    try:
        publisher.create_topic(topic_path)
        print('This topic doesn\'t exist {}, created it'.format(t.name))
    except: # Means already exist
        pass




# TODO: https://cloud.google.com/functions/docs/bestpractices/networking
def input_pubsub(request):
    """Triggered by a change to a Cloud Storage bucket.
    Args:
         request
    """
    start_time = time.time()
    
    # Configure the batch to publish as soon as X seconds / X bytes has passed.
    """
    # I don't think we need it since we handle timeout already manually
    batch_settings = pubsub_v1.types.BatchSettings(
        max_bytes = 5 * (10 ** 6), # 10**6 = 1 mb 
        max_latency = 3
    )
    publisher = pubsub_v1.PublisherClient(batch_settings)
    """
    publisher = pubsub_v1.PublisherClient()

    # TODO: handle video
    """
    if any(ex in event['name'].lower() for ex in ['.avi', '.mp4']):
        # Checking if the pubsub topic exist, if it doesn't, create it
        create_topic(publisher, PROJECT_ID, TOPIC_EXTRACTOR)

        # Publish the video url to extract
        topic_path = publisher.topic_path(PROJECT_ID, TOPIC_EXTRACTOR)
        publisher.publish(
            topic_path,
            data=os.path.join('gs://{}'.format(BUCKET_NAME),
                              event['name']).encode('utf-8')  # data must be a bytestring.
        )
    """
    
    client = datastore.Client()
    # Then get by key for this entity
    query_frame = client.query(kind='Frame')
    #query_frame.add_filter('imageUrl', '=', frameUrl)
    query_frame.add_filter('predictions', '=', None)
    frames_to_process = list(query_frame.fetch())
    if len(frames_to_process) == 0:
        print("Nothing to process")
        return
    
    print("{} frames to queue".format(len(frames_to_process)))

    # Checking if the pubsub topic exist, if it doesn't, create it
    create_topic(publisher, PROJECT_ID, TOPIC_INPUT)

    published_messages = 0
    for index, frame in enumerate(frames_to_process):
        elapsed_time = time.time() - start_time
        print('Elapsed time {0:.2f}'.format(elapsed_time))

        # Avoid timeout (40s)
        if elapsed_time > 40:

            # Recursive call until everything is in the queue
            get_no_response('https://{}-{}.cloudfunctions.net/input_pubsub'.format(REGION, PROJECT_ID))
            print('Recursive call, {} frames left to queue'.format(len(frames_to_process) - index))
            break

        # Download
        img = download_Image(frame['imageUrl'], resize_width=WIDTH) # TODO: try again with rescale instead

        # Failed to read image
        if img is None:
            return

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

        # Sucessfully published the message to Pub/Sub
        if response.exception() == None:
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
    return 'Success'
