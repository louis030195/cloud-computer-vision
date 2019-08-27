/* globals customElements */

import { LitElement, html, css } from 'lit-element'
import './vision-client-frame'
import '@vaadin/vaadin-progress-bar/vaadin-progress-bar.js'
import '@google-web-components/google-chart/google-chart.js'

class VisionClientDisplay extends LitElement {
  static get properties () {
    return {
      visionClientService: { type: Object },
      videos: { type: Array },
      frames: { type: Array },
      predictions: { type: Array },
      objects: { type: Array },
      pagination: { type: Number },
      progress: { type: Number},
      countDetectionClasses: { type: Array }
    }
  }

  constructor () {
    super()
    this.videos = []
    this.frames = []
    this.classes = []
    this.predictions = []
    this.objects = []
    this.pagination = 0
    this.progress = 0
    this.countDetectionClasses = []
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

  firstUpdated() {
    const v = this.frames !== undefined ? (this.frames.length / this.frames.filter(f => f.predictions === null).length) : 0
    this.progress = v //100 - isNaN(v) ? 0 : v

    this.visionClientService.getVideos().then(videos => { this.videos = videos['items'] })
    this.visionClientService.getFramesPredictionsObjects()
                            .then(frames => { this.frames = frames['items'] })
                            .then(() => this.updateGraphics())
    this.visionClientService.getClasses().then(classes => { this.classes = classes['items'] })
  }
  

  render () {
    return html`
    <br />
    frames being processed ${this.frames !== undefined ? this.frames.filter(f => f.predictions === null).length : 0}
    <vaadin-progress-bar min="0" max="100" value="${this.progress}"></vaadin-progress-bar>
    Content processed: <span>${this.progress}</span> %
    <google-chart
    options='{"title": "Class occurences"}'
    cols='[{"label":"Class", "type":"string"}, {"label":"Occurences", "type":"number"}]'
    rows='${JSON.stringify(this.countDetectionClasses.map(f => [f.element - 1 < this.classes.length ? this.classes[f.element - 1].name : 'unknown', f.occurences]))}''>
    </google-chart>
    <div class="center">
      <div class="pagination">
        <a @click="${this.previousPage}">&laquo;</a>
        ${this.frames !== undefined ? new Array(Math.floor(this.frames.length / 10)).fill().map((f, i) =>
          html`<a class="${this.pagination == i ? `active` : ``}" @click="${this.goTo}">${i}</a>`
        ) : ''}
        <a @click="${this.nextPage}">&raquo;</a>
      </div>
    </div>
    <div id="content">
      <div class="wrapper">
      ${this.frames !== undefined /*&& this.classes !== undefined && this.predictions !== undefined*/ ? this.frames.slice(this.pagination * 10, this.pagination * 10 + 10).map((f, i) =>
        html`<vision-client-frame
        .width=${300}
        .height=${300}
        .visionClientService=${this.visionClientService}
        .objects=${f.predictions.objects}
        .id=${f.id}
        .imageUrl=${f.imageUrl}
        .classes=${this.classes}
        </vision-client-frame>`) : ''}
      </div>
    </div>
      
    `
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
    //console.log(this.frames)
    this.countDetectionClasses = this.countElements(this.frames.map(frame => frame.predictions.objects)
                                                              .flat()
                                                              .filter(object => object.detection_scores > 0.6)
                                                              .map(object => object.detection_classes), true)
    //console.log(this.countDetectionClasses)
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
