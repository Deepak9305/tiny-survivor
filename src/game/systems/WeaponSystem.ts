import { WEAPON_BALANCE } from '../../data/balance';
import type { DamageType, WeaponId } from '../../types';

export interface TargetPoint {
  id: string;
  x: number;
  y: number;
}

export interface ProjectileSpec {
  weaponId: WeaponId;
  target?: TargetPoint;
  angle?: number;
  damage: number;
  speed: number;
  radius: number;
  pierce: number;
  color: number;
  damageType: DamageType;
  explosive?: boolean;
}

export interface WeaponHooks {
  getPlayerPosition: () => { x: number; y: number };
  findNearestTarget: () => TargetPoint | undefined;
  findTargetsInRadius: (x: number, y: number, radius: number) => TargetPoint[];
  fireProjectile: (spec: ProjectileSpec) => void;
  dealAreaDamage: (x: number, y: number, radius: number, damage: number, color: number, damageType: DamageType) => void;
  dealOrbitDamage: (x: number, y: number, radius: number, damage: number, damageType: DamageType) => void;
  getDamageMultiplier: () => number;
  getCooldownMultiplier: () => number;
}

export class WeaponSystem {
  private readonly levels = new Map<WeaponId, number>();
  private readonly cooldowns = new Map<WeaponId, number>();

  constructor(private readonly hooks: WeaponHooks) {
    this.levels.set('magic-bolt', 1);
    this.cooldowns.set('magic-bolt', 0.15);
  }

  addWeapon(id: WeaponId): void {
    if (!this.levels.has(id)) this.levels.set(id, 1);
    if (!this.cooldowns.has(id)) this.cooldowns.set(id, 0);
  }

  hasWeapon(id: WeaponId): boolean { return (this.levels.get(id) ?? 0) > 0; }
  getWeaponLevel(id: WeaponId): number { return this.levels.get(id) ?? 0; }
  isWeaponMaxed(id: WeaponId): boolean { return this.getWeaponLevel(id) >= 5; }

  upgradeWeapon(id: WeaponId): void {
    this.addWeapon(id);
    this.levels.set(id, Math.min(5, this.getWeaponLevel(id) + 1));
  }

  getLevels(): Record<string, number> {
    return Object.fromEntries(this.levels.entries());
  }

  canEvolve(id: WeaponId, passiveLevels: Record<string, number>): boolean {
    return this.getWeaponLevel(id) >= 5 && (passiveLevels.focus ?? 0) >= 5;
  }

  evolveWeapon(id: WeaponId): boolean {
    if (!this.isWeaponMaxed(id)) return false;
    return true;
  }

  update(delta: number): void {
    for (const [id, level] of this.levels) {
      const next = (this.cooldowns.get(id) ?? 0) - delta;
      if (next > 0) {
        this.cooldowns.set(id, next);
        continue;
      }
      this.triggerWeaponAttack(id);
      const base = WEAPON_BALANCE[id].cooldown * this.hooks.getCooldownMultiplier();
      this.cooldowns.set(id, Math.max(0.12, base * (level >= 4 ? 0.82 : level >= 2 ? 0.92 : 1)));
    }
  }

  triggerWeaponAttack(id: WeaponId): void {
    const level = this.getWeaponLevel(id);
    const damage = WEAPON_BALANCE[id].baseDamage * this.hooks.getDamageMultiplier() * (1 + (level - 1) * 0.23);
    const player = this.hooks.getPlayerPosition();
    if (id === 'magic-bolt') {
      const target = this.hooks.findNearestTarget();
      if (!target) return;
      const count = level >= 3 ? 2 : 1;
      for (let index = 0; index < count; index += 1) {
        this.hooks.fireProjectile({
          weaponId: id,
          target,
          damage,
          speed: 360,
          radius: 6,
          pierce: level >= 5 ? 1 : 0,
          color: WEAPON_BALANCE[id].color,
          damageType: WEAPON_BALANCE[id].damageType,
          angle: count === 2 ? (index === 0 ? -0.12 : 0.12) : 0,
        });
      }
      return;
    }
    if (id === 'fire-orb') {
      const target = this.hooks.findNearestTarget();
      if (!target) return;
      this.hooks.fireProjectile({ weaponId: id, target, damage, speed: 210, radius: 11, pierce: level >= 5 ? 1 : 0, color: WEAPON_BALANCE[id].color, damageType: WEAPON_BALANCE[id].damageType, explosive: true });
      return;
    }
    if (id === 'chain-lightning') {
      const target = this.hooks.findNearestTarget();
      if (!target) return;
      const targets = this.hooks.findTargetsInRadius(target.x, target.y, 190).slice(0, level >= 4 ? 4 : level >= 2 ? 3 : 2);
      for (const chainTarget of targets) this.hooks.dealAreaDamage(chainTarget.x, chainTarget.y, 22, damage, WEAPON_BALANCE[id].color, WEAPON_BALANCE[id].damageType);
      return;
    }
    this.hooks.dealOrbitDamage(player.x, player.y, 48 + level * 4, damage * 0.6, WEAPON_BALANCE[id].damageType);
  }
}
