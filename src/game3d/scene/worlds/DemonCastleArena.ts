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

export function buildCastleGroundTexture(theme: BiomeTheme, seed: number): THREE.CanvasTexture {
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

  // Base fill: dark basalt and blackened ash
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, dim, dim);

  // 1. Ash dust and charred stone variations
  for (let i = 0; i < 160; i++) {
    const x = rng() * dim;
    const y = rng() * dim;
    const rad = 45 + rng() * 120;
    const grad = ctx.createRadialGradient(x, y, 4, x, y, rad);
    grad.addColorStop(0, i % 3 === 0 ? '#1a0d0d' : (i % 3 === 1 ? deepColor : '#221111'));
    grad.addColorStop(1, 'transparent');
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Molten Magma Veins & Fissures
  const drawMagmaFissure = (fromX: number, fromZ: number, toX: number, toZ: number, pathWidth = 52) => {
    const p1 = toCanvasCoords(fromX, fromZ, dim);
    const p2 = toCanvasCoords(toX, toZ, dim);
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.hypot(dx, dy);
    const nx = -dy / dist;
    const ny = dx / dist;

    // Dark volcanic ash flagstone lane
    ctx.beginPath();
    ctx.moveTo(p1.x - (nx * pathWidth) / 2, p1.y - (ny * pathWidth) / 2);
    ctx.lineTo(p2.x - (nx * pathWidth) / 2, p2.y - (ny * pathWidth) / 2);
    ctx.lineTo(p2.x + (nx * pathWidth) / 2, p2.y + (ny * pathWidth) / 2);
    ctx.lineTo(p1.x + (nx * pathWidth) / 2, p1.y + (ny * pathWidth) / 2);
    ctx.closePath();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#140a0a';
    ctx.fill();

    // Glowing magma fissure center
    const steps = Math.max(6, Math.floor(dist / 20));
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 3.5;
    ctx.globalAlpha = 0.65;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    for (let s = 1; s < steps; s++) {
      const t = s / steps;
      const jitter = (rng() - 0.5) * 14;
      ctx.lineTo(p1.x + dx * t + nx * jitter, p1.y + dy * t + ny * jitter);
    }
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    // Hot ember core
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.2;
    ctx.globalAlpha = 0.8;
    ctx.stroke();
  };

  drawMagmaFissure(0, 0, 0, -18.5, 60);
  drawMagmaFissure(0, 0, 0, 18.5, 60);
  drawMagmaFissure(0, 0, -8.0, -11.4, 48);
  drawMagmaFissure(0, 0, 8.1, -11.4, 48);
  drawMagmaFissure(0, 0, -7.5, 10.2, 48);
  drawMagmaFissure(0, 0, 7.9, 10.9, 48);

  // 3. Central Infernal Rune Circle
  const center = toCanvasCoords(0, 0, dim);
  ctx.globalAlpha = 0.65;
  ctx.fillStyle = '#1e0a0a';
  ctx.beginPath();
  ctx.arc(center.x, center.y, 165, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.8;
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(center.x, center.y, 140, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#f97316';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(center.x, center.y, 90, 0, Math.PI * 2);
  ctx.stroke();

  // Inscribed infernal pentagram / runic star
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a1 = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const px = center.x + Math.cos(a1) * 85;
    const py = center.y + Math.sin(a1) * 85;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();

  // 4. Southwest Magma Chasm Pool
  const lavaC = toCanvasCoords(-7.5, 10.2, dim);
  const lavaGrad = ctx.createRadialGradient(lavaC.x, lavaC.y, 10, lavaC.x, lavaC.y, 105);
  lavaGrad.addColorStop(0, '#fef08a');
  lavaGrad.addColorStop(0.35, '#f97316');
  lavaGrad.addColorStop(0.7, '#dc2626');
  lavaGrad.addColorStop(0.95, '#1e0505');
  lavaGrad.addColorStop(1, 'transparent');
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = lavaGrad;
  ctx.beginPath();
  ctx.arc(lavaC.x, lavaC.y, 105, 0, Math.PI * 2);
  ctx.fill();

  // 5. Obsidian Pavement Flagstones
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = '#381616';
  ctx.lineWidth = 2.5;
  for (let gx = -10; gx <= 10; gx += 2.5) {
    for (let gz = -14; gz <= 14; gz += 2.5) {
      if (Math.hypot(gx, gz) < 3.2 || Math.hypot(gx - (-7.5), gz - 10.2) < 3.0) continue;
      if (rng() > 0.42) {
        const pt = toCanvasCoords(gx, gz, dim);
        const sz = 24 + rng() * 12;
        ctx.strokeRect(pt.x - sz / 2, pt.y - sz / 2, sz, sz);
      }
    }
  }

  // 6. Perimeter Bastion Ash & Crag Rim
  ctx.fillStyle = '#0a0303';
  for (let i = 0; i < 90; i++) {
    const ang = rng() * Math.PI * 2;
    const rad = (dim * 0.44) + rng() * (dim * 0.08);
    const sx = dim / 2 + Math.cos(ang) * rad;
    const sy = dim / 2 + Math.sin(ang) * rad;
    ctx.globalAlpha = 0.55 + rng() * 0.3;
    ctx.beginPath();
    ctx.arc(sx, sy, 30 + rng() * 50, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(1, 1);
  texture.needsUpdate = true;
  return texture;
}

export function buildDemonCastleArena(
  parent: THREE.Group,
  resources: SharedResources,
  theme: BiomeTheme,
  rng: () => number,
  low: boolean,
  occluders: THREE.Object3D[]
): { lanternPositions: THREE.Vector3[] } {
  const worldSlug = 'castle' as const;
  const lanternPositions: THREE.Vector3[] = [];

  const mObsidian = envMaterials.obsidian;
  const mIron = envMaterials.iron;
  const mMagma = envMaterials.magma;
  const mStone = envMaterials.stone;
  const mStoneAlt = envMaterials.wetStone;
  const mWarm = envMaterials.warmLight;

  const glowTex = createGlowTexture(0xf97316);
  const addGlowSprite = (x: number, y: number, z: number, scale = 2.2) => {
    const mat = new THREE.SpriteMaterial({
      map: glowTex,
      color: 0xf97316,
      transparent: true,
      opacity: 0.88,
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
  // BOUNDARY: Fortress Ramparts, Spiked Bastions & Lava Chasms
  // =============================================================
  const boundaryGroup = new THREE.Group();
  const buildBastionSpire = (x: number, z: number, h: number) => {
    const g = new THREE.Group();
    // Heavy crenellated stone bastion pillar
    g.add(createBox(2.2, h, 2.2, mObsidian, 0, h / 2, 0));
    // Iron spike roof
    g.add(createCone(1.2, 2.4, 4, mIron, 0, h + 1.2, 0, 0, Math.PI / 4, 0));
    g.position.set(x, 0, z);
    return g;
  };

  // North & South ramparts
  for (let x = -halfW; x <= halfW; x += 3.4) {
    if (Math.abs(x) > 3.2) {
      boundaryGroup.add(buildBastionSpire(x + (rng() - 0.5) * 0.5, -halfD - 1.2, 5.5 + rng() * 2.0));
    }
    if (Math.abs(x) > 3.2) {
      boundaryGroup.add(buildBastionSpire(x + (rng() - 0.5) * 0.5, halfD + 1.2, 5.0 + rng() * 2.0));
    }
  }

  // East & West fortress curtain walls
  for (let z = -halfD; z <= halfD; z += 3.5) {
    boundaryGroup.add(buildBastionSpire(-halfW - 1.2, z + (rng() - 0.5) * 0.5, 5.5 + rng() * 2.0));
    boundaryGroup.add(buildBastionSpire(halfW + 1.2, z + (rng() - 0.5) * 0.5, 5.5 + rng() * 2.0));
  }
  parent.add(boundaryGroup);

  // =============================================================
  // 1. NORTH LANDMARK: "Gates of Dis (Infernal Archway)"
  // =============================================================
  placeProp(parent, worldSlug, 'gates_of_dis', () => {
    const g = new THREE.Group();
    // Colossal horned obsidian pillars
    g.add(createBox(1.5, 7.2, 1.5, mObsidian, -3.4, 3.6, 0));
    g.add(createBox(1.5, 7.2, 1.5, mObsidian, 3.4, 3.6, 0));
    // Horn spikes atop pillars
    g.add(createCone(0.65, 3.2, 4, mIron, -3.4, 8.2, 0, 0.2, 0, -0.3));
    g.add(createCone(0.65, 3.2, 4, mIron, 3.4, 8.2, 0, 0.2, 0, 0.3));
    // Heavy crossbeam lintel
    g.add(createBox(8.6, 1.4, 1.8, mObsidian, 0, 6.8, 0));
    // Central Demonic Skull / Crest with Magma core
    g.add(createOcta(1.4, mMagma, 0, 7.4, 0.6));
    // Iron Portcullis Grate
    g.add(createBox(5.0, 4.8, 0.2, mIron, 0, 2.4, 0));
    // Flanking Great Braziers
    g.add(createCylinder(0.8, 0.6, 1.6, 8, mIron, -4.8, 0.8, 0.9));
    g.add(createCylinder(0.8, 0.6, 1.6, 8, mIron, 4.8, 0.8, 0.9));
    g.add(createSphere(0.45, mMagma, -4.8, 1.8, 0.9));
    g.add(createSphere(0.45, mMagma, 4.8, 1.8, 0.9));
    return g;
  }, { position: new THREE.Vector3(0, 0, -19.5) }, true, occluders);

  addGlowSprite(-4.8, 1.9, -18.6, 2.8);
  addGlowSprite(4.8, 1.9, -18.6, 2.8);
  lanternPositions.push(new THREE.Vector3(0, 4.0, -18.6));

  // =============================================================
  // 2. WEST LANDMARK: "Blood Altar"
  // =============================================================
  placeProp(parent, worldSlug, 'blood_altar', () => {
    const g = new THREE.Group();
    // Stepped sacrificial dais
    g.add(createBox(4.8, 0.4, 4.8, mObsidian, 0, 0.2, 0));
    g.add(createBox(3.4, 0.4, 3.4, mStoneAlt, 0, 0.6, 0));
    // Central Altar Block with blood channel
    g.add(createBox(2.2, 1.0, 1.4, mObsidian, 0, 1.3, 0));
    g.add(createBox(1.8, 0.1, 1.0, mMagma, 0, 1.85, 0));
    // 4 Corner Spikes
    for (const [cx, cz] of [[-1.8, -1.8], [1.8, -1.8], [-1.8, 1.8], [1.8, 1.8]]) {
      g.add(createCone(0.3, 2.2, 4, mIron, cx, 1.1, cz));
    }
    return g;
  }, { position: new THREE.Vector3(-8.1, 0, -11.4) }, true, occluders);

  addGlowSprite(-8.1, 1.9, -11.4, 2.4);
  lanternPositions.push(new THREE.Vector3(-8.1, 1.9, -11.4));

  // =============================================================
  // 3. EAST LANDMARK: "Obsidian Throne Dais"
  // =============================================================
  placeProp(parent, worldSlug, 'throne_dais', () => {
    const g = new THREE.Group();
    // High terrace steps
    g.add(createBox(4.6, 0.5, 4.6, mObsidian, 0, 0.25, 0));
    g.add(createBox(3.2, 0.5, 3.2, mStone, 0, 0.75, 0));
    // Colossal Spiked Throne
    g.add(createBox(1.8, 1.0, 1.4, mObsidian, 0, 1.5, 0)); // Seat
    g.add(createBox(1.8, 3.2, 0.5, mObsidian, 0, 3.1, -0.6)); // Backrest
    g.add(createCone(0.4, 2.0, 4, mIron, -0.8, 4.8, -0.6)); // Left Finial
    g.add(createCone(0.4, 2.0, 4, mIron, 0.8, 4.8, -0.6)); // Right Finial
    // Torches
    for (const sx of [-1.8, 1.8]) {
      g.add(createCylinder(0.12, 0.16, 2.2, 6, mIron, sx, 1.1, 0.8));
      g.add(createSphere(0.3, mMagma, sx, 2.3, 0.8));
    }
    return g;
  }, { position: new THREE.Vector3(8.1, 0, -11.4) }, true, occluders);

  addGlowSprite(8.1, 2.4, -10.6, 2.6);
  lanternPositions.push(new THREE.Vector3(8.1, 2.4, -10.6));

  // =============================================================
  // 4. CENTRAL LANDMARK: "Central Infernal Spire & Brazier"
  // =============================================================
  placeProp(parent, worldSlug, 'infernal_spire', () => {
    const g = new THREE.Group();
    // Tiered octagonal plinth
    g.add(createCylinder(2.2, 2.5, 0.4, 8, mObsidian, 0, 0.2, 0));
    g.add(createCylinder(1.5, 1.8, 0.4, 8, mStoneAlt, 0, 0.6, 0));
    // Twisted obsidian shard spire
    g.add(createCone(0.7, 3.8, 5, mObsidian, 0, 2.5, 0));
    // Suspended Magma Orb in center
    g.add(createSphere(0.8, mMagma, 0, 2.2, 0));
    // Heavy iron chains wrapped around base
    g.add(createTorus(1.6, 0.14, 8, 16, mIron, 0, 0.6, 0, Math.PI / 2));
    // 2 Flanking Braziers
    for (const sx of [-1.9, 1.9]) {
      g.add(createCylinder(0.2, 0.25, 1.6, 6, mIron, sx, 0.8, 0));
      g.add(createSphere(0.35, mMagma, sx, 1.8, 0));
    }
    return g;
  }, { position: new THREE.Vector3(0, 0, -2.2) }, true, occluders);

  addGlowSprite(0, 2.4, -2.2, 3.4);
  lanternPositions.push(new THREE.Vector3(0, 2.4, -2.2));

  // =============================================================
  // 5. SOUTHWEST: "Magma Chasm Pit"
  // =============================================================
  const chasmGroup = new THREE.Group();
  chasmGroup.add(createCylinder(2.3, 2.5, 0.15, 16, mObsidian, 0, 0.08, 0));
  chasmGroup.add(createCylinder(1.8, 1.8, 0.2, 16, mMagma, 0, 0.12, 0));
  // Iron chains stretched across pit
  chasmGroup.add(createCylinder(0.08, 0.08, 4.4, 6, mIron, 0, 0.35, 0, 0, 0, Math.PI / 2));
  chasmGroup.position.set(-7.5, 0, 10.2);
  parent.add(chasmGroup);
  addGlowSprite(-7.5, 0.4, 10.2, 2.8);

  // =============================================================
  // 6. SOUTHEAST: "Crystal Furnace"
  // =============================================================
  placeProp(parent, worldSlug, 'crystal_furnace', () => {
    const g = new THREE.Group();
    g.add(createBox(3.4, 0.4, 3.4, mObsidian, 0, 0.2, 0));
    // Cylindrical smelting furnace
    g.add(createCylinder(1.3, 1.5, 2.8, 8, mIron, 0, 1.6, 0));
    g.add(createCone(1.3, 1.2, 8, mIron, 0, 3.6, 0));
    // Furnace glowing vent aperture
    g.add(createBox(0.9, 0.9, 0.4, mMagma, 0, 1.2, 1.15));
    return g;
  }, { position: new THREE.Vector3(7.9, 0, 10.9) }, true, occluders);

  addGlowSprite(7.9, 1.3, 12.1, 2.4);
  lanternPositions.push(new THREE.Vector3(7.9, 1.3, 12.1));

  // South Gate Crossing Pillars
  for (const sx of [-2.6, 2.6]) {
    const gatePillar = new THREE.Group();
    gatePillar.add(createBox(0.9, 3.6, 0.9, mObsidian, 0, 1.8, 0));
    gatePillar.add(createCone(0.5, 1.6, 4, mIron, 0, 4.4, 0));
    gatePillar.add(createSphere(0.35, mMagma, 0, 3.4, 0.6));
    gatePillar.position.set(sx, 0, 18.5);
    parent.add(gatePillar);
    addGlowSprite(sx, 3.4, 19.1, 2.2);
    lanternPositions.push(new THREE.Vector3(sx, 3.4, 19.1));
  }

  return { lanternPositions };
}
