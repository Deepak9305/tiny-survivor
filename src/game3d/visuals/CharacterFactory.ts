import * as THREE from 'three';
import type { BossId } from '../../types';
import { SharedResources, addMesh } from '../core/SharedResources';
import {
  buildStylizedArcher,
  buildStylizedBat,
  buildStylizedBoneMage,
  buildStylizedCursedWolf,
  buildStylizedDemon,
  buildStylizedForestGuardian,
  buildStylizedForestMage,
  buildStylizedFrostWraith,
  buildStylizedGhost,
  buildStylizedIceMage,
  buildStylizedImp,
  buildStylizedKnight,
  buildStylizedSkeleton,
  buildStylizedSlime,
  buildStylizedThornling,
  buildStylizedTreant,
  buildStylizedZombie,
} from './StylizedMonsters';
import {
  getSkeletonSkullTexture,
  getDemonLavaTexture,
  getIceRimeTexture,
  getBrambleClothTexture,
} from './MonsterSkins';

// ============================================================================
// BRAWL STARS / SUPERCELL STYLE CHIBI BRAWLERS OVERHAUL
// ============================================================================

interface BrawlStarsFaceOptions {
  irisColor: number;
  irisKey?: string;
  pupilColor?: number;
  skinColor?: number;
  skinKey?: string;
  eyeSpacing?: number;
  eyeY?: number;
  eyeZ?: number;
  browColor?: number;
  browKey?: string;
  browTilt?: number;
  hasNose?: boolean;
  mouthTilt?: number;
  hasBlush?: boolean;
  blushColor?: number;
  hasFreckles?: boolean;
}

function addBrawlStarsFace(
  headGroup: THREE.Group,
  resources: SharedResources,
  options: BrawlStarsFaceOptions,
): void {
  const eyeSpacing = options.eyeSpacing ?? 0.16;
  const eyeY = options.eyeY ?? 0.04;
  const eyeZ = options.eyeZ ?? 0.27;
  const browTilt = options.browTilt ?? 0.15;
  const browColor = options.browColor ?? 0x27272a;

  // 1. Dual Expressive Eyes
  for (const x of [-eyeSpacing, eyeSpacing]) {
    // Sclera base (pure white)
    const sclera = addMesh(
      headGroup,
      resources.sphere('chibi-eye-sclera'),
      resources.basicMaterial('chibi-eye-white', 0xffffff),
    );
    sclera.scale.set(0.12, 0.15, 0.04);
    sclera.position.set(x, eyeY, eyeZ);

    // Colorful Iris
    const iris = addMesh(
      headGroup,
      resources.sphere(`chibi-iris-${options.irisKey ?? options.irisColor}`),
      resources.basicMaterial(`chibi-iris-mat-${options.irisKey ?? options.irisColor}`, options.irisColor),
    );
    iris.scale.set(0.08, 0.105, 0.045);
    iris.position.set(x, eyeY, eyeZ + 0.018);

    // Deep Dark Pupil
    const pupil = addMesh(
      headGroup,
      resources.sphere('chibi-pupil'),
      resources.basicMaterial('chibi-pupil-mat', options.pupilColor ?? 0x09090b),
    );
    pupil.scale.set(0.045, 0.06, 0.048);
    pupil.position.set(x, eyeY, eyeZ + 0.024);

    // Primary Specular Glossy Glint (upper-right corner for vivid life)
    const glintMain = addMesh(
      headGroup,
      resources.sphere('chibi-glint-main'),
      resources.basicMaterial('chibi-glint-mat', 0xffffff),
    );
    glintMain.scale.setScalar(0.034);
    glintMain.position.set(x + 0.028, eyeY + 0.038, eyeZ + 0.042);

    // Secondary Specular Micro Glint (lower-left bounce light)
    const glintSub = addMesh(
      headGroup,
      resources.sphere('chibi-glint-sub'),
      resources.basicMaterial('chibi-glint-mat', 0xffffff),
    );
    glintSub.scale.setScalar(0.016);
    glintSub.position.set(x - 0.022, eyeY - 0.032, eyeZ + 0.042);

    // Expressive 3D Eyebrow
    const brow = addMesh(
      headGroup,
      resources.box(`chibi-brow-${options.browKey ?? browColor}`),
      resources.standardMaterial(`chibi-brow-mat-${options.browKey ?? browColor}`, browColor, { roughness: 0.85 }),
    );
    brow.scale.set(0.12, 0.035, 0.04);
    brow.position.set(x, eyeY + 0.13, eyeZ + 0.02);
    brow.rotation.z = (x < 0 ? -1 : 1) * browTilt;
  }

  // 2. Cute Button Nose
  if (options.hasNose !== false) {
    const nose = addMesh(
      headGroup,
      resources.sphere('chibi-button-nose'),
      resources.standardMaterial(options.skinKey ?? 'chibi-skin', options.skinColor ?? 0xfcd3b6, { roughness: 0.75 }),
    );
    nose.scale.set(0.042, 0.032, 0.035);
    nose.position.set(0, eyeY - 0.06, eyeZ + 0.05);
  }

  // 3. Cheerful / Determined Mouth
  const mouth = addMesh(
    headGroup,
    resources.box('chibi-mouth'),
    resources.basicMaterial('chibi-mouth-dark', 0x450a0a),
  );
  mouth.scale.set(0.10, 0.022, 0.03);
  mouth.position.set(0, eyeY - 0.13, eyeZ + 0.03);
  if (options.mouthTilt) mouth.rotation.z = options.mouthTilt;

  // 4. Soft Cheek Blush
  if (options.hasBlush) {
    for (const bx of [-(eyeSpacing + 0.08), eyeSpacing + 0.08]) {
      const blush = addMesh(
        headGroup,
        resources.sphere('chibi-blush'),
        resources.basicMaterial('chibi-blush-mat', options.blushColor ?? 0xfb7185, { transparent: true, opacity: 0.55 }),
      );
      blush.scale.set(0.08, 0.045, 0.025);
      blush.position.set(bx, eyeY - 0.08, eyeZ + 0.01);
    }
  }

  // 5. Cute Freckles
  if (options.hasFreckles) {
    for (const fx of [-0.22, -0.18, 0.18, 0.22]) {
      const freckle = addMesh(
        headGroup,
        resources.sphere(`chibi-freckle-${fx}`),
        resources.standardMaterial('chibi-freckle-mat', 0x9a3412, { roughness: 0.9 }),
      );
      freckle.scale.setScalar(0.015);
      freckle.position.set(fx, eyeY - 0.06 + (Math.abs(fx) > 0.20 ? 0.015 : 0), eyeZ + 0.02);
    }
  }
}

interface BrawlStarsLegOptions {
  pantMaterial: THREE.Material;
  bootMaterial: THREE.Material;
  soleMaterial?: THREE.Material;
  toeMaterial?: THREE.Material;
  hasSpurs?: boolean;
  spurMaterial?: THREE.Material;
  kneePad?: boolean;
  kneePadMaterial?: THREE.Material;
}

function createBrawlStarsLeg(
  root: THREE.Group,
  resources: SharedResources,
  x: number,
  options: BrawlStarsLegOptions,
): THREE.Group {
  const legGroup = new THREE.Group();
  legGroup.position.set(x, 0.30, 0.0);

  // Short, chunky cartoon thigh / leg
  const thigh = addMesh(legGroup, resources.cylinder('chibi-leg-thigh'), options.pantMaterial);
  thigh.scale.set(0.14, 0.22, 0.14);
  thigh.position.set(0, -0.06, 0.02);

  // Chunky cartoon boot / sneaker body
  const boot = addMesh(legGroup, resources.box('chibi-leg-boot'), options.bootMaterial);
  boot.scale.set(0.24, 0.16, 0.34);
  boot.position.set(0, -0.16, 0.05);

  // Thick white/contrast rubber sneaker sole
  const soleMat = options.soleMaterial ?? resources.standardMaterial('chibi-boot-sole-white', 0xf8fafc, { roughness: 0.6 });
  const sole = addMesh(legGroup, resources.box('chibi-leg-sole'), soleMat);
  sole.scale.set(0.26, 0.05, 0.38);
  sole.position.set(0, -0.23, 0.06);

  // Rounded cartoon toe cap
  const toeMat = options.toeMaterial ?? options.bootMaterial;
  const toeCap = addMesh(legGroup, resources.sphere('chibi-leg-toe'), toeMat);
  toeCap.scale.set(0.22, 0.14, 0.16);
  toeCap.position.set(0, -0.16, 0.18);

  if (options.kneePad && options.kneePadMaterial) {
    const pad = addMesh(legGroup, resources.octa('chibi-leg-kneepad'), options.kneePadMaterial);
    pad.scale.setScalar(0.09);
    pad.position.set(0, -0.05, 0.10);
  }

  if (options.hasSpurs && options.spurMaterial) {
    const spur = addMesh(legGroup, resources.octa('chibi-leg-spur'), options.spurMaterial);
    spur.scale.setScalar(0.075);
    spur.position.set(0, -0.16, -0.13);
  }

  root.add(legGroup);
  return legGroup;
}

