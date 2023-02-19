export class Tile {
    isFilled?: boolean;
    isEmpty?: boolean;
    isPreview?: boolean;
    isError?: boolean;

    iRow: number;
    iTile: number;

    constructor(
        iRow: number,
        iTile: number
    ) {
        this.iRow = iRow;
        this.iTile = iTile;
    }
}