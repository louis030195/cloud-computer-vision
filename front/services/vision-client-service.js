export default class VisionClientService {
    constructor(backendHost) {
        this.backendHost = backendHost
    }

    getVideos() {
        return fetch(`${this.backendHost}/api/videos`).then(r => r.json())
    }

    getFrames() {
        return fetch(`${this.backendHost}/api/frames`).then(r => r.json())
    }

    getObjects() {
        return fetch(`${this.backendHost}/api/objects`).then(r => r.json())
    }

    getObject(id) {
        console.log('id:'+id)
        return fetch(`${this.backendHost}/api/object/${id}`).then(object => { console.log(object) })//.then(r => r.text())
    }

    createVideo(file) {
      const formData = new FormData()
      formData.append('file', file)
      return fetch(`${this.backendHost}/api/videos`, {
        method: 'POST',
        cache: 'no-cache',
        body: formData,
        })
        .then(response => response.json())
    }

    createFrame(file) {
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