'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const { totalInvoice } = require('../../utils/billing')
const { bash } = require('../../utils/miscBack')
const {google} = require('googleapis')
const path = require('path')
const oauth2 = require('../../utils/oauth2')

// Imports the Google Cloud client library
const {PubSub} = require('@google-cloud/pubsub')
// Instantiates a client
const pubsub = new PubSub({
  projectId: process.env.PROJECT_ID,
  keyFilename: path.join(__dirname, '..', '..', process.env.GOOGLE_APPLICATION_CREDENTIALS)
})

const router = express.Router()

// Expose login/logout URLs to templates.
router.use(oauth2.template);

// Automatically parse request body as JSON
router.use(bodyParser.json())

router.use(oauth2.router)

/**
 * GET /api/misc/login
 *
 * Login
 */
router.get('/login', oauth2.required, (req, res, next) => {
  //res.redirect('/auth/login')
  res.json('ok')
})


/**
 * GET /api/misc/billings
 *
 * Retrieve billings
 */
router.get('/billings', async (req, res, next) => {
  const total = await totalInvoice()
  const result = {rows: total }
  res.json(result)
})

/**
 * GET /api/misc/billings/:month
 *
 * Retrieve billings at a specific month
 */
router.get('/billings/:month', async (req, res, next) => {
  const total = await totalInvoice()
  res.json(total.find(x => x.month.includes(req.params.month)))
})

/**
 * GET /api/misc/functions
 *
 * Retrieve a list of functions
 */
router.get('/functions', async (req, res, next) => {
  // TODO: Stop use dirty bash commands when googleapis exist
  bash('gcloud functions list').then(r => res.json(r))
})

/**
 * PUT /api/misc/functions/predictor
 *
 * Update predictor env vars
 */
router.put('/functions/predictor', oauth2.required, async (req, res, next) => {
  const wantedProperties = ['width', 'height', 'batch_chunk', 'treshold']
  // TODO: improve this temporary thing
  if (wantedProperties.some(p => p === undefined) ||
      req.body.height < 100 ||
      req.body.height > 2000 ||
      req.body.width < 100 ||
      req.body.width > 2000 ||
      req.body.batch_chunk > 300 ||
      req.body.batch_chunk < 50 ||
      req.body.treshold > 2000 ||
      req.body.treshold < 50) {
    return res.status(400).send({message: 'Incorrect body !'})
  }

  const command = `gcloud functions deploy predictor \
  --source cloud_functions/predictor \
  --runtime python37 \
  --project $PROJECT_ID \
  --trigger-http \
  --region $REGION \
  --update-env-vars WIDTH=${req.body.width},HEIGHT=${req.body.height},BATCH_CHUNK=${req.body.batch_chunk},TRESHOLD=${req.body.treshold} \
  --max-instances 1 \
  --memory 2gb`
  bash(command).then(() => res.status(200).send('OK'))
})

async function mlAuth() {
  const ml = google.ml({
    version: 'v1',
    projectId: process.env.PROJECT_ID,
    keyFilename: path.join(__dirname, '..', '..', process.env.GOOGLE_APPLICATION_CREDENTIALS)
  })
  // This method looks for the GCLOUD_PROJECT and GOOGLE_APPLICATION_CREDENTIALS
  // environment variables.
  const auth = new google.auth.GoogleAuth({
    // Scopes can be specified either as an array or as a single, space-delimited string.
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  });
  const authClient = await auth.getClient();

  // obtain the current project Id
  const projectId = await auth.getProjectId();

  return { ml, authClient, projectId }
}

/**
 * GET /api/misc/ai/models
 *
 * Get a list of ai platform models
 */
router.get('/ai/models', async (req, res, next) => {
  const { ml, authClient, projectId } = await mlAuth()
  let request = {
    parent: `projects/${projectId}`,

    // This is a "request-level" option
    auth: authClient
  }

  await ml.projects.models.list(request).then(ok => res.json(ok.data)).catch(res.json)
})

/**
 * GET /api/misc/ai/models/:name
 *
 * Get a model of ai platform
 */
router.get('/ai/models/:name', async (req, res, next) => {
  const { ml, authClient, projectId } = await mlAuth()
  let request = {
    name: `projects/${projectId}/models/${req.params.name}`,

    // This is a "request-level" option
    auth: authClient
  }

  await ml.projects.models.get(request).then(ok => res.json(ok.data)).catch(res.json)
})

/**
 * GET /api/misc/ai/models/:name/versions
 *
 * Get a list of a ai platform model's versions
 */
router.get('/ai/models/:name/versions', async (req, res, next) => {
  const { ml, authClient, projectId } = await mlAuth()
  let request = {
    parent: `projects/${projectId}/models/${req.params.name}`,

    // This is a "request-level" option
    auth: authClient
  }

  await ml.projects.models.versions.list(request).then(ok => res.json(ok.data)).catch(res.json)
})

/**
 * POST /api/misc/ai/models/version
 *
 * Download, change graph and deploy a model from an url
 */
router.post('/ai/models/version', async (req, res, next) => {
  const data = JSON.stringify({ url: req.body.url, input_type: req.body.inputType, name: req.body.name })
  const dataBuffer = Buffer.from(data)
  await pubsub.topic('graph_changer').publish(dataBuffer).then(id => res.json(id))
})

/**
 * Errors on "/api/misc/*" routes.
 */
router.use((err, req, res, next) => {
  // Format error and forward to generic error handler for logging and
  // responding to the request
  err.response = {
    message: err.message,
    internalCode: err.code
  }
  next(err)
})

module.exports = router
