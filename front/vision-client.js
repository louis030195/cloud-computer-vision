/* globals customElements */

import { LitElement, html } from 'lit-element'
import page from 'page'
import './vision-client-videos'
import './vision-client-frame-upload'
import VisionClientService from './services/vision-client-service'

class VisionClient extends LitElement {
  constructor () {
    super()
    this.page = 'frame-upload'

    this.backendHost = 'https://' + window.location.hostname

    this.visionClientService = new VisionClientService(this.backendHost)
  }

  static get properties () {
    return {
      page: { type: String },
      backendHost: { type: String },
      visionClientService: { type: Object }
    }
  }

  firstUpdated () {
    page('/', () => {
      this.page = 'videos'
    })
    page('/images', () => {
      this.page = 'videos'
    })
    page('/frame-upload', () => {
      this.page = 'frame-upload'
    })
    page()
  }

  render () {
    switch (this.page) {
      case 'videos':
        return html`<vision-client-videos
                        .visionClientService=${this.visionClientService}
                        ></vision-client-videos>`
      case 'frame-upload':
        return html`<vision-client-frame-upload
                        .visionClientService=${this.visionClientService}
                        ></vision-client-frame-upload>`
    }
  }
}

customElements.define('vision-client', VisionClient)