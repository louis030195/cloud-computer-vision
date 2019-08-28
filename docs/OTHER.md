# Upload frames fast from colab
- [Multithread upload colab directly request back](https://colab.research.google.com/drive/1b6i1Vq-CK52cWUyyTgICJOxr_UeXzE70)
# Object detection models
- [github/tensorflow/models](https://github.com/tensorflow/models/blob/master/research/object_detection)
- [tfhub](https://tfhub.dev/s?module-type=image-object-detection)
# Check graph of a SavedModel

    git clone https://github.com/tensorflow/tensorflow
    python tensorflow/tensorflow/python/tools/saved_model_cli.py show --dir ssd_mobilenet_v1_coco_2018_01_28/saved_model --all


# AI Platform is limited to 250 mb models
[Optimizing models](https://medium.com/google-cloud/optimizing-tensorflow-models-for-serving-959080e9ddbf)

# Some tools
- [tools](tools/README.md)