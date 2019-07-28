/* globals customElements */

import { LitElement, html, css } from 'lit-element'
class VisionClientFrame extends LitElement {
  static get properties() {
    return {
      visionClientService: { type: Object },
      objects: { type: Array }, // Foreign key passed from a frame
      object: { type: Object }, // Table row returned from a jointure from the foreign key
      imageUrl: { type: String }
    };
  }

  firstUpdated () {
    this.visionClientService.getObject(this.objects).then(object => { this.object = object })
  }

  // Based on https://github.com/eisbilen/TFJS-ObjectDetection/blob/06324d6a4673d2933695bd6644fa2a7bc5e81326/src/app/app.component.ts
  renderPredictions() {
    const canvas = this.shadowRoot.getElementById("myCanvas");

    const ctx = canvas.getContext("2d");

    canvas.width  = 300;
    canvas.height = 300;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    // Font options.
    const font = "16px sans-serif";
    ctx.font = font;
    ctx.textBaseline = "top";
    //ctx.drawImage(this.video,0, 0,300,300);

    this.objects.forEach(object => {
      const x = object.bbox[0];
      const y = object.bbox[1];
      const width = object.bbox[2];
      const height = object.bbox[3];
      // Draw the bounding box.
      ctx.strokeStyle = "#00FFFF";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);
      // Draw the label background.
      ctx.fillStyle = "#00FFFF";
      //const textWidth = ctx.measureText(prediction.class).width;
      //const textHeight = parseInt(font, 10); // base 10
      //ctx.fillRect(x, y, textWidth + 4, textHeight + 4);
    });
    /*
    predictions.forEach(prediction => {
      const x = prediction.bbox[0];
      const y = prediction.bbox[1];
      // Draw the text last to ensure it's on top.
      ctx.fillStyle = "#000000";
      ctx.fillText(prediction.class, x, y);
    });*/
  }

  render() {
    // Predicted class ${this.object["predictions"][0]["classes"]}
    return html`
    Object ${this.objects !== undefined ? this.objects : ''}<img src=${this.imageUrl}>
    `
  }
}

customElements.define('vision-client-frame', VisionClientFrame)