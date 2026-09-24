import * as THREE from 'three';
import type { EnemyKind } from '../../types';
import { SharedResources, addMesh } from '../core/SharedResources';
import {
  getSkeletonSkullTexture,
  getZombieSkinTexture,
  getZombieFaceTexture,
  getShieldTexture,
  getTornClothTexture,
  getDemonLavaTexture,
  getKnightShieldTexture,
  getGothicArmorTexture,
  getNecroRobeTexture,
  getCursedWolfTexture,
  getTreantBarkTexture,
  getIceRimeTexture,
  getBrambleClothTexture,
} from './MonsterSkins';


/**
 * Helper to add expressive, goofy Supercell / Brawl Stars cartoon googly eyes to any monster.
 */
export function addGoofyMonsterEyes(
  headGroup: THREE.Group,
  resources: SharedResources,
  options: {
    y?: number;
    z?: number;
    spacing?: number;
    size?: number;
    pupilColor?: number;
    scleraColor?: number;
    derpy?: boolean;
    pupilScale?: number;
  } = {}
): void {
  const y = options.y ?? 0.08;
  const z = options.z ?? 0.34;
  const spacing = options.spacing ?? 0.16;
  const baseSize = options.size ?? 0.13;
  const derpy = options.derpy ?? false;
  const scleraColor = options.scleraColor ?? 0xf8fafc;
  const pupilColor = options.pupilColor ?? 0x0f172a;
  const pupilScale = options.pupilScale ?? 0.52;

  const mSclera = resources.standardMaterial(`goofy-sclera-${scleraColor}`, scleraColor, { roughness: 0.25 });
  const mPupil = resources.basicMaterial(`goofy-pupil-${pupilColor}`, pupilColor);
  const mGlint = resources.basicMaterial('goofy-eye-glint', 0xffffff);

  for (const dir of [-1, 1]) {
    const scaleMultiplier = derpy && dir > 0 ? 0.72 : 1.0;
    const eyeSize = baseSize * scaleMultiplier;
    const eyeX = dir * spacing;
    const eyeY = y + (derpy && dir > 0 ? -0.025 : 0);

    // 1. Sclera (eyeball white)
    const sclera = addMesh(headGroup, resources.sphere('goofy-monster-sclera'), mSclera);
    sclera.scale.set(eyeSize, eyeSize * 1.08, eyeSize * 0.85);
    sclera.position.set(eyeX, eyeY, z);

    // 2. Comic Pupil
    const pupil = addMesh(headGroup, resources.sphere('goofy-monster-pupil'), mPupil);
    pupil.scale.set(eyeSize * pupilScale, eyeSize * pupilScale, eyeSize * 0.35);
    const pupilOffsetX = derpy ? (dir > 0 ? 0.02 : -0.02) : 0;
    pupil.position.set(eyeX + pupilOffsetX, eyeY - 0.01, z + eyeSize * 0.65);

    // 3. Specular Glint
    const glint = addMesh(headGroup, resources.sphere('goofy-monster-glint'), mGlint);
    glint.scale.setScalar(eyeSize * 0.25);
    glint.position.set(eyeX + eyeSize * 0.18, eyeY + eyeSize * 0.22, z + eyeSize * 0.78);
  }
}
export function buildStylizedSkeleton(resources: SharedResources, worldId = 1): THREE.Group {
  const root = new THREE.Group();
  root.name = 'stylized-skeleton';
  const parts: Record<string, THREE.Object3D | THREE.Object3D[]> = {};
  const legs: THREE.Group[] = [];
  const arms: THREE.Object3D[] = [];

  const mBone = resources.standardMaterial('monster-bone-clean', 0xe2edf5, {
    roughness: 0.65,
    metalness: 0.12,
  });
  const mDarkBone = resources.standardMaterial('monster-bone-dark', 0x93a8b8, {
    roughness: 0.85,
  });
  const mIron = resources.standardMaterial('monster-iron-rust', 0x2e3b48, {
    metalness: 0.72,
    roughness: 0.38,
  });
  const mSoulEye = resources.standardMaterial('monster-soul-eye', 0x38bdf8, {
    emissive: 0x38bdf8,
    emissiveIntensity: 3.2,
    roughness: 0.1,
  });

  // 1. Skull & Grinning Jaw tilted directly upward toward overhead camera
  const skullGroup = new THREE.Group();
  skullGroup.position.set(0, 1.42, 0.06);
  skullGroup.rotation.x = -0.32; // Strong tilt upward toward camera

  // Cranium with skull texture
  const skullMat = new THREE.MeshStandardMaterial({
    map: getSkeletonSkullTexture(),
    roughness: 0.60,
    metalness: 0.12,
  });
  const cranium = addMesh(skullGroup, resources.sphere('skel-cranium'), skullMat);
  cranium.scale.set(0.64, 0.66, 0.62);
  cranium.position.set(0, 0, 0);

  // Large sweeping demonic bone ram horns curving out and up
  for (const dir of [-1, 1]) {
    const horn = addMesh(skullGroup, resources.cone(`skel-horn-${dir}`), mBone);
    horn.scale.set(0.16, 0.75, 0.16);
    horn.position.set(dir * 0.44, 0.46, -0.05);
    horn.rotation.set(-0.35, 0, dir * 0.78);

    const hornTip = addMesh(skullGroup, resources.cone(`skel-horntip-${dir}`), mIron);
    hornTip.scale.set(0.09, 0.35, 0.09);
    hornTip.position.set(dir * 0.72, 0.88, -0.12);
    hornTip.rotation.set(-0.55, 0, dir * 1.12);
  }

  // Spiked Iron coronet brow band
  const ironBrow = addMesh(skullGroup, resources.torus('skel-iron-brow'), mIron);
  ironBrow.scale.set(0.55, 0.55, 0.14);
  ironBrow.position.set(0, 0.22, 0.04);
  ironBrow.rotation.x = Math.PI / 2.2;

  // Crisp faceplate disc facing camera directly
  const skullFaceDisc = addMesh(skullGroup, resources.circle('skel-face-disc', 0.38), skullMat);
  skullFaceDisc.position.set(0, 0.02, 0.315);

  // Goofy Cartoon Soul Eyes with specular glints inside sockets
  addGoofyMonsterEyes(skullGroup, resources, {
    y: 0.05,
    z: 0.32,
    spacing: 0.17,
    size: 0.13,
    scleraColor: 0xe0f2fe,
    pupilColor: 0x0284c7,
    derpy: false,
  });

  // Grinning jaw with sharp bone teeth
  const jaw = addMesh(skullGroup, resources.box('skel-jaw'), mBone);
  jaw.scale.set(0.44, 0.16, 0.36);
  jaw.position.set(0, -0.28, 0.16);

  // Carved teeth rows
  for (let t = -0.15; t <= 0.15; t += 0.06) {
    const tooth = addMesh(skullGroup, resources.cone(`skel-tooth-${t}`), mBone);
    tooth.scale.set(0.035, 0.09, 0.035);
    tooth.position.set(t, -0.20, 0.32);
    tooth.rotation.x = Math.PI;
  }

  root.add(skullGroup);
  parts.head = skullGroup;

  // 2. Hollow Ribcage & Spine
  const spine = addMesh(root, resources.cylinder('skel-spine'), mDarkBone);
  spine.scale.set(0.12, 0.68, 0.12);
  spine.position.set(0, 0.78, -0.02);

  // Flared arched ribs wrapping around chest
  for (let r = 0; r < 4; r += 1) {
    const ry = 1.05 - r * 0.12;
    const spread = 0.56 - r * 0.05;
    const ribTorus = addMesh(root, resources.torus(`skel-rib-${r}`), mBone);
    ribTorus.scale.set(spread * 0.58, spread * 0.44, 0.06);
    ribTorus.position.set(0, ry, 0.06);
    ribTorus.rotation.x = Math.PI / 2.2;
  }

  // Pulsating glowing soul spark core nestled inside ribcage
  const soulSpark = addMesh(root, resources.octa('skel-soul-spark'), mSoulEye);
  soulSpark.scale.setScalar(0.24);
  soulSpark.position.set(0, 0.84, 0.04);
  parts.core = soulSpark;

  // 3. Pelvis & Tattered Ragged Loincloth
  const pelvis = addMesh(root, resources.box('skel-pelvis'), mBone);
  pelvis.scale.set(0.52, 0.18, 0.32);
  pelvis.position.set(0, 0.46, 0);

  const clothMat = new THREE.MeshStandardMaterial({
    map: getTornClothTexture('#222a36', '#141a22'),
    roughness: 0.92,
  });
  const loincloth = addMesh(root, resources.cone('skel-loincloth'), clothMat);
  loincloth.scale.set(0.48, 0.44, 0.32);
  loincloth.position.set(0, 0.30, 0.04);
  loincloth.rotation.x = Math.PI;

  // 4. Heavy Spiked Iron Pauldrons on BOTH shoulders
  for (const dir of [-1, 1]) {
    const pauldron = addMesh(root, resources.sphere(`skel-pauldron-${dir}`), mIron);
    pauldron.scale.set(0.38, 0.30, 0.34);
    pauldron.position.set(dir * 0.50, 1.15, 0.02);

    for (let s = -1; s <= 1; s += 1) {
      const spike = addMesh(root, resources.cone(`skel-spike-${dir}-${s}`), mIron);
      spike.scale.set(0.09, 0.36, 0.09);
      spike.position.set(dir * (0.55 + Math.abs(s) * 0.07), 1.30, s * 0.14);
      spike.rotation.set(s * 0.25, 0, dir * (0.42 + s * 0.18));
    }
  }

  // 5. Left Arm with Massive Tilted Shield
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.46, 0.96, 0.04);
  const lHumerus = addMesh(leftArm, resources.cylinder('skel-l-arm'), mBone);
  lHumerus.scale.set(0.09, 0.52, 0.09);
  lHumerus.position.set(-0.08, -0.22, 0.06);
  lHumerus.rotation.z = 0.22;

  // Giant Round Shield angled directly toward camera
  const shield = new THREE.Group();
  shield.position.set(-0.24, -0.24, 0.28);
  shield.rotation.set(-0.48, 0.22, -0.12); // Tilted strongly upward toward overhead camera

  const shieldRim = addMesh(shield, resources.cylinder('skel-shield-rim'), mIron);
  shieldRim.scale.set(0.56, 0.07, 0.56);
  shieldRim.rotation.x = Math.PI / 2;

  const shieldMat = new THREE.MeshStandardMaterial({
    map: getShieldTexture(),
    roughness: 0.42,
    metalness: 0.45,
  });
  const shieldFace = addMesh(shield, resources.circle('skel-shield-face', 0.54), shieldMat);
  shieldFace.position.set(0, 0, 0.04);

  // Center iron skull boss on shield
  const shieldBoss = addMesh(shield, resources.sphere('skel-shield-boss'), mIron);
  shieldBoss.scale.set(0.18, 0.18, 0.14);
  shieldBoss.position.set(0, 0, 0.07);

  leftArm.add(shield);
  root.add(leftArm);
  arms.push(leftArm);
  parts.shield = shield;

  // 6. Right Arm with Imposing Glowing Bone Cleaver / Greatsword
  const rightArm = new THREE.Group();
  rightArm.position.set(0.46, 0.96, 0.04);
  const rHumerus = addMesh(rightArm, resources.cylinder('skel-r-arm'), mBone);
  rHumerus.scale.set(0.09, 0.52, 0.09);
  rHumerus.position.set(0.08, -0.22, 0.04);
  rHumerus.rotation.z = -0.22;

  // Broadsword / Cleaver
  const sword = new THREE.Group();
  sword.position.set(0.20, -0.26, 0.22);
  sword.rotation.set(-0.42, 0, -0.32);

  const blade = addMesh(sword, resources.box('skel-sword-blade'), mIron);
  blade.scale.set(0.14, 1.15, 0.05);
  blade.position.y = 0.52;

  // Glowing soul rune edge on blade
  const soulEdge = addMesh(sword, resources.box('skel-sword-glow'), mSoulEye);
  soulEdge.scale.set(0.16, 1.10, 0.02);
  soulEdge.position.set(0, 0.52, 0);

  const crossguard = addMesh(sword, resources.box('skel-sword-guard'), mIron);
  crossguard.scale.set(0.38, 0.09, 0.09);
  crossguard.position.y = 0.06;

  const hilt = addMesh(sword, resources.cylinder('skel-sword-hilt'), mDarkBone);
  hilt.scale.set(0.045, 0.24, 0.045);
  hilt.position.y = -0.08;

  rightArm.add(sword);
  root.add(rightArm);
  arms.push(rightArm);
  parts.weapon = sword;
  parts.sword = sword;

  // 7. Articulated Legs with Knee Condyles & Clawed Feet
  for (const dir of [-1, 1]) {
    const legGroup = new THREE.Group();
    legGroup.position.set(dir * 0.16, 0.42, 0);

    // Femur
    const femur = addMesh(legGroup, resources.cylinder(`skel-femur-${dir}`), mBone);
    femur.scale.set(0.08, 0.28, 0.08);
    femur.position.set(0, -0.12, 0);

    // Knee cap
    const knee = addMesh(legGroup, resources.sphere(`skel-knee-${dir}`), mBone);
    knee.scale.setScalar(0.09);
    knee.position.set(0, -0.24, 0.02);

    // Tibia shin
    const tibia = addMesh(legGroup, resources.cylinder(`skel-tibia-${dir}`), mBone);
    tibia.scale.set(0.07, 0.26, 0.07);
    tibia.position.set(0, -0.36, 0);

    // Bony clawed foot
    const foot = addMesh(legGroup, resources.box(`skel-foot-${dir}`), mBone);
    foot.scale.set(0.14, 0.08, 0.26);
    foot.position.set(0, -0.48, 0.08);

    root.add(legGroup);
    legs.push(legGroup);
  }

  parts.legs = legs;
  parts.arms = arms;
  parts.body = spine;
  root.userData.parts = parts;
  return root;
}

