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
  | 'melee_pressure'
  | 'bat_swoop'
  | 'ranged_screen'
  | 'mage_crossfire'
  | 'slime_wall'
  | 'imp_rush'
  | 'wolf_hunt'
  | 'guardian_push'
  | 'frost_crossfire'
  | 'hellguard_breach';

type SetPieceType = 'champion' | 'crossfire' | 'mist_ambush' | 'gauntlet';

const CAMPAIGN_SURGE_THRESHOLDS = [0.28, 0.60, 0.84] as const;
const RANGED_KINDS: EnemyKind[] = ['archer', 'thornling', 'bone-mage', 'forest-mage', 'ice-mage'];
const MAGE_KINDS: EnemyKind[] = ['bone-mage', 'forest-mage', 'ice-mage'];
const MOBILE_KINDS: EnemyKind[] = ['bat', 'cursed-wolf', 'ghost', 'frost-wraith', 'imp'];
const HEAVY_KINDS: EnemyKind[] = ['demon-warrior', 'forest-guardian', 'treant', 'knight', 'zombie', 'slime'];

export class EnemySpawner {
  private stage?: StageDefinition;
  private customPool?: EnemyKind[];
  private isSurvival = false;
  private elapsed = 0;
  private spawnTimer = 0;
  private packTimer = 0;
  private setPieceTimer = 0;
  private breathingTimer = 0;
  private stopped = false;
  private surgeIndex = 0;
  private survivalSurgeTimer = 34;
  private lastPackAngle = 0;
  private lastSetPiece: SetPieceType | undefined;

  constructor(private readonly hooks: SpawnHooks) {}

  loadStageTimeline(stage: StageDefinition, customPool?: EnemyKind[], isSurvival = false): void {
    this.stage = stage;
    this.customPool = customPool;
    this.isSurvival = isSurvival;
    this.elapsed = 0;
    this.spawnTimer = 1.1;
    this.packTimer = 8.5;
    this.setPieceTimer = isSurvival ? 28 : 24 + Math.random() * 8;
    this.breathingTimer = 0;
    this.stopped = false;
    this.surgeIndex = 0;
    this.survivalSurgeTimer = 34;
    this.lastPackAngle = Math.random() * Math.PI * 2;
    this.lastSetPiece = undefined;
  }

  stopSpawning(): void {
    this.stopped = true;
  }

  calculateSpawnRate(): number {
    if (this.isSurvival) {
      const minutes = this.elapsed / 60;
      const breathing = this.breathingTimer > 0 ? 2.1 : 1;
      return Math.max(0.82, (1.45 / (1 + minutes * 0.05)) * breathing);
    }

    const progress = this.getProgress();
    const density = this.stage?.difficulty.densityMultiplier ?? 1;
    const breathing = this.breathingTimer > 0 ? 2.45 : 1;
    return Math.max(1.08, ((1.92 - progress * 0.38) * breathing) / Math.max(0.72, density));
  }

  chooseEnemyType(allowedKinds?: EnemyKind[]): EnemyKind {
    const stageAllowed = allowedKinds ?? this.customPool ?? this.stage?.enemies ?? ['skeleton'];
    const available = stageAllowed.filter((type) => (ENEMY_BALANCE[type]?.minTime ?? 0) <= this.elapsed);
    const pool = available.length > 0 ? available : stageAllowed;
    const closeRange = pool.filter((kind) => !RANGED_KINDS.includes(kind));
    const selectedPool = closeRange.length > 0 && Math.random() < 0.72 ? closeRange : pool;
    return selectedPool[Math.floor(Math.random() * selectedPool.length)] ?? 'skeleton';
  }

  getSafeSpawnPosition(preferredAngle?: number, distanceOffset = 0): { x: number; y: number } {
    const player = this.hooks.getPlayerPosition();
    const world = this.hooks.getWorldSize();
    const angle = preferredAngle ?? Math.random() * Math.PI * 2;
    const distance = 420 + Math.random() * 105 + distanceOffset;
    return {
      x: Math.min(world.width - 62, Math.max(62, player.x + Math.cos(angle) * distance)),
      y: Math.min(world.height - 68, Math.max(68, player.y + Math.sin(angle) * distance)),
    };
  }

