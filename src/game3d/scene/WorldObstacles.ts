import * as THREE from 'three';
import { LOGICAL_SCALE, WORLD_CENTER_X, WORLD_CENTER_Y, WORLD_HEIGHT, WORLD_WIDTH } from '../core/coordinates';
import { getWorldLayout } from './WorldArenaLayout';

export type ObstacleShape =
  | { type: 'circle'; x: number; z: number; radius: number; name?: string }
  | { type: 'box'; minX: number; maxX: number; minZ: number; maxZ: number; name?: string };

export interface WorldObstacleSet {
  worldId: number;
  obstacles: ObstacleShape[];
}

/** Cache obstacle lists generated from unified layout */
const OBSTACLE_CACHE = new Map<number, ObstacleShape[]>();

/**
 * Returns the gameplay colliders for a given world, derived directly from the
 * single-source-of-truth WorldArenaLayout authored definitions.
 */
export function getObstaclesForWorld(worldId: number): ObstacleShape[] {
  const cached = OBSTACLE_CACHE.get(worldId);
  if (cached) return cached;

  const layout = getWorldLayout(worldId);
  const obstacles: ObstacleShape[] = [];

  for (const prop of layout.props) {
    if (!prop.collider) continue;

    const ox = prop.x + (prop.collider.offsetX ?? 0);
    const oz = prop.z + (prop.collider.offsetZ ?? 0);

    if (prop.collider.type === 'circle') {
      obstacles.push({
        type: 'circle',
        x: ox,
        z: oz,
        radius: prop.collider.radius,
        name: prop.id,
      });
    } else if (prop.collider.type === 'box') {
      const hw = prop.collider.width / 2;
      const hd = prop.collider.depth / 2;
      obstacles.push({
        type: 'box',
        minX: ox - hw,
        maxX: ox + hw,
        minZ: oz - hd,
        maxZ: oz + hd,
        name: prop.id,
      });
    }
  }

  OBSTACLE_CACHE.set(worldId, obstacles);
  return obstacles;
}

/** Clear cache if layouts are reloaded or modified in dev */
export function clearObstacleCache(): void {
  OBSTACLE_CACHE.clear();
}

/**
 * Tests whether a circle at the given logical coordinate overlaps any static obstacle.
 */
