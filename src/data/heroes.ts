import type { HeroId } from '../types';

export interface HeroStatModifiers {
  maxHpMultiplier?: number;
  armorBonus?: number;
  moveSpeedMultiplier?: number;
  pickupRadiusMultiplier?: number;
  primaryDamageMultiplier?: number;
  autoWeaponDamageMultiplier?: number;
  specialDamageMultiplier?: number;
  allDamageMultiplier?: number;
  primaryFireRateMultiplier?: number;
  primaryCooldownMultiplier?: number;
  specialCooldownMultiplier?: number;
  projectileSpeedMultiplier?: number;
  healMultiplier?: number;
  freezeDurationMultiplier?: number;
  critChanceBonus?: number;
  xpMultiplier?: number;
  bonusProjectileEveryNShots?: number;
}

export interface HeroDefinition {
  id: HeroId;
  name: string;
  gender: 'male' | 'female' | 'non-binary';
  role: string;
  description: string;
  price: number;
  tone: 'blue' | 'gold' | 'emerald' | 'purple';
  stats: HeroStatModifiers;
  statBadges: string[];
  strengths: string[];
  weaknesses: string[];
  weaponName: string;
  traitName: string;
  traitDescription: string;
  requirement: string;
}

export const HERO_DEFINITIONS: Record<HeroId, HeroDefinition> = {
  shadow: {
    id: 'shadow',
    name: 'Shadow Mage',
    gender: 'non-binary',
    role: 'Manual ability & spellcasting specialist',
    description: 'A master of the arcane arts who commands high-burst specials and accelerated cooldowns.',
    price: 0,
    tone: 'blue',
    stats: {
      maxHpMultiplier: 0.88,
      specialDamageMultiplier: 1.25,
      specialCooldownMultiplier: 0.90,
      xpMultiplier: 1.10,
    },
    statBadges: ['88 HP', '+25% SPECIAL DMG', '-10% SPECIAL CD', '+10% XP'],
    strengths: ['Massive Fireball and Arcane Beam damage', 'Faster special ability recharge', 'Accelerated level progression'],
    weaknesses: ['Lower base durability (-12% HP)', 'Sustained primary damage is unboosted'],
    weaponName: 'Magic Bolt',
    traitName: 'Arcane Mastery',
    traitDescription: '+25% Special Damage, -10% Special Cooldown, +10% XP Gain, -12% Max HP.',
    requirement: 'STARTER HERO',
  },
  warrior: {
    id: 'warrior',
    name: 'Warrior',
    gender: 'male',
    role: 'Aggressive frontline fighter & melee striker',
    description: 'A relentless combatant armed with pure martial prowess, high move speed, and lethal criticals.',
    price: 1000,
    tone: 'gold',
    stats: {
      primaryDamageMultiplier: 1.18,
      moveSpeedMultiplier: 1.10,
      critChanceBonus: 0.05,
      maxHpMultiplier: 1.05,
      specialDamageMultiplier: 0.85,
    },
    statBadges: ['105 HP', '+18% PRIMARY DMG', '+10% SPEED', '+5% CRIT'],
    strengths: ['High sustained primary damage (+18%)', 'Fast battle repositioning (+10% Move Speed)', 'Bonus critical strikes'],
    weaknesses: ['Reduced ability burst (-15% Special Damage)'],
    weaponName: 'Rune Blade Energy',
    traitName: 'Battle Hardened',
    traitDescription: '+18% Primary Attack Damage, +10% Move Speed, +5% Crit Chance, +5% Max HP, -15% Special Damage.',
    requirement: '1,000 COINS',
  },
  monk: {
    id: 'monk',
    name: 'Monk',
    gender: 'male',
    role: 'Defense, survivability & recovery specialist',
    description: 'A serene martial ascetic with deep reserves of vitality, natural damage reduction, and potent restorative powers.',
    price: 1600,
    tone: 'emerald',
    stats: {
      maxHpMultiplier: 1.25,
      armorBonus: 0.18,
      healMultiplier: 1.30,
      freezeDurationMultiplier: 1.15,
      allDamageMultiplier: 0.88,
      moveSpeedMultiplier: 0.95,
    },
    statBadges: ['125 HP', '+18% ARMOR', '+30% HEAL POWER', '+15% FREEZE TIME'],
    strengths: ['Highest base survivability (+25% HP, +18% Armor)', 'Significantly empowered healing (+30%)', 'Extended freeze crowd control'],
    weaknesses: ['Lower overall attack damage (-12%)', 'Slightly slower movement (-5%)'],
    weaponName: 'Chi Palm Projectile',
    traitName: 'Iron Body & Calm Mind',
    traitDescription: '+25% Max HP, +18% Armor, +30% Heal Effectiveness, +15% Freeze Duration, -12% All Damage.',
    requirement: '1,600 COINS',
  },
  gunslinger: {
    id: 'gunslinger',
    name: 'Gunslinger',
    gender: 'female',
    role: 'Rapid sustained DPS, fire-rate & crit specialist',
    description: 'An agile gunslinger wielding dual arcane pistols who riddles hordes with relentless volleys and high critical rates.',
    price: 2200,
    tone: 'purple',
    stats: {
      primaryFireRateMultiplier: 1.30,
      projectileSpeedMultiplier: 1.15,
      moveSpeedMultiplier: 1.08,
      critChanceBonus: 0.08,
      maxHpMultiplier: 0.90,
      specialDamageMultiplier: 0.85,
      bonusProjectileEveryNShots: 6,
    },
    statBadges: ['90 HP', '+30% FIRE RATE', '+15% PROJ SPEED', '+8% CRIT', '6th SHOT VOLLEY'],
    strengths: ['Rapid primary fire rate (+30%)', 'Every 6th shot unleashes a bonus arcane round', 'High mobility and critical rate'],
    weaknesses: ['Reduced health pool (-10% HP)', 'Weaker special ability burst (-15%)'],
    weaponName: 'Arcane Dual Pistols',
    traitName: 'Trick Shot Volley',
    traitDescription: '+30% Primary Fire Rate, +15% Bullet Speed, +8% Move Speed, +8% Crit, fires bonus shot every 6th shot.',
    requirement: '2,200 COINS',
  },
};

export const ALL_HERO_IDS: HeroId[] = ['shadow', 'warrior', 'monk', 'gunslinger'];

export function getHeroDefinition(id: string | undefined): HeroDefinition {
  if (id && id in HERO_DEFINITIONS) return HERO_DEFINITIONS[id as HeroId];
  return HERO_DEFINITIONS.shadow;
}
