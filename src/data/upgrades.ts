import type { AbilityId, PassiveId, Rarity, UpgradeChoice, WeaponId } from '../types';
import { ALL_ABILITY_IDS, makeAbilityUpgradeChoice } from './abilities';
import { PASSIVE_BALANCE, WEAPON_BALANCE } from './balance';

export const BASE_WEAPON_ORDER: WeaponId[] = [
  'magic-bolt',
  'orbiting-blades',
  'chain-lightning',
];

export const PASSIVE_ORDER: PassiveId[] = [
  'power',
  'vitality',
  'swift-boots',
  'magnet',
  'focus',
  'luck',
  'growth',
  'armor',
];

const rarityFor = (level: number): Rarity => (level >= 4 ? 'epic' : level >= 2 ? 'rare' : 'common');

export function makeUpgradeChoice(
  id: string,
  weaponLevels: Record<string, number>,
  passiveLevels: Record<string, number>,
  abilityLevels: Record<string, number> = {}
): UpgradeChoice {
  if (ALL_ABILITY_IDS.includes(id as AbilityId)) {
    const currentLvl = abilityLevels[id] ?? 1;
    return makeAbilityUpgradeChoice(id as AbilityId, currentLvl);
  }

  const isWeapon = id in WEAPON_BALANCE;
  const level = (isWeapon ? weaponLevels[id] : passiveLevels[id]) ?? 0;

  if (isWeapon) {
    const weapon = WEAPON_BALANCE[id as WeaponId];

    // Magic Bolt starts at level 1, so its copy is keyed to the CURRENT level
    // rather than sharing the level-0 auto-weapon acquisition table.
    if (id === 'magic-bolt') {
      const boltEffects: Record<number, string> = {
        1: '+10% fire rate · empowered shot every 4th volley',
        2: '+1 projectile · stronger empowered volleys',
        3: '+1 pierce · faster fire · empowered every 3rd volley',
        4: '+1 pierce · OVERDRIVE unlocks triple volleys',
      };
      return {
        id,
        title: weapon.name,
        description: 'Turn your primary attack into a relentless arcane barrage.',
        nextEffect: boltEffects[level] ?? '+25% bolt effectiveness',
        icon: '✦',
        kind: 'weapon',
        rarity: rarityFor(level),
        level,
      };
    }

    const effects: Record<string, string[]> = {
      'orbiting-blades': [
        '+1 orbiting blade',
        '+25% blade damage',
        '+15% orbit pressure',
        '+1 orbiting blade',
        '+40% blade damage',
      ],
      'chain-lightning': [
        'Unlock lightning chains',
        '+1 chain · faster proc',
        '+25% lightning damage',
        '+1 chain · faster proc',
        'Massive five-target storm',
      ],
    };

    return {
      id,
      title: weapon.name,
      description: level === 0 ? 'Add a new automatic weapon.' : 'Evolve this weapon into a stronger crowd-control tool.',
      nextEffect: effects[id]?.[Math.min(level, 4)] ?? '+20% effectiveness',
      icon: id === 'orbiting-blades' ? '◈' : 'ϟ',
      kind: 'weapon',
      rarity: rarityFor(level),
      level,
    };
  }

  const passive = PASSIVE_BALANCE[id as PassiveId];
  const effects: Record<PassiveId, string[]> = {
    power: ['+12% damage', '+24% damage', '+36% damage', '+50% damage', '+70% damage'],
    vitality: ['+15% max HP', '+30% max HP', '+45% max HP', '+65% max HP', '+90% max HP'],
    'swift-boots': ['+8% move speed', '+16% move speed', '+24% move speed', '+34% move speed', '+46% move speed'],
    magnet: ['+28 pickup range', '+56 pickup range', '+84 pickup range', '+120 pickup range', 'pull XP faster'],
    focus: ['-8% cooldowns', '-16% cooldowns', '-24% cooldowns', '-34% cooldowns', '-46% cooldowns'],
    luck: ['+4% crit chance', '+8% crit chance', '+12% crit chance', '+18% crit chance', '+25% crit chance'],
    growth: ['+10% XP gained', '+20% XP gained', '+30% XP gained', '+42% XP gained', '+58% XP gained'],
    armor: ['-8% damage taken', '-16% damage taken', '-24% damage taken', '-34% damage taken', '-46% damage taken'],
  };

  return {
    id,
    title: passive.name,
    description: 'Strengthen the build without adding another active control.',
    nextEffect: effects[id as PassiveId][Math.min(level, 4)],
    icon: passive.icon,
    kind: 'passive',
    rarity: rarityFor(level),
    level,
  };
}

export function generateUpgradeChoices(
  weaponLevels: Record<string, number>,
  passiveLevels: Record<string, number>,
  abilityLevels: Record<string, number> = {},
  unlockedAbilities: AbilityId[] = [],
  count = 3
): UpgradeChoice[] {
  const eligibleIds: string[] = [];

  for (const weaponId of BASE_WEAPON_ORDER) {
    const lvl = weaponLevels[weaponId] ?? 0;
    if (lvl < 5) eligibleIds.push(weaponId);
  }

  for (const abilityId of unlockedAbilities) {
    const lvl = abilityLevels[abilityId] ?? 1;
    if (lvl < 5) eligibleIds.push(abilityId);
  }

  for (const passiveId of PASSIVE_ORDER) {
    const lvl = passiveLevels[passiveId] ?? 0;
    if (lvl < 5) eligibleIds.push(passiveId);
  }

  const getItemLevel = (id: string): number => {
    if (ALL_ABILITY_IDS.includes(id as AbilityId)) return abilityLevels[id] ?? 1;
    if (id in WEAPON_BALANCE) return weaponLevels[id] ?? 0;
    return passiveLevels[id] ?? 0;
  };

  // Keep early choices varied while still helping under-leveled parts of the build
  // catch up. A small random window avoids deterministic, solved runs.
  const shifted = [...eligibleIds].sort((a, b) => getItemLevel(a) - getItemLevel(b));
  const chosen: string[] = [];

  while (chosen.length < count && shifted.length) {
    const index = Math.floor(Math.random() * Math.min(shifted.length, 6));
    chosen.push(shifted.splice(index, 1)[0]);
  }

  return chosen.map((choiceId) => makeUpgradeChoice(choiceId, weaponLevels, passiveLevels, abilityLevels));
}
