
import time
import re
import googleapiclient.discovery
from google.cloud import pubsub_v1


def create_subscription(project_id, topic_name, subscription_name):
    """Create a new pull subscription on the given topic."""
    subscriber = pubsub_v1.SubscriberClient()
    topic_path = subscriber.topic_path(project_id, topic_name)
    subscription_path = subscriber.subscription_path(
        project_id, subscription_name)

    subscription = subscriber.create_subscription(
        subscription_path, topic_path)

    print('Subscription created: {}'.format(subscription))

def synchronous_pull(project_id, topic_name, subscription_name, max_messages):
    """Pulling messages synchronously."""
    subscriber = pubsub_v1.SubscriberClient()
    subscription_path = subscriber.subscription_path(
        project_id, subscription_name)
    
    try:
        create_subscription(project_id, topic_name, subscription_name)
    except Exception as ex:
        print(ex)

    # The subscriber pulls a specific number of messages.
    response = subscriber.pull(subscription_path, max_messages=max_messages)

    ack_ids = []
    messages = []
    for received_message in response.received_messages:
        ack_ids.append(received_message.ack_id)
        messages.append(received_message.message.data.decode('utf-8'))

    print("Pulled: {} message(s)".format(len(messages)))


    return messages, ack_ids

def acknowledge_messages(project_id, subscription_name, ack_ids):
    """Acknowledge messages."""
    subscriber = pubsub_v1.SubscriberClient()
    subscription_path = subscriber.subscription_path(
        project_id, subscription_name)
    
    # Acknowledges the received messages so they will not be sent again.
    if ack_ids: # If it's not empty
        subscriber.acknowledge(subscription_path, ack_ids)
        print('Acknowledged {} message(s). Done.'.format(len(ack_ids)))
        return True
    else:
        return False


def make_batch_job_body(project_name, input_paths, output_path,
                        model_name, region, data_format='TEXT',
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
                'outputPath': '{}/{}'.format(output_path, job_id),
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
    """ask for a batch job
    Args:
         project_name (string): project id
         body (dict): args of the batch job
    """
    project_id = 'projects/{}'.format(project_name)

    service = googleapiclient.discovery.build('ml', 'v1') # its not ai platform model / version btw
    request = service.projects().jobs().create(parent=project_id,
                                               body=body)

    response = request.execute()

    print('Job requested.')

    # The state returned will almost always be QUEUED.
    print('state : {}'.format(response['state']))

    if 'error' in response:
        raise RuntimeError(response['error'])
    return response


def online_predict(project, model, instances, version=None):
    """Send json data to a deployed model for prediction.
    Args:
        project (str): project where the Cloud ML Engine Model is deployed.
        model (str): model name.
        instances ([Mapping[str: Any]]): Keys should be the names of Tensors
            your deployed model expects as inputs. Values should be datatypes
            convertible to Tensors, or (potentially nested) lists of datatypes
            convertible to tensors.
        version: str, version of the model to target.
    Returns:
        Mapping[str: any]: dictionary of prediction results defined by the
            model.
    """
    # Create the ML Engine service object.
    # To authenticate set the environment variable
    # GOOGLE_APPLICATION_CREDENTIALS=<path_to_service_account_file>
    service = googleapiclient.discovery.build('ml', 'v1')
    name = 'projects/{}/models/{}'.format(project, model)
    if version is not None:
        name += '/versions/{}'.format(version)
    response = service.projects().predict(
        name=name,
        body={'instances': instances}
    ).execute()
    if 'error' in response:
        raise RuntimeError(response['error']) # https://cloud.google.com/ml-engine/docs/troubleshooting#troubleshooting_prediction
    return response