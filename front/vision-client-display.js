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
      this.WaitData()
  }

  async WaitData() {
    await this.visionClientService.getVideos().then(videos => { this.videos = videos["items"] })
    await this.visionClientService.getFrames().then(frames => { this.frames = frames["items"] })
    await this.visionClientService.getObject(this.frames[0]["objects"])
  }


  render () {
    return html`
      Main page i guess <br />${this.frames !== undefined ? this.frames.map((f, i) => html`<img src=${f["imageUrl"]}>`) : ''}
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