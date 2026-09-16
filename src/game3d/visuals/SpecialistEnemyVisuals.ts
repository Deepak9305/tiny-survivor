import * as THREE from 'three';
import type { EnemyKind } from '../../types';
import { SharedResources, addMesh } from '../core/SharedResources';

const SPECIALISTS = new Set<EnemyKind>(['zombie', 'bone-mage', 'forest-mage', 'forest-guardian', 'ice-mage', 'demon-warrior']);

export function isSpecialistEnemy(kind: EnemyKind): boolean { return SPECIALISTS.has(kind); }

export function createSpecialistEnemyModel(kind: EnemyKind, resources: SharedResources): THREE.Group {
  const root = new THREE.Group();
  root.name = `specialist-${kind}`;
  const parts: Record<string, THREE.Object3D | THREE.Object3D[]> = {};
  const arms: THREE.Object3D[] = [];
  const legs: THREE.Group[] = [];

  const addLegs = (material: THREE.Material, hipY = 0.42, spread = 0.20, length = 0.36) => {
    for (const x of [-spread, spread]) {
      const leg = new THREE.Group();
      leg.position.set(x, hipY, 0);
      const shin = addMesh(leg, resources.cylinder(`${kind}-leg`), material);
      shin.scale.set(0.13, length, 0.13);
      shin.position.set(0, -length * 0.45, 0.02);
      const foot = addMesh(leg, resources.box(`${kind}-foot`), material);
      foot.scale.set(0.22, 0.14, 0.34);
      foot.position.set(0, -length * 0.82, 0.08);
      root.add(leg);
      legs.push(leg);
    }
  };

  const addArms = (material: THREE.Material, y = 0.82, xOffset = 0.48) => {
    for (const x of [-xOffset, xOffset]) {
      const arm = addMesh(root, resources.cylinder(`${kind}-arm`), material);
      arm.scale.set(0.14, 0.52, 0.14);
      arm.position.set(x, y, 0.05);
      arm.rotation.z = x < 0 ? -0.28 : 0.28;
      arms.push(arm);
    }
  };

  if (kind === 'zombie') {
    const skin = resources.standardMaterial('zombie-skin', 0x80956e, { roughness: 0.94 });
    const cloth = resources.standardMaterial('zombie-cloth', 0x3c4650, { roughness: 0.98 });
    const wound = resources.standardMaterial('zombie-wound', 0x6e2633, { roughness: 0.9 });
    const torso = addMesh(root, resources.cylinder('zombie-torso'), cloth);
    torso.scale.set(0.72, 0.92, 0.58); torso.position.y = 0.72; torso.rotation.z = 0.08;
    const head = addMesh(root, resources.sphere('zombie-head'), skin);
    head.scale.set(0.48, 0.46, 0.44); head.position.set(0.08, 1.35, 0.08); head.rotation.z = -0.14;
    const chestWound = addMesh(root, resources.box('zombie-wound'), wound);
    chestWound.scale.set(0.26, 0.16, 0.06); chestWound.position.set(-0.18, 0.86, 0.31);
    addArms(skin, 0.80, 0.55); addLegs(cloth, 0.44, 0.22, 0.42);
    parts.body = torso; parts.head = head;
  } else if (kind === 'bone-mage') {
    const bone = resources.standardMaterial('bone-mage-bone', 0xd7d2bf, { roughness: 0.88 });
    const robe = resources.standardMaterial('bone-mage-robe', 0x3d245f, { roughness: 0.82, emissive: 0x25113e, emissiveIntensity: 0.25 });
    const metal = resources.standardMaterial('bone-mage-metal', 0x8f78ad, { metalness: 0.62, roughness: 0.4 });
    const body = addMesh(root, resources.cone('bone-mage-robe'), robe); body.scale.set(0.72, 1.3, 0.62); body.position.y = 0.66;
    const head = addMesh(root, resources.ico('bone-mage-skull'), bone); head.scale.setScalar(0.48); head.position.y = 1.42;
    addArms(robe, 0.88, 0.48);
    const staff = addMesh(root, resources.cylinder('bone-mage-staff'), metal); staff.scale.set(0.055, 1.38, 0.055); staff.position.set(0.62, 0.80, 0.08); staff.rotation.z = -0.24;
    const crystal = addMesh(root, resources.octa('bone-mage-crystal'), resources.standardMaterial('bone-mage-crystal-mat', 0xc084fc, { emissive: 0x7c3aed, emissiveIntensity: 1.7, roughness: 0.24 })); crystal.scale.setScalar(0.22); crystal.position.set(0.77, 1.48, 0.08);
    parts.body = body; parts.head = head; parts.weapon = staff; parts.core = crystal;
  } else if (kind === 'forest-mage') {
    const bark = resources.standardMaterial('forest-mage-bark', 0x4d5f36, { roughness: 0.95 });
    const robe = resources.standardMaterial('forest-mage-robe', 0x314b32, { roughness: 0.92 });
    const bloom = resources.standardMaterial('forest-mage-bloom', 0xa56bd6, { emissive: 0x542175, emissiveIntensity: 1.0, roughness: 0.42 });
    const body = addMesh(root, resources.cone('forest-mage-body'), robe); body.scale.set(0.76, 1.24, 0.64); body.position.y = 0.64;
    const head = addMesh(root, resources.sphere('forest-mage-head'), bark); head.scale.set(0.43, 0.48, 0.42); head.position.y = 1.36;
    addArms(bark, 0.83, 0.50);
    for (const x of [-0.24, 0.24]) { const horn = addMesh(root, resources.cone('forest-mage-antler'), bark); horn.scale.set(0.10, 0.46, 0.10); horn.position.set(x, 1.74, 0); horn.rotation.z = x < 0 ? -0.35 : 0.35; }
    const orb = addMesh(root, resources.octa('forest-mage-orb'), bloom); orb.scale.setScalar(0.20); orb.position.set(0.55, 1.1, 0.24);
    parts.body = body; parts.head = head; parts.core = orb;
  } else if (kind === 'forest-guardian') {
    const bark = resources.standardMaterial('forest-guardian-bark', 0x46583a, { roughness: 0.97 });
    const armor = resources.standardMaterial('forest-guardian-armor', 0x6c7e52, { metalness: 0.10, roughness: 0.88 });
    const body = addMesh(root, resources.cylinder('forest-guardian-body'), bark); body.scale.set(0.88, 1.02, 0.68); body.position.y = 0.78;
    const head = addMesh(root, resources.box('forest-guardian-head'), armor); head.scale.set(0.52, 0.48, 0.48); head.position.y = 1.48;
    addArms(bark, 0.90, 0.62); addLegs(bark, 0.48, 0.25, 0.46);
    const shield = addMesh(root, resources.cylinder('forest-guardian-shield'), armor); shield.scale.set(0.50, 0.12, 0.58); shield.position.set(-0.72, 0.90, 0.22); shield.rotation.x = Math.PI / 2;
    const club = addMesh(root, resources.cylinder('forest-guardian-club'), bark); club.scale.set(0.10, 1.05, 0.10); club.position.set(0.72, 0.88, 0.10); club.rotation.z = -0.42;
    parts.body = body; parts.head = head; parts.shield = shield; parts.weapon = club; parts.sword = club;
  } else if (kind === 'ice-mage') {
    const robe = resources.standardMaterial('ice-mage-robe', 0x315b78, { roughness: 0.72, emissive: 0x0b3148, emissiveIntensity: 0.45 });
    const ice = resources.standardMaterial('ice-mage-ice', 0xbfeaff, { emissive: 0x38bdf8, emissiveIntensity: 1.25, roughness: 0.18, metalness: 0.15 });
    const body = addMesh(root, resources.cone('ice-mage-body'), robe); body.scale.set(0.72, 1.28, 0.62); body.position.y = 0.66;
    const mask = addMesh(root, resources.octa('ice-mage-mask'), ice); mask.scale.set(0.42, 0.50, 0.38); mask.position.y = 1.42;
    addArms(robe, 0.86, 0.50);
    const staff = addMesh(root, resources.cylinder('ice-mage-staff'), ice); staff.scale.set(0.05, 1.34, 0.05); staff.position.set(0.62, 0.80, 0.06); staff.rotation.z = -0.20;
    const crystal = addMesh(root, resources.octa('ice-mage-crystal'), ice); crystal.scale.setScalar(0.24); crystal.position.set(0.74, 1.45, 0.06);
    parts.body = body; parts.head = mask; parts.weapon = staff; parts.core = crystal;
  } else if (kind === 'demon-warrior') {
    const armor = resources.standardMaterial('hellguard-armor', 0x5c2028, { metalness: 0.55, roughness: 0.45 });
    const dark = resources.standardMaterial('hellguard-dark', 0x1f1218, { roughness: 0.9 });
    const blade = resources.standardMaterial('hellguard-blade', 0x9b4b42, { metalness: 0.72, roughness: 0.34, emissive: 0x45100d, emissiveIntensity: 0.55 });
    const body = addMesh(root, resources.cylinder('hellguard-body'), armor); body.scale.set(0.98, 1.10, 0.76); body.position.y = 0.82;
    const head = addMesh(root, resources.ico('hellguard-head'), dark); head.scale.set(0.58, 0.62, 0.56); head.position.y = 1.58;
    for (const x of [-0.32, 0.32]) { const horn = addMesh(root, resources.cone('hellguard-horn'), blade); horn.scale.set(0.16, 0.58, 0.16); horn.position.set(x, 1.96, 0); horn.rotation.z = x < 0 ? -0.35 : 0.35; }
    addArms(armor, 0.92, 0.66); addLegs(dark, 0.50, 0.27, 0.48);
    const cleaver = addMesh(root, resources.box('hellguard-cleaver'), blade); cleaver.scale.set(0.20, 1.22, 0.09); cleaver.position.set(0.82, 1.0, 0.12); cleaver.rotation.z = -0.48;
    const guard = addMesh(root, resources.box('hellguard-guard'), armor); guard.scale.set(0.46, 0.10, 0.16); guard.position.set(0.70, 0.58, 0.12); guard.rotation.z = -0.48;
    parts.body = body; parts.head = head; parts.weapon = cleaver; parts.sword = cleaver;
  }

  if (arms.length) parts.arms = arms;
  if (legs.length) parts.legs = legs;
  root.userData.parts = parts;
  return root;
}
