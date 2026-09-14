import * as THREE from 'three';
import type { StageDefinition } from '../../types';
import { getWorldMapSignature, WORLD_LAYOUT_VALIDATION } from './WorldLayout';
import { ARENA_DEPTH, ARENA_WIDTH, logicalToWorld } from '../core/coordinates';
import { SharedResources, addMesh } from '../core/SharedResources';
import { biomeThemeFor, type BiomeTheme } from './BiomeTheme';
import { modelRegistry, type ModelAssetId } from '../assets/ModelRegistry';

type Transform = {
  position: THREE.Vector3;
  scale?: THREE.Vector3;
  rotationY?: number;
  rotationX?: number;
  rotationZ?: number;
};

export function paletteFor(stage: StageDefinition): BiomeTheme {
  return biomeThemeFor(stage);
}

export function createArena(
  scene: THREE.Scene,
  stage: StageDefinition,
  resources: SharedResources,
  lowPerformanceMode: boolean
): THREE.Group {
  const theme = biomeThemeFor(stage);
  const mapSeed = stage.mapSeed;
  const arena = new THREE.Group();
  arena.name = 'arena';

  // 1. Rich Ground
  const groundTexture = createGroundTexture(theme, mapSeed, stage.worldId);
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: groundTexture,
    roughness: stage.worldId === 3 ? 0.6 : 0.88,
    metalness: stage.worldId === 4 ? 0.2 : 0.05,
    emissive: theme.groundDeep,
    emissiveIntensity: stage.worldId === 4 ? 0.35 : 0.18,
  });
  const ground = new THREE.Mesh(resources.plane('arena-ground', ARENA_WIDTH, ARENA_DEPTH), groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.015;
  ground.receiveShadow = false;
  arena.add(ground);

  // 2. Ground Details & Path
  addGroundDetails(arena, mapSeed, resources, theme, stage.worldId, lowPerformanceMode);

  // 3. Moon & Horizon Sky Composition
  addMoonAndHorizon(arena, resources, theme, stage.worldId);

  // 4. Biome Props (Authored Zones & ModelRegistry Integration)
  addBiomeProps(arena, stage, resources, theme, lowPerformanceMode);

  // 5. Atmospheric Ground Mist
  if (!lowPerformanceMode) {
    addMist(arena, theme, stage.worldId);
  }

  arena.userData.theme = theme;
  arena.userData.mapSeed = mapSeed;
  arena.userData.mapSignature = getWorldMapSignature(stage.worldId);
  arena.userData.mapValidation = WORLD_LAYOUT_VALIDATION;
  scene.add(arena);
  return arena;
}

// -------------------------------------------------------------
// GROUND TEXTURE SYNTHESIS (512x512 High-Detail Procedural Map)
// -------------------------------------------------------------
function createGroundTexture(_theme: BiomeTheme, seed: number, _worldId: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const rng = seeded(seed);

  // 1. Base Warm Golden Sand / Dirt Terrain (Survivor.io Wasteland)
  ctx.fillStyle = '#dba03b';
  ctx.fillRect(0, 0, 512, 512);

  // Dirt color patches and natural variation
  for (let i = 0; i < 60; i++) {
    const x = rng() * 512;
    const y = rng() * 512;
    const rad = 20 + rng() * 50;
    const grad = ctx.createRadialGradient(x, y, 2, x, y, rad);
    grad.addColorStop(0, '#c68a28');
    grad.addColorStop(1, 'transparent');
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Asphalt Highway / Urban Road (Diagonal cutting through)
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#5c554e';
  ctx.beginPath();
  ctx.moveTo(0, 70);
  ctx.lineTo(512, 270);
  ctx.lineTo(512, 512);
  ctx.lineTo(0, 420);
  ctx.closePath();
  ctx.fill();

  // Asphalt grain / subtle texture
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = '#3a342e';
  for (let i = 0; i < 80; i++) {
    const px = rng() * 512;
    const py = 120 + rng() * 340;
    ctx.fillRect(px, py, 4 + rng() * 8, 4 + rng() * 8);
  }

  // 3. Concrete Curb Trim (Separating Road from Dirt)
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#d9d2c7';
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(0, 70);
  ctx.lineTo(512, 270);
  ctx.stroke();

  // Subtle dark drop-shadow under curb
  ctx.strokeStyle = 'rgba(40, 30, 20, 0.45)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 76);
  ctx.lineTo(512, 276);
  ctx.stroke();

  // 4. Pedestrian Crosswalk Zebra Stripes (Bold white bars)
  ctx.save();
  ctx.fillStyle = '#ede8e1';
  ctx.globalAlpha = 0.95;
  const numStripes = 9;
  for (let i = 0; i < numStripes; i++) {
    const t = (i + 0.5) / numStripes;
    const px = 50 + t * 250;
    const py = 125 + t * 105;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(0.38); // Match 0.38 rad road angle
    ctx.fillRect(-12, -42, 24, 84);
    ctx.restore();
  }
  ctx.restore();

  // 5. Yellow Dashed Center Lane Dividers
  ctx.save();
  ctx.strokeStyle = '#f5c531';
  ctx.lineWidth = 7;
  ctx.setLineDash([30, 24]);
  ctx.beginPath();
  ctx.moveTo(0, 245);
  ctx.lineTo(512, 445);
  ctx.stroke();
  ctx.restore();

  // 6. Scattered road pebbles/cracks
  ctx.globalAlpha = 0.3;
  ctx.strokeStyle = '#2b2622';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    let cx = 100 + rng() * 300;
    let cy = 200 + rng() * 200;
    ctx.moveTo(cx, cy);
    cx += (rng() - 0.5) * 30;
    cy += (rng() - 0.5) * 30;
    ctx.lineTo(cx, cy);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3.5, 6.5);
  texture.anisotropy = 4;
  return texture;
}

