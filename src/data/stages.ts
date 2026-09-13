import type { EnemyKind, SaveData, StageDefinition } from '../types';

const graveyard: EnemyKind[] = ['skeleton', 'bat', 'slime', 'ghost', 'archer', 'knight', 'imp'];
const forest: EnemyKind[] = ['skeleton', 'bat', 'slime', 'ghost', 'archer', 'demon'];
const frozen: EnemyKind[] = ['ghost', 'slime', 'archer', 'knight', 'demon'];
const castle: EnemyKind[] = ['knight', 'demon', 'imp', 'archer'];

export const WORLD_META = [
  { id: 1, name: 'Graveyard', subtitle: 'Where the first night begins', color: '#27b9e8' },
  { id: 2, name: 'Haunted Forest', subtitle: 'Whispers between the pines', color: '#6cc990' },
  { id: 3, name: 'Frozen Ruins', subtitle: 'Cold stone, colder things', color: '#7bb8e8' },
  { id: 4, name: 'Demon Castle', subtitle: 'The last light fades here', color: '#d45d74' },
] as const;

export const STAGES: StageDefinition[] = [
  { id: '1-1', worldId: 1, stageNumber: 1, name: 'First Night', biome: 'Graveyard', duration: 180, bossId: 'skeleton-king', bossName: 'Skeleton King', recommendedPower: 0, coinReward: 120, firstClearReward: 50, enemies: graveyard.slice(0, 3), description: 'Survive the night. The dead are only getting started.' },
  { id: '1-2', worldId: 1, stageNumber: 2, name: 'Bone Rush', biome: 'Graveyard', duration: 210, bossId: 'skeleton-king', bossName: 'Skeleton King', recommendedPower: 80, coinReward: 150, firstClearReward: 60, enemies: graveyard.slice(0, 4), description: 'A faster tide of bones gathers beyond the gate.' },
  { id: '1-3', worldId: 1, stageNumber: 3, name: 'Bat Swarm', biome: 'Graveyard', duration: 225, bossId: 'skeleton-king', bossName: 'Skeleton King', recommendedPower: 150, coinReward: 180, firstClearReward: 70, enemies: graveyard.slice(1, 5), description: 'Wings blot out the moon as the swarm descends.' },
  { id: '1-4', worldId: 1, stageNumber: 4, name: 'Necromancer', biome: 'Graveyard', duration: 240, bossId: 'skeleton-king', bossName: 'Skeleton King', recommendedPower: 230, coinReward: 210, firstClearReward: 80, enemies: graveyard.slice(0, 6), description: 'Something is calling every grave by name.' },
  { id: '1-5', worldId: 1, stageNumber: 5, name: 'Skeleton King', biome: 'Graveyard', duration: 260, bossId: 'skeleton-king', bossName: 'Skeleton King', recommendedPower: 320, coinReward: 260, firstClearReward: 120, enemies: graveyard, description: 'Break the crown and unlock Endless Survival.' },
  ...Array.from({ length: 5 }, (_, index): StageDefinition => ({ id: `2-${index + 1}`, worldId: 2, stageNumber: index + 1, name: ['Mosslight', 'Witch Path', 'Hollow Choir', 'Greenfire', 'Forest Witch'][index], biome: 'Haunted Forest', duration: 270 + index * 10, bossId: 'forest-witch', bossName: 'Forest Witch', recommendedPower: 390 + index * 70, coinReward: 290 + index * 25, firstClearReward: 90 + index * 10, enemies: forest, description: 'The forest remembers every footstep.' })),
  ...Array.from({ length: 5 }, (_, index): StageDefinition => ({ id: `3-${index + 1}`, worldId: 3, stageNumber: index + 1, name: ['Whiteout', 'Icebound', 'Shattered Hall', 'Frostwake', 'Frost Golem'][index], biome: 'Frozen Ruins', duration: 280 + index * 10, bossId: 'frost-golem', bossName: 'Frost Golem', recommendedPower: 780 + index * 90, coinReward: 430 + index * 30, firstClearReward: 120 + index * 12, enemies: frozen, description: 'Keep moving. The silence freezes first.' })),
  ...Array.from({ length: 5 }, (_, index): StageDefinition => ({ id: `4-${index + 1}`, worldId: 4, stageNumber: index + 1, name: ['Ashfall', 'Impasse', 'Cursed Keep', 'Red Moon', 'Demon Lord'][index], biome: 'Demon Castle', duration: 300 + index * 10, bossId: 'demon-lord', bossName: 'Demon Lord', recommendedPower: 1280 + index * 120, coinReward: 620 + index * 35, firstClearReward: 160 + index * 14, enemies: castle, description: 'The final keep is hungry for heroes.' })),
];

export function getStage(stageId: string): StageDefinition {
  return STAGES.find((stage) => stage.id === stageId) ?? STAGES[0];
}

export function stageNumber(stageId: string): number {
  const [world, stage] = stageId.split('-').map(Number);
  return (world - 1) * 5 + stage;
}

export function isStageUnlocked(stageId: string, save: SaveData): boolean {
  return stageNumber(stageId) <= save.highestUnlockedStage;
}

export function getCurrentStage(save: SaveData): StageDefinition {
  const current = STAGES.find((stage) => stageNumber(stage.id) === save.highestUnlockedStage);
  return current ?? STAGES[0];
}
