import * as THREE from 'three';

export class InputController {
  private readonly keys = new Set<string>();
  private readonly moveJoystick = new THREE.Vector2();
  private readonly aimJoystick = new THREE.Vector2();
  private readonly lastAimVector = new THREE.Vector2(1, 0);
  private aimActive = false;
  private primaryFireActive = false;
  private readonly onBackground: () => void;
  private readonly onAbilityKey?: (slot: 1 | 2 | 3 | 4) => void;

  constructor(
    onBackground: () => void,
    onAbilityKey?: (slot: 1 | 2 | 3 | 4) => void
  ) {
    this.onBackground = onBackground;
    this.onAbilityKey = onAbilityKey;
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    document.addEventListener('visibilitychange', this.handleVisibility);
  }

  setMovementVector(x: number, y: number): void {
    this.moveJoystick.set(x, y).clampLength(0, 1);
  }

  /**
   * Legacy/manual aim channel retained for desktop/debug compatibility.
   * Mobile combat now uses hold-to-fire + automatic target selection.
   */
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

  setPrimaryFire(active: boolean): void {
    this.primaryFireActive = active;
  }

  isPrimaryFireActive(): boolean {
    return this.primaryFireActive || this.keys.has('f') || this.keys.has('space');
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

    return this.aimActive || aimKeyActive;
  }

  getLastAimVector(): THREE.Vector2 {
    return this.lastAimVector.clone();
  }

  reset(): void {
    this.keys.clear();
    this.moveJoystick.set(0, 0);
    this.aimJoystick.set(0, 0);
    this.aimActive = false;
    this.primaryFireActive = false;
  }

  dispose(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    document.removeEventListener('visibilitychange', this.handleVisibility);
    this.reset();
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    const key = event.key.toLowerCase();
    const inputKey = event.code === 'Space' ? 'space' : key;

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

    if (inputKey === 'space' || key === 'f') {
      this.keys.add(inputKey === 'space' ? 'space' : 'f');
      this.primaryFireActive = true;
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
    if (event.code === 'Space') this.keys.delete('space');
    else this.keys.delete(key);
    if (event.code === 'Space' || key === 'f') {
      this.primaryFireActive = false;
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
