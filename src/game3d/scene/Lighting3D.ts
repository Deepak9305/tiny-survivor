import * as THREE from 'three';
import type { StageDefinition } from '../../types';
import { biomeThemeFor } from './BiomeTheme';

const ATMOSPHERE_COLORS: Record<number, number> = {
  1: 0x8fdcff,
  2: 0x69f0c7,
  3: 0xd7f6ff,
  4: 0xff7b4a,
};

function seeded(seed: number): () => number {
  let state = Math.max(1, seed % 2147483647);
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function createAtmosphereParticles(
  scene: THREE.Scene,
  stage: StageDefinition,
  lowPerformanceMode: boolean
): void {
  const rng = seeded(stage.mapSeed + stage.worldId * 911);
  const count = lowPerformanceMode ? 24 : 110;
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);

  for (let index = 0; index < count; index += 1) {
    const offset = index * 3;
    positions[offset] = (rng() - 0.5) * 44;
    positions[offset + 1] = 0.2 + rng() * (stage.worldId === 4 ? 6.5 : 5.2);
    positions[offset + 2] = (rng() - 0.5) * 32;

    if (stage.worldId === 4) {
      // Lava castle embers rising fast
      velocities[offset] = (rng() - 0.5) * 0.4;
      velocities[offset + 1] = 0.6 + rng() * 0.8;
      velocities[offset + 2] = (rng() - 0.5) * 0.4;
    } else if (stage.worldId === 3) {
      // Frozen ruins: snow flurries drifting sideways
      velocities[offset] = -0.4 - rng() * 0.6;
      velocities[offset + 1] = -0.3 - rng() * 0.4;
      velocities[offset + 2] = (rng() - 0.5) * 0.3;
    } else {
      // Forest spores / graveyard wisps floating upward
      velocities[offset] = (rng() - 0.5) * 0.25;
      velocities[offset + 1] = 0.15 + rng() * 0.35;
      velocities[offset + 2] = (rng() - 0.5) * 0.25;
    }
  }

  const geometry = new THREE.BufferGeometry();
  const positionAttr = new THREE.BufferAttribute(positions, 3);
  geometry.setAttribute('position', positionAttr);

  const material = new THREE.PointsMaterial({
    color: ATMOSPHERE_COLORS[stage.worldId] ?? 0xbbeeff,
    size: stage.worldId === 4 ? 0.085 : stage.worldId === 3 ? 0.07 : 0.062,
    sizeAttenuation: true,
    transparent: true,
    opacity: lowPerformanceMode ? 0.28 : (stage.worldId === 4 ? 0.52 : 0.38),
    depthWrite: false,
    blending: stage.worldId === 4 ? THREE.AdditiveBlending : THREE.NormalBlending,
  });

  const points = new THREE.Points(geometry, material);
  points.name = 'premium-biome-atmosphere';
  points.frustumCulled = false;

  let lastTime = performance.now();
  points.onBeforeRender = () => {
    const now = performance.now();
    const dt = Math.min(0.05, (now - lastTime) * 0.001);
    lastTime = now;
    const time = now * 0.001;

    const pos = positionAttr.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      pos[idx] += (velocities[idx] + Math.sin(time * 1.5 + i) * 0.15) * dt;
      pos[idx + 1] += velocities[idx + 1] * dt;
      pos[idx + 2] += (velocities[idx + 2] + Math.cos(time * 1.2 + i) * 0.15) * dt;

      if (pos[idx + 1] > 6.8) pos[idx + 1] = 0.15;
      if (pos[idx + 1] < 0.1) pos[idx + 1] = 6.6;
      if (pos[idx] > 24) pos[idx] = -24;
      if (pos[idx] < -24) pos[idx] = 24;
      if (pos[idx + 2] > 18) pos[idx + 2] = -18;
      if (pos[idx + 2] < -18) pos[idx + 2] = 18;
    }
    positionAttr.needsUpdate = true;

    material.opacity =
      (lowPerformanceMode ? 0.26 : stage.worldId === 4 ? 0.5 : 0.36) +
      Math.sin(time * 1.4) * 0.04;
  };

  scene.add(points);
}

export function createLighting(scene: THREE.Scene, stage: StageDefinition, lowPerformanceMode: boolean): void {
  const theme = biomeThemeFor(stage);

  // Vibrant, sunny Brawl Stars cartoon lighting with rich contrast and colorful ambient
  const key = new THREE.DirectionalLight(theme.keyLight, lowPerformanceMode ? 2.85 : 3.65);
  key.name = 'biome-key-light';
  key.position.set(-13, 27, -17);
  key.target.position.set(0, 0, 0);
  if (!lowPerformanceMode) {
    key.castShadow = true;
    key.shadow.mapSize.width = 1024;
    key.shadow.mapSize.height = 1024;
    key.shadow.camera.near = 10;
    key.shadow.camera.far = 65;
    key.shadow.camera.left = -28;
    key.shadow.camera.right = 28;
    key.shadow.camera.top = 28;
    key.shadow.camera.bottom = -28;
    key.shadow.bias = -0.0008;
    key.shadow.normalBias = 0.02;
  }
  scene.add(key, key.target);

  const hemisphere = new THREE.HemisphereLight(
    theme.moon,
    theme.fillLight,
    lowPerformanceMode ? 1.05 : 1.35
  );
  hemisphere.name = 'biome-hemisphere';
  scene.add(hemisphere);

  const ambient = new THREE.AmbientLight(theme.fillLight, lowPerformanceMode ? 0.38 : 0.48);
  ambient.name = 'controlled-world-fill';
  scene.add(ambient);

  // Strong, saturated cartoon rim keeps characters popping against the arena ground
  const rim = new THREE.DirectionalLight(theme.accent, lowPerformanceMode ? 0.95 : 1.45);
  rim.name = 'character-rim-light';
  rim.position.set(12, 15, 13);
  rim.target.position.set(0, 0.8, 0);
  scene.add(rim, rim.target);

  // Broad overhead spotlight gives actors a subtle stage-like highlight without
  // the cost of per-enemy dynamic lights.
  const actorSpot = new THREE.SpotLight(
    theme.moon,
    lowPerformanceMode ? 0.42 : 0.62,
    48,
    Math.PI / 3.1,
    0.82,
    1.25
  );
  actorSpot.name = 'actor-readability-spot';
  actorSpot.position.set(0, 17, 8);
  actorSpot.target.position.set(0, 0, -1.5);
  scene.add(actorSpot, actorSpot.target);

  // Two practical bounces are enough for depth; the arena's dynamic lantern pool
  // handles local lights near actual props.
  const practicals = stage.worldId === 4
    ? [
        { x: -14, z: -8, color: theme.warm, intensity: 1.55 },
        { x: 13, z: 9, color: 0xff3c22, intensity: 1.45 },
      ]
    : [
        { x: -14, z: -9, color: theme.warm, intensity: 1.15 },
        { x: 14, z: 9, color: theme.accent, intensity: 0.88 },
      ];

  for (let index = 0; index < practicals.length; index += 1) {
    const practical = practicals[index];
    const light = new THREE.PointLight(
      practical.color,
      lowPerformanceMode ? practical.intensity * 0.58 : practical.intensity,
      15,
      1.9
    );
    light.name = `cinematic-practical-${index}`;
    light.position.set(practical.x, 2.8, practical.z);
    scene.add(light);
  }

  createAtmosphereParticles(scene, stage, lowPerformanceMode);
}
