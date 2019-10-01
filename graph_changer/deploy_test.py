import os
from google.cloud import pubsub_v1
import json
from google.auth import jwt

service_account_info = json.load(open(os.environ['GOOGLE_APPLICATION_CREDENTIALS']))
audience = "https://pubsub.googleapis.com/google.pubsub.v1.Publisher"

credentials = jwt.Credentials.from_service_account_info(
    service_account_info, audience=audience
)

publisher = pubsub_v1.PublisherClient(credentials=credentials)
topic_name = 'projects/{}/topics/graph_changer'.format(os.getenv('PROJECT_ID'))
future = publisher.publish(topic_name, json.dumps({'url': 'http://download.tensorflow.org/models/object_detection/ssd_mobilenet_v1_coco_2018_01_28.tar.gz',
                                                   'input_type': 'encoded_image_string_tensor',
                                                   'name': 'yay'}).encode('utf-8')) # or image_tensor

try:
    print(future.result())
except KeyboardInterrupt:
    future.cancel()