// -------------------------------------------------------------
// GROUND DETAILS: RUBBER TIRES, BONES & TURRET PROP
// -------------------------------------------------------------
function addGroundDetails(
  parent: THREE.Group,
  mapSeed: number,
  resources: SharedResources,
  theme: BiomeTheme,
  _worldId: number,
  lowPerformanceMode: boolean
): void {
  const rng = seeded(mapSeed + 77);

  // 1. Scatter 3D Rubber Car Tires (from Survivor.io screenshot)
  const tireMat = resources.standardMaterial('survivor-tire-mat', 0x222225, { roughness: 0.9, metalness: 0.1 });
  const tireCount = lowPerformanceMode ? 6 : 14;
  for (let i = 0; i < tireCount; i++) {
    const point = edgePoint(rng, 140);
    const pos = logicalToWorld(point.x, point.y);
    const tire = new THREE.Mesh(resources.torus('car-tire'), tireMat);
    tire.rotation.x = Math.PI / 2;
    tire.position.set(pos.x, 0.04, pos.z);
    tire.scale.set(0.42 + rng() * 0.1, 0.42 + rng() * 0.1, 0.48);
    parent.add(tire);
  }

  // 2. Scatter Bones (from Survivor.io screenshot)
  const boneMat = resources.standardMaterial('survivor-bone-mat', 0xe8e2d4, { roughness: 0.85 });
  const boneCount = lowPerformanceMode ? 8 : 16;
  for (let i = 0; i < boneCount; i++) {
    const point = edgePoint(rng, 100);
    const pos = logicalToWorld(point.x, point.y);
    const bone = new THREE.Mesh(resources.cylinder('bone-shaft'), boneMat);
    bone.rotation.x = Math.PI / 2;
    bone.rotation.z = rng() * Math.PI;
    bone.position.set(pos.x, 0.02, pos.z);
    bone.scale.set(0.04, 0.32 + rng() * 0.1, 0.04);
    parent.add(bone);
  }

  // 3. Autonomous Defense Turret Prop (Standing on the roadside as in the screenshot)
  const turret = new THREE.Group();
  turret.name = 'survivor-defense-turret';
  turret.position.set(-3.6, 0, 1.2);
  turret.rotation.y = 0.55;

  const turretLegMat = resources.standardMaterial('turret-leg-mat', 0x3b4856, { metalness: 0.6, roughness: 0.4 });
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const leg = addMesh(turret, resources.box(`turret-leg-${i}`), turretLegMat);
    leg.scale.set(0.12, 0.45, 0.12);
    leg.position.set(Math.cos(angle) * 0.32, 0.15, Math.sin(angle) * 0.32);
    leg.rotation.z = Math.cos(angle) * 0.45;
    leg.rotation.x = Math.sin(angle) * 0.45;
  }

  const turretHeadMat = resources.standardMaterial('turret-head-mat', 0x768898, { metalness: 0.5, roughness: 0.35 });
  const turretHead = addMesh(turret, resources.cylinder('turret-head'), turretHeadMat);
  turretHead.scale.set(0.42, 0.34, 0.42);
  turretHead.position.y = 0.44;

  const nozzleMat = resources.standardMaterial('turret-nozzle-mat', 0xff2828, { emissive: 0xff1515, emissiveIntensity: 2.2, roughness: 0.2 });
  const nozzle = addMesh(turret, resources.cylinder('turret-nozzle'), nozzleMat);
  nozzle.scale.set(0.16, 0.38, 0.16);
  nozzle.position.set(0.12, 0.62, 0.08);
  nozzle.rotation.x = -0.38;

  parent.add(turret);

  // 4. Ground embedded stones
  const stoneCount = lowPerformanceMode ? 10 : 20;
  for (let i = 0; i < stoneCount; i++) {
    const point = edgePoint(rng, 170);
    const pos = logicalToWorld(point.x, point.y);
    const stone = new THREE.Mesh(
      resources.ico('ground-detail-stone'),
      resources.standardMaterial('ground-detail-mat', theme.groundDetail, { roughness: 0.95 })
    );
    stone.position.set(pos.x, 0.03, pos.z);
    stone.scale.set(0.18 + rng() * 0.22, 0.05 + rng() * 0.08, 0.2 + rng() * 0.25);
    stone.rotation.y = rng() * Math.PI;
    parent.add(stone);
  }
}

