import { WEAPON_BALANCE } from '../../data/balance';
import type { DamageType, WeaponId } from '../../types';
import {
  clearCombatAutoAim,
  getCombatHeroId,
  isAutoFireEnabled,
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
  dealAreaDamage: (
    x: number,
    y: number,
    radius: number,
    damage: number,
    color: number,
    damageType: DamageType,
    maxTargets?: number,
    knockbackForceOverride?: number
  ) => void;
  dealOrbitDamage: (x: number, y: number, radius: number, damage: number, damageType: DamageType) => void;
  getPrimaryDamageMultiplier: () => number;
  getAutoWeaponDamageMultiplier: () => number;
  getCooldownMultiplier: () => number;
  triggerMeleeSwing?: (
    originX: number,
    originY: number,
    dirX: number,
    dirY: number,
    reach: number,
    color: number,
    empowered: boolean
  ) => void;
}

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
    const maxMeleeRange = heroId === 'warrior' ? 95 : heroId === 'shadow' ? 88 : heroId === 'monk' ? 78 : 90;
    this.autoTarget = this.findAutoTarget(maxMeleeRange);
    if (this.autoTarget) {
      const player = this.hooks.getPlayerPosition();
      setCombatAutoAim(this.autoTarget.x - player.x, this.autoTarget.y - player.y);
    } else {
      clearCombatAutoAim();
      this.lockedTargetId = undefined;
    }

    const primaryFiring = isAutoFireEnabled() || isPrimaryFireActive() || this.hooks.isAimActive();
    const primaryCooldown = (this.cooldowns.get('magic-bolt') ?? 0) - delta;
    if (primaryCooldown <= 0) {
      let attacked = false;
      if (primaryFiring) {
        if (this.autoTarget) {
          attacked = this.triggerHeroMeleeStrike(this.autoTarget, false);
        } else if (this.hooks.isAimActive() || isPrimaryFireActive()) {
          const aimVec = this.hooks.getAimVector();
          if (Math.hypot(aimVec.x, aimVec.y) > 0.08) {
            attacked = this.triggerHeroMeleeStrike(aimVec, true);
          }
        }
      }
      if (attacked) {
        const level = this.getWeaponLevel('magic-bolt');
        const base = WEAPON_BALANCE['magic-bolt'].cooldown * this.hooks.getCooldownMultiplier();
        const levelRate = level >= 4 ? 0.84 : level >= 2 ? 0.92 : 1;
        const overdriveRate = this.overdriveRemaining > 0 ? 0.78 : 1;
        const heroRhythm =
          heroId === 'monk' ? 0.62 :
          heroId === 'shadow' ? 0.85 :
          heroId === 'gunslinger' ? 0.82 : 0.95;
        this.cooldowns.set('magic-bolt', Math.max(0.12, base * levelRate * overdriveRate * heroRhythm));
      } else {
        this.cooldowns.set('magic-bolt', 0);
      }
    } else this.cooldowns.set('magic-bolt', primaryCooldown);

    if (this.hasWeapon('orbiting-blades')) {
      const bladesCooldown = (this.cooldowns.get('orbiting-blades') ?? 0) - delta;
      if (bladesCooldown <= 0) {
        const level = this.getWeaponLevel('orbiting-blades');
        const damage = WEAPON_BALANCE['orbiting-blades'].baseDamage * this.hooks.getAutoWeaponDamageMultiplier() * (1 + (level - 1) * 0.22) * (this.overdriveRemaining > 0 ? 1.14 : 1);
        const player = this.hooks.getPlayerPosition();
        this.hooks.dealOrbitDamage(player.x, player.y, 48 + level * 5, damage * 0.65, WEAPON_BALANCE['orbiting-blades'].damageType);
        const base = WEAPON_BALANCE['orbiting-blades'].cooldown * this.hooks.getCooldownMultiplier();
        this.cooldowns.set('orbiting-blades', Math.max(0.20, base * (this.overdriveRemaining > 0 ? 0.84 : 1)));
      } else this.cooldowns.set('orbiting-blades', bladesCooldown);
    }

    if (this.hasWeapon('chain-lightning')) {
      this.chainFallbackTimer += delta;
      const level = this.getWeaponLevel('chain-lightning');
      const fallbackThreshold = Math.max(2.4, 4.8 - level * 0.40) * (this.overdriveRemaining > 0 ? 0.84 : 1);
      if (this.chainFallbackTimer >= fallbackThreshold) {
        this.chainFallbackTimer = 0;
        const player = this.hooks.getPlayerPosition();
        const nearby = this.hooks.findTargetsInRadius(player.x, player.y, 320).sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y));
        if (nearby.length > 0) this.triggerChainLightningAt(nearby[0].x, nearby[0].y, nearby[0].id);
      }
    }

    if (this.hasWeapon('fire-orb')) {
      const fireCooldown = (this.cooldowns.get('fire-orb') ?? 0) - delta;
      if (fireCooldown <= 0) {
        if (this.triggerFireOrb()) {
          const level = this.getWeaponLevel('fire-orb');
          const base = WEAPON_BALANCE['fire-orb'].cooldown * this.hooks.getCooldownMultiplier();
          const levelRate = Math.max(0.66, 1 - (level - 1) * 0.08);
          const overdriveRate = this.overdriveRemaining > 0 ? 0.58 : 1;
          this.cooldowns.set('fire-orb', Math.max(0.45, base * levelRate * overdriveRate));
        } else {
          this.cooldowns.set('fire-orb', 0.25);
        }
      } else {
        this.cooldowns.set('fire-orb', fireCooldown);
      }
    }
  }

  onPrimaryHit(targetX: number, targetY: number, targetId?: string): void {
    this.flowStreak = this.flowStreakTimer > 0 ? Math.min(99, this.flowStreak + 1) : 1;
    this.flowStreakTimer = 1.0;
    this.flowDecayDelay = 1.25;
    if (this.overdriveRemaining <= 0) {
      const level = this.getWeaponLevel('magic-bolt');
      const streakBonus = this.flowStreak >= 8 ? 0.8 : this.flowStreak >= 4 ? 0.4 : 0;
      this.flowMeter = Math.min(100, this.flowMeter + 3.2 + level * 0.45 + streakBonus);
      if (this.flowMeter >= 100) { this.flowMeter = 100; this.overdriveRemaining = 4.5; }
    }
    this.broadcastFlow();

    // Fire Orb Synergy: Blazing splash bursts on high combo or overdrive
    if (this.hasWeapon('fire-orb') && (this.overdriveRemaining > 0 || this.flowStreak >= 6)) {
      if (Math.random() < 0.35) {
        const fireLevel = this.getWeaponLevel('fire-orb');
        const splashDmg = WEAPON_BALANCE['fire-orb'].baseDamage * 0.45 * this.hooks.getAutoWeaponDamageMultiplier();
        this.hooks.dealAreaDamage(targetX, targetY, 28 + fireLevel * 3, splashDmg, WEAPON_BALANCE['fire-orb'].color, 'fire', 3, 40);
      }
    }

    if (!this.hasWeapon('chain-lightning')) return;
    this.primaryHitCounter += 1;
    const level = this.getWeaponLevel('chain-lightning');
    const requiredHits = Math.max(3, 8 - level);
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
      if (this.overdriveRemaining <= 0) { this.flowMeter = 20; this.flowDecayDelay = 0.8; this.flowStreak = 0; this.broadcastFlow(); }
    } else if (this.flowDecayDelay <= 0 && this.flowMeter > 0) {
      const firing = isAutoFireEnabled() || isPrimaryFireActive() || this.hooks.isAimActive();
      this.flowMeter = Math.max(0, this.flowMeter - delta * (firing ? 8 : 16));
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
      if (!nearest || lockedDistance <= 80 || nearestDistance >= lockedDistance * 0.68) return locked;
    }
    this.lockedTargetId = nearest?.id;
    return nearest;
  }

  private triggerHeroMeleeStrike(target: TargetPoint | { x: number; y: number }, isDirectionOnly = false): boolean {
    const player = this.hooks.getPlayerPosition();
    let dirX: number;
    let dirY: number;
    let targetDist = 0;

    if (isDirectionOnly) {
      dirX = target.x;
      dirY = target.y;
      const len = Math.hypot(dirX, dirY);
      if (len < 0.05) return false;
      dirX /= len;
      dirY /= len;
    } else {
      const dx = target.x - player.x;
      const dy = target.y - player.y;
      targetDist = Math.hypot(dx, dy);
      if (targetDist < 0.1) return false;
      dirX = dx / targetDist;
      dirY = dy / targetDist;
    }

    const heroId = getCombatHeroId();
    const level = this.getWeaponLevel('magic-bolt');
    this.primaryVolleyCounter += 1;
    const overdrive = this.overdriveRemaining > 0;

    const heavyCadence = overdrive ? 3 : level >= 4 ? 3 : level >= 2 ? 4 : 5;
    const empowered = overdrive || this.primaryVolleyCounter % heavyCadence === 0;

    let reach: number;
    let radius: number;
    let arcDeg: number;
    let damageMult: number;
    let damageType: DamageType;
    let color: number;
    let maxTargets: number;
    let knockbackForce: number;

    if (heroId === 'warrior') {
      reach = 38 + level * 2.5;
      radius = 38 + level * 2.5 + (empowered ? 8 : 0);
      arcDeg = 100;
      damageMult = 1.20 * (overdrive ? 1.15 : 1) * (empowered ? 1.25 : 1);
      damageType = 'physical';
      color = empowered ? 0xffdc7a : 0xffb83e;
      maxTargets = empowered ? 5 : 3;
      knockbackForce = empowered ? 75 : 52;
    } else if (heroId === 'monk') {
      reach = 30 + level * 2;
      radius = 28 + level * 2 + (empowered ? 6 : 0);
      arcDeg = 70;
      damageMult = 0.88 * (overdrive ? 1.12 : 1) * (empowered ? 1.18 : 1);
      damageType = 'physical';
      color = empowered ? 0x67e8f9 : 0x22d3ee;
      maxTargets = empowered ? 4 : 2;
      knockbackForce = empowered ? 62 : 44;
    } else if (heroId === 'gunslinger') {
      reach = 35 + level * 2;
      radius = 34 + level * 2.5 + (empowered ? 8 : 0);
      arcDeg = 85;
      damageMult = 1.10 * (overdrive ? 1.14 : 1) * (empowered ? 1.22 : 1);
      damageType = 'fire';
      color = empowered ? 0xfdba74 : 0xf97316;
      maxTargets = empowered ? 4 : 3;
      knockbackForce = empowered ? 68 : 48;
    } else {
      // shadow mage
      reach = 34 + level * 2;
      radius = 32 + level * 2.5 + (empowered ? 8 : 0);
      arcDeg = 90;
      damageMult = 1.02 * (overdrive ? 1.14 : 1) * (empowered ? 1.20 : 1);
      damageType = 'arcane';
      color = empowered ? 0xd8b4fe : 0xa855f7;
      maxTargets = empowered ? 5 : 3;
      knockbackForce = empowered ? 65 : 46;
    }

    const baseDmg = WEAPON_BALANCE['magic-bolt'].baseDamage * this.hooks.getPrimaryDamageMultiplier();
    const finalDamage = baseDmg * damageMult * (1 + (level - 1) * 0.18);

    // 1. Trigger visual strike arc and character swing animation
    this.hooks.triggerMeleeSwing?.(player.x, player.y, dirX, dirY, reach, color, empowered);

    // 2. Frontal cone melee sweep check
    const queryRadius = reach + radius + 12;
    const candidates = this.hooks.findTargetsInRadius(player.x, player.y, queryRadius);
    const cosHalfArc = Math.cos((arcDeg * Math.PI) / 360);
    let hitCount = 0;
    let hitTarget: TargetPoint | undefined;

    for (const cand of candidates) {
      const cdx = cand.x - player.x;
      const cdy = cand.y - player.y;
      const cDist = Math.hypot(cdx, cdy);
      if (cDist > queryRadius || cDist < 1) continue;
      const dot = (cdx / cDist) * dirX + (cdy / cDist) * dirY;
      if (dot >= cosHalfArc || cDist <= 28) {
        hitCount += 1;
        if (!hitTarget) hitTarget = cand;
      }
    }

    const centerX = player.x + dirX * reach;
    const centerY = player.y + dirY * reach;
    this.hooks.dealAreaDamage(centerX, centerY, radius, finalDamage, color, damageType, maxTargets, knockbackForce);

    if (hitCount > 0 || (targetDist > 0 && targetDist <= queryRadius)) {
      const hitPointX = hitTarget ? hitTarget.x : centerX;
      const hitPointY = hitTarget ? hitTarget.y : centerY;
      this.onPrimaryHit(hitPointX, hitPointY, hitTarget?.id);
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

  private triggerFireOrb(): boolean {
    const level = this.getWeaponLevel('fire-orb');
    const player = this.hooks.getPlayerPosition();
    const searchRadius = 180 + level * 18;
    const candidates = this.hooks
      .findTargetsInRadius(player.x, player.y, searchRadius)
      .sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y));
    if (candidates.length === 0) return false;

    const target = candidates[0];
    const dx = target.x - player.x;
    const dy = target.y - player.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) return false;

    const dirX = dx / dist;
    const dirY = dy / dist;
    const overdrive = this.overdriveRemaining > 0;
    const damage =
      WEAPON_BALANCE['fire-orb'].baseDamage *
      this.hooks.getAutoWeaponDamageMultiplier() *
      (1 + (level - 1) * 0.28) *
      (overdrive ? 1.25 : 1);
    const count = overdrive ? (level >= 4 ? 3 : 2) : (level >= 3 ? 2 : 1);
    const radius = 12 + level * 2;
    const speed = 280 + level * 22;
    const spread = 0.16;

    for (let i = 0; i < count; i++) {
      const spreadAngle = count > 1 ? (i - (count - 1) / 2) * spread : 0;
      this.hooks.fireProjectile({
        weaponId: 'fire-orb',
        target,
        direction: { x: dirX, y: dirY },
        angle: spreadAngle,
        damage,
        speed,
        radius,
        pierce: level >= 5 ? 1 : 0,
        color: WEAPON_BALANCE['fire-orb'].color,
        damageType: 'fire',
        explosive: true,
        empowered: overdrive || level >= 4,
      });
    }
    return true;
  }
}
