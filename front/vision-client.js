/* globals customElements */

import { LitElement, html } from 'lit-element'
import page from 'page'
import './vision-client-videos'
import VisionClientService from './services/vision-client-service'

class VisionClient extends LitElement {
  constructor () {
    super()
    this.page = 'videos'

    this.backendHost = 'http://' + window.location.hostname

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
    page()
  }

  render () {
    switch (this.page) {
      case 'videos':
        return html`<vision-client-videos
                        .visionClientService=${this.visionClientService}
                        ></vision-client-videos>`
    }
  }
}

customElements.define('vision-client', VisionClient)