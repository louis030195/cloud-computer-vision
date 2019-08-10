# Clear gcp storages
gsutil -m rm gs://[BUCKET_NAME]/*.png
gsutil -m rm gs://[BUCKET_NAME]/*.jpg
gsutil -m rm gs://[BUCKET_NAME]/*.mp4


# https://cloud.google.com/dataflow/docs/guides/templates/provided-utilities
# TODO: fix it
gcloud dataflow jobs run "clear" \
    --gcs-location gs://dataflow-templates/latest/Datastore_to_Datastore_Delete \
    --parameters \
datastoreReadGqlQuery="SELECT * FROM Frame, Object, Prediction",\
datastoreReadProjectId=DATASTORE_READ_AND_DELETE_PROJECT_ID,\
datastoreDeleteProjectId=DATASTORE_READ_AND_DELETE_PROJECT_ID

# Clear functions
gcloud functions delete --region europe-west1 --project [PROJECT-ID] online_prediction
gcloud functions delete --region europe-west1 --project [PROJECT-ID] batch_prediction
gcloud functions delete --region europe-west1 --project [PROJECT-ID] tfrecord_caller
gcloud functions delete --region europe-west1 --project [PROJECT-ID] stop_billing
gcloud functions delete --region europe-west1 --project [PROJECT-ID] limit_use
