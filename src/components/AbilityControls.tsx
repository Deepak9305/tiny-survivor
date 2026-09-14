import React from 'react';
import { Lock } from 'lucide-react';
import { ABILITY_DEFINITIONS, getAbilityUnlockStage } from '../data/abilities';
import { getActiveThreeGame } from '../game3d/ThreeGame';
import type { AbilityId, AbilityStateSnapshot } from '../types';

interface AbilityControlsProps {
  abilities?: AbilityStateSnapshot[];
  disabled?: boolean;
}

export function AbilityControls({ abilities = [], disabled = false }: AbilityControlsProps) {
  const abilityOrder: AbilityId[] = ['fireball', 'arcane-beam', 'freeze', 'heal'];

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
    getActiveThreeGame()?.activateAbility(id);
  };

  return (
    <div className={`ability-controls${disabled ? ' is-disabled' : ''}`} aria-label="Manual abilities">
      {abilityOrder.map((id) => {
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

        return (
          <button
            key={id}
            type="button"
            className={`ability-btn ability-btn--${id} ${statusClass}`}
            disabled={disabled || isLocked || isOnCooldown}
            onPointerDown={(e) => handleActivate(id, e)}
            aria-label={`${def.name}: ${isLocked ? `Locked until stage ${milestoneStage}` : isReady ? 'Ready' : isOnCooldown ? `${Math.ceil(state.cooldownRemaining)}s cooldown` : 'Active'}`}
          >
            {/* Cooldown radial shade overlay */}
            {isOnCooldown && (
              <div
                className="ability-btn__cooldown-fill"
                style={{
                  clipPath: `inset(${Math.round((1 - cooldownProgress) * 100)}% 0 0 0)`,
                }}
              />
            )}

            {/* Icon */}
            <span className="ability-btn__icon" aria-hidden="true">
              {isLocked ? <Lock size={16} className="ability-btn__lock" /> : def.icon}
            </span>

            {/* Cooldown timer text */}
            {isOnCooldown && (
              <span className="ability-btn__timer">
                {state.cooldownRemaining >= 10
                  ? Math.ceil(state.cooldownRemaining)
                  : state.cooldownRemaining.toFixed(1)}
                s
              </span>
            )}

            {/* Active healing indicator */}
            {isActive && (
              <span className="ability-btn__active-label">REGEN</span>
            )}

            {/* Locked milestone badge */}
            {isLocked && (
              <span className="ability-btn__milestone">W{milestoneStage}</span>
            )}

            {/* Subtle level badge if upgraded beyond level 1 */}
            {!isLocked && state.level > 1 && (
              <span className="ability-btn__level">Lv.{state.level}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
