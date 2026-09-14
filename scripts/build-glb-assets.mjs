import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

// Setup FileReader shim for Node environment
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf;
      if (this.onloadend) this.onloadend();
    });
  }
};

const exporter = new GLTFExporter();

async function exportGLB(group, outputPath) {
  const glb = await exporter.parseAsync(group, { binary: true });
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, Buffer.from(glb));
  console.log(`[Built GLB] ${path.relative(process.cwd(), outputPath)} (${(glb.byteLength / 1024).toFixed(1)} KB)`);
}

// -------------------------------------------------------------
// HELPER MATERIAL & MESH FACTORIES
// -------------------------------------------------------------
function matStandard(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.7,
    metalness: options.metalness ?? 0.1,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1.0,
    side: options.side ?? THREE.FrontSide,
  });
}

function matBasic(color, options = {}) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1.0,
    side: options.side ?? THREE.FrontSide,
  });
}

function createBox(sx, sy, sz, material, px = 0, py = 0, pz = 0, rx = 0, ry = 0, rz = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material);
  mesh.position.set(px, py, pz);
  mesh.rotation.set(rx, ry, rz);
  return mesh;
}

function createCylinder(rt, rb, h, segs, material, px = 0, py = 0, pz = 0, rx = 0, ry = 0, rz = 0) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, segs), material);
  mesh.position.set(px, py, pz);
  mesh.rotation.set(rx, ry, rz);
  return mesh;
}

function createCone(r, h, segs, material, px = 0, py = 0, pz = 0, rx = 0, ry = 0, rz = 0) {
  const mesh = new THREE.Mesh(new THREE.ConeGeometry(r, h, segs), material);
  mesh.position.set(px, py, pz);
  mesh.rotation.set(rx, ry, rz);
  return mesh;
}

function createSphere(r, segs, material, px = 0, py = 0, pz = 0) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, segs, segs), material);
  mesh.position.set(px, py, pz);
  return mesh;
}

function createOcta(r, material, px = 0, py = 0, pz = 0, rx = 0, ry = 0, rz = 0) {
  const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(r), material);
  mesh.position.set(px, py, pz);
  mesh.rotation.set(rx, ry, rz);
  return mesh;
}

function createTorus(r, tube, radSegs, tubSegs, material, px = 0, py = 0, pz = 0, rx = 0, ry = 0, rz = 0) {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(r, tube, radSegs, tubSegs), material);
  mesh.position.set(px, py, pz);
  mesh.rotation.set(rx, ry, rz);
  return mesh;
}

// -------------------------------------------------------------
// 1. HERO: SHADOW MAGE (Mascot Level Chibi Action Sculpt)
// -------------------------------------------------------------
function buildShadowHero() {
  const hero = new THREE.Group();
  hero.name = 'hero_shadow';

  const mDarkRobe = matStandard(0x0c1628, { roughness: 0.85 });
  const mNavyTunic = matStandard(0x183462, { roughness: 0.72 });
  const mGoldTrim = matStandard(0xebb338, { roughness: 0.35, metalness: 0.75 });
  const mCrimsonScarf = matStandard(0xdb2c48, { roughness: 0.65, emissive: 0x4a0a14, emissiveIntensity: 0.35 });
  const mCrimsonDark = matStandard(0xa81c34, { roughness: 0.7 });
  const mBoots = matStandard(0x080e18, { roughness: 0.88 });
  const mBelt = matStandard(0x281810, { roughness: 0.8 });
  const mCyanGaze = matBasic(0x62f0ff);
  const mAncientWood = matStandard(0x382218, { roughness: 0.92 });
  const mManaCrystal = matStandard(0x56e0ff, { roughness: 0.15, metalness: 0.1, emissive: 0x1db5e6, emissiveIntensity: 2.2 });
  const mHaloGlow = matBasic(0x56e0ff, { transparent: true, opacity: 0.55 });

  // Lower Robe Flared Skirt (chibi proportions, readable silhouette)
  hero.add(createCone(0.58, 0.95, 8, mDarkRobe, 0, 0.52, 0));
  // Inner Tunic with gold hem
  hero.add(createCylinder(0.38, 0.46, 0.72, 8, mNavyTunic, 0, 0.68, 0));
  hero.add(createTorus(0.44, 0.03, 4, 12, mGoldTrim, 0, 0.36, 0, Math.PI / 2, 0, 0));

  // Leather Belt with Gold Buckle & Pouch
  hero.add(createTorus(0.40, 0.04, 4, 12, mBelt, 0, 0.66, 0, Math.PI / 2, 0, 0));
  hero.add(createBox(0.12, 0.1, 0.05, mGoldTrim, 0, 0.66, 0.38));
  hero.add(createBox(0.12, 0.14, 0.1, mBelt, -0.32, 0.64, 0.12, 0, 0.3, 0.1));

  // Peaked Wizard Hood (dramatic silhouette, swept backward tip)
  hero.add(createCone(0.54, 0.88, 8, mDarkRobe, 0, 1.4, -0.06, 0.22, 0, 0));
  // Hood Cowl rim (folds framing the face)
  hero.add(createTorus(0.34, 0.09, 6, 14, mNavyTunic, 0, 1.18, 0.12, Math.PI / 2.2, 0, 0));
  hero.add(createTorus(0.36, 0.025, 4, 14, mGoldTrim, 0, 1.18, 0.14, Math.PI / 2.2, 0, 0));

  // Dark Void Face Cavity (mystery shadow face)
  hero.add(createSphere(0.24, 7, matBasic(0x020408), 0, 1.22, 0.06));

  // Glowing Cyan Soul Eyes (intense slanted determination)
  hero.add(createBox(0.09, 0.038, 0.02, mCyanGaze, -0.11, 1.25, 0.26, 0, -0.12, -0.1));
  hero.add(createBox(0.09, 0.038, 0.02, mCyanGaze, 0.11, 1.25, 0.26, 0, 0.12, 0.1));

  // Billowing Crimson Scarf (iconic mascot accent, wraps neck)
  hero.add(createTorus(0.35, 0.1, 6, 12, mCrimsonScarf, 0, 1.04, 0.06, Math.PI / 2, 0, 0));
  // Flowing Scarf Tails (dynamic layered curves billowing to the left rear)
  hero.add(createBox(0.15, 0.07, 0.68, mCrimsonScarf, -0.24, 0.98, -0.26, -0.32, -0.25, 0.15));
  hero.add(createBox(0.13, 0.06, 0.52, mCrimsonDark, -0.32, 0.84, -0.46, -0.45, -0.35, 0.2));

  // Robe Sleeves & Hands
  hero.add(createCylinder(0.11, 0.15, 0.46, 6, mDarkRobe, -0.38, 0.74, 0.02, 0, 0, -0.28));
  hero.add(createSphere(0.09, 6, mBoots, -0.46, 0.54, 0.04)); // left hand
  hero.add(createCylinder(0.11, 0.15, 0.46, 6, mDarkRobe, 0.38, 0.74, 0.02, 0, 0, 0.28));
  hero.add(createSphere(0.09, 6, mBoots, 0.46, 0.54, 0.08)); // right hand gripping staff

  // Sturdy Wizard Boots (upturned tips)
  hero.add(createBox(0.18, 0.22, 0.32, mBoots, -0.18, 0.12, 0.05));
  hero.add(createCone(0.08, 0.14, 4, mBoots, -0.18, 0.1, 0.22, 0.6, 0, 0));
  hero.add(createBox(0.18, 0.22, 0.32, mBoots, 0.18, 0.12, 0.05));
  hero.add(createCone(0.08, 0.14, 4, mBoots, 0.18, 0.1, 0.22, 0.6, 0, 0));

  // Gnarled Arcane Staff with Levitating Mana Crystal
  const staff = new THREE.Group();
  staff.name = 'hero_staff';
  // Twisted staff shaft with knots
  staff.add(createCylinder(0.035, 0.042, 1.5, 6, mAncientWood, 0, 0.75, 0));
  staff.add(createTorus(0.05, 0.015, 4, 8, mAncientWood, 0, 0.95, 0, Math.PI / 3, 0, 0));
  staff.add(createTorus(0.05, 0.015, 4, 8, mAncientWood, 0, 0.55, 0, -Math.PI / 4, 0, 0));
  // Gold dragon-claw head prongs
  staff.add(createCylinder(0.05, 0.04, 0.1, 6, mGoldTrim, 0, 1.38, 0));
  staff.add(createBox(0.03, 0.26, 0.03, mGoldTrim, -0.12, 1.52, 0, 0, 0, -0.32));
  staff.add(createBox(0.03, 0.26, 0.03, mGoldTrim, 0.12, 1.52, 0, 0, 0, 0.32));
  staff.add(createBox(0.03, 0.26, 0.03, mGoldTrim, 0, 1.52, 0.12, 0.32, 0, 0));
  // Faceted glowing cyan mana crystal
  staff.add(createOcta(0.18, mManaCrystal, 0, 1.56, 0));
  // Levitating runic halo
  staff.add(createTorus(0.25, 0.02, 4, 14, mHaloGlow, 0, 1.56, 0, Math.PI / 3, 0, 0));

  staff.position.set(0.5, 0, 0.12);
  staff.rotation.set(0, 0, -0.16);
  hero.add(staff);

  return hero;
}

