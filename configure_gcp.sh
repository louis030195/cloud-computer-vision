#!/bin/bash
export PROJECT_ID=wildlife-247309
export SUBSCRIPTION_INPUT=subscription_input
export BUCKET_NAME=bucket03y
export REGION=europe-west1
export MODEL=m1
export VERSIONS_NAME="iwildcam"
export OAUTH2_CLIENT_ID=607867440081-2v0agkktnu5v02cl912lmg46opibi76q.apps.googleusercontent.com
export OAUTH2_CLIENT_SECRET=mqTfCGJVLjTp4ZJtFd0_4cvL
export OAUTH2_CALLBACK=https://vision-client-dot-wildlife-247309.appspot.com/auth/google/callback
export GOOGLE_APPLICATION_CREDENTIALS=./key_account/wildlife-d61cd2da89d3.json
export PORT=8080
export SECRET=keyboardcat
export FUNCTIONS_KEY=AIzaSyCXoSKxvRSHW4_DXvWE1mh7Z3EgtwbYXxg

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
  GOOGLE_APPLICATION_CREDENTIALS: $GOOGLE_APPLICATION_CREDENTIALS

automatic_scaling:
  min_num_instances: 1
  max_num_instances: 20" > app.yaml

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
REGION: $REGION
VERSIONS_NAME: $VERSIONS_NAME " > cloud_functions/queue_input/.env.yaml

echo -e "
BUCKET_NAME: $BUCKET_NAME
PROJECT_ID: $PROJECT_ID
MODEL_NAME: $MODEL
VERSIONS_NAME: $VERSIONS_NAME
REGION: $REGION

# Above which amount of frames we pick batch instead of online predictions
TRESHOLD: '100'

# Vector shape (-1, -1, -1, 3) = image_tensor
# Base64 string shape (-1) = encoded_image_string_tensor
INPUT_TYPE: encoded_image_string_tensor

WIDTH: '400'
HEIGHT: '400'
BATCH_CHUNK: '100'
ONLINE_TIMEOUT: '200' " > cloud_functions/predictor/.env.yaml

echo -e "
BUCKET_NAME: $BUCKET_NAME " > cloud_functions/batch_result/.env.yaml

echo -e "
PROJECT_ID: $PROJECT_ID
BUCKET_NAME: $BUCKET_NAME
REGION: $REGION " > cloud_functions/frame_extractor/.env.yaml

echo -e "
PROJECT_ID: $PROJECT_ID
REGION: $REGION " > cloud_functions/dont_take_all_my_money/.env.yaml