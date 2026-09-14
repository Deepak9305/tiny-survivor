import * as THREE from 'three';
import type { StageDefinition } from '../../types';
import { getWorldMapSignature, WORLD_LAYOUT_VALIDATION } from './WorldLayout';
import { ARENA_DEPTH, ARENA_WIDTH, WORLD_HEIGHT, WORLD_WIDTH } from '../core/coordinates';
import { SharedResources } from '../core/SharedResources';
import { biomeThemeFor, type BiomeTheme } from './BiomeTheme';
import { buildGraveyardArena, buildGraveyardGroundTexture } from './worlds/GraveyardArena';
import { buildHauntedForestArena, buildForestGroundTexture } from './worlds/HauntedForestArena';
import { buildFrozenRuinsArena, buildFrozenGroundTexture } from './worlds/FrozenRuinsArena';
import { buildDemonCastleArena, buildCastleGroundTexture } from './worlds/DemonCastleArena';

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

  // Registered occluder meshes for camera occlusion fading
  const occluders: THREE.Object3D[] = [];

  // 1. Authored 1024x1024 Ground Texture for all 4 worlds
  let groundTexture: THREE.CanvasTexture;
  switch (stage.worldId) {
    case 1:
      groundTexture = buildGraveyardGroundTexture(theme, mapSeed);
      break;
    case 2:
      groundTexture = buildForestGroundTexture(theme, mapSeed);
      break;
    case 3:
      groundTexture = buildFrozenGroundTexture(theme, mapSeed);
      break;
    case 4:
    default:
      groundTexture = buildCastleGroundTexture(theme, mapSeed);
      break;
  }

  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: groundTexture,
    roughness: stage.worldId === 3 ? 0.55 : (stage.worldId === 1 ? 0.72 : (stage.worldId === 4 ? 0.78 : 0.88)),
    metalness: stage.worldId === 4 ? 0.22 : (stage.worldId === 3 ? 0.18 : (stage.worldId === 1 ? 0.1 : 0.05)),
    emissive: stage.worldId === 1 ? 0x162432 : (stage.worldId === 4 ? 0x220a0a : theme.groundDeep),
    emissiveIntensity: stage.worldId === 4 ? 0.38 : (stage.worldId === 1 ? 0.28 : (stage.worldId === 3 ? 0.25 : 0.18)),
  });

  const ground = new THREE.Mesh(resources.plane('arena-ground', ARENA_WIDTH, ARENA_DEPTH), groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.015;
  ground.receiveShadow = false;
  arena.add(ground);

  // 2. Camera-Relative Distant Moon & Horizon Ridge
  const skyGroup = createDistantSky(arena, resources, theme, stage.worldId);

  // 3. Authored Biome World Landmarks & Architecture
  let worldResult: { lanternPositions: THREE.Vector3[] };
  const rng = () => {
    let s = mapSeed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  };
  const mapRng = rng();

  switch (stage.worldId) {
    case 1:
      worldResult = buildGraveyardArena(arena, resources, theme, mapRng, lowPerformanceMode, occluders);
      break;
    case 2:
      worldResult = buildHauntedForestArena(arena, resources, theme, mapRng, lowPerformanceMode, occluders);
      break;
    case 3:
      worldResult = buildFrozenRuinsArena(arena, resources, theme, mapRng, lowPerformanceMode, occluders);
      break;
    case 4:
    default:
      worldResult = buildDemonCastleArena(arena, resources, theme, mapRng, lowPerformanceMode, occluders);
      break;
  }

  // 4. Dynamic Lantern Light Pool (Budget: 4 PointLights in normal, 1 in low performance)
  const dynamicLightPool = createDynamicLightPool(arena, theme, lowPerformanceMode, worldResult.lanternPositions);

  // 5. Rich Natural Alpha Ground Mist
  let mistUpdate: ((delta: number) => void) | undefined;
  if (!lowPerformanceMode) {
    mistUpdate = createAtmosphericMist(arena, theme, stage.worldId);
  }

  // 6. UserData wiring for simulation loop
  arena.userData.theme = theme;
  arena.userData.mapSeed = mapSeed;
  arena.userData.mapSignature = getWorldMapSignature(stage.worldId);
  arena.userData.mapValidation = WORLD_LAYOUT_VALIDATION;
  arena.userData.occluders = occluders;
  arena.userData.lanternPositions = worldResult.lanternPositions;
  arena.userData.update = (cameraPos: THREE.Vector3, playerPos: THREE.Vector3, delta: number) => {
    // Keep distant sky anchored to camera's horizontal traversal so moon stays in the sky
    if (skyGroup) {
      skyGroup.position.x = cameraPos.x * 0.75;
    }
    // Reposition light pool to closest lanterns
    dynamicLightPool.update(playerPos);
    // Drift mist
    if (mistUpdate) {
      mistUpdate(delta);
    }
  };

  scene.add(arena);
  return arena;
}

