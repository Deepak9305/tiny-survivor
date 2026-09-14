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
// 1. HERO: SHADOW
// -------------------------------------------------------------
function buildShadowHero() {
  const hero = new THREE.Group();
  hero.name = 'hero_shadow';

  const mClothDark = matStandard(0x0a1426, { roughness: 0.85 });
  const mCloakNavy = matStandard(0x162c54, { roughness: 0.75 });
  const mScarfRed = matStandard(0xd6304b, { roughness: 0.7, emissive: 0x440810, emissiveIntensity: 0.2 });
  const mBootsLeather = matStandard(0x060b14, { roughness: 0.9 });
  const mEyesCyan = matBasic(0x55eeff);
  const mWood = matStandard(0x3a241b, { roughness: 0.9 });
  const mMetalGold = matStandard(0xd4af37, { roughness: 0.35, metalness: 0.7 });
  const mCrystalCyan = matStandard(0x40d5ff, { roughness: 0.2, metalness: 0.1, emissive: 0x22a6e6, emissiveIntensity: 1.8 });

  // Body / Torso
  hero.add(createCylinder(0.36, 0.44, 0.75, 8, mCloakNavy, 0, 0.65, 0));

  // Cloak flare
  hero.add(createCone(0.55, 0.95, 8, mClothDark, 0, 0.55, 0));

  // Hood (oversized chibi stylized wizard hood)
  hero.add(createCone(0.52, 0.85, 8, mClothDark, 0, 1.35, -0.05, 0.15, 0, 0));
  // Hood cowl / rim
  hero.add(createTorus(0.32, 0.08, 6, 12, mCloakNavy, 0, 1.15, 0.12, Math.PI / 2.2, 0, 0));

  // Dark face void inside hood
  hero.add(createSphere(0.24, 7, matBasic(0x020408), 0, 1.22, 0.08));

  // Glowing Cyan Eyes
  hero.add(createBox(0.08, 0.035, 0.02, mEyesCyan, -0.11, 1.25, 0.28, 0, -0.1, -0.05));
  hero.add(createBox(0.08, 0.035, 0.02, mEyesCyan, 0.11, 1.25, 0.28, 0, 0.1, 0.05));

  // Red Scarf wrapped around neck
  hero.add(createTorus(0.34, 0.09, 6, 12, mScarfRed, 0, 1.02, 0.05, Math.PI / 2, 0, 0));
  // Trailing Scarf tails
  hero.add(createBox(0.14, 0.06, 0.65, mScarfRed, -0.22, 0.95, -0.25, -0.3, -0.2, 0.1));
  hero.add(createBox(0.12, 0.05, 0.45, mScarfRed, -0.28, 0.82, -0.42, -0.4, -0.3, 0.15));

  // Arms
  hero.add(createCylinder(0.08, 0.1, 0.45, 6, mClothDark, -0.36, 0.72, 0.02, 0, 0, -0.25));
  hero.add(createCylinder(0.08, 0.1, 0.45, 6, mClothDark, 0.36, 0.72, 0.02, 0, 0, 0.25));

  // Boots
  hero.add(createBox(0.16, 0.22, 0.28, mBootsLeather, -0.18, 0.12, 0.04));
  hero.add(createBox(0.16, 0.22, 0.28, mBootsLeather, 0.18, 0.12, 0.04));

  // Magic Staff
  const staff = new THREE.Group();
  staff.add(createCylinder(0.032, 0.036, 1.45, 6, mWood, 0, 0.72, 0));
  staff.add(createCylinder(0.045, 0.045, 0.08, 6, mMetalGold, 0, 1.35, 0));
  staff.add(createCylinder(0.045, 0.045, 0.08, 6, mMetalGold, 0, 0.15, 0));
  // Gold prongs holding crystal
  staff.add(createBox(0.025, 0.22, 0.025, mMetalGold, -0.1, 1.48, 0, 0, 0, -0.3));
  staff.add(createBox(0.025, 0.22, 0.025, mMetalGold, 0.1, 1.48, 0, 0, 0, 0.3));
  // Glowing cyan crystal
  staff.add(createOcta(0.16, mCrystalCyan, 0, 1.52, 0));
  // Orbiting ring around crystal
  staff.add(createTorus(0.22, 0.018, 4, 12, mCrystalCyan, 0, 1.52, 0, Math.PI / 3, 0, 0));

  staff.position.set(0.48, 0, 0.12);
  staff.rotation.set(0, 0, -0.18);
  hero.add(staff);

  return hero;
}

// -------------------------------------------------------------
// 2. ENEMIES
// -------------------------------------------------------------
function buildSkeletonEnemy() {
  const root = new THREE.Group();
  root.name = 'enemy_skeleton';
  const mBone = matStandard(0xc4d4df, { roughness: 0.85 });
  const mArmor = matStandard(0x283848, { roughness: 0.6, metalness: 0.4 });
  const mEyes = matBasic(0x55ddff);
  const mWood = matStandard(0x3e281b, { roughness: 0.9 });

  // Skull
  root.add(createBox(0.38, 0.34, 0.36, mBone, 0, 1.18, 0));
  root.add(createBox(0.26, 0.14, 0.24, mBone, 0, 0.98, 0.08)); // jaw
  // Eye sockets
  root.add(createBox(0.08, 0.08, 0.04, mEyes, -0.09, 1.2, 0.18));
  root.add(createBox(0.08, 0.08, 0.04, mEyes, 0.09, 1.2, 0.18));

  // Spine & Ribs
  root.add(createCylinder(0.06, 0.06, 0.5, 6, mBone, 0, 0.68, 0));
  root.add(createBox(0.36, 0.06, 0.24, mBone, 0, 0.82, 0.02));
  root.add(createBox(0.32, 0.06, 0.22, mBone, 0, 0.7, 0.02));
  root.add(createBox(0.28, 0.06, 0.2, mBone, 0, 0.58, 0.02));

  // Scrap Armor Pauldron
  root.add(createBox(0.22, 0.12, 0.22, mArmor, -0.28, 0.86, 0, 0, 0, 0.2));

  // Arms
  root.add(createCylinder(0.04, 0.04, 0.45, 5, mBone, -0.28, 0.6, 0, 0, 0, 0.2));
  root.add(createCylinder(0.04, 0.04, 0.45, 5, mBone, 0.28, 0.6, 0, 0, 0, -0.2));

  // Legs
  root.add(createCylinder(0.05, 0.05, 0.45, 5, mBone, -0.12, 0.22, 0));
  root.add(createCylinder(0.05, 0.05, 0.45, 5, mBone, 0.12, 0.22, 0));

  // Sword
  const sword = new THREE.Group();
  sword.add(createBox(0.08, 0.65, 0.03, mArmor, 0, 0.4, 0));
  sword.add(createBox(0.22, 0.04, 0.05, mArmor, 0, 0.12, 0));
  sword.add(createCylinder(0.025, 0.025, 0.18, 5, mWood, 0, 0.02, 0));
  sword.position.set(0.38, 0.45, 0.1);
  sword.rotation.set(-0.2, 0, -0.3);
  root.add(sword);

  // Shield
  const shield = new THREE.Group();
  shield.add(createCylinder(0.24, 0.24, 0.06, 8, mWood, 0, 0, 0, Math.PI / 2, 0, 0));
  shield.add(createTorus(0.23, 0.03, 4, 8, mArmor, 0, 0, 0.02, 0, 0, 0));
  shield.add(createSphere(0.06, 6, mArmor, 0, 0, 0.04));
  shield.position.set(-0.36, 0.58, 0.15);
  root.add(shield);

  return root;
}

