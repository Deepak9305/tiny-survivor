import * as THREE from 'three';
import { ARENA_DEPTH, ARENA_WIDTH, logicalToWorld } from '../core/coordinates';

export class CameraController {
  readonly camera: THREE.PerspectiveCamera;
  private readonly desiredPosition = new THREE.Vector3();
  private readonly desiredLookAt = new THREE.Vector3();
  private readonly currentLookAt = new THREE.Vector3();
  private shakeTime = 0;
  private shakeStrength = 0;
  private readonly lowPerformanceMode: boolean;

  constructor(lowPerformanceMode: boolean) {
    this.lowPerformanceMode = lowPerformanceMode;
    this.camera = new THREE.PerspectiveCamera(48, 9 / 16, 0.1, 90);
    this.camera.position.set(0, 15, 14);
    this.currentLookAt.set(0, 0, -2);
    this.camera.lookAt(this.currentLookAt);
  }

  resize(width: number, height: number): void {
    this.camera.aspect = Math.max(0.45, width / Math.max(1, height));
    this.camera.updateProjectionMatrix();
  }

  triggerShake(strength = 0.08, duration = 0.16): void {
    if (this.lowPerformanceMode) return;
    this.shakeStrength = Math.max(this.shakeStrength, strength);
    this.shakeTime = Math.max(this.shakeTime, duration);
  }

  update(delta: number, playerX: number, playerY: number, enabled: boolean): void {
    const player = logicalToWorld(playerX, playerY);
    const horizontalMargin = Math.min(ARENA_WIDTH * 0.32, 4.4);
    const depthMargin = Math.min(ARENA_DEPTH * 0.28, 6.3);
    const lookX = THREE.MathUtils.clamp(player.x, -ARENA_WIDTH / 2 + horizontalMargin, ARENA_WIDTH / 2 - horizontalMargin);
    const lookZ = THREE.MathUtils.clamp(player.z - 3.25, -ARENA_DEPTH / 2 + depthMargin, ARENA_DEPTH / 2 - depthMargin);
    this.desiredLookAt.set(lookX, 0, lookZ);
    this.desiredPosition.set(lookX + 1.2, 15.5, lookZ + 14.5);

    const follow = 1 - Math.pow(0.0005, Math.max(delta, 0.001));
    this.camera.position.lerp(this.desiredPosition, Math.min(1, follow * (enabled ? 1 : 0.32)));
    this.currentLookAt.lerp(this.desiredLookAt, Math.min(1, follow));

    if (this.shakeTime > 0) {
      this.shakeTime = Math.max(0, this.shakeTime - delta);
      const falloff = this.shakeTime / 0.2;
      this.camera.position.x += (Math.random() - 0.5) * this.shakeStrength * falloff;
      this.camera.position.y += (Math.random() - 0.5) * this.shakeStrength * falloff;
    }
    this.camera.lookAt(this.currentLookAt);
  }
}
