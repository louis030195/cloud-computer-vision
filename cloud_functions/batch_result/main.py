
# Standard libs
import os
import time
import json

# Google Cloud client libraries
from google.cloud import datastore
from google.cloud import storage

BUCKET_NAME = os.environ['BUCKET_NAME']


def batch_result(event, context):
    """Triggered by a change to a Cloud Storage bucket.
    Args:
         event (dict): Event payload.
         context (google.cloud.functions.Context): Metadata for the event.
    """
    # GCP doesn't handle trigger on folder level, so either change architecture
    # either multiple bucket (is that more expensive or ? ...)
    # https://googlecloud.tips/tips/018-trigger-cloud-functions-on-gcs-folders/
    if not event['name'].startswith('batch_results/'):
        return

    client = datastore.Client()

    file_absolute_path = os.path.join('gs://{}'.format(BUCKET_NAME), event['name'])
    print('path:', file_absolute_path)
    # Open the batch result file
    with open(file_absolute_path, 'r') as f:
        # Split every prediction (\n) and remove the "" which is at the end
        predictions_raw = filter(lambda x: x != "", f.read().split("\n"))

        # Load everything as json so it can be used
        predictions_json = [json.loads(prediction_raw) for prediction_raw in predictions_raw]

        # For each frame's prediction
        for pred in predictions_json:

            # Create the prediction in Datastore
            key_prediction = client.key('Prediction')
            entity_prediction = datastore.Entity(key=key_prediction)

            # Create a keys list that will be used to reference each object detected
            keys_object = list()

            # For every object detected
            for i in range(int(pred['num_detections'])):

                # Create a new dict that will be put in datastore in a clean format
                object_detected = dict()
                object_detected['detection_classes'] = int(pred['detection_classes'][i])
                object_detected['detection_boxes'] = pred['detection_boxes'][i]
                object_detected['detection_scores'] = pred['detection_scores'][i]

                # Put the object into a new table row ...
                key_object = client.key('Object')
                entity_object = datastore.Entity(key=key_object)
                entity_object.update(object_detected)
                client.put(entity_object)

                # Store the id generated for reference in Prediction table
                keys_object.append(entity_object.id)

            # Put a list of objects detected in prediction row
            entity_prediction.update({'objects': keys_object})

            # Update the prediction in datastore
            client.put(entity_prediction)

    # Initliaze storage client
    storage_client = storage.Client()
    bucket = storage_client.get_bucket(BUCKET_NAME)
    blob = bucket.blob(file_absolute_path)

    blob.delete()

    print('Blob {} deleted.'.format(file_absolute_path))

    # TODO: How to link prediction with frame in batch ?
    """
    # Get the frame key in Datastore
    key_frame = client.key('Frame', frame.id)
    entity_frame = datastore.Entity(key=key_frame)

    # Create an object to put in datastore
    obj = dict(frame)

    # Update the predictions properties of the Frame row
    obj['predictions'] = entity_prediction.id

    # Push into datastore
    entity_frame.update(obj)
    client.put(entity_frame)
    """