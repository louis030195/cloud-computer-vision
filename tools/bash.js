const { bash } = require('../utils/miscBack')

async function updateFunction() {
  const command = "gcloud functions deploy predictor \
  --source cloud_functions/predictor \
  --runtime python37 \
  --project $PROJECT_ID \
  --trigger-http \
  --region $REGION \
  --update-env-vars HEIGHT=401 \
  --max-instances 1 \
  --memory 2gb"

  const res = await bash(command)
  console.log(res)
}

updateFunction()