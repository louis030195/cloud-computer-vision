
import os
import time
import requests

PROJECT_ID = os.environ['PROJECT_ID']
REGION = os.environ['REGION']

def call():
  start = time.time()
  response = requests.get('https://{}-{}.cloudfunctions.net/predictor'.format(REGION, PROJECT_ID))
  return response.text, time.time() - start
  
def call_without_waiting_response():
  start = time.time()
  try:
    requests.get('https://{}-{}.cloudfunctions.net/predictor'.format(REGION, PROJECT_ID), timeout = 1)
  except requests.exceptions.ReadTimeout: 
    pass
  return 'Skipped response', time.time() - start

# response, execution_time = call()
response, execution_time = call_without_waiting_response()
print('Response: {}, execution time {}'.format(response, execution_time))