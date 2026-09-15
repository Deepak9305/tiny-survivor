import * as THREE from 'three';
import { setLogicalPosition } from '../core/coordinates';
import { SharedResources, addMesh } from '../core/SharedResources';
import { createHeroVisual, createPetModel, createRelicAccent } from '../visuals/CharacterFactory';
import { resolveObstacleCollision } from '../scene/WorldObstacles';
import type { HeroId, HeroLoadout } from '../../types';

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

function lerpAngle(current: number, target: number, t: number): number {
  let diff = (target - current) % (Math.PI * 2);
  if (diff > Math.PI) diff -= Math.PI * 2;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return current + diff * t;
}

export class Player3D {
  readonly group: THREE.Group;
  readonly stats: PlayerStats;
  readonly worldId: number;
  readonly heroId: HeroId;
  private readonly character: THREE.Group;
  private readonly aura: THREE.Mesh;
  private readonly shadow: THREE.Mesh;
  private readonly parts: Record<string, THREE.Object3D | THREE.Object3D[]>;
  private readonly petObject?: THREE.Group;
  private readonly petFollowPos = new THREE.Vector2();
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
  private aimDirection = 0;
  private hasAimed = false;
  private aimActive = false;
  private aimIndicator?: THREE.Group;
  private chillTimer = 0;
  private chillMultiplier = 1.0;
  x: number;
  y: number;

  constructor(
    parent: THREE.Object3D,
    x: number,
    y: number,
    stats: PlayerStats,
    resources: SharedResources,
    worldId = 1,
    heroId: HeroId = 'shadow',
    loadout?: HeroLoadout
  ) {
    this.x = x;
    this.y = y;
    this.stats = stats;
    this.worldId = worldId;
    this.heroId = heroId;
    const visual = createHeroVisual(heroId, resources);
    this.character = visual.root;
    this.aura = visual.aura;
    this.shadow = visual.shadow;
    this.parts = this.character.userData.parts as Record<string, THREE.Object3D | THREE.Object3D[]>;
    this.group = new THREE.Group();
    this.group.name = `player-${heroId}`;
    this.group.add(this.shadow);
    this.group.add(this.aura);
    this.group.add(this.character);

    if (loadout?.relic) {
      const relicMesh = createRelicAccent(loadout.relic, resources);
      relicMesh.scale.setScalar(0.85);
      this.character.add(relicMesh);
    }

    if (loadout?.pet) {
      this.petObject = createPetModel(loadout.pet, resources);
      this.petFollowPos.set(x - 24, y - 18);
      parent.add(this.petObject);
    }

    // Subtle Cyan Focal Light attached directly to Player Group (Follows player everywhere)
    const heroPointLight = new THREE.PointLight(0x38bdf8, 0.85, 4.8, 1.8);
    heroPointLight.name = 'hero-point-light';
    heroPointLight.position.set(0, 1.2, 0.2);
    this.group.add(heroPointLight);

    // Warm red-orange directional aim trajectory cone matching reference screenshot
    const aimIndicatorGroup = new THREE.Group();
    aimIndicatorGroup.name = 'aim-indicator';
    aimIndicatorGroup.position.set(0, 0.02, 0);

    const aimCone = addMesh(
      aimIndicatorGroup,
      resources.cone('aim-cone-geom'),
      resources.basicMaterial('aim-cone-mat', 0xff382e, { transparent: true, opacity: 0.72, depthWrite: false })
    );
    aimCone.scale.set(0.36, 1.85, 0.08);
    aimCone.rotation.x = Math.PI / 2;
    aimCone.position.set(0, 0, 1.15);

    const aimCore = addMesh(
      aimIndicatorGroup,
      resources.cylinder('aim-core-geom'),
      resources.basicMaterial('aim-core-mat', 0xffaa44, { transparent: true, opacity: 0.9, depthWrite: false })
    );
    aimCore.scale.set(0.035, 1.65, 0.035);
    aimCore.rotation.x = Math.PI / 2;
    aimCore.position.set(0, 0.005, 1.05);

    const aimDot = addMesh(
      aimIndicatorGroup,
      resources.circle('aim-dot-geom'),
      resources.basicMaterial('aim-dot-mat', 0xffea77, { transparent: true, opacity: 0.85, depthWrite: false })
    );
    aimDot.scale.setScalar(0.14);
    aimDot.rotation.x = -Math.PI / 2;
    aimDot.position.set(0, 0.008, 2.05);

    this.group.add(aimIndicatorGroup);
    this.aimIndicator = aimIndicatorGroup;

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
    this.chillTimer = 0;
    this.chillMultiplier = 1.0;
  }

