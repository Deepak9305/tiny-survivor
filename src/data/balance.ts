import type { DamageType, EnemyKind, PassiveId, WeaponId } from '../types';

export const PLAYER_BALANCE = {
  maxHp: 100,
  armor: 0,
  moveSpeed: 148,
  pickupRadius: 104,
  damage: 22,
  cooldown: 0.68,
  critChance: 0.05,
  critMultiplier: 1.65,
  xpMultiplier: 1,
} as const;

export const WEAPON_BALANCE: Record<WeaponId, { name: string; baseDamage: number; cooldown: number; color: number; damageType: DamageType }> = {
  'magic-bolt': { name: 'Magic Bolt', baseDamage: 22, cooldown: 0.68, color: 0x5ddcff, damageType: 'arcane' },
  'fire-orb': { name: 'Fire Orb', baseDamage: 28, cooldown: 2.7, color: 0xff9c47, damageType: 'fire' },
  'orbiting-blades': { name: 'Orbiting Blades', baseDamage: 18, cooldown: 0.7, color: 0xc9ddff, damageType: 'physical' },
  'chain-lightning': { name: 'Chain Lightning', baseDamage: 34, cooldown: 3.4, color: 0x9f8cff, damageType: 'lightning' },
};

export const PASSIVE_BALANCE: Record<PassiveId, { name: string; icon: string; maxLevel: number }> = {
  power: { name: 'Power', icon: '✦', maxLevel: 5 },
  vitality: { name: 'Vitality', icon: '♥', maxLevel: 5 },
  'swift-boots': { name: 'Swift Boots', icon: '➜', maxLevel: 5 },
  magnet: { name: 'Magnet', icon: '⌁', maxLevel: 5 },
  focus: { name: 'Focus', icon: '◎', maxLevel: 5 },
  luck: { name: 'Luck', icon: '◇', maxLevel: 5 },
  growth: { name: 'Growth', icon: '↗', maxLevel: 5 },
  armor: { name: 'Armor', icon: '◆', maxLevel: 5 },
};

export const ENEMY_BALANCE: Record<EnemyKind, {
  name: string;
  hp: number;
  damage: number;
  speed: number;
  radius: number;
  xp: number;
  color: number;
  minTime: number;
  preferredDistance?: number;
}> = {
  skeleton: { name: 'Skeleton', hp: 54, damage: 10, speed: 46, radius: 15, xp: 12, color: 0xb8c2d1, minTime: 0 },
  zombie: { name: 'Grave Zombie', hp: 105, damage: 15, speed: 31, radius: 21, xp: 24, color: 0x718f69, minTime: 8 },
  'bone-mage': { name: 'Bone Mage', hp: 72, damage: 18, speed: 34, radius: 17, xp: 29, color: 0xb98cff, minTime: 20, preferredDistance: 225 },
  bat: { name: 'Bat', hp: 30, damage: 8, speed: 80, radius: 12, xp: 13, color: 0xa568c7, minTime: 14 },
  slime: { name: 'Slime', hp: 102, damage: 14, speed: 33, radius: 20, xp: 21, color: 0x5bd19a, minTime: 0 },
  ghost: { name: 'Ghost', hp: 64, damage: 12, speed: 45, radius: 17, xp: 22, color: 0x9bdcff, minTime: 34 },
  archer: { name: 'Skeleton Archer', hp: 62, damage: 15, speed: 37, radius: 16, xp: 25, color: 0xd39d63, minTime: 28, preferredDistance: 190 },
  'cursed-wolf': { name: 'Cursed Wolf', hp: 68, damage: 15, speed: 74, radius: 16, xp: 22, color: 0x854d0e, minTime: 0 },
  thornling: { name: 'Thornling', hp: 56, damage: 13, speed: 40, radius: 14, xp: 20, color: 0x65a30d, minTime: 14, preferredDistance: 175 },
  'forest-mage': { name: 'Briar Witch', hp: 82, damage: 18, speed: 34, radius: 18, xp: 30, color: 0x9b6bd6, minTime: 22, preferredDistance: 215 },
  'forest-guardian': { name: 'Forest Guardian', hp: 182, damage: 22, speed: 30, radius: 24, xp: 40, color: 0x4d7c3b, minTime: 26 },
  treant: { name: 'Treant', hp: 205, damage: 23, speed: 22, radius: 25, xp: 44, color: 0x3f6212, minTime: 34 },
  knight: { name: 'Cursed Knight', hp: 175, damage: 21, speed: 29, radius: 23, xp: 39, color: 0x788ea8, minTime: 0 },
  'frost-wraith': { name: 'Frost Wraith', hp: 92, damage: 19, speed: 58, radius: 18, xp: 35, color: 0x38bdf8, minTime: 18 },
  'ice-mage': { name: 'Ice Magus', hp: 98, damage: 21, speed: 35, radius: 18, xp: 36, color: 0x7dd3fc, minTime: 20, preferredDistance: 225 },
  demon: { name: 'Demon', hp: 124, damage: 21, speed: 53, radius: 19, xp: 33, color: 0xe46968, minTime: 0 },
  'demon-warrior': { name: 'Hellguard', hp: 220, damage: 27, speed: 36, radius: 25, xp: 48, color: 0xb93d45, minTime: 22 },
  imp: { name: 'Exploding Imp', hp: 78, damage: 25, speed: 67, radius: 16, xp: 30, color: 0xf18a57, minTime: 18 },
};

export const getXPRequired = (level: number): number => Math.round(48 + Math.pow(level, 1.22) * 22);

export const getPermanentUpgradeCost = (id: string, level: number): number => {
  const base: Record<string, number> = {
    maxHp: 160,
    damage: 180,
    moveSpeed: 150,
    magnet: 130,
    xpGain: 200,
    critChance: 240,
    armor: 220,
  };
  return Math.round((base[id] ?? 180) * Math.pow(1.38, level));
};
