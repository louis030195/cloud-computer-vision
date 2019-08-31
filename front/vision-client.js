/* globals customElements */

import { LitElement, html } from 'lit-element'
import page from 'page'
import './vision-client-display'
import './vision-client-upload'
import VisionClientService from './services/vision-client-service'
// TODO: webpack break with bigquery ?
// https://github.com/request/request/issues/1529
// https://github.com/jsoma/tabletop/issues/158
// https://github.com/mysqljs/mysql/issues/1563
// import { totalInvoice } from '../utils/billing'

class VisionClient extends LitElement {
  constructor () {
    super()
    this.page = 'upload'

    this.backendHost = window.location.origin
    if(window.location.hostname === 'localhost' && window.location.port === '3000') {
      this.backendHost = 'http://localhost:9090/https://vision-client-dot-wildlife-247309.appspot.com'
    }

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
    // this.billing = totalInvoice()
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
    Total billing: ${this.billing}
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
