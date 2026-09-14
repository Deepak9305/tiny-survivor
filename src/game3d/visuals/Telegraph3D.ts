import * as THREE from 'three';
import type { BossAttack } from '../../game/systems/BossSystem';
import { logicalToWorld } from '../core/coordinates';
import { SharedResources, addMesh } from '../core/SharedResources';

type Telegraph = { group: THREE.Group; life: number; duration: number };

export class Telegraph3D {
  private readonly parent: THREE.Group;
  private readonly resources: SharedResources;
  private readonly telegraphs: Telegraph[] = [];

  constructor(parent: THREE.Group, resources: SharedResources) {
    this.parent = parent;
    this.resources = resources;
  }

  show(attack: BossAttack, x: number, y: number, targetX: number, targetY: number): void {
    const group = new THREE.Group();
    const material = this.resources.basicMaterial(`telegraph-${attack}`, 0xff5d65, { transparent: true, opacity: 0.7, side: THREE.DoubleSide }).clone();
    if (attack === 'charge') {
      const start = logicalToWorld(x, y);
      const target = logicalToWorld(targetX, targetY);
      const dx = target.x - start.x;
      const dz = target.z - start.z;
      const length = Math.max(1, Math.sqrt(dx * dx + dz * dz));
      const line = addMesh(group, this.resources.plane(`charge-line-${Math.round(length * 100)}`, length, 0.22), material);
      line.rotation.x = -Math.PI / 2;
      line.rotation.z = -Math.atan2(dz, dx);
      line.position.set((start.x + target.x) / 2, 0.035, (start.z + target.z) / 2);
    } else {
      const radius = attack === 'slam' ? 2.8 : 1.85;
      const ring = addMesh(group, this.resources.ring(`telegraph-ring-${attack}`, radius * 0.84, radius), material);
      ring.rotation.x = -Math.PI / 2;
      const fillMaterial = material.clone();
      fillMaterial.opacity = 0.09;
      const fill = addMesh(group, new THREE.CircleGeometry(radius * 0.84, 32), fillMaterial);
      fill.rotation.x = -Math.PI / 2;
      fill.position.y = -0.006;
      const position = logicalToWorld(x, y);
      group.position.set(position.x, 0.035, position.z);
    }
    this.parent.add(group);
    this.telegraphs.push({ group, life: 0, duration: 0.72 });
  }

  update(delta: number): void {
    for (let index = this.telegraphs.length - 1; index >= 0; index -= 1) {
      const telegraph = this.telegraphs[index];
      telegraph.life += delta;
      const progress = telegraph.life / telegraph.duration;
      telegraph.group.scale.setScalar(0.95 + progress * 0.08);
      telegraph.group.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.Material) child.material.opacity = 0.78 * (0.55 + Math.sin(progress * Math.PI * 4) * 0.32);
      });
      if (telegraph.life >= telegraph.duration) {
        disposeTransientMaterials(telegraph.group);
        telegraph.group.removeFromParent();
        this.telegraphs.splice(index, 1);
      }
    }
  }

  clear(): void {
    for (const telegraph of this.telegraphs) {
      disposeTransientMaterials(telegraph.group);
      telegraph.group.removeFromParent();
    }
    this.telegraphs.length = 0;
  }
}

function disposeTransientMaterials(group: THREE.Group): void {
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of materials) material.dispose();
    }
  });
}
