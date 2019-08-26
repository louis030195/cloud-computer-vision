/* globals customElements */

import { LitElement, html, css } from 'lit-element'
import './vision-client-frame'
import '@vaadin/vaadin-progress-bar/vaadin-progress-bar.js'
// import { Plotly } from 'plotly.js'
// const Plotly = require('plotly.js')
// https://github.com/plotly/plotly-webpack
const Plotly = require('plotly.js/lib/index-basic')

class VisionClientDisplay extends LitElement {
  static get properties () {
    return {
      visionClientService: { type: Object },
      videos: { type: Array },
      frames: { type: Array },
      predictions: { type: Array },
      objects: { type: Array },
      pagination: { type: Number },
      progress: { type: Number}
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

  updated(changedProperties) {
    const v = (this.frames.length / this.frames.filter(f => f.predictions === null).length)
    this.progress = v //100 - isNaN(v) ? 0 : v
  }

  firstUpdated () {
    this.visionClientService.getVideos().then(videos => { this.videos = videos['items'] })
    this.visionClientService.getFrames().then(frames => { this.frames = frames['items'] })
    this.visionClientService.getClasses().then(classes => { this.classes = classes['items'] })

    /*
    this.visionClientService.getFrames()
                            .then(frames => { this.frames = frames['items'] })
                            .then(() => this.frames.filter(f => f.predictions !== null && f.predictions !== 'processing')
                                                   .forEach(frame => this.visionClientService.getPredictionObjects(frame['predictions'])
                                                                                             .then(objects => frame['predictions'] = objects['objectEntities'])))                                         
     
    */                                                                                        
                            //.then(() => this.renderGraphics())
                            //.then(() => console.log(this.frames))
    
    //this.visionClientService.getPredictions().then(predictions => { this.predictions = predictions['items'] })
    //this.visionClientService.getObjects().then(objects => { this.objects = objects['items'] })
  }

  render () {
    return html`
    <br />
    frames being processed ${this.frames.filter(f => f.predictions === null).length}
    <vaadin-progress-bar min="0" max="100" value="${this.progress}"></vaadin-progress-bar>
    Content processed: <span>${this.progress}</span> %
    <div id="tester" style="width:90%;height:250px;"></div>
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
      ${this.frames !== undefined && this.classes !== undefined /*&& this.predictions !== undefined*/ ? this.frames.slice(this.pagination * 10, this.pagination * 10 + 10).map((f, i) =>
        html`<vision-client-frame
        .width=${300}
        .height=${300}
        .visionClientService=${this.visionClientService}
        .objects=${f['predictions']}
        .id=${f['id']}
        .imageUrl=${f['imageUrl']}
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
    for ( var i = 0; i < arr.length; i++ ) {
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
      result.sort(function(a, b) {
        return ((a.occurences > b.occurences) ? -1 : ((a.occurences == b.occurences) ? 0 : 1))
      })
      // I don't see any point in taking limit of unsorted elements
      if (limit !== undefined) {
        result = result.slice(0, limit)
      }
    }
    return result
  }

  renderGraphics() {
    return
    // console.log(this.mode(this.frames))
    // countElements(temp1.map(t => t['predictions'].map(x => x['detection_classes'])).flat(), true, 100)
    //const t = this.shadowRoot.getElementById('tester')
    /*
    const limitFiveOccurences = this.countElements(this.frames.map(frame => frame['predictions'].map(prediction => prediction['detection_classes']))
                                                              .flat(), true, 5)
                                                              */
                                                             
    console.log(this.frames[0].predictions)
    console.log(this.frames[0])
    return
    const limitFiveOccurences = this.countElements(this.frames.map(frame => frame['predictions'])
                                                              .flat()
                                                              .map(prediction => prediction['detection_classes']), true, 5)
    console.log(limitFiveOccurences)
    return
    var trace1 = {
      x: limitFiveOccurences['occurences'],
      y: limitFiveOccurences['element'],
      name: 'control',
      autobinx: false, 
      histnorm: "count", 
      marker: {
        color: "rgba(255, 100, 102, 0.7)", 
          line: {
          color:  "rgba(255, 100, 102, 1)", 
          width: 1
        }
      },  
      opacity: 0.5, 
      type: "histogram", 
      xbins: {
        end: 2.8, 
        size: 0.06, 
        start: .5
      }
    }
    var data = [trace1]
    var layout = {
      bargap: 0.05, 
      bargroupgap: 0.2, 
      barmode: "overlay", 
      title: "Sampled Results", 
      xaxis: {title: "Value"}, 
      yaxis: {title: "Count"}
    };
    Plotly.newPlot('tester', data, layout)
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
