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
  direction?: { x: number; y: number };
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
  getAimVector: () => { x: number; y: number };
  isAimActive: () => boolean;
  findAimAssistTarget: (
    originX: number,
    originY: number,
    dirX: number,
    dirY: number,
    maxAngleRad: number,
    maxDist: number
  ) => TargetPoint | undefined;
  findTargetsInRadius: (x: number, y: number, radius: number) => TargetPoint[];
  fireProjectile: (spec: ProjectileSpec) => void;
  dealAreaDamage: (
    x: number,
    y: number,
    radius: number,
    damage: number,
    color: number,
    damageType: DamageType
  ) => void;
  dealOrbitDamage: (
    x: number,
    y: number,
    radius: number,
    damage: number,
    damageType: DamageType
  ) => void;
  getDamageMultiplier: () => number;
  getCooldownMultiplier: () => number;
}

export class WeaponSystem {
  private readonly levels = new Map<WeaponId, number>();
  private readonly cooldowns = new Map<WeaponId, number>();

  constructor(private readonly hooks: WeaponHooks) {
    this.levels.set('magic-bolt', 1);
    this.cooldowns.set('magic-bolt', 0.1);
  }

  addWeapon(id: WeaponId): void {
    if (!this.levels.has(id)) this.levels.set(id, 1);
    if (!this.cooldowns.has(id)) this.cooldowns.set(id, 0);
  }

  hasWeapon(id: WeaponId): boolean {
    return (this.levels.get(id) ?? 0) > 0;
  }

  getWeaponLevel(id: WeaponId): number {
    return this.levels.get(id) ?? 0;
  }

  isWeaponMaxed(id: WeaponId): boolean {
    return this.getWeaponLevel(id) >= 5;
  }

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
    const isAiming = this.hooks.isAimActive();

    for (const [id, level] of this.levels) {
      const isPassiveAuto = id === 'orbiting-blades';

      // Directional weapons fire ONLY while aiming
      if (!isPassiveAuto && !isAiming) {
        continue;
      }

      const next = (this.cooldowns.get(id) ?? 0) - delta;
      if (next > 0) {
        this.cooldowns.set(id, next);
        continue;
      }

      this.triggerWeaponAttack(id);
      const base = WEAPON_BALANCE[id].cooldown * this.hooks.getCooldownMultiplier();
      this.cooldowns.set(
        id,
        Math.max(0.12, base * (level >= 4 ? 0.82 : level >= 2 ? 0.92 : 1))
      );
    }
  }

  triggerWeaponAttack(id: WeaponId): void {
    const level = this.getWeaponLevel(id);
    const damage =
      WEAPON_BALANCE[id].baseDamage *
      this.hooks.getDamageMultiplier() *
      (1 + (level - 1) * 0.23);
    const player = this.hooks.getPlayerPosition();

    // Orbiting Blades: Fully automatic close-range shield
    if (id === 'orbiting-blades') {
      this.hooks.dealOrbitDamage(
        player.x,
        player.y,
        50 + level * 5,
        damage * 0.65,
        WEAPON_BALANCE[id].damageType
      );
      return;
    }

    const rawAim = this.hooks.getAimVector();
    const aimLen = Math.sqrt(rawAim.x * rawAim.x + rawAim.y * rawAim.y);
    if (aimLen < 0.1) return;

    let dirX = rawAim.x / aimLen;
    let dirY = rawAim.y / aimLen;

    // Optional mild aim assist (cone ~10 degrees = 0.175 rad) to nudge trajectory
    const assist = this.hooks.findAimAssistTarget(
      player.x,
      player.y,
      dirX,
      dirY,
      0.175,
      480
    );

    if (assist) {
      const targetAngle = Math.atan2(assist.y - player.y, assist.x - player.x);
      const aimAngle = Math.atan2(dirY, dirX);
      let diff = targetAngle - aimAngle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      const nudgedAngle = aimAngle + diff * 0.45;
      dirX = Math.cos(nudgedAngle);
      dirY = Math.sin(nudgedAngle);
    }

    if (id === 'magic-bolt') {
      const count = level >= 3 ? 2 : 1;
      const pierce = level >= 5 ? 2 : level >= 4 ? 1 : 0;
      for (let index = 0; index < count; index += 1) {
        const spreadAngle = count === 2 ? (index === 0 ? -0.1 : 0.1) : 0;
        this.hooks.fireProjectile({
          weaponId: id,
          direction: { x: dirX, y: dirY },
          angle: spreadAngle,
          damage,
          speed: 380,
          radius: 7,
          pierce,
          color: WEAPON_BALANCE[id].color,
          damageType: WEAPON_BALANCE[id].damageType,
        });
      }
      return;
    }

    if (id === 'fire-orb') {
      this.hooks.fireProjectile({
        weaponId: id,
        direction: { x: dirX, y: dirY },
        damage,
        speed: 230,
        radius: 12,
        pierce: level >= 5 ? 1 : 0,
        color: WEAPON_BALANCE[id].color,
        damageType: WEAPON_BALANCE[id].damageType,
        explosive: true,
      });
      return;
    }

    if (id === 'chain-lightning') {
      // Chain Lightning finds first enemy inside aim cone (~26 degrees = 0.45 rad)
      const target = this.hooks.findAimAssistTarget(
        player.x,
        player.y,
        dirX,
        dirY,
        0.45,
        440
      );

      if (!target) return; // Do not fire if no enemy in aim cone!

      const chainCount = level >= 4 ? 4 : level >= 2 ? 3 : 2;
      const targets = [
        target,
        ...this.hooks
          .findTargetsInRadius(target.x, target.y, 190)
          .filter((t) => t.id !== target.id),
      ].slice(0, chainCount);

      for (const chainTarget of targets) {
        this.hooks.dealAreaDamage(
          chainTarget.x,
          chainTarget.y,
          24,
          damage,
          WEAPON_BALANCE[id].color,
          WEAPON_BALANCE[id].damageType
        );
      }
    }
  }
}
