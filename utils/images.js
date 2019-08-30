'use strict'

const Storage = require('@google-cloud/storage')

const BUCKET_NAME = process.env.BUCKET_NAME
const path = require('path')
const storage = Storage({
  keyFilename: path.join(__dirname, '..', process.env.GOOGLE_APPLICATION_CREDENTIALS)
})
// const throttledQueue = require('throttled-queue');
// const throttle = throttledQueue(1, 5000) // at most make 1 request every 5 seconds.

const bucket = storage.bucket(BUCKET_NAME)

// Returns the public, anonymously accessable URL to a given Cloud Storage
// object.
// The object's ACL has to be set to public read.
function getPublicUrl (filename) {
  return `https://storage.googleapis.com/${BUCKET_NAME}/${filename}`
}

// Express middleware that will automatically pass uploads to Cloud Storage.
// req.file is processed and will have two new properties:
// * ``cloudStorageObject`` the object name in cloud storage.
// * ``cloudStoragePublicUrl`` the public url to the object.
function sendUploadToGCS (req, res, next) {
  // throttle(() => {
    if (!req.file) {
      return next()
    }
    
    const gcsname = Date.now() + req.file.originalname
    //console.log(req.file, gcsname)
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
  // })
}

// Multer handles parsing multipart/form-data requests.
// This instance is configured to store images in memory.
// This makes it straightforward to upload to Cloud Storage.
const Multer = require('multer')
const multer = Multer({
  storage: Multer.MemoryStorage,
  limits: {
    fileSize: 20 * 1024 * 1024 // no larger than 20mb
  }
})

module.exports = {
  getPublicUrl,
  sendUploadToGCS,
  multer
}
