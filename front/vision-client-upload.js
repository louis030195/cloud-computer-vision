/* globals fetch, customElements */

import { LitElement, html, css } from 'lit-element'
import '@vaadin/vaadin-upload/vaadin-upload.js'
import '@granite-elements/granite-spinner/granite-spinner.js'

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
    return html`<!--
      <vaadin-upload accept="video/*,image/*" @files-changed=${(e) => console.log('vaadin-upload changed')}>
        <span slot="drop-label">Drop your images / videos here</span>
      </vaadin-upload>
      <vaadin-progress-bar indeterminate value="0"></vaadin-progress-bar>-->
      <granite-spinner id="loading"
      color="#ff4081" 
      line-width="2em"></granite-spinner>
      Select a file: <input id="file" type="file" name="myFile" multiple accept="video/*,image/*" @change=${(e) => {
        this.shadowRoot.getElementById('loading').active = true
    // object for allowed media types
    const accept = {
      video: ['video/mp4'],
      image: ['image/jpeg', 'image/png']
      // text   : ["text/plain", "text/css", "application/xml", "text/html"]
    }

    const incorrectFiles = []
    const files = Array.from(e.target.files)
    new Promise(resolve => {
      files.forEach((file) => {
        // if file type could be detected
        if (file !== null) {
          if (accept.image.indexOf(file.type) > -1) {
            console.log('image')
            this.visionClientService.createFrame(file).then(console.log('uploaded'))
          } else if (accept.video.indexOf(file.type) > -1) {
            console.log('video')
            this.visionClientService.createVideo(file).then(console.log('uploaded'))
          } else {
            incorrectFiles.push(file.name)
          }
        }
      })
      resolve()
    })
    //.then(fetch(`https://${process.env.REGION}-${process.env.PROJECT_ID}.cloudfunctions.net/queue_input`, { mode: 'no-cors' }))
    .then(setTimeout(() =>  { // TODO: settimeout shouldn't block backend
        this.shadowRoot.getElementById('loading').active = false
        
        this.timeoutPromise(fetch(`https://${process.env.REGION}-${process.env.PROJECT_ID}.cloudfunctions.net/queue_input`, { mode: 'no-cors' })
        , 1000)
    }, 50000)) // Wait a bit before calling input, so the api have time to update datastore and don't wait request response
    this.incorrectFiles = incorrectFiles
  }}>
      ${(this.incorrectFiles.length > 0) ? 'Incorrect files:' : ''} ${this.incorrectFiles}
    `
  }

  // https://stackoverflow.com/questions/46946380/fetch-api-request-timeout
  timeoutPromise(promise, timeout) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve()
      }, timeout)
      promise.then(resolve, reject)
    })
  }

  static get styles () {
    return css`
    `
  }
}

customElements.define('vision-client-upload', VisionClientUpload)
