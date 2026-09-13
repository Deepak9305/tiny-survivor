import * as THREE from 'three';
import type { ProjectileSpec } from '../../game/systems/WeaponSystem';
import { setLogicalPosition } from '../core/coordinates';
import { SharedResources, addMesh } from '../core/SharedResources';

let projectileSequence = 0;

export class Projectile3D {
  readonly id = `projectile-${projectileSequence += 1}`;
  readonly group: THREE.Group;
  readonly spec: ProjectileSpec;
  x: number;
  y: number;
  private readonly velocity = new THREE.Vector2();
  private remainingPierce: number;
  private age = 0;
  active = true;

  constructor(parent: THREE.Object3D, x: number, y: number, spec: ProjectileSpec, resources: SharedResources) {
    this.x = x;
    this.y = y;
    this.spec = spec;
    this.remainingPierce = spec.pierce;
    this.group = new THREE.Group();
    this.group.name = this.id;
    const targetAngle = (spec.target ? Math.atan2(spec.target.y - y, spec.target.x - x) : 0) + (spec.angle ?? 0);
    this.velocity.set(Math.cos(targetAngle), Math.sin(targetAngle)).multiplyScalar(spec.speed);
    const isFire = spec.weaponId === 'fire-orb';
    const isChain = spec.weaponId === 'chain-lightning';
    const orb = addMesh(this.group, isFire ? resources.ico('fire-projectile') : resources.octa('magic-projectile'), resources.standardMaterial(`projectile-${spec.weaponId}`, spec.color, { emissive: spec.color, emissiveIntensity: isFire ? 1.15 : 1.6, roughness: 0.32 }));
    orb.scale.setScalar((spec.radius / 6) * (isFire ? 0.32 : 0.18));
    orb.position.y = isFire ? 0.68 : 0.72;
    if (isFire) {
      const ring = addMesh(this.group, resources.torus('fire-projectile-ring'), resources.basicMaterial('fire-projectile-ring', 0xffc15f, { transparent: true, opacity: 0.85 }));
      ring.scale.setScalar(0.34);
      ring.position.y = 0.68;
      ring.rotation.x = Math.PI / 2;
    } else if (!isChain) {
      const trail = addMesh(this.group, resources.cone('magic-projectile-trail'), resources.basicMaterial('magic-projectile-trail', spec.color, { transparent: true, opacity: 0.38 }));
      trail.scale.set(0.12, 0.58, 0.12);
      trail.position.set(-0.08, 0.7, 0.16);
      trail.rotation.x = Math.PI / 2;
    }
    parent.add(this.group);
    this.syncPosition();
  }

  update(delta: number): void {
    this.age += delta;
    this.x += this.velocity.x * delta;
    this.y += this.velocity.y * delta;
    this.syncPosition();
    this.group.rotation.y += delta * 12;
    if (this.age > 4) this.active = false;
  }

  canPierce(): boolean {
    if (this.remainingPierce <= 0) {
      this.active = false;
      return false;
    }
    this.remainingPierce -= 1;
    return true;
  }

  destroy(): void { this.active = false; this.group.removeFromParent(); }
  private syncPosition(): void { setLogicalPosition(this.group, this.x, this.y); }
}
