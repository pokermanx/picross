export interface LevelConfig {
  name: number;

  boardHeight: number;
  boardWidth: number;
  bundleHeight: number;
  bundleWidth: number;

  levelMap: number[][][];
}

export interface StageConfig {
    boardHeight: number;
    boardWidth: number;
  
    levelMap: number[][];
}

export interface MenuLevel {
  levelFile: string;
  levelName: string;
}
