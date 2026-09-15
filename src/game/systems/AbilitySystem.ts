import { ABILITY_DEFINITIONS } from '../../data/abilities';
import type { AbilityId, AbilityStateSnapshot } from '../../types';

export interface AbilityActivationHooks {
  onFireball: (dirX: number, dirY: number, level: number) => void;
  onFreeze: (level: number) => void;
  onHealTick: (amount: number, isFinished: boolean) => void;
  onArcaneBeam: (dirX: number, dirY: number, level: number) => void;
  getCooldownMultiplier: (abilityId?: AbilityId) => number;
  getPlayerHP: () => { current: number; max: number };
}

export class AbilitySystem {
  private readonly unlocked = new Set<AbilityId>();
  private readonly levels = new Map<AbilityId, number>();
  private readonly cooldownRemaining = new Map<AbilityId, number>();
  private readonly cooldownTotal = new Map<AbilityId, number>();

  // Heal gradual state
  private healActive = false;
  private healTimer = 0;
  private healDuration = 4.0;
  private healTickInterval = 0.5;
  private healTickTimer = 0;
  private healTotalAmount = 0;
  private healTickAmount = 0;

  constructor(private readonly hooks: AbilityActivationHooks) {
    for (const id of ['fireball', 'freeze', 'heal', 'arcane-beam'] as AbilityId[]) {
      this.levels.set(id, 1);
      this.cooldownRemaining.set(id, 0);
      this.cooldownTotal.set(id, ABILITY_DEFINITIONS[id].baseCooldown);
    }
  }

  setUnlockedAbilities(unlocked: AbilityId[]): void {
    this.unlocked.clear();
    for (const id of unlocked) {
      this.unlocked.add(id);
    }
  }

  isUnlocked(id: AbilityId): boolean {
    return this.unlocked.has(id);
  }

  getLevel(id: AbilityId): number {
    return this.levels.get(id) ?? 1;
  }

  upgradeAbility(id: AbilityId): void {
    const current = this.getLevel(id);
    this.levels.set(id, Math.min(5, current + 1));
  }

  getLevels(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [id, lvl] of this.levels.entries()) {
      if (this.unlocked.has(id)) {
        result[id] = lvl;
      }
    }
    return result;
  }

  getCooldownDuration(id: AbilityId): number {
    const def = ABILITY_DEFINITIONS[id];
    const level = this.getLevel(id);
    const cdrReduction = (level - 1) * 0.05; // 5% per upgrade
    const mult = Math.max(0.4, this.hooks.getCooldownMultiplier(id) - cdrReduction);
    return Math.max(1.0, def.baseCooldown * mult);
  }

  canActivate(id: AbilityId): boolean {
    if (!this.unlocked.has(id)) return false;
    if ((this.cooldownRemaining.get(id) ?? 0) > 0) return false;
    if (id === 'heal') {
      if (this.healActive) return false;
      const { current, max } = this.hooks.getPlayerHP();
      if (current >= max - 0.1) return false; // Cannot activate at full HP
    }
    return true;
  }

  activate(
    id: AbilityId,
    aimDir: { x: number; y: number }
  ): boolean {
    if (!this.canActivate(id)) return false;

    const level = this.getLevel(id);
    const cooldown = this.getCooldownDuration(id);

    // Direction normalization
    let dirX = aimDir.x;
    let dirY = aimDir.y;
    const len = Math.hypot(dirX, dirY);
    if (len > 0.05) {
      dirX /= len;
      dirY /= len;
    } else {
      dirX = 0;
      dirY = -1; // Default upward
    }

    if (id === 'fireball') {
      this.hooks.onFireball(dirX, dirY, level);
      this.cooldownRemaining.set(id, cooldown);
      this.cooldownTotal.set(id, cooldown);
      return true;
    }

    if (id === 'freeze') {
      this.hooks.onFreeze(level);
      this.cooldownRemaining.set(id, cooldown);
      this.cooldownTotal.set(id, cooldown);
      return true;
    }

    if (id === 'arcane-beam') {
      this.hooks.onArcaneBeam(dirX, dirY, level);
      this.cooldownRemaining.set(id, cooldown);
      this.cooldownTotal.set(id, cooldown);
      return true;
    }

    if (id === 'heal') {
      const { max } = this.hooks.getPlayerHP();
      // Level 1: 20% max HP, Level 2: 26%, Level 3: 26% faster, Level 4: 34%, Level 5: 34%
      const healPct = level >= 4 ? 0.34 : level >= 2 ? 0.26 : 0.20;
      this.healTotalAmount = max * healPct;
      this.healDuration = level === 3 || level >= 5 ? 3.2 : 4.0;
      this.healTimer = this.healDuration;
      this.healTickInterval = 0.4;
      this.healTickTimer = 0.1; // First tick arrives quickly
      const totalTicks = Math.max(1, Math.floor(this.healDuration / this.healTickInterval));
      this.healTickAmount = this.healTotalAmount / totalTicks;
      this.healActive = true;
      // Cooldown will start after healing completes!
      this.cooldownTotal.set('heal', cooldown);
      return true;
    }

    return false;
  }

  update(delta: number, isPaused: boolean): void {
    if (isPaused) return;

    // 1. Update cooldown timers
    for (const [id, remaining] of this.cooldownRemaining.entries()) {
      if (id === 'heal' && this.healActive) {
        // Heal cooldown does not tick down while actively healing
        continue;
      }
      if (remaining > 0) {
        const next = Math.max(0, remaining - delta);
        this.cooldownRemaining.set(id, next);
      }
    }

    // 2. Update gradual healing ticks
    if (this.healActive) {
      this.healTimer -= delta;
      this.healTickTimer -= delta;

      if (this.healTickTimer <= 0) {
        this.healTickTimer = this.healTickInterval;
        const isLastTick = this.healTimer <= 0;
        this.hooks.onHealTick(this.healTickAmount, isLastTick);
      }

      if (this.healTimer <= 0) {
        this.healActive = false;
        // Cooldown begins after healing finishes
        const cooldown = this.getCooldownDuration('heal');
        this.cooldownRemaining.set('heal', cooldown);
        this.cooldownTotal.set('heal', cooldown);
      }
    }
  }

  isHealActive(): boolean {
    return this.healActive;
  }

  getSnapshot(): AbilityStateSnapshot[] {
    const list: AbilityId[] = ['fireball', 'freeze', 'heal', 'arcane-beam'];
    return list.map((id) => {
      const unlocked = this.unlocked.has(id);
      const level = this.getLevel(id);
      const remaining = this.cooldownRemaining.get(id) ?? 0;
      const duration = this.cooldownTotal.get(id) ?? ABILITY_DEFINITIONS[id].baseCooldown;
      const active = id === 'heal' ? this.healActive : false;
      const activeRemaining = id === 'heal' ? Math.max(0, this.healTimer) : 0;

      return {
        id,
        unlocked,
        level,
        cooldownRemaining: Math.max(0, remaining),
        cooldownDuration: duration,
        active,
        activeRemaining,
      };
    });
  }
}
