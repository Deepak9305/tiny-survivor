import * as THREE from 'three';
import {
  getCombatAutoAim,
  isPrimaryFireActive,
  resetCombatTargeting,
  setPrimaryFireActive,
  toggleAutoFire,
} from '../../game/systems/CombatTargeting';

export class InputController {
  private readonly keys = new Set<string>();
  private readonly moveJoystick = new THREE.Vector2();
  private readonly aimJoystick = new THREE.Vector2();
  private readonly lastAimVector = new THREE.Vector2(1, 0);
  private aimActive = false;
  private readonly onBackground: () => void;
  private readonly onAbilityKey?: (slot: 1 | 2 | 3 | 4) => void;
  private readonly onDash?: () => void;

  constructor(
    onBackground: () => void,
    onAbilityKey?: (slot: 1 | 2 | 3 | 4) => void,
    onDash?: () => void
  ) {
    this.onBackground = onBackground;
    this.onAbilityKey = onAbilityKey;
    this.onDash = onDash;
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('contextmenu', this.handleContextMenu);
    window.addEventListener('blur', this.handleBlur);
    document.addEventListener('visibilitychange', this.handleVisibility);
  }

  setMovementVector(x: number, y: number): void {
    this.moveJoystick.set(x, y).clampLength(0, 1);
  }

  /** Legacy manual-aim channel retained for desktop/debug controls. */
  setAimVector(x: number, y: number): void {
    const len = Math.sqrt(x * x + y * y);
    if (len > 0.12) {
      this.aimJoystick.set(x, y).clampLength(0, 1);
      this.lastAimVector.set(x / len, y / len);
      this.aimActive = true;
    } else {
      this.aimJoystick.set(0, 0);
      this.aimActive = false;
    }
  }

  getMovementVector(): THREE.Vector2 {
    const keyX = Number(this.keys.has('d')) - Number(this.keys.has('a'));
    const keyY = Number(this.keys.has('s')) - Number(this.keys.has('w'));
    if (keyX !== 0 || keyY !== 0) {
      return new THREE.Vector2(keyX, keyY).clampLength(0, 1);
    }
    return this.moveJoystick.clone();
  }

  getAimVector(): THREE.Vector2 {
    // Hold-to-fire still consumes the live automatic target direction, but this
    // automatic channel is deliberately NOT exposed as "manual aim active".
    if (isPrimaryFireActive()) {
      const autoAim = getCombatAutoAim(500);
      if (autoAim) {
        this.lastAimVector.set(autoAim.x, autoAim.y);
        return new THREE.Vector2(autoAim.x, autoAim.y);
      }
    }

    const aimKeyX =
      Number(this.keys.has('arrowright') || this.keys.has('l')) -
      Number(this.keys.has('arrowleft') || this.keys.has('j'));
    const aimKeyY =
      Number(this.keys.has('arrowdown') || this.keys.has('k')) -
      Number(this.keys.has('arrowup') || this.keys.has('i'));

    if (aimKeyX !== 0 || aimKeyY !== 0) {
      const vec = new THREE.Vector2(aimKeyX, aimKeyY).normalize();
      this.lastAimVector.copy(vec);
      return vec;
    }

    return this.aimJoystick.clone();
  }

  isAimActive(): boolean {
    const aimKeyActive =
      this.keys.has('arrowright') ||
      this.keys.has('arrowleft') ||
      this.keys.has('arrowup') ||
      this.keys.has('arrowdown') ||
      this.keys.has('i') ||
      this.keys.has('j') ||
      this.keys.has('k') ||
      this.keys.has('l');

    // Auto-targeting is not a manual aim state. This keeps the legacy Three.js
    // aim cone/line hidden while hold-to-fire continues using getCombatAutoAim().
    return this.aimActive || aimKeyActive;
  }

  getLastAimVector(): THREE.Vector2 {
    const autoAim = getCombatAutoAim(650);
    if (autoAim) return new THREE.Vector2(autoAim.x, autoAim.y);
    return this.lastAimVector.clone();
  }

  reset(): void {
    this.keys.clear();
    this.moveJoystick.set(0, 0);
    this.aimJoystick.set(0, 0);
    this.aimActive = false;
    resetCombatTargeting();
  }

  dispose(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('contextmenu', this.handleContextMenu);
    window.removeEventListener('blur', this.handleBlur);
    document.removeEventListener('visibilitychange', this.handleVisibility);
    this.reset();
  }

  private readonly handleContextMenu = (event: MouseEvent): void => {
    event.preventDefault();
  };

  private readonly handleMouseDown = (event: MouseEvent): void => {
    if (event.button === 0) setPrimaryFireActive(true);
    else if (event.button === 2) {
      event.preventDefault();
      this.onDash?.();
    }
  };

  private readonly handleMouseUp = (event: MouseEvent): void => {
    if (event.button === 0) setPrimaryFireActive(false);
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    const key = event.key.toLowerCase();

    if (key === 'c' || key === 't' || key === 'q') {
      toggleAutoFire();
      event.preventDefault();
      return;
    }

    if (event.code === 'Space' || key === 'shift' || key === 'e') {
      this.onDash?.();
      event.preventDefault();
      return;
    }

    if (key === '1') {
      this.onAbilityKey?.(1);
      event.preventDefault();
      return;
    }
    if (key === '2') {
      this.onAbilityKey?.(2);
      event.preventDefault();
      return;
    }
    if (key === '3') {
      this.onAbilityKey?.(3);
      event.preventDefault();
      return;
    }
    if (key === '4') {
      this.onAbilityKey?.(4);
      event.preventDefault();
      return;
    }

    if (key === 'f') {
      setPrimaryFireActive(true);
      event.preventDefault();
      return;
    }

    if (
      [
        'w',
        'a',
        's',
        'd',
        'arrowup',
        'arrowdown',
        'arrowleft',
        'arrowright',
        'i',
        'j',
        'k',
        'l',
      ].includes(key)
    ) {
      this.keys.add(key);
      event.preventDefault();
    }
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    const key = event.key.toLowerCase();
    this.keys.delete(key);
    if (key === 'f') {
      setPrimaryFireActive(false);
    }
  };

  private readonly handleBlur = (): void => {
    this.reset();
  };

  private readonly handleVisibility = (): void => {
    if (document.hidden) {
      this.reset();
      this.onBackground();
    }
  };
}