// ----------------------------------------------------------------------------
// 1. SHADOW MAGE ("VEX") — Chibi Void Sorcerer Brawler
// ----------------------------------------------------------------------------
export function createShadowMage(resources: SharedResources): { root: THREE.Group; aura: THREE.Mesh; shadow: THREE.Mesh } {
  const root = new THREE.Group();
  root.name = 'shadow-mage';
  root.userData.parts = {} as Record<string, THREE.Object3D | THREE.Object3D[]>;

  const shadow = resources.createContactShadow('hero-shadow', 1, 1, 0.65);
  shadow.scale.set(1.05, 0.65, 1);
  shadow.position.y = 0.006;

  const aura = new THREE.Mesh(
    resources.ring('hero-aura', 0.66, 0.76),
    resources.basicMaterial('hero-aura', 0x38bdf8, { transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthWrite: false }),
  );
  aura.rotation.x = -Math.PI / 2;
  aura.position.y = 0.014;

  const mGold = resources.standardMaterial('brawler-shadow-gold', 0xf59e0b, { metalness: 0.85, roughness: 0.25 });
  const mMidnightRobe = resources.standardMaterial('brawler-shadow-robe', 0x1e1b4b, { roughness: 0.75 });
  const mDeepCloak = resources.standardMaterial('brawler-shadow-cloak', 0x0f172a, { roughness: 0.85 });
  const mMagentaScarf = resources.standardMaterial('brawler-shadow-scarf', 0xe11d48, { roughness: 0.65, emissive: 0x881337, emissiveIntensity: 0.45 });
  const mVoidFace = resources.basicMaterial('brawler-shadow-void', 0x020617);
  const mCyanEyes = resources.basicMaterial('brawler-shadow-eyes', 0x38bdf8);
  const mWood = resources.standardMaterial('brawler-shadow-wood', 0x451a03, { roughness: 0.90 });
  const mCyanCrystal = resources.standardMaterial('brawler-shadow-crystal', 0x38bdf8, { emissive: 0x06b6d4, emissiveIntensity: 3.2, roughness: 0.12 });

  // 1. Cute Chunky Bean Body & Flared Lower Robe
  const body = addMesh(root, resources.cylinder('hero-body'), mMidnightRobe);
  body.scale.set(0.56, 0.46, 0.48);
  body.position.y = 0.48;

  const cloak = addMesh(root, resources.cone('hero-cloak'), mDeepCloak);
  cloak.scale.set(0.72, 0.58, 0.62);
  cloak.position.y = 0.40;

  const goldHem = addMesh(root, resources.torus('hero-gold-hem'), mGold);
  goldHem.scale.set(0.38, 0.38, 0.04);
  goldHem.position.set(0, 0.26, 0);
  goldHem.rotation.x = Math.PI / 2;

  // Arcane Grimoire strapped to hip
  const tome = addMesh(root, resources.box('hero-grimoire'), mDeepCloak);
  tome.scale.set(0.12, 0.24, 0.18);
  tome.position.set(-0.36, 0.42, 0.05);
  tome.rotation.y = 0.25;

  const tomeClasp = addMesh(root, resources.octa('hero-grimoire-clasp'), mCyanCrystal);
  tomeClasp.scale.setScalar(0.06);
  tomeClasp.position.set(-0.41, 0.42, 0.05);

  // 2. Thick Fluffy Scarf with Dynamic Bouncy Tails
  const scarf = addMesh(root, resources.torus('hero-scarf'), mMagentaScarf);
  scarf.scale.set(0.42, 0.28, 0.14);
  scarf.position.set(0, 0.68, 0.06);
  scarf.rotation.x = Math.PI / 2;

  const scarfKnot = addMesh(root, resources.sphere('hero-scarf-knot'), mMagentaScarf);
  scarfKnot.scale.set(0.12, 0.10, 0.08);
  scarfKnot.position.set(0, 0.66, 0.22);

  const scarfTail1 = addMesh(root, resources.box('hero-scarf-tail-1'), mMagentaScarf);
  scarfTail1.scale.set(0.12, 0.06, 0.55);
  scarfTail1.position.set(-0.24, 0.64, -0.18);
  scarfTail1.rotation.set(-0.25, -0.18, 0.12);

  const scarfTail2 = addMesh(root, resources.box('hero-scarf-tail-2'), mMagentaScarf);
  scarfTail2.scale.set(0.10, 0.05, 0.42);
  scarfTail2.position.set(-0.16, 0.62, -0.22);
  scarfTail2.rotation.set(-0.20, -0.10, 0.06);

  // 3. Chibi Head, Mystical Void Face & Crooked Wizard Hat
  const head = new THREE.Group();
  head.name = 'hero-head';
  head.position.set(0, 0.88, 0);

  const faceVoid = addMesh(head, resources.sphere('hero-face-void'), mVoidFace);
  faceVoid.scale.set(0.56, 0.52, 0.50);

  // Big, Glowing, Cute Cartoon Cyan Eyes in the Void
  for (const x of [-0.16, 0.16]) {
    const sclera = addMesh(head, resources.sphere(`shadow-sclera-${x}`), resources.basicMaterial('shadow-sclera', 0xa5f3fc));
    sclera.scale.set(0.13, 0.16, 0.04);
    sclera.position.set(x, 0.02, 0.24);

    const eye = addMesh(head, resources.sphere(`shadow-eye-${x}`), mCyanEyes);
    eye.scale.set(0.09, 0.12, 0.045);
    eye.position.set(x, 0.02, 0.26);

    const glint = addMesh(head, resources.sphere(`shadow-glint-${x}`), resources.basicMaterial('shadow-glint', 0xffffff));
    glint.scale.setScalar(0.038);
    glint.position.set(x + 0.028, 0.06, 0.28);

    const brow = addMesh(head, resources.box(`shadow-brow-${x}`), mDeepCloak);
    brow.scale.set(0.12, 0.035, 0.04);
    brow.position.set(x, 0.12, 0.24);
    brow.rotation.z = x < 0 ? -0.14 : 0.14;
  }

  // Crooked Arcane Wizard Hat with Wide Curved Brim
  const hoodRim = addMesh(head, resources.cylinder('hero-hood-rim'), mDeepCloak);
  hoodRim.scale.set(0.92, 0.04, 0.92);
  hoodRim.position.set(0, 0.18, 0.02);
  hoodRim.rotation.x = -0.06;

  const hood = addMesh(head, resources.cone('hero-hood'), mDeepCloak);
  hood.scale.set(0.62, 0.72, 0.62);
  hood.position.set(0, 0.48, -0.08);
  hood.rotation.x = 0.28;

  const hatTip = addMesh(head, resources.sphere('hero-hat-tip'), mDeepCloak);
  hatTip.scale.setScalar(0.13);
  hatTip.position.set(0, 0.80, -0.24);

  const tipStar = addMesh(head, resources.octa('hero-tip-star'), mGold);
  tipStar.scale.setScalar(0.08);
  tipStar.position.set(0, 0.85, -0.26);

  const hatBand = addMesh(head, resources.torus('hero-hat-band'), mGold);
  hatBand.scale.set(0.38, 0.38, 0.05);
  hatBand.position.set(0, 0.22, 0);
  hatBand.rotation.x = Math.PI / 2 + 0.28;

  const hatStar = addMesh(head, resources.octa('hero-hat-star'), mGold);
  hatStar.scale.setScalar(0.10);
  hatStar.position.set(0, 0.24, 0.20);

  root.add(head);

  // 4. Short Punchy Arms with Golden Cuffs & Mitten Hands
  const arms: THREE.Object3D[] = [];
  for (const x of [-0.36, 0.36]) {
    const arm = addMesh(root, resources.cylinder('hero-arm'), mMidnightRobe);
    arm.scale.set(0.15, 0.38, 0.15);
    arm.position.set(x, 0.54, 0.02);
    arm.rotation.z = x < 0 ? -0.24 : 0.24;

    const cuff = addMesh(arm, resources.torus('hero-arm-cuff'), mGold);
    cuff.scale.set(0.12, 0.12, 0.04);
    cuff.position.set(0, -0.16, 0);
    cuff.rotation.x = Math.PI / 2;

    const hand = addMesh(arm, resources.sphere('hero-hand'), mDeepCloak);
    hand.scale.set(0.12, 0.12, 0.12);
    hand.position.set(0, -0.22, 0.02);

    arms.push(arm);
  }

  // 5. Short Stubby Legs with Oversized Chunky Boots
  const legs: THREE.Group[] = [];
  for (const x of [-0.17, 0.17]) {
    const leg = createBrawlStarsLeg(root, resources, x, {
      pantMaterial: mMidnightRobe,
      bootMaterial: mDeepCloak,
      soleMaterial: resources.standardMaterial('chibi-shadow-sole', 0x312e81, { roughness: 0.6 }),
      toeMaterial: mDeepCloak,
    });
    legs.push(leg);
  }

  // 6. Oversized Arcane Staff with Floating Gyroscopic Crystal
  const staff = addMesh(root, resources.cylinder('hero-staff'), mWood);
  staff.scale.set(0.06, 1.10, 0.06);
  staff.position.set(0.50, 0.54, 0.08);
  staff.rotation.z = -0.26;

  const staffProngs = addMesh(root, resources.cylinder('hero-staff-head'), mGold);
  staffProngs.scale.set(0.12, 0.08, 0.16);
  staffProngs.position.set(0.66, 1.05, 0.08);
  staffProngs.rotation.z = -0.26;

  const crystal = addMesh(root, resources.octa('hero-crystal'), mCyanCrystal);
  crystal.scale.setScalar(0.28);
  crystal.position.set(0.70, 1.18, 0.08);

  const crystalHalo = addMesh(
    root,
    resources.torus('hero-crystal-halo'),
    resources.basicMaterial('hero-crystal-halo', 0x38bdf8, { transparent: true, opacity: 0.75, side: THREE.DoubleSide }),
  );
  crystalHalo.scale.setScalar(0.26);
  crystalHalo.position.copy(crystal.position);
  crystalHalo.rotation.x = Math.PI / 2;

  const crystalHaloInner = addMesh(
    root,
    resources.torus('hero-crystal-inner-halo'),
    resources.basicMaterial('hero-crystal-inner-halo', 0xbae6fd, { transparent: true, opacity: 0.85, side: THREE.DoubleSide }),
  );
  crystalHaloInner.scale.setScalar(0.17);
  crystalHaloInner.position.copy(crystal.position);
  crystalHaloInner.rotation.y = Math.PI / 2;

  root.userData.parts = {
    body,
    head,
    cloak,
    goldHem,
    hood,
    hoodRim,
    scarf,
    scarfTail: scarfTail1,
    arms,
    legs,
    staff,
    crystal,
    crystalHalo,
    weapon: staff,
  };
  return { root, aura, shadow };
}

