'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const model = require('./model-datastore-class')

const router = express.Router()

// Automatically parse request body as JSON
router.use(bodyParser.json())

/**
 * GET /api/class
 *
 * Retrieve all datasets
 */
router.get('/', (req, res, next) => {
  model.list((err, entities) => {
    if (err) {
      next(err)
      return
    }
    res.json(entities)
  })
})

/**
 * GET /api/class/:dataset
 *
 * Retrieve a dataset mapping
 */
router.get('/:dataset', (req, res, next) => {
  model.listBy(req.params.dataset, (err, entities, cursor) => {
    if (err) {
      next(err)
      return
    }
    res.json(entities)
  })
})


/**
 * Errors on "/api/classs/*" routes.
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
