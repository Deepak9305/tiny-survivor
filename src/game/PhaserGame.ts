import Phaser from 'phaser';
import { GameScene, type GameSceneCallbacks } from './scenes/GameScene';
import type { SaveData, StageDefinition } from '../types';

let activeGame: Phaser.Game | undefined;

export function mountPhaserGame(parent: HTMLElement, stage: StageDefinition, save: SaveData, callbacks: GameSceneCallbacks): Phaser.Game {
  activeGame?.destroy(true);
  activeGame = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 360,
    height: 720,
    backgroundColor: '#071322',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 360,
      height: 720,
    },
    render: {
      antialias: true,
      roundPixels: true,
      powerPreference: 'high-performance',
    },
    input: {
      activePointers: 3,
    },
    scene: [GameScene],
  });
  activeGame.scene.start('GameScene', { stage, save, callbacks });
  return activeGame;
}

export function getActiveGameScene(): GameScene | undefined {
  const scene = activeGame?.scene.getScene('GameScene');
  return scene instanceof GameScene ? scene : undefined;
}

export function destroyPhaserGame(): void {
  activeGame?.destroy(true);
  activeGame = undefined;
}
