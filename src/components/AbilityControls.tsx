import React from 'react';
import { Flame, Lock, Snowflake, Heart, Sparkles } from 'lucide-react';
import { ABILITY_DEFINITIONS, getAbilityUnlockStage } from '../data/abilities';
import { getCombatAutoAim } from '../game/systems/CombatTargeting';
import { getActiveThreeGame } from '../game3d/ThreeGame';
import type { AbilityId, AbilityStateSnapshot } from '../types';

interface AbilityControlsProps {
  abilities?: AbilityStateSnapshot[];
  disabled?: boolean;
}

export function AbilityControls({ abilities = [], disabled = false }: AbilityControlsProps) {
  const abilityOrder: AbilityId[] = ['fireball', 'freeze', 'heal', 'arcane-beam'];

  const getAbilityState = (id: AbilityId): AbilityStateSnapshot => {
    const found = abilities.find((a) => a.id === id);
    if (found) return found;
    return {
      id,
      unlocked: false,
      level: 1,
      cooldownRemaining: 0,
      cooldownDuration: ABILITY_DEFINITIONS[id].baseCooldown,
      active: false,
      activeRemaining: 0,
    };
  };

  const handleActivate = (id: AbilityId, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;

    const game = getActiveThreeGame();
    if (!game) return;

    // Directional specials borrow the live auto-target for this tap only. Clearing
    // it immediately prevents the retired manual-aim line from becoming visible.
    if (id === 'fireball' || id === 'arcane-beam') {
      const autoAim = getCombatAutoAim(650);
      if (autoAim) game.setAimVector(autoAim.x, autoAim.y);
      game.activateAbility(id);
      if (autoAim) game.setAimVector(0, 0);
      return;
    }

    game.activateAbility(id);
  };

  const renderIcon = (id: AbilityId, isLocked: boolean) => {
    if (isLocked) {
      return <Lock size={16} className="ability-btn__lock" />;
    }
    switch (id) {
      case 'fireball':
        return <Flame size={24} className="ability-btn__svg-icon" />;
      case 'freeze':
        return <Snowflake size={24} className="ability-btn__svg-icon" />;
      case 'heal':
        return <Heart size={22} fill="currentColor" className="ability-btn__svg-icon" />;
      case 'arcane-beam':
        return <Sparkles size={22} className="ability-btn__svg-icon" />;
      default:
        return null;
    }
  };

  return (
    <div className={`ability-controls${disabled ? ' is-disabled' : ''}`} aria-label="Manual abilities">
      {abilityOrder.map((id, index) => {
        const def = ABILITY_DEFINITIONS[id];
        const state = getAbilityState(id);
        const isLocked = !state.unlocked;
        const isOnCooldown = !isLocked && state.cooldownRemaining > 0;
        const isActive = state.active;
        const isReady = !isLocked && !isOnCooldown && !isActive;
        const milestoneStage = getAbilityUnlockStage(id);

        let statusClass = 'is-ready';
        if (isLocked) statusClass = 'is-locked';
        else if (isActive) statusClass = 'is-active';
        else if (isOnCooldown) statusClass = 'is-cooldown';

        const cooldownProgress = state.cooldownDuration > 0
          ? Math.max(0, Math.min(1, state.cooldownRemaining / state.cooldownDuration))
          : 0;

        const cooldownAngle = Math.round(cooldownProgress * 360);

        return (
          <button
            key={id}
            type="button"
            className={`ability-btn ability-btn--${id} ability-btn--slot-${index + 1} ${statusClass}`}
            disabled={disabled || isLocked || isOnCooldown}
            onPointerDown={(e) => handleActivate(id, e)}
            onPointerUp={(e) => { e.preventDefault(); e.stopPropagation(); }}
            style={{ '--cooldown-angle': `${cooldownAngle}deg` } as React.CSSProperties}
            aria-label={`${def.name}: ${isLocked ? `Locked until stage ${milestoneStage}` : isReady ? 'Ready' : isOnCooldown ? `${Math.ceil(state.cooldownRemaining)}s cooldown` : 'Active'}`}
          >
            <span className="ability-btn__rune-ring" aria-hidden="true" />
            {isOnCooldown && <span className="ability-btn__cooldown-fill" aria-hidden="true" />}
            <span className="ability-btn__icon" aria-hidden="true">{renderIcon(id, isLocked)}</span>
            {isOnCooldown && (
              <span className="ability-btn__timer">
                {state.cooldownRemaining >= 10 ? Math.ceil(state.cooldownRemaining) : state.cooldownRemaining.toFixed(1)}
              </span>
            )}
            {isActive && <span className="ability-btn__active-label">REGEN</span>}
            {isLocked && <span className="ability-btn__milestone">W{milestoneStage}</span>}
            {!isLocked && state.level > 1 && <span className="ability-btn__level">Lv.{state.level}</span>}
          </button>
        );
      })}
    </div>
  );
}
