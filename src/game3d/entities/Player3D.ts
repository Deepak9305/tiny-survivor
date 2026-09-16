import * as THREE from 'three';
import { setLogicalPosition } from '../core/coordinates';
import { SharedResources, addMesh } from '../core/SharedResources';
import { createHeroVisual, createPetModel, createRelicAccent } from '../visuals/CharacterFactory';
import { createPremiumHeroDetailRig, type HeroDetailRig } from '../visuals/HeroDetailRig';
import { resolveObstacleCollision } from '../scene/WorldObstacles';
import { getCombatFlowState } from '../../game/systems/CombatTargeting';
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
  const diff = ((target - current + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
  return current + diff * t;
}

const HERO_COMBAT_COLORS: Record<HeroId, number> = {
  shadow: 0x55ddff,
  warrior: 0xffbd45,
  monk: 0x34d399,
  gunslinger: 0xe879f9,
};

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
  private readonly movement = new THREE.Vector2();
  private readonly velocity = new THREE.Vector2();
  private readonly heroLight: THREE.PointLight;
  private readonly powerHalo: THREE.Mesh;
  private readonly heroAccent = new THREE.Group();
  private readonly detailRig: HeroDetailRig;
  private invulnerableUntil = 0;
  private visualTime = 0;
  private hitFlash = 0;
  private attackTime = 0;
  private attackVariant = 0;
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
  private stridePhase = 0;
  private pitchAngle = 0;
  private bankAngle = 0;
  private legBaseY: number[] = [0.44, 0.44];
  private armBaseRotZ: number[] = [-0.32, 0.32];
  private lastFootstepPhase = 0;
  private readonly onFootstep?: (x: number, y: number) => void;
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
    loadout?: HeroLoadout,
    onFootstep?: (x: number, y: number) => void
  ) {
    this.x = x;
    this.y = y;
    this.stats = stats;
    this.worldId = worldId;
    this.heroId = heroId;
    this.onFootstep = onFootstep;
    const heroColor = HERO_COMBAT_COLORS[heroId];
    const visual = createHeroVisual(heroId, resources);
    this.character = visual.root;
    this.character.rotation.order = 'YXZ';
    this.aura = visual.aura;
    this.shadow = visual.shadow;
    this.parts = this.character.userData.parts as Record<string, THREE.Object3D | THREE.Object3D[]>;

    const legs = this.parts.legs as THREE.Group[] | undefined;
    if (legs && legs.length === 2) {
      this.legBaseY = [legs[0].position.y, legs[1].position.y];
    }
    const arms = this.parts.arms as THREE.Object3D[] | undefined;
    if (arms && arms.length === 2) {
      this.armBaseRotZ = [arms[0].rotation.z, arms[1].rotation.z];
    }

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

    this.detailRig = createPremiumHeroDetailRig(heroId, resources);
    this.character.add(this.detailRig.root);

    this.heroLight = new THREE.PointLight(heroColor, 0.82, 5.2, 1.75);
    this.heroLight.name = `hero-point-light-${heroId}`;
    this.heroLight.position.set(0, 1.15, 0.18);
    this.group.add(this.heroLight);

    this.powerHalo = addMesh(
      this.group,
      resources.torus(`hero-power-halo-${heroId}`),
      resources.basicMaterial(`hero-power-halo-mat-${heroId}`, heroColor, {
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
      })
    );
    this.powerHalo.position.y = 1.08;
    this.powerHalo.rotation.x = Math.PI / 2;
    this.powerHalo.scale.setScalar(0.62);

    this.heroAccent.name = `hero-accent-${heroId}`;
    for (let index = 0; index < 3; index += 1) {
      const shard = addMesh(
        this.heroAccent,
        resources.octa(`hero-accent-shard-${heroId}`),
        resources.basicMaterial(`hero-accent-shard-mat-${heroId}`, heroColor, {
          transparent: true,
          opacity: 0.72,
          depthWrite: false,
        })
      );
      shard.scale.setScalar(0.09);
      shard.userData.baseAngle = index * Math.PI * 2 / 3;
    }
    this.group.add(this.heroAccent);

    const aimIndicatorGroup = new THREE.Group();
    aimIndicatorGroup.name = 'aim-indicator';
    aimIndicatorGroup.position.set(0, 0.02, 0);

    const aimCone = addMesh(
      aimIndicatorGroup,
      resources.cone(`aim-cone-geom-${heroId}`),
      resources.basicMaterial(`aim-cone-mat-${heroId}`, heroColor, {
        transparent: true,
        opacity: 0.34,
        depthWrite: false,
      })
    );
    aimCone.scale.set(0.20, 1.48, 0.05);
    aimCone.rotation.x = Math.PI / 2;
    aimCone.position.set(0, 0, 0.93);

    const aimCore = addMesh(
      aimIndicatorGroup,
      resources.cylinder(`aim-core-geom-${heroId}`),
      resources.basicMaterial(`aim-core-mat-${heroId}`, 0xffffff, {
        transparent: true,
        opacity: 0.78,
        depthWrite: false,
      })
    );
    aimCore.scale.set(0.022, 1.18, 0.022);
    aimCore.rotation.x = Math.PI / 2;
    aimCore.position.set(0, 0.005, 0.82);

    const aimDot = addMesh(
      aimIndicatorGroup,
      resources.circle(`aim-dot-geom-${heroId}`),
      resources.basicMaterial(`aim-dot-mat-${heroId}`, heroColor, {
        transparent: true,
        opacity: 0.82,
        depthWrite: false,
      })
    );
    aimDot.scale.setScalar(0.11);
    aimDot.rotation.x = -Math.PI / 2;
    aimDot.position.set(0, 0.008, 1.62);

    this.group.add(aimIndicatorGroup);
    this.aimIndicator = aimIndicatorGroup;

    parent.add(this.group);
    this.syncPosition();
  }

  initializePlayer(): void {
    this.stats.currentHP = this.stats.maxHP;
    this.movement.set(0, 0);
    this.velocity.set(0, 0);
    this.stridePhase = 0;
    this.pitchAngle = 0;
    this.bankAngle = 0;
    this.lastFootstepPhase = 0;
    this.invulnerableUntil = 0;
    this.hitFlash = 0;
    this.attackTime = 0;
    this.attackVariant = 0;
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
      if (this.chillTimer <= 0) this.chillMultiplier = 1.0;
    }

    const rawLen = this.movement.length();
    let targetSpeed = 0;
    const targetVel = new THREE.Vector2(0, 0);
    const DEADZONE = 0.08;

    if (rawLen > DEADZONE) {
      const normalizedMagnitude = Math.min(1, (rawLen - DEADZONE) / (1 - DEADZONE));
      const curve = normalizedMagnitude * (0.35 + 0.65 * normalizedMagnitude);
      const topSpeed = this.stats.moveSpeed * this.chillMultiplier;
      targetSpeed = topSpeed * curve;
      targetVel.set((this.movement.x / rawLen) * targetSpeed, (this.movement.y / rawLen) * targetSpeed);
    }

    const isStopping = targetSpeed < 0.001;
    const isReversing = !isStopping && this.velocity.dot(targetVel) < 0;
    const accelRate = isStopping ? 26 : (isReversing ? 32 : 20);
    this.velocity.lerp(targetVel, Math.min(1, delta * accelRate));
    if (isStopping && this.velocity.lengthSq() < 0.2) this.velocity.set(0, 0);

    const effectiveSpeed = this.velocity.length();
    if (effectiveSpeed > 0.02) {
      const nextX = THREE.MathUtils.clamp(this.x + this.velocity.x * delta, 48, worldWidth - 48);
      const nextY = THREE.MathUtils.clamp(this.y + this.velocity.y * delta, 64, worldHeight - 64);
      const resolved = resolveObstacleCollision(nextX, nextY, 18, this.worldId);
      const pushX = resolved.x - nextX;
      const pushY = resolved.y - nextY;
      const pushDistSq = pushX * pushX + pushY * pushY;

      if (pushDistSq > 0.0001) {
        const pushDist = Math.sqrt(pushDistSq);
        const normalX = pushX / pushDist;
        const normalY = pushY / pushDist;
        const vDotN = this.velocity.x * normalX + this.velocity.y * normalY;
        if (vDotN < 0) {
          this.velocity.x -= vDotN * normalX;
          this.velocity.y -= vDotN * normalY;
        }
      }

      this.x = resolved.x;
      this.y = resolved.y;
      this.direction = Math.atan2(this.velocity.x, this.velocity.y);
    }

    this.syncPosition();
    this.visualTime += delta;

    const speedRatio = THREE.MathUtils.clamp(effectiveSpeed / Math.max(1, this.stats.moveSpeed), 0, 1.25);
    const moving = speedRatio > 0.03;
    const walkCadence = THREE.MathUtils.lerp(8.0, 13.0, Math.min(1, speedRatio));
    this.stridePhase += delta * walkCadence * speedRatio;

    if (moving && speedRatio > 0.3) {
      const currentStepIndex = Math.floor(this.stridePhase / Math.PI);
      if (currentStepIndex > this.lastFootstepPhase) {
        this.lastFootstepPhase = currentStepIndex;
        this.onFootstep?.(this.x, this.y);
      }
    }

    const legs = this.parts.legs as THREE.Group[] | undefined;
    if (legs && legs.length === 2) {
      if (moving) {
        const stride = Math.sin(this.stridePhase) * 0.62 * speedRatio;
        legs[0].rotation.x = stride;
        legs[1].rotation.x = -stride;
        legs[0].position.y = this.legBaseY[0] + Math.max(0, stride) * 0.08 * speedRatio;
        legs[1].position.y = this.legBaseY[1] + Math.max(0, -stride) * 0.08 * speedRatio;
      } else {
        legs[0].rotation.x = THREE.MathUtils.lerp(legs[0].rotation.x, 0, Math.min(1, delta * 14));
        legs[1].rotation.x = THREE.MathUtils.lerp(legs[1].rotation.x, 0, Math.min(1, delta * 14));
        legs[0].position.y = THREE.MathUtils.lerp(legs[0].position.y, this.legBaseY[0], Math.min(1, delta * 14));
        legs[1].position.y = THREE.MathUtils.lerp(legs[1].position.y, this.legBaseY[1], Math.min(1, delta * 14));
      }
    }

    const bounce = Math.abs(Math.sin(this.stridePhase)) * 0.040 * speedRatio;
    const idleBreathe = Math.sin(this.visualTime * 3.2) * 0.016 * (1 - Math.min(1, speedRatio * 1.6));
    this.character.position.y = bounce + idleBreathe;

    this.shadow.position.y = 0.006;
    const shadowContract = Math.max(0, bounce * 1.5);
    this.shadow.scale.set(1.05 - shadowContract * 0.32, 0.65 - shadowContract * 0.20, 1);

    const targetFacing = this.aimActive ? this.aimDirection : this.direction;
    const prevHeading = this.character.rotation.y;
    const turnSpeed = this.aimActive ? 22 : 16;
    this.character.rotation.y = lerpAngle(this.character.rotation.y, targetFacing, Math.min(1, delta * turnSpeed));

    let angleDelta = this.character.rotation.y - prevHeading;
    if (angleDelta > Math.PI) angleDelta -= Math.PI * 2;
    if (angleDelta < -Math.PI) angleDelta += Math.PI * 2;
    const turnRate = angleDelta / Math.max(0.0001, delta);
    const targetBank = THREE.MathUtils.clamp(-turnRate * 0.032 * speedRatio, -0.16, 0.16);
    this.bankAngle = THREE.MathUtils.lerp(this.bankAngle, targetBank, Math.min(1, delta * 12));

    const targetLean = 0.15 * Math.min(1, speedRatio);
    const isBraking = speedRatio > 0.18 && targetSpeed < 1.0;
    const targetPitch = isBraking ? -0.06 : targetLean;
    this.pitchAngle = THREE.MathUtils.lerp(this.pitchAngle, targetPitch, Math.min(1, delta * 10));

    const strideSway = Math.cos(this.stridePhase) * 0.042 * speedRatio;
    this.character.rotation.x = this.pitchAngle;
    this.character.rotation.z = this.bankAngle + strideSway;

    if (this.aimIndicator) {
      this.aimIndicator.rotation.y = this.aimDirection;
      const targetIndicatorOpacity = this.aimActive ? 0.55 : 0;
      for (const child of this.aimIndicator.children) {
        if (child instanceof THREE.Mesh && child.material && 'opacity' in child.material) {
          const material = child.material as THREE.Material & { opacity: number };
          material.opacity = THREE.MathUtils.lerp(material.opacity, targetIndicatorOpacity, Math.min(1, delta * 12));
        }
      }
    }

    this.attackTime = Math.max(0, this.attackTime - delta);
    this.reviveTime = Math.max(0, this.reviveTime - delta);
    this.levelUpTime = Math.max(0, this.levelUpTime - delta);
    this.victoryTime = Math.max(0, this.victoryTime - delta);

    const attackDuration = this.heroId === 'gunslinger' ? 0.15 : this.heroId === 'warrior' ? 0.22 : 0.19;
    const attackProgress = this.attackTime > 0 ? 1 - this.attackTime / attackDuration : 0;
    const attackSwing = attackProgress > 0 ? Math.sin(Math.min(1, attackProgress) * Math.PI) : 0;
    const celebrateProgress = this.levelUpTime > 0
      ? Math.sin((1 - this.levelUpTime / 0.8) * Math.PI)
      : (this.victoryTime > 0 ? 1 : 0);

    const arms = this.parts.arms as THREE.Object3D[] | undefined;
    if (arms?.length === 2) {
      const armSwing = moving ? Math.sin(this.stridePhase) * 0.48 * speedRatio : 0;
      arms[0].rotation.x = -armSwing;
      arms[1].rotation.x = armSwing;
      arms[0].rotation.z = this.armBaseRotZ[0] - attackSwing * 0.35 - celebrateProgress * 0.5;
      arms[1].rotation.z = this.armBaseRotZ[1] + attackSwing * 0.65 + celebrateProgress * 0.7;
    }

    const cloak = this.parts.cloak as THREE.Object3D | undefined;
    if (cloak) {
      const cloakFlutter = (0.16 + Math.sin(this.visualTime * 14) * 0.06) * speedRatio;
      cloak.rotation.x = THREE.MathUtils.lerp(cloak.rotation.x, cloakFlutter, Math.min(1, delta * 12));
    }

    const staff = this.parts.staff;
    if (staff instanceof THREE.Object3D) {
      const staffBob = moving ? Math.sin(this.stridePhase) * 0.20 * speedRatio : 0;
      staff.rotation.x = staffBob - attackSwing * 0.20;
      staff.rotation.z = -0.28 - attackSwing * 0.62 - celebrateProgress * 0.6;
    }

    const crystal = this.parts.crystal;
    if (crystal instanceof THREE.Object3D) {
      crystal.rotation.y += delta * (moving ? 4.5 : (celebrateProgress > 0 ? 8 : 2.2));
      const castPulse = 1 + attackSwing * 0.32;
      crystal.scale.setScalar(0.28 * castPulse);
    }
    const crystalHalo = this.parts.crystalHalo;
    if (crystalHalo instanceof THREE.Object3D) {
      crystalHalo.rotation.z += delta * (celebrateProgress > 0 ? 5 : 2.4);
      crystalHalo.scale.setScalar(0.26 * (1 + attackSwing * 0.42));
    }

    const scarfTail = this.parts.scarfTail;
    if (scarfTail instanceof THREE.Object3D) {
      scarfTail.rotation.x = -0.24 + Math.sin(this.visualTime * 7.0) * (0.12 + 0.28 * speedRatio);
      scarfTail.rotation.z = Math.cos(this.visualTime * 5.5) * (0.06 + 0.16 * speedRatio);
    }

    if (this.heroId === 'warrior') {
      const weapon = this.parts.weapon;
      if (weapon instanceof THREE.Object3D) {
        weapon.rotation.z = -0.32 + attackSwing * 1.18;
        weapon.rotation.x = -attackSwing * 0.32;
      }
      if (arms?.length === 2 && attackSwing > 0) {
        arms[1].rotation.x = -0.45 - attackSwing * 0.85;
        arms[0].rotation.x = 0.18 + attackSwing * 0.25;
      }
    } else if (this.heroId === 'monk') {
      const chiL = this.parts.chiL;
      const chiR = this.parts.chiR;
      if (chiL instanceof THREE.Object3D) chiL.scale.setScalar(0.16 * (1 + attackSwing * (this.attackVariant === 0 ? 0.9 : 0.35)));
      if (chiR instanceof THREE.Object3D) chiR.scale.setScalar(0.16 * (1 + attackSwing * (this.attackVariant === 1 ? 0.9 : 0.35)));
      if (arms?.length === 2 && attackSwing > 0) {
        const active = this.attackVariant % 2;
        arms[active].rotation.x = -1.0 * attackSwing;
        arms[1 - active].rotation.x = 0.35 * attackSwing;
      }
    } else if (this.heroId === 'gunslinger') {
      const pistolR = this.parts.pistolR;
      const pistolL = this.parts.pistolL;
      const rightShot = this.attackVariant % 2 === 0;
      if (pistolR instanceof THREE.Object3D) {
        pistolR.position.z = 0.28 - (rightShot ? attackSwing * 0.13 : 0);
        pistolR.rotation.x = rightShot ? -attackSwing * 0.16 : 0;
      }
      if (pistolL instanceof THREE.Object3D) {
        pistolL.position.z = 0.28 - (!rightShot ? attackSwing * 0.13 : 0);
        pistolL.rotation.x = !rightShot ? -attackSwing * 0.16 : 0;
      }
      if (arms?.length === 2 && attackSwing > 0) {
        arms[0].rotation.x = -0.55 - (!rightShot ? attackSwing * 0.52 : 0.12);
        arms[1].rotation.x = -0.55 - (rightShot ? attackSwing * 0.52 : 0.12);
      }
    }

    const flow = getCombatFlowState();
    const flowRatio = flow.meter / 100;
    const overdrive = flow.overdrive;
    this.heroLight.intensity = 0.78 + flowRatio * 0.48 + (overdrive ? 0.72 : 0);
    this.heroLight.distance = overdrive ? 6.2 : 5.2;

    const haloMaterial = this.powerHalo.material;
    if (haloMaterial instanceof THREE.Material && 'opacity' in haloMaterial) {
      (haloMaterial as THREE.Material & { opacity: number }).opacity = 0.08 + flowRatio * 0.24 + (overdrive ? 0.34 : 0);
    }
    this.powerHalo.visible = flow.meter > 4 || overdrive;
    this.powerHalo.rotation.z += delta * (0.8 + flowRatio * 2.3 + (overdrive ? 2.2 : 0));
    this.powerHalo.scale.setScalar(0.62 + flowRatio * 0.16 + attackSwing * 0.06 + (overdrive ? 0.16 : 0));

    const accentRadius = 0.64 + flowRatio * 0.16 + (overdrive ? 0.12 : 0);
    this.heroAccent.visible = flow.meter > 18 || overdrive;
    for (let index = 0; index < this.heroAccent.children.length; index += 1) {
      const shard = this.heroAccent.children[index];
      const baseAngle = shard.userData.baseAngle as number;
      const angle = baseAngle + this.visualTime * (1.4 + flowRatio * 1.8 + (overdrive ? 2.2 : 0));
      shard.position.set(
        Math.cos(angle) * accentRadius,
        1.02 + Math.sin(angle * 1.7) * 0.16,
        Math.sin(angle) * accentRadius
      );
      shard.rotation.x += delta * 3.4;
      shard.rotation.y += delta * 5.2;
      shard.scale.setScalar((overdrive ? 0.13 : 0.085) * (1 + attackSwing * 0.30));
    }

    this.detailRig.update(this.visualTime, attackSwing, flowRatio, overdrive);

    const lowHealth = this.stats.currentHP / Math.max(1, this.stats.maxHP) < 0.3;
    this.aura.scale.setScalar(
      1 +
      Math.sin(this.visualTime * (lowHealth ? 5.6 : 3)) * (lowHealth ? 0.11 : 0.06) +
      celebrateProgress * 0.35 +
      flowRatio * 0.09 +
      (overdrive ? 0.13 : 0)
    );
    this.aura.rotation.z += delta * (0.8 + flowRatio * 0.7 + (overdrive ? 1.1 : 0));

    this.hitFlash = Math.max(0, this.hitFlash - delta);
    const revivePop = this.reviveTime > 0 ? 1 + Math.sin((1 - this.reviveTime / 1.2) * Math.PI) * 0.12 : 1;
    const levelUpPulse = celebrateProgress > 0 ? 1 + celebrateProgress * 0.15 : 1;
    const overdrivePulse = overdrive ? 1 + Math.sin(this.visualTime * 8) * 0.018 : 1;
    this.character.scale.setScalar(
      this.baseCharacterScale *
      (this.hitFlash > 0 ? 1.055 : 1) *
      revivePop *
      levelUpPulse *
      overdrivePulse
    );

    if (this.petObject) {
      const behindX = -Math.sin(this.direction);
      const behindY = -Math.cos(this.direction);
      const targetPetX = this.x + behindX * 28 + Math.cos(this.visualTime * 2.5) * 6;
      const targetPetY = this.y + behindY * 28 + Math.sin(this.visualTime * 2.5) * 6;
      this.petFollowPos.lerp(new THREE.Vector2(targetPetX, targetPetY), Math.min(1, delta * 6.0));
      setLogicalPosition(this.petObject, this.petFollowPos.x, this.petFollowPos.y);
      this.petObject.position.y = 0.22 + Math.sin(this.visualTime * 3.8) * 0.05;
      this.petObject.rotation.y = this.direction;
    }
  }

  setMovementVector(x: number, y: number): void {
    const vector = new THREE.Vector2(x, y);
    if (vector.length() < 0.08) vector.set(0, 0);
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

  isAiming(): boolean { return this.aimActive; }
  getAimDirection(): number { return this.aimDirection; }

  getMovementVector(): THREE.Vector2 {
    const spd = this.velocity.length();
    if (spd < 0.01) return new THREE.Vector2(0, 0);
    const maxSpd = Math.max(1, this.stats.moveSpeed);
    const ratio = Math.min(1, spd / maxSpd);
    return new THREE.Vector2((this.velocity.x / spd) * ratio, (this.velocity.y / spd) * ratio);
  }

  getVelocity(): THREE.Vector2 { return this.velocity.clone(); }
  getSpeedRatio(): number { return this.velocity.length() / Math.max(1, this.stats.moveSpeed); }
  getPosition(): { x: number; y: number } { return { x: this.x, y: this.y }; }

  triggerAttack(): void {
    this.attackVariant = (this.attackVariant + 1) % 2;
    this.attackTime = this.heroId === 'gunslinger' ? 0.15 : this.heroId === 'warrior' ? 0.22 : 0.19;
  }
  triggerRevive(): void { this.reviveTime = 1.2; this.hitFlash = 0.2; }
  triggerLevelUp(): void { this.levelUpTime = 0.8; }
  triggerVictory(): void { this.victoryTime = 3.0; }

  takeDamage(amount: number, now: number, invulnerabilityDuration = 0.58): boolean {
    if (this.isInvulnerable(now)) return false;
    this.stats.currentHP = Math.max(0, this.stats.currentHP - Math.max(1, amount));
    this.applyInvulnerability(now, invulnerabilityDuration);
    this.hitFlash = invulnerabilityDuration;
    this.attackTime = 0;
    this.velocity.multiplyScalar(0.72);
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
