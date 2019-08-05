/* globals customElements */

import { LitElement, html, css } from 'lit-element'

class VisionClientUpload extends LitElement {
  static get properties () {
    return {
      visionClientService: { type: Object },
      videos: { type: Array },
      incorrectFiles: { type: Array }
    }
  }

  constructor () {
    super()
    this.videos = []
    this.incorrectFiles = []
  }

  firstUpdated () {

  }

  updated () {

  }

  render () {
    return html`
      Select a file: <input id="file" type="file" name="myFile" multiple accept="video/*,image/*" @change=${(e) => {
    // object for allowed media types
    const accept = {
      video: ['video/mp4'],
      image: ['image/jpeg', 'image/png']
      // text   : ["text/plain", "text/css", "application/xml", "text/html"]
    }

    const incorrectFiles = []
    Array.from(e.target.files).forEach((file) => {
      // if file type could be detected
      if (file !== null) {
        if (accept.image.indexOf(file.type) > -1) {
          this.visionClientService.createFrame(file)
        } else if (accept.video.indexOf(file.type) > -1) { // Video is not implemented yet
          // this.visionClientService.createVideo(file)
          // this.visionClientService.extractFrames(file)
        } else {
          incorrectFiles.push(file.name)
        }
      }
    })
    this.incorrectFiles = incorrectFiles
  }}>
      ${(this.incorrectFiles.length > 0) ? 'Incorrect files:' : ''} ${this.incorrectFiles}
    `
  }

  static get styles () {
    return css`
    `
  }
}

customElements.define('vision-client-upload', VisionClientUpload)
