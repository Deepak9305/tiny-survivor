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
    resources.ring('hero-aura', 0.76, 0.84),
    resources.basicMaterial('hero-aura', 0x4bdcff, { transparent: true, opacity: 0.65, side: THREE.DoubleSide }),
  );
  aura.rotation.x = -Math.PI / 2;
  aura.position.y = 0.04;
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
