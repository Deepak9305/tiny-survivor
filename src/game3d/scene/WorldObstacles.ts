import * as THREE from 'three';
import { ARENA_DEPTH, ARENA_WIDTH, LOGICAL_SCALE, WORLD_CENTER_X, WORLD_CENTER_Y } from '../core/coordinates';

export type ObstacleShape =
  | { type: 'circle'; x: number; z: number; radius: number; name?: string }
  | { type: 'box'; minX: number; maxX: number; minZ: number; maxZ: number; name?: string };

export interface WorldObstacleSet {
  worldId: number;
  obstacles: ObstacleShape[];
}

/**
 * World 1: Graveyard Major Static Colliders (3D unit space centered at 0,0)
 */
const GRAVEYARD_OBSTACLES: ObstacleShape[] = [
  // North Chapel of the Fallen Landmark Facade
  { type: 'box', minX: -3.6, maxX: 3.6, minZ: -21.4, maxZ: -18.6, name: 'NorthChapel' },
  // West Crypts: Forgotten Kings Mausoleum
  { type: 'box', minX: -10.2, maxX: -6.2, minZ: -14.8, maxZ: -10.2, name: 'WestMausoleum' },
  // East Terrace & Watcher Statue Plinth
  { type: 'box', minX: 6.6, maxX: 10.4, minZ: -14.5, maxZ: -10.5, name: 'EastTerrace' },
  // Central Weeping Angel Pedestal Plinth
  { type: 'circle', x: 0, z: -2.2, radius: 1.15, name: 'CentralAngelPlinth' },
  // The Pond Deep Basin (Slow/Impassable water center)
  { type: 'circle', x: -7.5, z: 10.5, radius: 2.2, name: 'PondDeepBasin' },
  // South Crypts: Sealed Below Tomb
  { type: 'box', minX: 6.2, maxX: 9.6, minZ: 9.0, maxZ: 12.2, name: 'SouthCrypt' },
  // South Gatehouse Pillars
  { type: 'box', minX: -3.2, maxX: -1.8, minZ: 18.6, maxZ: 20.4, name: 'SouthPillarL' },
  { type: 'box', minX: 1.8, maxX: 3.2, minZ: 18.6, maxZ: 20.4, name: 'SouthPillarR' },
];

/**
 * World 2: Haunted Forest Major Static Colliders
 */
const FOREST_OBSTACLES: ObstacleShape[] = [
  // Massive Cursed Tree Trunk at North
  { type: 'circle', x: 0, z: -17.5, radius: 2.4, name: 'CursedTreeGiant' },
  // Ancient Spirit Shrine at East
  { type: 'box', minX: 6.5, maxX: 9.8, minZ: -12.5, maxZ: -8.5, name: 'SpiritShrine' },
  // Standing Stones Cluster at West
  { type: 'circle', x: -8.0, z: -10.0, radius: 1.8, name: 'StandingStones' },
  // Central Spirit Well / Altar
  { type: 'circle', x: 0, z: -1.8, radius: 1.2, name: 'CentralForestWell' },
  // Deep Bog / Mire Basin at Southwest
  { type: 'circle', x: -7.2, z: 9.5, radius: 2.0, name: 'DeepForestBog' },
  // Ancient Fallen Hollow Trunk at Southeast
  { type: 'box', minX: 5.5, maxX: 8.8, minZ: 9.5, maxZ: 12.5, name: 'HollowTrunk' },
];

/**
 * World 3: Frozen Ruins Major Static Colliders
 */
const FROZEN_OBSTACLES: ObstacleShape[] = [
  // Great Ruined Frozen Temple Gate at North
  { type: 'box', minX: -4.0, maxX: 4.0, minZ: -21.0, maxZ: -18.2, name: 'FrozenTempleGate' },
  // Collapsed Hall of Pillars at West
  { type: 'box', minX: -10.0, maxX: -6.5, minZ: -13.5, maxZ: -9.5, name: 'CollapsedHall' },
  // Frozen Warrior Statue Court at East
  { type: 'box', minX: 6.8, maxX: 10.2, minZ: -13.5, maxZ: -9.5, name: 'WarriorCourt' },
  // Central Frost Monolith
  { type: 'circle', x: 0, z: -2.0, radius: 1.2, name: 'FrostMonolith' },
  // Massive Glacier Crystal Spire at Southwest
  { type: 'circle', x: -7.5, z: 9.8, radius: 1.9, name: 'GlacierSpire' },
  // Ruined Crypt of the Frost King at Southeast
  { type: 'box', minX: 6.5, maxX: 9.5, minZ: 9.5, maxZ: 12.5, name: 'FrostKingCrypt' },
];

