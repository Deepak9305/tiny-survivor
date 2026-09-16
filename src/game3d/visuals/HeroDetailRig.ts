import * as THREE from 'three';
import type { HeroId } from '../../types';
import { SharedResources, addMesh } from '../core/SharedResources';

export interface HeroDetailRig {
  root: THREE.Group;
  update: (time: number, attackPulse: number, flowRatio: number, overdrive: boolean) => void;
}

type AnimatedPart = {
  object: THREE.Object3D;
  baseScale: number;
  speed: number;
  phase: number;
};

const HERO_DETAIL_COLORS: Record<HeroId, number> = {
  shadow: 0x59e7ff,
  warrior: 0xffc75d,
  monk: 0x43e0aa,
  gunslinger: 0xed86ff,
};

export function createPremiumHeroDetailRig(heroId: HeroId, resources: SharedResources): HeroDetailRig {
  const root = new THREE.Group();
  root.name = `premium-hero-detail-${heroId}`;
  const color = HERO_DETAIL_COLORS[heroId];
  const animated: AnimatedPart[] = [];

  const glowMaterial = resources.basicMaterial(`premium-detail-glow-${heroId}`, color, {
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const whiteMaterial = resources.basicMaterial(`premium-detail-white-${heroId}`, 0xffffff, {
    transparent: true,
    opacity: 0.50,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const addAnimated = (
    object: THREE.Object3D,
    baseScale: number,
    speed: number,
    phase: number
  ) => {
    object.scale.setScalar(baseScale);
    animated.push({ object, baseScale, speed, phase });
    root.add(object);
  };

  if (heroId === 'shadow') {
    const halo = new THREE.Mesh(resources.torus('premium-shadow-halo'), glowMaterial);
    halo.position.set(0, 1.47, -0.04);
    halo.rotation.x = Math.PI / 2;
    addAnimated(halo, 0.48, 1.25, 0);

    for (const [index, x] of [-0.70, 0.70].entries()) {
      const rune = new THREE.Mesh(resources.octa(`premium-shadow-rune-${index}`), glowMaterial);
      rune.position.set(x, 1.18, 0.02);
      addAnimated(rune, 0.10, index === 0 ? 2.6 : -2.6, index * Math.PI);
    }

    const crown = new THREE.Mesh(resources.ring('premium-shadow-crown', 0.26, 0.31), whiteMaterial);
    crown.position.set(0, 1.63, -0.02);
    crown.rotation.x = -Math.PI / 2;
    addAnimated(crown, 0.88, -0.9, 1.2);
  } else if (heroId === 'warrior') {
    for (const [index, x] of [-0.70, 0.70].entries()) {
      const spike = new THREE.Mesh(resources.cone(`premium-warrior-spike-${index}`), glowMaterial);
      spike.position.set(x, 1.34, -0.02);
      spike.rotation.z = x < 0 ? 0.58 : -0.58;
      spike.scale.set(0.11, 0.34, 0.11);
      root.add(spike);
    }

    const crest = new THREE.Mesh(resources.torus('premium-warrior-crest'), glowMaterial);
    crest.position.set(0, 1.24, -0.31);
    crest.rotation.x = Math.PI / 2;
    crest.scale.set(0.46, 0.46, 0.46);
    root.add(crest);
    animated.push({ object: crest, baseScale: 0.46, speed: 0.72, phase: 0.4 });

    const core = new THREE.Mesh(resources.octa('premium-warrior-core'), whiteMaterial);
    core.position.set(0, 0.92, 0.34);
    addAnimated(core, 0.085, 1.8, 1.6);
  } else if (heroId === 'monk') {
    for (let index = 0; index < 5; index += 1) {
      const angle = (index / 5) * Math.PI * 1.15 + 0.95;
      const bead = new THREE.Mesh(resources.sphere(`premium-monk-bead-${index}`), glowMaterial);
      bead.position.set(Math.cos(angle) * 0.38, 1.12 + Math.sin(angle) * 0.18, 0.31);
      bead.scale.setScalar(0.065);
      root.add(bead);
    }

    for (const [index, x] of [-0.54, 0.54].entries()) {
      const chiRing = new THREE.Mesh(resources.torus(`premium-monk-wrist-${index}`), glowMaterial);
      chiRing.position.set(x, 0.78, 0.12);
      chiRing.rotation.x = Math.PI / 2;
      addAnimated(chiRing, 0.22, index === 0 ? 2.1 : -2.1, index * 1.7);
    }

    const seal = new THREE.Mesh(resources.ring('premium-monk-seal', 0.24, 0.30), whiteMaterial);
    seal.position.set(0, 0.82, 0.34);
    addAnimated(seal, 0.82, 0.68, 0.8);
  } else {
    for (const [index, x] of [-0.58, 0.58].entries()) {
      const muzzle = new THREE.Mesh(resources.torus(`premium-gunslinger-muzzle-${index}`), glowMaterial);
      muzzle.position.set(x, 0.84, 0.55);
      muzzle.rotation.x = Math.PI / 2;
      addAnimated(muzzle, 0.15, index === 0 ? 3.0 : -3.0, index * 1.4);
    }

    const beltCore = new THREE.Mesh(resources.octa('premium-gunslinger-belt-core'), glowMaterial);
    beltCore.position.set(0, 0.68, 0.31);
    addAnimated(beltCore, 0.09, 2.4, 0.5);

    const backArc = new THREE.Mesh(resources.torus('premium-gunslinger-back-arc'), whiteMaterial);
    backArc.position.set(0, 1.18, -0.30);
    backArc.rotation.x = Math.PI / 2;
    addAnimated(backArc, 0.42, -0.62, 2.2);
  }

  return {
    root,
    update: (time, attackPulse, flowRatio, overdrive) => {
      const intensity = 1 + flowRatio * 0.16 + (overdrive ? 0.18 : 0) + attackPulse * 0.08;
      for (let index = 0; index < animated.length; index += 1) {
        const part = animated[index];
        part.object.rotation.y += 0.016 * part.speed * (overdrive ? 1.7 : 1);
        part.object.rotation.z += 0.007 * part.speed;
        const pulse = 1 + Math.sin(time * (2.4 + Math.abs(part.speed) * 0.25) + part.phase) * 0.045;
        part.object.scale.setScalar(part.baseScale * pulse * intensity);
      }
      root.position.y = Math.sin(time * 2.2) * 0.01;
      root.visible = true;
    },
  };
}
