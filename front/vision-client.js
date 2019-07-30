/* globals customElements */

import { LitElement, html } from 'lit-element'
import page from 'page'
import './vision-client-display'
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
      this.page = 'display'
    })
    page('/upload', () => {
      this.page = 'upload'
    })
    page()
  }

  renderPage () {
    switch (this.page) {
      case 'display':
        return html`<vision-client-display
                        .visionClientService=${this.visionClientService}
                        ></vision-client-display>`
      case 'upload':
        return html`<vision-client-upload
                        .visionClientService=${this.visionClientService}
                        ></vision-client-upload>`
    }
  }

  render () {
    return html`
    <a href="/">display</a>
    <a href="/upload">upload</a>
    <a href="/api/frames">frames</a>
    <a href="/api/videos">videos</a>
    <a href="/api/predictions">predictions</a>
    <a href="/api/objects">objects</a>
    <a href="/api/classes">classes</a>
      ${this.renderPage()}`
  }
}

customElements.define('vision-client', VisionClient)
