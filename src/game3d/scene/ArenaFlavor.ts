import * as THREE from 'three';
import type { BiomeTheme } from './BiomeTheme';
import { ARENA_DEPTH, ARENA_WIDTH } from '../core/coordinates';
import { SharedResources, addMesh } from '../core/SharedResources';

type VisionPatch = {
  center: THREE.Vector2;
  radius: number;
  sprites: THREE.Sprite[];
  baseOpacity: number;
};

export type ArenaFlavorController = {
  update: (playerWorldPosition: THREE.Vector3, delta: number) => void;
  visionPatches: ReadonlyArray<{ x: number; z: number; radius: number }>;
};

function rgba(color: number, alpha: number): string {
  return `rgba(${(color >> 16) & 0xff}, ${(color >> 8) & 0xff}, ${color & 0xff}, ${alpha})`;
}

function makeSoftTexture(inner: string, middle: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(64, 64, 5, 64, 64, 62);
    gradient.addColorStop(0, inner);
    gradient.addColorStop(0.48, middle);
    gradient.addColorStop(0.82, middle.replace(/,\s*([\d.]+)\)$/, ', 0.12)'));
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function clutterPalette(worldId: number, theme: BiomeTheme): { primary: number; secondary: number; emissive: number } {
  if (worldId === 1) return { primary: 0x53644f, secondary: 0x786b4e, emissive: 0x000000 };
  if (worldId === 2) return { primary: 0x315e44, secondary: 0x6f8c4b, emissive: 0x102a1d };
  if (worldId === 3) return { primary: 0xb4d9e8, secondary: 0x6fa8bf, emissive: 0x153f56 };
  return { primary: 0x3b2528, secondary: 0x6e3028, emissive: theme.warm };
}

