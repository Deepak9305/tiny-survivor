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
  private attackTimer = 3.2;
  private pendingAttack = 0;
  private pendingAttackType?: BossAttack;
  private attackCursor = 0;
  private dead = false;
  private echoActive = false;

  constructor(private readonly hooks: BossHooks) {}

  spawnBoss(id: BossId): void {
    const definition = getBossDefinition(id) ?? getBossDefinition('skeleton-king');
    if (!definition) return;
    this.state = { id: definition.id, name: definition.name, hp: definition.hp, maxHp: definition.hp, phase: 1 };
    this.attackTimer = 3.2;
    this.pendingAttack = 0;
    this.pendingAttackType = undefined;
    this.attackCursor = 0;
    this.dead = false;
    this.echoActive = false;
  }

  setEchoActive(active: boolean): void {
    this.echoActive = active;
    if (active && this.attackTimer < 2.75) {
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
    if (distance > 105) this.hooks.setBossPosition(boss.x + (dx / distance) * definition.speed * 1.08 * delta, boss.y + (dy / distance) * definition.speed * 1.08 * delta);
    this.attackTimer -= delta;
    if (this.pendingAttack > 0) {
      this.pendingAttack -= delta;
      if (this.pendingAttack <= 0) {
        const position = this.hooks.getBossPosition();
        const attack = this.pendingAttackType ?? this.chooseBossAttack();
        this.hooks.executeAttack(attack, position.x, position.y);
        if (attack === 'summon' || attack === 'summon-imps') this.hooks.spawnSummon(definition.summonKind);
        this.pendingAttackType = undefined;
        const baseInterval = this.state.phase === 2 ? 2.25 : 3.45;
        this.attackTimer = this.echoActive ? baseInterval * 1.32 : baseInterval;
      }
    } else if (this.attackTimer <= 0) {
      const position = this.hooks.getBossPosition();
      // Telegraphs remain readable even though the overall cadence is faster.
      this.pendingAttack = this.state.phase === 2 ? 0.58 : 0.66;
      this.pendingAttackType = this.chooseBossAttack();
      this.hooks.telegraphAttack(this.pendingAttackType, position.x, position.y);
    }
  }

  chooseBossAttack(): BossAttack {
    const definition = this.getDefinition();
    if (!definition) return 'slam';
    const attacks = this.state?.phase === 2 ? definition.attackSet : definition.attackSet.slice(0, Math.max(2, definition.attackSet.length - 1));
    const attack = attacks[this.attackCursor % attacks.length] ?? definition.attackSet[0];
    this.attackCursor += 1;
    return attack;
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
