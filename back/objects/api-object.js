'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const model = require('./model-datastore-object')

const router = express.Router()

// Automatically parse request body as JSON
router.use(bodyParser.json())

/**
 * GET /api/objects
 *
 * Retrieve a page of objects (up to ten at a time).
 */
router.get('/', (req, res, next) => {
  model.list(10, req.query.pageToken, (err, entities, cursor) => {
    if (err) {
      next(err)
      return
    }
    res.json({
      items: entities,
      nextPageToken: cursor
    })
  })
})

/**
 * POST /api/objects
 *
 * Create a new object.
 */
router.post('/', (req, res, next) => {
  model.create(req.body, (err, entity) => {
    if (err) {
      next(err)
      return
    }
    res.json(entity)
  })
})

/**
 * GET /api/objects/:id
 *
 * Retrieve a object.
 */
router.get('/:object', (req, res, next) => {
  model.read(req.params.object, (err, entity) => {
    if (err) {
      next(err)
      return
    }
    res.json(entity)
  })
})

/**
 * PUT /api/objects/:id
 *
 * Update a object.
 */
router.put('/:object', (req, res, next) => {
  model.update(req.params.object, req.body, (err, entity) => {
    if (err) {
      next(err)
      return
    }
    res.json(entity)
  })
})

/**
 * DELETE /api/objects/:id
 *
 * Delete a object.
 */
router.delete('/:object', (req, res, next) => {
  model.delete(req.params.object, err => {
    if (err) {
      next(err)
      return
    }
    res.status(200).send('OK')
  })
})

/**
 * Errors on "/api/objects/*" routes.
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
