import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { flatMap } from 'lodash-es';

import { InputType } from '../shared/enums/input-type.enum';
import { AnnotationNumber, BoardAnnotation } from '../shared/models/annotation.model';
import { Coords } from '../shared/models/coords.model';
import { StageConfig } from '../shared/models/level.model';
import { Tile } from '../shared/models/tile.model';
import { ApiService } from '../shared/services/api.service';

@Component({
  selector: 'game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
})
export class Game implements OnInit {
  board: Tile[][] = [];
  flatBoard: Tile[] = [];

  stageConfig: StageConfig = {} as StageConfig;

  inputType: InputType = InputType.Fill;

  boardAnnotation: BoardAnnotation = {} as BoardAnnotation;

  gameWon = false;

  private startCoords?: Coords;

  private startTile?: Tile;

  private columns: Tile[][] = [];
  private levelMapColumns: number[][] = [];

  get InputType() {
    return InputType;
  }

  get boardHeight(): number {
    return this.stageConfig.boardHeight;
  }
  get boardWidth(): number {
    return this.stageConfig.boardWidth;
  }
  get levelMap(): number[][] {
    return this.stageConfig.levelMap;
  }

  constructor(private route: ActivatedRoute, private apiService: ApiService) { }

  ngOnInit(): void {
    // this.stageConfig = test;

    const levelFile = this.route.snapshot.params['levelFile'];
    const levelStage = this.route.snapshot.params['levelStage'];

    this.apiService.getLevelFile(levelFile)
      .subscribe(level => {
        this.stageConfig = {
          ...level,
          levelMap: level.levelMap[levelStage],
        }
        // this.stageConfig = {
        //   boardWidth: 3,
        //   boardHeight: 3,
        //   levelMap: [
        //     [0,0,0],
        //     [0,1,0],
        //     [0,0,0],
        //   ],
        // }

        this.generateBoard();
        this.generateAnnotations();
    
        this.runAnnotationCheck();
        this.runAutofill();
      });
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
      y: $event.y,
    };

    const isDrawingX =
      Math.abs(this.startCoords.x - currentCoords.x) <
      Math.abs(this.startCoords.y - currentCoords.y);

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
    this.runAnnotationCheck();
    this.runAutofill();

    this.checkGameWonState();

    delete this.startTile;
    delete this.startCoords;
  }

  private drawLine(startTile: Tile, endTile: Tile): void {
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

  private completeMove(): void {
    const isActionClear = this.startTile?.isEmpty;

    this.flatBoard.forEach((tile) => {
      if (tile.isPreview) {
        tile.isPreview = false;

        if (isActionClear) {
          tile.isEmpty = false;
          return;
        }

        if (this.inputType === InputType.Empty) {
          tile.isEmpty = true;
        } else {
          const isValid = tile.type === InputType.Fill;

          if (isValid) {
            tile.isFilled = true;
          } else {
            tile.isError = true;
          }
        }
      }
    });
  }

  private runCleanPreview(): void {
    for (let i = 0; i < this.flatBoard.length; i++) {
      this.flatBoard[i].isPreview = false;
    }
  }

  private runAnnotationCheck(): void {
    // TODO: this makes game too easy. Improve logic so
    // it would not consider a number done unless
    // either it's neighbour done or it is an edge of the board
    [...this.boardAnnotation.columns, ...this.boardAnnotation.rows].forEach(
      (vector) => {
        vector.forEach((annotation) => {
          annotation.done = annotation.relatedTiles.every((x) => x.isFilled);
        });
      }
    );
  }

  private runAutofill(): void {
    this.boardAnnotation.columns.forEach((column, i) => {
      if (column.every((x) => x.done)) {
        this.columns[i].forEach((tile) => {
          if (!tile.isError && tile.type === InputType.Empty) {
            tile.isEmpty = true;
          }
        });
      }
    });
    this.boardAnnotation.rows.forEach((row, i) => {
      if (row.every((x) => x.done)) {
        this.board[i].forEach((tile) => {
          if (!tile.isError && tile.type === InputType.Empty) {
            tile.isEmpty = true;
          }
        });
      }
    });
  }

  private checkGameWonState() {
    if(this.boardAnnotation.rows.every(x => x.every(y => y.done))) {
      this.gameWon = true;
    }
  }

  private generateBoard(): void {
    this.board = Array.from({ length: this.boardHeight }, (el, iRow) =>
      Array.from(
        { length: this.boardWidth },
        (el, iTile) => new Tile(iRow, iTile, this.levelMap[iRow][iTile])
      )
    );

    this.flatBoard = flatMap(this.board);

    for (let columnI = 0; columnI < this.boardHeight; columnI++) {
      this.columns[columnI] = this.board.map((row) => row[columnI]);
      this.levelMapColumns[columnI] = this.levelMap.map((row) => row[columnI]);
    }

    console.log(this.board);
    console.log(this.columns);
    console.log(this.flatBoard);
  }

  private generateAnnotations(): void {
    this.boardAnnotation = {
      rows: this.board.map((vector) =>
        this.parseBoardTilesVectorToAnnotation(vector)
      ),
      columns: this.columns.map((vector) =>
        this.parseBoardTilesVectorToAnnotation(vector)
      ),
    };

    console.log(this.boardAnnotation);
  }

  private parseBoardTilesVectorToAnnotation(
    vector: Tile[]
  ): AnnotationNumber[] {
    const vectorAnnotation = vector
      .reduce((accum: AnnotationNumber[], tile: Tile) => {
        const lastIndex = (accum.length || 1) - 1;
        if (tile.type === InputType.Fill && accum[lastIndex] !== undefined) {
          accum[lastIndex].value += 1;
          accum[lastIndex].relatedTiles.push(tile);
        } else if (
          tile.type === InputType.Fill &&
          accum[lastIndex] === undefined
        ) {
          accum[lastIndex] = {
            value: 1,
            done: false,
            relatedTiles: [tile],
          };
        } else if (
          tile.type === InputType.Empty &&
          accum[lastIndex] !== undefined
        ) {
          accum[lastIndex + 1] = {
            value: 0,
            done: false,
            relatedTiles: [],
          };
        }

        return accum;
      }, [])
      .filter((x) => x.value !== 0);

    return vectorAnnotation.length
      ? vectorAnnotation
      : [{ value: 0, done: true, relatedTiles: [] }];
  }

  private getTileByCoords(iRow: number, iTile: number): Tile {
    return this.flatBoard.find(
      (x) => x.iRow === iRow && x.iTile === iTile
    ) as Tile;
  }

  private getTileByStringIdCoords(idCoords?: string): Tile | undefined {
    if (!idCoords) {
      return;
    }

    const [iRow, iTile] = idCoords.split(';');
    return this.flatBoard.find(
      (x) => x.iRow === +iRow && x.iTile === +iTile
    ) as Tile;
  }
}
