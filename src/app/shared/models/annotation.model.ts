import { Tile } from './tile.model';

export interface BoardAnnotation {
    rows: AnnotationNumber[][],
    columns: AnnotationNumber[][],
}

export interface AnnotationNumber {
    value: number;
    done: boolean;

    relatedTiles: Tile[];
}
