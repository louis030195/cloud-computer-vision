/* globals customElements */

import { LitElement, html, css } from 'lit-element'
import { rainbow, uniq } from '../utils/miscFront'

class VisionClientFrame extends LitElement {
  static get properties () {
    return {
      visionClientService: { type: Object },
      predictions: { type: Object },
      url: { type: String },
      width: { type: Number },
      height: { type: Number },
      classes: { type: Array },
      deleteAction: { type: Function },
      scoreTreshold: { type: Number }
    }
  }

  constructor () {
    super()
  }

  updated() {
    if (this.predictions === undefined) return
    // TODO: for each models we display the prediction
    // so later we could image a filter, "i don't want to display this model predictions ...""
    for (const model of uniq(this.classes.map(o => o['dataset']))) { // TODO: split render and prediction so we can see image before prediction
      //this.predictions.map(p => console.log(p))
      const filteredPredictions = this.predictions.filter(prediction => prediction.objects !== undefined &&
                                                          prediction.objects.length > 0 &&
                                                          prediction.model.includes(model))
      if (filteredPredictions.length > 0) {
        this.renderPredictions(filteredPredictions)
       }
    }
  }

  static get styles () {
    return css`
    .outsideWrapper{
        width:300px;
        height:300px;
        border:1px solid blue;
      }
    .insideWrapper{
        width:100%; height:100%;
        position:relative;
      }
    .coveredImage{
        width:100%; height:100%;
        position:absolute; top:0px; left:0px;
    }
    .coveringCanvas{
        width:100%; height:100%;
        position:absolute; top:0px; left:0px;
        background-color: rgba(255,0,0,.1);
    }
    @media (max-width: 400px) {
      .outsideWrapper{
        width:100px;
        height:100px;
      }
    }
    @media (max-width: 600px) {
      .outsideWrapper{
        width:150px;
        height:150px;
      }
    }
    `
  }

  render () {
    return html`
    <div class="outsideWrapper">
        <div class="insideWrapper">
            <img id="img" src=${this.url} class="coveredImage">
            <canvas id="myCanvas" class="coveringCanvas"></canvas>
        </div>
    </div>
    `
  }

  // Based on https://github.com/eisbilen/TFJS-ObjectDetection/blob/06324d6a4673d2933695bd6644fa2a7bc5e81326/src/app/app.component.ts
  // See also https://github.com/tensorflow/models/blob/8c7a0e752f9605d284b2f08a346fdc1d51935d75/research/object_detection/utils/visualization_utils.py#L165
  renderPredictions (predictions) {
    const canvas = this.shadowRoot.getElementById('myCanvas')
    const image = this.shadowRoot.getElementById('img')
    const ctx = canvas.getContext('2d')

    canvas.width = this.width
    canvas.height = this.height

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    // Font options.
    const font = `${window.screen.width > 600 ? 16 : 32}px sans-serif`
    ctx.font = font
    ctx.textBaseline = 'top'
    ctx.drawImage(image, 0, 0, this.width, this.height)
    predictions.forEach(async prediction => {
        const classes = this.classes.filter(c => c.dataset.includes(prediction.model))
        prediction.objects.forEach(async object => {
        // Only display above 60% probability, if there is no object above 60%, then, show
        // TODO: maybe optimize double loop everytime?
        if (/*prediction.objects.some(o => o['detection_scores'] > this.scoreTreshold / 100) &&*/ object['detection_scores'] < this.scoreTreshold / 100) {
            return
        }
        let boxText
        const id = object['detection_classes']

        const name = classes.find(c => parseInt(c.index, 10) === parseInt(id, 10))

        //boxText = `${name === undefined ? 'unknown' : name.name} ${object['detection_scores'].toFixed(2)}`
        boxText = `${id}-${name === undefined ? 'unknown' : name.name} ${object['detection_scores'].toFixed(2)}`

        const ymin = object['detection_boxes'][0] * this.height
        const xmin = object['detection_boxes'][1] * this.width
        const ymax = object['detection_boxes'][2] * this.height
        const xmax = object['detection_boxes'][3] * this.width
        const boxColor = rainbow(object['detection_classes'], 100) // this.perc2color(object['detection_classes'], 0, 100)
        // Draw the bounding box.
        ctx.strokeStyle = boxColor
        ctx.lineWidth = 2
        ctx.strokeRect(xmin, ymin, xmax-xmin, ymax-ymin)
        // Draw the label background.
        ctx.fillStyle = boxColor
        const textWidth = ctx.measureText(boxText).width
        const textHeight = parseInt(font, 10) // base 10
        ctx.fillRect(xmin, ymin, textWidth + 8, textHeight + 4)
        // Draw the text last to ensure it's on top.
        ctx.fillStyle = '#000000'
        ctx.fillText(boxText, xmin, ymin)
        })
    })


    canvas.addEventListener('click', (e) => {
      this.deleteAction()
    })
  }
}

customElements.define('vision-client-frame', VisionClientFrame)
