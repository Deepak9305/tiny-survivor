import * as THREE from 'three';
import { ENEMY_BALANCE } from '../../data/balance';
import type { EnemyKind } from '../../types';
import type { SpatialEntity } from '../../game/systems/SpatialGrid';
import { LOGICAL_SCALE, WORLD_HEIGHT, WORLD_WIDTH, setLogicalPosition } from '../core/coordinates';
import { SharedResources, addMesh } from '../core/SharedResources';
import { addEliteAccent, createEnemyModel } from '../visuals/CharacterFactory';
import { createSpecialistEnemyModel, isSpecialistEnemy } from '../visuals/SpecialistEnemyVisuals';
import { resolveObstacleCollision, steerAroundObstacles } from '../scene/WorldObstacles';
import { audioService } from '../../services/audioService';

let enemySequence = 0;

function lerpAngle(current: number, target: number, t: number): number {
  let diff = (target - current) % (Math.PI * 2);
  if (diff > Math.PI) diff -= Math.PI * 2;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return current + diff * t;
}

export type EnemyCombatState = 'approach' | 'windup' | 'attack' | 'recover';
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

type AttackStyle = 'melee' | 'ranged' | 'dash' | 'leap' | 'explode' | 'slam';
type EnemyProfile = {
  style: AttackStyle;
  engage: number;
  preferred?: number;
  windup: number;
  attack: number;
  recover: number;
  cooldown: number;
  reach: number;
  radius: number;
  damage: number;
  color: number;
  highThreat?: boolean;
  slow?: boolean;
};

const PROFILES: Record<EnemyKind, EnemyProfile> = {
  skeleton: { style: 'melee', engage: 56, windup: .40, attack: .18, recover: .52, cooldown: 1.75, reach: 44, radius: 47, damage: 1.0, color: 0xdfe7ef },
  zombie: { style: 'melee', engage: 66, windup: .62, attack: .24, recover: .72, cooldown: 2.15, reach: 48, radius: 62, damage: 1.28, color: 0x9fb48c },
  'bone-mage': { style: 'ranged', engage: 280, preferred: 220, windup: .72, attack: .12, recover: .55, cooldown: 2.55, reach: 300, radius: 14, damage: 1.0, color: 0xc084fc, highThreat: true },
  bat: { style: 'dash', engage: 145, windup: .42, attack: .28, recover: .42, cooldown: 2.05, reach: 0, radius: 36, damage: 1.1, color: 0xa855f7, highThreat: true },
  slime: { style: 'leap', engage: 165, windup: .52, attack: .38, recover: .58, cooldown: 2.35, reach: 0, radius: 52, damage: 1.18, color: 0x22c55e, highThreat: true, slow: true },
  ghost: { style: 'dash', engage: 180, windup: .42, attack: .28, recover: .46, cooldown: 2.20, reach: 0, radius: 40, damage: 1.0, color: 0x7dd3fc, highThreat: true },
  archer: { style: 'ranged', engage: 300, preferred: 205, windup: .62, attack: .12, recover: .48, cooldown: 2.35, reach: 300, radius: 13, damage: .96, color: 0x93c5fd, highThreat: true },
  knight: { style: 'melee', engage: 62, windup: .50, attack: .22, recover: .74, cooldown: 2.25, reach: 52, radius: 60, damage: 1.34, color: 0x60a5fa },
  demon: { style: 'melee', engage: 64, windup: .32, attack: .20, recover: .48, cooldown: 1.65, reach: 50, radius: 54, damage: 1.16, color: 0xef4444 },
  'demon-warrior': { style: 'melee', engage: 78, windup: .70, attack: .26, recover: .90, cooldown: 2.55, reach: 62, radius: 76, damage: 1.48, color: 0xff5b4f, highThreat: true },
  imp: { style: 'explode', engage: 76, windup: .88, attack: .08, recover: .05, cooldown: 99, reach: 0, radius: 80, damage: 1.46, color: 0xf97316, highThreat: true },
  'cursed-wolf': { style: 'dash', engage: 150, windup: .36, attack: .25, recover: .38, cooldown: 1.85, reach: 0, radius: 34, damage: 1.16, color: 0xd97706, highThreat: true },
  thornling: { style: 'ranged', engage: 250, preferred: 178, windup: .54, attack: .12, recover: .42, cooldown: 2.20, reach: 260, radius: 12, damage: .94, color: 0x84cc16, highThreat: true },
  'forest-mage': { style: 'ranged', engage: 290, preferred: 218, windup: .78, attack: .12, recover: .60, cooldown: 2.70, reach: 300, radius: 18, damage: 1.08, color: 0xb875df, highThreat: true },
  'forest-guardian': { style: 'melee', engage: 74, windup: .62, attack: .25, recover: .82, cooldown: 2.45, reach: 58, radius: 70, damage: 1.34, color: 0x78a95b, highThreat: true },
  treant: { style: 'slam', engage: 78, windup: .72, attack: .25, recover: .92, cooldown: 3.05, reach: 22, radius: 76, damage: 1.46, color: 0x4d7c0f, highThreat: true },
  'frost-wraith': { style: 'dash', engage: 170, windup: .42, attack: .27, recover: .42, cooldown: 2.08, reach: 0, radius: 38, damage: 1.14, color: 0x38bdf8, highThreat: true, slow: true },
  'ice-mage': { style: 'ranged', engage: 300, preferred: 225, windup: .70, attack: .12, recover: .58, cooldown: 2.50, reach: 310, radius: 15, damage: 1.06, color: 0x67e8f9, highThreat: true },
};

