import * as THREE from 'three';
import { setLogicalPosition } from '../core/coordinates';
import { SharedResources, addMesh } from '../core/SharedResources';

export type ArenaRuneKind = 'bomb' | 'magnet' | 'freeze' | 'haste';

export interface RuneDefinition {
  kind: ArenaRuneKind;
  name: string;
  color: number;
  innerColor: number;
  beaconColor: number;
}

const RUNE_DEFS: Record<ArenaRuneKind, RuneDefinition> = {
  bomb: { kind: 'bomb', name: 'Cataclysm Core', color: 0xff3b30, innerColor: 0xffd60a, beaconColor: 0xff6950 },
  magnet: { kind: 'magnet', name: 'Vortex Shard', color: 0xa855f7, innerColor: 0x38bdf8, beaconColor: 0xc084fc },
  freeze: { kind: 'freeze', name: 'Cryo Crystal', color: 0x38bdf8, innerColor: 0xffffff, beaconColor: 0x7dd3fc },
  haste: { kind: 'haste', name: 'Solar Ember', color: 0xfacc15, innerColor: 0xffedd5, beaconColor: 0xfde047 },
};

export class ArenaRune3D {
  readonly id: string;
  readonly kind: ArenaRuneKind;
  readonly definition: RuneDefinition;
  readonly group: THREE.Group;
  x: number;
  y: number;

  private life = 0;
  private readonly maxLife = 30.0;
  private isCollected = false;
  private readonly coreMesh: THREE.Mesh;
  private readonly ringMesh: THREE.Mesh;
  private readonly beaconMesh: THREE.Mesh;

  constructor(id: string, parent: THREE.Object3D, x: number, y: number, kind: ArenaRuneKind, resources: SharedResources) {
    this.id = id;
    this.kind = kind;
    this.definition = RUNE_DEFS[kind];
    this.x = x;
    this.y = y;
    this.group = new THREE.Group();
    this.group.name = id;

    const def = this.definition;

    // 1. Ground trigger boundary ring
    const ringMat = resources.basicMaterial(`rune-ring-mat-${def.color}`, def.color, {
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.ringMesh = addMesh(this.group, resources.ring(`rune-ring-${kind}`, 0.48, 0.58), ringMat);
    this.ringMesh.rotation.x = -Math.PI / 2;
    this.ringMesh.position.y = 0.04;

    // 2. High-visibility Skyward Beacon
    const beaconMat = resources.basicMaterial(`rune-beacon-${def.beaconColor}`, def.beaconColor, {
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.beaconMesh = addMesh(this.group, resources.cylinder(`rune-beam-${kind}`), beaconMat);
    this.beaconMesh.scale.set(0.32, 7.5, 0.32);
    this.beaconMesh.position.y = 3.75;

    // 3. Floating polyhedral Rune core
    const coreMat = resources.standardMaterial(`rune-core-mat-${def.color}`, def.color, {
      emissive: def.color,
      emissiveIntensity: 2.4,
      roughness: 0.15,
      metalness: 0.3,
    });
    this.coreMesh = addMesh(this.group, resources.octa(`rune-core-geom-${kind}`), coreMat);
    this.coreMesh.scale.set(0.38, 0.52, 0.38);
    this.coreMesh.position.y = 0.52;
    this.coreMesh.castShadow = true;

    // 4. Orbiting satellite crystal
    const satMat = resources.basicMaterial(`rune-sat-${def.innerColor}`, def.innerColor, {
      transparent: true,
      opacity: 0.9,
    });
    const satMesh = addMesh(this.coreMesh, resources.octa('rune-sat-geom'), satMat);
    satMesh.scale.setScalar(0.42);
    satMesh.position.set(0.55, 0, 0);

    parent.add(this.group);
    this.syncPosition();
  }

  update(delta: number, now: number, playerX: number, playerY: number): boolean {
    if (this.isCollected) return false;
    this.life += delta;

    // Blink when expiring in last 6 seconds
    if (this.life > this.maxLife - 6.0) {
      const blink = Math.sin((this.life - (this.maxLife - 6.0)) * 14) > 0;
      this.group.visible = blink;
      if (this.life >= this.maxLife) {
        return false;
      }
    }

    // Hover animation
    const hover = Math.sin(now * 4.5) * 0.1;
    this.coreMesh.position.y = 0.52 + hover;
    this.coreMesh.rotation.y += delta * 2.8;
    this.coreMesh.rotation.x = Math.sin(now * 2) * 0.2;

    // Ground ring pulse
    const ringScale = 1.0 + Math.sin(now * 3.5) * 0.15;
    this.ringMesh.scale.setScalar(ringScale);

    this.syncPosition();

    // Check collision with player (34 units trigger radius)
    const distSq = (this.x - playerX) * (this.x - playerX) + (this.y - playerY) * (this.y - playerY);
    if (distSq <= 34 * 34) {
      this.isCollected = true;
      return true;
    }

    return false;
  }

  hasExpired(): boolean {
    return this.life >= this.maxLife;
  }

  destroy(): void {
    this.group.removeFromParent();
  }

  private syncPosition(): void {
    setLogicalPosition(this.group, this.x, this.y);
  }
}