function buildBatEnemy() {
  const root = new THREE.Group();
  root.name = 'enemy_bat';
  const mBody = matStandard(0x281c3c, { roughness: 0.8 });
  const mWing = matStandard(0x1a1228, { roughness: 0.85 });
  const mEyes = matBasic(0xffcc44);
  const mEars = matStandard(0x502850, { roughness: 0.8 });

  // Body & Head
  root.add(createSphere(0.28, 8, mBody, 0, 0.72, 0));
  // Ears
  root.add(createCone(0.1, 0.28, 5, mEars, -0.16, 0.98, 0.05, -0.2, 0, -0.25));
  root.add(createCone(0.1, 0.28, 5, mEars, 0.16, 0.98, 0.05, -0.2, 0, 0.25));
  // Eyes
  root.add(createSphere(0.05, 5, mEyes, -0.09, 0.78, 0.22));
  root.add(createSphere(0.05, 5, mEyes, 0.09, 0.78, 0.22));

  // Wings (broad stylized wings)
  for (const dir of [-1, 1]) {
    const wing = new THREE.Group();
    wing.add(createBox(0.48, 0.04, 0.28, mWing, dir * 0.25, 0, 0));
    wing.add(createBox(0.35, 0.03, 0.22, mWing, dir * 0.6, 0.05, 0.05));
    // Wing tip claw
    wing.add(createCone(0.03, 0.08, 4, mBody, dir * 0.45, 0.12, -0.05));
    wing.position.set(dir * 0.22, 0.74, 0);
    wing.rotation.set(0.1, dir * -0.2, dir * 0.15);
    root.add(wing);
  }

  return root;
}

function buildSlimeEnemy() {
  const root = new THREE.Group();
  root.name = 'enemy_slime';
  const mGel = matStandard(0x28d878, { roughness: 0.3, metalness: 0.1, transparent: true, opacity: 0.85, emissive: 0x0f5025, emissiveIntensity: 0.4 });
  const mCore = matStandard(0x75ffaa, { roughness: 0.2, emissive: 0x30e070, emissiveIntensity: 1.2 });
  const mEyes = matBasic(0x0a2215);

  // Outer Squishy Dome
  root.add(createSphere(0.42, 8, mGel, 0, 0.42, 0));
  root.add(createCylinder(0.46, 0.52, 0.22, 8, mGel, 0, 0.14, 0));
  // Inner floating core
  root.add(createSphere(0.16, 6, mCore, 0, 0.38, 0));
  // Eyes
  root.add(createSphere(0.055, 5, mEyes, -0.12, 0.46, 0.36));
  root.add(createSphere(0.055, 5, mEyes, 0.12, 0.46, 0.36));

  return root;
}

function buildGhostEnemy() {
  const root = new THREE.Group();
  root.name = 'enemy_ghost';
  const mGhost = matStandard(0x88e6ff, { roughness: 0.4, transparent: true, opacity: 0.78, emissive: 0x2288bb, emissiveIntensity: 0.8 });
  const mEyes = matBasic(0xffffff);

  // Floating Cloaked Head
  root.add(createSphere(0.32, 8, mGhost, 0, 0.95, 0));
  // Tapered Tail
  root.add(createCone(0.34, 0.75, 7, mGhost, 0, 0.48, 0, Math.PI, 0, 0));
  root.add(createCone(0.18, 0.45, 6, mGhost, 0.08, 0.16, -0.12, Math.PI + 0.4, 0, 0.2));
  // Eyes
  root.add(createSphere(0.05, 5, mEyes, -0.09, 0.96, 0.26));
  root.add(createSphere(0.05, 5, mEyes, 0.09, 0.96, 0.26));

  return root;
}

function buildArcherEnemy() {
  const root = new THREE.Group();
  root.name = 'enemy_archer';
  const mBone = matStandard(0xc0d0dc, { roughness: 0.85 });
  const mHood = matStandard(0x1e3630, { roughness: 0.8 });
  const mBow = matStandard(0x583e28, { roughness: 0.6 });
  const mEyes = matBasic(0x55ffcc);

  // Head with Hood
  root.add(createBox(0.32, 0.32, 0.32, mBone, 0, 1.16, 0));
  root.add(createCone(0.42, 0.55, 7, mHood, 0, 1.34, -0.04, 0.15, 0, 0));
  root.add(createSphere(0.045, 5, mEyes, -0.08, 1.16, 0.16));
  root.add(createSphere(0.045, 5, mEyes, 0.08, 1.16, 0.16));

  // Torso
  root.add(createCylinder(0.18, 0.22, 0.52, 6, mHood, 0, 0.72, 0));
  // Legs
  root.add(createCylinder(0.045, 0.045, 0.48, 5, mBone, -0.12, 0.24, 0));
  root.add(createCylinder(0.045, 0.045, 0.48, 5, mBone, 0.12, 0.24, 0));

  // Bow
  const bow = new THREE.Group();
  bow.add(createTorus(0.38, 0.032, 4, 10, mBow, 0, 0, 0, 0, 0, 0));
  bow.position.set(0.38, 0.76, 0.18);
  bow.rotation.set(0, Math.PI / 2.5, 0);
  root.add(bow);

  // Quiver on back
  const quiver = new THREE.Group();
  quiver.add(createCylinder(0.08, 0.06, 0.45, 6, mBow, 0, 0, 0));
  quiver.add(createBox(0.04, 0.12, 0.04, mBone, -0.02, 0.25, 0));
  quiver.add(createBox(0.04, 0.12, 0.04, mBone, 0.02, 0.25, 0));
  quiver.position.set(-0.12, 0.8, -0.18);
  quiver.rotation.set(0, 0, 0.35);
  root.add(quiver);

  return root;
}

