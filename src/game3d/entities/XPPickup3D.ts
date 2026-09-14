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

  private magnetTime = 0;
  private isMagnetized = false;
  private initialScale: number;

  constructor(id: string, parent: THREE.Object3D, x: number, y: number, value: number, resources: SharedResources) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.value = value;
    this.group = new THREE.Group();
    this.group.name = id;

    // Radiant Glowing Purple/Magenta Diamonds (Survivor.io EXP Crystals)
    const color = value > 30 ? 0xff42e0 : value > 15 ? 0xd050ff : 0xb53eff;
    const innerColor = 0xffeaff;
    const baseScale = value > 30 ? 0.28 : value > 15 ? 0.22 : 0.17;
    this.initialScale = baseScale;

    // Main faceted diamond gem
    const gem = addMesh(this.group, resources.octa(`xp-gem-${color}`), resources.standardMaterial(`xp-${color}`, color, { emissive: color, emissiveIntensity: 1.8, roughness: 0.15, metalness: 0.2 }));
    gem.scale.set(baseScale * 0.9, baseScale * 1.45, baseScale * 0.9);
    gem.position.y = 0.2;

    // Glowing core shard
    const core = addMesh(this.group, resources.octa(`xp-core-${color}`), resources.basicMaterial(`xp-core-${innerColor}`, innerColor, { transparent: true, opacity: 0.9 }));
    core.scale.set(baseScale * 0.45, baseScale * 0.85, baseScale * 0.45);
    core.position.y = 0.2;

    // Floating specular halo ring for medium & large crystals
    if (value > 15) {
      const halo = addMesh(this.group, resources.torus(`xp-halo-${color}`), resources.basicMaterial(`xp-halo-mat-${color}`, 0xe888ff, { transparent: true, opacity: 0.65 }));
      halo.scale.setScalar(baseScale * 1.3);
      halo.position.y = 0.2;
      halo.rotation.x = Math.PI / 2;
    }

    parent.add(this.group);
    this.syncPosition();
  }

  update(delta: number, now: number, playerX: number, playerY: number, pickupRadius: number): boolean {
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const distance = Math.max(1, Math.sqrt(dx * dx + dy * dy));

    let arcY = 0;
    if (distance < pickupRadius) {
      this.isMagnetized = true;
      this.magnetTime += delta;
      this.speed = Math.min(780, this.speed + delta * 920);
      this.x += (dx / distance) * this.speed * delta;
      this.y += (dy / distance) * this.speed * delta;
      
      // Arc upward slightly as it accelerates
      arcY = Math.sin(Math.min(Math.PI, this.magnetTime * 5)) * 0.4;
      
      // Shrink into hero when very close
      if (distance < 50) {
        const shrinkFactor = Math.max(0.2, distance / 50);
        this.group.scale.setScalar(shrinkFactor);
      }
    } else {
      this.group.scale.setScalar(1);
    }

    this.syncPosition();
    this.group.rotation.y += delta * (this.isMagnetized ? 6.5 : 3.4);
    this.group.position.y = 0.15 + arcY + Math.sin(now * 7 + this.value) * 0.05;
    return distance < 24;
  }

  destroy(): void { this.group.removeFromParent(); }
  private syncPosition(): void { setLogicalPosition(this.group, this.x, this.y); }
}
