import { WEAPON_BALANCE } from '../../data/balance';
import type { DamageType, HeroId, WeaponId } from '../../types';
import {
  clearCombatAutoAim,
  getCombatHeroId,
  isPrimaryFireActive,
  setCombatAutoAim,
  setCombatFlowState,
} from './CombatTargeting';

export interface TargetPoint { id: string; x: number; y: number }
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
  empowered?: boolean;
}

export interface WeaponHooks {
  getPlayerPosition: () => { x: number; y: number };
  getAimVector: () => { x: number; y: number };
  isAimActive: () => boolean;
  findAimAssistTarget: (originX: number, originY: number, dirX: number, dirY: number, maxAngleRad: number, maxDist: number) => TargetPoint | undefined;
  findTargetsInRadius: (x: number, y: number, radius: number) => TargetPoint[];
  fireProjectile: (spec: ProjectileSpec) => void;
  dealAreaDamage: (x: number, y: number, radius: number, damage: number, color: number, damageType: DamageType) => void;
  dealOrbitDamage: (x: number, y: number, radius: number, damage: number, damageType: DamageType) => void;
  getPrimaryDamageMultiplier: () => number;
  getAutoWeaponDamageMultiplier: () => number;
  getCooldownMultiplier: () => number;
}

const PRIMARY_ATTACK_RANGE: Record<HeroId, number> = {
  warrior: 126,
  monk: 255,
  shadow: 340,
  gunslinger: 400,
};

export class WeaponSystem {
  private readonly levels = new Map<WeaponId, number>();
  private readonly cooldowns = new Map<WeaponId, number>();
  private primaryHitCounter = 0;
  private primaryVolleyCounter = 0;
  private chainFallbackTimer = 0;
  private lockedTargetId?: string;
  private autoTarget?: TargetPoint;
  private flowMeter = 0;
  private flowStreak = 0;
  private flowStreakTimer = 0;
  private flowDecayDelay = 0;
  private flowBroadcastTimer = 0;
  private overdriveRemaining = 0;

  constructor(private readonly hooks: WeaponHooks) {
    this.levels.set('magic-bolt', 1);
    this.cooldowns.set('magic-bolt', 0.05);
    this.broadcastFlow();
  }

  addWeapon(id: WeaponId): void { if (!this.levels.has(id)) this.levels.set(id, 1); if (!this.cooldowns.has(id)) this.cooldowns.set(id, 0); }
  hasWeapon(id: WeaponId): boolean { return (this.levels.get(id) ?? 0) > 0; }
  getWeaponLevel(id: WeaponId): number { return this.levels.get(id) ?? 0; }
  isWeaponMaxed(id: WeaponId): boolean { return this.getWeaponLevel(id) >= 5; }
  upgradeWeapon(id: WeaponId): void { this.addWeapon(id); this.levels.set(id, Math.min(5, this.getWeaponLevel(id) + 1)); }
  getLevels(): Record<string, number> { return Object.fromEntries(this.levels.entries()); }

