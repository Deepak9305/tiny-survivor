import { PLAYER_BALANCE } from './balance';
import { getEquipmentDefinition } from './equipment';
import { getHeroDefinition } from './heroes';
import type { HeroId, HeroLoadout, HeroStatModifiers } from '../types';

export interface ResolvedPlayerStats {
  maxHp: number;
  armor: number;
  moveSpeed: number;
  pickupRadius: number;
  primaryDamage: number;
  primaryCooldown: number;
  critChance: number;
  critMultiplier: number;
  xpMultiplier: number;

  primaryDamageMultiplier: number;
  autoWeaponDamageMultiplier: number;
  specialDamageMultiplier: number;
  allDamageMultiplier: number;
  primaryFireRateMultiplier: number;
  primaryCooldownMultiplier: number;
  projectileSpeedMultiplier: number;
  specialCooldownMultiplier: number;
  healMultiplier: number;
  freezeDurationMultiplier: number;
  bonusProjectileEveryNShots: number;
  equippedPet?: string;
}

export function resolvePlayerStats(
  heroId: HeroId | string = 'shadow',
  loadout?: HeroLoadout,
  permanentUpgrades: Record<string, number> = {}
): ResolvedPlayerStats {
  const heroDef = getHeroDefinition(heroId);

  // 1. Gather all stat modifiers from hero and equipped items
  const modifierList: HeroStatModifiers[] = [heroDef.stats];

  if (loadout) {
    for (const slot of ['armor', 'relic', 'pet', 'charm'] as const) {
      const eqId = loadout[slot];
      if (eqId) {
        const eqDef = getEquipmentDefinition(eqId);
        if (eqDef) {
          modifierList.push(eqDef.stats);
        }
      }
    }
  }

  // 2. Aggregate multipliers and flat additions
  let maxHpMult = 1.0;
  let armorAdd = 0.0;
  let moveSpeedMult = 1.0;
  let pickupRadiusMult = 1.0;
  let primaryDamageMult = 1.0;
  let autoWeaponDamageMult = 1.0;
  let specialDamageMult = 1.0;
  let allDamageMult = 1.0;
  let primaryFireRateMult = 1.0;
  let primaryCooldownMult = 1.0;
  let specialCooldownMult = 1.0;
  let projectileSpeedMult = 1.0;
  let healMult = 1.0;
  let freezeDurationMult = 1.0;
  let critChanceAdd = 0.0;
  let xpMult = 1.0;
  let bonusEveryN = 0;

  // Apply permanent upgrades
  const permMaxHp = permanentUpgrades.maxHp ?? 0;
  maxHpMult += permMaxHp * 0.10;

  const permDamage = permanentUpgrades.damage ?? 0;
  allDamageMult += permDamage * 0.10;

  const permSpeed = permanentUpgrades.moveSpeed ?? 0;
  moveSpeedMult += permSpeed * 0.06;

  const permMagnet = permanentUpgrades.magnet ?? 0;
  pickupRadiusMult += permMagnet * 0.15;

  const permXp = permanentUpgrades.xpGain ?? 0;
  xpMult += permXp * 0.10;

  const permCrit = permanentUpgrades.critChance ?? 0;
  critChanceAdd += permCrit * 0.03;

  const permArmor = permanentUpgrades.armor ?? 0;
  armorAdd += permArmor * 0.03;

  // Apply modifiers from Hero and Equipment
  for (const mod of modifierList) {
    if (mod.maxHpMultiplier) maxHpMult *= mod.maxHpMultiplier;
    if (mod.armorBonus) armorAdd += mod.armorBonus;
    if (mod.moveSpeedMultiplier) moveSpeedMult *= mod.moveSpeedMultiplier;
    if (mod.pickupRadiusMultiplier) pickupRadiusMult *= mod.pickupRadiusMultiplier;
    if (mod.primaryDamageMultiplier) primaryDamageMult *= mod.primaryDamageMultiplier;
    if (mod.autoWeaponDamageMultiplier) autoWeaponDamageMult *= mod.autoWeaponDamageMultiplier;
    if (mod.specialDamageMultiplier) specialDamageMult *= mod.specialDamageMultiplier;
    if (mod.allDamageMultiplier) allDamageMult *= mod.allDamageMultiplier;
    if (mod.primaryFireRateMultiplier) primaryFireRateMult *= mod.primaryFireRateMultiplier;
    if (mod.primaryCooldownMultiplier) primaryCooldownMult *= mod.primaryCooldownMultiplier;
    if (mod.specialCooldownMultiplier) specialCooldownMult *= mod.specialCooldownMultiplier;
    if (mod.projectileSpeedMultiplier) projectileSpeedMult *= mod.projectileSpeedMultiplier;
    if (mod.healMultiplier) healMult *= mod.healMultiplier;
    if (mod.freezeDurationMultiplier) freezeDurationMult *= mod.freezeDurationMultiplier;
    if (mod.critChanceBonus) critChanceAdd += mod.critChanceBonus;
    if (mod.xpMultiplier) xpMult *= mod.xpMultiplier;
    if (mod.bonusProjectileEveryNShots) bonusEveryN = mod.bonusProjectileEveryNShots;
  }

  // Calculate final concrete values
  const maxHp = Math.round(PLAYER_BALANCE.maxHp * Math.max(0.5, maxHpMult));
  const armor = Math.min(0.65, Math.max(0, PLAYER_BALANCE.armor + armorAdd));
  const moveSpeed = Math.round(PLAYER_BALANCE.moveSpeed * Math.max(0.6, moveSpeedMult));
  const pickupRadius = Math.round(PLAYER_BALANCE.pickupRadius * Math.max(0.7, pickupRadiusMult));
  const primaryDamage = Math.round(PLAYER_BALANCE.damage * primaryDamageMult * allDamageMult);
  const primaryCooldown = Number(
    (PLAYER_BALANCE.cooldown * primaryCooldownMult * (1 / primaryFireRateMult)).toFixed(3)
  );
  const critChance = Math.min(0.75, Math.max(0.01, PLAYER_BALANCE.critChance + critChanceAdd));
  const critMultiplier = PLAYER_BALANCE.critMultiplier;
  const xpMultiplier = Number((PLAYER_BALANCE.xpMultiplier * xpMult).toFixed(2));

  return {
    maxHp,
    armor,
    moveSpeed,
    pickupRadius,
    primaryDamage,
    primaryCooldown,
    critChance,
    critMultiplier,
    xpMultiplier,

    primaryDamageMultiplier: primaryDamageMult,
    autoWeaponDamageMultiplier: autoWeaponDamageMult,
    specialDamageMultiplier: specialDamageMult,
    allDamageMultiplier: allDamageMult,
    primaryFireRateMultiplier: primaryFireRateMult,
    primaryCooldownMultiplier: primaryCooldownMult,
    projectileSpeedMultiplier: projectileSpeedMult,
    specialCooldownMultiplier: specialCooldownMult,
    healMultiplier: healMult,
    freezeDurationMultiplier: freezeDurationMult,
    bonusProjectileEveryNShots: bonusEveryN,
    equippedPet: loadout?.pet,
  };
}
