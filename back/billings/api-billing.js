'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const { totalInvoice } = require('../../utils/billing')

const router = express.Router()

// Automatically parse request body as JSON
router.use(bodyParser.json())

router.use(require('../../utils/oauth2').router)

/**
 * GET /api/billings
 *
 * Retrieve billings
 */
router.get('/', async (req, res, next) => {
  const total = await totalInvoice()
  const result = {rows: total }
  res.json(result)
})

/**
 * GET /api/billings/:month
 *
 * Retrieve billings at a specific month
 */
router.get('/:month', async (req, res, next) => {
  const total = await totalInvoice()
  res.json(total.find(x => x.month.includes(req.params.month)))
})

/**
 * Errors on "/api/billings/*" routes.
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
