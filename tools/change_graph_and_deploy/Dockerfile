

RUN git clone --quiet https://github.com/louis030195/models.git
RUN cd models
RUN git checkout key
RUN apt-get install -qq protobuf-compiler python-pil python-lxml python-tk
RUN pip install -q Cython contextlib2 pillow lxml matplotlib pycocotools
RUN cd models/research
RUN protoc object_detection/protos/*.proto --python_out=.
ENV PYTHONPATH ':/root/models/research/:/root/models/research/slim/'
os.environ['PYTHONPATH'] += ':/root/models/research/:/root/models/research/slim/'
!python object_detection/builders/model_builder_test.py



# MICROSOFT CAMERA TRAP MODEL
"""
os.chdir('/root')
!rm -rf model

!wget -O saved_model.pb https://lilablobssc.blob.core.windows.net/models/camera_traps/megadetector/megadetector_v3.pb
!wget -O pipeline.config https://lilablobssc.blob.core.windows.net/models/camera_traps/megadetector/megadetector_v3.config
!wget https://lilablobssc.blob.core.windows.net/models/camera_traps/megadetector/megadetector_v3_checkpoint.zip
!unzip megadetector_v3_checkpoint.zip
!mkdir model model/saved_model
!mv megadetector_v3_checkpoint/* model
!mv saved_model.pb model/saved_model/saved_model.pb
!mv pipeline.config model/pipeline.config
"""

"""
os.chdir('/root')
# COCO SSD RESNET50 35 mAp
!wget -O model.tar.gz http://download.tensorflow.org/models/object_detection/ssd_resnet50_v1_fpn_shared_box_predictor_640x640_coco14_sync_2018_07_03.tar.gz
# iNaturalist  faster rcnn resnet101 58 mAp
#!wget -O model.tar.gz http://download.tensorflow.org/models/object_detection/faster_rcnn_resnet101_fgvc_2018_07_19.tar.gz
# faster rcnn resenet 54 mAp
#!wget -O model.tar.gz http://download.tensorflow.org/models/object_detection/faster_rcnn_inception_resnet_v2_atrous_oid_v4_2018_12_12.tar.gz
!rm -rf model
!mkdir model
!tar xvf model.tar.gz -C model
!mv model/*/* model
"""


# From tensorflow/models
!rm -rf /root/exported_model
os.chdir("/root")
# Vector shape (-1, -1, -1, 3) = image_tensor
# Base64 string shape (-1) = encoded_image_string_tensor
INPUT_TYPE = 'encoded_image_string_tensor'
!python /root/models/research/object_detection/export_inference_graph.py \
    --input_type $INPUT_TYPE \
    --pipeline_config_path /root/model/pipeline.config \
    --trained_checkpoint_prefix /root/model/model.ckpt \
    --inference_graph_path output_inference_graph.pb \
    --output_directory exported_model
 #   --write_inference_graph