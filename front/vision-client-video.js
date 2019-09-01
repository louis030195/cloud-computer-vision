/* globals customElements */

import { LitElement, html, css } from 'lit-element'
import '@ividjs/ivid/dist/ivid.min.js'

class VisionClientVideo extends LitElement {
  static get properties () {
    return {
      visionClientService: { type: Object },
      id: { type: Object }, // Id in datastore
      width: { type: Number },
      height: { type: Number },
      url: { type: String },
      model: { type: Object }
    }
  }

  constructor () {
    super()
    this.model = {}
    this.url = ""
  }

  
  updated() {

  }


  firstUpdated() {
    console.log(this.url)
    this.model = {
      'video_A': {
        uid: 'video_A',
        src: this.url
      }
    }
    this.shadowRoot.getElementById("sample").setAttribute("model", JSON.stringify(model));
  }


  static get styles () {
    return css`
    `
  }

  render () {
    return html`
    <i-video id="sample" controls autoplay playsinline></i-video>
    `
  }
}

customElements.define('vision-client-video', VisionClientVideo)
