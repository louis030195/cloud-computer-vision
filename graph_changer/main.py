# [START run_pubsub_server_setup]
import base64
from flask import Flask, request
import os
import sys
import json

import tarfile
#import urllib.request
import tensorflow as tf
from google.protobuf import text_format
from object_detection import exporter
from object_detection.protos import pipeline_pb2

"""
import json
from google.auth import jwt

service_account_info = json.load(open(os.environ['GOOGLE_APPLICATION_CREDENTIALS']))
audience = "https://pubsub.googleapis.com/google.pubsub.v1.Publisher"

credentials = jwt.Credentials.from_service_account_info(
    service_account_info, audience=audience
)
"""
# Imports the Google Cloud client library
from google.cloud import storage
# Instantiates a client
storage_client = storage.Client()

from utils import create_version

PROJECT_ID = os.getenv('PROJECT_ID')
BUCKET_NAME = os.getenv('BUCKET_NAME')
REGION = os.getenv('REGION')

app = Flask(__name__)
# [END run_pubsub_server_setup]


# [START run_pubsub_handler]
@app.route('/', methods=['POST'])
def index():
  envelope = request.get_json()
  if not envelope:
    msg = 'no Pub/Sub message received'
    print('error: {}'.format(msg))
    return 'Bad Request: {}'.format(msg), 400

  if not isinstance(envelope, dict) or 'message' not in envelope:
    msg = 'invalid Pub/Sub message format'
    print('error: {}'.format(msg))
    return 'Bad Request: {}'.format(msg), 400

  pubsub_message = envelope['message']

  if isinstance(pubsub_message, dict) and 'data' in pubsub_message:
    data = json.loads(base64.b64decode(pubsub_message['data']).decode('utf-8').strip())

  tf.keras.utils.get_file('/model', data['url'], untar=True)
  tar = tarfile.open('/model.tar.gz')
  tar.extractall('/model')

  print('ok', os.listdir('/model'))

  model_dir = os.path.join('/model', os.listdir('/model')[0])
  print(model_dir)
  pipeline_config = pipeline_pb2.TrainEvalPipelineConfig()
  with tf.gfile.GFile(os.path.join(model_dir, 'pipeline.config'), 'r') as f:
    text_format.Merge(f.read(), pipeline_config)
  exporter.export_inference_graph(
        data['input_type'], pipeline_config, os.path.join(model_dir, 'model.ckpt'),
        '/exported_model', input_shape=None,
        write_inference_graph=False)
  
  print('Exported !')
  print(os.listdir('/exported_model'))
  
  bucket = storage_client.get_bucket(BUCKET_NAME)
  blob = bucket.blob(data['name'])

  blob.upload_from_filename('/exported_model')

  # TODO: create AI platform model
  result = create_version(PROJECT_ID, BUCKET_NAME, 'm1', data['name'], [REGION], logging=True)
  print('result', result)

  # Flush the stdout to avoid log buffering.
  sys.stdout.flush()

  return ('', 204)
# [END run_pubsub_handler]

if __name__ == '__main__':
  PORT = int(os.getenv('PORT')) if os.getenv('PORT') else 8080

  # This is used when running locally. Gunicorn is used to run the
  # application on Cloud Run. See entrypoint in Dockerfile.
  app.run(host='127.0.0.1', port=PORT, debug=True)