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
  const count = lowPerformanceMode ? 18 : 64;
  const positions = new Float32Array(count * 3);

  for (let index = 0; index < count; index += 1) {
    const offset = index * 3;
    positions[offset] = (rng() - 0.5) * 43;
    positions[offset + 1] = 0.55 + rng() * (stage.worldId === 4 ? 7.2 : 5.6);
    positions[offset + 2] = (rng() - 0.5) * 29;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: ATMOSPHERE_COLORS[stage.worldId] ?? 0xbbeeff,
    size: stage.worldId === 4 ? 0.075 : 0.058,
    sizeAttenuation: true,
    transparent: true,
    opacity: lowPerformanceMode ? 0.26 : (stage.worldId === 4 ? 0.46 : 0.34),
    depthWrite: false,
    blending: stage.worldId === 4 ? THREE.AdditiveBlending : THREE.NormalBlending,
  });

  const points = new THREE.Points(geometry, material);
  points.name = 'premium-biome-atmosphere';
  points.frustumCulled = false;

  const baseY = stage.worldId === 4 ? 0.15 : 0;
  points.onBeforeRender = () => {
    const time = performance.now() * 0.001;
    points.rotation.y = Math.sin(time * 0.08) * 0.05;
    points.position.x = Math.sin(time * 0.11 + stage.worldId) * 0.22;
    points.position.y = baseY + Math.sin(time * (stage.worldId === 4 ? 0.7 : 0.28)) * 0.08;
    material.opacity = (lowPerformanceMode ? 0.24 : (stage.worldId === 4 ? 0.44 : 0.33)) + Math.sin(time * 0.9) * 0.025;
  };

  scene.add(points);
}

export function createLighting(scene: THREE.Scene, stage: StageDefinition, lowPerformanceMode: boolean): void {
  const theme = biomeThemeFor(stage);

  // A filmic three-point rig: stronger shape definition and less flat ambient fill.
  const key = new THREE.DirectionalLight(theme.keyLight, lowPerformanceMode ? 2.35 : 3.05);
  key.name = 'biome-key-light';
  key.position.set(-13, 27, -17);
  key.target.position.set(0, 0, 0);
  scene.add(key, key.target);

  const hemisphere = new THREE.HemisphereLight(
    theme.moon,
    theme.fillLight,
    lowPerformanceMode ? 0.76 : 0.92
  );
  hemisphere.name = 'biome-hemisphere';
  scene.add(hemisphere);

  const ambient = new THREE.AmbientLight(theme.fillLight, lowPerformanceMode ? 0.23 : 0.28);
  ambient.name = 'controlled-world-fill';
  scene.add(ambient);

  // Stronger opposing rim keeps hero/enemy silhouettes readable against every biome.
  const rim = new THREE.DirectionalLight(theme.accent, lowPerformanceMode ? 0.72 : 1.12);
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
