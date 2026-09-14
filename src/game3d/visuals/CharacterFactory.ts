import * as THREE from 'three';
import type { BossId } from '../../types';
import { SharedResources, addMesh } from '../core/SharedResources';
import { modelRegistry, type ModelAssetId } from '../assets/ModelRegistry';

export function createShadowMage(resources: SharedResources): { root: THREE.Group; aura: THREE.Mesh; shadow: THREE.Mesh } {
  const root = new THREE.Group();
  root.name = 'survivor-hero';
  root.userData.parts = {} as Record<string, THREE.Object3D | THREE.Object3D[]>;

  // Contact shadow
  const shadow = new THREE.Mesh(
    resources.plane('hero-shadow', 1, 1),
    resources.basicMaterial('hero-shadow', 0x050c14, { transparent: true, opacity: 0.65 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.set(1.05, 0.62, 1);
  shadow.position.y = 0.015;
  root.add(shadow);

  // Dash / aura ring
  const aura = new THREE.Mesh(
    resources.ring('hero-aura', 0.82, 0.92),
    resources.basicMaterial('hero-aura', 0x38e5ff, { transparent: true, opacity: 0.72, side: THREE.DoubleSide }),
  );
  aura.rotation.x = -Math.PI / 2;
  aura.position.y = 0.03;
  root.add(aura);

  // --- Chibi Cartoon Survivor Hero (Survivor.io Style) ---

  // 1. Boots
  const bootMat = resources.standardMaterial('hero-boot-mat', 0x221a14, { roughness: 0.85 });
  for (const x of [-0.22, 0.22]) {
    const boot = addMesh(root, resources.box('hero-boot'), bootMat);
    boot.scale.set(0.24, 0.2, 0.38);
    boot.position.set(x, 0.12, 0.04);
  }

  // 2. Legs / Denim Jeans
  const jeansMat = resources.standardMaterial('hero-jeans-mat', 0x32475e, { roughness: 0.8 });
  for (const x of [-0.2, 0.2]) {
    const leg = addMesh(root, resources.cylinder('hero-leg'), jeansMat);
    leg.scale.set(0.18, 0.42, 0.18);
    leg.position.set(x, 0.36, 0.02);
  }

  // 3. Pelvis & Belt
  const belt = addMesh(root, resources.box('hero-belt'), resources.standardMaterial('hero-belt-mat', 0x1b1f24, { roughness: 0.7 }));
  belt.scale.set(0.64, 0.12, 0.44);
  belt.position.set(0, 0.58, 0.02);
  const buckle = addMesh(root, resources.box('hero-buckle'), resources.standardMaterial('hero-buckle-mat', 0xf0b832, { metalness: 0.6, roughness: 0.3 }));
  buckle.scale.set(0.16, 0.09, 0.06);
  buckle.position.set(0, 0.58, 0.24);

  // 4. Torso: White Shirt + Brown Tactical Vest
  const shirt = addMesh(root, resources.box('hero-shirt'), resources.standardMaterial('hero-shirt-mat', 0xf0f4f9, { roughness: 0.75 }));
  shirt.scale.set(0.68, 0.62, 0.48);
  shirt.position.set(0, 0.88, 0.02);

  const vest = addMesh(root, resources.box('hero-vest'), resources.standardMaterial('hero-vest-mat', 0x7c4929, { roughness: 0.7 }));
  vest.scale.set(0.72, 0.58, 0.52);
  vest.position.set(0, 0.88, 0.01);

  // Vest Pockets & Straps
  const vestStrapMat = resources.standardMaterial('hero-vest-strap', 0x543019, { roughness: 0.8 });
  for (const x of [-0.22, 0.22]) {
    const pocket = addMesh(root, resources.box('hero-vest-pocket'), vestStrapMat);
    pocket.scale.set(0.18, 0.18, 0.08);
    pocket.position.set(x, 0.78, 0.25);
  }

  // 5. Head: Chibi Rounded Head, Peach Skin
  const skinMat = resources.standardMaterial('hero-skin-mat', 0xfcd8bd, { roughness: 0.65 });
  const head = addMesh(root, resources.ico('hero-head'), skinMat);
  head.scale.set(0.68, 0.66, 0.64);
  head.position.set(0, 1.44, 0.04);

  // 6. Styled Brown Hair + Cowlick Swoop
  const hairMat = resources.standardMaterial('hero-hair-mat', 0x522e1b, { roughness: 0.85 });
  const hairTop = addMesh(root, resources.ico('hero-hair-top'), hairMat);
  hairTop.scale.set(0.72, 0.44, 0.68);
  hairTop.position.set(0, 1.74, 0.01);

  const hairSwoop = addMesh(root, resources.cone('hero-hair-swoop'), hairMat);
  hairSwoop.scale.set(0.24, 0.38, 0.24);
  hairSwoop.position.set(0.12, 1.86, 0.28);
  hairSwoop.rotation.set(-0.35, 0.2, -0.4);

  // 7. Red/Ginger Full Beard & Mustache
  const beardMat = resources.standardMaterial('hero-beard-mat', 0xc54a24, { roughness: 0.88 });
  const beard = addMesh(root, resources.box('hero-beard'), beardMat);
  beard.scale.set(0.58, 0.34, 0.46);
  beard.position.set(0, 1.25, 0.22);

  const mustache = addMesh(root, resources.box('hero-mustache'), beardMat);
  mustache.scale.set(0.42, 0.12, 0.14);
  mustache.position.set(0, 1.39, 0.37);

  // 8. Cyan Glasses
  const glassesMat = resources.standardMaterial('hero-glasses-mat', 0x00d4ff, { emissive: 0x0099cc, emissiveIntensity: 0.6, roughness: 0.3 });
  const glassesBridge = addMesh(root, resources.box('hero-glasses-bridge'), glassesMat);
  glassesBridge.scale.set(0.14, 0.04, 0.04);
  glassesBridge.position.set(0, 1.51, 0.36);

  for (const x of [-0.18, 0.18]) {
    const rim = addMesh(root, resources.torus('hero-glass-rim'), glassesMat);
    rim.scale.setScalar(0.12);
    rim.position.set(x, 1.51, 0.35);

    // Dark eyes inside glasses
    const pupil = addMesh(root, resources.sphere('hero-pupil'), resources.basicMaterial('hero-pupil-mat', 0x111e2e));
    pupil.scale.set(0.06, 0.06, 0.03);
    pupil.position.set(x, 1.51, 0.34);
  }

  // 9. Arms: Rolled White Sleeves + Peach Forearms
  const arms: THREE.Object3D[] = [];
  const armGroupLeft = new THREE.Group();
  armGroupLeft.position.set(-0.46, 0.98, 0.04);
  const leftSleeve = addMesh(armGroupLeft, resources.cylinder('hero-sleeve-l'), resources.standardMaterial('hero-shirt-mat', 0xf0f4f9, { roughness: 0.75 }));
  leftSleeve.scale.set(0.18, 0.32, 0.18);
  leftSleeve.position.set(0, -0.06, 0.05);
  leftSleeve.rotation.x = -Math.PI / 4;
  const leftForearm = addMesh(armGroupLeft, resources.cylinder('hero-forearm-l'), skinMat);
  leftForearm.scale.set(0.14, 0.38, 0.14);
  leftForearm.position.set(0.12, -0.15, 0.28);
  leftForearm.rotation.x = -Math.PI / 2.2;
  root.add(armGroupLeft);
  arms.push(armGroupLeft);

  const armGroupRight = new THREE.Group();
  armGroupRight.position.set(0.46, 0.98, 0.04);
  const rightSleeve = addMesh(armGroupRight, resources.cylinder('hero-sleeve-r'), resources.standardMaterial('hero-shirt-mat', 0xf0f4f9, { roughness: 0.75 }));
  rightSleeve.scale.set(0.18, 0.32, 0.18);
  rightSleeve.position.set(0, -0.06, 0.05);
  rightSleeve.rotation.x = -Math.PI / 4;
  const rightForearm = addMesh(armGroupRight, resources.cylinder('hero-forearm-r'), skinMat);
  rightForearm.scale.set(0.14, 0.38, 0.14);
  rightForearm.position.set(-0.12, -0.15, 0.28);
  rightForearm.rotation.x = -Math.PI / 2.2;
  root.add(armGroupRight);
  arms.push(armGroupRight);

  // 10. Futuristic Sci-Fi Blaster Rifle (Survivor.io Style)
  const blaster = new THREE.Group();
  blaster.name = 'hero-blaster';
  blaster.position.set(0.08, 0.88, 0.44);

  // Blaster Body (Steel Blue)
  const blasterBody = addMesh(blaster, resources.box('blaster-body'), resources.standardMaterial('blaster-body-mat', 0x4a7396, { metalness: 0.4, roughness: 0.35 }));
  blasterBody.scale.set(0.24, 0.22, 0.62);

  // Blaster Barrel (Dark Graphite)
  const blasterBarrel = addMesh(blaster, resources.cylinder('blaster-barrel'), resources.standardMaterial('blaster-barrel-mat', 0x242a32, { metalness: 0.6, roughness: 0.25 }));
  blasterBarrel.scale.set(0.08, 0.45, 0.08);
  blasterBarrel.position.set(0, 0.02, 0.42);
  blasterBarrel.rotation.x = Math.PI / 2;

  // Glowing Orange Energy Rails & Muzzle
  const plasmaMat = resources.standardMaterial('blaster-plasma-mat', 0xff6600, { emissive: 0xff4400, emissiveIntensity: 2.2, roughness: 0.2 });
  const blasterMuzzle = addMesh(blaster, resources.torus('blaster-muzzle'), plasmaMat);
  blasterMuzzle.scale.setScalar(0.09);
  blasterMuzzle.position.set(0, 0.02, 0.64);

  const blasterRailTop = addMesh(blaster, resources.box('blaster-rail'), plasmaMat);
  blasterRailTop.scale.set(0.14, 0.05, 0.4);
  blasterRailTop.position.set(0, 0.14, 0.06);

  // Holographic Scope
  const scopeMat = resources.standardMaterial('blaster-scope-mat', 0x38e5ff, { emissive: 0x00c8ff, emissiveIntensity: 1.8, transparent: true, opacity: 0.85 });
  const scope = addMesh(blaster, resources.box('blaster-scope'), scopeMat);
  scope.scale.set(0.1, 0.1, 0.16);
  scope.position.set(0, 0.22, -0.06);

  root.add(blaster);

  root.userData.parts = {
    head,
    hairTop,
    hairSwoop,
    arms,
    blaster,
    staff: blaster, // fallback compat
    crystal: blasterMuzzle,
  };

  return { root, aura, shadow };
}

function addEyes(root: THREE.Group, resources: SharedResources, color: number, y = 1.08): void {
  // Vibrant Glowing Zombie Eyes (Neon Pink/Magenta)
  const eyeMat = resources.standardMaterial(`zombie-pink-eyes-${color}`, color, {
    emissive: color,
    emissiveIntensity: 2.5,
    roughness: 0.1,
  });
  for (const x of [-0.17, 0.17]) {
    const eye = addMesh(root, resources.sphere('zombie-eye'), eyeMat);
    eye.scale.set(0.095, 0.095, 0.05);
    eye.position.set(x, y, 0.44);
  }
}

export function createEnemyModel(kind: string, _color: number, resources: SharedResources, _worldId = 1): THREE.Group {
  const root = new THREE.Group();
  root.name = `zombie-${kind}`;
  root.userData.parts = {} as Record<string, THREE.Object3D | THREE.Object3D[]>;

  // Survivor.io Zombie Palette:
  // Teal/Cyan Zombie Skin, glowing neon-pink eyes, dark ragged clothes, yellow construction hard hats
  const tealSkinColor = 0x3ea3b6;
  const zombieSkinMat = resources.standardMaterial('zombie-skin-teal', tealSkinColor, { roughness: 0.72 });
  const zombieShirtMat = resources.standardMaterial('zombie-shirt-navy', 0x2b3848, { roughness: 0.85 });
  const zombiePantsMat = resources.standardMaterial('zombie-pants-dark', 0x1b2532, { roughness: 0.9 });
  const pinkEyeColor = 0xff1665;

  if (kind === 'slime') {
    // Toxic Sludge Zombie Crawler
    const body = addMesh(root, resources.sphere('zombie-slime-body'), resources.standardMaterial('zombie-slime-mat', 0x2cb894, { emissive: 0x0f5c46, emissiveIntensity: 0.8, roughness: 0.4 }));
    body.scale.set(0.85, 0.58, 0.75);
    body.position.y = 0.42;
    root.userData.parts = { body };
    addEyes(root, resources, pinkEyeColor, 0.52);
    return root;
  }

  if (kind === 'bat') {
    // Flying Infected Drone/Bat
    const body = addMesh(root, resources.ico('zombie-bat-body'), resources.standardMaterial('zombie-bat-mat', 0x324458, { roughness: 0.7 }));
    body.scale.set(0.44, 0.34, 0.52);
    body.position.y = 0.82;
    const wings: THREE.Object3D[] = [];
    for (const x of [-0.55, 0.55]) {
      const wing = addMesh(root, resources.cone('zombie-bat-wing'), resources.standardMaterial('zombie-bat-wing-mat', 0x1b2532, { roughness: 0.8 }));
      wing.scale.set(0.72, 0.12, 0.48);
      wing.position.set(x, 0.84, 0);
      wing.rotation.z = x < 0 ? -0.25 : 0.25;
      wings.push(wing);
    }
    root.userData.parts = { body, wings };
    addEyes(root, resources, pinkEyeColor, 0.86);
    return root;
  }

  // --- Core Zombie Horde Model (Survivor.io Style) ---
  const isHelmetZombie = kind === 'knight' || kind === 'archer';
  const isBrute = kind === 'demon' || kind === 'imp';

  // 1. Legs & Shoes
  for (const x of [-0.18, 0.18]) {
    const leg = addMesh(root, resources.cylinder('zombie-leg'), zombiePantsMat);
    leg.scale.set(isBrute ? 0.18 : 0.13, 0.48, isBrute ? 0.18 : 0.13);
    leg.position.set(x, 0.24, 0);
  }

  // 2. Torso (Ragged Shirt)
  const torso = addMesh(root, resources.cylinder('zombie-torso'), zombieShirtMat);
  torso.scale.set(isBrute ? 0.68 : 0.48, 0.72, isBrute ? 0.54 : 0.38);
  torso.position.y = 0.68;

  // 3. Head (Teal Skin)
  const head = addMesh(root, resources.ico('zombie-head'), zombieSkinMat);
  head.scale.set(isBrute ? 0.62 : 0.52, isBrute ? 0.58 : 0.48, isBrute ? 0.56 : 0.46);
  head.position.y = 1.28;

  // 4. Comical Open Zombie Mouth
  const mouth = addMesh(root, resources.box('zombie-mouth'), resources.basicMaterial('zombie-mouth-mat', 0x111922));
  mouth.scale.set(0.32, 0.14, 0.12);
  mouth.position.set(0, 1.15, 0.38);

  // Tiny jagged teeth
  const teeth = addMesh(root, resources.box('zombie-teeth'), resources.basicMaterial('zombie-teeth-mat', 0xf0f0f0));
  teeth.scale.set(0.24, 0.04, 0.08);
  teeth.position.set(0, 1.2, 0.42);

  // 5. Glowing Neon-Pink Eyes (Hallmark of Survivor.io)
  addEyes(root, resources, pinkEyeColor, 1.34);

  // 6. Messy Hair Tuft OR Yellow Construction Hard Hat
  if (isHelmetZombie) {
    // Yellow Construction Helmet (Safety Hard Hat)
    const helmetMat = resources.standardMaterial('zombie-helmet-mat', 0xfec526, {
      roughness: 0.35,
      metalness: 0.1,
    });
    const helmetCap = addMesh(root, resources.sphere('zombie-helmet-cap'), helmetMat);
    helmetCap.scale.set(0.58, 0.38, 0.56);
    helmetCap.position.set(0, 1.54, 0.02);

    const helmetBrim = addMesh(root, resources.torus('zombie-helmet-brim'), helmetMat);
    helmetBrim.scale.set(0.38, 0.38, 0.15);
    helmetBrim.position.set(0, 1.45, 0.04);
    helmetBrim.rotation.x = Math.PI / 2;
  } else {
    // Spiky dark messy hair
    const hair = addMesh(root, resources.ico('zombie-hair'), resources.standardMaterial('zombie-hair-mat', 0x1c252d, { roughness: 0.9 }));
    hair.scale.set(0.48, 0.22, 0.44);
    hair.position.set(0, 1.52, 0);
  }

  // 7. Outstretched Zombie Arms Shambling Forward
  const arms: THREE.Object3D[] = [];
  for (const x of [-0.34, 0.34]) {
    const armGroup = new THREE.Group();
    armGroup.position.set(x, 0.88, 0.08);

    // Sleeve
    const sleeve = addMesh(armGroup, resources.cylinder('zombie-sleeve'), zombieShirtMat);
    sleeve.scale.set(0.12, 0.22, 0.12);
    sleeve.position.set(0, 0, 0.08);
    sleeve.rotation.x = -Math.PI / 2.1;

    // Outstretched Forearm & Hand (Teal Skin)
    const forearm = addMesh(armGroup, resources.cylinder('zombie-forearm'), zombieSkinMat);
    forearm.scale.set(0.1, 0.42, 0.1);
    forearm.position.set(0, 0, 0.35);
    forearm.rotation.x = -Math.PI / 2.1;

    root.add(armGroup);
    arms.push(armGroup);
  }

  root.userData.parts = { torso, head, arms };
  return root;
}


export function addEliteAccent(root: THREE.Group, resources: SharedResources): THREE.Mesh {
  const ring = addMesh(root, resources.torus('elite-ring'), resources.standardMaterial('elite-ring', 0xffc04f, { emissive: 0x6c2f08, emissiveIntensity: 0.65, metalness: 0.45, roughness: 0.4 }));
  ring.scale.setScalar(0.82);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.06;
  const marker = addMesh(root, resources.octa('elite-marker'), resources.standardMaterial('elite-marker', 0xffd16a, { emissive: 0x8f4012, emissiveIntensity: 0.55, metalness: 0.35 }));
  marker.scale.setScalar(0.16);
  marker.position.y = 1.88;
  return ring;
}

export function createBossModel(bossId: BossId = 'skeleton-king', resources: SharedResources): { root: THREE.Group; aura: THREE.Mesh; shadow: THREE.Mesh } {
  // Try production GLB first
  const glbModel = modelRegistry.cloneLoadedModel(`boss:${bossId}` as ModelAssetId);
  if (glbModel) {
    const root = new THREE.Group();
    root.name = `boss-${bossId}`;
    root.userData.parts = {} as Record<string, THREE.Object3D | THREE.Object3D[]>;

    // Imposing Boss Scale (2.8 - 3.2x common enemies)
    glbModel.scale.setScalar(1.35);
    root.add(glbModel);

    const auraColor = bossId === 'skeleton-king'
      ? 0xff3b4e
      : bossId === 'forest-witch'
      ? 0xa855f7
      : bossId === 'frost-golem'
      ? 0x55ddff
      : 0xff5522;

    const shadow = new THREE.Mesh(
      resources.plane(`boss-shadow-${bossId}`, 1, 1),
      resources.basicMaterial(`boss-shadow-${bossId}`, 0x010207, { transparent: true, opacity: 0.72 })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.scale.set(2.4, 1.25, 1);
    shadow.position.y = 0.02;
    root.add(shadow);

    const aura = addMesh(
      root,
      resources.ring(`boss-aura-${bossId}`, 1.2, 1.4),
      resources.basicMaterial(`boss-aura-${bossId}`, auraColor, { transparent: true, opacity: 0.58, side: THREE.DoubleSide })
    );
    aura.rotation.x = -Math.PI / 2;
    aura.position.y = 0.04;

    // Detect parts for animation
    let sword: THREE.Object3D | undefined;
    let weapon: THREE.Object3D | undefined;
    let core: THREE.Object3D | undefined;
    const wings: THREE.Object3D[] = [];

    glbModel.traverse((node) => {
      if (node.name.includes('sword') || (!sword && node instanceof THREE.Group && node.position.x > 0.8)) sword = node;
      if (node.name.includes('blade') || node.name.includes('weapon')) weapon = node;
      if (node.name.includes('core') || (node instanceof THREE.Mesh && node.geometry instanceof THREE.OctahedronGeometry && node.position.y > 1.0)) core = node;
      if (node.name.includes('wing') || (node instanceof THREE.Group && Math.abs(node.position.x) > 0.6 && node.position.z < 0)) wings.push(node);
    });

    root.userData.parts = {
      sword: sword ?? weapon,
      weapon: weapon ?? sword,
      core,
      wings: wings.length ? wings : undefined,
    };

    return { root, aura, shadow };
  }

  if (bossId !== 'skeleton-king') return createAlternativeBossModel(bossId, resources);
  return createSkeletonKingModel(resources);
}

function createSkeletonKingModel(resources: SharedResources): { root: THREE.Group; aura: THREE.Mesh; shadow: THREE.Mesh } {
  const root = new THREE.Group();
  root.name = 'skeleton-king';
  root.userData.parts = {} as Record<string, THREE.Object3D | THREE.Object3D[]>;
  const shadow = new THREE.Mesh(resources.plane('boss-shadow', 1, 1), resources.basicMaterial('boss-shadow', 0x010207, { transparent: true, opacity: 0.7 }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.set(2.2, 1.1, 1);
  shadow.position.y = 0.02;
  root.add(shadow);
  const aura = addMesh(root, resources.ring('boss-aura', 1.15, 1.3), resources.basicMaterial('boss-aura', 0xff4e62, { transparent: true, opacity: 0.52, side: THREE.DoubleSide }));
  aura.rotation.x = -Math.PI / 2;
  aura.position.y = 0.04;

  const cape = addMesh(root, resources.cone('boss-cape'), resources.standardMaterial('boss-cape', 0x3d172b, { roughness: 0.92 }));
  cape.scale.set(1.4, 1.72, 0.2);
  cape.position.set(0, 1.08, -0.34);

  const armor = addMesh(root, resources.cylinder('boss-armor'), resources.standardMaterial('boss-armor', 0x2b2139, { metalness: 0.35, roughness: 0.65 }));
  armor.scale.set(1.15, 1.35, 0.9);
  armor.position.y = 1.18;
  const chest = addMesh(root, resources.box('boss-chest'), resources.standardMaterial('boss-chest', 0x67263e, { metalness: 0.25, roughness: 0.68 }));
  chest.scale.set(1.24, 0.68, 0.82);
  chest.position.y = 1.38;
  const skull = addMesh(root, resources.ico('boss-skull'), resources.standardMaterial('boss-skull', 0xc6d1dc, { roughness: 0.72 }));
  skull.scale.set(1.08, 0.92, 0.94);
  skull.position.set(0, 2.45, 0.05);
  const jaw = addMesh(root, resources.box('boss-jaw'), resources.standardMaterial('boss-jaw', 0x9caebe, { roughness: 0.8 }));
  jaw.scale.set(0.86, 0.28, 0.64);
  jaw.position.set(0, 1.92, 0.22);
  const eyeMaterial = resources.basicMaterial('boss-eyes', 0xff5967);
  for (const x of [-0.36, 0.36]) {
    const eye = addMesh(root, resources.sphere('boss-eye'), eyeMaterial);
    eye.scale.set(0.13, 0.09, 0.05);
    eye.position.set(x, 2.5, 0.85);
  }
  const crownMaterial = resources.standardMaterial('boss-crown', 0xffc34e, { emissive: 0x82400b, emissiveIntensity: 0.7, metalness: 0.55, roughness: 0.34 });
  for (const x of [-0.58, 0, 0.58]) {
    const point = addMesh(root, resources.cone('boss-crown-point'), crownMaterial);
    point.scale.set(0.22, 0.75, 0.22);
    point.position.set(x, 3.32 - Math.abs(x) * 0.14, 0.04);
    point.rotation.z = x * -0.3;
  }
  const sword = addMesh(root, resources.box('boss-sword'), resources.standardMaterial('boss-sword', 0xdbe8f4, { metalness: 0.58, roughness: 0.28 }));
  sword.scale.set(0.18, 1.9, 0.12);
  sword.position.set(1.55, 1.3, 0.1);
  sword.rotation.z = -0.4;
  const hilt = addMesh(root, resources.box('boss-hilt'), crownMaterial);
  hilt.scale.set(0.7, 0.14, 0.18);
  hilt.position.set(1.32, 0.72, 0.1);
  hilt.rotation.z = -0.4;
  root.userData.parts = { armor, chest, cape, skull, sword, crown: crownMaterial };
  return { root, aura, shadow };
}

function createAlternativeBossModel(bossId: Exclude<BossId, 'skeleton-king'>, resources: SharedResources): { root: THREE.Group; aura: THREE.Mesh; shadow: THREE.Mesh } {
  const palette = {
    'forest-witch': { aura: 0x9df18e, body: 0x253d38, accent: 0xb875df, core: 0x8ff0aa },
    'frost-golem': { aura: 0x77ddff, body: 0x5e829e, accent: 0xb9f4ff, core: 0x75e8ff },
    'demon-lord': { aura: 0xff5f4f, body: 0x3b172a, accent: 0xffa34f, core: 0xff663f },
  }[bossId];
  const root = new THREE.Group();
  root.name = bossId;
  root.userData.parts = {} as Record<string, THREE.Object3D | THREE.Object3D[]>;
  const shadow = new THREE.Mesh(resources.plane(`boss-shadow-${bossId}`, 1, 1), resources.basicMaterial(`boss-shadow-${bossId}`, 0x010207, { transparent: true, opacity: 0.72 }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.set(2.3, 1.18, 1);
  shadow.position.y = 0.02;
  root.add(shadow);
  const aura = addMesh(root, resources.ring(`boss-aura-${bossId}`, 1.15, 1.34), resources.basicMaterial(`boss-aura-${bossId}`, palette.aura, { transparent: true, opacity: 0.54, side: THREE.DoubleSide }));
  aura.rotation.x = -Math.PI / 2;
  aura.position.y = 0.04;

  if (bossId === 'forest-witch') {
    const cloak = addMesh(root, resources.cone('witch-cloak'), resources.standardMaterial('witch-cloak', palette.body, { roughness: 0.92 }));
    cloak.scale.set(1.28, 1.75, 0.86);
    cloak.position.y = 1.08;
    const hood = addMesh(root, resources.cone('witch-hood'), resources.standardMaterial('witch-hood', 0x121c2d, { roughness: 0.86 }));
    hood.scale.set(0.9, 0.9, 0.86);
    hood.position.y = 2.18;
    const antlers: THREE.Object3D[] = [];
    for (const x of [-0.54, 0.54]) {
      const antler = addMesh(root, resources.cone('witch-antler'), resources.standardMaterial('witch-antler', 0x76543e, { roughness: 0.96 }));
      antler.scale.set(0.15, 1.05, 0.15);
      antler.position.set(x, 2.9, 0);
      antler.rotation.z = x < 0 ? -0.32 : 0.32;
      antlers.push(antler);
    }
    const staff = addMesh(root, resources.cylinder('witch-staff'), resources.standardMaterial('witch-staff', 0x5f3b3d, { roughness: 0.94 }));
    staff.scale.set(0.1, 1.85, 0.1);
    staff.position.set(1.18, 1.28, 0.04);
    staff.rotation.z = -0.2;
    const core = addMesh(root, resources.octa('witch-core'), resources.standardMaterial('witch-core', palette.core, { emissive: palette.accent, emissiveIntensity: 1.5, roughness: 0.3 }));
    core.scale.setScalar(0.38);
    core.position.set(0, 1.28, 0.62);
    addBossEyes(root, resources, palette.accent, 2.18);
    root.userData.parts = { cloak, hood, antlers, staff, core };
  } else if (bossId === 'frost-golem') {
    const body = addMesh(root, resources.ico('golem-body'), resources.standardMaterial('golem-body', palette.body, { roughness: 0.62, metalness: 0.12 }));
    body.scale.set(1.45, 1.62, 1.08);
    body.position.y = 1.28;
    const shoulders: THREE.Object3D[] = [];
    for (const x of [-1.1, 1.1]) {
      const shoulder = addMesh(root, resources.ico('golem-shoulder'), resources.standardMaterial('golem-shoulder', 0x769bb4, { roughness: 0.56, metalness: 0.1 }));
      shoulder.scale.set(0.64, 0.78, 0.65);
      shoulder.position.set(x, 1.75, 0);
      shoulders.push(shoulder);
    }
    const arms: THREE.Object3D[] = [];
    for (const x of [-1.15, 1.15]) {
      const arm = addMesh(root, resources.cylinder('golem-arm'), resources.standardMaterial('golem-arm', 0x466b88, { roughness: 0.7 }));
      arm.scale.set(0.42, 1.22, 0.42);
      arm.position.set(x, 0.83, 0);
      arm.rotation.z = x < 0 ? -0.18 : 0.18;
      arms.push(arm);
    }
    const core = addMesh(root, resources.octa('golem-core'), resources.standardMaterial('golem-core', palette.core, { emissive: palette.core, emissiveIntensity: 1.65, roughness: 0.24, metalness: 0.12 }));
    core.scale.setScalar(0.48);
    core.position.set(0, 1.42, 0.72);
    const crown = addMesh(root, resources.octa('golem-crown'), resources.standardMaterial('golem-crown', palette.accent, { emissive: palette.core, emissiveIntensity: 0.7, roughness: 0.38 }));
    crown.scale.set(0.58, 0.42, 0.5);
    crown.position.y = 2.52;
    root.userData.parts = { body, shoulders, arms, core, weapon: crown };
  } else {
    const armor = addMesh(root, resources.ico('demon-lord-armor'), resources.standardMaterial('demon-lord-armor', palette.body, { metalness: 0.34, roughness: 0.66 }));
    armor.scale.set(1.45, 1.54, 1.05);
    armor.position.y = 1.28;
    const horns: THREE.Object3D[] = [];
    for (const x of [-0.62, 0.62]) {
      const horn = addMesh(root, resources.cone('demon-lord-horn'), resources.standardMaterial('demon-lord-horn', 0x6f2c3a, { roughness: 0.82 }));
      horn.scale.set(0.28, 1.18, 0.28);
      horn.position.set(x, 2.82, 0.02);
      horn.rotation.z = x < 0 ? -0.32 : 0.32;
      horns.push(horn);
    }
    const wings: THREE.Object3D[] = [];
    for (const x of [-1.24, 1.24]) {
      const wing = addMesh(root, resources.cone('demon-lord-wing'), resources.standardMaterial('demon-lord-wing', 0x251326, { roughness: 0.9 }));
      wing.scale.set(1.25, 1.5, 0.18);
      wing.position.set(x, 1.82, -0.26);
      wing.rotation.z = x < 0 ? -0.34 : 0.34;
      wings.push(wing);
    }
    const weapon = addMesh(root, resources.box('demon-lord-weapon'), resources.standardMaterial('demon-lord-weapon', palette.accent, { emissive: palette.core, emissiveIntensity: 0.9, metalness: 0.4, roughness: 0.3 }));
    weapon.scale.set(0.2, 1.92, 0.14);
    weapon.position.set(1.58, 1.25, 0.08);
    weapon.rotation.z = -0.44;
    const core = addMesh(root, resources.octa('demon-lord-core'), resources.standardMaterial('demon-lord-core', palette.core, { emissive: palette.core, emissiveIntensity: 1.75, roughness: 0.25 }));
    core.scale.setScalar(0.44);
    core.position.set(0, 1.46, 0.78);
    addBossEyes(root, resources, palette.accent, 2.25);
    root.userData.parts = { armor, horns, wings, weapon, core };
  }
  return { root, aura, shadow };
}

function addBossEyes(root: THREE.Group, resources: SharedResources, color: number, y: number): void {
  const material = resources.basicMaterial(`boss-alt-eyes-${color}`, color);
  for (const x of [-0.32, 0.32]) {
    const eye = addMesh(root, resources.sphere('boss-alt-eye'), material);
    eye.scale.set(0.12, 0.08, 0.04);
    eye.position.set(x, y, 0.68);
  }
}
