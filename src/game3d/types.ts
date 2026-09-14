import type { GameSnapshot, RunResult, SaveData, StageDefinition, UpgradeChoice } from '../types';

export interface Game3DCallbacks {
  onSnapshot: (snapshot: GameSnapshot) => void;
  onLevelUp: (choices: UpgradeChoice[]) => void;
  onGameOver: (result: RunResult) => void;
  onStageClear: (result: RunResult) => void;
  onPaused: (paused: boolean) => void;
  onBossWarning: () => void;
  onPlayerHit?: () => void;
  onRendererError?: (message: string) => void;
}

export interface Game3DOptions {
  parent: HTMLElement;
  stage: StageDefinition;
  save: SaveData;
  callbacks: Game3DCallbacks;
}