export function buildStylizedZombie(resources: SharedResources): THREE.Group {
  const root = new THREE.Group();
  root.name = 'stylized-zombie';
  const parts: Record<string, THREE.Object3D | THREE.Object3D[]> = {};
  const legs: THREE.Group[] = [];
  const arms: THREE.Object3D[] = [];

  const mSkin = new THREE.MeshStandardMaterial({
    map: getZombieSkinTexture(),
    roughness: 0.85,
    metalness: 0.1,
  });
  const mFace = new THREE.MeshStandardMaterial({
    map: getZombieFaceTexture(),
    roughness: 0.80,
    metalness: 0.1,
  });
  const mTornTunic = new THREE.MeshStandardMaterial({
    map: getTornClothTexture('#2c3b28', '#1a2618'),
    roughness: 0.95,
  });
  const mTornPants = new THREE.MeshStandardMaterial({
    map: getTornClothTexture('#202834', '#121822'),
    roughness: 0.95,
  });
  const mDecayedFlesh = resources.standardMaterial('zombie-gore', 0x5a121a, {
    roughness: 0.65,
    metalness: 0.15,
  });
  const mBoil = resources.standardMaterial('zombie-toxic-boil', 0xa3e635, {
    emissive: 0x65a30d,
    emissiveIntensity: 2.2,
    roughness: 0.2,
  });
  const mBrain = resources.standardMaterial('zombie-brain-mat', 0xc084fc, {
    roughness: 0.45,
    emissive: 0x7e22ce,
    emissiveIntensity: 1.8,
  });
  const mBoneWhite = resources.standardMaterial('zombie-spine-bone', 0xe2edf5, {
    roughness: 0.75,
  });

  // 1. Heavy Decaying Torso & Massive Hunched Spine
  const torso = addMesh(root, resources.cylinder('zombie-torso-sculpt'), mTornTunic);
  torso.scale.set(0.92, 0.96, 0.76);
  torso.position.set(0, 0.78, 0.04);
  torso.rotation.x = -0.10; // Upright & slightly back for top-down visibility

  // Massive hunchback swelling along upper shoulders & back
  const hunchback = addMesh(root, resources.sphere('zombie-hunchback'), mSkin);
  hunchback.scale.set(0.96, 0.78, 0.88);
  hunchback.position.set(0, 1.05, -0.22);

  // Jagged protruding white vertebrae along the hunchback spine (highly visible from above!)
  for (let v = 0; v < 5; v += 1) {
    const vert = addMesh(root, resources.box(`zombie-vert-${v}`), mBoneWhite);
    vert.scale.set(0.14, 0.10, 0.22);
    vert.position.set(0, 1.25 - v * 0.13, -0.24 - v * 0.05);
    vert.rotation.x = 0.35;
  }

  // Pulsing glowing toxic boils on the upper shoulders/hunch (clearly visible from overhead!)
  for (const b of [
    { x: -0.36, y: 1.22, z: -0.14, r: 0.18 },
    { x: 0.32, y: 1.26, z: -0.18, r: 0.16 },
    { x: -0.18, y: 1.34, z: -0.26, r: 0.14 },
    { x: 0.16, y: 1.32, z: -0.22, r: 0.13 },
  ]) {
    const boilMesh = addMesh(root, resources.sphere(`zombie-boil-${b.x}`), mBoil);
    boilMesh.scale.setScalar(b.r);
    boilMesh.position.set(b.x, b.y, b.z);
  }

  // Exposed necrotic chest wound with broken rib bones
  const woundDiscMat = new THREE.MeshStandardMaterial({
    map: getZombieSkinTexture(),
    roughness: 0.75,
  });
  const woundDisc = addMesh(root, resources.circle('zombie-wound-disc', 0.32), woundDiscMat);
  woundDisc.position.set(-0.16, 0.92, 0.44);
  woundDisc.rotation.x = -0.32;

  for (let b = 0; b < 3; b += 1) {
    const bone = addMesh(root, resources.cylinder(`zombie-rib-${b}`), mBoneWhite);
    bone.scale.set(0.045, 0.20, 0.045);
    bone.position.set(-0.24 + b * 0.09, 0.90, 0.46);
    bone.rotation.set(-0.25, 0, 0.42);
  }

  // 2. Tilting Rotting Zombie Head with Exposed Brain
  const headGroup = new THREE.Group();
  headGroup.position.set(0.06, 1.44, 0.16);
  headGroup.rotation.set(-0.35, 0.08, -0.10); // Tilted strongly UPWARDS toward camera

  const head = addMesh(headGroup, resources.sphere('zombie-head-sphere'), mSkin);
  head.scale.set(0.62, 0.64, 0.58);

  // Exposed glowing rotting brain cavity on top of skull (directly visible from above!)
  const brain = addMesh(headGroup, resources.sphere('zombie-brain'), mBrain);
  brain.scale.set(0.44, 0.28, 0.42);
  brain.position.set(0.02, 0.32, 0.02);

  // Large faceplate disc for crisp rotting face features facing camera
  const zombieFaceDisc = addMesh(headGroup, resources.circle('zombie-face-disc', 0.38), mFace);
  zombieFaceDisc.position.set(0, 0.02, 0.30);

  // Hilarious derpy asymmetrical cartoon googly eyes (one big, one smaller lazy eye)
  addGoofyMonsterEyes(headGroup, resources, {
    y: 0.08,
    z: 0.32,
    spacing: 0.16,
    size: 0.15,
    derpy: true,
    pupilColor: 0x1e293b,
  });

  // Tufts of decaying hair on scalp
  for (const hx of [-0.18, 0.04, 0.20]) {
    const hair = addMesh(headGroup, resources.cone(`zombie-hair-${hx}`), resources.standardMaterial('zombie-hair-mat', 0x141a10, { roughness: 0.98 }));
    hair.scale.set(0.08, 0.32, 0.08);
    hair.position.set(hx, 0.42, -0.08);
    hair.rotation.set(0.35, 0, (Math.random() - 0.5) * 0.6);
  }

  root.add(headGroup);
  parts.head = headGroup;

  // 3. Outstretched Gnarled Zombie Arms with Giant Black Claws
  for (const dir of [-1, 1]) {
    const armGroup = new THREE.Group();
    armGroup.position.set(dir * 0.54, 0.98, 0.12);
    // Outstretched forward reach tilted upward toward target
    armGroup.rotation.set(0.85, dir * -0.16, dir * 0.22);

    // Torn sleeve
    const sleeve = addMesh(armGroup, resources.cylinder(`zombie-sleeve-${dir}`), mTornTunic);
    sleeve.scale.set(0.24, 0.28, 0.24);
    sleeve.position.set(0, -0.08, 0);

    // Thick rotting necrotic forearm
    const forearm = addMesh(armGroup, resources.cylinder(`zombie-forearm-${dir}`), mSkin);
    forearm.scale.set(0.20, 0.54, 0.20);
    forearm.position.set(0, -0.38, 0);

    // Giant clawed hand with long jagged claws
    const hand = addMesh(armGroup, resources.box(`zombie-hand-${dir}`), mSkin);
    hand.scale.set(0.26, 0.22, 0.32);
    hand.position.set(0, -0.68, 0.08);

    const mClaw = resources.standardMaterial('zombie-claw-mat', 0x111612, { roughness: 0.4, metalness: 0.2 });
    for (let f = -0.08; f <= 0.08; f += 0.08) {
      const finger = addMesh(armGroup, resources.cone(`zombie-claw-${dir}-${f}`), mClaw);
      finger.scale.set(0.045, 0.24, 0.045);
      finger.position.set(f, -0.84, 0.14);
      finger.rotation.x = 0.55;
    }

    root.add(armGroup);
    arms.push(armGroup);
  }

  // 4. Heavy dragging legs with torn trousers
  for (const dir of [-1, 1]) {
    const legGroup = new THREE.Group();
    legGroup.position.set(dir * 0.26, 0.46, 0.04);

    const thigh = addMesh(legGroup, resources.cylinder(`zombie-thigh-${dir}`), mTornPants);
    thigh.scale.set(0.22, 0.38, 0.22);
    thigh.position.set(0, -0.16, 0);

    const knee = addMesh(legGroup, resources.sphere(`zombie-knee-${dir}`), mSkin);
    knee.scale.setScalar(0.18);
    knee.position.set(0, -0.32, 0.06);

    const boot = addMesh(legGroup, resources.box(`zombie-boot-${dir}`), resources.standardMaterial('zombie-boot-mat', 0x111618, { roughness: 0.9 }));
    boot.scale.set(0.28, 0.22, 0.44);
    boot.position.set(0, -0.52, 0.10);

    root.add(legGroup);
    legs.push(legGroup);
  }

  parts.legs = legs;
  parts.arms = arms;
  parts.body = torso;
  root.userData.parts = parts;
  return root;
}

export function buildStylizedSlime(resources: SharedResources): THREE.Group {
  const root = new THREE.Group();
  root.name = 'stylized-slime';
  const parts: Record<string, THREE.Object3D | THREE.Object3D[]> = {};

  const mGel = resources.standardMaterial('monster-slime-gel', 0x22c55e, {
    roughness: 0.12,
    metalness: 0.18,
    transparent: true,
    opacity: 0.84,
    emissive: 0x15803d,
    emissiveIntensity: 0.65,
  });
  const mCore = resources.standardMaterial('monster-slime-core', 0x86efac, {
    emissive: 0x22c55e,
    emissiveIntensity: 2.2,
    roughness: 0.15,
  });
  const mEyeGloss = resources.standardMaterial('monster-slime-eye', 0x052e16, {
    roughness: 0.05,
    metalness: 0.8,
  });
  const mHighlight = resources.basicMaterial('monster-slime-highlight', 0xffffff);

  // Outer Squishy Jelly Dome
  const body = addMesh(root, resources.sphere('slime-jelly-dome'), mGel);
  body.scale.set(0.92, 0.74, 0.86);
  body.position.set(0, 0.52, 0);

  // Bottom spread puddle
  const puddle = addMesh(root, resources.cylinder('slime-puddle'), mGel);
  puddle.scale.set(0.96, 0.18, 0.96);
  puddle.position.set(0, 0.12, 0);

  // Floating inner radioactive crystal nucleus core
  const nucleus = addMesh(root, resources.octa('slime-nucleus'), mCore);
  nucleus.scale.setScalar(0.26);
  nucleus.position.set(0, 0.50, 0);

  // Big Goofy Cartoon Monster Eyes with specular glints & cute smile
  addGoofyMonsterEyes(root, resources, {
    y: 0.58,
    z: 0.44,
    spacing: 0.22,
    size: 0.16,
    derpy: true,
    pupilColor: 0x052e16,
  });

  // Cheeky cartoon smile
  const smileMat = resources.basicMaterial('slime-smile-mat', 0x052e16);
  const smile = addMesh(root, resources.torus('slime-smile-torus'), smileMat);
  smile.scale.set(0.14, 0.08, 0.05);
  smile.position.set(0, 0.42, 0.46);
  smile.rotation.x = 0.25;

  parts.body = body;
  parts.core = nucleus;
  root.userData.parts = parts;
  return root;
}

