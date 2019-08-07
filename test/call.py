import base64
import json
import os
import requests

url = 'localhost:8080/pubsub/push?token=' + os.environ['PUBSUB_VERIFICATION_TOKEN']

r = requests.post(
    url,
    data=json.dumps({
        "message": {
            "data": base64.b64encode(
                u'https://www.sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4'.encode('utf-8')
            ).decode('utf-8')
        }
    })
)

print(r.text)