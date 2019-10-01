import base64
import requests
import numpy as np
import cv2
import googleapiclient.discovery
import copy
import os
import time

import matplotlib.pyplot as plt
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


INPUT_TYPE = 'encoded_image_string_tensor'
PROJECT_ID = os.getenv('PROJECT_ID')
MODEL = 'm1'
VERSION = 'yay'

dl_request = requests.get('http://www.dumpaday.com/wp-content/uploads/2018/09/photos-21-3.jpg', stream=True)
dl_request.raise_for_status()
if 'encoded_image_string_tensor' in INPUT_TYPE:
  img = {"b64": base64.b64encode(dl_request.content).decode('utf-8')}
else:
  arr = np.asarray(bytearray(dl_request.content), dtype=np.uint8)
  img = cv2.resize(cv2.cvtColor(cv2.imdecode(arr, -1), cv2.COLOR_BGR2RGB), (100, 100)).tolist()

image_byte_dict = {"inputs": img, "input_keys": 'aa'}

instances = [image_byte_dict]
start = time.time()
print(predict_json(PROJECT_ID, MODEL, instances, VERSION))
end = time.time()
print('Execution time', end - start)