// -------------------------------------------------------------
// MOON & HORIZON SKYLINE
// -------------------------------------------------------------
function addMoonAndHorizon(
  parent: THREE.Group,
  resources: SharedResources,
  theme: BiomeTheme,
  worldId: number
): void {
  const moonX = worldId === 4 ? 3.2 : -3.2;
  const moonZ = -13.5;

  // Soft atmospheric moon halo
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createGlowTexture(theme.moon),
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  halo.position.set(moonX, 2.0, moonZ + 0.15);
  halo.scale.set(5.2, 5.2, 1);
  parent.add(halo);

  // Celestial Moon Disc
  const moon = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createMoonTexture(theme),
      transparent: true,
      opacity: 0.96,
      depthWrite: false,
    })
  );
  moon.position.set(moonX, 2.0, moonZ);
  moon.scale.set(2.8, 2.8, 1);
  parent.add(moon);

  // Distant Mountain & Castle Silhouette Ridge
  const ridgeCount = 10;
  for (let i = 0; i < ridgeCount; i++) {
    const ridge = new THREE.Mesh(
      resources.cone(`horizon-ridge-${worldId}`),
      resources.basicMaterial(`horizon-ridge-mat-${worldId}`, theme.groundDeep, {
        transparent: true,
        opacity: 0.88,
      })
    );
    ridge.position.set(-ARENA_WIDTH / 2 - 2.5 + i * 3.2, 1.3 + (i % 3) * 0.4, -ARENA_DEPTH / 2 + 0.1);
    ridge.scale.set(2.8, 2.6 + (i % 2) * 1.1, 1.2);
    ridge.rotation.y = i * 0.6;
    parent.add(ridge);
  }
}

