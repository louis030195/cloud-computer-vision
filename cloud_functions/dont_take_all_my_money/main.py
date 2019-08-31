# Follow this https://cloud.google.com/billing/docs/how-to/notify#functions_billing_slack-python

import base64
import json
import os
from googleapiclient import discovery
from oauth2client.client import GoogleCredentials

PROJECT_ID = os.environ['PROJECT_ID']
REGION = os.environ['REGION']
PROJECT_NAME = f'projects/{PROJECT_ID}'

#TODO: test everything

def stop_billing(data, context):
    pubsub_data = base64.b64decode(data['data']).decode('utf-8')
    pubsub_json = json.loads(pubsub_data)
    print(pubsub_json)
    cost_amount = pubsub_json['costAmount']
    budget_amount = pubsub_json['budgetAmount']
    if cost_amount <= budget_amount:
        print(f'No action necessary. (Current cost: {cost_amount})')
        return

    billing = discovery.build(
        'cloudbilling',
        'v1',
        cache_discovery=False,
        credentials=GoogleCredentials.get_application_default()
    )

    projects = billing.projects()

    if __is_billing_enabled(PROJECT_NAME, projects):
        print(__disable_billing_for_project(PROJECT_NAME, projects))
    else:
        print('Billing already disabled')


def __is_billing_enabled(project_name, projects):
    """
    Determine whether billing is enabled for a project
    @param {string} project_name Name of project to check if billing is enabled
    @return {bool} Whether project has billing enabled or not
    """
    res = projects.getBillingInfo(name=project_name).execute()
    return res['billingEnabled']


def __disable_billing_for_project(project_name, projects):
    """
    Disable billing for a project by removing its billing account
    @param {string} project_name Name of project disable billing on
    @return {string} Text containing response from disabling billing
    """
    body = {'billingAccountName': ''}  # Disable billing
    res = projects.updateBillingInfo(name=project_name, body=body).execute()
    print(f'Billing disabled: {json.dumps(res)}')


def limit_use(data, context):
    pubsub_data = base64.b64decode(data['data']).decode('utf-8')
    pubsub_json = json.loads(pubsub_data)
    cost_amount = pubsub_json['costAmount']
    budget_amount = pubsub_json['budgetAmount']
    if cost_amount <= budget_amount:
        print(f'No action necessary. (Current cost: {cost_amount})')
        return

    compute = discovery.build(
        'compute',
        'v1',
        cache_discovery=False,
        credentials=GoogleCredentials.get_application_default()
    )
    instances = compute.instances()

    instance_names = __list_running_instances(PROJECT_ID, REGION, instances)
    __stop_instances(PROJECT_ID, REGION, instance_names, instances)


def __list_running_instances(project_id, zone, instances):
    """
    @param {string} project_id ID of project that contains instances to stop
    @param {string} zone Zone that contains instances to stop
    @return {Promise} Array of names of running instances
    """
    res = instances.list(project=project_id, zone=zone).execute()

    items = res['items']
    running_names = [i['name'] for i in items if i['status'] == 'RUNNING']
    return running_names


def __stop_instances(project_id, zone, instance_names, instances):
    """
    @param {string} project_id ID of project that contains instances to stop
    @param {string} zone Zone that contains instances to stop
    @param {Array} instance_names Names of instance to stop
    @return {Promise} Response from stopping instances
    """
    if not len(instance_names):
        print('No running instances were found.')
        return

    for name in instance_names:
        instances.stop(
          project=project_id,
          zone=zone,
          instance=name).execute()
        print(f'Instance stopped successfully: {name}')