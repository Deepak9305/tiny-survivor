import * as THREE from 'three';
import type { SpatialEntity } from '../../game/systems/SpatialGrid';
import { LOGICAL_SCALE, WORLD_HEIGHT, WORLD_WIDTH, setLogicalPosition } from '../core/coordinates';
import { SharedResources, addMesh } from '../core/SharedResources';
import { steerAroundObstacles } from '../scene/WorldObstacles';

let goblinSequence = 0;

export class TreasureGoblin3D implements SpatialEntity {
  readonly id: string;
  readonly radius = 26;
  readonly maxHP: number;
  readonly group: THREE.Group;
  x: number;
  y: number;
  isDead = false;
  hasEscaped = false;

  private hp: number;
  private readonly speed = 175;
  private readonly worldId: number;
  private readonly model: THREE.Group;
  private readonly healthFill: THREE.Mesh;
  private readonly healthBar: THREE.Group;
  private readonly diamondBeacon: THREE.Mesh;
  private readonly shadowMesh: THREE.Mesh;
  private readonly flashMesh: THREE.Mesh;

  private escapeTimer = 24.0;
  private readonly maxEscapeTimer = 24.0;
  private isPortaling = false;
  private portalChannelTimer = 0;
  private hitFlashTimer = 0;
  private facingAngle = 0;
  private runAnimTime = 0;
  private coinDropTimer = 0.35;

