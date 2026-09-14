import * as THREE from 'three';
import type { StageDefinition } from '../../types';
import { biomeThemeFor } from './BiomeTheme';

export function createLighting(scene: THREE.Scene, stage: StageDefinition, lowPerformanceMode: boolean): void {
  const theme = biomeThemeFor(stage);

  // 1. Biome Celestial Key Light (Moon / Sun / Magma Glare)
  const key = new THREE.DirectionalLight(theme.keyLight, lowPerformanceMode ? 1.85 : 2.4);
  key.name = 'biome-key-light';
  key.position.set(-7, 16, 8.5);
  scene.add(key);

  // 2. Rich Environmental Hemisphere (Sky tone down to Ground tone)
  const hemisphere = new THREE.HemisphereLight(theme.keyLight, theme.fillLight, lowPerformanceMode ? 1.2 : 1.5);
  hemisphere.name = 'biome-hemisphere';
  scene.add(hemisphere);

  // 3. Soft Ambient Fill (Prevents murky pitch-black shadows)
  const ambient = new THREE.AmbientLight(theme.fillLight, lowPerformanceMode ? 0.45 : 0.65);
  ambient.name = 'soft-world-fill';
  scene.add(ambient);

  // 4. Hero Arcane Focal Light & Rim Accent
  if (!lowPerformanceMode) {
    const heroLight = new THREE.PointLight(theme.accent, 1.1, 7.2, 1.6);
    heroLight.name = 'hero-focal-light';
    heroLight.position.set(0, 2.0, 0.4);
    scene.add(heroLight);

    // Subtle edge rim light for character silhouettes
    const rimLight = new THREE.DirectionalLight(theme.accent, 0.45);
    rimLight.name = 'character-rim-bounce';
    rimLight.position.set(8, 8, -6);
    scene.add(rimLight);
  }
}
