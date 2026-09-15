import { ENEMY_BALANCE } from '../../data/balance';
import type { EnemyKind, StageDefinition } from '../../types';

export interface SpawnHooks {
  getPlayerPosition: () => { x: number; y: number };
  getWorldSize: () => { width: number; height: number };
  getAliveCount: () => number;
  spawnEnemy: (type: EnemyKind, x: number, y: number, elite: boolean) => void;
}

type PackType =
  | 'melee_swarm'
  | 'bat_swoop'
  | 'archer_escort'
  | 'slime_wall'
  | 'imp_rush'
  | 'wolf_pack'
  | 'thorn_volley'
  | 'treant_escort'
  | 'frost_hunt';

export class EnemySpawner {
  private stage?: StageDefinition;
  private customPool?: EnemyKind[];
  private isSurvival = false;
  private elapsed = 0;
  private spawnTimer = 0;
  private packTimer = 16;
  private breathingTimer = 0;
  private stopped = false;

  constructor(private readonly hooks: SpawnHooks) {}

  loadStageTimeline(stage: StageDefinition, customPool?: EnemyKind[], isSurvival = false): void {
    this.stage = stage;
    this.customPool = customPool;
    this.isSurvival = isSurvival;
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
    if (this.isSurvival) {
      const minutes = this.elapsed / 60;
      const breathingFactor = this.breathingTimer > 0 ? 2.0 : 1.0;
      return Math.max(0.22, (0.72 / (1 + minutes * 0.15)) * breathingFactor);
    }
    const progress = Math.min(1, this.elapsed / (this.stage?.duration ?? 180));
    const density = this.stage?.difficulty.densityMultiplier ?? 1;
    // Breathing window slows down drip rate
    const breathingFactor = this.breathingTimer > 0 ? 2.2 : 1.0;
    return Math.max(0.24, ((0.85 - progress * 0.48) * breathingFactor) / density);
  }

