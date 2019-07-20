/* globals customElements */

import { LitElement, html, css } from 'lit-element'

class VisionClientVideos extends LitElement {
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
    this.visionClientService.getVideos().then(videos => { this.videos = videos })
  }

  render () {
    return html`
      gvhgfj
    `
  }

  static get styles () {
    return css`
    `
  }
}

customElements.define('vision-client-videos', VisionClientVideos)