  constructor(
    parent: THREE.Object3D,
    x: number,
    y: number,
    resources: SharedResources,
    worldId = 1,
    hpMultiplier = 1
  ) {
    this.id = `goblin-${goblinSequence += 1}`;
    this.worldId = worldId;
    this.x = x;
    this.y = y;
    this.maxHP = 160 * hpMultiplier;
    this.hp = this.maxHP;

    this.group = new THREE.Group();
    this.group.name = this.id;

    // Contact shadow
    this.shadowMesh = resources.createContactShadow('goblin-shadow', 0.9, 0.9, 0.55);
    this.shadowMesh.scale.set(0.65, 0.45, 1);
    this.group.add(this.shadowMesh);

    // Build Goblin Model (Golden imp with huge loot sack & golden crown)
    this.model = new THREE.Group();

    // Body: rich gold-amber imp body
    const bodyMat = resources.standardMaterial('goblin-body-mat', 0xd97706, {
      roughness: 0.3,
      metalness: 0.3,
      emissive: 0xb45309,
      emissiveIntensity: 0.4,
    });
    const body = addMesh(this.model, resources.box('goblin-body-geom'), bodyMat);
    body.scale.set(0.38, 0.48, 0.34);
    body.position.y = 0.36;

    // Head
    const headMat = resources.standardMaterial('goblin-head-mat', 0xf59e0b, { roughness: 0.25 });
    const head = addMesh(this.model, resources.box('goblin-head-geom'), headMat);
    head.scale.set(0.36, 0.36, 0.36);
    head.position.set(0, 0.68, 0.08);

    // Golden Crown
    const crownMat = resources.standardMaterial('goblin-crown-mat', 0xffd700, {
      metalness: 0.85,
      roughness: 0.15,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.9,
    });
    const crown = addMesh(head, resources.cylinder('goblin-crown-geom'), crownMat);
    crown.scale.set(0.24, 0.16, 0.24);
    crown.position.y = 0.26;

    // Ears
    const earL = addMesh(head, resources.box('goblin-ear-l'), headMat);
    earL.scale.set(0.22, 0.08, 0.06);
    earL.position.set(-0.25, 0.05, -0.04);
    earL.rotation.z = 0.4;
    const earR = addMesh(head, resources.box('goblin-ear-r'), headMat);
    earR.scale.set(0.22, 0.08, 0.06);
    earR.position.set(0.25, 0.05, -0.04);
    earR.rotation.z = -0.4;

    // Huge Loot Sack slung over back (bulging with cyan/gold gems)
    const sackMat = resources.standardMaterial('goblin-sack-mat', 0x92400e, { roughness: 0.7 });
    const sack = addMesh(this.model, resources.sphere('goblin-sack-geom'), sackMat);
    sack.position.set(0, 0.48, -0.28);
    sack.scale.set(0.68, 0.85, 0.75);

    // Glowing gems spilling out top of sack
    const gemSpillMat = resources.basicMaterial('goblin-spill-mat', 0x38bdf8, { transparent: true, opacity: 0.95 });
    const gemSpill = addMesh(sack, resources.octa('goblin-spill-geom'), gemSpillMat);
    gemSpill.scale.setScalar(0.18);
    gemSpill.position.set(0, 0.34, 0);

    // Little running feet
    const footMat = resources.basicMaterial('goblin-foot-mat', 0x78350f);
    const footL = addMesh(this.model, resources.box('goblin-foot-l'), footMat);
    footL.scale.set(0.12, 0.14, 0.22);
    footL.position.set(-0.14, 0.08, 0);
    const footR = addMesh(this.model, resources.box('goblin-foot-r'), footMat);
    footR.scale.set(0.12, 0.14, 0.22);
    footR.position.set(0.14, 0.08, 0);

    this.group.add(this.model);
    this.model.traverse((child) => {
      if (child instanceof THREE.Mesh) child.castShadow = true;
    });

    // Floating Diamond Beacon above head so player can always spot the goblin
    const beaconMat = resources.basicMaterial('goblin-beacon-mat', 0x38bdf8, { transparent: true, opacity: 0.92 });
    this.diamondBeacon = addMesh(this.group, resources.octa('goblin-beacon-geom'), beaconMat);
    this.diamondBeacon.scale.set(0.18, 0.28, 0.18);
    this.diamondBeacon.position.set(0, 1.55, 0);

    // Health Bar
    this.healthBar = new THREE.Group();
    this.healthBar.position.set(0, 1.25, 0);
    const bgMat = resources.basicMaterial('goblin-hp-bg', 0x0f172a);
    const hpBg = addMesh(this.healthBar, resources.plane('goblin-hp-bg-p', 0.72, 0.09), bgMat);
    hpBg.position.y = 0.01;

    const fillMat = resources.basicMaterial('goblin-hp-fill', 0xfacc15);
    this.healthFill = addMesh(this.healthBar, resources.plane('goblin-hp-fill-p', 0.70, 0.07), fillMat);
    this.healthFill.position.set(0, 0.012, 0.001);
    this.group.add(this.healthBar);

    // Hit Flash Mesh
    this.flashMesh = addMesh(this.group, resources.box('goblin-flash-geom'), resources.basicMaterial('goblin-flash-mat', 0xffffff, { transparent: true, opacity: 0.9 }));
    this.flashMesh.scale.set(0.55, 0.85, 0.55);
    this.flashMesh.position.y = 0.45;
    this.flashMesh.visible = false;

    parent.add(this.group);
    this.syncPosition();
  }

  update(
    delta: number,
    now: number,
    playerX: number,
    playerY: number,
    onDropCoinSpark?: (x: number, y: number) => void
  ): boolean {
    if (this.isDead || this.hasEscaped) return false;

    // Flash timer
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= delta;
      this.flashMesh.visible = this.hitFlashTimer > 0;
    }

    // Escape countdown
    this.escapeTimer -= delta;
    if (this.escapeTimer <= 2.2 && !this.isPortaling) {
      this.isPortaling = true;
      this.portalChannelTimer = 2.2;
    }

    if (this.isPortaling) {
      this.portalChannelTimer -= delta;
      // Shrink into portal
      const portalScale = Math.max(0.01, this.portalChannelTimer / 2.2);
      this.group.scale.setScalar(portalScale);
      this.group.rotation.y += delta * 12.0;
      if (this.portalChannelTimer <= 0) {
        this.hasEscaped = true;
        return true;
      }
      return false;
    }