// -------------------------------------------------------------
// 2. COMMON ENEMIES (Polished Silhouettes & Proportions)
// -------------------------------------------------------------
function buildSkeletonEnemy() {
  const root = new THREE.Group();
  root.name = 'enemy_skeleton';
  const mBone = matStandard(0xc8d8e6, { roughness: 0.82 });
  const mDarkMetal = matStandard(0x243242, { roughness: 0.55, metalness: 0.6 });
  const mWood = matStandard(0x3e281b, { roughness: 0.92 });
  const mSoulEye = matBasic(0x56e2ff);

  // Skull with Cranial Cavity & Jaw
  root.add(createBox(0.42, 0.38, 0.4, mBone, 0, 1.22, 0));
  root.add(createBox(0.28, 0.16, 0.28, mBone, 0, 0.98, 0.08));
  // Deep eye sockets with soul fire
  root.add(createBox(0.1, 0.1, 0.05, mSoulEye, -0.11, 1.24, 0.2));
  root.add(createBox(0.1, 0.1, 0.05, mSoulEye, 0.11, 1.24, 0.2));

  // Spine & Ribcage
  root.add(createCylinder(0.07, 0.07, 0.52, 6, mBone, 0, 0.7, 0));
  root.add(createBox(0.42, 0.07, 0.28, mBone, 0, 0.86, 0.02));
  root.add(createBox(0.38, 0.07, 0.25, mBone, 0, 0.74, 0.02));
  root.add(createBox(0.32, 0.07, 0.22, mBone, 0, 0.62, 0.02));
  // Pelvic bone
  root.add(createBox(0.34, 0.12, 0.22, mBone, 0, 0.46, 0));

  // Scrap Iron Pauldron
  root.add(createBox(0.25, 0.15, 0.25, mDarkMetal, -0.32, 0.9, 0, 0, 0, 0.25));

  // Arms & Legs
  root.add(createCylinder(0.045, 0.045, 0.48, 5, mBone, -0.3, 0.62, 0, 0, 0, 0.2));
  root.add(createCylinder(0.045, 0.045, 0.48, 5, mBone, 0.3, 0.62, 0, 0, 0, -0.2));
  root.add(createCylinder(0.055, 0.055, 0.48, 5, mBone, -0.14, 0.24, 0));
  root.add(createCylinder(0.055, 0.055, 0.48, 5, mBone, 0.14, 0.24, 0));

  // Notched Iron Broadsword
  const sword = new THREE.Group();
  sword.add(createBox(0.09, 0.72, 0.03, mDarkMetal, 0, 0.42, 0));
  sword.add(createBox(0.24, 0.05, 0.06, mDarkMetal, 0, 0.14, 0));
  sword.add(createCylinder(0.03, 0.03, 0.18, 5, mWood, 0, 0.04, 0));
  sword.position.set(0.42, 0.46, 0.1);
  sword.rotation.set(-0.25, 0, -0.32);
  root.add(sword);

  // Banded Round Shield
  const shield = new THREE.Group();
  shield.add(createCylinder(0.26, 0.26, 0.06, 8, mWood, 0, 0, 0, Math.PI / 2, 0, 0));
  shield.add(createTorus(0.25, 0.035, 4, 10, mDarkMetal, 0, 0, 0.02, 0, 0, 0));
  shield.add(createSphere(0.07, 6, mDarkMetal, 0, 0, 0.05));
  shield.position.set(-0.4, 0.6, 0.15);
  root.add(shield);

  return root;
}

function buildBatEnemy() {
  const root = new THREE.Group();
  root.name = 'enemy_bat';
  const mFlesh = matStandard(0x2c1e44, { roughness: 0.78 });
  const mWingMembrane = matStandard(0x1a122e, { roughness: 0.85 });
  const mEyes = matBasic(0xffcc44);
  const mEars = matStandard(0x56285a, { roughness: 0.8 });
  const mFangs = matStandard(0xeeeeee, { roughness: 0.4 });

  // Body & Head
  root.add(createSphere(0.32, 8, mFlesh, 0, 0.75, 0));
  // Pointed Ears
  root.add(createCone(0.12, 0.32, 5, mEars, -0.18, 1.02, 0.05, -0.22, 0, -0.28));
  root.add(createCone(0.12, 0.32, 5, mEars, 0.18, 1.02, 0.05, -0.22, 0, 0.28));
  // Glowing Eyes & Fangs
  root.add(createSphere(0.06, 5, mEyes, -0.1, 0.82, 0.24));
  root.add(createSphere(0.06, 5, mEyes, 0.1, 0.82, 0.24));
  root.add(createCone(0.025, 0.08, 4, mFangs, -0.06, 0.66, 0.28, Math.PI, 0, 0));
  root.add(createCone(0.025, 0.08, 4, mFangs, 0.06, 0.66, 0.28, Math.PI, 0, 0));

  // Broad Scalloped Wings
  for (const dir of [-1, 1]) {
    const wing = new THREE.Group();
    wing.add(createBox(0.52, 0.04, 0.3, mWingMembrane, dir * 0.28, 0, 0));
    wing.add(createBox(0.4, 0.03, 0.24, mWingMembrane, dir * 0.68, 0.05, 0.06));
    wing.add(createCone(0.035, 0.1, 4, mFlesh, dir * 0.5, 0.14, -0.06));
    wing.position.set(dir * 0.24, 0.76, 0);
    wing.rotation.set(0.12, dir * -0.25, dir * 0.18);
    root.add(wing);
  }

  return root;
}

function buildSlimeEnemy() {
  const root = new THREE.Group();
  root.name = 'enemy_slime';
  const mGel = matStandard(0x28dc76, { roughness: 0.25, metalness: 0.1, transparent: true, opacity: 0.85, emissive: 0x0f5528, emissiveIntensity: 0.45 });
  const mCore = matStandard(0x80ffa8, { roughness: 0.2, emissive: 0x3df078, emissiveIntensity: 1.6 });
  const mEyes = matBasic(0x061e10);
  const mHighlight = matBasic(0xffffff);

  // Outer Squishy Jelly Dome
  root.add(createSphere(0.46, 8, mGel, 0, 0.46, 0));
  root.add(createCylinder(0.5, 0.56, 0.24, 8, mGel, 0, 0.16, 0));
  // Inner Floating Nucleus Crystal
  root.add(createOcta(0.18, mCore, 0, 0.42, 0));
  // Big Glossy Eyes
  root.add(createSphere(0.065, 5, mEyes, -0.14, 0.5, 0.38));
  root.add(createSphere(0.02, 4, mHighlight, -0.12, 0.53, 0.42));
  root.add(createSphere(0.065, 5, mEyes, 0.14, 0.5, 0.38));
  root.add(createSphere(0.02, 4, mHighlight, 0.16, 0.53, 0.42));

  return root;
}

function buildGhostEnemy() {
  const root = new THREE.Group();
  root.name = 'enemy_ghost';
  const mGhost = matStandard(0x8eeeff, { roughness: 0.35, transparent: true, opacity: 0.78, emissive: 0x2bb0dc, emissiveIntensity: 0.9 });
  const mEyes = matBasic(0xffffff);

  // Floating Cloaked Head
  root.add(createSphere(0.36, 8, mGhost, 0, 1.0, 0));
  // Tapered Vapor Tails
  root.add(createCone(0.38, 0.8, 7, mGhost, 0, 0.52, 0, Math.PI, 0, 0));
  root.add(createCone(0.2, 0.5, 6, mGhost, 0.1, 0.18, -0.14, Math.PI + 0.4, 0, 0.22));
  root.add(createCone(0.18, 0.44, 6, mGhost, -0.1, 0.22, 0.12, Math.PI - 0.3, 0, -0.2));
  // Glowing Eyes
  root.add(createSphere(0.055, 5, mEyes, -0.1, 1.02, 0.28));
  root.add(createSphere(0.055, 5, mEyes, 0.1, 1.02, 0.28));

  return root;
}

