import type { EnemyKind, SaveData, StageDefinition, StageDifficulty } from '../types';
import { getBossDefinition } from './bosses';
import { WORLD_DEFINITIONS, getWorld } from './worlds';

export const STAGES_PER_WORLD = 10;

export const WORLD_META = WORLD_DEFINITIONS.map((world) => ({
  id: world.id,
  name: world.name,
  subtitle: world.subtitle,
  color: `#${world.theme.accent.toString(16).padStart(6, '0')}`,
})) as ReadonlyArray<{ id: number; name: string; subtitle: string; color: string }>;

function difficultyFor(worldId: number, stageNumber: number): StageDifficulty {
  const local = (stageNumber - 1) / (STAGES_PER_WORLD - 1);
  const world = worldId - 1;
  return {
    enemyHpMultiplier: 0.92 + world * 0.14 + local * 0.34,
    enemyDamageMultiplier: 0.90 + world * 0.11 + local * 0.28,
    // Fewer bodies than the old crowd-heavy tuning. Difficulty comes from composition and attacks.
    densityMultiplier: 0.72 + world * 0.035 + local * 0.24,
    eliteMultiplier: 0.30 + world * 0.20 + local * 1.55,
  };
}

const STAGE_NAMES: Record<number, string[]> = {
  1: ['First Night', 'Restless Soil', 'Bone Patrol', "Archer's Row", 'Grave Bloom', 'Witching Hour', 'Crypt Gate', 'Moonless Yard', "King's March", 'Skeleton King'],
  2: ['Mosslight', 'Wolf Trail', 'Thorn Road', 'Slime Hollow', 'Briar Circle', 'Guardian Grove', 'Old Roots', 'Witchfire', 'Black Canopy', 'Forest Witch'],
  3: ['Whiteout', 'Frozen Watch', 'Wraith Hall', 'Ice Magus', 'Cursed Barracks', 'Broken Rampart', 'Blue Silence', 'Frozen Choir', 'Golem Gate', 'Frost Golem'],
  4: ['Ashfall', 'Imp Run', 'Blood Hall', 'Hellguard', 'Cinder Court', 'Infernal Gallery', 'Broken Throne', 'Red Moon', 'Last Gate', 'Demon King'],
};

const STAGE_DESCRIPTIONS: Record<number, string> = {
  1: 'Read the dead, break their formation, and survive the night.',
  2: 'The forest fights as a pack. Separate its hunters from its casters.',
  3: 'Armored lines and frost magic punish predictable movement.',
  4: 'Every lane is dangerous. Break the castle guard before it closes around you.',
};

const ENEMY_COUNT_BY_STAGE = [2, 2, 3, 3, 4, 4, 5, 6, 6, 99] as const;

function createStage(worldId: number, stageNumber: number): StageDefinition {
  const world = getWorld(worldId);
  const bossStage = stageNumber === STAGES_PER_WORLD;
  const boss = bossStage ? getBossDefinition(world.bossId) : undefined;
  const difficulty = difficultyFor(worldId, stageNumber);
  const duration = 130 + (worldId - 1) * 10 + (stageNumber - 1) * 5;
  const allowedEnemyCount = Math.min(world.enemyPool.length, ENEMY_COUNT_BY_STAGE[stageNumber - 1] ?? world.enemyPool.length);

  return {
    id: `${worldId}-${stageNumber}`,
    worldId,
    mapSeed: world.mapSeed + stageNumber * 101,
    stageNumber,
    name: STAGE_NAMES[worldId][stageNumber - 1],
    biome: world.name,
    duration,
    bossStage,
    bossId: boss?.id,
    bossName: boss?.name,
    difficulty,
    recommendedPower: Math.max(0, (worldId - 1) * 720 + (stageNumber - 1) * 72),
    coinReward: 85 + (worldId - 1) * 125 + (stageNumber - 1) * 18,
    firstClearReward: 34 + (worldId - 1) * 28 + (stageNumber - 1) * 6,
    enemies: world.enemyPool.slice(0, allowedEnemyCount) as EnemyKind[],
    description: bossStage
      ? `${STAGE_DESCRIPTIONS[worldId]} Defeat the ${boss?.name ?? 'world boss'} to clear the realm.`
      : STAGE_DESCRIPTIONS[worldId],
  };
}

export const STAGES: StageDefinition[] = WORLD_DEFINITIONS.flatMap((world) =>
  Array.from({ length: STAGES_PER_WORLD }, (_, index) => createStage(world.id, index + 1))
);

export function getStage(stageId: string): StageDefinition {
  return STAGES.find((stage) => stage.id === stageId) ?? STAGES[0];
}

export function stageNumber(stageId: string): number {
  const [world, stage] = stageId.split('-').map(Number);
  return (world - 1) * STAGES_PER_WORLD + stage;
}

export function isStageUnlocked(stageId: string, save: SaveData): boolean {
  return stageNumber(stageId) <= save.highestUnlockedStage;
}

export function isWorldUnlocked(worldId: number, save: SaveData): boolean {
  return save.highestUnlockedStage >= (worldId - 1) * STAGES_PER_WORLD + 1;
}

export function getCurrentStage(save: SaveData): StageDefinition {
  const current = STAGES.find((stage) => stageNumber(stage.id) === save.highestUnlockedStage);
  return current ?? STAGES[0];
}

export function getWorldStages(worldId: number): StageDefinition[] {
  return STAGES.filter((stage) => stage.worldId === worldId);
}

export function getWorldStageCount(worldId: number): number {
  return getWorldStages(worldId).length;
}

export function getWorldFinalStage(worldId: number): StageDefinition {
  const stages = getWorldStages(worldId);
  return stages[stages.length - 1];
}

export function isWorldCleared(worldId: number, save: SaveData): boolean {
  const finalStage = getWorldFinalStage(worldId);
  return save.completedStages.includes(finalStage.id);
}

export function getTotalCampaignStageCount(): number {
  return STAGES.length;
}

export function getNextCampaignStageId(stageId: string): string | null {
  const currentIndex = STAGES.findIndex((stage) => stage.id === stageId);
  if (currentIndex === -1 || currentIndex >= STAGES.length - 1) return null;
  return STAGES[currentIndex + 1].id;
}

export function isLastCampaignStage(stageId: string): boolean {
  return STAGES[STAGES.length - 1]?.id === stageId;
}

export function getSurvivalEnemyPool(save: SaveData): EnemyKind[] {
  const pool: EnemyKind[] = ['skeleton', 'zombie', 'bat', 'archer', 'bone-mage', 'ghost'];
  if (isWorldCleared(1, save)) pool.push('slime', 'cursed-wolf', 'thornling', 'forest-mage', 'forest-guardian', 'treant');
  if (isWorldCleared(2, save)) pool.push('knight', 'frost-wraith', 'ice-mage');
  if (isWorldCleared(3, save)) pool.push('demon', 'imp', 'demon-warrior');
  return [...new Set(pool)];
}
