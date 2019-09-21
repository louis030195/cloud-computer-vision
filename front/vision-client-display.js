/* globals customElements */

import { LitElement, html, css } from 'lit-element'
import page from 'page'

import './vision-client-upload'
import './vision-client-frame'
import './vision-client-video'
import { timeoutPromise } from '../utils/promiseExtension'
import { rainbow, uniq, countElements } from '../utils/miscFront'
import VisionClientService from './services/vision-client-service'

import '@google-web-components/google-chart/google-chart.js'
import '@polymer/paper-spinner/paper-spinner.js'
import '@polymer/paper-button/paper-button.js'
import '@polymer/paper-icon-button/paper-icon-button.js'
import '@polymer/iron-icons/iron-icons.js'
import '@polymer/app-layout/app-scroll-effects/app-scroll-effects.js'
import '@polymer/paper-input/paper-input.js'
import '@polymer/paper-toast/paper-toast.js'
import '@polymer/paper-checkbox/paper-checkbox.js'
import '@polymer/paper-slider/paper-slider.js'

import "side-drawer"


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
      filteredClass: { type: Array },
      models: { type: Object },
      scoreTreshold: { type: Number } // At which thresold we show boxes
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
    this.models = []
    this.versions = []
    this.scoreTreshold = 60
  }

  static get styles () {
    return css`

    app-toolbar {
      /* Toolbar is the main header, so give it some color */
      background-color: #dcc48e;
      font-family: 'Roboto', Helvetica, sans-serif;
      color: #505168;
      --app-toolbar-font-size: 24px;
    }

    @media (max-width: 600px) {
      app-toolbar {
        --app-toolbar-font-size: 18px;
      }
      .wrapper {
        grid-template-columns: repeat(3, 1fr);
      }
      label {
        display: none;
      }
      #gchart {
        width: 80%;
      }
    }
    #gchart {
      width: 40%;
      display: inline-block;
    }

    .wrapper {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      grid-column-gap: 10px;
      grid-row-gap: 20px;
      width:100%;
    }

    @media (max-width: 400px) {
      .wrapper {
        grid-template-columns: repeat(2, 1fr);
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
    label {
      -webkit-user-select: none; /* Safari */
      -moz-user-select: none; /* Firefox */
      -ms-user-select: none; /* IE10+/Edge */
      user-select: none; /* Standard */
    }

    side-drawer {
      background-color: #dcc48e;
      width: 350px;
      max-width: 75vw;
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    }

    side-drawer paper-input {
      margin: 20px;
    }

    side-drawer paper-button {
      margin: 20px;
      width: 80%;
      background-color: #b3c0a4;
    }


    `
  }

  firstUpdated() {
    this.visionClientService.getBilling(new Date().getMonth()).then(billing => this.billing = billing)
    page('/', () => {
      this.page = 'display'
    })
    page()

    this.visionClientService.getClasses().then(classes => { this.classes = classes })
                                         .then(() => this.resetFilter())
    this.setIntervalAndExecute(() => {
      this.refresh()
    }, 10000)
  }

  render () { //TODO: https://stackoverflow.com/questions/19841859/full-page-drag-and-drop-files-website
    return html`
      ${this.displayHeader()}
      <paper-button icon="build" toggles raised @click=${() => this.debug = !this.debug}>Debug</paper-button>
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
      ${this.classes !== undefined ?
        Object.entries(this.countDetectionClasses).map((f, i) => {
          const classes = this.classes.filter(c => c.dataset.includes(f[0]))
          const counts = this.countDetectionClasses[f[0]]
          return html`
          <google-chart
          id="gchart"
          type="column"
          options='{
            "title": "${f[0]} class occurences"
          }'
          cols='[{"label":"Class", "type":"string"}, {"label":"Occurences", "type":"number"}]'
          @google-chart-select=${(e) => {
            const chart = this.shadowRoot.getElementById("gchart")
            this.filteredClass = [parseInt(this.classes.find(c => c.name.includes(chart.rows[chart.selection[0].row][0])).index, 10)]
            this.pagination = 0
            console.log(this.filteredClass)
          }}
          rows='${JSON.stringify(counts.filter(f => f.element < classes.map(c => c.index).flat().reduce((a, b) => { return Math.max(a, b) }))
                                                          .map(f => [classes.find(c => c.index === f.element).name,
                                                                f.occurences]).slice(0, 10))}''>
          </google-chart>
      ` }) : ''}
      <!--
      <google-chart
      type="gauge"
      options='{
        "title": "Elements being processed"
      }'
      cols='[{"label":"Class", "type":"string"}, {"label":"Value", "type":"number"}]'
      rows='${JSON.stringify(this.queueLength)}''>
      </google-chart>
      -->

      <!-- Main part, pagination, tools, content -->
      <div class="center">
        <div class="pagination">
          <paper-button raised @click=${this.resetFilter}>
          <label>Reset filters</label>
          <paper-icon-button icon="undo"></paper-icon-button>
          </paper-button>
          <a @click="${this.previousPage}">&laquo;</a>
          ${this.frames !== undefined ?
            new Array(Math.floor(this.frames
              .map(f => f.predictions)
              .flat()
              .filter(p => p.objects !== undefined && p.objects.length > 0) // Some predictions may have no objects
              .filter(p => p.objects
              .some(o => this.filteredClass.some(c => c === o['detection_classes']), 10)).length / 10))
              .fill()
              //.slice(0, 3)
              .map((f, i) =>
            html`<a class="${this.pagination === i + this.pagination ? `active` : ``}" @click="${this.goTo}">${i + this.pagination}</a>`
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
          this.frames
                    //.filter(f => f.predictions.objects !== undefined && f.predictions.objects.length > 0) // Some predictions may have no objects
                    .filter(f => f.predictions.some(p => p.objects.some(o => this.filteredClass.some(c => c === o['detection_classes']), 10)))
                    .slice(this.pagination * 10, this.pagination * 10 + 10).map((f, i) =>
          html`
          <vision-client-frame
          .width=${300}
          .height=${300}
          .visionClientService=${this.visionClientService}
          .predictions=${f.predictions}
          .url=${f.imageUrl}
          .classes=${this.classes}
          .deleteAction=${() =>
            {
              this.visionClientService.deleteFrame(f.id).then(() => this.refresh())
            }}
          .scoreTreshold=${this.scoreTreshold}
          </vision-client-frame>`) : ''}
        </div>
      </div>
    `
  }

  displayHeader () {
    return html`
      <app-header fixed reveals>
        <app-toolbar class="toolbar">
          <div id="main-title" main-title><strong>Cloud Computer Vision</strong></div>
            <!-- Display information about the current queue of processes content -->
            <div class="queue">
              <paper-spinner id="queueLoading"></paper-spinner>
              ${this.queueLength > 0 ? html`${this.queueLength} <label>elements being processed</label>` : ""}
            </div>
            <!-- File upload component -->
            <vision-client-upload .visionClientService=${this.visionClientService}>
            </vision-client-upload>
            <label>Refresh</label>
            <paper-icon-button icon="refresh" @click=${this.refresh}></paper-icon-button>
            <label>Settings</label>
            <paper-icon-button icon="settings" toggles @click=${() => {
              this.shadowRoot.getElementById("side").open = true
              // TODO: maybe it shouldn't be called when opening settings
              this.visionClientService.getModels().then(res => {
                this.models = res.models.map(m => m.name.split('/').pop())
                // TODO: { models : [ name: model1, versions: [ name: v1 ] ]}
                this.models.forEach(async m => {
                  await this.visionClientService.getModelVersions(m).then(res => {
                    this.versions = res.versions.map(v => v.name.split('/').pop())
                  }).then(() => console.log(this.versions))
                })
              })

            }
            }></paper-icon-button>
        </app-toolbar>
      </app-header>
      <side-drawer id="side">
      <fieldset>
      <legend>Cloud parameters</legend>
      <paper-input id="width" label="Width" value="400"></paper-input>
      <paper-input id="height" label="Height" value="400"></paper-input>
      <paper-input id="batch_chunk" label="Batch chunk" value="100"></paper-input>
      <paper-input id="treshold" label="Treshold" value="100"></paper-input>
      <fieldset>
        <legend>Models</legend>
          ${this.models !== undefined ? this.models.map(m => html`<paper-checkbox>${m}</paper-checkbox>`) : ''}
        <fieldset>
          <legend>Versions</legend>
          ${this.versions !== undefined ? this.versions.map(v => html`${v}`) : ''}
        </fieldset>
      </fieldset>
      <!--
      <paper-button raised @click=${() => {
        //this.shadowRoot.getElementById("side").open = false
        const params = { width: this.shadowRoot.getElementById('width').value,
                         height: this.shadowRoot.getElementById('height').value,
                         batch_chunk: this.shadowRoot.getElementById('batch_chunk').value,
                         treshold: this.shadowRoot.getElementById('treshold').value }
        const t = this.shadowRoot.getElementById('toastSave')
        t.text = "Saved ! It may takes few minutes to update everything ..."
        this.visionClientService.updatePredictor(params).then(res => {
          if (res.message.includes('Incorrect')) t.text = res.message // TODO: fix this dirtiness
        })
        t.open()
      }}>
      Save
      <paper-icon-button icon="settings"></paper-icon-button>
      </paper-button>
      </fieldset>
      <paper-toast id="toastSave"></paper-toast>

      <fieldset>
        <legend>Interface parameters</legend>
        <paper-slider
          id="scoreTreshold"
          @change=${() => this.scoreTreshold = this.shadowRoot.getElementById("scoreTreshold").value}
          value="${this.scoreTreshold}"
          max="100"
          editable>
        </paper-slider>
        <paper-button raised class="indigo"
        @click=${this.visionClientService.resetPredictions}>
        Reset Predictions
        </paper-button>
      </fieldset>
      -->
      </side-drawer>
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

        this.updateGraphics()
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
    // TODO: unselect google chart
    this.filteredClass = []
    for (const model of uniq(this.classes.map(o => o['dataset']))) {
      this.filteredClass.push(this.classes.filter(dataset => dataset['dataset'].includes(model)).map(c => parseInt(c.index, 10)))
    }
    this.filteredClass = this.filteredClass.flat()
    this.pagination = 0
  }


  updateGraphics() {
    for (const model of uniq(this.classes.map(o => o['dataset']))) {
      this.countDetectionClasses[model] = countElements(this.frames.map(f => f.predictions)
                                                          .flat()
                                                          .filter(p => p.model.includes(model))
                                                          .map(pp => pp.objects)
                                                          .flat()
                                                          .filter(o => o !== undefined && o.detection_scores > this.scoreTreshold / 100)
                                                          .map(oo => oo.detection_classes), true)
    }
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
