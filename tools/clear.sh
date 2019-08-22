export BUCKET_NAME = [BUCKET_NAME] # Replace with your bucket name
export PROJECT-ID = [PROJECT-ID] # Replace with your project id

# Clear gcp storages
gsutil -m rm gs://BUCKET_NAME/*.png
gsutil -m rm gs://BUCKET_NAME/*.jpg
gsutil -m rm gs://BUCKET_NAME/*.mp4
gsutil -m rm -R gs://BUCKET_NAME/batches
gsutil -m rm -R gs://BUCKET_NAME/batch_results

# Clear functions
gcloud functions delete --region europe-west1 --project PROJECT-ID online_prediction
gcloud functions delete --region europe-west1 --project PROJECT-ID batch_prediction
gcloud functions delete --region europe-west1 --project PROJECT-ID online_batch_prediction
gcloud functions delete --region europe-west1 --project PROJECT-ID batch_result
gcloud functions delete --region europe-west1 --project PROJECT-ID extractPubSub
gcloud functions delete --region europe-west1 --project PROJECT-ID tfrecord_caller
gcloud functions delete --region europe-west1 --project PROJECT-ID stop_billing
gcloud functions delete --region europe-west1 --project PROJECT-ID limit_use

# You could also disable App Engine if you stop using it for a while (just in case)
# https://cloud.google.com/appengine/docs/standard/python/console (no CLI for this ...)

# Full stop billing by deleting your project
# Beware, can break all your GCP config
# gcloud projects delete PROJECT-ID