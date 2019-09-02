/* globals customElements */

import { LitElement, html, css } from 'lit-element'

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

  }


  static get styles () {
    return css`
    `
  }

  render () {
    return html`
    <video width="${this.width}" height="${this.height}" controls>
      <source src="${this.url}" type="video/${this.url.substring(this.url.length - 3, this.url.length)}">
    Your browser does not support the video tag.
    </video>
    `
  }
}

customElements.define('vision-client-video', VisionClientVideo)
