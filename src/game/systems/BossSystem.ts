import { BOSS_BALANCE } from '../../data/balance';

export type BossAttack = 'slam' | 'bone-ring' | 'summon' | 'charge';

export interface BossHooks {
  getPlayerPosition: () => { x: number; y: number };
  getBossPosition: () => { x: number; y: number };
  setBossPosition: (x: number, y: number) => void;
  spawnSummon: () => void;
  telegraphAttack: (attack: BossAttack, x: number, y: number) => void;
  executeAttack: (attack: BossAttack, x: number, y: number) => void;
}

export interface BossState {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  phase: number;
}

export class BossSystem {
  private state?: BossState;
  private attackTimer = 4;
  private pendingAttack = 0;
  private pendingAttackType?: BossAttack;
  private dead = false;

  constructor(private readonly hooks: BossHooks) {}

  spawnBoss(id: string): void {
    this.state = { id, name: BOSS_BALANCE.name, hp: BOSS_BALANCE.maxHp, maxHp: BOSS_BALANCE.maxHp, phase: 1 };
    this.attackTimer = 3.8;
    this.pendingAttack = 0;
    this.pendingAttackType = undefined;
    this.dead = false;
  }

  isActive(): boolean { return Boolean(this.state && !this.dead); }
  getState(): BossState | undefined { return this.state ? { ...this.state } : undefined; }

  updateBoss(delta: number): void {
    if (!this.state || this.dead) return;
    const boss = this.hooks.getBossPosition();
    const player = this.hooks.getPlayerPosition();
    const dx = player.x - boss.x;
    const dy = player.y - boss.y;
    const distance = Math.max(1, Math.sqrt(dx * dx + dy * dy));
    if (distance > 105) this.hooks.setBossPosition(boss.x + (dx / distance) * BOSS_BALANCE.speed * delta, boss.y + (dy / distance) * BOSS_BALANCE.speed * delta);
    this.attackTimer -= delta;
    if (this.pendingAttack > 0) {
      this.pendingAttack -= delta;
      if (this.pendingAttack <= 0) {
        const position = this.hooks.getBossPosition();
        const attack = this.pendingAttackType ?? this.chooseBossAttack();
        this.hooks.executeAttack(attack, position.x, position.y);
        if (attack === 'summon') this.hooks.spawnSummon();
        this.pendingAttackType = undefined;
        this.attackTimer = this.state.phase === 2 ? 3.1 : 4.4;
      }
    } else if (this.attackTimer <= 0) {
      const position = this.hooks.getBossPosition();
      this.pendingAttack = 0.72;
      this.pendingAttackType = this.chooseBossAttack();
      this.hooks.telegraphAttack(this.pendingAttackType, position.x, position.y);
    }
  }

  chooseBossAttack(): BossAttack {
    const attacks: BossAttack[] = this.state?.phase === 2 ? ['slam', 'bone-ring', 'summon', 'charge'] : ['slam', 'bone-ring', 'summon'];
    return attacks[Math.floor(Math.random() * attacks.length)];
  }

  damageBoss(amount: number): boolean {
    if (!this.state || this.dead) return false;
    this.state.hp = Math.max(0, this.state.hp - Math.max(1, amount));
    if (this.state.hp <= this.state.maxHp * 0.5) this.state.phase = 2;
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
