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
    name: 'Spooky Wizard',
    gender: 'non-binary',
    role: 'Robe tripper & laser spammer',
    description: 'Thinks he is super dark and mysterious. In reality, he trips over his own robe while blasting giant purple laser beams at terrified monsters.',
    price: 0,
    tone: 'blue',
    stats: { maxHpMultiplier: 0.88, specialDamageMultiplier: 1.25, specialCooldownMultiplier: 0.90, xpMultiplier: 1.10 },
    statBadges: ['88 HP', 'SPOOKY SCYTHE', '+25% LASER DMG', '-10% COOLDOWN'],
    strengths: ['Massive Fireball & Laser burst damage', 'Fast special ability recharge', 'Extra XP from shiny gems'],
    weaknesses: ['A bit squishy (-12% HP)', 'Melee swings require close cuddling'],
    weaponName: 'Spooky Scythe',
    traitName: 'Arcane Shenanigans',
    traitDescription: '+25% Special Damage, -10% Special Cooldown, +10% XP Gain, -12% Max HP.',
    requirement: 'STARTER BRAWLER',
  },
  warrior: {
    id: 'warrior',
    name: 'Sir Bonks-A-Lot',
    gender: 'male',
    role: 'Heavy bonker & spin-to-win master',
    description: 'Carries a massive hunk of sharpened iron. Solves 100% of life\'s problems by spinning in circles and whacking monsters on the noggin.',
    price: 1000,
    tone: 'gold',
    stats: {
      maxHpMultiplier: 1.30,
      armorBonus: 0.22,
      primaryDamageMultiplier: 1.20,
      primaryFireRateMultiplier: 1.04,
      moveSpeedMultiplier: 0.94,
      critChanceBonus: 0.02,
      specialDamageMultiplier: 0.78,
    },
    statBadges: ['130 HP', '+22% ARMOR', '+20% BONK DMG', 'WIDE SPIN'],
    strengths: ['Giant wide-arc sword cleave', 'Chonky health pool (+30% HP, +22% Armor)', 'Huge monster knockback'],
    weaknesses: ['Must get close and personal', 'Slightly slower waddle (-6% Speed)', 'Weaker magic spells'],
    weaponName: 'Mega Bonker Greatsword',
    traitName: 'Chonky Vanguard',
    traitDescription: '+30% Max HP, +22% Armor, +20% melee damage and a wide cleave. -6% Speed and -22% Special Damage.',
    requirement: '1,000 COINS',
  },
  monk: {
    id: 'monk',
    name: 'Master Slap',
    gender: 'male',
    role: 'Rapid slapper & zen snack eater',
    description: 'Achieved ultimate inner peace through the ancient art of high-speed slapping. Chants "Ommm" while delivering 500 slaps a minute.',
    price: 1600,
    tone: 'emerald',
    stats: { maxHpMultiplier: 1.25, armorBonus: 0.18, healMultiplier: 1.30, freezeDurationMultiplier: 1.15, allDamageMultiplier: 0.88, moveSpeedMultiplier: 0.95 },
    statBadges: ['125 HP', 'RAPID SLAPS', '+30% HEAL POWER', '+15% FREEZE TIME'],
    strengths: ['Blistering fast slapping speed', 'Super fast healing recovery (+30%)', 'Longer freeze duration on enemies'],
    weaknesses: ['Slightly lower base damage per slap (-12%)', 'Slightly slower jog (-5%)'],
    weaponName: '1,000 Slaps Flurry',
    traitName: 'Zen Slap Mastery',
    traitDescription: '+25% Max HP, +18% Armor, +30% Heal Power, +15% Freeze Duration, -12% All Damage.',
    requirement: '1,600 COINS',
  },
  gunslinger: {
    id: 'gunslinger',
    name: 'Pew-Pew Sally',
    gender: 'female',
    role: 'Dual-wielding chaos cowgirl',
    description: 'Why bother aiming when you have two sawed-offs and infinite buckshot? Loves rolling around and yelling "YEE-HAW!" at crowds.',
    price: 2200,
    tone: 'purple',
    stats: { primaryFireRateMultiplier: 1.18, projectileSpeedMultiplier: 1.15, moveSpeedMultiplier: 1.08, critChanceBonus: 0.08, maxHpMultiplier: 0.90, specialDamageMultiplier: 0.85, bonusProjectileEveryNShots: 6 },
    statBadges: ['90 HP', 'BUCKSHOT BLAST', '+8% CRIT', 'SPICY 6th SHOT'],
    strengths: ['Devastating rapid scatter blasts', 'Fast zoomy movement (+8% Speed)', 'Fires explosive spicy buckshot every 6th attack'],
    weaknesses: ['Smaller health bar (-10% HP)', 'Weaker magic bursts (-15%)'],
    weaponName: 'Dual Boom-Sticks',
    traitName: 'Point-Blank Gun-Fu',
    traitDescription: '+18% Fire Rate, +8% Move Speed, +8% Crit, fires an explosive incendiary shot every 6th attack.',
    requirement: '2,200 COINS',
  },
};

export const ALL_HERO_IDS: HeroId[] = ['shadow', 'warrior', 'monk', 'gunslinger'];

export function getHeroDefinition(id: string | undefined): HeroDefinition {
  if (id && id in HERO_DEFINITIONS) return HERO_DEFINITIONS[id as HeroId];
  return HERO_DEFINITIONS.shadow;
}
