import * as THREE from 'three';
import type { StageDefinition } from '../../types';

export function createLighting(scene: THREE.Scene, _stage: StageDefinition, lowPerformanceMode: boolean): void {
  // Bright warm cartoon sunlight (Survivor.io daytime aesthetic)
  const hemisphere = new THREE.HemisphereLight(0xfff6e8, 0x90c5ec, lowPerformanceMode ? 1.35 : 1.7);
  hemisphere.name = 'cartoon-sunlight-hemisphere';
  scene.add(hemisphere);

  const ambient = new THREE.AmbientLight(0xffeedd, lowPerformanceMode ? 0.45 : 0.62);
  ambient.name = 'soft-cartoon-ambient';
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0xfff5dc, lowPerformanceMode ? 1.85 : 2.4);
  key.name = 'cartoon-sunlight-key';
  key.position.set(-8, 22, 10);
  scene.add(key);

  if (!lowPerformanceMode) {
    const heroLight = new THREE.PointLight(0x4bdcff, 0.8, 7.5, 2);
    heroLight.name = 'hero-cyan-rim';
    heroLight.position.set(0, 2.2, 0);
    scene.add(heroLight);
  }
}