function buildArcherEnemy() {
  const root = new THREE.Group();
  root.name = 'enemy_archer';
  const mBone = matStandard(0xc4d4e2, { roughness: 0.82 });
  const mCowl = matStandard(0x1e3a32, { roughness: 0.8 });
  const mBow = matStandard(0x5c422c, { roughness: 0.65 });
  const mEyes = matBasic(0x56ffcc);

  // Hooded Skull
  root.add(createBox(0.36, 0.36, 0.36, mBone, 0, 1.2, 0));
  root.add(createCone(0.46, 0.6, 7, mCowl, 0, 1.4, -0.04, 0.18, 0, 0));
  root.add(createSphere(0.05, 5, mEyes, -0.09, 1.2, 0.18));
  root.add(createSphere(0.05, 5, mEyes, 0.09, 1.2, 0.18));

  // Torso with Leather Vest
  root.add(createCylinder(0.2, 0.24, 0.55, 6, mCowl, 0, 0.75, 0));
  // Legs
  root.add(createCylinder(0.05, 0.05, 0.5, 5, mBone, -0.13, 0.25, 0));
  root.add(createCylinder(0.05, 0.05, 0.5, 5, mBone, 0.13, 0.25, 0));

  // Recurve Bow
  const bow = new THREE.Group();
  bow.add(createTorus(0.42, 0.035, 4, 12, mBow, 0, 0, 0, 0, 0, 0));
  bow.position.set(0.4, 0.8, 0.2);
  bow.rotation.set(0, Math.PI / 2.4, 0);
  root.add(bow);

  // Back Quiver with Arrows
  const quiver = new THREE.Group();
  quiver.add(createCylinder(0.09, 0.07, 0.48, 6, mBow, 0, 0, 0));
  quiver.add(createBox(0.04, 0.14, 0.04, mBone, -0.03, 0.28, 0));
  quiver.add(createBox(0.04, 0.14, 0.04, mBone, 0.03, 0.28, 0));
  quiver.position.set(-0.14, 0.84, -0.2);
  quiver.rotation.set(0, 0, 0.38);
  root.add(quiver);

  return root;
}

function buildKnightEnemy() {
  const root = new THREE.Group();
  root.name = 'enemy_knight';
  const mArmor = matStandard(0x384858, { roughness: 0.45, metalness: 0.55 });
  const mDarkMetal = matStandard(0x1a222c, { roughness: 0.55, metalness: 0.65 });
  const mVisorGlow = matBasic(0xff4055);
  const mGold = matStandard(0xd4a838, { roughness: 0.38, metalness: 0.7 });

  // Heavy Helmet with Horned Crest
  root.add(createBox(0.48, 0.46, 0.46, mArmor, 0, 1.3, 0));
  root.add(createBox(0.36, 0.06, 0.06, mVisorGlow, 0, 1.32, 0.24));
  root.add(createCone(0.07, 0.32, 5, mDarkMetal, -0.25, 1.58, 0, 0, 0, 0.35));
  root.add(createCone(0.07, 0.32, 5, mDarkMetal, 0.25, 1.58, 0, 0, 0, -0.35));

  // Heavy Torso with Gold Heraldic Trim
  root.add(createBox(0.6, 0.68, 0.45, mArmor, 0, 0.78, 0));
  root.add(createBox(0.26, 0.14, 0.09, mGold, 0, 0.82, 0.24));

  // Spired Pauldrons
  root.add(createBox(0.28, 0.24, 0.3, mDarkMetal, -0.42, 1.0, 0, 0, 0, 0.25));
  root.add(createBox(0.28, 0.24, 0.3, mDarkMetal, 0.42, 1.0, 0, 0, 0, -0.25));

  // Greaves
  root.add(createBox(0.2, 0.48, 0.24, mArmor, -0.18, 0.25, 0));
  root.add(createBox(0.2, 0.48, 0.24, mArmor, 0.18, 0.25, 0));

  // Tower Shield
  const shield = new THREE.Group();
  shield.add(createBox(0.38, 0.9, 0.08, mDarkMetal, 0, 0, 0));
  shield.add(createBox(0.32, 0.8, 0.04, mArmor, 0, 0, 0.05));
  shield.add(createBox(0.1, 0.54, 0.04, mGold, 0, 0, 0.07));
  shield.position.set(-0.52, 0.7, 0.22);
  shield.rotation.set(0, 0.32, 0);
  root.add(shield);

  // Arming Sword
  const sword = new THREE.Group();
  sword.add(createBox(0.13, 1.02, 0.04, mArmor, 0, 0.54, 0));
  sword.add(createBox(0.32, 0.065, 0.065, mGold, 0, 0.16, 0));
  sword.add(createCylinder(0.038, 0.038, 0.24, 6, mDarkMetal, 0, 0.04, 0));
  sword.position.set(0.52, 0.58, 0.1);
  sword.rotation.set(-0.2, 0, -0.42);
  root.add(sword);

  return root;
}

function buildDemonEnemy() {
  const root = new THREE.Group();
  root.name = 'enemy_demon';
  const mSkin = matStandard(0x92242c, { roughness: 0.68, emissive: 0x28060a, emissiveIntensity: 0.35 });
  const mHorn = matStandard(0x1a1216, { roughness: 0.55, metalness: 0.35 });
  const mEyes = matBasic(0xffa028);
  const mCore = matStandard(0xff6024, { roughness: 0.25, emissive: 0xff3800, emissiveIntensity: 1.6 });

  // Horned Skull
  root.add(createBox(0.42, 0.38, 0.38, mSkin, 0, 1.22, 0));
  // Curled Ram Horns
  root.add(createCone(0.1, 0.6, 6, mHorn, -0.24, 1.52, -0.06, -0.32, 0, 0.38));
  root.add(createCone(0.1, 0.6, 6, mHorn, 0.24, 1.52, -0.06, -0.32, 0, -0.38));
  // Glowing Eyes
  root.add(createSphere(0.06, 5, mEyes, -0.11, 1.24, 0.2));
  root.add(createSphere(0.06, 5, mEyes, 0.11, 1.24, 0.2));

  // Muscular Torso with Molten Core
  root.add(createBox(0.56, 0.62, 0.4, mSkin, 0, 0.75, 0));
  root.add(createOcta(0.14, mCore, 0, 0.78, 0.2));

  // Arms & Legs
  root.add(createBox(0.18, 0.52, 0.18, mSkin, -0.38, 0.7, 0, 0, 0, 0.22));
  root.add(createBox(0.18, 0.52, 0.18, mSkin, 0.38, 0.7, 0, 0, 0, -0.22));
  root.add(createBox(0.2, 0.52, 0.22, mSkin, -0.18, 0.26, 0));
  root.add(createBox(0.2, 0.52, 0.22, mSkin, 0.18, 0.26, 0));

  return root;
}

function buildImpEnemy() {
  const root = new THREE.Group();
  root.name = 'enemy_imp';
  const mSkin = matStandard(0xc44528, { roughness: 0.62 });
  const mHorn = matStandard(0x2c1218, { roughness: 0.7 });
  const mCore = matStandard(0xffb028, { roughness: 0.2, emissive: 0xff7000, emissiveIntensity: 2.2 });
  const mEyes = matBasic(0xffe048);

  // Big Mischievous Head
  root.add(createSphere(0.32, 7, mSkin, 0, 0.65, 0));
  root.add(createCone(0.07, 0.3, 5, mHorn, -0.16, 0.92, 0.02, -0.22, 0, 0.32));
  root.add(createCone(0.07, 0.3, 5, mHorn, 0.16, 0.92, 0.02, -0.22, 0, -0.32));
  // Huge Glowing Eyes
  root.add(createSphere(0.07, 5, mEyes, -0.12, 0.7, 0.26));
  root.add(createSphere(0.07, 5, mEyes, 0.12, 0.7, 0.26));

  // Small Torso & Molten Belly
  root.add(createSphere(0.22, 6, mSkin, 0, 0.36, 0));
  root.add(createSphere(0.13, 6, mCore, 0, 0.36, 0.14));

  // Tiny Legs
  root.add(createCylinder(0.045, 0.045, 0.26, 5, mSkin, -0.11, 0.13, 0));
  root.add(createCylinder(0.045, 0.045, 0.26, 5, mSkin, 0.11, 0.13, 0));

  return root;
}

