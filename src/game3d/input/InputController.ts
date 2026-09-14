import * as THREE from 'three';

export class InputController {
  private readonly keys = new Set<string>();
  private readonly moveJoystick = new THREE.Vector2();
  private readonly aimJoystick = new THREE.Vector2();
  private readonly lastAimVector = new THREE.Vector2(1, 0);
  private aimActive = false;
  private readonly onBackground: () => void;

  constructor(onBackground: () => void) {
    this.onBackground = onBackground;
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    document.addEventListener('visibilitychange', this.handleVisibility);
  }

  setMovementVector(x: number, y: number): void {
    this.moveJoystick.set(x, y).clampLength(0, 1);
  }

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
    // Check arrow keys or IJKL for keyboard aiming
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
    this.keys.delete(event.key.toLowerCase());
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
