/* globals fetch, FormData */
export default class VisionClientService {
  constructor (backendHost) {
    this.backendHost = backendHost
  }


  getFrames () {
    return fetch(`${this.backendHost}/api/frames`).then(r => r.json())
  }

  getFramesPredictionsObjects () {
    return fetch(`${this.backendHost}/api/frames/predictions/objects`).then(r => r.json())
  }

  resetPredictions () {
    return fetch(`${this.backendHost}/api/frames/predictions/reset`).then(r => r.json())
  }

  deleteFrame (id) {
    return fetch(`${this.backendHost}/api/frames/${id}`, {
      method: 'DELETE',
      cache: 'no-cache'
    })
      .then(response => response.json())
  }

  createFrame (file) {
    const formData = new FormData()
    formData.append('file', file)
    return fetch(`${this.backendHost}/api/frames`, {
      method: 'POST',
      cache: 'no-cache',
      body: formData
    }).then(response => response.json())
  }

  getVideos () {
    return fetch(`${this.backendHost}/api/videos`).then(r => r.json())
  }

  createVideo (file) {
    const formData = new FormData()
    formData.append('file', file)
    return fetch(`${this.backendHost}/api/videos`, {
      method: 'POST',
      cache: 'no-cache',
      body: formData
    }).then(response => response.json())
  }

  getPredictions () {
    return fetch(`${this.backendHost}/api/predictions`).then(r => r.json())
  }

  getPrediction (id) {
    return fetch(`${this.backendHost}/api/predictions/${id}`).then(r => r.json())
  }

  getPredictionObjects (id) {
    return fetch(`${this.backendHost}/api/predictions/${id}/objects`).then(r => r.json())
  }

  getObject (id) {
    return fetch(`${this.backendHost}/api/objects/${id}`).then(r => r.json())
  }

  getClasses () {
    return fetch(`${this.backendHost}/api/classes`).then(r => r.json())
  }

  getClass (dataset) {
    return fetch(`${this.backendHost}/api/classes/${dataset}`).then(r => r.json())
  }

  getBilling () {
    return fetch(`${this.backendHost}/api/misc/billings`).then(r => r.json())
  }

  getBilling (id) {
    return fetch(`${this.backendHost}/api/misc/billings/${id}`).then(r => r.json())
  }

  getQueueLength () {
    return fetch(`${this.backendHost}/api/queues/length`).then(r => r.json())
  }

  updatePredictor (params) {
    return fetch(`${this.backendHost}/api/misc/functions/predictor`, {
      method: 'PUT',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    }).then(response => response.json())
  }

  getModels () {
    return fetch(`${this.backendHost}/api/misc/ai/models`).then(r => r.json())
  }

  getModel (model) {
    return fetch(`${this.backendHost}/api/misc/ai/models/${model}`).then(r => r.json())
  }

  getModelVersions (model) {
    return fetch(`${this.backendHost}/api/misc/ai/models/${model}/versions`).then(r => r.json())
  }
}
