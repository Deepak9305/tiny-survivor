import type { DamageType, EnemyKind, PassiveId, WeaponId } from '../types';

export const PLAYER_BALANCE = {
  maxHp: 100,
  armor: 0,
  moveSpeed: 148,
  pickupRadius: 104,
  damage: 22,
  cooldown: 0.92,
  critChance: 0.05,
  critMultiplier: 1.65,
  xpMultiplier: 1,
} as const;

export const WEAPON_BALANCE: Record<WeaponId, { name: string; baseDamage: number; cooldown: number; color: number; damageType: DamageType }> = {
  'magic-bolt': { name: 'Magic Bolt', baseDamage: 22, cooldown: 0.92, color: 0x5ddcff, damageType: 'arcane' },
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
  skeleton: { name: 'Skeleton', hp: 44, damage: 9, speed: 43, radius: 15, xp: 10, color: 0xb8c2d1, minTime: 0 },
  bat: { name: 'Bat', hp: 25, damage: 7, speed: 72, radius: 12, xp: 12, color: 0xa568c7, minTime: 12 },
  slime: { name: 'Slime', hp: 88, damage: 13, speed: 30, radius: 20, xp: 18, color: 0x5bd19a, minTime: 22 },
  ghost: { name: 'Ghost', hp: 55, damage: 11, speed: 38, radius: 17, xp: 20, color: 0x9bdcff, minTime: 38 },
  archer: { name: 'Skeleton Archer', hp: 52, damage: 14, speed: 34, radius: 16, xp: 22, color: 0xd39d63, minTime: 45, preferredDistance: 176 },
  knight: { name: 'Cursed Knight', hp: 160, damage: 20, speed: 24, radius: 23, xp: 35, color: 0x788ea8, minTime: 64 },
  demon: { name: 'Demon', hp: 110, damage: 20, speed: 48, radius: 19, xp: 30, color: 0xe46968, minTime: 70 },
  imp: { name: 'Exploding Imp', hp: 70, damage: 24, speed: 62, radius: 16, xp: 28, color: 0xf18a57, minTime: 82 },
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
