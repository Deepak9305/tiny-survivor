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
    roughness: stage.worldId === 3 ? 0.6 : (stage.worldId === 1 ? 0.72 : 0.88),
    metalness: stage.worldId === 4 ? 0.2 : (stage.worldId === 1 ? 0.1 : 0.05),
    emissive: stage.worldId === 1 ? 0x162432 : theme.groundDeep,
    emissiveIntensity: stage.worldId === 4 ? 0.35 : (stage.worldId === 1 ? 0.32 : 0.18),
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
  const isAuthoredMap = worldId === 1;
  const canvas = document.createElement('canvas');
  const dim = isAuthoredMap ? 1024 : 512;
  canvas.width = dim;
  canvas.height = dim;
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
  ctx.fillRect(0, 0, dim, dim);

  if (worldId === 1) {
    // WORLD 1: HANDCRAFTED GRAVEYARD MAP TEXTURE (1024x1024 1:1 Arena Projection)
    const toCanvas = (wx: number, wz: number) => ({
      x: ((wx / ARENA_WIDTH) + 0.5) * dim,
      y: ((wz / ARENA_DEPTH) + 0.5) * dim,
    });

    // 1. Organic soil noise, damp loam & ancient cemetery moss gradients
    for (let i = 0; i < 140; i++) {
      const x = rng() * dim;
      const y = rng() * dim;
      const rad = 45 + rng() * 110;
      const grad = ctx.createRadialGradient(x, y, 2, x, y, rad);
      grad.addColorStop(0, i % 3 === 0 ? '#101d2a' : (i % 3 === 1 ? deepColor : '#162f22'));
      grad.addColorStop(1, 'transparent');
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // Helper to draw realistic stone flagstone paths between points
    const drawFlagstonePath = (fromX: number, fromZ: number, toX: number, toZ: number, pathWidth = 56) => {
      const p1 = toCanvas(fromX, fromZ);
      const p2 = toCanvas(toX, toZ);
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.hypot(dx, dy);
      const steps = Math.max(4, Math.floor(dist / 22));
      const nx = -dy / dist;
      const ny = dx / dist;

      // Dark mortar foundation under path
      ctx.beginPath();
      ctx.moveTo(p1.x - (nx * pathWidth) / 2, p1.y - (ny * pathWidth) / 2);
      ctx.lineTo(p2.x - (nx * pathWidth) / 2, p2.y - (ny * pathWidth) / 2);
      ctx.lineTo(p2.x + (nx * pathWidth) / 2, p2.y + (ny * pathWidth) / 2);
      ctx.lineTo(p1.x + (nx * pathWidth) / 2, p1.y + (ny * pathWidth) / 2);
      ctx.closePath();
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = '#08101a';
      ctx.fill();

      // Flagstone pavers along path
      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        const cx = p1.x + dx * t;
        const cy = p1.y + dy * t;
        const rows = 2;
        for (let r = 0; r < rows; r++) {
          const lateral = ((r - (rows - 1) / 2) * pathWidth * 0.44) + (rng() - 0.5) * 6;
          const px = cx + nx * lateral;
          const py = cy + ny * lateral;
          const tileW = 20 + rng() * 8;
          const tileH = 16 + rng() * 8;
          // Mortar shadow
          ctx.globalAlpha = 0.65;
          ctx.fillStyle = '#060c14';
          ctx.beginPath();
          ctx.roundRect(px - tileW / 2 + 1.5, py - tileH / 2 + 1.5, tileW, tileH, 3);
          ctx.fill();
          // Stone face
          ctx.globalAlpha = 0.72;
          ctx.fillStyle = (r + s) % 2 === 0 ? '#485e74' : '#3c4f62';
          ctx.beginPath();
          ctx.roundRect(px - tileW / 2, py - tileH / 2, tileW, tileH, 3);
          ctx.fill();
          // Stone highlight
          ctx.globalAlpha = 0.45;
          ctx.strokeStyle = '#7c97af';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }
    };

    // 2. Main Axial & Diagonal Flagstone Walkways
    // North Gate Path: Center -> North Gate
    drawFlagstonePath(0, 0, 0, -19.5, 62);
    // South Gate Path: Center -> South Gate
    drawFlagstonePath(0, 0, 0, 19.5, 62);
    // NW Diagonal: Center -> West Crypts
    drawFlagstonePath(0, 0, -8.2, -12.5, 52);
    // NE Diagonal: Center -> East Statue
    drawFlagstonePath(0, 0, 8.5, -12.5, 52);
    // SW Diagonal: Center -> Bridge over Pond
    drawFlagstonePath(0, 0, -4.8, 9.5, 48);
    drawFlagstonePath(-4.8, 9.5, 0, 18.0, 48);
    // SE Diagonal: Center -> South Crypts
    drawFlagstonePath(0, 0, 7.8, 10.5, 48);
    drawFlagstonePath(7.8, 10.5, 0, 18.0, 48);

    // 3. Central Grounds Circular Dais & Ring Plaza (Radius ~4.4m -> ~160px)
    const center = toCanvas(0, 0);
    // Outer paved cobblestone ring foundation
    ctx.globalAlpha = 0.65;
    ctx.fillStyle = '#081018';
    ctx.beginPath();
    ctx.arc(center.x, center.y, 168, 0, Math.PI * 2);
    ctx.fill();

    // Concentric paved rings with individual cobblestone blocks
    const ringRadii = [156, 126, 96, 66];
    for (let r = 0; r < ringRadii.length; r++) {
      const rad = ringRadii[r];
      const count = Math.floor((2 * Math.PI * rad) / 18);
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const px = center.x + Math.cos(angle) * rad;
        const py = center.y + Math.sin(angle) * rad;

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(angle + Math.PI / 2);
        // Mortar shadow
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#060c14';
        ctx.fillRect(-7.5, -5.5, 15, 11);
        // Stone face
        ctx.globalAlpha = 0.75;
        ctx.fillStyle = (i + r) % 2 === 0 ? '#4a6076' : '#3d5267';
        ctx.fillRect(-7, -5, 14, 10);
        // Stone highlight rim
        ctx.globalAlpha = 0.42;
        ctx.strokeStyle = '#82a0bc';
        ctx.lineWidth = 1;
        ctx.strokeRect(-7, -5, 14, 10);
        ctx.restore();
      }
    }
    // Inner stone dais roundel
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#364a5d';
    ctx.beginPath();
    ctx.arc(center.x, center.y, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = '#94b4cf';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 4. The Pond Basin in Southwest (X: -7.5, Z: +10.5)
    const pondCenter = toCanvas(-7.5, 10.5);
    // Shoreline damp earth & moss border
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#0e1820';
    ctx.beginPath();
    ctx.ellipse(pondCenter.x, pondCenter.y, 128, 98, -0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#1c3c2a';
    ctx.beginPath();
    ctx.ellipse(pondCenter.x, pondCenter.y, 134, 104, -0.22, 0, Math.PI * 2);
    ctx.stroke();

    // Deep dark murky water body
    const pondGrad = ctx.createRadialGradient(pondCenter.x, pondCenter.y, 10, pondCenter.x, pondCenter.y, 115);
    pondGrad.addColorStop(0, '#061019');
    pondGrad.addColorStop(0.7, '#0a1d2e');
    pondGrad.addColorStop(1, '#11293e');
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = pondGrad;
    ctx.beginPath();
    ctx.ellipse(pondCenter.x, pondCenter.y, 118, 88, -0.22, 0, Math.PI * 2);
    ctx.fill();

    // Celestial moon specular reflection in pond
    ctx.globalAlpha = 0.65;
    ctx.fillStyle = '#55d4ff';
    ctx.beginPath();
    ctx.ellipse(pondCenter.x - 18, pondCenter.y - 12, 28, 18, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = '#f0f9ff';
    ctx.beginPath();
    ctx.arc(pondCenter.x - 18, pondCenter.y - 12, 10, 0, Math.PI * 2);
    ctx.fill();

    // 5. Grave Plots (West Graves & East Graves)
    // Dark freshly dug loam beds where graves are clustered
    const graveZones = [
      { minX: -9.5, maxX: -5.0, minZ: -8.0, maxZ: -2.0 },
      { minX: 5.0, maxX: 9.5, minZ: -8.0, maxZ: -2.0 },
    ];
    for (const gz of graveZones) {
      const p1 = toCanvas(gz.minX, gz.minZ);
      const p2 = toCanvas(gz.maxX, gz.maxZ);
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = '#0a121b';
      ctx.beginPath();
      ctx.roundRect(Math.min(p1.x, p2.x), Math.min(p1.y, p2.y), Math.abs(p2.x - p1.x), Math.abs(p2.y - p1.y), 12);
      ctx.fill();
    }

    // 6. Wet Moonlight Puddles (High-contrast glassy pools reflecting the moon)
    const puddleLocations = [
      toCanvas(0, -5.5),
      toCanvas(0, 5.5),
      toCanvas(-2.2, -1.8),
      toCanvas(2.4, -1.6),
      toCanvas(-3.2, 3.8),
      toCanvas(3.5, 4.2),
      toCanvas(-6.5, -9.0),
      toCanvas(6.8, -9.0),
      toCanvas(0, -14.5),
      toCanvas(0, 14.5),
      toCanvas(-1.5, 9.8),
      toCanvas(2.2, 9.5),
    ];
    for (const p of puddleLocations) {
      const prad = 16 + rng() * 18;
      const pgrad = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, prad);
      pgrad.addColorStop(0, '#07121c');
      pgrad.addColorStop(0.75, '#0d2234');
      pgrad.addColorStop(1, 'transparent');
      ctx.globalAlpha = 0.72;
      ctx.fillStyle = pgrad;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, prad, prad * 0.58, rng() * Math.PI, 0, Math.PI * 2);
      ctx.fill();

      // Sharp specular moon reflection in puddle
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = '#4cd2ff';
      ctx.beginPath();
      ctx.arc(p.x - prad * 0.25, p.y - prad * 0.15, prad * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = '#eff8ff';
      ctx.beginPath();
      ctx.arc(p.x - prad * 0.25, p.y - prad * 0.15, prad * 0.12, 0, Math.PI * 2);
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
  if (worldId === 1) {
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.repeat.set(1, 1);
  } else {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4.5, 7.5);
  }
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
  const moonX = worldId === 4 ? 3.2 : -4.0;
  const moonY = worldId === 1 ? 13.5 : 2.0;
  const moonZ = worldId === 1 ? -29.0 : -13.5;

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
  halo.position.set(moonX, moonY, moonZ + 0.15);
  halo.scale.set(worldId === 1 ? 7.8 : 5.2, worldId === 1 ? 7.8 : 5.2, 1);
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
  moon.position.set(moonX, moonY, moonZ);
  moon.scale.set(worldId === 1 ? 4.0 : 2.8, worldId === 1 ? 4.0 : 2.8, 1);
  parent.add(moon);

  // Distant Mountain & Castle Silhouette Ridge
  const ridgeZ = worldId === 1 ? -29.5 : -ARENA_DEPTH / 2 + 0.1;
  const ridgeCount = 12;
  for (let i = 0; i < ridgeCount; i++) {
    const ridge = new THREE.Mesh(
      resources.cone(`horizon-ridge-${worldId}`),
      resources.basicMaterial(`horizon-ridge-mat-${worldId}`, theme.groundDeep, {
        transparent: true,
        opacity: 0.92,
      })
    );
    ridge.position.set(-ARENA_WIDTH / 2 - 3.5 + i * 2.9, worldId === 1 ? 3.2 + (i % 3) * 0.8 : 1.3 + (i % 3) * 0.4, ridgeZ);
    ridge.scale.set(3.4, worldId === 1 ? 4.5 + (i % 2) * 1.8 : 2.6 + (i % 2) * 1.1, 1.4);
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
  const mStone = resources.standardMaterial('gy-stone', theme.prop, { roughness: 0.88 });
  const mStoneAlt = resources.standardMaterial('gy-stone-alt', theme.propAlt, { roughness: 0.82 });
  const mWood = resources.standardMaterial('gy-wood', 0x1a1410, { roughness: 0.95 });
  const mIron = resources.standardMaterial('gy-iron', 0x1a2430, { roughness: 0.55, metalness: 0.65 });
  const mWarm = resources.standardMaterial('gy-warm', theme.warm, { emissive: theme.warm, emissiveIntensity: 3.2 });
  const mRoseGlass = resources.standardMaterial('gy-rose-glass', 0xff4411, { emissive: 0xff3300, emissiveIntensity: 2.8, roughness: 0.3 });
  const mWater = resources.standardMaterial('gy-pond-water', 0x071624, { roughness: 0.12, metalness: 0.85, emissive: 0x030d17, emissiveIntensity: 0.35 });

  // Helper for adding warm glowing lantern point lights
  const addWarmPoint = (x: number, y: number, z: number, intensity = 2.2, distance = 6.8) => {
    if (low) return;
    const light = new THREE.PointLight(theme.warm, intensity, distance, 1.8);
    light.position.set(x, y, z);
    parent.add(light);
  };

  const addGlowSprite = (x: number, y: number, z: number, scale = 1.4) => {
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createGlowTexture(theme.warm),
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    glow.position.set(x, y, z);
    glow.scale.set(scale, scale, 1);
    parent.add(glow);
  };

  // =============================================================
  // 1. OUTER PERIMETER FORTRESS WALLS, BASTIONS & IMPASSABLE BOUNDARIES
  // =============================================================
  const boundX = 13.4;
  const boundZ = 21.2;

  // Perimeter Stone Retaining Walls with Spiked Iron Crests
  const addWallSegment = (x: number, z: number, sx: number, sz: number, rotY = 0) => {
    const g = new THREE.Group();
    // Solid stone wall base
    g.add(createBox(sx, 1.9, sz, mStone, 0, 0.95, 0));
    // Decorative cornice cap
    g.add(createBox(sx * 1.02, 0.22, sz * 1.15, mStoneAlt, 0, 1.95, 0));
    // Spiked iron railing on top
    const rails = Math.max(2, Math.floor(Math.max(sx, sz) / 0.55));
    for (let r = 0; r < rails; r++) {
      const offset = -Math.max(sx, sz) * 0.45 + (r / (rails - 1)) * Math.max(sx, sz) * 0.9;
      const rx = sx >= sz ? offset : 0;
      const rz = sx < sz ? offset : 0;
      g.add(createCylinder(0.024, 0.024, 0.95, 5, mIron, rx, 2.5, rz));
      g.add(createCone(0.05, 0.18, 4, mIron, rx, 3.02, rz));
    }
    g.position.set(x, 0, z);
    if (rotY) g.rotation.y = rotY;
    parent.add(g);
  };

  // North Wall (left and right of North Gate)
  addWallSegment(-8.3, -boundZ, 9.8, 0.75);
  addWallSegment(8.3, -boundZ, 9.8, 0.75);

  // South Wall (left and right of South Gate)
  addWallSegment(-8.3, boundZ, 9.8, 0.75);
  addWallSegment(8.3, boundZ, 9.8, 0.75);

  // West Wall (continuous)
  addWallSegment(-boundX, 0, 0.75, boundZ * 2 - 1.2);

  // East Wall (continuous)
  addWallSegment(boundX, 0, 0.75, boundZ * 2 - 1.2);

  // 4 Corner Bastion Towers
  const cornerPositions = [
    new THREE.Vector3(-boundX, 0, -boundZ),
    new THREE.Vector3(boundX, 0, -boundZ),
    new THREE.Vector3(-boundX, 0, boundZ),
    new THREE.Vector3(boundX, 0, boundZ),
  ];
  for (const cp of cornerPositions) {
    const tower = new THREE.Group();
    tower.add(createCylinder(1.2, 1.45, 3.6, 8, mStone, 0, 1.8, 0));
    tower.add(createCylinder(1.35, 1.2, 0.45, 8, mStoneAlt, 0, 3.75, 0));
    tower.add(createCone(1.45, 1.9, 8, mStoneAlt, 0, 4.8, 0));
    tower.position.copy(cp);
    parent.add(tower);
  }

  // Outside Perimeter: Rocky cliff drop-offs & silhouetted trees
  const outerCliffs = [
    new THREE.Vector3(-boundX - 2.5, 0, -10.0),
    new THREE.Vector3(-boundX - 2.8, 0, 8.0),
    new THREE.Vector3(boundX + 2.5, 0, -10.0),
    new THREE.Vector3(boundX + 2.8, 0, 8.0),
    new THREE.Vector3(-6.0, 0, -boundZ - 2.8),
    new THREE.Vector3(6.0, 0, -boundZ - 2.8),
    new THREE.Vector3(-6.0, 0, boundZ + 2.8),
    new THREE.Vector3(6.0, 0, boundZ + 2.8),
  ];
  for (const cl of outerCliffs) {
    const cliff = new THREE.Mesh(resources.ico('cliff-rock'), mStone);
    cliff.position.set(cl.x, 0.8, cl.z);
    cliff.scale.set(2.4, 1.8, 2.4);
    cliff.rotation.y = rng() * Math.PI;
    parent.add(cliff);
  }

  // =============================================================
  // 2. NORTH GATE ZONE: "Chapel of the Fallen" Landmark Facade
  // =============================================================
  placeProp(parent, worldSlug, 'chapel_ruin', () => {
    const g = new THREE.Group();
    // Central Gothic Gable Wall
    g.add(createBox(5.6, 4.4, 0.9, mStone, 0, 2.2, 0));
    // Portal Arched Gate Opening
    g.add(createBox(2.4, 2.7, 1.1, resources.basicMaterial('chapel-void', 0x060c14), 0, 1.35, 0));
    g.add(createBox(2.2, 2.6, 0.12, mIron, 0, 1.3, 0.1));
    // Twin Pointed Gothic Spires
    g.add(createCylinder(0.42, 0.55, 4.8, 6, mStoneAlt, -2.4, 2.4, 0));
    g.add(createCone(0.55, 2.4, 6, mStoneAlt, -2.4, 5.8, 0));
    g.add(createBox(0.12, 0.85, 0.12, mStoneAlt, -2.4, 7.1, 0));
    g.add(createBox(0.48, 0.12, 0.12, mStoneAlt, -2.4, 6.9, 0));

    g.add(createCylinder(0.42, 0.55, 4.8, 6, mStoneAlt, 2.4, 2.4, 0));
    g.add(createCone(0.55, 2.4, 6, mStoneAlt, 2.4, 5.8, 0));
    g.add(createBox(0.12, 0.85, 0.12, mStoneAlt, 2.4, 7.1, 0));
    g.add(createBox(0.48, 0.12, 0.12, mStoneAlt, 2.4, 6.9, 0));

    // Stained-Glass Rose Window Glowing Warm Red-Orange
    g.add(createTorus(0.78, 0.12, 6, 16, mStoneAlt, 0, 3.4, 0.48));
    g.add(createCylinder(0.72, 0.72, 0.08, 12, mRoseGlass, 0, 3.4, 0.48, Math.PI / 2, 0, 0));

    // Stone flight of steps descending into courtyard
    g.add(createBox(4.4, 0.16, 0.9, mStoneAlt, 0, 0.24, 0.9));
    g.add(createBox(4.8, 0.16, 0.9, mStoneAlt, 0, 0.12, 1.6));
    g.add(createBox(5.2, 0.12, 0.9, mStoneAlt, 0, 0.04, 2.3));

    // Flanking Stone Gatehouse Pillars with Warm Carriage Lanterns
    g.add(createBox(0.68, 2.8, 0.68, mStoneAlt, -2.2, 1.4, 1.8));
    g.add(createBox(0.68, 2.8, 0.68, mStoneAlt, 2.2, 1.4, 1.8));
    g.add(createBox(0.3, 0.44, 0.3, mIron, -2.2, 2.5, 2.2));
    g.add(createOcta(0.14, mWarm, -2.2, 2.5, 2.2));
    g.add(createBox(0.3, 0.44, 0.3, mIron, 2.2, 2.5, 2.2));
    g.add(createOcta(0.14, mWarm, 2.2, 2.5, 2.2));

    return g;
  }, { position: new THREE.Vector3(0, 0, -19.5) });

  addWarmPoint(0, 2.4, -17.8, 2.2, 8.0);
  addGlowSprite(-2.2, 2.5, -17.3, 1.6);
  addGlowSprite(2.2, 2.5, -17.3, 1.6);

  // Stone Archway Sign in front of chapel
  placeProp(parent, worldSlug, 'stone_arch', () => {
    const g = new THREE.Group();
    g.add(createBox(0.5, 2.7, 0.5, mStone, -1.5, 1.35, 0));
    g.add(createBox(0.5, 2.7, 0.5, mStone, 1.5, 1.35, 0));
    g.add(createBox(3.6, 0.55, 0.65, mStoneAlt, 0, 2.85, 0));
    g.add(createBox(1.6, 0.35, 0.1, mIron, 0, 2.35, 0));
    return g;
  }, { position: new THREE.Vector3(0, 0, -16.8) });

  // =============================================================
  // 3. CENTRAL COMBAT ZONE: "Central Grounds — The Last Stand"
  // =============================================================
  // Central Monument: "The Weeping Angel" Statue atop compact pedestal plinth
  // Positioned at Z = -2.2 facing SOUTH (towards player & camera)
  placeProp(parent, worldSlug, 'angel_statue', () => {
    const g = new THREE.Group();
    // Stepped Pedestal Base (Plinth)
    g.add(createCylinder(0.9, 1.05, 0.2, 16, mStone, 0, 0.1, 0));
    g.add(createBox(0.85, 0.42, 0.85, mStoneAlt, 0, 0.41, 0));
    g.add(createBox(0.68, 0.6, 0.68, mStone, 0, 0.92, 0));
    // Draped Sculpted Robes
    g.add(createCylinder(0.28, 0.42, 1.35, 8, mStoneAlt, 0, 1.9, 0));
    // Hooded head bowed slightly
    g.add(createSphere(0.22, 8, mStoneAlt, 0, 2.68, 0.08));
    // Arms crossed in prayer / holding a down-pointing sword
    g.add(createCylinder(0.04, 0.04, 1.1, 6, mStoneAlt, 0, 1.6, 0.25, 0.2, 0, 0));
    // Majestic spread wings sweeping back and up
    g.add(createBox(0.65, 1.45, 0.08, mStoneAlt, -0.52, 2.35, -0.22, -0.2, 0.35, 0.32));
    g.add(createBox(0.65, 1.45, 0.08, mStoneAlt, 0.52, 2.35, -0.22, -0.2, -0.35, -0.32));
    // Secondary outer wing feathers
    g.add(createBox(0.45, 1.1, 0.06, mStoneAlt, -0.82, 2.65, -0.32, -0.15, 0.45, 0.42));
    g.add(createBox(0.45, 1.1, 0.06, mStoneAlt, 0.82, 2.65, -0.32, -0.15, -0.45, -0.42));
    return g;
  }, { position: new THREE.Vector3(0, 0, -2.2), scale: new THREE.Vector3(1.15, 1.15, 1.15), rotationY: 0 });

  // 4 Victorian Iron Lampposts at 4 Diagonal Corners of the Central Grounds
  const centerLanternOffsets = [
    new THREE.Vector3(-3.2, 0, -3.2),
    new THREE.Vector3(3.2, 0, -3.2),
    new THREE.Vector3(-3.2, 0, 3.2),
    new THREE.Vector3(3.2, 0, 3.2),
  ];
  for (const pos of centerLanternOffsets) {
    placeProp(parent, worldSlug, 'lantern_post', () => {
      const g = new THREE.Group();
      // Cast iron pole and cross-arms
      g.add(createCylinder(0.06, 0.09, 2.2, 6, mIron, 0, 1.1, 0));
      g.add(createBox(0.4, 0.05, 0.05, mIron, 0, 2.05, 0));
      // Glowing warm lantern core
      g.add(createBox(0.24, 0.32, 0.24, mWarm, 0, 2.25, 0));
      // Iron cage frame around the light
      g.add(createBox(0.28, 0.04, 0.28, mIron, 0, 2.08, 0));
      g.add(createCone(0.24, 0.16, 4, mIron, 0, 2.48, 0));
      return g;
    }, { position: pos });
    addGlowSprite(pos.x, 2.25, pos.z, 2.4);
    addWarmPoint(pos.x, 2.25, pos.z, 2.4, 7.2);
  }

  // =============================================================
  // 4. WEST ZONE: "West Crypts — Forgotten Kings" & "West Graves"
  // =============================================================
  // Large Noble Mausoleum
  placeProp(parent, worldSlug, 'crypt_large', () => {
    const g = new THREE.Group();
    g.add(createBox(3.8, 0.35, 4.4, mStoneAlt, 0, 0.17, 0));
    g.add(createBox(3.4, 2.8, 4.0, mStone, 0, 1.6, 0));
    g.add(createBox(3.7, 0.45, 4.3, mStoneAlt, 0, 3.15, 0));
    g.add(createCone(2.8, 1.1, 4, mStoneAlt, 0, 3.85, 0, 0, Math.PI / 4, 0));
    // Fluted Columns
    g.add(createCylinder(0.22, 0.24, 2.6, 8, mStoneAlt, -1.4, 1.45, 2.05));
    g.add(createCylinder(0.22, 0.24, 2.6, 8, mStoneAlt, 1.4, 1.45, 2.05));
    // Barred Iron Door & Skull Crest
    g.add(createBox(1.3, 2.1, 0.12, mIron, 0, 1.15, 2.02));
    g.add(createBox(0.22, 0.22, 0.1, mStoneAlt, 0, 2.4, 2.06));
    // Sarcophagus Resting in Front
    g.add(createBox(1.2, 0.55, 2.2, mStoneAlt, 0, 0.28, 3.4));
    return g;
  }, { position: new THREE.Vector3(-8.2, 0, -12.5), rotationY: 0.35 });

  addWarmPoint(-8.2, 2.1, -10.5, 1.8, 6.5);
  addGlowSprite(-8.2, 2.1, -10.5, 1.5);

  // Twisted tree over the crypt
  placeProp(parent, worldSlug, 'dead_tree_twisted', () => {
    const g = new THREE.Group();
    g.add(createCylinder(0.3, 0.55, 2.4, 6, mWood, 0, 1.2, 0));
    g.add(createCylinder(0.2, 0.3, 2.2, 5, mWood, 0.5, 2.4, 0.3, 0.3, 0, -0.6));
    return g;
  }, { position: new THREE.Vector3(-9.8, 0, -11.0), rotationY: 0.5 });

  // West Graves: Orderly plots of weathered tombstones
  const westGraveOffsets = [
    { x: -5.6, z: -8.0, t: 'grave_a', rot: 0.1 },
    { x: -7.2, z: -8.2, t: 'grave_b', rot: -0.05 },
    { x: -8.8, z: -7.9, t: 'grave_cross', rot: 0.15 },
    { x: -5.4, z: -6.2, t: 'grave_cross', rot: -0.1 },
    { x: -7.0, z: -6.4, t: 'grave_broken', rot: 0.2 },
    { x: -8.6, z: -6.0, t: 'grave_a', rot: -0.15 },
    { x: -5.8, z: -4.4, t: 'grave_b', rot: 0.05 },
    { x: -7.4, z: -4.6, t: 'grave_a', rot: -0.2 },
    { x: -9.0, z: -4.2, t: 'grave_cross', rot: 0.1 },
    { x: -6.0, z: -2.6, t: 'grave_broken', rot: 0.25 },
    { x: -7.6, z: -2.8, t: 'grave_b', rot: -0.08 },
    { x: -9.2, z: -2.5, t: 'grave_a', rot: 0.12 },
  ];
  for (const gv of westGraveOffsets) {
    placeProp(parent, worldSlug, gv.t, () => {
      const g = new THREE.Group();
      g.add(createBox(0.48, 0.88, 0.18, mStone, 0, 0.44, 0));
      return g;
    }, { position: new THREE.Vector3(gv.x, 0, gv.z), rotationY: gv.rot });
  }

  // Lit candles on tombstones
  placeProp(parent, worldSlug, 'candle_cluster', () => {
    const g = new THREE.Group();
    g.add(createCylinder(0.04, 0.04, 0.35, 6, mStoneAlt, 0, 0.18, 0));
    g.add(createOcta(0.07, mWarm, 0, 0.4, 0));
    return g;
  }, { position: new THREE.Vector3(-5.4, 0, -6.0) });
  addGlowSprite(-5.4, 0.4, -6.0, 0.8);

  // Weathered Wooden Signpost ("Rest Still")
  const signpost = new THREE.Group();
  signpost.add(createCylinder(0.06, 0.07, 1.5, 6, mWood, 0, 0.75, 0));
  signpost.add(createBox(0.95, 0.45, 0.08, mWood, 0, 1.25, 0, 0, 0.18, 0));
  signpost.position.set(-4.5, 0, -5.2);
  parent.add(signpost);

  // =============================================================
  // 5. EAST ZONE: "East Statue — The Watcher" & "East Graves"
  // =============================================================
  // Raised Stone Terrace & "The Watcher" Statue
  const eastTerrace = new THREE.Group();
  eastTerrace.add(createBox(3.8, 0.65, 3.8, mStone, 0, 0.32, 0));
  eastTerrace.add(createBox(1.5, 0.6, 1.5, mStoneAlt, 0, 0.85, 0));
  eastTerrace.position.set(8.5, 0, -12.5);
  parent.add(eastTerrace);

  placeProp(parent, worldSlug, 'angel_statue', () => {
    const g = new THREE.Group();
    g.add(createCylinder(0.3, 0.44, 1.5, 8, mStoneAlt, 0, 1.85, 0));
    g.add(createSphere(0.24, 7, mStoneAlt, 0, 2.65, 0));
    g.add(createBox(0.9, 1.4, 0.1, mStoneAlt, -0.45, 2.3, -0.25, 0.3, -0.4, 0.35));
    g.add(createBox(0.9, 1.4, 0.1, mStoneAlt, 0.45, 2.3, -0.25, 0.3, 0.4, -0.35));
    // Staff in hand
    g.add(createCylinder(0.04, 0.04, 2.6, 6, mStoneAlt, 0.55, 2.0, 0.2));
    return g;
  }, { position: new THREE.Vector3(8.5, 0, -12.5), rotationY: -0.4 });

  // Burning Stone Braziers Flanking the Statue
  const brazierOffsets = [new THREE.Vector3(7.0, 0, -11.5), new THREE.Vector3(10.0, 0, -11.5)];
  for (const bz of brazierOffsets) {
    const brazier = new THREE.Group();
    brazier.add(createCylinder(0.22, 0.26, 1.1, 8, mStoneAlt, 0, 0.55, 0));
    brazier.add(createCylinder(0.38, 0.2, 0.25, 8, mIron, 0, 1.2, 0));
    brazier.add(createOcta(0.18, mWarm, 0, 1.35, 0));
    brazier.position.copy(bz);
    parent.add(brazier);
    addGlowSprite(bz.x, 1.35, bz.z, 1.4);
    addWarmPoint(bz.x, 1.35, bz.z, 1.5, 5.5);
  }

  // East Graves & Banner Archway ("Good Souls Rest Deeper")
  placeProp(parent, worldSlug, 'stone_arch', () => {
    const g = new THREE.Group();
    g.add(createBox(0.45, 2.6, 0.45, mStone, -1.3, 1.3, 0));
    g.add(createBox(0.45, 2.6, 0.45, mStone, 1.3, 1.3, 0));
    g.add(createBox(3.2, 0.5, 0.55, mStoneAlt, 0, 2.7, 0));
    g.add(createBox(0.85, 1.25, 0.04, mIron, 0, 1.85, 0));
    g.add(createOcta(0.14, mWarm, 0, 2.2, 0.3));
    return g;
  }, { position: new THREE.Vector3(4.8, 0, -5.5), rotationY: -0.2 });
  addGlowSprite(4.8, 2.2, -5.2, 1.3);

  // Small Eastern Crypt ("Silent Rest")
  placeProp(parent, worldSlug, 'crypt_small', () => {
    const g = new THREE.Group();
    g.add(createBox(2.2, 0.25, 2.8, mStoneAlt, 0, 0.12, 0));
    g.add(createBox(1.9, 1.7, 2.5, mStone, 0, 0.95, 0));
    g.add(createCone(1.6, 0.9, 4, mStoneAlt, 0, 2.15, 0, 0, Math.PI / 4, 0));
    g.add(createBox(0.9, 1.3, 0.1, mIron, 0, 0.75, 1.26));
    return g;
  }, { position: new THREE.Vector3(8.8, 0, -4.0), rotationY: -0.3 });

  const eastGraveOffsets = [
    { x: 5.8, z: -8.0, t: 'grave_cross', rot: -0.1 },
    { x: 7.4, z: -8.2, t: 'grave_a', rot: 0.12 },
    { x: 9.0, z: -7.8, t: 'grave_b', rot: -0.05 },
    { x: 5.6, z: -3.8, t: 'grave_b', rot: 0.1 },
    { x: 7.2, z: -3.6, t: 'grave_cross', rot: -0.15 },
    { x: 6.0, z: -2.2, t: 'grave_a', rot: 0.08 },
    { x: 7.6, z: -2.0, t: 'grave_broken', rot: -0.22 },
  ];
  for (const gv of eastGraveOffsets) {
    placeProp(parent, worldSlug, gv.t, () => {
      const g = new THREE.Group();
      g.add(createBox(0.48, 0.88, 0.18, mStone, 0, 0.44, 0));
      return g;
    }, { position: new THREE.Vector3(gv.x, 0, gv.z), rotationY: gv.rot });
  }

  // =============================================================
  // 6. SOUTHWEST ZONE: "The Pond — Shallow Water" & Footbridge
  // =============================================================
  // 3D Dark Water Mesh Plane (Recessed reflection plane)
  const pondWater = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 8.8), mWater);
  pondWater.rotation.x = -Math.PI / 2;
  pondWater.position.set(-7.5, 0.008, 10.5);
  parent.add(pondWater);

  // Arched Footbridge Crossing Pond Inlet from South to Center
  const bridge = new THREE.Group();
  // Arched wooden stringers
  bridge.add(createBox(0.18, 0.28, 3.6, mWood, -0.7, 0.28, 0));
  bridge.add(createBox(0.18, 0.28, 3.6, mWood, 0.7, 0.28, 0));
  // Wooden plank walkway
  for (let p = 0; p < 7; p++) {
    const z = -1.5 + p * 0.5;
    const archH = Math.sin((p / 6) * Math.PI) * 0.18;
    bridge.add(createBox(1.5, 0.08, 0.42, mWood, 0, 0.32 + archH, z));
  }
  // Railing posts
  bridge.add(createCylinder(0.045, 0.045, 0.85, 5, mWood, -0.75, 0.7, -1.4));
  bridge.add(createCylinder(0.045, 0.045, 0.85, 5, mWood, -0.75, 0.85, 0));
  bridge.add(createCylinder(0.045, 0.045, 0.85, 5, mWood, -0.75, 0.7, 1.4));
  bridge.add(createCylinder(0.045, 0.045, 0.85, 5, mWood, 0.75, 0.7, -1.4));
  bridge.add(createCylinder(0.045, 0.045, 0.85, 5, mWood, 0.75, 0.85, 0));
  bridge.add(createCylinder(0.045, 0.045, 0.85, 5, mWood, 0.75, 0.7, 1.4));
  bridge.add(createBox(0.06, 0.06, 3.4, mWood, -0.75, 1.05, 0));
  bridge.add(createBox(0.06, 0.06, 3.4, mWood, 0.75, 1.05, 0));

  bridge.position.set(-4.8, 0, 9.5);
  bridge.rotation.y = -0.32;
  parent.add(bridge);

  // Shoreline River Rocks & Reeds
  placeProp(parent, worldSlug, 'rock_cluster', () => {
    const g = new THREE.Group();
    g.add(createSphere(0.48, 6, mStone, 0, 0.32, 0));
    g.add(createSphere(0.34, 6, mStoneAlt, 0.35, 0.22, 0.15));
    return g;
  }, { position: new THREE.Vector3(-9.2, 0, 8.5) });

  // Gnarled dead weeping tree leaning over the water
  placeProp(parent, worldSlug, 'dead_tree_a', () => {
    const g = new THREE.Group();
    g.add(createCylinder(0.28, 0.5, 3.4, 6, mWood, 0, 1.7, 0, 0.22, 0, 0.3));
    return g;
  }, { position: new THREE.Vector3(-9.8, 0, 12.5), scale: new THREE.Vector3(1.3, 1.3, 1.3), rotationY: -0.6 });

  // =============================================================
  // 7. SOUTHEAST ZONE: "South Crypts — Sealed Below"
  // =============================================================
  placeProp(parent, worldSlug, 'crypt_large', () => {
    const g = new THREE.Group();
    g.add(createBox(3.4, 0.3, 3.8, mStoneAlt, 0, 0.15, 0));
    g.add(createBox(3.0, 2.2, 3.4, mStone, 0, 1.25, 0));
    // Domed vaulted roof
    g.add(createSphere(1.8, 8, mStoneAlt, 0, 2.2, 0));
    g.add(createBox(1.1, 1.7, 0.1, mIron, 0, 0.95, 1.72));
    return g;
  }, { position: new THREE.Vector3(7.8, 0, 10.5), rotationY: -0.45 });

  // Sarcophagus in front of south crypt
  const southSarcophagus = new THREE.Group();
  southSarcophagus.add(createBox(1.1, 0.52, 2.1, mStoneAlt, 0, 0.26, 0));
  southSarcophagus.position.set(6.2, 0, 12.2);
  southSarcophagus.rotation.y = 0.35;
  parent.add(southSarcophagus);

  // Lantern post illuminating the South Crypts lane
  placeProp(parent, worldSlug, 'lantern_post', () => {
    const g = new THREE.Group();
    g.add(createCylinder(0.06, 0.09, 2.0, 6, mIron, 0, 1.0, 0));
    g.add(createBox(0.32, 0.42, 0.32, mIron, 0, 2.1, 0));
    g.add(createOcta(0.14, mWarm, 0, 2.1, 0));
    return g;
  }, { position: new THREE.Vector3(5.5, 0, 8.8) });
  addGlowSprite(5.5, 2.1, 8.8, 1.4);
  addWarmPoint(5.5, 2.1, 8.8, 1.5, 5.5);

  // =============================================================
  // 8. SOUTH GATE ZONE: "South Gate — To Salvation?"
  // =============================================================
  placeProp(parent, worldSlug, 'iron_gate', () => {
    const g = new THREE.Group();
    // Massive Gatehouse Stone Pillars
    g.add(createBox(0.75, 3.4, 0.75, mStoneAlt, -2.5, 1.7, 0));
    g.add(createBox(0.75, 3.4, 0.75, mStoneAlt, 2.5, 1.7, 0));
    // Gothic Spiked Double Gate
    g.add(createBox(4.2, 2.6, 0.1, mIron, 0, 1.4, 0));

    // Two Hooded Cloaked Guardian Statues ("The Gatekeepers")
    for (const dir of [-1, 1]) {
      const gx = dir * 2.5;
      // Pedestal
      g.add(createBox(0.95, 0.9, 0.95, mStone, gx, 0.45, 0));
      // Robed cloaked body
      g.add(createCone(0.42, 1.5, 8, mStoneAlt, gx, 1.65, 0));
      // Hooded head
      g.add(createCone(0.25, 0.52, 6, mStoneAlt, gx, 2.5, 0.06, 0.18, 0, 0));
      // Outstretched arm holding glowing carriage lantern
      g.add(createBox(0.08, 0.08, 0.65, mStoneAlt, gx + dir * 0.22, 1.9, 0.4));
      g.add(createBox(0.24, 0.36, 0.24, mIron, gx + dir * 0.22, 1.65, 0.72));
      g.add(createOcta(0.12, mWarm, gx + dir * 0.22, 1.65, 0.72));
    }

    // Flight of stone steps descending into misty cliff abyss outside
    g.add(createBox(4.2, 0.16, 0.9, mStoneAlt, 0, -0.08, 0.9));
    g.add(createBox(4.6, 0.16, 0.9, mStoneAlt, 0, -0.24, 1.8));
    g.add(createBox(5.0, 0.16, 0.9, mStoneAlt, 0, -0.40, 2.7));
    return g;
  }, { position: new THREE.Vector3(0, 0, 19.5) });

  addWarmPoint(0, 2.2, 18.2, 2.0, 7.5);
  addGlowSprite(-2.3, 1.65, 20.2, 1.4);
  addGlowSprite(2.3, 1.65, 20.2, 1.4);

  // =============================================================
  // 9. DEAD TREES ALONG PERIMETER AND ZONE DIVIDERS
  // =============================================================

  // Dead Trees along zone dividers and outer perimeter
  const perimeterTrees = [
    { pos: new THREE.Vector3(-11.5, 0, -18.0), rot: 0.3, type: 'dead_tree_a' },
    { pos: new THREE.Vector3(11.5, 0, -18.0), rot: -0.4, type: 'dead_tree_b' },
    { pos: new THREE.Vector3(-11.8, 0, 0), rot: 0.15, type: 'dead_tree_twisted' },
    { pos: new THREE.Vector3(11.8, 0, 0), rot: -0.25, type: 'dead_tree_twisted' },
    { pos: new THREE.Vector3(-11.5, 0, 18.0), rot: 0.5, type: 'dead_tree_b' },
    { pos: new THREE.Vector3(11.5, 0, 18.0), rot: -0.3, type: 'dead_tree_a' },
  ];
  for (const t of perimeterTrees) {
    placeProp(parent, worldSlug, t.type, () => {
      const g = new THREE.Group();
      g.add(createCylinder(0.24, 0.42, 3.2, 6, mWood, 0, 1.6, 0));
      return g;
    }, { position: t.pos, scale: new THREE.Vector3(1.2, 1.2, 1.2), rotationY: t.rot });
  }
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
