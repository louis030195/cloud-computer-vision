#import base64
import requests
import numpy as np
import cv2
import googleapiclient.discovery
from google.cloud import datastore

def predict_json(project, model, instances, version=None):
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

def process_data(event, context):
    """Triggered by a change to a Cloud Storage bucket.
    Args:
         event (dict): Event payload.
         context (google.cloud.functions.Context): Metadata for the event.
    """
    #if not event['contentType'].startswith('video'): # If its not a video

    # Create, populate and persist an entity with keyID=1234
    client = datastore.Client()
    # Then get by key for this entity
    query = client.query(kind='Frame')
    query.add_filter('objects', '=', None)
    files_to_process = list(query.fetch())

    # Iterate through the media to process
    # TODO: will break if trying to process a video
    for file in files_to_process:
        image_url = file['imageUrl']

        # Download the image
        dl_request = requests.get(image_url, stream=True)
        dl_request.raise_for_status()

        # Model input is b64
        # Compose a JSON Predict request (send JPEG image in base64).
        # img = base64.b64encode(dl_request.content).decode('utf-8')
        # img = base64.b64encode(open('id_pic.jpg', "rb").read()).decode()

        # Model input is array
        # Compose a JSON Predict request (send JPEG image as array).
        arr = np.asarray(bytearray(dl_request.content), dtype=np.uint8)
        img = cv2.resize(cv2.cvtColor(cv2.imdecode(arr, -1), cv2.COLOR_BGR2RGB), (300, 300))

        # Create an object containing the data
        # b64
        # image_byte_dict = {"image_bytes": {"b64": img}}
        # array
        image_byte_dict = {"inputs": img.tolist()}
        instances = [image_byte_dict]

        # Query AI Platform with the media
        result = predict_json('wildlife-247309', 'm1', instances, 'v1')

        # Put the detected object in Datastore
        key_object = client.key('Object')
        entity_object = datastore.Entity(key=key_object)
        entity_object.update(result)
        client.put(entity_object)

        # Get the frame key in Datastore
        key_frame = client.key('Frame', file.id)
        entity_frame = datastore.Entity(key=key_frame)

        # Update the objects properties of the Frame row
        obj = dict(file)
        obj['objects'] = entity_object.id
        entity_frame.update(obj)
        client.put(entity_frame)