function createGlowTexture(color: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const grad = ctx.createRadialGradient(64, 64, 2, 64, 64, 64);
  grad.addColorStop(0, rgba(color, 0.4));
  grad.addColorStop(0.35, rgba(color, 0.15));
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createMoonTexture(theme: BiomeTheme): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const grad = ctx.createRadialGradient(48, 44, 4, 64, 64, 60);
  grad.addColorStop(0, rgba(theme.moon, 0.98));
  grad.addColorStop(0.7, rgba(theme.moon, 0.88));
  grad.addColorStop(1, rgba(theme.moon, 0.6));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(64, 64, 56, 0, Math.PI * 2);
  ctx.fill();

  // Subtle craters & cloud strata
  ctx.save();
  ctx.beginPath();
  ctx.arc(64, 64, 55, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = rgba(theme.groundDeep, 0.18);
  ctx.beginPath();
  ctx.ellipse(42, 42, 12, 8, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(76, 56, 10, 14, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(54, 84, 15, 7, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function rgba(color: number, alpha: number): string {
  return `rgba(${(color >> 16) & 0xff}, ${(color >> 8) & 0xff}, ${color & 0xff}, ${alpha})`;
}

// -------------------------------------------------------------
// BIOME PROP SPAWNING (MODEL REGISTRY PREFERRED)
// -------------------------------------------------------------
function addBiomeProps(
  parent: THREE.Group,
  stage: StageDefinition,
  resources: SharedResources,
  theme: BiomeTheme,
  low: boolean
): void {
  const rng = seeded(stage.mapSeed);
  switch (stage.worldId) {
    case 1:
      buildGraveyardArena(parent, resources, theme, rng, low);
      break;
    case 2:
      buildHauntedForestArena(parent, resources, theme, rng, low);
      break;
    case 3:
      buildFrozenRuinsArena(parent, resources, theme, rng, low);
      break;
    default:
      buildDemonCastleArena(parent, resources, theme, rng, low);
      break;
  }
}

/**
 * Instantiates an environment prop from the ModelRegistry if loaded as GLB,
 * or falls back to a procedural geometry group.
 */
function placeProp(
  parent: THREE.Group,
  worldSlug: 'graveyard' | 'forest' | 'frozen' | 'castle',
  propId: string,
  fallbackFn: () => THREE.Object3D,
  transform: Transform
): THREE.Object3D {
  const assetId: ModelAssetId = `environment:${worldSlug}:${propId}`;
  const loadedModel = modelRegistry.cloneLoadedModel(assetId);
  const obj = loadedModel ?? fallbackFn();

  obj.position.copy(transform.position);
  if (transform.scale) obj.scale.copy(transform.scale);
  if (transform.rotationY) obj.rotation.y = transform.rotationY;
  if (transform.rotationX) obj.rotation.x = transform.rotationX;
  if (transform.rotationZ) obj.rotation.z = transform.rotationZ;

  parent.add(obj);
  return obj;
}

// -------------------------------------------------------------
// WORLD 1: GRAVEYARD ARENA (Authored Layout & Named Regions)
// -------------------------------------------------------------
function buildGraveyardArena(
  parent: THREE.Group,
  resources: SharedResources,
  theme: BiomeTheme,
  rng: () => number,
  low: boolean
): void {
  const worldSlug = 'graveyard';
  const mStone = resources.standardMaterial('gy-stone', theme.prop, { roughness: 0.9 });
  const mStoneAlt = resources.standardMaterial('gy-stone-alt', theme.propAlt, { roughness: 0.85 });
  const mWood = resources.standardMaterial('gy-wood', 0x1a2634, { roughness: 0.95 });
  const mIron = resources.standardMaterial('gy-iron', 0x223040, { roughness: 0.6, metalness: 0.5 });
  const mWarm = resources.standardMaterial('gy-warm', theme.warm, { emissive: theme.warm, emissiveIntensity: 2.0 });

  // 1. NORTH GATE & RUIN ZONE (Top background landmarks)
  placeProp(parent, worldSlug, 'chapel_ruin', () => {
    const g = new THREE.Group();
    g.add(createBox(3.2, 2.6, 0.4, mStone));
    return g;
  }, { position: new THREE.Vector3(0, 1.3, -11.5), scale: new THREE.Vector3(1.4, 1.4, 1.4) });

  placeProp(parent, worldSlug, 'stone_arch', () => {
    const g = new THREE.Group();
    g.add(createBox(2.8, 0.4, 0.5, mStoneAlt, 0, 2.2, 0));
    g.add(createBox(0.4, 2.2, 0.4, mStone, -1.2, 1.1, 0));
    g.add(createBox(0.4, 2.2, 0.4, mStone, 1.2, 1.1, 0));
    return g;
  }, { position: new THREE.Vector3(0, 0, -9.2), scale: new THREE.Vector3(1.3, 1.3, 1.3) });

  placeProp(parent, worldSlug, 'iron_gate', () => {
    const g = new THREE.Group();
    g.add(createBox(2.0, 1.4, 0.08, mIron, 0, 0.7, 0));
    return g;
  }, { position: new THREE.Vector3(0, 0, -7.8) });

  // 2. CRYPT ZONE (Noble Mausoleum in West, Ancient Crypt in East)
  placeProp(parent, worldSlug, 'crypt_large', () => {
    const g = new THREE.Group();
    g.add(createBox(2.6, 2.2, 3.2, mStone, 0, 1.1, 0));
    return g;
  }, { position: new THREE.Vector3(-4.8, 0, -4.5), scale: new THREE.Vector3(1.2, 1.2, 1.2), rotationY: 0.25 });

  placeProp(parent, worldSlug, 'crypt_small', () => {
    const g = new THREE.Group();
    g.add(createBox(1.6, 1.4, 2.2, mStone, 0, 0.7, 0));
    return g;
  }, { position: new THREE.Vector3(4.8, 0, -3.8), scale: new THREE.Vector3(1.15, 1.15, 1.15), rotationY: -0.22 });

  // 3. STATUES & LANDMARKS
  placeProp(parent, worldSlug, 'angel_statue', () => {
    const g = new THREE.Group();
    g.add(createBox(0.6, 0.5, 0.6, mStone, 0, 0.25, 0));
    g.add(createCylinder(0.25, 0.35, 1.1, 7, mStoneAlt, 0, 1.05, 0));
    return g;
  }, { position: new THREE.Vector3(-3.2, 0, 0.8), scale: new THREE.Vector3(1.25, 1.25, 1.25), rotationY: 0.6 });

  placeProp(parent, worldSlug, 'angel_statue', () => {
    const g = new THREE.Group();
    g.add(createBox(0.6, 0.5, 0.6, mStone, 0, 0.25, 0));
    g.add(createCylinder(0.25, 0.35, 1.1, 7, mStoneAlt, 0, 1.05, 0));
    return g;
  }, { position: new THREE.Vector3(3.2, 0, 1.2), scale: new THREE.Vector3(1.25, 1.25, 1.25), rotationY: -0.6 });

  // 4. CENTRAL COMBAT LANE: Path of Cobblestone Slabs & Lantern Posts
  const pathZ = [5.5, 3.2, 1.0, -1.2, -3.4, -5.6];
  for (const z of pathZ) {
    placeProp(parent, worldSlug, 'path_slab', () => {
      const g = new THREE.Group();
      g.add(createBox(1.1, 0.08, 0.8, mStoneAlt, 0, 0.04, 0));
      return g;
    }, { position: new THREE.Vector3((rng() - 0.5) * 0.4, 0.02, z + (rng() - 0.5) * 0.2), scale: new THREE.Vector3(1.1, 1, 1.1) });
  }

  // Lantern posts with warm light
  const lanternPositions = [
    new THREE.Vector3(-2.6, 0, 4.2),
    new THREE.Vector3(2.6, 0, 4.2),
    new THREE.Vector3(-2.8, 0, -1.5),
    new THREE.Vector3(2.8, 0, -1.5),
  ];
  for (const pos of lanternPositions) {
    placeProp(parent, worldSlug, 'lantern_post', () => {
      const g = new THREE.Group();
      g.add(createCylinder(0.05, 0.08, 1.8, 6, mIron, 0, 0.9, 0));
      g.add(createOcta(0.14, mWarm, 0, 1.85, 0));
      return g;
    }, { position: pos });

    // Warm lantern glow sprite
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createGlowTexture(theme.warm),
        transparent: true,
        opacity: 0.52,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    glow.position.set(pos.x, 1.85, pos.z + 0.02);
    glow.scale.set(1.4, 1.4, 1);
    parent.add(glow);
  }

  // 5. WEST_GRAVES & EAST_GRAVES: Clustered Authentic Plots
  const graveVariants = ['grave_a', 'grave_b', 'grave_cross', 'grave_broken'];
  const graveCount = low ? 16 : 28;
  for (let i = 0; i < graveCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const x = side * (2.2 + (i % 4) * 0.75 + rng() * 0.4);
    const z = -6.5 + (i / graveCount) * 14.5 + (rng() - 0.5) * 0.6;
    const variant = graveVariants[i % graveVariants.length];
    placeProp(parent, worldSlug, variant, () => {
      const g = new THREE.Group();
      g.add(createBox(0.45, 0.85, 0.18, mStone, 0, 0.42, 0));
      return g;
    }, {
      position: new THREE.Vector3(x, 0, z),
      scale: new THREE.Vector3(0.85 + rng() * 0.3, 0.85 + rng() * 0.3, 0.85 + rng() * 0.3),
      rotationY: (rng() - 0.5) * 0.35,
    });
  }

  // 6. GNARLED PERIMETER DEAD TREES
  const treePositions = [
    { pos: new THREE.Vector3(-5.8, 0, -8.0), rot: 0.2, type: 'dead_tree_a' },
    { pos: new THREE.Vector3(5.8, 0, -8.0), rot: -0.3, type: 'dead_tree_b' },
    { pos: new THREE.Vector3(-6.2, 0, 1.5), rot: 0.45, type: 'dead_tree_twisted' },
    { pos: new THREE.Vector3(6.2, 0, 2.0), rot: -0.4, type: 'dead_tree_twisted' },
    { pos: new THREE.Vector3(-5.5, 0, 7.5), rot: 0.1, type: 'dead_tree_a' },
    { pos: new THREE.Vector3(5.5, 0, 7.5), rot: -0.2, type: 'dead_tree_b' },
  ];
  for (const t of treePositions) {
    placeProp(parent, worldSlug, t.type, () => {
      const g = new THREE.Group();
      g.add(createCylinder(0.22, 0.38, 2.8, 6, mWood, 0, 1.4, 0));
      return g;
    }, { position: t.pos, scale: new THREE.Vector3(1.2, 1.2, 1.2), rotationY: t.rot });
  }

  // 7. WROUGHT IRON FENCE PERIMETER
  for (let f = 0; f < 5; f++) {
    placeProp(parent, worldSlug, 'iron_fence', () => {
      const g = new THREE.Group();
      g.add(createBox(2.6, 0.8, 0.05, mIron, 0, 0.4, 0));
      return g;
    }, { position: new THREE.Vector3(-5.2 + f * 2.6, 0, -9.0) });
  }

  // 8. FOREGROUND DEPTH FRAME (Enters bottom 10-20% of frame)
  placeProp(parent, worldSlug, 'grave_cross', () => {
    const g = new THREE.Group();
    g.add(createBox(0.18, 1.1, 0.18, mStone, 0, 0.55, 0));
    return g;
  }, { position: new THREE.Vector3(-2.2, 0, 8.2), scale: new THREE.Vector3(1.35, 1.35, 1.35), rotationY: 0.4 });

  placeProp(parent, worldSlug, 'grave_broken', () => {
    const g = new THREE.Group();
    g.add(createBox(0.42, 0.45, 0.18, mStone, 0, 0.22, 0));
    return g;
  }, { position: new THREE.Vector3(2.3, 0, 8.4), scale: new THREE.Vector3(1.3, 1.3, 1.3), rotationY: -0.35 });

  placeProp(parent, worldSlug, 'candle_cluster', () => {
    const g = new THREE.Group();
    g.add(createCylinder(0.04, 0.04, 0.3, 6, mStoneAlt, 0, 0.15, 0));
    return g;
  }, { position: new THREE.Vector3(-1.4, 0, 7.8) });
}

// -------------------------------------------------------------
// WORLD 2: HAUNTED FOREST ARENA
// -------------------------------------------------------------
function buildHauntedForestArena(
  parent: THREE.Group,
  resources: SharedResources,
  theme: BiomeTheme,
  rng: () => number,
  low: boolean
): void {
  const worldSlug = 'forest';
  const mBark = resources.standardMaterial('fo-bark', 0x221814, { roughness: 0.95 });
  const mWood = resources.standardMaterial('fo-wood', 0x362418, { roughness: 0.9 });
  const mStone = resources.standardMaterial('fo-stone', theme.prop, { roughness: 0.85 });
  const mPurple = resources.standardMaterial('fo-purple', theme.accent, { emissive: theme.accent, emissiveIntensity: 1.5 });
  const mTeal = resources.standardMaterial('fo-teal', 0x44ffcc, { emissive: 0x22cbaa, emissiveIntensity: 1.5 });

  // 1. LANDMARK: THE GREAT CURSED TREE (Towering over North edge)
  placeProp(parent, worldSlug, 'cursed_tree_giant', () => {
    const g = new THREE.Group();
    g.add(createCylinder(0.9, 1.6, 4.5, 8, mBark, 0, 2.25, 0));
    return g;
  }, { position: new THREE.Vector3(0, 0, -8.5), scale: new THREE.Vector3(1.35, 1.35, 1.35) });

  // 2. ANCIENT SPIRIT SHRINE
  placeProp(parent, worldSlug, 'ancient_shrine', () => {
    const g = new THREE.Group();
    g.add(createBox(2.4, 0.22, 0.4, mWood, 0, 2.25, 0));
    return g;
  }, { position: new THREE.Vector3(-4.5, 0, -3.2), scale: new THREE.Vector3(1.2, 1.2, 1.2), rotationY: 0.4 });

  // 3. STANDING STONES & SPIRIT LANTERNS
  placeProp(parent, worldSlug, 'standing_stone', () => {
    const g = new THREE.Group();
    g.add(createBox(0.65, 2.4, 0.4, mStone, 0, 1.2, 0));
    return g;
  }, { position: new THREE.Vector3(4.2, 0, -2.8), scale: new THREE.Vector3(1.2, 1.2, 1.2), rotationY: -0.45 });

  placeProp(parent, worldSlug, 'standing_stone', () => {
    const g = new THREE.Group();
    g.add(createBox(0.65, 2.4, 0.4, mStone, 0, 1.2, 0));
    return g;
  }, { position: new THREE.Vector3(-3.8, 0, 3.5), scale: new THREE.Vector3(1.1, 1.1, 1.1), rotationY: 0.3 });

  // 4. HIGH DENSITY TWISTED TREES (Along outer perimeter, keeping center clear)
  const forestTrees = [
    { pos: new THREE.Vector3(-5.5, 0, -6.0), type: 'tree_twisted_a' },
    { pos: new THREE.Vector3(5.5, 0, -6.0), type: 'tree_twisted_b' },
    { pos: new THREE.Vector3(-6.2, 0, 0.5), type: 'tree_twisted_c' },
    { pos: new THREE.Vector3(6.2, 0, 0.5), type: 'tree_twisted_a' },
    { pos: new THREE.Vector3(-5.8, 0, 6.2), type: 'tree_twisted_b' },
    { pos: new THREE.Vector3(5.8, 0, 6.2), type: 'tree_twisted_c' },
  ];
  for (const t of forestTrees) {
    placeProp(parent, worldSlug, t.type, () => {
      const g = new THREE.Group();
      g.add(createCylinder(0.3, 0.55, 2.2, 6, mBark, 0, 1.1, 0));
      return g;
    }, { position: t.pos, scale: new THREE.Vector3(1.2, 1.2, 1.2), rotationY: rng() * Math.PI });
  }

  // 5. FALLEN LOGS, ROOTS & STUMPS
  placeProp(parent, worldSlug, 'fallen_log', () => {
    const g = new THREE.Group();
    g.add(createCylinder(0.32, 0.36, 3.2, 7, mBark, 0, 0.3, 0));
    return g;
  }, { position: new THREE.Vector3(-3.8, 0, -6.8), rotationY: 0.6 });

  placeProp(parent, worldSlug, 'tree_stump', () => {
    const g = new THREE.Group();
    g.add(createCylinder(0.55, 0.75, 0.75, 7, mBark, 0, 0.38, 0));
    return g;
  }, { position: new THREE.Vector3(3.6, 0, 5.2) });

  // 6. BIOLUMINESCENT MUSHROOMS & SPIRIT POSTS
  const shroomCount = low ? 8 : 15;
  for (let i = 0; i < shroomCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const x = side * (2.8 + rng() * 3.2);
    const z = -7.0 + rng() * 14.5;
    const type = i % 2 === 0 ? 'mushroom_cluster_a' : 'mushroom_cluster_b';
    placeProp(parent, worldSlug, type, () => {
      const g = new THREE.Group();
      g.add(createSphere(0.25, 6, i % 2 === 0 ? mPurple : mTeal, 0, 0.3, 0));
      return g;
    }, { position: new THREE.Vector3(x, 0, z), scale: new THREE.Vector3(1.1, 1.1, 1.1) });
  }

  // 7. FOREGROUND DEPTH
  placeProp(parent, worldSlug, 'tree_twisted_a', () => {
    const g = new THREE.Group();
    g.add(createCylinder(0.3, 0.55, 2.2, 6, mBark, 0, 1.1, 0));
    return g;
  }, { position: new THREE.Vector3(-3.2, 0, 8.6), scale: new THREE.Vector3(1.3, 1.3, 1.3), rotationY: 0.4 });

  placeProp(parent, worldSlug, 'mossy_rock', () => {
    const g = new THREE.Group();
    g.add(createSphere(0.55, 6, mStone, 0, 0.4, 0));
    return g;
  }, { position: new THREE.Vector3(2.8, 0, 8.2), scale: new THREE.Vector3(1.2, 1.2, 1.2) });
}

// -------------------------------------------------------------
// WORLD 3: FROZEN RUINS ARENA
// -------------------------------------------------------------
function buildFrozenRuinsArena(
  parent: THREE.Group,
  resources: SharedResources,
  theme: BiomeTheme,
  rng: () => number,
  low: boolean
): void {
  const worldSlug = 'frozen';
  const mStone = resources.standardMaterial('fz-stone', theme.prop, { roughness: 0.75, metalness: 0.2 });
  const mIce = resources.standardMaterial('fz-ice', theme.accent, { roughness: 0.2, emissive: theme.accent, emissiveIntensity: 1.3 });

  // 1. LANDMARK: GREAT FROST GATE (North background)
  placeProp(parent, worldSlug, 'temple_gate_arch', () => {
    const g = new THREE.Group();
    g.add(createBox(3.8, 0.65, 0.8, mStone, 0, 3.4, 0));
    return g;
  }, { position: new THREE.Vector3(0, 0, -8.8), scale: new THREE.Vector3(1.3, 1.3, 1.3) });

  // 2. FROZEN WARRIOR MONUMENT & ALTAR
  placeProp(parent, worldSlug, 'frozen_statue', () => {
    const g = new THREE.Group();
    g.add(createBox(0.8, 0.6, 0.8, mStone, 0, 0.3, 0));
    return g;
  }, { position: new THREE.Vector3(-3.8, 0, -3.5), scale: new THREE.Vector3(1.3, 1.3, 1.3), rotationY: 0.35 });

  placeProp(parent, worldSlug, 'frozen_altar', () => {
    const g = new THREE.Group();
    g.add(createBox(1.8, 0.75, 1.1, mStone, 0, 0.38, 0));
    return g;
  }, { position: new THREE.Vector3(3.8, 0, -3.2), scale: new THREE.Vector3(1.2, 1.2, 1.2), rotationY: -0.3 });

  // 3. FLUTED PILLARS & TOXIC ICICLES
  const pillarPositions = [
    new THREE.Vector3(-5.2, 0, -6.5),
    new THREE.Vector3(5.2, 0, -6.5),
    new THREE.Vector3(-5.8, 0, 1.0),
    new THREE.Vector3(5.8, 0, 1.0),
    new THREE.Vector3(-5.0, 0, 6.8),
    new THREE.Vector3(5.0, 0, 6.8),
  ];
  for (let i = 0; i < pillarPositions.length; i++) {
    const type = i % 3 === 0 ? 'frozen_pillar_a' : i % 3 === 1 ? 'frozen_pillar_b' : 'broken_pillar';
    placeProp(parent, worldSlug, type, () => {
      const g = new THREE.Group();
      g.add(createCylinder(0.35, 0.4, 2.6, 8, mStone, 0, 1.3, 0));
      return g;
    }, { position: pillarPositions[i], scale: new THREE.Vector3(1.15, 1.15, 1.15) });
  }

  // 4. GIANT ICE CRYSTAL CLUSTERS
  placeProp(parent, worldSlug, 'ice_crystal_huge', () => {
    const g = new THREE.Group();
    g.add(createOcta(0.85, mIce, 0, 1.8, 0));
    return g;
  }, { position: new THREE.Vector3(-4.4, 0, 3.8), scale: new THREE.Vector3(1.3, 1.3, 1.3) });

  placeProp(parent, worldSlug, 'ice_crystal_cluster', () => {
    const g = new THREE.Group();
    g.add(createOcta(0.48, mIce, 0, 0.8, 0));
    return g;
  }, { position: new THREE.Vector3(4.4, 0, 3.8), scale: new THREE.Vector3(1.2, 1.2, 1.2) });

  // 5. FOREGROUND DEPTH
  placeProp(parent, worldSlug, 'broken_pillar', () => {
    const g = new THREE.Group();
    g.add(createCylinder(0.36, 0.4, 1.1, 8, mStone, 0, 0.55, 0));
    return g;
  }, { position: new THREE.Vector3(-2.8, 0, 8.4), scale: new THREE.Vector3(1.3, 1.3, 1.3), rotationY: 0.3 });

  placeProp(parent, worldSlug, 'ice_crystal_cluster', () => {
    const g = new THREE.Group();
    g.add(createOcta(0.48, mIce, 0, 0.8, 0));
    return g;
  }, { position: new THREE.Vector3(2.6, 0, 8.2), scale: new THREE.Vector3(1.25, 1.25, 1.25) });
}

// -------------------------------------------------------------
// WORLD 4: DEMON CASTLE ARENA
// -------------------------------------------------------------
function buildDemonCastleArena(
  parent: THREE.Group,
  resources: SharedResources,
  theme: BiomeTheme,
  rng: () => number,
  low: boolean
): void {
  const worldSlug = 'castle';
  const mObsidian = resources.standardMaterial('cs-obsidian', theme.prop, { roughness: 0.5, metalness: 0.6 });
  const mFire = resources.standardMaterial('cs-fire', theme.warm, { emissive: theme.warm, emissiveIntensity: 2.2 });
  const mRed = resources.standardMaterial('cs-red', theme.accent, { emissive: theme.accent, emissiveIntensity: 1.8 });

  // 1. LANDMARK: GATES OF DIS & DEMON THRONE
  placeProp(parent, worldSlug, 'infernal_gate', () => {
    const g = new THREE.Group();
    g.add(createBox(4.4, 0.8, 0.9, mObsidian, 0, 4.0, 0));
    return g;
  }, { position: new THREE.Vector3(0, 0, -8.8), scale: new THREE.Vector3(1.3, 1.3, 1.3) });

  placeProp(parent, worldSlug, 'demon_throne_silhouette', () => {
    const g = new THREE.Group();
    g.add(createBox(1.4, 2.6, 0.3, mObsidian, 0, 1.5, 0));
    return g;
  }, { position: new THREE.Vector3(0, 0, -11.2), scale: new THREE.Vector3(1.4, 1.4, 1.4) });

  // 2. DEMON STATUES & ALTAR
  placeProp(parent, worldSlug, 'demon_statue', () => {
    const g = new THREE.Group();
    g.add(createSphere(0.45, 6, mObsidian, 0, 1.4, 0));
    return g;
  }, { position: new THREE.Vector3(-4.0, 0, -3.5), scale: new THREE.Vector3(1.3, 1.3, 1.3), rotationY: 0.4 });

  placeProp(parent, worldSlug, 'demon_altar', () => {
    const g = new THREE.Group();
    g.add(createBox(2.0, 0.8, 1.2, mObsidian, 0, 0.4, 0));
    return g;
  }, { position: new THREE.Vector3(4.0, 0, -3.2), scale: new THREE.Vector3(1.25, 1.25, 1.25), rotationY: -0.3 });

  // 3. FLUTED OBSIDIAN PILLARS & HELLFIRE BRAZIERS
  const brazierPositions = [
    new THREE.Vector3(-3.2, 0, 4.0),
    new THREE.Vector3(3.2, 0, 4.0),
    new THREE.Vector3(-3.5, 0, -1.8),
    new THREE.Vector3(3.5, 0, -1.8),
  ];
  for (const pos of brazierPositions) {
    placeProp(parent, worldSlug, 'fire_brazier', () => {
      const g = new THREE.Group();
      g.add(createCylinder(0.55, 0.35, 0.4, 7, mObsidian, 0, 1.3, 0));
      g.add(createOcta(0.32, mFire, 0, 1.55, 0));
      return g;
    }, { position: pos, scale: new THREE.Vector3(1.15, 1.15, 1.15) });

    // Roaring Fire Glow Sprite
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createGlowTexture(theme.warm),
        transparent: true,
        opacity: 0.65,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    glow.position.set(pos.x, 1.6, pos.z + 0.02);
    glow.scale.set(1.8, 1.8, 1);
    parent.add(glow);
  }

  // 4. SPIKED WALLS & BLOOD CRYSTALS
  placeProp(parent, worldSlug, 'blood_crystal_cluster', () => {
    const g = new THREE.Group();
    g.add(createOcta(0.45, mRed, 0, 0.8, 0));
    return g;
  }, { position: new THREE.Vector3(-5.2, 0, 1.5), scale: new THREE.Vector3(1.3, 1.3, 1.3) });

  placeProp(parent, worldSlug, 'blood_crystal_cluster', () => {
    const g = new THREE.Group();
    g.add(createOcta(0.45, mRed, 0, 0.8, 0));
    return g;
  }, { position: new THREE.Vector3(5.2, 0, 1.5), scale: new THREE.Vector3(1.3, 1.3, 1.3) });

  // 5. FOREGROUND DEPTH
  placeProp(parent, worldSlug, 'fire_brazier', () => {
    const g = new THREE.Group();
    g.add(createCylinder(0.55, 0.35, 0.4, 7, mObsidian, 0, 1.3, 0));
    return g;
  }, { position: new THREE.Vector3(-2.8, 0, 8.5), scale: new THREE.Vector3(1.3, 1.3, 1.3) });

  placeProp(parent, worldSlug, 'iron_spike', () => {
    const g = new THREE.Group();
    g.add(createCone(0.12, 0.9, 4, mObsidian, 0, 0.45, 0));
    return g;
  }, { position: new THREE.Vector3(2.5, 0, 8.2), scale: new THREE.Vector3(1.2, 1.2, 1.2) });
}

// -------------------------------------------------------------
// ATMOSPHERIC MIST
// -------------------------------------------------------------
function addMist(parent: THREE.Group, theme: BiomeTheme, worldId: number): void {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 48;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const color = `#${theme.accent.toString(16).padStart(6, '0')}`;
  for (let i = 0; i < 5; i++) {
    const x = 12 + i * 26;
    const y = 14 + (i % 2) * 14;
    const grad = ctx.createRadialGradient(x, y, 1, x, y, 22);
    grad.addColorStop(0, `${color}28`);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(x, y, 26, 13, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: worldId === 4 ? 0.22 : 0.16,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  for (let i = 0; i < 4; i++) {
    const mist = new THREE.Sprite(material);
    mist.name = `mist-${i}`;
    mist.position.set(-6 + i * 4.2, 0.2 + (i % 2) * 0.08, -5 + (i % 3) * 5);
    mist.scale.set(6.8, 1.4, 1);
    parent.add(mist);
  }
}

// -------------------------------------------------------------
// SHAPE CREATION HELPERS
// -------------------------------------------------------------
function createBox(sx: number, sy: number, sz: number, mat: THREE.Material, px = 0, py = 0, pz = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
  mesh.position.set(px, py, pz);
  return mesh;
}

function createCylinder(rt: number, rb: number, h: number, s: number, mat: THREE.Material, px = 0, py = 0, pz = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, s), mat);
  mesh.position.set(px, py, pz);
  return mesh;
}

function createSphere(r: number, s: number, mat: THREE.Material, px = 0, py = 0, pz = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, s, s), mat);
  mesh.position.set(px, py, pz);
  return mesh;
}

function createOcta(r: number, mat: THREE.Material, px = 0, py = 0, pz = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(r), mat);
  mesh.position.set(px, py, pz);
  return mesh;
}

function createCone(r: number, h: number, s: number, mat: THREE.Material, px = 0, py = 0, pz = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.ConeGeometry(r, h, s), mat);
  mesh.position.set(px, py, pz);
  return mesh;
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
