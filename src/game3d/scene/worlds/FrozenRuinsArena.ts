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

export function buildFrozenGroundTexture(theme: BiomeTheme, seed: number): THREE.CanvasTexture {
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

  // Base background fill (dark ancient frozen granite)
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, dim, dim);

  // 1. Dark ancient stone variations & permafrost patches
  for (let i = 0; i < 150; i++) {
    const x = rng() * dim;
    const y = rng() * dim;
    const rad = 40 + rng() * 110;
    const grad = ctx.createRadialGradient(x, y, 4, x, y, rad);
    grad.addColorStop(0, i % 3 === 0 ? '#101a28' : (i % 3 === 1 ? deepColor : '#182536'));
    grad.addColorStop(1, 'transparent');
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Glacial Ice Veins & Packed Snow Trails
  const drawSnowPath = (fromX: number, fromZ: number, toX: number, toZ: number, pathWidth = 54) => {
    const p1 = toCanvasCoords(fromX, fromZ, dim);
    const p2 = toCanvasCoords(toX, toZ, dim);
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.hypot(dx, dy);
    const nx = -dy / dist;
    const ny = dx / dist;

    // Packed frost path
    ctx.beginPath();
    ctx.moveTo(p1.x - (nx * pathWidth) / 2, p1.y - (ny * pathWidth) / 2);
    ctx.lineTo(p2.x - (nx * pathWidth) / 2, p2.y - (ny * pathWidth) / 2);
    ctx.lineTo(p2.x + (nx * pathWidth) / 2, p2.y + (ny * pathWidth) / 2);
    ctx.lineTo(p1.x + (nx * pathWidth) / 2, p1.y + (ny * pathWidth) / 2);
    ctx.closePath();
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = '#1e3046';
    ctx.fill();

    // Snow drifts along path edges
    const steps = Math.max(6, Math.floor(dist / 22));
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const cx = p1.x + dx * t;
      const cy = p1.y + dy * t;
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#b0d6eb';
      ctx.beginPath();
      ctx.arc(cx + (rng() - 0.5) * pathWidth * 0.8, cy + (rng() - 0.5) * pathWidth * 0.8, 8 + rng() * 10, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  drawSnowPath(0, 0, 0, -18.5, 60);
  drawSnowPath(0, 0, 0, 18.5, 60);
  drawSnowPath(0, 0, -8.2, -11.5, 50);
  drawSnowPath(0, 0, 8.5, -11.5, 50);
  drawSnowPath(0, 0, -7.5, 9.8, 48);
  drawSnowPath(0, 0, 7.8, 11.0, 48);

  // 3. Central Temple Dais & Runic Ice Circle
  const center = toCanvasCoords(0, 0, dim);
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = '#162334';
  ctx.beginPath();
  ctx.arc(center.x, center.y, 165, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.75;
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(center.x, center.y, 140, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#7dd3fc';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(center.x, center.y, 90, 0, Math.PI * 2);
  ctx.stroke();

  // 4. Southwest Frozen Mere / Ice Sheet
  const pondC = toCanvasCoords(-7.5, 9.8, dim);
  const iceGrad = ctx.createRadialGradient(pondC.x, pondC.y, 10, pondC.x, pondC.y, 100);
  iceGrad.addColorStop(0, '#7dd3fc');
  iceGrad.addColorStop(0.5, '#38bdf8');
  iceGrad.addColorStop(0.85, '#0f2742');
  iceGrad.addColorStop(1, 'transparent');
  ctx.globalAlpha = 0.75;
  ctx.fillStyle = iceGrad;
  ctx.beginPath();
  ctx.arc(pondC.x, pondC.y, 100, 0, Math.PI * 2);
  ctx.fill();

  // Ice fractures across frozen mere
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.8;
  ctx.globalAlpha = 0.7;
  for (let i = 0; i < 7; i++) {
    const ang = (i / 7) * Math.PI * 2 + rng() * 0.3;
    ctx.beginPath();
    ctx.moveTo(pondC.x, pondC.y);
    ctx.lineTo(pondC.x + Math.cos(ang) * (60 + rng() * 30), pondC.y + Math.sin(ang) * (60 + rng() * 30));
    ctx.stroke();
  }

  // 5. Ancient Temple Flagstones & Fractured Slabs
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = '#2d4460';
  ctx.lineWidth = 2.5;
  for (let gx = -10; gx <= 10; gx += 2.5) {
    for (let gz = -14; gz <= 14; gz += 2.5) {
      if (Math.hypot(gx, gz) < 3.2 || Math.hypot(gx - (-7.5), gz - 9.8) < 3.0) continue;
      if (rng() > 0.45) {
        const pt = toCanvasCoords(gx, gz, dim);
        const sz = 24 + rng() * 12;
        ctx.strokeRect(pt.x - sz / 2, pt.y - sz / 2, sz, sz);
      }
    }
  }

  // 6. Snow Drifts & Frost Edge Crust
  ctx.fillStyle = '#dbeafe';
  for (let i = 0; i < 90; i++) {
    const ang = rng() * Math.PI * 2;
    const rad = (dim * 0.44) + rng() * (dim * 0.08);
    const sx = dim / 2 + Math.cos(ang) * rad;
    const sy = dim / 2 + Math.sin(ang) * rad;
    ctx.globalAlpha = 0.45 + rng() * 0.3;
    ctx.beginPath();
    ctx.arc(sx, sy, 25 + rng() * 50, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(1, 1);
  texture.needsUpdate = true;
  return texture;
}

export function buildFrozenRuinsArena(
  parent: THREE.Group,
  resources: SharedResources,
  theme: BiomeTheme,
  rng: () => number,
  low: boolean,
  occluders: THREE.Object3D[]
): { lanternPositions: THREE.Vector3[] } {
  const worldSlug = 'frozen' as const;
  const lanternPositions: THREE.Vector3[] = [];

  const mStone = envMaterials.stone;
  const mStoneAlt = envMaterials.wetStone;
  const mIce = envMaterials.ice;
  const mWarm = envMaterials.warmLight;
  const mCyan = envMaterials.cyanCrystal;

  const glowTex = createGlowTexture(0x7dd3fc);
  const addGlowSprite = (x: number, y: number, z: number, scale = 2.0) => {
    const mat = new THREE.SpriteMaterial({
      map: glowTex,
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const sp = new THREE.Sprite(mat);
    sp.position.set(x, y, z);
    sp.scale.set(scale, scale, 1);
    parent.add(sp);
  };

  const halfW = ARENA_WIDTH / 2;
  const halfD = ARENA_DEPTH / 2;

  // =============================================================
  // BOUNDARY: Ice Cliffs, Cragged Walls & Snow Banks
  // =============================================================
  const boundaryGroup = new THREE.Group();
  const buildCliffSpire = (x: number, z: number, h: number) => {
    const g = new THREE.Group();
    g.add(createCone(1.6, h, 6, mIce, 0, h / 2, 0));
    g.add(createBox(2.2, h * 0.7, 2.2, mStone, 0, (h * 0.7) / 2, 0, 0, rng() * Math.PI, 0));
    g.position.set(x, 0, z);
    return g;
  };

  // North & South perimeter cliffs
  for (let x = -halfW; x <= halfW; x += 3.2) {
    if (Math.abs(x) > 3.0) {
      boundaryGroup.add(buildCliffSpire(x + (rng() - 0.5) * 0.6, -halfD - 1.2, 5.0 + rng() * 2.5));
    }
    if (Math.abs(x) > 3.0) {
      boundaryGroup.add(buildCliffSpire(x + (rng() - 0.5) * 0.6, halfD + 1.2, 4.8 + rng() * 2.2));
    }
  }

  // East & West perimeter cliffs
  for (let z = -halfD; z <= halfD; z += 3.4) {
    boundaryGroup.add(buildCliffSpire(-halfW - 1.2, z + (rng() - 0.5) * 0.6, 5.2 + rng() * 2.5));
    boundaryGroup.add(buildCliffSpire(halfW + 1.2, z + (rng() - 0.5) * 0.6, 5.2 + rng() * 2.5));
  }
  parent.add(boundaryGroup);

  // =============================================================
  // 1. NORTH LANDMARK: "Great Ruined Frozen Temple Gate"
  // =============================================================
  placeProp(parent, worldSlug, 'frozen_temple_gate', () => {
    const g = new THREE.Group();
    // Colossal dual ice pillars
    g.add(createCylinder(0.7, 0.85, 6.2, 8, mStone, -3.2, 3.1, 0));
    g.add(createCylinder(0.7, 0.85, 6.2, 8, mStone, 3.2, 3.1, 0));
    // Ice encrusting on pillars
    g.add(createCone(0.85, 2.8, 6, mIce, -3.2, 5.2, 0));
    g.add(createCone(0.85, 2.8, 6, mIce, 3.2, 5.2, 0));
    // Massive fractured lintel arch
    g.add(createBox(8.4, 1.1, 1.4, mStoneAlt, 0, 6.2, 0));
    // Triangular ruined pediment with central frost sigil
    g.add(createCone(2.8, 2.2, 3, mStone, 0, 7.8, 0, 0, 0, Math.PI));
    g.add(createOcta(0.9, mCyan, 0, 7.2, 0.8));
    // Flanking frozen brazier pedestals
    g.add(createBox(0.9, 1.4, 0.9, mStone, -4.6, 0.7, 0.8));
    g.add(createBox(0.9, 1.4, 0.9, mStone, 4.6, 0.7, 0.8));
    g.add(createOcta(0.4, mCyan, -4.6, 1.7, 0.8));
    g.add(createOcta(0.4, mCyan, 4.6, 1.7, 0.8));
    return g;
  }, { position: new THREE.Vector3(0, 0, -19.5) }, true, occluders);

  addGlowSprite(-4.6, 1.7, -18.7, 2.4);
  addGlowSprite(4.6, 1.7, -18.7, 2.4);
  lanternPositions.push(new THREE.Vector3(0, 3.5, -18.7));

  // =============================================================
  // 2. WEST LANDMARK: "Collapsed Hall of Pillars"
  // =============================================================
  placeProp(parent, worldSlug, 'collapsed_hall', () => {
    const g = new THREE.Group();
    // Base foundation terrace
    g.add(createBox(5.0, 0.4, 5.0, mStoneAlt, 0, 0.2, 0));
    // Toppled & upright fluted columns
    g.add(createCylinder(0.45, 0.5, 4.4, 8, mStone, -1.5, 2.2, -1.2));
    g.add(createCylinder(0.45, 0.5, 2.8, 8, mStone, 1.5, 1.4, -1.2));
    // Toppled pillar lying on ground
    g.add(createCylinder(0.42, 0.42, 3.6, 8, mStone, 0, 0.5, 1.2, 0, 0.3, Math.PI / 2));
    // Frost crystal protruding from collapsed stone
    g.add(createCone(0.5, 2.2, 6, mIce, -1.2, 1.1, 1.0));
    return g;
  }, { position: new THREE.Vector3(-8.2, 0, -11.5) }, true, occluders);

  // =============================================================
  // 3. EAST LANDMARK: "Frozen Warrior Statue Court"
  // =============================================================
  placeProp(parent, worldSlug, 'warrior_court', () => {
    const g = new THREE.Group();
    // Tiered dais
    g.add(createBox(4.4, 0.4, 4.4, mStone, 0, 0.2, 0));
    g.add(createBox(3.0, 0.4, 3.0, mStoneAlt, 0, 0.6, 0));
    // Statue pedestal
    g.add(createBox(1.4, 1.2, 1.4, mStone, 0, 1.4, 0));
    // Armored warrior figure (geometric stylization)
    g.add(createBox(0.9, 1.5, 0.6, envMaterials.iron, 0, 2.75, 0)); // Torso
    g.add(createSphere(0.35, mStone, 0, 3.8, 0)); // Helmet
    g.add(createBox(0.2, 2.4, 0.4, mIce, 0.6, 2.6, 0.4)); // Frost Greatsword
    // 4 Corner Braziers
    for (const [cx, cz] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]]) {
      g.add(createCylinder(0.2, 0.25, 1.1, 6, mStone, cx, 0.55, cz));
      g.add(createOcta(0.2, mCyan, cx, 1.2, cz));
    }
    return g;
  }, { position: new THREE.Vector3(8.5, 0, -11.5) }, true, occluders);

  addGlowSprite(8.5, 1.6, -11.5, 2.5);
  lanternPositions.push(new THREE.Vector3(8.5, 1.6, -11.5));

  // =============================================================
  // 4. CENTRAL LANDMARK: "Central Frost Monolith"
  // =============================================================
  placeProp(parent, worldSlug, 'frost_monolith', () => {
    const g = new THREE.Group();
    // Stepped circular plinth
    g.add(createCylinder(2.0, 2.3, 0.35, 12, mStoneAlt, 0, 0.18, 0));
    g.add(createCylinder(1.4, 1.6, 0.35, 12, mStone, 0, 0.52, 0));
    // Great glacial crystal obelisk
    g.add(createOcta(1.3, mIce, 0, 2.3, 0));
    g.add(createCone(0.5, 2.4, 6, mCyan, 0, 3.8, 0));
    // 2 Flanking frost beacons
    for (const sx of [-1.9, 1.9]) {
      g.add(createCylinder(0.18, 0.22, 1.6, 6, mStone, sx, 0.8, 0));
      g.add(createOcta(0.32, mCyan, sx, 1.8, 0));
    }
    return g;
  }, { position: new THREE.Vector3(0, 0, -2.0) }, true, occluders);

  addGlowSprite(0, 2.6, -2.0, 3.2);
  lanternPositions.push(new THREE.Vector3(0, 2.6, -2.0));

  // =============================================================
  // 5. SOUTHWEST: "Glacier Spire & Frozen Mere"
  // =============================================================
  const glacierGroup = new THREE.Group();
  glacierGroup.add(createCylinder(2.2, 2.4, 0.15, 16, mIce, 0, 0.08, 0));
  // Jagged ice clusters
  for (let i = 0; i < 4; i++) {
    const ang = (i / 4) * Math.PI * 2;
    const spire = createCone(0.45, 2.6 + rng() * 1.5, 5, mIce);
    spire.position.set(Math.cos(ang) * 1.4, 1.3, Math.sin(ang) * 1.4);
    spire.rotation.set((rng() - 0.5) * 0.3, rng() * Math.PI, (rng() - 0.5) * 0.3);
    glacierGroup.add(spire);
  }
  glacierGroup.position.set(-7.5, 0, 9.8);
  parent.add(glacierGroup);

  // =============================================================
  // 6. SOUTHEAST: "Ruined Crypt of the Frost King"
  // =============================================================
  placeProp(parent, worldSlug, 'frost_king_crypt', () => {
    const g = new THREE.Group();
    g.add(createBox(3.4, 0.4, 3.4, mStoneAlt, 0, 0.2, 0));
    // Heavy sarcophagus
    g.add(createBox(1.5, 0.9, 2.4, mStone, 0, 0.7, 0));
    // Cracked ice lid
    g.add(createBox(1.65, 0.3, 2.55, mIce, 0.15, 1.25, 0, 0, 0, 0.08));
    return g;
  }, { position: new THREE.Vector3(7.8, 0, 11.0) }, true, occluders);

  // South Gate Crossing Pillars
  for (const sx of [-2.6, 2.6]) {
    const gatePillar = new THREE.Group();
    gatePillar.add(createCylinder(0.35, 0.45, 3.4, 8, mStone, 0, 1.7, 0));
    gatePillar.add(createCone(0.45, 1.2, 6, mIce, 0, 3.8, 0));
    gatePillar.position.set(sx, 0, 18.5);
    parent.add(gatePillar);
    addGlowSprite(sx, 3.2, 18.5, 2.0);
    lanternPositions.push(new THREE.Vector3(sx, 3.2, 18.5));
  }

  return { lanternPositions };
}
