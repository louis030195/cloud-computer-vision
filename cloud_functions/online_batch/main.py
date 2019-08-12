
# Standard libs
import os
import time
import json
import re

# Requests
import requests

# Vectors
import numpy as np

# Images
import cv2

# Google Cloud client libraries
import googleapiclient.discovery
from google.cloud import datastore
from google.cloud import storage

BUCKET_NAME = os.environ['BUCKET_NAME']
PROJECT_ID = os.environ['PROJECT_ID']
MODEL_NAME = os.environ['MODEL_NAME']
VERSION_NAME = os.environ['VERSION_NAME']
REGION = os.environ['REGION']
TRESHOLD = int(os.environ['TRESHOLD'])



def make_batch_job_body(project_name, input_paths, output_path,
                        model_name, region, data_format='TEXT',
                        version_name=None, max_worker_count=None,
                        runtime_version=None):
    """make_batch_job_body
    Args:
         images (nparray): Images
         name (string): Name of the file written
    """

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


def batch_predict(project_name, body):
    """ask for a batch job
    Args:
         project_name (string): project id
         body (dict): args of the batch job
    """
    project_id = 'projects/{}'.format(project_name)

    service = googleapiclient.discovery.build('ml', 'v1') # its not ai platform model / version btw
    request = service.projects().jobs().create(parent=project_id,
                                               body=body)

    response = request.execute()

    print('Job requested.')

    # The state returned will almost always be QUEUED.
    print('state : {}'.format(response['state']))

    if 'error' in response:
        raise RuntimeError(response['error'])
    return response


def online_predict(project, model, instances, version=None):
    """Send json data to a deployed model for prediction.
    Args:
        project (str): project where the Cloud ML Engine Model is deployed.
        model (str): model name.
        instances ([Mapping[str: Any]]): Keys should be the names of Tensors
            your deployed model expects as inputs. Values should be datatypes
            convertible to Tensors, or (potentially nested) lists of datatypes
            convertible to tensors.
        version: str, version of the model to target.
    Returns:
        Mapping[str: any]: dictionary of prediction results defined by the
            model.
    """
    # Create the ML Engine service object.
    # To authenticate set the environment variable
    # GOOGLE_APPLICATION_CREDENTIALS=<path_to_service_account_file>
    # TODO: what is 'ml' arg
    service = googleapiclient.discovery.build('ml', 'v1')
    name = 'projects/{}/models/{}'.format(project, model)
    if version is not None:
        name += '/versions/{}'.format(version)
    response = service.projects().predict(
        name=name,
        body={'instances': instances}
    ).execute()
    if 'error' in response:
        raise RuntimeError(response['error'])
    return response


def predict_update_datastore(client, frame):
    """
    """
    # Model input is b64
    # Compose a JSON Predict request (send JPEG image in base64).
    # img = base64.b64encode(dl_request.content).decode('utf-8')
    # img = base64.b64encode(open('id_pic.jpg', "rb").read()).decode()

    # Model input is array
    # Compose a JSON Predict request (send JPEG image as array).
    arr = np.asarray(bytearray(frame), dtype=np.uint8)
    img = cv2.resize(cv2.cvtColor(cv2.imdecode(
        arr, -1), cv2.COLOR_BGR2RGB), (300, 300))

    # Create an object containing the data
    # b64
    # image_byte_dict = {"image_bytes": {"b64": img}}
    # array
    image_byte_dict = {"inputs": img.tolist()}
    instances = [image_byte_dict]

    # Query AI Platform with the media
    result = online_predict(PROJECT_ID, MODEL_NAME, instances, VERSION_NAME)

    # Put the prediction in Datastore
    key_prediction = client.key('Prediction')
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
        key_object = client.key('Object')
        entity_object = datastore.Entity(key=key_object)
        entity_object.update(object_detected)
        client.put(entity_object)

        # Store the id generated for reference in Prediction table
        keys_object.append(entity_object.id)

    # Put a list of objects detected in prediction row
    entity_prediction.update({'objects': keys_object})
    client.put(entity_prediction)

    return entity_prediction

