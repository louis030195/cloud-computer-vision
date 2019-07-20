'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const model = require('./model-datastore-annotation');

const router = express.Router();

// Automatically parse request body as JSON
router.use(bodyParser.json());

/**
 * GET /api/annotations
 *
 * Retrieve a page of annotations (up to ten at a time).
 */
router.get('/', (req, res, next) => {
  model.list(10, req.query.pageToken, (err, entities, cursor) => {
    if (err) {
      next(err);
      return;
    }
    res.json({
      items: entities,
      nextPageToken: cursor,
    });
  });
});

/**
 * POST /api/annotations
 *
 * Create a new annotation.
 */
router.post('/', (req, res, next) => {
  model.create(req.body, (err, entity) => {
    if (err) {
      next(err);
      return;
    }
    res.json(entity);
  });
});

/**
 * GET /api/annotations/:id
 *
 * Retrieve a annotation.
 */
router.get('/:annotation', (req, res, next) => {
  model.read(req.params.annotation, (err, entity) => {
    if (err) {
      next(err);
      return;
    }
    res.json(entity);
  });
});

/**
 * PUT /api/annotations/:id
 *
 * Update a annotation.
 */
router.put('/:annotation', (req, res, next) => {
  model.update(req.params.annotation, req.body, (err, entity) => {
    if (err) {
      next(err);
      return;
    }
    res.json(entity);
  });
});

/**
 * DELETE /api/annotations/:id
 *
 * Delete a annotation.
 */
router.delete('/:annotation', (req, res, next) => {
  model.delete(req.params.annotation, err => {
    if (err) {
      next(err);
      return;
    }
    res.status(200).send('OK');
  });
});

/**
 * Errors on "/api/annotations/*" routes.
 */
router.use((err, req, res, next) => {
  // Format error and forward to generic error handler for logging and
  // responding to the request
  err.response = {
    message: err.message,
    internalCode: err.code,
  };
  next(err);
});

module.exports = router;
