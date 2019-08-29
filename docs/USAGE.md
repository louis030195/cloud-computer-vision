# Scripts

1. [Get my OAuth2 IDs](https://developers.google.com/identity/protocols/OAuth2)

2. [Get a json key file and put it in key_account directory](https://cloud.google.com/docs/authentication/getting-started)

3. Fill configure_gcp.sh exports with your gcp config

```
chmod +x configure_gcp.sh
./configure_gcp.sh
```

then follow following instructions (or check configure_gcp_and_deploy.sh but not tested)

# gcloud CLI
    echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list \
    && curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key --keyring /usr/share/keyrings/cloud.google.gpg add - \
    && sudo apt-get update \
    && sudo apt-get install -y google-cloud-sdk \
    && sudo rm -rf /var/lib/apt/lists/*

# Create GCP storage bucket
    gsutil mb gs://$BUCKET_NAME/ \
    --regions $REGION
    gsutil defacl set public-read gs://$BUCKET_NAME

# Deploy an object detection model to AI Platform
- Pick a model from [tensorflow models](https://github.com/tensorflow/models/blob/master/research/object_detection/g3doc/detection_model_zoo.md)
or somewhere else (AI Platform deployable format: SavedModel)

- [Update the graph for batch key mapping and upload to GCS](https://colab.research.google.com/drive/1CZxrvowmuzwfJJoUBjgIjsIpb-1gh53h)

- [Push class mapping to datastore](https://colab.research.google.com/drive/1JLJt4tUXNgeuq3Y9PPvZitBS2B7J7Ker)

<!--
gcloud -q ai-platform versions delete $VERSION --model $MODEL
gcloud -q ai-platform models delete $MODEL
gcloud ai-platform models create $MODEL \
--regions $REGION

gcloud ai-platform versions create $VERSION \
    --model $MODEL \
    --origin gs://$BUCKET_NAME/saved_model \
    --runtime-version 1.14 \
    --python-version 2.7
-->



# Deploy Cloud Function

## Input Pub/Sub
    gcloud functions deploy queue_input \
    --source cloud_functions/queue_input \
    --runtime python37 \
    --project $PROJECT_ID \
    --trigger-http \
    --region $REGION \
    --env-vars-file cloud_functions/queue_input/.env.yaml \
    --memory 2gb
## Predictor
    gcloud functions deploy predictor \
    --source cloud_functions/predictor \
    --runtime python37 \
    --project $PROJECT_ID \
    --trigger-http \
    --region $REGION \
    --env-vars-file cloud_functions/predictor/.env.yaml \
    --max-instances 1 \
    --memory 2gb
## Batch result
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
## Frame extractor
    gcloud functions deploy extractPubSub \
    --source cloud_functions/frame_extractor \
    --runtime nodejs10 \
    --project $PROJECT_ID \
    --trigger-topic topic_extractor \
    --region $REGION \
    --env-vars-file cloud_functions/frame_extractor/.env.yaml \
    --max-instances 1 \
    --memory 2gb
## Dont take all my money
follow [to avoid having your bank account emptied by Google](https://cloud.google.com/billing/docs/how-to/notify#set_up_budget_notifications)

THIS HASNT BEEN TESTED YET SO FOLLOW THE LINK INSTRUCTIONS CAREFULLY

    gcloud functions deploy stop_billing \
    --source cloud_functions/dont_take_all_my_money \
    --runtime python37 \
    --project $PROJECT_ID \
    --trigger-topic budget-notifications \
    --region $REGION \
    --env-vars-file cloud_functions/dont_take_all_my_money/.env.yaml
Or

    gcloud functions deploy limit_use \
    --source cloud_functions/dont_take_all_my_money \
    --runtime python37 \
    --project $PROJECT_ID \
    --trigger-topic budget-notifications \
    --region $REGION \
    --env-vars-file cloud_functions/dont_take_all_my_money/.env.yaml
# Deploy to Google Cloud App engine

    gcloud config set project $PROJECT_ID
    gcloud app deploy
    gcloud scheduler jobs create http cron_input --schedule='every 30 mins' --uri="https://$REGION-$PROJECT_ID.cloudfunctions.net/queue_input" 