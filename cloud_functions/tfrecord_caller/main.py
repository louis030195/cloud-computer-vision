import base64
import json
import os
import requests


def tfrecord_caller(data, context):
    """Background Cloud Function to be triggered by Cloud Storage.
       This generic function logs relevant data when a file is changed.

       This function will be called when a file is added to the bucket,
       it will call the tfrecord_builder API with the file added.

       Future work: could try to instead build the tfrecord directly here,
       but not sure a 2gb RAM limited cloud function can handle tensorflow stuff

    Args:
        data (dict): The Cloud Functions event payload.
        context (google.cloud.functions.Context): Metadata of triggering event.
    Returns:
        None; the output is written to Stackdriver Logging
    """

    # Replace with project id and pub_pub_token (the format args)
    url = 'http://tfrecord-builder-dot-{}/pubsub/push?token={}'.format('wildlife-247309', 'ok123456')

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

    return response.text
