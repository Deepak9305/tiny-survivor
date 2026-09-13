import Phaser from 'phaser';
import type { ProjectileSpec } from '../systems/WeaponSystem';

let projectileSequence = 0;

export class ProjectileEntity {
  readonly id = `projectile-${projectileSequence += 1}`;
  readonly body: Phaser.GameObjects.Arc;
  readonly spec: ProjectileSpec;
  x: number;
  y: number;
  private velocity = new Phaser.Math.Vector2();
  private remainingPierce: number;
  private age = 0;
  active = true;

  constructor(scene: Phaser.Scene, x: number, y: number, spec: ProjectileSpec) {
    this.x = x;
    this.y = y;
    this.spec = spec;
    this.remainingPierce = spec.pierce;
    this.body = scene.add.circle(x, y, spec.radius, spec.color, 0.95);
    this.body.setDepth(18);
    const targetAngle = (spec.target ? Phaser.Math.Angle.Between(x, y, spec.target.x, spec.target.y) : 0) + (spec.angle ?? 0);
    this.velocity.set(Math.cos(targetAngle), Math.sin(targetAngle)).scale(spec.speed);
    this.body.setStrokeStyle(2, 0xdffaff, 0.8);
  }

  update(delta: number): void {
    this.age += delta;
    this.x += this.velocity.x * delta;
    this.y += this.velocity.y * delta;
    this.body.setPosition(this.x, this.y);
    this.body.setScale(1 + Math.sin(this.age * 18) * 0.12);
    if (this.age > 4) this.active = false;
  }

  canPierce(): boolean {
    if (this.remainingPierce <= 0) { this.active = false; return false; }
    this.remainingPierce -= 1;
    return true;
  }

  destroy(): void { this.active = false; this.body.destroy(); }
}
