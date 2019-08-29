
import os
import time
import re
import requests
import googleapiclient.discovery
import random 
import string 
from PIL import Image
from io import BytesIO
import base64
import numpy as np

INPUT_TYPE = os.environ['INPUT_TYPE']
WIDTH = int(os.environ['WIDTH'])
HEIGHT = int(os.environ['HEIGHT'])

def count_duplicates(my_list):  
    unique = set(my_list)  
    count = 0
    for each in unique:  
        occurences = my_list.count(each)
        count += occurences if occurences > 1 else 0
    return count / 2

def get_entity(client_datastore, kind, key):
    # Get the entity in Datastore
    query = client_datastore.query(kind=kind)
    datastore_key = client_datastore.key(kind, key)
    query.key_filter(datastore_key, '=')
    query_result = list(query.fetch())

    # Happens when debugging and removing while predicting ...
    # Just to avoid having irrelevant errors in logs
    if len(query_result) == 0:
        print("It appears that key {} isn't in datastore".format(key))
        return
        
    return query_result[0]

def random_id(length=32):
    """
    Generate a random string of length length
    """
    return ''.join([random.choice(string.ascii_letters + string.digits) for n in range(length)]) 

def chunks(array, length):
  """Yield successive n-sized chunks from l.
  """
  for i in range(0, len(array), length):
    #if i + length <= len(array): # uncomment for strict chunk length specified
    yield array[i:i + length] 

def frame_to_input(frame):
    # Download
    img = download_Image(frame['imageUrl'], resize_width = WIDTH) # TODO: try again with rescale instead

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
    return {"inputs": img, "input_keys": str(frame.id)}

def download_Image(url, rescale_width=None, resize_width=None):
    response = requests.get(url)
    try:
        img = Image.open(BytesIO(response.content))
    except OSError:
        print("Failed to read image")
        return None
    # If png cast to jpeg, i don't even know if that's required
    if '.png' in url:
        img = img.convert('RGB')
    if rescale_width is not None:
        wpercent = (rescale_width / float(img.size[0]))
        hsize = int((float(img.size[1]) * float(wpercent)))
        img = img.resize((rescale_width, hsize), Image.ANTIALIAS)
    if resize_width is not None:
        img = img.resize((resize_width, resize_width), Image.ANTIALIAS)
    return img

def Image_to_b64(img):
    ret = BytesIO()
    img.save(ret, "JPEG")
    ret.seek(0)
    return base64.b64encode(ret.getvalue())


def make_batch_job_body(project_name, bucket_name,
                        model_name, region, data_format='JSON',
                        version_name=None, max_worker_count=None,
                        runtime_version=None, batch_size=32):
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
                'inputPaths': 'gs://{}/{}/batches/*'.format(bucket_name, job_id),
                'outputPath': 'gs://{}/{}/batch_results'.format(bucket_name, job_id),
                'region': region,
                'batchSize': str(batch_size)}}

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

    # The state returned will almost always be QUEUED.
    print('state : {}'.format(response['state']))

    if 'error' in response:
        raise RuntimeError(response['error'])

    return response['state']


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
    service = googleapiclient.discovery.build('ml', 'v1')
    name = 'projects/{}/models/{}'.format(project, model)
    if version is not None:
        name += '/versions/{}'.format(version)
    response = service.projects().predict(
        name=name,
        body={'instances': instances}
    ).execute()
    if 'error' in response:
        raise RuntimeError(response['error']) # https://cloud.google.com/ml-engine/docs/troubleshooting#troubleshooting_prediction
    return response

def get_no_response(url):
    """
    Get request without waiting any response (not really need any and it causes timeout)
    # https://stackoverflow.com/questions/27021440/python-requests-dont-wait-for-request-to-finish
    """
    try:
        requests.get(url, timeout = 1)
    except requests.exceptions.ReadTimeout: 
        pass