export function buildStylizedBat(resources: SharedResources): THREE.Group {
  const root = new THREE.Group();
  root.name = 'stylized-bat';
  const parts: Record<string, THREE.Object3D | THREE.Object3D[]> = {};
  const wings: THREE.Object3D[] = [];

  const mFur = resources.standardMaterial('bat-fur-dark', 0x1f142b, { roughness: 0.82 });
  const mWing = resources.standardMaterial('bat-wing-skin', 0x2e1832, {
    roughness: 0.65,
    metalness: 0.15,
    side: THREE.DoubleSide,
  });
  const mEars = resources.standardMaterial('bat-ears-outer', 0x421c4b, { roughness: 0.75 });
  const mEarInner = resources.standardMaterial('bat-ears-inner', 0x9333ea, {
    emissive: 0x581c87,
    emissiveIntensity: 1.2,
    roughness: 0.5,
  });
  const mFangs = resources.standardMaterial('bat-fangs', 0xffffff, { roughness: 0.2 });
  const mEyes = resources.standardMaterial('bat-eyes-blood', 0xff1e40, {
    emissive: 0xff0033,
    emissiveIntensity: 3.5,
    roughness: 0.1,
  });

  // 1. Chunky Vampire Bat Body & Skull tilted upward
  const bodyGroup = new THREE.Group();
  bodyGroup.position.set(0, 0.85, 0);
  bodyGroup.rotation.x = -0.26; // Tilted toward overhead camera

  const body = addMesh(bodyGroup, resources.sphere('bat-body-chunky'), mFur);
  body.scale.set(0.64, 0.54, 0.74);

  // Large pointed flared vampire bat ears
  for (const dir of [-1, 1]) {
    const ear = addMesh(bodyGroup, resources.cone(`bat-ear-${dir}`), mEars);
    ear.scale.set(0.20, 0.62, 0.14);
    ear.position.set(dir * 0.32, 0.52, 0.05);
    ear.rotation.set(-0.25, 0, dir * 0.42);

    const earInner = addMesh(bodyGroup, resources.cone(`bat-ear-in-${dir}`), mEarInner);
    earInner.scale.set(0.12, 0.46, 0.08);
    earInner.position.set(dir * 0.31, 0.48, 0.12);
    earInner.rotation.set(-0.25, 0, dir * 0.42);
  }

  // Expressive goofy cartoon bat eyes with specular glints
  addGoofyMonsterEyes(bodyGroup, resources, {
    y: 0.12,
    z: 0.44,
    spacing: 0.18,
    size: 0.13,
    pupilColor: 0x881337,
    derpy: false,
  });

  // Curved vampire fangs
  for (const dir of [-1, 1]) {
    const fang = addMesh(bodyGroup, resources.cone(`bat-fang-${dir}`), mFangs);
    fang.scale.set(0.045, 0.16, 0.045);
    fang.position.set(dir * 0.12, -0.18, 0.46);
    fang.rotation.x = Math.PI - 0.25;
  }

  root.add(bodyGroup);
  parts.head = bodyGroup;
  parts.body = body;

  // 2. Giant Scalloped Bat Wings with Bone Struts (1.6x wingspan!)
  for (const dir of [-1, 1]) {
    const wingGroup = new THREE.Group();
    wingGroup.position.set(dir * 0.34, 0.88, 0);

    // Main wing arm bone
    const armBone = addMesh(wingGroup, resources.cylinder(`bat-arm-bone-${dir}`), mFur);
    armBone.scale.set(0.06, 0.64, 0.06);
    armBone.position.set(dir * 0.32, 0.18, 0);
    armBone.rotation.z = dir * -0.68;

    // Wing membranes (layered scalloped flaps)
    const mainMembrane = addMesh(wingGroup, resources.box(`bat-membrane-${dir}`), mWing);
    mainMembrane.scale.set(1.05, 0.04, 0.65);
    mainMembrane.position.set(dir * 0.58, 0.06, 0);

    // Wing finger struts
    for (let f = 0; f < 3; f += 1) {
      const strut = addMesh(wingGroup, resources.cylinder(`bat-strut-${dir}-${f}`), mFur);
      strut.scale.set(0.028, 0.54, 0.028);
      strut.position.set(dir * (0.38 + f * 0.26), -0.06, 0);
      strut.rotation.z = dir * (-0.25 - f * 0.25);
    }

    // Hooked wingtip thumb claw
    const thumbClaw = addMesh(wingGroup, resources.cone(`bat-claw-${dir}`), mFangs);
    thumbClaw.scale.set(0.06, 0.24, 0.06);
    thumbClaw.position.set(dir * 0.60, 0.40, 0.12);
    thumbClaw.rotation.set(-0.4, 0, dir * 0.8);

    root.add(wingGroup);
    wings.push(wingGroup);
  }

  // Small rear claws
  for (const dir of [-1, 1]) {
    const foot = addMesh(root, resources.box(`bat-foot-${dir}`), mFur);
    foot.scale.set(0.12, 0.12, 0.24);
    foot.position.set(dir * 0.18, 0.42, -0.15);
  }

  parts.wings = wings;
  root.userData.parts = parts;
  return root;
}

export function buildStylizedGhost(resources: SharedResources, color = 0x8eeeff): THREE.Group {
  const root = new THREE.Group();
  root.name = 'stylized-ghost';
  const parts: Record<string, THREE.Object3D | THREE.Object3D[]> = {};

  const mShroud = resources.standardMaterial(`ghost-shroud-${color}`, color, {
    transparent: true,
    opacity: 0.82,
    roughness: 0.32,
    emissive: color,
    emissiveIntensity: 0.95,
  });
  const mSoulEye = resources.standardMaterial('ghost-soul-eye-mat', 0x67e8f9, {
    emissive: 0x38bdf8,
    emissiveIntensity: 3.8,
    roughness: 0.1,
  });

  // 1. Shrouded Hood tilted toward overhead camera
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.25, 0.04);
  headGroup.rotation.x = -0.28; // Tilted toward camera

  const hood = addMesh(headGroup, resources.sphere('ghost-hood-sculpt'), mShroud);
  hood.scale.set(0.72, 0.78, 0.68);

  // Deep void cowl
  const voidFace = addMesh(headGroup, resources.sphere('ghost-void-recess'), resources.basicMaterial('ghost-void-recess-mat', 0x020617));
  voidFace.scale.set(0.48, 0.52, 0.36);
  voidFace.position.set(0, 0, 0.22);

  // Screaming skull mask faceplate inside the void
  const skullMat = new THREE.MeshStandardMaterial({
    map: getSkeletonSkullTexture(),
    roughness: 0.55,
    metalness: 0.15,
  });
  const skullFace = addMesh(headGroup, resources.circle('ghost-skull-mask', 0.28), skullMat);
  skullFace.position.set(0, -0.04, 0.32);

  // Piercing glowing cyan soul eyes inside skull sockets
  for (const dir of [-1, 1]) {
    const eye = addMesh(headGroup, resources.sphere(`ghost-soul-eye-${dir}`), mSoulEye);
    eye.scale.setScalar(0.095);
    eye.position.set(dir * 0.14, 0.04, 0.36);
  }

  root.add(headGroup);
  parts.head = headGroup;

  // 2. Pulsing Soul Core floating inside translucent torso
  const soulCore = addMesh(root, resources.octa('ghost-soul-core'), mSoulEye);
  soulCore.scale.setScalar(0.32);
  soulCore.position.set(0, 0.78, 0.04);
  parts.core = soulCore;

  // 3. Flowing ghostly arms reaching forward
  const arms: THREE.Object3D[] = [];
  for (const dir of [-1, 1]) {
    const arm = addMesh(root, resources.cone(`ghost-reach-arm-${dir}`), mShroud);
    arm.scale.set(0.18, 0.72, 0.18);
    arm.position.set(dir * 0.44, 0.76, 0.22);
    arm.rotation.set(-0.8, 0, dir * 0.35);
    arms.push(arm);
  }
  parts.arms = arms;

  // 4. Undulating ethereal shroud tails
  const tail1 = addMesh(root, resources.cone('ghost-tail-main'), mShroud);
  tail1.scale.set(0.68, 1.35, 0.62);
  tail1.position.set(0, 0.44, -0.04);
  tail1.rotation.x = Math.PI;

  const tail2 = addMesh(root, resources.cone('ghost-tail-wisp'), mShroud);
  tail2.scale.set(0.35, 0.95, 0.32);
  tail2.position.set(0.20, 0.18, -0.22);
  tail2.rotation.set(Math.PI + 0.35, 0, 0.28);

  parts.body = hood;
  root.userData.parts = parts;
  return root;
}

export function buildStylizedArcher(resources: SharedResources): THREE.Group {
  const root = new THREE.Group();
  root.name = 'stylized-archer';
  const parts: Record<string, THREE.Object3D | THREE.Object3D[]> = {};
  const legs: THREE.Group[] = [];
  const arms: THREE.Object3D[] = [];

  const mBone = resources.standardMaterial('archer-bone', 0xd6e4ee, { roughness: 0.75 });
  const mDarkBone = resources.standardMaterial('archer-dark-bone', 0x93a8b8, { roughness: 0.88 });
  const mHood = new THREE.MeshStandardMaterial({
    map: getTornClothTexture('#2d1b4e', '#190d30'),
    roughness: 0.9,
  });
  const mLeather = resources.standardMaterial('archer-leather', 0x4a3319, { roughness: 0.85 });
  const mBowWood = resources.standardMaterial('archer-bow-wood', 0x2e180d, { roughness: 0.6 });
  const mBowGlow = resources.standardMaterial('archer-bow-glow', 0xa855f7, { emissive: 0x9333ea, emissiveIntensity: 1.8, roughness: 0.3 });
  const mEye = resources.standardMaterial('archer-eye', 0xc084fc, { emissive: 0xa855f7, emissiveIntensity: 2.5, roughness: 0.2 });

  // 1. Skull in Shadowy Cowl/Hood tilted toward camera
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.34, 0.04);
  headGroup.rotation.x = -0.20; // Tilted toward camera

  const cowl = addMesh(headGroup, resources.sphere('archer-cowl'), mHood);
  cowl.scale.set(0.54, 0.58, 0.54);

  // Deep shadowy face recess
  const voidFace = addMesh(headGroup, resources.sphere('archer-void'), resources.basicMaterial('archer-void-mat', 0x07040d));
  voidFace.scale.set(0.38, 0.40, 0.30);
  voidFace.position.set(0, 0, 0.16);

  // Skull faceplate inside hood
  const skullFaceMat = new THREE.MeshStandardMaterial({
    map: getSkeletonSkullTexture(),
    roughness: 0.65,
  });
  const faceDisc = addMesh(headGroup, resources.circle('archer-face-disc', 0.22), skullFaceMat);
  faceDisc.position.set(0, -0.02, 0.22);

  // Glowing sinister purple eyes
  for (const x of [-0.10, 0.10]) {
    const eye = addMesh(headGroup, resources.sphere('archer-eye-spark'), mEye);
    eye.scale.setScalar(0.065);
    eye.position.set(x, 0.04, 0.26);
  }

  root.add(headGroup);
  parts.head = headGroup;

  // 2. Spine & Ribs with Leather Quiver Harness
  const spine = addMesh(root, resources.cylinder('archer-spine'), mDarkBone);
  spine.scale.set(0.08, 0.56, 0.08);
  spine.position.set(0, 0.74, -0.02);

  for (let r = 0; r < 3; r += 1) {
    const ry = 0.92 - r * 0.11;
    const rib = addMesh(root, resources.torus(`archer-rib-${r}`), mBone);
    rib.scale.set(0.20 - r * 0.02, 0.15 - r * 0.015, 0.04);
    rib.position.set(0, ry, 0.04);
    rib.rotation.x = Math.PI / 2.2;
  }

  // Cross-body leather quiver strap
  const strap = addMesh(root, resources.cylinder('archer-strap'), mLeather);
  strap.scale.set(0.05, 0.65, 0.04);
  strap.position.set(0, 0.76, 0.12);
  strap.rotation.z = 0.65;

  // Quiver on the back filled with bone arrows
  const quiver = new THREE.Group();
  quiver.position.set(-0.16, 0.85, -0.22);
  quiver.rotation.set(0.3, 0, -0.45);
  const quiverTube = addMesh(quiver, resources.cylinder('archer-quiver-tube'), mLeather);
  quiverTube.scale.set(0.12, 0.62, 0.12);

  // 3 bone arrows sticking out
  for (let a = -1; a <= 1; a += 1) {
    const arrowShaft = addMesh(quiver, resources.cylinder(`archer-arrow-${a}`), mBone);
    arrowShaft.scale.set(0.02, 0.45, 0.02);
    arrowShaft.position.set(a * 0.04, 0.38, 0);
    const fletching = addMesh(quiver, resources.box(`archer-fletch-${a}`), mEye);
    fletching.scale.set(0.05, 0.10, 0.015);
    fletching.position.set(a * 0.04, 0.55, 0);
  }
  root.add(quiver);

  // 3. Recurve Bow (Left Arm)
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.36, 0.98, 0.10);
  leftArm.rotation.set(0.5, 0, -0.3);
  const leftBone = addMesh(leftArm, resources.cylinder('archer-arm-l'), mBone);
  leftBone.scale.set(0.07, 0.46, 0.07);
  leftBone.position.set(0, -0.20, 0);

  // Bow
  const bow = new THREE.Group();
  bow.position.set(0, -0.44, 0.15);
  bow.rotation.set(-0.4, 0.2, 0);
  const bowTop = addMesh(bow, resources.cylinder('archer-bow-top'), mBowWood);
  bowTop.scale.set(0.04, 0.52, 0.04);
  bowTop.position.set(0, 0.24, -0.06);
  bowTop.rotation.x = 0.35;
  const bowBottom = addMesh(bow, resources.cylinder('archer-bow-bot'), mBowWood);
  bowBottom.scale.set(0.04, 0.52, 0.04);
  bowBottom.position.set(0, -0.24, -0.06);
  bowBottom.rotation.x = -0.35;
  const bowGrip = addMesh(bow, resources.cylinder('archer-bow-grip'), mLeather);
  bowGrip.scale.set(0.06, 0.16, 0.06);
  const bowString = addMesh(bow, resources.cylinder('archer-bow-string'), mBowGlow);
  bowString.scale.set(0.012, 0.94, 0.012);
  bowString.position.set(0, 0, -0.15);
  leftArm.add(bow);
  root.add(leftArm);
  arms.push(leftArm);
  parts.weapon = bow;
  parts.bow = bow;

  // 4. Right Arm Drawing Hand
  const rightArm = new THREE.Group();
  rightArm.position.set(0.32, 0.96, 0);
  rightArm.rotation.set(0.65, 0, 0.25);
  const rightBone = addMesh(rightArm, resources.cylinder('archer-arm-r'), mBone);
  rightBone.scale.set(0.07, 0.46, 0.07);
  rightBone.position.set(0, -0.20, 0);
  root.add(rightArm);
  arms.push(rightArm);

  // 5. Articulated Legs
  for (const dir of [-1, 1]) {
    const legGroup = new THREE.Group();
    legGroup.position.set(dir * 0.16, 0.42, 0);
    const femur = addMesh(legGroup, resources.cylinder(`archer-femur-${dir}`), mBone);
    femur.scale.set(0.08, 0.30, 0.08);
    femur.position.set(0, -0.14, 0);
    const shin = addMesh(legGroup, resources.cylinder(`archer-shin-${dir}`), mBone);
    shin.scale.set(0.07, 0.28, 0.07);
    shin.position.set(0, -0.36, 0);
    const boot = addMesh(legGroup, resources.box(`archer-boot-${dir}`), mLeather);
    boot.scale.set(0.14, 0.10, 0.26);
    boot.position.set(0, -0.48, 0.08);
    root.add(legGroup);
    legs.push(legGroup);
  }

  parts.legs = legs;
  parts.arms = arms;
  parts.body = spine;
  root.userData.parts = parts;
  return root;
}

