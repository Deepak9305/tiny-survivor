import * as THREE from 'three';
import { ARENA_DEPTH, ARENA_WIDTH, logicalToWorld } from '../core/coordinates';

export class CameraController {
  readonly camera: THREE.PerspectiveCamera;
  private readonly desiredPosition = new THREE.Vector3();
  private readonly desiredLookAt = new THREE.Vector3();
  private readonly currentLookAt = new THREE.Vector3();
  private shakeTime = 0;
  private shakeDuration = 0.2;
  private shakeStrength = 0;
  private shakeAge = 0;
  private shakeSeed = 0;
  private pullbackTime = 0;
  private pullbackDuration = 0;
  private pullbackAmount = 0;
  private readonly reducedEffects: boolean;
  private readonly screenShakeEnabled: boolean;

  constructor(lowPerformanceMode: boolean, reducedEffects = false, screenShakeEnabled = true) {
    this.reducedEffects = reducedEffects || lowPerformanceMode;
    this.screenShakeEnabled = screenShakeEnabled;
    this.camera = new THREE.PerspectiveCamera(45, 9 / 16, 0.1, 90);
    this.camera.position.set(0, 12.8, 11.8);
    this.currentLookAt.set(0, 0, -1.8);
    this.camera.lookAt(this.currentLookAt);
  }

  resize(width: number, height: number): void {
    this.camera.aspect = Math.max(0.45, width / Math.max(1, height));
    this.camera.updateProjectionMatrix();
  }

  triggerShake(strength = 0.08, duration = 0.16): void {
    if (!this.screenShakeEnabled) return;
    const scale = this.reducedEffects ? 0.45 : 1;
    this.shakeStrength = Math.max(this.shakeStrength, strength * scale);
    this.shakeDuration = Math.max(this.shakeDuration, duration);
    this.shakeTime = Math.max(this.shakeTime, duration);
    this.shakeAge = 0;
    this.shakeSeed += 1.73;
  }

  triggerPullback(amount = 0.9, duration = 0.7): void {
    this.pullbackAmount = Math.max(this.pullbackAmount, this.reducedEffects ? amount * 0.55 : amount);
    this.pullbackDuration = Math.max(this.pullbackDuration, duration);
    this.pullbackTime = Math.max(this.pullbackTime, duration);
  }

  update(delta: number, playerX: number, playerY: number, movement = new THREE.Vector2(), enabled = true): void {
    const player = logicalToWorld(playerX, playerY);
    const lead = movement.clone().clampLength(0, 1).multiplyScalar(28);
    const horizontalMargin = Math.min(ARENA_WIDTH * 0.32, 4.2);
    const depthMargin = Math.min(ARENA_DEPTH * 0.28, 6.0);
    const lookX = THREE.MathUtils.clamp(player.x + lead.x * 0.02, -ARENA_WIDTH / 2 + horizontalMargin, ARENA_WIDTH / 2 - horizontalMargin);
    // Keep hero framed at approximately 58-62% down the viewport
    const lookZ = THREE.MathUtils.clamp(player.z - 2.2 + lead.y * 0.015, -ARENA_DEPTH / 2 + depthMargin, ARENA_DEPTH / 2 - depthMargin);
    this.desiredLookAt.set(lookX, 0, lookZ);
    const pullbackProgress = this.pullbackDuration > 0 ? this.pullbackTime / this.pullbackDuration : 0;
    const pullback = this.pullbackAmount * Math.sin(Math.min(1, pullbackProgress) * Math.PI);
    this.desiredPosition.set(lookX + 0.8, 12.8 + pullback * 0.7, lookZ + 11.8 + pullback * 0.9);

    const follow = 1 - Math.pow(0.0005, Math.max(delta, 0.001));
    this.camera.position.lerp(this.desiredPosition, Math.min(1, follow * (enabled ? 1 : 0.32)));
    this.currentLookAt.lerp(this.desiredLookAt, Math.min(1, follow));

    if (this.shakeTime > 0) {
      this.shakeTime = Math.max(0, this.shakeTime - delta);
      this.shakeAge += delta;
      const falloff = Math.min(1, this.shakeTime / Math.max(0.001, this.shakeDuration));
      const phase = this.shakeAge * 48 + this.shakeSeed;
      this.camera.position.x += Math.sin(phase) * this.shakeStrength * falloff;
      this.camera.position.y += Math.cos(phase * 1.17) * this.shakeStrength * 0.72 * falloff;
    }
    if (this.pullbackTime > 0) {
      this.pullbackTime = Math.max(0, this.pullbackTime - delta);
      if (this.pullbackTime === 0) this.pullbackAmount = 0;
    }
    this.camera.lookAt(this.currentLookAt);
  }
}