export function isPointInWorldObstacle(
  logicalX: number,
  logicalY: number,
  logicalRadius: number,
  worldId: number,
  footprintScale = 0.88
): boolean {
  const wx = (logicalX - WORLD_CENTER_X) * LOGICAL_SCALE;
  const wz = (logicalY - WORLD_CENTER_Y) * LOGICAL_SCALE;
  const wr = logicalRadius * LOGICAL_SCALE;
  const obstacles = getObstaclesForWorld(worldId);

  for (const obs of obstacles) {
    if (obs.type === 'circle') {
      const effectiveRadius = obs.radius * footprintScale;
      const dx = wx - obs.x;
      const dz = wz - obs.z;
      const minDist = effectiveRadius + wr;
      if (dx * dx + dz * dz < minDist * minDist) {
        return true;
      }
    } else if (obs.type === 'box') {
      const cx = (obs.minX + obs.maxX) / 2;
      const cz = (obs.minZ + obs.maxZ) / 2;
      const hw = ((obs.maxX - obs.minX) / 2) * footprintScale;
      const hd = ((obs.maxZ - obs.minZ) / 2) * footprintScale;

      const closestX = THREE.MathUtils.clamp(wx, cx - hw, cx + hw);
      const closestZ = THREE.MathUtils.clamp(wz, cz - hd, cz + hd);
      const dx = wx - closestX;
      const dz = wz - closestZ;
      if (dx * dx + dz * dz < wr * wr) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Resolves 2D collision against static world obstacles in logical coordinates.
 * Pushes the entity out along the penetration normal, enabling smooth diagonal sliding.
 * Uses 2-pass relaxation to prevent getting wedged in tight corners or vibrating.
 */
export function resolveObstacleCollision(
  logicalX: number,
  logicalY: number,
  logicalRadius: number,
  worldId: number,
  footprintScale = 0.88
): { x: number; y: number } {
  let wx = (logicalX - WORLD_CENTER_X) * LOGICAL_SCALE;
  let wz = (logicalY - WORLD_CENTER_Y) * LOGICAL_SCALE;
  const wr = logicalRadius * LOGICAL_SCALE;

  const obstacles = getObstaclesForWorld(worldId);

  // 2 passes ensure resolution when pushing into another nearby collider
  for (let pass = 0; pass < 2; pass++) {
    let resolvedAny = false;

    for (const obs of obstacles) {
      if (obs.type === 'circle') {
        const effectiveRadius = obs.radius * footprintScale;
        const dx = wx - obs.x;
        const dz = wz - obs.z;
        const minDist = effectiveRadius + wr;
        const distSq = dx * dx + dz * dz;

        if (distSq < minDist * minDist) {
          const dist = Math.sqrt(distSq);
          if (dist > 0.0001) {
            const push = minDist - dist;
            wx += (dx / dist) * push;
            wz += (dz / dist) * push;
          } else {
            // Directly on center: nudge outward
            wx += minDist;
          }
          resolvedAny = true;
        }
      } else if (obs.type === 'box') {
        const cx = (obs.minX + obs.maxX) / 2;
        const cz = (obs.minZ + obs.maxZ) / 2;
        const hw = ((obs.maxX - obs.minX) / 2) * footprintScale;
        const hd = ((obs.maxZ - obs.minZ) / 2) * footprintScale;

        const boxMinX = cx - hw;
        const boxMaxX = cx + hw;
        const boxMinZ = cz - hd;
        const boxMaxZ = cz + hd;

        const closestX = THREE.MathUtils.clamp(wx, boxMinX, boxMaxX);
        const closestZ = THREE.MathUtils.clamp(wz, boxMinZ, boxMaxZ);
        const dx = wx - closestX;
        const dz = wz - closestZ;
        const distSq = dx * dx + dz * dz;

        if (distSq < wr * wr) {
          const dist = Math.sqrt(distSq);
          if (dist > 0.0001) {
            const push = wr - dist;
            wx += (dx / dist) * push;
            wz += (dz / dist) * push;
          } else {
            // Inside the box: push out to the nearest edge
            const left = wx - boxMinX;
            const right = boxMaxX - wx;
            const top = wz - boxMinZ;
            const bottom = boxMaxZ - wz;
            const minOverlap = Math.min(left, right, top, bottom);

            if (minOverlap === left) wx = boxMinX - wr;
            else if (minOverlap === right) wx = boxMaxX + wr;
            else if (minOverlap === top) wz = boxMinZ - wr;
            else wz = boxMaxZ + wr;
          }
          resolvedAny = true;
        }
      }
    }

    if (!resolvedAny) break;
  }

  return {
    x: wx / LOGICAL_SCALE + WORLD_CENTER_X,
    y: wz / LOGICAL_SCALE + WORLD_CENTER_Y,
  };
}

/**
 * Calculates a steering direction adjustment for enemies to smoothly skirt around obstacles.
 */
export function steerAroundObstacles(
  enemyLogicalX: number,
  enemyLogicalY: number,
  dirX: number,
  dirY: number,
  worldId: number
): { dirX: number; dirY: number } {
  const wx = (enemyLogicalX - WORLD_CENTER_X) * LOGICAL_SCALE;
  const wz = (enemyLogicalY - WORLD_CENTER_Y) * LOGICAL_SCALE;
  const lookAheadDist = 1.4; // look ahead ~56 logical units

  const aheadX = wx + dirX * lookAheadDist;
  const aheadZ = wz + dirY * lookAheadDist;

  const obstacles = getObstaclesForWorld(worldId);

  for (const obs of obstacles) {
    let obsX = 0;
    let obsZ = 0;
    let obsR = 1.5;

    if (obs.type === 'circle') {
      obsX = obs.x;
      obsZ = obs.z;
      obsR = obs.radius + 0.3;
    } else {
      obsX = (obs.minX + obs.maxX) / 2;
      obsZ = (obs.minZ + obs.maxZ) / 2;
      obsR = Math.max(obs.maxX - obs.minX, obs.maxZ - obs.minZ) / 2 + 0.35;
    }

    const dx = aheadX - obsX;
    const dz = aheadZ - obsZ;
    const distSq = dx * dx + dz * dz;

    if (distSq < obsR * obsR) {
      // Steer perpendicular to obstacle normal
      const perpX = -dz;
      const perpY = dx;
      const dot = dirX * perpX + dirY * perpY;
      const sign = dot >= 0 ? 1 : -1;
      const steerX = dirX * 0.42 + (perpX * sign) * 0.58;
      const steerY = dirY * 0.42 + (perpY * sign) * 0.58;
      const len = Math.hypot(steerX, steerY);
      if (len > 0.01) {
        return { dirX: steerX / len, dirY: steerY / len };
      }
    }
  }

  return { dirX, dirY };
}

/**
 * Finds a safe spawn position outside any obstacles for enemies or bosses.
 * Uses up to 8 radial offsets, with fallback to resolveObstacleCollision.
 */
export function resolveSafeSpawnPosition(
  logicalX: number,
  logicalY: number,
  logicalRadius: number,
  worldId: number
): { x: number; y: number } {
  // If already clear, keep position
  if (!isPointInWorldObstacle(logicalX, logicalY, logicalRadius, worldId)) {
    return { x: logicalX, y: logicalY };
  }

  // Try 8 radial samples outward to find a clear clearing nearby
  const sampleDistances = [60, 110, 160];
  for (const dist of sampleDistances) {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const testX = THREE.MathUtils.clamp(logicalX + Math.cos(angle) * dist, 70, WORLD_WIDTH - 70);
      const testY = THREE.MathUtils.clamp(logicalY + Math.sin(angle) * dist, 80, WORLD_HEIGHT - 80);

      if (!isPointInWorldObstacle(testX, testY, logicalRadius, worldId)) {
        return { x: testX, y: testY };
      }
    }
  }

  // Fallback: push position out using penetration resolution
  return resolveObstacleCollision(logicalX, logicalY, logicalRadius + 8, worldId);
}
