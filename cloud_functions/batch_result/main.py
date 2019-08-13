
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
    print('AAAAAAAAAAAAAAAAAA', event, context)
    if 'batch_results/' not in event['name']:
        return

    if 'error' in event['name']:
        print('Batch predictions failed')
        return

    # TODO: why there is "beam" thing here ?
    if 'beam' in event['name']:
        return

    datastore_client = datastore.Client()
    storage_client = storage.Client()

    file_absolute_path = os.path.join('gs://{}'.format(BUCKET_NAME), event['name'])

    # Open the result file
    bucket = storage_client.get_bucket('bucket03y')
    blob = bucket.get_blob(event['name'])
    result_file = blob.download_as_string().decode('utf-8')

    # Split every prediction (\n) and remove the "" which is at the end
    predictions_raw = filter(lambda x: x != "", result_file.split("\n"))

    # Load everything as json so it can be used
    predictions_json = [json.loads(prediction_raw) for prediction_raw in predictions_raw]

    # For each frame's prediction
    for pred in predictions_json:

        # Create the prediction in Datastore
        key_prediction = datastore_client.key('Prediction')
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
            key_object = datastore_client.key('Object')
            entity_object = datastore.Entity(key=key_object)
            entity_object.update(object_detected)
            datastore_client.put(entity_object)

            # Store the id generated for reference in Prediction table
            keys_object.append(entity_object.id)

        # Put a list of objects detected in prediction row
        entity_prediction.update({'objects': keys_object})

        # Update the prediction in datastore
        datastore_client.put(entity_prediction)

         # TODO: How to link prediction with frame in batch ?
        query = datastore_client.query(kind='Frame')
        first_key = datastore_client.key('Frame', int(pred['output_keys']))
        query.key_filter(first_key, '=')
        frame = list(query.fetch())[0]

        # Create an object to put in datastore
        #obj = dict(frames_processed[index])

        # Update the predictions properties of the Frame row
        frame['predictions'] = entity_prediction.id
        #obj['predictions'] = entity_prediction.id

        # Push into datastore
        #entity_frame.update(obj)
        datastore_client.put(frame)


    # Erase file from bucket
    bucket = storage_client.get_bucket(BUCKET_NAME)
    blob = bucket.blob("/".join(file_absolute_path.split('/')[1:]))

    blob.delete()

    print('Blob {} deleted.'.format("/".join(file_absolute_path.split('/')[1:])))