  spawnRegularWave(): void {
    const pool = this.getAvailablePool();
    if (pool.length === 0) return;

    if (this.isSurvival) {
      const minutes = this.elapsed / 60;
      const count = Math.min(3, 1 + Math.floor(minutes / 4));
      const baseAngle = this.lastPackAngle + (Math.random() - 0.5) * 1.3;
      for (let index = 0; index < count; index += 1) {
        const kind = this.chooseEnemyType(pool);
        const eliteChance = Math.min(0.25, 0.03 + minutes * 0.022);
        this.spawnAtAngle(kind, baseAngle + (index - (count - 1) / 2) * 0.18, index * 12, Math.random() < eliteChance);
      }
      return;
    }

    const progress = this.getProgress();
    const stageNumber = this.stage?.stageNumber ?? 1;
    const count = progress > 0.82 && stageNumber >= 8 ? 2 : 1;
    const baseAngle = this.lastPackAngle + (Math.random() - 0.5) * 1.08;
    const eliteChance = this.getEliteChance(progress) * 0.32;

    for (let index = 0; index < count; index += 1) {
      const kind = this.chooseEnemyType(pool);
      this.spawnAtAngle(kind, baseAngle + (index - (count - 1) / 2) * 0.16, index * 12, Math.random() < eliteChance);
    }
  }

