
import os
import time
import requests

PROJECT_ID = os.environ['PROJECT_ID']
REGION = os.environ['REGION']

from utils import get_no_response, chunks

def call():
  start = time.time()
  response = requests.get('https://{}-{}.cloudfunctions.net/predictor'.format(REGION, PROJECT_ID))
  return response.text, time.time() - start
  
def call_without_waiting_response():
  start = time.time()
  get_no_response('https://{}-{}.cloudfunctions.net/predictor'.format(REGION, PROJECT_ID))
  return 'Skipped response', time.time() - start

def test_chunks():
  import numpy as np
  initial_array = np.zeros(100)
  total_elements = 0
  for i, chunk in enumerate(chunks(initial_array, 7)):
      print('Chunk n°{} length: {}'.format(i, len(chunk)))
      total_elements +=  len(chunk)
      for _ in chunk:
          pass
  print('Total length {}'.format(total_elements))

# response, execution_time = call()
response, execution_time = call_without_waiting_response()
print('Response: {}, execution time {}'.format(response, execution_time))