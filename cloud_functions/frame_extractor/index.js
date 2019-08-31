const process = require('process') // Required for mocking environment variables

const extractFrames = require('ffmpeg-extract-frames')
const fs = require('fs')
const glob = require('glob')

const { Storage } = require('@google-cloud/storage')
const storage = new Storage()

const { Datastore } = require('@google-cloud/datastore')
const datastore = new Datastore()

const { performance } = require('perf_hooks')
const fetch = require('node-fetch')


const PROJECT_ID = process.env.PROJECT_ID
const BUCKET_NAME = process.env.BUCKET_NAME
const REGION = process.env.REGION
const FPS = process.env.FPS



async function extract(message) {
  return new Promise(async (resolve, reject) => {
    // Get video key
    const query = datastore.createQuery('Video').filter('imageUrl', '=', message)
    let video
    await datastore.runQuery(query)
                   .then(results => {
                     video = results[0][0]
                   })
                   .catch(err => {
                     console.error('ERROR:', err)
                     reject()
                   })
    
    //console.log(video)
    video['frames'] = []
    const root = '/tmp'
    const pattern = `${root}/frame-*`

    await extractFrames({
      input: video['imageUrl'],
      output: `${root}/frame-%d.jpg`,
      fps: FPS
    }).catch(err => {
      console.error('ERROR:', err)
      reject()
    })
    glob(pattern, (er, files) => {
      // console.log(files)
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
            timeoutPromise(fetch(`https://${REGION}-${PROJECT_ID}.cloudfunctions.net/queue_input`, { mode: 'no-cors' })
            , 1000).then(resolve())
          }
        })
      })
    })
  })
}

// https://stackoverflow.com/questions/46946380/fetch-api-request-timeout
function timeoutPromise(promise, timeout) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve()
    }, timeout)
    promise.then(resolve, reject)
  })
}

/**
 * Generic background Cloud Function to be triggered by Cloud Storage.
 *
 * @param {object} data The event payload.
 * @param {object} context The event metadata.
 */
exports.extractGcs = async (data, context) => {
  if (!data.name.includes('.mp4')) {
    // console.log('Not a video: ', data.name)
    return
  }
  const startTime = performance.now()
  await extract(`https://storage.googleapis.com/${BUCKET_NAME}/${data.id.split('/')[1]}`)
  .then(console.log(`Elapsed time ${(performance.now() - startTime).toFixed(2)} milliseconds.`))
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
  /*
  try {
    await fs.unlink(newFileName, () => {

    })
    //file removed
  } catch(err) {
    console.error(err)
  }*/
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
