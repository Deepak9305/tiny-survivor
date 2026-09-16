import * as THREE from 'three';
import type { BiomeTheme } from './BiomeTheme';
import { ARENA_DEPTH, ARENA_WIDTH } from '../core/coordinates';
import { SharedResources } from '../core/SharedResources';

type VisionPatch = {
  center: THREE.Vector2;
  radius: number;
  sprites: THREE.Sprite[];
  baseOpacity: number;
};

export type ArenaFlavorController = {
  update: (playerWorldPosition: THREE.Vector3, delta: number) => void;
  visionPatches: ReadonlyArray<{ x: number; z: number; radius: number }>;
};

function rgba(color: number, alpha: number): string {
  return `rgba(${(color >> 16) & 0xff}, ${(color >> 8) & 0xff}, ${color & 0xff}, ${alpha})`;
}

function makeSoftTexture(inner: string, middle: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(64, 64, 5, 64, 64, 62);
    gradient.addColorStop(0, inner);
    gradient.addColorStop(0.48, middle);
    gradient.addColorStop(0.82, middle.replace(/,\s*([\d.]+)\)$/, ', 0.12)'));
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function clutterPalette(worldId: number, theme: BiomeTheme): { primary: number; secondary: number; emissive: number } {
  if (worldId === 1) return { primary: 0x53644f, secondary: 0x786b4e, emissive: 0x000000 };
  if (worldId === 2) return { primary: 0x315e44, secondary: 0x6f8c4b, emissive: 0x102a1d };
  if (worldId === 3) return { primary: 0xb4d9e8, secondary: 0x6fa8bf, emissive: 0x153f56 };
  return { primary: 0x3b2528, secondary: 0x6e3028, emissive: theme.warm };
}

