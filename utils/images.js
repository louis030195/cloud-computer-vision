'use strict'

const Storage = require('@google-cloud/storage')
const config = require('../config')

const CLOUD_BUCKET = config.get('CLOUD_BUCKET')
const GOOGLE_APPLICATION_CREDENTIALS = config.get('GOOGLE_APPLICATION_CREDENTIALS')
const path = require('path')
const storage = Storage({
  keyFilename: path.join(__dirname, '..', GOOGLE_APPLICATION_CREDENTIALS)
})
const bucket = storage.bucket(CLOUD_BUCKET)

// Returns the public, anonymously accessable URL to a given Cloud Storage
// object.
// The object's ACL has to be set to public read.
function getPublicUrl (filename) {
  return `https://storage.googleapis.com/${CLOUD_BUCKET}/${filename}`
}

// Express middleware that will automatically pass uploads to Cloud Storage.
// req.file is processed and will have two new properties:
// * ``cloudStorageObject`` the object name in cloud storage.
// * ``cloudStoragePublicUrl`` the public url to the object.
function sendUploadToGCS (req, res, next) {
  if (!req.file) {
    return next()
  }

  const gcsname = Date.now() + req.file.originalname
  const file = bucket.file(gcsname)
  const stream = file.createWriteStream({
    metadata: {
      contentType: req.file.mimetype
    },
    resumable: false
  })

  stream.on('error', err => {
    req.file.cloudStorageError = err
    next(err)
  })

  stream.on('finish', () => {
    req.file.cloudStorageObject = gcsname
    file.makePublic().then(() => {
      req.file.cloudStoragePublicUrl = getPublicUrl(gcsname)
      next()
    })
  })

  stream.end(req.file.buffer)
}

// Multer handles parsing multipart/form-data requests.
// This instance is configured to store images in memory.
// This makes it straightforward to upload to Cloud Storage.
const Multer = require('multer')
const multer = Multer({
  storage: Multer.MemoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // no larger than 5mb
  }
})

module.exports = {
  getPublicUrl,
  sendUploadToGCS,
  multer
}