function buildKnightEnemy() {
  const root = new THREE.Group();
  root.name = 'enemy_knight';
  const mArmor = matStandard(0x324050, { roughness: 0.5, metalness: 0.5 });
  const mDarkMetal = matStandard(0x18202a, { roughness: 0.6, metalness: 0.6 });
  const mVisorGlow = matBasic(0xff4455);
  const mGold = matStandard(0xc49a34, { roughness: 0.4, metalness: 0.6 });

  // Heavy Helmet
  root.add(createBox(0.44, 0.42, 0.42, mArmor, 0, 1.25, 0));
  // Visor Slit
  root.add(createBox(0.32, 0.055, 0.05, mVisorGlow, 0, 1.26, 0.22));
  // Horns / Crest
  root.add(createCone(0.06, 0.28, 5, mDarkMetal, -0.22, 1.5, 0, 0, 0, 0.35));
  root.add(createCone(0.06, 0.28, 5, mDarkMetal, 0.22, 1.5, 0, 0, 0, -0.35));

  // Heavy Torso
  root.add(createBox(0.56, 0.65, 0.42, mArmor, 0, 0.75, 0));
  root.add(createBox(0.24, 0.12, 0.08, mGold, 0, 0.78, 0.22));

  // Pauldrons
  root.add(createBox(0.26, 0.22, 0.28, mDarkMetal, -0.38, 0.95, 0, 0, 0, 0.25));
  root.add(createBox(0.26, 0.22, 0.28, mDarkMetal, 0.38, 0.95, 0, 0, 0, -0.25));

  // Legs
  root.add(createBox(0.18, 0.45, 0.22, mArmor, -0.16, 0.24, 0));
  root.add(createBox(0.18, 0.45, 0.22, mArmor, 0.16, 0.24, 0));

  // Tower Shield
  const shield = new THREE.Group();
  shield.add(createBox(0.36, 0.85, 0.08, mDarkMetal, 0, 0, 0));
  shield.add(createBox(0.3, 0.75, 0.04, mArmor, 0, 0, 0.04));
  shield.add(createBox(0.08, 0.5, 0.04, mGold, 0, 0, 0.06));
  shield.position.set(-0.48, 0.65, 0.2);
  shield.rotation.set(0, 0.3, 0);
  root.add(shield);

  // Broadsword
  const sword = new THREE.Group();
  sword.add(createBox(0.12, 0.95, 0.04, mArmor, 0, 0.5, 0));
  sword.add(createBox(0.3, 0.06, 0.06, mGold, 0, 0.15, 0));
  sword.add(createCylinder(0.035, 0.035, 0.22, 6, mDarkMetal, 0, 0.04, 0));
  sword.position.set(0.48, 0.55, 0.08);
  sword.rotation.set(-0.2, 0, -0.4);
  root.add(sword);

  return root;
}

function buildDemonEnemy() {
  const root = new THREE.Group();
  root.name = 'enemy_demon';
  const mSkin = matStandard(0x8a2028, { roughness: 0.7, emissive: 0x220508, emissiveIntensity: 0.3 });
  const mHorn = matStandard(0x181014, { roughness: 0.6, metalness: 0.3 });
  const mEyes = matBasic(0xff9922);
  const mCore = matStandard(0xff5522, { roughness: 0.3, emissive: 0xff3300, emissiveIntensity: 1.5 });

  // Head
  root.add(createBox(0.38, 0.36, 0.36, mSkin, 0, 1.18, 0));
  // Horns
  root.add(createCone(0.09, 0.55, 6, mHorn, -0.22, 1.45, -0.05, -0.3, 0, 0.35));
  root.add(createCone(0.09, 0.55, 6, mHorn, 0.22, 1.45, -0.05, -0.3, 0, -0.35));
  // Eyes
  root.add(createSphere(0.055, 5, mEyes, -0.1, 1.2, 0.19));
  root.add(createSphere(0.055, 5, mEyes, 0.1, 1.2, 0.19));

  // Torso
  root.add(createBox(0.52, 0.58, 0.38, mSkin, 0, 0.72, 0));
  // Molten Core
  root.add(createOcta(0.12, mCore, 0, 0.75, 0.18));

  // Arms & Claws
  root.add(createBox(0.16, 0.48, 0.16, mSkin, -0.36, 0.68, 0, 0, 0, 0.2));
  root.add(createBox(0.16, 0.48, 0.16, mSkin, 0.36, 0.68, 0, 0, 0, -0.2));
  // Legs
  root.add(createBox(0.18, 0.48, 0.2, mSkin, -0.16, 0.24, 0));
  root.add(createBox(0.18, 0.48, 0.2, mSkin, 0.16, 0.24, 0));

  return root;
}

function buildImpEnemy() {
  const root = new THREE.Group();
  root.name = 'enemy_imp';
  const mSkin = matStandard(0xb84024, { roughness: 0.65 });
  const mHorn = matStandard(0x281014, { roughness: 0.7 });
  const mCore = matStandard(0xffaa22, { roughness: 0.2, emissive: 0xff6600, emissiveIntensity: 2.2 });
  const mEyes = matBasic(0xffdd44);

  // Big Head
  root.add(createSphere(0.3, 7, mSkin, 0, 0.62, 0));
  // Horns
  root.add(createCone(0.065, 0.28, 5, mHorn, -0.15, 0.88, 0.02, -0.2, 0, 0.3));
  root.add(createCone(0.065, 0.28, 5, mHorn, 0.15, 0.88, 0.02, -0.2, 0, -0.3));
  // Big Glowing Eyes
  root.add(createSphere(0.065, 5, mEyes, -0.11, 0.66, 0.24));
  root.add(createSphere(0.065, 5, mEyes, 0.11, 0.66, 0.24));

  // Small Torso
  root.add(createSphere(0.2, 6, mSkin, 0, 0.34, 0));
  // Unstable Fiery Core
  root.add(createSphere(0.12, 6, mCore, 0, 0.34, 0.12));

  // Legs
  root.add(createCylinder(0.04, 0.04, 0.24, 5, mSkin, -0.1, 0.12, 0));
  root.add(createCylinder(0.04, 0.04, 0.24, 5, mSkin, 0.1, 0.12, 0));

  return root;
}