export function buildStylizedBoneMage(resources: SharedResources): THREE.Group {
  const root = new THREE.Group();
  root.name = 'stylized-bone-mage';
  const parts: Record<string, THREE.Object3D | THREE.Object3D[]> = {};
  const arms: THREE.Object3D[] = [];

  const mBone = resources.standardMaterial('mage-bone-clean', 0xedf4fa, { roughness: 0.65, metalness: 0.12 });
  const mDarkBone = resources.standardMaterial('mage-bone-dark', 0x94a3b8, { roughness: 0.85 });
  const mOccultGlow = resources.standardMaterial('mage-occult-glow', 0xc084fc, {
    emissive: 0xa855f7,
    emissiveIntensity: 3.6,
    roughness: 0.15,
  });
  const mVoidCore = resources.standardMaterial('mage-void-core', 0x7e22ce, {
    emissive: 0x9333ea,
    emissiveIntensity: 2.8,
    roughness: 0.2,
  });
  const mGoldTrim = resources.standardMaterial('mage-gold-trim', 0xf59e0b, { metalness: 0.85, roughness: 0.3 });
  const mRobe = new THREE.MeshStandardMaterial({
    map: getNecroRobeTexture(),
    roughness: 0.88,
  });
  const mCowl = new THREE.MeshStandardMaterial({
    map: getTornClothTexture('#220c32', '#12041c'),
    roughness: 0.92,
  });

  // 1. Necromancer Cowl & Skull tilted toward overhead camera
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.45, 0.05);
  headGroup.rotation.x = -0.28; // Tilted toward camera

  const cowl = addMesh(headGroup, resources.sphere('mage-cowl'), mCowl);
  cowl.scale.set(0.62, 0.68, 0.60);

  // Deep shadowy void recess
  const voidFace = addMesh(headGroup, resources.sphere('mage-void-recess'), resources.basicMaterial('mage-void-mat', 0x07020d));
  voidFace.scale.set(0.44, 0.48, 0.34);
  voidFace.position.set(0, 0, 0.18);

  // Weathered skull faceplate inside cowl
  const skullMat = new THREE.MeshStandardMaterial({
    map: getSkeletonSkullTexture(),
    roughness: 0.6,
    metalness: 0.15,
  });
  const skullDisc = addMesh(headGroup, resources.circle('mage-skull-disc', 0.28), skullMat);
  skullDisc.position.set(0, -0.02, 0.26);

  // Piercing eldritch violet soul eyes
  for (const x of [-0.12, 0.12]) {
    const eye = addMesh(headGroup, resources.sphere(`mage-eye-${x}`), mOccultGlow);
    eye.scale.setScalar(0.08);
    eye.position.set(x, 0.04, 0.29);
  }

  // Spiked bone halo / occult crown orbiting behind head
  for (let i = 0; i < 6; i += 1) {
    const angle = (i / 6) * Math.PI * 2;
    const spike = addMesh(headGroup, resources.cone(`mage-halo-spike-${i}`), mBone);
    spike.scale.set(0.05, 0.44, 0.05);
    spike.position.set(Math.cos(angle) * 0.48, Math.sin(angle) * 0.48 + 0.06, -0.15);
    spike.rotation.z = angle - Math.PI / 2;
  }

  root.add(headGroup);
  parts.head = headGroup;

  // 2. Layered Necromancer Robes & Ribcage with Void Core
  const body = addMesh(root, resources.cone('mage-body-robe'), mRobe);
  body.scale.set(0.85, 1.45, 0.72);
  body.position.set(0, 0.72, 0);

  // Ribcage framing the chest
  for (let r = 0; r < 3; r += 1) {
    const rib = addMesh(root, resources.torus(`mage-rib-${r}`), mBone);
    rib.scale.set(0.28 - r * 0.03, 0.22 - r * 0.02, 0.05);
    rib.position.set(0, 1.05 - r * 0.12, 0.22);
    rib.rotation.x = Math.PI / 2.2;
  }

  // Pulsating glowing dark magic core inside the ribs
  const voidCore = addMesh(root, resources.octa('mage-void-crystal'), mVoidCore);
  voidCore.scale.setScalar(0.28);
  voidCore.position.set(0, 0.95, 0.24);
  parts.core = voidCore;

  // Spiked bone shoulder pauldrons
  for (const dir of [-1, 1]) {
    const pauldron = addMesh(root, resources.cone(`mage-pauldron-${dir}`), mBone);
    pauldron.scale.set(0.12, 0.52, 0.12);
    pauldron.position.set(dir * 0.48, 1.25, 0.02);
    pauldron.rotation.set(-0.25, 0, dir * 0.45);
  }

  // 3. Right Arm with Colossal Necromantic Bone Staff
  const rightArm = new THREE.Group();
  rightArm.position.set(0.48, 1.0, 0.08);
  rightArm.rotation.set(0.3, 0, -0.22);

  const rSleeve = addMesh(rightArm, resources.cylinder('mage-sleeve-r'), mRobe);
  rSleeve.scale.set(0.16, 0.52, 0.16);
  rSleeve.position.set(0, -0.22, 0);

  // Giant 2.1m Staff
  const staff = new THREE.Group();
  staff.position.set(0.18, -0.15, 0.22);
  staff.rotation.set(-0.25, 0, 0.12);

  const shaft = addMesh(staff, resources.cylinder('mage-staff-shaft'), mDarkBone);
  shaft.scale.set(0.065, 2.1, 0.065);
  shaft.position.y = 0.55;

  // Curved dragon rib crown at staff top
  for (const dir of [-1, 1]) {
    const prong = addMesh(staff, resources.cone(`mage-prong-${dir}`), mBone);
    prong.scale.set(0.08, 0.58, 0.08);
    prong.position.set(dir * 0.18, 1.62, 0);
    prong.rotation.z = dir * -0.45;
  }

  // Pulsating occult amethyst crystal
  const crystal = addMesh(staff, resources.octa('mage-crystal'), mOccultGlow);
  crystal.scale.setScalar(0.34);
  crystal.position.set(0, 1.68, 0);

  // Orbiting arcane energy ring around crystal
  const haloRing = addMesh(staff, resources.torus('mage-staff-ring'), mOccultGlow);
  haloRing.scale.set(0.32, 0.32, 0.04);
  haloRing.position.set(0, 1.68, 0);
  haloRing.rotation.x = Math.PI / 3;

  rightArm.add(staff);
  root.add(rightArm);
  arms.push(rightArm);
  parts.weapon = staff;

  // 4. Left Arm with Hovering Soul Flame Orb
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.46, 0.98, 0.12);
  leftArm.rotation.set(0.8, 0, 0.32);

  const lSleeve = addMesh(leftArm, resources.cylinder('mage-sleeve-l'), mRobe);
  lSleeve.scale.set(0.16, 0.52, 0.16);
  lSleeve.position.set(0, -0.22, 0);

  // Floating occult fire ball above palm
  const fireOrb = addMesh(leftArm, resources.sphere('mage-fire-orb'), mOccultGlow);
  fireOrb.scale.setScalar(0.22);
  fireOrb.position.set(0, -0.55, 0.18);

  root.add(leftArm);
  arms.push(leftArm);

  parts.arms = arms;
  parts.body = body;
  root.userData.parts = parts;
  return root;
}

