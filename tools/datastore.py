from google.cloud import datastore
import argparse
import sys

def process_args(args):
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers()

    # Global arguments
    parser_base = argparse.ArgumentParser(add_help=False)

    # Map
    parser_train = subparsers.add_parser('map', parents=[parser_base],
                                         help='Map id to class')
    parser_train.set_defaults(phase='map')
    parser.add_argument('--file', required=True, help='file path containing the mapping')

    # Clear
    parser_export = subparsers.add_parser('clear', parents=[parser_base],
                                          help='Clear datastore')
    parser_export.set_defaults(phase='clear')

    parameters = parser.parse_args(args)
    return parameters

# https://googleapis.github.io/google-cloud-python/latest/datastore/client.html
def map(file_path):
    f = open(file_path, "r")
    content = f.read().split('\n')
    client = datastore.Client()

    for i, v in enumerate(content):
        key = client.key('Class', i + 1)
        entity = datastore.Entity(key=key)
        entity.update({'name': v})
        client.put(entity)

def clear():
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

def main(args=None):
    if args is None:
        args = sys.argv[1:]

    parameters = process_args(args)

    if parameters.phase == 'map':
        map(parameters.file)
    elif parameters.phase == 'clear':
        clear()
    else:
        raise NotImplementedError


if __name__ == "__main__":
    # execute only if run as a script
    main()
