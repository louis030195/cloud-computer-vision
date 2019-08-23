/* globals customElements */

import { LitElement, html, css } from 'lit-element'
import './vision-client-frame'

class VisionClientDisplay extends LitElement {
  static get properties () {
    return {
      visionClientService: { type: Object },
      videos: { type: Array },
      frames: { type: Array },
      pagination: { type: Number }
    }
  }

  constructor () {
    super()
    this.videos = []
    this.frames = []
    this.classes = []
    this.pagination = 0
  }

  static get styles () {
    return css`
    .wrapper {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      grid-column-gap: 10px;
      grid-row-gap: 20px;
      width:100%;
    }
    .wrapper > img {
      max-width:100%;
    }

    a {
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      -khtml-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }

    .center {
      text-align: center;
    }
    
    .pagination {
      display: inline-block;
    }
    
    .pagination a {
      color: black;
      float: left;
      padding: 8px 16px;
      text-decoration: none;
      transition: background-color .3s;
      border: 1px solid #ddd;
      margin: 0 4px;
    }
    
    .pagination a.active {
      background-color: #4CAF50;
      color: white;
      border: 1px solid #4CAF50;
    }
    
    .pagination a:hover:not(.active) {background-color: #ddd;}
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
    ${this.pagination}
    <div class="center">
      <div class="pagination">
        <a @click="${this.previousPage}">&laquo;</a>
        ${new Array(Math.floor(this.frames.length / 10)).fill().map((f, i) =>
          html`<a class="${this.pagination == i ? `active` : ``}" @click="${this.goTo}">${i}</a>`
        )}
        <a @click="${this.nextPage}">&raquo;</a>
      </div>
    </div>
    <div id="content">
      <div class="wrapper">
      ${this.frames !== undefined && this.classes != undefined ? this.frames.slice(this.pagination, this.pagination + 10).map((f, i) =>
        html`<vision-client-frame
        .width=${300}
        .height=${300}
        .visionClientService=${this.visionClientService}
        .predictionId=${f['predictions']}
        .id=${f['id']}
        .imageUrl=${f['imageUrl']}
        .classes=${this.classes}
        </vision-client-frame>`) : ''}
      </div>
    </div>
      
    `
  }

  goTo(e) {
    this.pagination = parseInt(e.path[0].text, 10)
  }

  previousPage() {
    this.pagination = this.pagination > 0 ? this.pagination - 1 : 0
  }

  nextPage() {
    const lastPage = Math.floor(this.frames.length / 10) - 1
    this.pagination = this.pagination < lastPage ? this.pagination + 1 : lastPage
  }
}

customElements.define('vision-client-display', VisionClientDisplay)
