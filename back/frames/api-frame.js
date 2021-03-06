'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const model = require('./model-datastore-frame')
const modelPrediction = require('../predictions/model-datastore-prediction')
const modelObject = require('../objects/model-datastore-object')

const { sendUploadToGCS, multer } = require('../../utils/images')
const oauth2 = require('../../utils/oauth2')

const router = express.Router()

// Expose login/logout URLs to templates.
router.use(oauth2.template);

// Automatically parse request body as JSON
router.use(bodyParser.json())

router.use(oauth2.router)

/**
 * GET /api/frames
 *
 * Retrieve a page of frames (up to ten at a time).
 */
router.get('/', oauth2.required, (req, res, next) => {
  model.list(100, req.query.pageToken, (err, entities, cursor) => {
  //model.listAll((err, entities, cursor) => {
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
 * GET /api/frames/predictions/objects/
 *
 * Retrieve all frames and their objects.
 */

const readObject = (id) => new Promise((resolve,reject) => modelObject.read(id, (err, entity) => {
  if(err) {
    reject(err)
    return;
  }
  resolve(entity)
}))

const readPrediction = (id) => new Promise((resolve,reject) => modelPrediction.read(id, (err, entity) => {
  if(err) {
    reject(err)
    return;
  }
  resolve(entity)
}))

router.get('/predictions/objects', (req, res, next) => {
  model.list(100, req.query.pageToken, async (err, entities, cursor) => {
    if (err) {
      next(err)
      return
    }
    const frames = entities.filter(f => f.predictions !== null && f.predictions !== 'processing')

    for(let frame of frames) {
      frame.predictions = await Promise.all(frame.predictions.map(async p => {
        const predictionEntity = await readPrediction(p)
        predictionEntity.objects = await Promise.all(predictionEntity.objects.map(o => readObject(o)))
        return predictionEntity
      }))
    }

    res.json({
      items: frames,
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
  oauth2.required,
  multer.single('file'),
  sendUploadToGCS,
  (req, res, next) => {
    const data = { imageUrl: req.file.cloudStoragePublicUrl, predictions: null }
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
router.put('/:frame', oauth2.required, (req, res, next) => {
  model.update(req.params.frame, req.body, (err, entity) => {
    if (err) {
      next(err)
      return
    }
    res.json(entity)
  })
})

const deleteObject = (id) => new Promise((resolve,reject) => modelObject.delete(id, (err, entity) => {
  if(err) {
    reject(err)
    return;
  }
  resolve(entity)
}))

const deletePrediction = (id) => new Promise((resolve,reject) => modelPrediction.delete(id, (err, entity) => {
  if(err) {
    reject(err)
    return;
  }
  resolve(entity)
}))

const deleteFrame = (id) => new Promise((resolve,reject) => model.delete(id, (err, entity) => {
  if(err) {
    reject(err)
    return;
  }
  resolve(entity)
}))

/**
 * DELETE /api/frames/:id
 *
 * Delete a frame.
 */
router.delete('/:frame', oauth2.required, (req, res, next) => { // TODO: should delete predictions associated + objects
  if (req.params.frame !== null) {
    model.read(req.params.frame, async (err, entity) => {
      if (err) {
        next(err)
        return
      }
      const pred = await readPrediction(entity.predictions)
      Promise.all(pred.objects.map(async o => {
        await deleteObject(o)
      }), await deletePrediction(pred.id), await deleteFrame(req.params.frame))
         .catch(() => {})
         .then(res.status(200).send('OK'))
    })
  }
})

/**
 * POST /api/frames/predictions/reset
 *
 * Reset all predictions.
 */
router.post('/predictions/reset', oauth2.required, (req, res, next) => {
  model.listAll((err, entities) => {
    if (err) {
      next(err)
      return
    }
    entities.forEach(async frame => {
      const pred = await readPrediction(frame.predictions)
      frame.predictions = null
      model.update(frame.id, frame, async (err, entity) => {
        if (err) {
          next(err)
          return
        }
        Promise.all(pred.objects.map(async o => {
        await deleteObject(o)
        }), await deletePrediction(pred.id))
            .catch(() => {})
            .then(res.status(200).send('OK'))
      })
    })
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
