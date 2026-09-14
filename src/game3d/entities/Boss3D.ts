import * as THREE from 'three';
import { setLogicalPosition } from '../core/coordinates';
import { SharedResources } from '../core/SharedResources';
import { createBossModel } from '../visuals/CharacterFactory';

export class Boss3D {
  readonly group: THREE.Group;
  private readonly model: THREE.Group;
  private readonly aura: THREE.Mesh;
  private readonly shadow: THREE.Mesh;
  private readonly parts: Record<string, THREE.Object3D | THREE.Object3D[]>;
  private visualTime = 0;
  private attackTime = 0;
  private attackKind: string | undefined;
  private arrivalTime = 0.72;
  private deathTime = 0;
  private dying = false;
  x: number;
  y: number;

  constructor(parent: THREE.Object3D, x: number, y: number, resources: SharedResources) {
    const visual = createBossModel(resources);
    this.group = new THREE.Group();
    this.group.name = 'boss-skeleton-king';
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

  update(delta: number): void {
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
    const sword = this.parts.sword;
    if (sword instanceof THREE.Object3D) sword.rotation.z = -0.4 - (this.attackKind === 'slam' ? attackSwing * 0.9 : attackSwing * 0.3);
    this.model.position.y = Math.sin(this.visualTime * 2.1) * 0.06 + (this.attackKind === 'charge' ? attackSwing * 0.16 : 0);
    this.model.rotation.y += delta * 0.12;
    this.model.rotation.x = this.attackKind === 'charge' ? attackSwing * 0.14 : 0;
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
