'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const model = require('./model-datastore-queue')

const router = express.Router()

// Automatically parse request body as JSON
router.use(bodyParser.json())

/**
 * GET /api/queues/length
 *
 * Return the length of the queue
 */
router.get('/length', (req, res, next) => {
  model.list(req.query.pageToken, (err, entities, cursor) => {
    if (err) {
      next(err)
      return
    }
    res.json(entities.length)
  })
})

/**
 * Errors on "/api/queues/*" routes.
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
