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
    id: 'skeleton-king', name: 'King Calcium', hp: 2400, damage: 26, speed: 32, radius: 42, worldId: 1,
    weakness: ['physical'], resistance: [], attackSet: ['slam', 'bone-ring', 'summon', 'charge'], phaseThreshold: 0.5,
    visualTheme: 'bone', description: 'Lord of bad posture and 100% fortified calcium. Wears a slightly crooked crown.', summonKind: 'skeleton',
  },
  'forest-witch': {
    id: 'forest-witch', name: 'Wicked Broccoli', hp: 3100, damage: 28, speed: 40, radius: 38, worldId: 2,
    weakness: ['fire'], resistance: ['lightning'], attackSet: ['thorn-circle', 'spirit-volley', 'summon', 'blink'], phaseThreshold: 0.5,
    visualTheme: 'forest', description: 'A grumpy salad witch who is furious that you didn\'t eat your green vegetables.', summonKind: 'ghost',
  },
  'frost-golem': {
    id: 'frost-golem', name: 'Big Chilly', hp: 3900, damage: 32, speed: 24, radius: 48, worldId: 3,
    weakness: ['fire'], resistance: ['physical'], attackSet: ['ground-slam', 'ice-shard-fan', 'frost-zones', 'charge'], phaseThreshold: 0.5,
    visualTheme: 'frost', description: 'An angry walking glacier who gives giant freezing high-fives whether you want them or not.', summonKind: 'ghost',
  },
  'demon-lord': {
    id: 'demon-lord', name: 'Lord Spicy Pants', hp: 5200, damage: 38, speed: 36, radius: 46, worldId: 4,
    weakness: ['arcane'], resistance: ['fire'], attackSet: ['fire-wave', 'meteor', 'demon-charge'], phaseThreshold: 0.5,
    visualTheme: 'infernal', description: 'Sovereign of the lava keep. Extremely cranky because his palace has zero air conditioning.', summonKind: 'imp',
  },
};

export function getBossDefinition(id: BossId | string | undefined): BossDefinition | undefined {
  return id && id in BOSS_DEFINITIONS ? BOSS_DEFINITIONS[id as BossId] : undefined;
}
