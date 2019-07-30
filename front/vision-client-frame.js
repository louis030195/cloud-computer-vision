/* globals customElements */

import { LitElement, html, css } from 'lit-element'
import { join } from 'path'

class VisionClientFrame extends LitElement {
  static get properties () {
    return {
      visionClientService: { type: Object },
      predictionId: { type: Object }, // Foreign key passed from a frame
      objects: { type: Array }, // A frame can have multiple objects detected
      imageUrl: { type: String },
      width: { type: Object },
      height: { type: Object }
    }
  }

  constructor () {
    super()
    this.objects = []
  }

  static get styles () {
    return css`
    img {
        width:${this.width !== undefined ? this.width : 300}px;
        height:${this.height !== undefined ? this.height : 300}px;
    }
    `
  }


  firstUpdated () {
    this.visionClientService.getPrediction(this.predictionId).then(prediction => {
      prediction['objects'].forEach(object => {
        this.visionClientService.getObject(object).then(o => { this.objects.push(o) }).then(o => { this.renderPredictions() })
      })
    })
  }

  // Based on https://github.com/eisbilen/TFJS-ObjectDetection/blob/06324d6a4673d2933695bd6644fa2a7bc5e81326/src/app/app.component.ts
  // See also https://github.com/tensorflow/models/blob/8c7a0e752f9605d284b2f08a346fdc1d51935d75/research/object_detection/utils/visualization_utils.py#L165
  renderPredictions () {
    const canvas = this.shadowRoot.getElementById('myCanvas')
    const image = this.shadowRoot.getElementById('img')
    const ctx = canvas.getContext('2d')

    canvas.width = this.width
    canvas.height = this.height

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    // Font options.
    const font = '16px sans-serif'
    ctx.font = font
    ctx.textBaseline = 'top'
    ctx.drawImage(image, 0, 0, this.width, this.height)

    this.objects.forEach(object => {
      const ymin = object['detection_boxes'][0] * this.height
      const xmin = object['detection_boxes'][1] * this.width
      const ymax = object['detection_boxes'][2] * this.height
      const xmax = object['detection_boxes'][3] * this.width
      const boxColor = '#00FFFF'
      // Draw the bounding box.
      ctx.strokeStyle = boxColor
      ctx.lineWidth = 2
      ctx.strokeRect(xmin, ymin, xmax, ymax)
      // Draw the label background.
      ctx.fillStyle = boxColor
      const boxText = `${object['detection_classes']} - ${object['detection_scores'].toFixed(2)}`
      const textWidth = ctx.measureText(boxText).width
      const textHeight = parseInt(font, 10) // base 10
      ctx.fillRect(xmin, ymin, textWidth + 8, textHeight + 4)
      // Draw the text last to ensure it's on top.
      ctx.fillStyle = '#000000'
      ctx.fillText(boxText, xmin, ymin)
    })
  }

  render () {
    return html`
    <canvas id="myCanvas"></canvas>
    <img style="visibility:hidden;" id="img" src=${this.imageUrl}>
    `
  }
}

customElements.define('vision-client-frame', VisionClientFrame)
