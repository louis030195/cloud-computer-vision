/* globals customElements */

import { LitElement, html, css } from 'lit-element'
import { join } from 'path'

class VisionClientFrame extends LitElement {
  static get properties () {
    return {
      visionClientService: { type: Object },
      predictionId: { type: Object }, // Foreign key passed from a frame
      objects: { type: Array }, // A frame can have multiple objects detected
      id: { type: Object }, // Id in datastore
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

  rainbow(n, maxLength) {
      n = n * 240 / maxLength;
      return 'hsl(' + n + ',100%,50%)';
  }

  perc2color(perc, min, max) {
      let base = (max - min);

      if (base == 0) { perc = 100; }
      else {
          perc = (perc - min) / base * 100;
      }
      let r, g, b = 0;
      if (perc < 50) {
          r = 255;
          g = Math.round(5.1 * perc);
      }
      else {
          g = 255;
          r = Math.round(510 - 5.10 * perc);
      }
      let h = r * 0x10000 + g * 0x100 + b * 0x1;
      return '#' + ('000000' + h.toString(16)).slice(-6);
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

    // Position of the button to delete media
    const deleteButtonX = this.width * 0.95
    const deleteButtonY = this.height * 0.05

    // create circles & cross to draw
    const circle =
    {
        x: deleteButtonX,
        y: deleteButtonY,
        radius: 20,
        color: '#d9d9d9'
    }
    const cross =
    {
      x: deleteButtonX,
      y: deleteButtonY,
      size: 10,
      color: '#000000'
    }

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    // Font options.
    const font = '16px sans-serif'
    ctx.font = font
    ctx.textBaseline = 'top'
    ctx.drawImage(image, 0, 0, this.width, this.height)

    this.objects.forEach(async object => {
      let boxText
      await this.visionClientService.getClass(object['detection_classes'])
      .then(name => boxText = `${name['name']} ${object['detection_scores'].toFixed(2)}`)

      const ymin = object['detection_boxes'][0] * this.height
      const xmin = object['detection_boxes'][1] * this.width
      const ymax = object['detection_boxes'][2] * this.height
      const xmax = object['detection_boxes'][3] * this.width
      const boxColor = this.rainbow(object['detection_classes'], 100) // this.perc2color(object['detection_classes'], 0, 100)
      // Draw the bounding box.
      ctx.strokeStyle = boxColor
      ctx.lineWidth = 2
      ctx.strokeRect(xmin, ymin, xmax, ymax)
      // Draw the label background.
      ctx.fillStyle = boxColor
      const textWidth = ctx.measureText(boxText).width
      const textHeight = parseInt(font, 10) // base 10
      ctx.fillRect(xmin, ymin, textWidth + 8, textHeight + 4)
      // Draw the text last to ensure it's on top.
      ctx.fillStyle = '#000000'
      ctx.fillText(boxText, xmin, ymin)

      // Draw circle
      ctx.beginPath()
      ctx.arc(circle.x, circle.y, circle.radius, 0, 2 * Math.PI, false)
      ctx.fillStyle = circle.color
      ctx.fill()

      // Draw X
      ctx.beginPath()
      ctx.moveTo(cross.x - cross.size, cross.y - cross.size)
      ctx.lineTo(cross.x + cross.size, cross.y + cross.size)

      ctx.moveTo(cross.x + cross.size, cross.y - cross.size)
      ctx.lineTo(cross.x - cross.size, cross.y + cross.size)
      ctx.strokeStyle = cross.color
      ctx.stroke();
    })

    canvas.addEventListener('click', (e) => {
      this.visionClientService.deleteFrame(this.id) // Then update somehow
      // .then(name => boxText = `${name['name']} ${object['detection_scores'].toFixed(2)}`)
      /*
      const pos = {
        x: e.clientX - e.srcElement.offsetParent.offsetLeft,
        y: e.clientY - e.srcElement.offsetParent.offsetTop
      }
      console.log('click ', e)
      if (this.isIntersect(pos, circle)) {
        console.log('click on circle: ')
      }
      */
    })
  }

  isIntersect(point, circle) {
    return Math.sqrt((point.x-circle.x) ** 2 + (point.y - circle.y) ** 2) < circle.radius;
  }

  render () {
    return html`
    <canvas id="myCanvas"></canvas>
    <img style="height:0px;width:0px;visibility:hidden;" id="img" src=${this.imageUrl}>
    `
  }
}

customElements.define('vision-client-frame', VisionClientFrame)
