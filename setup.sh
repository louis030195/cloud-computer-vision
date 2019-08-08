# gcloud CLI
echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list \
    && curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key --keyring /usr/share/keyrings/cloud.google.gpg add - \
    && sudo apt-get update \
    && sudo apt-get install -y google-cloud-sdk \
    && sudo rm -rf /var/lib/apt/lists/*

# Storage
gsutil mb gs://[BUCKET_NAME]/ \
    --regions [YOUR_REGION]
gsutil defacl set public-read gs://[YOUR-BUCKET-NAME]

# Config
echo -e '{
    "BUCKET_NAME: "[YOUR_BUCKET]",
    "OAUTH2_CLIENT_ID": "[YOUR_OAUTH2_CLIENT_ID]",
    "OAUTH2_CLIENT_SECRET": "[YOUR_OAUTH2_CLIENT_SECRET]",
    "OAUTH2_CALLBACK": "https://vision-client-dot-[PROJECT_ID].appspot.com/auth/google/callback",
    "GOOGLE_APPLICATION_CREDENTIALS": "./key_account/[JSON__KEY_NAME]",
    "PROJECT_ID": "[YOUR_PROJECT_ID]"
}' > config.json

# AI Platform
gcloud ai-platform models create model_name \
    --regions us-central1 \
    --enable-logging


gcloud ai-platform versions create "[YOUR_VERSION_NAME]" \
    --model "[YOUR_MODEL_NAME]" \
    --origin "[YOUR_GCS_PATH_TO_MODEL_DIRECTORY]" \
    --runtime-version "1.13" \
    --python-version "3.5" \
    --machine-type "mls1-c4-m2"

# Functions

# TFRecord Caller
gcloud functions deploy tfrecord_caller \
    --source cloud_functions/tfrecord_caller \
    --runtime python37 \
    --project [PROJECT_ID] \
    --trigger-resource gs://[BUCKET_NAME] \
    --region [YOUR_REGION] \
    --trigger-event google.storage.object.finalize \
    --env-vars-file cloud_functions/tfrecord_caller/.env.yaml
# Online
gcloud functions deploy online_prediction \
    --source cloud_functions/online \
    --runtime python37 \
    --project [PROJECT_ID] \
    --trigger-resource gs://[BUCKET_NAME] \
    --region [YOUR_REGION] \
    --trigger-event google.storage.object.finalize \
    --env-vars-file cloud_functions/online/.env.yaml
# Batches
gcloud functions deploy batch_prediction \
    --source cloud_functions/batch \
    --runtime python37 \
    --project [PROJECT_ID] \
    --trigger-resource gs://[BUCKET_NAME] \
    --region [YOUR_REGION] \
    --trigger-event google.storage.object.finalize \
    --env-vars-file cloud_functions/batch/.env.yaml

gcloud config set project [PROJECT_ID]
gcloud app deploy