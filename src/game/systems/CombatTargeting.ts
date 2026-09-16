export interface CombatAimVector {
  x: number;
  y: number;
}

export interface CombatFlowState {
  meter: number;
  overdrive: boolean;
  overdriveRemaining: number;
  streak: number;
}

export interface CombatWaveAnnouncement {
  label: string;
  detail: string;
  tone: 'danger' | 'elite' | 'boss';
}

let primaryFireActive = false;
let autoAim: CombatAimVector | undefined;
let autoAimUpdatedAt = 0;
let combatFlowState: CombatFlowState = {
  meter: 0,
  overdrive: false,
  overdriveRemaining: 0,
  streak: 0,
};

export function setPrimaryFireActive(active: boolean): void {
  primaryFireActive = active;
}

export function isPrimaryFireActive(): boolean {
  return primaryFireActive;
}

export function setCombatAutoAim(x: number, y: number): void {
  const length = Math.hypot(x, y);
  if (length < 0.001) return;
  autoAim = { x: x / length, y: y / length };
  autoAimUpdatedAt = performance.now();
}

export function getCombatAutoAim(maxAgeMs = 350): CombatAimVector | undefined {
  if (!autoAim) return undefined;
  if (performance.now() - autoAimUpdatedAt > maxAgeMs) return undefined;
  return { ...autoAim };
}

export function clearCombatAutoAim(): void {
  autoAim = undefined;
  autoAimUpdatedAt = 0;
}

export function setCombatFlowState(next: CombatFlowState): void {
  const normalized: CombatFlowState = {
    meter: Math.max(0, Math.min(100, next.meter)),
    overdrive: next.overdrive,
    overdriveRemaining: Math.max(0, next.overdriveRemaining),
    streak: Math.max(0, Math.floor(next.streak)),
  };

  const changed =
    Math.abs(normalized.meter - combatFlowState.meter) >= 0.5 ||
    normalized.overdrive !== combatFlowState.overdrive ||
    Math.abs(normalized.overdriveRemaining - combatFlowState.overdriveRemaining) >= 0.08 ||
    normalized.streak !== combatFlowState.streak;

  combatFlowState = normalized;
  if (changed && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<CombatFlowState>('tiny-survivor-combat-flow', {
      detail: { ...combatFlowState },
    }));
  }
}

export function getCombatFlowState(): CombatFlowState {
  return { ...combatFlowState };
}

export function announceCombatWave(announcement: CombatWaveAnnouncement): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<CombatWaveAnnouncement>('tiny-survivor-wave', {
    detail: announcement,
  }));
}

export function resetCombatTargeting(): void {
  primaryFireActive = false;
  clearCombatAutoAim();
}
