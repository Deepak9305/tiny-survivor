import * as THREE from 'three';
import type { StageDefinition } from '../../types';
import { getWorldMapSignature, WORLD_LAYOUT_VALIDATION } from './WorldLayout';
import { ARENA_DEPTH, ARENA_WIDTH, logicalToWorld } from '../core/coordinates';
import { SharedResources } from '../core/SharedResources';
import { biomeThemeFor, type BiomeTheme } from './BiomeTheme';

type Transform = { position: THREE.Vector3; scale: THREE.Vector3; rotationY?: number; rotationZ?: number };

export function paletteFor(stage: StageDefinition): BiomeTheme { return biomeThemeFor(stage); }

export function createArena(scene: THREE.Scene, stage: StageDefinition, resources: SharedResources, lowPerformanceMode: boolean): THREE.Group {
  const theme = biomeThemeFor(stage);
  const mapSeed = stage.mapSeed;
  const arena = new THREE.Group();
  arena.name = 'arena';

  const groundTexture = createGroundTexture(theme, mapSeed);
  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, map: groundTexture, roughness: 0.94, metalness: 0, emissive: theme.groundDeep, emissiveIntensity: 0.16 });
  const ground = new THREE.Mesh(resources.plane('arena-ground', ARENA_WIDTH, ARENA_DEPTH), groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.015;
  ground.receiveShadow = false;
  arena.add(ground);

  addGroundDetails(arena, mapSeed, resources, theme, lowPerformanceMode);
  addMoonAndHorizon(arena, resources, theme, stage.worldId);
  addBiomeProps(arena, stage, resources, theme, lowPerformanceMode);
  if (!lowPerformanceMode) addMist(arena, theme, stage.worldId);
  arena.userData.theme = theme;
  arena.userData.mapSeed = mapSeed;
  arena.userData.mapSignature = getWorldMapSignature(stage.worldId);
  arena.userData.mapValidation = WORLD_LAYOUT_VALIDATION;
  scene.add(arena);
  return arena;
}

function createGroundTexture(theme: BiomeTheme, seed: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  if (!context) return new THREE.CanvasTexture(canvas);
  context.fillStyle = `#${theme.ground.toString(16).padStart(6, '0')}`;
  context.fillRect(0, 0, 256, 256);
  const rng = seeded(seed);
  const detail = `#${theme.groundDetail.toString(16).padStart(6, '0')}`;
  context.globalAlpha = 0.18;
  for (let index = 0; index < 145; index += 1) {
    const x = rng() * 256;
    const y = rng() * 256;
    const radius = 0.4 + rng() * 2.8;
    context.fillStyle = detail;
    context.beginPath();
    context.ellipse(x, y, radius * (1.5 + rng()), radius, rng() * Math.PI, 0, Math.PI * 2);
    context.fill();
  }
  context.globalAlpha = 0.12;
  context.strokeStyle = detail;
  context.lineWidth = 0.8;
  for (let index = 0; index < 18; index += 1) {
    const x = rng() * 256;
    const y = rng() * 256;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + (rng() - 0.5) * 22, y + 2 + rng() * 12);
    context.stroke();
  }
  context.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4.5, 7.5);
  texture.anisotropy = 2;
  return texture;
}

function addGroundDetails(parent: THREE.Group, mapSeed: number, resources: SharedResources, theme: BiomeTheme, lowPerformanceMode: boolean): void {
  const rng = seeded(mapSeed + 77);
  const transforms: Transform[] = [];
  for (let index = 0; index < (lowPerformanceMode ? 16 : 28); index += 1) {
    const point = edgePoint(rng, 170);
    const position = logicalToWorld(point.x, point.y);
    transforms.push({ position: new THREE.Vector3(position.x, 0.035, position.z), scale: new THREE.Vector3(0.12 + rng() * 0.18, 0.04 + rng() * 0.08, 0.16 + rng() * 0.25), rotationY: rng() * Math.PI });
  }
  addInstances(parent, 'ground-stones', resources.ico('ground-stone'), resources.standardMaterial('ground-stone', theme.groundDetail, { roughness: 1 }), transforms);
}