// -------------------------------------------------------------
// 3. WORLD BOSSES (Monumental Scale & Ornate Presence)
// -------------------------------------------------------------
function buildSkeletonKingBoss() {
  const root = new THREE.Group();
  root.name = 'boss_skeleton_king';
  const mBone = matStandard(0xd8e4ee, { roughness: 0.78 });
  const mArmor = matStandard(0x1c2432, { roughness: 0.48, metalness: 0.65 });
  const mGold = matStandard(0xffca55, { roughness: 0.28, metalness: 0.85, emissive: 0x775010, emissiveIntensity: 0.6 });
  const mCape = matStandard(0x94182c, { roughness: 0.82 });
  const mRuby = matStandard(0xff2244, { roughness: 0.2, emissive: 0xee0022, emissiveIntensity: 1.8 });
  const mEyes = matBasic(0xff2244);

  // Massive Crowned Skull
  root.add(createBox(1.05, 0.92, 0.92, mBone, 0, 2.55, 0));
  root.add(createBox(0.8, 0.36, 0.66, mBone, 0, 2.02, 0.24));
  // Glowing Ruby Red Eyes
  root.add(createBox(0.2, 0.2, 0.1, mEyes, -0.26, 2.6, 0.48));
  root.add(createBox(0.2, 0.2, 0.1, mEyes, 0.26, 2.6, 0.48));

  // Ornate 5-Spike Gold Crown with Rubies
  root.add(createCylinder(0.58, 0.54, 0.28, 8, mGold, 0, 3.1, 0));
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const px = Math.cos(angle) * 0.48;
    const pz = Math.sin(angle) * 0.48;
    root.add(createCone(0.1, 0.45, 4, mGold, px, 3.42, pz));
    root.add(createOcta(0.06, mRuby, px * 0.95, 3.2, pz * 0.95));
  }

  // Heavy Royal Armor Torso
  root.add(createBox(1.35, 1.4, 0.85, mArmor, 0, 1.4, 0));
  root.add(createBox(0.6, 0.7, 0.1, mGold, 0, 1.45, 0.44));

  // Spired Pauldrons with Gold Trim
  root.add(createBox(0.65, 0.5, 0.6, mArmor, -0.92, 1.85, 0, 0, 0, 0.25));
  root.add(createCone(0.12, 0.5, 4, mGold, -1.05, 2.2, 0));
  root.add(createBox(0.65, 0.5, 0.6, mArmor, 0.92, 1.85, 0, 0, 0, -0.25));
  root.add(createCone(0.12, 0.5, 4, mGold, 1.05, 2.2, 0));

  // Royal Velvet Cape
  root.add(createBox(1.5, 2.1, 0.15, mCape, 0, 1.25, -0.5, 0.15, 0, 0));

  // Massive Runic Greatsword
  const sword = new THREE.Group();
  sword.add(createBox(0.24, 2.6, 0.08, mArmor, 0, 1.3, 0));
  sword.add(createBox(0.08, 2.2, 0.1, mRuby, 0, 1.3, 0)); // glowing ruby rune channel
  sword.add(createBox(0.75, 0.15, 0.15, mGold, 0, 0.35, 0));
  sword.add(createCylinder(0.08, 0.08, 0.5, 6, mGold, 0, 0.1, 0));
  sword.position.set(1.2, 0.8, 0.3);
  sword.rotation.set(-0.25, 0, -0.38);
  root.add(sword);

  return root;
}

function buildForestWitchBoss() {
  const root = new THREE.Group();
  root.name = 'boss_forest_witch';
  const mRobe = matStandard(0x26143c, { roughness: 0.75 });
  const mPurpleGlow = matStandard(0xb838f0, { roughness: 0.3, emissive: 0x8811d0, emissiveIntensity: 1.8 });
  const mWood = matStandard(0x321e14, { roughness: 0.9 });
  const mTealGlow = matStandard(0x44ffcc, { roughness: 0.2, emissive: 0x11cc99, emissiveIntensity: 2.0 });
  const mEyes = matBasic(0x55ffcc);

  // Tall Robed Body
  root.add(createCone(0.85, 2.2, 8, mRobe, 0, 1.1, 0));
  root.add(createTorus(0.72, 0.05, 4, 12, mPurpleGlow, 0, 0.45, 0, Math.PI / 2, 0, 0));

  // Head & Pointed Witch Hat
  root.add(createSphere(0.38, 8, matStandard(0x2e3a34, { roughness: 0.8 }), 0, 2.1, 0));
  root.add(createCylinder(0.85, 0.85, 0.08, 8, mRobe, 0, 2.28, 0)); // hat brim
  root.add(createCone(0.52, 1.35, 7, mRobe, 0, 2.95, -0.15, 0.32, 0, 0)); // crooked hat cone
  // Hat buckle
  root.add(createBox(0.18, 0.14, 0.05, mPurpleGlow, 0, 2.38, 0.38));

  // Glowing Witch Eyes
  root.add(createSphere(0.065, 5, mEyes, -0.12, 2.08, 0.3));
  root.add(createSphere(0.065, 5, mEyes, 0.12, 2.08, 0.3));

  // Twisted Staff with Levitating Spectral Orb
  const staff = new THREE.Group();
  staff.add(createCylinder(0.06, 0.075, 2.7, 6, mWood, 0, 1.35, 0));
  staff.add(createSphere(0.24, 8, mTealGlow, 0, 2.8, 0));
  staff.add(createTorus(0.36, 0.025, 4, 12, mPurpleGlow, 0, 2.8, 0, Math.PI / 3, 0, 0));
  staff.position.set(0.85, 0, 0.2);
  staff.rotation.set(0, 0, -0.2);
  root.add(staff);

  return root;
}

function buildFrostGolemBoss() {
  const root = new THREE.Group();
  root.name = 'boss_frost_golem';
  const mIce = matStandard(0x7ce2ff, { roughness: 0.25, metalness: 0.2, emissive: 0x2288bb, emissiveIntensity: 1.2, transparent: true, opacity: 0.92 });
  const mStone = matStandard(0x384a58, { roughness: 0.85 });
  const mCore = matStandard(0xd0f4ff, { roughness: 0.1, emissive: 0x66ddff, emissiveIntensity: 2.5 });

  // Massive Rocky Permafrost Torso
  root.add(createBox(1.6, 1.3, 1.1, mStone, 0, 1.6, 0));
  // Glowing Glacial Heart Core
  root.add(createOcta(0.35, mCore, 0, 1.65, 0.45));

  // Crystalline Ice Head
  root.add(createBox(0.8, 0.65, 0.7, mIce, 0, 2.5, 0.1));
  root.add(createBox(0.18, 0.09, 0.06, mCore, -0.2, 2.52, 0.46));
  root.add(createBox(0.18, 0.09, 0.06, mCore, 0.2, 2.52, 0.46));

  // Huge Crystal Shoulder Spikes
  root.add(createCone(0.28, 1.1, 5, mIce, -1.05, 2.2, 0, 0, 0, 0.4));
  root.add(createCone(0.28, 1.1, 5, mIce, 1.05, 2.2, 0, 0, 0, -0.4));

  // Massive Bouldered Arms
  root.add(createBox(0.55, 1.3, 0.55, mStone, -1.15, 1.1, 0));
  root.add(createBox(0.65, 0.65, 0.65, mIce, -1.15, 0.35, 0.1));
  root.add(createBox(0.55, 1.3, 0.55, mStone, 1.15, 1.1, 0));
  root.add(createBox(0.65, 0.65, 0.65, mIce, 1.15, 0.35, 0.1));

  return root;
}

