/**
 * Copyright 2016, Google, Inc.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const {OAuth2Client} = require('google-auth-library');
const path = require('path');
const process = require('process'); // Required for mocking environment variables

const extractFrames = require('ffmpeg-extract-frames')
const fs = require('fs')
const glob = require('glob')

const Storage = require('@google-cloud/storage')
const storage = Storage()
const CLOUD_BUCKET = 'bucket03y'
const bucket = storage.bucket(CLOUD_BUCKET)

const { Datastore } = require('@google-cloud/datastore')
const datastore = new Datastore()

// By default, the client will authenticate using the service account file
// specified by the GOOGLE_APPLICATION_CREDENTIALS environment variable and use
// the project specified by the GOOGLE_CLOUD_PROJECT environment variable. See
// https://github.com/GoogleCloudPlatform/google-cloud-node/blob/master/docs/authentication.md
// These environment variables are set automatically on Google App Engine
const {PubSub} = require('@google-cloud/pubsub');

// Instantiate a pubsub client
const authClient = new OAuth2Client();
const pubsub = new PubSub();

const app = express();
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

const formBodyParser = bodyParser.urlencoded({extended: false});
const jsonBodyParser = bodyParser.json();

// List of all messages received by this instance
const messages = [];
const claims = [];
const tokens = [];

// The following environment variables are set by app.yaml when running on GAE,
// but will need to be manually set when running locally.
const {PUBSUB_VERIFICATION_TOKEN} = process.env;
const TOPIC = process.env.PUBSUB_TOPIC;

const topic = pubsub.topic(TOPIC);

// [START gae_flex_pubsub_index]
app.get('/fe', (req, res) => {
  res.render('index', {messages, tokens, claims});
});

app.post('/', formBodyParser, async (req, res, next) => {
  if (!req.body.payload) {
    res.status(400).send('Missing payload');
    return;
  }

  const data = Buffer.from(req.body.payload);
  try {
    const messageId = await topic.publish(data);
    res.status(200).send(`Message ${messageId} sent.`);
  } catch (error) {
    next(error);
  }
});
// [END gae_flex_pubsub_index]

// [START gae_flex_pubsub_push]
app.post('/pubsub/fe', jsonBodyParser, async (req, res) => {
  if (req.query.token !== PUBSUB_VERIFICATION_TOKEN) {
    res.status(400).send();
    return;
  }

  // The message is a unicode string encoded in base64.
  const message = Buffer.from(req.body.data, 'base64').toString(
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
    files.reduce((promiseChain, item) => {
      return promiseChain.then(() => new Promise((resolve) => {
        asyncFunction(item, resolve, video)
      }))
    }, Promise.resolve()).then(video => {
      console.log('done', video)
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



  messages.push(`${message}`)

  res.status(200).send()

})
// [END gae_flex_pubsub_push]

async function asyncFunction(file, cb, video) {
  // We need to make unique name (e.g. path/127167261-1.jpg)
  const newFileName = file.replace('/frame', '/' + video[Datastore.KEY].id)
  await fs.rename(file, newFileName, (err) => {
      if ( err ) console.log('ERROR: ' + err)
  })
  console.log(newFileName)
  // Uploads a local file to the bucket
  await bucket.upload(newFileName, {
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
  const publicUrl = `https://storage.googleapis.com/${CLOUD_BUCKET}/${newFileName.split('/').pop()}`
  bucket.file(publicUrl.split('/').pop()).makePublic((err) => { if (err) console.error(err) })
  let entity = {
    key: keyFrame,
    data: { imageUrl: publicUrl, predictions: null}
  }

  datastore.save(entity,
  (err) => {
    if (!err) {
      console.log('Frame saved successfully.')
      // console.log(entity['key'].id)
      // Push the reference of the frame as a property of video
      video['frames'].push(entity['key'].id)
      console.log(video['frames'])
    }
  })
  cb(video)
}

// [START gae_flex_pubsub_auth_push]
app.post('/pubsub/authenticated-push', jsonBodyParser, async (req, res) => {
  // Verify that the request originates from the application.
  if (req.query.token !== PUBSUB_VERIFICATION_TOKEN) {
    res.status(400).send('Invalid request');
    return;
  }

  // Verify that the push request originates from Cloud Pub/Sub.
  try {
    // Get the Cloud Pub/Sub-generated JWT in the "Authorization" header.
    const bearer = req.header('Authorization');
    const [, token] = bearer.match(/Bearer (.*)/);
    tokens.push(token);

    // Verify and decode the JWT.
    const ticket = await authClient.verifyIdToken({
      idToken: token,
      audience: 'example.com',
    });

    const claim = ticket.getPayload();
    claims.push(claim);
  } catch (e) {
    res.status(400).send('Invalid token');
    return;
  }

  // The message is a unicode string encoded in base64.
  const message = Buffer.from(req.body.message.data, 'base64').toString(
    'utf-8'
  );

  messages.push(message);

  res.status(200).send();
});
// [END gae_flex_pubsub_auth_push]

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});

module.exports = app;