// -------------------------------------------------------------
// 3. BOSSES
// -------------------------------------------------------------
function buildSkeletonKingBoss() {
  const root = new THREE.Group();
  root.name = 'boss_skeleton_king';
  const mBone = matStandard(0xd0e0ea, { roughness: 0.8 });
  const mArmor = matStandard(0x18202c, { roughness: 0.5, metalness: 0.6 });
  const mGold = matStandard(0xffc34e, { roughness: 0.3, metalness: 0.8, emissive: 0x664408, emissiveIntensity: 0.5 });
  const mCape = matStandard(0x8a1528, { roughness: 0.85 });
  const mEyes = matBasic(0xff2244);

  // Huge Skull
  root.add(createBox(0.95, 0.85, 0.85, mBone, 0, 2.45, 0));
  root.add(createBox(0.72, 0.32, 0.6, mBone, 0, 1.95, 0.22)); // massive jaw
  // Glowing red eyes
  root.add(createBox(0.18, 0.18, 0.08, mEyes, -0.24, 2.5, 0.44));
  root.add(createBox(0.18, 0.18, 0.08, mEyes, 0.24, 2.5, 0.44));

  // Gold Crown with Spikes
  root.add(createCylinder(0.55, 0.52, 0.22, 8, mGold, 0, 2.95, 0));
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    root.add(createCone(0.12, 0.45, 5, mGold, Math.cos(angle) * 0.48, 3.25, Math.sin(angle) * 0.48));
  }

  // Chest Armor & Pauldrons
  root.add(createBox(1.35, 1.15, 0.85, mArmor, 0, 1.35, 0));
  root.add(createBox(0.65, 0.45, 0.12, mGold, 0, 1.45, 0.44)); // chest crest
  root.add(createBox(0.65, 0.45, 0.65, mArmor, -0.88, 1.75, 0, 0, 0, 0.25));
  root.add(createBox(0.65, 0.45, 0.65, mArmor, 0.88, 1.75, 0, 0, 0, -0.25));

  // Crimson Cape
  root.add(createBox(1.4, 1.8, 0.14, mCape, 0, 1.1, -0.45, 0.12, 0, 0));

  // Greatsword
  const sword = new THREE.Group();
  sword.add(createBox(0.24, 2.3, 0.08, mArmor, 0, 1.15, 0));
  sword.add(createBox(0.85, 0.16, 0.14, mGold, 0, 0.35, 0));
  sword.add(createCylinder(0.07, 0.07, 0.5, 6, mBone, 0, 0.1, 0));
  sword.position.set(1.4, 0.9, 0.2);
  sword.rotation.set(-0.25, 0, -0.4);
  root.add(sword);

  return root;
}

function buildForestWitchBoss() {
  const root = new THREE.Group();
  root.name = 'boss_forest_witch';
  const mRobes = matStandard(0x182c22, { roughness: 0.85 });
  const mPurple = matStandard(0x4a1854, { roughness: 0.8 });
  const mWood = matStandard(0x422818, { roughness: 0.9 });
  const mSpectral = matStandard(0xbb55ff, { roughness: 0.25, emissive: 0x8822ee, emissiveIntensity: 1.8 });
  const mEyes = matBasic(0x55ffcc);

  // Hooded Head
  root.add(createSphere(0.55, 8, mRobes, 0, 2.2, 0));
  root.add(createCone(0.65, 0.85, 7, mRobes, 0, 2.5, -0.1, 0.2, 0, 0));
  root.add(createSphere(0.08, 5, mEyes, -0.16, 2.2, 0.42));
  root.add(createSphere(0.08, 5, mEyes, 0.16, 2.2, 0.42));

  // Twisted Antler Crown
  root.add(createCone(0.12, 1.1, 5, mWood, -0.45, 2.9, -0.05, -0.2, 0, 0.35));
  root.add(createCone(0.12, 1.1, 5, mWood, 0.45, 2.9, -0.05, -0.2, 0, -0.35));
  root.add(createCone(0.08, 0.65, 5, mWood, -0.65, 3.2, 0.1, -0.4, 0, 0.5));
  root.add(createCone(0.08, 0.65, 5, mWood, 0.65, 3.2, 0.1, -0.4, 0, -0.5));

  // Floating Robes
  root.add(createCone(0.95, 1.9, 8, mRobes, 0, 1.05, 0));
  root.add(createCone(0.85, 1.6, 7, mPurple, 0, 0.95, 0.1, 0.08, 0, 0));

  // Spectral Magic Core
  root.add(createOcta(0.35, mSpectral, 0, 1.25, 0.5));

  // Wooden Root Staff
  const staff = new THREE.Group();
  staff.add(createCylinder(0.07, 0.08, 2.4, 6, mWood, 0, 1.2, 0));
  staff.add(createOcta(0.25, mSpectral, 0, 2.35, 0));
  staff.position.set(1.05, 0.3, 0.25);
  staff.rotation.set(-0.15, 0, -0.2);
  root.add(staff);

  return root;
}

function buildFrostGolemBoss() {
  const root = new THREE.Group();
  root.name = 'boss_frost_golem';
  const mStone = matStandard(0x425a72, { roughness: 0.8, metalness: 0.2 });
  const mIce = matStandard(0x60d8ff, { roughness: 0.25, metalness: 0.1, emissive: 0x2288cc, emissiveIntensity: 1.2 });
  const mSnow = matStandard(0xd5eef8, { roughness: 0.9 });

  // Massive Torso
  root.add(createBox(1.5, 1.4, 1.1, mStone, 0, 1.4, 0));
  root.add(createBox(1.2, 0.35, 0.6, mSnow, 0, 2.05, 0)); // snow on shoulders
  // Embedded Glacial Crystal Core
  root.add(createOcta(0.48, mIce, 0, 1.45, 0.55));

  // Head Monolith
  root.add(createBox(0.75, 0.55, 0.65, mStone, 0, 2.3, 0.1));
  root.add(createBox(0.45, 0.09, 0.1, mIce, 0, 2.3, 0.44)); // ice eye slit

  // Huge Asymmetric Rocky Shoulders & Arms
  root.add(createSphere(0.55, 7, mStone, -1.05, 1.7, 0));
  root.add(createOcta(0.38, mIce, -1.15, 2.1, 0)); // ice spike on shoulder
  root.add(createCylinder(0.32, 0.38, 1.2, 6, mStone, -1.1, 0.9, 0.1));

  root.add(createSphere(0.65, 7, mStone, 1.1, 1.75, 0));
  root.add(createOcta(0.45, mIce, 1.2, 2.2, 0));
  root.add(createCylinder(0.36, 0.44, 1.3, 6, mStone, 1.15, 0.85, 0.1));

  return root;
}

function buildDemonLordBoss() {
  const root = new THREE.Group();
  root.name = 'boss_demon_lord';
  const mArmor = matStandard(0x22121e, { roughness: 0.5, metalness: 0.5 });
  const mSkin = matStandard(0x7a1824, { roughness: 0.7, emissive: 0x300508, emissiveIntensity: 0.4 });
  const mFire = matStandard(0xff5511, { roughness: 0.2, emissive: 0xff3300, emissiveIntensity: 2.0 });
  const mHorn = matStandard(0x11080e, { roughness: 0.5, metalness: 0.4 });

  // Horned Head
  root.add(createBox(0.85, 0.8, 0.75, mSkin, 0, 2.5, 0));
  root.add(createCone(0.18, 1.3, 6, mHorn, -0.55, 3.1, -0.1, -0.3, 0, 0.4));
  root.add(createCone(0.18, 1.3, 6, mHorn, 0.55, 3.1, -0.1, -0.3, 0, -0.4));
  root.add(createBox(0.15, 0.15, 0.08, mFire, -0.22, 2.55, 0.4));
  root.add(createBox(0.15, 0.15, 0.08, mFire, 0.22, 2.55, 0.4));

  // Massive Torso & Brimstone Armor
  root.add(createBox(1.55, 1.4, 0.95, mArmor, 0, 1.45, 0));
  root.add(createOcta(0.45, mFire, 0, 1.55, 0.52)); // molten chest furnace

  // Demon Wings
  for (const dir of [-1, 1]) {
    const wing = new THREE.Group();
    wing.add(createBox(1.4, 1.6, 0.12, mArmor, dir * 0.8, 0, 0));
    wing.add(createCone(0.15, 0.6, 5, mHorn, dir * 1.5, 0.8, 0, 0, 0, dir * -0.4));
    wing.position.set(dir * 0.75, 1.8, -0.45);
    wing.rotation.set(0.15, dir * -0.35, dir * 0.2);
    root.add(wing);
  }

  // Infernal Blade
  const blade = new THREE.Group();
  blade.add(createBox(0.25, 2.4, 0.08, mArmor, 0, 1.2, 0));
  blade.add(createBox(0.1, 2.2, 0.1, mFire, 0, 1.2, 0.04));
  blade.position.set(1.5, 1.0, 0.2);
  blade.rotation.set(-0.3, 0, -0.45);
  root.add(blade);

  return root;
}

