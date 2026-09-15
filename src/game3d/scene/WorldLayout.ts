import { WORLD_DEFINITIONS, getWorldMapSeed } from '../../data/worlds';
import { STAGES } from '../../data/stages';
import type { StageDefinition } from '../../types';
import { ARENA_DEPTH, ARENA_WIDTH } from '../core/coordinates';
import { WORLD_LAYOUTS, type WorldLayoutData } from './WorldArenaLayout';
import { getObstaclesForWorld } from './WorldObstacles';

/** Permanent environment identity is intentionally world-scoped, never stage-scoped. */
export function getWorldMapSignature(worldId: number): string {
  const world = WORLD_DEFINITIONS.find((item) => item.id === worldId);
  return `${worldId}:${world?.mapProfile ?? 'unknown'}:${getWorldMapSeed(worldId)}`;
}

export function validateWorldMaps(stages: StageDefinition[]): {
  sameMapPerWorld: boolean;
  uniqueWorldMaps: boolean;
  signatures: Record<number, string>;
} {
  const signatures = Object.fromEntries(
    WORLD_DEFINITIONS.map((world) => [world.id, getWorldMapSignature(world.id)])
  );
  const sameMapPerWorld = WORLD_DEFINITIONS.every((world) => {
    const worldStages = stages.filter((stage) => stage.worldId === world.id);
    return (
      worldStages.length === 5 &&
      worldStages.every((stage) => stage.mapSeed === world.mapSeed) &&
      new Set(worldStages.map((stage) => stage.mapSeed)).size === 1
    );
  });
  const uniqueWorldMaps = new Set(Object.values(signatures)).size === WORLD_DEFINITIONS.length;
  return { sameMapPerWorld, uniqueWorldMaps, signatures };
}

export interface ColliderValidationIssue {
  worldId: number;
  propId: string;
  issue: string;
}

/**
 * Validates the authored world collider definitions for bounds safety,
 * player spawn clearance, duplicate IDs, and dimension validity.
 */
export function validateWorldColliders(): { valid: boolean; issues: ColliderValidationIssue[] } {
  const issues: ColliderValidationIssue[] = [];
  const maxBoundX = ARENA_WIDTH / 2 - 0.5; // ~20.5
  const maxBoundZ = ARENA_DEPTH / 2 - 0.5; // ~13.5
  const playerSpawnClearanceRadius = 2.5;

  for (const worldId of [1, 2, 3, 4]) {
    const layout: WorldLayoutData = WORLD_LAYOUTS[worldId];
    if (!layout) {
      issues.push({ worldId, propId: 'world', issue: `Missing layout for world ${worldId}` });
      continue;
    }

    const seenIds = new Set<string>();

    for (const prop of layout.props) {
      // 1. Duplicate ID check
      if (seenIds.has(prop.id)) {
        issues.push({ worldId, propId: prop.id, issue: `Duplicate prop ID: ${prop.id}` });
      }
      seenIds.add(prop.id);

      if (!prop.collider) continue;

      const ox = prop.x + (prop.collider.offsetX ?? 0);
      const oz = prop.z + (prop.collider.offsetZ ?? 0);

      // 2. Dimension validity check
      if (prop.collider.type === 'circle') {
        if (prop.collider.radius <= 0) {
          issues.push({ worldId, propId: prop.id, issue: `Invalid circle radius: ${prop.collider.radius}` });
        }
        // Bounds check
        if (
          Math.abs(ox) + prop.collider.radius > maxBoundX ||
          Math.abs(oz) + prop.collider.radius > maxBoundZ
        ) {
          issues.push({ worldId, propId: prop.id, issue: `Circle collider extends outside arena bounds: (${ox}, ${oz}) r=${prop.collider.radius}` });
        }
        // Player spawn check (player starts at 0, 0 in 3D world space)
        const distToCenter = Math.hypot(ox, oz);
        if (distToCenter < prop.collider.radius + playerSpawnClearanceRadius) {
          issues.push({ worldId, propId: prop.id, issue: `Collider overlaps player spawn clearance: dist=${distToCenter.toFixed(2)}` });
        }
      } else if (prop.collider.type === 'box') {
        if (prop.collider.width <= 0 || prop.collider.depth <= 0) {
          issues.push({ worldId, propId: prop.id, issue: `Invalid box dimensions: ${prop.collider.width}x${prop.collider.depth}` });
        }
        const hw = prop.collider.width / 2;
        const hd = prop.collider.depth / 2;
        // Bounds check
        if (Math.abs(ox) + hw > maxBoundX || Math.abs(oz) + hd > maxBoundZ) {
          issues.push({ worldId, propId: prop.id, issue: `Box collider extends outside arena bounds: (${ox}, ${oz}) ${hw * 2}x${hd * 2}` });
        }
        // Player spawn check
        const closestX = Math.max(ox - hw, Math.min(0, ox + hw));
        const closestZ = Math.max(oz - hd, Math.min(0, oz + hd));
        const distToCenter = Math.hypot(closestX, closestZ);
        if (distToCenter < playerSpawnClearanceRadius) {
          issues.push({ worldId, propId: prop.id, issue: `Box collider overlaps player spawn clearance: dist=${distToCenter.toFixed(2)}` });
        }
      }
    }
  }

  // 3. Topology uniqueness check: ensure collider layouts differ substantially
  const obstacleFingerprints = [1, 2, 3, 4].map((id) => {
    const colliders = getObstaclesForWorld(id);
    return colliders.map((c) => (c.type === 'circle' ? `C:${c.x.toFixed(1)},${c.z.toFixed(1)}` : `B:${c.minX.toFixed(1)},${c.minZ.toFixed(1)}`)).sort().join('|');
  });
  if (new Set(obstacleFingerprints).size !== 4) {
    issues.push({ worldId: 0, propId: 'all', issue: 'Worlds share duplicate collider topology fingerprints!' });
  }

  return { valid: issues.length === 0, issues };
}

export const WORLD_LAYOUT_VALIDATION = validateWorldMaps(STAGES);
export const WORLD_COLLIDER_VALIDATION = validateWorldColliders();

if (typeof window !== 'undefined' && !WORLD_COLLIDER_VALIDATION.valid) {
  console.warn('[WorldLayout] Collider validation warnings:', WORLD_COLLIDER_VALIDATION.issues);
}
