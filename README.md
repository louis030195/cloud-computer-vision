# vision-client
[![Try it on gitpod](https://img.shields.io/badge/try-on%20gitpod-brightgreen.svg)](https://gitpod.io/#https://github.com/louis030195/vision-client)

# Installation
It is recommended to just use GitPod, there is less setup to do but you can also do local dev
## Local development
### [Install NodeJS](https://www.google.com/search?ei=D3Q4XZGcM8OHjLsPs--n8AM&q=install+nodejs)
```
git clone https://github.com/louis030195/vision-client.git
cd vision-client
npm install
```

### gcloud CLI
```
echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list \
 && curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key --keyring /usr/share/keyrings/cloud.google.gpg add - \
 && sudo apt-get update \
 && sudo apt-get install -y google-cloud-sdk \
 && sudo rm -rf /var/lib/apt/lists/*
```

- [Get my OAuth2 IDs](https://developers.google.com/identity/protocols/OAuth2)
- [Get a json key file and put it in key_account directory](https://cloud.google.com/docs/authentication/getting-started)

### Create GCP storage bucket
```
gsutil mb gs://[BUCKET_NAME]/
gsutil defacl set public-read gs://[YOUR-BUCKET-NAME]
```

### Config file
```
echo -e '{
    "CLOUD_BUCKET": "[YOUR_BUCKET]",
    "OAUTH2_CLIENT_ID": "[YOUR_OAUTH2_CLIENT_ID]",
    "OAUTH2_CLIENT_SECRET": "[YOUR_OAUTH2_CLIENT_SECRET]",
    "OAUTH2_CALLBACK": "https://[PROJECT_ID].appspot.com/auth/google/callback",
    "GOOGLE_APPLICATION_CREDENTIALS": "./key_account/[JSON__KEY_NAME]",
    "PROJECT_ID": "[YOUR_PROJECT_ID]"
}' > config.json
```

### Deploy an object detection model to AI Platform
```
curl -o model.tar.gz http://download.tensorflow.org/models/official/20181001_resnet/savedmodels/resnet_v2_fp32_savedmodel_NHWC_jpg.tar.gz
tar xvf model.tar.gz
gsutil -m cp model/* gs://[BUCKET_NAME]/

gcloud ai-platform models create model_name \
  --regions us-central1


gcloud ai-platform versions create "[YOUR_VERSION_NAME]" \
    --model "[YOUR_MODEL_NAME]" \
    --origin "[YOUR_GCS_PATH_TO_MODEL_DIRECTORY]" \
    --runtime-version "1.13" \
    --python-version "3.5" \
    --machine-type "mls1-c4-m2"
```

### Deploy Cloud Function

Replace in cloud_functions/main.py predict_json() call your GCP parameters
```
gcloud functions deploy --source cloud_functions process_data --runtime python37 --trigger-resource YOUR_TRIGGER_BUCKET_NAME --trigger-event google.storage.object.finalize
```

### Deploy to Google Cloud App engine
```
gcloud app deploy
```