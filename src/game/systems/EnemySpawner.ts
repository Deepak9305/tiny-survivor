import { ENEMY_BALANCE } from '../../data/balance';
import type { EnemyKind, StageDefinition } from '../../types';

export interface SpawnHooks {
  getPlayerPosition: () => { x: number; y: number };
  getWorldSize: () => { width: number; height: number };
  getAliveCount: () => number;
  spawnEnemy: (type: EnemyKind, x: number, y: number, elite: boolean) => void;
}

export class EnemySpawner {
  private stage?: StageDefinition;
  private elapsed = 0;
  private spawnTimer = 0;
  private stopped = false;

  constructor(private readonly hooks: SpawnHooks) {}

  loadStageTimeline(stage: StageDefinition): void {
    this.stage = stage;
    this.elapsed = 0;
    this.spawnTimer = 0.5;
    this.stopped = false;
  }

  stopSpawning(): void { this.stopped = true; }

  calculateSpawnRate(): number {
    const progress = Math.min(1, this.elapsed / (this.stage?.duration ?? 180));
    const density = this.stage?.difficulty.densityMultiplier ?? 1;
    return Math.max(0.18, (0.82 - progress * 0.52) / density);
  }

  chooseEnemyType(): EnemyKind {
    const available = (this.stage?.enemies ?? ['skeleton']).filter((type) => ENEMY_BALANCE[type].minTime <= this.elapsed);
    const pool = available.length ? available : ['skeleton' as EnemyKind];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  getSafeSpawnPosition(): { x: number; y: number } {
    const player = this.hooks.getPlayerPosition();
    const world = this.hooks.getWorldSize();
    const angle = Math.random() * Math.PI * 2;
    const distance = 330 + Math.random() * 110;
    return {
      x: Math.min(world.width - 40, Math.max(40, player.x + Math.cos(angle) * distance)),
      y: Math.min(world.height - 40, Math.max(40, player.y + Math.sin(angle) * distance)),
    };
  }

  spawnWave(): void {
    const baseCount = this.elapsed > 100 ? 3 : this.elapsed > 48 ? 2 : 1;
    const density = this.stage?.difficulty.densityMultiplier ?? 1;
    const count = Math.min(4, Math.max(1, Math.round(baseCount * density)));
    const eliteMultiplier = this.stage?.difficulty.eliteMultiplier ?? 1;
    for (let index = 0; index < count; index += 1) {
      const position = this.getSafeSpawnPosition();
      const elite = this.elapsed > 42 && Math.random() < Math.min(0.34, (0.035 + this.elapsed / 1500) * eliteMultiplier);
      this.hooks.spawnEnemy(this.chooseEnemyType(), position.x, position.y, elite);
    }
  }

  update(delta: number): void {
    if (this.stopped || !this.stage) return;
    this.elapsed += delta;
    if (this.hooks.getAliveCount() >= (this.elapsed > 110 ? 105 : 72)) return;
    this.spawnTimer -= delta;
    if (this.spawnTimer <= 0) {
      this.spawnWave();
      this.spawnTimer = this.calculateSpawnRate();
    }
  }
}
