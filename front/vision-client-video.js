/* globals customElements */

import { LitElement, html, css } from 'lit-element'

class VisionClientVideo extends LitElement {
  static get properties () {
    return {
      visionClientService: { type: Object },
      id: { type: Object }, // Id in datastore
      width: { type: Number },
      height: { type: Number }
    }
  }

  constructor () {
    super()
  }

  
  updated() {

  }




  static get styles () {
    return css`
    `
  }

  render () {
    return html`
    `
  }
}

customElements.define('vision-client-video', VisionClientVideo)
