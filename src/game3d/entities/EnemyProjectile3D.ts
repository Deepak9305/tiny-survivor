import * as THREE from 'three';
import { setLogicalPosition } from '../core/coordinates';
import { SharedResources, addMesh } from '../core/SharedResources';

let enemyProjectileSequence = 0;

export class EnemyProjectile3D {
  readonly id = `enemy-projectile-${enemyProjectileSequence += 1}`;
  readonly group: THREE.Group;
  x: number;
  y: number;
  readonly velocity: THREE.Vector2;
  readonly damage: number;
  age = 0;
  active = true;

  constructor(parent: THREE.Object3D, x: number, y: number, angle: number, speed: number, resources: SharedResources, damage = 13, color = 0xff6372) {
    this.x = x;
    this.y = y;
    this.damage = damage;
    this.velocity = new THREE.Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed);
    this.group = new THREE.Group();
    this.group.name = this.id;
    const bolt = addMesh(this.group, resources.octa('enemy-projectile'), resources.standardMaterial(`enemy-projectile-${color}`, color, { emissive: color, emissiveIntensity: 1.2, roughness: 0.35 }));
    bolt.scale.setScalar(0.2);
    bolt.position.y = 0.48;
    const trail = addMesh(this.group, resources.cone('enemy-projectile-trail'), resources.basicMaterial(`enemy-projectile-trail-${color}`, color, { transparent: true, opacity: 0.38 }));
    trail.scale.set(0.09, 0.36, 0.09);
    trail.position.set(0, 0.48, 0.22);
    trail.rotation.x = Math.PI / 2;
    parent.add(this.group);
    this.syncPosition();
  }

  update(delta: number): void {
    this.age += delta;
    this.x += this.velocity.x * delta;
    this.y += this.velocity.y * delta;
    this.group.rotation.y += delta * 10;
    this.syncPosition();
  }

  destroy(): void { this.active = false; this.group.removeFromParent(); }
  private syncPosition(): void { setLogicalPosition(this.group, this.x, this.y); }
}
