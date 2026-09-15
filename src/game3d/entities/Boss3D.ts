import * as THREE from 'three';
import type { BossId } from '../../types';
import { setLogicalPosition } from '../core/coordinates';
import { SharedResources } from '../core/SharedResources';
import { createBossModel } from '../visuals/CharacterFactory';

function lerpAngle(current: number, target: number, t: number): number {
  let diff = (target - current) % (Math.PI * 2);
  if (diff > Math.PI) diff -= Math.PI * 2;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return current + diff * t;
}

export class Boss3D {
  readonly group: THREE.Group;
  private readonly model: THREE.Group;
  private readonly aura: THREE.Mesh;
  private readonly shadow: THREE.Mesh;
  private readonly parts: Record<string, THREE.Object3D | THREE.Object3D[]>;
  readonly bossId: BossId;
  private visualTime = 0;
  private attackTime = 0;
  private attackKind: string | undefined;
  private arrivalTime = 0.72;
  private deathTime = 0;
  private dying = false;
  x: number;
  y: number;

  constructor(parent: THREE.Object3D, x: number, y: number, resources: SharedResources, bossId: BossId) {
    const visual = createBossModel(bossId, resources);
    this.group = new THREE.Group();
    this.bossId = bossId;
    this.group.name = `boss-${bossId}`;
    this.model = visual.root;
    this.aura = visual.aura;
    this.shadow = visual.shadow;
    this.parts = this.model.userData.parts as Record<string, THREE.Object3D | THREE.Object3D[]>;
    this.group.add(this.model);
    parent.add(this.group);
    this.x = x;
    this.y = y;
    this.syncPosition();
  }

  update(delta: number, playerX?: number, playerY?: number): void {
    this.visualTime += delta;
    if (this.dying) {
      this.deathTime += delta;
      const progress = Math.min(1, this.deathTime / 0.72);
      this.model.rotation.z = -progress * 0.72;
      this.model.position.y = Math.sin(progress * Math.PI) * 0.15;
      this.group.scale.setScalar(1 - progress * 0.24);
      this.aura.scale.setScalar(1 + progress * 0.85);
      this.setOpacity(1 - progress);
      return;
    }
    const arrivalProgress = Math.min(1, Math.max(0, 1 - this.arrivalTime / 0.72));
    this.arrivalTime = Math.max(0, this.arrivalTime - delta);
    const attackProgress = this.attackTime > 0 ? 1 - this.attackTime / 0.72 : 0;
    const attackSwing = attackProgress > 0 ? Math.sin(Math.min(1, attackProgress) * Math.PI) : 0;

    // Smooth menacing facing towards player
    if (playerX !== undefined && playerY !== undefined) {
      const dx = playerX - this.x;
      const dy = playerY - this.y;
      const targetAngle = Math.atan2(dx, dy);
      this.model.rotation.y = lerpAngle(this.model.rotation.y, targetAngle, Math.min(1, delta * 7.5));
    }

    // Heavy boss footsteps / physical stride
    if (this.parts.legs instanceof Array && this.parts.legs.length >= 2) {
      const stride = Math.sin(this.visualTime * 4.5) * 0.35;
      this.parts.legs[0].rotation.x = stride;
      this.parts.legs[1].rotation.x = -stride;
      this.model.position.y = Math.abs(Math.sin(this.visualTime * 4.5)) * 0.08 + (this.attackKind === 'charge' ? attackSwing * 0.16 : 0);
    } else {
      this.model.position.y = Math.sin(this.visualTime * 2.1) * 0.06 + (this.attackKind === 'charge' ? attackSwing * 0.16 : 0);
    }

    // Dynamic Cape Wind Flutter
    const cape = this.parts.cape;
    if (cape instanceof THREE.Object3D) {
      cape.rotation.x = -0.15 + Math.sin(this.visualTime * 3.5) * 0.08;
    }

    const isSlam = this.attackKind === 'slam' || this.attackKind === 'ground-slam' || this.attackKind === 'thorn-circle';
    const weapon = this.parts.sword instanceof THREE.Object3D ? this.parts.sword : this.parts.weapon;
    if (weapon instanceof THREE.Object3D) {
      weapon.rotation.z = -0.4 - (isSlam ? attackSwing * 1.1 : attackSwing * 0.4);
    }
    this.model.rotation.x = isSlam ? attackSwing * 0.22 : (this.attackKind === 'charge' || this.attackKind === 'demon-charge' ? attackSwing * 0.28 : 0);

    if (this.parts.wings instanceof Array) {
      for (let index = 0; index < this.parts.wings.length; index += 1) {
        const sign = index % 2 === 0 ? -1 : 1;
        this.parts.wings[index].rotation.z = sign * 0.28 + Math.sin(this.visualTime * 3.8 + index) * 0.35;
      }
    }
    if (this.parts.core instanceof THREE.Object3D) this.parts.core.rotation.y += delta * 2.4;
    this.group.scale.setScalar(0.72 + arrivalProgress * 0.28);
    this.attackTime = Math.max(0, this.attackTime - delta);
    if (this.attackTime === 0) this.attackKind = undefined;
    this.aura.scale.setScalar(1 + Math.sin(this.visualTime * 3.4) * 0.1);
    this.shadow.scale.x = 2.2 + Math.sin(this.visualTime * 2.1) * 0.08;
  }

  startAttack(attack: string): void { this.attackKind = attack; this.attackTime = 0.72; }
  startDeath(): void { this.dying = true; this.deathTime = 0; }
  isDying(): boolean { return this.dying; }

  setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.syncPosition();
  }

  getPosition(): { x: number; y: number } { return { x: this.x, y: this.y }; }

  private syncPosition(): void { setLogicalPosition(this.group, this.x, this.y); }
  destroy(): void { this.group.removeFromParent(); }

  private setOpacity(opacity: number): void {
    this.model.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of materials) {
        material.transparent = true;
        material.opacity = opacity;
      }
    });
  }
}