// ----------------------------------------------------------------------------
// 2. WARRIOR ("VAL") — Chibi Valkyrie / Paladin Brawler
// ----------------------------------------------------------------------------
export function createWarriorVisual(resources: SharedResources): { root: THREE.Group; aura: THREE.Mesh; shadow: THREE.Mesh } {
  const root = new THREE.Group();
  root.name = 'hero-warrior';
  root.userData.parts = {} as Record<string, THREE.Object3D | THREE.Object3D[]>;

  const shadow = resources.createContactShadow('hero-warrior-shadow', 1, 1, 0.68);
  shadow.scale.set(1.10, 0.70, 1);
  shadow.position.y = 0.006;

  const aura = new THREE.Mesh(
    resources.ring('hero-warrior-aura', 0.78, 0.90),
    resources.basicMaterial('hero-warrior-aura', 0xf59e0b, { transparent: true, opacity: 0.65, side: THREE.DoubleSide, depthWrite: false }),
  );
  aura.rotation.x = -Math.PI / 2;
  aura.position.y = 0.014;

  const mNavySteel = resources.standardMaterial('brawler-warrior-steel', 0x1e3a8a, { metalness: 0.65, roughness: 0.35 });
  const mBrightGold = resources.standardMaterial('brawler-warrior-gold', 0xf59e0b, { metalness: 0.85, roughness: 0.25, emissive: 0x78350f, emissiveIntensity: 0.25 });
  const mCrimsonCloth = resources.standardMaterial('brawler-warrior-cloth', 0xdc2626, { roughness: 0.78 });
  const mDarkCape = resources.standardMaterial('brawler-warrior-cape', 0xb91c1c, { roughness: 0.82 });
  const mCyanGlow = resources.standardMaterial('brawler-warrior-rune', 0x38bdf8, { emissive: 0x0284c7, emissiveIntensity: 3.0, roughness: 0.12 });
  const mSkin = resources.standardMaterial('brawler-warrior-skin', 0xfcd3b6, { roughness: 0.75 });
  const mHairBlonde = resources.standardMaterial('brawler-warrior-hair', 0xfde047, { roughness: 0.72 });
  const mBladeSteel = resources.standardMaterial('brawler-warrior-blade', 0xe2e8f0, { metalness: 0.90, roughness: 0.18 });

  // 1. Chunky Paladin Torso & Golden Breastplate
  const body = addMesh(root, resources.cylinder('warrior-body'), mNavySteel);
  body.scale.set(0.58, 0.48, 0.46);
  body.position.y = 0.50;

  const chestPlate = addMesh(root, resources.box('warrior-chest'), mBrightGold);
  chestPlate.scale.set(0.50, 0.30, 0.12);
  chestPlate.position.set(0, 0.56, 0.20);

  const chestStar = addMesh(root, resources.octa('warrior-chest-star'), mCyanGlow);
  chestStar.scale.setScalar(0.11);
  chestStar.position.set(0, 0.56, 0.27);

  const tabard = addMesh(root, resources.box('warrior-tabard'), mCrimsonCloth);
  tabard.scale.set(0.28, 0.38, 0.05);
  tabard.position.set(0, 0.38, 0.22);

  const belt = addMesh(root, resources.torus('warrior-belt'), mBrightGold);
  belt.scale.set(0.36, 0.26, 0.07);
  belt.position.set(0, 0.38, 0.02);
  belt.rotation.x = Math.PI / 2;

  // Fluttering Crimson Mini-Cape
  const cape = addMesh(root, resources.cone('warrior-cape-mesh'), mDarkCape);
  cape.scale.set(0.70, 0.88, 0.14);
  cape.position.set(0, 0.46, -0.24);
  cape.rotation.x = 0.16;

  // Sculpted Rounded Golden Pauldrons
  for (const x of [-0.38, 0.38]) {
    const pauldron = addMesh(root, resources.sphere(`warrior-pauldron-${x}`), mNavySteel);
    pauldron.scale.set(0.24, 0.20, 0.24);
    pauldron.position.set(x, 0.64, 0.02);

    const pauldronCrest = addMesh(root, resources.cone(`warrior-pcrest-${x}`), mBrightGold);
    pauldronCrest.scale.set(0.09, 0.26, 0.16);
    pauldronCrest.position.set(x * 1.22, 0.74, 0.02);
    pauldronCrest.rotation.z = x < 0 ? 0.60 : -0.60;
  }

  // 2. Chibi Head, Expressive Face & Winged Tiara Helm
  const head = new THREE.Group();
  head.name = 'hero-head';
  head.position.set(0, 0.88, 0);

  const face = addMesh(head, resources.sphere('warrior-face'), mSkin);
  face.scale.set(0.58, 0.54, 0.52);

  // Cute blonde bangs peeking over brow
  const bangs = addMesh(head, resources.sphere('warrior-bangs'), mHairBlonde);
  bangs.scale.set(0.56, 0.22, 0.48);
  bangs.position.set(0, 0.18, 0.10);

  // Cute blonde side braids
  for (const dir of [-1, 1]) {
    const braid = addMesh(head, resources.cylinder(`warrior-braid-${dir}`), mHairBlonde);
    braid.scale.set(0.08, 0.26, 0.08);
    braid.position.set(dir * 0.26, -0.15, 0.08);
    braid.rotation.z = dir * -0.18;

    const ribbon = addMesh(head, resources.torus(`warrior-ribbon-${dir}`), mCrimsonCloth);
    ribbon.scale.setScalar(0.07);
    ribbon.position.set(dir * 0.28, -0.26, 0.08);
  }

  addBrawlStarsFace(head, resources, {
    irisColor: 0xf59e0b,
    irisKey: 'warrior-honey',
    pupilColor: 0x1e1b4b,
    skinColor: 0xfcd3b6,
    skinKey: 'warrior-skin',
    browColor: 0x78350f,
    browKey: 'warrior-brow',
    browTilt: 0.18,
    mouthTilt: -0.08,
    hasBlush: true,
    blushColor: 0xfb7185,
  });

  // Winged Valkyrie Helm
  const helmet = new THREE.Group();
  helmet.name = 'warrior-helmet';

  const tiaraBand = addMesh(helmet, resources.torus('warrior-tiara'), mBrightGold);
  tiaraBand.scale.set(0.42, 0.40, 0.08);
  tiaraBand.position.set(0, 0.12, 0.02);
  tiaraBand.rotation.x = Math.PI / 2;

  const tiaraRuby = addMesh(helmet, resources.octa('warrior-tiara-ruby'), resources.basicMaterial('warrior-ruby', 0xef4444));
  tiaraRuby.scale.setScalar(0.09);
  tiaraRuby.position.set(0, 0.16, 0.24);

  // Sweeping Golden Wings on Helmet
  for (const dir of [-1, 1]) {
    const wing = addMesh(helmet, resources.cone(`warrior-wing-${dir}`), mBrightGold);
    wing.scale.set(0.10, 0.42, 0.22);
    wing.position.set(dir * 0.32, 0.26, 0.02);
    wing.rotation.set(-0.20, 0, dir * 0.52);
  }

  // Crimson Plume trailing back
  const plume = addMesh(helmet, resources.box('warrior-plume'), mCrimsonCloth);
  plume.scale.set(0.10, 0.28, 0.44);
  plume.position.set(0, 0.36, -0.16);
  plume.rotation.x = -0.35;

  head.add(helmet);
  root.add(head);

  // 3. Short Punchy Arms with Golden Gauntlets
  const arms: THREE.Object3D[] = [];
  for (const x of [-0.38, 0.38]) {
    const arm = addMesh(root, resources.cylinder('warrior-arm'), mNavySteel);
    arm.scale.set(0.15, 0.40, 0.15);
    arm.position.set(x, 0.56, 0.02);
    arm.rotation.z = x < 0 ? -0.22 : 0.22;

    const gauntlet = addMesh(arm, resources.sphere('warrior-gauntlet'), mBrightGold);
    gauntlet.scale.set(0.16, 0.15, 0.16);
    gauntlet.position.set(0, -0.20, 0.04);

    arms.push(arm);
  }

  // 4. Short Chunky Legs with Armored Sabatons
  const legs: THREE.Group[] = [];
  for (const x of [-0.19, 0.19]) {
    const leg = createBrawlStarsLeg(root, resources, x, {
      pantMaterial: mNavySteel,
      bootMaterial: mNavySteel,
      soleMaterial: mBladeSteel,
      toeMaterial: mBrightGold,
      kneePad: true,
      kneePadMaterial: mBrightGold,
    });
    legs.push(leg);
  }

  // 5. Masterwork Oversized Runic Anime Broadsword
  const sword = addMesh(root, resources.box('warrior-sword'), mBladeSteel);
  sword.scale.set(0.18, 0.96, 0.06);
  sword.position.set(0.54, 0.56, 0.14);
  sword.rotation.z = -0.32;

  const swordRune = addMesh(sword, resources.box('warrior-sword-rune'), mCyanGlow);
  swordRune.scale.set(0.06, 0.72, 0.08);
  swordRune.position.set(0, 0.06, 0);

  const swordGuard = addMesh(sword, resources.box('warrior-sword-guard'), mBrightGold);
  swordGuard.scale.set(0.40, 0.08, 0.12);
  swordGuard.position.set(0, -0.42, 0);

  const swordPommel = addMesh(sword, resources.sphere('warrior-sword-pommel'), resources.basicMaterial('warrior-pommel-ruby', 0xef4444));
  swordPommel.scale.setScalar(0.10);
  swordPommel.position.set(0, -0.58, 0);

  // 6. Chunky Round Buckler Shield with Golden Star Boss
  const shield = addMesh(root, resources.cylinder('warrior-shield'), mNavySteel);
  shield.scale.set(0.42, 0.08, 0.42);
  shield.position.set(-0.48, 0.52, 0.15);
  shield.rotation.x = Math.PI / 2;

  const shieldRim = addMesh(shield, resources.torus('warrior-shield-rim'), mBrightGold);
  shieldRim.scale.set(0.40, 0.40, 0.06);

  const shieldBoss = addMesh(shield, resources.octa('warrior-shield-boss'), mBrightGold);
  shieldBoss.scale.setScalar(0.18);
  shieldBoss.position.set(0, 0.06, 0);

  root.userData.parts = {
    body,
    head,
    helmet,
    cape,
    arms,
    legs,
    sword,
    weapon: sword,
    shield,
  };
  return { root, aura, shadow };
}

