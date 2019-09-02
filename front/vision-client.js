/* globals customElements */

import { LitElement, html } from 'lit-element'
import page from 'page'
import './vision-client-display'
import './vision-client-upload'
import { timeoutPromise } from '../utils/promiseExtension'
import VisionClientService from './services/vision-client-service'
import '@polymer/paper-button/paper-button.js'
import '@polymer/app-layout/app-layout.js';

class VisionClient extends LitElement {
  static get properties () {
    return {
      page: { type: String },
      backendHost: { type: String },
      visionClientService: { type: Object },
      debug: { type: Boolean },
      billing: { type: String }
    }
  }

  constructor () {
    super()
    this.page = 'display'

    this.backendHost = window.location.origin
    if(window.location.hostname === 'localhost' && window.location.port === '3000') {
      this.backendHost = `http://localhost:9090/https://vision-client-dot-${process.env.PROJECT_ID}.appspot.com`
    }

    this.visionClientService = new VisionClientService(this.backendHost)
    this.debug = false
    this.billing = ''
  }

  firstUpdated () {
    this.visionClientService.getBilling(new Date().getMonth()).then(billing => this.billing = billing)
    page('/', () => {
      this.page = 'display'
    })
    page()
  }

  renderPage () {
    switch (this.page) {
      case 'display':
        return html`<vision-client-display
                        .visionClientService=${this.visionClientService}
                        ></vision-client-display>`
    }
  }

  render () {
    return html`
    <a href="/"><paper-button raised>Main Page</paper-button></a>
    <paper-button raised toggles @click=${() => this.debug = !this.debug}>Debug</paper-button>
    ${this.debug ? 
      html`
      Total billing: ${JSON.stringify(this.billing)}
      <a href="/api/frames"><paper-button raised>frames</paper-button></a>
      <a href="/api/videos"><paper-button raised>videos</paper-button></a>
      <a href="/api/predictions"><paper-button raised>predictions</paper-button></a>
      <a href="/api/objects"><paper-button raised>objects</paper-button></a>
      <a href="/api/classes"><paper-button raised>classes</paper-button></a>
      <paper-button raised class="indigo" 
      @click=${() => {
        timeoutPromise(fetch(`https://${process.env.REGION}-${process.env.PROJECT_ID}.cloudfunctions.net/queue_input`, { mode: 'no-cors' })
        , 1000)
      }
      }>
      Manual Predictions
      </paper-button>
      <paper-dialog>
          <h2>Header</h2>
          <paper-dialog-scrollable>
            Lorem ipsum...
          </paper-dialog-scrollable>
          <div class="buttons">
            <paper-button dialog-dismiss>Cancel</paper-button>
            <paper-button dialog-confirm autofocus>Accept</paper-button>
          </div>
        </paper-dialog>
      ` : html``}
    
    
    
      ${this.renderPage()}`
  }
}

customElements.define('vision-client', VisionClient)
