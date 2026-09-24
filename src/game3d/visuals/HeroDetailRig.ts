import * as THREE from 'three';
import type { HeroId } from '../../types';
import { SharedResources, addMesh } from '../core/SharedResources';

export interface HeroDetailRig {
  root: THREE.Group;
  update: (time: number, attackPulse: number, flowRatio: number, overdrive: boolean) => void;
}

const HERO_DETAIL_COLORS: Record<HeroId, number> = {
  shadow: 0x62d9ef,
  warrior: 0xd4a34f,
  monk: 0x55b98d,
  gunslinger: 0xb884cc,
};

/**
 * Adds small physical identity details to the procedural heroes.
 *
 * This intentionally avoids floating rings, orbiting runes and decorative
 * particles. Those read well as combat VFX, but when permanently attached to
 * the character they make the avatar feel noisy and synthetic. These details
 * stay attached to the costume silhouette and only react subtly to combat.
 */
export function createPremiumHeroDetailRig(heroId: HeroId, resources: SharedResources): HeroDetailRig {
  const root = new THREE.Group();
  root.name = `hero-detail-${heroId}`;

  const color = HERO_DETAIL_COLORS[heroId];
  const metal = resources.standardMaterial(`hero-detail-metal-${heroId}`, color, {
    metalness: 0.58,
    roughness: 0.38,
    emissive: new THREE.Color(color).multiplyScalar(0.08).getHex(),
    emissiveIntensity: 0.18,
  });
  const dark = resources.standardMaterial(`hero-detail-dark-${heroId}`, 0x171a20, {
    metalness: 0.34,
    roughness: 0.62,
  });

  const reactiveParts: THREE.Object3D[] = [];

  if (heroId === 'shadow') {
    for (const x of [-0.32, 0.32]) {
      const clasp = addMesh(root, resources.torus('shadow-shoulder-clasp'), metal);
      clasp.scale.set(0.10, 0.10, 0.045);
      clasp.position.set(x, 0.62, 0.16);
      clasp.rotation.x = Math.PI / 2;
    }

    const brooch = addMesh(root, resources.octa('shadow-brooch'), metal);
    brooch.scale.setScalar(0.08);
    brooch.position.set(0, 0.68, 0.28);
    reactiveParts.push(brooch);

    const belt = addMesh(root, resources.torus('shadow-belt-detail'), dark);
    belt.scale.set(0.32, 0.20, 0.07);
    belt.position.set(0, 0.38, 0.02);
    belt.rotation.x = Math.PI / 2;
  } else if (heroId === 'warrior') {
    const chestCrest = addMesh(root, resources.octa('warrior-chest-crest'), metal);
    chestCrest.scale.set(0.10, 0.12, 0.06);
    chestCrest.position.set(0, 0.64, 0.28);
    reactiveParts.push(chestCrest);

    for (const x of [-0.42, 0.42]) {
      const rim = addMesh(root, resources.torus('warrior-pauldron-rim'), metal);
      rim.scale.set(0.16, 0.10, 0.05);
      rim.position.set(x, 0.72, 0.04);
      rim.rotation.x = Math.PI / 2;
    }

    const belt = addMesh(root, resources.box('warrior-belt-buckle'), metal);
    belt.scale.set(0.12, 0.08, 0.05);
    belt.position.set(0, 0.38, 0.24);
  } else if (heroId === 'monk') {
    for (const x of [-0.38, 0.38]) {
      const wrist = addMesh(root, resources.torus('monk-wrist-band'), metal);
      wrist.scale.set(0.10, 0.10, 0.045);
      wrist.position.set(x, 0.48, 0.10);
      wrist.rotation.x = Math.PI / 2;
    }

    const seal = addMesh(root, resources.octa('monk-waist-seal'), metal);
    seal.scale.setScalar(0.075);
    seal.position.set(0, 0.38, 0.24);
    reactiveParts.push(seal);
  } else {
    const beltBuckle = addMesh(root, resources.box('gunslinger-belt-buckle'), metal);
    beltBuckle.scale.set(0.11, 0.08, 0.045);
    beltBuckle.position.set(0, 0.38, 0.23);
    reactiveParts.push(beltBuckle);

    for (const x of [-0.26, 0.26]) {
      const coatStud = addMesh(root, resources.sphere('gunslinger-coat-stud'), metal);
      coatStud.scale.setScalar(0.045);
      coatStud.position.set(x, 0.60, 0.22);
    }

    const hatBand = addMesh(root, resources.torus('gunslinger-hat-band'), dark);
    hatBand.scale.set(0.36, 0.36, 0.05);
    hatBand.position.set(0, 1.05, 0.01);
    hatBand.rotation.x = Math.PI / 2 - 0.06;
  }

  return {
    root,
    update: (_time, attackPulse, flowRatio, overdrive) => {
      const emphasis = 1 + attackPulse * 0.035 + flowRatio * 0.025 + (overdrive ? 0.04 : 0);
      for (const part of reactiveParts) part.scale.multiplyScalar(emphasis / (part.userData.lastEmphasis ?? 1));
      for (const part of reactiveParts) part.userData.lastEmphasis = emphasis;
      root.position.y = 0;
      root.visible = true;
    },
  };
}
