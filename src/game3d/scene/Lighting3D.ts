import * as THREE from 'three';

export function createLighting(scene: THREE.Scene, lowPerformanceMode: boolean): void {
  const hemisphere = new THREE.HemisphereLight(0x8ed9ff, 0x071321, 1.55);
  scene.add(hemisphere);

  const key = new THREE.DirectionalLight(0xc8e7ff, 1.7);
  key.position.set(-8, 18, 10);
  scene.add(key);

  if (!lowPerformanceMode) {
    const heroLight = new THREE.PointLight(0x4bdcff, 0.8, 5.5, 2);
    heroLight.position.set(0, 2.2, 0);
    scene.add(heroLight);
  }
}