export function buildStylizedKnight(resources: SharedResources): THREE.Group {
  const root = new THREE.Group();
  root.name = 'stylized-knight';
  const parts: Record<string, THREE.Object3D | THREE.Object3D[]> = {};
  const legs: THREE.Group[] = [];
  const arms: THREE.Object3D[] = [];

  const mSteel = resources.standardMaterial('knight-steel', 0x334155, {
    metalness: 0.88,
    roughness: 0.28,
  });
  const mDarkSteel = resources.standardMaterial('knight-dark-steel', 0x1e293b, {
    metalness: 0.92,
    roughness: 0.35,
  });
  const mGold = resources.standardMaterial('knight-gold', 0xf59e0b, {
    metalness: 0.82,
    roughness: 0.25,
  });
  const mPlume = resources.standardMaterial('knight-crimson-plume', 0xdc2626, {
    roughness: 0.72,
  });
  const mVisorGlow = resources.standardMaterial('knight-visor-glow', 0xef4444, {
    emissive: 0xef4444,
    emissiveIntensity: 3.5,
    roughness: 0.1,
  });
  const mCuirass = new THREE.MeshStandardMaterial({
    map: getGothicArmorTexture(),
    metalness: 0.85,
    roughness: 0.32,
  });

  // 1. Gothic Greathelm with Crimson Plume & Glowing Visor
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.48, 0.05);
  headGroup.rotation.x = -0.25; // Tilted toward overhead camera

  const helm = addMesh(headGroup, resources.cylinder('knight-helm-sculpt'), mSteel);
  helm.scale.set(0.68, 0.65, 0.65);

  // Helm dome
  const dome = addMesh(headGroup, resources.sphere('knight-helm-dome'), mSteel);
  dome.scale.set(0.66, 0.35, 0.64);
  dome.position.y = 0.32;

  // Flowing Crimson Feather Plume along top ridge
  for (let p = 0; p < 4; p += 1) {
    const plumeSegment = addMesh(headGroup, resources.sphere(`knight-plume-${p}`), mPlume);
    plumeSegment.scale.set(0.16, 0.28, 0.28);
    plumeSegment.position.set(0, 0.52 - p * 0.05, 0.15 - p * 0.18);
    plumeSegment.rotation.x = -0.35;
  }

  // Golden coronet ridge
  const goldRidge = addMesh(headGroup, resources.box('knight-helm-ridge'), mGold);
  goldRidge.scale.set(0.08, 0.12, 0.72);
  goldRidge.position.set(0, 0.36, 0);

  // Menacing Glowing Crimson Visor Slit
  const visor = addMesh(headGroup, resources.box('knight-visor-glow-bar'), mVisorGlow);
  visor.scale.set(0.48, 0.08, 0.12);
  visor.position.set(0, 0.06, 0.32);

  // Lower steel faceplate with breathing grates
  const faceplate = addMesh(headGroup, resources.box('knight-faceplate'), mDarkSteel);
  faceplate.scale.set(0.56, 0.22, 0.25);
  faceplate.position.set(0, -0.16, 0.26);

  root.add(headGroup);
  parts.head = headGroup;

  // 2. Heavy Gothic Cuirass Breastplate
  const torso = addMesh(root, resources.cylinder('knight-cuirass'), mCuirass);
  torso.scale.set(0.88, 0.95, 0.68);
  torso.position.set(0, 0.82, 0.04);
  torso.rotation.x = -0.08;

  // Steel gorget neck guard
  const gorget = addMesh(root, resources.torus('knight-gorget'), mGold);
  gorget.scale.set(0.48, 0.42, 0.08);
  gorget.position.set(0, 1.26, 0.04);
  gorget.rotation.x = Math.PI / 2.2;

  // Fluted Tasset Hip Guards
  for (const dir of [-1, 1]) {
    const tasset = addMesh(root, resources.box(`knight-tasset-${dir}`), mSteel);
    tasset.scale.set(0.32, 0.38, 0.10);
    tasset.position.set(dir * 0.26, 0.38, 0.14);
    tasset.rotation.set(-0.2, 0, dir * -0.22);
  }

  // 3. Spiked Gothic Pauldrons on BOTH shoulders
  for (const dir of [-1, 1]) {
    const pauldron = addMesh(root, resources.sphere(`knight-pauldron-${dir}`), mSteel);
    pauldron.scale.set(0.44, 0.36, 0.40);
    pauldron.position.set(dir * 0.54, 1.18, 0.02);

    const spike = addMesh(root, resources.cone(`knight-pauldron-spike-${dir}`), mGold);
    spike.scale.set(0.11, 0.38, 0.11);
    spike.position.set(dir * 0.62, 1.38, 0.04);
    spike.rotation.z = dir * 0.42;
  }

  // 4. Left Arm with Massive Ornate Tower Shield (Angled toward camera!)
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.52, 0.98, 0.06);

  const lArmSteel = addMesh(leftArm, resources.cylinder('knight-arm-l'), mSteel);
  lArmSteel.scale.set(0.14, 0.52, 0.14);
  lArmSteel.position.set(-0.06, -0.22, 0.06);
  lArmSteel.rotation.z = 0.22;

  // Tower Shield angled toward camera
  const shield = new THREE.Group();
  shield.position.set(-0.24, -0.22, 0.28);
  shield.rotation.set(-0.45, 0.18, -0.10); // Tilted strongly upward toward overhead camera

  const shieldMat = new THREE.MeshStandardMaterial({
    map: getKnightShieldTexture(),
    metalness: 0.65,
    roughness: 0.35,
  });
  const shieldFace = addMesh(shield, resources.box('knight-shield-plate'), shieldMat);
  shieldFace.scale.set(0.78, 1.18, 0.08);

  const shieldBoss = addMesh(shield, resources.sphere('knight-shield-boss'), mGold);
  shieldBoss.scale.set(0.20, 0.20, 0.12);
  shieldBoss.position.set(0, 0, 0.06);

  leftArm.add(shield);
  root.add(leftArm);
  arms.push(leftArm);
  parts.shield = shield;

  // 5. Right Arm with Gothic Bastard Greatsword
  const rightArm = new THREE.Group();
  rightArm.position.set(0.52, 0.98, 0.06);

  const rArmSteel = addMesh(rightArm, resources.cylinder('knight-arm-r'), mSteel);
  rArmSteel.scale.set(0.14, 0.52, 0.14);
  rArmSteel.position.set(0.06, -0.22, 0.06);
  rArmSteel.rotation.z = -0.22;

  // Greatsword
  const sword = new THREE.Group();
  sword.position.set(0.22, -0.24, 0.26);
  sword.rotation.set(-0.42, 0, -0.34);

  const blade = addMesh(sword, resources.box('knight-sword-blade'), mSteel);
  blade.scale.set(0.15, 1.32, 0.05);
  blade.position.y = 0.62;

  const fullerGlow = addMesh(sword, resources.box('knight-sword-fuller'), resources.standardMaterial('knight-blade-glow', 0x93c5fd, { emissive: 0x60a5fa, emissiveIntensity: 1.8 }));
  fullerGlow.scale.set(0.04, 1.15, 0.06);
  fullerGlow.position.y = 0.62;

  const crossguard = addMesh(sword, resources.box('knight-sword-guard'), mGold);
  crossguard.scale.set(0.48, 0.10, 0.12);
  crossguard.position.y = 0.06;

  const hilt = addMesh(sword, resources.cylinder('knight-sword-hilt'), mDarkSteel);
  hilt.scale.set(0.05, 0.28, 0.05);
  hilt.position.y = -0.10;

  const pommel = addMesh(sword, resources.sphere('knight-sword-pommel'), mGold);
  pommel.scale.setScalar(0.12);
  pommel.position.y = -0.26;

  rightArm.add(sword);
  root.add(rightArm);
  arms.push(rightArm);
  parts.weapon = sword;
  parts.sword = sword;

  // 6. Articulated Greaves & Heavy Sabatons
  for (const dir of [-1, 1]) {
    const legGroup = new THREE.Group();
    legGroup.position.set(dir * 0.22, 0.44, 0);

    const greave = addMesh(legGroup, resources.cylinder(`knight-greave-${dir}`), mSteel);
    greave.scale.set(0.16, 0.44, 0.16);
    greave.position.set(0, -0.20, 0.02);

    const poleyn = addMesh(legGroup, resources.sphere(`knight-knee-${dir}`), mGold);
    poleyn.scale.setScalar(0.14);
    poleyn.position.set(0, -0.10, 0.10);

    const sabaton = addMesh(legGroup, resources.box(`knight-sabaton-${dir}`), mDarkSteel);
    sabaton.scale.set(0.24, 0.16, 0.38);
    sabaton.position.set(0, -0.40, 0.10);

    root.add(legGroup);
    legs.push(legGroup);
  }

  parts.legs = legs;
  parts.arms = arms;
  parts.body = torso;
  root.userData.parts = parts;
  return root;
}

export function buildStylizedDemon(resources: SharedResources, isWarrior = false): THREE.Group {
  const root = new THREE.Group();
  root.name = isWarrior ? 'stylized-demon-warrior' : 'stylized-demon';
  const parts: Record<string, THREE.Object3D | THREE.Object3D[]> = {};
  const legs: THREE.Group[] = [];
  const arms: THREE.Object3D[] = [];

  const mBasalt = resources.standardMaterial('demon-basalt', 0x18070b, { roughness: 0.85 });
  const mHorn = resources.standardMaterial('demon-horn-bone', 0x450a0a, {
    metalness: 0.45,
    roughness: 0.4,
    emissive: 0x2e0606,
    emissiveIntensity: 0.6,
  });
  const mMagma = resources.standardMaterial('demon-magma-glow', 0xf97316, {
    emissive: 0xf59e0b,
    emissiveIntensity: 3.5,
    roughness: 0.2,
  });
  const mEyeFire = resources.standardMaterial('demon-eye-fire', 0xfef08a, {
    emissive: 0xfacc15,
    emissiveIntensity: 4.2,
    roughness: 0.1,
  });
  const mWingSkin = resources.standardMaterial('demon-wing-skin', 0x26070a, {
    roughness: 0.75,
    side: THREE.DoubleSide,
  });
  const mLavaTorso = new THREE.MeshStandardMaterial({
    map: getDemonLavaTexture(),
    roughness: 0.55,
    metalness: 0.25,
    emissive: 0xef4444,
    emissiveIntensity: 0.65,
  });

  // 1. Demonic Head with Sweeping Ram Horns & Magma Maw
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.54, 0.08);
  headGroup.rotation.x = -0.28; // Tilted toward camera

  const head = addMesh(headGroup, resources.ico('demon-head-sculpt'), mBasalt);
  head.scale.set(0.66, 0.70, 0.64);

  // Sweeping curved demonic ram horns
  for (const dir of [-1, 1]) {
    const horn = addMesh(headGroup, resources.cone(`demon-horn-${dir}`), mHorn);
    horn.scale.set(0.20, 0.95, 0.20);
    horn.position.set(dir * 0.46, 0.55, -0.05);
    horn.rotation.set(-0.35, 0, dir * 0.75);

    const hornTip = addMesh(headGroup, resources.cone(`demon-horntip-${dir}`), mMagma);
    hornTip.scale.set(0.12, 0.45, 0.12);
    hornTip.position.set(dir * 0.78, 1.05, -0.15);
    hornTip.rotation.set(-0.55, 0, dir * 1.15);
  }

  // Blazing Hellfire Eyes
  for (const x of [-0.18, 0.18]) {
    const eye = addMesh(headGroup, resources.sphere(`demon-eye-${x}`), mEyeFire);
    eye.scale.setScalar(0.12);
    eye.position.set(x, 0.08, 0.32);
  }

  // Fanged Maw with glowing lava interior
  const jaw = addMesh(headGroup, resources.box('demon-jaw'), mBasalt);
  jaw.scale.set(0.48, 0.22, 0.36);
  jaw.position.set(0, -0.24, 0.22);

  const magmaTongue = addMesh(headGroup, resources.sphere('demon-tongue'), mMagma);
  magmaTongue.scale.set(0.24, 0.08, 0.24);
  magmaTongue.position.set(0, -0.16, 0.28);

  for (const dir of [-1, 1]) {
    const fang = addMesh(headGroup, resources.cone(`demon-fang-${dir}`), mHorn);
    fang.scale.set(0.045, 0.15, 0.045);
    fang.position.set(dir * 0.16, -0.12, 0.38);
  }

  root.add(headGroup);
  parts.head = headGroup;

  // 2. Muscular Magma-Cracked Torso
  const torso = addMesh(root, resources.cylinder('demon-torso-lava'), mLavaTorso);
  torso.scale.set(0.98, 1.05, 0.76);
  torso.position.set(0, 0.85, 0.04);
  torso.rotation.x = -0.10;

  // 3. Unfurled Demonic Wings (1.8m span)
  for (const dir of [-1, 1]) {
    const wingGroup = new THREE.Group();
    wingGroup.position.set(dir * 0.38, 1.15, -0.25);

    const wingBone = addMesh(wingGroup, resources.cylinder(`demon-wing-bone-${dir}`), mBasalt);
    wingBone.scale.set(0.08, 0.85, 0.08);
    wingBone.position.set(dir * 0.42, 0.28, 0);
    wingBone.rotation.z = dir * -0.72;

    const membrane = addMesh(wingGroup, resources.box(`demon-membrane-${dir}`), mWingSkin);
    membrane.scale.set(1.15, 0.05, 0.78);
    membrane.position.set(dir * 0.68, 0.10, 0);

    const thumbClaw = addMesh(wingGroup, resources.cone(`demon-thumb-${dir}`), mHorn);
    thumbClaw.scale.set(0.08, 0.32, 0.08);
    thumbClaw.position.set(dir * 0.78, 0.58, 0.10);
    thumbClaw.rotation.set(-0.4, 0, dir * 0.85);

    root.add(wingGroup);
  }

  // 4. Molten Lava Boulder Pauldrons
  for (const dir of [-1, 1]) {
    const pauldron = addMesh(root, resources.sphere(`demon-pauldron-${dir}`), mLavaTorso);
    pauldron.scale.set(0.48, 0.40, 0.44);
    pauldron.position.set(dir * 0.62, 1.25, 0.04);

    const spike = addMesh(root, resources.cone(`demon-shoulder-spike-${dir}`), mHorn);
    spike.scale.set(0.12, 0.48, 0.12);
    spike.position.set(dir * 0.72, 1.48, 0.04);
    spike.rotation.z = dir * 0.45;
  }

  // 5. Weapon: Flaming Hellfire Greatsword / Cleaver
  const rightArm = new THREE.Group();
  rightArm.position.set(0.58, 1.05, 0.06);

  const rArm = addMesh(rightArm, resources.cylinder('demon-arm-r'), mBasalt);
  rArm.scale.set(0.17, 0.58, 0.17);
  rArm.position.set(0.08, -0.24, 0.06);
  rArm.rotation.z = -0.25;

  const weaponGroup = new THREE.Group();
  weaponGroup.position.set(0.24, -0.28, 0.28);
  weaponGroup.rotation.set(-0.45, 0, -0.38);

  // Giant Serrated Volcanic Blade
  const blade = addMesh(weaponGroup, resources.box('demon-blade'), mLavaTorso);
  blade.scale.set(0.22, 1.35, 0.08);
  blade.position.y = 0.65;

  const moltenCore = addMesh(weaponGroup, resources.box('demon-blade-magma'), mMagma);
  moltenCore.scale.set(0.12, 1.25, 0.10);
  moltenCore.position.y = 0.65;

  const hilt = addMesh(weaponGroup, resources.cylinder('demon-hilt'), mHorn);
  hilt.scale.set(0.06, 0.35, 0.06);
  hilt.position.y = -0.12;

  rightArm.add(weaponGroup);
  root.add(rightArm);
  arms.push(rightArm);
  parts.weapon = weaponGroup;
  parts.sword = weaponGroup;

  // Left Arm (Clawed Fist)
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.58, 1.05, 0.06);

  const lArm = addMesh(leftArm, resources.cylinder('demon-arm-l'), mBasalt);
  lArm.scale.set(0.17, 0.58, 0.17);
  lArm.position.set(-0.08, -0.24, 0.06);
  lArm.rotation.z = 0.25;

  for (let c = -1; c <= 1; c += 1) {
    const claw = addMesh(leftArm, resources.cone(`demon-claw-${c}`), mHorn);
    claw.scale.set(0.04, 0.22, 0.04);
    claw.position.set(-0.08 + c * 0.06, -0.56, 0.12);
    claw.rotation.x = Math.PI - 0.3;
  }

  root.add(leftArm);
  arms.push(leftArm);

  // 6. Digitigrade Legs with Heavy Cloven Hooves
  for (const dir of [-1, 1]) {
    const legGroup = new THREE.Group();
    legGroup.position.set(dir * 0.24, 0.46, 0);

    const thigh = addMesh(legGroup, resources.cylinder(`demon-thigh-${dir}`), mBasalt);
    thigh.scale.set(0.16, 0.42, 0.16);
    thigh.position.set(0, -0.18, 0.02);

    const shin = addMesh(legGroup, resources.cylinder(`demon-shin-${dir}`), mBasalt);
    shin.scale.set(0.14, 0.38, 0.14);
    shin.position.set(0, -0.38, -0.06);
    shin.rotation.x = 0.35;

    const hoof = addMesh(legGroup, resources.box(`demon-hoof-${dir}`), mHorn);
    hoof.scale.set(0.24, 0.18, 0.32);
    hoof.position.set(0, -0.52, 0.08);

    root.add(legGroup);
    legs.push(legGroup);
  }

  parts.legs = legs;
  parts.arms = arms;
  parts.body = torso;
  root.userData.parts = parts;
  return root;
}

