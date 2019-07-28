/* globals customElements */

import { LitElement, html, css } from 'lit-element'
import './vision-client-frame'

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
    this.visionClientService.getVideos().then(videos => { this.videos = videos["items"] })
    this.visionClientService.getFrames().then(frames => { this.frames = frames["items"] })
  }

  render () {
    return html`
    <br />
      ${this.frames !== undefined ? this.frames.map((f, i) =>
      html`<vision-client-frame
      .visionClientService=${this.visionClientService}
      .objects=${f["objects"]}
      .imageUrl=${f["imageUrl"]}
      </vision-client-frame>`) : ''}
    `
  }

  static get styles () {
    return css`
    img {
        width:300px;
    }
    `
  }
}

customElements.define('vision-client-display', VisionClientDisplay)