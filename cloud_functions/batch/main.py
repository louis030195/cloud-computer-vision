import os
import re
import time
import requests
import numpy as np
import cv2
import tensorflow as tf

# Imports the Google Cloud client libraries
from google.cloud import storage
import googleapiclient.discovery
from google.cloud import datastore


def _int64_feature(value):
    return tf.train.Feature(int64_list=tf.train.Int64List(value=[value]))


def _bytes_feature(value):
    return tf.train.Feature(bytes_list=tf.train.BytesList(value=[value]))


def frames_to_tfrecord(images, bucket, name):
    """Convert a batch of images into a tfrecord
    Args:
         images (nparray): Images
         name (string): Name of the file written
    """
    print('frames_to_tfrecord', images.shape)
    rows = images.shape[1]
    cols = images.shape[2]
    depth = images.shape[3]

    filename = os.path.join('gs://' + bucket, 'batches', name + '.tfrecords')
    print('Writing', filename)
    writer = tf.python_io.TFRecordWriter(filename)
    for index, _ in enumerate(images):
        image_raw = images[index].tostring()
        example = tf.train.Example(features=tf.train.Features(feature={
            'height': _int64_feature(rows),
            'width': _int64_feature(cols),
            'depth': _int64_feature(depth),
            'label': '',  # _int64_feature(int(labels[index])),
            'image_raw': _bytes_feature(image_raw)}))
        writer.write(example.SerializeToString())

"""
def make_batch_job_body(project_name, input_paths, output_path,
                        model_name, region, data_format='JSON',
                        version_name=None, max_worker_count=None,
                        runtime_version=None):
    \"""make_batch_job_body
    Args:
         images (nparray): Images
         name (string): Name of the file written
    \"""

    project_id = 'projects/{}'.format(project_name)
    model_id = '{}/models/{}'.format(project_id, model_name)
    if version_name:
        version_id = '{}/versions/{}'.format(model_id, version_name)

    # Make a jobName of the format "model_name_batch_predict_YYYYMMDD_HHMMSS"
    timestamp = time.strftime('%Y%m%d_%H%M%S', time.gmtime())

    # Make sure the project name is formatted correctly to work as the basis
    # of a valid job name.
    clean_project_name = re.sub(r'\W+', '_', project_name)

    job_id = '{}_{}_{}'.format(clean_project_name, model_name,
                               timestamp)

    # Start building the request dictionary with required information.
    body = {'jobId': job_id,
            'predictionInput': {
                'dataFormat': data_format,
                'inputPaths': input_paths,
                'outputPath': output_path,
                'region': region}}

    # Use the version if present, the model (its default version) if not.
    if version_name:
        body['predictionInput']['versionName'] = version_id
    else:
        body['predictionInput']['modelName'] = model_id

    # Only include a maximum number of workers or a runtime version if specified.
    # Otherwise let the service use its defaults.
    if max_worker_count:
        body['predictionInput']['maxWorkerCount'] = max_worker_count

    if runtime_version:
        body['predictionInput']['runtimeVersion'] = runtime_version

    return body
"""
"""
def batch_predict(project_name, body):
    project_id = 'projects/{}'.format(project_name)

    service = googleapiclient.discovery.build('ml', 'v1')
    request = service.projects().jobs().create(parent=project_id,
                                               body=body)

    try:
        response = request.execute()

        print('Job requested.')

        # The state returned will almost always be QUEUED.
        print('state : {}'.format(response['state']))

    except errors.HttpError as err:
        # Something went wrong, print out some information.
        print('There was an error getting the prediction results.' +
              'Check the details:')
        print(err._get_reason())
"""

