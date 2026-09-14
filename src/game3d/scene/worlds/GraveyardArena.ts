import * as THREE from 'three';
import { ARENA_DEPTH, ARENA_WIDTH } from '../../core/coordinates';
import { SharedResources } from '../../core/SharedResources';
import type { BiomeTheme } from '../BiomeTheme';
import { envMaterials } from '../EnvironmentMaterials';
import {
  createBox,
  createCone,
  createCylinder,
  createGlowTexture,
  createOcta,
  createSphere,
  createTorus,
  placeProp,
  seeded,
  toCanvasCoords,
} from './WorldBuilderUtils';

export function buildGraveyardGroundTexture(theme: BiomeTheme, seed: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  const dim = 1024;
  canvas.width = dim;
  canvas.height = dim;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const rng = seeded(seed);
  const baseColor = `#${theme.ground.toString(16).padStart(6, '0')}`;
  const deepColor = `#${theme.groundDeep.toString(16).padStart(6, '0')}`;

  // Base background fill
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, dim, dim);

  // 1. Organic cemetery soil noise, loam beds & ancient moss gradients
  for (let i = 0; i < 150; i++) {
    const x = rng() * dim;
    const y = rng() * dim;
    const rad = 40 + rng() * 110;
    const grad = ctx.createRadialGradient(x, y, 2, x, y, rad);
    grad.addColorStop(0, i % 3 === 0 ? '#101d2a' : (i % 3 === 1 ? deepColor : '#182b20'));
    grad.addColorStop(1, 'transparent');
    ctx.globalAlpha = 0.58;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Main Axial & Diagonal Flagstone Walkways
  const drawFlagstonePath = (fromX: number, fromZ: number, toX: number, toZ: number, pathWidth = 58) => {
    const p1 = toCanvasCoords(fromX, fromZ, dim);
    const p2 = toCanvasCoords(toX, toZ, dim);
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.hypot(dx, dy);
    const steps = Math.max(4, Math.floor(dist / 20));
    const nx = -dy / dist;
    const ny = dx / dist;

    // Dark mortar foundation under path
    ctx.beginPath();
    ctx.moveTo(p1.x - (nx * pathWidth) / 2, p1.y - (ny * pathWidth) / 2);
    ctx.lineTo(p2.x - (nx * pathWidth) / 2, p2.y - (ny * pathWidth) / 2);
    ctx.lineTo(p2.x + (nx * pathWidth) / 2, p2.y + (ny * pathWidth) / 2);
    ctx.lineTo(p1.x + (nx * pathWidth) / 2, p1.y + (ny * pathWidth) / 2);
    ctx.closePath();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#060c14';
    ctx.fill();

    // Flagstone pavers
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
        ctx.fillStyle = '#050a10';
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

  drawFlagstonePath(0, 0, 0, -19.5, 62);
  drawFlagstonePath(0, 0, 0, 19.5, 62);
  drawFlagstonePath(0, 0, -8.2, -12.5, 52);
  drawFlagstonePath(0, 0, 8.5, -12.5, 52);
  drawFlagstonePath(0, 0, -4.8, 9.5, 48);
  drawFlagstonePath(-4.8, 9.5, 0, 18.0, 48);
  drawFlagstonePath(0, 0, 7.8, 10.5, 48);
  drawFlagstonePath(7.8, 10.5, 0, 18.0, 48);

  // 3. Central Grounds Circular Dais & Ring Plaza
  const center = toCanvasCoords(0, 0, dim);
  ctx.globalAlpha = 0.65;
  ctx.fillStyle = '#081018';
  ctx.beginPath();
  ctx.arc(center.x, center.y, 168, 0, Math.PI * 2);
  ctx.fill();

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
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = '#060c14';
      ctx.fillRect(-7.5, -5.5, 15, 11);
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = (i + r) % 2 === 0 ? '#4a6076' : '#3d5267';
      ctx.fillRect(-7, -5, 14, 10);
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
  const pondCenter = toCanvasCoords(-7.5, 10.5, dim);
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = '#0e1820';
  ctx.beginPath();
  ctx.ellipse(pondCenter.x, pondCenter.y, 128, 98, -0.22, 0, Math.PI * 2);
  ctx.fill();

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

  // 5. Wet Moonlight Puddles
  const puddleLocations = [
    toCanvasCoords(0, -5.5, dim),
    toCanvasCoords(0, 5.5, dim),
    toCanvasCoords(-2.2, -1.8, dim),
    toCanvasCoords(2.4, -1.6, dim),
    toCanvasCoords(-3.2, 3.8, dim),
    toCanvasCoords(3.5, 4.2, dim),
    toCanvasCoords(-6.5, -9.0, dim),
    toCanvasCoords(6.8, -9.0, dim),
    toCanvasCoords(0, -14.5, dim),
    toCanvasCoords(0, 14.5, dim),
  ];

  for (const pl of puddleLocations) {
    const rx = 18 + rng() * 14;
    const ry = 12 + rng() * 10;
    const angle = rng() * 0.5 - 0.25;

    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#060e16';
    ctx.beginPath();
    ctx.ellipse(pl.x, pl.y, rx, ry, angle, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 0.55;
    ctx.fillStyle = '#1e384e';
    ctx.beginPath();
    ctx.ellipse(pl.x, pl.y, rx * 0.82, ry * 0.8, angle, 0, Math.PI * 2);
    ctx.fill();

    // Specular moon glint
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = '#d5f4ff';
    ctx.beginPath();
    ctx.arc(pl.x - rx * 0.25, pl.y - ry * 0.25, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(1, 1);
  texture.anisotropy = 4;
  return texture;
}

export function buildGraveyardArena(
  parent: THREE.Group,
  resources: SharedResources,
  theme: BiomeTheme,
  rng: () => number,
  low: boolean,
  occluders: THREE.Object3D[]
): { lanternPositions: THREE.Vector3[] } {
  const worldSlug = 'graveyard';
  const mStone = envMaterials.getStone(theme);
  const mStoneAlt = envMaterials.getStone(theme, true);
  const mWood = envMaterials.getWood(true);
  const mIron = envMaterials.getIron();
  const mWarm = envMaterials.getWarmEmissive(theme, 3.5);
  const mRoseGlass = resources.standardMaterial('gy-rose-glass', 0xff4411, { emissive: 0xff3300, emissiveIntensity: 2.8, roughness: 0.3 });
  const mWater = resources.standardMaterial('gy-pond-water', 0x071624, { roughness: 0.12, metalness: 0.85, emissive: 0x030d17, emissiveIntensity: 0.35 });

  const lanternPositions: THREE.Vector3[] = [];

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
  // 1. OUTER PERIMETER FORTRESS WALLS & CORNER BASTIONS
  // =============================================================
  const boundX = ARENA_WIDTH / 2 - 0.6; // ~13.4
  const boundZ = ARENA_DEPTH / 2 - 0.8; // ~21.2

  const addWallSegment = (x: number, z: number, sx: number, sz: number, rotY = 0) => {
    const g = new THREE.Group();
    g.add(createBox(sx, 1.9, sz, mStone, 0, 0.95, 0));
    g.add(createBox(sx * 1.02, 0.22, sz * 1.15, mStoneAlt, 0, 1.95, 0));
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

  addWallSegment(-8.3, -boundZ, 9.8, 0.75);
  addWallSegment(8.3, -boundZ, 9.8, 0.75);
  addWallSegment(-8.3, boundZ, 9.8, 0.75);
  addWallSegment(8.3, boundZ, 9.8, 0.75);
  addWallSegment(-boundX, 0, 0.75, boundZ * 2 - 1.2);
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

  // =============================================================
  // 2. NORTH GATE ZONE: "Chapel of the Fallen" Landmark Facade
  // =============================================================
  placeProp(parent, worldSlug, 'chapel_ruin', () => {
    const g = new THREE.Group();
    g.add(createBox(5.6, 4.4, 0.9, mStone, 0, 2.2, 0));
    g.add(createBox(2.4, 2.7, 1.1, resources.basicMaterial('chapel-void', 0x060c14), 0, 1.35, 0));
    g.add(createBox(2.2, 2.6, 0.12, mIron, 0, 1.3, 0.1));

    // Gothic Twin Spires
    g.add(createCylinder(0.42, 0.55, 4.8, 6, mStoneAlt, -2.4, 2.4, 0));
    g.add(createCone(0.55, 2.4, 6, mStoneAlt, -2.4, 5.8, 0));
    g.add(createCylinder(0.42, 0.55, 4.8, 6, mStoneAlt, 2.4, 2.4, 0));
    g.add(createCone(0.55, 2.4, 6, mStoneAlt, 2.4, 5.8, 0));

    // Rose Window
    g.add(createTorus(0.78, 0.12, 6, 16, mStoneAlt, 0, 3.4, 0.48));
    g.add(createCylinder(0.72, 0.72, 0.08, 12, mRoseGlass, 0, 3.4, 0.48, Math.PI / 2, 0, 0));

    // Steps descending
    g.add(createBox(4.4, 0.16, 0.9, mStoneAlt, 0, 0.24, 0.9));
    g.add(createBox(4.8, 0.16, 0.9, mStoneAlt, 0, 0.12, 1.6));

    // Gatehouse Lantern Pillars
    g.add(createBox(0.68, 2.8, 0.68, mStoneAlt, -2.2, 1.4, 1.8));
    g.add(createBox(0.68, 2.8, 0.68, mStoneAlt, 2.2, 1.4, 1.8));
    g.add(createBox(0.24, 0.32, 0.24, mWarm, -2.2, 2.5, 2.2));
    g.add(createBox(0.24, 0.32, 0.24, mWarm, 2.2, 2.5, 2.2));

    return g;
  }, { position: new THREE.Vector3(0, 0, -19.5) }, true, occluders);

  addGlowSprite(-2.2, 2.5, -17.3, 1.8);
  addGlowSprite(2.2, 2.5, -17.3, 1.8);
  lanternPositions.push(new THREE.Vector3(0, 2.4, -17.5));

  // =============================================================
  // 3. CENTRAL COMBAT ZONE: "Central Grounds — The Last Stand"
  // =============================================================
  // Weeping Angel statue atop pedestal plinth facing south
  placeProp(parent, worldSlug, 'angel_statue', () => {
    const g = new THREE.Group();
    g.add(createCylinder(0.9, 1.05, 0.2, 16, mStone, 0, 0.1, 0));
    g.add(createBox(0.85, 0.42, 0.85, mStoneAlt, 0, 0.41, 0));
    g.add(createBox(0.68, 0.6, 0.68, mStone, 0, 0.92, 0));
    g.add(createCylinder(0.28, 0.42, 1.35, 8, mStoneAlt, 0, 1.9, 0));
    g.add(createSphere(0.22, 8, mStoneAlt, 0, 2.68, 0.08));
    g.add(createCylinder(0.04, 0.04, 1.1, 6, mStoneAlt, 0, 1.6, 0.25, 0.2, 0, 0));

    // Wings
    g.add(createBox(0.65, 1.45, 0.08, mStoneAlt, -0.52, 2.35, -0.22, -0.2, 0.35, 0.32));
    g.add(createBox(0.65, 1.45, 0.08, mStoneAlt, 0.52, 2.35, -0.22, -0.2, -0.35, -0.32));
    g.add(createBox(0.45, 1.1, 0.06, mStoneAlt, -0.82, 2.65, -0.32, -0.15, 0.45, 0.42));
    g.add(createBox(0.45, 1.1, 0.06, mStoneAlt, 0.82, 2.65, -0.32, -0.15, -0.45, -0.42));
    return g;
  }, { position: new THREE.Vector3(0, 0, -2.2), scale: new THREE.Vector3(1.15, 1.15, 1.15), rotationY: 0 }, true, occluders);

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
      g.add(createCylinder(0.06, 0.09, 2.2, 6, mIron, 0, 1.1, 0));
      g.add(createBox(0.4, 0.05, 0.05, mIron, 0, 2.05, 0));
      g.add(createBox(0.24, 0.32, 0.24, mWarm, 0, 2.25, 0));
      g.add(createBox(0.28, 0.04, 0.28, mIron, 0, 2.08, 0));
      g.add(createCone(0.24, 0.16, 4, mIron, 0, 2.48, 0));
      return g;
    }, { position: pos });
    addGlowSprite(pos.x, 2.25, pos.z, 2.4);
    lanternPositions.push(new THREE.Vector3(pos.x, 2.25, pos.z));
  }

  // =============================================================
  // 4. WEST ZONE: "West Crypts — Forgotten Kings" & "West Graves"
  // =============================================================
  placeProp(parent, worldSlug, 'crypt_large', () => {
    const g = new THREE.Group();
    g.add(createBox(3.8, 0.35, 4.4, mStoneAlt, 0, 0.17, 0));
    g.add(createBox(3.4, 2.8, 4.0, mStone, 0, 1.6, 0));
    g.add(createBox(3.7, 0.45, 4.3, mStoneAlt, 0, 3.15, 0));
    g.add(createCone(2.8, 1.1, 4, mStoneAlt, 0, 3.85, 0, 0, Math.PI / 4, 0));
    g.add(createCylinder(0.22, 0.24, 2.6, 8, mStoneAlt, -1.4, 1.45, 2.05));
    g.add(createCylinder(0.22, 0.24, 2.6, 8, mStoneAlt, 1.4, 1.45, 2.05));
    g.add(createBox(1.3, 2.1, 0.12, mIron, 0, 1.15, 2.02));
    g.add(createBox(1.2, 0.55, 2.2, mStoneAlt, 0, 0.28, 3.4));
    return g;
  }, { position: new THREE.Vector3(-8.2, 0, -12.5), rotationY: 0.35 }, true, occluders);

  addGlowSprite(-8.2, 2.1, -10.5, 1.8);
  lanternPositions.push(new THREE.Vector3(-8.2, 2.1, -10.5));

  // West Graves: Orderly plots of weathered tombstones
  const westGraveOffsets = [
    { x: -5.6, z: -8.0, rot: 0.1 },
    { x: -7.2, z: -8.2, rot: -0.05 },
    { x: -8.8, z: -7.9, rot: 0.15 },
    { x: -5.4, z: -6.2, rot: -0.1 },
    { x: -7.0, z: -6.4, rot: 0.2 },
    { x: -8.6, z: -6.0, rot: -0.15 },
    { x: -5.8, z: -4.4, rot: 0.05 },
    { x: -7.4, z: -4.6, rot: -0.2 },
    { x: -9.0, z: -4.2, rot: 0.1 },
  ];
  for (const gv of westGraveOffsets) {
    placeProp(parent, worldSlug, 'grave_a', () => {
      const g = new THREE.Group();
      g.add(createBox(0.48, 0.88, 0.18, mStone, 0, 0.44, 0));
      return g;
    }, { position: new THREE.Vector3(gv.x, 0, gv.z), rotationY: gv.rot });
  }

  // =============================================================
  // 5. EAST ZONE: "East Statue — The Watcher" & "East Graves"
  // =============================================================
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
    g.add(createCylinder(0.04, 0.04, 2.6, 6, mStoneAlt, 0.55, 2.0, 0.2));
    return g;
  }, { position: new THREE.Vector3(8.5, 0, -12.5), rotationY: -0.4 }, true, occluders);

  // Burning Stone Braziers Flanking the Statue
  for (const bx of [7.0, 10.0]) {
    placeProp(parent, worldSlug, 'brazier', () => {
      const g = new THREE.Group();
      g.add(createCylinder(0.22, 0.26, 1.1, 8, mStoneAlt, 0, 0.55, 0));
      g.add(createCylinder(0.38, 0.2, 0.25, 8, mIron, 0, 1.2, 0));
      g.add(createBox(0.24, 0.24, 0.24, mWarm, 0, 1.35, 0));
      return g;
    }, { position: new THREE.Vector3(bx, 0, -11.5) });
    addGlowSprite(bx, 1.35, -11.5, 1.8);
    lanternPositions.push(new THREE.Vector3(bx, 1.35, -11.5));
  }

  // =============================================================
  // 6. SOUTHWEST ZONE: "The Pond" & Arched Footbridge
  // =============================================================
  const pondWater = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 8.8), mWater);
  pondWater.rotation.x = -Math.PI / 2;
  pondWater.position.set(-7.5, 0.008, 10.5);
  parent.add(pondWater);

  const bridge = new THREE.Group();
  bridge.add(createBox(0.18, 0.28, 3.6, mWood, -0.7, 0.28, 0));
  bridge.add(createBox(0.18, 0.28, 3.6, mWood, 0.7, 0.28, 0));
  for (let p = 0; p < 7; p++) {
    const z = -1.5 + p * 0.5;
    const archH = Math.sin((p / 6) * Math.PI) * 0.18;
    bridge.add(createBox(1.5, 0.08, 0.42, mWood, 0, 0.32 + archH, z));
  }
  bridge.position.set(-4.8, 0, 9.5);
  bridge.rotation.y = -0.32;
  parent.add(bridge);

  // =============================================================
  // 7. SOUTHEAST ZONE: "South Crypts — Sealed Below"
  // =============================================================
  placeProp(parent, worldSlug, 'crypt_large', () => {
    const g = new THREE.Group();
    g.add(createBox(3.4, 0.3, 3.8, mStoneAlt, 0, 0.15, 0));
    g.add(createBox(3.0, 2.2, 3.4, mStone, 0, 1.25, 0));
    g.add(createSphere(1.8, 8, mStoneAlt, 0, 2.2, 0));
    g.add(createBox(1.1, 1.7, 0.1, mIron, 0, 0.95, 1.72));
    return g;
  }, { position: new THREE.Vector3(7.8, 0, 10.5), rotationY: -0.45 }, true, occluders);

  // =============================================================
  // 8. SOUTH GATE ZONE: "South Gate — To Salvation?"
  // =============================================================
  placeProp(parent, worldSlug, 'iron_gate', () => {
    const g = new THREE.Group();
    g.add(createBox(0.75, 3.4, 0.75, mStoneAlt, -2.5, 1.7, 0));
    g.add(createBox(0.75, 3.4, 0.75, mStoneAlt, 2.5, 1.7, 0));
    g.add(createBox(4.2, 2.6, 0.1, mIron, 0, 1.4, 0));

    // Two Hooded Guardian Statues holding lanterns
    for (const dir of [-1, 1]) {
      const gx = dir * 2.5;
      g.add(createBox(0.95, 0.9, 0.95, mStone, gx, 0.45, 0));
      g.add(createCone(0.42, 1.5, 8, mStoneAlt, gx, 1.65, 0));
      g.add(createCone(0.25, 0.52, 6, mStoneAlt, gx, 2.5, 0.06, 0.18, 0, 0));
      g.add(createBox(0.08, 0.08, 0.65, mStoneAlt, gx + dir * 0.22, 1.9, 0.4));
      g.add(createBox(0.24, 0.32, 0.24, mWarm, gx + dir * 0.22, 1.65, 0.72));
    }

    g.add(createBox(4.2, 0.16, 0.9, mStoneAlt, 0, -0.08, 0.9));
    g.add(createBox(4.6, 0.16, 0.9, mStoneAlt, 0, -0.24, 1.8));
    return g;
  }, { position: new THREE.Vector3(0, 0, 19.5) }, true, occluders);

  addGlowSprite(-2.3, 1.65, 20.2, 1.8);
  addGlowSprite(2.3, 1.65, 20.2, 1.8);
  lanternPositions.push(new THREE.Vector3(0, 2.0, 18.5));

  return { lanternPositions };
}
