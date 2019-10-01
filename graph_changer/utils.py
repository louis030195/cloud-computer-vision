import googleapiclient.discovery

def create_version(project, bucket, model, version, regions, logging=False):
    service = googleapiclient.discovery.build('ml', 'v1')
    
    name = 'projects/{}/models/{}'.format(project, model)
    try:
        response = service.projects().models().get(
            name=name
        ).execute()
    except:
        # Model doesn't exist, let's create it
        response = service.projects().models().create(
            parent='projects/{}'.format(project),
            body={
              "name": model,
              "regions": regions,
              "onlinePredictionLogging": logging
            }
        ).execute()
        if 'error' in response:
            raise RuntimeError(response['error'])
    # Create the version
    response = service.projects().models().versions().create(
        parent='projects/{}/models/{}'.format(project, model),
        body={
            "name": version,
            "deploymentUri": 'gs://{}/{}/saved_model'.format(bucket, version),
            "runtimeVersion": '1.14',
            "machineType": 'mls1-c1-m2', # Default
            "framework": 'TENSORFLOW'
        }
    ).execute()
    if 'error' in response:
        raise RuntimeError(response['error'])

    return response