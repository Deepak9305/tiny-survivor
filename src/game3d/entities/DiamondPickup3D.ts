import * as THREE from 'three';
import { setLogicalPosition } from '../core/coordinates';
import { SharedResources, addMesh } from '../core/SharedResources';

export class DiamondPickup3D {
  readonly id: string;
  readonly value: number;
  readonly group: THREE.Group;
  x: number;
  y: number;
  speed = 50;

  private magnetTime = 0;
  private isMagnetized = false;
  private readonly baseScale = 0.30;

  constructor(id: string, parent: THREE.Object3D, x: number, y: number, value: number, resources: SharedResources) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.value = value;
    this.group = new THREE.Group();
    this.group.name = id;

    const diamondColor = 0x38bdf8;
    const coreColor = 0xf0f9ff;

    // Main brilliant faceted diamond
    const diamondMat = resources.standardMaterial(
      'diamond-pickup-outer',
      diamondColor,
      { emissive: diamondColor, emissiveIntensity: 2.2, roughness: 0.1, metalness: 0.4 }
    );
    const diamondMesh = addMesh(this.group, resources.octa('diamond-pickup-geom'), diamondMat);
    diamondMesh.scale.set(this.baseScale * 1.0, this.baseScale * 1.6, this.baseScale * 1.0);
    diamondMesh.position.y = 0.28;
    diamondMesh.castShadow = true;

    // Glowing intense inner core
    const coreMat = resources.basicMaterial(
      'diamond-pickup-core',
      coreColor,
      { transparent: true, opacity: 0.95 }
    );
    const coreMesh = addMesh(this.group, resources.octa('diamond-pickup-core-geom'), coreMat);
    coreMesh.scale.set(this.baseScale * 0.52, this.baseScale * 0.95, this.baseScale * 0.52);
    coreMesh.position.y = 0.28;

    // Floating horizontal astral halo ring
    const haloMat = resources.basicMaterial(
      'diamond-pickup-halo',
      0x7dd3fc,
      { transparent: true, opacity: 0.85, side: THREE.DoubleSide }
    );
    const haloMesh = addMesh(this.group, resources.torus('diamond-pickup-ring-geom'), haloMat);
    haloMesh.scale.setScalar(this.baseScale * 1.45);
    haloMesh.position.y = 0.28;
    haloMesh.rotation.x = Math.PI / 2;

    parent.add(this.group);
    this.syncPosition();
  }

  update(delta: number, now: number, playerX: number, playerY: number, pickupRadius: number): boolean {
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const distance = Math.max(1, Math.sqrt(dx * dx + dy * dy));

    let arcY = 0;
    if (distance < pickupRadius * 1.35) {
      this.isMagnetized = true;
      this.magnetTime += delta;
      this.speed = Math.min(880, this.speed + delta * 1100);
      this.x += (dx / distance) * this.speed * delta;
      this.y += (dy / distance) * this.speed * delta;

      arcY = Math.sin(Math.min(Math.PI, this.magnetTime * 5)) * 0.45;

      if (distance < 45) {
        const shrink = Math.max(0.2, distance / 45);
        this.group.scale.setScalar(shrink);
      }
    } else {
      this.group.scale.setScalar(1);
    }

    this.syncPosition();
    this.group.rotation.y += delta * (this.isMagnetized ? 8.5 : 4.2);
    this.group.position.y = 0.22 + arcY + Math.sin(now * 8 + this.value) * 0.08;
    return distance < 24;
  }

  destroy(): void {
    this.group.removeFromParent();
  }

  private syncPosition(): void {
    setLogicalPosition(this.group, this.x, this.y);
  }
}