// ----------------------------------------------------------------------------
// 3. MONK ("ZEN") — Chibi Shaolin Chi Brawler
// ----------------------------------------------------------------------------
export function createMonkVisual(resources: SharedResources): { root: THREE.Group; aura: THREE.Mesh; shadow: THREE.Mesh } {
  const root = new THREE.Group();
  root.name = 'hero-monk';
  root.userData.parts = {} as Record<string, THREE.Object3D | THREE.Object3D[]>;

  const shadow = resources.createContactShadow('hero-monk-shadow', 1, 1, 0.64);
  shadow.scale.set(1.05, 0.65, 1);
  shadow.position.y = 0.006;

  const aura = new THREE.Mesh(
    resources.ring('hero-monk-aura', 0.76, 0.88),
    resources.basicMaterial('hero-monk-aura', 0x10b981, { transparent: true, opacity: 0.65, side: THREE.DoubleSide, depthWrite: false }),
  );
  aura.rotation.x = -Math.PI / 2;
  aura.position.y = 0.014;

  const mJadeVest = resources.standardMaterial('brawler-monk-vest', 0x0f766e, { roughness: 0.75 });
  const mYellowSash = resources.standardMaterial('brawler-monk-sash', 0xfacc15, { roughness: 0.72 });
  const mWhiteWraps = resources.standardMaterial('brawler-monk-wraps', 0xf8fafc, { roughness: 0.85 });
  const mWarmSkin = resources.standardMaterial('brawler-monk-skin', 0xfbbf9e, { roughness: 0.75 });
  const mDarkHair = resources.standardMaterial('brawler-monk-hair', 0x18181b, { roughness: 0.90 });
  const mWoodBeads = resources.standardMaterial('brawler-monk-beads', 0x78350f, { roughness: 0.65 });
  const mChiJade = resources.standardMaterial('brawler-monk-chi', 0x34d399, { emissive: 0x059669, emissiveIntensity: 3.4, roughness: 0.12 });
  const mDarkShoes = resources.standardMaterial('brawler-monk-shoes', 0x1e293b, { roughness: 0.75 });

  // 1. Chunky Martial Torso & Open Jade Vest
  const body = addMesh(root, resources.cylinder('monk-body'), mWarmSkin);
  body.scale.set(0.58, 0.48, 0.46);
  body.position.y = 0.50;

  const vest = addMesh(root, resources.cylinder('monk-vest'), mJadeVest);
  vest.scale.set(0.60, 0.46, 0.44);
  vest.position.set(0, 0.52, -0.02);

  const vestTrim = addMesh(root, resources.torus('monk-vest-trim'), mYellowSash);
  vestTrim.scale.set(0.36, 0.28, 0.05);
  vestTrim.position.set(0, 0.52, 0.04);

  // Yellow Martial Sash Belt with Flowing Knot
  const sash = addMesh(root, resources.torus('monk-sash'), mYellowSash);
  sash.scale.set(0.38, 0.28, 0.10);
  sash.position.set(0, 0.38, 0);
  sash.rotation.x = Math.PI / 2;

  const sashTail = addMesh(root, resources.box('monk-sash-tail'), mYellowSash);
  sashTail.scale.set(0.12, 0.42, 0.04);
  sashTail.position.set(-0.12, 0.20, 0.22);
  sashTail.rotation.z = 0.18;

  // Carved Mala Prayer Bead Rosary
  const beadCollar = addMesh(root, resources.torus('monk-bead-collar'), mWoodBeads);
  beadCollar.scale.set(0.38, 0.28, 0.10);
  beadCollar.position.set(0, 0.68, 0.06);
  beadCollar.rotation.x = Math.PI / 2.2;

  // 2. Chibi Martial Head, Topknot & Dynamic Headband
  const head = new THREE.Group();
  head.name = 'hero-head';
  head.position.set(0, 0.88, 0);

  const face = addMesh(head, resources.sphere('monk-face'), mWarmSkin);
  face.scale.set(0.60, 0.56, 0.54);

  // Martial Black Topknot
  const topKnot = addMesh(head, resources.sphere('monk-topknot'), mDarkHair);
  topKnot.scale.setScalar(0.19);
  topKnot.position.set(0, 0.38, -0.04);

  const topKnotTie = addMesh(head, resources.torus('monk-topknot-tie'), mYellowSash);
  topKnotTie.scale.setScalar(0.11);
  topKnotTie.position.set(0, 0.32, -0.04);
  topKnotTie.rotation.x = Math.PI / 2;

  // Bright Yellow Martial Headband with Flowing Tails
  const headband = addMesh(head, resources.torus('monk-headband'), mYellowSash);
  headband.scale.set(0.42, 0.40, 0.07);
  headband.position.set(0, 0.12, 0.02);
  headband.rotation.x = Math.PI / 2;

  const ribbon1 = addMesh(head, resources.box('monk-ribbon-1'), mYellowSash);
  ribbon1.scale.set(0.08, 0.42, 0.03);
  ribbon1.position.set(-0.06, 0.06, -0.28);
  ribbon1.rotation.set(0.35, -0.15, 0.10);

  const ribbon2 = addMesh(head, resources.box('monk-ribbon-2'), mYellowSash);
  ribbon2.scale.set(0.07, 0.36, 0.03);
  ribbon2.position.set(0.06, 0.04, -0.26);
  ribbon2.rotation.set(0.28, 0.12, -0.08);

  addBrawlStarsFace(head, resources, {
    irisColor: 0x065f46,
    irisKey: 'monk-jade',
    pupilColor: 0x022c22,
    skinColor: 0xfbbf9e,
    skinKey: 'monk-skin',
    browColor: 0x18181b,
    browKey: 'monk-brow',
    browTilt: 0.18,
    mouthTilt: 0.06,
    hasBlush: true,
    blushColor: 0xfb7185,
  });

  root.add(head);

  // 3. Martial Arms with Oversized Boxing Wraps & Swirling Chi
  const arms: THREE.Object3D[] = [];
  for (const x of [-0.38, 0.38]) {
    const arm = addMesh(root, resources.cylinder('monk-arm'), mWarmSkin);
    arm.scale.set(0.16, 0.38, 0.16);
    arm.position.set(x, 0.54, 0.04);
    arm.rotation.z = x < 0 ? -0.20 : 0.20;

    const wrapWrist = addMesh(arm, resources.cylinder('monk-wrap-wrist'), mWhiteWraps);
    wrapWrist.scale.set(0.17, 0.20, 0.17);
    wrapWrist.position.set(0, -0.12, 0.02);

    const fist = addMesh(arm, resources.sphere('monk-fist'), mWhiteWraps);
    fist.scale.set(0.18, 0.16, 0.18);
    fist.position.set(0, -0.22, 0.04);

    const knuckleCrest = addMesh(arm, resources.box('monk-knuckle'), mChiJade);
    knuckleCrest.scale.set(0.14, 0.05, 0.06);
    knuckleCrest.position.set(0, -0.22, 0.12);

    arms.push(arm);
  }

  // Dual Swirling Jade Chi Chakras
  const chiL = addMesh(root, resources.torus('monk-chi-l-ring'), mChiJade);
  chiL.scale.setScalar(0.22);
  chiL.position.set(-0.42, 0.34, 0.14);
  chiL.rotation.x = Math.PI / 2;

  const chiOrbL = addMesh(chiL, resources.sphere('monk-chi-l-orb'), resources.basicMaterial('monk-chi-orb', 0x6ee7b7));
  chiOrbL.scale.setScalar(0.08);

  const chiR = addMesh(root, resources.torus('monk-chi-r-ring'), mChiJade);
  chiR.scale.setScalar(0.22);
  chiR.position.set(0.42, 0.34, 0.14);
  chiR.rotation.x = Math.PI / 2;

  const chiOrbR = addMesh(chiR, resources.sphere('monk-chi-r-orb'), resources.basicMaterial('monk-chi-orb', 0x6ee7b7));
  chiOrbR.scale.setScalar(0.08);

  // 4. Short Chunky Legs with Kung-Fu Slippers
  const legs: THREE.Group[] = [];
  for (const x of [-0.18, 0.18]) {
    const leg = createBrawlStarsLeg(root, resources, x, {
      pantMaterial: mWhiteWraps,
      bootMaterial: mDarkShoes,
      soleMaterial: resources.standardMaterial('chibi-kungfu-sole', 0xf8fafc, { roughness: 0.6 }),
      toeMaterial: mDarkShoes,
    });
    legs.push(leg);
  }

  root.userData.parts = {
    body,
    head,
    arms,
    legs,
    chiL,
    chiR,
    weapon: chiR,
  };
  return { root, aura, shadow };
}

