const process = require('process') // Required for mocking environment variables

const extractFrames = require('ffmpeg-extract-frames')
const fs = require('fs')
const glob = require('glob')

const { Storage } = require('@google-cloud/storage')
const storage = new Storage()

const { Datastore } = require('@google-cloud/datastore')
const datastore = new Datastore()

const {PubSub} = require('@google-cloud/pubsub')
const { performance } = require('perf_hooks')
const fetch = require('node-fetch')

// Instantiate a pubsub client
const pubsub = new PubSub()

const BUCKET_NAME = process.env.BUCKET_NAME

/**
 * Background Cloud Function to be triggered by Pub/Sub.
 * This function is exported by index.js, and executed when
 * the trigger topic receives a message.
 *
 * @param {object} pubSubEvent The event payload.
 * @param {object} context The event metadata.
 */
exports.extractPubSub = async (pubSubEvent, context) => {
  const startTime = performance.now()
    // The message is a unicode string encoded in base64.
  const message = Buffer.from(pubSubEvent.data, 'base64').toString(
    'utf-8'
  );
  // Get video key
  // TODO: maybe request with video id instead ...
  // TODO: in dev mode u have to put a video in datastore
  const query = datastore.createQuery('Video').filter('imageUrl', '=', message)
  let video
  await datastore
    .runQuery(query)
    .then(results => {
      video = results[0][0]
    })
    .catch(err => {console.error('ERROR:', err)})
  video['frames'] = []
  const root = '/tmp'
  const pattern = `${root}/frame-*`

  await extractFrames({
    input: message,
    output: `${root}/frame-%d.jpg`,
    fps: 1
  })
  glob(pattern, (er, files) => {
    // https://stackoverflow.com/questions/18983138/callback-after-all-asynchronous-foreach-callbacks-are-completed
    files.reduce((promiseChain, item) => {
      return promiseChain.then(() => new Promise((resolve) => {
        asyncFunction(item, resolve, video)
      }))
    }, Promise.resolve()).then(video => {
      // console.log('done', video)
      const entityVideo = {
        key: video[Datastore.KEY],
        data: video
      }

      datastore.save(entityVideo,
      (err) => {
        if (!err) {
          console.log('Video updated successfully.')
        }
      })
    })
  })
  fetch(`https://${process.env.REGION}-${process.env.PROJECT_ID}.cloudfunctions.net/queue_input`, { mode: 'no-cors' })
  console.log(`Elapsed time ${performance.now() - startTime} milliseconds.`)
}

async function asyncFunction(file, cb, video) {
  // We need to make unique name (e.g. path/127167261-1.jpg)
  const newFileName = file.replace('/frame', '/' + video[Datastore.KEY].id)
  await fs.rename(file, newFileName, (err) => {
      if ( err ) console.log('ERROR: ' + err)
  })
  // console.log(newFileName)
  // Uploads a local file to the bucket
  await storage.bucket(BUCKET_NAME).upload(newFileName, {
    // Support for HTTP requests made with `Accept-Encoding: gzip`
    // gzip: true,
    // By setting the option `destination`, you can change the name of the
    // object you are uploading to a bucket.
    metadata: {
      // Enable long-lived HTTP caching headers
      // Use only if the contents of the file will never change
      // (If the contents will change, use cacheControl: 'no-cache')
      cacheControl: 'public, max-age=31536000',
    },
  })

  try {
    fs.unlinkSync(newFileName)
    //file removed
  } catch(err) {
    console.error(err)
  }
  const keyFrame = datastore.key('Frame')
  const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${newFileName.split('/').pop()}`
  storage.bucket(BUCKET_NAME).file(publicUrl.split('/').pop()).makePublic((err) => { if (err) console.error(err) })
  let entity = {
    key: keyFrame,
    data: { imageUrl: publicUrl, predictions: null}
  }

  datastore.save(entity,
  (err) => {
    if (!err) {
      // console.log('Frame saved successfully.')
      // console.log(entity['key'].id)
      // Push the reference of the frame as a property of video
      video['frames'].push(entity['key'].id)
      // console.log(video['frames'])
    }
  })
  cb(video)
}

/**
 * Generic background Cloud Function to be triggered by Cloud Storage.
 *
 * @param {object} data The event payload.
 * @param {object} context The event metadata.
 */
exports.helloGCSGeneric = (data, context) => {
  const file = data;
  console.log(`  Event ${context.eventId}`);
  console.log(`  Event Type: ${context.eventType}`);
  console.log(`  Bucket: ${file.bucket}`);
  console.log(`  File: ${file.name}`);
  console.log(`  Metageneration: ${file.metageneration}`);
  console.log(`  Created: ${file.timeCreated}`);
  console.log(`  Updated: ${file.updated}`);
};