// -------------------------------------------------------------
// 4. ENVIRONMENT PROPS
// -------------------------------------------------------------
function buildGraveyardProps() {
  const mStone = matStandard(0x3e4854, { roughness: 0.9 });
  const mStoneAlt = matStandard(0x566270, { roughness: 0.85 });
  const mIron = matStandard(0x1c2430, { roughness: 0.6, metalness: 0.5 });
  const mWood = matStandard(0x18222e, { roughness: 0.95 });
  const mWarm = matStandard(0xffaa33, { roughness: 0.3, emissive: 0xff8811, emissiveIntensity: 2.0 });

  return {
    grave_a: () => {
      const g = new THREE.Group();
      g.add(createBox(0.45, 0.85, 0.18, mStone, 0, 0.42, 0));
      g.add(createCylinder(0.22, 0.22, 0.18, 8, mStone, 0, 0.85, 0, 0, 0, Math.PI / 2));
      return g;
    },
    grave_b: () => {
      const g = new THREE.Group();
      g.add(createBox(0.5, 0.9, 0.2, mStoneAlt, 0, 0.45, 0));
      g.add(createCone(0.35, 0.35, 4, mStoneAlt, 0, 1.05, 0, 0, Math.PI / 4, 0));
      return g;
    },
    grave_cross: () => {
      const g = new THREE.Group();
      g.add(createBox(0.18, 1.1, 0.18, mStone, 0, 0.55, 0));
      g.add(createBox(0.65, 0.16, 0.18, mStone, 0, 0.85, 0));
      g.add(createTorus(0.22, 0.04, 5, 12, mStoneAlt, 0, 0.85, 0));
      return g;
    },
    grave_broken: () => {
      const g = new THREE.Group();
      g.add(createBox(0.42, 0.45, 0.18, mStone, 0, 0.22, 0));
      g.add(createBox(0.38, 0.38, 0.16, mStone, 0.25, 0.16, 0.15, 0.3, 0.4, 0.8));
      return g;
    },
    crypt_small: () => {
      const g = new THREE.Group();
      g.add(createBox(1.6, 1.4, 2.2, mStone, 0, 0.7, 0));
      g.add(createCone(1.3, 0.7, 4, mStoneAlt, 0, 1.75, 0, 0, Math.PI / 4, 0));
      g.add(createBox(0.7, 1.1, 0.08, mIron, 0, 0.55, 1.12));
      return g;
    },
    crypt_large: () => {
      const g = new THREE.Group();
      g.add(createBox(2.8, 2.2, 3.4, mStone, 0, 1.1, 0));
      g.add(createBox(3.1, 0.4, 3.7, mStoneAlt, 0, 2.4, 0));
      // Front Pillars
      g.add(createCylinder(0.18, 0.2, 2.0, 8, mStoneAlt, -1.1, 1.1, 1.75));
      g.add(createCylinder(0.18, 0.2, 2.0, 8, mStoneAlt, 1.1, 1.1, 1.75));
      g.add(createBox(1.1, 1.7, 0.1, mIron, 0, 0.9, 1.72));
      return g;
    },
    dead_tree_a: () => {
      const g = new THREE.Group();
      g.add(createCylinder(0.22, 0.38, 2.8, 6, mWood, 0, 1.4, 0));
      g.add(createCylinder(0.14, 0.2, 1.6, 5, mWood, -0.45, 2.2, 0.1, 0, 0, 0.45));
      g.add(createCylinder(0.12, 0.18, 1.4, 5, mWood, 0.42, 2.4, -0.1, 0, 0, -0.5));
      return g;
    },
    dead_tree_b: () => {
      const g = new THREE.Group();
      g.add(createCylinder(0.28, 0.45, 1.6, 6, mWood, 0, 0.8, 0));
      g.add(createCylinder(0.18, 0.26, 2.1, 5, mWood, -0.32, 2.1, 0, 0, 0, 0.3));
      g.add(createCylinder(0.16, 0.24, 1.9, 5, mWood, 0.35, 2.0, 0, 0, 0, -0.35));
      return g;
    },
    dead_tree_twisted: () => {
      const g = new THREE.Group();
      g.add(createCylinder(0.3, 0.55, 1.4, 6, mWood, 0, 0.7, 0, 0.15, 0.2, 0));
      g.add(createCylinder(0.18, 0.28, 1.8, 5, mWood, 0.4, 1.8, 0.2, 0.3, 0, -0.55));
      g.add(createCylinder(0.16, 0.25, 1.5, 5, mWood, -0.45, 1.6, -0.2, -0.3, 0, 0.6));
      return g;
    },
    iron_fence: () => {
      const g = new THREE.Group();
      for (let i = 0; i < 7; i++) {
        const x = -1.2 + i * 0.4;
        g.add(createCylinder(0.022, 0.022, 1.1, 5, mIron, x, 0.55, 0));
        g.add(createCone(0.045, 0.15, 4, mIron, x, 1.15, 0));
      }
      g.add(createBox(2.6, 0.05, 0.05, mIron, 0, 0.3, 0));
      g.add(createBox(2.6, 0.05, 0.05, mIron, 0, 0.85, 0));
      return g;
    },
    iron_gate: () => {
      const g = new THREE.Group();
      g.add(createBox(0.25, 1.8, 0.25, mStoneAlt, -1.1, 0.9, 0));
      g.add(createBox(0.25, 1.8, 0.25, mStoneAlt, 1.1, 0.9, 0));
      g.add(createBox(1.9, 1.4, 0.06, mIron, 0, 0.8, 0));
      return g;
    },
    lantern_post: () => {
      const g = new THREE.Group();
      g.add(createCylinder(0.05, 0.08, 1.8, 6, mIron, 0, 0.9, 0));
      g.add(createBox(0.28, 0.38, 0.28, mIron, 0, 1.85, 0));
      g.add(createOcta(0.14, mWarm, 0, 1.85, 0));
      return g;
    },
    candle_cluster: () => {
      const g = new THREE.Group();
      g.add(createCylinder(0.04, 0.04, 0.3, 6, mStoneAlt, -0.08, 0.15, 0));
      g.add(createOcta(0.05, mWarm, -0.08, 0.34, 0));
      g.add(createCylinder(0.04, 0.04, 0.45, 6, mStoneAlt, 0.06, 0.22, 0.04));
      g.add(createOcta(0.06, mWarm, 0.06, 0.48, 0.04));
      return g;
    },
    angel_statue: () => {
      const g = new THREE.Group();
      g.add(createBox(0.65, 0.55, 0.65, mStone, 0, 0.27, 0));
      g.add(createCylinder(0.25, 0.35, 1.1, 7, mStoneAlt, 0, 1.05, 0)); // robes
      g.add(createSphere(0.22, 6, mStoneAlt, 0, 1.65, 0)); // head
      g.add(createBox(0.65, 0.8, 0.08, mStoneAlt, -0.28, 1.4, -0.15, 0.2, -0.3, 0.2)); // wing
      g.add(createBox(0.65, 0.8, 0.08, mStoneAlt, 0.28, 1.4, -0.15, 0.2, 0.3, -0.2));
      return g;
    },
    stone_arch: () => {
      const g = new THREE.Group();
      g.add(createBox(0.45, 2.2, 0.45, mStone, -1.2, 1.1, 0));
      g.add(createBox(0.45, 2.2, 0.45, mStone, 1.2, 1.1, 0));
      g.add(createBox(2.9, 0.45, 0.55, mStoneAlt, 0, 2.3, 0));
      return g;
    },
    chapel_ruin: () => {
      const g = new THREE.Group();
      g.add(createBox(3.4, 2.8, 0.4, mStone, 0, 1.4, 0));
      g.add(createCone(1.8, 1.6, 4, mStoneAlt, 0, 3.6, 0, 0, Math.PI / 4, 0));
      return g;
    },
    rock_cluster: () => {
      const g = new THREE.Group();
      g.add(createSphere(0.38, 5, mStone, 0, 0.28, 0));
      g.add(createSphere(0.28, 5, mStoneAlt, 0.28, 0.2, 0.1));
      g.add(createSphere(0.22, 5, mStone, -0.25, 0.16, -0.08));
      return g;
    },
    path_slab: () => {
      const g = new THREE.Group();
      g.add(createBox(1.2, 0.08, 0.8, mStoneAlt, 0, 0.04, 0));
      return g;
    },
  };
}

