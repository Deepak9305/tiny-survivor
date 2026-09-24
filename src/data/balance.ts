import type { DamageType, EnemyKind, PassiveId, WeaponId } from '../types';

export const PLAYER_BALANCE = {
  maxHp: 100,
  armor: 0,
  moveSpeed: 156,
  pickupRadius: 116,
  damage: 24,
  cooldown: 0.62,
  critChance: 0.06,
  critMultiplier: 1.70,
  xpMultiplier: 1,
} as const;

export const WEAPON_BALANCE: Record<WeaponId, { name: string; baseDamage: number; cooldown: number; color: number; damageType: DamageType }> = {
  'magic-bolt': { name: 'Giant Bonker', baseDamage: 18, cooldown: 0.70, color: 0xffd166, damageType: 'physical' },
  'fire-orb': { name: 'Spicy Meatballs', baseDamage: 28, cooldown: 2.8, color: 0xff9c47, damageType: 'fire' },
  'orbiting-blades': { name: 'Fidget Blades', baseDamage: 18, cooldown: 0.75, color: 0xc9ddff, damageType: 'physical' },
  'chain-lightning': { name: 'Zap-O-Matic 3000', baseDamage: 32, cooldown: 3.4, color: 0x9f8cff, damageType: 'lightning' },
};

export const PASSIVE_BALANCE: Record<PassiveId, { name: string; icon: string; maxLevel: number }> = {
  power: { name: 'Spicy Muscles', icon: '✦', maxLevel: 5 },
  vitality: { name: 'Chonky Health', icon: '♥', maxLevel: 5 },
  'swift-boots': { name: 'Zoomer Shoes', icon: '➜', maxLevel: 5 },
  magnet: { name: 'Shiny Vacuum', icon: '⌁', maxLevel: 5 },
  focus: { name: 'Caffeine Rush', icon: '◎', maxLevel: 5 },
  luck: { name: 'Lucky Clover', icon: '◇', maxLevel: 5 },
  growth: { name: 'Big Brain XP', icon: '↗', maxLevel: 5 },
  armor: { name: 'Bubble Wrap', icon: '◆', maxLevel: 5 },
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
  skeleton: { name: 'Skeleton', hp: 56, damage: 11, speed: 84, radius: 15, xp: 12, color: 0xb8c2d1, minTime: 0 },
  zombie: { name: 'Grave Zombie', hp: 115, damage: 16, speed: 64, radius: 21, xp: 24, color: 0x718f69, minTime: 8 },
  'bone-mage': { name: 'Bone Mage', hp: 76, damage: 19, speed: 76, radius: 17, xp: 29, color: 0xb98cff, minTime: 20, preferredDistance: 225 },
  bat: { name: 'Bat', hp: 34, damage: 10, speed: 136, radius: 12, xp: 13, color: 0xa568c7, minTime: 14 },
  slime: { name: 'Slime', hp: 110, damage: 15, speed: 70, radius: 20, xp: 21, color: 0x5bd19a, minTime: 0 },
  ghost: { name: 'Ghost', hp: 72, damage: 14, speed: 94, radius: 17, xp: 22, color: 0x9bdcff, minTime: 34 },
  archer: { name: 'Skeleton Archer', hp: 68, damage: 17, speed: 82, radius: 16, xp: 25, color: 0xd39d63, minTime: 28, preferredDistance: 190 },
  'cursed-wolf': { name: 'Cursed Wolf', hp: 74, damage: 18, speed: 140, radius: 16, xp: 22, color: 0x854d0e, minTime: 0 },
  thornling: { name: 'Thornling', hp: 62, damage: 15, speed: 78, radius: 14, xp: 20, color: 0x65a30d, minTime: 14, preferredDistance: 175 },
  'forest-mage': { name: 'Briar Witch', hp: 88, damage: 20, speed: 76, radius: 18, xp: 30, color: 0x9b6bd6, minTime: 22, preferredDistance: 215 },
  'forest-guardian': { name: 'Forest Guardian', hp: 210, damage: 25, speed: 68, radius: 24, xp: 40, color: 0x4d7c3b, minTime: 26 },
  treant: { name: 'Treant', hp: 240, damage: 26, speed: 56, radius: 25, xp: 44, color: 0x3f6212, minTime: 34 },
  knight: { name: 'Cursed Knight', hp: 205, damage: 24, speed: 74, radius: 23, xp: 39, color: 0x788ea8, minTime: 0 },
  'frost-wraith': { name: 'Frost Wraith', hp: 104, damage: 22, speed: 116, radius: 18, xp: 35, color: 0x38bdf8, minTime: 18 },
  'ice-mage': { name: 'Ice Magus', hp: 112, damage: 23, speed: 78, radius: 18, xp: 36, color: 0x7dd3fc, minTime: 20, preferredDistance: 225 },
  demon: { name: 'Demon', hp: 142, damage: 25, speed: 104, radius: 19, xp: 33, color: 0xe46968, minTime: 0 },
  'demon-warrior': { name: 'Hellguard', hp: 265, damage: 30, speed: 88, radius: 25, xp: 48, color: 0xb93d45, minTime: 22 },
  imp: { name: 'Exploding Imp', hp: 84, damage: 26, speed: 108, radius: 16, xp: 30, color: 0xf18a57, minTime: 18 },
};

export const getXPRequired = (level: number): number => {
  if (level === 1) return 24;
  if (level === 2) return 48;
  if (level === 3) return 80;
  return Math.round(40 + Math.pow(level, 1.25) * 22);
};

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
