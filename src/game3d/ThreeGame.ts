import type { SaveData, StageDefinition } from '../types';
import { SurvivorGame3D } from './SurvivorGame3D';
import type { Game3DCallbacks } from './types';

let activeGame: SurvivorGame3D | undefined;

export function mountThreeGame(parent: HTMLElement, stage: StageDefinition, save: SaveData, callbacks: Game3DCallbacks): SurvivorGame3D | undefined {
  destroyThreeGame();
  try {
    activeGame = new SurvivorGame3D({ parent, stage, save, callbacks });
    activeGame.start();
    return activeGame;
  } catch (error) {
    activeGame = undefined;
    parent.querySelector('.three-canvas')?.remove();
    const message = error instanceof Error ? error.message : 'The 3D arena could not be started.';
    callbacks.onRendererError?.(message);
    return undefined;
  }
}

export function getActiveThreeGame(): SurvivorGame3D | undefined { return activeGame; }

export function destroyThreeGame(): void {
  activeGame?.destroy();
  activeGame = undefined;
}
