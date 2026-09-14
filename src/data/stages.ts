import type { EnemyKind, SaveData, StageDefinition, StageDifficulty } from '../types';
import { getBossDefinition } from './bosses';
import { WORLD_DEFINITIONS, getWorld } from './worlds';

export const WORLD_META = WORLD_DEFINITIONS.map((world) => ({
  id: world.id,
  name: world.name,
  subtitle: world.subtitle,
  color: `#${world.theme.accent.toString(16).padStart(6, '0')}`,
})) as ReadonlyArray<{ id: number; name: string; subtitle: string; color: string }>;

const DIFFICULTY_CURVE: StageDifficulty[] = [
  { enemyHpMultiplier: 0.9, enemyDamageMultiplier: 0.9, densityMultiplier: 0.85, eliteMultiplier: 0.35 },
  { enemyHpMultiplier: 1, enemyDamageMultiplier: 1, densityMultiplier: 1, eliteMultiplier: 0.75 },
  { enemyHpMultiplier: 1.1, enemyDamageMultiplier: 1.06, densityMultiplier: 1.12, eliteMultiplier: 1.2 },
  { enemyHpMultiplier: 1.2, enemyDamageMultiplier: 1.12, densityMultiplier: 1.25, eliteMultiplier: 1.65 },
  { enemyHpMultiplier: 1.3, enemyDamageMultiplier: 1.18, densityMultiplier: 1.32, eliteMultiplier: 2.15 },
];

const STAGE_NAMES: Record<number, string[]> = {
  1: ['First Night', 'Bone Rush', 'Bat Swarm', 'Necromancer', 'Skeleton King'],
  2: ['Mosslight', 'Witch Path', 'Hollow Choir', 'Greenfire', 'Forest Witch'],
  3: ['Whiteout', 'Icebound', 'Shattered Hall', 'Frostwake', 'Frost Golem'],
  4: ['Ashfall', 'Impasse', 'Cursed Keep', 'Red Moon', 'Demon Lord'],
};

const STAGE_DESCRIPTIONS: Record<number, string> = {
  1: 'Survive the night. The dead are only getting started.',
  2: 'The forest remembers every footstep.',
  3: 'Keep moving. The silence freezes first.',
  4: 'The final keep is hungry for heroes.',
};

const firstStageEnemyCount = (stageNumber: number): number => Math.min(3 + Math.max(0, stageNumber - 1), 7);

function createStage(worldId: number, stageNumber: number): StageDefinition {
  const world = getWorld(worldId);
  const bossStage = stageNumber === 5;
  const boss = bossStage ? getBossDefinition(world.bossId) : undefined;
  const difficulty = DIFFICULTY_CURVE[stageNumber - 1];
  const duration = 180 + (worldId - 1) * 22 + (stageNumber - 1) * 12;
  return {
    id: `${worldId}-${stageNumber}`,
    worldId,
    mapSeed: world.mapSeed,
    stageNumber,
    name: STAGE_NAMES[worldId][stageNumber - 1],
    biome: world.name,
    duration,
    bossStage,
    bossId: boss?.id,
    bossName: boss?.name,
    difficulty,
    recommendedPower: Math.max(0, (worldId - 1) * 390 + (stageNumber - 1) * 75),
    coinReward: 120 + (worldId - 1) * 170 + (stageNumber - 1) * 28,
    firstClearReward: 50 + (worldId - 1) * 35 + (stageNumber - 1) * 10,
    enemies: world.enemyPool.slice(0, firstStageEnemyCount(stageNumber)) as EnemyKind[],
    description: bossStage ? `${STAGE_DESCRIPTIONS[worldId]} Defeat the ${boss?.name ?? 'world boss'} to claim the crown.` : STAGE_DESCRIPTIONS[worldId],
  };
}

export const STAGES: StageDefinition[] = WORLD_DEFINITIONS.flatMap((world) => Array.from({ length: 5 }, (_, index) => createStage(world.id, index + 1)));

export function getStage(stageId: string): StageDefinition { return STAGES.find((stage) => stage.id === stageId) ?? STAGES[0]; }

export function stageNumber(stageId: string): number {
  const [world, stage] = stageId.split('-').map(Number);
  return (world - 1) * 5 + stage;
}

export function isStageUnlocked(stageId: string, save: SaveData): boolean { return stageNumber(stageId) <= save.highestUnlockedStage; }

export function isWorldUnlocked(worldId: number, save: SaveData): boolean { return save.highestUnlockedStage >= (worldId - 1) * 5 + 1; }

export function getCurrentStage(save: SaveData): StageDefinition {
  const current = STAGES.find((stage) => stageNumber(stage.id) === save.highestUnlockedStage);
  return current ?? STAGES[0];
}

export function getWorldStages(worldId: number): StageDefinition[] { return STAGES.filter((stage) => stage.worldId === worldId); }