// ----------------------------------------------------------------------------
// 4. GUNSLINGER ("ROXY") — Chibi Outlaw Cowgirl Brawler
// ----------------------------------------------------------------------------
export function createGunslingerVisual(resources: SharedResources): { root: THREE.Group; aura: THREE.Mesh; shadow: THREE.Mesh } {
  const root = new THREE.Group();
  root.name = 'hero-gunslinger';
  root.userData.parts = {} as Record<string, THREE.Object3D | THREE.Object3D[]>;

  const shadow = resources.createContactShadow('hero-gunslinger-shadow', 1, 1, 0.62);
  shadow.scale.set(1.05, 0.65, 1);
  shadow.position.y = 0.006;

  const aura = new THREE.Mesh(
    resources.ring('hero-gunslinger-aura', 0.74, 0.86),
    resources.basicMaterial('hero-gunslinger-aura', 0xc084fc, { transparent: true, opacity: 0.65, side: THREE.DoubleSide, depthWrite: false }),
  );
  aura.rotation.x = -Math.PI / 2;
  aura.position.y = 0.014;

  const mPlumVest = resources.standardMaterial('brawler-gun-vest', 0x581c87, { roughness: 0.65 });
  const mDeepCoat = resources.standardMaterial('brawler-gun-coat', 0x2e1065, { roughness: 0.75 });
  const mWhiteShirt = resources.standardMaterial('brawler-gun-shirt', 0xf8fafc, { roughness: 0.78 });
  const mLeather = resources.standardMaterial('brawler-gun-leather', 0x451a03, { roughness: 0.85 });
  const mSilver = resources.standardMaterial('brawler-gun-silver', 0xe2e8f0, { metalness: 0.90, roughness: 0.22 });
  const mBrass = resources.standardMaterial('brawler-gun-brass', 0xf59e0b, { metalness: 0.85, roughness: 0.28 });
  const mSkin = resources.standardMaterial('brawler-gun-skin', 0xfed7aa, { roughness: 0.75 });
  const mHairAuburn = resources.standardMaterial('brawler-gun-hair', 0x9a3412, { roughness: 0.80 });
  const mGunMetal = resources.standardMaterial('brawler-gun-metal', 0x18181b, { metalness: 0.85, roughness: 0.28 });
  const mArcaneCyan = resources.standardMaterial('brawler-gun-arcane', 0x22d3ee, { emissive: 0x06b6d4, emissiveIntensity: 3.2, roughness: 0.15 });

  // 1. Chunky Torso, Collared Shirt, Bandolier & Coat Tails
  const body = addMesh(root, resources.cylinder('gun-body'), mPlumVest);
  body.scale.set(0.56, 0.46, 0.44);
  body.position.y = 0.50;

  const shirt = addMesh(root, resources.box('gun-shirt'), mWhiteShirt);
  shirt.scale.set(0.32, 0.26, 0.10);
  shirt.position.set(0, 0.56, 0.18);

  const belt = addMesh(root, resources.torus('gun-belt'), mLeather);
  belt.scale.set(0.36, 0.26, 0.07);
  belt.position.set(0, 0.38, 0.02);
  belt.rotation.x = Math.PI / 2;

  const coatTail = addMesh(root, resources.box('gun-coat-tail'), mDeepCoat);
  coatTail.scale.set(0.46, 0.44, 0.07);
  coatTail.position.set(0, 0.34, -0.22);
  coatTail.rotation.x = 0.22;

  // Diagonal Ammo Bandolier with Shiny Brass Bullets
  const bandolier = addMesh(root, resources.cylinder('gun-bandolier'), mLeather);
  bandolier.scale.set(0.32, 0.52, 0.06);
  bandolier.position.set(0, 0.54, 0.18);
  bandolier.rotation.z = -0.65;

  for (let b = -2; b <= 2; b += 1) {
    const bullet = addMesh(root, resources.cylinder(`gun-bullet-${b}`), mBrass);
    bullet.scale.set(0.04, 0.10, 0.04);
    bullet.position.set(b * 0.07, 0.54 - b * 0.06, 0.22);
    bullet.rotation.z = 0.92;
  }

  // 2. Chibi Head, Auburn Pigtails & Wide Cowgirl Hat
  const head = new THREE.Group();
  head.name = 'hero-head';
  head.position.set(0, 0.88, 0);

  const face = addMesh(head, resources.sphere('gun-face'), mSkin);
  face.scale.set(0.58, 0.54, 0.52);

  // Auburn bangs
  const bangs = addMesh(head, resources.sphere('gun-bangs'), mHairAuburn);
  bangs.scale.set(0.56, 0.20, 0.46);
  bangs.position.set(0, 0.16, 0.10);

  // Bouncy Pigtails
  for (const dir of [-1, 1]) {
    const pigtail = addMesh(head, resources.cone(`gun-pigtail-${dir}`), mHairAuburn);
    pigtail.scale.set(0.12, 0.32, 0.12);
    pigtail.position.set(dir * 0.30, -0.06, -0.02);
    pigtail.rotation.set(-0.25, 0, dir * 0.42);

    const tie = addMesh(head, resources.torus(`gun-tie-${dir}`), mPlumVest);
    tie.scale.setScalar(0.07);
    tie.position.set(dir * 0.28, 0.06, -0.02);
  }

  addBrawlStarsFace(head, resources, {
    irisColor: 0xd946ef,
    irisKey: 'gun-magenta',
    pupilColor: 0x4a044e,
    skinColor: 0xfed7aa,
    skinKey: 'gun-skin',
    browColor: 0x9a3412,
    browKey: 'gun-brow',
    browTilt: 0.14,
    mouthTilt: -0.06,
    hasBlush: true,
    blushColor: 0xfb7185,
    hasFreckles: true,
  });

  // Oversized Cowgirl Duster Hat with Sheriff Star
  const hatBrim = addMesh(head, resources.cylinder('gun-hat-brim'), mLeather);
  hatBrim.scale.set(1.02, 0.05, 0.98);
  hatBrim.position.set(0, 0.18, 0.02);
  hatBrim.rotation.x = -0.08;

  const hatCrown = addMesh(head, resources.cylinder('gun-hat-crown'), mLeather);
  hatCrown.scale.set(0.46, 0.28, 0.46);
  hatCrown.position.set(0, 0.32, -0.01);
  hatCrown.rotation.x = -0.08;

  const hatBand = addMesh(head, resources.torus('gun-hat-band'), mSilver);
  hatBand.scale.set(0.35, 0.35, 0.05);
  hatBand.position.set(0, 0.21, 0);
  hatBand.rotation.x = Math.PI / 2 - 0.08;

  const sheriffStar = addMesh(head, resources.octa('gun-sheriff-star'), mBrass);
  sheriffStar.scale.setScalar(0.10);
  sheriffStar.position.set(0, 0.24, 0.22);

  root.add(head);

  // 3. Arms in Twin Gunslinger Stance
  const arms: THREE.Object3D[] = [];
  for (const x of [-0.34, 0.34]) {
    const arm = addMesh(root, resources.cylinder('gun-arm'), mWhiteShirt);
    arm.scale.set(0.14, 0.36, 0.14);
    arm.position.set(x, 0.54, 0.04);
    arm.rotation.x = 0.38;
    arm.rotation.z = x < 0 ? -0.15 : 0.15;

    const glove = addMesh(arm, resources.sphere('gun-glove'), mLeather);
    glove.scale.set(0.13, 0.12, 0.13);
    glove.position.set(0, -0.18, 0.04);

    arms.push(arm);
  }

  // 4. Dual Oversized Chunky Hextech Revolvers
  const createRevolver = (xPos: number, side: 'r' | 'l') => {
    const pistol = addMesh(root, resources.box(`gun-pistol-${side}`), mGunMetal);
    pistol.scale.set(0.09, 0.20, 0.40);
    pistol.position.set(xPos, 0.52, 0.26);

    const chamber = addMesh(pistol, resources.cylinder(`gun-chamber-${side}`), mArcaneCyan);
    chamber.scale.set(0.09, 0.14, 0.09);
    chamber.position.set(0, 0.04, -0.02);
    chamber.rotation.x = Math.PI / 2;

    const muzzle = addMesh(pistol, resources.cylinder(`gun-muzzle-${side}`), mGunMetal);
    muzzle.scale.set(0.05, 0.16, 0.05);
    muzzle.position.set(0, 0.05, 0.20);
    muzzle.rotation.x = Math.PI / 2;

    const muzzleGlow = addMesh(pistol, resources.torus(`gun-glow-${side}`), mArcaneCyan);
    muzzleGlow.scale.setScalar(0.06);
    muzzleGlow.position.set(0, 0.05, 0.28);
    muzzleGlow.rotation.x = Math.PI / 2;

    const handle = addMesh(pistol, resources.box(`gun-handle-${side}`), mSilver);
    handle.scale.set(0.08, 0.16, 0.10);
    handle.position.set(0, -0.10, -0.10);
    handle.rotation.x = -0.32;

    return pistol;
  };

  const pistolR = createRevolver(0.42, 'r');
  const pistolL = createRevolver(-0.42, 'l');

  // 5. Short Chunky Legs with Spurred Cowgirl Boots
  const legs: THREE.Group[] = [];
  for (const x of [-0.18, 0.18]) {
    const leg = createBrawlStarsLeg(root, resources, x, {
      pantMaterial: resources.standardMaterial('brawler-gun-pants', 0x1e3a8a, { roughness: 0.85 }),
      bootMaterial: mLeather,
      soleMaterial: resources.standardMaterial('chibi-gun-sole', 0xf8fafc, { roughness: 0.6 }),
      toeMaterial: resources.standardMaterial('chibi-gun-toe', 0x78350f, { roughness: 0.75 }),
      hasSpurs: true,
      spurMaterial: mSilver,
    });
    legs.push(leg);
  }

  root.userData.parts = {
    body,
    head,
    arms,
    legs,
    coatTail,
    weapon: pistolR,
    pistolR,
    pistolL,
  };
  return { root, aura, shadow };
}

