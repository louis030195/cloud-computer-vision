/* globals customElements */

import { LitElement, html, css } from 'lit-element'

class VisionClientFrameUpload extends LitElement {
  static get properties () {
    return {
      visionClientService: { type: Object },
      videos: { type: Array }
    }
  }

  constructor () {
    super()
    this.videos = []
  }

  firstUpdated () {
    this.visionClientService.createFrame('truc').then(frame => { console.log(frame) })
  }

  render () {
    return html`
      frame-upload
    `
  }

  static get styles () {
    return css`
    `
  }
}

customElements.define('vision-client-frame-upload', VisionClientFrameUpload)