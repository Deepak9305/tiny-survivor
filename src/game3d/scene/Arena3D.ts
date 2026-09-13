import * as THREE from 'three';
import type { StageDefinition } from '../../types';
import { ARENA_DEPTH, ARENA_WIDTH, WORLD_CENTER_X, WORLD_CENTER_Y, logicalToWorld } from '../core/coordinates';
import { SharedResources, addMesh } from '../core/SharedResources';

type BiomePalette = { ground: number; grid: number; prop: number; accent: number; moon: number };

const PALETTES: Record<number, BiomePalette> = {
  1: { ground: 0x081a2b, grid: 0x1b4564, prop: 0x213953, accent: 0x78c8e9, moon: 0x9edfff },
  2: { ground: 0x0a201d, grid: 0x225e4d, prop: 0x244c3d, accent: 0x76e5ac, moon: 0xafffe0 },
  3: { ground: 0x10243d, grid: 0x315e85, prop: 0x557b9e, accent: 0x8fd9ff, moon: 0xc3efff },
  4: { ground: 0x251521, grid: 0x71313c, prop: 0x552839, accent: 0xffa05a, moon: 0xffcf88 },
};

export function paletteFor(stage: StageDefinition): BiomePalette {
  return PALETTES[stage.worldId] ?? PALETTES[1];
}

export function createArena(scene: THREE.Scene, stage: StageDefinition, resources: SharedResources, lowPerformanceMode: boolean): THREE.Group {
  const palette = paletteFor(stage);
  const arena = new THREE.Group();
  arena.name = 'arena';

  const ground = addMesh(
    arena,
    resources.plane('arena-ground', ARENA_WIDTH, ARENA_DEPTH),
    resources.standardMaterial(`ground-${stage.worldId}`, palette.ground, { roughness: 0.98 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.015;

  const grid = new THREE.GridHelper(ARENA_DEPTH, 30, palette.grid, palette.grid);
  grid.name = 'arena-grid';
  grid.scale.x = ARENA_WIDTH / ARENA_DEPTH;
  grid.position.y = 0.002;
  const gridMaterials = Array.isArray(grid.material) ? grid.material : [grid.material];
  for (const material of gridMaterials) {
    material.transparent = true;
    material.opacity = 0.18;
  }
  arena.add(grid);

  addMoon(arena, palette, stage.worldId);
  addBiomeProps(arena, stage, resources, palette, lowPerformanceMode);
  scene.add(arena);
  return arena;
}

function addMoon(parent: THREE.Group, palette: BiomePalette, worldId: number): void {
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(2.05, 12, 8),
    new THREE.MeshBasicMaterial({ color: palette.moon, transparent: true, opacity: 0.16, depthWrite: false }),
  );
  moon.position.set(worldId === 4 ? 7.5 : -7.5, 5.5, -18);
  parent.add(moon);
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(2.8, 12, 8),
    new THREE.MeshBasicMaterial({ color: palette.accent, transparent: true, opacity: 0.045, depthWrite: false }),
  );
  halo.position.copy(moon.position);
  parent.add(halo);
}

function addBiomeProps(parent: THREE.Group, stage: StageDefinition, resources: SharedResources, palette: BiomePalette, lowPerformanceMode: boolean): void {
  const count = lowPerformanceMode ? 38 : 64;
  const rng = seeded(stage.worldId * 104729 + stage.stageNumber * 9176);
  const positions: Array<{ x: number; z: number; scale: number; rotation: number }> = [];
  for (let index = 0; index < count; index += 1) {
    const logicalX = 34 + rng() * (1100 - 68);
    const logicalY = 44 + rng() * (1900 - 88);
    if (Math.abs(logicalX - WORLD_CENTER_X) < 150 && Math.abs(logicalY - WORLD_CENTER_Y) < 210) continue;
    const point = logicalToWorld(logicalX, logicalY);
    positions.push({ x: point.x, z: point.z, scale: 0.75 + rng() * 0.65, rotation: rng() * Math.PI });
  }

  if (stage.worldId === 1) {
    const markerGeometry = resources.geometry('grave-marker', () => new THREE.BoxGeometry(0.42, 0.86, 0.2));
    const markerMaterial = resources.standardMaterial('grave-marker', palette.prop);
    const markers = new THREE.InstancedMesh(markerGeometry, markerMaterial, positions.length);
    const matrix = new THREE.Matrix4();
    for (let index = 0; index < positions.length; index += 1) {
      const item = positions[index];
      matrix.compose(new THREE.Vector3(item.x, item.scale * 0.43, item.z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), item.rotation), new THREE.Vector3(item.scale, item.scale, item.scale));
      markers.setMatrixAt(index, matrix);
    }
    markers.instanceMatrix.needsUpdate = true;
    parent.add(markers);
    return;
  }

  const propGeometry = stage.worldId === 2
    ? resources.cone('forest-prop')
    : stage.worldId === 3 ? resources.octa('frozen-prop') : resources.ico('demon-prop');
  const propMaterial = resources.standardMaterial(`biome-prop-${stage.worldId}`, palette.prop, { roughness: 0.9 });
  const props = new THREE.InstancedMesh(propGeometry, propMaterial, positions.length);
  const matrix = new THREE.Matrix4();
  for (let index = 0; index < positions.length; index += 1) {
    const item = positions[index];
    const height = stage.worldId === 2 ? item.scale * 1.6 : item.scale;
    matrix.compose(new THREE.Vector3(item.x, height * 0.5, item.z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), item.rotation), new THREE.Vector3(item.scale * 0.75, height, item.scale * 0.75));
    props.setMatrixAt(index, matrix);
  }
  props.instanceMatrix.needsUpdate = true;
  parent.add(props);
}

function seeded(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}
