import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { debounceTime, merge, mergeMap, zip } from 'rxjs';

@Component({
  selector: 'level-builder',
  templateUrl: './level-builder.component.html',
  styleUrls: ['./level-builder.component.scss']
})
export class LevelBuilder {

  outputImg: any;
  file: any;

  toolbarForm: FormGroup<any> = new FormGroup({});

  get isBundle(): FormControl {
    return this.toolbarForm.get('isBundle') as FormControl;
  }

  get width(): FormControl {
    return this.toolbarForm.get('width') as FormControl;
  }
  get height(): FormControl {
    return this.toolbarForm.get('height') as FormControl;
  }

  get bundleSizeWidth(): FormControl {
    return this.toolbarForm.get('bundleSizeWidth') as FormControl;
  }
  get bundleSizeHeight(): FormControl {
    return this.toolbarForm.get('bundleSizeHeight') as FormControl;
  }

  constructor(private fb: FormBuilder) { this.createForm(); }

  uploadFile($event: Event) {
    // @ts-ignore
    const file = $event.target['files'][0];
    this.file = file;

    this.generateLevelPreview();
  }

  private handleBundle() {

  }

  private generateLevelPreview() {
    if (!(this.file && this.width.value && this.height.value)) {
      return;
    }

    const img = new Image();
    img.src = URL.createObjectURL(this.file);

    img.onload = () => {
      const outputWidth = this.width.value;
      const outputHeight = this.height.value;

      // ChatGPT helped me with this piece :)

      const canvas = document.createElement("canvas");
      canvas.width = outputWidth;
      canvas.height = outputHeight;

      // Draw the image to the canvas with the specified size
      // @ts-ignore
      const ctx: CanvasRenderingContext2D = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, outputWidth, outputHeight);

      // Get the pixel data from the canvas
      const pixelData = ctx.getImageData(0, 0, outputWidth, outputHeight).data;

      // Loop through the pixel data and set each pixel to either black or white
      for (let i = 0; i < pixelData.length; i += 4) {
        const r = pixelData[i];
        const g = pixelData[i + 1];
        const b = pixelData[i + 2];
        const grayscale = 0.2126 * r + 0.7152 * g + 0.0722 * b; // Convert to grayscale
        const pixelValue = grayscale < 128 ? 0 : 255; // Set pixel to either black or white
        pixelData[i] = pixelData[i + 1] = pixelData[i + 2] = pixelValue;
        pixelData[i + 3] = 255; // Set alpha to 255
      }
      // Create a new image object with the pixel data and return it
      const outputImg = new ImageData(pixelData, outputWidth, outputHeight);

      const canvas2 = document.createElement("canvas");
      canvas2.width = outputImg.width;
      canvas2.height = outputImg.height;
      // @ts-ignore
      const context: CanvasRenderingContext2D = canvas2.getContext("2d");
      context.putImageData(outputImg, 0, 0);

      this.outputImg = canvas2.toDataURL();
    };
  }

  private createForm(): void {
    this.toolbarForm = this.fb.group({
      width: new FormControl(0),
      height: new FormControl(0),

      isBundle: new FormControl(false),
      bundleSizeWidth: new FormControl(0),
      bundleSizeHeight: new FormControl(0),
    });


    merge(
      this.width.valueChanges,
      this.height.valueChanges
    )
      .pipe(debounceTime(800))
      .subscribe(() => this.generateLevelPreview());

    this.isBundle.valueChanges
      .subscribe(() => this.handleBundle())

    merge(
      this.bundleSizeWidth.valueChanges,
      this.bundleSizeHeight.valueChanges
    )
      .pipe(debounceTime(800))
      .subscribe(() => this.generateLevelPreview());
  }
}
