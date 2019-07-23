gcloud ai-platform models create model_name \
  --regions us-central1 \
  --enable-logging


gcloud ai-platform versions create "[YOUR_VERSION_NAME]" \
    --model "[YOUR_MODEL_NAME]" \
    --origin "[YOUR_GCS_PATH_TO_MODEL_DIRECTORY]" \
    --runtime-version "1.13" \
    --python-version "3.5" \
    --machine-type "mls1-c4-m2"