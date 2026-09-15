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
  const deepLoam = '#0d1c17';
  const midMoss = '#1c3d30';
  const brightMoss = '#2b5842';
  const accentColor = `#${theme.accent.toString(16).padStart(6, '0')}`;

  // 1. Base forest floor (Readable dark teal-green tone)
  ctx.fillStyle = midMoss;
  ctx.fillRect(0, 0, dim, dim);

  // 2. Layered organic moss drifts, humus layers, and damp loam
  for (let i = 0; i < 220; i++) {
    const x = rng() * dim;
    const y = rng() * dim;
    const rad = 45 + rng() * 115;
    const grad = ctx.createRadialGradient(x, y, 4, x, y, rad);
    const col = i % 4 === 0 ? deepLoam : (i % 4 === 1 ? '#132c22' : (i % 4 === 2 ? brightMoss : '#244d3b'));
    grad.addColorStop(0, col);
    grad.addColorStop(1, 'transparent');
    ctx.globalAlpha = 0.65;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Authored Winding Forest Paths with embedded worn stepping stones
  const drawWindingTrail = (points: { x: number; z: number }[], trailWidth = 48) => {
    if (points.length < 2) return;
    const cPoints = points.map((p) => toCanvasCoords(p.x, p.z, dim));

    // Dark compacted soil bed
    ctx.beginPath();
    ctx.moveTo(cPoints[0].x, cPoints[0].y);
    for (let i = 1; i < cPoints.length; i++) {
      ctx.lineTo(cPoints[i].x, cPoints[i].y);
    }
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = '#091510';
    ctx.lineWidth = trailWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Lighter loam center
    ctx.beginPath();
    ctx.moveTo(cPoints[0].x, cPoints[0].y);
    for (let i = 1; i < cPoints.length; i++) {
      ctx.lineTo(cPoints[i].x, cPoints[i].y);
    }
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = '#274e3c';
    ctx.lineWidth = trailWidth * 0.72;
    ctx.stroke();

    // Embedded weathered stepping stones along trail
    for (let i = 0; i < cPoints.length - 1; i++) {
      const p1 = cPoints[i];
      const p2 = cPoints[i + 1];
      const segDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const stoneSteps = Math.max(3, Math.floor(segDist / 32));
      for (let s = 0; s <= stoneSteps; s++) {
        const t = s / stoneSteps;
        const sx = p1.x + (p2.x - p1.x) * t + (rng() - 0.5) * (trailWidth * 0.4);
        const sy = p1.y + (p2.y - p1.y) * t + (rng() - 0.5) * (trailWidth * 0.4);
        const sw = 14 + rng() * 10;
        const sh = 12 + rng() * 8;

        // Shadow
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = '#060d0a';
        ctx.beginPath();
        ctx.ellipse(sx + 1.5, sy + 1.5, sw / 2, sh / 2, rng() * Math.PI, 0, Math.PI * 2);
        ctx.fill();

        // Stone face
        ctx.globalAlpha = 0.65;
        ctx.fillStyle = s % 2 === 0 ? '#384d42' : '#2d4238';
        ctx.beginPath();
        ctx.ellipse(sx, sy, sw / 2, sh / 2, rng() * Math.PI, 0, Math.PI * 2);
        ctx.fill();

        // Moonlit specular rim
        ctx.globalAlpha = 0.4;
        ctx.strokeStyle = '#689680';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  };

  // Organic winding trails across the arena
  drawWindingTrail([
    { x: -8.2, z: 8.0 },
    { x: -5.5, z: 4.5 },
    { x: 0, z: 2.0 },
    { x: 3.5, z: -2.0 },
    { x: 7.2, z: -8.0 },
  ], 52);

  drawWindingTrail([
    { x: 0, z: 11.2 },
    { x: 0, z: 2.0 },
    { x: -2.0, z: -4.0 },
    { x: -10.5, z: -7.5 },
  ], 48);

  // 4. Mystical Clearing Ritual Circle at (1.5, 2.0)
  const clearingCenter = toCanvasCoords(1.5, 2.0, dim);
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = '#081712';
  ctx.beginPath();
  ctx.arc(clearingCenter.x, clearingCenter.y, 145, 0, Math.PI * 2);
  ctx.fill();

  // Concentric mystical spirit rings
  const ringRadii = [140, 105, 70, 35];
  for (let r = 0; r < ringRadii.length; r++) {
    const rad = ringRadii[r];
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = r % 2 === 0 ? '#3d7258' : accentColor;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(clearingCenter.x, clearingCenter.y, rad, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 5. East Bog / Deep Mire Basin at (8.5, 3.5) with water specular sheen
  const bogCenter = toCanvasCoords(8.5, 3.5, dim);
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = '#06130d';
  ctx.beginPath();
  ctx.ellipse(bogCenter.x, bogCenter.y, 120, 88, 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.72;
  ctx.fillStyle = '#113527';
  ctx.beginPath();
  ctx.ellipse(bogCenter.x, bogCenter.y, 100, 72, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Moonlit bright water sheen
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = '#52e6c2';
  ctx.beginPath();
  ctx.arc(bogCenter.x - 14, bogCenter.y - 12, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = '#f0fffa';
  ctx.beginPath();
  ctx.arc(bogCenter.x - 14, bogCenter.y - 12, 4, 0, Math.PI * 2);
  ctx.fill();

  // 6. Glowing Spore Clusters & Lichen flecks
  for (let i = 0; i < 45; i++) {
    const sx = rng() * dim;
    const sy = rng() * dim;
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = i % 3 === 0 ? '#38e5b4' : (i % 3 === 1 ? '#a855f7' : '#fde047');
    ctx.beginPath();
    ctx.arc(sx, sy, 2.5 + rng() * 3.5, 0, Math.PI * 2);
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
  const mMossBark = envMaterials.getMossyBark();
  const mWood = envMaterials.getWood(false);
  const mStone = envMaterials.getStone(theme);
  const mStoneAlt = envMaterials.getStone(theme, true);
  const mPurple = envMaterials.getAccentEmissive(theme, 2.8);
  const mWarm = envMaterials.getWarmEmissive(theme, 3.2);
  const mBogWater = resources.standardMaterial('forest-bog-water', 0x072218, {
    roughness: 0.14,
    metalness: 0.78,
    emissive: 0x092b1e,
    emissiveIntensity: 0.42,
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

  // Helper to construct a stylized handcrafted gnarled ancient tree with roots and branching
  const createGnarledTree = (trunkRadius: number, height: number, occlude = false) => {
    const g = new THREE.Group();
    // Tapered main trunk
    const trunk = createCylinder(trunkRadius * 0.75, trunkRadius * 1.25, height, 8, mBark, 0, height / 2, 0);
    g.add(trunk);

    // 3 Gnarled buttress root clusters spreading out into the ground
    for (let r = 0; r < 3; r++) {
      const angle = (r / 3) * Math.PI * 2 + 0.3;
      const rx = Math.cos(angle) * (trunkRadius * 1.1);
      const rz = Math.sin(angle) * (trunkRadius * 1.1);
      const rootMesh = createCylinder(
        trunkRadius * 0.4,
        trunkRadius * 0.7,
        height * 0.32,
        6,
        mMossBark,
        rx,
        (height * 0.32) / 2,
        rz,
        Math.cos(angle) * 0.4,
        0,
        Math.sin(angle) * 0.4
      );
      g.add(rootMesh);
    }

    // Spreading canopy limbs
    const branch1 = createCylinder(
      trunkRadius * 0.35,
      trunkRadius * 0.6,
      height * 0.45,
      6,
      mBark,
      trunkRadius * 0.9,
      height * 0.85,
      0,
      0,
      0,
      0.65
    );
    g.add(branch1);

    const branch2 = createCylinder(
      trunkRadius * 0.35,
      trunkRadius * 0.6,
      height * 0.45,
      6,
      mBark,
      -trunkRadius * 0.9,
      height * 0.78,
      trunkRadius * 0.4,
      -0.45,
      0,
      -0.55
    );
    g.add(branch2);

    // Stylized moss clusters on upper branches
    const foliage = createSphere(trunkRadius * 1.6, 7, mMossBark, 0, height + 0.2, 0);
    g.add(foliage);

    if (occlude) {
      occluders.push(trunk);
    }
    return g;
  };

  // =============================================================
  // 1. OUTER PERIMETER: Dense Giant Gnarled Trees & Boundary Ridges
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

  for (let i = 0; i < perimeterTrunks.length; i++) {
    const pos = perimeterTrunks[i];
    const tree = createGnarledTree(0.95 + (i % 3) * 0.15, 5.4 + (i % 2) * 0.8);
    tree.position.copy(pos);
    tree.rotation.y = (i * 1.3) % (Math.PI * 2);
    parent.add(tree);
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
          // Massive ancient twisted trunk
          g.add(createCylinder(1.4, 2.3, 6.2, 8, mBark, 0, 3.1, 0));
          // 4 Gnarled buttress root ramparts
          for (let r = 0; r < 4; r++) {
            const ang = (r / 4) * Math.PI * 2 + 0.4;
            g.add(
              createCylinder(
                0.7,
                1.3,
                2.6,
                6,
                mMossBark,
                Math.cos(ang) * 1.8,
                1.1,
                Math.sin(ang) * 1.8,
                Math.cos(ang) * 0.5,
                0,
                Math.sin(ang) * 0.5
              )
            );
          }
          // Spreading high limbs
          g.add(createCylinder(0.65, 1.1, 4.2, 6, mBark, -1.8, 5.6, 0.6, 0.25, 0, 0.55));
          g.add(createCylinder(0.65, 1.1, 4.2, 6, mBark, 1.8, 5.6, -0.6, -0.25, 0, -0.55));
          // Large moss canopy
          g.add(createSphere(2.8, 8, mMossBark, 0, 7.2, 0));
          // Glowing mystical spirit hollow
          g.add(createSphere(0.52, 8, mPurple, 0, 2.2, 1.8));
          return g;
        }, occluders);

        addGlowSprite(prop.x, 2.2, prop.z + 1.8, 2.8, theme.accent);
        lanternPositions.push(new THREE.Vector3(prop.x, 2.2, prop.z + 1.8));
        break;
      }

      case 'spirit_shrine': {
        placeAuthoredProp(parent, worldSlug, prop, () => {
          const g = new THREE.Group();
          // Tiered stone foundation
          g.add(createBox(3.4, 0.35, 3.4, mStoneAlt, 0, 0.17, 0));
          g.add(createBox(2.8, 0.25, 2.8, mStone, 0, 0.45, 0));
          // Torii-style carved timber gateway posts
          g.add(createCylinder(0.18, 0.22, 3.0, 8, mWood, -1.2, 1.9, 0));
          g.add(createCylinder(0.18, 0.22, 3.0, 8, mWood, 1.2, 1.9, 0));
          // Curved lintel roof
          g.add(createBox(3.6, 0.32, 0.5, mWood, 0, 3.4, 0));
          g.add(createBox(3.0, 0.2, 0.4, mWood, 0, 3.7, 0));
          // Central stone altar table
          g.add(createBox(1.4, 0.85, 0.9, mStone, 0, 0.85, -0.4));
          // Golden spirit lantern on altar
          g.add(createCylinder(0.16, 0.22, 0.38, 6, mWarm, 0, 1.45, -0.4));
          return g;
        }, occluders);

        addGlowSprite(prop.x, 1.45, prop.z - 0.4, 2.4, theme.warm);
        lanternPositions.push(new THREE.Vector3(prop.x, 1.45, prop.z - 0.4));
        break;
      }

      case 'deep_bog': {
        // Deep Bog 3D Water plane at ground surface
        const bogWater = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 5.2), mBogWater);
        bogWater.rotation.x = -Math.PI / 2;
        bogWater.position.set(prop.x, 0.008, prop.z);
        parent.add(bogWater);
        break;
      }

      case 'fallen_log_segment': {
        placeAuthoredProp(parent, worldSlug, prop, () => {
          const g = new THREE.Group();
          // Fallen hollow trunk
          g.add(createCylinder(0.65, 0.75, 3.4, 8, mBark, 0, 0.58, 0, Math.PI / 2, 0, 0.15));
          // Moss growth patches on top surface
          g.add(createBox(0.65, 0.12, 2.4, mMossBark, 0, 1.15, 0));
          // Splintered broken root spurs
          g.add(createCylinder(0.18, 0.35, 1.2, 5, mBark, 1.1, 0.5, 0.6, 0.3, 0.4, 0.2));
          g.add(createCylinder(0.18, 0.35, 1.0, 5, mBark, -1.0, 0.4, -0.5, -0.3, -0.2, 0.3));
          return g;
        });
        break;
      }

      case 'standing_stones': {
        placeAuthoredProp(parent, worldSlug, prop, () => {
          const g = new THREE.Group();
          for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 1.6 - 0.8;
            const stone = createCylinder(0.35, 0.48, 2.6, 6, mStone);
            stone.position.set(Math.cos(angle) * 1.7, 1.3, Math.sin(angle) * 1.7);
            stone.rotation.set((rng() - 0.5) * 0.18, rng() * Math.PI, (rng() - 0.5) * 0.18);
            g.add(stone);
            // Glowing runic inscription band
            const runeBand = createCylinder(0.36, 0.49, 0.15, 6, mPurple);
            runeBand.position.set(Math.cos(angle) * 1.7, 1.2, Math.sin(angle) * 1.7);
            runeBand.rotation.copy(stone.rotation);
            g.add(runeBand);
          }
          return g;
        }, occluders);

        addGlowSprite(prop.x, 1.3, prop.z, 2.2, theme.accent);
        break;
      }

      case 'ancient_oak': {
        placeAuthoredProp(parent, worldSlug, prop, () => {
          const g = new THREE.Group();
          g.add(createCylinder(0.95, 1.55, 5.0, 8, mBark, 0, 2.5, 0));
          // Gnarled roots
          g.add(createBox(3.4, 0.8, 1.0, mMossBark, 0, 0.4, 0, 0, 0.4, 0));
          g.add(createBox(1.0, 0.8, 3.4, mMossBark, 0, 0.4, 0, 0, -0.4, 0));
          // Dense canopy
          g.add(createSphere(2.6, 8, mMossBark, 0, 5.2, 0));
          return g;
        }, occluders);
        break;
      }

      case 'gate_pillar': {
        placeAuthoredProp(parent, worldSlug, prop, () => {
          const g = new THREE.Group();
          // Stone pedestal base
          g.add(createBox(0.8, 0.6, 0.8, mStoneAlt, 0, 0.3, 0));
          // Carved timber shaft
          g.add(createCylinder(0.24, 0.32, 2.4, 8, mWood, 0, 1.8, 0));
          // Iron lantern bracket and glowing lantern
          g.add(createBox(0.28, 0.35, 0.28, mWarm, 0, 3.1, 0));
          return g;
        });
        addGlowSprite(prop.x, 3.1, prop.z, 2.0, theme.warm);
        lanternPositions.push(new THREE.Vector3(prop.x, 3.1, prop.z));
        break;
      }
    }
  }

  // Spirit lanterns along the winding trail
  const trailLanterns = [
    new THREE.Vector3(-5.5, 0, 4.5),
    new THREE.Vector3(0, 0, 2.0),
    new THREE.Vector3(3.5, 0, -2.0),
  ];
  for (const pos of trailLanterns) {
    addGlowSprite(pos.x, 1.6, pos.z, 2.2, theme.accent);
    lanternPositions.push(new THREE.Vector3(pos.x, 1.6, pos.z));
  }

  return { lanternPositions };
}

