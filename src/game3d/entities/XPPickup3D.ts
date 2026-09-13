import * as THREE from 'three';
import { setLogicalPosition } from '../core/coordinates';
import { SharedResources, addMesh } from '../core/SharedResources';

export class XPPickup3D {
  readonly id: string;
  readonly value: number;
  readonly group: THREE.Group;
  x: number;
  y: number;
  speed = 40;

  constructor(id: string, parent: THREE.Object3D, x: number, y: number, value: number, resources: SharedResources) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.value = value;
    this.group = new THREE.Group();
    this.group.name = id;
    const color = value > 30 ? 0xc58cff : value > 15 ? 0x5de7ff : 0x4aafff;
    const gem = addMesh(this.group, resources.octa('xp-gem'), resources.standardMaterial(`xp-${color}`, color, { emissive: color, emissiveIntensity: 1.35, roughness: 0.3, metalness: 0.12 }));
    gem.scale.setScalar(value > 30 ? 0.22 : value > 15 ? 0.18 : 0.14);
    gem.position.y = 0.2;
    parent.add(this.group);
    this.syncPosition();
  }

  update(delta: number, now: number, playerX: number, playerY: number, pickupRadius: number): boolean {
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const distance = Math.max(1, Math.sqrt(dx * dx + dy * dy));
    if (distance < pickupRadius) {
      this.speed = Math.min(640, this.speed + delta * 840);
      this.x += (dx / distance) * this.speed * delta;
      this.y += (dy / distance) * this.speed * delta;
    }
    this.syncPosition();
    this.group.rotation.y += delta * 3.4;
    this.group.position.y = 0.12 + Math.sin(now * 7 + this.value) * 0.06;
    return distance < 22;
  }

  destroy(): void { this.group.removeFromParent(); }
  private syncPosition(): void { setLogicalPosition(this.group, this.x, this.y); }
}
