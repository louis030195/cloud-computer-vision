'use strict';

const {google} = require('googleapis')
const path = require('path')

const ml = google.ml({
  version: 'v1',
  projectId: process.env.PROJECT_ID,
  keyFilename: path.join(__dirname, '..', '..', process.env.GOOGLE_APPLICATION_CREDENTIALS)
})

function modelsGet(authClient, projectId, model) {
  let request = {
    name: `projects/${projectId}/models/${model}`,

    // This is a "request-level" option
    auth: authClient
  }

  ml.projects.models.get(request).then(res => console.log(res.data)).catch(console.log)
}

function modelsList(authClient, projectId) {
  let request = {
    parent: `projects/${projectId}`,

    // This is a "request-level" option
    auth: authClient
  }

  ml.projects.models.list(request).then(res => console.log(res.data)).catch(console.log)
}

function modelsVersionsList(authClient, projectId, model) {
  let request = {
    parent: `projects/${projectId}/models/${model}`,

    // This is a "request-level" option
    auth: authClient
  }

  ml.projects.models.versions.list(request).then(res => console.log(res.data)).catch(console.log)
}
/*
google.auth.getApplicationDefault((err, authClient, projectId) => {
  if (err) {
    console.log('Authentication failed because of ', err)
    return
  }
  if (authClient.createScopedRequired) {
    let scopes = ['https://www.googleapis.com/auth/cloud-platform']
    authClient = authClient.createScoped(scopes)
  }
  // modelsGet(authClient, projectId, 'm1')
  // modelsList(authClient, projectId)
  modelsVersionsList(authClient, projectId, 'm1')
})*/

async function run() {
  // This method looks for the GCLOUD_PROJECT and GOOGLE_APPLICATION_CREDENTIALS
  // environment variables.
  const auth = new google.auth.GoogleAuth({
    // Scopes can be specified either as an array or as a single, space-delimited string.
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  });
  const authClient = await auth.getClient();

  // obtain the current project Id
  const projectId = await auth.getProjectId();
  modelsVersionsList(authClient, projectId, 'm1')
}
run()