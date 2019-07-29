'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const model = require('./model-datastore-frame')
const { sendUploadToGCS, multer } = require('../../utils/images')

const router = express.Router()

// Automatically parse request body as JSON
router.use(bodyParser.json())

router.use(require('../../utils/oauth2').router)

/**
 * GET /api/frames
 *
 * Retrieve a page of frames (up to ten at a time).
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
 * POST /api/frames
 *
 * Create a new frame.
 */
router.post(
  '/',
  multer.single('file'),
  sendUploadToGCS,
  (req, res, next) => {
    const data = { imageUrl: req.file.cloudStoragePublicUrl, predictions: null } // Predictions represents the object detected in the media
    model.create(data, (err, entity) => {
      if (err) {
        next(err)
        return
      }
      res.json(entity)
    })
  })

/**
 * GET /api/frames/:id
 *
 * Retrieve a frame.
 */
router.get('/:frame', (req, res, next) => {
  model.read(req.params.frame, (err, entity) => {
    if (err) {
      next(err)
      return
    }
    res.json(entity)
  })
})

/**
 * PUT /api/frames/:id
 *
 * Update a frame.
 */
router.put('/:frame', (req, res, next) => {
  model.update(req.params.frame, req.body, (err, entity) => {
    if (err) {
      next(err)
      return
    }
    res.json(entity)
  })
})

/**
 * DELETE /api/frames/:id
 *
 * Delete a frame.
 */
router.delete('/:frame', (req, res, next) => {
  model.delete(req.params.frame, err => {
    if (err) {
      next(err)
      return
    }
    res.status(200).send('OK')
  })
})

/**
 * Errors on "/api/frames/*" routes.
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