// -------------------------------------------------------------
// DYNAMIC LANTERN LIGHT POOL (Tracks Nearest Lanterns to Player)
// -------------------------------------------------------------
function createDynamicLightPool(
  parent: THREE.Group,
  theme: BiomeTheme,
  lowPerformanceMode: boolean,
  lanterns: THREE.Vector3[]
): { update: (playerPos: THREE.Vector3) => void } {
  const poolSize = lowPerformanceMode ? 1 : Math.min(4, Math.max(1, lanterns.length));
  const lights: THREE.PointLight[] = [];

  for (let i = 0; i < poolSize; i++) {
    const light = new THREE.PointLight(theme.warm, 1.8, 8.5, 1.8);
    light.name = `dynamic-lantern-light-${i}`;
    parent.add(light);
    lights.push(light);
  }

  return {
    update: (playerPos: THREE.Vector3) => {
      if (lanterns.length === 0 || lights.length === 0) return;
      // Sort lanterns by distance to player
      const sorted = lanterns
        .slice()
        .sort((a, b) => a.distanceToSquared(playerPos) - b.distanceToSquared(playerPos));

      for (let i = 0; i < lights.length; i++) {
        const target = sorted[i] ?? sorted[0];
        lights[i].position.lerp(target, 0.15);
      }
    },
  };
}