# TODO: optimize code ...


def online_batch_prediction(event, context):
    """Triggered by a change to a Cloud Storage bucket.
    Args:
         event (dict): Event payload.
         context (google.cloud.functions.Context): Metadata for the event.
    """
    print('online_batch_prediction', event, context)
    # GCP doesn't handle trigger on folder level, so either change architecture
    # either multiple bucket (is that more expensive or ? ...)
    # https://googlecloud.tips/tips/018-trigger-cloud-functions-on-gcs-folders/
    if event['name'].startswith('batch_results/') or event['name'].startswith('batches/'): # (e.g. batch results put here, we skip)
        return

    # A file has been added to the bucket but it's either an image or a video (split into frames)
    if not event['contentType'].startswith('image'):
        print("Unhandled file type")
        return

    client = datastore.Client()
    # Then get by key for this entity
    query_frame = client.query(kind='Frame')
    query_frame.add_filter('predictions', '=', None)
    frames_to_process = list(query_frame.fetch())

    # Above which amount of frames we pick batch instead of online predictions
    # timestamp: 2019-08-12T07:46:33.401Z
    # 'updated': '2019-08-12T07:46:33.063Z'
    # TODO: only start online if under treshold and a specific length of time
    # has passed (from the image timestamp)
    if True:  #len(frames_to_process) > TRESHOLD:
        # Instantiates a GCS client
        storage_client = storage.Client()
        for frame in frames_to_process:
            # Download
            dl_request = requests.get(frame['imageUrl'], stream=True)
            dl_request.raise_for_status()

            # Load into array
            arr = np.asarray(bytearray(dl_request.content), dtype=np.uint8)

            # Preprocessing
            # TODO:calculate the scaling that has been done and put into the image datastore in order to rescale boxes etc
            img = cv2.resize(cv2.cvtColor(cv2.imdecode(arr, -1), cv2.COLOR_BGR2RGB), (100, 100))

            # Create an object containing the data
            image_byte_dict = {"inputs": img.tolist()}
            json_object = json.dumps(image_byte_dict)
            file_path = "/tmp/inputs.json"

            # Open file with "a" = append the file
            with open(file_path, "a+") as json_file:
                json_file.write(json_object + "\n")

            # Get the frame key in Datastore
            key_frame = client.key('Frame', frame.id)
            entity_frame = datastore.Entity(key=key_frame)

            # Create an object to put in datastore
            obj = dict(frame)

            # Update the predictions properties of the Frame row to stop launching jobs
            obj['predictions'] = 'processing'

            # Push into datastore
            entity_frame.update(obj)
            client.put(entity_frame)

        bucket = storage_client.get_bucket(BUCKET_NAME)
        blob = bucket.blob('batches/inputs.json')

        blob.upload_from_filename(file_path)

        print('File uploaded')

        body = make_batch_job_body(PROJECT_ID,
                                   'gs://{}/batches/*'.format(BUCKET_NAME),
                                   'gs://{}/batch_results'.format(BUCKET_NAME),
                                   MODEL_NAME,
                                   REGION,
                                   version_name=VERSION_NAME,
                                   max_worker_count=72)
        print('Response', batch_predict(PROJECT_ID, body))
        return

    # Iterate through the media to process
    for frame in frames_to_process:
        image_url = frame['imageUrl']

        # Download the image
        dl_request = requests.get(image_url, stream=True)
        dl_request.raise_for_status()

        entity_prediction = predict_update_datastore(
            client, dl_request.content)

        # Get the frame key in Datastore
        key_frame = client.key('Frame', frame.id)
        entity_frame = datastore.Entity(key=key_frame)

        # Create an object to put in datastore
        obj = dict(frame)

        # Update the predictions properties of the Frame row
        obj['predictions'] = entity_prediction.id

        # Push into datastore
        entity_frame.update(obj)
        client.put(entity_frame)
