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
    this.classes = []
  }

  static get styles () {
    return css`
    `
  }

  firstUpdated () {
    this.visionClientService.getVideos().then(videos => { this.videos = videos['items'] })
    this.visionClientService.getFrames().then(frames => { this.frames = frames['items'] })
    this.visionClientService.getClasses().then(classes => { this.classes = classes['items'] })
  }

  render () {
    return html`
    <br />
      ${this.frames !== undefined && this.classes != undefined ? this.frames.map((f, i) =>
        f['predictions'] !== null ?
        html`<vision-client-frame
        .width=${300}
        .height=${300}
        .visionClientService=${this.visionClientService}
        .predictionId=${f['predictions']}
        .id=${f['id']}
        .imageUrl=${f['imageUrl']}
        .classes=${this.classes}
        </vision-client-frame>` : '') : ''}
    `
  }
}

customElements.define('vision-client-display', VisionClientDisplay)
