import { ENEMY_BALANCE } from '../../data/balance';
import type { EnemyKind, StageDefinition } from '../../types';
import { announceCombatWave } from './CombatTargeting';

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

const CAMPAIGN_SURGE_THRESHOLDS = [0.20, 0.46, 0.72, 0.88] as const;

export class EnemySpawner {
  private stage?: StageDefinition;
  private customPool?: EnemyKind[];
  private isSurvival = false;
  private elapsed = 0;
  private spawnTimer = 0;
  private packTimer = 6;
  private breathingTimer = 0;
  private stopped = false;
  private surgeIndex = 0;
  private survivalSurgeTimer = 32;
  private lastPackAngle = 0;

  constructor(private readonly hooks: SpawnHooks) {}

  loadStageTimeline(stage: StageDefinition, customPool?: EnemyKind[], isSurvival = false): void {
    this.stage = stage;
    this.customPool = customPool;
    this.isSurvival = isSurvival;
    this.elapsed = 0;
    this.spawnTimer = 0.25;
    this.packTimer = 5.5;
    this.breathingTimer = 0;
    this.stopped = false;
    this.surgeIndex = 0;
    this.survivalSurgeTimer = 30;
    this.lastPackAngle = Math.random() * Math.PI * 2;
  }

  stopSpawning(): void {
    this.stopped = true;
  }

  calculateSpawnRate(): number {
    if (this.isSurvival) {
      const minutes = this.elapsed / 60;
      const breathingFactor = this.breathingTimer > 0 ? 2.1 : 1.0;
      return Math.max(0.20, (0.66 / (1 + minutes * 0.17)) * breathingFactor);
    }

    const progress = Math.min(1, this.elapsed / (this.stage?.duration ?? 160));
    const density = this.stage?.difficulty.densityMultiplier ?? 1;
    const breathingFactor = this.breathingTimer > 0 ? 2.35 : 1.0;
    // Start readable, then accelerate into a dense final minute.
    return Math.max(0.21, ((0.76 - progress * 0.43) * breathingFactor) / density);
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
    const distance = 420 + Math.random() * 120 + distanceOffset;
    return {
      x: Math.min(world.width - 55, Math.max(55, player.x + Math.cos(angle) * distance)),
      y: Math.min(world.height - 55, Math.max(55, player.y + Math.sin(angle) * distance)),
    };
  }

