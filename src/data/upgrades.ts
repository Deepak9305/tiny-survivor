import type { PassiveId, Rarity, UpgradeChoice, WeaponId } from '../types';
import { PASSIVE_BALANCE, WEAPON_BALANCE } from './balance';

export const UPGRADE_ORDER: Array<WeaponId | PassiveId> = [
  'magic-bolt', 'fire-orb', 'orbiting-blades', 'chain-lightning', 'power', 'vitality', 'swift-boots', 'magnet', 'focus', 'luck', 'growth', 'armor',
];

const rarityFor = (level: number): Rarity => level >= 4 ? 'epic' : level >= 2 ? 'rare' : 'common';

export function makeUpgradeChoice(id: string, weaponLevels: Record<string, number>, passiveLevels: Record<string, number>): UpgradeChoice {
  const isWeapon = id in WEAPON_BALANCE;
  const level = (isWeapon ? weaponLevels[id] : passiveLevels[id]) ?? 0;
  if (isWeapon) {
    const weapon = WEAPON_BALANCE[id as WeaponId];
    const effects: Record<string, string[]> = {
      'magic-bolt': ['+25% bolt damage', '+1 projectile', '-18% cooldown', '+1 pierce', '+35% bolt damage'],
      'fire-orb': ['+25% orb damage', '+1 orb', '+20% blast radius', '-20% cooldown', '+1 pierce'],
      'orbiting-blades': ['+1 blade', '+25% blade damage', '+15% orbit speed', '+1 blade', '+40% damage'],
      'chain-lightning': ['+1 chain', '+25% damage', '-20% cooldown', '+1 chain', 'shocks leave a spark'],
    };
    return {
      id,
      title: weapon.name,
      description: level === 0 ? 'Add a new automatic weapon.' : 'Improve this weapon.',
      nextEffect: effects[id][Math.min(level, 4)],
      icon: id === 'magic-bolt' ? '✦' : id === 'fire-orb' ? '◉' : id === 'orbiting-blades' ? '◈' : 'ϟ',
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
    description: 'A permanent run bonus.',
    nextEffect: effects[id as PassiveId][Math.min(level, 4)],
    icon: passive.icon,
    kind: 'passive',
    rarity: rarityFor(level),
    level,
  };
}

export function generateUpgradeChoices(weaponLevels: Record<string, number>, passiveLevels: Record<string, number>, count = 3): UpgradeChoice[] {
  const eligible = UPGRADE_ORDER.filter((id) => {
    const level = (id in WEAPON_BALANCE ? weaponLevels[id] : passiveLevels[id]) ?? 0;
    return level < 5;
  });
  const shifted = [...eligible].sort((a, b) => {
    const aLevel = (a in WEAPON_BALANCE ? weaponLevels[a] : passiveLevels[a]) ?? 0;
    const bLevel = (b in WEAPON_BALANCE ? weaponLevels[b] : passiveLevels[b]) ?? 0;
    return aLevel - bLevel;
  });
  const chosen: string[] = [];
  while (chosen.length < count && shifted.length) {
    const index = Math.floor(Math.random() * Math.min(shifted.length, 6));
    chosen.push(shifted.splice(index, 1)[0]);
  }
  return chosen.map((id) => makeUpgradeChoice(id, weaponLevels, passiveLevels));
}