// -------------------------------------------------------------
// DISTANT HORIZON & CELESTIAL MOON
// -------------------------------------------------------------
function createDistantSky(
  parent: THREE.Group,
  resources: SharedResources,
  theme: BiomeTheme,
  worldId: number
): THREE.Group {
  const skyGroup = new THREE.Group();
  skyGroup.name = 'distant-sky-horizon';

  // Celestial Moon (Very distant, camera-relative)
  const moonZ = -38.0;
  const moonY = 19.5;
  const moonMesh = new THREE.Mesh(
    new THREE.SphereGeometry(3.8, 16, 16),
    new THREE.MeshBasicMaterial({
      color: theme.moon,
      transparent: true,
      opacity: 0.96,
    })
  );
  moonMesh.position.set(-9.5, moonY, moonZ);
  skyGroup.add(moonMesh);

  // Soft Moon Glow Halo
  const haloCanvas = document.createElement('canvas');
  haloCanvas.width = 128;
  haloCanvas.height = 128;
  const hCtx = haloCanvas.getContext('2d');
  if (hCtx) {
    const grad = hCtx.createRadialGradient(64, 64, 4, 64, 64, 64);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, rgba(theme.moon, 0.8));
    grad.addColorStop(0.7, rgba(theme.accent, 0.25));
    grad.addColorStop(1, 'transparent');
    hCtx.fillStyle = grad;
    hCtx.fillRect(0, 0, 128, 128);
  }
  const haloTex = new THREE.CanvasTexture(haloCanvas);
  const haloMat = new THREE.SpriteMaterial({
    map: haloTex,
    color: theme.moon,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const haloSprite = new THREE.Sprite(haloMat);
  haloSprite.position.set(-9.5, moonY, moonZ + 0.2);
  haloSprite.scale.set(15.0, 15.0, 1);
  skyGroup.add(haloSprite);

  // Layered Distant Horizon Silhouettes (Layer 1: Far, Layer 2: Mid)
  const ridgeCount = 14;
  const ridgeZ = -35.0;
  const ridgeMat = resources.basicMaterial(`horizon-ridge-mat-${worldId}`, theme.groundDeep, {
    transparent: true,
    opacity: 0.88,
  });

  for (let i = 0; i < ridgeCount; i++) {
    const rx = -ARENA_WIDTH * 0.7 + i * 3.2;
    const ry = 4.2 + (i % 4) * 0.9;
    const rz = ridgeZ + (i % 2) * 1.8;
    const spire = new THREE.Mesh(resources.cone(`distant-spire-${worldId}`), ridgeMat);
    spire.position.set(rx, ry, rz);
    spire.scale.set(3.8, 7.5 + (i % 3) * 2.2, 1.6);
    spire.rotation.y = i * 0.5;
    skyGroup.add(spire);
  }

  parent.add(skyGroup);
  return skyGroup;
}

// -------------------------------------------------------------
// ATMOSPHERIC GROUND MIST (Normal Alpha Blending, Non-Neon)
// -------------------------------------------------------------
function createAtmosphericMist(
  parent: THREE.Group,
  theme: BiomeTheme,
  worldId: number
): (delta: number) => void {
  const mistCanvas = document.createElement('canvas');
  mistCanvas.width = 128;
  mistCanvas.height = 128;
  const mCtx = mistCanvas.getContext('2d');
  if (mCtx) {
    const grad = mCtx.createRadialGradient(64, 64, 4, 64, 64, 60);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.45, rgba(0xffffff, 0.75));
    grad.addColorStop(0.85, rgba(0xffffff, 0.2));
    grad.addColorStop(1, 'transparent');
    mCtx.fillStyle = grad;
    mCtx.fillRect(0, 0, 128, 128);
  }
  const mistTex = new THREE.CanvasTexture(mistCanvas);

  const mistGroup = new THREE.Group();
  mistGroup.name = 'atmospheric-mist';

  const mistCount = 16;
  const sprites: { sprite: THREE.Sprite; speedX: number; baseX: number }[] = [];

  const mistColor = worldId === 1 ? 0x93c5fd : (worldId === 2 ? 0x6ee7b7 : (worldId === 3 ? 0xbae6fd : 0xfca5a5));

  for (let i = 0; i < mistCount; i++) {
    const mat = new THREE.SpriteMaterial({
      map: mistTex,
      color: mistColor,
      transparent: true,
      opacity: 0.16 + (i % 4) * 0.05,
      blending: THREE.NormalBlending, // Normal alpha blending, NOT additive
      depthWrite: false,
    });
    const sp = new THREE.Sprite(mat);
    const sz = 8.5 + (i % 5) * 2.5;
    sp.scale.set(sz, sz * 0.5, 1);
    const x = (Math.random() - 0.5) * (ARENA_WIDTH * 0.9);
    const z = (Math.random() - 0.5) * (ARENA_DEPTH * 0.9);
    const y = 0.45 + (i % 3) * 0.35;
    sp.position.set(x, y, z);
    mistGroup.add(sp);
    sprites.push({ sprite: sp, speedX: 0.25 + Math.random() * 0.35, baseX: x });
  }

  parent.add(mistGroup);

  return (delta: number) => {
    const halfW = ARENA_WIDTH / 2;
    for (const item of sprites) {
      item.sprite.position.x += item.speedX * delta;
      if (item.sprite.position.x > halfW) {
        item.sprite.position.x = -halfW;
      }
    }
  };
}

function rgba(color: number, alpha: number): string {
  return `rgba(${(color >> 16) & 0xff}, ${(color >> 8) & 0xff}, ${color & 0xff}, ${alpha})`;
}
