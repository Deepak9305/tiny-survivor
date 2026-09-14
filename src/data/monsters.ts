import type { DamageType, EnemyKind } from '../types';

export interface MonsterDefinition {
  id: EnemyKind;
  name: string;
  category: 'normal' | 'elite-capable';
  worldIds: number[];
  firstStage: string;
  role: string;
  description: string;
  behavior: string;
  weakness: DamageType[];
  resistance: DamageType[];
  combatTip: string;
}

export const MONSTER_DEFINITIONS: Record<EnemyKind, MonsterDefinition> = {
  skeleton: {
    id: 'skeleton', name: 'Skeleton', category: 'elite-capable', worldIds: [1, 2, 4], firstStage: '1-1', role: 'Undead melee',
    description: 'A relentless bone soldier that advances in a straight line.', behavior: 'Slow melee pursuer.', weakness: ['physical'], resistance: [],
    combatTip: 'Keep moving and let piercing attacks clear the pack.',
  },
  bat: {
    id: 'bat', name: 'Bat', category: 'normal', worldIds: [1, 2, 3], firstStage: '1-1', role: 'Flying skirmisher',
    description: 'A fast flier that slips through gaps in your defense.', behavior: 'Quick approach with a light contact hit.', weakness: ['lightning'], resistance: [],
    combatTip: 'Chain Lightning jumps cleanly through clustered wings.',
  },
  slime: {
    id: 'slime', name: 'Slime', category: 'elite-capable', worldIds: [1, 2, 3], firstStage: '1-1', role: 'Heavy bruiser',
    description: 'A dense, living puddle that absorbs punishment and slows the lane.', behavior: 'Slow pursuer with a heavy body.', weakness: ['fire'], resistance: ['physical'],
    combatTip: 'Burn it before it reaches the center of the arena.',
  },
  ghost: {
    id: 'ghost', name: 'Ghost', category: 'elite-capable', worldIds: [1, 2, 3, 4], firstStage: '1-1', role: 'Spectral pursuer',
    description: 'A drifting spirit that fades in and out as it closes the distance.', behavior: 'Floating pursuit with a brief visual flicker.', weakness: ['arcane'], resistance: ['physical'],
    combatTip: 'Arcane bolts cut through its spectral resistance.',
  },
  archer: {
    id: 'archer', name: 'Skeleton Archer', category: 'elite-capable', worldIds: [1, 2, 3, 4], firstStage: '1-4', role: 'Ranged threat',
    description: 'A hooded marksman that holds back and fires into open lanes.', behavior: 'Maintains distance and launches ranged bolts.', weakness: ['fire'], resistance: [],
    combatTip: 'Close the gap or use a fire orb to force it out of position.',
  },
  knight: {
    id: 'knight', name: 'Cursed Knight', category: 'elite-capable', worldIds: [1, 3, 4], firstStage: '1-4', role: 'Armored tank',
    description: 'A shielded champion with a slow stride and a punishing collision.', behavior: 'Slow, high-health melee blocker.', weakness: ['lightning'], resistance: ['physical'],
    combatTip: 'Lightning punishes its armor while you circle around the shield.',
  },
  demon: {
    id: 'demon', name: 'Demon', category: 'elite-capable', worldIds: [2, 3, 4], firstStage: '2-5', role: 'Aggressive hunter',
    description: 'A horned hunter that closes distance faster than the common dead.', behavior: 'Fast melee pursuer with a heavy hit.', weakness: ['arcane'], resistance: ['fire'],
    combatTip: 'Use arcane firepower and keep an escape route open.',
  },
  imp: {
    id: 'imp', name: 'Exploding Imp', category: 'elite-capable', worldIds: [1, 4], firstStage: '1-5', role: 'Suicide attacker',
    description: 'A small, unstable fiend that turns a close approach into a blast.', behavior: 'Fast rush followed by an area explosion.', weakness: ['physical'], resistance: ['fire'],
    combatTip: 'Pick it off early; fire is a poor choice against its core.',
  },
};

export function getMonsterDefinition(id: EnemyKind | string): MonsterDefinition {
  return MONSTER_DEFINITIONS[id as EnemyKind] ?? MONSTER_DEFINITIONS.skeleton;
}

export const ALL_MONSTER_KINDS = Object.keys(MONSTER_DEFINITIONS) as EnemyKind[];
