import * as THREE from 'three';
import { getCharacterSurfaceSpec } from '../visuals/CharacterSurface';

type MaterialOptions = {
  transparent?: boolean;
  opacity?: number;
  emissive?: number;
  emissiveIntensity?: number;
  roughness?: number;
  metalness?: number;
  side?: THREE.Side;
  depthWrite?: boolean;
};

let sharedShadowTexture: THREE.CanvasTexture | null = null;

export function getSoftShadowTexture(): THREE.CanvasTexture {
  if (sharedShadowTexture) return sharedShadowTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
    gradient.addColorStop(0.25, 'rgba(0, 0, 0, 0.82)');
    gradient.addColorStop(0.52, 'rgba(0, 0, 0, 0.48)');
    gradient.addColorStop(0.76, 'rgba(0, 0, 0, 0.16)');
    gradient.addColorStop(0.92, 'rgba(0, 0, 0, 0.03)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
  }
  sharedShadowTexture = new THREE.CanvasTexture(canvas);
  sharedShadowTexture.needsUpdate = true;
  return sharedShadowTexture;
}

export class SharedResources {
  private readonly geometries = new Map<string, THREE.BufferGeometry>();
  private readonly materials = new Map<string, THREE.Material>();

  geometry(key: string, factory: () => THREE.BufferGeometry): THREE.BufferGeometry {
    const existing = this.geometries.get(key);
    if (existing) return existing;
    const created = factory();
    created.name = key;
    this.geometries.set(key, created);
    return created;
  }

  standardMaterial(key: string, color: number, options: MaterialOptions = {}): THREE.MeshStandardMaterial {
    const materialKey = `standard:${key}:${color}:${JSON.stringify(options)}`;
    const existing = this.materials.get(materialKey);
    if (existing) return existing as THREE.MeshStandardMaterial;

    const surface = getCharacterSurfaceSpec(key);
    const material = new THREE.MeshStandardMaterial({
      color,
      map: surface && !options.transparent ? surface.texture : undefined,
      roughness: options.roughness ?? surface?.roughness ?? 0.78,
      metalness: options.metalness ?? surface?.metalness ?? 0.08,
      transparent: options.transparent ?? false,
      opacity: options.opacity ?? 1,
      emissive: options.emissive ?? 0,
      emissiveIntensity: options.emissiveIntensity ?? 0,
      side: options.side,
      depthWrite: options.depthWrite ?? (options.transparent ? false : true),
    });
    material.name = key;
    if (surface) {
      material.envMapIntensity = surface.envMapIntensity;
      material.userData.premiumCharacterSurface = true;
    }
    this.materials.set(materialKey, material);
    return material;
  }

  basicMaterial(key: string, color: number, options: MaterialOptions = {}): THREE.MeshBasicMaterial {
    const materialKey = `basic:${key}:${color}:${JSON.stringify(options)}`;
    const existing = this.materials.get(materialKey);
    if (existing) return existing as THREE.MeshBasicMaterial;
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: options.transparent ?? false,
      opacity: options.opacity ?? 1,
      side: options.side,
      depthWrite: options.depthWrite ?? (options.transparent ? false : true),
    });
    material.name = key;
    // The primary and specials are auto-aimed now. Keep legacy geometry allocation
    // harmless for compatibility, but never render the old manual aim cone/line/dot.
    if (key.startsWith('aim-cone-mat-') || key.startsWith('aim-core-mat-') || key.startsWith('aim-dot-mat-')) {
      material.visible = false;
    }
    this.materials.set(materialKey, material);
    return material;
  }

  shadowMaterial(key = 'contact-shadow', opacity = 0.62): THREE.MeshBasicMaterial {
    const materialKey = `shadow:${key}:${opacity}`;
    const existing = this.materials.get(materialKey);
    if (existing) return existing as THREE.MeshBasicMaterial;
    const material = new THREE.MeshBasicMaterial({
      map: getSoftShadowTexture(), color: 0x000206, transparent: true, opacity, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
    });
    material.name = key;
    this.materials.set(materialKey, material);
    return material;
  }

  createContactShadow(key = 'contact-shadow', width = 1, height = 1, opacity = 0.62): THREE.Mesh {
    const geom = this.plane(`shadow-plane:${width}:${height}`, width, height);
    const mat = this.shadowMaterial(key, opacity);
    const meshObj = new THREE.Mesh(geom, mat);
    meshObj.name = key;
    meshObj.rotation.x = -Math.PI / 2;
    meshObj.position.y = 0.006;
    meshObj.renderOrder = 1;
    return meshObj;
  }

  box(key = 'box'): THREE.BufferGeometry { return this.geometry(key, () => new THREE.BoxGeometry(1, 1, 1)); }
  sphere(key = 'sphere'): THREE.BufferGeometry { return this.geometry(key, () => new THREE.SphereGeometry(0.5, 18, 12)); }
  ico(key = 'ico'): THREE.BufferGeometry { return this.geometry(key, () => new THREE.IcosahedronGeometry(0.5, 1)); }
  octa(key = 'octa'): THREE.BufferGeometry { return this.geometry(key, () => new THREE.OctahedronGeometry(0.5, 1)); }
  cone(key = 'cone'): THREE.BufferGeometry { return this.geometry(key, () => new THREE.ConeGeometry(0.5, 1, 10)); }
  cylinder(key = 'cylinder'): THREE.BufferGeometry { return this.geometry(key, () => new THREE.CylinderGeometry(0.5, 0.5, 1, 12)); }
  ring(key = 'ring', inner = 0.5, outer = 0.6): THREE.BufferGeometry { return this.geometry(`${key}:${inner}:${outer}`, () => new THREE.RingGeometry(inner, outer, 32)); }
  plane(key = 'plane', width = 1, height = 1): THREE.BufferGeometry { return this.geometry(`${key}:${width}:${height}`, () => new THREE.PlaneGeometry(width, height)); }
  torus(key = 'torus'): THREE.BufferGeometry { return this.geometry(key, () => new THREE.TorusGeometry(0.5, 0.06, 8, 24)); }
  circle(key = 'circle', radius = 0.5): THREE.BufferGeometry { return this.geometry(`${key}:${radius}`, () => new THREE.CircleGeometry(radius, 28)); }

  dispose(): void {
    for (const geometry of this.geometries.values()) geometry.dispose();
    for (const material of this.materials.values()) material.dispose();
    this.geometries.clear();
    this.materials.clear();
  }
}

export function mesh(geometry: THREE.BufferGeometry, material: THREE.Material): THREE.Mesh {
  const object = new THREE.Mesh(geometry, material);
  object.name = geometry.name;
  object.castShadow = false;
  object.receiveShadow = false;
  return object;
}

export function addMesh(parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material, position?: THREE.Vector3): THREE.Mesh {
  const object = mesh(geometry, material);
  if (position) object.position.copy(position);
  parent.add(object);
  return object;
}
