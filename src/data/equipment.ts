import type { EquipmentId, EquipmentSlot, HeroStatModifiers } from '../types';

export interface EquipmentDefinition {
  id: EquipmentId;
  name: string;
  slot: EquipmentSlot;
  rarity: 'common' | 'rare' | 'epic';
  description: string;
  shortEffect: string;
  price: number;
  stats: HeroStatModifiers;
  bossDropFrom?: string; // bossId if deterministic first clear reward
  accentColor: number;
  icon: string;
}

export const EQUIPMENT_DEFINITIONS: Record<EquipmentId, EquipmentDefinition> = {
  // --- ARMOR ---
  'bone-guard': {
    id: 'bone-guard',
    name: 'Bone Guard',
    slot: 'armor',
    rarity: 'common',
    description: 'Forged from hardened skeletal remnants. Bolsters total health and deflects minor blows.',
    shortEffect: '+12% Max HP, +6% Armor',
    price: 450,
    stats: {
      maxHpMultiplier: 1.12,
      armorBonus: 0.06,
    },
    bossDropFrom: 'skeleton-king',
    accentColor: 0xd5dde5,
    icon: '🛡️',
  },
  'hunter-coat': {
    id: 'hunter-coat',
    name: 'Hunter Coat',
    slot: 'armor',
    rarity: 'rare',
    description: 'Lightweight leather treated with nocturnal stealth oils. Enhances mobility and critical focus.',
    shortEffect: '+8% Movement, +4% Crit',
    price: 550,
    stats: {
      moveSpeedMultiplier: 1.08,
      critChanceBonus: 0.04,
    },
    accentColor: 0xa3e635,
    icon: '🥋',
  },
  'frost-plate': {
    id: 'frost-plate',
    name: 'Frost Plate',
    slot: 'armor',
    rarity: 'rare',
    description: 'Heavy glacial plating that shields against savage strikes at the expense of foot speed.',
    shortEffect: '+14% Armor, -4% Movement',
    price: 650,
    stats: {
      armorBonus: 0.14,
      moveSpeedMultiplier: 0.96,
    },
    accentColor: 0x67e8f9,
    icon: '❄️',
  },

  // --- RELICS ---
  'arcane-crystal': {
    id: 'arcane-crystal',
    name: 'Arcane Crystal',
    slot: 'relic',
    rarity: 'common',
    description: 'A humming sapphire stone that supercharges active special ability damage.',
    shortEffect: '+12% Special Ability Damage',
    price: 500,
    stats: {
      specialDamageMultiplier: 1.12,
    },
    accentColor: 0x60a5fa,
    icon: '💎',
  },
  'berserker-fang': {
    id: 'berserker-fang',
    name: 'Berserker Fang',
    slot: 'relic',
    rarity: 'rare',
    description: 'An ancient predator fang that fuels aggressive primary attacks while slightly reducing health.',
    shortEffect: '+15% Primary Damage, -8% HP',
    price: 600,
    stats: {
      primaryDamageMultiplier: 1.15,
      maxHpMultiplier: 0.92,
    },
    accentColor: 0xf87171,
    icon: '🩸',
  },
  'frost-rune': {
    id: 'frost-rune',
    name: 'Frost Rune',
    slot: 'relic',
    rarity: 'rare',
    description: 'Carved with eternal permafrost glyphs. Extends freeze duration and hastens freeze recovery.',
    shortEffect: '+20% Freeze Duration, -10% Freeze CD',
    price: 700,
    stats: {
      freezeDurationMultiplier: 1.20,
      specialCooldownMultiplier: 0.90,
    },
    bossDropFrom: 'frost-golem',
    accentColor: 0x38bdf8,
    icon: '💠',
  },
  'demon-seal': {
    id: 'demon-seal',
    name: 'Demon Seal',
    slot: 'relic',
    rarity: 'epic',
    description: 'A forbidden crest torn from the Demon King. Bestows devastating power and critical strikes.',
    shortEffect: '+10% All Damage, +5% Crit',
    price: 900,
    stats: {
      allDamageMultiplier: 1.10,
      critChanceBonus: 0.05,
    },
    bossDropFrom: 'demon-lord',
    accentColor: 0xf43f5e,
    icon: '🔥',
  },

  // --- CHARMS ---
  'lucky-coin': {
    id: 'lucky-coin',
    name: 'Lucky Coin',
    slot: 'charm',
    rarity: 'common',
    description: 'A polished gold talisman blessed by fortune, raising the chance of critical strikes.',
    shortEffect: '+5% Crit Chance',
    price: 400,
    stats: {
      critChanceBonus: 0.05,
    },
    accentColor: 0xfacc15,
    icon: '🪙',
  },
  'magnet-charm': {
    id: 'magnet-charm',
    name: 'Magnet Charm',
    slot: 'charm',
    rarity: 'common',
    description: 'Emits a persistent magnetic pull that draws scattered experience gems from farther away.',
    shortEffect: '+25% Pickup Radius',
    price: 450,
    stats: {
      pickupRadiusMultiplier: 1.25,
    },
    accentColor: 0xc084fc,
    icon: '🧲',
  },
  'healing-totem': {
    id: 'healing-totem',
    name: 'Healing Totem',
    slot: 'charm',
    rarity: 'rare',
    description: 'A spiritual wooden carving that amplifies all regenerative pulses and healing effects.',
    shortEffect: '+15% Heal Effectiveness',
    price: 500,
    stats: {
      healMultiplier: 1.15,
    },
    accentColor: 0x4ade80,
    icon: '🌿',
  },

  // --- PETS ---
  'bat-familiar': {
    id: 'bat-familiar',
    name: 'Bat Familiar',
    slot: 'pet',
    rarity: 'rare',
    description: 'A loyal nocturnal companion that flutters beside you and periodically strikes nearby enemies.',
    shortEffect: 'Strikes nearby foes every 4.5s',
    price: 750,
    stats: {},
    accentColor: 0xa855f7,
    icon: '🦇',
  },
  'spirit-fox': {
    id: 'spirit-fox',
    name: 'Spirit Fox',
    slot: 'pet',
    rarity: 'rare',
    description: 'An ethereal woodland spirit that follows your footsteps and guides dropped gems toward you.',
    shortEffect: '+25% Pickup Radius, Follower',
    price: 650,
    stats: {
      pickupRadiusMultiplier: 1.25,
    },
    bossDropFrom: 'forest-witch',
    accentColor: 0x34d399,
    icon: '🦊',
  },
  'tiny-golem': {
    id: 'tiny-golem',
    name: 'Tiny Golem',
    slot: 'pet',
    rarity: 'rare',
    description: 'A resilient animated stone cub that marches loyally at your side, granting steady armor protection.',
    shortEffect: '+10% Armor Bonus, Follower',
    price: 700,
    stats: {
      armorBonus: 0.10,
    },
    accentColor: 0x94a3b8,
    icon: '🗿',
  },
  fairy: {
    id: 'fairy',
    name: 'Fairy',
    slot: 'pet',
    rarity: 'epic',
    description: 'A radiant winged nymph that hovers beside the hero and periodically casts a restorative soothing light.',
    shortEffect: 'Restores 6 HP every 25s, Follower',
    price: 800,
    stats: {},
    accentColor: 0xf472b6,
    icon: '🧚',
  },
};

export const ALL_EQUIPMENT_IDS = Object.keys(EQUIPMENT_DEFINITIONS) as EquipmentId[];

export function getEquipmentDefinition(id: EquipmentId | string | undefined): EquipmentDefinition | undefined {
  if (id && id in EQUIPMENT_DEFINITIONS) return EQUIPMENT_DEFINITIONS[id as EquipmentId];
  return undefined;
}

export function getEquipmentBySlot(slot: EquipmentSlot): EquipmentDefinition[] {
  return ALL_EQUIPMENT_IDS.map((id) => EQUIPMENT_DEFINITIONS[id]).filter((item) => item.slot === slot);
}

export const BOSS_FIRST_CLEAR_EQUIPMENT: Record<string, EquipmentId> = {
  '1-5': 'bone-guard',
  '2-5': 'spirit-fox',
  '3-5': 'frost-rune',
  '4-5': 'demon-seal',
};

export function getBossFirstClearEquipment(stageId: string): EquipmentId | undefined {
  return BOSS_FIRST_CLEAR_EQUIPMENT[stageId];
}
