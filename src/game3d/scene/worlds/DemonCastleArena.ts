import * as THREE from 'three';
import { ARENA_DEPTH, ARENA_WIDTH } from '../../core/coordinates';
import { SharedResources } from '../../core/SharedResources';
import type { BiomeTheme } from '../BiomeTheme';
import { envMaterials } from '../EnvironmentMaterials';
import { CASTLE_LAYOUT } from '../WorldArenaLayout';
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

  // Dark scorched obsidian flagstones
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, dim, dim);

  // 1. Scorched basalt noise & magma ember glow
  for (let i = 0; i < 160; i++) {
    const x = rng() * dim;
    const y = rng() * dim;
    const rad = 45 + rng() * 100;
    const grad = ctx.createRadialGradient(x, y, 2, x, y, rad);
    grad.addColorStop(0, i % 3 === 0 ? deepColor : (i % 3 === 1 ? '#180606' : '#2b0c0c'));
    grad.addColorStop(1, 'transparent');
    ctx.globalAlpha = 0.65;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. North-Central Infernal Core Dais (shifted to z: -4.5)
  const daisCenter = toCanvasCoords(0, -4.5, dim);
  ctx.globalAlpha = 0.75;
  ctx.fillStyle = '#180404';
  ctx.beginPath();
  ctx.arc(daisCenter.x, daisCenter.y, 130, 0, Math.PI * 2);
  ctx.fill();

  // Concentric pentagram & demonic runes
  const runeRadii = [125, 90, 50];
  for (let r = 0; r < runeRadii.length; r++) {
    const rad = runeRadii[r];
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = r % 2 === 0 ? '#f97316' : '#ef4444';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(daisCenter.x, daisCenter.y, rad, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 3. West Magma Chasm Pit at (-11.2, -5.5)
  const chasmW = toCanvasCoords(-11.2, -5.5, dim);
  const chasmWGrad = ctx.createRadialGradient(chasmW.x, chasmW.y, 8, chasmW.x, chasmW.y, 100);
  chasmWGrad.addColorStop(0, '#ff4400');
  chasmWGrad.addColorStop(0.5, '#cc2200');
  chasmWGrad.addColorStop(0.85, '#440800');
  chasmWGrad.addColorStop(1, '#110200');
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = chasmWGrad;
  ctx.beginPath();
  ctx.ellipse(chasmW.x, chasmW.y, 105, 75, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // 4. East Magma Chasm Pit at (11.2, 5.2)
  const chasmE = toCanvasCoords(11.2, 5.2, dim);
  const chasmEGrad = ctx.createRadialGradient(chasmE.x, chasmE.y, 8, chasmE.x, chasmE.y, 100);
  chasmEGrad.addColorStop(0, '#ff4400');
  chasmEGrad.addColorStop(0.5, '#cc2200');
  chasmEGrad.addColorStop(0.85, '#440800');
  chasmEGrad.addColorStop(1, '#110200');
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = chasmEGrad;
  ctx.beginPath();
  ctx.ellipse(chasmE.x, chasmE.y, 105, 75, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // 5. South Boss Arena Flagstone Pavement (wide open)
  const southPlaza = toCanvasCoords(0, 7.5, dim);
  ctx.globalAlpha = 0.45;
  ctx.strokeStyle = '#7c2d12';
  ctx.lineWidth = 1.6;
  ctx.strokeRect(southPlaza.x - 220, southPlaza.y - 120, 440, 240);

  // Glowing magma fissures
  ctx.strokeStyle = '#f97316';
  ctx.lineWidth = 2.4;
  for (let i = 0; i < 10; i++) {
    const startX = southPlaza.x + (rng() - 0.5) * 350;
    const startY = southPlaza.y + (rng() - 0.5) * 160;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(startX + (rng() - 0.5) * 60, startY + (rng() - 0.5) * 60);
    ctx.globalAlpha = 0.62;
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(1, 1);
  texture.needsUpdate = true;
  return texture;
}

export function buildDemonCastleArena(
  parent: THREE.Group,
  _resources: SharedResources,
  _theme: BiomeTheme,
  rng: () => number,
  _low: boolean,
  occluders: THREE.Object3D[]
): { lanternPositions: THREE.Vector3[] } {
  const worldSlug = 'castle' as const;
  const lanternPositions: THREE.Vector3[] = [];

  const mObsidian = envMaterials.obsidian;
  const mIron = envMaterials.iron;
  const mMagma = envMaterials.magma;
  const mStone = envMaterials.stone;
  const mStoneAlt = envMaterials.wetStone;

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

  const boundX = ARENA_WIDTH / 2 - 0.6; // ~20.4
  const boundZ = ARENA_DEPTH / 2 - 0.8; // ~13.2

  // =============================================================
  // BOUNDARY: Fortress Ramparts, Spiked Bastions & Lava Chasms
  // =============================================================
  const boundaryGroup = new THREE.Group();
  const buildBastionSpire = (x: number, z: number, h: number) => {
    const g = new THREE.Group();
    g.add(createBox(2.2, h, 2.2, mObsidian, 0, h / 2, 0));
    g.add(createCone(1.2, 2.4, 4, mIron, 0, h + 1.2, 0, 0, Math.PI / 4, 0));
    g.position.set(x, 0, z);
    return g;
  };

  // Perimeter ramparts
  for (let x = -boundX; x <= boundX; x += 3.4) {
    if (Math.abs(x) > 3.2) {
      boundaryGroup.add(buildBastionSpire(x + (rng() - 0.5) * 0.5, -boundZ - 1.0, 5.2 + rng() * 2.0));
      boundaryGroup.add(buildBastionSpire(x + (rng() - 0.5) * 0.5, boundZ + 1.0, 5.0 + rng() * 2.0));
    }
  }

  for (let z = -boundZ; z <= boundZ; z += 3.5) {
    boundaryGroup.add(buildBastionSpire(-boundX - 1.0, z + (rng() - 0.5) * 0.5, 5.4 + rng() * 2.0));
    boundaryGroup.add(buildBastionSpire(boundX + 1.0, z + (rng() - 0.5) * 0.5, 5.4 + rng() * 2.0));
  }
  parent.add(boundaryGroup);

  // =============================================================
  // AUTHORED WORLD PROPS (Consumed directly from CASTLE_LAYOUT)
  // =============================================================
  const layout = CASTLE_LAYOUT;

  for (const prop of layout.props) {
    switch (prop.propType) {
      case 'gates_of_dis': {
        placeAuthoredProp(parent, worldSlug, prop, () => {
          const g = new THREE.Group();
          // Horned obsidian pillars
          g.add(createBox(1.4, 6.8, 1.4, mObsidian, -3.2, 3.4, 0));
          g.add(createBox(1.4, 6.8, 1.4, mObsidian, 3.2, 3.4, 0));
          // Horn spikes
          g.add(createCone(0.6, 2.8, 4, mIron, -3.2, 7.8, 0, 0.2, 0, -0.3));
          g.add(createCone(0.6, 2.8, 4, mIron, 3.2, 7.8, 0, 0.2, 0, 0.3));
          // Lintel
          g.add(createBox(7.8, 1.3, 1.6, mObsidian, 0, 6.4, 0));
          // Magma Skull Crest
          g.add(createOcta(1.2, mMagma, 0, 7.0, 0.6));
          // Portcullis Grate
          g.add(createBox(4.6, 4.5, 0.2, mIron, 0, 2.25, 0));
          return g;
        }, occluders);

        addGlowSprite(prop.x - 3.2, 3.4, prop.z + 1.0, 2.6);
        addGlowSprite(prop.x + 3.2, 3.4, prop.z + 1.0, 2.6);
        lanternPositions.push(new THREE.Vector3(prop.x, 3.4, prop.z + 1.0));
        break;
      }

      case 'infernal_spire': {
        placeAuthoredProp(parent, worldSlug, prop, () => {
          const g = new THREE.Group();
          g.add(createCylinder(2.0, 2.3, 0.4, 8, mObsidian, 0, 0.2, 0));
          g.add(createCylinder(1.4, 1.6, 0.4, 8, mStoneAlt, 0, 0.6, 0));
          g.add(createCone(0.65, 3.4, 5, mObsidian, 0, 2.3, 0));
          g.add(createSphere(0.75, 8, mMagma, 0, 2.0, 0));
          return g;
        }, occluders);

        addGlowSprite(prop.x, 2.0, prop.z, 3.2);
        lanternPositions.push(new THREE.Vector3(prop.x, 2.0, prop.z));
        break;
      }

      case 'castle_wall_section': {
        placeAuthoredProp(parent, worldSlug, prop, () => {
          const g = new THREE.Group();
          g.add(createBox(1.5, 3.2, 4.6, mObsidian, 0, 1.6, 0));
          // Crenellations
          g.add(createBox(1.6, 0.5, 1.0, mStone, 0, 3.45, -1.6));
          g.add(createBox(1.6, 0.5, 1.0, mStone, 0, 3.45, 0));
          g.add(createBox(1.6, 0.5, 1.0, mStone, 0, 3.45, 1.6));
          return g;
        }, occluders);
        break;
      }

      case 'magma_chasm_pit': {
        // Magma chasm glowing pool
        const chasm = new THREE.Group();
        chasm.add(createCylinder(2.0, 2.2, 0.15, 16, mMagma, 0, 0.08, 0));
        chasm.position.set(prop.x, 0, prop.z);
        parent.add(chasm);

        addGlowSprite(prop.x, 0.5, prop.z, 2.8);
        lanternPositions.push(new THREE.Vector3(prop.x, 0.5, prop.z));
        break;
      }

      case 'gate_pillar': {
        placeAuthoredProp(parent, worldSlug, prop, () => {
          const g = new THREE.Group();
          g.add(createBox(1.3, 3.8, 1.3, mObsidian, 0, 1.9, 0));
          g.add(createCone(0.8, 1.4, 4, mIron, 0, 4.4, 0, 0, Math.PI / 4, 0));
          g.add(createSphere(0.35, 8, mMagma, 0, 2.8, 0.75));
          return g;
        });

        addGlowSprite(prop.x, 2.8, prop.z + 0.75, 2.2);
        lanternPositions.push(new THREE.Vector3(prop.x, 2.8, prop.z + 0.75));
        break;
      }
    }
  }

  // South Boss Arena Flanking Braziers
  const bossBraziers = [
    new THREE.Vector3(-8.0, 0, 6.5),
    new THREE.Vector3(8.0, 0, 6.5),
  ];
  for (const pos of bossBraziers) {
    addGlowSprite(pos.x, 1.8, pos.z, 2.4);
    lanternPositions.push(new THREE.Vector3(pos.x, 1.8, pos.z));
  }

  return { lanternPositions };
}
