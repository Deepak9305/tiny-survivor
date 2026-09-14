import * as THREE from 'three';
import { clampLogicalPosition, setLogicalPosition } from '../core/coordinates';
import { SharedResources, addMesh } from '../core/SharedResources';
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
  private readonly inWorldHpBar: THREE.Group;
  private readonly inWorldHpFill: THREE.Mesh;
  private readonly parts: Record<string, THREE.Object3D | THREE.Object3D[]>;
  private readonly baseCharacterScale = 1.55;
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

  constructor(parent: THREE.Object3D, x: number, y: number, stats: PlayerStats, resources: SharedResources) {
    this.x = x;
    this.y = y;
    this.stats = stats;
    const visual = createShadowMage(resources);
    this.character = visual.root;
    this.aura = visual.aura;
    this.shadow = visual.shadow;
    this.parts = this.character.userData.parts as Record<string, THREE.Object3D | THREE.Object3D[]>;
    this.group = new THREE.Group();
    this.group.name = 'player';
    this.group.add(this.character);

    // Floating In-World Health Bar (Survivor.io design directly under hero feet)
    const hpGroup = new THREE.Group();
    hpGroup.name = 'player-floating-hp';
    hpGroup.position.set(0, 0.06, 0.58);
    hpGroup.rotation.x = -Math.PI / 3.8;

    const hpBg = addMesh(
      hpGroup,
      resources.box('player-floating-hp-bg'),
      resources.basicMaterial('player-floating-hp-bg-mat', 0x0a0f18, { transparent: true, opacity: 0.95 })
    );
    hpBg.scale.set(0.92, 0.12, 0.04);

    const hpFill = addMesh(
      hpGroup,
      resources.box('player-floating-hp-fill'),
      resources.standardMaterial('player-floating-hp-fill-mat', 0x38d150, {
        emissive: 0x22ab37,
        emissiveIntensity: 0.8,
        roughness: 0.25,
      })
    );
    hpFill.scale.set(0.86, 0.08, 0.05);
    hpFill.position.z = 0.01;

    this.inWorldHpBar = hpGroup;
    this.inWorldHpFill = hpFill;
    this.group.add(hpGroup);

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
      this.x = THREE.MathUtils.clamp(this.x + direction.x * this.stats.moveSpeed * delta, 34, worldWidth - 34);
      this.y = THREE.MathUtils.clamp(this.y + direction.y * this.stats.moveSpeed * delta, 76, worldHeight - 34);
      this.direction = Math.atan2(direction.x, direction.y);
    }
    this.syncPosition();
    this.visualTime += delta;
    const moving = length > 0.02;
    const bob = Math.sin(this.visualTime * (moving ? 8 : 4.8)) * (moving ? 0.055 : 0.028);
    this.character.position.y = bob;
    this.character.rotation.y = THREE.MathUtils.lerp(this.character.rotation.y, this.direction, Math.min(1, delta * 8));
    this.attackTime = Math.max(0, this.attackTime - delta);
    this.reviveTime = Math.max(0, this.reviveTime - delta);
    this.levelUpTime = Math.max(0, this.levelUpTime - delta);
    this.victoryTime = Math.max(0, this.victoryTime - delta);

    const attackProgress = this.attackTime > 0 ? 1 - this.attackTime / 0.24 : 0;
    const attackSwing = attackProgress > 0 ? Math.sin(Math.min(1, attackProgress) * Math.PI) : 0;
    const celebrateProgress = this.levelUpTime > 0 ? Math.sin((1 - this.levelUpTime / 0.8) * Math.PI) : (this.victoryTime > 0 ? 1 : 0);

    const arms = this.parts.arms as THREE.Object3D[] | undefined;
    if (arms?.length === 2) {
      const walkSwing = moving ? Math.sin(this.visualTime * 8) * 0.08 : 0;
      arms[0].rotation.x = -Math.PI / 4 + walkSwing - attackSwing * 0.3;
      arms[1].rotation.x = -Math.PI / 4 - walkSwing - attackSwing * 0.3;
    }
    const blaster = this.parts.blaster;
    if (blaster instanceof THREE.Object3D) {
      blaster.position.z = 0.44 - attackSwing * 0.08;
    }
    const staff = this.parts.staff;
    if (staff instanceof THREE.Object3D && staff !== blaster) staff.rotation.z = -0.28 - attackSwing * 0.5 - celebrateProgress * 0.6;
    const crystal = this.parts.crystal;
    if (crystal instanceof THREE.Object3D) crystal.rotation.y += delta * (moving ? 4.5 : (celebrateProgress > 0 ? 8 : 2.2));
    const crystalHalo = this.parts.crystalHalo;
    if (crystalHalo instanceof THREE.Object3D) crystalHalo.rotation.z += delta * (celebrateProgress > 0 ? 5 : 2.4);
    const scarfTail = this.parts.scarfTail;
    if (scarfTail instanceof THREE.Object3D) scarfTail.rotation.x = -0.22 + Math.sin(this.visualTime * 5.2) * (moving ? 0.24 : 0.1);
    const lowHealth = this.stats.currentHP / Math.max(1, this.stats.maxHP) < 0.3;
    this.aura.scale.setScalar(1 + Math.sin(this.visualTime * (lowHealth ? 5.6 : 3)) * (lowHealth ? 0.11 : 0.06) + celebrateProgress * 0.35);
    this.shadow.scale.x = 0.82 + Math.abs(Math.sin(this.visualTime * (moving ? 8 : 4.8))) * 0.045;
    this.hitFlash = Math.max(0, this.hitFlash - delta);
    const revivePop = this.reviveTime > 0 ? 1 + Math.sin((1 - this.reviveTime / 1.2) * Math.PI) * 0.12 : 1;
    const levelUpPulse = celebrateProgress > 0 ? 1 + celebrateProgress * 0.15 : 1;
    this.character.scale.setScalar(this.baseCharacterScale * (this.hitFlash > 0 ? 1.055 : 1) * revivePop * levelUpPulse);

    // Update Floating In-World Health Bar
    const hpRatio = Math.max(0, Math.min(1, this.stats.currentHP / Math.max(1, this.stats.maxHP)));
    this.inWorldHpFill.scale.x = Math.max(0.001, 0.86 * hpRatio);
    this.inWorldHpFill.position.x = -0.43 * (1 - hpRatio);
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