function createClutter(
  parent: THREE.Group,
  resources: SharedResources,
  theme: BiomeTheme,
  worldId: number,
  rng: () => number,
  lowPerformanceMode: boolean,
): void {
  const palette = clutterPalette(worldId, theme);
  const count = lowPerformanceMode ? 26 : 54;
  const secondaryCount = lowPerformanceMode ? 12 : 26;
  const geometry = worldId === 3 ? resources.octa('arena-flavor-ice') : resources.cone(`arena-flavor-clutter-${worldId}`);
  const material = resources.standardMaterial(`arena-flavor-primary-${worldId}`, palette.primary, {
    roughness: worldId === 3 ? 0.38 : 0.92,
    metalness: worldId === 3 ? 0.18 : 0.02,
    emissive: palette.emissive,
    emissiveIntensity: worldId === 4 ? 0.18 : worldId === 2 ? 0.08 : 0,
  });
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.name = `arena-biome-clutter-${worldId}`;
  mesh.frustumCulled = true;
  const dummy = new THREE.Object3D();

  for (let i = 0; i < count; i += 1) {
    const sideBias = rng() < 0.62;
    const x = sideBias
      ? (rng() < 0.5 ? -1 : 1) * (ARENA_WIDTH * (0.28 + rng() * 0.19))
      : (rng() - 0.5) * ARENA_WIDTH * 0.76;
    const z = sideBias
      ? (rng() - 0.5) * ARENA_DEPTH * 0.84
      : (rng() < 0.5 ? -1 : 1) * ARENA_DEPTH * (0.27 + rng() * 0.18);
    const size = worldId === 3 ? 0.28 + rng() * 0.48 : 0.24 + rng() * 0.44;
    dummy.position.set(x, worldId === 3 ? size * 0.38 : size * 0.42, z);
    dummy.rotation.set((rng() - 0.5) * 0.18, rng() * Math.PI * 2, (rng() - 0.5) * 0.24);
    if (worldId === 3) dummy.scale.set(size * 0.55, size * 1.7, size * 0.55);
    else if (worldId === 4) dummy.scale.set(size * 0.42, size * 1.9, size * 0.42);
    else dummy.scale.set(size * 0.34, size * (1.3 + rng() * 0.9), size * 0.34);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  parent.add(mesh);

  const accentGeometry = worldId === 4 ? resources.box('arena-flavor-ember-stone') : resources.ico(`arena-flavor-accent-${worldId}`);
  const accentMaterial = resources.standardMaterial(`arena-flavor-secondary-${worldId}`, palette.secondary, {
    roughness: worldId === 3 ? 0.42 : 0.86,
    metalness: worldId === 3 ? 0.22 : 0.04,
    emissive: worldId === 4 ? 0x55120d : worldId === 3 ? 0x0b3346 : 0,
    emissiveIntensity: worldId === 4 ? 0.5 : worldId === 3 ? 0.18 : 0,
  });
  const accents = new THREE.InstancedMesh(accentGeometry, accentMaterial, secondaryCount);
  accents.name = `arena-biome-accents-${worldId}`;
  for (let i = 0; i < secondaryCount; i += 1) {
    const x = (rng() - 0.5) * ARENA_WIDTH * 0.9;
    const z = (rng() - 0.5) * ARENA_DEPTH * 0.88;
    const size = 0.18 + rng() * 0.42;
    dummy.position.set(x, size * 0.18, z);
    dummy.rotation.set(rng() * 0.4, rng() * Math.PI * 2, rng() * 0.35);
    dummy.scale.set(size * 1.3, size * (worldId === 4 ? 0.55 : 0.8), size);
    dummy.updateMatrix();
    accents.setMatrixAt(i, dummy.matrix);
  }
  accents.instanceMatrix.needsUpdate = true;
  parent.add(accents);
}

function createVisionPatches(
  parent: THREE.Group,
  theme: BiomeTheme,
  worldId: number,
  rng: () => number,
  lowPerformanceMode: boolean,
): VisionPatch[] {
  const texture = makeSoftTexture(
    rgba(worldId === 4 ? 0x2d0a0a : worldId === 3 ? 0xc5e8f5 : worldId === 2 ? 0x18382d : 0x1d2730, 0.78),
    rgba(worldId === 4 ? 0x5d1510 : worldId === 3 ? 0x85b8cb : worldId === 2 ? 0x2d5a45 : 0x43566a, 0.42),
  );
  const patchCount = lowPerformanceMode ? 2 : 4;
  const patches: VisionPatch[] = [];

  for (let index = 0; index < patchCount; index += 1) {
    const angle = (index / patchCount) * Math.PI * 2 + (rng() - 0.5) * 0.75;
    const radial = 5.8 + rng() * 6.4;
    const center = new THREE.Vector2(Math.cos(angle) * radial, Math.sin(angle) * radial * 0.72);
    const radius = 2.8 + rng() * 1.8;
    const sprites: THREE.Sprite[] = [];
    const spriteCount = lowPerformanceMode ? 2 : 4;
    const baseOpacity = worldId === 2 ? 0.33 : worldId === 1 ? 0.28 : 0.22;

    for (let s = 0; s < spriteCount; s += 1) {
      const material = new THREE.SpriteMaterial({
        map: texture,
        color: worldId === 4 ? 0x7a251b : worldId === 3 ? 0xbce3ef : worldId === 2 ? 0x496f59 : 0x65788b,
        transparent: true,
        opacity: baseOpacity * (0.78 + rng() * 0.35),
        depthWrite: false,
        depthTest: true,
      });
      const sprite = new THREE.Sprite(material);
      const localAngle = rng() * Math.PI * 2;
      const localRadius = rng() * radius * 0.58;
      sprite.position.set(center.x + Math.cos(localAngle) * localRadius, 0.9 + rng() * 0.6, center.y + Math.sin(localAngle) * localRadius);
      const width = radius * (1.5 + rng() * 0.75);
      sprite.scale.set(width, width * 0.55, 1);
      sprite.renderOrder = 4;
      parent.add(sprite);
      sprites.push(sprite);
    }

    patches.push({ center, radius, sprites, baseOpacity });
  }

  return patches;
}

export function createArenaFlavor(
  parent: THREE.Group,
  resources: SharedResources,
  theme: BiomeTheme,
  worldId: number,
  rng: () => number,
  lowPerformanceMode: boolean,
): ArenaFlavorController {
  createClutter(parent, resources, theme, worldId, rng, lowPerformanceMode);
  const patches = createVisionPatches(parent, theme, worldId, rng, lowPerformanceMode);
  let phase = 0;

  return {
    visionPatches: patches.map((patch) => ({ x: patch.center.x, z: patch.center.y, radius: patch.radius })),
    update: (playerWorldPosition, delta) => {
      phase += delta;
      for (let index = 0; index < patches.length; index += 1) {
        const patch = patches[index];
        const distance = Math.hypot(playerWorldPosition.x - patch.center.x, playerWorldPosition.z - patch.center.y);
        const playerInside = distance < patch.radius * 0.82;
        const targetOpacity = patch.baseOpacity * (playerInside ? 0.42 : 1);
        for (let s = 0; s < patch.sprites.length; s += 1) {
          const sprite = patch.sprites[s];
          const material = sprite.material as THREE.SpriteMaterial;
          const breathe = 0.92 + Math.sin(phase * 0.8 + index * 1.7 + s) * 0.08;
          material.opacity = THREE.MathUtils.lerp(material.opacity, targetOpacity * breathe, Math.min(1, delta * 2.8));
          sprite.position.x += Math.sin(phase * 0.23 + s * 2.1) * delta * 0.025;
        }
      }
    },
  };
}