  spawnAuthoredPack(): void {
    const pool = this.getAvailablePool();
    if (pool.length === 0) return;

    const packs: PackType[] = ['melee_pressure'];
    if (pool.some((kind) => MAGE_KINDS.includes(kind))) packs.push('mage_crossfire');
    if (pool.some((kind) => RANGED_KINDS.includes(kind))) packs.push('ranged_screen');
    if (pool.includes('bat')) packs.push('bat_swoop');
    if (pool.includes('cursed-wolf')) packs.push('wolf_hunt');
    if (pool.includes('slime')) packs.push('slime_wall');
    if (pool.includes('forest-guardian') || pool.includes('treant')) packs.push('guardian_push');
    if (pool.includes('frost-wraith') || pool.includes('ice-mage')) packs.push('frost_crossfire');
    if (pool.includes('imp')) packs.push('imp_rush');
    if (pool.includes('demon-warrior')) packs.push('hellguard_breach');

    const pack = packs[Math.floor(Math.random() * packs.length)] ?? 'melee_pressure';
    const baseAngle = this.nextPressureAngle();
    const eliteChance = this.getEliteChance(this.getProgress());

    switch (pack) {
      case 'mage_crossfire': {
        const mage = this.pickMage(pool);
        const front = this.pickFrontliner(pool);
        this.spawnAtAngle(front, baseAngle, 0, Math.random() < eliteChance * 0.5);
        if (mage) {
          this.spawnAtAngle(mage, baseAngle - 0.55, 82, false);
          this.spawnAtAngle(mage, baseAngle + 0.55, 82, Math.random() < eliteChance * 0.3);
        }
        break;
      }
      case 'ranged_screen': {
        const front = this.pickFrontliner(pool);
        const ranged = this.pickRanged(pool);
        this.spawnAtAngle(front, baseAngle - 0.18, 0, Math.random() < eliteChance * 0.45);
        this.spawnAtAngle(front, baseAngle + 0.18, 0, false);
        if (ranged) this.spawnAtAngle(ranged, baseAngle, 92, false);
        break;
      }
      case 'bat_swoop': {
        const count = this.stage && this.stage.stageNumber >= 7 ? 4 : 3;
        for (let i = 0; i < count; i += 1) {
          this.spawnAtAngle('bat', baseAngle + (i - (count - 1) / 2) * 0.28, i * 6, i === Math.floor(count / 2) && Math.random() < eliteChance * 0.35);
        }
        break;
      }
      case 'wolf_hunt': {
        const count = this.stage && this.stage.stageNumber >= 6 ? 3 : 2;
        for (let i = 0; i < count; i += 1) {
          this.spawnAtAngle('cursed-wolf', baseAngle + (i - (count - 1) / 2) * 0.38, i * 10, i === 0 && Math.random() < eliteChance * 0.45);
        }
        const ranged = this.pickRanged(pool);
        if (ranged && count >= 3) this.spawnAtAngle(ranged, baseAngle + 0.66, 74, false);
        break;
      }
      case 'slime_wall': {
        for (let i = 0; i < 3; i += 1) {
          this.spawnAtAngle('slime', baseAngle + (i - 1) * 0.36, 0, i === 1 && Math.random() < eliteChance * 0.5);
        }
        break;
      }
      case 'guardian_push': {
        const heavy: EnemyKind = pool.includes('forest-guardian') ? 'forest-guardian' : 'treant';
        this.spawnAtAngle(heavy, baseAngle, 0, Math.random() < eliteChance * 0.6);
        const support = this.pickRanged(pool) ?? this.pickMobile(pool) ?? this.pickFrontliner(pool);
        this.spawnAtAngle(support, baseAngle - 0.46, 62, false);
        this.spawnAtAngle(support, baseAngle + 0.46, 62, false);
        break;
      }
      case 'frost_crossfire': {
        const mage: EnemyKind | undefined = pool.includes('ice-mage') ? 'ice-mage' : undefined;
        const hunter: EnemyKind = pool.includes('frost-wraith') ? 'frost-wraith' : this.pickFrontliner(pool);
        this.spawnAtAngle(hunter, baseAngle - 0.30, 0, Math.random() < eliteChance * 0.4);
        this.spawnAtAngle(hunter, baseAngle + 0.30, 0, false);
        if (mage) this.spawnAtAngle(mage, baseAngle, 96, false);
        break;
      }
      case 'imp_rush': {
        const count = this.stage && this.stage.stageNumber >= 7 ? 3 : 2;
        for (let i = 0; i < count; i += 1) this.spawnAtAngle('imp', baseAngle + (i - (count - 1) / 2) * 0.40, 0, false);
        const guard = this.pickFrontliner(pool);
        if (guard !== 'imp') this.spawnAtAngle(guard, baseAngle + 0.62, 44, false);
        break;
      }
      case 'hellguard_breach': {
        this.spawnAtAngle('demon-warrior', baseAngle, 0, Math.random() < eliteChance * 0.65);
        const mobile = this.pickMobile(pool) ?? 'demon';
        this.spawnAtAngle(mobile, baseAngle - 0.50, 48, false);
        this.spawnAtAngle(mobile, baseAngle + 0.50, 48, false);
        break;
      }
      case 'melee_pressure':
      default: {
        const front = this.pickFrontliner(pool);
        const count = this.stage && this.stage.stageNumber >= 8 ? 4 : 3;
        for (let i = 0; i < count; i += 1) {
          this.spawnAtAngle(front, baseAngle + (i - (count - 1) / 2) * 0.30, 0, i === Math.floor(count / 2) && Math.random() < eliteChance * 0.5);
        }
        break;
      }
    }

    this.breathingTimer = this.isSurvival ? 2.8 : 4.2;
  }

  private spawnSurgeWave(): void {
    const pool = this.getAvailablePool();
    if (pool.length === 0) return;

    const baseAngle = this.nextPressureAngle();
    const opposite = baseAngle + Math.PI * (0.88 + Math.random() * 0.24);
    const front = this.pickFrontliner(pool);
    const ranged = this.pickRanged(pool);
    const mobile = this.pickMobile(pool);
    const progress = this.getProgress();
    const eliteChance = this.getEliteChance(progress);

    for (const angle of [baseAngle, opposite]) {
      this.spawnAtAngle(front, angle - 0.17, 0, Math.random() < eliteChance * 0.55);
      this.spawnAtAngle(front, angle + 0.17, 0, false);
    }
    if (ranged && progress > 0.32) this.spawnAtAngle(ranged, baseAngle, 94, false);
    if (mobile && progress > 0.58) this.spawnAtAngle(mobile, opposite + 0.46, 38, false);

    const worldId = this.stage?.worldId ?? 1;
    const label = worldId === 1
      ? 'GRAVE FORMATION'
      : worldId === 2
      ? 'CURSED PINCER'
      : worldId === 3
      ? 'FROST CROSSING'
      : 'HELLBREACH';

    announceCombatWave({
      label,
      detail: ranged ? 'Break the frontline or dodge the crossfire' : 'Two attack lanes are closing in',
      tone: progress > 0.66 ? 'elite' : 'danger',
    });
    this.breathingTimer = 5.2;
  }