function buildForestProps() {
  const mBark = matStandard(0x281e18, { roughness: 0.95 });
  const mMoss = matStandard(0x243e26, { roughness: 0.9 });
  const mWood = matStandard(0x3e2b1c, { roughness: 0.9 });
  const mStone = matStandard(0x38423b, { roughness: 0.85 });
  const mPurple = matStandard(0xb844ff, { roughness: 0.3, emissive: 0x8811ee, emissiveIntensity: 1.8 });
  const mTeal = matStandard(0x44ffcc, { roughness: 0.3, emissive: 0x11cc99, emissiveIntensity: 1.8 });
  const mWarm = matStandard(0xffaa33, { roughness: 0.3, emissive: 0xff8811, emissiveIntensity: 1.8 });

  return {
    cursed_tree_giant: () => {
      const g = new THREE.Group();
      // Massive Cursed Landmark Tree
      g.add(createCylinder(0.9, 1.6, 4.5, 8, mBark, 0, 2.25, 0));
      // Root flare
      g.add(createCylinder(1.7, 2.4, 1.2, 8, mBark, 0, 0.6, 0));
      // Sprawling roots
      g.add(createBox(3.4, 0.6, 0.8, mBark, 0, 0.3, 0, 0, 0.4, 0));
      g.add(createBox(0.8, 0.6, 3.4, mBark, 0, 0.3, 0, 0, -0.4, 0));
      // Twisted giant limbs
      g.add(createCylinder(0.45, 0.75, 2.8, 6, mBark, -1.2, 4.2, 0.4, 0.2, 0, 0.45));
      g.add(createCylinder(0.45, 0.75, 2.8, 6, mBark, 1.2, 4.2, -0.4, -0.2, 0, -0.45));
      g.add(createCylinder(0.35, 0.6, 2.4, 6, mBark, 0.3, 4.6, 1.1, -0.4, 0, 0.2));
      // Purple spectral mushrooms on trunk
      g.add(createSphere(0.25, 5, mPurple, -0.85, 1.8, 0.5));
      g.add(createSphere(0.2, 5, mPurple, -0.75, 2.2, 0.6));
      return g;
    },
    tree_twisted_a: () => {
      const g = new THREE.Group();
      g.add(createCylinder(0.3, 0.55, 2.2, 6, mBark, 0, 1.1, 0, 0.1, 0, 0.15));
      g.add(createCylinder(0.18, 0.3, 1.8, 5, mBark, 0.35, 2.6, 0.2, 0.25, 0, -0.45));
      g.add(createCylinder(0.16, 0.26, 1.5, 5, mBark, -0.32, 2.4, -0.2, -0.3, 0, 0.5));
      return g;
    },
    tree_twisted_b: () => {
      const g = new THREE.Group();
      g.add(createCylinder(0.35, 0.6, 1.8, 6, mBark, 0, 0.9, 0));
      g.add(createCylinder(0.22, 0.32, 2.2, 5, mBark, -0.4, 2.4, 0, 0, 0, 0.35));
      g.add(createCylinder(0.2, 0.3, 2.0, 5, mBark, 0.4, 2.3, 0.1, 0.1, 0, -0.35));
      return g;
    },
    tree_twisted_c: () => {
      const g = new THREE.Group();
      g.add(createCylinder(0.26, 0.48, 2.5, 6, mBark, 0, 1.25, 0, -0.15, 0, -0.2));
      g.add(createCylinder(0.14, 0.24, 1.6, 5, mBark, -0.35, 2.4, 0.3, -0.4, 0, 0.4));
      return g;
    },
    exposed_roots: () => {
      const g = new THREE.Group();
      g.add(createBox(2.2, 0.35, 0.45, mBark, 0, 0.16, 0, 0.1, 0.3, 0.05));
      g.add(createBox(1.8, 0.3, 0.4, mBark, 0.3, 0.14, 0.4, -0.1, -0.5, -0.05));
      return g;
    },
    fallen_log: () => {
      const g = new THREE.Group();
      g.add(createCylinder(0.32, 0.36, 3.2, 7, mBark, 0, 0.3, 0, 0, 0, Math.PI / 2));
      g.add(createBox(2.2, 0.1, 0.45, mMoss, 0, 0.58, 0));
      return g;
    },
    tree_stump: () => {
      const g = new THREE.Group();
      g.add(createCylinder(0.55, 0.75, 0.75, 7, mBark, 0, 0.38, 0));
      g.add(createCylinder(0.52, 0.52, 0.05, 7, mWood, 0, 0.75, 0));
      return g;
    },
    mushroom_cluster_a: () => {
      const g = new THREE.Group();
      g.add(createSphere(0.28, 6, mPurple, -0.12, 0.35, 0));
      g.add(createCylinder(0.06, 0.08, 0.32, 5, mStone, -0.12, 0.16, 0));
      g.add(createSphere(0.22, 6, mPurple, 0.14, 0.26, 0.08));
      g.add(createCylinder(0.05, 0.07, 0.24, 5, mStone, 0.14, 0.12, 0.08));
      return g;
    },
    mushroom_cluster_b: () => {
      const g = new THREE.Group();
      g.add(createSphere(0.25, 6, mTeal, 0, 0.32, 0));
      g.add(createCylinder(0.05, 0.07, 0.3, 5, mStone, 0, 0.15, 0));
      g.add(createSphere(0.18, 6, mTeal, 0.16, 0.22, -0.08));
      return g;
    },
    standing_stone: () => {
      const g = new THREE.Group();
      g.add(createBox(0.65, 2.4, 0.4, mStone, 0, 1.2, 0));
      g.add(createOcta(0.15, mTeal, 0, 1.6, 0.22)); // glowing rune inset
      return g;
    },
    ancient_shrine: () => {
      const g = new THREE.Group();
      // Wooden Shrine Torii
      g.add(createCylinder(0.14, 0.16, 2.2, 6, mWood, -0.9, 1.1, 0));
      g.add(createCylinder(0.14, 0.16, 2.2, 6, mWood, 0.9, 1.1, 0));
      g.add(createBox(2.4, 0.22, 0.4, mWood, 0, 2.25, 0));
      g.add(createBox(2.8, 0.18, 0.5, mMoss, 0, 2.4, 0)); // roof
      // Spirit Bell
      g.add(createCone(0.2, 0.35, 6, mWarm, 0, 1.85, 0));
      return g;
    },
    spirit_lantern: () => {
      const g = new THREE.Group();
      g.add(createCylinder(0.04, 0.04, 1.4, 5, mWood, 0, 0.7, 0));
      g.add(createBox(0.26, 0.35, 0.26, mWood, 0, 1.45, 0));
      g.add(createSphere(0.1, 5, mTeal, 0, 1.45, 0));
      return g;
    },
    broken_bridge: () => {
      const g = new THREE.Group();
      g.add(createBox(1.2, 0.12, 2.2, mWood, 0, 0.25, 0, 0.15, 0, 0));
      g.add(createCylinder(0.12, 0.12, 0.8, 5, mWood, -0.6, 0.4, -0.8));
      g.add(createCylinder(0.12, 0.12, 0.8, 5, mWood, 0.6, 0.4, -0.8));
      return g;
    },
    mossy_rock: () => {
      const g = new THREE.Group();
      g.add(createSphere(0.55, 6, mStone, 0, 0.4, 0));
      g.add(createSphere(0.35, 5, mMoss, 0.1, 0.65, 0));
      return g;
    },
    spectral_wisp_post: () => {
      const g = new THREE.Group();
      g.add(createCylinder(0.08, 0.1, 1.6, 6, mWood, 0, 0.8, 0));
      g.add(createOcta(0.16, mPurple, 0, 1.8, 0));
      return g;
    },
  };
}