function telegraphAccent(kind: EnemyKind): number { return PROFILES[kind].color; }
function isRanged(kind: EnemyKind): boolean { return PROFILES[kind].style === 'ranged'; }
function isFlying(kind: EnemyKind): boolean { return kind === 'bat' || kind === 'ghost' || kind === 'frost-wraith'; }
function easeOutBack(t: number): number { const c1 = 1.70158; const c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }

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
  x: number;
  y: number;
  state: EnemyCombatState = 'approach';

  private readonly model: THREE.Group;
  private readonly healthFill: THREE.Mesh;
  private readonly healthBar: THREE.Group;
  private readonly telegraphGroup: THREE.Group;
  private readonly telegraphMesh: THREE.Mesh;
  private readonly telegraphRing: THREE.Mesh;
  private readonly frostMesh: THREE.Mesh;
  private readonly shadowMesh: THREE.Mesh;
  private readonly eliteAura?: THREE.Mesh;
  private readonly profile: EnemyProfile;
  private readonly baseVisualScale: number;
  private readonly baseModelScale = 0.88;
  private hp: number;
  private slowMultiplier = 1;
  private slowUntil = 0;
  private freezeUntil = 0;
  private phaseTime: number;
  private spawnAge = 0;
  private readonly spawnDuration: number;
  private hitPulse = 0;
  private healthBarLife = 0;
  private stateTimer = 0;
  private attackCooldown = 0.35 + (enemySequence % 7) * .12;
  private attackTargetX = 0;
  private attackTargetY = 0;
  private attackDirectionX = 0;
  private attackDirectionY = 1;
  private facingAngle = 0;
  private emittedAttack = false;
  private leapStartX = 0;
  private leapStartY = 0;
  private orbitSign = enemySequence % 2 === 0 ? 1 : -1;

  constructor(parent: THREE.Object3D, kind: EnemyKind, x: number, y: number, resources: SharedResources, elite = false, hpMultiplier = 1, damageMultiplier = hpMultiplier, worldId = 1) {
    const balance = ENEMY_BALANCE[kind];
    this.id = `enemy-${enemySequence += 1}`;
    this.kind = kind;
    this.elite = elite;
    this.worldId = worldId;
    this.profile = PROFILES[kind];
    this.radius = balance.radius * (elite ? 1.25 : 1);
    this.maxHP = balance.hp * hpMultiplier * (elite ? 2.15 : 1);
    this.hp = this.maxHP;
    this.baseSpeed = balance.speed * (elite ? 1.07 : 1);
    this.contactDamage = balance.damage * damageMultiplier * (elite ? 1.18 : 1);
    this.xpValue = balance.xp * (elite ? 4 : 1);
    this.spawnDuration = elite ? .42 : .28;
    this.phaseTime = (enemySequence * 1.618) % 6;
    this.x = x;
    this.y = y;

    this.group = new THREE.Group();
    this.group.name = this.id;
    this.model = isSpecialistEnemy(kind) ? createSpecialistEnemyModel(kind, resources) : createEnemyModel(kind, balance.color, resources, worldId);
    const visualScale = (this.radius * LOGICAL_SCALE) / .38;
    this.baseVisualScale = visualScale;
    this.model.scale.setScalar(visualScale * this.baseModelScale * .58);
    this.model.position.y = .16;
    this.group.add(this.model);
    if (elite) addEliteAccent(this.model, resources);

    this.shadowMesh = resources.createContactShadow('enemy-contact-shadow', 1, 1, .62);
    this.shadowMesh.scale.set(visualScale * 1.18, visualScale * .72, 1);
    this.group.add(this.shadowMesh);

    if (elite) {
      const aura = addMesh(this.group, resources.ring('elite-threat-aura', .50, .58), resources.basicMaterial('elite-threat-aura-mat', 0xffd166, { transparent: true, opacity: .45, depthWrite: false, side: THREE.DoubleSide }));
      aura.rotation.x = -Math.PI / 2; aura.position.y = .018; aura.scale.setScalar(visualScale * 1.5); this.eliteAura = aura;
    }

    this.telegraphGroup = new THREE.Group();
    this.telegraphGroup.position.set(0, .03, 0); this.telegraphGroup.visible = false;
    this.telegraphMesh = addMesh(this.telegraphGroup, resources.circle(`enemy-telegraph-${kind}`), resources.basicMaterial(`enemy-telegraph-fill-${kind}`, this.profile.color, { transparent: true, opacity: .25, depthWrite: false }));
    this.telegraphMesh.rotation.x = -Math.PI / 2;
    this.telegraphRing = addMesh(this.telegraphGroup, resources.ring(`enemy-telegraph-ring-${kind}`, .42, .50), resources.basicMaterial(`enemy-telegraph-ring-mat-${kind}`, telegraphAccent(kind), { transparent: true, opacity: .88, depthWrite: false, side: THREE.DoubleSide }));
    this.telegraphRing.rotation.x = -Math.PI / 2;
    this.group.add(this.telegraphGroup);

    this.frostMesh = addMesh(this.group, resources.octa('enemy-frost-crystal'), resources.standardMaterial('enemy-frost-mat', 0xa8f0ff, { transparent: true, opacity: .68, roughness: .15, metalness: .25, emissive: 0x3ac8ff, emissiveIntensity: .85 }));
    this.frostMesh.scale.set(visualScale * 1.15, visualScale * 1.35, visualScale * 1.15); this.frostMesh.position.set(0, .72 * visualScale, 0); this.frostMesh.visible = false;

    this.healthBar = createHealthBar(resources, elite);
    this.healthBar.position.set(0, 1.72 * visualScale, .42 * visualScale);
    this.healthFill = this.healthBar.children[1] as THREE.Mesh;
    this.group.add(this.healthBar);
    parent.add(this.group);
    this.syncPosition();
    this.updateHealthBar();
  }

  get currentHP(): number { return this.hp; }
  getFacingAngle(): number { return this.facingAngle; }

  checkFrontShield(sourceX: number, sourceY: number): boolean {
    if (this.kind !== 'knight' && this.kind !== 'forest-guardian') return false;
    const dx = sourceX - this.x; const dy = sourceY - this.y; const dist = Math.hypot(dx, dy);
    if (dist < 1) return true;
    const fx = Math.sin(this.facingAngle); const fy = Math.cos(this.facingAngle);
    return (dx / dist) * fx + (dy / dist) * fy > .38;
  }

  update(playerX: number, playerY: number, delta: number, now: number, canInitiateHighThreat: () => boolean = () => true): EnemyAttackEvent | undefined {
    this.phaseTime += delta;
    this.spawnAge = Math.min(this.spawnDuration, this.spawnAge + delta);
    this.attackCooldown = Math.max(0, this.attackCooldown - delta);
    this.hitPulse = Math.max(0, this.hitPulse - delta);
    this.healthBarLife = Math.max(0, this.healthBarLife - delta);
    this.updateHealthBar();

    if (this.eliteAura) { this.eliteAura.rotation.z += delta * .7; this.eliteAura.scale.setScalar(this.baseVisualScale * 1.5 * (1 + Math.sin(this.phaseTime * 2.8) * .06)); }
    if (now < this.freezeUntil) { this.frostMesh.visible = true; this.frostMesh.rotation.y += delta * 1.8; this.syncPosition(); return undefined; }
    this.frostMesh.visible = false;

    const dx = playerX - this.x; const dy = playerY - this.y; const distance = Math.max(1, Math.hypot(dx, dy));
    let event: EnemyAttackEvent | undefined;

    if (distance > 410 && this.state === 'approach') {
      this.moveToward(playerX, playerY, delta, now, 1.12);
      this.animate(delta, false);
      return undefined;
    }

    if (this.state === 'approach') {
      this.telegraphGroup.visible = false;
      this.moveTactically(playerX, playerY, distance, delta, now);
      const allowed = !this.profile.highThreat || canInitiateHighThreat();
      if (allowed && this.attackCooldown <= 0 && distance <= this.profile.engage) this.enterWindup(playerX, playerY);
    } else if (this.state === 'windup') {
      this.stateTimer -= delta;
      this.showTelegraph();
      if (this.kind === 'imp') this.moveToward(playerX, playerY, delta, now, .22);
      if (this.stateTimer <= 0) {
        if (this.profile.style === 'leap') { this.leapStartX = this.x; this.leapStartY = this.y; }
        this.state = 'attack'; this.stateTimer = this.profile.attack; this.emittedAttack = false;
      }
    } else if (this.state === 'attack') {
      this.stateTimer -= delta;
      this.telegraphGroup.visible = false;
      event = this.executeAttack(playerX, playerY, distance, delta);
      if (this.stateTimer <= 0) { this.state = 'recover'; this.stateTimer = this.profile.recover; }
    } else {
      this.stateTimer -= delta;
      this.telegraphGroup.visible = false;
      if (isRanged(this.kind)) this.strafe(playerX, playerY, distance, delta, now, .35);
      if (this.stateTimer <= 0) { this.state = 'approach'; this.attackCooldown = this.profile.cooldown * (this.elite ? .86 : 1); this.orbitSign *= -1; }
    }

    this.resolveCollision();
    this.syncPosition();
    this.animate(delta, this.state === 'windup');
    return event;
  }

  private moveTactically(playerX: number, playerY: number, distance: number, delta: number, now: number): void {
    const preferred = this.profile.preferred;
    if (preferred) {
      if (distance < preferred * .74) this.moveAway(playerX, playerY, delta, now, 1.02);
      else if (distance > preferred * 1.14) this.moveToward(playerX, playerY, delta, now, .92);
      else this.strafe(playerX, playerY, distance, delta, now, .82);
      return;
    }

    if (this.kind === 'cursed-wolf' || this.kind === 'ghost' || this.kind === 'frost-wraith' || this.kind === 'bat') {
      if (distance > 105) this.strafe(playerX, playerY, distance, delta, now, .82, true);
      else this.moveAway(playerX, playerY, delta, now, .38);
      return;
    }

    const flank = this.kind === 'demon' || this.kind === 'skeleton' ? .28 : this.kind === 'zombie' || this.kind === 'treant' ? .06 : .15;
    this.moveToward(playerX, playerY, delta, now, 1, flank);
  }

  private moveToward(playerX: number, playerY: number, delta: number, now: number, factor = 1, flank = 0): void {
    const dx = playerX - this.x; const dy = playerY - this.y; const dist = Math.max(1, Math.hypot(dx, dy));
    let dirX = dx / dist; let dirY = dy / dist;
    if (flank !== 0 && dist > 90) { const sx = -dirY * this.orbitSign; const sy = dirX * this.orbitSign; dirX += sx * flank; dirY += sy * flank; const l = Math.hypot(dirX, dirY); dirX /= l; dirY /= l; }
    const steer = steerAroundObstacles(this.x, this.y, dirX, dirY, this.worldId); dirX = steer.dirX; dirY = steer.dirY;
    const speed = this.baseSpeed * (now < this.slowUntil ? this.slowMultiplier : 1) * factor;
    this.x += dirX * speed * delta; this.y += dirY * speed * delta; this.face(dirX, dirY, delta);
  }

  private moveAway(playerX: number, playerY: number, delta: number, now: number, factor: number): void {
    const dx = this.x - playerX; const dy = this.y - playerY; const dist = Math.max(1, Math.hypot(dx, dy));
    let dirX = dx / dist; let dirY = dy / dist;
    const steer = steerAroundObstacles(this.x, this.y, dirX, dirY, this.worldId); dirX = steer.dirX; dirY = steer.dirY;
    const speed = this.baseSpeed * (now < this.slowUntil ? this.slowMultiplier : 1) * factor;
    this.x += dirX * speed * delta; this.y += dirY * speed * delta; this.face(-dirX, -dirY, delta);
  }

  private strafe(playerX: number, playerY: number, distance: number, delta: number, now: number, factor: number, closeIn = false): void {
    const dx = playerX - this.x; const dy = playerY - this.y; const dist = Math.max(1, distance);
    const towardX = dx / dist; const towardY = dy / dist;
    let dirX = -towardY * this.orbitSign; let dirY = towardX * this.orbitSign;
    if (closeIn) { dirX += towardX * .32; dirY += towardY * .32; }
    const len = Math.hypot(dirX, dirY); dirX /= len; dirY /= len;
    const steer = steerAroundObstacles(this.x, this.y, dirX, dirY, this.worldId); dirX = steer.dirX; dirY = steer.dirY;
    const speed = this.baseSpeed * (now < this.slowUntil ? this.slowMultiplier : 1) * factor;
    this.x += dirX * speed * delta; this.y += dirY * speed * delta; this.face(towardX, towardY, delta);
  }

  private face(dirX: number, dirY: number, delta: number): void {
    this.facingAngle = Math.atan2(dirX, dirY);
    this.model.rotation.y = lerpAngle(this.model.rotation.y, this.facingAngle, Math.min(1, delta * 12));
  }

  private enterWindup(playerX: number, playerY: number): void {
    this.state = 'windup'; this.stateTimer = this.profile.windup; this.emittedAttack = false;
    let targetX = playerX; let targetY = playerY;
    // Specialist casters aim slightly toward the interior when the player hugs a wall.
    // This turns perimeter circling into a choice instead of the dominant safe strategy.
    if (this.kind === 'bone-mage' || this.kind === 'forest-mage' || this.kind === 'ice-mage') {
      if (playerX < 190) targetX += 72; else if (playerX > WORLD_WIDTH - 190) targetX -= 72;
      if (playerY < 190) targetY += 72; else if (playerY > WORLD_HEIGHT - 190) targetY -= 72;
    }
    this.attackTargetX = targetX; this.attackTargetY = targetY;
    const dx = targetX - this.x; const dy = targetY - this.y; const dist = Math.max(1, Math.hypot(dx, dy));
    this.attackDirectionX = dx / dist; this.attackDirectionY = dy / dist;
    this.facingAngle = Math.atan2(this.attackDirectionX, this.attackDirectionY);
    if (this.kind === 'bat') audioService.playSFX('bat-dive', { throttle: .35 });
    else if (this.kind === 'slime') audioService.playSFX('slime-jump', { throttle: .35 });
    else if (this.kind === 'archer' || isRanged(this.kind)) audioService.playSFX('archer-charge', { throttle: .28 });
    else if (this.kind === 'imp') audioService.playSFX('imp-fuse', { throttle: .25 });
  }

  private executeAttack(playerX: number, playerY: number, distance: number, delta: number): EnemyAttackEvent | undefined {
    const p = this.profile;
    if (p.style === 'ranged' && !this.emittedAttack) {
      this.emittedAttack = true;
      return this.event('projectile', this.x, this.y, this.x + this.attackDirectionX * p.reach, this.y + this.attackDirectionY * p.reach, p.radius, p.damage, p.color, p.slow);
    }
    if ((p.style === 'melee' || p.style === 'slam') && !this.emittedAttack) {
      this.emittedAttack = true;
      if (this.kind === 'skeleton' || this.kind === 'knight') audioService.playSFX('skeleton-slash', { throttle: .2 });
      else if (this.kind === 'demon' || this.kind === 'demon-warrior') audioService.playSFX('demon-slash', { throttle: .2 });
      return this.event('melee', this.x, this.y, this.x + this.attackDirectionX * p.reach, this.y + this.attackDirectionY * p.reach, p.radius * (this.elite ? 1.18 : 1), p.damage, p.color, p.slow);
    }
    if (p.style === 'explode' && !this.emittedAttack) {
      this.emittedAttack = true; audioService.playSFX('imp-explode');
      return this.event('explosion', this.x, this.y, this.x, this.y, p.radius * (this.elite ? 1.18 : 1), p.damage, p.color);
    }
    if (p.style === 'leap') {
      const progress = 1 - Math.max(0, this.stateTimer / Math.max(.001, p.attack));
      this.x = THREE.MathUtils.lerp(this.leapStartX, this.attackTargetX, progress);
      this.y = THREE.MathUtils.lerp(this.leapStartY, this.attackTargetY, progress);
      this.model.position.y = Math.sin(progress * Math.PI) * 1.8;
      if (this.stateTimer <= .015 && !this.emittedAttack) { this.emittedAttack = true; return this.event('leap', this.x, this.y, this.x, this.y, p.radius, p.damage, p.color, p.slow); }
      return undefined;
    }
    if (p.style === 'dash') {
      const dashSpeed = this.kind === 'cursed-wolf' ? 2.9 : this.kind === 'bat' ? 2.8 : 2.55;
      this.x += this.attackDirectionX * this.baseSpeed * dashSpeed * delta;
      this.y += this.attackDirectionY * this.baseSpeed * dashSpeed * delta;
      if (!this.emittedAttack && distance < this.radius + 25) {
        this.emittedAttack = true;
        return this.event(this.kind === 'bat' ? 'dive' : 'melee', this.x, this.y, playerX, playerY, p.radius, p.damage, p.color, p.slow);
      }
    }
    return undefined;
  }

  private event(type: EnemyAttackEvent['type'], originX: number, originY: number, targetX: number, targetY: number, radius: number, multiplier: number, color: number, slow = false): EnemyAttackEvent {
    return { type, enemyId: this.id, kind: this.kind, damage: this.contactDamage * multiplier, originX, originY, targetX, targetY, radius, color, slow };
  }

  private showTelegraph(): void {
    this.telegraphGroup.visible = true; this.telegraphGroup.rotation.y = this.facingAngle;
    const pulse = 1 + Math.sin(this.phaseTime * 18) * .045; this.telegraphGroup.scale.setScalar(pulse);
    const style = this.profile.style;
    if (style === 'ranged') {
      this.telegraphMesh.scale.set(.13, 3.2, .13); this.telegraphRing.scale.set(.19, 3.35, .19);
      this.telegraphMesh.position.set(0, 0, 2.0); this.telegraphRing.position.set(0, 0, 2.0);
    } else if (style === 'dash') {
      this.telegraphMesh.scale.set(.42, 2.6, .42); this.telegraphRing.scale.set(.52, 2.75, .52);
      this.telegraphMesh.position.set(0, 0, 1.62); this.telegraphRing.position.set(0, 0, 1.62);
    } else if (style === 'leap' || style === 'slam' || style === 'explode') {
      const scale = style === 'explode' ? 1.75 : style === 'slam' ? 2.15 : 1.30;
      this.telegraphMesh.scale.setScalar(scale); this.telegraphRing.scale.setScalar(scale + .16);
      this.telegraphMesh.position.set(0, 0, .15); this.telegraphRing.position.set(0, 0, .15);
    } else {
      const wide = this.kind === 'demon-warrior' || this.kind === 'forest-guardian' || this.kind === 'zombie';
      this.telegraphMesh.scale.set(wide ? .90 : .66, wide ? 1.20 : .96, wide ? .90 : .66);
      this.telegraphRing.scale.set(wide ? 1.0 : .76, wide ? 1.32 : 1.06, wide ? 1.0 : .76);
      this.telegraphMesh.position.set(0, 0, .72); this.telegraphRing.position.set(0, 0, .72);
    }
  }

  private resolveCollision(): void {
    const resolved = resolveObstacleCollision(this.x, this.y, this.radius * .75, this.worldId);
    this.x = THREE.MathUtils.clamp(resolved.x, 42, WORLD_WIDTH - 42);
    this.y = THREE.MathUtils.clamp(resolved.y, 54, WORLD_HEIGHT - 54);
  }

  private animate(delta: number, winding: boolean): void {
    const parts = this.model.userData.parts as Record<string, THREE.Object3D | THREE.Object3D[]> | undefined;
    const flying = isFlying(this.kind);
    if (flying) { this.model.position.y = .45 + Math.sin(this.phaseTime * 3.4) * .12; this.shadowMesh.scale.set(this.baseVisualScale * .9, this.baseVisualScale * .55, 1); }
    else if (this.kind !== 'slime') { this.model.position.y = Math.abs(Math.sin(this.phaseTime * (this.kind === 'imp' ? 8.5 : 5.5))) * .035; this.shadowMesh.scale.set(this.baseVisualScale * 1.1, this.baseVisualScale * .68, 1); }
    this.shadowMesh.position.y = .006;

    const spawn = THREE.MathUtils.clamp(easeOutBack(Math.min(1, this.spawnAge / this.spawnDuration)), .58, 1.06);
    const hit = this.hitPulse > 0 ? 1 + Math.sin((1 - this.hitPulse / .16) * Math.PI) * .13 : 1;
    const wind = winding ? 1 + Math.sin(this.phaseTime * 14) * .05 : 1;
    this.model.scale.setScalar(this.baseVisualScale * this.baseModelScale * spawn * hit * wind * (this.elite ? 1.035 : 1));

    const moving = this.state === 'approach';
    if (parts?.legs instanceof Array && parts.legs.length >= 2) {
      const cadence = this.kind === 'zombie' ? 4.6 : this.kind === 'demon-warrior' || this.kind === 'forest-guardian' ? 5.2 : 7.5;
      const stride = moving ? Math.sin(this.phaseTime * cadence) * (this.kind === 'zombie' ? .42 : .60) : 0;
      for (let i = 0; i < parts.legs.length; i += 1) parts.legs[i].rotation.x = THREE.MathUtils.lerp(parts.legs[i].rotation.x, i % 2 === 0 ? stride : -stride, Math.min(1, delta * 14));
    }
    if (parts?.arms instanceof Array && parts.arms.length >= 2) {
      const attack = this.state === 'attack' ? .95 : winding ? -.85 : 0;
      parts.arms[0].rotation.x = THREE.MathUtils.lerp(parts.arms[0].rotation.x, attack, Math.min(1, delta * 12));
      parts.arms[1].rotation.x = THREE.MathUtils.lerp(parts.arms[1].rotation.x, attack, Math.min(1, delta * 12));
    }
    const weapon = (parts?.weapon ?? parts?.sword) as THREE.Object3D | undefined;
    if (weapon) {
      const targetZ = winding ? -1.05 : this.state === 'attack' ? .58 : -.35;
      weapon.rotation.z = THREE.MathUtils.lerp(weapon.rotation.z, targetZ, Math.min(1, delta * 14));
    }
    if (this.kind === 'bat' && parts?.wings instanceof Array && parts.wings.length === 2) {
      const flap = this.state === 'attack' ? 25 : winding ? 18 : 10;
      parts.wings[0].rotation.z = -.22 - Math.sin(this.phaseTime * flap) * .52;
      parts.wings[1].rotation.z = .22 + Math.sin(this.phaseTime * flap) * .52;
    }
    if (this.kind === 'slime' && parts?.body instanceof THREE.Object3D) {
      if (winding) parts.body.scale.set(1.18, .34, 1.06);
      else if (this.state === 'approach') { const b = Math.sin(this.phaseTime * 5.2) * .08; parts.body.scale.set(.82 + b, .62 - b, .72 + b); }
    }
    const core = parts?.core as THREE.Object3D | undefined;
    if (core) { core.rotation.y += delta * (winding ? 6 : 2.2); const s = 1 + (winding ? Math.sin(this.phaseTime * 16) * .18 : 0); core.scale.multiplyScalar(THREE.MathUtils.clamp(s, .82, 1.18)); }
  }

  applySlow(multiplier: number, duration: number, now: number): void { this.slowMultiplier = Math.min(this.slowMultiplier, multiplier); this.slowUntil = Math.max(this.slowUntil, now + duration); }
  applyFreeze(duration: number, now: number, postSlowDuration = 2.2): void { const effective = this.elite ? duration * .5 : duration; this.freezeUntil = Math.max(this.freezeUntil, now + effective); this.applySlow(.55, effective + postSlowDuration, now); }
  damage(amount: number): boolean { this.hp = Math.max(0, this.hp - amount); this.hitPulse = .16; this.healthBarLife = 2.4; this.updateHealthBar(); return this.hp <= 0; }
  private updateHealthBar(): void { const pct = Math.max(0, Math.min(1, this.hp / this.maxHP)); this.healthFill.scale.x = pct; this.healthFill.position.x = (-.5 * (1 - pct)) * .6; this.healthBar.visible = this.healthBarLife > 0 && this.hp < this.maxHP; }
  private syncPosition(): void { setLogicalPosition(this.group, this.x, this.y); }
  destroy(): void { this.group.removeFromParent(); }
}

function createHealthBar(resources: SharedResources, elite: boolean): THREE.Group {
  const bar = new THREE.Group(); const width = elite ? .8 : .6;
  const bg = addMesh(bar, resources.box('hp-bg-box'), resources.basicMaterial('hp-bg-mat', 0x07111c)); bg.scale.set(width, .07, .02);
  const fill = addMesh(bar, resources.box('hp-fill-box'), resources.basicMaterial(elite ? 'hp-elite-fill-mat' : 'hp-fill-mat', elite ? 0xffbb33 : 0xef4444)); fill.scale.set(width, .05, .03);
  return bar;
}