export function buildStylizedCursedWolf(resources: SharedResources): THREE.Group {
  const root = new THREE.Group();
  root.name = 'stylized-cursed-wolf';
  const parts: Record<string, THREE.Object3D | THREE.Object3D[]> = {};
  const legs: THREE.Group[] = [];

  const peltMat = new THREE.MeshStandardMaterial({
    map: getCursedWolfTexture(),
    roughness: 0.88,
    metalness: 0.12,
  });
  const mDarkPelt = resources.standardMaterial('wolf-dark-pelt', 0x180d09, { roughness: 0.92 });
  const mBone = resources.standardMaterial('wolf-fang-bone', 0xf1f5f9, { roughness: 0.45, metalness: 0.1 });
  const mAmberEye = resources.standardMaterial('wolf-amber-eye', 0xf59e0b, {
    emissive: 0xf59e0b,
    emissiveIntensity: 2.8,
    roughness: 0.1,
  });

  // 1. Arched, Muscular Predatory Torso
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, 0.58, 0);

  const mainBody = addMesh(torsoGroup, resources.cylinder('wolf-body-mesh'), peltMat);
  mainBody.scale.set(0.48, 0.95, 0.52);
  mainBody.rotation.x = Math.PI / 2;
  mainBody.position.set(0, 0, 0);

  const chestVault = addMesh(torsoGroup, resources.sphere('wolf-chest-vault'), peltMat);
  chestVault.scale.set(0.56, 0.52, 0.62);
  chestVault.position.set(0, 0.08, 0.38);

  // Bristling dorsal fur spine
  for (let i = 0; i < 4; i += 1) {
    const spine = addMesh(torsoGroup, resources.cone(`wolf-spine-${i}`), mDarkPelt);
    spine.scale.set(0.12, 0.35 + i * 0.04, 0.18);
    spine.position.set(0, 0.34, 0.35 - i * 0.24);
    spine.rotation.x = -0.45;
  }
  root.add(torsoGroup);

  // 2. Head & Snarling Fanged Jaw tilted toward camera
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.86, 0.58);
  headGroup.rotation.x = -0.26; // Tilted toward overhead camera

  const cranium = addMesh(headGroup, resources.box('wolf-cranium'), peltMat);
  cranium.scale.set(0.44, 0.38, 0.46);
  cranium.position.set(0, 0, 0);

  const snout = addMesh(headGroup, resources.box('wolf-snout'), mDarkPelt);
  snout.scale.set(0.28, 0.22, 0.44);
  snout.position.set(0, -0.06, 0.36);

  const nose = addMesh(headGroup, resources.sphere('wolf-nose'), mDarkPelt);
  nose.scale.set(0.12, 0.08, 0.1);
  nose.position.set(0, 0.02, 0.58);

  // Pointed Feral Ears
  for (const dir of [-1, 1]) {
    const ear = addMesh(headGroup, resources.cone(`wolf-ear-${dir}`), mDarkPelt);
    ear.scale.set(0.12, 0.34, 0.12);
    ear.position.set(dir * 0.18, 0.28, -0.05);
    ear.rotation.set(-0.25, 0, dir * 0.28);
  }

  // Glowing Feral Amber Eyes
  for (const dir of [-1, 1]) {
    const eye = addMesh(headGroup, resources.box(`wolf-eye-${dir}`), mAmberEye);
    eye.scale.set(0.08, 0.04, 0.06);
    eye.position.set(dir * 0.16, 0.08, 0.22);
    eye.rotation.y = dir * 0.22;
  }

  // Sharp Lower Fangs
  for (const dir of [-1, 1]) {
    const fang = addMesh(headGroup, resources.cone(`wolf-fang-${dir}`), mBone);
    fang.scale.set(0.05, 0.14, 0.05);
    fang.position.set(dir * 0.10, -0.16, 0.45);
    fang.rotation.x = Math.PI;
  }
  root.add(headGroup);

  // 3. Quadruped Articulated Legs (Fore & Hind)
  const legPositions = [
    { x: -0.22, z: 0.34, isFore: true },
    { x: 0.22, z: 0.34, isFore: true },
    { x: -0.24, z: -0.32, isFore: false },
    { x: 0.24, z: -0.32, isFore: false },
  ];

  for (let i = 0; i < legPositions.length; i += 1) {
    const { x, z, isFore } = legPositions[i];
    const legGroup = new THREE.Group();
    legGroup.position.set(x, 0.46, z);

    const shoulder = addMesh(legGroup, resources.cylinder(`wolf-sh-${i}`), peltMat);
    shoulder.scale.set(0.14, 0.38, 0.14);
    shoulder.position.set(0, -0.14, 0);
    shoulder.rotation.x = isFore ? 0.12 : -0.18;

    const lowerLeg = addMesh(legGroup, resources.cylinder(`wolf-ll-${i}`), mDarkPelt);
    lowerLeg.scale.set(0.10, 0.34, 0.10);
    lowerLeg.position.set(0, -0.34, isFore ? 0.04 : -0.04);

    const paw = addMesh(legGroup, resources.box(`wolf-paw-${i}`), mDarkPelt);
    paw.scale.set(0.18, 0.10, 0.26);
    paw.position.set(0, -0.44, 0.08);

    root.add(legGroup);
    legs.push(legGroup);
  }

  // 4. Bushy Shadow Tail
  const tail = addMesh(root, resources.cone('wolf-tail'), mDarkPelt);
  tail.scale.set(0.16, 0.65, 0.16);
  tail.position.set(0, 0.58, -0.58);
  tail.rotation.x = -0.85;

  parts.legs = legs;
  parts.body = torsoGroup;
  parts.head = headGroup;
  root.userData.parts = parts;
  return root;
}

export function buildStylizedThornling(resources: SharedResources): THREE.Group {
  const root = new THREE.Group();
  root.name = 'stylized-thornling';
  const parts: Record<string, THREE.Object3D | THREE.Object3D[]> = {};
  const legs: THREE.Group[] = [];
  const arms: THREE.Object3D[] = [];

  const mThornBark = resources.standardMaterial('thornling-bark', 0x3f6212, { roughness: 0.88 });
  const mWoodCore = resources.standardMaterial('thornling-wood', 0x1e293b, { roughness: 0.95 });
  const mThornTip = resources.standardMaterial('thornling-thorn', 0xa16207, { roughness: 0.45, metalness: 0.2 });
  const mToxicSap = resources.standardMaterial('thornling-sap', 0x84cc16, {
    emissive: 0x65a30d,
    emissiveIntensity: 2.5,
    roughness: 0.2,
  });

  // 1. Spiked Briar Seedpod Torso
  const pod = addMesh(root, resources.sphere('thornling-pod'), mThornBark);
  pod.scale.set(0.58, 0.65, 0.52);
  pod.position.set(0, 0.58, 0);

  // Sharp protruding thorns around pod
  for (let i = 0; i < 6; i += 1) {
    const angle = (i / 6) * Math.PI * 2;
    const thorn = addMesh(root, resources.cone(`thornling-thorn-${i}`), mThornTip);
    thorn.scale.set(0.08, 0.35, 0.08);
    thorn.position.set(Math.cos(angle) * 0.38, 0.62 + Math.sin(angle * 2) * 0.12, Math.sin(angle) * 0.34);
    thorn.rotation.set(Math.sin(angle) * 0.8, 0, -Math.cos(angle) * 0.8);
  }

  // 2. Crown of Briars & Toxic Glowing Eyes
  const head = addMesh(root, resources.sphere('thornling-head'), mWoodCore);
  head.scale.set(0.42, 0.44, 0.40);
  head.position.set(0, 1.10, 0.06);

  // Crown Thorns
  for (const dir of [-1, 0, 1]) {
    const crownThorn = addMesh(root, resources.cone(`thorn-crown-${dir}`), mThornTip);
    crownThorn.scale.set(0.09, 0.42 - Math.abs(dir) * 0.08, 0.09);
    crownThorn.position.set(dir * 0.18, 1.38, 0.04);
    crownThorn.rotation.z = dir * -0.28;
  }

  // Glowing Toxic Eyes
  for (const dir of [-1, 1]) {
    const eye = addMesh(root, resources.sphere(`thorn-eye-${dir}`), mToxicSap);
    eye.scale.setScalar(0.08);
    eye.position.set(dir * 0.15, 1.12, 0.28);
  }

  // 3. Spiky Bramble Whip Arms
  for (const dir of [-1, 1]) {
    const arm = addMesh(root, resources.cylinder(`thorn-arm-${dir}`), mThornBark);
    arm.scale.set(0.09, 0.58, 0.09);
    arm.position.set(dir * 0.44, 0.65, 0.06);
    arm.rotation.z = dir * -0.42;
    arm.rotation.x = 0.25;

    const claw = addMesh(root, resources.cone(`thorn-claw-${dir}`), mThornTip);
    claw.scale.set(0.07, 0.26, 0.07);
    claw.position.set(dir * 0.56, 0.38, 0.18);
    claw.rotation.z = dir * -0.65;
    arms.push(arm);
  }

  // 4. Sprig Legs
  for (const dir of [-1, 1]) {
    const legGroup = new THREE.Group();
    legGroup.position.set(dir * 0.20, 0.38, 0);

    const shin = addMesh(legGroup, resources.cylinder(`thorn-leg-${dir}`), mWoodCore);
    shin.scale.set(0.09, 0.36, 0.09);
    shin.position.set(0, -0.16, 0);

    const rootFoot = addMesh(legGroup, resources.box(`thorn-foot-${dir}`), mThornBark);
    rootFoot.scale.set(0.18, 0.08, 0.26);
    rootFoot.position.set(0, -0.32, 0.06);

    root.add(legGroup);
    legs.push(legGroup);
  }

  // Hovering Poison Spore Core
  const sporeCore = addMesh(root, resources.octa('thorn-spore-core'), mToxicSap);
  sporeCore.scale.setScalar(0.18);
  sporeCore.position.set(0, 1.62, 0);

  parts.legs = legs;
  parts.arms = arms;
  parts.body = pod;
  parts.core = sporeCore;
  root.userData.parts = parts;
  return root;
}

