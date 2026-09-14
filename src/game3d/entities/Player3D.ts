import * as THREE from 'three';
import { setLogicalPosition } from '../core/coordinates';
import { SharedResources } from '../core/SharedResources';
import { createShadowMage } from '../visuals/CharacterFactory';
import { resolveObstacleCollision } from '../scene/WorldObstacles';

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
  readonly worldId: number;
  private readonly character: THREE.Group;
  private readonly aura: THREE.Mesh;
  private readonly shadow: THREE.Mesh;
  private readonly parts: Record<string, THREE.Object3D | THREE.Object3D[]>;
  private readonly baseCharacterScale = 0.92;
  private movement = new THREE.Vector2();
  private invulnerableUntil = 0;
  private visualTime = 0;
  private hitFlash = 0;
  private attackTime = 0;
  private reviveTime = 0;
  private levelUpTime = 0;
  private victoryTime = 0;
  private direction = 0;
  x: number;
  y: number;

  constructor(parent: THREE.Object3D, x: number, y: number, stats: PlayerStats, resources: SharedResources, worldId = 1) {
    this.x = x;
    this.y = y;
    this.stats = stats;
    this.worldId = worldId;
    const visual = createShadowMage(resources);
    this.character = visual.root;
    this.aura = visual.aura;
    this.shadow = visual.shadow;
    this.parts = this.character.userData.parts as Record<string, THREE.Object3D | THREE.Object3D[]>;
    this.group = new THREE.Group();
    this.group.name = 'player';
    this.group.add(this.character);

    // Subtle Cyan Focal Light attached directly to Player Group (Follows player everywhere)
    const heroPointLight = new THREE.PointLight(0x38bdf8, 0.85, 4.8, 1.8);
    heroPointLight.name = 'hero-point-light';
    heroPointLight.position.set(0, 1.2, 0.2);
    this.group.add(heroPointLight);

    parent.add(this.group);
    this.syncPosition();
  }

  initializePlayer(): void {
    this.stats.currentHP = this.stats.maxHP;
    this.movement.set(0, 0);
    this.invulnerableUntil = 0;
    this.hitFlash = 0;
    this.attackTime = 0;
    this.reviveTime = 0;
    this.levelUpTime = 0;
    this.victoryTime = 0;
  }

  updateMovement(delta: number, worldWidth: number, worldHeight: number): void {
    const length = this.movement.length();
    if (length > 0.02) {
      const direction = this.movement.clone().normalize();
      let nextX = THREE.MathUtils.clamp(this.x + direction.x * this.stats.moveSpeed * delta, 48, worldWidth - 48);
      let nextY = THREE.MathUtils.clamp(this.y + direction.y * this.stats.moveSpeed * delta, 64, worldHeight - 64);

      // 2D Static Obstacle Collision resolution
      const resolved = resolveObstacleCollision(nextX, nextY, 18, this.worldId);
      this.x = resolved.x;
      this.y = resolved.y;
      this.direction = Math.atan2(direction.x, direction.y);
    }
    this.syncPosition();
    this.visualTime += delta;
    const moving = length > 0.02;

    // Idle breathing & walk bounce
    const bob = Math.sin(this.visualTime * (moving ? 8.5 : 3.8)) * (moving ? 0.055 : 0.022);
    this.character.position.y = bob;
    this.character.rotation.y = THREE.MathUtils.lerp(this.character.rotation.y, this.direction, Math.min(1, delta * 9));
    this.attackTime = Math.max(0, this.attackTime - delta);
    this.reviveTime = Math.max(0, this.reviveTime - delta);
    this.levelUpTime = Math.max(0, this.levelUpTime - delta);
    this.victoryTime = Math.max(0, this.victoryTime - delta);

    const attackProgress = this.attackTime > 0 ? 1 - this.attackTime / 0.24 : 0;
    const attackSwing = attackProgress > 0 ? Math.sin(Math.min(1, attackProgress) * Math.PI) : 0;
    const celebrateProgress = this.levelUpTime > 0 ? Math.sin((1 - this.levelUpTime / 0.8) * Math.PI) : (this.victoryTime > 0 ? 1 : 0);

    const arms = this.parts.arms as THREE.Object3D[] | undefined;
    if (arms?.length === 2) {
      arms[0].rotation.z = -0.32 - attackSwing * 0.35 - celebrateProgress * 0.5;
      arms[1].rotation.z = 0.32 + attackSwing * 0.65 + celebrateProgress * 0.7;
    }
    const staff = this.parts.staff;
    if (staff instanceof THREE.Object3D) staff.rotation.z = -0.28 - attackSwing * 0.5 - celebrateProgress * 0.6;
    const crystal = this.parts.crystal;
    if (crystal instanceof THREE.Object3D) crystal.rotation.y += delta * (moving ? 4.5 : (celebrateProgress > 0 ? 8 : 2.2));
    const crystalHalo = this.parts.crystalHalo;
    if (crystalHalo instanceof THREE.Object3D) crystalHalo.rotation.z += delta * (celebrateProgress > 0 ? 5 : 2.4);

    // Scarf trailing physics simulation
    const scarfTail = this.parts.scarfTail;
    if (scarfTail instanceof THREE.Object3D) {
      scarfTail.rotation.x = -0.22 + Math.sin(this.visualTime * 5.2) * (moving ? 0.28 : 0.1);
      scarfTail.rotation.z = Math.cos(this.visualTime * 4.2) * (moving ? 0.15 : 0.05);
    }

    const lowHealth = this.stats.currentHP / Math.max(1, this.stats.maxHP) < 0.3;
    this.aura.scale.setScalar(1 + Math.sin(this.visualTime * (lowHealth ? 5.6 : 3)) * (lowHealth ? 0.11 : 0.06) + celebrateProgress * 0.35);
    this.shadow.scale.x = 0.82 + Math.abs(Math.sin(this.visualTime * (moving ? 8.5 : 3.8))) * 0.045;
    this.hitFlash = Math.max(0, this.hitFlash - delta);
    const revivePop = this.reviveTime > 0 ? 1 + Math.sin((1 - this.reviveTime / 1.2) * Math.PI) * 0.12 : 1;
    const levelUpPulse = celebrateProgress > 0 ? 1 + celebrateProgress * 0.15 : 1;
    this.character.scale.setScalar(this.baseCharacterScale * (this.hitFlash > 0 ? 1.055 : 1) * revivePop * levelUpPulse);
  }

  setMovementVector(x: number, y: number): void {
    const vector = new THREE.Vector2(x, y);
    if (vector.length() < 0.12) vector.set(0, 0);
    this.movement.copy(vector).clampLength(0, 1);
  }

  getMovementVector(): THREE.Vector2 { return this.movement.clone(); }
  getPosition(): { x: number; y: number } { return { x: this.x, y: this.y }; }

  triggerAttack(): void { this.attackTime = 0.24; }
  triggerRevive(): void { this.reviveTime = 1.2; this.hitFlash = 0.2; }
  triggerLevelUp(): void { this.levelUpTime = 0.8; }
  triggerVictory(): void { this.victoryTime = 3.0; }

  takeDamage(amount: number, now: number, invulnerabilityDuration = 0.58): boolean {
    if (this.isInvulnerable(now)) return false;
    this.stats.currentHP = Math.max(0, this.stats.currentHP - Math.max(1, amount));
    this.applyInvulnerability(now, invulnerabilityDuration);
    this.hitFlash = invulnerabilityDuration;
    this.attackTime = 0;
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
