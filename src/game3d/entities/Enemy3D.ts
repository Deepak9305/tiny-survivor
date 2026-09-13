import * as THREE from 'three';
import { ENEMY_BALANCE } from '../../data/balance';
import type { EnemyKind } from '../../types';
import type { SpatialEntity } from '../../game/systems/SpatialGrid';
import { LOGICAL_SCALE, setLogicalPosition } from '../core/coordinates';
import { SharedResources, addMesh } from '../core/SharedResources';
import { addEliteAccent, createEnemyModel } from '../visuals/CharacterFactory';

let enemySequence = 0;

export class Enemy3D implements SpatialEntity {
  readonly id: string;
  readonly kind: EnemyKind;
  readonly elite: boolean;
  readonly radius: number;
  readonly maxHP: number;
  readonly baseSpeed: number;
  readonly contactDamage: number;
  readonly xpValue: number;
  readonly group: THREE.Group;
  private readonly model: THREE.Group;
  private readonly healthFill: THREE.Mesh;
  private readonly healthBar: THREE.Group;
  private hp: number;
  private slowMultiplier = 1;
  private slowUntil = 0;
  private phaseTime = Math.random() * 5;

  constructor(parent: THREE.Object3D, kind: EnemyKind, x: number, y: number, resources: SharedResources, elite = false, difficulty = 1) {
    const balance = ENEMY_BALANCE[kind];
    this.id = `enemy-${enemySequence += 1}`;
    this.kind = kind;
    this.elite = elite;
    this.radius = balance.radius * (elite ? 1.28 : 1);
    this.maxHP = balance.hp * difficulty * (elite ? 2.35 : 1);
    this.hp = this.maxHP;
    this.baseSpeed = balance.speed * (elite ? 1.08 : 1);
    this.contactDamage = balance.damage * difficulty * (elite ? 1.2 : 1);
    this.xpValue = balance.xp * (elite ? 4 : 1);
    this.group = new THREE.Group();
    this.group.name = this.id;
    this.model = createEnemyModel(kind, balance.color, resources);
    const visualScale = (this.radius * LOGICAL_SCALE) / 0.38;
    this.model.scale.setScalar(visualScale);
    this.group.add(this.model);
    if (elite) addEliteAccent(this.model, resources);
    this.healthBar = createHealthBar(resources, elite);
    this.healthBar.position.set(0, 1.72 * visualScale, 0.42 * visualScale);
    this.healthFill = this.healthBar.children[1] as THREE.Mesh;
    this.group.add(this.healthBar);
    parent.add(this.group);
    this.x = x;
    this.y = y;
    this.syncPosition();
    this.updateHealthBar();
  }

  x: number;
  y: number;

  get currentHP(): number { return this.hp; }

  update(playerX: number, playerY: number, delta: number, now: number): void {
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const distance = Math.max(1, Math.sqrt(dx * dx + dy * dy));
    let directionX = dx / distance;
    let directionY = dy / distance;
    const preferredDistance = this.kind === 'archer' ? 172 : 0;
    if (preferredDistance && distance < preferredDistance) {
      directionX *= -1;
      directionY *= -1;
    }
    const speed = this.baseSpeed * (now < this.slowUntil ? this.slowMultiplier : 1);
    if (distance > 36 || preferredDistance) {
      this.x += directionX * speed * delta;
      this.y += directionY * speed * delta;
    }
    this.syncPosition();
    this.phaseTime += delta;
    const bob = this.kind === 'bat' || this.kind === 'ghost' ? Math.sin(this.phaseTime * 3.2) * 0.09 : Math.sin(this.phaseTime * 2.2) * 0.025;
    this.model.position.y = bob;
    if (this.elite) this.model.scale.setScalar((this.radius * LOGICAL_SCALE) / 0.38 * (1 + Math.sin(this.phaseTime * 4) * 0.035));
    this.model.rotation.y = Math.atan2(directionX, directionY);
    this.healthBar.lookAt(this.group.position.clone().add(new THREE.Vector3(0, 4, 8)));
    if (this.kind === 'ghost') this.model.visible = Math.floor(now * 2) % 9 !== 0;
    else this.model.visible = true;
    this.updateHealthBar();
  }

  applySlow(multiplier: number, duration: number, now: number): void {
    this.slowMultiplier = Math.min(this.slowMultiplier, multiplier);
    this.slowUntil = Math.max(this.slowUntil, now + duration);
  }

  damage(amount: number): boolean {
    this.hp = Math.max(0, this.hp - Math.max(1, amount));
    this.updateHealthBar();
    return this.hp <= 0;
  }

  private updateHealthBar(): void {
    if (!this.elite && this.hp >= this.maxHP) {
      this.healthBar.visible = false;
      return;
    }
    this.healthBar.visible = true;
    this.healthFill.scale.x = Math.max(0.001, this.hp / this.maxHP);
    this.healthFill.position.x = -0.5 * (1 - this.hp / this.maxHP);
  }

  private syncPosition(): void { setLogicalPosition(this.group, this.x, this.y); }
  destroy(): void { this.group.removeFromParent(); }
}

function createHealthBar(resources: SharedResources, elite: boolean): THREE.Group {
  const group = new THREE.Group();
  const background = addMesh(group, resources.plane('enemy-health-bg', 1.08, 0.075), resources.basicMaterial('enemy-health-bg', 0x07101a, { transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
  background.position.z = 0.01;
  const fill = addMesh(group, resources.plane('enemy-health-fill', 1, 0.055), resources.basicMaterial(elite ? 'elite-health-fill' : 'enemy-health-fill', elite ? 0xffb64a : 0x59d7f5, { side: THREE.DoubleSide }));
  fill.position.z = 0.02;
  return group;
}