export function createHeroVisual(heroId: string = 'shadow', resources: SharedResources): { root: THREE.Group; aura: THREE.Mesh; shadow: THREE.Mesh } {
  if (heroId === 'warrior') return createWarriorVisual(resources);
  if (heroId === 'monk') return createMonkVisual(resources);
  if (heroId === 'gunslinger') return createGunslingerVisual(resources);
  return createShadowMage(resources);
}

function addEyes(root: THREE.Group, resources: SharedResources, color: number, y = 1.08): void {
  const mSclera = resources.standardMaterial('enemy-goofy-sclera', 0xf8fafc, { roughness: 0.25 });
  const mPupil = resources.basicMaterial(`enemy-goofy-pupil-${color}`, color);
  const mGlint = resources.basicMaterial('enemy-goofy-glint', 0xffffff);

  for (const x of [-0.16, 0.16]) {
    // 1. Sclera
    const sclera = addMesh(root, resources.sphere('enemy-eye-sclera'), mSclera);
    sclera.scale.set(0.11, 0.12, 0.08);
    sclera.position.set(x, y, 0.45);

    // 2. Comic Pupil
    const pupil = addMesh(root, resources.sphere('enemy-eye-pupil'), mPupil);
    pupil.scale.set(0.06, 0.06, 0.04);
    pupil.position.set(x, y - 0.01, 0.51);

    // 3. Glint
    const glint = addMesh(root, resources.sphere('enemy-eye-glint'), mGlint);
    glint.scale.setScalar(0.025);
    glint.position.set(x + 0.025, y + 0.025, 0.53);
  }
}