function buildDemonLordBoss() {
  const root = new THREE.Group();
  root.name = 'boss_demon_lord';
  const mArmor = matStandard(0x181016, { roughness: 0.5, metalness: 0.6 });
  const mSkin = matStandard(0x841c26, { roughness: 0.68, emissive: 0x32060a, emissiveIntensity: 0.45 });
  const mFire = matStandard(0xff5511, { roughness: 0.2, emissive: 0xff3300, emissiveIntensity: 2.2 });
  const mHorn = matStandard(0x120a10, { roughness: 0.5, metalness: 0.4 });

  // 4-Horned Demon Head
  root.add(createBox(0.95, 0.88, 0.82, mSkin, 0, 2.6, 0));
  root.add(createCone(0.2, 1.45, 6, mHorn, -0.6, 3.3, -0.1, -0.32, 0, 0.42));
  root.add(createCone(0.2, 1.45, 6, mHorn, 0.6, 3.3, -0.1, -0.32, 0, -0.42));
  root.add(createCone(0.14, 0.95, 5, mHorn, -0.45, 2.9, 0.35, 0.3, 0, 0.25));
  root.add(createCone(0.14, 0.95, 5, mHorn, 0.45, 2.9, 0.35, 0.3, 0, -0.25));
  root.add(createBox(0.16, 0.16, 0.08, mFire, -0.24, 2.65, 0.44));
  root.add(createBox(0.16, 0.16, 0.08, mFire, 0.24, 2.65, 0.44));

  // Massive Torso & Molten Chest Furnace
  root.add(createBox(1.7, 1.5, 1.05, mArmor, 0, 1.5, 0));
  root.add(createOcta(0.5, mFire, 0, 1.6, 0.56));

  // Demon Wings with Ember Veins
  for (const dir of [-1, 1]) {
    const wing = new THREE.Group();
    wing.add(createBox(1.5, 1.8, 0.14, mArmor, dir * 0.85, 0, 0));
    wing.add(createCone(0.16, 0.65, 5, mHorn, dir * 1.6, 0.9, 0, 0, 0, dir * -0.42));
    wing.add(createBox(1.2, 0.06, 0.16, mFire, dir * 0.75, 0.3, 0.02));
    wing.position.set(dir * 0.8, 1.9, -0.5);
    wing.rotation.set(0.16, dir * -0.36, dir * 0.22);
    root.add(wing);
  }

  // Flaming Greatsword
  const blade = new THREE.Group();
  blade.add(createBox(0.28, 2.6, 0.09, mArmor, 0, 1.3, 0));
  blade.add(createBox(0.12, 2.4, 0.12, mFire, 0, 1.3, 0.04));
  blade.position.set(1.6, 1.1, 0.25);
  blade.rotation.set(-0.3, 0, -0.45);
  root.add(blade);

  return root;
}

// -------------------------------------------------------------
// 4. ENVIRONMENT PROPS (Architectural Sculptures)
// -------------------------------------------------------------
function buildGraveyardProps() {
  const mStone = matStandard(0x3e4a58, { roughness: 0.88 });
  const mStoneAlt = matStandard(0x566474, { roughness: 0.82 });
  const mIron = matStandard(0x1e2834, { roughness: 0.55, metalness: 0.55 });
  const mWood = matStandard(0x221c18, { roughness: 0.95 });
  const mWarm = matStandard(0xffae33, { roughness: 0.25, emissive: 0xff8811, emissiveIntensity: 2.2 });

  return {
    grave_a: () => {
      const g = new THREE.Group();
      // Stepped base + arched headstone + skull relief
      g.add(createBox(0.65, 0.14, 0.35, mStone, 0, 0.07, 0));
      g.add(createBox(0.48, 0.82, 0.18, mStone, 0, 0.54, 0));
      g.add(createCylinder(0.24, 0.24, 0.18, 8, mStone, 0, 0.95, 0, 0, 0, Math.PI / 2));
      g.add(createSphere(0.08, 6, mStoneAlt, 0, 0.72, 0.1));
      return g;
    },
    grave_b: () => {
      const g = new THREE.Group();
      g.add(createBox(0.68, 0.14, 0.38, mStoneAlt, 0, 0.07, 0));
      g.add(createBox(0.52, 0.92, 0.2, mStoneAlt, 0, 0.58, 0));
      g.add(createCone(0.38, 0.38, 4, mStoneAlt, 0, 1.18, 0, 0, Math.PI / 4, 0));
      g.add(createBox(0.22, 0.04, 0.04, mStone, 0, 0.82, 0.11));
      return g;
    },
    grave_cross: () => {
      const g = new THREE.Group();
      // Celtic Cross with Open Halo
      g.add(createBox(0.6, 0.16, 0.4, mStone, 0, 0.08, 0));
      g.add(createBox(0.2, 1.25, 0.2, mStone, 0, 0.7, 0));
      g.add(createBox(0.72, 0.18, 0.2, mStone, 0, 0.95, 0));
      g.add(createTorus(0.26, 0.045, 5, 14, mStoneAlt, 0, 0.95, 0));
      return g;
    },
    grave_broken: () => {
      const g = new THREE.Group();
      g.add(createBox(0.5, 0.14, 0.32, mStone, 0, 0.07, 0));
      g.add(createBox(0.44, 0.48, 0.18, mStone, 0, 0.32, 0));
      // Cracked fallen top slab leaning against it
      g.add(createBox(0.4, 0.42, 0.16, mStone, 0.28, 0.18, 0.14, 0.32, 0.42, 0.85));
      return g;
    },
    crypt_small: () => {
      const g = new THREE.Group();
      // Ancient Vaulted Tomb
      g.add(createBox(1.9, 0.2, 2.5, mStoneAlt, 0, 0.1, 0)); // base plinth
      g.add(createBox(1.7, 1.5, 2.3, mStone, 0, 0.85, 0)); // main chamber
      g.add(createCone(1.4, 0.8, 4, mStoneAlt, 0, 1.95, 0, 0, Math.PI / 4, 0)); // roof
      g.add(createBox(0.8, 1.2, 0.1, mIron, 0, 0.7, 1.16)); // iron door
      g.add(createBox(0.12, 0.12, 0.06, mStoneAlt, 0, 1.2, 1.2)); // skull crest
      return g;
    },
    crypt_large: () => {
      const g = new THREE.Group();
      // Noble Mausoleum with Classical Gable & Pillars
      g.add(createBox(3.4, 0.3, 4.0, mStoneAlt, 0, 0.15, 0)); // stepped base
      g.add(createBox(3.0, 2.4, 3.6, mStone, 0, 1.35, 0)); // main structure
      g.add(createBox(3.3, 0.45, 3.9, mStoneAlt, 0, 2.65, 0)); // cornice
      g.add(createCone(2.5, 0.9, 4, mStoneAlt, 0, 3.25, 0, 0, Math.PI / 4, 0)); // pediment roof
      // Fluted Front Columns
      g.add(createCylinder(0.2, 0.22, 2.2, 8, mStoneAlt, -1.2, 1.25, 1.85));
      g.add(createCylinder(0.2, 0.22, 2.2, 8, mStoneAlt, 1.2, 1.25, 1.85));
      // Iron Gate with Barred Grille
      g.add(createBox(1.2, 1.9, 0.12, mIron, 0, 1.05, 1.82));
      return g;
    },
    dead_tree_a: () => {
      const g = new THREE.Group();
      // Gnarled skeletal tree with multiple crooked forks
      g.add(createCylinder(0.25, 0.45, 3.2, 6, mWood, 0, 1.6, 0));
      g.add(createCylinder(0.16, 0.24, 1.9, 5, mWood, -0.55, 2.6, 0.12, 0, 0, 0.48));
      g.add(createCylinder(0.14, 0.2, 1.6, 5, mWood, 0.5, 2.8, -0.12, 0, 0, -0.55));
      g.add(createCylinder(0.09, 0.14, 1.2, 4, mWood, -0.9, 3.3, 0.2, 0.2, 0, 0.8));
      g.add(createCylinder(0.08, 0.13, 1.1, 4, mWood, 0.85, 3.4, -0.2, -0.2, 0, -0.8));
      return g;
    },
    dead_tree_b: () => {
      const g = new THREE.Group();
      g.add(createCylinder(0.3, 0.52, 2.2, 6, mWood, 0, 1.1, 0));
      g.add(createCylinder(0.2, 0.28, 2.4, 5, mWood, -0.4, 2.5, 0.1, 0, 0, 0.35));
      g.add(createCylinder(0.18, 0.26, 2.2, 5, mWood, 0.42, 2.4, -0.1, 0, 0, -0.4));
      return g;
    },
    dead_tree_twisted: () => {
      const g = new THREE.Group();
      g.add(createCylinder(0.32, 0.6, 1.6, 6, mWood, 0, 0.8, 0, 0.18, 0.22, 0));
      g.add(createCylinder(0.2, 0.3, 2.1, 5, mWood, 0.48, 2.1, 0.24, 0.35, 0, -0.6));
      g.add(createCylinder(0.18, 0.28, 1.8, 5, mWood, -0.52, 1.9, -0.24, -0.35, 0, 0.65));
      return g;
    },
    iron_fence: () => {
      const g = new THREE.Group();
      // Wrought Iron Spiked Pickets & Horizontal Rails
      for (let i = 0; i < 7; i++) {
        const x = -1.35 + i * 0.45;
        g.add(createCylinder(0.024, 0.024, 1.25, 5, mIron, x, 0.62, 0));
        g.add(createCone(0.05, 0.18, 4, mIron, x, 1.3, 0)); // spearhead
      }
      g.add(createBox(3.0, 0.06, 0.06, mIron, 0, 0.32, 0));
      g.add(createBox(3.0, 0.06, 0.06, mIron, 0, 0.95, 0));
      return g;
    },
    iron_gate: () => {
      const g = new THREE.Group();
      // Massive Stone Pillars with Ball Finials
      g.add(createBox(0.4, 2.2, 0.4, mStoneAlt, -1.3, 1.1, 0));
      g.add(createSphere(0.22, 6, mStoneAlt, -1.3, 2.35, 0));
      g.add(createBox(0.4, 2.2, 0.4, mStoneAlt, 1.3, 1.1, 0));
      g.add(createSphere(0.22, 6, mStoneAlt, 1.3, 2.35, 0));
      // Spiked Double Gate Leaves
      g.add(createBox(2.2, 1.6, 0.08, mIron, 0, 0.9, 0));
      return g;
    },
    lantern_post: () => {
      const g = new THREE.Group();
      // Victorian Iron Lamppost with Glass Mantle
      g.add(createCylinder(0.08, 0.14, 0.4, 6, mIron, 0, 0.2, 0)); // base
      g.add(createCylinder(0.055, 0.07, 2.0, 6, mIron, 0, 1.2, 0)); // shaft
      g.add(createBox(0.32, 0.44, 0.32, mIron, 0, 2.2, 0)); // lantern housing
      g.add(createOcta(0.15, mWarm, 0, 2.2, 0)); // glowing warm mantle
      g.add(createCone(0.24, 0.24, 4, mIron, 0, 2.5, 0, 0, Math.PI / 4, 0)); // cap
      return g;
    },
    candle_cluster: () => {
      const g = new THREE.Group();
      g.add(createCylinder(0.045, 0.045, 0.35, 6, mStoneAlt, -0.1, 0.18, 0));
      g.add(createOcta(0.06, mWarm, -0.1, 0.4, 0));
      g.add(createCylinder(0.045, 0.045, 0.52, 6, mStoneAlt, 0.08, 0.26, 0.05));
      g.add(createOcta(0.07, mWarm, 0.08, 0.56, 0.05));
      g.add(createCylinder(0.04, 0.04, 0.22, 6, mStoneAlt, 0.02, 0.11, -0.08));
      g.add(createOcta(0.05, mWarm, 0.02, 0.26, -0.08));
      return g;
    },
    angel_statue: () => {
      const g = new THREE.Group();
      // Stepped Pedestal
      g.add(createBox(0.8, 0.25, 0.8, mStone, 0, 0.12, 0));
      g.add(createBox(0.65, 0.5, 0.65, mStone, 0, 0.48, 0));
      // Draped Sculpted Robes
      g.add(createCylinder(0.26, 0.38, 1.2, 8, mStoneAlt, 0, 1.25, 0));
      g.add(createSphere(0.22, 7, mStoneAlt, 0, 1.9, 0.02)); // bowed head
      // Sculpted Wings
      g.add(createBox(0.72, 0.95, 0.09, mStoneAlt, -0.32, 1.6, -0.18, 0.22, -0.32, 0.25));
      g.add(createBox(0.72, 0.95, 0.09, mStoneAlt, 0.32, 1.6, -0.18, 0.22, 0.32, -0.25));
      return g;
    },
    stone_arch: () => {
      const g = new THREE.Group();
      // Gothic Archway with Pillars & Keystone
      g.add(createBox(0.5, 2.5, 0.5, mStone, -1.35, 1.25, 0));
      g.add(createBox(0.5, 2.5, 0.5, mStone, 1.35, 1.25, 0));
      g.add(createBox(3.3, 0.5, 0.6, mStoneAlt, 0, 2.65, 0));
      g.add(createBox(0.3, 0.3, 0.68, mStone, 0, 2.65, 0)); // keystone
      return g;
    },
    chapel_ruin: () => {
      const g = new THREE.Group();
      // Gothic Ruined Chapel Wall with Lancet Arch Windows
      g.add(createBox(4.2, 3.2, 0.5, mStone, 0, 1.6, 0)); // main wall
      g.add(createCone(2.2, 1.9, 4, mStoneAlt, 0, 4.0, 0, 0, Math.PI / 4, 0)); // ruined belfry
      g.add(createBox(0.5, 1.4, 0.6, matBasic(0x0a1018), -1.1, 1.5, 0)); // window void
      g.add(createBox(0.5, 1.4, 0.6, matBasic(0x0a1018), 1.1, 1.5, 0)); // window void
      g.add(createBox(0.12, 0.7, 0.12, mStoneAlt, 0, 5.1, 0)); // cross spire
      g.add(createBox(0.42, 0.12, 0.12, mStoneAlt, 0, 4.9, 0));
      return g;
    },
    rock_cluster: () => {
      const g = new THREE.Group();
      g.add(createSphere(0.45, 6, mStone, 0, 0.32, 0));
      g.add(createSphere(0.32, 6, mStoneAlt, 0.34, 0.24, 0.12));
      g.add(createSphere(0.26, 6, mStone, -0.3, 0.18, -0.1));
      return g;
    },
    path_slab: () => {
      const g = new THREE.Group();
      g.add(createBox(1.3, 0.08, 0.88, mStoneAlt, 0, 0.04, 0));
      return g;
    },
  };
}

