import * as THREE from 'three';
import { setLogicalPosition } from '../core/coordinates';
import { SharedResources, addMesh } from '../core/SharedResources';

export class TreasureChest3D {
  readonly id: string;
  readonly group: THREE.Group;
  x: number;
  y: number;

  private readonly beaconMesh: THREE.Mesh;
  private readonly ringMesh: THREE.Mesh;
  private readonly crownMesh: THREE.Mesh;
  private readonly chestGroup: THREE.Group;
  private readonly baseScale = 0.9;
  private lifeTime = 0;
  isOpened = false;

  constructor(id: string, parent: THREE.Object3D, x: number, y: number, resources: SharedResources) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.group = new THREE.Group();
    this.group.name = id;

    // 1. Shimmering Golden Ground Rune
    const ringMat = resources.basicMaterial('chest-ring-mat', 0xfbbf24, {
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.ringMesh = addMesh(this.group, resources.ring('chest-ring-geom', 0.65, 0.85), ringMat);
    this.ringMesh.rotation.x = -Math.PI / 2;
    this.ringMesh.position.y = 0.04;

    // 2. High-visibility Skyward Light Pillar
    const beaconMat = resources.basicMaterial('chest-beacon-mat', 0xfef08a, {
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.beaconMesh = addMesh(this.group, resources.cylinder('chest-beam-geom'), beaconMat);
    this.beaconMesh.scale.set(0.45, 9.0, 0.45);
    this.beaconMesh.position.y = 4.5;

    // 3. Stylized 3D Treasure Chest Group
    this.chestGroup = new THREE.Group();
    this.chestGroup.position.y = 0.35;

    // Rich Wood Body
    const woodMat = resources.standardMaterial('chest-wood-mat', 0x78350f, {
      roughness: 0.65,
      metalness: 0.1,
    });
    const chestBody = addMesh(this.chestGroup, resources.box('chest-body-box'), woodMat);
    chestBody.scale.set(0.76 * this.baseScale, 0.48 * this.baseScale, 0.56 * this.baseScale);
    chestBody.position.y = 0.24 * this.baseScale;

    // Golden Reinforced Trims
    const goldMat = resources.standardMaterial('chest-gold-mat', 0xf59e0b, {
      roughness: 0.2,
      metalness: 0.85,
      emissive: 0xd97706,
      emissiveIntensity: 0.8,
    });
    const topTrim = addMesh(this.chestGroup, resources.box('chest-trim-top'), goldMat);
    topTrim.scale.set(0.80 * this.baseScale, 0.12 * this.baseScale, 0.60 * this.baseScale);
    topTrim.position.y = 0.48 * this.baseScale;

    // Golden Padlock / Jewel Latch
    const lockMat = resources.standardMaterial('chest-lock-mat', 0xfacc15, {
      roughness: 0.1,
      metalness: 0.9,
      emissive: 0xfef08a,
      emissiveIntensity: 1.8,
    });
    const lock = addMesh(this.chestGroup, resources.box('chest-lock-box'), lockMat);
    lock.scale.set(0.18 * this.baseScale, 0.20 * this.baseScale, 0.12 * this.baseScale);
    lock.position.set(0, 0.32 * this.baseScale, 0.29 * this.baseScale);

    // Floating Golden Emblem / Diamond above Chest
    const crownMat = resources.standardMaterial('chest-crown-mat', 0xfef08a, {
      roughness: 0.15,
      metalness: 0.4,
      emissive: 0xfbbf24,
      emissiveIntensity: 2.2,
    });
    this.crownMesh = addMesh(this.chestGroup, resources.octa('chest-crown-geom'), crownMat);
    this.crownMesh.scale.set(0.24, 0.38, 0.24);
    this.crownMesh.position.set(0, 0.85 * this.baseScale, 0);

    this.chestGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) child.castShadow = true;
    });
    this.group.add(this.chestGroup);
    parent.add(this.group);
    this.syncPosition();
  }

  update(delta: number, now: number, playerX: number, playerY: number): boolean {
    if (this.isOpened) return false;
    this.lifeTime += delta;

    // Player proximity detection
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.hypot(dx, dy);

    // Goofy cartoon anticipation wiggle when player is near
    const isNear = dist < 85;
    const wiggle = isNear ? Math.sin(now * 24) * 0.10 : 0;
    const nearPop = isNear ? 1.0 + Math.abs(Math.sin(now * 12)) * 0.12 : 1.0;

    const bob = Math.sin(now * 3.5) * 0.08;
    this.chestGroup.position.y = 0.32 + bob;
    this.chestGroup.rotation.y = Math.sin(now * 1.5) * 0.12;
    this.chestGroup.rotation.z = wiggle;
    this.chestGroup.scale.set(this.baseScale * nearPop, this.baseScale * nearPop, this.baseScale * nearPop);

    this.ringMesh.rotation.z += delta * (isNear ? 3.5 : 1.2);
    this.crownMesh.rotation.y += delta * (isNear ? 5.2 : 2.8);
    this.crownMesh.position.y = 0.85 * this.baseScale + Math.sin(now * 5.0) * 0.08;

    // Pulsing light beam
    const beamScale = 0.42 + Math.sin(now * 4.0) * 0.08;
    this.beaconMesh.scale.set(beamScale, 9.0, beamScale);

    if (dist < 32) {
      this.isOpened = true;
      return true;
    }

    return false;
  }

  destroy(): void {
    this.group.removeFromParent();
  }

  private syncPosition(): void {
    setLogicalPosition(this.group, this.x, this.y);
  }
}
