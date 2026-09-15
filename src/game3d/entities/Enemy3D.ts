import * as THREE from 'three';
import { ENEMY_BALANCE } from '../../data/balance';
import type { EnemyKind } from '../../types';
import type { SpatialEntity } from '../../game/systems/SpatialGrid';
import { LOGICAL_SCALE, setLogicalPosition } from '../core/coordinates';
import { SharedResources, addMesh } from '../core/SharedResources';
import { addEliteAccent, createEnemyModel } from '../visuals/CharacterFactory';
import { resolveObstacleCollision, steerAroundObstacles } from '../scene/WorldObstacles';
import { audioService } from '../../services/audioService';

let enemySequence = 0;

function lerpAngle(current: number, target: number, t: number): number {
  let diff = (target - current) % (Math.PI * 2);
  if (diff > Math.PI) diff -= Math.PI * 2;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return current + diff * t;
}

export type EnemyCombatState =
  | 'approach'
  | 'windup'
  | 'attack'
  | 'recover';

export interface EnemyAttackEvent {
  type: 'melee' | 'projectile' | 'dive' | 'leap' | 'explosion';
  enemyId: string;
  kind: EnemyKind;
  damage: number;
  originX: number;
  originY: number;
  targetX: number;
  targetY: number;
  radius: number;
  color: number;
  slow?: boolean;
}

export class Enemy3D implements SpatialEntity {
  readonly id: string;
  readonly kind: EnemyKind;
  readonly elite: boolean;
  readonly radius: number;
  readonly maxHP: number;
  readonly baseSpeed: number;
  readonly contactDamage: number;
  readonly xpValue: number;
  readonly worldId: number;
  readonly group: THREE.Group;
  private readonly model: THREE.Group;
  private readonly healthFill: THREE.Mesh;
  private readonly healthBar: THREE.Group;
  private readonly telegraphGroup: THREE.Group;
  private readonly telegraphMesh: THREE.Mesh;
  private readonly frostMesh: THREE.Mesh;
  private readonly shadowMesh: THREE.Mesh;
  private hp: number;
  private slowMultiplier = 1;
  private slowUntil = 0;
  private freezeUntil = 0;
  private phaseTime: number;
  private hitPulse = 0;
  private healthBarLife = 0;
  private readonly baseVisualScale: number;
  private readonly baseModelScale = 0.88;

  // Combat State Machine
  state: EnemyCombatState = 'approach';
  private stateTimer = 0;
  private attackCooldown = 0.4 + (enemySequence % 7) * 0.15;
  private attackTargetX = 0;
  private attackTargetY = 0;
  private attackDirectionX = 0;
  private attackDirectionY = 1;
  private facingAngle = 0;
  private hasEmittedAttack = false;
  private diveProgress = 0;
  private leapStartX = 0;
  private leapStartY = 0;