function buildForestProps() {
  const mBark = matStandard(0x281c16, { roughness: 0.95 });
  const mMoss = matStandard(0x264228, { roughness: 0.9 });
  const mWood = matStandard(0x3e2c1e, { roughness: 0.9 });
  const mStone = matStandard(0x3a443d, { roughness: 0.85 });
  const mPurple = matStandard(0xba46ff, { roughness: 0.25, emissive: 0x8a12ee, emissiveIntensity: 2.0 });
  const mTeal = matStandard(0x46ffcc, { roughness: 0.25, emissive: 0x12cca0, emissiveIntensity: 2.0 });

  return {
    cursed_tree_giant: () => {
      const g = new THREE.Group();
      // Landmark Great Cursed Heart Tree
      g.add(createCylinder(1.1, 2.1, 5.2, 8, mBark, 0, 2.6, 0));
      // Root buttresses
      g.add(createBox(4.2, 0.8, 1.1, mBark, 0, 0.4, 0, 0, 0.45, 0));
      g.add(createBox(1.1, 0.8, 4.2, mBark, 0, 0.4, 0, 0, -0.45, 0));
      // Sprawling twisted boughs
      g.add(createCylinder(0.55, 0.9, 3.2, 6, mBark, -1.4, 4.8, 0.5, 0.25, 0, 0.5));
      g.add(createCylinder(0.55, 0.9, 3.2, 6, mBark, 1.4, 4.8, -0.5, -0.25, 0, -0.5));
      // Gaping hollow cavity with purple corrupted eye
      g.add(createSphere(0.45, 6, matBasic(0x0a0410), 0, 2.2, 1.0));
      g.add(createOcta(0.24, mPurple, 0, 2.2, 0.95));
      return g;
    },
    ancient_shrine: () => {
      const g = new THREE.Group();
      // Torii Shrine
      g.add(createBox(0.35, 2.8, 0.35, mWood, -1.2, 1.4, 0));
      g.add(createBox(0.35, 2.8, 0.35, mWood, 1.2, 1.4, 0));
      g.add(createBox(3.4, 0.3, 0.45, mWood, 0, 2.7, 0));
      g.add(createBox(2.8, 0.22, 0.38, mWood, 0, 2.3, 0));
      // Hanging spirit talisman / lantern
      g.add(createOcta(0.18, mTeal, 0, 2.0, 0));
      return g;
    },
    standing_stone: () => {
      const g = new THREE.Group();
      g.add(createBox(0.75, 2.6, 0.45, mStone, 0, 1.3, 0));
      g.add(createBox(0.18, 1.4, 0.06, mPurple, 0, 1.3, 0.24)); // glowing rune vein
      return g;
    },
    spirit_lantern: () => {
      const g = new THREE.Group();
      g.add(createCylinder(0.12, 0.16, 1.4, 6, mWood, 0, 0.7, 0));
      g.add(createBox(0.36, 0.4, 0.36, mStone, 0, 1.5, 0));
      g.add(createSphere(0.12, 6, mTeal, 0, 1.5, 0)); // teal spirit wisp
      return g;
    },
    tree_twisted_a: () => {
      const g = new THREE.Group();
      g.add(createCylinder(0.32, 0.58, 2.8, 6, mBark, 0, 1.4, 0, 0.12, 0, 0));
      g.add(createCylinder(0.18, 0.28, 2.0, 5, mBark, 0.5, 2.6, 0.2, 0.3, 0, -0.6));
      return g;
    },
    tree_twisted_b: () => {
      const g = new THREE.Group();
      g.add(createCylinder(0.3, 0.55, 2.6, 6, mBark, 0, 1.3, 0, -0.15, 0, 0));
      g.add(createCylinder(0.16, 0.26, 1.8, 5, mBark, -0.45, 2.4, -0.2, -0.3, 0, 0.65));
      return g;
    },
    tree_twisted_c: () => {
      const g = new THREE.Group();
      g.add(createCylinder(0.28, 0.5, 2.4, 6, mBark, 0, 1.2, 0));
      g.add(createCylinder(0.16, 0.24, 1.6, 5, mBark, 0.4, 2.2, -0.15, 0, 0.2, -0.5));
      return g;
    },
    exposed_roots: () => {
      const g = new THREE.Group();
      g.add(createBox(2.2, 0.35, 0.4, mBark, 0, 0.18, 0, 0, 0.5, 0.1));
      g.add(createBox(1.8, 0.3, 0.35, mBark, 0.3, 0.15, 0.2, 0, -0.4, -0.1));
      return g;
    },
    fallen_log: () => {
      const g = new THREE.Group();
      g.add(createCylinder(0.38, 0.42, 3.6, 7, mBark, 0, 0.35, 0, 0, 0, Math.PI / 2));
      g.add(createSphere(0.14, 5, mMoss, 0.4, 0.65, 0.15));
      return g;
    },
    tree_stump: () => {
      const g = new THREE.Group();
      g.add(createCylinder(0.65, 0.88, 0.9, 7, mBark, 0, 0.45, 0));
      g.add(createSphere(0.18, 5, mMoss, 0.2, 0.9, 0.1));
      return g;
    },
    mushroom_cluster_a: () => {
      const g = new THREE.Group();
      g.add(createCylinder(0.08, 0.1, 0.5, 6, mWood, 0, 0.25, 0));
      g.add(createSphere(0.36, 7, mPurple, 0, 0.55, 0));
      g.add(createCylinder(0.05, 0.07, 0.32, 6, mWood, 0.25, 0.16, 0.1));
      g.add(createSphere(0.22, 6, mPurple, 0.25, 0.36, 0.1));
      return g;
    },
    mushroom_cluster_b: () => {
      const g = new THREE.Group();
      g.add(createCylinder(0.07, 0.09, 0.45, 6, mWood, 0, 0.22, 0));
      g.add(createSphere(0.32, 7, mTeal, 0, 0.48, 0));
      g.add(createCylinder(0.05, 0.06, 0.28, 6, mWood, -0.22, 0.14, -0.08));
      g.add(createSphere(0.2, 6, mTeal, -0.22, 0.32, -0.08));
      return g;
    },
    broken_bridge: () => {
      const g = new THREE.Group();
      g.add(createBox(3.4, 0.18, 1.2, mWood, 0, 0.3, 0));
      g.add(createCylinder(0.12, 0.14, 1.2, 6, mWood, -1.4, 0.6, 0.5));
      g.add(createCylinder(0.12, 0.14, 1.2, 6, mWood, 1.4, 0.6, 0.5));
      return g;
    },
    mossy_rock: () => {
      const g = new THREE.Group();
      g.add(createSphere(0.62, 6, mStone, 0, 0.45, 0));
      g.add(createSphere(0.35, 5, mMoss, 0.15, 0.72, 0.1));
      return g;
    },
    spectral_wisp_post: () => {
      const g = new THREE.Group();
      g.add(createCylinder(0.08, 0.12, 1.6, 6, mWood, 0, 0.8, 0));
      g.add(createOcta(0.14, mPurple, 0, 1.75, 0));
      return g;
    },
  };
}

