/* globals customElements */

import { LitElement, html, css } from 'lit-element'

class VisionClientDisplay extends LitElement {
  static get properties () {
    return {
      visionClientService: { type: Object },
      videos: { type: Array },
      frames: { type: Array }
    }
  }

  constructor () {
    super()
    this.videos = []
    this.frames = []
  }

  firstUpdated () {
    this.visionClientService.getVideos().then(videos => { this.videos = videos })
    this.visionClientService.getFrames().then(frames => { this.frames = frames })
  }


  render () {
    return html`
      Main page i guess ${this.frames["items"] !== undefined ? this.frames["items"].map((f, i) => html`<img src=${f["imageUrl"]}>`) : ''}
    `
  }

  static get styles () {
    return css`
    `
  }
}

customElements.define('vision-client-display', VisionClientDisplay)