function addMoonAndHorizon(parent: THREE.Group, resources: SharedResources, theme: BiomeTheme, worldId: number): void {
  const moonX = worldId === 4 ? 3 : -3;
  const moonZ = -13.3;
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: createGlowTexture(theme.accent), transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.position.set(moonX, 1.55, moonZ + 0.12);
  halo.scale.set(4.2, 4.2, 1);
  parent.add(halo);
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: createMoonTexture(theme), transparent: true, opacity: 0.95, depthWrite: false }));
  moon.position.set(moonX, 1.55, moonZ);
  moon.scale.set(2.65, 2.65, 1);
  parent.add(moon);

  const ridgeTransforms: Transform[] = [];
  for (let index = 0; index < 8; index += 1) {
    ridgeTransforms.push({ position: new THREE.Vector3(-ARENA_WIDTH / 2 - 1.2 + index * 3.6, 1.1 + (index % 3) * 0.35, -ARENA_DEPTH / 2 + 0.15), scale: new THREE.Vector3(2.6, 2.2 + (index % 2) * 0.9, 1), rotationY: index * 0.7 });
  }
  addInstances(parent, `horizon-ridge-${worldId}`, resources.cone(`horizon-ridge-${worldId}`), resources.basicMaterial(`horizon-ridge-${worldId}`, theme.groundDeep, { transparent: true, opacity: 0.84 }), ridgeTransforms);
}

