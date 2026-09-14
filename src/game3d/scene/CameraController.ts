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
  private isOverviewDebug = false;

  // Camera Occlusion System
  private readonly raycaster = new THREE.Raycaster();
  private readonly fadedObjects = new Map<THREE.Material, { currentOpacity: number; targetOpacity: number }>();

  // Diagnostic Viewport Footprint (Dev-Only Overview Tool)
  private debugGroup?: THREE.Group;
  private footprintLine?: THREE.LineLoop;

  constructor(lowPerformanceMode: boolean, reducedEffects = false, screenShakeEnabled = true) {
    this.reducedEffects = reducedEffects || lowPerformanceMode;
    this.screenShakeEnabled = screenShakeEnabled;
    this.camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.1, 110);
    this.camera.position.set(0, 13.0, 11.0);
    this.currentLookAt.set(0, 0, -0.6);
    this.camera.lookAt(this.currentLookAt);

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('debugCam') === 'map') {
        this.isOverviewDebug = true;
      }
      (window as unknown as { __toggleDebugMapCam?: () => void }).__toggleDebugMapCam = () => {
        this.isOverviewDebug = !this.isOverviewDebug;
      };
      window.addEventListener('keydown', (e) => {
        if (e.code === 'KeyM') {
          this.isOverviewDebug = !this.isOverviewDebug;
        }
      });
    }
  }

  toggleOverviewDebug(): void {
    this.isOverviewDebug = !this.isOverviewDebug;
  }

  setOverviewDebug(enabled: boolean): void {
    this.isOverviewDebug = enabled;
  }

  getIsOverviewDebug(): boolean {
    return this.isOverviewDebug;
  }

  resize(width: number, height: number): void {
    this.camera.aspect = Math.max(1.0, width / Math.max(1, height));
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

  update(
    delta: number,
    playerX: number,
    playerY: number,
    movement = new THREE.Vector2(),
    aim = new THREE.Vector2(),
    isAiming = false,
    enabled = true,
    scene?: THREE.Scene,
    occluders: THREE.Object3D[] = []
  ): void {
    const player = logicalToWorld(playerX, playerY);

    if (this.isOverviewDebug) {
      // Full Map Overview Debug View: high overhead perspective showing entire arena
      this.desiredPosition.set(0, 42, 0.05);
      this.desiredLookAt.set(0, 0, 0);
      this.camera.position.lerp(this.desiredPosition, 0.18);
      this.currentLookAt.lerp(this.desiredLookAt, 0.18);
      this.camera.lookAt(this.currentLookAt);

      if (scene) {
        this.updateDebugFootprint(scene, player);
      }
      return;
    }

    if (this.debugGroup) {
      this.debugGroup.visible = false;
    }

    // Camera lead: movement contributes subtle lead, aim contributes slightly stronger forward view
    const moveLead = movement.clone().clampLength(0, 1).multiplyScalar(18);
    const aimLead = (isAiming ? aim.clone().clampLength(0, 1) : new THREE.Vector2()).multiplyScalar(32);
    const leadX = moveLead.x * 0.010 + aimLead.x * 0.022;
    const leadZ = moveLead.y * 0.008 + aimLead.y * 0.018;

    // Margins ensure camera doesn't pan past the outer boundary walls in landscape
    const horizontalMargin = Math.min(ARENA_WIDTH * 0.28, 6.8);
    const depthMargin = Math.min(ARENA_DEPTH * 0.26, 5.2);
    const lookX = THREE.MathUtils.clamp(player.x + leadX, -ARENA_WIDTH / 2 + horizontalMargin, ARENA_WIDTH / 2 - horizontalMargin);
    // Centralized framing with subtle look-ahead bias
    const lookZ = THREE.MathUtils.clamp(player.z - 0.6 + leadZ, -ARENA_DEPTH / 2 + depthMargin, ARENA_DEPTH / 2 - depthMargin);
    this.desiredLookAt.set(lookX, 0, lookZ);
    const pullbackProgress = this.pullbackDuration > 0 ? this.pullbackTime / this.pullbackDuration : 0;
    const pullback = this.pullbackAmount * Math.sin(Math.min(1, pullbackProgress) * Math.PI);
    this.desiredPosition.set(lookX, 13.0 + pullback * 0.7, lookZ + 11.0 + pullback * 0.85);

    const follow = 1 - Math.pow(0.0004, Math.max(delta, 0.001));
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

    // Perform camera occlusion check
    if (occluders.length > 0) {
      this.updateOcclusion(new THREE.Vector3(player.x, 0.8, player.z), occluders, delta);
    }
  }

  /**
   * Lightweight Camera Occlusion System:
   * Smoothly fades tall scenery between camera and player (~140ms in/out).
   */
  private updateOcclusion(playerPos: THREE.Vector3, occluders: THREE.Object3D[], delta: number): void {
    const rayDir = playerPos.clone().sub(this.camera.position);
    const distance = rayDir.length();
    rayDir.normalize();

    this.raycaster.set(this.camera.position, rayDir);
    this.raycaster.far = distance;

    const hits = this.raycaster.intersectObjects(occluders, true);
    const hitMaterials = new Set<THREE.Material>();

    for (const hit of hits) {
      if (hit.object instanceof THREE.Mesh && hit.object.material) {
        const mats = Array.isArray(hit.object.material) ? hit.object.material : [hit.object.material];
        for (const mat of mats) {
          hitMaterials.add(mat);
          mat.transparent = true;
          let entry = this.fadedObjects.get(mat);
          if (!entry) {
            entry = { currentOpacity: mat.opacity, targetOpacity: 0.25 };
            this.fadedObjects.set(mat, entry);
          } else {
            entry.targetOpacity = 0.25;
          }
        }
      }
    }

    // Smoothly interpolate material opacity
    const fadeSpeed = delta / 0.14; // ~140ms fade
    for (const [mat, entry] of this.fadedObjects.entries()) {
      if (!hitMaterials.has(mat)) {
        entry.targetOpacity = 1.0;
      }
      entry.currentOpacity = THREE.MathUtils.lerp(entry.currentOpacity, entry.targetOpacity, Math.min(1, fadeSpeed));
      mat.opacity = entry.currentOpacity;

      if (entry.targetOpacity === 1.0 && entry.currentOpacity >= 0.98) {
        mat.opacity = 1.0;
        this.fadedObjects.delete(mat);
      }
    }
  }

  /**
   * Diagnostic Full-Map Viewport Tool:
   * Calculates the exact phone camera ground frustum polygon and draws a 3x3 screen grid.
   */
  private updateDebugFootprint(scene: THREE.Scene, player: THREE.Vector3): void {
    if (!this.debugGroup) {
      this.debugGroup = new THREE.Group();
      this.debugGroup.name = 'dev-viewport-footprint-debug';

      // 1. Frustum footprint polygon
      const points = [
        new THREE.Vector3(0, 0.1, 0),
        new THREE.Vector3(0, 0.1, 0),
        new THREE.Vector3(0, 0.1, 0),
        new THREE.Vector3(0, 0.1, 0),
      ];
      const geom = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 3 });
      this.footprintLine = new THREE.LineLoop(geom, mat);
      this.debugGroup.add(this.footprintLine);

      // 2. Arena Outer Boundary Box
      const halfW = ARENA_WIDTH / 2;
      const halfD = ARENA_DEPTH / 2;
      const boundaryPoints = [
        new THREE.Vector3(-halfW, 0.05, -halfD),
        new THREE.Vector3(halfW, 0.05, -halfD),
        new THREE.Vector3(halfW, 0.05, halfD),
        new THREE.Vector3(-halfW, 0.05, halfD),
      ];
      const bGeom = new THREE.BufferGeometry().setFromPoints(boundaryPoints);
      const bMat = new THREE.LineBasicMaterial({ color: 0xef4444, linewidth: 2 });
      this.debugGroup.add(new THREE.LineLoop(bGeom, bMat));

      // 3. 3x3 Grid Lines showing viewport tiling across arena
      const gridMat = new THREE.LineBasicMaterial({ color: 0x475569, transparent: true, opacity: 0.6 });
      const gridGroup = new THREE.Group();
      for (const gx of [-halfW / 3, halfW / 3]) {
        const line = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(gx, 0.04, -halfD), new THREE.Vector3(gx, 0.04, halfD)]),
          gridMat
        );
        gridGroup.add(line);
      }
      for (const gz of [-halfD / 3, halfD / 3]) {
        const line = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-halfW, 0.04, gz), new THREE.Vector3(halfW, 0.04, gz)]),
          gridMat
        );
        gridGroup.add(line);
      }
      this.debugGroup.add(gridGroup);

      scene.add(this.debugGroup);
    }

    this.debugGroup.visible = true;

    // Approximate ground coverage of 43-degree FOV portrait camera centered around player:
    // Visible ground width is ~9.5 units, height is ~14.2 units
    if (this.footprintLine) {
      const vHalfW = 4.8;
      const vDepthNear = 4.5;
      const vDepthFar = 9.8;
      const positions = new Float32Array([
        player.x - vHalfW, 0.1, player.z + vDepthNear,
        player.x + vHalfW, 0.1, player.z + vDepthNear,
        player.x + vHalfW * 1.3, 0.1, player.z - vDepthFar,
        player.x - vHalfW * 1.3, 0.1, player.z - vDepthFar,
      ]);
      this.footprintLine.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      this.footprintLine.geometry.attributes.position.needsUpdate = true;
    }
  }
}
