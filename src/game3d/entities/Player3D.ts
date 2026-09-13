import * as THREE from 'three';
import { clampLogicalPosition, setLogicalPosition } from '../core/coordinates';
import { SharedResources } from '../core/SharedResources';
import { createShadowMage } from '../visuals/CharacterFactory';

export interface PlayerStats {
  maxHP: number;
  currentHP: number;
  armor: number;
  moveSpeed: number;
  pickupRadius: number;
  damageMultiplier: number;
  cooldownMultiplier: number;
  critChance: number;
  critMultiplier: number;
  xpMultiplier: number;
}

export class Player3D {
  readonly group: THREE.Group;
  readonly stats: PlayerStats;
  private readonly character: THREE.Group;
  private readonly aura: THREE.Mesh;
  private readonly shadow: THREE.Mesh;
  private movement = new THREE.Vector2();
  private invulnerableUntil = 0;
  private visualTime = 0;
  private hitFlash = 0;
  private direction = 0;
  x: number;
  y: number;

  constructor(parent: THREE.Object3D, x: number, y: number, stats: PlayerStats, resources: SharedResources) {
    this.x = x;
    this.y = y;
    this.stats = stats;
    const visual = createShadowMage(resources);
    this.character = visual.root;
    this.aura = visual.aura;
    this.shadow = visual.shadow;
    this.group = new THREE.Group();
    this.group.name = 'player';
    this.group.add(this.character);
    parent.add(this.group);
    this.syncPosition();
  }

  initializePlayer(): void {
    this.stats.currentHP = this.stats.maxHP;
    this.movement.set(0, 0);
    this.invulnerableUntil = 0;
    this.hitFlash = 0;
  }

  updateMovement(delta: number, worldWidth: number, worldHeight: number): void {
    const length = this.movement.length();
    if (length > 0.02) {
      const direction = this.movement.clone().normalize();
      this.x = THREE.MathUtils.clamp(this.x + direction.x * this.stats.moveSpeed * delta, 34, worldWidth - 34);
      this.y = THREE.MathUtils.clamp(this.y + direction.y * this.stats.moveSpeed * delta, 76, worldHeight - 34);
      this.direction = Math.atan2(direction.x, direction.y);
    }
    this.syncPosition();
    this.visualTime += delta;
    const bob = Math.sin(this.visualTime * 6) * 0.035;
    this.character.position.y = bob;
    this.character.rotation.y = THREE.MathUtils.lerp(this.character.rotation.y, this.direction, Math.min(1, delta * 8));
    this.aura.scale.setScalar(1 + Math.sin(this.visualTime * 3) * 0.06);
    this.shadow.scale.x = 0.82 + Math.abs(Math.sin(this.visualTime * 6)) * 0.035;
    this.hitFlash = Math.max(0, this.hitFlash - delta);
    this.character.scale.setScalar(this.hitFlash > 0 ? 1.05 : 1);
  }

  setMovementVector(x: number, y: number): void {
    const vector = new THREE.Vector2(x, y);
    if (vector.length() < 0.12) vector.set(0, 0);
    this.movement.copy(vector).clampLength(0, 1);
  }

  getMovementVector(): THREE.Vector2 { return this.movement.clone(); }
  getPosition(): { x: number; y: number } { return { x: this.x, y: this.y }; }

  takeDamage(amount: number, now: number, invulnerabilityDuration = 0.58): boolean {
    if (this.isInvulnerable(now)) return false;
    this.stats.currentHP = Math.max(0, this.stats.currentHP - Math.max(1, amount));
    this.applyInvulnerability(now, invulnerabilityDuration);
    this.hitFlash = invulnerabilityDuration;
    return true;
  }

  heal(amount: number): void { this.stats.currentHP = Math.min(this.stats.maxHP, this.stats.currentHP + Math.max(0, amount)); }
  applyInvulnerability(now: number, duration: number): void { this.invulnerableUntil = Math.max(this.invulnerableUntil, now + duration); }
  isInvulnerable(now: number): boolean { return now < this.invulnerableUntil; }
  setMoveSpeed(value: number): void { this.stats.moveSpeed = Math.max(40, value); }
  resetPlayer(): void { this.initializePlayer(); }

  private syncPosition(): void { setLogicalPosition(this.group, this.x, this.y); }
  destroy(): void { this.group.removeFromParent(); }
}
