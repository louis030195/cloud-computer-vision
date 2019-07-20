export default class VisionClientService {
    constructor(backendHost) {
        this.backendHost = backendHost
    }

    getVideos() {
        return window.fetch(`${this.backendHost}/api/videos`).then(r => r.json())
    }
}