function buildFrozenProps() {
  const mStone = matStandard(0x425466, { roughness: 0.8, metalness: 0.2 });
  const mIce = matStandard(0x8ae8ff, { roughness: 0.2, metalness: 0.15, emissive: 0x22aadd, emissiveIntensity: 1.5, transparent: true, opacity: 0.9 });
  const mSnow = matStandard(0xd8f0ff, { roughness: 0.95 });

  return {
    temple_gate_arch: () => {
      const g = new THREE.Group();
      g.add(createBox(0.65, 3.4, 0.65, mStone, -1.6, 1.7, 0));
      g.add(createBox(0.65, 3.4, 0.65, mStone, 1.6, 1.7, 0));
      g.add(createBox(4.2, 0.7, 0.85, mStone, 0, 3.5, 0));
      // Ice icicles hanging from arch
      g.add(createCone(0.12, 0.8, 4, mIce, -0.8, 2.9, 0, Math.PI, 0, 0));
      g.add(createCone(0.15, 1.1, 4, mIce, 0, 2.7, 0, Math.PI, 0, 0));
      g.add(createCone(0.12, 0.8, 4, mIce, 0.8, 2.9, 0, Math.PI, 0, 0));
      return g;
    },
    frozen_pillar_a: () => {
      const g = new THREE.Group();
      g.add(createCylinder(0.38, 0.44, 2.8, 8, mStone, 0, 1.4, 0));
      g.add(createCone(0.18, 0.9, 5, mIce, 0.2, 2.9, 0.1));
      return g;
    },
    frozen_pillar_b: () => {
      const g = new THREE.Group();
      g.add(createCylinder(0.35, 0.42, 2.4, 8, mStone, 0, 1.2, 0));
      return g;
    },
    broken_pillar: () => {
      const g = new THREE.Group();
      g.add(createCylinder(0.4, 0.44, 1.2, 8, mStone, 0, 0.6, 0));
      g.add(createCylinder(0.38, 0.38, 1.4, 8, mStone, 0.8, 0.4, 0.2, 0, 0, Math.PI / 2.2));
      return g;
    },
    ice_crystal_huge: () => {
      const g = new THREE.Group();
      g.add(createCone(0.45, 2.6, 5, mIce, 0, 1.3, 0));
      g.add(createCone(0.28, 1.6, 5, mIce, 0.4, 0.8, 0.2, 0.2, 0, -0.35));
      return g;
    },
    ice_crystal_cluster: () => {
      const g = new THREE.Group();
      g.add(createCone(0.32, 1.8, 5, mIce, 0, 0.9, 0));
      g.add(createCone(0.22, 1.2, 5, mIce, -0.3, 0.6, -0.15, -0.2, 0, 0.3));
      g.add(createCone(0.18, 0.9, 5, mIce, 0.25, 0.45, 0.2, 0.25, 0, -0.3));
      return g;
    },
    ice_shard_small: () => {
      const g = new THREE.Group();
      g.add(createCone(0.16, 0.8, 4, mIce, 0, 0.4, 0));
      return g;
    },
    frozen_statue: () => {
      const g = new THREE.Group();
      g.add(createBox(0.9, 0.3, 0.9, mStone, 0, 0.15, 0));
      g.add(createCylinder(0.3, 0.4, 1.4, 7, mStone, 0, 0.9, 0));
      g.add(createBox(0.95, 1.8, 0.95, mIce, 0, 1.0, 0)); // encased in ice block
      return g;
    },
    frozen_altar: () => {
      const g = new THREE.Group();
      g.add(createBox(2.2, 0.6, 1.2, mStone, 0, 0.3, 0));
      g.add(createOcta(0.25, mIce, 0, 0.75, 0));
      return g;
    },
    temple_wall: () => {
      const g = new THREE.Group();
      g.add(createBox(3.4, 2.2, 0.5, mStone, 0, 1.1, 0));
      return g;
    },
    snowbank_large: () => {
      const g = new THREE.Group();
      g.add(createSphere(0.85, 6, mSnow, 0, 0.3, 0));
      return g;
    },
    snowbank_small: () => {
      const g = new THREE.Group();
      g.add(createSphere(0.48, 5, mSnow, 0, 0.18, 0));
      return g;
    },
    frost_slab: () => {
      const g = new THREE.Group();
      g.add(createBox(1.4, 0.08, 0.9, mStone, 0, 0.04, 0));
      return g;
    },
  };
}

