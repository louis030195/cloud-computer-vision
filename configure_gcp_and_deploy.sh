# DONT RUN THIS, NOT READY
export PROJECT_ID=
export REGION=
export BUCKET_NAME=
export MODEL=
export VERSION=

# gcloud CLI
echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list \
    && curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key --keyring /usr/share/keyrings/cloud.google.gpg add - \
    && sudo apt-get update \
    && sudo apt-get install -y google-cloud-sdk \
    && sudo rm -rf /var/lib/apt/lists/*

gcloud config set project $PROJECT_ID

# Storage
gsutil mb gs://$BUCKET_NAME/ \
    --regions $REGION
gsutil defacl set public-read gs://$BUCKET_NAME

# AI Platform
gcloud -q ai-platform versions delete $VERSION --model $MODEL
gcloud -q ai-platform models delete $MODEL
gcloud ai-platform models create $MODEL \
--regions europe-west1 \
--enable-logging

gcloud ai-platform versions create $VERSION \
    --model $MODEL \
    --origin gs://$BUCKET_NAME/saved_model \
    --runtime-version 1.14 \
    --python-version 2.7 \
    --machine-type "mls1-c4-m2"

# Functions
gcloud functions deploy input_pubsub \
    --source cloud_functions/input_pubsub \
    --runtime python37 \
    --project $PROJECT_ID \
    --trigger-resource gs://$BUCKET_NAME \
    --region $REGION \
    --trigger-event google.storage.object.finalize \
    --env-vars-file cloud_functions/input_pubsub/.env.yaml \
    --max-instances 1 \
    --memory 2gb

gcloud functions deploy predictor \
    --source cloud_functions/predictor \
    --runtime python37 \
    --project $PROJECT_ID \
    --trigger-topic topic_input \
    --region $REGION \
    --env-vars-file cloud_functions/predictor/.env.yaml \
    --max-instances 1 \
    --memory 2gb

gcloud functions deploy batch_result \
    --source cloud_functions/batch_result \
    --runtime python37 \
    --project $PROJECT_ID \
    --trigger-resource gs://$BUCKET_NAME \
    --region $REGION \
    --trigger-event google.storage.object.finalize \
    --env-vars-file cloud_functions/batch_result/.env.yaml \
    --max-instances 1 \
    --memory 2gb

gcloud functions deploy extractPubSub \
    --source cloud_functions/frame_extractor \
    --runtime nodejs10 \
    --project $PROJECT_ID \
    --trigger-topic topic_extractor \
    --region $REGION \
    --env-vars-file cloud_functions/frame_extractor/.env.yaml \
    --max-instances 1 \
    --memory 2gb

gcloud app deploy