function buildFrozenProps() {
  const mStone = matStandard(0x3a4c5e, { roughness: 0.75, metalness: 0.2 });
  const mIce = matStandard(0x62d4ff, { roughness: 0.2, metalness: 0.1, emissive: 0x1177aa, emissiveIntensity: 1.4 });
  const mSnow = matStandard(0xdceef8, { roughness: 0.95 });

  return {
    temple_gate_arch: () => {
      const g = new THREE.Group();
      g.add(createBox(0.65, 3.2, 0.65, mStone, -1.5, 1.6, 0));
      g.add(createBox(0.65, 3.2, 0.65, mStone, 1.5, 1.6, 0));
      g.add(createBox(3.8, 0.65, 0.8, mStone, 0, 3.4, 0));
      g.add(createBox(3.4, 0.2, 0.7, mSnow, 0, 3.78, 0)); // snow atop lintel
      g.add(createOcta(0.32, mIce, 0, 3.4, 0.45)); // ice keystone
      return g;
    },
    frozen_pillar_a: () => {
      const g = new THREE.Group();
      g.add(createCylinder(0.35, 0.4, 2.6, 8, mStone, 0, 1.3, 0));
      g.add(createBox(0.9, 0.25, 0.9, mStone, 0, 2.65, 0));
      g.add(createBox(0.7, 0.15, 0.7, mSnow, 0, 2.82, 0));
      return g;
    },
    frozen_pillar_b: () => {
      const g = new THREE.Group();
      g.add(createCylinder(0.38, 0.42, 2.2, 8, mStone, 0, 1.1, 0));
      g.add(createOcta(0.28, mIce, 0.35, 1.6, 0));
      return g;
    },
    broken_pillar: () => {
      const g = new THREE.Group();
      g.add(createCylinder(0.36, 0.4, 1.1, 8, mStone, 0, 0.55, 0));
      g.add(createCylinder(0.34, 0.34, 1.3, 7, mStone, 0.45, 0.4, 0.2, 0.5, 0.2, 0.8));
      return g;
    },
    ice_crystal_huge: () => {
      const g = new THREE.Group();
      g.add(createOcta(0.85, mIce, 0, 1.8, 0, 0.1, 0, 0.15));
      g.add(createOcta(0.45, mIce, 0.6, 1.1, -0.2, 0.3, 0, -0.3));
      return g;
    },
    ice_crystal_cluster: () => {
      const g = new THREE.Group();
      g.add(createOcta(0.48, mIce, 0, 0.8, 0));
      g.add(createOcta(0.32, mIce, -0.35, 0.5, 0.15));
      g.add(createOcta(0.25, mIce, 0.32, 0.4, -0.1));
      return g;
    },
    ice_shard_small: () => {
      const g = new THREE.Group();
      g.add(createCone(0.18, 0.85, 5, mIce, 0, 0.42, 0));
      return g;
    },
    frozen_statue: () => {
      const g = new THREE.Group();
      g.add(createBox(0.8, 0.6, 0.8, mStone, 0, 0.3, 0));
      g.add(createCylinder(0.3, 0.4, 1.3, 7, mStone, 0, 1.25, 0));
      g.add(createSphere(0.24, 6, mStone, 0, 2.05, 0));
      g.add(createOcta(0.35, mIce, 0, 1.5, 0.3));
      return g;
    },
    frozen_altar: () => {
      const g = new THREE.Group();
      g.add(createBox(1.8, 0.75, 1.1, mStone, 0, 0.38, 0));
      g.add(createBox(2.0, 0.18, 1.3, mIce, 0, 0.8, 0));
      return g;
    },
    temple_wall: () => {
      const g = new THREE.Group();
      g.add(createBox(3.2, 2.4, 0.6, mStone, 0, 1.2, 0));
      g.add(createBox(3.4, 0.25, 0.7, mSnow, 0, 2.48, 0));
      return g;
    },
    snowbank_large: () => {
      const g = new THREE.Group();
      g.add(createSphere(0.9, 7, mSnow, 0, 0.25, 0));
      g.add(createSphere(0.65, 6, mSnow, 0.6, 0.2, 0.2));
      return g;
    },
    snowbank_small: () => {
      const g = new THREE.Group();
      g.add(createSphere(0.5, 6, mSnow, 0, 0.15, 0));
      return g;
    },
    frost_slab: () => {
      const g = new THREE.Group();
      g.add(createBox(1.3, 0.08, 0.9, mStone, 0, 0.04, 0));
      g.add(createBox(1.1, 0.02, 0.7, mSnow, 0, 0.09, 0));
      return g;
    },
  };
}

