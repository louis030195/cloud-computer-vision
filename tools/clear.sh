# Clear gcp storages
gsutil -m rm gs://$BUCKET_NAME/*.png
gsutil -m rm gs://$BUCKET_NAME/*.jpg
gsutil -m rm gs://$BUCKET_NAME/*.mp4
gsutil -m rm -rf gs://$BUCKET_NAME/batches
gsutil -m rm -rf gs://$BUCKET_NAME/batch_results

# Clear functions
#gcloud functions delete --region $REGION --project $PROJECT_ID input_pubsub
#gcloud functions delete --region $REGION --project $PROJECT_ID predictor
#gcloud functions delete --region $REGION --project $PROJECT_ID batch_result
#gcloud functions delete --region $REGION --project $PROJECT_ID extractPubSub
#gcloud functions delete --region $REGION --project $PROJECT_ID stop_billing
#gcloud functions delete --region $REGION --project $PROJECT_ID limit_use

# Clear pubsub messages
gcloud pubsub subscriptions seek "projects/$PROJECT_ID/subscriptions/$SUBSCRIPTION_INPUT" \
--time=2050-09-25T10:49:41.519Z # Increase the year if you live in 2050+

# You could also disable App Engine if you stop using it for a while (just in case)
# https://cloud.google.com/appengine/docs/standard/python/console (no CLI for this ...)

# Full stop billing by deleting your project
# Beware, can break all your GCP config
# gcloud projects delete $PROJECT_ID