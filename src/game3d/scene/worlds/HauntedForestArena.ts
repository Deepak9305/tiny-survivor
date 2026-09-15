import * as THREE from 'three';
import { ARENA_DEPTH, ARENA_WIDTH } from '../../core/coordinates';
import { SharedResources } from '../../core/SharedResources';
import type { BiomeTheme } from '../BiomeTheme';
import { envMaterials } from '../EnvironmentMaterials';
import { FOREST_LAYOUT } from '../WorldArenaLayout';
import {
  createBox,
  createCylinder,
  createGlowTexture,
  createSphere,
  placeAuthoredProp,
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

  // Deep loam moss forest floor
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, dim, dim);

  // 1. Organic pine needle drifts, damp moss patches, root shadows
  for (let i = 0; i < 180; i++) {
    const x = rng() * dim;
    const y = rng() * dim;
    const rad = 50 + rng() * 120;
    const grad = ctx.createRadialGradient(x, y, 4, x, y, rad);
    grad.addColorStop(0, i % 3 === 0 ? deepColor : (i % 3 === 1 ? '#091811' : '#142c1e'));
    grad.addColorStop(1, 'transparent');
    ctx.globalAlpha = 0.62;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Authored Winding Crescent Trails reflecting World 2's organic topology
  const drawWindingTrail = (points: { x: number; z: number }[], trailWidth = 44) => {
    if (points.length < 2) return;
    const cPoints = points.map((p) => toCanvasCoords(p.x, p.z, dim));

    ctx.beginPath();
    ctx.moveTo(cPoints[0].x, cPoints[0].y);
    for (let i = 1; i < cPoints.length; i++) {
      ctx.lineTo(cPoints[i].x, cPoints[i].y);
    }
    ctx.globalAlpha = 0.48;
    ctx.strokeStyle = '#050f0a';
    ctx.lineWidth = trailWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cPoints[0].x, cPoints[0].y);
    for (let i = 1; i < cPoints.length; i++) {
      ctx.lineTo(cPoints[i].x, cPoints[i].y);
    }
    ctx.globalAlpha = 0.38;
    ctx.strokeStyle = '#1d3b2c';
    ctx.lineWidth = trailWidth * 0.7;
    ctx.stroke();
  };

  // Organic crescent trail winding around root barrier and giant tree
  drawWindingTrail([
    { x: -8.2, z: 8.0 },
    { x: -5.5, z: 4.5 },
    { x: 0, z: 2.0 },
    { x: 3.5, z: -2.0 },
    { x: 7.2, z: -8.0 },
  ], 50);

  drawWindingTrail([
    { x: 0, z: 11.2 },
    { x: 0, z: 2.0 },
    { x: -2.0, z: -4.0 },
    { x: -10.5, z: -7.5 },
  ], 46);

  // 3. Offset Clearing Aura (shifted to x: 1.5, z: 2.0)
  const clearingCenter = toCanvasCoords(1.5, 2.0, dim);
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = '#06140d';
  ctx.beginPath();
  ctx.arc(clearingCenter.x, clearingCenter.y, 145, 0, Math.PI * 2);
  ctx.fill();

  // Concentric mystical spirit rings
  const ringRadii = [140, 105, 70, 35];
  for (let r = 0; r < ringRadii.length; r++) {
    const rad = ringRadii[r];
    ctx.globalAlpha = 0.38;
    ctx.strokeStyle = r % 2 === 0 ? '#2d5843' : accentColor;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(clearingCenter.x, clearingCenter.y, rad, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 4. East Deep Bog / Mire Basin at (8.5, 3.5)
  const bogCenter = toCanvasCoords(8.5, 3.5, dim);
  ctx.globalAlpha = 0.88;
  ctx.fillStyle = '#05120c';
  ctx.beginPath();
  ctx.ellipse(bogCenter.x, bogCenter.y, 115, 85, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Spectral water sheen
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = '#103328';
  ctx.beginPath();
  ctx.ellipse(bogCenter.x, bogCenter.y, 95, 68, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Moonlit specular shine
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = '#54e2c2';
  ctx.beginPath();
  ctx.arc(bogCenter.x - 12, bogCenter.y - 10, 7, 0, Math.PI * 2);
  ctx.fill();

  // Spore ring glow clusters
  for (let i = 0; i < 30; i++) {
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
  _low: boolean,
  occluders: THREE.Object3D[]
): { lanternPositions: THREE.Vector3[] } {
  const worldSlug = 'forest';
  const mBark = envMaterials.getWood(true);
  const mWood = envMaterials.getWood(false);
  const mStone = envMaterials.getStone(theme);
  const mStoneAlt = envMaterials.getStone(theme, true);
  const mPurple = envMaterials.getAccentEmissive(theme, 2.8);
  const mWarm = envMaterials.getWarmEmissive(theme, 3.2);
  const mBogWater = resources.standardMaterial('forest-bog-water', 0x051b14, {
    roughness: 0.15,
    metalness: 0.75,
    emissive: 0x072218,
    emissiveIntensity: 0.4,
  });

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
  const boundX = ARENA_WIDTH / 2 - 0.6; // ~20.4
  const boundZ = ARENA_DEPTH / 2 - 0.8; // ~13.2

  const perimeterTrunks = [
    new THREE.Vector3(-boundX, 0, -boundZ),
    new THREE.Vector3(boundX, 0, -boundZ),
    new THREE.Vector3(-boundX, 0, boundZ),
    new THREE.Vector3(boundX, 0, boundZ),
    new THREE.Vector3(-boundX, 0, 0),
    new THREE.Vector3(boundX, 0, 0),
    new THREE.Vector3(-boundX, 0, -7.0),
    new THREE.Vector3(boundX, 0, -7.0),
    new THREE.Vector3(-boundX, 0, 7.0),
    new THREE.Vector3(boundX, 0, 7.0),
    new THREE.Vector3(-10.0, 0, -boundZ),
    new THREE.Vector3(10.0, 0, -boundZ),
    new THREE.Vector3(-10.0, 0, boundZ),
    new THREE.Vector3(10.0, 0, boundZ),
  ];

  for (const pos of perimeterTrunks) {
    const trunk = new THREE.Group();
    trunk.add(createCylinder(0.85, 1.4, 4.8, 8, mBark, 0, 2.4, 0));
    trunk.add(createBox(3.4, 0.6, 0.85, mBark, 0, 0.3, 0, 0, 0.4, 0));
    trunk.position.copy(pos);
    parent.add(trunk);
  }

  // =============================================================
  // 2. AUTHORED WORLD PROPS (Consumed directly from FOREST_LAYOUT)
  // =============================================================
  const layout = FOREST_LAYOUT;

  for (const prop of layout.props) {
    switch (prop.propType) {
      case 'cursed_tree_giant': {
        placeAuthoredProp(parent, worldSlug, prop, () => {
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
        }, occluders);

        addGlowSprite(prop.x, 2.1, prop.z + 1.8, 2.6, theme.accent);
        lanternPositions.push(new THREE.Vector3(prop.x, 2.1, prop.z + 1.8));
        break;
      }

      case 'spirit_shrine': {
        placeAuthoredProp(parent, worldSlug, prop, () => {
          const g = new THREE.Group();
          g.add(createBox(3.2, 0.35, 3.2, mStoneAlt, 0, 0.17, 0));
          // Torii-style wooden gateway
          g.add(createCylinder(0.2, 0.24, 3.2, 8, mWood, -1.3, 1.6, 0));
          g.add(createCylinder(0.2, 0.24, 3.2, 8, mWood, 1.3, 1.6, 0));
          g.add(createBox(3.5, 0.35, 0.45, mWood, 0, 3.1, 0));
          // Altar table with offering lantern
          g.add(createBox(1.5, 0.8, 1.0, mStone, 0, 0.6, -0.5));
          g.add(createBox(0.26, 0.34, 0.26, mWarm, 0, 1.18, -0.5));
          return g;
        }, occluders);

        addGlowSprite(prop.x, 1.2, prop.z - 0.5, 2.2);
        lanternPositions.push(new THREE.Vector3(prop.x, 1.2, prop.z - 0.5));
        break;
      }

      case 'deep_bog': {
        // Deep Bog 3D Water plane at ground surface
        const bogWater = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 5.0), mBogWater);
        bogWater.rotation.x = -Math.PI / 2;
        bogWater.position.set(prop.x, 0.008, prop.z);
        parent.add(bogWater);
        break;
      }

      case 'fallen_log_segment': {
        placeAuthoredProp(parent, worldSlug, prop, () => {
          const g = new THREE.Group();
          g.add(createCylinder(0.65, 0.72, 3.2, 8, mBark, 0, 0.55, 0, Math.PI / 2, 0, 0));
          // Gnarled root protrusions
          g.add(createBox(0.5, 0.9, 0.5, mBark, 0.8, 0.4, 0.8, 0.2, 0.3, 0));
          return g;
        });
        break;
      }

      case 'standing_stones': {
        placeAuthoredProp(parent, worldSlug, prop, () => {
          const g = new THREE.Group();
          for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 1.6 - 0.8;
            const stone = createCylinder(0.32, 0.42, 2.4, 6, mStone);
            stone.position.set(Math.cos(angle) * 1.6, 1.2, Math.sin(angle) * 1.6);
            stone.rotation.set((rng() - 0.5) * 0.2, rng() * Math.PI, (rng() - 0.5) * 0.2);
            g.add(stone);
          }
          return g;
        }, occluders);
        break;
      }

      case 'ancient_oak': {
        placeAuthoredProp(parent, worldSlug, prop, () => {
          const g = new THREE.Group();
          g.add(createCylinder(0.9, 1.5, 4.8, 8, mBark, 0, 2.4, 0));
          g.add(createSphere(2.4, 8, mBark, 0, 4.8, 0));
          return g;
        }, occluders);
        break;
      }

      case 'gate_pillar': {
        placeAuthoredProp(parent, worldSlug, prop, () => {
          const g = new THREE.Group();
          g.add(createCylinder(0.24, 0.32, 2.8, 8, mBark, 0, 1.4, 0));
          g.add(createBox(0.26, 0.32, 0.26, mWarm, 0, 2.8, 0));
          return g;
        });
        addGlowSprite(prop.x, 2.8, prop.z, 1.8);
        lanternPositions.push(new THREE.Vector3(prop.x, 2.8, prop.z));
        break;
      }
    }
  }

  // Spirit lights along the winding trail
  const trailLanterns = [
    new THREE.Vector3(-5.5, 0, 4.5),
    new THREE.Vector3(0, 0, 2.0),
    new THREE.Vector3(3.5, 0, -2.0),
  ];
  for (const pos of trailLanterns) {
    addGlowSprite(pos.x, 1.6, pos.z, 2.0, theme.accent);
    lanternPositions.push(new THREE.Vector3(pos.x, 1.6, pos.z));
  }

  return { lanternPositions };
}
