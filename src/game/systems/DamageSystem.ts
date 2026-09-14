import type { DamageType } from '../../types';

export interface DamageInput {
  baseDamage: number;
  multiplier?: number;
  canCrit?: boolean;
  critChance?: number;
  critMultiplier?: number;
  armor?: number;
  damageType?: DamageType;
  weakness?: DamageType[];
  resistance?: DamageType[];
}

export interface DamageResult {
  finalDamage: number;
  critical: boolean;
  targetKilled: boolean;
}

export function applyArmor(damage: number, armor = 0): number {
  return Math.max(1, damage * (1 - Math.min(0.75, Math.max(0, armor))));
}

export function getDamageTypeMultiplier(damageType: DamageType | undefined, weakness: DamageType[] = [], resistance: DamageType[] = []): number {
  if (!damageType) return 1;
  if (weakness.includes(damageType)) return 1.22;
  if (resistance.includes(damageType)) return 0.85;
  return 1;
}

export function calculateDamage(input: DamageInput, roll = Math.random()): DamageResult {
  const critical = Boolean(input.canCrit && roll < (input.critChance ?? 0));
  const multiplier = (input.multiplier ?? 1) * (critical ? (input.critMultiplier ?? 1.5) : 1);
  const typeMultiplier = getDamageTypeMultiplier(input.damageType, input.weakness, input.resistance);
  const raw = Math.max(1, input.baseDamage * multiplier * typeMultiplier);
  const finalDamage = Math.round(applyArmor(raw, input.armor));
  return { finalDamage, critical, targetKilled: false };
}

export function resolveDamage(input: DamageInput, currentHp: number, roll = Math.random()): DamageResult {
  const result = calculateDamage(input, roll);
  return { ...result, targetKilled: currentHp - result.finalDamage <= 0 };
}
