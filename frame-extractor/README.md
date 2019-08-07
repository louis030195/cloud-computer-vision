## Setup

1. Enable the Cloud Pub/Sub API in the [Google Developers Console](https://console.developers.google.com/project/_/apiui/apiview/pubsub/overview).
1. Create a topic and subscription.

        gcloud pubsub topics create topic_extractor
        gcloud pubsub subscriptions create sub_extractor \
          --topic topic_extractor \
          --push-endpoint \
            https://<your-project-id>.appspot.com/pubsub/push?token=<your-verification-token> \
          --ack-deadline 30

1. Create a subscription for authenticated pushes. The push auth service account must have Service Account Token Creator Role assigned, which can be done in the Cloud Console [IAM & admin](https://console.cloud.google.com/iam-admin/iam) UI. `--push-auth-token-audience` is optional. If set, remember to modify the audience field check in `app.js` (line 112).

        gcloud beta pubsub subscriptions create <your-subscription-name> \
          --topic <your-topic-name> \
          --push-endpoint \
            https://<your-project-id>.appspot.com/pubsub/authenticated-push?token=<your-verification-token> \
          --ack-deadline 30 \
          --push-auth-service-account=[your-service-account-email] \
          --push-auth-token-audience=example.com

1. Update the environment variables in `app.standard.yaml` or `app.flexible.yaml`
(depending on your App Engine environment).

## Running locally
Set environment variables before starting your application:

    export PUBSUB_VERIFICATION_TOKEN=<your-verification-token>
    export PUBSUB_TOPIC=<your-topic-name>
    npm start

### Simulating push notifications

    node test/call.js

### Authenticated push notifications
null

## Running on App Engine

    gcloud app deploy