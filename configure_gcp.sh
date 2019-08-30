#!/bin/bash
# Complete env variable with your GCP config
export PROJECT_ID=
export REGION=
export BUCKET_NAME=
export MODEL=
export VERSION=
export OAUTH2_CLIENT_ID=
export OAUTH2_CLIENT_SECRET=
export OAUTH2_CALLBACK=
export GOOGLE_APPLICATION_CREDENTIALS=

echo -e "
service: vision-client
runtime: custom
env: flex
instance_class: F2

# GCP Config
env_variables:
  PROJECT_ID: $PROJECT_ID
  BUCKET_NAME: $BUCKET_NAME
  REGION: $REGION
  OAUTH2_CLIENT_ID: $OAUTH2_CLIENT_ID
  OAUTH2_CLIENT_SECRET: $OAUTH2_CLIENT_SECRET
  OAUTH2_CALLBACK: $OAUTH2_CALLBACK
  GOOGLE_APPLICATION_CREDENTIALS: $GOOGLE_APPLICATION_CREDENTIALS" > app.yaml

echo -e "
PROJECT_ID=$PROJECT_ID
BUCKET_NAME=$BUCKET_NAME
REGION=$REGION
OAUTH2_CLIENT_ID=$OAUTH2_CLIENT_ID
OAUTH2_CLIENT_SECRET=$OAUTH2_CLIENT_SECRET
OAUTH2_CALLBACK=$OAUTH2_CALLBACK
GOOGLE_APPLICATION_CREDENTIALS=$GOOGLE_APPLICATION_CREDENTIALS" > .env

echo -e "
BUCKET_NAME: $BUCKET_NAME
PROJECT_ID: $PROJECT_ID
TOPIC_EXTRACTOR: topic_extractor
REGION: $REGION " > cloud_functions/queue_input/.env.yaml

echo -e "
BUCKET_NAME: $BUCKET_NAME
PROJECT_ID: $PROJECT_ID
MODEL_NAME: $MODEL
VERSION_NAME: $VERSION
REGION: $REGION

# Above which amount of frames we pick batch instead of online predictions
TRESHOLD: '100'

# Vector shape (-1, -1, -1, 3) = image_tensor
# Base64 string shape (-1) = encoded_image_string_tensor
INPUT_TYPE: encoded_image_string_tensor

WIDTH: '400'
HEIGHT: '400' 
BATCH_CHUNK: '100' " > cloud_functions/predictor/.env.yaml

echo -e "
BUCKET_NAME: $BUCKET_NAME " > cloud_functions/batch_result/.env.yaml

echo -e "
PROJECT_ID: $PROJECT_ID
BUCKET_NAME: $BUCKET_NAME 
REGION: $REGION " > cloud_functions/frame_extractor/.env.yaml

echo -e "
PROJECT_ID: $PROJECT_ID " > cloud_functions/dont_take_all_my_money/.env.yaml