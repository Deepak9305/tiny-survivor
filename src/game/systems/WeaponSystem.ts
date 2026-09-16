import { WEAPON_BALANCE } from '../../data/balance';
import type { DamageType, WeaponId } from '../../types';
import {
  clearCombatAutoAim,
  isPrimaryFireActive,
  setCombatAutoAim,
} from './CombatTargeting';

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
  getPrimaryDamageMultiplier: () => number;
  getAutoWeaponDamageMultiplier: () => number;
  getCooldownMultiplier: () => number;
}

export class WeaponSystem {
  private readonly levels = new Map<WeaponId, number>();
  private readonly cooldowns = new Map<WeaponId, number>();
  private primaryHitCounter = 0;
  private chainFallbackTimer = 0;
  private lockedTargetId?: string;
  private autoTarget?: TargetPoint;

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
    this.autoTarget = this.findAutoTarget(570);
    if (this.autoTarget) {
      const player = this.hooks.getPlayerPosition();
      setCombatAutoAim(this.autoTarget.x - player.x, this.autoTarget.y - player.y);
    } else {
      clearCombatAutoAim();
      this.lockedTargetId = undefined;
    }

    // Primary now means: hold FIRE, then automatically track a nearby threat.
    // Legacy keyboard/manual aiming still counts as firing for web/debug play.
    const primaryFiring = isPrimaryFireActive() || this.hooks.isAimActive();
    const boltCooldown = (this.cooldowns.get('magic-bolt') ?? 0) - delta;
    if (boltCooldown <= 0) {
      if (primaryFiring && this.autoTarget && this.triggerMagicBolt(this.autoTarget)) {
        const level = this.getWeaponLevel('magic-bolt');
        const base = WEAPON_BALANCE['magic-bolt'].cooldown * this.hooks.getCooldownMultiplier();
        this.cooldowns.set('magic-bolt', Math.max(0.09, base * (level >= 4 ? 0.80 : level >= 2 ? 0.90 : 1)));
      } else {
        // Holding fire before an enemy enters range should not spend a cooldown.
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

  private findAutoTarget(maxDist: number): TargetPoint | undefined {
    const player = this.hooks.getPlayerPosition();
    const candidates = new Map<string, TargetPoint>();

    // Normal enemies are available directly through the spatial grid hook.
    for (const target of this.hooks.findTargetsInRadius(player.x, player.y, maxDist)) {
      candidates.set(target.id, target);
    }

    // Sample eight cones to also discover boss / boss-echo targets exposed by
    // SurvivorGame's existing aim-assist query without adding another engine API.
    const sampleCount = 8;
    for (let index = 0; index < sampleCount; index += 1) {
      const angle = (index / sampleCount) * Math.PI * 2;
      const target = this.hooks.findAimAssistTarget(
        player.x,
        player.y,
        Math.cos(angle),
        Math.sin(angle),
        Math.PI / 4 + 0.04,
        maxDist
      );
      if (target) candidates.set(target.id, target);
    }

    const locked = this.lockedTargetId ? candidates.get(this.lockedTargetId) : undefined;
    if (locked) {
      const lockedDistance = Math.hypot(locked.x - player.x, locked.y - player.y);
      if (lockedDistance <= maxDist * 1.08) return locked;
    }

    let best: TargetPoint | undefined;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const target of candidates.values()) {
      const distance = Math.hypot(target.x - player.x, target.y - player.y);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = target;
      }
    }

    this.lockedTargetId = best?.id;
    return best;
  }

  private triggerMagicBolt(target: TargetPoint): boolean {
    const level = this.getWeaponLevel('magic-bolt');
    const player = this.hooks.getPlayerPosition();
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
