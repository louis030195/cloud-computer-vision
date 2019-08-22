# DONT RUN THIS, NOT READY
export PROJECT_ID=
export REGION
export BUCKET_NAME
export MODEL
export VERSION

gcloud config set project $PROJECT_ID

# gcloud CLI
echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list \
    && curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key --keyring /usr/share/keyrings/cloud.google.gpg add - \
    && sudo apt-get update \
    && sudo apt-get install -y google-cloud-sdk \
    && sudo rm -rf /var/lib/apt/lists/*

# Storage
gsutil mb gs://$BUCKET_NAME/ \
    --regions $REGION
gsutil defacl set public-read gs://$BUCKET_NAME

# Config
echo -e '{
    "BUCKET_NAME: "$BUCKET_NAME",
    "OAUTH2_CLIENT_ID": "[YOUR_OAUTH2_CLIENT_ID]",
    "OAUTH2_CLIENT_SECRET": "[YOUR_OAUTH2_CLIENT_SECRET]",
    "OAUTH2_CALLBACK": "https://vision-client-dot-$PROJECT_ID.appspot.com/auth/google/callback",
    "GOOGLE_APPLICATION_CREDENTIALS": "./key_account/[JSON__KEY_NAME]",
    "PROJECT_ID": "$PROJECT_ID"
}' > config.json

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


gcloud app deploy