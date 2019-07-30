/* globals fetch, FormData */
export default class VisionClientService {
  constructor (backendHost) {
    this.backendHost = backendHost
  }

  getVideos () {
    return fetch(`${this.backendHost}/api/videos`).then(r => r.json())
  }

  getFrames () {
    return fetch(`${this.backendHost}/api/frames`).then(r => r.json())
  }

  getPrediction (id) {
    return fetch(`${this.backendHost}/api/predictions/${id}`).then(r => r.json())
  }

  getObject (id) {
    return fetch(`${this.backendHost}/api/objects/${id}`).then(r => r.json())
  }

  getClass (id) {
    return fetch(`${this.backendHost}/api/classes/${id}`).then(r => r.json())
  }

  createVideo (file) {
    const formData = new FormData()
    formData.append('file', file)
    return fetch(`${this.backendHost}/api/videos`, {
      method: 'POST',
      cache: 'no-cache',
      body: formData
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
    })
      .then(response => response.json())
  }
}
