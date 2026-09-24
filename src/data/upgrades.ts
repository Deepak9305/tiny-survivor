import type { AbilityId, PassiveId, Rarity, UpgradeChoice, WeaponId } from '../types';
import { ALL_ABILITY_IDS, makeAbilityUpgradeChoice } from './abilities';
import { PASSIVE_BALANCE, WEAPON_BALANCE } from './balance';

export const BASE_WEAPON_ORDER: WeaponId[] = [
  'magic-bolt',
  'orbiting-blades',
  'chain-lightning',
  'fire-orb',
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

    // Primary Melee Strike starts at level 1, so its copy is keyed to the CURRENT level
    // rather than sharing the level-0 auto-weapon acquisition table.
    if (id === 'magic-bolt') {
      const strikeEffects: Record<number, string> = {
        1: '+12% swing speed · wider bonk arc ⚔️',
        2: '+18% reach & radius · mega stagger knockback 💥',
        3: '+24% bonk damage · empowered every 3rd swing ⚡',
        4: '+30% damage · OVERDRIVE unleashes hyperspeed flurries 🌪️',
      };
      return {
        id,
        title: 'Giant Bonker',
        description: 'Whack monsters right on the noggin with massive cleaves and knockback.',
        nextEffect: strikeEffects[level] ?? '+25% bonk effectiveness 🔨',
        icon: '⚔',
        kind: 'weapon',
        rarity: rarityFor(level),
        level,
      };
    }

    const effects: Record<string, string[]> = {
      'orbiting-blades': [
        '+1 fidget blade 🌀',
        '+25% blade slice damage 🗡️',
        '+15% faster spinny speed ⚡',
        '+1 extra fidget blade 🌀',
        '+40% mega blade carnage 💥',
      ],
      'chain-lightning': [
        'Unlock Zap-O-Matic ⚡',
        '+1 lightning chain target ϟ',
        '+25% electric shock damage ⚡',
        '+1 lightning chain target ϟ',
        'Five-target thunderstorm chaos 🌩️',
      ],
      'fire-orb': [
        'Hurl spicy flaming meatballs 🔥',
        '+30% bigger spicy blast 💣',
        '+1 spicy meatball per volley ☄️',
        '+35% fire explosion damage 💥',
        'Infernal triple giant meatball barrage! ☄️',
      ],
    };

    return {
      id,
      title: weapon.name,
      description: level === 0 ? `Equip ${weapon.name} to zap and clobber mobs.` : `Upgrade ${weapon.name} for maximum chaos.`,
      nextEffect: effects[id]?.[Math.min(level, 4)] ?? '+20% power ⚡',
      icon: id === 'orbiting-blades' ? '◈' : id === 'chain-lightning' ? 'ϟ' : '🔥',
      kind: 'weapon',
      rarity: rarityFor(level),
      level,
    };
  }

  const passive = PASSIVE_BALANCE[id as PassiveId];
  const effects: Record<PassiveId, string[]> = {
    power: ['+12% damage 💪', '+24% damage 🔥', '+36% damage 💥', '+50% damage ⚡', '+70% GIGA DAMAGE 👑'],
    vitality: ['+15% max HP ❤️', '+30% max HP 🍖', '+45% max HP 🥩', '+65% max HP 🛡️', '+90% CHONK GOD 👑'],
    'swift-boots': ['+8% speed 👟', '+16% speed 🏃', '+24% speed 💨', '+34% speed ⚡', '+46% HYPERSPEED 🚀'],
    magnet: ['+28 pickup range 🧲', '+56 pickup range 🧲', '+84 pickup range ✨', '+120 pickup range 🌀', 'Instant XP Vacuum! 🌟'],
    focus: ['-8% cooldowns ⏱️', '-16% cooldowns ⚡', '-24% cooldowns ☕', '-34% cooldowns 🚀', '-46% TURBO SPAM 👑'],
    luck: ['+4% crit chance 🍀', '+8% crit chance 🎲', '+12% crit chance 🎯', '+18% crit chance 💥', '+25% CRIT BONANZA 👑'],
    growth: ['+10% XP gain 🧠', '+20% XP gain 📚', '+30% XP gain 🎓', '+42% XP gain 🌟', '+58% GALAXY BRAIN 👑'],
    armor: ['-8% damage taken 🛡️', '-16% damage taken 🛡️', '-24% damage taken 🧱', '-34% damage taken 💎', '-46% TITANIUM SUIT 👑'],
  };

  return {
    id,
    title: passive.name,
    description: `Boost ${passive.name} across your entire build.`,
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
