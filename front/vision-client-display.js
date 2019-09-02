/* globals customElements */

import { LitElement, html, css } from 'lit-element'
import page from 'page'

import './vision-client-upload'
import './vision-client-frame'
import './vision-client-video'
import { timeoutPromise } from '../utils/promiseExtension'
import VisionClientService from './services/vision-client-service'

import '@google-web-components/google-chart/google-chart.js'
import '@polymer/paper-spinner/paper-spinner.js'
import '@polymer/paper-button/paper-button.js'
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/app-layout/app-scroll-effects/app-scroll-effects.js';


class VisionClientDisplay extends LitElement {
  static get properties () {
    return {
      page: { type: String },
      backendHost: { type: String },
      visionClientService: { type: Object },
      debug: { type: Boolean },
      billing: { type: String },
      visionClientService: { type: Object },
      videos: { type: Array },
      frames: { type: Array },
      predictions: { type: Array },
      objects: { type: Array },
      pagination: { type: Number },
      queueLength: { type: Number},
      countDetectionClasses: { type: Array },
      filteredClass: { type: Array }
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


    this.videos = []
    this.frames = []
    this.classes = []
    this.predictions = []
    this.objects = []
    this.pagination = 0
    this.queueLength = 0
    this.countDetectionClasses = []
    this.filteredClass = []
  }

  static get styles () {
    return css`
    body {
      /* No margin on body so toolbar can span the screen */
      margin: 0;
    }

    app-toolbar {
      /* Toolbar is the main header, so give it some color */
      background-color: #1E88E5;
      font-family: 'Roboto', Helvetica, sans-serif;
      color: white;
      --app-toolbar-font-size: 24px;
    }

    @media (max-width: 600px) {
      app-toolbar {
        --app-toolbar-font-size: 18px;
      }
    }

    .wrapper {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      grid-column-gap: 10px;
      grid-row-gap: 20px;
      width:100%;
    }
    @media (max-width: 600px) {
      .wrapper {
        grid-template-columns: repeat(3, 1fr);
      }
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

    .center paper-button {
      float: left;
      padding: 8px 16px;
      margin: 0 4px;
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

    .queue {
      display: inline-block; 
      vertical-align: middle; 
      line-height: 200px;
      text-align: center; 
    }
    `
  }

  firstUpdated() {
    this.visionClientService.getBilling(new Date().getMonth()).then(billing => this.billing = billing)
    page('/', () => {
      this.page = 'display'
    })
    page()

    this.visionClientService.getClasses().then(classes => { this.classes = classes['items'] })
                                         .then(() => this.resetFilter())
    this.setIntervalAndExecute(() => {
      this.refresh()
    }, 10000)
  }
  
  updated (changedProperties) {
    changedProperties.forEach((oldValue, propName) => {
      if (propName.includes('frames')) {
        this.updateGraphics()
      }
    })

  }

  render () { //TODO: https://stackoverflow.com/questions/19841859/full-page-drag-and-drop-files-website
    return html`
      ${this.displayHeader()}
      ${this.debug ? html`
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
      </paper-button>` : html``}

      ${this.renderPage()}
      
      <!-- Statistics & vizualisation part -->
      <google-chart
      id="gchart"
      options='{"title": "Class occurences"}'
      cols='[{"label":"Class", "type":"string"}, {"label":"Occurences", "type":"number"}]'
      @google-chart-select=${(e) => {
        const chart = this.shadowRoot.getElementById("gchart")
        this.filteredClass = [parseInt(this.classes.find(c => c.name.includes(chart.rows[chart.selection[0].row][0])).id, 10)]
        this.pagination = 0
      }}
      rows='${JSON.stringify(this.countDetectionClasses.map(f => [f.element - 1 < this.classes.length ? this.classes[f.element - 1].name : 'unknown', f.occurences]))}''>
      </google-chart>

      <!-- Main part, pagination, tools, content -->
      
      <div class="center">
        <div class="pagination">
          <paper-button raised @click=${this.resetFilter}>Reset filters</paper-button>
          <a @click="${this.previousPage}">&laquo;</a>
          ${this.frames !== undefined ? 
            new Array(Math.floor(this.frames.filter(f => f.predictions['objects']
              .some(o => this.filteredClass.some(c => c === o['detection_classes']), 10)).length / 10)).fill().map((f, i) =>
            html`<a class="${this.pagination == i ? `active` : ``}" @click="${this.goTo}">${i}</a>`
          ) : ''}
          <a @click="${this.nextPage}">&raquo;</a>
        </div>
      </div>
      <div id="content">
        <div class="wrapper">
        ${this.videos !== undefined ? this.videos.slice(this.pagination * 10, this.pagination * 10 + 10).map((v, i) =>
          html`<vision-client-video
          .width=${300}
          .height=${300}
          .visionClientService=${this.visionClientService}
          .url=${v.imageUrl}
          </vision-client-video>`) : ''}
        ${this.frames !== undefined ? 
          this.frames.filter(f => f.predictions['objects'].some(o => this.filteredClass.some(c => c === o['detection_classes']), 10))
                    .slice(this.pagination * 10, this.pagination * 10 + 10).map((f, i) =>
          html`
          <vision-client-frame
          .width=${300}
          .height=${300}
          .visionClientService=${this.visionClientService}
          .objects=${f.predictions.objects}
          .url=${f.imageUrl}
          .classes=${this.classes}
          .deleteAction=${() => 
            {
              this.visionClientService.deleteFrame(f.id).then(() => this.requestBack())
            }}
          </vision-client-frame>`) : ''}
        </div>
      </div>
    `
  }

  displayHeader () {
    return html`
      <app-header fixed reveals>
        <app-toolbar class="toolbar">
          <div id="main-title" main-title>Cloud Computer Vision</div>
            <!-- Display information about the current queue of processes content -->
            <div class="queue">
              <paper-spinner id="queueLoading"></paper-spinner>
              ${this.queueLength} <!-- elements being processed -->
            </div>
            <!-- File upload component -->
            <vision-client-upload .visionClientService=${this.visionClientService}>
            </vision-client-upload>
            <paper-icon-button icon="refresh" @click=${this.refresh}></paper-icon-button>
            <paper-icon-button icon="build" toggles @click=${() => this.debug = !this.debug}>Debug</paper-button>
        </app-toolbar>
      </app-header>
    `
  }

  renderPage () {
    
  }

  setIntervalAndExecute(fn, t) {
    fn();
    return(setInterval(fn, t));
  }

  refresh() {
    this.visionClientService.getFramesPredictionsObjects().then(frames => { 
      // Only update prop if number of frames changed or there is more predictions
      if (frames['items'].length !== this.frames.length ||
          frames['items'].filter(f => f.predictions !== null).length > this.frames.filter(f => f.predictions !== null).length) {
        this.frames = frames['items']
      }
    })
    this.visionClientService.getVideos().then(videos => { 
      // Only update prop if number of videos changed or there is more predictions
      if (videos['items'].length !== this.videos.length || 
          videos['items'].filter(f => f.predictions !== null).length > this.videos.filter(f => f.predictions !== null).length) {
        this.videos = videos['items'] 
      }
    })
    this.visionClientService.getQueueLength().then(queueLength => this.queueLength = queueLength)
                                             .then(() => this.shadowRoot.getElementById('queueLoading').active = !(this.queueLength === 0))
  }

  resetFilter() {
    this.filteredClass = this.classes.map(c => parseInt(c.id, 10))
    this.pagination = 0
  }

  uniq(arr) {
    var seen = {}
    return a.filter(function(item) {
        return seen.hasOwnProperty(item) ? false : (seen[item] = true)
    })
  }

  mode(arr) {
    return arr.sort((a,b) =>
          arr.filter(v => v===a).length
        - arr.filter(v => v===b).length
    ).pop()
  }
  
  /*
  * Return the number of occurences of an element in an array
  * Optionally, it can be returned sorted in descending order
  * And also be limited to a number of elements
  */
  countElements(arr, sortByOccurences = true, limit = undefined) {
    let a = [], b = [], prev
    
    arr.sort();
    for ( let i = 0; i < arr.length; i++ ) {
        if ( arr[i] !== prev ) {
            a.push(arr[i])
            b.push(1)
        } else {
            b[b.length-1]++;
        }
        prev = arr[i]
    }
    
    let result = a.map((e, i) => { return { element: e, occurences: b[i] }})
    
    if (sortByOccurences) {
      result.sort((a, b) => {
        return ((a.occurences > b.occurences) ? -1 : ((a.occurences == b.occurences) ? 0 : 1))
      })
      // I don't see any point in taking limit of unsorted elements
      if (limit !== undefined) {
        result = result.slice(0, limit)
      }
    }
    return result
  }

  updateGraphics() {
    this.countDetectionClasses = this.countElements(this.frames.map(frame => frame.predictions.objects)
                                                              .flat()
                                                              .filter(object => object.detection_scores > 0.6)
                                                              .map(object => object.detection_classes), true)
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
