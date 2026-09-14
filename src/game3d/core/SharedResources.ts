import * as THREE from 'three';

type MaterialOptions = {
  transparent?: boolean;
  opacity?: number;
  emissive?: number;
  emissiveIntensity?: number;
  roughness?: number;
  metalness?: number;
  side?: THREE.Side;
};

export class SharedResources {
  private readonly geometries = new Map<string, THREE.BufferGeometry>();
  private readonly materials = new Map<string, THREE.Material>();

  geometry(key: string, factory: () => THREE.BufferGeometry): THREE.BufferGeometry {
    const existing = this.geometries.get(key);
    if (existing) return existing;
    const created = factory();
    this.geometries.set(key, created);
    return created;
  }

  standardMaterial(key: string, color: number, options: MaterialOptions = {}): THREE.MeshStandardMaterial {
    const materialKey = `standard:${key}:${color}:${JSON.stringify(options)}`;
    const existing = this.materials.get(materialKey);
    if (existing) return existing as THREE.MeshStandardMaterial;
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: options.roughness ?? 0.78,
      metalness: options.metalness ?? 0.08,
      transparent: options.transparent ?? false,
      opacity: options.opacity ?? 1,
      emissive: options.emissive ?? 0,
      emissiveIntensity: options.emissiveIntensity ?? 0,
      side: options.side,
    });
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
      depthWrite: options.transparent ? false : true,
    });
    this.materials.set(materialKey, material);
    return material;
  }

  box(key = 'box'): THREE.BufferGeometry { return this.geometry(key, () => new THREE.BoxGeometry(1, 1, 1)); }
  sphere(key = 'sphere'): THREE.BufferGeometry { return this.geometry(key, () => new THREE.SphereGeometry(0.5, 10, 7)); }
  ico(key = 'ico'): THREE.BufferGeometry { return this.geometry(key, () => new THREE.IcosahedronGeometry(0.5, 0)); }
  octa(key = 'octa'): THREE.BufferGeometry { return this.geometry(key, () => new THREE.OctahedronGeometry(0.5, 0)); }
  cone(key = 'cone'): THREE.BufferGeometry { return this.geometry(key, () => new THREE.ConeGeometry(0.5, 1, 6)); }
  cylinder(key = 'cylinder'): THREE.BufferGeometry { return this.geometry(key, () => new THREE.CylinderGeometry(0.5, 0.5, 1, 8)); }
  ring(key = 'ring', inner = 0.5, outer = 0.6): THREE.BufferGeometry {
    return this.geometry(`${key}:${inner}:${outer}`, () => new THREE.RingGeometry(inner, outer, 24));
  }
  plane(key = 'plane', width = 1, height = 1): THREE.BufferGeometry {
    return this.geometry(`${key}:${width}:${height}`, () => new THREE.PlaneGeometry(width, height));
  }
  torus(key = 'torus'): THREE.BufferGeometry {
    return this.geometry(key, () => new THREE.TorusGeometry(0.5, 0.06, 6, 16));
  }
  circle(key = 'circle', radius = 0.5): THREE.BufferGeometry {
    return this.geometry(`${key}:${radius}`, () => new THREE.CircleGeometry(radius, 20));
  }

  dispose(): void {
    for (const geometry of this.geometries.values()) geometry.dispose();
    for (const material of this.materials.values()) material.dispose();
    this.geometries.clear();
    this.materials.clear();
  }
}

export function mesh(geometry: THREE.BufferGeometry, material: THREE.Material): THREE.Mesh {
  const object = new THREE.Mesh(geometry, material);
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