def batch_processing(event, _):
    """Triggered by a change to a Cloud Storage bucket.
    Args:
         event (dict): Event payload.
         _ (google.cloud.functions.Context): Metadata for the event.
    """

    # A file has been added to the bucket but it's either an image or a video
    if not event['contentType'].startswith('image') and not event['contentType'].startswith('video'):
        return

    treshold = 3
    client = datastore.Client()
    # Then get by key for this entity
    query_frame = client.query(kind='Frame')
    query_frame.add_filter('predictions', '=', None)
    frames_to_process = list(query_frame.fetch())

    query_video = client.query(kind='Video')
    query_video.add_filter('predictions', '=', None)
    videos_to_process = list(query_video.fetch())

    # If there are only few frames to process and no video, don't start a job
    #if not videos_to_process or len(frames_to_process) < treshold:
    #   return

    print("Starting a job", len(videos_to_process), "videos", "and",
          len(frames_to_process), "images to process")

    # Instantiates a storage client
    storage_client = storage.Client()

    # The name for the bucket
    bucket_name = 'bucket03y'

    # Get the bucket
    bucket = storage_client.get_bucket(bucket_name)

    for video in videos_to_process:
        video_url = video['imageUrl']
        frames = []
        entity_frames_ids = []
        # Load the video url
        vidcap = cv2.VideoCapture(video_url)

        if not vidcap.isOpened():
            print("Failed to read the video", video)
            return

        # While the video isn't over
        while vidcap.isOpened():
            # Split into frame
            _, frame = vidcap.read()

            print('frame n°', len(frames), frame.shape)

            # Push into a list
            frames.append(frame)

            # Create new frame in Datastore
            key_frame = client.key('Frame')
            entity_frame = datastore.Entity(key=key_frame)

            # Create an object to put in datastore
            obj = dict(video)

            # The frame has the same url than the video since it belongs to the video
            obj['imageUrl'] = video['imageUrl']

            # Set the predictions properties of the Frame row to processing state
            obj['predictions'] = 'processing'

            # Push into datastore
            entity_frame.update(obj)
            client.put(entity_frame)

            # Save the frame id for use later
            entity_frames_ids.append(entity_frame.id)

        # Release video
        vidcap.release()

        # Get the video in Datastore
        key_video = client.key('Video', video.id)
        entity_video = datastore.Entity(key=key_video)

        # Create an object to put in datastore
        obj = dict()

        # Set it's url
        obj['imageUrl'] = video['imageUrl']

        # Set the predictions properties of the video row to processing state
        obj['predictions'] = 'processing'

        # Set a reference to all the frames belonging to this video
        obj['frames'] = entity_frames_ids

        # Push into datastore
        entity_video.update(obj)
        client.put(entity_video)

        # TODO: here start building tfrecord + batch job
        # Get the list of tfrecords
        blobs = bucket.list_blobs(prefix='/batches')

        # Just extract the file names
        blobs = [int(blob.split('/')[-1].split('.')[0]) for blob in blobs]

        # Write a tfrecord with last id + 1 (autoincrement ...)
        frames_to_tfrecord(np.array(frames), bucket_name,
                           max(blobs if blobs else [0]) + 1)

    # Iterate through the media to process
    for frame in frames_to_process:
        #image_url = frame['imageUrl']

        # Download the image
        #dl_request = requests.get(image_url, stream=True)
        #dl_request.raise_for_status()

        # Get the frame in Datastore
        key_frame = client.key('Frame', frame.id)
        entity_frame = datastore.Entity(key=key_frame)

        # Create an object to put in datastore
        obj = dict(frame)

        # Update the predictions properties of the Frame row
        obj['predictions'] = 'processing'

        # Push into datastore
        entity_frame.update(obj)
        client.put(entity_frame)

    # TODO: here start building tfrecord + batch job
    # Get the list of tfrecords
    blobs = bucket.list_blobs(prefix='/batches')

    # Just extract the file names
    blobs = [int(blob.split('/')[-1].split('.')[0]) for blob in blobs]

    # Write a tfrecord with last id + 1 (autoincrement ...)
    frames_to_tfrecord(np.array(frames_to_process), bucket_name,
                       max(blobs if blobs else [0]) + 1)