  update(delta: number): void {
    this.updateFlow(delta);

    const heroId = getCombatHeroId();
    const melee = heroId === 'warrior';
    this.autoTarget = this.findAutoTarget(PRIMARY_ATTACK_RANGE[heroId]);
    if (this.autoTarget) {
      const player = this.hooks.getPlayerPosition();
      setCombatAutoAim(this.autoTarget.x - player.x, this.autoTarget.y - player.y);
    } else {
      clearCombatAutoAim();
      this.lockedTargetId = undefined;
    }

    const primaryFiring = isPrimaryFireActive() || this.hooks.isAimActive();
    const primaryCooldown = (this.cooldowns.get('magic-bolt') ?? 0) - delta;
    if (primaryCooldown <= 0) {
      const attacked = primaryFiring && this.autoTarget
        ? (melee ? this.triggerWarriorCleave(this.autoTarget) : this.triggerMagicBolt(this.autoTarget))
        : false;
      if (attacked) {
        const level = this.getWeaponLevel('magic-bolt');
        const base = WEAPON_BALANCE['magic-bolt'].cooldown * this.hooks.getCooldownMultiplier();
        const levelRate = level >= 4 ? 0.78 : level >= 2 ? 0.90 : 1;
        const overdriveRate = this.overdriveRemaining > 0 ? 0.68 : 1;
        const meleeRhythm = melee ? 1.08 : 1;
        this.cooldowns.set('magic-bolt', Math.max(0.10, base * levelRate * overdriveRate * meleeRhythm));
      } else {
        this.cooldowns.set('magic-bolt', 0);
      }
    } else this.cooldowns.set('magic-bolt', primaryCooldown);

    if (this.hasWeapon('orbiting-blades')) {
      const bladesCooldown = (this.cooldowns.get('orbiting-blades') ?? 0) - delta;
      if (bladesCooldown <= 0) {
        const level = this.getWeaponLevel('orbiting-blades');
        const damage = WEAPON_BALANCE['orbiting-blades'].baseDamage * this.hooks.getAutoWeaponDamageMultiplier() * (1 + (level - 1) * 0.25) * (this.overdriveRemaining > 0 ? 1.16 : 1);
        const player = this.hooks.getPlayerPosition();
        this.hooks.dealOrbitDamage(player.x, player.y, 52 + level * 6, damage * 0.65, WEAPON_BALANCE['orbiting-blades'].damageType);
        const base = WEAPON_BALANCE['orbiting-blades'].cooldown * this.hooks.getCooldownMultiplier();
        this.cooldowns.set('orbiting-blades', Math.max(0.18, base * (this.overdriveRemaining > 0 ? 0.82 : 1)));
      } else this.cooldowns.set('orbiting-blades', bladesCooldown);
    }

    if (this.hasWeapon('chain-lightning')) {
      this.chainFallbackTimer += delta;
      const level = this.getWeaponLevel('chain-lightning');
      const fallbackThreshold = Math.max(2.2, 4.6 - level * 0.42) * (this.overdriveRemaining > 0 ? 0.82 : 1);
      if (this.chainFallbackTimer >= fallbackThreshold) {
        this.chainFallbackTimer = 0;
        const player = this.hooks.getPlayerPosition();
        const nearby = this.hooks.findTargetsInRadius(player.x, player.y, 340).sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y));
        if (nearby.length > 0) this.triggerChainLightningAt(nearby[0].x, nearby[0].y, nearby[0].id);
      }
    }
  }

  onPrimaryHit(targetX: number, targetY: number, targetId?: string): void {
    this.flowStreak = this.flowStreakTimer > 0 ? Math.min(99, this.flowStreak + 1) : 1;
    this.flowStreakTimer = 1.1;
    this.flowDecayDelay = 1.45;
    if (this.overdriveRemaining <= 0) {
      const level = this.getWeaponLevel('magic-bolt');
      const streakBonus = this.flowStreak >= 8 ? 1.4 : this.flowStreak >= 4 ? 0.7 : 0;
      this.flowMeter = Math.min(100, this.flowMeter + 5.4 + level * 0.75 + streakBonus);
      if (this.flowMeter >= 100) { this.flowMeter = 100; this.overdriveRemaining = 5.5; }
    }
    this.broadcastFlow();
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

  private updateFlow(delta: number): void {
    this.flowBroadcastTimer -= delta;
    this.flowStreakTimer = Math.max(0, this.flowStreakTimer - delta);
    this.flowDecayDelay = Math.max(0, this.flowDecayDelay - delta);
    if (this.flowStreakTimer <= 0) this.flowStreak = 0;
    if (this.overdriveRemaining > 0) {
      this.overdriveRemaining = Math.max(0, this.overdriveRemaining - delta);
      this.flowMeter = 100;
      if (this.overdriveRemaining <= 0) { this.flowMeter = 28; this.flowDecayDelay = 1; this.flowStreak = 0; this.broadcastFlow(); }
    } else if (this.flowDecayDelay <= 0 && this.flowMeter > 0) {
      const firing = isPrimaryFireActive() || this.hooks.isAimActive();
      this.flowMeter = Math.max(0, this.flowMeter - delta * (firing ? 7 : 14));
    }
    if (this.flowBroadcastTimer <= 0) { this.broadcastFlow(); this.flowBroadcastTimer = 0.1; }
  }

  private broadcastFlow(): void {
    setCombatFlowState({ meter: this.flowMeter, overdrive: this.overdriveRemaining > 0, overdriveRemaining: this.overdriveRemaining, streak: this.flowStreak });
  }

  private findAutoTarget(maxDist: number): TargetPoint | undefined {
    const player = this.hooks.getPlayerPosition();
    const candidates = new Map<string, TargetPoint>();
    for (const target of this.hooks.findTargetsInRadius(player.x, player.y, maxDist)) candidates.set(target.id, target);
    const sampleCount = 8;
    for (let index = 0; index < sampleCount; index += 1) {
      const angle = (index / sampleCount) * Math.PI * 2;
      const target = this.hooks.findAimAssistTarget(player.x, player.y, Math.cos(angle), Math.sin(angle), Math.PI / 4 + 0.04, maxDist);
      if (target) candidates.set(target.id, target);
    }
    let nearest: TargetPoint | undefined;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const target of candidates.values()) {
      const distance = Math.hypot(target.x - player.x, target.y - player.y);
      if (distance < nearestDistance) { nearestDistance = distance; nearest = target; }
    }
    const locked = this.lockedTargetId ? candidates.get(this.lockedTargetId) : undefined;
    if (locked) {
      const lockedDistance = Math.hypot(locked.x - player.x, locked.y - player.y);
      if (!nearest || lockedDistance <= 90 || nearestDistance >= lockedDistance * 0.68) return locked;
    }
    this.lockedTargetId = nearest?.id;
    return nearest;
  }

  private triggerWarriorCleave(target: TargetPoint): boolean {
    const player = this.hooks.getPlayerPosition();
    const dx = target.x - player.x;
    const dy = target.y - player.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 1 || distance > PRIMARY_ATTACK_RANGE.warrior) return false;
    const level = this.getWeaponLevel('magic-bolt');
    const dirX = dx / distance;
    const dirY = dy / distance;
    this.primaryVolleyCounter += 1;
    const overdrive = this.overdriveRemaining > 0;
    const empowered = overdrive || this.primaryVolleyCounter % (level >= 3 ? 3 : 4) === 0;
    const damage = WEAPON_BALANCE['magic-bolt'].baseDamage * this.hooks.getPrimaryDamageMultiplier() * 1.46 * (1 + (level - 1) * 0.23) * (overdrive ? 1.20 : 1) * (empowered ? 1.24 : 1);
    const reach = 48 + level * 3;
    const radius = 50 + level * 4 + (empowered ? 8 : 0);
    const centerX = player.x + dirX * reach;
    const centerY = player.y + dirY * reach;
    this.hooks.dealAreaDamage(centerX, centerY, radius, damage, empowered ? 0xffdc7a : 0xffb83e, 'physical');
    this.onPrimaryHit(target.x, target.y, target.id);
    return true;
  }

  private triggerMagicBolt(target: TargetPoint): boolean {
    const level = this.getWeaponLevel('magic-bolt');
    const player = this.hooks.getPlayerPosition();
    const dx = target.x - player.x;
    const dy = target.y - player.y;
    const distance = Math.hypot(dx, dy);
    const maxRange = PRIMARY_ATTACK_RANGE[getCombatHeroId()];
    if (distance < 1 || distance > maxRange) return false;
    this.primaryVolleyCounter += 1;
    const overdrive = this.overdriveRemaining > 0;
    const heavyCadence = overdrive || level >= 4 ? 3 : level >= 2 ? 4 : 5;
    const empowered = this.primaryVolleyCounter % heavyCadence === 0;
    const dirX = dx / distance;
    const dirY = dy / distance;
    const damage = WEAPON_BALANCE['magic-bolt'].baseDamage * this.hooks.getPrimaryDamageMultiplier() * (1 + (level - 1) * 0.25) * (overdrive ? 1.18 : 1) * (empowered ? 1.46 : 1);
    const count = level >= 5 && overdrive ? 3 : level >= 3 ? 2 : 1;
    const basePierce = level >= 5 ? 2 : level >= 4 ? 1 : 0;
    const pierce = basePierce + (empowered ? 1 : 0);
    const spread = count === 3 ? 0.10 : 0.085;
    for (let index = 0; index < count; index += 1) {
      const center = (count - 1) / 2;
      this.hooks.fireProjectile({ weaponId: 'magic-bolt', target, direction: { x: dirX, y: dirY }, angle: (index - center) * spread, damage, speed: empowered ? 465 : overdrive ? 450 : 420, radius: empowered ? 10 : 7, pierce, color: empowered ? 0xffd166 : WEAPON_BALANCE['magic-bolt'].color, damageType: WEAPON_BALANCE['magic-bolt'].damageType, empowered });
    }
    return true;
  }

  private triggerChainLightningAt(originX: number, originY: number, initialTargetId?: string): void {
    const level = this.getWeaponLevel('chain-lightning');
    const damage = WEAPON_BALANCE['chain-lightning'].baseDamage * this.hooks.getAutoWeaponDamageMultiplier() * (1 + (level - 1) * 0.25) * (this.overdriveRemaining > 0 ? 1.18 : 1);
    const chainCount = level >= 5 ? 5 : level >= 4 ? 4 : level >= 2 ? 3 : 2;
    const chainRadius = 200 + level * 20;
    const initialPoint: TargetPoint = { id: initialTargetId ?? 'origin', x: originX, y: originY };
    const nearby = this.hooks.findTargetsInRadius(originX, originY, chainRadius).filter((target) => target.id !== initialPoint.id).sort((a, b) => Math.hypot(a.x - originX, a.y - originY) - Math.hypot(b.x - originX, b.y - originY));
    const targets: TargetPoint[] = [initialPoint, ...nearby].slice(0, chainCount);
    for (const chainTarget of targets) this.hooks.dealAreaDamage(chainTarget.x, chainTarget.y, 26, damage, WEAPON_BALANCE['chain-lightning'].color, WEAPON_BALANCE['chain-lightning'].damageType);
  }
}
