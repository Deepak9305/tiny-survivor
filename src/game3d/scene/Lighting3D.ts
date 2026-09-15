import * as THREE from 'three';
import type { StageDefinition } from '../../types';
import { biomeThemeFor } from './BiomeTheme';

export function createLighting(scene: THREE.Scene, stage: StageDefinition, lowPerformanceMode: boolean): void {
  const theme = biomeThemeFor(stage);

  // 1. Biome Celestial Key Light (Directional Moonlight / Sun / Magma Glare from North-West)
  // Raking cool blue-white key creates readable form definition on props, hero, and terrain
  const key = new THREE.DirectionalLight(theme.keyLight, lowPerformanceMode ? 2.0 : 2.45);
  key.name = 'biome-key-light';
  key.position.set(-12, 26, -16);
  key.target.position.set(0, 0, 0);
  scene.add(key);
  scene.add(key.target);

  // 2. Rich Environmental Hemisphere (Sky tone down to ground shadow tone)
  const hemisphere = new THREE.HemisphereLight(theme.moon, theme.fillLight, lowPerformanceMode ? 0.70 : 0.88);
  hemisphere.name = 'biome-hemisphere';
  scene.add(hemisphere);

  // 3. Controlled Ambient Fill (Deep moody fill, prevents pitch-black voids without washing out blacks)
  const ambient = new THREE.AmbientLight(theme.fillLight, lowPerformanceMode ? 0.26 : 0.34);
  ambient.name = 'soft-world-fill';
  scene.add(ambient);

  // 4. Character Silhouette Rim Light (From South-East to catch hero & enemy silhouettes)
  const rimIntensity = lowPerformanceMode ? 0.40 : 0.65;
  const rimLight = new THREE.DirectionalLight(theme.accent, rimIntensity);
  rimLight.name = 'character-rim-bounce';
  rimLight.position.set(10, 14, 12);
  scene.add(rimLight);
}

