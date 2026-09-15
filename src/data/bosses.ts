import type { BossAttack, BossId, DamageType, EnemyKind } from '../types';

export interface BossDefinition {
  id: BossId;
  name: string;
  hp: number;
  damage: number;
  speed: number;
  radius: number;
  worldId: number;
  weakness: DamageType[];
  resistance: DamageType[];
  attackSet: BossAttack[];
  phaseThreshold: number;
  visualTheme: 'bone' | 'forest' | 'frost' | 'infernal';
  description: string;
  summonKind: EnemyKind;
}

export const BOSS_DEFINITIONS: Record<BossId, BossDefinition> = {
  'skeleton-king': {
    id: 'skeleton-king', name: 'Skeleton King', hp: 1800, damage: 24, speed: 30, radius: 42, worldId: 1,
    weakness: ['physical'], resistance: [], attackSet: ['slam', 'bone-ring', 'summon', 'charge'], phaseThreshold: 0.5,
    visualTheme: 'bone', description: 'The crowned dead command every grave in the first world.', summonKind: 'skeleton',
  },
  'forest-witch': {
    id: 'forest-witch', name: 'Forest Witch', hp: 2100, damage: 23, speed: 38, radius: 38, worldId: 2,
    weakness: ['fire'], resistance: ['lightning'], attackSet: ['thorn-circle', 'spirit-volley', 'summon', 'blink'], phaseThreshold: 0.5,
    visualTheme: 'forest', description: 'A corrupted spirit that turns roots and memories against intruders.', summonKind: 'ghost',
  },
  'frost-golem': {
    id: 'frost-golem', name: 'Frost Golem', hp: 2500, damage: 29, speed: 22, radius: 48, worldId: 3,
    weakness: ['fire'], resistance: ['physical'], attackSet: ['ground-slam', 'ice-shard-fan', 'frost-zones', 'charge'], phaseThreshold: 0.5,
    visualTheme: 'frost', description: 'An ancient guardian assembled from frozen temple stone.', summonKind: 'ghost',
  },
  'demon-lord': {
    id: 'demon-lord', name: 'Demon King', hp: 3200, damage: 34, speed: 34, radius: 46, worldId: 4,
    weakness: ['arcane'], resistance: ['fire'], attackSet: ['fire-wave', 'meteor', 'demon-charge'], phaseThreshold: 0.5,
    visualTheme: 'infernal', description: 'The sovereign of the burning keep who summons spectral echoes of conquered rulers.', summonKind: 'imp',
  },
};

export function getBossDefinition(id: BossId | string | undefined): BossDefinition | undefined {
  return id && id in BOSS_DEFINITIONS ? BOSS_DEFINITIONS[id as BossId] : undefined;
}
