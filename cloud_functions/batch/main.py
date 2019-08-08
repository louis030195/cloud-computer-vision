import time
import re

# Imports the Google Cloud client libraries
import googleapiclient.discovery


def make_batch_job_body(project_name, input_paths, output_path,
                        model_name, region, data_format='TF_RECORD',
                        version_name=None, max_worker_count=None,
                        runtime_version=None):
    """make_batch_job_body
    Args:
         images (nparray): Images
         name (string): Name of the file written
    """

    project_id = 'projects/{}'.format(project_name)
    model_id = '{}/models/{}'.format(project_id, model_name)
    if version_name:
        version_id = '{}/versions/{}'.format(model_id, version_name)

    # Make a jobName of the format "model_name_batch_predict_YYYYMMDD_HHMMSS"
    timestamp = time.strftime('%Y%m%d_%H%M%S', time.gmtime())

    # Make sure the project name is formatted correctly to work as the basis
    # of a valid job name.
    clean_project_name = re.sub(r'\W+', '_', project_name)

    job_id = '{}_{}_{}'.format(clean_project_name, model_name,
                               timestamp)

    # Start building the request dictionary with required information.
    body = {'jobId': job_id,
            'predictionInput': {
                'dataFormat': data_format,
                'inputPaths': input_paths,
                'outputPath': output_path,
                'region': region}}

    # Use the version if present, the model (its default version) if not.
    if version_name:
        body['predictionInput']['versionName'] = version_id
    else:
        body['predictionInput']['modelName'] = model_id

    # Only include a maximum number of workers or a runtime version if specified.
    # Otherwise let the service use its defaults.
    if max_worker_count:
        body['predictionInput']['maxWorkerCount'] = max_worker_count

    if runtime_version:
        body['predictionInput']['runtimeVersion'] = runtime_version

    return body


def batch_predict(project_name, body):
    project_id = 'projects/{}'.format(project_name)

    service = googleapiclient.discovery.build('ml', 'v1')
    request = service.projects().jobs().create(parent=project_id,
                                               body=body)

    response = request.execute()

    print('Job requested.')

    # The state returned will almost always be QUEUED.
    print('state : {}'.format(response['state']))

    if 'error' in response:
        raise RuntimeError(response['error'])
    return response


def batch_processing(event, _2):
    """Triggered by a change to a Cloud Storage bucket.
    Args:
         event (dict): Event payload.
         _2 (google.cloud.functions.Context): Metadata for the event.
    """

    # GCP doesn't handle trigger on folder level, so either change architecture
    # either multiple bucket (is that more expensive or ? ...)
    # https://googlecloud.tips/tips/018-trigger-cloud-functions-on-gcs-folders/
    if '/batches' not in event['name']:
        return

    print('Starting a batch job')

    # The name for the bucket
    bucket_name = 'bucket03y'

    project_name = 'wildlife-247309'

    body = make_batch_job_body(project_name,
                               'gs://{}/batches/*'.format(bucket_name),
                               'gs://{}/batch_results'.format(bucket_name),
                               'm1', 'europe-west1',
                               version_name='v1')
    batch_predict(project_name, body)
