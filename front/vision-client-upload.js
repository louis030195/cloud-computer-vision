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
  }

  firstUpdated () {
    
  }

  updated () {
    
  }

  render () {
    return html`
      Select a file: <input id="file" type="file" name="myFile" multiple accept="video/*,image/*" @change=${(e) =>
      {
        console.log('change')
        // object for allowed media types
        let accept = {
          video : ["video/mp4"],
          image : ["image/jpeg", "image/png"]
        // text   : ["text/plain", "text/css", "application/xml", "text/html"]
        };

        let incorrectFiles = []
        Array.from(e.target.files).forEach((file) => {

          // if file type could be detected
          if (file !== null) {
              if (accept.image.indexOf(file.type) > -1) {
                this.visionClientService.createFrame(file)
              } else if (accept.video.indexOf(file.type) > -1) {
                this.visionClientService.createVideo(file)
              } else {
                incorrectFiles.push(file.name)
              }
          }
          // let date = file.lastModifiedDate
          // this.visionClientService.createFrame(`${date.getFullYear()}-${date.getMonth() < 10 ? '0' + date.getMonth() : date.getMonth()}-${date.getDate()}`)
        })
        this.incorrectFiles = incorrectFiles
      }}>
    `
  }

  static get styles () {
    return css`
    `
  }
}

customElements.define('vision-client-upload', VisionClientUpload)