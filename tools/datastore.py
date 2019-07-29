from google.cloud import datastore
import argparse

parser = argparse.ArgumentParser(description='Push id to class mapping into datastore')
parser.add_argument('--file', required=True, help='file path containing the mapping')

args = parser.parse_args()

# https://googleapis.github.io/google-cloud-python/latest/datastore/client.html
def mapping():
    f = open(args.file, "r")
    content = f.read().split('\n')
    client = datastore.Client()

    for i, v in enumerate(content):
        key = client.key('Class', i + 1)
        entity = datastore.Entity(key=key)
        entity.update({'name': v})
        client.put(entity)

def clear_datastore():
    """
    Delete all data (except Class entity)
    """
    client = datastore.Client()
    entities_to_empty = ['Frame', 'Prediction', 'Object']
    keys = list()

    for entity in entities_to_empty:
        query = client.query(kind=entity)
        keys = keys + list(query.fetch())

    print('Data rows:', len(keys))
    # TODO: AttributeError: 'Entity' object has no attribute 'is_partial'
    # client.delete_multi(keys)
    print('Data rows:', len(keys))

if __name__ == "__main__":
    # execute only if run as a script
    mapping()