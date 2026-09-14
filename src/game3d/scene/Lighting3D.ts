import * as THREE from 'three';
import type { StageDefinition } from '../../types';
import { biomeThemeFor } from './BiomeTheme';

export function createLighting(scene: THREE.Scene, stage: StageDefinition, lowPerformanceMode: boolean): void {
  const theme = biomeThemeFor(stage);
  const hemisphere = new THREE.HemisphereLight(theme.keyLight, theme.fillLight, lowPerformanceMode ? 1.05 : 1.28);
  hemisphere.name = 'moonlight-hemisphere';
  scene.add(hemisphere);

  const key = new THREE.DirectionalLight(theme.keyLight, lowPerformanceMode ? 1.25 : 1.65);
  key.name = 'moonlight-key';
  key.position.set(-8, 18, 10);
  scene.add(key);

  if (!lowPerformanceMode) {
    const heroLight = new THREE.PointLight(theme.accent, 0.62, 5.5, 2);
    heroLight.name = 'hero-cyan-rim';
    heroLight.position.set(0, 2.2, 0);
    scene.add(heroLight);
  }
}