export function buildStylizedForestMage(resources: SharedResources): THREE.Group {
  const root = new THREE.Group();
  root.name = 'stylized-forest-mage';
  const parts: Record<string, THREE.Object3D | THREE.Object3D[]> = {};
  const legs: THREE.Group[] = [];
  const arms: THREE.Object3D[] = [];

  const robeMat = new THREE.MeshStandardMaterial({
    map: getBrambleClothTexture(),
    roughness: 0.88,
    metalness: 0.08,
  });
  const mBark = resources.standardMaterial('fm-bark', 0x3a2718, { roughness: 0.95 });
  const mDarkFoliage = resources.standardMaterial('fm-foliage', 0x142816, { roughness: 0.85 });
  const mPoisonBloom = resources.standardMaterial('fm-bloom', 0xa855f7, {
    emissive: 0x9333ea,
    emissiveIntensity: 2.8,
    roughness: 0.25,
  });

  // 1. Layered Tattered Bramble Robe
  const robe = addMesh(root, resources.cone('fm-robe'), robeMat);
  robe.scale.set(0.82, 1.35, 0.68);
  robe.position.set(0, 0.65, 0);

  const cowl = addMesh(root, resources.cone('fm-cowl'), mDarkFoliage);
  cowl.scale.set(0.72, 0.72, 0.68);
  cowl.position.set(0, 1.34, -0.02);
  cowl.rotation.x = -0.15;

  // Carved Wooden Mask & Glowing Occult Eyes
  const mask = addMesh(root, resources.box('fm-mask'), mBark);
  mask.scale.set(0.42, 0.46, 0.36);
  mask.position.set(0, 1.36, 0.12);

  for (const dir of [-1, 1]) {
    const eye = addMesh(root, resources.box(`fm-eye-${dir}`), mPoisonBloom);
    eye.scale.set(0.09, 0.04, 0.04);
    eye.position.set(dir * 0.14, 1.38, 0.32);
    eye.rotation.z = dir * -0.15;
  }

  // Sweeping Briar Antlers
  for (const dir of [-1, 1]) {
    const antler = addMesh(root, resources.cone(`fm-antler-${dir}`), mBark);
    antler.scale.set(0.11, 0.68, 0.11);
    antler.position.set(dir * 0.32, 1.82, -0.05);
    antler.rotation.set(-0.2, 0, dir * 0.45);

    const tine = addMesh(root, resources.cone(`fm-tine-${dir}`), mBark);
    tine.scale.set(0.07, 0.32, 0.07);
    tine.position.set(dir * 0.45, 1.72, 0.10);
    tine.rotation.set(0.35, 0, dir * 0.65);
  }

  // 2. Casting Robe Arms
  for (const dir of [-1, 1]) {
    const arm = addMesh(root, resources.cylinder(`fm-arm-${dir}`), mDarkFoliage);
    arm.scale.set(0.14, 0.52, 0.14);
    arm.position.set(dir * 0.48, 0.88, 0.06);
    arm.rotation.z = dir * -0.28;
    arms.push(arm);
  }

  // 3. Elder Root Staff with Hovering Poison Orchid
  const staff = addMesh(root, resources.cylinder('fm-staff'), mBark);
  staff.scale.set(0.06, 1.55, 0.06);
  staff.position.set(0.68, 0.92, 0.12);
  staff.rotation.z = -0.22;

  const staffHead = addMesh(root, resources.torus('fm-staff-head'), mBark);
  staffHead.scale.set(0.18, 0.18, 0.06);
  staffHead.position.set(0.85, 1.62, 0.12);
  staffHead.rotation.x = Math.PI / 2;

  const poisonOrb = addMesh(root, resources.octa('fm-poison-orb'), mPoisonBloom);
  poisonOrb.scale.setScalar(0.22);
  poisonOrb.position.set(0.85, 1.62, 0.12);

  // 4. Stride Legs
  for (const dir of [-1, 1]) {
    const legGroup = new THREE.Group();
    legGroup.position.set(dir * 0.18, 0.42, 0);
    const leg = addMesh(legGroup, resources.cylinder(`fm-leg-${dir}`), mDarkFoliage);
    leg.scale.set(0.11, 0.38, 0.11);
    leg.position.set(0, -0.16, 0);
    root.add(legGroup);
    legs.push(legGroup);
  }

  parts.legs = legs;
  parts.arms = arms;
  parts.body = robe;
  parts.weapon = staff;
  parts.core = poisonOrb;
  root.userData.parts = parts;
  return root;
}

export function buildStylizedForestGuardian(resources: SharedResources): THREE.Group {
  const root = new THREE.Group();
  root.name = 'stylized-forest-guardian';
  const parts: Record<string, THREE.Object3D | THREE.Object3D[]> = {};
  const legs: THREE.Group[] = [];
  const arms: THREE.Object3D[] = [];

  const barkMat = new THREE.MeshStandardMaterial({
    map: getTreantBarkTexture(),
    roughness: 0.92,
    metalness: 0.05,
  });
  const mStone = resources.standardMaterial('fg-stone', 0x475569, { roughness: 0.78, metalness: 0.2 });
  const mEmeraldGlow = resources.standardMaterial('fg-emerald', 0x10b981, {
    emissive: 0x059669,
    emissiveIntensity: 2.6,
    roughness: 0.15,
  });

  // 1. Colossal Megalithic Torso
  const torso = addMesh(root, resources.cylinder('fg-torso'), barkMat);
  torso.scale.set(0.95, 1.15, 0.75);
  torso.position.set(0, 0.88, 0);

  // Stone Cuirass Chestplate
  const stoneChest = addMesh(root, resources.box('fg-stone-chest'), mStone);
  stoneChest.scale.set(0.88, 0.65, 0.32);
  stoneChest.position.set(0, 1.05, 0.36);

  // Runic Emerald Chest Inscription
  const chestRune = addMesh(root, resources.octa('fg-chest-rune'), mEmeraldGlow);
  chestRune.scale.set(0.18, 0.26, 0.12);
  chestRune.position.set(0, 1.05, 0.52);

  // Massive Boulder Pauldrons
  for (const dir of [-1, 1]) {
    const pauldron = addMesh(root, resources.ico(`fg-pauldron-${dir}`), mStone);
    pauldron.scale.set(0.52, 0.45, 0.48);
    pauldron.position.set(dir * 0.85, 1.36, 0.04);
  }

  // 2. Chiseled Stone Head
  const head = addMesh(root, resources.box('fg-head'), mStone);
  head.scale.set(0.55, 0.48, 0.52);
  head.position.set(0, 1.58, 0.06);

  // Glowing Emerald Eye Slits
  for (const dir of [-1, 1]) {
    const eye = addMesh(root, resources.box(`fg-eye-${dir}`), mEmeraldGlow);
    eye.scale.set(0.12, 0.04, 0.06);
    eye.position.set(dir * 0.16, 1.60, 0.32);
  }

  // 3. Thick Timber Arms
  for (const dir of [-1, 1]) {
    const arm = addMesh(root, resources.cylinder(`fg-arm-${dir}`), barkMat);
    arm.scale.set(0.24, 0.78, 0.24);
    arm.position.set(dir * 0.82, 0.85, 0.06);
    arm.rotation.z = dir * -0.25;
    arms.push(arm);
  }

  // Heavy Bark Tower Shield
  const shield = addMesh(root, resources.cylinder('fg-shield'), barkMat);
  shield.scale.set(0.55, 0.16, 0.72);
  shield.position.set(-0.95, 0.88, 0.24);
  shield.rotation.x = Math.PI / 2;

  const shieldBoss = addMesh(root, resources.sphere('fg-shield-boss'), mStone);
  shieldBoss.scale.setScalar(0.22);
  shieldBoss.position.set(-0.95, 0.88, 0.34);

  // Petrified Root Warclub
  const warClub = addMesh(root, resources.cylinder('fg-club'), mStone);
  warClub.scale.set(0.18, 1.35, 0.18);
  warClub.position.set(0.95, 0.88, 0.12);
  warClub.rotation.z = -0.38;

  // 4. Sturdy Trunk Pillar Legs
  for (const dir of [-1, 1]) {
    const legGroup = new THREE.Group();
    legGroup.position.set(dir * 0.32, 0.52, 0);

    const shin = addMesh(legGroup, resources.cylinder(`fg-shin-${dir}`), barkMat);
    shin.scale.set(0.24, 0.54, 0.24);
    shin.position.set(0, -0.22, 0);

    const foot = addMesh(legGroup, resources.box(`fg-foot-${dir}`), mStone);
    foot.scale.set(0.35, 0.22, 0.48);
    foot.position.set(0, -0.46, 0.10);

    root.add(legGroup);
    legs.push(legGroup);
  }

  parts.legs = legs;
  parts.arms = arms;
  parts.body = torso;
  parts.shield = shield;
  parts.weapon = warClub;
  parts.sword = warClub;
  root.userData.parts = parts;
  return root;
}

export function buildStylizedTreant(resources: SharedResources): THREE.Group {
  const root = new THREE.Group();
  root.name = 'stylized-treant';
  const parts: Record<string, THREE.Object3D | THREE.Object3D[]> = {};
  const legs: THREE.Group[] = [];
  const arms: THREE.Object3D[] = [];

  const barkMat = new THREE.MeshStandardMaterial({
    map: getTreantBarkTexture(),
    roughness: 0.94,
    metalness: 0.04,
  });
  const mFoliage = resources.standardMaterial('treant-canopy', 0x365314, { roughness: 0.82 });
  const mAmberSap = resources.standardMaterial('treant-sap', 0xf97316, {
    emissive: 0xea580c,
    emissiveIntensity: 2.2,
    roughness: 0.25,
  });

  // 1. Towering Knotted Oak Trunk
  const trunk = addMesh(root, resources.cylinder('treant-trunk'), barkMat);
  trunk.scale.set(1.05, 1.52, 0.88);
  trunk.position.set(0, 1.05, 0);

  // Hollow Heart Crevice with Glowing Life-Sap
  const heartCrevice = addMesh(root, resources.box('treant-heart'), mAmberSap);
  heartCrevice.scale.set(0.28, 0.42, 0.12);
  heartCrevice.position.set(0, 1.05, 0.45);

  // Ancient Tree Face (deep eye sockets)
  for (const dir of [-1, 1]) {
    const eyeHollow = addMesh(root, resources.sphere(`treant-eye-${dir}`), mAmberSap);
    eyeHollow.scale.setScalar(0.12);
    eyeHollow.position.set(dir * 0.24, 1.55, 0.44);
  }

  // 2. Sprawling Leafy Canopy Crown
  const mainCanopy = addMesh(root, resources.ico('treant-crown'), mFoliage);
  mainCanopy.scale.set(1.25, 0.85, 1.15);
  mainCanopy.position.set(0, 2.15, 0.05);

  for (const dir of [-1, 1]) {
    const twig = addMesh(root, resources.cone(`treant-branch-${dir}`), barkMat);
    twig.scale.set(0.14, 0.72, 0.14);
    twig.position.set(dir * 0.65, 2.35, -0.10);
    twig.rotation.set(-0.25, 0, dir * 0.55);
  }

  // 3. Giant Knotted Timber Arms
  for (const dir of [-1, 1]) {
    const arm = addMesh(root, resources.cylinder(`treant-arm-${dir}`), barkMat);
    arm.scale.set(0.32, 1.15, 0.32);
    arm.position.set(dir * 0.95, 1.15, 0.06);
    arm.rotation.z = dir * -0.32;
    arms.push(arm);
  }

  // 4. Sturdy Buttress Root Stomp Limbs
  for (const dir of [-1, 1]) {
    const legGroup = new THREE.Group();
    legGroup.position.set(dir * 0.38, 0.62, 0);

    const rootLeg = addMesh(legGroup, resources.cylinder(`treant-root-${dir}`), barkMat);
    rootLeg.scale.set(0.30, 0.65, 0.30);
    rootLeg.position.set(0, -0.28, 0.02);

    const baseRoot = addMesh(legGroup, resources.box(`treant-base-${dir}`), barkMat);
    baseRoot.scale.set(0.42, 0.26, 0.55);
    baseRoot.position.set(0, -0.55, 0.10);

    root.add(legGroup);
    legs.push(legGroup);
  }

  parts.legs = legs;
  parts.arms = arms;
  parts.body = trunk;
  parts.crown = mainCanopy;
  root.userData.parts = parts;
  return root;
}