function buildCastleProps() {
  const mObsidian = matStandard(0x181418, { roughness: 0.5, metalness: 0.65 });
  const mDarkIron = matStandard(0x28181e, { roughness: 0.5, metalness: 0.6 });
  const mFire = matStandard(0xff5511, { roughness: 0.2, emissive: 0xff3300, emissiveIntensity: 2.2 });
  const mBloodCrystal = matStandard(0xff2244, { roughness: 0.2, emissive: 0xcc0022, emissiveIntensity: 2.0 });

  return {
    infernal_gate: () => {
      const g = new THREE.Group();
      g.add(createBox(0.8, 4.0, 0.8, mObsidian, -1.8, 2.0, 0));
      g.add(createBox(0.8, 4.0, 0.8, mObsidian, 1.8, 2.0, 0));
      g.add(createBox(4.6, 0.8, 1.0, mObsidian, 0, 4.0, 0));
      // Spikes on top
      g.add(createCone(0.18, 1.1, 4, mDarkIron, -1.8, 4.9, 0));
      g.add(createCone(0.18, 1.1, 4, mDarkIron, 1.8, 4.9, 0));
      g.add(createCone(0.22, 1.4, 4, mDarkIron, 0, 4.9, 0));
      // Glowing lava veil in center
      g.add(createBox(2.6, 3.4, 0.08, mFire, 0, 1.7, 0));
      return g;
    },
    demon_throne_silhouette: () => {
      const g = new THREE.Group();
      g.add(createBox(2.2, 0.4, 1.8, mObsidian, 0, 0.2, 0));
      g.add(createBox(1.8, 2.6, 0.4, mObsidian, 0, 1.5, -0.6));
      // Spikes on throne back
      g.add(createCone(0.15, 0.9, 4, mDarkIron, -0.7, 2.9, -0.6));
      g.add(createCone(0.18, 1.2, 4, mDarkIron, 0, 3.1, -0.6));
      g.add(createCone(0.15, 0.9, 4, mDarkIron, 0.7, 2.9, -0.6));
      return g;
    },
    demon_statue: () => {
      const g = new THREE.Group();
      g.add(createBox(0.8, 0.6, 0.8, mObsidian, 0, 0.3, 0));
      g.add(createBox(0.5, 0.9, 0.5, mObsidian, 0, 1.0, 0));
      g.add(createCone(0.08, 0.4, 4, mDarkIron, -0.2, 1.55, 0, 0, 0, 0.35));
      g.add(createCone(0.08, 0.4, 4, mDarkIron, 0.2, 1.55, 0, 0, 0, -0.35));
      return g;
    },
    obsidian_pillar: () => {
      const g = new THREE.Group();
      g.add(createCylinder(0.38, 0.45, 2.8, 6, mObsidian, 0, 1.4, 0));
      g.add(createBox(0.1, 1.8, 0.08, mFire, 0, 1.4, 0.39)); // lava rune channel
      return g;
    },
    castle_wall_spiked: () => {
      const g = new THREE.Group();
      g.add(createBox(3.6, 2.6, 0.6, mObsidian, 0, 1.3, 0));
      g.add(createCone(0.15, 0.8, 4, mDarkIron, -1.2, 2.9, 0));
      g.add(createCone(0.15, 0.8, 4, mDarkIron, 0, 2.9, 0));
      g.add(createCone(0.15, 0.8, 4, mDarkIron, 1.2, 2.9, 0));
      return g;
    },
    fire_brazier: () => {
      const g = new THREE.Group();
      g.add(createCylinder(0.42, 0.25, 0.7, 6, mDarkIron, 0, 0.7, 0));
      g.add(createCylinder(0.08, 0.1, 0.4, 5, mDarkIron, 0, 0.2, 0));
      g.add(createOcta(0.24, mFire, 0, 1.15, 0)); // billowing flame
      return g;
    },
    demon_altar: () => {
      const g = new THREE.Group();
      g.add(createBox(2.2, 0.6, 1.3, mObsidian, 0, 0.3, 0));
      g.add(createOcta(0.25, mBloodCrystal, 0, 0.75, 0));
      return g;
    },
    blood_crystal_cluster: () => {
      const g = new THREE.Group();
      g.add(createCone(0.28, 1.7, 5, mBloodCrystal, 0, 0.85, 0));
      g.add(createCone(0.2, 1.1, 5, mBloodCrystal, 0.3, 0.55, 0.15, 0.2, 0, -0.3));
      g.add(createCone(0.18, 0.85, 5, mBloodCrystal, -0.25, 0.42, -0.15, -0.2, 0, 0.3));
      return g;
    },
    iron_chains: () => {
      const g = new THREE.Group();
      for (let i = 0; i < 6; i++) {
        g.add(createTorus(0.14, 0.035, 4, 8, mDarkIron, 0, 0.2 + i * 0.28, 0, i % 2 === 0 ? 0 : Math.PI / 2, 0, 0));
      }
      return g;
    },
    iron_spike: () => {
      const g = new THREE.Group();
      g.add(createCone(0.14, 1.1, 4, mDarkIron, 0, 0.55, 0));
      return g;
    },
    lava_fissure_prop: () => {
      const g = new THREE.Group();
      g.add(createBox(2.6, 0.08, 0.7, mObsidian, 0, 0.04, 0));
      g.add(createBox(2.3, 0.04, 0.24, mFire, 0, 0.09, 0));
      return g;
    },
    rubble_pile: () => {
      const g = new THREE.Group();
      g.add(createBox(0.55, 0.38, 0.48, mObsidian, 0, 0.19, 0, 0.2, 0.4, 0));
      g.add(createBox(0.38, 0.28, 0.38, mObsidian, 0.32, 0.14, 0.12, -0.3, 0.1, 0.2));
      return g;
    },
  };
}

// -------------------------------------------------------------
// MAIN EXECUTION
// -------------------------------------------------------------
async function buildAllAssets() {
  console.log('=== Building Stylized 3D GLB Models ===');

  // 1. Hero
  await exportGLB(buildShadowHero(), 'public/assets/models/heroes/shadow.glb');

  // 2. Enemies
  await exportGLB(buildSkeletonEnemy(), 'public/assets/models/enemies/skeleton.glb');
  await exportGLB(buildBatEnemy(), 'public/assets/models/enemies/bat.glb');
  await exportGLB(buildSlimeEnemy(), 'public/assets/models/enemies/slime.glb');
  await exportGLB(buildGhostEnemy(), 'public/assets/models/enemies/ghost.glb');
  await exportGLB(buildArcherEnemy(), 'public/assets/models/enemies/archer.glb');
  await exportGLB(buildKnightEnemy(), 'public/assets/models/enemies/knight.glb');
  await exportGLB(buildDemonEnemy(), 'public/assets/models/enemies/demon.glb');
  await exportGLB(buildImpEnemy(), 'public/assets/models/enemies/imp.glb');

  // 3. Bosses
  await exportGLB(buildSkeletonKingBoss(), 'public/assets/models/bosses/skeleton-king.glb');
  await exportGLB(buildForestWitchBoss(), 'public/assets/models/bosses/forest-witch.glb');
  await exportGLB(buildFrostGolemBoss(), 'public/assets/models/bosses/frost-golem.glb');
  await exportGLB(buildDemonLordBoss(), 'public/assets/models/bosses/demon-lord.glb');

  // 4. World 1 Graveyard Props
  const graveyardBuilders = buildGraveyardProps();
  for (const [id, fn] of Object.entries(graveyardBuilders)) {
    await exportGLB(fn(), `public/assets/models/environment/graveyard/${id}.glb`);
  }

  // 5. World 2 Forest Props
  const forestBuilders = buildForestProps();
  for (const [id, fn] of Object.entries(forestBuilders)) {
    await exportGLB(fn(), `public/assets/models/environment/forest/${id}.glb`);
  }

  // 6. World 3 Frozen Ruins Props
  const frozenBuilders = buildFrozenProps();
  for (const [id, fn] of Object.entries(frozenBuilders)) {
    await exportGLB(fn(), `public/assets/models/environment/frozen/${id}.glb`);
  }

  // 7. World 4 Demon Castle Props
  const castleBuilders = buildCastleProps();
  for (const [id, fn] of Object.entries(castleBuilders)) {
    await exportGLB(fn(), `public/assets/models/environment/castle/${id}.glb`);
  }

  console.log('=== All Production GLB Models Built Successfully ===');
}

buildAllAssets().catch((err) => {
  console.error('Error building GLBs:', err);
  process.exit(1);
});
