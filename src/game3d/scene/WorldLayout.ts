import { WORLD_DEFINITIONS, getWorldMapSeed } from '../../data/worlds';
import { STAGES } from '../../data/stages';
import type { StageDefinition } from '../../types';

/** Permanent environment identity is intentionally world-scoped, never stage-scoped. */
export function getWorldMapSignature(worldId: number): string {
  const world = WORLD_DEFINITIONS.find((item) => item.id === worldId);
  return `${worldId}:${world?.mapProfile ?? 'unknown'}:${getWorldMapSeed(worldId)}`;
}

export function validateWorldMaps(stages: StageDefinition[]): { sameMapPerWorld: boolean; uniqueWorldMaps: boolean; signatures: Record<number, string> } {
  const signatures = Object.fromEntries(WORLD_DEFINITIONS.map((world) => [world.id, getWorldMapSignature(world.id)]));
  const sameMapPerWorld = WORLD_DEFINITIONS.every((world) => {
    const worldStages = stages.filter((stage) => stage.worldId === world.id);
    return worldStages.length === 5 && worldStages.every((stage) => stage.mapSeed === world.mapSeed) && new Set(worldStages.map((stage) => stage.mapSeed)).size === 1;
  });
  const uniqueWorldMaps = new Set(Object.values(signatures)).size === WORLD_DEFINITIONS.length;
  return { sameMapPerWorld, uniqueWorldMaps, signatures };
}

export const WORLD_LAYOUT_VALIDATION = validateWorldMaps(STAGES);
