import * as THREE from 'three';
import { ARENA_DEPTH, ARENA_WIDTH } from '../../core/coordinates';
import { SharedResources } from '../../core/SharedResources';
import type { BiomeTheme } from '../BiomeTheme';
import { envMaterials } from '../EnvironmentMaterials';
import { FROZEN_LAYOUT } from '../WorldArenaLayout';
import {
  createBox,
  createCone,
  createCylinder,
  createGlowTexture,
  createOcta,
  createSphere,
  placeAuthoredProp,
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

  // Base frosty permafrost fill
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, dim, dim);

  // 1. Packed glacial blue snow & permafrost noise
  for (let i = 0; i < 160; i++) {
    const x = rng() * dim;
    const y = rng() * dim;
    const rad = 45 + rng() * 100;
    const grad = ctx.createRadialGradient(x, y, 2, x, y, rad);
    grad.addColorStop(0, i % 3 === 0 ? deepColor : (i % 3 === 1 ? '#0a1d30' : '#14314c'));
    grad.addColorStop(1, 'transparent');
    ctx.globalAlpha = 0.65;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Central Cracked Frozen Plaza (Open battleground)
  const center = toCanvasCoords(0, 0, dim);
  ctx.globalAlpha = 0.72;
  ctx.fillStyle = '#0a2238';
  ctx.beginPath();
  ctx.arc(center.x, center.y, 140, 0, Math.PI * 2);
  ctx.fill();

  // Concentric frozen runes
  const runeRadii = [135, 95, 55];
  for (let r = 0; r < runeRadii.length; r++) {
    const rad = runeRadii[r];
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = r % 2 === 0 ? '#7dd3fc' : accentColor;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(center.x, center.y, rad, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 3. Deep Radial Ice Fissures
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2.8;
  for (let i = 0; i < 14; i++) {
    const ang = (i / 14) * Math.PI * 2 + (rng() - 0.5) * 0.3;
    const len = 120 + rng() * 180;
    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    let curX = center.x;
    let curY = center.y;
    const segments = 4;
    for (let s = 0; s < segments; s++) {
      curX += (Math.cos(ang) * len) / segments + (rng() - 0.5) * 22;
      curY += (Math.sin(ang) * len) / segments + (rng() - 0.5) * 22;
      ctx.lineTo(curX, curY);
    }
    ctx.globalAlpha = 0.65;
    ctx.stroke();
  }

  // 4. South-West Impassable Frozen Abyss / Crevasse at (-8.5, 6.8)
  const abyssCenter = toCanvasCoords(-8.5, 6.8, dim);
  const abyssGrad = ctx.createRadialGradient(abyssCenter.x, abyssCenter.y, 10, abyssCenter.x, abyssCenter.y, 105);
  abyssGrad.addColorStop(0, '#020912');
  abyssGrad.addColorStop(0.65, '#051b2e');
  abyssGrad.addColorStop(1, '#0c3556');
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = abyssGrad;
  ctx.beginPath();
  ctx.ellipse(abyssCenter.x, abyssCenter.y, 110, 80, -0.25, 0, Math.PI * 2);
  ctx.fill();

  // Abyss glowing glacial rim
  ctx.globalAlpha = 0.75;
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3.0;
  ctx.beginPath();
  ctx.ellipse(abyssCenter.x, abyssCenter.y, 110, 80, -0.25, 0, Math.PI * 2);
  ctx.stroke();

  // 5. Snow Drifts & Frost Crust
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
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(1, 1);
  texture.needsUpdate = true;
  return texture;
}

export function buildFrozenRuinsArena(
  parent: THREE.Group,
  _resources: SharedResources,
  _theme: BiomeTheme,
  rng: () => number,
  _low: boolean,
  occluders: THREE.Object3D[]
): { lanternPositions: THREE.Vector3[] } {
  const worldSlug = 'frozen' as const;
  const lanternPositions: THREE.Vector3[] = [];

  const mStone = envMaterials.stone;
  const mStoneAlt = envMaterials.wetStone;
  const mIce = envMaterials.ice;
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

  const boundX = ARENA_WIDTH / 2 - 0.6; // ~20.4
  const boundZ = ARENA_DEPTH / 2 - 0.8; // ~13.2

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

  // Perimeter cliffs
  for (let x = -boundX; x <= boundX; x += 3.4) {
    if (Math.abs(x) > 3.0) {
      boundaryGroup.add(buildCliffSpire(x + (rng() - 0.5) * 0.5, -boundZ - 1.0, 5.0 + rng() * 2.2));
      boundaryGroup.add(buildCliffSpire(x + (rng() - 0.5) * 0.5, boundZ + 1.0, 4.8 + rng() * 2.0));
    }
  }

  for (let z = -boundZ; z <= boundZ; z += 3.5) {
    boundaryGroup.add(buildCliffSpire(-boundX - 1.0, z + (rng() - 0.5) * 0.5, 5.2 + rng() * 2.2));
    boundaryGroup.add(buildCliffSpire(boundX + 1.0, z + (rng() - 0.5) * 0.5, 5.2 + rng() * 2.2));
  }
  parent.add(boundaryGroup);

  // =============================================================
  // AUTHORED WORLD PROPS (Consumed directly from FROZEN_LAYOUT)
  // =============================================================
  const layout = FROZEN_LAYOUT;

  for (const prop of layout.props) {
    switch (prop.propType) {
      case 'ruined_wall_diag': {
        placeAuthoredProp(parent, worldSlug, prop, () => {
          const g = new THREE.Group();
          const w = prop.collider?.type === 'box' ? prop.collider.width : 4.0;
          g.add(createBox(w, 2.4, 1.1, mStone, 0, 1.2, 0));
          g.add(createBox(w * 1.02, 0.3, 1.3, mStoneAlt, 0, 2.45, 0));
          // Ice encrusted along top of wall
          g.add(createCone(0.5, 1.2, 5, mIce, -w * 0.3, 2.8, 0));
          g.add(createCone(0.6, 1.5, 5, mIce, w * 0.25, 2.9, 0));
          return g;
        }, occluders);
        break;
      }

      case 'ice_spire_cluster': {
        placeAuthoredProp(parent, worldSlug, prop, () => {
          const g = new THREE.Group();
          g.add(createCylinder(2.0, 2.3, 0.2, 16, mIce, 0, 0.1, 0));
          for (let i = 0; i < 4; i++) {
            const ang = (i / 4) * Math.PI * 2;
            const spire = createCone(0.55, 2.8 + rng() * 1.4, 5, mIce);
            spire.position.set(Math.cos(ang) * 1.2, 1.4, Math.sin(ang) * 1.2);
            spire.rotation.set((rng() - 0.5) * 0.25, rng() * Math.PI, (rng() - 0.5) * 0.25);
            g.add(spire);
          }
          g.add(createOcta(0.65, mCyan, 0, 2.2, 0));
          return g;
        }, occluders);

        addGlowSprite(prop.x, 2.2, prop.z, 2.6);
        lanternPositions.push(new THREE.Vector3(prop.x, 2.2, prop.z));
        break;
      }

      case 'frozen_temple_gate': {
        placeAuthoredProp(parent, worldSlug, prop, () => {
          const g = new THREE.Group();
          // Colossal dual pillars
          g.add(createCylinder(0.65, 0.8, 5.8, 8, mStone, -2.4, 2.9, 0));
          g.add(createCylinder(0.65, 0.8, 5.8, 8, mStone, 2.4, 2.9, 0));
          // Ice spires on pillars
          g.add(createCone(0.8, 2.4, 6, mIce, -2.4, 5.0, 0));
          g.add(createCone(0.8, 2.4, 6, mIce, 2.4, 5.0, 0));
          // Fractured lintel arch
          g.add(createBox(6.8, 1.0, 1.4, mStoneAlt, 0, 5.6, 0));
          g.add(createOcta(0.8, mCyan, 0, 6.5, 0.6));
          return g;
        }, occluders);

        addGlowSprite(prop.x - 2.4, 2.4, prop.z + 0.8, 2.2);
        addGlowSprite(prop.x + 2.4, 2.4, prop.z + 0.8, 2.2);
        lanternPositions.push(new THREE.Vector3(prop.x, 2.4, prop.z + 0.8));
        break;
      }

      case 'ruined_pillar': {
        placeAuthoredProp(parent, worldSlug, prop, () => {
          const g = new THREE.Group();
          g.add(createBox(1.2, 0.4, 1.2, mStoneAlt, 0, 0.2, 0));
          g.add(createCylinder(0.42, 0.48, 3.4, 8, mStone, 0, 1.9, 0));
          g.add(createOcta(0.3, mCyan, 0, 3.8, 0));
          return g;
        }, occluders);

        addGlowSprite(prop.x, 3.8, prop.z, 1.8);
        lanternPositions.push(new THREE.Vector3(prop.x, 3.8, prop.z));
        break;
      }

      case 'frozen_abyss': {
        // Deep ice crevasse marker
        const abyssGroup = new THREE.Group();
        abyssGroup.add(createCylinder(2.2, 2.4, 0.15, 16, mIce, 0, 0.08, 0));
        for (let i = 0; i < 3; i++) {
          const ang = (i / 3) * Math.PI * 2;
          const spire = createCone(0.35, 1.8, 5, mIce);
          spire.position.set(Math.cos(ang) * 1.5, 0.9, Math.sin(ang) * 1.5);
          abyssGroup.add(spire);
        }
        abyssGroup.position.set(prop.x, 0, prop.z);
        parent.add(abyssGroup);
        break;
      }
    }
  }

  // Central Frost Beacons
  addGlowSprite(0, 2.2, 0, 2.8);
  lanternPositions.push(new THREE.Vector3(0, 2.2, 0));

  return { lanternPositions };
}
