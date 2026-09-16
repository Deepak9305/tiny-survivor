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
import { getObstaclesForWorld } from './WorldObstacles';
import { createArenaFlavor } from './ArenaFlavor';

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

  const occluders: THREE.Object3D[] = [];

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
    roughness: stage.worldId === 3 ? 0.48 : (stage.worldId === 1 ? 0.62 : (stage.worldId === 2 ? 0.65 : 0.68)),
    metalness: stage.worldId === 4 ? 0.25 : (stage.worldId === 3 ? 0.24 : (stage.worldId === 1 ? 0.18 : 0.14)),
    emissive: stage.worldId === 1 ? 0x162432 : (stage.worldId === 2 ? 0x142820 : (stage.worldId === 4 ? 0x2a0c0e : 0x1a2e44)),
    emissiveIntensity: stage.worldId === 4 ? 0.42 : (stage.worldId === 1 ? 0.32 : (stage.worldId === 2 ? 0.28 : 0.30)),
  });

  const outerTerrainTex = buildOuterTerrainTexture(theme);
  const outerTerrainMat = new THREE.MeshStandardMaterial({
    map: outerTerrainTex,
    roughness: 0.88,
    metalness: 0.06,
    emissive: theme.groundDeep,
    emissiveIntensity: 0.35,
  });
  const outerGround = new THREE.Mesh(resources.plane('arena-outer-ground', 130, 100), outerTerrainMat);
  outerGround.rotation.x = -Math.PI / 2;
  outerGround.position.y = -0.024;
  outerGround.receiveShadow = false;
  arena.add(outerGround);

  const ground = new THREE.Mesh(resources.plane('arena-ground', ARENA_WIDTH + 2.0, ARENA_DEPTH + 2.0), groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.015;
  ground.receiveShadow = false;
  arena.add(ground);

  const skyGroup = createDistantSky(arena, resources, theme, stage.worldId);

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

  // Small instanced biome clutter plus local shroud patches make the battlefield
  // feel inhabited without turning the whole arena into collision clutter.
  const flavor = createArenaFlavor(arena, resources, theme, stage.worldId, mapRng, lowPerformanceMode);

  const dynamicLightPool = createDynamicLightPool(arena, theme, lowPerformanceMode, worldResult.lanternPositions);

  let mistUpdate: ((delta: number) => void) | undefined;
  if (!lowPerformanceMode) {
    mistUpdate = createAtmosphericMist(arena, theme, stage.worldId);
  }

  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('debugColliders') === '1' || (window as unknown as { __debugColliders?: boolean }).__debugColliders) {
      const debugGroup = createDebugColliderVisualization(stage.worldId);
      arena.add(debugGroup);
    }
  }

  arena.userData.theme = theme;
  arena.userData.mapSeed = mapSeed;
  arena.userData.mapSignature = getWorldMapSignature(stage.worldId);
  arena.userData.mapValidation = WORLD_LAYOUT_VALIDATION;
  arena.userData.occluders = occluders;
  arena.userData.lanternPositions = worldResult.lanternPositions;
  arena.userData.visionPatches = flavor.visionPatches;
  arena.userData.update = (cameraPos: THREE.Vector3, playerPos: THREE.Vector3, delta: number) => {
    if (skyGroup) {
      skyGroup.position.x = cameraPos.x * 0.75;
    }
    dynamicLightPool.update(playerPos);
    if (mistUpdate) mistUpdate(delta);
    flavor.update(playerPos, delta);
  };

  scene.add(arena);
  return arena;
}

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

function createDistantSky(
  parent: THREE.Group,
  resources: SharedResources,
  theme: BiomeTheme,
  worldId: number
): THREE.Group {
  const skyGroup = new THREE.Group();
  skyGroup.name = 'distant-sky-horizon';

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
      blending: THREE.NormalBlending,
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
      if (item.sprite.position.x > halfW) item.sprite.position.x = -halfW;
    }
  };
}

function rgba(color: number, alpha: number): string {
  return `rgba(${(color >> 16) & 0xff}, ${(color >> 8) & 0xff}, ${color & 0xff}, ${alpha})`;
}

function createDebugColliderVisualization(worldId: number): THREE.Group {
  const group = new THREE.Group();
  group.name = 'debug-colliders-visual';
  const obstacles = getObstaclesForWorld(worldId);

  const circleOutlineMat = new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
  });
  const circleFillMat = new THREE.MeshBasicMaterial({
    color: 0x00a0e0,
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide,
  });

  const boxMat = new THREE.MeshBasicMaterial({
    color: 0xff4040,
    transparent: true,
    opacity: 0.26,
    side: THREE.DoubleSide,
  });
  const boxEdgeMat = new THREE.LineBasicMaterial({
    color: 0xff2020,
    linewidth: 2,
  });

  for (const obs of obstacles) {
    if (obs.type === 'circle') {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(Math.max(0.1, obs.radius - 0.06), obs.radius + 0.06, 32),
        circleOutlineMat
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(obs.x, 0.06, obs.z);
      group.add(ring);

      const fill = new THREE.Mesh(new THREE.CircleGeometry(obs.radius, 32), circleFillMat);
      fill.rotation.x = -Math.PI / 2;
      fill.position.set(obs.x, 0.05, obs.z);
      group.add(fill);
    } else if (obs.type === 'box') {
      const w = obs.maxX - obs.minX;
      const d = obs.maxZ - obs.minZ;
      const cx = (obs.minX + obs.maxX) / 2;
      const cz = (obs.minZ + obs.maxZ) / 2;

      const fill = new THREE.Mesh(new THREE.PlaneGeometry(w, d), boxMat);
      fill.rotation.x = -Math.PI / 2;
      fill.position.set(cx, 0.05, cz);
      group.add(fill);

      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(w, 0.08, d)),
        boxEdgeMat
      );
      edges.position.set(cx, 0.06, cz);
      group.add(edges);
    }
  }

  return group;
}

function buildOuterTerrainTexture(theme: BiomeTheme): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const baseHex = `#${theme.groundDeep.toString(16).padStart(6, '0')}`;
  const midHex = `#${theme.ground.toString(16).padStart(6, '0')}`;
  const detailHex = `#${theme.groundDetail.toString(16).padStart(6, '0')}`;

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 80; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const rad = 30 + Math.random() * 90;
    const grad = ctx.createRadialGradient(x, y, 2, x, y, rad);
    grad.addColorStop(0, i % 2 === 0 ? midHex : detailHex);
    grad.addColorStop(1, 'transparent');
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 200; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = i % 2 === 0 ? '#000000' : detailHex;
    ctx.fillRect(x, y, 2 + Math.random() * 3, 2 + Math.random() * 3);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 6);
  return tex;
}