    // AI: Flee rapidly from player with zig-zag evasive maneuvers
    const dx = this.x - playerX;
    const dy = this.y - playerY;
    const distToPlayer = Math.max(1, Math.hypot(dx, dy));

    let fleeDirX = dx / distToPlayer;
    let fleeDirY = dy / distToPlayer;

    // Add high-frequency zig-zag evasiveness
    const sway = Math.sin(now * 7.5 + (this.x * 0.05)) * 0.48;
    const perpX = -fleeDirY;
    const perpY = fleeDirX;
    fleeDirX += perpX * sway;
    fleeDirY += perpY * sway;
    const norm = Math.hypot(fleeDirX, fleeDirY);
    fleeDirX /= norm;
    fleeDirY /= norm;

    // Steer around arena boundaries & obstacles
    const steer = steerAroundObstacles(this.x, this.y, fleeDirX, fleeDirY, this.worldId);
    fleeDirX = steer.dirX;
    fleeDirY = steer.dirY;

    // Avoid getting stuck on outer arena walls:
    const edgeMargin = 120;
    if (this.x < edgeMargin) fleeDirX = Math.abs(fleeDirX) + 0.6;
    if (this.x > WORLD_WIDTH - edgeMargin) fleeDirX = -Math.abs(fleeDirX) - 0.6;
    if (this.y < edgeMargin) fleeDirY = Math.abs(fleeDirY) + 0.6;
    if (this.y > WORLD_HEIGHT - edgeMargin) fleeDirY = -Math.abs(fleeDirY) - 0.6;
    const l = Math.hypot(fleeDirX, fleeDirY);
    fleeDirX /= l;
    fleeDirY /= l;

    // Move
    this.x += fleeDirX * this.speed * delta;
    this.y += fleeDirY * this.speed * delta;
    this.x = THREE.MathUtils.clamp(this.x, 60, WORLD_WIDTH - 60);
    this.y = THREE.MathUtils.clamp(this.y, 60, WORLD_HEIGHT - 60);

    // Facing
    const targetAngle = Math.atan2(fleeDirX, fleeDirY);
    this.facingAngle = targetAngle;
    this.model.rotation.y = targetAngle;

    // Running bounce animation
    this.runAnimTime += delta * 18;
    this.model.position.y = 0.08 + Math.abs(Math.sin(this.runAnimTime)) * 0.14;
    this.model.rotation.z = Math.sin(this.runAnimTime) * 0.15;

    // Diamond Beacon hover
    this.diamondBeacon.position.y = 1.55 + Math.sin(now * 6) * 0.08;
    this.diamondBeacon.rotation.y += delta * 6.5;

    // Drop coin sparkle trail
    this.coinDropTimer -= delta;
    if (this.coinDropTimer <= 0) {
      this.coinDropTimer = 0.32;
      onDropCoinSpark?.(this.x, this.y);
    }

    this.syncPosition();
    return false;
  }

  damage(amount: number): boolean {
    if (this.isDead || this.hasEscaped) return false;
    this.hp -= amount;
    this.hitFlashTimer = 0.08;

    // Update HP bar
    const ratio = Math.max(0, this.hp / this.maxHP);
    this.healthFill.scale.x = ratio;
    this.healthFill.position.x = -0.35 * (1 - ratio);

    if (this.hp <= 0) {
      this.isDead = true;
      return true;
    }
    return false;
  }

  applyKnockback(dirX: number, dirY: number, force: number): void {
    this.x += dirX * force * 0.18;
    this.y += dirY * force * 0.18;
    this.x = THREE.MathUtils.clamp(this.x, 60, WORLD_WIDTH - 60);
    this.y = THREE.MathUtils.clamp(this.y, 60, WORLD_HEIGHT - 60);
    this.syncPosition();
  }

  destroy(): void {
    this.group.removeFromParent();
  }

  private syncPosition(): void {
    setLogicalPosition(this.group, this.x, this.y);
  }
}
