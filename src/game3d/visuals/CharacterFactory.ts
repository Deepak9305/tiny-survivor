import * as THREE from 'three';
import type { BossId } from '../../types';
import { SharedResources, addMesh } from '../core/SharedResources';

export function createShadowMage(resources: SharedResources): { root: THREE.Group; aura: THREE.Mesh; shadow: THREE.Mesh } {
  const root = new THREE.Group();
  root.name = 'shadow-mage';
  root.userData.parts = {} as Record<string, THREE.Object3D | THREE.Object3D[]>;

  const shadow = new THREE.Mesh(
    resources.plane('hero-shadow', 1, 1),
    resources.basicMaterial('hero-shadow', 0x01050b, { transparent: true, opacity: 0.58 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.set(0.82, 0.42, 1);
  shadow.position.y = 0.018;
  root.add(shadow);

  const aura = new THREE.Mesh(
    resources.ring('hero-aura', 0.72, 0.78),
    resources.basicMaterial('hero-aura', 0x4bdcff, { transparent: true, opacity: 0.62, side: THREE.DoubleSide }),
  );
  aura.rotation.x = -Math.PI / 2;
  aura.position.y = 0.04;
  root.add(aura);

  const body = addMesh(root, resources.cylinder('hero-body'), resources.standardMaterial('hero-body', 0x2456a2, { roughness: 0.65 }));
  body.scale.set(0.72, 0.86, 0.56);
  body.position.y = 0.72;

  const cloak = addMesh(root, resources.cone('hero-cloak'), resources.standardMaterial('hero-cloak', 0x142d62, { roughness: 0.9 }));
  cloak.scale.set(0.86, 1.18, 0.7);
  cloak.position.y = 0.62;

  const hood = addMesh(root, resources.cone('hero-hood'), resources.standardMaterial('hero-hood', 0x0b142a, { roughness: 0.86 }));
  hood.scale.set(0.86, 0.92, 0.82);
  hood.position.y = 1.34;
  const hoodRim = addMesh(root, resources.torus('hero-hood-rim'), resources.standardMaterial('hero-hood-rim', 0x1b4c78, { metalness: 0.16, roughness: 0.64 }));
  hoodRim.scale.set(0.47, 0.22, 0.32);
  hoodRim.position.set(0, 1.2, 0.2);
  hoodRim.rotation.x = Math.PI / 2;

  const face = addMesh(root, resources.ico('hero-face'), resources.standardMaterial('hero-face', 0x121c32, { roughness: 0.72 }));
  face.scale.set(0.58, 0.56, 0.45);
  face.position.set(0, 1.29, 0.08);

  const eyeMaterial = resources.basicMaterial('hero-eyes', 0x86efff, { transparent: true, opacity: 0.98 });
  for (const x of [-0.19, 0.19]) {
    const eye = addMesh(root, resources.sphere('hero-eye'), eyeMaterial);
    eye.scale.set(0.075, 0.045, 0.03);
    eye.position.set(x, 1.36, 0.48);
  }

  const scarf = addMesh(root, resources.box('hero-scarf'), resources.standardMaterial('hero-scarf', 0xd64e61, { roughness: 0.8 }));
  scarf.scale.set(0.72, 0.11, 0.32);
  scarf.position.set(0.12, 1.04, 0.32);
  scarf.rotation.y = -0.2;
  const scarfTail = addMesh(root, resources.box('hero-scarf-tail'), resources.standardMaterial('hero-scarf-tail', 0xa9344e, { roughness: 0.82 }));
  scarfTail.scale.set(0.13, 0.08, 0.62);
  scarfTail.position.set(-0.39, 1.02, -0.1);
  scarfTail.rotation.x = -0.22;

  const armMaterial = resources.standardMaterial('hero-arms', 0x1a3e7d, { roughness: 0.7 });
  const arms: THREE.Object3D[] = [];
  for (const x of [-0.48, 0.48]) {
    const arm = addMesh(root, resources.cylinder('hero-arm'), armMaterial);
    arm.scale.set(0.16, 0.58, 0.16);
    arm.position.set(x, 0.82, 0.02);
    arm.rotation.z = x < 0 ? -0.32 : 0.32;
    arms.push(arm);
  }

  const bootMaterial = resources.standardMaterial('hero-boots', 0x0b162a, { roughness: 0.86 });
  for (const x of [-0.25, 0.25]) {
    const boot = addMesh(root, resources.box('hero-boot'), bootMaterial);
    boot.scale.set(0.28, 0.22, 0.4);
    boot.position.set(x, 0.23, 0.08);
  }

  const staff = addMesh(root, resources.cylinder('hero-staff'), resources.standardMaterial('hero-staff', 0x563c33, { roughness: 0.95 }));
  staff.scale.set(0.055, 1.35, 0.055);
  staff.position.set(0.66, 0.72, 0.08);
  staff.rotation.z = -0.28;
  const crystal = addMesh(root, resources.octa('hero-crystal'), resources.standardMaterial('hero-crystal', 0x58dcff, { emissive: 0x198dc7, emissiveIntensity: 1.5, roughness: 0.35, metalness: 0.18 }));
  crystal.scale.setScalar(0.26);
  crystal.position.set(0.84, 1.46, 0.08);
  const crystalHalo = addMesh(root, resources.torus('hero-crystal-halo'), resources.basicMaterial('hero-crystal-halo', 0x58dcff, { transparent: true, opacity: 0.3, side: THREE.DoubleSide }));
  crystalHalo.scale.setScalar(0.23);
  crystalHalo.position.copy(crystal.position);
  crystalHalo.rotation.x = Math.PI / 2;

  root.userData.parts = { body, cloak, hood, hoodRim, scarf, scarfTail, arms, staff, crystal, crystalHalo };

  return { root, aura, shadow };
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
  const root = new THREE.Group();
  root.name = `enemy-${kind}`;
  root.userData.parts = {} as Record<string, THREE.Object3D | THREE.Object3D[]>;
  const dark = new THREE.Color(color).multiplyScalar(0.52).getHex();
  const bodyMaterial = resources.standardMaterial(`enemy-body-${color}`, color, { roughness: 0.82 });
  const darkMaterial = resources.standardMaterial(`enemy-dark-${dark}`, dark, { roughness: 0.9 });
  const boneMaterial = resources.standardMaterial('enemy-bone', 0xb8c7d3, { roughness: 0.9 });
  const worldAccent = worldId === 2 ? 0xb875df : worldId === 3 ? 0x9ce7ff : worldId === 4 ? 0xff5e55 : 0x5ddcff;

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
    const body = addMesh(root, resources.sphere('enemy-slime-body'), bodyMaterial);
    body.scale.set(0.82, 0.62, 0.72);
    body.position.y = 0.48;
    root.userData.parts = { body };
    addEyes(root, resources, 0x113349, 0.56);
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
