'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const extractFrames = require('ffmpeg-extract-frames')
const fs = require('fs')
const glob = require('glob')
const { sendUploadToGCS, multer } = require('../../utils/images')
const FormData = require('form-data');
const router = express.Router()

// Automatically parse request body as JSON
router.use(bodyParser.json())

/**
 * POST /api/extract
 *
 * Extract frames from a video
 */
router.post(
  '/',
  multer.single('file'),
  sendUploadToGCS,
  async (req, res, next) => {
    //let frames = []
    const path = '/tmp'
    await extractFrames({
      input: req.file.cloudStoragePublicUrl,
      output: `${path}/frame-%d.jpg`,
      fps: 1
    })
    glob(`${path}/frame-*`, (er, files) => {
      files.forEach(file => {
        fs.readFile(file, 'utf-8', (err, contents) => {
          //frames.push(file)
          //console.log(contents)
          /*
          const formData = new FormData()
          formData.append('file', contents)
          req.file = formData

          multer.single('file')(req, {}, (err) => {
            if (err) throw err
            console.log(req.file)
            sendUploadToGCS(req, res, next)
          })*/
        })
      })
    })

    //res.json(frames)
  })

/**
 * Errors on "/api/extract/*" routes.
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
