import * as THREE from 'three';
import { setLogicalPosition } from '../core/coordinates';
import { SharedResources } from '../core/SharedResources';
import { createBossEchoModel } from '../visuals/CharacterFactory';
import type { BossAttack, BossId } from '../../types';

export interface BossEchoStats {
  id: BossId;
  name: string;
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  attackSet: BossAttack[];
}

export const ECHO_CONFIGS: Record<BossId, { name: string; hp: number; damage: number; speed: number; attacks: BossAttack[] }> = {
  'skeleton-king': {
    name: 'Skeleton King Echo',
    hp: 600,
    damage: 16,
    speed: 46,
    attacks: ['slam', 'charge'],
  },
  'forest-witch': {
    name: 'Forest Witch Echo',
    hp: 750,
    damage: 15,
    speed: 52,
    attacks: ['thorn-circle', 'spirit-volley'],
  },
  'frost-golem': {
    name: 'Frost Golem Echo',
    hp: 900,
    damage: 19,
    speed: 40,
    attacks: ['ground-slam', 'ice-shard-fan'],
  },
  'demon-lord': {
    name: 'Demon Echo',
    hp: 950,
    damage: 22,
    speed: 48,
    attacks: ['slam', 'charge'],
  },
};

export class BossEcho3D {
  readonly group: THREE.Group;
  readonly bossId: BossId;
  readonly name: string;
  readonly maxHp: number;
  hp: number;
  readonly damage: number;
  readonly speed: number;
  readonly attacks: BossAttack[];

  x: number;
  y: number;
  isDead = false;

  private attackTimer = 4.2;
  private pendingAttack = 0;
  private pendingAttackType?: BossAttack;
  private attackCursor = 0;
  private animTime = 0;

  constructor(
    parent: THREE.Object3D,
    x: number,
    y: number,
    bossId: BossId,
    resources: SharedResources
  ) {
    this.x = x;
    this.y = y;
    this.bossId = bossId;

    const cfg = ECHO_CONFIGS[bossId] ?? ECHO_CONFIGS['skeleton-king'];
    this.name = cfg.name;
    this.hp = cfg.hp;
    this.maxHp = cfg.hp;
    this.damage = cfg.damage;
    this.speed = cfg.speed;
    this.attacks = cfg.attacks;

    this.group = createBossEchoModel(bossId, resources).root;
    this.group.name = `boss-echo-${bossId}`;
    setLogicalPosition(this.group, x, y, 0);
    parent.add(this.group);
  }

  takeDamage(amount: number): boolean {
    if (this.isDead) return false;
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp <= 0) {
      this.isDead = true;
      return true; // died
    }
    return false;
  }

  update(
    delta: number,
    playerX: number,
    playerY: number,
    onTelegraph: (attack: BossAttack, x: number, y: number) => void,
    onExecute: (attack: BossAttack, x: number, y: number, damage: number) => void
  ): void {
    if (this.isDead) return;

    this.animTime += delta;
    // Spectral floating oscillation
    const hoverOffset = Math.sin(this.animTime * 2.8) * 0.18;
    this.group.position.y = 0.1 + hoverOffset;

    // Movement toward player
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.max(1, Math.hypot(dx, dy));

    if (dist > 90) {
      this.x += (dx / dist) * this.speed * delta;
      this.y += (dy / dist) * this.speed * delta;
      setLogicalPosition(this.group, this.x, this.y, this.group.position.y);
      this.group.rotation.y = Math.atan2(dx, dy);
    }

    // Attack state machine
    if (this.pendingAttack > 0) {
      this.pendingAttack -= delta;
      if (this.pendingAttack <= 0) {
        const attack = this.pendingAttackType ?? this.attacks[0];
        onExecute(attack, this.x, this.y, this.damage);
        this.pendingAttackType = undefined;
        this.attackTimer = 5.2 + Math.random() * 1.2;
      }
    } else {
      this.attackTimer -= delta;
      if (this.attackTimer <= 0) {
        const attack = this.attacks[this.attackCursor % this.attacks.length];
        this.attackCursor += 1;
        this.pendingAttackType = attack;
        this.pendingAttack = 0.85; // telegraph duration
        onTelegraph(attack, this.x, this.y);
      }
    }
  }

  destroy(): void {
    this.group.removeFromParent();
  }
}
