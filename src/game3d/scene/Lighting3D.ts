import * as THREE from 'three';
import type { StageDefinition } from '../../types';
import { biomeThemeFor } from './BiomeTheme';

export function createLighting(scene: THREE.Scene, stage: StageDefinition, lowPerformanceMode: boolean): void {
  const theme = biomeThemeFor(stage);

  // 1. Biome Celestial Key Light (Directional Moonlight / Sun / Magma Glare from North-West)
  // Rebalanced to create deep form & cast readable shadows rather than washing the arena
  const key = new THREE.DirectionalLight(theme.keyLight, lowPerformanceMode ? 1.8 : 2.2);
  key.name = 'biome-key-light';
  key.position.set(-9, 24, -18);
  key.target.position.set(0, 0, 0);
  scene.add(key);
  scene.add(key.target);

  // 2. Rich Environmental Hemisphere (Sky tone down to ground shadow tone)
  const hemisphere = new THREE.HemisphereLight(theme.keyLight, theme.fillLight, lowPerformanceMode ? 0.75 : 0.95);
  hemisphere.name = 'biome-hemisphere';
  scene.add(hemisphere);

  // 3. Controlled Ambient Fill (Keeps shadows dark and moody, preventing milky wash)
  const ambient = new THREE.AmbientLight(theme.fillLight, lowPerformanceMode ? 0.28 : 0.38);
  ambient.name = 'soft-world-fill';
  scene.add(ambient);

  // 4. Subtle Character Silhouette Rim Light (From East-South to catch hero & enemy silhouettes)
  if (!lowPerformanceMode) {
    const rimLight = new THREE.DirectionalLight(theme.accent, 0.35);
    rimLight.name = 'character-rim-bounce';
    rimLight.position.set(8, 12, 10);
    scene.add(rimLight);
  }
}