function buildCastleProps() {
  const mObsidian = matStandard(0x18121a, { roughness: 0.5, metalness: 0.6 });
  const mFire = matStandard(0xff5511, { roughness: 0.2, emissive: 0xff3300, emissiveIntensity: 2.2 });
  const mRedCrystal = matStandard(0xff2244, { roughness: 0.25, emissive: 0xcc0022, emissiveIntensity: 1.8 });
  const mIron = matStandard(0x2a1c22, { roughness: 0.6, metalness: 0.7 });

  return {
    infernal_gate: () => {
      const g = new THREE.Group();
      g.add(createBox(0.8, 3.8, 0.8, mObsidian, -1.8, 1.9, 0));
      g.add(createBox(0.8, 3.8, 0.8, mObsidian, 1.8, 1.9, 0));
      g.add(createBox(4.4, 0.8, 0.9, mObsidian, 0, 4.0, 0));
      // Curved fangs
      g.add(createCone(0.2, 1.2, 5, mObsidian, -1.6, 4.8, 0, 0, 0, -0.3));
      g.add(createCone(0.2, 1.2, 5, mObsidian, 1.6, 4.8, 0, 0, 0, 0.3));
      // Glowing lava eye
      g.add(createOcta(0.42, mFire, 0, 4.0, 0.5));
      return g;
    },
    demon_throne_silhouette: () => {
      const g = new THREE.Group();
      g.add(createBox(1.6, 0.6, 1.4, mObsidian, 0, 0.3, 0)); // base
      g.add(createBox(1.4, 2.6, 0.3, mObsidian, 0, 1.5, -0.5)); // backrest
      // Spikes
      g.add(createCone(0.15, 0.8, 5, mObsidian, -0.65, 3.0, -0.5));
      g.add(createCone(0.18, 1.1, 5, mObsidian, 0, 3.2, -0.5));
      g.add(createCone(0.15, 0.8, 5, mObsidian, 0.65, 3.0, -0.5));
      return g;
    },
    demon_statue: () => {
      const g = new THREE.Group();
      g.add(createBox(0.9, 0.8, 0.9, mObsidian, 0, 0.4, 0));
      g.add(createSphere(0.45, 6, mObsidian, 0, 1.4, 0));
      g.add(createCone(0.12, 0.55, 5, mObsidian, -0.25, 1.9, 0, 0, 0, 0.3));
      g.add(createCone(0.12, 0.55, 5, mObsidian, 0.25, 1.9, 0, 0, 0, -0.3));
      g.add(createOcta(0.16, mFire, 0, 1.4, 0.4));
      return g;
    },
    obsidian_pillar: () => {
      const g = new THREE.Group();
      g.add(createCylinder(0.4, 0.45, 2.8, 8, mObsidian, 0, 1.4, 0));
      g.add(createBox(0.1, 2.4, 0.1, mFire, 0, 1.4, 0.38)); // glowing lava vein
      return g;
    },
    castle_wall_spiked: () => {
      const g = new THREE.Group();
      g.add(createBox(3.2, 2.2, 0.6, mObsidian, 0, 1.1, 0));
      for (let i = 0; i < 5; i++) {
        g.add(createCone(0.08, 0.5, 4, mIron, -1.2 + i * 0.6, 2.4, 0));
      }
      return g;
    },
    fire_brazier: () => {
      const g = new THREE.Group();
      g.add(createCylinder(0.15, 0.25, 1.2, 6, mIron, 0, 0.6, 0));
      g.add(createCylinder(0.55, 0.35, 0.4, 7, mIron, 0, 1.3, 0));
      g.add(createOcta(0.32, mFire, 0, 1.55, 0));
      return g;
    },
    demon_altar: () => {
      const g = new THREE.Group();
      g.add(createBox(2.0, 0.8, 1.2, mObsidian, 0, 0.4, 0));
      g.add(createOcta(0.28, mRedCrystal, 0, 0.9, 0));
      return g;
    },
    blood_crystal_cluster: () => {
      const g = new THREE.Group();
      g.add(createOcta(0.45, mRedCrystal, 0, 0.8, 0, 0.2, 0, 0.1));
      g.add(createOcta(0.3, mRedCrystal, -0.3, 0.5, 0.2, -0.2, 0, 0.4));
      g.add(createOcta(0.24, mRedCrystal, 0.35, 0.4, -0.15, 0.4, 0, -0.3));
      return g;
    },
    iron_chains: () => {
      const g = new THREE.Group();
      for (let i = 0; i < 6; i++) {
        g.add(createTorus(0.14, 0.04, 4, 8, mIron, 0, 1.8 - i * 0.24, 0, i % 2 === 0 ? 0 : Math.PI / 2, 0, 0));
      }
      return g;
    },
    iron_spike: () => {
      const g = new THREE.Group();
      g.add(createCone(0.12, 0.9, 4, mIron, 0, 0.45, 0));
      g.add(createCone(0.09, 0.65, 4, mIron, 0.2, 0.32, 0.1, 0.1, 0, -0.2));
      return g;
    },
    lava_fissure_prop: () => {
      const g = new THREE.Group();
      g.add(createBox(2.4, 0.08, 0.6, mObsidian, 0, 0.04, 0));
      g.add(createBox(2.1, 0.03, 0.18, mFire, 0, 0.09, 0));
      return g;
    },
    rubble_pile: () => {
      const g = new THREE.Group();
      g.add(createBox(0.5, 0.35, 0.45, mObsidian, 0, 0.18, 0, 0.2, 0.4, 0));
      g.add(createBox(0.35, 0.25, 0.35, mObsidian, 0.3, 0.14, 0.1, -0.3, 0.1, 0.2));
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
