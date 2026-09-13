import * as THREE from 'three';
import { setLogicalPosition } from '../core/coordinates';
import { SharedResources } from '../core/SharedResources';
import { createBossModel } from '../visuals/CharacterFactory';

export class Boss3D {
  readonly group: THREE.Group;
  private readonly model: THREE.Group;
  private readonly aura: THREE.Mesh;
  private readonly shadow: THREE.Mesh;
  private visualTime = 0;
  x: number;
  y: number;

  constructor(parent: THREE.Object3D, x: number, y: number, resources: SharedResources) {
    const visual = createBossModel(resources);
    this.group = new THREE.Group();
    this.group.name = 'boss-skeleton-king';
    this.model = visual.root;
    this.aura = visual.aura;
    this.shadow = visual.shadow;
    this.group.add(this.model);
    parent.add(this.group);
    this.x = x;
    this.y = y;
    this.syncPosition();
  }

  update(delta: number): void {
    this.visualTime += delta;
    this.model.position.y = Math.sin(this.visualTime * 2.1) * 0.06;
    this.model.rotation.y += delta * 0.12;
    this.aura.scale.setScalar(1 + Math.sin(this.visualTime * 3.4) * 0.1);
    this.shadow.scale.x = 2.2 + Math.sin(this.visualTime * 2.1) * 0.08;
  }

  setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.syncPosition();
  }

  getPosition(): { x: number; y: number } { return { x: this.x, y: this.y }; }

  private syncPosition(): void { setLogicalPosition(this.group, this.x, this.y); }
  destroy(): void { this.group.removeFromParent(); }
}
