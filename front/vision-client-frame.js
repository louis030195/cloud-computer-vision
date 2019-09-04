/* globals customElements */

import { LitElement, html, css } from 'lit-element'
import { rainbow } from '../utils/miscFront'

class VisionClientFrame extends LitElement {
  static get properties () {
    return {
      visionClientService: { type: Object },
      objects: { type: Array }, // A frame can have multiple objects detected
      url: { type: String },
      width: { type: Number },
      height: { type: Number },
      classes: { type: Array },
      deleteAction: { type: Function }
    }
  }

  constructor () {
    super()
    this.objects = []
  }

  updated() {
    if (this.objects === null || this.objects.constructor !== Array) return
    this.renderPredictions()
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
    const font = `${window.screen.width > 600 ? 16 : 32}px sans-serif`
    ctx.font = font
    ctx.textBaseline = 'top'
    ctx.drawImage(image, 0, 0, this.width, this.height)

    this.objects.forEach(async object => {
      // Only display above 60% probability, if there is no object above 60%, then, show
      if (this.objects.some(o => o['detection_scores'] > 0.6) && object['detection_scores'] < 0.6) {
        return
      }
      let boxText
      const id = object['detection_classes']-1
      const name =  this.classes[id] === undefined ? 'unknown' : this.classes[id].name
      boxText = `${name} ${object['detection_scores'].toFixed(2)}`
      //boxText = `${id}-${name} ${object['detection_scores'].toFixed(2)}`
      
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
      this.deleteAction()
    })
  }
}

customElements.define('vision-client-frame', VisionClientFrame)
