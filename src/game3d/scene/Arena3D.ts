import * as THREE from 'three';
import type { StageDefinition } from '../../types';
import { getWorldMapSignature, WORLD_LAYOUT_VALIDATION } from './WorldLayout';
import { ARENA_DEPTH, ARENA_WIDTH, logicalToWorld } from '../core/coordinates';
import { SharedResources } from '../core/SharedResources';
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
// -------------------------------------------------------------
// GROUND TEXTURE SYNTHESIS (512x512 High-Detail Procedural Map)
// -------------------------------------------------------------
function createGroundTexture(theme: BiomeTheme, seed: number, worldId: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const rng = seeded(seed);
  const baseColor = `#${theme.ground.toString(16).padStart(6, '0')}`;
  const deepColor = `#${theme.groundDeep.toString(16).padStart(6, '0')}`;
  const detailColor = `#${theme.groundDetail.toString(16).padStart(6, '0')}`;
  const accentColor = `#${theme.accent.toString(16).padStart(6, '0')}`;
  const warmColor = `#${theme.warm.toString(16).padStart(6, '0')}`;

  // Base background fill
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 512, 512);

  if (worldId === 1) {
    // WORLD 1: GRAVEYARD
    // Wet cemetery soil, aged cobblestone slabs with shaded bevels, dark grave mounds, subtle puddles
    // 1. Organic soil noise & damp earth patches
    for (let i = 0; i < 90; i++) {
      const x = rng() * 512;
      const y = rng() * 512;
      const rad = 30 + rng() * 70;
      const grad = ctx.createRadialGradient(x, y, 2, x, y, rad);
      grad.addColorStop(0, deepColor);
      grad.addColorStop(1, 'transparent');
      ctx.globalAlpha = 0.52;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Cobblestone slabs with mortar and chiseled edges
    const tileSize = 32;
    for (let row = 0; row < 16; row++) {
      for (let col = 0; col < 16; col++) {
        const px = col * tileSize + (rng() - 0.5) * 4;
        const py = row * tileSize + (rng() - 0.5) * 4;
        const w = tileSize - 4 + (rng() - 0.5) * 4;
        const h = tileSize - 4 + (rng() - 0.5) * 4;

        // Dark mortar drop-shadow
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = deepColor;
        ctx.fillRect(px + 1.5, py + 1.5, w, h);

        // Stone face
        ctx.globalAlpha = 0.32;
        ctx.fillStyle = detailColor;
        ctx.fillRect(px, py, w, h);

        // Stone edge highlight
        ctx.globalAlpha = 0.22;
        ctx.strokeStyle = '#6a7d90';
        ctx.lineWidth = 1;
        ctx.strokeRect(px, py, w, h);
      }
    }

    // 3. Grave soil plots (freshly turned damp dark earth)
    for (let i = 0; i < 14; i++) {
      const x = rng() * 440 + 20;
      const y = rng() * 440 + 20;
      const gw = 38 + rng() * 22;
      const gh = 65 + rng() * 30;
      ctx.globalAlpha = 0.48;
      ctx.fillStyle = deepColor;
      ctx.beginPath();
      ctx.roundRect(x, y, gw, gh, 8);
      ctx.fill();
      // Mound ridge
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = detailColor;
      ctx.beginPath();
      ctx.roundRect(x + 5, y + 6, gw - 10, gh - 12, 6);
      ctx.fill();
    }

    // 4. Subtle wet moonlight puddles
    for (let i = 0; i < 12; i++) {
      const px = rng() * 460 + 26;
      const py = rng() * 460 + 26;
      const prad = 14 + rng() * 24;
      const grad = ctx.createRadialGradient(px, py, 2, px, py, prad);
      grad.addColorStop(0, '#101e30');
      grad.addColorStop(0.7, '#081220');
      grad.addColorStop(1, 'transparent');
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(px, py, prad, prad * 0.55, rng() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
      // Specular sheen
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.arc(px - prad * 0.2, py - prad * 0.1, prad * 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (worldId === 2) {
    // WORLD 2: HAUNTED FOREST
    // Deep woodland soil, mossy glades, snaking root networks, glowing purple & teal mycelium
    // 1. Dark loam & moss variation
    for (let i = 0; i < 110; i++) {
      const x = rng() * 512;
      const y = rng() * 512;
      const rad = 32 + rng() * 75;
      const grad = ctx.createRadialGradient(x, y, 2, x, y, rad);
      grad.addColorStop(0, deepColor);
      grad.addColorStop(1, 'transparent');
      ctx.globalAlpha = 0.58;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Thick snaking root veins with shaded edges
    ctx.lineWidth = 3.5;
    for (let i = 0; i < 28; i++) {
      ctx.beginPath();
      let cx = rng() * 512;
      let cy = rng() * 512;
      ctx.moveTo(cx, cy);
      for (let s = 0; s < 5; s++) {
        cx += (rng() - 0.5) * 65;
        cy += (rng() - 0.5) * 65;
        ctx.lineTo(cx, cy);
      }
      ctx.globalAlpha = 0.38;
      ctx.strokeStyle = deepColor;
      ctx.stroke();
      // Root center highlight
      ctx.globalAlpha = 0.22;
      ctx.strokeStyle = detailColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 3. Bioluminescent purple fungal mycelium rings & spore clusters
    for (let i = 0; i < 55; i++) {
      const x = rng() * 512;
      const y = rng() * 512;
      const rad = 8 + rng() * 18;
      const grad = ctx.createRadialGradient(x, y, 1, x, y, rad);
      grad.addColorStop(0, accentColor);
      grad.addColorStop(0.5, `${accentColor}55`);
      grad.addColorStop(1, 'transparent');
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
      // Tiny spore dots
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = '#eeddff';
      ctx.beginPath();
      ctx.arc(x, y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (worldId === 3) {
    // WORLD 3: FROZEN RUINS
    // Permafrost stone with frost fracture veins, crystalline rime, sweeping snow drifts
    for (let i = 0; i < 90; i++) {
      const x = rng() * 512;
      const y = rng() * 512;
      const rad = 35 + rng() * 85;
      const grad = ctx.createRadialGradient(x, y, 2, x, y, rad);
      grad.addColorStop(0, '#cceeff');
      grad.addColorStop(1, 'transparent');
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // Sub-surface glowing cyan ice fractures
    ctx.lineWidth = 2.2;
    for (let i = 0; i < 38; i++) {
      ctx.beginPath();
      let cx = rng() * 512;
      let cy = rng() * 512;
      ctx.moveTo(cx, cy);
      for (let s = 0; s < 4; s++) {
        cx += (rng() - 0.5) * 75;
        cy += (rng() - 0.5) * 75;
        ctx.lineTo(cx, cy);
      }
      ctx.globalAlpha = 0.45;
      ctx.strokeStyle = accentColor;
      ctx.stroke();
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Flagstone cracks
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 1.2;
    for (let row = 0; row < 14; row++) {
      for (let col = 0; col < 14; col++) {
        ctx.strokeRect(col * 38 + (rng() - 0.5) * 4, row * 38 + (rng() - 0.5) * 4, 34, 34);
      }
    }
  } else {
    // WORLD 4: DEMON CASTLE
    // Scorched basalt flagstones, glowing hot magma rivers and veins, demonic runes
    for (let i = 0; i < 90; i++) {
      const x = rng() * 512;
      const y = rng() * 512;
      const rad = 28 + rng() * 70;
      const grad = ctx.createRadialGradient(x, y, 2, x, y, rad);
      grad.addColorStop(0, deepColor);
      grad.addColorStop(1, 'transparent');
      ctx.globalAlpha = 0.65;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // Glowing hot lava fissures (white-hot core + orange outer glow)
    for (let i = 0; i < 26; i++) {
      const pts: { x: number; y: number }[] = [];
      let cx = rng() * 512;
      let cy = rng() * 512;
      pts.push({ x: cx, y: cy });
      for (let s = 0; s < 4; s++) {
        cx += (rng() - 0.5) * 65;
        cy += (rng() - 0.5) * 65;
        pts.push({ x: cx, y: cy });
      }

      // Outer orange flame aura
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let p = 1; p < pts.length; p++) ctx.lineTo(pts[p].x, pts[p].y);
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = warmColor;
      ctx.lineWidth = 3.5;
      ctx.stroke();

      // Inner white-hot core
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let p = 1; p < pts.length; p++) ctx.lineTo(pts[p].x, pts[p].y);
      ctx.globalAlpha = 0.8;
      ctx.strokeStyle = '#fff0c0';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    // Basalt flagstone grid with dark mortar
    ctx.globalAlpha = 0.28;
    ctx.strokeStyle = deepColor;
    ctx.lineWidth = 2.2;
    for (let row = 0; row < 14; row++) {
      for (let col = 0; col < 14; col++) {
        ctx.strokeRect(col * 38, row * 38, 35, 35);
      }
    }
  }

  ctx.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4.5, 7.5);
  texture.anisotropy = 4;
  return texture;
}

// -------------------------------------------------------------
// GROUND DETAILS & EMBEDDED STONES
// -------------------------------------------------------------
function addGroundDetails(
  parent: THREE.Group,
  mapSeed: number,
  resources: SharedResources,
  theme: BiomeTheme,
  worldId: number,
  lowPerformanceMode: boolean
): void {
  const rng = seeded(mapSeed + 77);
  const count = lowPerformanceMode ? 14 : 26;

  for (let i = 0; i < count; i++) {
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
    g.add(createBox(4.2, 3.2, 0.5, mStone, 0, 1.6, 0));
    g.add(createCone(2.2, 1.9, 4, mStoneAlt, 0, 4.0, 0, 0, Math.PI / 4, 0));
    g.add(createBox(0.5, 1.4, 0.6, mStone, -1.1, 1.5, 0));
    g.add(createBox(0.5, 1.4, 0.6, mStone, 1.1, 1.5, 0));
    g.add(createBox(0.12, 0.7, 0.12, mStoneAlt, 0, 5.1, 0));
    g.add(createBox(0.42, 0.12, 0.12, mStoneAlt, 0, 4.9, 0));
    return g;
  }, { position: new THREE.Vector3(0, 1.3, -11.5), scale: new THREE.Vector3(1.4, 1.4, 1.4) });

  placeProp(parent, worldSlug, 'stone_arch', () => {
    const g = new THREE.Group();
    g.add(createBox(0.5, 2.5, 0.5, mStone, -1.35, 1.25, 0));
    g.add(createBox(0.5, 2.5, 0.5, mStone, 1.35, 1.25, 0));
    g.add(createBox(3.3, 0.5, 0.6, mStoneAlt, 0, 2.65, 0));
    g.add(createBox(0.3, 0.3, 0.68, mStone, 0, 2.65, 0));
    return g;
  }, { position: new THREE.Vector3(0, 0, -9.2), scale: new THREE.Vector3(1.3, 1.3, 1.3) });

  placeProp(parent, worldSlug, 'iron_gate', () => {
    const g = new THREE.Group();
    g.add(createBox(0.4, 2.2, 0.4, mStoneAlt, -1.3, 1.1, 0));
    g.add(createSphere(0.22, 6, mStoneAlt, -1.3, 2.35, 0));
    g.add(createBox(0.4, 2.2, 0.4, mStoneAlt, 1.3, 1.1, 0));
    g.add(createSphere(0.22, 6, mStoneAlt, 1.3, 2.35, 0));
    g.add(createBox(2.2, 1.6, 0.08, mIron, 0, 0.9, 0));
    return g;
  }, { position: new THREE.Vector3(0, 0, -7.8) });

  // 2. CRYPT ZONE (Noble Mausoleum in West, Ancient Crypt in East)
  placeProp(parent, worldSlug, 'crypt_large', () => {
    const g = new THREE.Group();
    g.add(createBox(3.4, 0.3, 4.0, mStoneAlt, 0, 0.15, 0));
    g.add(createBox(3.0, 2.4, 3.6, mStone, 0, 1.35, 0));
    g.add(createBox(3.3, 0.45, 3.9, mStoneAlt, 0, 2.65, 0));
    g.add(createCone(2.5, 0.9, 4, mStoneAlt, 0, 3.25, 0, 0, Math.PI / 4, 0));
    g.add(createCylinder(0.2, 0.22, 2.2, 8, mStoneAlt, -1.2, 1.25, 1.85));
    g.add(createCylinder(0.2, 0.22, 2.2, 8, mStoneAlt, 1.2, 1.25, 1.85));
    g.add(createBox(1.2, 1.9, 0.12, mIron, 0, 1.05, 1.82));
    return g;
  }, { position: new THREE.Vector3(-4.8, 0, -4.5), scale: new THREE.Vector3(1.2, 1.2, 1.2), rotationY: 0.25 });

  placeProp(parent, worldSlug, 'crypt_small', () => {
    const g = new THREE.Group();
    g.add(createBox(1.9, 0.2, 2.5, mStoneAlt, 0, 0.1, 0));
    g.add(createBox(1.7, 1.5, 2.3, mStone, 0, 0.85, 0));
    g.add(createCone(1.4, 0.8, 4, mStoneAlt, 0, 1.95, 0, 0, Math.PI / 4, 0));
    g.add(createBox(0.8, 1.2, 0.1, mIron, 0, 0.7, 1.16));
    return g;
  }, { position: new THREE.Vector3(4.8, 0, -3.8), scale: new THREE.Vector3(1.15, 1.15, 1.15), rotationY: -0.22 });

  // 3. STATUES & LANDMARKS
  placeProp(parent, worldSlug, 'angel_statue', () => {
    const g = new THREE.Group();
    g.add(createBox(0.8, 0.25, 0.8, mStone, 0, 0.12, 0));
    g.add(createBox(0.65, 0.5, 0.65, mStone, 0, 0.48, 0));
    g.add(createCylinder(0.26, 0.38, 1.2, 8, mStoneAlt, 0, 1.25, 0));
    g.add(createSphere(0.22, 7, mStoneAlt, 0, 1.9, 0.02));
    g.add(createBox(0.72, 0.95, 0.09, mStoneAlt, -0.32, 1.6, -0.18, 0.22, -0.32, 0.25));
    g.add(createBox(0.72, 0.95, 0.09, mStoneAlt, 0.32, 1.6, -0.18, 0.22, 0.32, -0.25));
    return g;
  }, { position: new THREE.Vector3(-3.2, 0, 0.8), scale: new THREE.Vector3(1.25, 1.25, 1.25), rotationY: 0.6 });

  placeProp(parent, worldSlug, 'angel_statue', () => {
    const g = new THREE.Group();
    g.add(createBox(0.8, 0.25, 0.8, mStone, 0, 0.12, 0));
    g.add(createBox(0.65, 0.5, 0.65, mStone, 0, 0.48, 0));
    g.add(createCylinder(0.26, 0.38, 1.2, 8, mStoneAlt, 0, 1.25, 0));
    g.add(createSphere(0.22, 7, mStoneAlt, 0, 1.9, 0.02));
    g.add(createBox(0.72, 0.95, 0.09, mStoneAlt, -0.32, 1.6, -0.18, 0.22, -0.32, 0.25));
    g.add(createBox(0.72, 0.95, 0.09, mStoneAlt, 0.32, 1.6, -0.18, 0.22, 0.32, -0.25));
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
    g.add(createCylinder(1.1, 2.1, 5.2, 8, mBark, 0, 2.6, 0));
    g.add(createBox(4.2, 0.8, 1.1, mBark, 0, 0.4, 0, 0, 0.45, 0));
    g.add(createBox(1.1, 0.8, 4.2, mBark, 0, 0.4, 0, 0, -0.45, 0));
    g.add(createCylinder(0.55, 0.9, 3.2, 6, mBark, -1.4, 4.8, 0.5, 0.25, 0, 0.5));
    g.add(createCylinder(0.55, 0.9, 3.2, 6, mBark, 1.4, 4.8, -0.5, -0.25, 0, -0.5));
    g.add(createSphere(0.45, 6, resources.basicMaterial('tree-void', 0x0a0410), 0, 2.2, 1.0));
    g.add(createOcta(0.24, mPurple, 0, 2.2, 0.95));
    return g;
  }, { position: new THREE.Vector3(0, 0, -8.5), scale: new THREE.Vector3(1.35, 1.35, 1.35) });

  // 2. ANCIENT SPIRIT SHRINE
  placeProp(parent, worldSlug, 'ancient_shrine', () => {
    const g = new THREE.Group();
    g.add(createBox(0.35, 2.8, 0.35, mWood, -1.2, 1.4, 0));
    g.add(createBox(0.35, 2.8, 0.35, mWood, 1.2, 1.4, 0));
    g.add(createBox(3.4, 0.3, 0.45, mWood, 0, 2.7, 0));
    g.add(createBox(2.8, 0.22, 0.38, mWood, 0, 2.3, 0));
    g.add(createOcta(0.18, mTeal, 0, 2.0, 0));
    return g;
  }, { position: new THREE.Vector3(-4.5, 0, -3.2), scale: new THREE.Vector3(1.2, 1.2, 1.2), rotationY: 0.4 });

  // 3. STANDING STONES & SPIRIT LANTERNS
  placeProp(parent, worldSlug, 'standing_stone', () => {
    const g = new THREE.Group();
    g.add(createBox(0.75, 2.6, 0.45, mStone, 0, 1.3, 0));
    g.add(createBox(0.18, 1.4, 0.06, mPurple, 0, 1.3, 0.24));
    return g;
  }, { position: new THREE.Vector3(4.2, 0, -2.8), scale: new THREE.Vector3(1.2, 1.2, 1.2), rotationY: -0.45 });

  placeProp(parent, worldSlug, 'standing_stone', () => {
    const g = new THREE.Group();
    g.add(createBox(0.75, 2.6, 0.45, mStone, 0, 1.3, 0));
    g.add(createBox(0.18, 1.4, 0.06, mPurple, 0, 1.3, 0.24));
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
    g.add(createBox(0.65, 3.4, 0.65, mStone, -1.6, 1.7, 0));
    g.add(createBox(0.65, 3.4, 0.65, mStone, 1.6, 1.7, 0));
    g.add(createBox(4.2, 0.7, 0.85, mStone, 0, 3.5, 0));
    g.add(createCone(0.12, 0.8, 4, mIce, -0.8, 2.9, 0, Math.PI, 0, 0));
    g.add(createCone(0.15, 1.1, 4, mIce, 0, 2.7, 0, Math.PI, 0, 0));
    g.add(createCone(0.12, 0.8, 4, mIce, 0.8, 2.9, 0, Math.PI, 0, 0));
    return g;
  }, { position: new THREE.Vector3(0, 0, -8.8), scale: new THREE.Vector3(1.3, 1.3, 1.3) });

  // 2. FROZEN WARRIOR MONUMENT & ALTAR
  placeProp(parent, worldSlug, 'frozen_statue', () => {
    const g = new THREE.Group();
    g.add(createBox(0.9, 0.3, 0.9, mStone, 0, 0.15, 0));
    g.add(createCylinder(0.3, 0.4, 1.4, 7, mStone, 0, 0.9, 0));
    g.add(createBox(0.95, 1.8, 0.95, mIce, 0, 1.0, 0));
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
    g.add(createCone(0.45, 2.6, 5, mIce, 0, 1.3, 0));
    g.add(createCone(0.28, 1.6, 5, mIce, 0.4, 0.8, 0.2, 0.2, 0, -0.35));
    return g;
  }, { position: new THREE.Vector3(-4.4, 0, 3.8), scale: new THREE.Vector3(1.3, 1.3, 1.3) });

  placeProp(parent, worldSlug, 'ice_crystal_cluster', () => {
    const g = new THREE.Group();
    g.add(createCone(0.32, 1.8, 5, mIce, 0, 0.9, 0));
    g.add(createCone(0.22, 1.2, 5, mIce, -0.3, 0.6, -0.15, -0.2, 0, 0.3));
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
    g.add(createCone(0.32, 1.8, 5, mIce, 0, 0.9, 0));
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
    g.add(createBox(0.8, 4.0, 0.8, mObsidian, -1.8, 2.0, 0));
    g.add(createBox(0.8, 4.0, 0.8, mObsidian, 1.8, 2.0, 0));
    g.add(createBox(4.6, 0.8, 1.0, mObsidian, 0, 4.0, 0));
    g.add(createCone(0.18, 1.1, 4, mObsidian, -1.8, 4.9, 0));
    g.add(createCone(0.18, 1.1, 4, mObsidian, 1.8, 4.9, 0));
    g.add(createCone(0.22, 1.4, 4, mObsidian, 0, 4.9, 0));
    g.add(createBox(2.6, 3.4, 0.08, mFire, 0, 1.7, 0));
    return g;
  }, { position: new THREE.Vector3(0, 0, -8.8), scale: new THREE.Vector3(1.3, 1.3, 1.3) });

  placeProp(parent, worldSlug, 'demon_throne_silhouette', () => {
    const g = new THREE.Group();
    g.add(createBox(2.2, 0.4, 1.8, mObsidian, 0, 0.2, 0));
    g.add(createBox(1.8, 2.6, 0.4, mObsidian, 0, 1.5, -0.6));
    g.add(createCone(0.15, 0.9, 4, mObsidian, -0.7, 2.9, -0.6));
    g.add(createCone(0.18, 1.2, 4, mObsidian, 0, 3.1, -0.6));
    g.add(createCone(0.15, 0.9, 4, mObsidian, 0.7, 2.9, -0.6));
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
function createBox(sx: number, sy: number, sz: number, mat: THREE.Material, px = 0, py = 0, pz = 0, rx = 0, ry = 0, rz = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
  mesh.position.set(px, py, pz);
  mesh.rotation.set(rx, ry, rz);
  return mesh;
}

function createCylinder(rt: number, rb: number, h: number, s: number, mat: THREE.Material, px = 0, py = 0, pz = 0, rx = 0, ry = 0, rz = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, s), mat);
  mesh.position.set(px, py, pz);
  mesh.rotation.set(rx, ry, rz);
  return mesh;
}

function createSphere(r: number, s: number, mat: THREE.Material, px = 0, py = 0, pz = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, s, s), mat);
  mesh.position.set(px, py, pz);
  return mesh;
}

function createOcta(r: number, mat: THREE.Material, px = 0, py = 0, pz = 0, rx = 0, ry = 0, rz = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(r), mat);
  mesh.position.set(px, py, pz);
  mesh.rotation.set(rx, ry, rz);
  return mesh;
}

function createCone(r: number, h: number, s: number, mat: THREE.Material, px = 0, py = 0, pz = 0, rx = 0, ry = 0, rz = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.ConeGeometry(r, h, s), mat);
  mesh.position.set(px, py, pz);
  mesh.rotation.set(rx, ry, rz);
  return mesh;
}

function createTorus(r: number, tube: number, radSegs: number, tubSegs: number, mat: THREE.Material, px = 0, py = 0, pz = 0, rx = 0, ry = 0, rz = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(r, tube, radSegs, tubSegs), mat);
  mesh.position.set(px, py, pz);
  mesh.rotation.set(rx, ry, rz);
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
