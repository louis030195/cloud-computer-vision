import base64
import requests
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

def hello_gcs(event, context):
    """Triggered by a change to a Cloud Storage bucket.
    Args:
         event (dict): Event payload.
         context (google.cloud.functions.Context): Metadata for the event.
    """
    #path = 'https://storage.googleapis.com/' + event['id'].split(' ')[0] + '.' + event['id'].split('.')[1]
    #print('path' + path)
    #if not event['contentType'].startswith('video'): # If its not a video

    # Create, populate and persist an entity with keyID=1234
    client = datastore.Client()
    # Then get by key for this entity
    query = client.query(kind='Frame')
    query.add_filter('objects', '=', None)
    #print('Stuff to process: ')
    #print(list(query.fetch()))
    #https://github.com/tensorflow/serving/blob/master/tensorflow_serving/example/resnet_client.py
    files_to_process = list(query.fetch())

    # Iterate through the media to process
    for file in files_to_process: # TODO: will break if trying to process a video
        image_url = file['imageUrl']
        print('Will process', image_url)

        # Download the image
        dl_request = requests.get(image_url, stream=True)
        dl_request.raise_for_status()
        print("Downloaded image:", dl_request)

        # Compose a JSON Predict request (send JPEG image in base64).
        img = base64.b64encode(dl_request.content).decode('utf-8')
        # img = base64.b64encode(open('id_pic.jpg', "rb").read()).decode()

        # Create an object containing the data
        image_byte_dict = {"image_bytes": {"b64": img}}
        instances = [image_byte_dict]

        # Query AI Platform with the media
        result = predict_json('wildlife-247309', 'resnet', instances, 'v1')

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