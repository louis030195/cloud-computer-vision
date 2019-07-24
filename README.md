# vision-client


# Installation

## Local development
[Install NodeJS](https://www.google.com/search?ei=D3Q4XZGcM8OHjLsPs--n8AM&q=install+nodejs)
```
git clone https://github.com/louis030195/vision-client.git
cd vision-client
npm install
```

- [Get my OAuth2 IDs](https://developers.google.com/identity/protocols/OAuth2)
- [Get a json key file and put it in key_account directory](https://cloud.google.com/docs/authentication/getting-started)
- [Create a bucket](https://cloud.google.com/storage/docs/creating-buckets)

```
echo "{
    "CLOUD_BUCKET": "[YOUR_BUCKET]",
    "OAUTH2_CLIENT_ID": "[YOUR_OAUTH2_CLIENT_ID]",
    "OAUTH2_CLIENT_SECRET": "[YOUR_OAUTH2_CLIENT_SECRET]",
    "OAUTH2_CALLBACK": "https://[PROJECT_ID].appspot.com/auth/google/callback",
    "GOOGLE_APPLICATION_CREDENTIALS": "./key_account/[JSON__KEY_NAME]"
  }" > config.json
```
Sometimes you need to manually add this one

```
export GOOGLE_APPLICATION_CREDENTIALS="./key_account/[JSON__KEY_NAME]"
```

WIP, other instructions for installation incoming (GCP AI platform ...)

## Google Cloud App engine
[Install Google Cloud SDK](https://cloud.google.com/sdk/install)
```
git clone https://github.com/louis030195/vision-client.git
cd vision-client
gcloud app deploy
```
WIP, other instructions for installation incoming (GCP AI platform ...)