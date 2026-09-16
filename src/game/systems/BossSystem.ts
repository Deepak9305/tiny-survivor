import { getBossDefinition } from '../../data/bosses';
import type { BossAttack, BossId, EnemyKind } from '../../types';

export interface BossHooks {
  getPlayerPosition: () => { x: number; y: number };
  getBossPosition: () => { x: number; y: number };
  setBossPosition: (x: number, y: number) => void;
  spawnSummon: (kind: EnemyKind) => void;
  telegraphAttack: (attack: BossAttack, x: number, y: number) => void;
  executeAttack: (attack: BossAttack, x: number, y: number) => void;
}

export interface BossState {
  id: BossId;
  name: string;
  hp: number;
  maxHp: number;
  phase: number;
}

export class BossSystem {
  private state?: BossState;
  private attackTimer = 2.8;
  private pendingAttack = 0;
  private pendingAttackType?: BossAttack;
  private dead = false;
  private echoActive = false;
  private lastAttack?: BossAttack;
  private attacksSinceBurst = 0;
  private movementClock = 0;
  private strafeDirection = 1;

  constructor(private readonly hooks: BossHooks) {}

  spawnBoss(id: BossId): void {
    const definition = getBossDefinition(id) ?? getBossDefinition('skeleton-king');
    if (!definition) return;
    this.state = { id: definition.id, name: definition.name, hp: definition.hp, maxHp: definition.hp, phase: 1 };
    this.attackTimer = 2.8;
    this.pendingAttack = 0;
    this.pendingAttackType = undefined;
    this.dead = false;
    this.echoActive = false;
    this.lastAttack = undefined;
    this.attacksSinceBurst = 0;
    this.movementClock = 0;
    this.strafeDirection = Math.random() < 0.5 ? -1 : 1;
  }

  setEchoActive(active: boolean): void {
    this.echoActive = active;
    if (active && this.attackTimer < 2.7) {
      this.attackTimer = 2.9;
    }
  }

  isActive(): boolean { return Boolean(this.state && !this.dead); }
  getState(): BossState | undefined { return this.state ? { ...this.state } : undefined; }
  getDefinition() { return this.state ? getBossDefinition(this.state.id) : undefined; }

  updateBoss(delta: number): void {
    if (!this.state || this.dead) return;
    const definition = getBossDefinition(this.state.id);
    if (!definition) return;

    const boss = this.hooks.getBossPosition();
    const player = this.hooks.getPlayerPosition();
    const dx = player.x - boss.x;
    const dy = player.y - boss.y;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const phaseSpeed = this.state.phase === 2 ? 1.16 : 1.07;

    // Bosses should feel alive between attacks: close the gap, then circle rather
    // than standing still like a turret.
    this.movementClock += delta;
    if (this.movementClock >= 2.4) {
      this.movementClock = 0;
      this.strafeDirection *= -1;
    }

    if (this.pendingAttack <= 0) {
      if (distance > 118) {
        this.hooks.setBossPosition(
          boss.x + (dx / distance) * definition.speed * phaseSpeed * delta,
          boss.y + (dy / distance) * definition.speed * phaseSpeed * delta
        );
      } else if (distance > 72) {
        const strafeScale = definition.speed * (this.state.phase === 2 ? 0.56 : 0.38) * delta;
        const tangentX = (-dy / distance) * this.strafeDirection;
        const tangentY = (dx / distance) * this.strafeDirection;
        this.hooks.setBossPosition(
          boss.x + tangentX * strafeScale,
          boss.y + tangentY * strafeScale
        );
      } else {
        // Back off a touch so large melee bosses do not glue themselves to the player.
        this.hooks.setBossPosition(
          boss.x - (dx / distance) * definition.speed * 0.24 * delta,
          boss.y - (dy / distance) * definition.speed * 0.24 * delta
        );
      }
    }

    this.attackTimer -= delta;
    if (this.pendingAttack > 0) {
      this.pendingAttack -= delta;
      if (this.pendingAttack <= 0) {
        const position = this.hooks.getBossPosition();
        const attack = this.pendingAttackType ?? this.chooseBossAttack();
        this.hooks.executeAttack(attack, position.x, position.y);
        if (attack === 'summon' || attack === 'summon-imps') this.hooks.spawnSummon(definition.summonKind);
        this.lastAttack = attack;
        this.pendingAttackType = undefined;
        this.attacksSinceBurst += 1;

        const phaseTwo = this.state.phase === 2;
        const normalInterval = phaseTwo ? 2.18 : 3.35;
        const burstInterval = phaseTwo && this.attacksSinceBurst >= 3 ? 1.35 : normalInterval;
        if (burstInterval < normalInterval) this.attacksSinceBurst = 0;
        this.attackTimer = this.echoActive ? burstInterval * 1.34 : burstInterval;
      }
    } else if (this.attackTimer <= 0) {
      const position = this.hooks.getBossPosition();
      this.pendingAttack = this.state.phase === 2 ? 0.54 : 0.66;
      this.pendingAttackType = this.chooseBossAttack();
      this.hooks.telegraphAttack(this.pendingAttackType, position.x, position.y);
    }
  }

  chooseBossAttack(): BossAttack {
    const definition = this.getDefinition();
    if (!definition) return 'slam';

    const basePool = this.state?.phase === 2
      ? definition.attackSet
      : definition.attackSet.slice(0, Math.max(2, definition.attackSet.length - 1));
    const pool = basePool.filter((attack) => attack !== this.lastAttack);
    const choices = pool.length > 0 ? pool : basePool;

    // Avoid fully deterministic loops while still using the authored boss kit.
    // In phase two, mobility / projectile moves get a small extra chance to keep
    // the arena moving and make each attempt feel less scripted.
    const weighted = [...choices];
    if (this.state?.phase === 2) {
      for (const attack of choices) {
        if (
          attack === 'charge' ||
          attack === 'demon-charge' ||
          attack === 'blink' ||
          attack === 'spirit-volley' ||
          attack === 'ice-shard-fan' ||
          attack === 'fire-wave'
        ) {
          weighted.push(attack);
        }
      }
    }

    return weighted[Math.floor(Math.random() * weighted.length)] ?? definition.attackSet[0];
  }

  damageBoss(amount: number): boolean {
    if (!this.state || this.dead) return false;
    this.state.hp = Math.max(0, this.state.hp - Math.max(1, amount));
    const definition = getBossDefinition(this.state.id);
    if (definition && this.state.hp <= this.state.maxHp * definition.phaseThreshold) this.state.phase = 2;
    if (this.state.hp <= 0) return this.killBoss();
    return false;
  }

  setBossPhase(phase: number): void { if (this.state) this.state.phase = Math.max(1, phase); }

  killBoss(): boolean {
    if (!this.state || this.dead) return false;
    this.dead = true;
    this.state.hp = 0;
    return true;
  }
}