function createClutter(
  parent: THREE.Group,
  resources: SharedResources,
  theme: BiomeTheme,
  worldId: number,
  rng: () => number,
  lowPerformanceMode: boolean,
): void {
  const palette = clutterPalette(worldId, theme);
  const count = lowPerformanceMode ? 26 : 54;
  const secondaryCount = lowPerformanceMode ? 12 : 26;
  const geometry = worldId === 3 ? resources.octa('arena-flavor-ice') : resources.cone(`arena-flavor-clutter-${worldId}`);
  const material = resources.standardMaterial(`arena-flavor-primary-${worldId}`, palette.primary, {
    roughness: worldId === 3 ? 0.38 : 0.92,
    metalness: worldId === 3 ? 0.18 : 0.02,
    emissive: palette.emissive,
    emissiveIntensity: worldId === 4 ? 0.18 : worldId === 2 ? 0.08 : 0,
  });
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.name = `arena-biome-clutter-${worldId}`;
  mesh.frustumCulled = true;
  const dummy = new THREE.Object3D();

  for (let i = 0; i < count; i += 1) {
    const sideBias = rng() < 0.62;
    const x = sideBias
      ? (rng() < 0.5 ? -1 : 1) * (ARENA_WIDTH * (0.28 + rng() * 0.19))
      : (rng() - 0.5) * ARENA_WIDTH * 0.76;
    const z = sideBias
      ? (rng() - 0.5) * ARENA_DEPTH * 0.84
      : (rng() < 0.5 ? -1 : 1) * ARENA_DEPTH * (0.27 + rng() * 0.18);
    const size = worldId === 3 ? 0.28 + rng() * 0.48 : 0.24 + rng() * 0.44;
    dummy.position.set(x, worldId === 3 ? size * 0.38 : size * 0.42, z);
    dummy.rotation.set((rng() - 0.5) * 0.18, rng() * Math.PI * 2, (rng() - 0.5) * 0.24);
    if (worldId === 3) dummy.scale.set(size * 0.55, size * 1.7, size * 0.55);
    else if (worldId === 4) dummy.scale.set(size * 0.42, size * 1.9, size * 0.42);
    else dummy.scale.set(size * 0.34, size * (1.3 + rng() * 0.9), size * 0.34);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.castShadow = !lowPerformanceMode;
  mesh.receiveShadow = !lowPerformanceMode;
  parent.add(mesh);

  const accentGeometry = worldId === 4 ? resources.box('arena-flavor-ember-stone') : resources.ico(`arena-flavor-accent-${worldId}`);
  const accentMaterial = resources.standardMaterial(`arena-flavor-secondary-${worldId}`, palette.secondary, {
    roughness: worldId === 3 ? 0.42 : 0.86,
    metalness: worldId === 3 ? 0.22 : 0.04,
    emissive: worldId === 4 ? 0x55120d : worldId === 3 ? 0x0b3346 : 0,
    emissiveIntensity: worldId === 4 ? 0.5 : worldId === 3 ? 0.18 : 0,
  });
  const accents = new THREE.InstancedMesh(accentGeometry, accentMaterial, secondaryCount);
  accents.name = `arena-biome-accents-${worldId}`;
  accents.castShadow = !lowPerformanceMode;
  accents.receiveShadow = !lowPerformanceMode;
  for (let i = 0; i < secondaryCount; i += 1) {
    const x = (rng() - 0.5) * ARENA_WIDTH * 0.9;
    const z = (rng() - 0.5) * ARENA_DEPTH * 0.88;
    const size = 0.18 + rng() * 0.42;
    dummy.position.set(x, size * 0.18, z);
    dummy.rotation.set(rng() * 0.4, rng() * Math.PI * 2, rng() * 0.35);
    dummy.scale.set(size * 1.3, size * (worldId === 4 ? 0.55 : 0.8), size);
    dummy.updateMatrix();
    accents.setMatrixAt(i, dummy.matrix);
  }
  accents.instanceMatrix.needsUpdate = true;
  parent.add(accents);
}

function createVisionPatches(
  parent: THREE.Group,
  theme: BiomeTheme,
  worldId: number,
  rng: () => number,
  lowPerformanceMode: boolean,
): VisionPatch[] {
  const texture = makeSoftTexture(
    rgba(worldId === 4 ? 0x2d0a0a : worldId === 3 ? 0xc5e8f5 : worldId === 2 ? 0x18382d : 0x1d2730, 0.78),
    rgba(worldId === 4 ? 0x5d1510 : worldId === 3 ? 0x85b8cb : worldId === 2 ? 0x2d5a45 : 0x43566a, 0.42),
  );
  const patchCount = lowPerformanceMode ? 2 : 4;
  const patches: VisionPatch[] = [];

  for (let index = 0; index < patchCount; index += 1) {
    const angle = (index / patchCount) * Math.PI * 2 + (rng() - 0.5) * 0.75;
    const radial = 5.8 + rng() * 6.4;
    const center = new THREE.Vector2(Math.cos(angle) * radial, Math.sin(angle) * radial * 0.72);
    const radius = 2.8 + rng() * 1.8;
    const sprites: THREE.Sprite[] = [];
    const spriteCount = lowPerformanceMode ? 2 : 4;
    const baseOpacity = worldId === 2 ? 0.33 : worldId === 1 ? 0.28 : 0.22;

    for (let s = 0; s < spriteCount; s += 1) {
      const material = new THREE.SpriteMaterial({
        map: texture,
        color: worldId === 4 ? 0x7a251b : worldId === 3 ? 0xbce3ef : worldId === 2 ? 0x496f59 : 0x65788b,
        transparent: true,
        opacity: baseOpacity * (0.78 + rng() * 0.35),
        depthWrite: false,
        depthTest: true,
      });
      const sprite = new THREE.Sprite(material);
      const localAngle = rng() * Math.PI * 2;
      const localRadius = rng() * radius * 0.58;
      sprite.position.set(center.x + Math.cos(localAngle) * localRadius, 0.9 + rng() * 0.6, center.y + Math.sin(localAngle) * localRadius);
      const width = radius * (1.5 + rng() * 0.75);
      sprite.scale.set(width, width * 0.55, 1);
      sprite.renderOrder = 4;
      parent.add(sprite);
      sprites.push(sprite);
    }

    patches.push({ center, radius, sprites, baseOpacity });
  }

  return patches;
}

function createGoofyBrawlStarsProps(
  parent: THREE.Group,
  resources: SharedResources,
  worldId: number,
  rng: () => number,
  lowPerformanceMode: boolean,
): void {
  const goofyGroup = new THREE.Group();
  goofyGroup.name = 'brawl-stars-goofy-props';

  const mWoodCrate = resources.standardMaterial('brawl-wood-crate', 0xb45309, { roughness: 0.72 });
  const mYellowX = resources.standardMaterial('brawl-yellow-x', 0xfacc15, { roughness: 0.5, emissive: 0x78350f, emissiveIntensity: 0.25 });
  const mCactusGreen = resources.standardMaterial('brawl-cactus-green', 0x16a34a, { roughness: 0.65 });
  const mPinkFlower = resources.basicMaterial('brawl-pink-flower', 0xf43f5e);
  const mEyeWhite = resources.basicMaterial('brawl-prop-eye-white', 0xffffff);
  const mEyePupil = resources.basicMaterial('brawl-prop-eye-pupil', 0x09090b);
  const mMushroomRed = resources.standardMaterial('brawl-mushroom-red', 0xef4444, { roughness: 0.5 });
  const mMushroomStem = resources.standardMaterial('brawl-mushroom-stem', 0xfef08a, { roughness: 0.8 });
  const mBushLime = resources.standardMaterial('brawl-bush-lime', 0x22c55e, { roughness: 0.75 });
  const mStarGold = resources.standardMaterial('brawl-star-gold', 0xfbbf24, { metalness: 0.8, roughness: 0.25, emissive: 0x92400e, emissiveIntensity: 0.4 });
  const mHazardYellow = resources.standardMaterial('brawl-hazard-yellow', 0xfacc15, { roughness: 0.4 });
  const mHazardDark = resources.standardMaterial('brawl-hazard-dark', 0x0f172a, { roughness: 0.5 });

  // 1. Chunky Brawl Wooden Crates with Yellow X
  const crateCount = lowPerformanceMode ? 6 : 12;
  for (let i = 0; i < crateCount; i += 1) {
    const angle = (i / crateCount) * Math.PI * 2 + (rng() - 0.5) * 0.4;
    const dist = ARENA_WIDTH * (0.33 + rng() * 0.12);
    const cx = Math.cos(angle) * dist;
    const cz = Math.sin(angle) * (dist * 0.78);
    const crate = new THREE.Group();
    crate.position.set(cx, 0.38, cz);
    crate.rotation.y = rng() * Math.PI * 2;

    const box = addMesh(crate, resources.box('brawl-crate-box'), mWoodCrate);
    box.scale.set(0.76, 0.76, 0.76);

    // Yellow X straps on front and sides
    const strapX = addMesh(crate, resources.box('brawl-crate-strap1'), mYellowX);
    strapX.scale.set(0.12, 0.80, 0.80);
    strapX.rotation.z = Math.PI / 4;

    const strapY = addMesh(crate, resources.box('brawl-crate-strap2'), mYellowX);
    strapY.scale.set(0.12, 0.80, 0.80);
    strapY.rotation.z = -Math.PI / 4;

    goofyGroup.add(crate);
  }

  // 2. Goofy Bouncy Cacti with Pink Flowers & Googly Eyes
  const cactusCount = lowPerformanceMode ? 4 : 8;
  for (let i = 0; i < cactusCount; i += 1) {
    const angle = ((i + 0.5) / cactusCount) * Math.PI * 2 + (rng() - 0.5) * 0.3;
    const dist = ARENA_WIDTH * (0.35 + rng() * 0.10);
    const kx = Math.cos(angle) * dist;
    const kz = Math.sin(angle) * (dist * 0.80);
    const cactus = new THREE.Group();
    cactus.position.set(kx, 0, kz);
    cactus.rotation.y = (rng() - 0.5) * 0.6;

    const body = addMesh(cactus, resources.cylinder('brawl-cactus-body'), mCactusGreen);
    body.scale.set(0.44, 1.05, 0.44);
    body.position.y = 0.52;

    const cap = addMesh(cactus, resources.sphere('brawl-cactus-cap'), mCactusGreen);
    cap.scale.set(0.44, 0.32, 0.44);
    cap.position.y = 1.05;

    // Pink flower hat
    const flower = addMesh(cactus, resources.octa('brawl-cactus-flower'), mPinkFlower);
    flower.scale.set(0.24, 0.18, 0.24);
    flower.position.set(0, 1.28, 0);

    // Googly eyes looking around
    for (const ex of [-0.11, 0.11]) {
      const eyeW = addMesh(cactus, resources.sphere('brawl-cactus-eye-w'), mEyeWhite);
      eyeW.scale.set(0.08, 0.08, 0.04);
      eyeW.position.set(ex, 0.70, 0.22);

      const eyeP = addMesh(cactus, resources.sphere('brawl-cactus-eye-p'), mEyePupil);
      eyeP.scale.set(0.04, 0.04, 0.04);
      eyeP.position.set(ex + (ex < 0 ? 0.015 : -0.01), 0.70, 0.24);
    }

    // Goofy curved arms
    for (const dir of [-1, 1]) {
      const armH = addMesh(cactus, resources.cylinder(`brawl-cactus-arm-${dir}`), mCactusGreen);
      armH.scale.set(0.16, 0.28, 0.16);
      armH.position.set(dir * 0.28, 0.58, 0);
      armH.rotation.z = Math.PI / 2;

      const armV = addMesh(cactus, resources.cylinder(`brawl-cactus-arm-v-${dir}`), mCactusGreen);
      armV.scale.set(0.16, 0.32, 0.16);
      armV.position.set(dir * 0.40, 0.72, 0);
    }

    goofyGroup.add(cactus);
  }

  // 3. Goofy Bouncy Cartoon Mushrooms with Red Polka-Dot Caps
  const shroomCount = lowPerformanceMode ? 4 : 8;
  for (let i = 0; i < shroomCount; i += 1) {
    const angle = rng() * Math.PI * 2;
    const dist = ARENA_WIDTH * (0.26 + rng() * 0.16);
    const mx = Math.cos(angle) * dist;
    const mz = Math.sin(angle) * (dist * 0.76);
    const shroom = new THREE.Group();
    shroom.position.set(mx, 0, mz);
    shroom.rotation.y = rng() * Math.PI * 2;

    const stem = addMesh(shroom, resources.cylinder('brawl-shroom-stem'), mMushroomStem);
    stem.scale.set(0.20, 0.40, 0.20);
    stem.position.y = 0.20;

    const redCap = addMesh(shroom, resources.sphere('brawl-shroom-cap'), mMushroomRed);
    redCap.scale.set(0.52, 0.30, 0.52);
    redCap.position.y = 0.44;

    for (const [px, py, pz] of [[0, 0.58, 0], [0.20, 0.48, 0.12], [-0.18, 0.48, 0.12], [0, 0.48, -0.22]]) {
      const dot = addMesh(shroom, resources.sphere('brawl-shroom-dot'), mEyeWhite);
      dot.scale.setScalar(0.08);
      dot.position.set(px, py, pz);
    }

    goofyGroup.add(shroom);
  }

  // 4. Goofy Bouncy Bushes with Flower Blossoms
  const bushCount = lowPerformanceMode ? 5 : 10;
  for (let i = 0; i < bushCount; i += 1) {
    const angle = (i / bushCount) * Math.PI * 2 + (rng() - 0.5) * 0.25;
    const dist = ARENA_WIDTH * (0.31 + rng() * 0.12);
    const bx = Math.cos(angle) * dist;
    const bz = Math.sin(angle) * (dist * 0.78);
    const bush = new THREE.Group();
    bush.position.set(bx, 0, bz);

    for (let c = 0; c < 3; c += 1) {
      const clump = addMesh(bush, resources.sphere(`brawl-bush-clump-${c}`), mBushLime);
      clump.scale.set(0.44 + rng() * 0.18, 0.38 + rng() * 0.14, 0.44 + rng() * 0.18);
      clump.position.set((c - 1) * 0.26, 0.28 + c * 0.05, (rng() - 0.5) * 0.18);
    }

    const flowerBud = addMesh(bush, resources.octa('brawl-bush-flower'), mStarGold);
    flowerBud.scale.setScalar(0.11);
    flowerBud.position.set(0, 0.52, 0.14);

    goofyGroup.add(bush);
  }

  // 5. Brawl Stars Tournament Hazard Bumper Posts
  const postCount = 8;
  for (let p = 0; p < postCount; p += 1) {
    const angle = (p / postCount) * Math.PI * 2;
    const postX = Math.cos(angle) * (ARENA_WIDTH * 0.48);
    const postZ = Math.sin(angle) * (ARENA_DEPTH * 0.48);
    const post = new THREE.Group();
    post.position.set(postX, 0, postZ);

    const pillar = addMesh(post, resources.cylinder(`brawl-post-pillar-${p}`), mHazardDark);
    pillar.scale.set(0.24, 1.2, 0.24);
    pillar.position.y = 0.6;

    const stripe = addMesh(post, resources.torus(`brawl-post-stripe-${p}`), mHazardYellow);
    stripe.scale.set(0.26, 0.26, 0.14);
    stripe.position.set(0, 0.6, 0);
    stripe.rotation.x = Math.PI / 2;

    const starTop = addMesh(post, resources.octa(`brawl-post-star-${p}`), mStarGold);
    starTop.scale.setScalar(0.22);
    starTop.position.set(0, 1.35, 0);

    goofyGroup.add(post);
  }

  parent.add(goofyGroup);
}

export function createArenaFlavor(
  parent: THREE.Group,
  resources: SharedResources,
  theme: BiomeTheme,
  worldId: number,
  rng: () => number,
  lowPerformanceMode: boolean,
): ArenaFlavorController {
  createClutter(parent, resources, theme, worldId, rng, lowPerformanceMode);
  createGoofyBrawlStarsProps(parent, resources, worldId, rng, lowPerformanceMode);
  const patches = createVisionPatches(parent, theme, worldId, rng, lowPerformanceMode);
  let phase = 0;

  return {
    visionPatches: patches.map((patch) => ({ x: patch.center.x, z: patch.center.y, radius: patch.radius })),
    update: (playerWorldPosition, delta) => {
      phase += delta;
      for (let index = 0; index < patches.length; index += 1) {
        const patch = patches[index];
        const distance = Math.hypot(playerWorldPosition.x - patch.center.x, playerWorldPosition.z - patch.center.y);
        const playerInside = distance < patch.radius * 0.82;
        const targetOpacity = patch.baseOpacity * (playerInside ? 0.42 : 1);
        for (let s = 0; s < patch.sprites.length; s += 1) {
          const sprite = patch.sprites[s];
          const material = sprite.material as THREE.SpriteMaterial;
          const breathe = 0.92 + Math.sin(phase * 0.8 + index * 1.7 + s) * 0.08;
          material.opacity = THREE.MathUtils.lerp(material.opacity, targetOpacity * breathe, Math.min(1, delta * 2.8));
          sprite.position.x += Math.sin(phase * 0.23 + s * 2.1) * delta * 0.025;
        }
      }
    },
  };
}
