FROM tensorflow/tensorflow:nightly-devel
ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y git && \
    apt-get install -y gcc

# Set the working directory to /app
WORKDIR /app

RUN git clone --quiet https://github.com/louis030195/models.git
# Set the working directory to /app
WORKDIR /app/models

RUN git checkout key
RUN apt-get install -qq protobuf-compiler python-pil python-lxml python-tk
# Had to split the pip in two parts because of https://github.com/CellProfiler/centrosome/issues/78
# pycocotools require cython and numpy stuff
RUN pip install -q --upgrade Cython numpy && pip install -q contextlib2 pillow lxml matplotlib pycocotools

# Set the working directory to /app
WORKDIR /app/models/research
RUN protoc object_detection/protos/*.proto --python_out=.
ENV PYTHONPATH ':/app/models/research/:/app/models/research/slim/'

# Install wget (to make life easier below) and editors (to allow people to edit
# the files inside the container)
RUN apt-get install -y wget vim emacs nano


WORKDIR /app

# # COCO SSD RESNET50 35 mAp
#RUN wget -O model.tar.gz http://download.tensorflow.org/models/object_detection/ssd_resnet50_v1_fpn_shared_box_predictor_640x640_coco14_sync_2018_07_03.tar.gz && \
# expect a build-time variable
ARG model_url
# use the value to set the ENV var default
ENV model_env_var=$model_url
# RUN wget -O model.tar.gz http://download.tensorflow.org/models/object_detection/ssd_mobilenet_v1_coco_2018_01_28.tar.gz && \

RUN wget -O model.tar.gz $model_env_var && \
    mkdir model && \
    tar xvf model.tar.gz -C model && \
    mv model/*/* model


# From tensorflow/models
# Vector shape (-1, -1, -1, 3) = image_tensor
# Base64 string shape (-1) = encoded_image_string_tensor
ENV INPUT_TYPE 'encoded_image_string_tensor'
RUN python /app/models/research/object_detection/export_inference_graph.py \
    --input_type $INPUT_TYPE \
    --pipeline_config_path /app/model/pipeline.config \
    --trained_checkpoint_prefix /app/model/model.ckpt \
    --inference_graph_path output_inference_graph.pb \
    --output_directory exported_model
 
RUN saved_model_cli show --dir exported_model/saved_model --all
