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
    this.group = new THREE.Group();
    this.group.name = this.id;
    this.x = x;
    this.y = y;
    this.spec = spec;
    this.remainingPierce = spec.pierce;
    const hasDir = spec.direction && (spec.direction.x !== 0 || spec.direction.y !== 0);
    const baseAngle = hasDir
      ? Math.atan2(spec.direction!.y, spec.direction!.x)
      : (spec.target ? Math.atan2(spec.target.y - y, spec.target.x - x) : 0);
    const targetAngle = baseAngle + (spec.angle ?? 0);
    this.velocity.set(Math.cos(targetAngle), Math.sin(targetAngle)).multiplyScalar(spec.speed);
    const isFire = spec.weaponId === 'fire-orb';
    const isChain = spec.weaponId === 'chain-lightning';

    this.headingAngle = Math.atan2(this.velocity.x, this.velocity.y);
    this.group.rotation.y = this.headingAngle;

    if (isFire) {
      // Fire Orb: White-hot core + Fiery orange shell + Red outer flame halo + stream trail
      const core = addMesh(this.group, resources.ico('fire-proj-core'), resources.standardMaterial('fire-core-mat', 0xffffff, { emissive: 0xffe8aa, emissiveIntensity: 2.8, roughness: 0.1 }));
      core.scale.setScalar(0.32);
      core.position.y = 0.68;

      const shell = addMesh(this.group, resources.octa('fire-proj-shell'), resources.standardMaterial('fire-shell-mat', 0xff6611, { emissive: 0xff4400, emissiveIntensity: 2.4, roughness: 0.25, transparent: true, opacity: 0.92 }));
      shell.scale.setScalar(0.54);
      shell.position.y = 0.68;

      const flameTail = addMesh(this.group, resources.cone('fire-proj-tail'), resources.basicMaterial('fire-tail-mat', 0xff2200, { transparent: true, opacity: 0.75 }));
      flameTail.scale.set(0.28, 0.95, 0.28);
      flameTail.position.set(0, 0.68, -0.55);
      flameTail.rotation.x = -Math.PI / 2;
    } else if (isChain) {
      // Chain Lightning node
      const core = addMesh(this.group, resources.octa('lightning-node'), resources.standardMaterial('lightning-node-mat', 0xffffff, { emissive: 0x7ae8ff, emissiveIntensity: 2.8, roughness: 0.1 }));
      core.scale.setScalar(0.28);
      core.position.y = 0.72;

      const aura = addMesh(this.group, resources.torus('lightning-aura'), resources.basicMaterial('lightning-aura-mat', 0x4dd8ff, { transparent: true, opacity: 0.8 }));
      aura.scale.setScalar(0.35);
      aura.position.y = 0.72;
    } else {
      // Magic Bolt: White-hot core + Cyan crystal energy shell + Streaming comet trail
      const core = addMesh(this.group, resources.ico('magic-core'), resources.standardMaterial('magic-core-mat', 0xffffff, { emissive: 0xd8f8ff, emissiveIntensity: 2.8, roughness: 0.1 }));
      core.scale.setScalar(0.26);
      core.position.y = 0.72;

      const shell = addMesh(this.group, resources.octa('magic-shell'), resources.standardMaterial('magic-shell-mat', 0x3ae6ff, { emissive: 0x00c8ff, emissiveIntensity: 2.4, roughness: 0.15, transparent: true, opacity: 0.92 }));
      shell.scale.setScalar(0.44);
      shell.position.y = 0.72;

      const trail = addMesh(this.group, resources.cone('magic-trail'), resources.basicMaterial('magic-trail-mat', 0x0088ff, { transparent: true, opacity: 0.72 }));
      trail.scale.set(0.22, 1.05, 0.22);
      trail.position.set(0, 0.72, -0.52);
      trail.rotation.x = -Math.PI / 2;

      const glowRing = addMesh(this.group, resources.torus('magic-ring'), resources.basicMaterial('magic-ring-mat', 0x88f0ff, { transparent: true, opacity: 0.8 }));
      glowRing.scale.setScalar(0.34);
      glowRing.position.y = 0.72;
    }
    parent.add(this.group);
    this.syncPosition();
  }

  private readonly headingAngle: number;

  update(delta: number): void {
    this.age += delta;
    this.x += this.velocity.x * delta;
    this.y += this.velocity.y * delta;
    this.syncPosition();
    const core = this.group.children[0];
    if (core) core.rotation.y += delta * 12;
    if (this.spec.explosive ? this.age > 1.8 : this.age > 3.2) this.active = false;
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