  spawnRegularWave(): void {
    if (this.isSurvival) {
      const minutes = this.elapsed / 60;
      const count = Math.min(6, 2 + Math.floor(minutes * 0.65));
      const eliteChance = Math.min(0.42, 0.05 + minutes * 0.04);
      const baseAngle = Math.random() * Math.PI * 2;
      for (let index = 0; index < count; index += 1) {
        const position = this.getSafeSpawnPosition(baseAngle + (index - (count - 1) / 2) * 0.18);
        const elite = Math.random() < eliteChance;
        this.hooks.spawnEnemy(this.chooseEnemyType(), position.x, position.y, elite);
      }
      return;
    }

    const progress = Math.min(1, this.elapsed / Math.max(1, this.stage?.duration ?? 160));
    const baseCount = progress > 0.72 ? 3 : progress > 0.30 ? 2 : 1;
    const density = this.stage?.difficulty.densityMultiplier ?? 1;
    const count = Math.min(4, Math.max(1, Math.round(baseCount * density)));
    const eliteMultiplier = this.stage?.difficulty.eliteMultiplier ?? 1;

    // Drip enemies arrive in a loose lane instead of unrelated random dots.
    const baseAngle = this.lastPackAngle + (Math.random() - 0.5) * 1.35;
    for (let index = 0; index < count; index += 1) {
      const angle = baseAngle + (index - (count - 1) / 2) * 0.16;
      const position = this.getSafeSpawnPosition(angle, index * 8);
      const elite =
        this.elapsed > 38 &&
        Math.random() < Math.min(0.30, (0.028 + this.elapsed / 1700) * eliteMultiplier);
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
    // Rotate the pressure direction between packs so the player must keep moving.
    const baseAngle = this.lastPackAngle + Math.PI * (0.45 + Math.random() * 0.65);
    this.lastPackAngle = baseAngle;
    const eliteMultiplier = this.stage?.difficulty.eliteMultiplier ?? 1;

    switch (chosenPack) {
      case 'wolf_pack': {
        for (let i = 0; i < 4; i += 1) {
          const angle = baseAngle + (i - 1.5) * 0.28;
          const pos = this.getSafeSpawnPosition(angle);
          this.hooks.spawnEnemy('cursed-wolf', pos.x, pos.y, i === 0 && Math.random() < 0.30 * eliteMultiplier);
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
          const angle = baseAngle + (i - 0.5) * 0.42;
          const pos = this.getSafeSpawnPosition(angle, 70);
          this.hooks.spawnEnemy('thornling', pos.x, pos.y, i === 0 && Math.random() < 0.28 * eliteMultiplier);
        }
        break;
      }
      case 'treant_escort': {
        const posTreant = this.getSafeSpawnPosition(baseAngle);
        this.hooks.spawnEnemy('treant', posTreant.x, posTreant.y, Math.random() < 0.22 * eliteMultiplier);
        const minionKind: EnemyKind = stageEnemies.includes('thornling')
          ? 'thornling'
          : stageEnemies.includes('slime')
          ? 'slime'
          : 'cursed-wolf';
        for (let i = 0; i < 3; i += 1) {
          const angle = baseAngle + (i - 1) * 0.34;
          const pos = this.getSafeSpawnPosition(angle, 38);
          this.hooks.spawnEnemy(minionKind, pos.x, pos.y, false);
        }
        break;
      }
      case 'frost_hunt': {
        for (let i = 0; i < 3; i += 1) {
          const angle = baseAngle + (i - 1) * 0.38;
          const pos = this.getSafeSpawnPosition(angle);
          this.hooks.spawnEnemy('frost-wraith', pos.x, pos.y, i === 1 && Math.random() < 0.30 * eliteMultiplier);
        }
        break;
      }
      case 'bat_swoop': {
        for (let i = 0; i < 5; i += 1) {
          const angle = baseAngle + (i - 2) * 0.26;
          const pos = this.getSafeSpawnPosition(angle);
          this.hooks.spawnEnemy('bat', pos.x, pos.y, i === 2 && Math.random() < 0.25 * eliteMultiplier);
        }
        break;
      }
      case 'archer_escort': {
        const frontMelee: EnemyKind = stageEnemies.includes('skeleton')
          ? 'skeleton'
          : stageEnemies.includes('knight')
          ? 'knight'
          : stageEnemies[0];
        for (let i = 0; i < 3; i += 1) {
          const angle = baseAngle + (i - 1) * 0.28;
          const pos = this.getSafeSpawnPosition(angle);
          this.hooks.spawnEnemy(frontMelee, pos.x, pos.y, false);
        }
        for (let i = 0; i < 2; i += 1) {
          const angle = baseAngle + (i - 0.5) * 0.48;
          const pos = this.getSafeSpawnPosition(angle, 72);
          this.hooks.spawnEnemy('archer', pos.x, pos.y, i === 0 && Math.random() < 0.32 * eliteMultiplier);
        }
        break;
      }
      case 'slime_wall': {
        for (let i = 0; i < 4; i += 1) {
          const angle = baseAngle + (i - 1.5) * 0.36;
          const pos = this.getSafeSpawnPosition(angle);
          this.hooks.spawnEnemy('slime', pos.x, pos.y, i === 1 && Math.random() < 0.30 * eliteMultiplier);
        }
        break;
      }
      case 'imp_rush': {
        for (let i = 0; i < 4; i += 1) {
          const angle = baseAngle + (i - 1.5) * 0.30;
          const pos = this.getSafeSpawnPosition(angle);
          this.hooks.spawnEnemy('imp', pos.x, pos.y, false);
        }
        break;
      }
      case 'melee_swarm':
      default: {
        const meleeKind = this.pickFrontliner(stageEnemies);
        for (let i = 0; i < 5; i += 1) {
          const angle = baseAngle + (i - 2) * 0.25;
          const pos = this.getSafeSpawnPosition(angle);
          this.hooks.spawnEnemy(meleeKind, pos.x, pos.y, i === 2 && Math.random() < 0.30 * eliteMultiplier);
        }
        break;
      }
    }

    this.breathingTimer = 2.3;
  }

  private spawnSurgeWave(): void {
    const stageEnemies = this.customPool ?? this.stage?.enemies ?? ['skeleton'];
    const baseAngle = this.lastPackAngle + Math.PI * (0.75 + Math.random() * 0.5);
    const opposite = baseAngle + Math.PI;
    this.lastPackAngle = baseAngle;
    const frontline = this.pickFrontliner(stageEnemies);
    const ranged = this.pickRanged(stageEnemies);
    const progress = this.stage ? Math.min(1, this.elapsed / Math.max(1, this.stage.duration)) : 0.5;
    const eliteMultiplier = this.stage?.difficulty.eliteMultiplier ?? 1;
    const stageNumber = this.stage?.stageNumber ?? 1;
    const flankCount = Math.min(4, 2 + Math.floor(stageNumber / 2));

    for (const sideAngle of [baseAngle, opposite]) {
      for (let i = 0; i < flankCount; i += 1) {
        const angle = sideAngle + (i - (flankCount - 1) / 2) * 0.22;
        const pos = this.getSafeSpawnPosition(angle);
        const elite =
          i === Math.floor(flankCount / 2) &&
          progress > 0.42 &&
          Math.random() < Math.min(0.55, 0.18 * eliteMultiplier + progress * 0.14);
        this.hooks.spawnEnemy(frontline, pos.x, pos.y, elite);
      }

      if (ranged && progress > 0.30) {
        const pos = this.getSafeSpawnPosition(sideAngle, 82);
        this.hooks.spawnEnemy(ranged, pos.x, pos.y, false);
      }
    }

    const worldId = this.stage?.worldId ?? 1;
    const label = worldId === 1
      ? 'BONE SURGE'
      : worldId === 2
      ? 'CURSED HUNT'
      : worldId === 3
      ? 'WHITEOUT RUSH'
      : 'HELLBREACH';
    announceCombatWave({
      label,
      detail: ranged ? 'Two fronts closing in' : 'Enemies are surrounding you',
      tone: progress > 0.68 ? 'elite' : 'danger',
    });
    this.breathingTimer = 3.1;
  }

  private pickFrontliner(pool: EnemyKind[]): EnemyKind {
    for (const kind of ['demon', 'knight', 'cursed-wolf', 'slime', 'skeleton'] as EnemyKind[]) {
      if (pool.includes(kind)) return kind;
    }
    return pool[0] ?? 'skeleton';
  }

  private pickRanged(pool: EnemyKind[]): EnemyKind | undefined {
    for (const kind of ['thornling', 'archer', 'frost-wraith', 'ghost'] as EnemyKind[]) {
      if (pool.includes(kind) && (ENEMY_BALANCE[kind]?.minTime ?? 0) <= this.elapsed) return kind;
    }
    return undefined;
  }

  update(delta: number): void {
    if (this.stopped || !this.stage) return;
    this.elapsed += delta;
    this.breathingTimer = Math.max(0, this.breathingTimer - delta);

    const maxAlive = this.isSurvival
      ? Math.min(102, 70 + Math.floor((this.elapsed / 60) * 7))
      : (this.elapsed > this.stage.duration * 0.68 ? 92 : 70);
    if (this.hooks.getAliveCount() >= maxAlive) return;

    if (this.isSurvival) {
      this.survivalSurgeTimer -= delta;
      if (this.survivalSurgeTimer <= 0) {
        this.spawnSurgeWave();
        this.survivalSurgeTimer = Math.max(24, 34 - (this.elapsed / 60) * 1.2);
      }
    } else {
      const progress = Math.min(1, this.elapsed / Math.max(1, this.stage.duration));
      if (
        this.surgeIndex < CAMPAIGN_SURGE_THRESHOLDS.length &&
        progress >= CAMPAIGN_SURGE_THRESHOLDS[this.surgeIndex]
      ) {
        this.surgeIndex += 1;
        this.spawnSurgeWave();
      }
    }

    this.packTimer -= delta;
    if (this.packTimer <= 0) {
      this.spawnAuthoredPack();
      const packInterval = this.isSurvival
        ? Math.max(9.5, 13.5 - (this.elapsed / 60) * 0.65) + Math.random() * 2.8
        : 11.5 + Math.random() * 4.2;
      this.packTimer = packInterval;
    }

    this.spawnTimer -= delta;
    if (this.spawnTimer <= 0) {
      this.spawnRegularWave();
      this.spawnTimer = this.calculateSpawnRate();
    }
  }
}
