FROM tensorflow/tensorflow:nightly-devel
ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y git && \
    apt-get install -y gcc

# Copy application dependency manifests to the container image.
# Copying this separately prevents re-running pip install on every code change.
COPY requirements.txt ./

# Install production dependencies.
RUN pip install -r requirements.txt

# Copy local code to the container image.
ENV APP_HOME /app
WORKDIR $APP_HOME
COPY . .

RUN git clone --quiet https://github.com/louis030195/models.git
# Set the working directory to /app
WORKDIR $APP_HOME/models

RUN git checkout key
RUN apt-get install -qq protobuf-compiler python-pil python-lxml python-tk
# Had to split the pip in two parts because of https://github.com/CellProfiler/centrosome/issues/78
# pycocotools require cython and numpy stuff
RUN pip install -q --upgrade Cython numpy && pip install -q contextlib2 pillow lxml matplotlib pycocotools

# Set the working directory to /app
WORKDIR $APP_HOME/models/research
RUN protoc object_detection/protos/*.proto --python_out=.
ENV PYTHONPATH ":$APP_HOME/models/research/:$APP_HOME/models/research/slim/"

WORKDIR $APP_HOME

# Run the web service on container startup. Here we use the gunicorn
# webserver, with one worker process and 8 threads.
# For environments with multiple CPU cores, increase the number of workers
# to be equal to the cores available.
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 main:app