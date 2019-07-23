/* globals customElements */

import { LitElement, html } from 'lit-element'
import page from 'page'
import './vision-client-videos'
import './vision-client-upload'
import VisionClientService from './services/vision-client-service'

class VisionClient extends LitElement {
  constructor () {
    super()
    this.page = 'upload'

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
      this.page = 'frames'
    })
    page('/upload', () => {
      this.page = 'upload'
    })
    page()
  }

 renderPage() {
    switch (this.page) {
      case 'videos':
        return html`<vision-client-videos
                        .visionClientService=${this.visionClientService}
                        ></vision-client-videos>`
      case 'upload':
        return html`<vision-client-upload
                        .visionClientService=${this.visionClientService}
                        ></vision-client-upload>`
    }
 }

  render () {

      return html`
    <a href="/upload">upload</a>
    <a href="/api/frames">frames</a>
    <a href="/api/videos">videos</a>
      ${this.renderPage()}`
  }
}

customElements.define('vision-client', VisionClient)