  constructor(
    parent: THREE.Object3D,
    kind: EnemyKind,
    x: number,
    y: number,
    resources: SharedResources,
    elite = false,
    hpMultiplier = 1,
    damageMultiplier = hpMultiplier,
    worldId = 1
  ) {
    const balance = ENEMY_BALANCE[kind];
    this.id = `enemy-${enemySequence += 1}`;
    this.kind = kind;
    this.elite = elite;
    this.worldId = worldId;
    this.radius = balance.radius * (elite ? 1.28 : 1);
    this.maxHP = balance.hp * hpMultiplier * (elite ? 2.35 : 1);
    this.hp = this.maxHP;
    this.baseSpeed = balance.speed * (elite ? 1.08 : 1);
    this.contactDamage = balance.damage * damageMultiplier * (elite ? 1.2 : 1);
    this.xpValue = balance.xp * (elite ? 4 : 1);
    this.group = new THREE.Group();
    this.group.name = this.id;
    this.model = createEnemyModel(kind, balance.color, resources, worldId);
    const visualScale = (this.radius * LOGICAL_SCALE) / 0.38;
    this.baseVisualScale = visualScale;
    this.phaseTime = (enemySequence * 1.618) % 5;
    this.model.scale.setScalar(visualScale * this.baseModelScale);
    this.group.add(this.model);
    if (elite) addEliteAccent(this.model, resources);

    // Ground Contact Shadow (Soft oval grounded to terrain at y=0.006)
    const shadowMat = resources.basicMaterial('enemy-contact-shadow-mat', 0x01050a, {
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(resources.plane('enemy-contact-shadow-geom', 1, 1), shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.scale.set(visualScale * 1.1, visualScale * 0.68, 1);
    shadowMesh.position.y = 0.006;
    this.group.add(shadowMesh);
    this.shadowMesh = shadowMesh;

    // Slime Glowing Green Residue / Ground Pool
    if (kind === 'slime') {
      const slimePoolMat = resources.basicMaterial('slime-ground-pool-mat', 0x22c55e, {
        transparent: true,
        opacity: 0.46,
        depthWrite: false,
      });
      const slimePool = new THREE.Mesh(resources.circle('slime-ground-pool-geom'), slimePoolMat);
      slimePool.rotation.x = -Math.PI / 2;
      slimePool.scale.set(visualScale * 1.25, visualScale * 0.95, 1);
      slimePool.position.y = 0.016;
      this.group.add(slimePool);
    } else if (kind === 'ghost' || kind === 'frost-wraith') {
      const spectralMat = resources.basicMaterial(`spectral-pool-${kind}`, 0x60a5fa, {
        transparent: true,
        opacity: 0.38,
        depthWrite: false,
      });
      const spectralPool = new THREE.Mesh(resources.circle('spectral-pool-geom'), spectralMat);
      spectralPool.rotation.x = -Math.PI / 2;
      spectralPool.scale.set(visualScale * 1.15, visualScale * 0.85, 1);
      spectralPool.position.y = 0.016;
      this.group.add(spectralPool);
    }

    // Telegraph Visual
    this.telegraphGroup = new THREE.Group();
    this.telegraphGroup.position.set(0, 0.03, 0);
    this.telegraphGroup.visible = false;
    this.telegraphMesh = addMesh(
      this.telegraphGroup,
      resources.circle('enemy-telegraph-geom'),
      resources.basicMaterial('enemy-telegraph-mat', 0xff3344, {
        transparent: true,
        opacity: 0.45,
      })
    );
    this.telegraphMesh.rotation.x = -Math.PI / 2;
    this.group.add(this.telegraphGroup);

    // Frost crystal overlay for freeze state
    this.frostMesh = addMesh(
      this.group,
      resources.octa('enemy-frost-crystal'),
      resources.standardMaterial('enemy-frost-mat', 0xa8f0ff, {
        transparent: true,
        opacity: 0.68,
        roughness: 0.15,
        metalness: 0.25,
        emissive: 0x3ac8ff,
        emissiveIntensity: 0.85,
      })
    );
    this.frostMesh.scale.set(visualScale * 1.15, visualScale * 1.35, visualScale * 1.15);
    this.frostMesh.position.set(0, 0.72 * visualScale, 0);
    this.frostMesh.visible = false;

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

  get currentHP(): number {
    return this.hp;
  }

  getFacingAngle(): number {
    return this.facingAngle;
  }

  checkFrontShield(sourceX: number, sourceY: number): boolean {
    if (this.kind !== 'knight') return false;
    const toSourceX = sourceX - this.x;
    const toSourceY = sourceY - this.y;
    const sourceDist = Math.hypot(toSourceX, toSourceY);
    if (sourceDist < 1) return true;
    const facingX = Math.sin(this.facingAngle);
    const facingY = Math.cos(this.facingAngle);
    const dot = (toSourceX / sourceDist) * facingX + (toSourceY / sourceDist) * facingY;
    return dot > 0.42; // Within frontal ~65 degree arc
  }

  update(
    playerX: number,
    playerY: number,
    delta: number,
    now: number,
    canInitiateHighThreat: () => boolean = () => true
  ): EnemyAttackEvent | undefined {
    let attackEvent: EnemyAttackEvent | undefined;

    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const distance = Math.max(1, Math.sqrt(dx * dx + dy * dy));

    this.phaseTime += delta;
    this.attackCooldown = Math.max(0, this.attackCooldown - delta);
    this.hitPulse = Math.max(0, this.hitPulse - delta);
    this.healthBarLife = Math.max(0, this.healthBarLife - delta);

    // Freeze check: hold position, pause state execution, display frost overlay
    if (now < this.freezeUntil) {
      this.frostMesh.visible = true;
      this.frostMesh.rotation.y += delta * 1.8;
      this.syncPosition();
      return undefined;
    }
    this.frostMesh.visible = false;

    // If enemy is far, use lightweight straight pursuit without expensive attack states
    if (distance > 340 && this.state === 'approach') {
      let dirX = dx / distance;
      let dirY = dy / distance;
      const steer = steerAroundObstacles(this.x, this.y, dirX, dirY, this.worldId);
      dirX = steer.dirX;
      dirY = steer.dirY;
      const spd = this.baseSpeed * (now < this.slowUntil ? this.slowMultiplier : 1);
      this.x += dirX * spd * delta;
      this.y += dirY * spd * delta;
      const resolved = resolveObstacleCollision(this.x, this.y, this.radius * 0.75, this.worldId);
      this.x = resolved.x;
      this.y = resolved.y;
      this.facingAngle = Math.atan2(dirX, dirY);
      this.model.rotation.y = lerpAngle(this.model.rotation.y, this.facingAngle, Math.min(1, delta * 12));
      this.syncPosition();
      this.updateProceduralAnimation(delta, dirX, dirY, false);
      return undefined;
    }

    // --- State Machine Execution ---
    switch (this.state) {
      case 'approach': {
        this.telegraphGroup.visible = false;
        let dirX = dx / distance;
        let dirY = dy / distance;

        // Archer and Thornling maintain range band
        const isArcher = this.kind === 'archer';
        const isThornling = this.kind === 'thornling';
        if (isArcher && distance < 170) {
          dirX *= -1;
          dirY *= -1;
        } else if (isArcher && distance >= 170 && distance <= 240) {
          // Strafe tangentially
          const strafeAngle = Math.sin(this.phaseTime * 2.2) > 0 ? Math.PI / 2 : -Math.PI / 2;
          const rotatedX = dirX * Math.cos(strafeAngle) - dirY * Math.sin(strafeAngle);
          const rotatedY = dirX * Math.sin(strafeAngle) + dirY * Math.cos(strafeAngle);
          dirX = rotatedX * 0.7;
          dirY = rotatedY * 0.7;
        } else if (isThornling && distance < 140) {
          // Thornling maintains medium distance (140-210)
          dirX *= -1;
          dirY *= -1;
        } else if (isThornling && distance >= 140 && distance <= 210) {
          // Strafe tangentially
          const strafeAngle = Math.cos(this.phaseTime * 2.0) > 0 ? Math.PI / 2 : -Math.PI / 2;
          const rotatedX = dirX * Math.cos(strafeAngle) - dirY * Math.sin(strafeAngle);
          const rotatedY = dirX * Math.sin(strafeAngle) + dirY * Math.cos(strafeAngle);
          dirX = rotatedX * 0.75;
          dirY = rotatedY * 0.75;
        }

        const steer = steerAroundObstacles(this.x, this.y, dirX, dirY, this.worldId);
        dirX = steer.dirX;
        dirY = steer.dirY;

        const currentSpeed =
          this.baseSpeed * (now < this.slowUntil ? this.slowMultiplier : 1);

        if (distance > 34 || isArcher || isThornling) {
          this.x += dirX * currentSpeed * delta;
          this.y += dirY * currentSpeed * delta;
          const resolved = resolveObstacleCollision(this.x, this.y, this.radius * 0.75, this.worldId);
          this.x = resolved.x;
          this.y = resolved.y;
        }
        this.facingAngle = Math.atan2(dx / distance, dy / distance);
        this.model.rotation.y = lerpAngle(this.model.rotation.y, this.facingAngle, Math.min(1, delta * 12));

        // Check attack initiation criteria per kind
        if (this.attackCooldown <= 0) {
          if (this.kind === 'skeleton' && distance < 52) {
            this.enterState('windup', 0.38, playerX, playerY);
          } else if (this.kind === 'bat' && distance < 130 && canInitiateHighThreat()) {
            audioService.playSFX('bat-dive', { throttle: 0.35 });
            this.enterState('windup', 0.42, playerX, playerY);
          } else if (this.kind === 'slime' && distance < 160 && canInitiateHighThreat()) {
            audioService.playSFX('slime-jump', { throttle: 0.35 });
            this.enterState('windup', 0.50, playerX, playerY);
          } else if (this.kind === 'ghost' && distance < 170) {
            audioService.playSFX('ghost-phase', { throttle: 0.35 });
            this.enterState('windup', 0.36, playerX, playerY);
          } else if (this.kind === 'archer' && distance < 260 && canInitiateHighThreat()) {
            audioService.playSFX('archer-charge', { throttle: 0.35 });
            this.enterState('windup', 0.58, playerX, playerY);
          } else if (this.kind === 'knight' && distance < 56) {
            audioService.playSFX('knight-charge', { throttle: 0.35 });
            this.enterState('windup', 0.48, playerX, playerY);
          } else if (this.kind === 'cursed-wolf' && distance < 140 && canInitiateHighThreat()) {
            this.enterState('windup', 0.35, playerX, playerY);
          } else if (this.kind === 'thornling' && distance < 220 && canInitiateHighThreat()) {
            this.enterState('windup', 0.52, playerX, playerY);
          } else if (this.kind === 'treant' && distance < 68) {
            this.enterState('windup', 0.65, playerX, playerY);
          } else if (this.kind === 'frost-wraith' && distance < 160 && canInitiateHighThreat()) {
            audioService.playSFX('ghost-phase', { throttle: 0.35 });
            this.enterState('windup', 0.38, playerX, playerY);
          } else if (this.kind === 'demon' && distance < 58) {
            this.enterState('windup', 0.28, playerX, playerY);
          } else if (this.kind === 'imp' && distance < 65) {
            audioService.playSFX('imp-fuse', { throttle: 0.2 });
            this.enterState('windup', 0.85, playerX, playerY);
          }
        }
        break;
      }

      case 'windup': {
        this.stateTimer -= delta;
        this.showTelegraph();

        if (this.kind === 'imp') {
          // Slow down while fuse ticks down
          this.x += (dx / distance) * (this.baseSpeed * 0.25) * delta;
          this.y += (dy / distance) * (this.baseSpeed * 0.25) * delta;
          if (Math.floor(this.phaseTime * 9) % 2 === 0) {
            audioService.playSFX('imp-fuse', { throttle: 0.12 });
          }
        }

        if (this.stateTimer <= 0) {
          // Windup complete -> enter attack
          if (this.kind === 'bat') {
            this.enterState('attack', 0.26, playerX, playerY);
          } else if (this.kind === 'slime') {
            this.leapStartX = this.x;
            this.leapStartY = this.y;
            this.enterState('attack', 0.36, playerX, playerY);
          } else if (this.kind === 'ghost') {
            this.enterState('attack', 0.24, playerX, playerY);
          } else if (this.kind === 'archer') {
            this.enterState('attack', 0.15, playerX, playerY);
          } else if (this.kind === 'cursed-wolf') {
            this.enterState('attack', 0.24, playerX, playerY);
          } else if (this.kind === 'thornling') {
            this.enterState('attack', 0.15, playerX, playerY);
          } else if (this.kind === 'treant') {
            this.enterState('attack', 0.30, playerX, playerY);
          } else if (this.kind === 'frost-wraith') {
            this.enterState('attack', 0.24, playerX, playerY);
          } else if (this.kind === 'imp') {
            this.enterState('attack', 0.1, playerX, playerY);
          } else {
            this.enterState('attack', 0.20, playerX, playerY);
          }
        }
        break;
      }

      case 'attack': {
        this.stateTimer -= delta;
        this.telegraphGroup.visible = false;

        // Perform attack motion and event emission
        if (!this.hasEmittedAttack) {
          this.hasEmittedAttack = true;

          if (this.kind === 'skeleton') {
            audioService.playSFX('skeleton-slash', { throttle: 0.2 });
            attackEvent = {
              type: 'melee',
              enemyId: this.id,
              kind: this.kind,
              damage: this.contactDamage * (this.elite ? 1.3 : 1.0),
              originX: this.x,
              originY: this.y,
              targetX: this.x + this.attackDirectionX * 42,
              targetY: this.y + this.attackDirectionY * 42,
              radius: 46 * (this.elite ? 1.35 : 1.0),
              color: 0xe0e7ef,
            };
          } else if (this.kind === 'archer') {
            attackEvent = {
              type: 'projectile',
              enemyId: this.id,
              kind: this.kind,
              damage: this.contactDamage * 0.95,
              originX: this.x,
              originY: this.y,
              targetX: this.x + this.attackDirectionX * 240,
              targetY: this.y + this.attackDirectionY * 240,
              radius: 14,
              color: 0x93c5fd,
            };
          } else if (this.kind === 'knight') {
            audioService.playSFX('skeleton-slash', { pitch: 0.75 });
            attackEvent = {
              type: 'melee',
              enemyId: this.id,
              kind: this.kind,
              damage: this.contactDamage * 1.35,
              originX: this.x,
              originY: this.y,
              targetX: this.x + this.attackDirectionX * 48,
              targetY: this.y + this.attackDirectionY * 48,
              radius: 56 * (this.elite ? 1.4 : 1.0),
              color: 0x60a5fa,
            };
          } else if (this.kind === 'demon') {
            audioService.playSFX('demon-slash', { throttle: 0.18 });
            attackEvent = {
              type: 'melee',
              enemyId: this.id,
              kind: this.kind,
              damage: this.contactDamage * 1.15,
              originX: this.x,
              originY: this.y,
              targetX: this.x + this.attackDirectionX * 45,
              targetY: this.y + this.attackDirectionY * 45,
              radius: 50 * (this.elite ? 1.35 : 1.0),
              color: 0xef4444,
            };
          } else if (this.kind === 'imp') {
            audioService.playSFX('imp-explode');
            attackEvent = {
              type: 'explosion',
              enemyId: this.id,
              kind: this.kind,
              damage: this.contactDamage * 1.45,
              originX: this.x,
              originY: this.y,
              targetX: this.x,
              targetY: this.y,
              radius: 76 * (this.elite ? 1.4 : 1.0),
              color: 0xf97316,
            };
          } else if (this.kind === 'cursed-wolf') {
            audioService.playSFX('bat-dive', { pitch: 0.65 });
            attackEvent = {
              type: 'melee',
              enemyId: this.id,
              kind: this.kind,
              damage: this.contactDamage * 1.15,
              originX: this.x,
              originY: this.y,
              targetX: this.x + this.attackDirectionX * 36,
              targetY: this.y + this.attackDirectionY * 36,
              radius: 32 * (this.elite ? 1.3 : 1.0),
              color: 0xd97706,
            };
          } else if (this.kind === 'thornling') {
            attackEvent = {
              type: 'projectile',
              enemyId: this.id,
              kind: this.kind,
              damage: this.contactDamage * 0.92,
              originX: this.x,
              originY: this.y,
              targetX: this.x + this.attackDirectionX * 220,
              targetY: this.y + this.attackDirectionY * 220,
              radius: 12,
              color: 0x84cc16,
            };
          } else if (this.kind === 'treant') {
            audioService.playSFX('slime-jump', { pitch: 0.5 });
            attackEvent = {
              type: 'melee',
              enemyId: this.id,
              kind: this.kind,
              damage: this.contactDamage * 1.45,
              originX: this.x + this.attackDirectionX * 20,
              originY: this.y + this.attackDirectionY * 20,
              targetX: this.x + this.attackDirectionX * 30,
              targetY: this.y + this.attackDirectionY * 30,
              radius: 68 * (this.elite ? 1.35 : 1.0),
              color: 0x4d7c0f,
            };
          } else if (this.kind === 'frost-wraith') {
            audioService.playSFX('ghost-phase', { pitch: 1.2 });
            attackEvent = {
              type: 'melee',
              enemyId: this.id,
              kind: this.kind,
              damage: this.contactDamage * 1.15,
              originX: this.x,
              originY: this.y,
              targetX: this.x + this.attackDirectionX * 38,
              targetY: this.y + this.attackDirectionY * 38,
              radius: 36 * (this.elite ? 1.3 : 1.0),
              color: 0x38bdf8,
              slow: true,
            };
          }
        }

        // Kinetic movement during attack
        if (this.kind === 'bat') {
          this.diveProgress = Math.min(1, this.diveProgress + delta * 3.8);
          this.x += this.attackDirectionX * (this.baseSpeed * 2.8) * delta;
          this.y += this.attackDirectionY * (this.baseSpeed * 2.8) * delta;
          // check mid-dive collision with player
          if (distance < this.radius + 24) {
            attackEvent = {
              type: 'dive',
              enemyId: this.id,
              kind: this.kind,
              damage: this.contactDamage * 1.1,
              originX: this.x,
              originY: this.y,
              targetX: playerX,
              targetY: playerY,
              radius: 38,
              color: 0xa855f7,
            };
          }
        } else if (this.kind === 'cursed-wolf') {
          this.x += this.attackDirectionX * (this.baseSpeed * 2.8) * delta;
          this.y += this.attackDirectionY * (this.baseSpeed * 2.8) * delta;
        } else if (this.kind === 'frost-wraith') {
          this.x += this.attackDirectionX * (this.baseSpeed * 2.5) * delta;
          this.y += this.attackDirectionY * (this.baseSpeed * 2.5) * delta;
        } else if (this.kind === 'slime') {
          const progress = 1 - Math.max(0, this.stateTimer / 0.36);
          this.x = THREE.MathUtils.lerp(this.leapStartX, this.attackTargetX, progress);
          this.y = THREE.MathUtils.lerp(this.leapStartY, this.attackTargetY, progress);
          // Parabolic jump height
          this.model.position.y = Math.sin(progress * Math.PI) * 1.8;
          if (this.stateTimer <= 0) {
            attackEvent = {
              type: 'leap',
              enemyId: this.id,
              kind: this.kind,
              damage: this.contactDamage * 1.15,
              originX: this.x,
              originY: this.y,
              targetX: this.x,
              targetY: this.y,
              radius: 48 * (this.elite ? 1.4 : 1.0),
              color: 0x22c55e,
              slow: true,
            };
          }
        } else if (this.kind === 'ghost') {
          this.x += this.attackDirectionX * (this.baseSpeed * 2.5) * delta;
          this.y += this.attackDirectionY * (this.baseSpeed * 2.5) * delta;
          if (distance < this.radius + 22) {
            attackEvent = {
              type: 'melee',
              enemyId: this.id,
              kind: this.kind,
              damage: this.contactDamage * 0.95,
              originX: this.x,
              originY: this.y,
              targetX: playerX,
              targetY: playerY,
              radius: 40,
              color: 0x38bdf8,
            };
          }
        }

        // Kinetic attack obstacle collision resolution
        const resolvedKinetic = resolveObstacleCollision(this.x, this.y, this.radius * 0.75, this.worldId);
        this.x = resolvedKinetic.x;
        this.y = resolvedKinetic.y;

        if (this.stateTimer <= 0) {
          const recoveryDuration =
            this.kind === 'treant'
              ? 0.75
              : this.kind === 'knight'
              ? 0.75
              : this.kind === 'skeleton'
              ? 0.52
              : this.kind === 'cursed-wolf'
              ? 0.35
              : this.kind === 'thornling'
              ? 0.40
              : this.kind === 'frost-wraith'
              ? 0.38
              : this.kind === 'imp'
              ? 0.05
              : 0.45;
          this.enterState('recover', recoveryDuration, playerX, playerY);
        }
        break;
      }

      case 'recover': {
        this.stateTimer -= delta;
        this.telegraphGroup.visible = false;
        if (this.kind === 'slime') this.model.position.y = 0;
        if (this.kind === 'thornling') {
          // Relocate tangentially / backwards during recovery
          const relX = -dy / distance;
          const relY = dx / distance;
          this.x += relX * (this.baseSpeed * 0.6) * delta;
          this.y += relY * (this.baseSpeed * 0.6) * delta;
        }

        if (this.stateTimer <= 0) {
          this.state = 'approach';
          this.attackCooldown =
            this.kind === 'treant'
              ? 3.2
              : this.kind === 'archer'
              ? 2.6
              : this.kind === 'thornling'
              ? 2.4
              : this.kind === 'knight'
              ? 2.4
              : this.kind === 'cursed-wolf'
              ? 1.9
              : this.kind === 'frost-wraith'
              ? 2.2
              : this.kind === 'bat'
              ? 2.1
              : this.kind === 'slime'
              ? 2.3
              : 1.4 + Math.random() * 0.5;
        }
        break;
      }
    }

    this.syncPosition();
    this.updateProceduralAnimation(delta, dx / distance, dy / distance, this.state === 'windup');
    this.healthBar.lookAt(this.group.position.clone().add(new THREE.Vector3(0, 4, 8)));
    this.updateHealthBar();

    return attackEvent;
  }

  private enterState(
    nextState: EnemyCombatState,
    duration: number,
    playerX: number,
    playerY: number
  ): void {
    this.state = nextState;
    this.stateTimer = duration;
    this.hasEmittedAttack = false;

    if (nextState === 'windup') {
      this.attackTargetX = playerX;
      this.attackTargetY = playerY;
      const dx = playerX - this.x;
      const dy = playerY - this.y;
      const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      this.attackDirectionX = dx / dist;
      this.attackDirectionY = dy / dist;
      this.facingAngle = Math.atan2(this.attackDirectionX, this.attackDirectionY);
      this.model.rotation.y = lerpAngle(this.model.rotation.y, this.facingAngle, 0.4);
      this.diveProgress = 0;
    }
  }

  private showTelegraph(): void {
    this.telegraphGroup.visible = true;
    this.telegraphGroup.rotation.y = this.facingAngle;

    if (this.kind === 'skeleton' || this.kind === 'knight' || this.kind === 'demon') {
      // Forward melee danger zone
      this.telegraphMesh.scale.set(0.65, 0.95, 0.65);
      this.telegraphMesh.position.set(0, 0, 0.65);
    } else if (this.kind === 'archer') {
      // Long narrow laser aim line
      this.telegraphMesh.scale.set(0.12, 3.2, 0.12);
      this.telegraphMesh.position.set(0, 0, 2.0);
    } else if (this.kind === 'thornling') {
      // Aimed thorn projectile line
      this.telegraphMesh.scale.set(0.12, 2.8, 0.12);
      this.telegraphMesh.position.set(0, 0, 1.8);
    } else if (this.kind === 'cursed-wolf') {
      // Fast locked-direction pounce lane
      this.telegraphMesh.scale.set(0.38, 2.6, 0.38);
      this.telegraphMesh.position.set(0, 0, 1.6);
    } else if (this.kind === 'treant') {
      // Broad ground slam circle
      this.telegraphMesh.scale.set(2.2, 2.2, 2.2);
      this.telegraphMesh.position.set(0, 0, 0.35);
    } else if (this.kind === 'frost-wraith') {
      // Frost lane strike
      this.telegraphMesh.scale.set(0.46, 2.4, 0.46);
      this.telegraphMesh.position.set(0, 0, 1.5);
    } else if (this.kind === 'bat' || this.kind === 'ghost') {
      // Dive lane
      this.telegraphMesh.scale.set(0.42, 2.2, 0.42);
      this.telegraphMesh.position.set(0, 0, 1.4);
    } else if (this.kind === 'slime') {
      // Landing circle
      this.telegraphMesh.scale.set(1.2, 1.2, 1.2);
      this.telegraphMesh.position.set(0, 0, 0);
    } else if (this.kind === 'imp') {
      // Expanding fuse radius
      const progress = 1 - Math.max(0, this.stateTimer / 0.85);
      const scale = 1.0 + progress * 0.8;
      this.telegraphMesh.scale.set(scale, scale, scale);
      this.telegraphMesh.position.set(0, 0, 0);
    }
  }

  private updateProceduralAnimation(
    delta: number,
    dirX: number,
    dirY: number,
    isWindingUp: boolean
  ): void {
    const parts = this.model.userData.parts as
      | Record<string, THREE.Object3D | THREE.Object3D[]>
      | undefined;

    // Movement bobbing & procedural animation per enemy archetype
    const isFlying = this.kind === 'bat' || this.kind === 'ghost' || this.kind === 'frost-wraith';
    if (isFlying) {
      this.model.position.y = 0.45 + Math.sin(this.phaseTime * 3.4) * 0.12;
      this.shadowMesh.scale.set(this.baseVisualScale * 0.9, this.baseVisualScale * 0.55, 1);
    } else if (this.kind === 'slime' && this.state === 'approach') {
      const hopCadence = 5.2;
      const hopPhase = (this.phaseTime * hopCadence) % Math.PI;
      if (hopPhase < Math.PI * 0.72) {
        const norm = hopPhase / (Math.PI * 0.72);
        const h = Math.sin(norm * Math.PI) * 0.44;
        this.model.position.y = h;
        if (parts?.body instanceof THREE.Object3D) {
          parts.body.scale.y = 0.62 * (1 + 0.36 * Math.sin(norm * Math.PI));
          parts.body.scale.x = 0.82 * (1 - 0.18 * Math.sin(norm * Math.PI));
          parts.body.scale.z = 0.72 * (1 - 0.18 * Math.sin(norm * Math.PI));
        }
        this.shadowMesh.scale.set(this.baseVisualScale * 0.9, this.baseVisualScale * 0.54, 1);
      } else {
        this.model.position.y = 0;
        if (parts?.body instanceof THREE.Object3D) {
          parts.body.scale.y = 0.38;
          parts.body.scale.x = 1.16;
          parts.body.scale.z = 1.04;
        }
        this.shadowMesh.scale.set(this.baseVisualScale * 1.35, this.baseVisualScale * 0.84, 1);
      }
    } else if (this.kind !== 'slime') {
      this.model.position.y = Math.abs(Math.sin(this.phaseTime * (this.kind === 'imp' ? 8.5 : 5.5))) * 0.035;
      this.shadowMesh.scale.set(this.baseVisualScale * 1.1, this.baseVisualScale * 0.68, 1);
    }
    this.shadowMesh.position.y = 0.006;

    const elitePulse = this.elite ? 1 + Math.sin(this.phaseTime * 4) * 0.035 : 1;
    const hitScale =
      this.hitPulse > 0
        ? 1 + Math.sin((1 - this.hitPulse / 0.16) * Math.PI) * 0.13
        : 1;
    const windupPulse = isWindingUp ? 1 + Math.sin(this.phaseTime * 14) * 0.07 : 1;

    this.model.scale.setScalar(
      this.baseVisualScale *
        this.baseModelScale *
        elitePulse *
        hitScale *
        windupPulse
    );

    // Orientation tracking during active combat states
    if (this.state === 'windup' || this.state === 'attack') {
      this.model.rotation.y = lerpAngle(this.model.rotation.y, this.facingAngle, Math.min(1, delta * 14));
    }

    // Dynamic Leg Strides for Grounded Enemies
    const isMoving = this.state === 'approach';
    if (parts?.legs instanceof Array) {
      if (this.kind === 'cursed-wolf' && parts.legs.length === 4) {
        const gallop = isMoving ? Math.sin(this.phaseTime * 11) * 0.75 : 0;
        parts.legs[0].rotation.x = gallop;
        parts.legs[1].rotation.x = -gallop;
        parts.legs[2].rotation.x = -gallop;
        parts.legs[3].rotation.x = gallop;
        this.model.rotation.x = THREE.MathUtils.lerp(this.model.rotation.x, isMoving ? 0.12 : 0, delta * 10);
      } else if (parts.legs.length === 2) {
        const cadence = this.kind === 'thornling' ? 14 : (this.kind === 'treant' ? 4.5 : (this.kind === 'imp' ? 11 : (this.kind === 'knight' ? 6 : 8)));
        const stride = isMoving ? Math.sin(this.phaseTime * cadence) * (this.kind === 'treant' ? 0.42 : 0.68) : 0;
        parts.legs[0].rotation.x = THREE.MathUtils.lerp(parts.legs[0].rotation.x, stride, Math.min(1, delta * 16));
        parts.legs[1].rotation.x = THREE.MathUtils.lerp(parts.legs[1].rotation.x, -stride, Math.min(1, delta * 16));
        const hipBase = this.kind === 'treant' ? 0.58 : (this.kind === 'thornling' ? 0.32 : 0.44);
        parts.legs[0].position.y = hipBase + Math.max(0, stride) * 0.08;
        parts.legs[1].position.y = hipBase + Math.max(0, -stride) * 0.08;

        if (this.state === 'approach') {
          this.model.rotation.x = THREE.MathUtils.lerp(this.model.rotation.x, 0.15, delta * 10);
        } else if (this.state === 'attack') {
          this.model.rotation.x = THREE.MathUtils.lerp(this.model.rotation.x, 0.22, delta * 14);
        } else {
          this.model.rotation.x = THREE.MathUtils.lerp(this.model.rotation.x, 0, delta * 10);
        }
      }
    }

    // Natural Arm Swing for Bipedal Enemies (archer, treant, thornling, demon)
    if (parts?.arms instanceof Array && parts.arms.length === 2 && this.kind !== 'skeleton') {
      const arms = parts.arms;
      if (isWindingUp) {
        arms[0].rotation.x = THREE.MathUtils.lerp(arms[0].rotation.x, -0.9, delta * 12);
        arms[1].rotation.x = THREE.MathUtils.lerp(arms[1].rotation.x, -0.9, delta * 12);
      } else if (this.state === 'attack') {
        arms[0].rotation.x = THREE.MathUtils.lerp(arms[0].rotation.x, 0.85, delta * 16);
        arms[1].rotation.x = THREE.MathUtils.lerp(arms[1].rotation.x, 0.85, delta * 16);
      } else if (isMoving) {
        const cadence = this.kind === 'thornling' ? 14 : (this.kind === 'treant' ? 4.5 : (this.kind === 'knight' ? 6 : 8));
        const armSwing = Math.sin(this.phaseTime * cadence) * 0.42;
        arms[0].rotation.x = -armSwing;
        arms[1].rotation.x = armSwing;
      } else {
        arms[0].rotation.x = THREE.MathUtils.lerp(arms[0].rotation.x, 0, delta * 8);
        arms[1].rotation.x = THREE.MathUtils.lerp(arms[1].rotation.x, 0, delta * 8);
      }
    }

    if (this.kind === 'bat') {
      if (parts?.wings instanceof Array && parts.wings.length === 2) {
        const flapRate = isWindingUp ? 18 : this.state === 'attack' ? 26 : 10;
        parts.wings[0].rotation.z = -0.22 - Math.sin(this.phaseTime * flapRate) * 0.52;
        parts.wings[1].rotation.z = 0.22 + Math.sin(this.phaseTime * flapRate) * 0.52;
      }
      if (this.state === 'attack') {
        this.model.rotation.x = THREE.MathUtils.lerp(this.model.rotation.x, 0.42, delta * 12);
      } else {
        this.model.rotation.x = THREE.MathUtils.lerp(this.model.rotation.x, 0, delta * 8);
      }
    }

    if (this.kind === 'slime' && parts?.body instanceof THREE.Object3D) {
      if (isWindingUp) {
        // Squish flat anticipation
        parts.body.scale.y = 0.30;
        parts.body.scale.x = 1.28;
        parts.body.scale.z = 1.18;
      }
    }

    if (this.kind === 'ghost' || this.kind === 'frost-wraith') {
      const ghostBody = parts?.body as THREE.Object3D | undefined;
      if (ghostBody) {
        ghostBody.position.y = Math.sin(this.phaseTime * 3.8) * 0.15;
        ghostBody.rotation.z = Math.sin(this.phaseTime * 2.4) * 0.08;
      }
      if (parts?.tails instanceof Array) {
        for (let i = 0; i < parts.tails.length; i += 1) {
          parts.tails[i].rotation.z +=
            Math.sin(this.phaseTime * 3.2 + i) * delta * 0.65;
        }
      }
    }

    if (this.kind === 'skeleton' && parts?.arms instanceof Array) {
      const arms = parts.arms;
      if (arms.length === 2) {
        if (isWindingUp) {
          // Raise sword arm high for attack
          arms[1].rotation.x = THREE.MathUtils.lerp(arms[1].rotation.x, -1.35, delta * 14);
          arms[0].rotation.x = THREE.MathUtils.lerp(arms[0].rotation.x, 0.35, delta * 14);
        } else if (this.state === 'attack') {
          // Slash downward forward
          arms[1].rotation.x = THREE.MathUtils.lerp(arms[1].rotation.x, 0.85, delta * 18);
          arms[0].rotation.x = THREE.MathUtils.lerp(arms[0].rotation.x, -0.45, delta * 18);
        } else if (isMoving) {
          arms[0].rotation.x = -Math.sin(this.phaseTime * 8) * 0.42;
          arms[1].rotation.x = Math.sin(this.phaseTime * 8) * 0.42;
        } else {
          arms[0].rotation.x = THREE.MathUtils.lerp(arms[0].rotation.x, 0, delta * 8);
          arms[1].rotation.x = THREE.MathUtils.lerp(arms[1].rotation.x, 0, delta * 8);
        }
      }
    }

    if (this.kind === 'knight') {
      const sword = parts?.sword as THREE.Object3D | undefined;
      const shield = parts?.shield as THREE.Object3D | undefined;
      if (sword) {
        if (isWindingUp) {
          sword.rotation.z = THREE.MathUtils.lerp(sword.rotation.z, -1.1, delta * 12);
          sword.rotation.x = THREE.MathUtils.lerp(sword.rotation.x, 0.4, delta * 12);
        } else if (this.state === 'attack') {
          sword.rotation.z = THREE.MathUtils.lerp(sword.rotation.z, 0.55, delta * 18);
          sword.rotation.x = THREE.MathUtils.lerp(sword.rotation.x, -0.2, delta * 18);
        } else {
          sword.rotation.z = -0.45 + (isMoving ? Math.sin(this.phaseTime * 6) * 0.20 : 0);
          sword.rotation.x = isMoving ? Math.cos(this.phaseTime * 6) * 0.14 : 0;
        }
      }
      if (shield) {
        shield.rotation.y = isMoving ? Math.sin(this.phaseTime * 6) * 0.12 : 0;
      }
    }
  }

  applySlow(multiplier: number, duration: number, now: number): void {
    this.slowMultiplier = Math.min(this.slowMultiplier, multiplier);
    this.slowUntil = Math.max(this.slowUntil, now + duration);
  }

  applyFreeze(duration: number, now: number, postSlowDuration = 2.2): void {
    const effectiveDuration = this.elite ? duration * 0.5 : duration;
    this.freezeUntil = Math.max(this.freezeUntil, now + effectiveDuration);
    this.applySlow(0.55, effectiveDuration + postSlowDuration, now);
  }

  damage(amount: number): boolean {
    this.hp = Math.max(0, this.hp - amount);
    this.hitPulse = 0.16;
    this.healthBarLife = 2.4;
    this.updateHealthBar();
    return this.hp <= 0;
  }

  private updateHealthBar(): void {
    const pct = Math.max(0, Math.min(1, this.hp / this.maxHP));
    this.healthFill.scale.x = pct;
    this.healthFill.position.x = (-0.5 * (1 - pct)) * 0.6;
    this.healthBar.visible = this.healthBarLife > 0 && this.hp < this.maxHP;
  }

  private syncPosition(): void {
    setLogicalPosition(this.group, this.x, this.y);
  }

  destroy(): void {
    this.group.removeFromParent();
  }
}

function createHealthBar(resources: SharedResources, elite: boolean): THREE.Group {
  const bar = new THREE.Group();
  const width = elite ? 0.8 : 0.6;
  const bg = addMesh(
    bar,
    resources.box('hp-bg-box'),
    resources.basicMaterial('hp-bg-mat', 0x07111c)
  );
  bg.scale.set(width, 0.07, 0.02);
  const fill = addMesh(
    bar,
    resources.box('hp-fill-box'),
    resources.basicMaterial(elite ? 'hp-elite-fill-mat' : 'hp-fill-mat', elite ? 0xffbb33 : 0xef4444)
  );
  fill.scale.set(width, 0.05, 0.03);
  return bar;
}
