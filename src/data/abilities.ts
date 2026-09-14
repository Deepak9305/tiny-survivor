import type { AbilityId, Rarity, UpgradeChoice } from '../types';
import { getWorldStages } from './stages';

export interface AbilityDefinition {
  id: AbilityId;
  name: string;
  icon: string;
  color: number;
  cssColor: string;
  description: string;
  shortRole: string;
  baseCooldown: number;
  worldId: number;
  /** Percentage of world completion required to unlock (0-1) */
  worldCompletionRatio: number;
  isWorldFinalStage?: boolean;
}

export const ABILITY_DEFINITIONS: Record<AbilityId, AbilityDefinition> = {
  fireball: {
    id: 'fireball',
    name: 'Fireball',
    icon: '🔥',
    color: 0xff6b35,
    cssColor: '#ff6b35',
    description: 'Launch an explosive fire projectile toward aim direction.',
    shortRole: 'CROWD BURST',
    baseCooldown: 7.5,
    worldId: 1,
    worldCompletionRatio: 0.4, // World 1 Stage 2 for 5 stages
  },
  freeze: {
    id: 'freeze',
    name: 'Freeze',
    icon: '❄',
    color: 0x5ddcff,
    cssColor: '#5ddcff',
    description: 'Release a frost pulse to freeze and slow nearby enemies.',
    shortRole: 'CROWD CONTROL',
    baseCooldown: 12.0,
    worldId: 1,
    worldCompletionRatio: 0.8, // World 1 Stage 4 for 5 stages
  },
  heal: {
    id: 'heal',
    name: 'Heal',
    icon: '♥',
    color: 0x48e076,
    cssColor: '#48e076',
    description: 'Regenerate 20% max health gradually over 4 seconds.',
    shortRole: 'RECOVERY',
    baseCooldown: 40.0,
    worldId: 2,
    worldCompletionRatio: 0.6, // World 2 Stage 3 for 5 stages
  },
  'arcane-beam': {
    id: 'arcane-beam',
    name: 'Arcane Beam',
    icon: '✦',
    color: 0xa87aff,
    cssColor: '#a87aff',
    description: 'Pierce enemies with a focused, continuous arcane beam.',
    shortRole: 'PIERCING BEAM',
    baseCooldown: 14.5,
    worldId: 2,
    worldCompletionRatio: 1.0, // World 2 Final Stage (100%)
    isWorldFinalStage: true,
  },
};

export const ALL_ABILITY_IDS: AbilityId[] = ['fireball', 'freeze', 'heal', 'arcane-beam'];

/**
 * Derives the exact stage number within the world required to unlock an ability.
 * Scales dynamically if a world has more or fewer stages in the future.
 */
export function getAbilityUnlockStageNumber(abilityId: AbilityId): number {
  const def = ABILITY_DEFINITIONS[abilityId];
  const stageCount = getWorldStages(def.worldId).length || 5;

  if (def.isWorldFinalStage || def.worldCompletionRatio >= 1.0) {
    return stageCount;
  }

  return Math.max(1, Math.min(stageCount, Math.round(stageCount * def.worldCompletionRatio)));
}

/**
 * Returns formatted stage milestone ID, e.g. "1-2", "1-4", "2-3", "2-5".
 */
export function getAbilityUnlockStage(abilityId: AbilityId): string {
  const def = ABILITY_DEFINITIONS[abilityId];
  const stageNum = getAbilityUnlockStageNumber(abilityId);
  return `${def.worldId}-${stageNum}`;
}

/**
 * Checks if a specific ability milestone has been cleared.
 */
export function isAbilityMilestoneCleared(
  abilityId: AbilityId,
  completedStages: string[],
  highestUnlockedStage: number
): boolean {
  const def = ABILITY_DEFINITIONS[abilityId];
  const targetStageNum = getAbilityUnlockStageNumber(abilityId);
  const targetStageId = `${def.worldId}-${targetStageNum}`;

  // Direct check in completed stages
  if (completedStages.includes(targetStageId)) {
    return true;
  }

  // Fallback check against highestUnlockedStage
  const worldStageCount = getWorldStages(def.worldId).length || 5;
  const targetAbsoluteIndex = (def.worldId - 1) * worldStageCount + targetStageNum;
  // If player unlocked beyond target stage, it was cleared
  return highestUnlockedStage > targetAbsoluteIndex;
}

/**
 * Returns newly unlocked abilities when a stage is cleared.
 */
export function getAbilitiesUnlockedByStageClear(
  clearedStageId: string,
  alreadyUnlocked: AbilityId[]
): AbilityId[] {
  const newlyUnlocked: AbilityId[] = [];
  for (const id of ALL_ABILITY_IDS) {
    if (alreadyUnlocked.includes(id)) continue;
    const requiredStageId = getAbilityUnlockStage(id);
    if (clearedStageId === requiredStageId) {
      newlyUnlocked.push(id);
    }
  }
  return newlyUnlocked;
}

export interface AbilityUpgradeSpec {
  effects: string[];
}

export const ABILITY_UPGRADES: Record<AbilityId, AbilityUpgradeSpec> = {
  fireball: {
    effects: [
      '+30% blast damage',
      '+25% explosion radius',
      '-15% cooldown',
      '+40% blast damage',
      'twin fireballs',
    ],
  },
  freeze: {
    effects: [
      '+25% freeze radius',
      '+0.6s freeze duration',
      '-20% cooldown',
      '+35% post-freeze slow',
      'frost nova damage pulse',
    ],
  },
  heal: {
    effects: [
      '+6% more healing (26% max HP)',
      '-6s cooldown',
      'faster regeneration (3.2s)',
      '+8% more healing (34% max HP)',
      '-8s cooldown & ward shield',
    ],
  },
  'arcane-beam': {
    effects: [
      '+30% beam damage',
      '+25% beam width & reach',
      '-20% cooldown',
      '+45% beam damage',
      'beam leaves burning arcane rift',
    ],
  },
};

export function makeAbilityUpgradeChoice(
  id: AbilityId,
  currentLevel: number
): UpgradeChoice {
  const def = ABILITY_DEFINITIONS[id];
  const spec = ABILITY_UPGRADES[id];
  const nextLevel = currentLevel + 1;
  const effectIndex = Math.min(Math.max(0, currentLevel - 1), 4);
  const rarity: Rarity = nextLevel >= 4 ? 'epic' : nextLevel >= 2 ? 'rare' : 'common';

  return {
    id,
    title: def.name,
    description: currentLevel === 1 ? `Empower ${def.name}.` : `Level up ${def.name}.`,
    nextEffect: spec.effects[effectIndex],
    icon: def.icon,
    kind: 'ability',
    rarity,
    level: currentLevel,
  };
}
