import * as THREE from 'three';

export const WORLD_WIDTH = 1680;
export const WORLD_HEIGHT = 1120;
export const LOGICAL_SCALE = 0.025;
export const WORLD_CENTER_X = WORLD_WIDTH / 2;
export const WORLD_CENTER_Y = WORLD_HEIGHT / 2;
export const ARENA_WIDTH = WORLD_WIDTH * LOGICAL_SCALE; // 42.0
export const ARENA_DEPTH = WORLD_HEIGHT * LOGICAL_SCALE; // 28.0

export function logicalToWorld(x: number, y: number, target = new THREE.Vector3()): THREE.Vector3 {
  return target.set((x - WORLD_CENTER_X) * LOGICAL_SCALE, 0, (y - WORLD_CENTER_Y) * LOGICAL_SCALE);
}

export function setLogicalPosition(object: THREE.Object3D, x: number, y: number, height = 0): void {
  object.position.set((x - WORLD_CENTER_X) * LOGICAL_SCALE, height, (y - WORLD_CENTER_Y) * LOGICAL_SCALE);
}

export function clampLogicalPosition(x: number, y: number, paddingX = 48, paddingY = 64): { x: number; y: number } {
  return {
    x: THREE.MathUtils.clamp(x, paddingX, WORLD_WIDTH - paddingX),
    y: THREE.MathUtils.clamp(y, paddingY, WORLD_HEIGHT - paddingY),
  };
}

export function hexColor(color: number): THREE.Color {
  return new THREE.Color(color);
}
