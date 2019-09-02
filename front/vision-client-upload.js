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
      incorrectFiles: { type: Array },
      count: { type: Number }
    }
  }

  constructor () {
    super()
    this.videos = []
    this.incorrectFiles = []
    this.count = 0
  }

  firstUpdated () {
    
  }

  updated () {

  }

  render () {
    return html`
        
        <paper-spinner id="uploadLoading"></paper-spinner>
        
        <label for="file">
        <paper-icon-button icon="file-upload"></paper-icon-button>
        <!-- Choose a file -->
        </label>
        <input id="file" class="inputfile" type="file" multiple accept="video/*,image/*" 
        data-multiple-caption="${this.count} files selected"
        @change=${this.fileHandler}>
        
        </input>
        
      ${(this.incorrectFiles.length > 0) ? 'Incorrect files:' : ''} ${this.incorrectFiles}
    `
  }

  static get styles () {
    return css`
      .inputfile {
        width: 0.1px;
        height: 0.1px;
        opacity: 0;
        overflow: hidden;
        position: absolute;
        z-index: -1;
      }
    `
  }

  fileHandler(e) {
    this.shadowRoot.getElementById('uploadLoading').active = true
    // object for allowed media types
    const accept = {
      video: ['video/mp4'],
      image: ['image/jpeg', 'image/png']
    }

    const incorrectFiles = []
    const files = Array.from(e.target.files)
    this.count = files.length
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
        this.shadowRoot.getElementById('uploadLoading').active = false
        timeoutPromise(fetch(`https://${process.env.REGION}-${process.env.PROJECT_ID}.cloudfunctions.net/queue_input`, { mode: 'no-cors' })
        , 1000)
    })
    this.incorrectFiles = incorrectFiles
  }
}

customElements.define('vision-client-upload', VisionClientUpload)