  private spawnSetPiece(): void {
    const pool = this.getAvailablePool();
    if (pool.length === 0) return;

    const candidates: SetPieceType[] = ['champion', 'gauntlet'];
    if (this.pickRanged(pool)) candidates.push('crossfire');
    if (this.pickMobile(pool)) candidates.push('mist_ambush');
    const filtered = candidates.filter((type) => type !== this.lastSetPiece);
    const type = filtered[Math.floor(Math.random() * filtered.length)] ?? candidates[0];
    this.lastSetPiece = type;

    const base = this.nextPressureAngle();
    const opposite = base + Math.PI;
    const front = this.pickFrontliner(pool);
    const heavy = this.pickHeavy(pool) ?? front;
    const ranged = this.pickRanged(pool);
    const mobile = this.pickMobile(pool);

    if (type === 'champion') {
      this.spawnAtAngle(heavy, base, 0, true);
      if (ranged) this.spawnAtAngle(ranged, base - 0.55, 82, false);
      if (mobile) this.spawnAtAngle(mobile, base + 0.55, 42, false);
      announceCombatWave({ label: 'CHAMPION', detail: 'One dangerous target. Break its support first.', tone: 'elite' });
    } else if (type === 'crossfire') {
      this.spawnAtAngle(front, base, 0, false);
      if (ranged) {
        this.spawnAtAngle(ranged, base - 0.72, 92, false);
        this.spawnAtAngle(ranged, opposite + 0.72, 92, false);
      }
      announceCombatWave({ label: 'CROSSFIRE', detail: 'Ranged threats are covering opposite lanes.', tone: 'danger' });
    } else if (type === 'mist_ambush') {
      const hunter = mobile ?? front;
      this.spawnAtAngle(hunter, base - 0.5, -70, false);
      this.spawnAtAngle(hunter, base + 0.5, -70, false);
      if (ranged) this.spawnAtAngle(ranged, opposite, 62, false);
      announceCombatWave({ label: 'MIST AMBUSH', detail: 'Hunters are emerging closer than normal.', tone: 'danger' });
    } else {
      this.spawnAtAngle(heavy, base, 0, false);
      if (mobile) {
        this.spawnAtAngle(mobile, base - 0.78, 26, false);
        this.spawnAtAngle(mobile, base + 0.78, 26, false);
      }
      if (ranged) this.spawnAtAngle(ranged, opposite, 84, false);
      announceCombatWave({ label: 'GAUNTLET', detail: 'Heavy pressure ahead, flankers on both sides.', tone: 'elite' });
    }

    this.breathingTimer = 6.2;
  }

  private getAvailablePool(): EnemyKind[] {
    const stageAllowed = this.customPool ?? this.stage?.enemies ?? ['skeleton'];
    const available = stageAllowed.filter((kind) => (ENEMY_BALANCE[kind]?.minTime ?? 0) <= this.elapsed);
    return available.length > 0 ? available : stageAllowed;
  }

  private getProgress(): number {
    return Math.min(1, this.elapsed / Math.max(1, this.stage?.duration ?? 160));
  }

  private getEliteChance(progress: number): number {
    const multiplier = this.stage?.difficulty.eliteMultiplier ?? 1;
    return Math.min(0.32, (0.032 + progress * 0.07) * multiplier);
  }

  private nextPressureAngle(): number {
    const turn = Math.PI * (0.44 + Math.random() * 0.52);
    this.lastPackAngle = (this.lastPackAngle + turn) % (Math.PI * 2);
    return this.lastPackAngle;
  }

