import { ENEMY_BALANCE } from '../../data/balance';
import type { EnemyKind, StageDefinition } from '../../types';

export interface SpawnHooks {
  getPlayerPosition: () => { x: number; y: number };
  getWorldSize: () => { width: number; height: number };
  getAliveCount: () => number;
  spawnEnemy: (type: EnemyKind, x: number, y: number, elite: boolean) => void;
}

type PackType = 'melee_swarm' | 'bat_swoop' | 'archer_escort' | 'slime_wall' | 'imp_rush';

export class EnemySpawner {
  private stage?: StageDefinition;
  private elapsed = 0;
  private spawnTimer = 0;
  private packTimer = 16;
  private breathingTimer = 0;
  private stopped = false;

  constructor(private readonly hooks: SpawnHooks) {}

  loadStageTimeline(stage: StageDefinition): void {
    this.stage = stage;
    this.elapsed = 0;
    this.spawnTimer = 0.5;
    this.packTimer = 14;
    this.breathingTimer = 0;
    this.stopped = false;
  }

  stopSpawning(): void {
    this.stopped = true;
  }

  calculateSpawnRate(): number {
    const progress = Math.min(1, this.elapsed / (this.stage?.duration ?? 180));
    const density = this.stage?.difficulty.densityMultiplier ?? 1;
    // Breathing window slows down drip rate
    const breathingFactor = this.breathingTimer > 0 ? 2.2 : 1.0;
    return Math.max(0.24, ((0.85 - progress * 0.48) * breathingFactor) / density);
  }

  chooseEnemyType(allowedKinds?: EnemyKind[]): EnemyKind {
    const available = (allowedKinds ?? this.stage?.enemies ?? ['skeleton']).filter(
      (type) => ENEMY_BALANCE[type].minTime <= this.elapsed
    );
    const pool = available.length ? available : (['skeleton'] as EnemyKind[]);
    return pool[Math.floor(Math.random() * pool.length)];
  }

  getSafeSpawnPosition(preferredAngle?: number, distanceOffset = 0): { x: number; y: number } {
    const player = this.hooks.getPlayerPosition();
    const world = this.hooks.getWorldSize();
    const angle = preferredAngle ?? Math.random() * Math.PI * 2;
    // Outside landscape viewport (landscape viewport half-extent ~400 horizontal, ~250 vertical)
    const distance = 420 + Math.random() * 120 + distanceOffset;
    return {
      x: Math.min(world.width - 55, Math.max(55, player.x + Math.cos(angle) * distance)),
      y: Math.min(world.height - 55, Math.max(55, player.y + Math.sin(angle) * distance)),
    };
  }

  spawnRegularWave(): void {
    const baseCount = this.elapsed > 110 ? 3 : this.elapsed > 45 ? 2 : 1;
    const density = this.stage?.difficulty.densityMultiplier ?? 1;
    const count = Math.min(4, Math.max(1, Math.round(baseCount * density)));
    const eliteMultiplier = this.stage?.difficulty.eliteMultiplier ?? 1;

    for (let index = 0; index < count; index += 1) {
      const position = this.getSafeSpawnPosition();
      const elite =
        this.elapsed > 42 &&
        Math.random() < Math.min(0.32, (0.035 + this.elapsed / 1500) * eliteMultiplier);
      this.hooks.spawnEnemy(this.chooseEnemyType(), position.x, position.y, elite);
    }
  }

  spawnAuthoredPack(): void {
    const stageEnemies = this.stage?.enemies ?? ['skeleton'];
    const packs: PackType[] = [];

    if (stageEnemies.includes('bat')) packs.push('bat_swoop');
    if (stageEnemies.includes('archer')) packs.push('archer_escort');
    if (stageEnemies.includes('slime')) packs.push('slime_wall');
    if (stageEnemies.includes('imp')) packs.push('imp_rush');
    packs.push('melee_swarm');

    const chosenPack = packs[Math.floor(Math.random() * packs.length)];
    const baseAngle = Math.random() * Math.PI * 2;
    const eliteMultiplier = this.stage?.difficulty.eliteMultiplier ?? 1;

    switch (chosenPack) {
      case 'bat_swoop': {
        const count = 4;
        for (let i = 0; i < count; i += 1) {
          const angle = baseAngle + (i - 1.5) * 0.35;
          const pos = this.getSafeSpawnPosition(angle);
          this.hooks.spawnEnemy('bat', pos.x, pos.y, i === 0 && Math.random() < 0.25 * eliteMultiplier);
        }
        break;
      }
      case 'archer_escort': {
        // 2 archers behind 3 skeletons
        const count = 3;
        for (let i = 0; i < count; i += 1) {
          const angle = baseAngle + (i - 1) * 0.3;
          const pos = this.getSafeSpawnPosition(angle, 0);
          this.hooks.spawnEnemy('skeleton', pos.x, pos.y, false);
        }
        for (let i = 0; i < 2; i += 1) {
          const angle = baseAngle + (i - 0.5) * 0.4;
          const pos = this.getSafeSpawnPosition(angle, 60);
          this.hooks.spawnEnemy('archer', pos.x, pos.y, i === 0 && Math.random() < 0.3 * eliteMultiplier);
        }
        break;
      }
      case 'slime_wall': {
        const count = 3;
        for (let i = 0; i < count; i += 1) {
          const angle = baseAngle + (i - 1) * 0.45;
          const pos = this.getSafeSpawnPosition(angle);
          this.hooks.spawnEnemy('slime', pos.x, pos.y, i === 0 && Math.random() < 0.3 * eliteMultiplier);
        }
        break;
      }
      case 'imp_rush': {
        const count = 3;
        for (let i = 0; i < count; i += 1) {
          const angle = baseAngle + (i - 1) * 0.35;
          const pos = this.getSafeSpawnPosition(angle);
          this.hooks.spawnEnemy('imp', pos.x, pos.y, false);
        }
        break;
      }
      case 'melee_swarm':
      default: {
        const meleeKind = stageEnemies.includes('demon') ? 'demon' : stageEnemies.includes('knight') ? 'knight' : 'skeleton';
        const count = 4;
        for (let i = 0; i < count; i += 1) {
          const angle = baseAngle + (i - 1.5) * 0.32;
          const pos = this.getSafeSpawnPosition(angle);
          this.hooks.spawnEnemy(meleeKind as EnemyKind, pos.x, pos.y, i === 0 && Math.random() < 0.28 * eliteMultiplier);
        }
        break;
      }
    }

    // Enter a 2.4s breathing window after each major pack
    this.breathingTimer = 2.4;
  }

  update(delta: number): void {
    if (this.stopped || !this.stage) return;
    this.elapsed += delta;
    this.breathingTimer = Math.max(0, this.breathingTimer - delta);

    const maxAlive = this.elapsed > 110 ? 95 : 68;
    if (this.hooks.getAliveCount() >= maxAlive) return;

    // Pack spawner check
    this.packTimer -= delta;
    if (this.packTimer <= 0) {
      this.spawnAuthoredPack();
      this.packTimer = 18 + Math.random() * 6;
    }

    // Regular drip spawner check
    this.spawnTimer -= delta;
    if (this.spawnTimer <= 0) {
      this.spawnRegularWave();
      this.spawnTimer = this.calculateSpawnRate();
    }
  }
}
