import * as THREE from 'three';
import { ARENA_DEPTH, ARENA_WIDTH } from '../../core/coordinates';
import { SharedResources } from '../../core/SharedResources';
import type { BiomeTheme } from '../BiomeTheme';
import { envMaterials } from '../EnvironmentMaterials';
import { GRAVEYARD_LAYOUT } from '../WorldArenaLayout';
import {
  createBox,
  createCone,
  createCylinder,
  createGlowTexture,
  createSphere,
  createTorus,
  placeAuthoredProp,
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

  // 2. Authored Flagstone Walkways reflecting World 1's courtyard topology
  const drawFlagstonePath = (fromX: number, fromZ: number, toX: number, toZ: number, pathWidth = 52) => {
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

  // Paths connect central clearing to NW Chapel, East Mausoleum, South Gate, and West Wall
  drawFlagstonePath(0, 0, -7.5, -9.5, 54);
  drawFlagstonePath(0, 0, 8.5, -3.5, 52);
  drawFlagstonePath(0, 0, 0, 11.2, 56);
  drawFlagstonePath(0, 0, -9.5, 1.5, 46);
  drawFlagstonePath(8.5, -3.5, 10.5, 3.5, 42);

  // 3. Central Grounds Circular Dais & Ring Plaza (Broad open fighting space)
  const center = toCanvasCoords(0, 0, dim);
  ctx.globalAlpha = 0.65;
  ctx.fillStyle = '#081018';
  ctx.beginPath();
  ctx.arc(center.x, center.y, 140, 0, Math.PI * 2);
  ctx.fill();

  // Concentric decorative courtyard rings
  const ringRadii = [135, 100, 65, 30];
  for (let r = 0; r < ringRadii.length; r++) {
    const rad = ringRadii[r];
    ctx.globalAlpha = 0.48;
    ctx.strokeStyle = r % 2 === 0 ? '#637e96' : '#3b5166';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(center.x, center.y, rad, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 4. South-East Cemetery Pond: Murky Water & Reeds
  const pondCenter = toCanvasCoords(7.5, 7.5, dim);
  const pondGrad = ctx.createRadialGradient(pondCenter.x, pondCenter.y, 10, pondCenter.x, pondCenter.y, 110);
  pondGrad.addColorStop(0, '#061019');
  pondGrad.addColorStop(0.7, '#0a1d2e');
  pondGrad.addColorStop(1, '#11293e');
  ctx.globalAlpha = 0.88;
  ctx.fillStyle = pondGrad;
  ctx.beginPath();
  ctx.ellipse(pondCenter.x, pondCenter.y, 115, 85, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Celestial moon specular reflection in pond
  ctx.globalAlpha = 0.65;
  ctx.fillStyle = '#55d4ff';
  ctx.beginPath();
  ctx.ellipse(pondCenter.x - 16, pondCenter.y - 12, 26, 16, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = '#f0f9ff';
  ctx.beginPath();
  ctx.arc(pondCenter.x - 16, pondCenter.y - 12, 9, 0, Math.PI * 2);
  ctx.fill();

  // 5. Wet Moonlight Puddles
  const puddleLocations = [
    toCanvasCoords(-3.0, -4.5, dim),
    toCanvasCoords(3.5, 2.5, dim),
    toCanvasCoords(-5.0, 5.0, dim),
    toCanvasCoords(4.0, -7.5, dim),
    toCanvasCoords(-11.0, -3.0, dim),
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
  _low: boolean,
  occluders: THREE.Object3D[]
): { lanternPositions: THREE.Vector3[] } {
  const worldSlug = 'graveyard';
  const mStone = envMaterials.getStone(theme);
  const mStoneAlt = envMaterials.getStone(theme, true);
  const mIron = envMaterials.getIron();
  const mWarm = envMaterials.getWarmEmissive(theme, 3.5);
  const mBark = envMaterials.getWood(true);
  const mRoseGlass = resources.standardMaterial('gy-rose-glass', 0xff4411, {
    emissive: 0xff3300,
    emissiveIntensity: 2.8,
    roughness: 0.3,
  });
  const mWater = resources.standardMaterial('gy-pond-water', 0x071624, {
    roughness: 0.12,
    metalness: 0.85,
    emissive: 0x030d17,
    emissiveIntensity: 0.35,
  });

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
  const boundX = ARENA_WIDTH / 2 - 0.6; // ~20.4
  const boundZ = ARENA_DEPTH / 2 - 0.8; // ~13.2

  const addWallSegment = (x: number, z: number, sx: number, sz: number, rotY = 0) => {
    const g = new THREE.Group();
    g.add(createBox(sx, 1.9, sz, mStone, 0, 0.95, 0));
    g.add(createBox(sx * 1.02, 0.22, sz * 1.15, mStoneAlt, 0, 1.95, 0));
    const rails = Math.max(2, Math.floor(Math.max(sx, sz) / 0.6));
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

  // Perimeter wall segments
  addWallSegment(-11.5, -boundZ, 16.5, 0.75);
  addWallSegment(11.5, -boundZ, 16.5, 0.75);
  addWallSegment(-11.5, boundZ, 16.5, 0.75);
  addWallSegment(11.5, boundZ, 16.5, 0.75);
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
  // 2. AUTHORED WORLD PROPS (Consumed directly from GRAVEYARD_LAYOUT)
  // =============================================================
  const layout = GRAVEYARD_LAYOUT;

  for (const prop of layout.props) {
    switch (prop.propType) {
      case 'chapel_ruin': {
        placeAuthoredProp(parent, worldSlug, prop, () => {
          const g = new THREE.Group();
          g.add(createBox(5.4, 4.4, 1.2, mStone, 0, 2.2, 0));
          g.add(createBox(2.2, 2.7, 1.3, resources.basicMaterial('chapel-void', 0x060c14), 0, 1.35, 0));
          g.add(createBox(2.0, 2.6, 0.12, mIron, 0, 1.3, 0.1));

          // Gothic Twin Spires
          g.add(createCylinder(0.42, 0.55, 4.8, 6, mStoneAlt, -2.4, 2.4, 0));
          g.add(createCone(0.55, 2.4, 6, mStoneAlt, -2.4, 5.8, 0));
          g.add(createCylinder(0.42, 0.55, 4.8, 6, mStoneAlt, 2.4, 2.4, 0));
          g.add(createCone(0.55, 2.4, 6, mStoneAlt, 2.4, 5.8, 0));

          // Rose Window
          g.add(createTorus(0.78, 0.12, 6, 16, mStoneAlt, 0, 3.4, 0.6));
          g.add(createCylinder(0.72, 0.72, 0.08, 12, mRoseGlass, 0, 3.4, 0.6, Math.PI / 2, 0, 0));

          // Gatehouse Lantern Pillars
          g.add(createBox(0.68, 2.8, 0.68, mStoneAlt, -2.2, 1.4, 1.2));
          g.add(createBox(0.68, 2.8, 0.68, mStoneAlt, 2.2, 1.4, 1.2));
          g.add(createBox(0.24, 0.32, 0.24, mWarm, -2.2, 2.5, 1.5));
          g.add(createBox(0.24, 0.32, 0.24, mWarm, 2.2, 2.5, 1.5));
          return g;
        }, occluders);

        addGlowSprite(prop.x - 2.2, 2.5, prop.z + 1.5, 1.8);
        addGlowSprite(prop.x + 2.2, 2.5, prop.z + 1.5, 1.8);
        lanternPositions.push(new THREE.Vector3(prop.x, 2.4, prop.z + 1.2));
        break;
      }

      case 'crypt_large': {
        placeAuthoredProp(parent, worldSlug, prop, () => {
          const g = new THREE.Group();
          g.add(createBox(3.4, 0.35, 3.4, mStoneAlt, 0, 0.17, 0));
          g.add(createBox(3.0, 2.6, 3.0, mStone, 0, 1.5, 0));
          g.add(createBox(3.3, 0.45, 3.3, mStoneAlt, 0, 2.9, 0));
          g.add(createCone(2.5, 1.1, 4, mStoneAlt, 0, 3.6, 0, 0, Math.PI / 4, 0));
          g.add(createBox(1.2, 2.0, 0.12, mIron, 0, 1.1, 1.52));
          return g;
        }, occluders);

        addGlowSprite(prop.x, 2.1, prop.z + 1.8, 1.8);
        lanternPositions.push(new THREE.Vector3(prop.x, 2.1, prop.z + 1.8));
        break;
      }

      case 'crypt_small': {
        placeAuthoredProp(parent, worldSlug, prop, () => {
          const g = new THREE.Group();
          g.add(createBox(2.4, 0.3, 2.4, mStoneAlt, 0, 0.15, 0));
          g.add(createBox(2.0, 2.0, 2.0, mStone, 0, 1.15, 0));
          g.add(createCone(1.8, 0.9, 4, mStoneAlt, 0, 2.4, 0, 0, Math.PI / 4, 0));
          return g;
        }, occluders);
        break;
      }

      case 'stone_wall_segment': {
        placeAuthoredProp(parent, worldSlug, prop, () => {
          const g = new THREE.Group();
          g.add(createBox(1.2, 2.2, 4.0, mStone, 0, 1.1, 0));
          g.add(createBox(1.3, 0.25, 4.2, mStoneAlt, 0, 2.3, 0));
          return g;
        }, occluders);
        break;
      }

      case 'cemetery_pond': {
        // 3D Water plane at ground surface
        const pondWater = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 5.0), mWater);
        pondWater.rotation.x = -Math.PI / 2;
        pondWater.position.set(prop.x, 0.008, prop.z);
        parent.add(pondWater);
        break;
      }

      case 'gate_pillar': {
        placeAuthoredProp(parent, worldSlug, prop, () => {
          const g = new THREE.Group();
          g.add(createBox(1.2, 3.2, 1.2, mStoneAlt, 0, 1.6, 0));
          g.add(createCone(0.8, 0.6, 4, mStoneAlt, 0, 3.5, 0));
          g.add(createBox(0.26, 0.34, 0.26, mWarm, 0, 2.4, 0.65));
          return g;
        });
        addGlowSprite(prop.x, 2.4, prop.z + 0.65, 1.8);
        lanternPositions.push(new THREE.Vector3(prop.x, 2.4, prop.z + 0.65));
        break;
      }

      case 'ancient_oak': {
        placeAuthoredProp(parent, worldSlug, prop, () => {
          const g = new THREE.Group();
          g.add(createCylinder(0.85, 1.4, 4.6, 8, mBark, 0, 2.3, 0));
          g.add(createSphere(2.2, 8, mBark, 0, 4.6, 0));
          return g;
        }, occluders);
        break;
      }

      case 'grave_plot_row': {
        placeAuthoredProp(parent, worldSlug, prop, () => {
          const g = new THREE.Group();
          for (let i = -1; i <= 1; i++) {
            g.add(createBox(0.44, 0.85, 0.16, mStone, i * 0.6, 0.42, 0));
          }
          return g;
        });
        break;
      }

      case 'angel_statue': {
        placeAuthoredProp(parent, worldSlug, prop, () => {
          const g = new THREE.Group();
          g.add(createCylinder(0.8, 0.95, 0.4, 12, mStone, 0, 0.2, 0));
          g.add(createBox(0.7, 0.8, 0.7, mStoneAlt, 0, 0.8, 0));
          g.add(createCylinder(0.26, 0.38, 1.4, 8, mStoneAlt, 0, 1.9, 0));
          g.add(createSphere(0.2, 8, mStoneAlt, 0, 2.68, 0));
          // Wings
          g.add(createBox(0.5, 1.2, 0.08, mStoneAlt, -0.45, 2.2, -0.2, -0.2, 0.35, 0.32));
          g.add(createBox(0.5, 1.2, 0.08, mStoneAlt, 0.45, 2.2, -0.2, -0.2, -0.35, -0.32));
          return g;
        }, occluders);
        break;
      }
    }
  }

  // 4 Victorian Iron Lampposts at 4 corners of central courtyard
  const centerLanterns = [
    new THREE.Vector3(-4.5, 0, -3.5),
    new THREE.Vector3(4.5, 0, -3.5),
    new THREE.Vector3(-4.5, 0, 3.5),
    new THREE.Vector3(4.5, 0, 3.5),
  ];
  for (const pos of centerLanterns) {
    placeProp(parent, worldSlug, 'lantern_post', () => {
      const g = new THREE.Group();
      g.add(createCylinder(0.06, 0.09, 2.2, 6, mIron, 0, 1.1, 0));
      g.add(createBox(0.4, 0.05, 0.05, mIron, 0, 2.05, 0));
      g.add(createBox(0.24, 0.32, 0.24, mWarm, 0, 2.25, 0));
      g.add(createBox(0.28, 0.04, 0.28, mIron, 0, 2.08, 0));
      g.add(createCone(0.24, 0.16, 4, mIron, 0, 2.48, 0));
      return g;
    }, { position: pos });
    addGlowSprite(pos.x, 2.25, pos.z, 2.0);
    lanternPositions.push(new THREE.Vector3(pos.x, 2.25, pos.z));
  }

  return { lanternPositions };
}
