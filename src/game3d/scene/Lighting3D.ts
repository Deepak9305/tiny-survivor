import * as THREE from 'three';
import type { StageDefinition } from '../../types';
import { biomeThemeFor } from './BiomeTheme';

export function createLighting(scene: THREE.Scene, stage: StageDefinition, lowPerformanceMode: boolean): void {
  const theme = biomeThemeFor(stage);

  // 1. Biome Celestial Key Light (Moon / Sun / Magma Glare)
  // Casts from north-west towards south-east matching the celestial moon on the horizon
  const key = new THREE.DirectionalLight(theme.keyLight, lowPerformanceMode ? 2.1 : 2.85);
  key.name = 'biome-key-light';
  key.position.set(-8, 22, -16);
  key.target.position.set(0, 0, 0);
  scene.add(key);
  scene.add(key.target);

  // 2. Rich Environmental Hemisphere (Sky tone down to Ground tone)
  const hemisphere = new THREE.HemisphereLight(theme.keyLight, theme.fillLight, lowPerformanceMode ? 1.25 : 1.55);
  hemisphere.name = 'biome-hemisphere';
  scene.add(hemisphere);

  // 3. Soft Ambient Fill (Prevents murky pitch-black shadows)
  const ambient = new THREE.AmbientLight(theme.fillLight, lowPerformanceMode ? 0.52 : 0.72);
  ambient.name = 'soft-world-fill';
  scene.add(ambient);

  // 4. Hero Arcane Focal Light & Rim Accent
  if (!lowPerformanceMode) {
    const heroLight = new THREE.PointLight(theme.accent, 1.25, 6.8, 1.6);
    heroLight.name = 'hero-focal-light';
    heroLight.position.set(0, 1.8, 0.3);
    scene.add(heroLight);

    // Subtle edge rim light for character silhouettes
    const rimLight = new THREE.DirectionalLight(theme.accent, 0.4);
    rimLight.name = 'character-rim-bounce';
    rimLight.position.set(7, 10, -8);
    scene.add(rimLight);
  }
}