  applyChill(multiplier = 0.75, duration = 2.0): void {
    this.chillMultiplier = multiplier;
    this.chillTimer = Math.max(this.chillTimer, duration);
  }

  updateMovement(delta: number, worldWidth: number, worldHeight: number): void {
    if (this.chillTimer > 0) {
      this.chillTimer -= delta;
      if (this.chillTimer <= 0) {
        this.chillMultiplier = 1.0;
      }
    }
    const length = this.movement.length();
    if (length > 0.02) {
      const direction = this.movement.clone().normalize();
      const currentSpeed = this.stats.moveSpeed * this.chillMultiplier;
      let nextX = THREE.MathUtils.clamp(this.x + direction.x * currentSpeed * delta, 48, worldWidth - 48);
      let nextY = THREE.MathUtils.clamp(this.y + direction.y * currentSpeed * delta, 64, worldHeight - 64);

      // 2D Static Obstacle Collision resolution
      const resolved = resolveObstacleCollision(nextX, nextY, 18, this.worldId);
      this.x = resolved.x;
      this.y = resolved.y;
      if (!this.hasAimed) {
        this.direction = Math.atan2(direction.x, direction.y);
      }
    }
    this.syncPosition();
    this.visualTime += delta;
    const moving = length > 0.02;

    // Walk cycle & leg stride
    const walkCadence = 11.5;
    const legs = this.parts.legs as THREE.Group[] | undefined;
    if (legs && legs.length === 2) {
      if (moving) {
        const stride = Math.sin(this.visualTime * walkCadence);
        legs[0].rotation.x = stride * 0.65;
        legs[1].rotation.x = -stride * 0.65;
        legs[0].position.y = 0.44 + Math.max(0, stride) * 0.09;
        legs[1].position.y = 0.44 + Math.max(0, -stride) * 0.09;
      } else {
        legs[0].rotation.x = THREE.MathUtils.lerp(legs[0].rotation.x, 0, Math.min(1, delta * 12));
        legs[1].rotation.x = THREE.MathUtils.lerp(legs[1].rotation.x, 0, Math.min(1, delta * 12));
        legs[0].position.y = 0.44;
        legs[1].position.y = 0.44;
      }
    }

    // Dynamic running lean & sway
    const targetLean = moving ? 0.16 : 0;
    this.character.rotation.x = THREE.MathUtils.lerp(this.character.rotation.x, targetLean, Math.min(1, delta * 10));
    const sway = moving ? Math.cos(this.visualTime * walkCadence) * 0.06 : 0;
    this.character.rotation.z = THREE.MathUtils.lerp(this.character.rotation.z, sway, Math.min(1, delta * 10));

    // Idle breathing & walk bounce
    const bob = moving
      ? Math.abs(Math.sin(this.visualTime * walkCadence)) * 0.045
      : Math.sin(this.visualTime * 3.5) * 0.018;
    this.character.position.y = bob;

    // Grounded contact shadow stays strictly on terrain
    this.shadow.position.y = 0.006;
    const shadowContract = Math.max(0, bob * 1.6);
    this.shadow.scale.set(1.05 - shadowContract * 0.35, 0.65 - shadowContract * 0.22, 1);

    const targetFacing = this.aimActive ? this.aimDirection : this.direction;
    this.character.rotation.y = lerpAngle(this.character.rotation.y, targetFacing, Math.min(1, delta * 14));

    if (this.aimIndicator) {
      this.aimIndicator.rotation.y = this.aimDirection;
      const targetIndicatorOpacity = this.aimActive ? 0.88 : (this.hasAimed ? 0.28 : 0);
      for (const child of this.aimIndicator.children) {
        if (child instanceof THREE.Mesh && child.material && 'opacity' in child.material) {
          (child.material as THREE.Material & { opacity: number }).opacity = THREE.MathUtils.lerp(
            (child.material as THREE.Material & { opacity: number }).opacity,
            targetIndicatorOpacity,
            Math.min(1, delta * 10)
          );
        }
      }
    }
    this.attackTime = Math.max(0, this.attackTime - delta);
    this.reviveTime = Math.max(0, this.reviveTime - delta);
    this.levelUpTime = Math.max(0, this.levelUpTime - delta);
    this.victoryTime = Math.max(0, this.victoryTime - delta);

    const attackProgress = this.attackTime > 0 ? 1 - this.attackTime / 0.24 : 0;
    const attackSwing = attackProgress > 0 ? Math.sin(Math.min(1, attackProgress) * Math.PI) : 0;
    const celebrateProgress = this.levelUpTime > 0 ? Math.sin((1 - this.levelUpTime / 0.8) * Math.PI) : (this.victoryTime > 0 ? 1 : 0);

    // Natural running arm swing counter-phases legs
    const arms = this.parts.arms as THREE.Object3D[] | undefined;
    if (arms?.length === 2) {
      const armSwing = moving ? Math.sin(this.visualTime * walkCadence) * 0.52 : 0;
      arms[0].rotation.x = -armSwing;
      arms[1].rotation.x = armSwing;
      arms[0].rotation.z = -0.32 - attackSwing * 0.35 - celebrateProgress * 0.5;
      arms[1].rotation.z = 0.32 + attackSwing * 0.65 + celebrateProgress * 0.7;
    }

    // Dynamic cloak flutter during movement
    const cloak = this.parts.cloak as THREE.Object3D | undefined;
    if (cloak) {
      const cloakFlutter = moving ? 0.18 + Math.sin(this.visualTime * walkCadence * 2) * 0.08 : 0;
      cloak.rotation.x = THREE.MathUtils.lerp(cloak.rotation.x, cloakFlutter, Math.min(1, delta * 10));
    }

    const staff = this.parts.staff;
    if (staff instanceof THREE.Object3D) {
      const staffBob = moving ? Math.sin(this.visualTime * walkCadence) * 0.22 : 0;
      staff.rotation.x = staffBob;
      staff.rotation.z = -0.28 - attackSwing * 0.5 - celebrateProgress * 0.6;
    }
    const crystal = this.parts.crystal;
    if (crystal instanceof THREE.Object3D) crystal.rotation.y += delta * (moving ? 4.5 : (celebrateProgress > 0 ? 8 : 2.2));
    const crystalHalo = this.parts.crystalHalo;
    if (crystalHalo instanceof THREE.Object3D) crystalHalo.rotation.z += delta * (celebrateProgress > 0 ? 5 : 2.4);

    // Scarf trailing wind physics
    const scarfTail = this.parts.scarfTail;
    if (scarfTail instanceof THREE.Object3D) {
      scarfTail.rotation.x = -0.26 + Math.sin(this.visualTime * 6.5) * (moving ? 0.38 : 0.12);
      scarfTail.rotation.z = Math.cos(this.visualTime * 5.2) * (moving ? 0.22 : 0.06);
    }

    const lowHealth = this.stats.currentHP / Math.max(1, this.stats.maxHP) < 0.3;
    this.aura.scale.setScalar(1 + Math.sin(this.visualTime * (lowHealth ? 5.6 : 3)) * (lowHealth ? 0.11 : 0.06) + celebrateProgress * 0.35);
    this.aura.rotation.z += delta * 0.8;
    this.hitFlash = Math.max(0, this.hitFlash - delta);
    const revivePop = this.reviveTime > 0 ? 1 + Math.sin((1 - this.reviveTime / 1.2) * Math.PI) * 0.12 : 1;
    const levelUpPulse = celebrateProgress > 0 ? 1 + celebrateProgress * 0.15 : 1;
    this.character.scale.setScalar(this.baseCharacterScale * (this.hitFlash > 0 ? 1.055 : 1) * revivePop * levelUpPulse);

    // Pet follower physics/smoothing
    if (this.petObject) {
      const targetPetX = this.x - Math.cos(this.direction) * 26 + Math.sin(this.visualTime * 2.5) * 6;
      const targetPetY = this.y - Math.sin(this.direction) * 26 + Math.cos(this.visualTime * 2.5) * 6;
      this.petFollowPos.lerp(new THREE.Vector2(targetPetX, targetPetY), Math.min(1, delta * 5.5));
      setLogicalPosition(this.petObject, this.petFollowPos.x, this.petFollowPos.y);
      this.petObject.position.y = 0.22 + Math.sin(this.visualTime * 3.8) * 0.05;
      this.petObject.rotation.y = this.direction;
    }
  }

  setMovementVector(x: number, y: number): void {
    const vector = new THREE.Vector2(x, y);
    if (vector.length() < 0.12) vector.set(0, 0);
    this.movement.copy(vector).clampLength(0, 1);
  }

  setAimVector(x: number, y: number, isAiming: boolean): void {
    const len = Math.sqrt(x * x + y * y);
    if (isAiming && len > 0.12) {
      this.aimDirection = Math.atan2(x, y);
      this.aimActive = true;
      this.hasAimed = true;
    } else {
      this.aimActive = false;
    }
  }

  isAiming(): boolean {
    return this.aimActive;
  }

  getAimDirection(): number {
    return this.aimDirection;
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
  destroy(): void {
    this.petObject?.removeFromParent();
    this.group.removeFromParent();
  }
}
