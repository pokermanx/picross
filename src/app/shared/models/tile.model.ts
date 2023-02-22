import { InputType } from '../enums/input-type.enum';

export class Tile {
    isFilled?: boolean;
    isEmpty?: boolean;
    isPreview?: boolean;
    isError?: boolean;

    type: InputType;

    iRow: number;
    iTile: number;

    constructor(
        iRow: number,
        iTile: number,
        type: InputType
    ) {
        this.iRow = iRow;
        this.iTile = iTile;
        this.type = type;
    }
}