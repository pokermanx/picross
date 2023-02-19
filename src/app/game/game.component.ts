import { Component, OnInit } from '@angular/core';
import { flatMap } from 'lodash-es';
import { InputType } from '../shared/enums/input-type.enum';
import { Coords } from '../shared/models/coords.model';
import { LevelConfig } from '../shared/models/level.model';
import { Tile } from '../shared/models/tile.model';

@Component({
    selector: 'game',
    templateUrl: './game.component.html',
    styleUrls: ['./game.component.scss']
})
export class Game implements OnInit {

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
        return this.levelConfig.levelMap[0].length;
    }
    get boardWidth(): number {
        return this.levelConfig.levelMap.length;
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
}