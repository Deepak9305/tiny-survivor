export interface DamageInput {
  baseDamage: number;
  multiplier?: number;
  canCrit?: boolean;
  critChance?: number;
  critMultiplier?: number;
  armor?: number;
  damageType?: 'physical' | 'magic' | 'fire' | 'frost';
}

export interface DamageResult {
  finalDamage: number;
  critical: boolean;
  targetKilled: boolean;
}

export function applyArmor(damage: number, armor = 0): number {
  return Math.max(1, damage * (1 - Math.min(0.75, Math.max(0, armor))));
}

export function calculateDamage(input: DamageInput, roll = Math.random()): DamageResult {
  const critical = Boolean(input.canCrit && roll < (input.critChance ?? 0));
  const multiplier = (input.multiplier ?? 1) * (critical ? (input.critMultiplier ?? 1.5) : 1);
  const raw = Math.max(1, input.baseDamage * multiplier);
  const finalDamage = Math.round(applyArmor(raw, input.armor));
  return { finalDamage, critical, targetKilled: false };
}

export function resolveDamage(input: DamageInput, currentHp: number, roll = Math.random()): DamageResult {
  const result = calculateDamage(input, roll);
  return { ...result, targetKilled: currentHp - result.finalDamage <= 0 };
}
