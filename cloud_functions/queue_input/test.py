
import os
import time
import requests
from utils import get_no_response

PROJECT_ID = os.environ['PROJECT_ID']
REGION = os.environ['REGION']

def call():
  start = time.time()
  response = requests.get('https://{}-{}.cloudfunctions.net/queue_input'.format(REGION, PROJECT_ID))
  return response.text, time.time() - start
  
def call_without_waiting_response():
  start = time.time()
  get_no_response('https://{}-{}.cloudfunctions.net/queue_input'.format(REGION, PROJECT_ID))
  return 'Skipped response', time.time() - start

# response, execution_time = call()
response, execution_time = call_without_waiting_response()
print('Response: {}, execution time {}'.format(response, execution_time))