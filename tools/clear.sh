# Clear gcp storages
gsutil rm gs://bucket03y/*.png
gsutil rm gs://bucket03y/*.jpg
gsutil rm gs://bucket03y/*.mp4


# https://cloud.google.com/dataflow/docs/guides/templates/provided-utilities
# TODO: fix it
gcloud dataflow jobs run "clear" \
    --gcs-location gs://dataflow-templates/latest/Datastore_to_Datastore_Delete \
    --parameters \
datastoreReadGqlQuery="SELECT * FROM Frame, Object, Prediction",\
datastoreReadProjectId=DATASTORE_READ_AND_DELETE_PROJECT_ID,\
datastoreDeleteProjectId=DATASTORE_READ_AND_DELETE_PROJECT_ID

# Clear functions
gcloud functions delete --region europe-west1 online_processing