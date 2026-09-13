import * as THREE from 'three';

export class InputController {
  private readonly keys = new Set<string>();
  private readonly joystick = new THREE.Vector2();
  private readonly onBackground: () => void;

  constructor(onBackground: () => void) {
    this.onBackground = onBackground;
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    document.addEventListener('visibilitychange', this.handleVisibility);
  }

  setJoystickVector(x: number, y: number): void {
    this.joystick.set(x, y).clampLength(0, 1);
  }

  getMovementVector(): THREE.Vector2 {
    const x = Number(this.keys.has('a') || this.keys.has('arrowleft')) * -1 + Number(this.keys.has('d') || this.keys.has('arrowright'));
    const y = Number(this.keys.has('w') || this.keys.has('arrowup')) * -1 + Number(this.keys.has('s') || this.keys.has('arrowdown'));
    if (x !== 0 || y !== 0) return new THREE.Vector2(x, y).clampLength(0, 1);
    return this.joystick.clone();
  }

  reset(): void {
    this.keys.clear();
    this.joystick.set(0, 0);
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
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
      this.keys.add(key);
      event.preventDefault();
    }
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => { this.keys.delete(event.key.toLowerCase()); };
  private readonly handleBlur = (): void => { this.reset(); };
  private readonly handleVisibility = (): void => { if (document.hidden) { this.reset(); this.onBackground(); } };
}
