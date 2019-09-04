'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const { totalInvoice } = require('../../utils/billing')
const { bash } = require('../../utils/miscBack')

const router = express.Router()

// Automatically parse request body as JSON
router.use(bodyParser.json())

router.use(require('../../utils/oauth2').router)

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
  bash('gcloud functions list').then(r => res.json(r))
})

/**
 * PUT /api/misc/functions/predictor
 *
 * Update predictor env vars
 */
router.put('/functions/predictor', async (req, res, next) => {
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


/**
 * GET /api/misc/ai/models
 *
 * Get a list of ai platform models
 */
router.get('/ai/models', async (req, res, next) => {
  const command = `gcloud ai-platform models list`
  bash(command).then(entities => res.json(entities))
})

/**
 * GET /api/misc/ai/models/:name
 *
 * Get a list of a ai platform model's versions
 */
router.get('/ai/models/:name', async (req, res, next) => {
  const command = `gcloud ai-platform versions list --model=${req.params.name}`
  bash(command).then(entities => res.json(entities))
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