function createGlowTexture(color: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  if (!context) return new THREE.CanvasTexture(canvas);
  const gradient = context.createRadialGradient(64, 64, 2, 64, 64, 64);
  gradient.addColorStop(0, rgba(color, 0.22));
  gradient.addColorStop(0.42, rgba(color, 0.09));
  gradient.addColorStop(1, rgba(color, 0));
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createMoonTexture(theme: BiomeTheme): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  if (!context) return new THREE.CanvasTexture(canvas);
  const moonGradient = context.createRadialGradient(47, 42, 4, 64, 64, 62);
  moonGradient.addColorStop(0, rgba(theme.moon, 0.98));
  moonGradient.addColorStop(0.72, rgba(theme.moon, 0.9));
  moonGradient.addColorStop(1, rgba(theme.moon, 0.66));
  context.fillStyle = moonGradient;
  context.beginPath();
  context.arc(64, 64, 56, 0, Math.PI * 2);
  context.fill();
  context.save();
  context.beginPath();
  context.arc(64, 64, 55, 0, Math.PI * 2);
  context.clip();
  context.fillStyle = rgba(theme.groundDeep, 0.16);
  context.beginPath();
  context.ellipse(42, 40, 11, 7, -0.35, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.ellipse(78, 58, 8, 12, 0.2, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.ellipse(53, 86, 14, 6, 0.1, 0, Math.PI * 2);
  context.fill();
  context.restore();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function rgba(color: number, alpha: number): string {
  return `rgba(${(color >> 16) & 0xff}, ${(color >> 8) & 0xff}, ${color & 0xff}, ${alpha})`;
}

function addBiomeProps(parent: THREE.Group, stage: StageDefinition, resources: SharedResources, theme: BiomeTheme, lowPerformanceMode: boolean): void {
  const rng = seeded(stage.mapSeed);
  switch (stage.worldId) {
    case 1: addGraveyard(parent, resources, theme, rng, lowPerformanceMode); break;
    case 2: addHauntedForest(parent, resources, theme, rng, lowPerformanceMode); break;
    case 3: addFrozenRuins(parent, resources, theme, rng, lowPerformanceMode); break;
    default: addDemonCastle(parent, resources, theme, rng, lowPerformanceMode); break;
  }
}

function addGraveyard(parent: THREE.Group, resources: SharedResources, theme: BiomeTheme, rng: () => number, low: boolean): void {
  const markers: Transform[] = [];
  const crosses: Transform[] = [];
  const broken: Transform[] = [];
  const caps: Transform[] = [];
  for (let index = 0; index < (low ? 18 : 30); index += 1) {
    const point = clusterPoint(rng, index, 185);
    const position = logicalToWorld(point.x, point.y);
    const scale = 0.65 + rng() * 0.38;
    markers.push({ position: new THREE.Vector3(position.x, 0.44 * scale, position.z), scale: new THREE.Vector3(0.42 * scale, 0.92 * scale, 0.18 * scale), rotationY: (rng() - 0.5) * 0.32 });
    caps.push({ position: new THREE.Vector3(position.x, 0.9 * scale, position.z - 0.01), scale: new THREE.Vector3(0.26 * scale, 0.18 * scale, 0.16 * scale), rotationY: (rng() - 0.5) * 0.32 });
    if (index % 3 !== 1) crosses.push({ position: new THREE.Vector3(position.x, 0.84 * scale, position.z - 0.015), scale: new THREE.Vector3(0.62 * scale, 0.12 * scale, 0.2 * scale), rotationY: (rng() - 0.5) * 0.32 });
    if (index % 5 === 0) broken.push({ position: new THREE.Vector3(position.x + 0.16, 0.25, position.z + 0.04), scale: new THREE.Vector3(0.38, 0.16, 0.18), rotationZ: (rng() - 0.5) * 0.8 });
  }
  addInstances(parent, 'grave-markers', resources.box('grave-marker'), resources.standardMaterial('grave-marker', theme.prop, { roughness: 0.96 }), markers);
  addInstances(parent, 'grave-marker-caps', resources.ico('grave-marker-cap'), resources.standardMaterial('grave-marker-cap', theme.propAlt, { roughness: 0.9 }), caps);
  addInstances(parent, 'grave-crossbars', resources.box('grave-crossbar'), resources.standardMaterial('grave-crossbar', theme.propAlt, { roughness: 0.94 }), crosses);
  addInstances(parent, 'broken-graves', resources.box('broken-grave'), resources.standardMaterial('broken-grave', theme.prop, { roughness: 1 }), broken);

  const crypts: Transform[] = [];
  const trees: Transform[] = [];
  const branches: Transform[] = [];
  for (let index = 0; index < (low ? 4 : 7); index += 1) {
    const side = index % 2 === 0 ? -1 : 1;
    const x = side * (ARENA_WIDTH * 0.39 + rng() * 1.6);
    const z = -ARENA_DEPTH * 0.34 + rng() * ARENA_DEPTH * 0.7;
    crypts.push({ position: new THREE.Vector3(x, 0.54, z), scale: new THREE.Vector3(1.1, 1, 0.82), rotationY: rng() * 0.16 });
  }
  for (let index = 0; index < (low ? 4 : 7); index += 1) {
    const position = logicalToWorld(80 + rng() * 940, 90 + rng() * 1700);
    const height = 1.8 + rng() * 1.1;
    trees.push({ position: new THREE.Vector3(position.x, height / 2, position.z), scale: new THREE.Vector3(0.16 + rng() * 0.08, height, 0.16 + rng() * 0.08), rotationY: rng() * Math.PI });
    branches.push({ position: new THREE.Vector3(position.x + 0.12, height * 0.66, position.z), scale: new THREE.Vector3(0.11, 0.78, 0.11), rotationY: rng() * Math.PI, rotationZ: 0.72 });
  }
  addInstances(parent, 'crypts', resources.box('crypt'), resources.standardMaterial('crypt', theme.propAlt, { roughness: 0.92 }), crypts);
  addInstances(parent, 'dead-trees', resources.cylinder('dead-tree'), resources.standardMaterial('dead-tree', 0x172735, { roughness: 1 }), trees);
  addInstances(parent, 'dead-tree-branches', resources.cylinder('dead-tree-branch'), resources.standardMaterial('dead-tree-branch', 0x1f3040, { roughness: 1 }), branches);
  addGraveyardPath(parent, resources, theme, rng, low);
  addForegroundGraves(parent, resources, theme, rng, low);
  addForegroundTrees(parent, resources, low);
  addLanterns(parent, resources, theme);
  addFence(parent, resources, theme, -ARENA_WIDTH * 0.46, ARENA_WIDTH * 0.46, -ARENA_DEPTH * 0.44, low);
  addCandles(parent, resources, theme, rng, low);
}

function addGraveyardPath(parent: THREE.Group, resources: SharedResources, theme: BiomeTheme, rng: () => number, low: boolean): void {
  const stones: Transform[] = [];
  for (let index = 0; index < (low ? 10 : 16); index += 1) {
    const progress = index / 15;
    const z = 5.8 - progress * 14.4;
    const width = 0.62 + (1 - progress) * 0.32;
    stones.push({
      position: new THREE.Vector3((rng() - 0.5) * width, 0.055, z + (rng() - 0.5) * 0.34),
      scale: new THREE.Vector3(0.9 + rng() * 0.55, 0.07 + rng() * 0.05, 0.52 + rng() * 0.38),
      rotationY: (rng() - 0.5) * 0.24,
    });
  }
  addInstances(parent, 'graveyard-path-stones', resources.ico('graveyard-path-stone'), resources.standardMaterial('graveyard-path-stone', theme.propAlt, { roughness: 0.98 }), stones);
}

function addForegroundGraves(parent: THREE.Group, resources: SharedResources, theme: BiomeTheme, rng: () => number, low: boolean): void {
  const markers: Transform[] = [];
  const caps: Transform[] = [];
  const crosses: Transform[] = [];
  const count = low ? 5 : 9;
  for (let index = 0; index < count; index += 1) {
    const side = index % 2 === 0 ? -1 : 1;
    const x = side * (1.76 + rng() * 0.82);
    const z = 1.2 + rng() * 7.4;
    const scale = 0.92 + rng() * 0.3;
    markers.push({ position: new THREE.Vector3(x, 0.48 * scale, z), scale: new THREE.Vector3(0.46 * scale, 1.04 * scale, 0.2 * scale), rotationY: (rng() - 0.5) * 0.25 });
    caps.push({ position: new THREE.Vector3(x, 0.97 * scale, z - 0.015), scale: new THREE.Vector3(0.29 * scale, 0.2 * scale, 0.18 * scale), rotationY: (rng() - 0.5) * 0.25 });
    if (index % 3 !== 1) crosses.push({ position: new THREE.Vector3(x, 0.93 * scale, z - 0.03), scale: new THREE.Vector3(0.66 * scale, 0.1 * scale, 0.18 * scale), rotationY: (rng() - 0.5) * 0.25 });
  }
  addInstances(parent, 'foreground-graves', resources.box('foreground-grave'), resources.standardMaterial('foreground-grave', theme.prop, { roughness: 0.94 }), markers);
  addInstances(parent, 'foreground-grave-caps', resources.ico('foreground-grave-cap'), resources.standardMaterial('foreground-grave-cap', theme.propAlt, { roughness: 0.88 }), caps);
  addInstances(parent, 'foreground-grave-crossbars', resources.box('foreground-grave-crossbar'), resources.standardMaterial('foreground-grave-crossbar', theme.propAlt, { roughness: 0.92 }), crosses);
}

function addForegroundTrees(parent: THREE.Group, resources: SharedResources, low: boolean): void {
  const trunks: Transform[] = [];
  const branches: Transform[] = [];
  const count = low ? 3 : 5;
  for (let index = 0; index < count; index += 1) {
    const side = index % 2 === 0 ? -1 : 1;
    const x = side * (3.8 + (index % 3) * 0.34);
    const z = -0.9 + (index % 3) * 3.1;
    const height = 2.8 + (index % 2) * 0.7;
    trunks.push({ position: new THREE.Vector3(x, height / 2, z), scale: new THREE.Vector3(0.22, height, 0.2), rotationY: index * 0.7 });
    branches.push({ position: new THREE.Vector3(x + side * 0.32, height * 0.68, z), scale: new THREE.Vector3(0.14, 1.1, 0.14), rotationY: side * (0.55 + (index % 2) * 0.26), rotationZ: side * 0.82 });
    branches.push({ position: new THREE.Vector3(x - side * 0.28, height * 0.82, z + 0.04), scale: new THREE.Vector3(0.11, 0.86, 0.11), rotationY: -side * 0.74, rotationZ: -side * 0.72 });
  }
  const material = resources.standardMaterial('foreground-dead-tree', 0x0b1723, { roughness: 1 });
  addInstances(parent, 'foreground-dead-trees', resources.cylinder('foreground-dead-tree'), material, trunks);
  addInstances(parent, 'foreground-dead-branches', resources.cylinder('foreground-dead-branch'), material, branches);
}

function addLanterns(parent: THREE.Group, resources: SharedResources, theme: BiomeTheme): void {
  const positions = [-2.85, 2.85].flatMap((x) => [new THREE.Vector3(x, 0.72, 2.6), new THREE.Vector3(x * 0.94, 0.72, 5.4)]);
  const posts = positions.map((position) => ({ position, scale: new THREE.Vector3(0.1, 1.44, 0.1) }));
  const lamps = positions.map((position) => ({ position: new THREE.Vector3(position.x, 1.5, position.z), scale: new THREE.Vector3(0.3, 0.42, 0.3) }));
  addInstances(parent, 'graveyard-lantern-posts', resources.cylinder('graveyard-lantern-post'), resources.standardMaterial('graveyard-lantern-post', 0x263a4c, { roughness: 0.82, metalness: 0.28 }), posts);
  addInstances(parent, 'graveyard-lanterns', resources.ico('graveyard-lantern'), resources.basicMaterial('graveyard-lantern', theme.warm), lamps);
  const glowTexture = createGlowTexture(theme.warm);
  for (const position of positions) {
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, transparent: true, opacity: 0.42, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.position.set(position.x, 1.5, position.z + 0.02);
    glow.scale.set(1.2, 1.2, 1);
    parent.add(glow);
  }
  addRuinedArch(parent, resources, theme, 0, -8.4);
}

function addHauntedForest(parent: THREE.Group, resources: SharedResources, theme: BiomeTheme, rng: () => number, low: boolean): void {
  const trunks: Transform[] = [];
  const canopies: Transform[] = [];
  const mushrooms: Transform[] = [];
  const count = low ? 14 : 23;
  for (let index = 0; index < count; index += 1) {
    const point = edgePoint(rng, 130);
    const position = logicalToWorld(point.x, point.y);
    const height = 1.7 + rng() * 1.8;
    trunks.push({ position: new THREE.Vector3(position.x, height / 2, position.z), scale: new THREE.Vector3(0.16 + rng() * 0.1, height, 0.16 + rng() * 0.1), rotationY: rng() * Math.PI });
    canopies.push({ position: new THREE.Vector3(position.x, height + 0.25, position.z), scale: new THREE.Vector3(0.72 + rng() * 0.38, 1.1 + rng() * 0.5, 0.72 + rng() * 0.38), rotationY: rng() * Math.PI });
    if (index < count * 0.7) mushrooms.push({ position: new THREE.Vector3(position.x + (rng() - 0.5) * 0.8, 0.16, position.z + (rng() - 0.5) * 0.8), scale: new THREE.Vector3(0.22, 0.34, 0.22), rotationY: rng() * Math.PI });
  }
  addInstances(parent, 'forest-trunks', resources.cylinder('forest-trunk'), resources.standardMaterial('forest-trunk', 0x19382f, { roughness: 1 }), trunks);
  addInstances(parent, 'forest-canopies', resources.cone('forest-canopy'), resources.standardMaterial('forest-canopy', theme.prop, { roughness: 0.96 }), canopies);
  addInstances(parent, 'forest-mushrooms', resources.sphere('forest-mushroom'), resources.standardMaterial('forest-mushroom', theme.accent, { emissive: theme.accent, emissiveIntensity: 0.5, roughness: 0.6 }), mushrooms);
  addFence(parent, resources, theme, -ARENA_WIDTH * 0.46, ARENA_WIDTH * 0.46, ARENA_DEPTH * 0.42, low);
  addCandles(parent, resources, theme, rng, low);
}

function addFrozenRuins(parent: THREE.Group, resources: SharedResources, theme: BiomeTheme, rng: () => number, low: boolean): void {
  const pillars: Transform[] = [];
  const ice: Transform[] = [];
  for (let index = 0; index < (low ? 12 : 19); index += 1) {
    const point = edgePoint(rng, 145);
    const position = logicalToWorld(point.x, point.y);
    pillars.push({ position: new THREE.Vector3(position.x, 0.72 + rng() * 0.3, position.z), scale: new THREE.Vector3(0.34 + rng() * 0.22, 1.45 + rng() * 0.6, 0.34 + rng() * 0.22), rotationY: rng() * Math.PI });
    if (index < 16) ice.push({ position: new THREE.Vector3(position.x + 0.35, 0.62, position.z - 0.18), scale: new THREE.Vector3(0.22 + rng() * 0.22, 1.1 + rng() * 1, 0.22 + rng() * 0.22), rotationY: rng() * Math.PI, rotationZ: (rng() - 0.5) * 0.32 });
  }
  addInstances(parent, 'frozen-pillars', resources.cylinder('frozen-pillar'), resources.standardMaterial('frozen-pillar', theme.prop, { roughness: 0.42, metalness: 0.08 }), pillars);
  addInstances(parent, 'frozen-shards', resources.octa('frozen-shard'), resources.standardMaterial('frozen-shard', theme.propAlt, { emissive: theme.accent, emissiveIntensity: 0.28, roughness: 0.3, metalness: 0.1 }), ice);
  addRuinedArch(parent, resources, theme, -ARENA_WIDTH * 0.37, -ARENA_DEPTH * 0.38);
  addRuinedArch(parent, resources, theme, ARENA_WIDTH * 0.37, ARENA_DEPTH * 0.36);
}

function addDemonCastle(parent: THREE.Group, resources: SharedResources, theme: BiomeTheme, rng: () => number, low: boolean): void {
  const columns: Transform[] = [];
  const crystals: Transform[] = [];
  const cracks: Transform[] = [];
  for (let index = 0; index < (low ? 10 : 16); index += 1) {
    const point = edgePoint(rng, 130);
    const position = logicalToWorld(point.x, point.y);
    columns.push({ position: new THREE.Vector3(position.x, 0.95, position.z), scale: new THREE.Vector3(0.36 + rng() * 0.26, 1.9 + rng() * 0.9, 0.36 + rng() * 0.26), rotationY: rng() * Math.PI });
    if (index < 13) crystals.push({ position: new THREE.Vector3(position.x + 0.32, 0.7, position.z + 0.24), scale: new THREE.Vector3(0.24 + rng() * 0.18, 1.2 + rng() * 0.8, 0.24 + rng() * 0.18), rotationY: rng() * Math.PI, rotationZ: (rng() - 0.5) * 0.5 });
  }
  for (let index = 0; index < (low ? 4 : 7); index += 1) {
    const point = logicalToWorld(180 + rng() * 740, 180 + rng() * 1540);
    cracks.push({ position: new THREE.Vector3(point.x, 0.03, point.z), scale: new THREE.Vector3(1.3 + rng() * 1.8, 0.018, 0.06), rotationY: rng() * Math.PI });
  }
  addInstances(parent, 'castle-columns', resources.cylinder('castle-column'), resources.standardMaterial('castle-column', theme.prop, { roughness: 0.92, metalness: 0.16 }), columns);
  addInstances(parent, 'infernal-crystals', resources.octa('infernal-crystal'), resources.standardMaterial('infernal-crystal', theme.propAlt, { emissive: theme.warm, emissiveIntensity: 0.8, roughness: 0.32, metalness: 0.15 }), crystals);
  addInstances(parent, 'lava-cracks', resources.box('lava-crack'), resources.standardMaterial('lava-crack', theme.warm, { emissive: theme.warm, emissiveIntensity: 1.3, roughness: 0.4 }), cracks);
  addRuinedArch(parent, resources, theme, 0, -ARENA_DEPTH * 0.4);
  addCandles(parent, resources, theme, rng, low);
}

function addFence(parent: THREE.Group, resources: SharedResources, theme: BiomeTheme, left: number, right: number, z: number, low: boolean): void {
  const transforms: Transform[] = [];
  const count = low ? 7 : 11;
  for (let index = 0; index < count; index += 1) {
    const x = THREE.MathUtils.lerp(left, right, index / Math.max(1, count - 1));
    transforms.push({ position: new THREE.Vector3(x, 0.32, z), scale: new THREE.Vector3(0.1, 0.64, 0.1) });
  }
  addInstances(parent, 'boundary-fence-posts', resources.box('fence-post'), resources.standardMaterial('fence-post', theme.prop, { roughness: 1 }), transforms);
  const railSegments: Transform[] = [];
  for (let index = 0; index < 5; index += 1) {
    const segmentWidth = (right - left) / 5 * 0.72;
    const x = left + (index + 0.5) * (right - left) / 5;
    railSegments.push({ position: new THREE.Vector3(x, 0.45, z), scale: new THREE.Vector3(segmentWidth, 0.075, 0.075) });
    if (index % 2 === 0) railSegments.push({ position: new THREE.Vector3(x, 0.2, z), scale: new THREE.Vector3(segmentWidth, 0.075, 0.075) });
  }
  addInstances(parent, 'boundary-fence-rails', resources.box('fence-rail'), resources.standardMaterial('fence-rail', theme.propAlt, { roughness: 1 }), railSegments);
}

function addRuinedArch(parent: THREE.Group, resources: SharedResources, theme: BiomeTheme, x: number, z: number): void {
  const material = resources.standardMaterial('ruined-arch', theme.propAlt, { roughness: 0.95 });
  addInstances(parent, 'ruined-arch-pillars', resources.box('ruined-arch-pillar'), material, [
    { position: new THREE.Vector3(x - 0.78, 0.95, z), scale: new THREE.Vector3(0.34, 1.9, 0.4) },
    { position: new THREE.Vector3(x + 0.78, 0.95, z), scale: new THREE.Vector3(0.34, 1.9, 0.4) },
  ]);
  addInstances(parent, 'ruined-arch-lintel', resources.box('ruined-arch-lintel'), material, [{ position: new THREE.Vector3(x, 1.82, z), scale: new THREE.Vector3(1.9, 0.28, 0.42) }]);
}

function addCandles(parent: THREE.Group, resources: SharedResources, theme: BiomeTheme, rng: () => number, low: boolean): void {
  const candleTransforms: Transform[] = [];
  const flameTransforms: Transform[] = [];
  for (let index = 0; index < (low ? 4 : 7); index += 1) {
    const point = edgePoint(rng, 190);
    const position = logicalToWorld(point.x, point.y);
    candleTransforms.push({ position: new THREE.Vector3(position.x, 0.15, position.z), scale: new THREE.Vector3(0.08, 0.3, 0.08) });
    flameTransforms.push({ position: new THREE.Vector3(position.x, 0.42, position.z), scale: new THREE.Vector3(0.11, 0.22, 0.11), rotationY: rng() * Math.PI });
  }
  addInstances(parent, 'candle-wicks', resources.cylinder('candle-wick'), resources.standardMaterial('candle-wick', 0xc7d6dc, { roughness: 0.82 }), candleTransforms);
  addInstances(parent, 'candle-flames', resources.octa('candle-flame'), resources.standardMaterial('candle-flame', theme.warm, { emissive: theme.warm, emissiveIntensity: 2.1, roughness: 0.3 }), flameTransforms);
}

function addMist(parent: THREE.Group, theme: BiomeTheme, worldId: number): void {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 48;
  const context = canvas.getContext('2d');
  if (!context) return;
  const color = `#${theme.accent.toString(16).padStart(6, '0')}`;
  for (let index = 0; index < 5; index += 1) {
    const x = 12 + index * 26;
    const y = 14 + (index % 2) * 13;
    const gradient = context.createRadialGradient(x, y, 1, x, y, 20 + (index % 3) * 5);
    gradient.addColorStop(0, `${color}20`);
    gradient.addColorStop(1, `${color}00`);
    context.fillStyle = gradient;
    context.beginPath();
    context.ellipse(x, y, 25, 12, 0, 0, Math.PI * 2);
    context.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: worldId === 4 ? 0.18 : 0.13, depthWrite: false, blending: THREE.AdditiveBlending });
  for (let index = 0; index < 3; index += 1) {
    const mist = new THREE.Sprite(material);
    mist.name = `mist-${index}`;
    mist.position.set(-5 + index * 4.5, 0.16 + index * 0.04, -4 + (index % 2) * 6);
    mist.scale.set(5.8, 1.1, 1);
    mist.userData.baseX = mist.position.x;
    mist.userData.phase = index * 1.8;
    parent.add(mist);
  }
}

function addInstances(parent: THREE.Group, name: string, geometry: THREE.BufferGeometry, material: THREE.Material, transforms: Transform[]): THREE.InstancedMesh | undefined {
  if (transforms.length === 0) return undefined;
  const instances = new THREE.InstancedMesh(geometry, material, transforms.length);
  instances.name = name;
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const axis = new THREE.Vector3(0, 1, 0);
  for (let index = 0; index < transforms.length; index += 1) {
    const item = transforms[index];
    quaternion.setFromAxisAngle(axis, item.rotationY ?? 0);
    if (item.rotationZ) quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), item.rotationZ));
    matrix.compose(item.position, quaternion, item.scale);
    instances.setMatrixAt(index, matrix);
  }
  instances.instanceMatrix.needsUpdate = true;
  instances.frustumCulled = true;
  instances.castShadow = false;
  instances.receiveShadow = false;
  parent.add(instances);
  return instances;
}

function clusterPoint(rng: () => number, index: number, padding: number): { x: number; y: number } {
  const side = index % 4;
  if (side === 0) return { x: padding + rng() * 170, y: 120 + rng() * 1660 };
  if (side === 1) return { x: 1100 - padding - rng() * 170, y: 120 + rng() * 1660 };
  if (side === 2) return { x: 150 + rng() * 800, y: padding + rng() * 180 };
  return { x: 150 + rng() * 800, y: 1900 - padding - rng() * 180 };
}

function edgePoint(rng: () => number, padding: number): { x: number; y: number } {
  const side = Math.floor(rng() * 4);
  if (side === 0) return { x: padding * 0.45 + rng() * padding, y: 70 + rng() * 1760 };
  if (side === 1) return { x: 1100 - padding * 0.45 - rng() * padding, y: 70 + rng() * 1760 };
  if (side === 2) return { x: 50 + rng() * 1000, y: padding * 0.45 + rng() * padding };
  return { x: 50 + rng() * 1000, y: 1900 - padding * 0.45 - rng() * padding };
}

function seeded(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}