export function createEnemyModel(kind: string, color: number, resources: SharedResources, worldId = 1): THREE.Group {
  let root: THREE.Group;
  if (kind === 'skeleton') {
    root = buildStylizedSkeleton(resources, worldId);
  } else if (kind === 'zombie') {
    root = buildStylizedZombie(resources);
  } else if (kind === 'bat') {
    root = buildStylizedBat(resources);
  } else if (kind === 'slime') {
    root = buildStylizedSlime(resources);
  } else if (kind === 'ghost') {
    root = buildStylizedGhost(resources, color);
  } else if (kind === 'archer') {
    root = buildStylizedArcher(resources);
  } else if (kind === 'knight') {
    root = buildStylizedKnight(resources);
  } else if (kind === 'demon') {
    root = buildStylizedDemon(resources, false);
  } else if (kind === 'imp') {
    root = buildStylizedImp(resources);
  } else if (kind === 'bone-mage') {
    root = buildStylizedBoneMage(resources);
  } else if (kind === 'demon-warrior') {
    root = buildStylizedDemon(resources, true);
  } else if (kind === 'cursed-wolf') {
    root = buildStylizedCursedWolf(resources);
  } else if (kind === 'thornling') {
    root = buildStylizedThornling(resources);
  } else if (kind === 'forest-mage') {
    root = buildStylizedForestMage(resources);
  } else if (kind === 'forest-guardian') {
    root = buildStylizedForestGuardian(resources);
  } else if (kind === 'treant') {
    root = buildStylizedTreant(resources);
  } else if (kind === 'frost-wraith') {
    root = buildStylizedFrostWraith(resources);
  } else if (kind === 'ice-mage') {
    root = buildStylizedIceMage(resources);
  } else {
    root = buildStylizedSkeleton(resources, worldId);
  }

  if (worldId !== 1) {
    const worldAccent = worldId === 2 ? 0xb875df : worldId === 3 ? 0x9ce7ff : worldId === 4 ? 0xff5e55 : 0x5ddcff;
    const rune = addMesh(
      root,
      resources.torus(`enemy-world-rune-${kind}-${worldId}`),
      resources.basicMaterial(`enemy-world-rune-${kind}-${worldId}`, worldAccent, { transparent: true, opacity: 0.65, side: THREE.DoubleSide })
    );
    rune.scale.setScalar(kind === 'knight' || kind === 'forest-guardian' || kind === 'treant' || kind === 'demon-warrior' ? 0.54 : 0.38);
    rune.rotation.x = Math.PI / 2;
    rune.position.y = kind === 'ghost' || kind === 'frost-wraith' || kind === 'bat' ? 0.34 : 0.12;
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
  if (bossId !== 'skeleton-king') return createAlternativeBossModel(bossId, resources);
  return createSkeletonKingModel(resources);
}

function createSkeletonKingModel(resources: SharedResources): { root: THREE.Group; aura: THREE.Mesh; shadow: THREE.Mesh } {
  const root = new THREE.Group();
  root.name = 'skeleton-king';
  const parts: Record<string, THREE.Object3D | THREE.Object3D[]> = {};

  const shadow = resources.createContactShadow('boss-shadow', 1, 1, 0.75);
  shadow.scale.set(2.5, 1.45, 1);
  shadow.position.y = 0.008;
  root.add(shadow);

  const aura = addMesh(root, resources.ring('boss-aura', 1.15, 1.3), resources.basicMaterial('boss-aura', 0xff4e62, { transparent: true, opacity: 0.52, side: THREE.DoubleSide }));
  aura.rotation.x = -Math.PI / 2;
  aura.position.y = 0.04;

  const skullMat = new THREE.MeshStandardMaterial({
    map: getSkeletonSkullTexture(),
    roughness: 0.60,
    metalness: 0.15,
  });
  const armorMat = resources.standardMaterial('boss-skel-armor', 0x18202c, { metalness: 0.78, roughness: 0.35 });
  const goldMat = resources.standardMaterial('boss-skel-gold', 0xd97706, { metalness: 0.85, roughness: 0.28, emissive: 0x78350f, emissiveIntensity: 0.3 });
  const capeMat = resources.standardMaterial('boss-skel-cape', 0x881337, { roughness: 0.82 });
  const rubyMat = resources.standardMaterial('boss-skel-ruby', 0xef4444, { emissive: 0xdc2626, emissiveIntensity: 3.2, roughness: 0.15 });

  // 1. Billowing Royal Velvet Mantle
  const cape = addMesh(root, resources.cone('boss-cape'), capeMat);
  cape.scale.set(1.65, 2.1, 0.24);
  cape.position.set(0, 1.25, -0.42);
  cape.rotation.x = 0.12;

  // 2. Imperial Gothic Plate Cuirass & Trapped Soul Cage
  const armor = addMesh(root, resources.cylinder('boss-armor'), armorMat);
  armor.scale.set(1.32, 1.55, 0.98);
  armor.position.y = 1.28;

  const chest = addMesh(root, resources.box('boss-chest'), goldMat);
  chest.scale.set(1.15, 0.78, 0.32);
  chest.position.set(0, 1.48, 0.42);

  // Swirling Crimson Soul Core in Chest
  const soulCore = addMesh(root, resources.octa('boss-soul-core'), rubyMat);
  soulCore.scale.setScalar(0.35);
  soulCore.position.set(0, 1.48, 0.46);

  // Ornate Double-Tiered Pauldrons with Gold Crests
  for (const dir of [-1, 1]) {
    const pauldron = addMesh(root, resources.sphere(`boss-pauldron-${dir}`), armorMat);
    pauldron.scale.set(0.62, 0.45, 0.58);
    pauldron.position.set(dir * 1.15, 1.78, 0.05);

    const pauldronSpike = addMesh(root, resources.cone(`boss-pspike-${dir}`), goldMat);
    pauldronSpike.scale.set(0.18, 0.65, 0.18);
    pauldronSpike.position.set(dir * 1.35, 2.12, 0.05);
    pauldronSpike.rotation.z = dir * -0.45;
  }

  // 3. Skull & Jaw with Textured Cranium and Crimson Soul Eyes
  const skull = addMesh(root, resources.sphere('boss-skull'), skullMat);
  skull.scale.set(1.15, 1.05, 1.05);
  skull.position.set(0, 2.56, 0.06);

  const jaw = addMesh(root, resources.box('boss-jaw'), resources.standardMaterial('boss-jaw-bone', 0xc5d5e2, { roughness: 0.75 }));
  jaw.scale.set(0.88, 0.34, 0.65);
  jaw.position.set(0, 1.98, 0.26);

  for (const x of [-0.34, 0.34]) {
    const eye = addMesh(root, resources.box('boss-eye'), rubyMat);
    eye.scale.set(0.20, 0.18, 0.08);
    eye.position.set(x, 2.58, 0.62);
  }

  // 4. Gilded Gothic Crown with 5 Blood Ruby Spikes
  for (const x of [-0.6, -0.3, 0, 0.3, 0.6]) {
    const point = addMesh(root, resources.cone('boss-crown-point'), goldMat);
    point.scale.set(0.18, 0.72, 0.18);
    point.position.set(x, 3.32 - Math.abs(x) * 0.14, 0.04);
    point.rotation.z = x * -0.25;

    const ruby = addMesh(root, resources.octa('boss-ruby-jewel'), rubyMat);
    ruby.scale.setScalar(0.11);
    ruby.position.set(x, 3.06, 0.24);
  }

  // 5. Colossal Zweihander Greatsword with Runic Blood Fuller
  const sword = addMesh(root, resources.box('boss-sword'), armorMat);
  sword.scale.set(0.26, 2.6, 0.12);
  sword.position.set(1.65, 1.45, 0.1);
  sword.rotation.z = -0.35;

  const swordRune = addMesh(root, resources.box('boss-sword-rune'), rubyMat);
  swordRune.scale.set(0.09, 2.2, 0.14);
  swordRune.position.set(1.65, 1.45, 0.1);
  swordRune.rotation.z = -0.35;

  const hilt = addMesh(root, resources.box('boss-hilt'), goldMat);
  hilt.scale.set(0.85, 0.18, 0.22);
  hilt.position.set(1.38, 0.65, 0.1);
  hilt.rotation.z = -0.35;

  // 6. Articulated Dark Steel Greaves & Sabatons
  const legs: THREE.Group[] = [];
  for (const x of [-0.42, 0.42]) {
    const legGroup = new THREE.Group();
    legGroup.position.set(x, 0.68, 0);

    const greave = addMesh(legGroup, resources.cylinder('boss-skel-greave'), armorMat);
    greave.scale.set(0.28, 0.72, 0.28);
    greave.position.set(0, -0.32, 0.02);

    const sabaton = addMesh(legGroup, resources.box('boss-skel-sabaton'), armorMat);
    sabaton.scale.set(0.36, 0.24, 0.52);
    sabaton.position.set(0, -0.62, 0.12);

    root.add(legGroup);
    legs.push(legGroup);
  }

  parts.armor = armor;
  parts.chest = chest;
  parts.cape = cape;
  parts.skull = skull;
  parts.sword = sword;
  parts.weapon = sword;
  parts.core = soulCore;
  parts.legs = legs;
  root.userData.parts = parts;
  return { root, aura, shadow };
}

function createAlternativeBossModel(bossId: Exclude<BossId, 'skeleton-king'>, resources: SharedResources): { root: THREE.Group; aura: THREE.Mesh; shadow: THREE.Mesh } {
  const root = new THREE.Group();
  root.name = bossId;
  const parts: Record<string, THREE.Object3D | THREE.Object3D[]> = {};

  const shadow = resources.createContactShadow(`boss-shadow-${bossId}`, 1, 1, 0.76);
  shadow.scale.set(2.6, 1.55, 1);
  shadow.position.y = 0.008;
  root.add(shadow);

  if (bossId === 'forest-witch') {
    const aura = addMesh(root, resources.ring('boss-aura-fw', 1.15, 1.34), resources.basicMaterial('boss-aura-fw', 0x9df18e, { transparent: true, opacity: 0.54, side: THREE.DoubleSide }));
    aura.rotation.x = -Math.PI / 2;
    aura.position.y = 0.04;

    const cloakMat = new THREE.MeshStandardMaterial({
      map: getBrambleClothTexture(),
      roughness: 0.90,
      metalness: 0.08,
    });
    const mBark = resources.standardMaterial('witch-bark', 0x3a2316, { roughness: 0.96 });
    const mDarkWood = resources.standardMaterial('witch-wood', 0x1e120b, { roughness: 0.95 });
    const mVioletMagic = resources.standardMaterial('witch-violet', 0xc084fc, {
      emissive: 0xa855f7,
      emissiveIntensity: 3.0,
      roughness: 0.2,
    });
    const mEmeraldCore = resources.standardMaterial('witch-emerald-core', 0x34d399, {
      emissive: 0x10b981,
      emissiveIntensity: 3.2,
      roughness: 0.15,
    });

    // Layered Ceremonial Bramble Robes
    const cloak = addMesh(root, resources.cone('witch-cloak'), cloakMat);
    cloak.scale.set(1.35, 1.85, 0.92);
    cloak.position.y = 1.12;

    const hood = addMesh(root, resources.cone('witch-hood'), mDarkWood);
    hood.scale.set(0.95, 0.95, 0.90);
    hood.position.set(0, 2.22, 0);

    // Carved Owl-Visage Elder Mask with Glowing Violet Eyes
    const mask = addMesh(root, resources.box('witch-mask'), mBark);
    mask.scale.set(0.55, 0.52, 0.38);
    mask.position.set(0, 2.18, 0.28);

    for (const x of [-0.18, 0.18]) {
      const eye = addMesh(root, resources.box('witch-eye'), mVioletMagic);
      eye.scale.set(0.12, 0.05, 0.04);
      eye.position.set(x, 2.22, 0.48);
    }

    // Majestic 6-Tined Elder Stag Antlers
    const antlers: THREE.Object3D[] = [];
    for (const dir of [-1, 1]) {
      const mainBeam = addMesh(root, resources.cone(`witch-antler-${dir}`), mBark);
      mainBeam.scale.set(0.18, 1.25, 0.18);
      mainBeam.position.set(dir * 0.55, 2.95, 0.02);
      mainBeam.rotation.set(-0.25, 0, dir * 0.38);
      antlers.push(mainBeam);

      const fork1 = addMesh(root, resources.cone(`witch-antler-f1-${dir}`), mBark);
      fork1.scale.set(0.11, 0.65, 0.11);
      fork1.position.set(dir * 0.85, 3.25, -0.08);
      fork1.rotation.set(0.35, 0, dir * 0.68);
      antlers.push(fork1);

      const wisp = addMesh(root, resources.sphere(`witch-wisp-${dir}`), mEmeraldCore);
      wisp.scale.setScalar(0.14);
      wisp.position.set(dir * 0.95, 3.10, 0.15);
    }

    // Gnarled Elderwood Staff with Pulsating Living Blossom Core
    const staff = addMesh(root, resources.cylinder('witch-staff'), mBark);
    staff.scale.set(0.10, 2.1, 0.10);
    staff.position.set(1.25, 1.35, 0.08);
    staff.rotation.z = -0.22;

    const core = addMesh(root, resources.octa('witch-core'), mEmeraldCore);
    core.scale.setScalar(0.48);
    core.position.set(1.48, 2.32, 0.08);

    parts.cloak = cloak;
    parts.hood = hood;
    parts.antlers = antlers;
    parts.staff = staff;
    parts.weapon = staff;
    parts.core = core;
    root.userData.parts = parts;
    return { root, aura, shadow };
  }

  if (bossId === 'frost-golem') {
    const aura = addMesh(root, resources.ring('boss-aura-fg', 1.15, 1.34), resources.basicMaterial('boss-aura-fg', 0x77ddff, { transparent: true, opacity: 0.54, side: THREE.DoubleSide }));
    aura.rotation.x = -Math.PI / 2;
    aura.position.y = 0.04;

    const permafrostMat = new THREE.MeshStandardMaterial({
      map: getIceRimeTexture(),
      roughness: 0.18,
      metalness: 0.22,
    });
    const mGlacialStone = resources.standardMaterial('golem-glacier', 0x47637d, { roughness: 0.68, metalness: 0.18 });
    const mPureIce = resources.standardMaterial('golem-ice-pure', 0xe0f2fe, {
      emissive: 0x38bdf8,
      emissiveIntensity: 1.8,
      roughness: 0.12,
      metalness: 0.25,
    });
    const mDeepCore = resources.standardMaterial('golem-deep-core', 0x0284c7, {
      emissive: 0x38bdf8,
      emissiveIntensity: 3.5,
      roughness: 0.1,
    });

    // Massive Glacial Titan Torso
    const body = addMesh(root, resources.cylinder('golem-body'), permafrostMat);
    body.scale.set(1.52, 1.72, 1.15);
    body.position.y = 1.32;

    // Stone Armor Backing
    const backPlates = addMesh(root, resources.box('golem-back-plates'), mGlacialStone);
    backPlates.scale.set(1.35, 1.55, 0.42);
    backPlates.position.set(0, 1.35, -0.45);

    // Giant Spiked Glacial Pauldrons
    const shoulders: THREE.Object3D[] = [];
    for (const x of [-1.22, 1.22]) {
      const shoulder = addMesh(root, resources.ico('golem-shoulder'), permafrostMat);
      shoulder.scale.set(0.72, 0.88, 0.72);
      shoulder.position.set(x, 1.85, 0);
      shoulders.push(shoulder);

      const stalagmite = addMesh(root, resources.cone('golem-stalagmite'), mPureIce);
      stalagmite.scale.set(0.24, 0.95, 0.24);
      stalagmite.position.set(x * 1.12, 2.45, 0);
      stalagmite.rotation.z = x < 0 ? 0.32 : -0.32;
    }

    // Heavy Chiseled Glacial Fists
    const arms: THREE.Object3D[] = [];
    for (const x of [-1.25, 1.25]) {
      const arm = addMesh(root, resources.cylinder('golem-arm'), mGlacialStone);
      arm.scale.set(0.46, 1.32, 0.46);
      arm.position.set(x, 0.88, 0.02);
      arm.rotation.z = x < 0 ? -0.18 : 0.18;
      arms.push(arm);

      const fist = addMesh(root, resources.box('golem-fist'), permafrostMat);
      fist.scale.set(0.55, 0.45, 0.65);
      fist.position.set(x * 1.08, 0.22, 0.12);
    }

    // Pulsating Glacial Heart Core
    const core = addMesh(root, resources.octa('golem-core'), mDeepCore);
    core.scale.setScalar(0.55);
    core.position.set(0, 1.45, 0.68);

    // Chiseled Glacial Crown & Slit Eyes
    const crown = addMesh(root, resources.octa('golem-crown'), mPureIce);
    crown.scale.set(0.68, 0.52, 0.58);
    crown.position.y = 2.62;

    for (const x of [-0.22, 0.22]) {
      const eye = addMesh(root, resources.box('golem-eye'), mDeepCore);
      eye.scale.set(0.14, 0.05, 0.05);
      eye.position.set(x, 2.58, 0.32);
    }

    // Sturdy Glacier Column Legs
    const golemLegs: THREE.Group[] = [];
    for (const x of [-0.55, 0.55]) {
      const legGroup = new THREE.Group();
      legGroup.position.set(x, 0.72, 0);

      const col = addMesh(legGroup, resources.cylinder('boss-golem-leg'), mGlacialStone);
      col.scale.set(0.48, 0.78, 0.48);
      col.position.set(0, -0.34, 0);

      const foot = addMesh(legGroup, resources.box('boss-golem-foot'), permafrostMat);
      foot.scale.set(0.58, 0.26, 0.72);
      foot.position.set(0, -0.65, 0.10);

      root.add(legGroup);
      golemLegs.push(legGroup);
    }

    parts.body = body;
    parts.shoulders = shoulders;
    parts.arms = arms;
    parts.core = core;
    parts.weapon = crown;
    parts.legs = golemLegs;
    root.userData.parts = parts;
    return { root, aura, shadow };
  }

  // 'demon-lord'
  const aura = addMesh(root, resources.ring('boss-aura-dl', 1.15, 1.34), resources.basicMaterial('boss-aura-dl', 0xff5f4f, { transparent: true, opacity: 0.54, side: THREE.DoubleSide }));
  aura.rotation.x = -Math.PI / 2;
  aura.position.y = 0.04;

  const lavaMat = new THREE.MeshStandardMaterial({
    map: getDemonLavaTexture(),
    roughness: 0.55,
    metalness: 0.35,
  });
  const mBasalt = resources.standardMaterial('dl-basalt', 0x1f0b12, { roughness: 0.88 });
  const mHorn = resources.standardMaterial('dl-horn', 0x120509, { roughness: 0.42, metalness: 0.25 });
  const mFireCore = resources.standardMaterial('dl-core', 0xff5722, {
    emissive: 0xef4444,
    emissiveIntensity: 3.5,
    roughness: 0.15,
  });
  const mBladeEdge = resources.standardMaterial('dl-blade', 0xf59e0b, {
    emissive: 0xd97706,
    emissiveIntensity: 2.5,
    metalness: 0.75,
    roughness: 0.25,
  });

  // Massive Molten Basalt Cuirass
  const armor = addMesh(root, resources.cylinder('demon-lord-armor'), lavaMat);
  armor.scale.set(1.52, 1.65, 1.10);
  armor.position.y = 1.32;

  // Blazing Volcano Core
  const core = addMesh(root, resources.octa('demon-lord-core'), mFireCore);
  core.scale.setScalar(0.52);
  core.position.set(0, 1.48, 0.65);

  // Colossal Sweeping Curved Horns
  const horns: THREE.Object3D[] = [];
  for (const dir of [-1, 1]) {
    const horn = addMesh(root, resources.cone(`dl-horn-${dir}`), mHorn);
    horn.scale.set(0.32, 1.45, 0.32);
    horn.position.set(dir * 0.72, 2.92, -0.04);
    horn.rotation.set(-0.35, 0, dir * 0.48);
    horns.push(horn);

    const hornTip = addMesh(root, resources.cone(`dl-horntip-${dir}`), mHorn);
    hornTip.scale.set(0.18, 0.75, 0.18);
    hornTip.position.set(dir * 1.15, 3.75, -0.18);
    hornTip.rotation.set(-0.55, 0, dir * 0.82);
    horns.push(hornTip);
  }

  // Ragged Demonic Arch-Bat Wings
  const wings: THREE.Object3D[] = [];
  for (const dir of [-1, 1]) {
    const wing = addMesh(root, resources.cone(`dl-wing-${dir}`), mBasalt);
    wing.scale.set(1.45, 1.85, 0.18);
    wing.position.set(dir * 1.38, 1.95, -0.32);
    wing.rotation.set(0, 0, dir * 0.42);
    wings.push(wing);
  }

  // Giant Brimstone Executioner Greatsword
  const weapon = addMesh(root, resources.box('demon-lord-weapon'), mBasalt);
  weapon.scale.set(0.24, 2.4, 0.14);
  weapon.position.set(1.72, 1.35, 0.10);
  weapon.rotation.z = -0.42;

  const weaponEdge = addMesh(root, resources.box('demon-lord-weapon-edge'), mBladeEdge);
  weaponEdge.scale.set(0.08, 2.1, 0.18);
  weaponEdge.position.set(1.72, 1.35, 0.10);
  weaponEdge.rotation.z = -0.42;

  // Head & Fiery Eyes
  const head = addMesh(root, resources.sphere('demon-lord-head'), mBasalt);
  head.scale.set(0.72, 0.68, 0.65);
  head.position.set(0, 2.38, 0.15);

  for (const x of [-0.22, 0.22]) {
    const eye = addMesh(root, resources.box('demon-eye'), mFireCore);
    eye.scale.set(0.14, 0.06, 0.05);
    eye.position.set(x, 2.42, 0.52);
  }

  // Heavy Digitigrade Legs & Lava Hooves
  const demonLegs: THREE.Group[] = [];
  for (const x of [-0.48, 0.48]) {
    const legGroup = new THREE.Group();
    legGroup.position.set(x, 0.68, 0);

    const thigh = addMesh(legGroup, resources.cylinder('boss-demon-thigh'), mBasalt);
    thigh.scale.set(0.35, 0.72, 0.35);
    thigh.position.set(0, -0.32, 0.02);

    const hoof = addMesh(legGroup, resources.box('boss-demon-hoof'), mFireCore);
    hoof.scale.set(0.46, 0.26, 0.58);
    hoof.position.set(0, -0.65, 0.10);

    root.add(legGroup);
    demonLegs.push(legGroup);
  }

  parts.armor = armor;
  parts.horns = horns;
  parts.wings = wings;
  parts.weapon = weapon;
  parts.sword = weapon;
  parts.core = core;
  parts.legs = demonLegs;
  root.userData.parts = parts;
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

  // Grounded soft contact shadow for pet
  const petShadow = resources.createContactShadow(`pet-shadow-${petId}`, 0.6, 0.6, 0.48);
  petShadow.scale.set(0.68, 0.45, 1);
  group.add(petShadow);

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
