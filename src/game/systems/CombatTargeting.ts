export interface CombatAimVector {
  x: number;
  y: number;
}

let primaryFireActive = false;
let autoAim: CombatAimVector | undefined;
let autoAimUpdatedAt = 0;

export function setPrimaryFireActive(active: boolean): void {
  primaryFireActive = active;
  if (!active) {
    // Keep the last target direction briefly for tap-to-cast specials.
    // It is cleared by the game input reset when a run pauses/ends.
  }
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

export function resetCombatTargeting(): void {
  primaryFireActive = false;
  clearCombatAutoAim();
}
