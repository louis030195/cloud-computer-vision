# USAGE
Pick a model for example from tensorflow models zoo and set the url model_url=URL

    sudo docker build --tag=cgad . --build-arg model_url=http://download.tensorflow.org/models/object_detection/ssd_mobilenet_v1_coco_2018_01_28.tar.gz

Check that the graph contains input_keys and output_keys