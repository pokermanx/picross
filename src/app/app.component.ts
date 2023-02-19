import { Component, OnInit } from '@angular/core';
import { flatMap } from 'lodash';
import { InputType } from './shared/enums/input-type.enum';
import { Coords } from './shared/models/coords.model';
import { LevelConfig } from './shared/models/level.model';
import { Tile } from './shared/models/tile.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  board: Tile[][] = [];
  flatBoard: Tile[] = [];

  levelConfig: LevelConfig = {} as LevelConfig;

  inputType: InputType = InputType.Fill;

  private startCoords?: Coords;

  private startTile?: Tile;

  private columns: Tile[][] = [];

  outputImg?: any;

  get InputType() {
    return InputType;
  }

  get boardHeight(): number {
    return 20;
    // return this.levelConfig.levelMap[0].length;
  }
  get boardWidth(): number {
    return 20;
    // return this.levelConfig.levelMap.length;
  }
  get levelMap(): number[][] {
    return this.levelConfig.levelMap;
  }

  constructor() { }

  ngOnInit(): void {
    this.levelConfig = {
      levelMap: [[1, 0, 1], [0, 1, 0], [0, 1, 1]]
    }

    this.generateBoard();
  }

  startDrawingShape($event: MouseEvent, tile: Tile): void {
    this.startCoords = {
      x: $event.x,
      y: $event.y,
    };
    this.startTile = tile;

    tile.isPreview = true;
  }

  onAdjusShape($event: MouseEvent): void {
    if (!this.startCoords || !this.startTile) {
      return;
    }

    this.runCleanPreview();

    $event.preventDefault();

    const currentCoords = {
      x: $event.x,
      y: $event.y
    }

    const isDrawingX = Math.abs(this.startCoords.x - currentCoords.x) < Math.abs(this.startCoords.y - currentCoords.y);

    // console.log(this.startCoords, currentCoords)
    // console.log(isDrawingX)

    let endTile = this.getTileByStringIdCoords(
      isDrawingX
        ? document.elementFromPoint(this.startCoords.x, currentCoords.y)?.id
        : document.elementFromPoint(currentCoords.x, this.startCoords.y)?.id
    );

    if (endTile) {
      this.drawLine(this.startTile, endTile);
    }
  }

  stopDrawingShape(): void {
    this.completeMove();
    this.runCleanPreview();

    delete this.startTile;
    delete this.startCoords;
  }

  private drawLine(startTile: Tile, endTile: Tile) {
    if (startTile.iRow === endTile.iRow) {
      const startIndex = Math.min(startTile.iTile, endTile.iTile);
      const endIndex = Math.max(startTile.iTile, endTile.iTile);

      for (let i = startIndex; i <= endIndex; i++) {
        const tile = this.getTileByCoords(startTile.iRow, i);

        if (!tile.isFilled && !tile.isError) {
          tile.isPreview = true;
        }
      }

    } else {
      const startIndex = Math.min(startTile.iRow, endTile.iRow);
      const endIndex = Math.max(startTile.iRow, endTile.iRow);

      for (let i = startIndex; i <= endIndex; i++) {
        const tile = this.getTileByCoords(i, startTile.iTile);

        if (!tile.isFilled && !tile.isError) {
          tile.isPreview = true;
        }
      }
    }
  }

  private completeMove() {
    const isActionClear = this.startTile?.isEmpty;

    this.flatBoard.forEach(tile => {
      if (tile.isPreview) {
        tile.isPreview = false;

        if (isActionClear) {
          tile.isEmpty = false;
          return;
        }

        if (this.inputType === InputType.Empty) {
          tile.isEmpty = true;
        } else {
          const isValid = !!this.levelMap[tile.iRow]?.[tile.iTile];

          if (isValid) {
            tile.isFilled = true;
          } else {
            tile.isError = true;
          }
        }
      }
    });
  }

  private runCleanPreview() {
    for (let i = 0; i < this.flatBoard.length; i++) {
      this.flatBoard[i].isPreview = false;
    }
  }

  private generateBoard() {
    this.board = Array.from(
      { length: this.boardHeight },
      (el, iRow) => Array.from(
        { length: this.boardWidth },
        (el, iTile) => new Tile(iRow, iTile)
      )
    );

    this.flatBoard = flatMap(this.board);

    for (let columnI = 0; columnI < this.boardHeight; columnI++) {
      this.columns[columnI] = this.board.map(row => row[columnI]);
    }

    console.log(this.board)
    console.log(this.columns)
    console.log(this.flatBoard)
  }

  private getTileByCoords(iRow: number, iTile: number): Tile {
    return this.flatBoard.find(x => x.iRow === iRow && x.iTile === iTile) as Tile;
  }

  private getTileByStringIdCoords(idCoords?: string): Tile | undefined {
    if (!idCoords) {
      return;
    }

    const [iRow, iTile] = idCoords.split(';');
    return this.flatBoard.find(x => x.iRow === +iRow && x.iTile === +iTile) as Tile;
  }

  uploadFile($event: Event) {
    // @ts-ignore
    const file = $event.target?.['files'][0];

    const outputWidth = 300;
    const outputHeight = 300;

    const img = new Image();

    img.src = URL.createObjectURL(file);

    // When the image is loaded, resize it and draw it to a canvas
    img.onload = () => {
      // Create a canvas element
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
}
