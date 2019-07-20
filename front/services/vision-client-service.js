export default class VisionClientService {
    constructor(backendHost) {
        this.backendHost = backendHost
    }

    getVideos() {
        return window.fetch(`${this.backendHost}/api/videos`).then(r => r.json())
    }

    createFrame(title) {
      return fetch(`${this.backendHost}/api/frames`, {
        method: 'POST',
        cache: 'no-cache',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({title}), 
        })
        .then(response => response.json())
    }
}