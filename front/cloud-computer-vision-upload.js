/* globals fetch, customElements */

import { LitElement, html, css } from 'lit-element'
import { timeoutPromise } from '../utils/promiseExtension'
import '@vaadin/vaadin-upload/vaadin-upload.js'
import '@polymer/paper-spinner/paper-spinner.js'

class CloudComputerVisionUpload extends LitElement {
  static get properties () {
    return {
      service: { type: Object },
      videos: { type: Array },
      incorrectFiles: { type: Array },
      count: { type: Number },
      uploading: { type: Boolean }
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
        <label>${this.count > 0 && this.uploading ? `${this.count} files selected` : "Upload"}</label>
        <paper-icon-button icon="file-upload"></paper-icon-button>
        </label>
        <input id="file" class="inputfile" type="file" multiple accept="video/*,image/*" 
        data-multiple-caption="${this.count} files selected"
        @change=${this.fileHandler}>
        
        </input>
        <paper-toast id="toastLogin"></paper-toast>        
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

      label {
        -webkit-user-select: none; /* Safari */        
        -moz-user-select: none; /* Firefox */
        -ms-user-select: none; /* IE10+/Edge */
        user-select: none; /* Standard */
      }
      @media (max-width: 600px) {
        label label {
          display: none;
        }
      }
    `
  }

  fileHandler(e) {
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
          await this.service.createFrame(file)
        } else if (accept.video.indexOf(file.type) > -1) {
          await this.service.createVideo(file)
        } else {
          incorrectFiles.push(file.name)
        }
        this.shadowRoot.getElementById('uploadLoading').active = true
        this.uploading = true
      }
    }))
    .then(() => {
        this.shadowRoot.getElementById('uploadLoading').active = false
        this.uploading = false
        this.count = 0
        timeoutPromise(fetch(`https://${process.env.REGION}-${process.env.PROJECT_ID}.cloudfunctions.net/queue_input`, { mode: 'no-cors' })
        , 1000)
    }).catch(err => {
      const t = this.shadowRoot.getElementById('toastLogin')
      t.text = "You must login to upload files !" 
      t.open()
    })
    this.incorrectFiles = incorrectFiles
  }
}

customElements.define('cloud-computer-vision-upload', CloudComputerVisionUpload)
