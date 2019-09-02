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
      <!--
      <vaadin-upload accept="video/*,image/*" @files-changed=${(e) => console.log('vaadin-upload changed')}>
        <span slot="drop-label">Drop your images / videos here</span>
      </vaadin-upload>
      -->
      <div class="centered">
        <paper-spinner id="uploadLoading"></paper-spinner>
        
        <input id="file" class="inputfile" type="file" multiple accept="video/*,image/*" 
        data-multiple-caption="${this.count} files selected"
        @change=${this.fileHandler}>
      </div>
      ${(this.incorrectFiles.length > 0) ? 'Incorrect files:' : ''} ${this.incorrectFiles}
    `
  }

  static get styles () {
    return css`


    .inputfile::-webkit-file-upload-button {
      visibility: hidden;
    }
    .inputfile::before {
      content: 'Upload images or videos';
      display: inline-block;
      background: linear-gradient(top, #f9f9f9, #e3e3e3);
      border: 1px solid #999;
      border-radius: 3px;
      padding: 5px 8px;
      outline: none;
      white-space: nowrap;
      -webkit-user-select: none;
      cursor: pointer;
      text-shadow: 1px 1px #fff;
      font-weight: 700;
      font-size: 10pt;
      margin: 20px;
    }
    .inputfile:hover::before {
      border-color: black;
    }
    .inputfile:active::before {
      background: -webkit-linear-gradient(top, #e3e3e3, #f9f9f9);
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