export function buildStylizedFrostWraith(resources: SharedResources): THREE.Group {
  const root = new THREE.Group();
  root.name = 'stylized-frost-wraith';
  const parts: Record<string, THREE.Object3D | THREE.Object3D[]> = {};

  const iceMat = new THREE.MeshStandardMaterial({
    map: getIceRimeTexture(),
    roughness: 0.18,
    metalness: 0.25,
    transparent: true,
    opacity: 0.85,
  });
  const mWhiteIce = resources.standardMaterial('wraith-pure-ice', 0xf0f9ff, {
    emissive: 0x7dd3fc,
    emissiveIntensity: 1.2,
    roughness: 0.15,
  });
  const mCyanGlow = resources.basicMaterial('wraith-cyan-glow', 0x38bdf8, { transparent: true, opacity: 0.95 });

  // 1. Hovering Jagged Glacial Shroud
  const shroud = addMesh(root, resources.cone('wraith-shroud'), iceMat);
  shroud.scale.set(0.72, 1.25, 0.62);
  shroud.position.set(0, 0.88, 0);

  // Trailing Icicle Ribbons
  for (const dir of [-1, 1]) {
    const spike = addMesh(root, resources.cone(`wraith-icicle-${dir}`), mWhiteIce);
    spike.scale.set(0.12, 0.75, 0.12);
    spike.position.set(dir * 0.38, 0.45, -0.08);
    spike.rotation.set(0.35, 0, dir * 0.30);
  }

  // 2. Faceted Glacial Ice Mask & Piercing Eyes
  const mask = addMesh(root, resources.octa('wraith-mask'), mWhiteIce);
  mask.scale.set(0.44, 0.52, 0.36);
  mask.position.set(0, 1.45, 0.08);

  for (const dir of [-1, 1]) {
    const eye = addMesh(root, resources.box(`wraith-eye-${dir}`), mCyanGlow);
    eye.scale.set(0.10, 0.04, 0.04);
    eye.position.set(dir * 0.14, 1.48, 0.26);
  }

  // Glacial Crown Spikes
  for (const dir of [-1, 0, 1]) {
    const crown = addMesh(root, resources.cone(`wraith-crown-${dir}`), mWhiteIce);
    crown.scale.set(0.09, 0.55 - Math.abs(dir) * 0.12, 0.09);
    crown.position.set(dir * 0.22, 1.82, -0.04);
    crown.rotation.z = dir * -0.32;
  }

  // 3. Orbiting Frost Spire Core Ring
  const frostRing = new THREE.Group();
  frostRing.position.set(0, 1.05, 0);
  for (let i = 0; i < 4; i += 1) {
    const angle = (i / 4) * Math.PI * 2;
    const crystal = addMesh(frostRing, resources.octa(`wraith-ring-${i}`), mWhiteIce);
    crystal.scale.setScalar(0.14);
    crystal.position.set(Math.cos(angle) * 0.55, 0, Math.sin(angle) * 0.55);
  }
  root.add(frostRing);

  parts.body = shroud;
  parts.head = mask;
  parts.core = frostRing;
  root.userData.parts = parts;
  return root;
}

export function buildStylizedIceMage(resources: SharedResources): THREE.Group {
  const root = new THREE.Group();
  root.name = 'stylized-ice-mage';
  const parts: Record<string, THREE.Object3D | THREE.Object3D[]> = {};
  const legs: THREE.Group[] = [];
  const arms: THREE.Object3D[] = [];

  const iceMat = new THREE.MeshStandardMaterial({
    map: getIceRimeTexture(),
    roughness: 0.22,
    metalness: 0.20,
  });
  const mDeepRobe = resources.standardMaterial('im-robe', 0x0c2738, { roughness: 0.85 });
  const mIceCrystal = resources.standardMaterial('im-crystal', 0xbfeaff, {
    emissive: 0x38bdf8,
    emissiveIntensity: 2.2,
    roughness: 0.12,
    metalness: 0.25,
  });

  // 1. Frost-Rimed Magus Robes
  const robe = addMesh(root, resources.cone('im-robe-mesh'), mDeepRobe);
  robe.scale.set(0.82, 1.35, 0.68);
  robe.position.set(0, 0.66, 0);

  const mantle = addMesh(root, resources.torus('im-mantle'), iceMat);
  mantle.scale.set(0.48, 0.38, 0.14);
  mantle.position.set(0, 1.15, 0.04);
  mantle.rotation.x = Math.PI / 2;

  // Deep Frost Hood & Glowing Cyan Visage
  const hood = addMesh(root, resources.cone('im-hood'), mDeepRobe);
  hood.scale.set(0.72, 0.78, 0.72);
  hood.position.set(0, 1.42, -0.04);
  hood.rotation.x = -0.12;

  const maskVoid = addMesh(root, resources.sphere('im-face-void'), resources.basicMaterial('im-void', 0x03121f));
  maskVoid.scale.set(0.42, 0.44, 0.36);
  maskVoid.position.set(0, 1.36, 0.12);

  for (const dir of [-1, 1]) {
    const eye = addMesh(root, resources.box(`im-eye-${dir}`), mIceCrystal);
    eye.scale.set(0.09, 0.04, 0.04);
    eye.position.set(dir * 0.14, 1.38, 0.30);
  }

  // Floating Ice-Shard Pauldrons
  for (const dir of [-1, 1]) {
    const shard = addMesh(root, resources.octa(`im-pauldron-${dir}`), mIceCrystal);
    shard.scale.set(0.18, 0.38, 0.18);
    shard.position.set(dir * 0.62, 1.22, 0.04);
    shard.rotation.z = dir * -0.35;
  }

  // 2. Casting Robe Arms
  for (const dir of [-1, 1]) {
    const arm = addMesh(root, resources.cylinder(`im-arm-${dir}`), mDeepRobe);
    arm.scale.set(0.14, 0.52, 0.14);
    arm.position.set(dir * 0.48, 0.88, 0.06);
    arm.rotation.z = dir * -0.28;
    arms.push(arm);
  }

  // 3. Glacial Snowflake Spire Staff
  const staff = addMesh(root, resources.cylinder('im-staff'), iceMat);
  staff.scale.set(0.06, 1.55, 0.06);
  staff.position.set(0.66, 0.90, 0.12);
  staff.rotation.z = -0.20;

  // Rotating Snowflake Fractal Core
  const snowflakeCore = new THREE.Group();
  snowflakeCore.position.set(0.82, 1.62, 0.12);
  for (let i = 0; i < 6; i += 1) {
    const angle = (i / 6) * Math.PI * 2;
    const spike = addMesh(snowflakeCore, resources.cone(`snowflake-tine-${i}`), mIceCrystal);
    spike.scale.set(0.06, 0.28, 0.06);
    spike.position.set(Math.cos(angle) * 0.14, Math.sin(angle) * 0.14, 0);
    spike.rotation.z = angle - Math.PI / 2;
  }
  root.add(snowflakeCore);

  // 4. Stride Legs
  for (const dir of [-1, 1]) {
    const legGroup = new THREE.Group();
    legGroup.position.set(dir * 0.18, 0.42, 0);
    const leg = addMesh(legGroup, resources.cylinder(`im-leg-${dir}`), mDeepRobe);
    leg.scale.set(0.11, 0.38, 0.11);
    leg.position.set(0, -0.16, 0);
    root.add(legGroup);
    legs.push(legGroup);
  }

  parts.legs = legs;
  parts.arms = arms;
  parts.body = robe;
  parts.weapon = staff;
  parts.core = snowflakeCore;
  root.userData.parts = parts;
  return root;
}

export function buildStylizedImp(resources: SharedResources): THREE.Group {
  const root = new THREE.Group();
  root.name = 'stylized-imp';
  const parts: Record<string, THREE.Object3D | THREE.Object3D[]> = {};
  const legs: THREE.Group[] = [];
  const arms: THREE.Object3D[] = [];

  const mImpSkin = resources.standardMaterial('imp-skin', 0xd94632, { roughness: 0.72 });
  const mDarkPlate = resources.standardMaterial('imp-dark', 0x3b1111, { roughness: 0.88 });
  const mHorn = resources.standardMaterial('imp-horn', 0x1f0b0b, { roughness: 0.45, metalness: 0.2 });
  const mFireOrb = resources.standardMaterial('imp-fire', 0xf59e0b, {
    emissive: 0xef4444,
    emissiveIntensity: 3.2,
    roughness: 0.15,
  });

  // 1. Compact athletic imp torso
  const torso = addMesh(root, resources.cylinder('imp-torso'), mImpSkin);
  torso.scale.set(0.48, 0.62, 0.42);
  torso.position.set(0, 0.58, 0);

  // 2. Large Expressive Imp Head with Horns & Grin
  const head = addMesh(root, resources.sphere('imp-head'), mImpSkin);
  head.scale.set(0.44, 0.42, 0.42);
  head.position.set(0, 1.02, 0.08);

  for (const dir of [-1, 1]) {
    const horn = addMesh(root, resources.cone(`imp-horn-${dir}`), mHorn);
    horn.scale.set(0.12, 0.45, 0.12);
    horn.position.set(dir * 0.22, 1.34, 0.04);
    horn.rotation.set(-0.25, 0, dir * 0.48);

    const ear = addMesh(root, resources.cone(`imp-ear-${dir}`), mImpSkin);
    ear.scale.set(0.08, 0.28, 0.08);
    ear.position.set(dir * 0.32, 1.02, -0.02);
    ear.rotation.set(0, 0, dir * -0.75);

    const eye = addMesh(root, resources.box(`imp-eye-${dir}`), mFireOrb);
    eye.scale.set(0.08, 0.05, 0.04);
    eye.position.set(dir * 0.14, 1.05, 0.26);
  }

  // 3. Spiky Bat Wings
  const wings: THREE.Object3D[] = [];
  for (const dir of [-1, 1]) {
    const wing = addMesh(root, resources.cone(`imp-wing-${dir}`), mDarkPlate);
    wing.scale.set(0.45, 0.62, 0.08);
    wing.position.set(dir * 0.42, 0.72, -0.18);
    wing.rotation.set(0, 0, dir * 0.45);
    wings.push(wing);
  }

  // 4. Arms Clutching Crackling Firebomb
  for (const dir of [-1, 1]) {
    const arm = addMesh(root, resources.cylinder(`imp-arm-${dir}`), mImpSkin);
    arm.scale.set(0.10, 0.42, 0.10);
    arm.position.set(dir * 0.34, 0.62, 0.14);
    arm.rotation.set(0.45, 0, dir * -0.35);
    arms.push(arm);
  }

  const fireBomb = addMesh(root, resources.sphere('imp-firebomb'), mFireOrb);
  fireBomb.scale.setScalar(0.24);
  fireBomb.position.set(0, 0.58, 0.34);

  // 5. Spade-tipped Tail
  const tail = addMesh(root, resources.cone('imp-tail'), mHorn);
  tail.scale.set(0.12, 0.48, 0.12);
  tail.position.set(0, 0.52, -0.32);
  tail.rotation.x = -0.75;

  // 6. Hoofed Digitigrade Legs
  for (const dir of [-1, 1]) {
    const legGroup = new THREE.Group();
    legGroup.position.set(dir * 0.18, 0.38, 0);

    const thigh = addMesh(legGroup, resources.cylinder(`imp-thigh-${dir}`), mImpSkin);
    thigh.scale.set(0.11, 0.32, 0.11);
    thigh.position.set(0, -0.12, 0);

    const hoof = addMesh(legGroup, resources.box(`imp-hoof-${dir}`), mHorn);
    hoof.scale.set(0.16, 0.12, 0.22);
    hoof.position.set(0, -0.30, 0.04);

    root.add(legGroup);
    legs.push(legGroup);
  }

  parts.legs = legs;
  parts.arms = arms;
  parts.wings = wings;
  parts.body = torso;
  parts.core = fireBomb;
  root.userData.parts = parts;
  return root;
}
