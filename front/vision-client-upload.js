/* globals fetch, customElements */

import { LitElement, html, css } from 'lit-element'
import { timeoutPromise } from '../utils/promiseExtension'
import '@vaadin/vaadin-upload/vaadin-upload.js'
import '@polymer/paper-spinner/paper-spinner.js'

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
      <!--
      <vaadin-upload accept="video/*,image/*" @files-changed=${(e) => console.log('vaadin-upload changed')}>
        <span slot="drop-label">Drop your images / videos here</span>
      </vaadin-upload>
      -->
      <div class="centered">
        <paper-spinner id="loading"></paper-spinner>
        Upload some images or videos<input id="file" type="file" name="myFile" multiple accept="video/*,image/*" @change=${this.fileHandler}>
      </div>
      ${(this.incorrectFiles.length > 0) ? 'Incorrect files:' : ''} ${this.incorrectFiles}
    `
  }

  static get styles () {
    return css`
    .centered {
      background-color:pink;
      position: fixed; /* or absolute */
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
    `
  }

  fileHandler(e) {
    this.shadowRoot.getElementById('loading').active = true
    // object for allowed media types
    const accept = {
      video: ['video/mp4'],
      image: ['image/jpeg', 'image/png']
    }

    const incorrectFiles = []
    const files = Array.from(e.target.files)

    Promise.all(files.map(async (file) => {
      // if file type could be detected
      if (file !== null) {
        if (accept.image.indexOf(file.type) > -1) {
          await this.visionClientService.createFrame(file)
        } else if (accept.video.indexOf(file.type) > -1) {
          await this.visionClientService.createVideo(file)
        } else {
          incorrectFiles.push(file.name)
        }
      }
    }))
    .then(() => {
        this.shadowRoot.getElementById('loading').active = false
        console.log('fetch')
        timeoutPromise(fetch(`https://${process.env.REGION}-${process.env.PROJECT_ID}.cloudfunctions.net/queue_input`, { mode: 'no-cors' })
        , 1000)
    })
    this.incorrectFiles = incorrectFiles
  }
}

customElements.define('vision-client-upload', VisionClientUpload)
