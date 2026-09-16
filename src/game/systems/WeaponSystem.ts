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
  isPrimaryFireActive: () => boolean;
  findAutoTarget: (originX: number, originY: number, maxDist: number) => TargetPoint | undefined;
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
  getPrimaryDamageMultiplier: () => number;
  getAutoWeaponDamageMultiplier: () => number;
  getCooldownMultiplier: () => number;
}

export class WeaponSystem {
  private readonly levels = new Map<WeaponId, number>();
  private readonly cooldowns = new Map<WeaponId, number>();
  private primaryHitCounter = 0;
  private chainFallbackTimer = 0;

  constructor(private readonly hooks: WeaponHooks) {
    this.levels.set('magic-bolt', 1);
    this.cooldowns.set('magic-bolt', 0.05);
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

  update(delta: number): void {
    const primaryFiring = this.hooks.isPrimaryFireActive();

    // Primary is now hold-to-fire. Target selection is automatic and deterministic,
    // so the right thumb is used for timing rather than manual trajectory steering.
    const boltCooldown = (this.cooldowns.get('magic-bolt') ?? 0) - delta;
    if (boltCooldown <= 0) {
      if (primaryFiring && this.triggerMagicBolt()) {
        const level = this.getWeaponLevel('magic-bolt');
        const base = WEAPON_BALANCE['magic-bolt'].cooldown * this.hooks.getCooldownMultiplier();
        this.cooldowns.set('magic-bolt', Math.max(0.09, base * (level >= 4 ? 0.80 : level >= 2 ? 0.90 : 1)));
      } else {
        // Do not punish the player for holding fire before an enemy enters range.
        this.cooldowns.set('magic-bolt', 0);
      }
    } else {
      this.cooldowns.set('magic-bolt', boltCooldown);
    }

    if (this.hasWeapon('orbiting-blades')) {
      const bladesCooldown = (this.cooldowns.get('orbiting-blades') ?? 0) - delta;
      if (bladesCooldown <= 0) {
        const level = this.getWeaponLevel('orbiting-blades');
        const damage =
          WEAPON_BALANCE['orbiting-blades'].baseDamage *
          this.hooks.getAutoWeaponDamageMultiplier() *
          (1 + (level - 1) * 0.25);
        const player = this.hooks.getPlayerPosition();
        this.hooks.dealOrbitDamage(
          player.x,
          player.y,
          52 + level * 6,
          damage * 0.65,
          WEAPON_BALANCE['orbiting-blades'].damageType
        );
        const base = WEAPON_BALANCE['orbiting-blades'].cooldown * this.hooks.getCooldownMultiplier();
        this.cooldowns.set('orbiting-blades', Math.max(0.2, base));
      } else {
        this.cooldowns.set('orbiting-blades', bladesCooldown);
      }
    }

    if (this.hasWeapon('chain-lightning')) {
      this.chainFallbackTimer += delta;
      const level = this.getWeaponLevel('chain-lightning');
      const fallbackThreshold = Math.max(2.4, 4.8 - level * 0.4);
      if (this.chainFallbackTimer >= fallbackThreshold) {
        this.chainFallbackTimer = 0;
        const player = this.hooks.getPlayerPosition();
        const nearby = this.hooks.findTargetsInRadius(player.x, player.y, 320);
        if (nearby.length > 0) {
          const firstTarget = nearby[0];
          this.triggerChainLightningAt(firstTarget.x, firstTarget.y, firstTarget.id);
        }
      }
    }
  }

  onPrimaryHit(targetX: number, targetY: number, targetId?: string): void {
    if (!this.hasWeapon('chain-lightning')) return;
    this.primaryHitCounter += 1;
    const level = this.getWeaponLevel('chain-lightning');
    const requiredHits = Math.max(2, 7 - level);
    if (this.primaryHitCounter >= requiredHits) {
      this.primaryHitCounter = 0;
      this.chainFallbackTimer = 0;
      this.triggerChainLightningAt(targetX, targetY, targetId);
    }
  }

  private triggerMagicBolt(): boolean {
    const level = this.getWeaponLevel('magic-bolt');
    const player = this.hooks.getPlayerPosition();
    const target = this.hooks.findAutoTarget(player.x, player.y, 560);
    if (!target) return false;

    const dx = target.x - player.x;
    const dy = target.y - player.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 1) return false;

    const dirX = dx / distance;
    const dirY = dy / distance;
    const damage =
      WEAPON_BALANCE['magic-bolt'].baseDamage *
      this.hooks.getPrimaryDamageMultiplier() *
      (1 + (level - 1) * 0.25);

    const count = level >= 3 ? 2 : 1;
    const pierce = level >= 5 ? 2 : level >= 4 ? 1 : 0;
    for (let index = 0; index < count; index += 1) {
      const spreadAngle = count === 2 ? (index === 0 ? -0.085 : 0.085) : 0;
      this.hooks.fireProjectile({
        weaponId: 'magic-bolt',
        target,
        direction: { x: dirX, y: dirY },
        angle: spreadAngle,
        damage,
        speed: 420,
        radius: 7,
        pierce,
        color: WEAPON_BALANCE['magic-bolt'].color,
        damageType: WEAPON_BALANCE['magic-bolt'].damageType,
      });
    }
    return true;
  }

  private triggerChainLightningAt(originX: number, originY: number, initialTargetId?: string): void {
    const level = this.getWeaponLevel('chain-lightning');
    const damage =
      WEAPON_BALANCE['chain-lightning'].baseDamage *
      this.hooks.getAutoWeaponDamageMultiplier() *
      (1 + (level - 1) * 0.25);

    const chainCount = level >= 5 ? 5 : level >= 4 ? 4 : level >= 2 ? 3 : 2;
    const chainRadius = 200 + level * 20;

    const initialPoint: TargetPoint = {
      id: initialTargetId ?? 'origin',
      x: originX,
      y: originY,
    };

    const nearby = this.hooks
      .findTargetsInRadius(originX, originY, chainRadius)
      .filter((t) => t.id !== initialPoint.id);

    const targets: TargetPoint[] = [initialPoint, ...nearby].slice(0, chainCount);

    for (const chainTarget of targets) {
      this.hooks.dealAreaDamage(
        chainTarget.x,
        chainTarget.y,
        26,
        damage,
        WEAPON_BALANCE['chain-lightning'].color,
        WEAPON_BALANCE['chain-lightning'].damageType
      );
    }
  }
}
