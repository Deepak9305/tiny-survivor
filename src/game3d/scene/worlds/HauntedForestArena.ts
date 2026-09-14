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

export function buildForestGroundTexture(theme: BiomeTheme, seed: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  const dim = 1024;
  canvas.width = dim;
  canvas.height = dim;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const rng = seeded(seed);
  const baseColor = `#${theme.ground.toString(16).padStart(6, '0')}`;
  const deepColor = `#${theme.groundDeep.toString(16).padStart(6, '0')}`;
  const accentColor = `#${theme.accent.toString(16).padStart(6, '0')}`;

  // Base background fill (deep damp forest loam)
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, dim, dim);

  // 1. Organic soil, rich forest moss patches & decaying leaves
  for (let i = 0; i < 160; i++) {
    const x = rng() * dim;
    const y = rng() * dim;
    const rad = 45 + rng() * 120;
    const grad = ctx.createRadialGradient(x, y, 2, x, y, rad);
    grad.addColorStop(0, i % 3 === 0 ? '#10221e' : (i % 3 === 1 ? deepColor : '#1b3424'));
    grad.addColorStop(1, 'transparent');
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Twisted Ancient Root Veins & Natural Forest Paths
  const drawForestTrail = (fromX: number, fromZ: number, toX: number, toZ: number, pathWidth = 52) => {
    const p1 = toCanvasCoords(fromX, fromZ, dim);
    const p2 = toCanvasCoords(toX, toZ, dim);
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.hypot(dx, dy);
    const steps = Math.max(5, Math.floor(dist / 18));
    const nx = -dy / dist;
    const ny = dx / dist;

    // Trampled forest path
    ctx.beginPath();
    ctx.moveTo(p1.x - (nx * pathWidth) / 2, p1.y - (ny * pathWidth) / 2);
    ctx.lineTo(p2.x - (nx * pathWidth) / 2, p2.y - (ny * pathWidth) / 2);
    ctx.lineTo(p2.x + (nx * pathWidth) / 2, p2.y + (ny * pathWidth) / 2);
    ctx.lineTo(p1.x + (nx * pathWidth) / 2, p1.y + (ny * pathWidth) / 2);
    ctx.closePath();
    ctx.globalAlpha = 0.52;
    ctx.fillStyle = '#0c1815';
    ctx.fill();

    // Organic root networks crossing path
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const cx = p1.x + dx * t;
      const cy = p1.y + dy * t;
      const rx = (rng() - 0.5) * pathWidth * 0.7;
      const ry = (rng() - 0.5) * pathWidth * 0.7;
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = '#263a2c';
      ctx.beginPath();
      ctx.arc(cx + rx, cy + ry, 10 + rng() * 8, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  drawForestTrail(0, 0, 0, -18.0, 58);
  drawForestTrail(0, 0, 0, 18.0, 58);
  drawForestTrail(0, 0, -8.0, -10.0, 48);
  drawForestTrail(0, 0, 8.0, -10.0, 48);
  drawForestTrail(0, 0, -7.0, 9.5, 46);
  drawForestTrail(0, 0, 7.0, 10.0, 46);

  // 3. Central Spirit Clearing Roundel
  const center = toCanvasCoords(0, 0, dim);
  ctx.globalAlpha = 0.65;
  ctx.fillStyle = '#0a1614';
  ctx.beginPath();
  ctx.arc(center.x, center.y, 160, 0, Math.PI * 2);
  ctx.fill();

  // Concentric mystical spirit rings
  const ringRadii = [150, 115, 80, 45];
  for (let r = 0; r < ringRadii.length; r++) {
    const rad = ringRadii[r];
    ctx.globalAlpha = 0.42;
    ctx.strokeStyle = r % 2 === 0 ? '#386c52' : accentColor;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(center.x, center.y, rad, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 4. Bioluminescent Mushroom Spore Rings & Murky Forest Pools
  const bogCenter = toCanvasCoords(-7.2, 9.5, dim);
  ctx.globalAlpha = 0.75;
  ctx.fillStyle = '#06120e';
  ctx.beginPath();
  ctx.ellipse(bogCenter.x, bogCenter.y, 120, 90, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Spectral water sheen
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = '#14382e';
  ctx.beginPath();
  ctx.ellipse(bogCenter.x, bogCenter.y, 100, 72, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Moonlit specular shine
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = '#62f0d0';
  ctx.beginPath();
  ctx.arc(bogCenter.x - 12, bogCenter.y - 10, 6, 0, Math.PI * 2);
  ctx.fill();

  // Spore ring glow clusters
  for (let i = 0; i < 28; i++) {
    const sx = rng() * dim;
    const sy = rng() * dim;
    ctx.globalAlpha = 0.65;
    ctx.fillStyle = i % 2 === 0 ? '#38e5b4' : accentColor;
    ctx.beginPath();
    ctx.arc(sx, sy, 3 + rng() * 4, 0, Math.PI * 2);
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

export function buildHauntedForestArena(
  parent: THREE.Group,
  resources: SharedResources,
  theme: BiomeTheme,
  rng: () => number,
  low: boolean,
  occluders: THREE.Object3D[]
): { lanternPositions: THREE.Vector3[] } {
  const worldSlug = 'forest';
  const mBark = envMaterials.getWood(true);
  const mWood = envMaterials.getWood(false);
  const mStone = envMaterials.getStone(theme);
  const mStoneAlt = envMaterials.getStone(theme, true);
  const mPurple = envMaterials.getAccentEmissive(theme, 2.8);
  const mWarm = envMaterials.getWarmEmissive(theme, 3.2);

  const lanternPositions: THREE.Vector3[] = [];

  const addGlowSprite = (x: number, y: number, z: number, scale = 1.4, color = theme.warm) => {
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createGlowTexture(color),
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
  // 1. OUTER PERIMETER: Dense Giant Gnarled Trees & Rocky Ridges
  // =============================================================
  const boundX = ARENA_WIDTH / 2 - 0.6;
  const boundZ = ARENA_DEPTH / 2 - 0.8;

  const perimeterTrunks = [
    new THREE.Vector3(-boundX, 0, -boundZ),
    new THREE.Vector3(boundX, 0, -boundZ),
    new THREE.Vector3(-boundX, 0, boundZ),
    new THREE.Vector3(boundX, 0, boundZ),
    new THREE.Vector3(-boundX, 0, 0),
    new THREE.Vector3(boundX, 0, 0),
    new THREE.Vector3(-boundX, 0, -10),
    new THREE.Vector3(boundX, 0, -10),
    new THREE.Vector3(-boundX, 0, 10),
    new THREE.Vector3(boundX, 0, 10),
  ];

  for (const pos of perimeterTrunks) {
    const trunk = new THREE.Group();
    trunk.add(createCylinder(0.85, 1.4, 4.8, 8, mBark, 0, 2.4, 0));
    trunk.add(createBox(3.4, 0.6, 0.85, mBark, 0, 0.3, 0, 0, 0.4, 0));
    trunk.position.copy(pos);
    parent.add(trunk);
  }

  // =============================================================
  // 2. NORTH LANDMARK: "The Great Cursed Tree"
  // =============================================================
  placeProp(parent, worldSlug, 'cursed_tree_giant', () => {
    const g = new THREE.Group();
    g.add(createCylinder(1.3, 2.4, 5.8, 8, mBark, 0, 2.9, 0));
    // Giant twisting buttress roots
    g.add(createBox(4.6, 1.0, 1.3, mBark, 0, 0.5, 0, 0, 0.45, 0));
    g.add(createBox(1.3, 1.0, 4.6, mBark, 0, 0.5, 0, 0, -0.45, 0));
    // Spreading canopy limbs
    g.add(createCylinder(0.65, 1.1, 3.8, 6, mBark, -1.6, 5.4, 0.6, 0.25, 0, 0.5));
    g.add(createCylinder(0.65, 1.1, 3.8, 6, mBark, 1.6, 5.4, -0.6, -0.25, 0, -0.5));
    // Glowing spirit hollow
    g.add(createSphere(0.48, 8, mPurple, 0, 2.1, 1.8));
    return g;
  }, { position: new THREE.Vector3(0, 0, -17.5) }, true, occluders);

  addGlowSprite(0, 2.1, -15.8, 2.6, theme.accent);
  lanternPositions.push(new THREE.Vector3(0, 2.1, -15.8));

  // =============================================================
  // 3. EAST LANDMARK: "Spirit Shrine of the Pines"
  // =============================================================
  placeProp(parent, worldSlug, 'spirit_shrine', () => {
    const g = new THREE.Group();
    g.add(createBox(3.6, 0.4, 3.6, mStoneAlt, 0, 0.2, 0));
    // Torii-style wooden gateway
    g.add(createCylinder(0.2, 0.24, 3.2, 8, mWood, -1.4, 1.6, 0));
    g.add(createCylinder(0.2, 0.24, 3.2, 8, mWood, 1.4, 1.6, 0));
    g.add(createBox(3.8, 0.35, 0.45, mWood, 0, 3.1, 0));
    // Altar table with offering lantern
    g.add(createBox(1.6, 0.8, 1.0, mStone, 0, 0.6, -0.6));
    g.add(createBox(0.26, 0.34, 0.26, mWarm, 0, 1.18, -0.6));
    return g;
  }, { position: new THREE.Vector3(8.2, 0, -10.5), rotationY: -0.4 }, true, occluders);

  addGlowSprite(8.2, 1.2, -11.1, 2.2);
  lanternPositions.push(new THREE.Vector3(8.2, 1.2, -11.1));

  // =============================================================
  // 4. WEST LANDMARK: "Ancient Standing Stones & Broken Root Bridge"
  // =============================================================
  const westHenge = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 1.6 - 0.8;
    const stone = createCylinder(0.35, 0.45, 2.6, 6, mStone);
    stone.position.set(Math.cos(angle) * 2.2, 1.3, Math.sin(angle) * 2.2);
    stone.rotation.set((rng() - 0.5) * 0.2, rng() * Math.PI, (rng() - 0.5) * 0.2);
    westHenge.add(stone);
  }
  westHenge.position.set(-8.0, 0, -10.0);
  parent.add(westHenge);

  // =============================================================
  // 5. CENTRAL GROUNDS: "Ancient Spirit Well"
  // =============================================================
  placeProp(parent, worldSlug, 'spirit_well', () => {
    const g = new THREE.Group();
    g.add(createCylinder(1.1, 1.3, 0.65, 12, mStone, 0, 0.32, 0));
    g.add(createCylinder(0.85, 0.85, 0.1, 12, mPurple, 0, 0.62, 0));
    // 4 Flanking Guardian Shrine Lanterns
    for (const sx of [-1.8, 1.8]) {
      g.add(createCylinder(0.08, 0.12, 1.8, 6, mWood, sx, 0.9, 0));
      g.add(createBox(0.24, 0.3, 0.24, mWarm, sx, 1.9, 0));
    }
    return g;
  }, { position: new THREE.Vector3(0, 0, -1.8) }, true, occluders);

  addGlowSprite(-1.8, 1.9, -1.8, 1.8);
  addGlowSprite(1.8, 1.9, -1.8, 1.8);
  lanternPositions.push(new THREE.Vector3(0, 1.9, -1.8));

  // =============================================================
  // 6. SOUTHWEST & SOUTHEAST: Deep Bog & Hollow Ancient Log
  // =============================================================
  const hollowLog = new THREE.Group();
  hollowLog.add(createCylinder(0.7, 0.7, 4.2, 8, mBark, 0, 0.6, 0, Math.PI / 2, 0, 0.45));
  hollowLog.position.set(6.8, 0, 10.5);
  parent.add(hollowLog);

  // South Gate Crossing Pillars
  for (const sx of [-2.4, 2.4]) {
    const shrinePost = new THREE.Group();
    shrinePost.add(createCylinder(0.2, 0.28, 2.8, 8, mBark, 0, 1.4, 0));
    shrinePost.add(createBox(0.26, 0.32, 0.26, mWarm, 0, 2.8, 0));
    shrinePost.position.set(sx, 0, 18.5);
    parent.add(shrinePost);
    addGlowSprite(sx, 2.8, 18.5, 1.8);
    lanternPositions.push(new THREE.Vector3(sx, 2.8, 18.5));
  }

  return { lanternPositions };
}
