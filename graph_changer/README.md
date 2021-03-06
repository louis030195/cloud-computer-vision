# USAGE
<!--
Pick a model for example from tensorflow models zoo and set the url model_url=URL

sudo docker build --tag=cgad . --build-arg model_url=http://download.tensorflow.org/models/object_detection/ssd_mobilenet_v1_coco_2018_01_28.tar.gz

Check that the graph contains input_keys and output_keys
-->
To deploy the Cloud Run service

    gcloud config set run/region $REGION
    gcloud pubsub topics create graph_changer
    gcloud builds submit --config graph_changer/config.yaml graph_changer
    gcloud beta run deploy graph-changer --image gcr.io/$PROJECT_ID/graph_changer --platform managed \
     --region $REGION --set-env-vars PROJECT_ID=$PROJECT_ID,BUCKET_NAME=$BUCKET_NAME,REGION=$REGION \
     --memory 2Gi --concurrency 1 --allow-unauthenticated #--no-allow-unauthenticated

Then for example, to deploy a ~30mb OD model

    python graph_changer/deploy_test.py

Then you can try its predictions

    python graph_changer/predict_test.py

<!--
    gcloud projects add-iam-policy-binding $PROJECT_ID \
     --member=serviceAccount:service-$PROJECT_NUMBER@gcp-sa-pubsub.iam.gserviceaccount.com \
     --role=roles/iam.serviceAccountTokenCreator
    gcloud iam service-accounts create cloud-run-pubsub-invoker \
     --display-name "Cloud Run Pub/Sub Invoker"
    gcloud beta run services add-iam-policy-binding graph-changer \
     --member=serviceAccount:cloud-run-pubsub-invoker@$PROJECT_ID.iam.gserviceaccount.com \
     --role=roles/run.invoker --region=$REGION


    # Get the service URL
    gcloud beta run services list --platform managed | grep graph-changer

    # Replace SERVICE-URL with the URL
    gcloud beta pubsub subscriptions create graph_changer --topic graph_changer \
     --push-endpoint=SERVICE-URL/ \
     --push-auth-service-account=cloud-run-pubsub-invoker@$PROJECT_ID.iam.gserviceaccount.com # TODO change this serviceacc doenst work
-->