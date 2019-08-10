
import base64
import json
import os
import requests

PROJECT_ID = os.environ['PROJECT_ID']
PUBSUB_VERIFICATION_TOKEN = os.environ['PUBSUB_VERIFICATION_TOKEN']


def tfrecord_caller(data, _):
    """Background Cloud Function to be triggered by Cloud Storage.
       This generic function logs relevant data when a file is changed.

       This function will be called when a file is added to the bucket,
       it will call the tfrecord_builder API with the file added.

       Future work: could try to instead build the tfrecord directly here,
       but not sure a 2gb RAM limited cloud function can handle tensorflow stuff

    Args:
        data (dict): The Cloud Functions event payload.
        _ (google.cloud.functions.Context): Metadata of triggering event.
    Returns:
        None; the output is written to Stackdriver Logging
    """

    if not data['contentType'].startswith('image') or not data['contentType'].startswith('video'):
        print("Unhandled file type")
        return

    # Replace with project id and pub_pub_token (the format args)
    url = 'http://tfrecord-builder-dot-{}.appspot.com/pubsub/push?token={}'.format(PROJECT_ID, PUBSUB_VERIFICATION_TOKEN)

    response = requests.post(
        url,
        data=json.dumps({
            "message": {
                "data": base64.b64encode(
                    data['name'].encode('utf-8')
                ).decode('utf-8')
            }
        })
    )
    print('Response', response.text)
    return
