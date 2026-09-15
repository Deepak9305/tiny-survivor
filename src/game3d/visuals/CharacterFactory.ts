import * as THREE from 'three';
import type { BossId } from '../../types';
import { SharedResources, addMesh } from '../core/SharedResources';
import { modelRegistry, type ModelAssetId } from '../assets/ModelRegistry';

export function createShadowMage(resources: SharedResources): { root: THREE.Group; aura: THREE.Mesh; shadow: THREE.Mesh } {
  const root = new THREE.Group();
  root.name = 'shadow-mage';
  root.userData.parts = {} as Record<string, THREE.Object3D | THREE.Object3D[]>;

  const shadow = new THREE.Mesh(
    resources.plane('hero-shadow', 1, 1),
    resources.basicMaterial('hero-shadow', 0x01050b, { transparent: true, opacity: 0.58 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.set(0.95, 0.5, 1);
  shadow.position.y = 0.018;
  root.add(shadow);

  const aura = new THREE.Mesh(
    resources.ring('hero-aura', 0.66, 0.76),
    resources.basicMaterial('hero-aura', 0x38bdf8, { transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthWrite: false }),
  );
  aura.rotation.x = -Math.PI / 2;
  aura.position.y = 0.035;
  root.add(aura);

  // Try production GLB first
  const glbModel = modelRegistry.cloneLoadedModel('hero:shadow');
  if (glbModel) {
    glbModel.name = 'hero-glb-body';
    root.add(glbModel);
    // Find animated nodes if present
    let staff: THREE.Object3D | undefined;
    let crystal: THREE.Object3D | undefined;
    let crystalHalo: THREE.Object3D | undefined;
    let scarfTail: THREE.Object3D | undefined;
    glbModel.traverse((node) => {
      if (node.name.includes('staff') || (!staff && node instanceof THREE.Group && node.position.x > 0.3)) staff = node;
      if (node instanceof THREE.Mesh && node.geometry instanceof THREE.OctahedronGeometry) crystal = node;
      if (node instanceof THREE.Mesh && node.geometry instanceof THREE.TorusGeometry && node.position.y > 1.2) crystalHalo = node;
      if (node.name.includes('scarf') || (!scarfTail && node instanceof THREE.Mesh && node.position.z < -0.2)) scarfTail = node;
    });
    root.userData.parts = { staff, crystal, crystalHalo, scarfTail };
    return { root, aura, shadow };
  }

  // Fallback Procedural Model (Mascot Level Chibi Action Sculpt)
  const mGold = resources.standardMaterial('hero-gold', 0xebb338, { metalness: 0.75, roughness: 0.35 });
  const body = addMesh(root, resources.cylinder('hero-body'), resources.standardMaterial('hero-body', 0x183462, { roughness: 0.72 }));
  body.scale.set(0.74, 0.88, 0.58);
  body.position.y = 0.72;

  const cloak = addMesh(root, resources.cone('hero-cloak'), resources.standardMaterial('hero-cloak', 0x0c1628, { roughness: 0.88 }));
  cloak.scale.set(0.92, 1.25, 0.74);
  cloak.position.y = 0.60;

  const goldHem = addMesh(root, resources.torus('hero-gold-hem'), mGold);
  goldHem.scale.set(0.48, 0.48, 0.04);
  goldHem.position.set(0, 0.35, 0);
  goldHem.rotation.x = Math.PI / 2;

  const hood = addMesh(root, resources.cone('hero-hood'), resources.standardMaterial('hero-hood', 0x0c1628, { roughness: 0.88 }));
  hood.scale.set(0.9, 0.96, 0.86);
  hood.position.set(0, 1.38, -0.06);
  hood.rotation.x = 0.2;

  const hoodRim = addMesh(root, resources.torus('hero-hood-rim'), resources.standardMaterial('hero-hood-rim', 0x183462, { metalness: 0.2, roughness: 0.65 }));
  hoodRim.scale.set(0.48, 0.24, 0.34);
  hoodRim.position.set(0, 1.22, 0.18);
  hoodRim.rotation.x = Math.PI / 2.2;

  const faceVoid = addMesh(root, resources.sphere('hero-face-void'), resources.basicMaterial('hero-face-void', 0x020408));
  faceVoid.scale.set(0.52, 0.5, 0.42);
  faceVoid.position.set(0, 1.25, 0.08);

  const eyeMaterial = resources.basicMaterial('hero-eyes', 0x62f0ff, { transparent: true, opacity: 0.98 });
  for (const x of [-0.17, 0.17]) {
    const eye = addMesh(root, resources.box('hero-eye'), eyeMaterial);
    eye.scale.set(0.085, 0.038, 0.02);
    eye.position.set(x, 1.26, 0.26);
    eye.rotation.z = x < 0 ? -0.1 : 0.1;
  }

  const scarf = addMesh(root, resources.torus('hero-scarf'), resources.standardMaterial('hero-scarf', 0xdb2c48, { roughness: 0.65, emissive: 0x4a0a14, emissiveIntensity: 0.35 }));
  scarf.scale.set(0.52, 0.32, 0.14);
  scarf.position.set(0, 1.05, 0.1);
  scarf.rotation.x = Math.PI / 2;

  const scarfTail = addMesh(root, resources.box('hero-scarf-tail'), resources.standardMaterial('hero-scarf-tail', 0xa81c34, { roughness: 0.7 }));
  scarfTail.scale.set(0.14, 0.07, 0.68);
  scarfTail.position.set(-0.35, 0.98, -0.22);
  scarfTail.rotation.set(-0.3, -0.2, 0.15);

  const armMaterial = resources.standardMaterial('hero-arms', 0x0c1628, { roughness: 0.75 });
  const arms: THREE.Object3D[] = [];
  for (const x of [-0.48, 0.48]) {
    const arm = addMesh(root, resources.cylinder('hero-arm'), armMaterial);
    arm.scale.set(0.16, 0.58, 0.16);
    arm.position.set(x, 0.82, 0.02);
    arm.rotation.z = x < 0 ? -0.32 : 0.32;
    arms.push(arm);
  }

  const bootMaterial = resources.standardMaterial('hero-boots', 0x080e18, { roughness: 0.88 });
  for (const x of [-0.22, 0.22]) {
    const boot = addMesh(root, resources.box('hero-boot'), bootMaterial);
    boot.scale.set(0.26, 0.22, 0.38);
    boot.position.set(x, 0.22, 0.08);
  }

  const staff = addMesh(root, resources.cylinder('hero-staff'), resources.standardMaterial('hero-staff', 0x382218, { roughness: 0.92 }));
  staff.scale.set(0.055, 1.45, 0.055);
  staff.position.set(0.66, 0.72, 0.08);
  staff.rotation.z = -0.28;

  const staffProngs = addMesh(root, resources.cylinder('hero-staff-head'), mGold);
  staffProngs.scale.set(0.07, 0.06, 0.12);
  staffProngs.position.set(0.82, 1.38, 0.08);
  staffProngs.rotation.z = -0.28;

  const crystal = addMesh(root, resources.octa('hero-crystal'), resources.standardMaterial('hero-crystal', 0x56e0ff, { emissive: 0x1db5e6, emissiveIntensity: 2.2, roughness: 0.2, metalness: 0.1 }));
  crystal.scale.setScalar(0.28);
  crystal.position.set(0.86, 1.52, 0.08);

  const crystalHalo = addMesh(root, resources.torus('hero-crystal-halo'), resources.basicMaterial('hero-crystal-halo', 0x56e0ff, { transparent: true, opacity: 0.55, side: THREE.DoubleSide }));
  crystalHalo.scale.setScalar(0.26);
  crystalHalo.position.copy(crystal.position);
  crystalHalo.rotation.x = Math.PI / 2;

  root.userData.parts = { body, cloak, goldHem, hood, hoodRim, scarf, scarfTail, arms, staff, crystal, crystalHalo };

  return { root, aura, shadow };
}

export function createWarriorVisual(resources: SharedResources): { root: THREE.Group; aura: THREE.Mesh; shadow: THREE.Mesh } {
  const root = new THREE.Group();
  root.name = 'hero-warrior';
  root.userData.parts = {} as Record<string, THREE.Object3D | THREE.Object3D[]>;

  const shadow = new THREE.Mesh(
    resources.plane('hero-warrior-shadow', 1, 1),
    resources.basicMaterial('hero-shadow', 0x01050b, { transparent: true, opacity: 0.58 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.set(1.05, 0.55, 1);
  shadow.position.y = 0.018;
  root.add(shadow);

  const aura = new THREE.Mesh(
    resources.ring('hero-warrior-aura', 0.82, 0.92),
    resources.basicMaterial('hero-warrior-aura', 0xf59e0b, { transparent: true, opacity: 0.65, side: THREE.DoubleSide }),
  );
  aura.rotation.x = -Math.PI / 2;
  aura.position.y = 0.04;
  root.add(aura);

  const mSteel = resources.standardMaterial('warrior-steel', 0x243247, { metalness: 0.72, roughness: 0.38 });
  const mGold = resources.standardMaterial('warrior-gold', 0xd97706, { metalness: 0.75, roughness: 0.35 });
  const mCloth = resources.standardMaterial('warrior-cloth', 0x991b1b, { roughness: 0.85 });

  const body = addMesh(root, resources.cylinder('warrior-body'), mSteel);
  body.scale.set(0.85, 0.95, 0.62);
  body.position.y = 0.76;

  const chestPlate = addMesh(root, resources.box('warrior-chest'), mGold);
  chestPlate.scale.set(0.68, 0.45, 0.12);
  chestPlate.position.set(0, 0.86, 0.28);

  const tabard = addMesh(root, resources.box('warrior-tabard'), mCloth);
  tabard.scale.set(0.38, 0.68, 0.06);
  tabard.position.set(0, 0.52, 0.3);

  const helmet = addMesh(root, resources.cylinder('warrior-helmet'), mSteel);
  helmet.scale.set(0.72, 0.68, 0.72);
  helmet.position.set(0, 1.42, 0.02);

  const plume = addMesh(root, resources.box('warrior-plume'), mCloth);
  plume.scale.set(0.12, 0.42, 0.55);
  plume.position.set(0, 1.82, -0.05);

  for (const x of [-0.56, 0.56]) {
    const pauldron = addMesh(root, resources.sphere('warrior-pauldron'), mGold);
    pauldron.scale.set(0.32, 0.24, 0.32);
    pauldron.position.set(x, 1.12, 0.04);
  }

  const arms: THREE.Object3D[] = [];
  for (const x of [-0.52, 0.52]) {
    const arm = addMesh(root, resources.cylinder('warrior-arm'), mSteel);
    arm.scale.set(0.18, 0.58, 0.18);
    arm.position.set(x, 0.82, 0.02);
    arm.rotation.z = x < 0 ? -0.28 : 0.28;
    arms.push(arm);
  }

  const sword = addMesh(root, resources.box('warrior-sword'), resources.standardMaterial('warrior-blade', 0x94a3b8, { metalness: 0.82, roughness: 0.25 }));
  sword.scale.set(0.1, 1.35, 0.06);
  sword.position.set(0.72, 0.88, 0.15);
  sword.rotation.z = -0.32;

  const swordRune = addMesh(root, resources.box('warrior-sword-rune'), resources.basicMaterial('warrior-sword-rune', 0x38bdf8, { transparent: true, opacity: 0.85 }));
  swordRune.scale.set(0.04, 0.95, 0.08);
  swordRune.position.copy(sword.position);
  swordRune.rotation.z = -0.32;

  const shield = addMesh(root, resources.cylinder('warrior-shield'), mSteel);
  shield.scale.set(0.42, 0.12, 0.52);
  shield.position.set(-0.68, 0.78, 0.18);
  shield.rotation.x = Math.PI / 2;

  const shieldBoss = addMesh(root, resources.sphere('warrior-shield-boss'), mGold);
  shieldBoss.scale.setScalar(0.18);
  shieldBoss.position.set(-0.68, 0.78, 0.25);

  root.userData.parts = { body, helmet, arms, sword, weapon: sword, shield };
  return { root, aura, shadow };
}

export function createMonkVisual(resources: SharedResources): { root: THREE.Group; aura: THREE.Mesh; shadow: THREE.Mesh } {
  const root = new THREE.Group();
  root.name = 'hero-monk';
  root.userData.parts = {} as Record<string, THREE.Object3D | THREE.Object3D[]>;

  const shadow = new THREE.Mesh(
    resources.plane('hero-monk-shadow', 1, 1),
    resources.basicMaterial('hero-shadow', 0x01050b, { transparent: true, opacity: 0.58 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.set(0.95, 0.5, 1);
  shadow.position.y = 0.018;
  root.add(shadow);

  const aura = new THREE.Mesh(
    resources.ring('hero-monk-aura', 0.76, 0.88),
    resources.basicMaterial('hero-monk-aura', 0x10b981, { transparent: true, opacity: 0.65, side: THREE.DoubleSide }),
  );
  aura.rotation.x = -Math.PI / 2;
  aura.position.y = 0.04;
  root.add(aura);

  const mRobe = resources.standardMaterial('monk-robe', 0x0f766e, { roughness: 0.78 });
  const mWrap = resources.standardMaterial('monk-wrap', 0xfef08a, { roughness: 0.85 });
  const mSkin = resources.standardMaterial('monk-skin', 0xf0b896, { roughness: 0.75 });
  const mBeads = resources.standardMaterial('monk-beads', 0x78350f, { roughness: 0.65 });

  const body = addMesh(root, resources.cylinder('monk-body'), mRobe);
  body.scale.set(0.72, 0.92, 0.56);
  body.position.y = 0.72;

  const sash = addMesh(root, resources.torus('monk-sash'), mWrap);
  sash.scale.set(0.42, 0.28, 0.12);
  sash.position.set(0, 0.48, 0);
  sash.rotation.x = Math.PI / 2;

  const head = addMesh(root, resources.sphere('monk-head'), mSkin);
  head.scale.set(0.52, 0.52, 0.48);
  head.position.set(0, 1.34, 0.02);

  const beadCollar = addMesh(root, resources.torus('monk-bead-collar'), mBeads);
  beadCollar.scale.set(0.42, 0.32, 0.1);
  beadCollar.position.set(0, 1.08, 0.08);
  beadCollar.rotation.x = Math.PI / 2.2;

  const arms: THREE.Object3D[] = [];
  for (const x of [-0.48, 0.48]) {
    const arm = addMesh(root, resources.cylinder('monk-arm'), mWrap);
    arm.scale.set(0.18, 0.54, 0.18);
    arm.position.set(x, 0.8, 0.06);
    arm.rotation.z = x < 0 ? -0.22 : 0.22;
    arms.push(arm);
  }

  const chiL = addMesh(root, resources.ico('monk-chi-l'), resources.basicMaterial('monk-chi-mat', 0x34d399, { transparent: true, opacity: 0.85 }));
  chiL.scale.setScalar(0.16);
  chiL.position.set(-0.52, 0.55, 0.18);

  const chiR = addMesh(root, resources.ico('monk-chi-r'), resources.basicMaterial('monk-chi-mat', 0x34d399, { transparent: true, opacity: 0.85 }));
  chiR.scale.setScalar(0.16);
  chiR.position.set(0.52, 0.55, 0.18);

  root.userData.parts = { body, head, arms, chiL, chiR, weapon: chiR };
  return { root, aura, shadow };
}

export function createGunslingerVisual(resources: SharedResources): { root: THREE.Group; aura: THREE.Mesh; shadow: THREE.Mesh } {
  const root = new THREE.Group();
  root.name = 'hero-gunslinger';
  root.userData.parts = {} as Record<string, THREE.Object3D | THREE.Object3D[]>;

  const shadow = new THREE.Mesh(
    resources.plane('hero-gunslinger-shadow', 1, 1),
    resources.basicMaterial('hero-shadow', 0x01050b, { transparent: true, opacity: 0.58 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.set(0.9, 0.48, 1);
  shadow.position.y = 0.018;
  root.add(shadow);

  const aura = new THREE.Mesh(
    resources.ring('hero-gunslinger-aura', 0.74, 0.84),
    resources.basicMaterial('hero-gunslinger-aura', 0xc084fc, { transparent: true, opacity: 0.65, side: THREE.DoubleSide }),
  );
  aura.rotation.x = -Math.PI / 2;
  aura.position.y = 0.04;
  root.add(aura);

  const mCoat = resources.standardMaterial('gun-coat', 0x2e1065, { roughness: 0.75 });
  const mVest = resources.standardMaterial('gun-vest', 0x581c87, { roughness: 0.65 });
  const mLeather = resources.standardMaterial('gun-leather', 0x18181b, { roughness: 0.85 });
  const mPistol = resources.standardMaterial('gun-pistol', 0x27272a, { metalness: 0.8, roughness: 0.3 });
  const mArcaneCyan = resources.basicMaterial('gun-arcane', 0x22d3ee, { transparent: true, opacity: 0.95 });

  const body = addMesh(root, resources.cylinder('gun-body'), mVest);
  body.scale.set(0.62, 0.85, 0.46);
  body.position.y = 0.74;

  const coatFlare = addMesh(root, resources.cone('gun-coat-flare'), mCoat);
  coatFlare.scale.set(0.82, 0.98, 0.62);
  coatFlare.position.y = 0.52;

  const coatTail = addMesh(root, resources.box('gun-coat-tail'), mCoat);
  coatTail.scale.set(0.48, 0.65, 0.08);
  coatTail.position.set(0, 0.42, -0.28);
  coatTail.rotation.x = 0.22;

  const collar = addMesh(root, resources.torus('gun-collar'), mCoat);
  collar.scale.set(0.38, 0.22, 0.12);
  collar.position.set(0, 1.15, 0.06);
  collar.rotation.x = Math.PI / 2.2;

  const head = addMesh(root, resources.sphere('gun-head'), resources.standardMaterial('gun-skin', 0xfbd0b8, { roughness: 0.75 }));
  head.scale.set(0.46, 0.48, 0.44);
  head.position.set(0, 1.32, 0.02);

  const hatBrim = addMesh(root, resources.cylinder('gun-hat-brim'), mLeather);
  hatBrim.scale.set(0.88, 0.04, 0.88);
  hatBrim.position.set(0, 1.54, 0.02);
  hatBrim.rotation.x = -0.08;

  const hatCrown = addMesh(root, resources.cylinder('gun-hat-crown'), mLeather);
  hatCrown.scale.set(0.48, 0.32, 0.48);
  hatCrown.position.set(0, 1.7, -0.01);
  hatCrown.rotation.x = -0.08;

  for (const x of [-0.14, 0.14]) {
    const eye = addMesh(root, resources.sphere('gun-eye'), resources.basicMaterial('gun-eye-mat', 0xe879f9));
    eye.scale.set(0.06, 0.035, 0.02);
    eye.position.set(x, 1.34, 0.22);
  }

  const pistolR = addMesh(root, resources.box('gun-pistol-r'), mPistol);
  pistolR.scale.set(0.08, 0.22, 0.48);
  pistolR.position.set(0.58, 0.78, 0.28);

  const muzzleR = addMesh(root, resources.cylinder('gun-muzzle-r'), mArcaneCyan);
  muzzleR.scale.set(0.04, 0.12, 0.04);
  muzzleR.position.set(0.58, 0.84, 0.52);
  muzzleR.rotation.x = Math.PI / 2;

  const pistolL = addMesh(root, resources.box('gun-pistol-l'), mPistol);
  pistolL.scale.set(0.08, 0.22, 0.48);
  pistolL.position.set(-0.58, 0.78, 0.28);

  const muzzleL = addMesh(root, resources.cylinder('gun-muzzle-l'), mArcaneCyan);
  muzzleL.scale.set(0.04, 0.12, 0.04);
  muzzleL.position.set(-0.58, 0.84, 0.52);
  muzzleL.rotation.x = Math.PI / 2;

  const arms: THREE.Object3D[] = [];
  for (const x of [-0.44, 0.44]) {
    const arm = addMesh(root, resources.cylinder('gun-arm'), mCoat);
    arm.scale.set(0.14, 0.52, 0.14);
    arm.position.set(x, 0.82, 0.06);
    arm.rotation.x = 0.42;
    arms.push(arm);
  }

  root.userData.parts = { body, head, arms, coatTail, weapon: pistolR, pistolR, pistolL };
  return { root, aura, shadow };
}

export function createHeroVisual(heroId: string = 'shadow', resources: SharedResources): { root: THREE.Group; aura: THREE.Mesh; shadow: THREE.Mesh } {
  if (heroId === 'warrior') return createWarriorVisual(resources);
  if (heroId === 'monk') return createMonkVisual(resources);
  if (heroId === 'gunslinger') return createGunslingerVisual(resources);
  return createShadowMage(resources);
}

function addEyes(root: THREE.Group, resources: SharedResources, color: number, y = 1.08): void {
  const material = resources.basicMaterial(`enemy-eyes-${color}`, color);
  for (const x of [-0.16, 0.16]) {
    const eye = addMesh(root, resources.sphere('enemy-eye'), material);
    eye.scale.set(0.08, 0.05, 0.035);
    eye.position.set(x, y, 0.46);
  }
}

export function createEnemyModel(kind: string, color: number, resources: SharedResources, worldId = 1): THREE.Group {
  const worldAccent = worldId === 2 ? 0xb875df : worldId === 3 ? 0x9ce7ff : worldId === 4 ? 0xff5e55 : 0x5ddcff;

  // Try production GLB first
  const glbModel = modelRegistry.cloneLoadedModel(`enemy:${kind}` as ModelAssetId);
  if (glbModel) {
    const root = new THREE.Group();
    root.name = `enemy-${kind}`;
    root.userData.parts = {} as Record<string, THREE.Object3D | THREE.Object3D[]>;
    root.add(glbModel);

    // Find animated nodes for bat wings, slime body, etc.
    const wings: THREE.Object3D[] = [];
    const tails: THREE.Object3D[] = [];
    glbModel.traverse((node) => {
      if (node.name.includes('wing') || (kind === 'bat' && node instanceof THREE.Group && Math.abs(node.position.x) > 0.1)) {
        wings.push(node);
      }
      if (kind === 'ghost' && node instanceof THREE.Mesh && node.position.y < 0.5) {
        tails.push(node);
      }
    });
    root.userData.parts = { body: glbModel, wings: wings.length ? wings : undefined, tails: tails.length ? tails : undefined };

    // World skin accent ring
    if (worldId !== 1 && (kind === 'skeleton' || kind === 'ghost' || kind === 'knight')) {
      const rune = addMesh(root, resources.torus(`enemy-world-rune-${kind}-${worldId}`), resources.basicMaterial(`enemy-world-rune-${kind}-${worldId}`, worldAccent, { transparent: true, opacity: 0.72, side: THREE.DoubleSide }));
      rune.scale.setScalar(kind === 'knight' ? 0.48 : 0.34);
      rune.rotation.x = Math.PI / 2;
      rune.position.y = kind === 'ghost' ? 0.32 : 0.12;
      root.userData.parts.rune = rune;
    }

    return root;
  }

  // Fallback Procedural Model
  const root = new THREE.Group();
  root.name = `enemy-${kind}`;
  root.userData.parts = {} as Record<string, THREE.Object3D | THREE.Object3D[]>;
  const dark = new THREE.Color(color).multiplyScalar(0.52).getHex();
  const bodyMaterial = resources.standardMaterial(`enemy-body-${color}`, color, { roughness: 0.82 });
  const darkMaterial = resources.standardMaterial(`enemy-dark-${dark}`, dark, { roughness: 0.9 });
  const boneMaterial = resources.standardMaterial('enemy-bone', 0xb8c7d3, { roughness: 0.9 });

  if (kind === 'bat') {
    const body = addMesh(root, resources.ico('enemy-bat-body'), bodyMaterial);
    body.scale.set(0.42, 0.32, 0.55);
    body.position.y = 0.75;
    const wings: THREE.Object3D[] = [];
    for (const x of [-0.55, 0.55]) {
      const wing = addMesh(root, resources.cone('enemy-bat-wing'), darkMaterial);
      wing.scale.set(0.75, 0.12, 0.52);
      wing.position.set(x, 0.78, 0);
      wing.rotation.z = x < 0 ? -0.22 : 0.22;
      wings.push(wing);
    }
    root.userData.parts = { body, wings };
    addEyes(root, resources, 0xffd86d, 0.82);
  } else if (kind === 'slime') {
    const slimeJellyMat = resources.standardMaterial('enemy-slime-jelly', 0x22c55e, {
      roughness: 0.18,
      metalness: 0.14,
      emissive: 0x16a34a,
      emissiveIntensity: 0.95,
    });
    const body = addMesh(root, resources.sphere('enemy-slime-body'), slimeJellyMat);
    body.scale.set(0.82, 0.62, 0.72);
    body.position.y = 0.48;
    root.userData.parts = { body };
    addEyes(root, resources, 0x052e16, 0.56);
  } else if (kind === 'ghost') {
    const body = addMesh(root, resources.ico('enemy-ghost-body'), resources.standardMaterial(`enemy-ghost-${color}`, color, { transparent: true, opacity: 0.74, roughness: 0.52 }));
    body.scale.set(0.62, 0.86, 0.54);
    body.position.y = 0.92;
    const tails: THREE.Object3D[] = [];
    for (const x of [-0.36, 0.36]) {
      const tail = addMesh(root, resources.cone('enemy-ghost-tail'), bodyMaterial);
      tail.scale.set(0.28, 0.62, 0.35);
      tail.position.set(x, 0.36, 0);
      tail.rotation.z = x < 0 ? 0.25 : -0.25;
      tails.push(tail);
    }
    root.userData.parts = { body, tails };
    addEyes(root, resources, 0x173251, 1.0);
  } else if (kind === 'archer') {
    const body = addMesh(root, resources.cylinder('enemy-archer-body'), darkMaterial);
    body.scale.set(0.48, 0.82, 0.42);
    body.position.y = 0.55;
    const head = addMesh(root, resources.ico('enemy-archer-head'), bodyMaterial);
    head.scale.setScalar(0.5);
    head.position.y = 1.22;
    const bow = addMesh(root, resources.torus('enemy-bow'), resources.standardMaterial('enemy-bow', 0x9fe9ff, { roughness: 0.55 }));
    bow.scale.set(0.5, 0.5, 0.5);
    bow.position.set(0.5, 0.65, 0.12);
    bow.rotation.y = Math.PI / 2;
    root.userData.parts = { body, head, bow };
    addEyes(root, resources, 0x271f38, 1.25);
  } else if (kind === 'knight') {
    const body = addMesh(root, resources.cylinder('enemy-knight-body'), darkMaterial);
    body.scale.set(0.7, 1.05, 0.58);
    body.position.y = 0.68;
    const helmet = addMesh(root, resources.cylinder('enemy-knight-helmet'), bodyMaterial);
    helmet.scale.set(0.78, 0.65, 0.72);
    helmet.position.y = 1.45;
    const visor = addMesh(root, resources.box('enemy-visor'), resources.standardMaterial('enemy-visor', 0xe64e67, { roughness: 0.75 }));
    visor.scale.set(0.54, 0.08, 0.08);
    visor.position.set(0, 1.48, 0.4);
    const sword = addMesh(root, resources.box('enemy-sword'), resources.standardMaterial('enemy-sword', 0xffc66b, { metalness: 0.4, roughness: 0.38 }));
    sword.scale.set(0.1, 0.95, 0.1);
    sword.position.set(0.72, 0.86, 0.04);
    sword.rotation.z = -0.45;
    const shield = addMesh(root, resources.cylinder('enemy-shield'), resources.standardMaterial('enemy-shield', 0x5e7d9c, { metalness: 0.36, roughness: 0.48 }));
    shield.scale.set(0.42, 0.12, 0.42);
    shield.position.set(-0.66, 0.76, 0.16);
    shield.rotation.x = Math.PI / 2;
    root.userData.parts = { body, helmet, visor, sword, shield };
  } else if (kind === 'demon' || kind === 'imp') {
    const body = addMesh(root, resources.ico(`enemy-${kind}-body`), bodyMaterial);
    body.scale.setScalar(kind === 'imp' ? 0.66 : 0.84);
    body.position.y = 0.7;
    const horns: THREE.Object3D[] = [];
    for (const x of [-0.32, 0.32]) {
      const horn = addMesh(root, resources.cone(`enemy-${kind}-horn`), darkMaterial);
      horn.scale.set(0.2, 0.62, 0.2);
      horn.position.set(x, 1.35, 0);
      horn.rotation.z = x < 0 ? -0.28 : 0.28;
      horns.push(horn);
    }
    root.userData.parts = { body, horns };
    addEyes(root, resources, 0xffd175, 0.8);
  } else if (kind === 'cursed-wolf') {
    const body = addMesh(root, resources.box('enemy-wolf-body'), bodyMaterial);
    body.scale.set(0.48, 0.42, 0.88);
    body.position.y = 0.52;
    const head = addMesh(root, resources.box('enemy-wolf-head'), bodyMaterial);
    head.scale.set(0.34, 0.3, 0.46);
    head.position.set(0, 0.74, 0.45);
    for (const x of [-0.14, 0.14]) {
      const ear = addMesh(root, resources.cone('enemy-wolf-ear'), darkMaterial);
      ear.scale.set(0.1, 0.22, 0.1);
      ear.position.set(x, 0.96, 0.4);
    }
    const tail = addMesh(root, resources.cone('enemy-wolf-tail'), darkMaterial);
    tail.scale.set(0.14, 0.55, 0.14);
    tail.position.set(0, 0.62, -0.55);
    tail.rotation.x = -0.75;
    const legs: THREE.Object3D[] = [];
    for (const x of [-0.22, 0.22]) {
      for (const z of [-0.32, 0.32]) {
        const leg = addMesh(root, resources.cylinder('enemy-wolf-leg'), darkMaterial);
        leg.scale.set(0.1, 0.42, 0.1);
        leg.position.set(x, 0.21, z);
        legs.push(leg);
      }
    }
    root.userData.parts = { body, head, tail, legs };
    addEyes(root, resources, 0xf59e0b, 0.78);
  } else if (kind === 'thornling') {
    const body = addMesh(root, resources.sphere('enemy-thornling-body'), bodyMaterial);
    body.scale.set(0.48, 0.55, 0.44);
    body.position.y = 0.46;
    for (const x of [-0.18, 0, 0.18]) {
      const thorn = addMesh(root, resources.cone('enemy-thornling-thorn'), darkMaterial);
      thorn.scale.set(0.08, 0.38, 0.08);
      thorn.position.set(x, 0.86, 0.02);
      thorn.rotation.z = x < 0 ? 0.2 : x > 0 ? -0.2 : 0;
    }
    const arms: THREE.Object3D[] = [];
    for (const x of [-0.36, 0.36]) {
      const arm = addMesh(root, resources.cylinder('enemy-thornling-arm'), darkMaterial);
      arm.scale.set(0.08, 0.44, 0.08);
      arm.position.set(x, 0.46, 0.1);
      arm.rotation.z = x < 0 ? -0.45 : 0.45;
      arms.push(arm);
    }
    root.userData.parts = { body, arms };
    addEyes(root, resources, 0x84cc16, 0.54);
  } else if (kind === 'treant') {
    const body = addMesh(root, resources.cylinder('enemy-treant-trunk'), darkMaterial);
    body.scale.set(0.95, 1.35, 0.78);
    body.position.y = 0.82;
    const crown = addMesh(root, resources.ico('enemy-treant-crown'), bodyMaterial);
    crown.scale.set(0.85, 0.65, 0.85);
    crown.position.set(0, 1.72, 0.05);
    const arms: THREE.Object3D[] = [];
    for (const x of [-0.72, 0.72]) {
      const arm = addMesh(root, resources.cylinder('enemy-treant-arm'), darkMaterial);
      arm.scale.set(0.28, 0.95, 0.28);
      arm.position.set(x, 0.92, 0.06);
      arm.rotation.z = x < 0 ? -0.32 : 0.32;
      arms.push(arm);
    }
    root.userData.parts = { body, crown, arms };
    addEyes(root, resources, 0xf97316, 1.25);
  } else if (kind === 'frost-wraith') {
    const body = addMesh(root, resources.cone('enemy-wraith-body'), resources.standardMaterial(`enemy-wraith-${color}`, 0x38bdf8, { transparent: true, opacity: 0.78, roughness: 0.3 }));
    body.scale.set(0.68, 1.15, 0.58);
    body.position.y = 0.85;
    for (const x of [-0.38, 0.38]) {
      const spike = addMesh(root, resources.cone('enemy-wraith-spike'), resources.basicMaterial('enemy-wraith-spike', 0xe0f2fe, { transparent: true, opacity: 0.85 }));
      spike.scale.set(0.12, 0.62, 0.12);
      spike.position.set(x, 1.15, -0.15);
      spike.rotation.x = -0.4;
      spike.rotation.z = x < 0 ? -0.35 : 0.35;
    }
    const head = addMesh(root, resources.box('enemy-wraith-mask'), resources.standardMaterial('enemy-wraith-mask', 0xf0f9ff, { roughness: 0.4 }));
    head.scale.set(0.42, 0.48, 0.32);
    head.position.set(0, 1.38, 0.08);
    root.userData.parts = { body, head };
    addEyes(root, resources, 0xffffff, 1.42);
  } else {
    const torso = addMesh(root, resources.cylinder('enemy-skeleton-body'), darkMaterial);
    torso.scale.set(0.48, 0.8, 0.38);
    torso.position.y = 0.55;
    const head = addMesh(root, resources.ico('enemy-skeleton-head'), boneMaterial);
    head.scale.setScalar(0.52);
    head.position.y = 1.24;
    const jaw = addMesh(root, resources.box('enemy-skeleton-jaw'), boneMaterial);
    jaw.scale.set(0.38, 0.1, 0.3);
    jaw.position.set(0, 0.98, 0.14);
    addEyes(root, resources, 0x5ddcff, 1.28);
    const sword = addMesh(root, resources.box('enemy-skeleton-sword'), boneMaterial);
    sword.scale.set(0.08, 0.72, 0.08);
    sword.position.set(0.55, 0.66, 0.02);
    sword.rotation.z = -0.35;
    const arms: THREE.Object3D[] = [];
    for (const x of [-0.38, 0.38]) {
      const arm = addMesh(root, resources.cylinder('enemy-skeleton-arm'), boneMaterial);
      arm.scale.set(0.09, 0.52, 0.09);
      arm.position.set(x, 0.72, 0.02);
      arm.rotation.z = x < 0 ? -0.34 : 0.34;
      arms.push(arm);
    }
    const legs: THREE.Object3D[] = [];
    for (const x of [-0.2, 0.2]) {
      const leg = addMesh(root, resources.cylinder('enemy-skeleton-leg'), boneMaterial);
      leg.scale.set(0.1, 0.45, 0.1);
      leg.position.set(x, 0.18, 0.02);
      leg.rotation.z = x < 0 ? -0.1 : 0.1;
      legs.push(leg);
    }
    const shield = addMesh(root, resources.cylinder('enemy-skeleton-shield'), resources.standardMaterial('enemy-skeleton-shield', 0x46637c, { metalness: 0.36, roughness: 0.5 }));
    shield.scale.set(0.36, 0.1, 0.36);
    shield.position.set(-0.58, 0.62, 0.14);
    shield.rotation.x = Math.PI / 2;
    root.userData.parts = { torso, head, jaw, sword, arms, legs, shield };
  }

  if (worldId !== 1 && (kind === 'skeleton' || kind === 'ghost' || kind === 'knight')) {
    const rune = addMesh(root, resources.torus(`enemy-world-rune-${kind}-${worldId}`), resources.basicMaterial(`enemy-world-rune-${kind}-${worldId}`, worldAccent, { transparent: true, opacity: 0.72, side: THREE.DoubleSide }));
    rune.scale.setScalar(kind === 'knight' ? 0.48 : 0.34);
    rune.rotation.x = Math.PI / 2;
    rune.position.y = kind === 'ghost' ? 0.32 : 0.12;
    root.userData.parts = { ...(root.userData.parts as Record<string, THREE.Object3D | THREE.Object3D[]>), rune };
  }

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

  const cape = addMesh(root, resources.cone('boss-cape'), resources.standardMaterial('boss-cape', 0x94182c, { roughness: 0.85 }));
  cape.scale.set(1.5, 1.9, 0.22);
  cape.position.set(0, 1.15, -0.38);

  const armor = addMesh(root, resources.cylinder('boss-armor'), resources.standardMaterial('boss-armor', 0x1c2432, { metalness: 0.65, roughness: 0.48 }));
  armor.scale.set(1.25, 1.45, 0.95);
  armor.position.y = 1.25;
  const chest = addMesh(root, resources.box('boss-chest'), resources.standardMaterial('boss-chest', 0xffca55, { metalness: 0.8, roughness: 0.3, emissive: 0x775010, emissiveIntensity: 0.5 }));
  chest.scale.set(1.1, 0.72, 0.86);
  chest.position.y = 1.45;
  const skull = addMesh(root, resources.ico('boss-skull'), resources.standardMaterial('boss-skull', 0xd8e4ee, { roughness: 0.78 }));
  skull.scale.set(1.12, 0.96, 0.98);
  skull.position.set(0, 2.52, 0.05);
  const jaw = addMesh(root, resources.box('boss-jaw'), resources.standardMaterial('boss-jaw', 0xd8e4ee, { roughness: 0.8 }));
  jaw.scale.set(0.9, 0.32, 0.68);
  jaw.position.set(0, 1.96, 0.24);
  const eyeMaterial = resources.basicMaterial('boss-eyes', 0xff2244);
  for (const x of [-0.34, 0.34]) {
    const eye = addMesh(root, resources.box('boss-eye'), eyeMaterial);
    eye.scale.set(0.18, 0.18, 0.08);
    eye.position.set(x, 2.56, 0.62);
  }
  const crownMaterial = resources.standardMaterial('boss-crown', 0xffca55, { emissive: 0x775010, emissiveIntensity: 0.6, metalness: 0.85, roughness: 0.28 });
  const rubyMaterial = resources.standardMaterial('boss-ruby', 0xff2244, { emissive: 0xee0022, emissiveIntensity: 1.8, roughness: 0.2 });
  for (const x of [-0.6, -0.3, 0, 0.3, 0.6]) {
    const point = addMesh(root, resources.cone('boss-crown-point'), crownMaterial);
    point.scale.set(0.18, 0.68, 0.18);
    point.position.set(x, 3.28 - Math.abs(x) * 0.12, 0.04);
    point.rotation.z = x * -0.25;
    const ruby = addMesh(root, resources.octa('boss-ruby-jewel'), rubyMaterial);
    ruby.scale.setScalar(0.08);
    ruby.position.set(x, 3.02, 0.22);
  }
  const sword = addMesh(root, resources.box('boss-sword'), resources.standardMaterial('boss-sword', 0x1c2432, { metalness: 0.7, roughness: 0.4 }));
  sword.scale.set(0.24, 2.4, 0.1);
  sword.position.set(1.55, 1.4, 0.1);
  sword.rotation.z = -0.35;
  const swordRune = addMesh(root, resources.box('boss-sword-rune'), rubyMaterial);
  swordRune.scale.set(0.08, 2.0, 0.12);
  swordRune.position.set(1.55, 1.4, 0.1);
  swordRune.rotation.z = -0.35;
  const hilt = addMesh(root, resources.box('boss-hilt'), crownMaterial);
  hilt.scale.set(0.75, 0.16, 0.2);
  hilt.position.set(1.32, 0.65, 0.1);
  hilt.rotation.z = -0.35;
  root.userData.parts = { armor, chest, cape, skull, sword, swordRune, crown: crownMaterial };
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

export function createPetModel(petId: string, resources: SharedResources): THREE.Group {
  const group = new THREE.Group();
  group.name = `pet-${petId}`;

  if (petId === 'spirit-fox') {
    const body = addMesh(group, resources.box('pet-fox-body'), resources.standardMaterial('pet-fox-body', 0x059669, { roughness: 0.6 }));
    body.scale.set(0.28, 0.22, 0.46);
    body.position.y = 0.18;
    const head = addMesh(group, resources.box('pet-fox-head'), resources.standardMaterial('pet-fox-head', 0x10b981, { roughness: 0.5 }));
    head.scale.set(0.22, 0.2, 0.26);
    head.position.set(0, 0.32, 0.24);
    const tail = addMesh(group, resources.cone('pet-fox-tail'), resources.standardMaterial('pet-fox-tail', 0x34d399, { roughness: 0.5 }));
    tail.scale.set(0.14, 0.44, 0.14);
    tail.position.set(0, 0.28, -0.3);
    tail.rotation.x = -0.6;
    for (const x of [-0.08, 0.08]) {
      const ear = addMesh(group, resources.cone('pet-fox-ear'), resources.standardMaterial('pet-fox-ear', 0x6ee7b7));
      ear.scale.set(0.06, 0.14, 0.06);
      ear.position.set(x, 0.46, 0.22);
    }
    group.userData.parts = { body, head, tail };
  } else if (petId === 'tiny-golem') {
    const body = addMesh(group, resources.box('pet-golem-body'), resources.standardMaterial('pet-golem-body', 0x475569, { metalness: 0.3, roughness: 0.7 }));
    body.scale.set(0.34, 0.38, 0.3);
    body.position.y = 0.22;
    const rune = addMesh(group, resources.octa('pet-golem-rune'), resources.basicMaterial('pet-golem-rune', 0x38bdf8, { transparent: true, opacity: 0.9 }));
    rune.scale.setScalar(0.1);
    rune.position.set(0, 0.24, 0.18);
    for (const x of [-0.22, 0.22]) {
      const arm = addMesh(group, resources.box('pet-golem-arm'), resources.standardMaterial('pet-golem-arm', 0x334155));
      arm.scale.set(0.1, 0.28, 0.12);
      arm.position.set(x, 0.22, 0);
    }
    group.userData.parts = { body, rune };
  } else if (petId === 'fairy') {
    const body = addMesh(group, resources.sphere('pet-fairy-body'), resources.basicMaterial('pet-fairy-body', 0xfbcfe8));
    body.scale.setScalar(0.16);
    body.position.y = 0.35;
    const halo = addMesh(group, resources.torus('pet-fairy-halo'), resources.basicMaterial('pet-fairy-halo', 0xfde047, { transparent: true, opacity: 0.8 }));
    halo.scale.setScalar(0.12);
    halo.position.set(0, 0.46, 0);
    halo.rotation.x = Math.PI / 2;
    const wings: THREE.Object3D[] = [];
    for (const x of [-0.14, 0.14]) {
      const wing = addMesh(group, resources.plane('pet-fairy-wing', 0.24, 0.34), resources.basicMaterial('pet-fairy-wing', 0xf472b6, { transparent: true, opacity: 0.75, side: THREE.DoubleSide }));
      wing.position.set(x, 0.42, -0.05);
      wing.rotation.y = x < 0 ? -0.4 : 0.4;
      wings.push(wing);
    }
    group.userData.parts = { body, halo, wings };
  } else {
    // bat-familiar
    const body = addMesh(group, resources.ico('pet-bat-body'), resources.standardMaterial('pet-bat-body', 0x1e1b4b, { roughness: 0.8 }));
    body.scale.set(0.24, 0.18, 0.28);
    body.position.y = 0.35;
    const wings: THREE.Object3D[] = [];
    for (const x of [-0.28, 0.28]) {
      const wing = addMesh(group, resources.cone('pet-bat-wing'), resources.standardMaterial('pet-bat-wing', 0x581c87, { roughness: 0.8 }));
      wing.scale.set(0.38, 0.08, 0.28);
      wing.position.set(x, 0.38, 0);
      wing.rotation.z = x < 0 ? -0.25 : 0.25;
      wings.push(wing);
    }
    const eyeMat = resources.basicMaterial('pet-bat-eyes', 0xc084fc);
    for (const x of [-0.08, 0.08]) {
      const eye = addMesh(group, resources.sphere('pet-bat-eye'), eyeMat);
      eye.scale.setScalar(0.04);
      eye.position.set(x, 0.38, 0.15);
    }
    group.userData.parts = { body, wings };
  }

  return group;
}

export function createRelicAccent(relicId: string, resources: SharedResources): THREE.Group {
  const group = new THREE.Group();
  group.name = `relic-${relicId}`;

  const color = relicId === 'berserker-fang' ? 0xef4444 : relicId === 'frost-rune' ? 0x38bdf8 : relicId === 'demon-seal' ? 0xf43f5e : 0x60a5fa;
  const relicMesh = addMesh(group, resources.octa(`relic-mesh-${relicId}`), resources.basicMaterial(`relic-mat-${relicId}`, color, { transparent: true, opacity: 0.88 }));
  relicMesh.scale.setScalar(0.16);
  relicMesh.position.set(0.48, 1.25, 0);

  const relicHalo = addMesh(group, resources.ring(`relic-halo-${relicId}`, 0.22, 0.28), resources.basicMaterial(`relic-halo-mat-${relicId}`, color, { transparent: true, opacity: 0.65, side: THREE.DoubleSide }));
  relicHalo.position.copy(relicMesh.position);
  relicHalo.rotation.x = Math.PI / 2;

  group.userData.parts = { relicMesh, relicHalo };
  return group;
}

export function createBossEchoModel(bossId: BossId = 'skeleton-king', resources: SharedResources): { root: THREE.Group; aura: THREE.Mesh; shadow: THREE.Mesh } {
  const model = createBossModel(bossId, resources);
  model.root.scale.setScalar(0.85);
  model.root.name = `boss-echo-${bossId}`;

  // Spectral purple/shadow ethereal ring
  const echoRing = addMesh(
    model.root,
    resources.torus(`echo-ring-${bossId}`),
    resources.basicMaterial(`echo-ring-mat`, 0xa855f7, { transparent: true, opacity: 0.72, side: THREE.DoubleSide })
  );
  echoRing.scale.setScalar(1.6);
  echoRing.rotation.x = Math.PI / 2;
  echoRing.position.y = 0.25;

  return model;
}
