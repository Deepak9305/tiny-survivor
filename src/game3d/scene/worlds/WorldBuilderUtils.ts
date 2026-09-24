import * as THREE from 'three';
import { ARENA_DEPTH, ARENA_WIDTH } from '../../core/coordinates';
import { modelRegistry, type ModelAssetId } from '../../assets/ModelRegistry';

export type Transform = {
  position: THREE.Vector3;
  scale?: THREE.Vector3;
  rotationY?: number;
  rotationX?: number;
  rotationZ?: number;
};

function applyShadow(mesh: THREE.Mesh, mat?: THREE.Material): THREE.Mesh {
  if (mat && !mat.transparent) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  }
  return mesh;
}

export function createBox(sx: number, sy: number, sz: number, mat: THREE.Material, px = 0, py = 0, pz = 0, rx = 0, ry = 0, rz = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
  mesh.position.set(px, py, pz);
  mesh.rotation.set(rx, ry, rz);
  return applyShadow(mesh, mat);
}

export function createCylinder(rt: number, rb: number, h: number, s: number, mat: THREE.Material, px = 0, py = 0, pz = 0, rx = 0, ry = 0, rz = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, s), mat);
  mesh.position.set(px, py, pz);
  mesh.rotation.set(rx, ry, rz);
  return applyShadow(mesh, mat);
}

export function createSphere(
  r: number,
  sOrMat: number | THREE.Material,
  matOrPx?: THREE.Material | number,
  pxOrPy = 0,
  pyOrPz = 0,
  pz = 0
): THREE.Mesh {
  if (typeof sOrMat === 'number') {
    const s = sOrMat;
    const mat = matOrPx as THREE.Material;
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, s, s), mat);
    mesh.position.set(pxOrPy, pyOrPz, pz);
    return applyShadow(mesh, mat);
  }
  const mat = sOrMat as THREE.Material;
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 8), mat);
  const px = typeof matOrPx === 'number' ? matOrPx : 0;
  mesh.position.set(px, pxOrPy, pyOrPz);
  return applyShadow(mesh, mat);
}

export function createOcta(r: number, mat: THREE.Material, px = 0, py = 0, pz = 0, rx = 0, ry = 0, rz = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(r), mat);
  mesh.position.set(px, py, pz);
  mesh.rotation.set(rx, ry, rz);
  return applyShadow(mesh, mat);
}

export function createCone(r: number, h: number, s: number, mat: THREE.Material, px = 0, py = 0, pz = 0, rx = 0, ry = 0, rz = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.ConeGeometry(r, h, s), mat);
  mesh.position.set(px, py, pz);
  mesh.rotation.set(rx, ry, rz);
  return applyShadow(mesh, mat);
}

export function createTorus(r: number, tube: number, radSegs: number, tubSegs: number, mat: THREE.Material, px = 0, py = 0, pz = 0, rx = 0, ry = 0, rz = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(r, tube, radSegs, tubSegs), mat);
  mesh.position.set(px, py, pz);
  mesh.rotation.set(rx, ry, rz);
  return applyShadow(mesh, mat);
}

export function placeProp(
  parent: THREE.Group,
  worldSlug: 'graveyard' | 'forest' | 'frozen' | 'castle',
  propId: string,
  fallbackFn: () => THREE.Object3D,
  transform: Transform,
  isOccluder = false,
  occluderList?: THREE.Object3D[]
): THREE.Object3D {
  const assetId: ModelAssetId = `environment:${worldSlug}:${propId}`;
  const loadedModel = modelRegistry.cloneLoadedModel(assetId);
  const obj = loadedModel ?? fallbackFn();

  obj.position.copy(transform.position);
  if (transform.scale) obj.scale.copy(transform.scale);
  if (transform.rotationY) obj.rotation.y = transform.rotationY;
  if (transform.rotationX) obj.rotation.x = transform.rotationX;
  if (transform.rotationZ) obj.rotation.z = transform.rotationZ;

  if (isOccluder) {
    obj.userData.isOccluder = true;
    obj.userData.originalOpacity = 1.0;
    if (occluderList) occluderList.push(obj);
  }

  obj.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const mat = child.material;
      const isTransparent = Array.isArray(mat)
        ? mat.some((m) => m.transparent)
        : Boolean(mat && mat.transparent);
      if (!isTransparent) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    }
  });

  parent.add(obj);
  return obj;
}

export function placeAuthoredProp(
  parent: THREE.Group,
  worldSlug: 'graveyard' | 'forest' | 'frozen' | 'castle',
  prop: {
    propType: string;
    x: number;
    z: number;
    rotationY?: number;
    scale?: { x: number; y: number; z: number } | number;
    isOccluder?: boolean;
  },
  fallbackFn: () => THREE.Object3D,
  occluderList?: THREE.Object3D[]
): THREE.Object3D {
  const transform: Transform = {
    position: new THREE.Vector3(prop.x, 0, prop.z),
    rotationY: prop.rotationY,
    scale:
      typeof prop.scale === 'number'
        ? new THREE.Vector3(prop.scale, prop.scale, prop.scale)
        : prop.scale
          ? new THREE.Vector3(prop.scale.x, prop.scale.y, prop.scale.z)
          : undefined,
  };
  return placeProp(parent, worldSlug, prop.propType, fallbackFn, transform, prop.isOccluder ?? false, occluderList);
}

export function createGlowTexture(color: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const grad = ctx.createRadialGradient(64, 64, 2, 64, 64, 64);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.18, rgba(color, 0.95));
  grad.addColorStop(0.48, rgba(color, 0.35));
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function toCanvasCoords(wx: number, wz: number, dim = 1024): { x: number; y: number } {
  return {
    x: ((wx / ARENA_WIDTH) + 0.5) * dim,
    y: ((wz / ARENA_DEPTH) + 0.5) * dim,
  };
}

export function rgba(color: number, alpha: number): string {
  return `rgba(${(color >> 16) & 0xff}, ${(color >> 8) & 0xff}, ${color & 0xff}, ${alpha})`;
}

export function seeded(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}
