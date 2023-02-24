import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { chunk, flatMap } from 'lodash-es';
import { debounceTime, merge } from 'rxjs';

@Component({
  selector: 'level-builder',
  templateUrl: './level-builder.component.html',
  styleUrls: ['./level-builder.component.scss'],
})
export class LevelBuilder {
  generatedLevel: any;
  file: any;

  toolbarForm: FormGroup<any> = new FormGroup({});

  get isBundle(): FormControl {
    return this.toolbarForm.get('isBundle') as FormControl;
  }
  get name(): FormControl {
    return this.toolbarForm.get('name') as FormControl;
  }

  get invert(): FormControl {
    return this.toolbarForm.get('invert') as FormControl;
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

  @ViewChild('canvasPreview', { static: true }) canvasPreview?: ElementRef<any>;

  constructor(private fb: FormBuilder) {
    this.createForm();
  }

  uploadFile($event: Event) {
    // @ts-ignore
    const file = $event.target['files'][0];
    this.file = file;

    this.generateLevelPreview();
  }

  private handleBundle() {}

  private generateLevelPreview() {
    if (!(this.file && this.width.value && this.height.value)) {
      return;
    }

    const img = new Image();
    img.src = URL.createObjectURL(this.file);

    img.onload = () => {
      const singleBoardWidth = this.width.value;
      const singleBoardHeight = this.height.value;

      const bundleWidth = singleBoardWidth * this.bundleSizeWidth.value;
      const bundleHeight = singleBoardHeight * this.bundleSizeHeight.value;

      const dOutputWidth = bundleWidth + this.bundleSizeWidth.value - 1;
      const dOutputHeight = bundleHeight + this.bundleSizeHeight.value - 1;

      const canvas = document.createElement('canvas');
      canvas.width = bundleWidth;
      canvas.height = bundleHeight;

      // @ts-ignore
      const ctx: CanvasRenderingContext2D = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, bundleWidth, bundleHeight);

      // Get the pixel data from the canvas
      const processedData = [];

      const invert = this.invert.value;

      const pixelData = ctx.getImageData(0, 0, bundleWidth, bundleHeight).data;
      // Loop through the pixel data and set each pixel to either black or white
      for (let i = 0; i < pixelData.length; i += 4) {
        const r = pixelData[i];
        const g = pixelData[i + 1];
        const b = pixelData[i + 2];
        const grayscale = 0.2126 * r + 0.7152 * g + 0.0722 * b; // Convert to grayscale

        let pixelValue;
        if (invert) {
          pixelValue = grayscale < 128 ? 255 : 0;
        } else {
          pixelValue = grayscale < 128 ? 0 : 255;
        } // Set pixel to either black or white

        pixelData[i] = pixelData[i + 1] = pixelData[i + 2] = pixelValue;
        pixelData[i + 3] = 255; // Set alpha to 255

        if (i % (singleBoardWidth * 4) === 0 && i % (bundleWidth * 4) !== 0) {
          processedData.push(200, 200, 200, 255);
        }
        if (i !== 0 && i % (bundleWidth * singleBoardHeight * 4) === 0) {
          const horizintalSeparationLine = Array.from(
            { length: dOutputWidth },
            () => [200, 200, 200, 255]
          );

          processedData.push(...flatMap(horizintalSeparationLine));
        }

        processedData.push(
          pixelData[i],
          pixelData[i + 1],
          pixelData[i + 2],
          pixelData[i + 3]
        );
      }

      const chunked = chunk(pixelData, 4);

      const imageMap: any[] = [];

      for (let i = 0; i < chunked.length; i++) {
        const iRow = ~~(i / bundleWidth);
        const tileData = chunked[i][0] === 0 ? 1 : 0;
        if (!imageMap[iRow]) {
          imageMap[iRow] = [tileData];
        } else {
          imageMap[iRow].push(tileData);
        }
      }

      const numRows = this.bundleSizeWidth.value;
      const numCols = this.bundleSizeHeight.value;

      const levelMap = [];

      const subMatrixRows = imageMap.length / numRows;
      const subMatrixCols = imageMap[0].length / numCols;

      for (let i = 0; i < numRows; i++) {
        for (let j = 0; j < numCols; j++) {
          const subMatrix = [];
          for (let k = i * subMatrixRows; k < (i + 1) * subMatrixRows; k++) {
            const subMatrixRow = [];
            for (let l = j * subMatrixCols; l < (j + 1) * subMatrixCols; l++) {
              subMatrixRow.push(imageMap[k][l]);
            }
            subMatrix.push(subMatrixRow);
          }
          levelMap.push(subMatrix);
        }
      }

      this.generatedLevel = {
        levelMap,
        bundleWidth: this.bundleSizeWidth.value,
        bundleHeight: this.bundleSizeHeight.value,
        boardWidth: this.width.value,
        boardHeight: this.height.value,
      };

      console.log(this.generatedLevel)

      const outputImg = new ImageData(
        new Uint8ClampedArray(processedData),
        dOutputWidth,
        dOutputHeight
      );

      const canvasPreview = this.canvasPreview?.nativeElement;

      canvasPreview.width = dOutputWidth;
      canvasPreview.height = dOutputHeight;

      // @ts-ignore
      const context: CanvasRenderingContext2D = canvasPreview.getContext('2d');
      context.imageSmoothingEnabled = false;

      context.putImageData(outputImg, 0, 0);
    };
  }

  private createForm(): void {
    this.toolbarForm = this.fb.group({
      name: new FormControl(''),

      width: new FormControl(10),
      height: new FormControl(10),

      isBundle: new FormControl(true),
      invert: new FormControl(false),
      bundleSizeWidth: new FormControl(2),
      bundleSizeHeight: new FormControl(2),
    });

    merge(
      this.width.valueChanges,
      this.height.valueChanges,
      this.invert.valueChanges
    )
      .pipe(debounceTime(800))
      .subscribe(() => this.generateLevelPreview());

    this.isBundle.valueChanges.subscribe(() => this.handleBundle());

    merge(this.bundleSizeWidth.valueChanges, this.bundleSizeHeight.valueChanges)
      .pipe(debounceTime(800))
      .subscribe(() => this.generateLevelPreview());
  }

  downloadLevel() {
    var dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify({
        name: this.name.value,
        ...this.generatedLevel,
      }));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', (this.name.value || 'custom-level') + '.json');
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }
}
