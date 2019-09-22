/* globals customElements */

import { LitElement, html } from 'lit-element'
import page from 'page'
import './cloud-computer-vision-display'

class CloudComputerVision extends LitElement {
  static get properties () {
    return {
      page: { type: String }
    }
  }

  constructor () {
    super()
    this.page = 'display'
  }

  firstUpdated () {
    page('/', () => {
      this.page = 'display'
    })
    page()
  }

  renderPage () {
    switch (this.page) {
      case 'display':
        return html`<cloud-computer-vision-display
                        ></cloud-computer-vision-display>`
    }
  }

  render () {
    return html`
      ${this.renderPage()}`
  }
}

customElements.define('cloud-computer-vision', CloudComputerVision)