  chooseEnemyType(allowedKinds?: EnemyKind[]): EnemyKind {
    const stageAllowed = allowedKinds ?? this.customPool ?? this.stage?.enemies ?? ['skeleton'];
    const available = stageAllowed.filter(
      (type) => (ENEMY_BALANCE[type]?.minTime ?? 0) <= this.elapsed
    );
    const pool = available.length > 0 ? available : stageAllowed;
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
    if (this.isSurvival) {
      const minutes = this.elapsed / 60;
      const count = Math.min(5, 2 + Math.floor(minutes * 0.5));
      const eliteChance = Math.min(0.38, 0.05 + minutes * 0.035);
      for (let index = 0; index < count; index += 1) {
        const position = this.getSafeSpawnPosition();
        const elite = Math.random() < eliteChance;
        this.hooks.spawnEnemy(this.chooseEnemyType(), position.x, position.y, elite);
      }
      return;
    }
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
    const stageEnemies = this.customPool ?? this.stage?.enemies ?? ['skeleton'];
    const packs: PackType[] = [];

    if (stageEnemies.includes('cursed-wolf')) packs.push('wolf_pack');
    if (stageEnemies.includes('thornling')) packs.push('thorn_volley');
    if (stageEnemies.includes('treant')) packs.push('treant_escort');
    if (stageEnemies.includes('frost-wraith')) packs.push('frost_hunt');
    if (stageEnemies.includes('bat')) packs.push('bat_swoop');
    if (stageEnemies.includes('archer')) packs.push('archer_escort');
    if (stageEnemies.includes('slime')) packs.push('slime_wall');
    if (stageEnemies.includes('imp')) packs.push('imp_rush');
    packs.push('melee_swarm');

    const chosenPack = packs[Math.floor(Math.random() * packs.length)];
    const baseAngle = Math.random() * Math.PI * 2;
    const eliteMultiplier = this.stage?.difficulty.eliteMultiplier ?? 1;

    switch (chosenPack) {
      case 'wolf_pack': {
        const count = 4;
        for (let i = 0; i < count; i += 1) {
          const angle = baseAngle + (i - 1.5) * 0.28;
          const pos = this.getSafeSpawnPosition(angle);
          this.hooks.spawnEnemy('cursed-wolf', pos.x, pos.y, i === 0 && Math.random() < 0.28 * eliteMultiplier);
        }
        break;
      }
      case 'thorn_volley': {
        const escortKind: EnemyKind = stageEnemies.includes('treant')
          ? 'treant'
          : stageEnemies.includes('slime')
          ? 'slime'
          : 'cursed-wolf';
        const posFront = this.getSafeSpawnPosition(baseAngle);
        this.hooks.spawnEnemy(escortKind, posFront.x, posFront.y, false);
        for (let i = 0; i < 2; i += 1) {
          const angle = baseAngle + (i - 0.5) * 0.4;
          const pos = this.getSafeSpawnPosition(angle, 65);
          this.hooks.spawnEnemy('thornling', pos.x, pos.y, i === 0 && Math.random() < 0.25 * eliteMultiplier);
        }
        break;
      }
      case 'treant_escort': {
        const posTreant = this.getSafeSpawnPosition(baseAngle);
        this.hooks.spawnEnemy('treant', posTreant.x, posTreant.y, Math.random() < 0.2 * eliteMultiplier);
        const minionKind: EnemyKind = stageEnemies.includes('thornling')
          ? 'thornling'
          : stageEnemies.includes('slime')
          ? 'slime'
          : 'cursed-wolf';
        for (let i = 0; i < 2; i += 1) {
          const angle = baseAngle + (i === 0 ? -0.4 : 0.4);
          const pos = this.getSafeSpawnPosition(angle, 35);
          this.hooks.spawnEnemy(minionKind, pos.x, pos.y, false);
        }
        break;
      }
      case 'frost_hunt': {
        for (let i = 0; i < 2; i += 1) {
          const angle = baseAngle + (i - 0.5) * 0.5;
          const pos = this.getSafeSpawnPosition(angle);
          this.hooks.spawnEnemy('frost-wraith', pos.x, pos.y, i === 0 && Math.random() < 0.3 * eliteMultiplier);
        }
        break;
      }
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
        const frontMelee: EnemyKind = stageEnemies.includes('skeleton')
          ? 'skeleton'
          : stageEnemies.includes('knight')
          ? 'knight'
          : stageEnemies[0];
        const count = 3;
        for (let i = 0; i < count; i += 1) {
          const angle = baseAngle + (i - 1) * 0.3;
          const pos = this.getSafeSpawnPosition(angle, 0);
          this.hooks.spawnEnemy(frontMelee, pos.x, pos.y, false);
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
        const meleeKind: EnemyKind = stageEnemies.includes('demon')
          ? 'demon'
          : stageEnemies.includes('knight')
          ? 'knight'
          : stageEnemies.includes('cursed-wolf')
          ? 'cursed-wolf'
          : stageEnemies.includes('slime')
          ? 'slime'
          : 'skeleton';
        const count = 4;
        for (let i = 0; i < count; i += 1) {
          const angle = baseAngle + (i - 1.5) * 0.32;
          const pos = this.getSafeSpawnPosition(angle);
          this.hooks.spawnEnemy(meleeKind, pos.x, pos.y, i === 0 && Math.random() < 0.28 * eliteMultiplier);
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

    const maxAlive = this.isSurvival
      ? Math.min(96, 68 + Math.floor((this.elapsed / 60) * 6))
      : (this.elapsed > 110 ? 95 : 68);
    if (this.hooks.getAliveCount() >= maxAlive) return;

    // Pack spawner check
    this.packTimer -= delta;
    if (this.packTimer <= 0) {
      this.spawnAuthoredPack();
      const packInterval = this.isSurvival
        ? Math.max(12, 18 - (this.elapsed / 60) * 1.0) + Math.random() * 4
        : (18 + Math.random() * 6);
      this.packTimer = packInterval;
    }

    // Regular drip spawner check
    this.spawnTimer -= delta;
    if (this.spawnTimer <= 0) {
      this.spawnRegularWave();
      this.spawnTimer = this.calculateSpawnRate();
    }
  }
}