/**
 * World 4: Demon Castle Major Static Colliders
 */
const CASTLE_OBSTACLES: ObstacleShape[] = [
  // Infernal Gates of Dis at North
  { type: 'box', minX: -4.2, maxX: 4.2, minZ: -21.2, maxZ: -18.5, name: 'GatesOfDis' },
  // Blood Altar at West
  { type: 'box', minX: -9.8, maxX: -6.4, minZ: -13.2, maxZ: -9.6, name: 'BloodAltar' },
  // Obsidian Throne Dais at East
  { type: 'box', minX: 6.4, maxX: 9.8, minZ: -13.2, maxZ: -9.6, name: 'ThroneDais' },
  // Central Brazier / Infernal Spire
  { type: 'circle', x: 0, z: -2.2, radius: 1.2, name: 'CentralInfernalBrazier' },
  // Magma Chasm Pit at Southwest
  { type: 'circle', x: -7.5, z: 10.2, radius: 2.1, name: 'MagmaChasmPit' },
  // Crystal Furnace at Southeast
  { type: 'box', minX: 6.2, maxX: 9.6, minZ: 9.2, maxZ: 12.6, name: 'CrystalFurnace' },
];

export function getObstaclesForWorld(worldId: number): ObstacleShape[] {
  switch (worldId) {
    case 1: return GRAVEYARD_OBSTACLES;
    case 2: return FOREST_OBSTACLES;
    case 3: return FROZEN_OBSTACLES;
    case 4: return CASTLE_OBSTACLES;
    default: return GRAVEYARD_OBSTACLES;
  }
}

/**
 * Resolves 2D collision against large static world obstacles in logical coordinates.
 * Pushes the entity out along the penetration normal.
 */
export function resolveObstacleCollision(
  logicalX: number,
  logicalY: number,
  logicalRadius: number,
  worldId: number
): { x: number; y: number } {
  // Convert logical entity position to 3D world space (where obstacles are authored)
  let wx = (logicalX - WORLD_CENTER_X) * LOGICAL_SCALE;
  let wz = (logicalY - WORLD_CENTER_Y) * LOGICAL_SCALE;
  const wr = logicalRadius * LOGICAL_SCALE;

  const obstacles = getObstaclesForWorld(worldId);

  for (const obs of obstacles) {
    if (obs.type === 'circle') {
      const dx = wx - obs.x;
      const dz = wz - obs.z;
      const minDist = obs.radius + wr;
      const distSq = dx * dx + dz * dz;
      if (distSq < minDist * minDist) {
        const dist = Math.max(0.001, Math.sqrt(distSq));
        const push = minDist - dist;
        wx += (dx / dist) * push;
        wz += (dz / dist) * push;
      }
    } else if (obs.type === 'box') {
      // Find closest point on box to circle center
      const closestX = THREE.MathUtils.clamp(wx, obs.minX, obs.maxX);
      const closestZ = THREE.MathUtils.clamp(wz, obs.minZ, obs.maxZ);
      const dx = wx - closestX;
      const dz = wz - closestZ;
      const distSq = dx * dx + dz * dz;

      if (distSq < wr * wr) {
        const dist = Math.sqrt(distSq);
        if (dist > 0.001) {
          const push = wr - dist;
          wx += (dx / dist) * push;
          wz += (dz / dist) * push;
        } else {
          // Inside the box: push out to the nearest edge
          const left = wx - obs.minX;
          const right = obs.maxX - wx;
          const top = wz - obs.minZ;
          const bottom = obs.maxZ - wz;
          const minOverlap = Math.min(left, right, top, bottom);
          if (minOverlap === left) wx = obs.minX - wr;
          else if (minOverlap === right) wx = obs.maxX + wr;
          else if (minOverlap === top) wz = obs.minZ - wr;
          else wz = obs.maxZ + wr;
        }
      }
    }
  }

  // Convert resolved 3D position back to logical coordinates
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
      obsR = Math.max(obs.maxX - obs.minX, obs.maxZ - obs.minZ) / 2 + 0.3;
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
      const steerX = dirX * 0.45 + (perpX * sign) * 0.55;
      const steerY = dirY * 0.45 + (perpY * sign) * 0.55;
      const len = Math.hypot(steerX, steerY);
      if (len > 0.01) {
        return { dirX: steerX / len, dirY: steerY / len };
      }
    }
  }

  return { dirX, dirY };
}