  private spawnAtAngle(kind: EnemyKind, angle: number, distanceOffset = 0, elite = false): void {
    const pos = this.getSafeSpawnPosition(angle, distanceOffset);
    this.hooks.spawnEnemy(kind, pos.x, pos.y, elite);
  }

  private pickFrontliner(pool: EnemyKind[]): EnemyKind {
    for (const kind of ['demon-warrior', 'forest-guardian', 'treant', 'knight', 'zombie', 'demon', 'slime', 'skeleton', 'cursed-wolf'] as EnemyKind[]) {
      if (pool.includes(kind)) return kind;
    }
    return pool.find((kind) => !RANGED_KINDS.includes(kind)) ?? pool[0] ?? 'skeleton';
  }

  private pickRanged(pool: EnemyKind[]): EnemyKind | undefined {
    for (const kind of ['ice-mage', 'forest-mage', 'bone-mage', 'thornling', 'archer'] as EnemyKind[]) {
      if (pool.includes(kind) && (ENEMY_BALANCE[kind]?.minTime ?? 0) <= this.elapsed) return kind;
    }
    return undefined;
  }

  private pickMage(pool: EnemyKind[]): EnemyKind | undefined {
    return MAGE_KINDS.find((kind) => pool.includes(kind) && (ENEMY_BALANCE[kind]?.minTime ?? 0) <= this.elapsed);
  }

  private pickMobile(pool: EnemyKind[]): EnemyKind | undefined {
    return MOBILE_KINDS.find((kind) => pool.includes(kind) && (ENEMY_BALANCE[kind]?.minTime ?? 0) <= this.elapsed);
  }

  private pickHeavy(pool: EnemyKind[]): EnemyKind | undefined {
    return HEAVY_KINDS.find((kind) => pool.includes(kind) && (ENEMY_BALANCE[kind]?.minTime ?? 0) <= this.elapsed);
  }

  update(delta: number): void {
    if (this.stopped || !this.stage) return;
    this.elapsed += delta;
    this.breathingTimer = Math.max(0, this.breathingTimer - delta);

    const progress = this.getProgress();
    const stageNumber = this.stage.stageNumber ?? 1;
    const maxAlive = this.isSurvival
      ? Math.min(58, 34 + Math.floor((this.elapsed / 60) * 4))
      : Math.min(34, 18 + Math.round(stageNumber * 1.05) + (progress > 0.78 ? 3 : 0));

    if (this.hooks.getAliveCount() >= maxAlive) return;

    this.setPieceTimer -= delta;
    if (this.setPieceTimer <= 0 && this.hooks.getAliveCount() <= maxAlive - 5) {
      this.spawnSetPiece();
      this.setPieceTimer = this.isSurvival ? 31 + Math.random() * 9 : 34 + Math.random() * 11;
    }

    if (this.isSurvival) {
      this.survivalSurgeTimer -= delta;
      if (this.survivalSurgeTimer <= 0) {
        this.spawnSurgeWave();
        this.survivalSurgeTimer = Math.max(27, 38 - (this.elapsed / 60) * 0.7);
      }
    } else if (
      this.surgeIndex < CAMPAIGN_SURGE_THRESHOLDS.length &&
      progress >= CAMPAIGN_SURGE_THRESHOLDS[this.surgeIndex]
    ) {
      this.surgeIndex += 1;
      this.spawnSurgeWave();
    }

    this.packTimer -= delta;
    if (this.packTimer <= 0 && this.hooks.getAliveCount() < maxAlive - 4) {
      this.spawnAuthoredPack();
      this.packTimer = this.isSurvival
        ? Math.max(11, 15 - (this.elapsed / 60) * 0.38) + Math.random() * 2.8
        : 13.5 + Math.random() * 4.5;
    }

    this.spawnTimer -= delta;
    if (this.spawnTimer <= 0 && this.hooks.getAliveCount() < maxAlive - 1) {
      this.spawnRegularWave();
      this.spawnTimer = this.calculateSpawnRate();
    }
  }
}
