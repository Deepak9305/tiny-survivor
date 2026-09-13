import Phaser from 'phaser';

export interface PlayerStats {
  maxHP: number;
  currentHP: number;
  armor: number;
  moveSpeed: number;
  pickupRadius: number;
  damageMultiplier: number;
  cooldownMultiplier: number;
  critChance: number;
  critMultiplier: number;
  xpMultiplier: number;
}

export class PlayerController {
  readonly container: Phaser.GameObjects.Container;
  readonly stats: PlayerStats;
  private readonly aura: Phaser.GameObjects.Arc;
  private movement = new Phaser.Math.Vector2();
  private invulnerableUntil = 0;
  private visualTime = 0;

  constructor(private readonly scene: Phaser.Scene, x: number, y: number, stats: PlayerStats) {
    this.stats = stats;
    const shadow = scene.add.ellipse(0, 20, 42, 13, 0x02070d, 0.48);
    this.aura = scene.add.circle(0, 5, 28, 0x44caff, 0.1);
    const art = scene.add.graphics();
    art.fillStyle(0x183569, 1);
    art.fillTriangle(0, -28, -25, 21, 25, 21);
    art.fillStyle(0x2b56a0, 1);
    art.fillRoundedRect(-15, -7, 30, 31, 9);
    art.fillStyle(0x101c35, 1);
    art.fillCircle(0, -7, 16);
    art.fillStyle(0x6ee7ff, 0.92);
    art.fillCircle(-5, -8, 2.5);
    art.fillCircle(5, -8, 2.5);
    art.fillStyle(0xd9565d, 1);
    art.fillTriangle(-11, 8, 23, 12, 4, 18);
    art.lineStyle(3, 0xcbe8ff, 1);
    art.beginPath();
    art.moveTo(13, -2);
    art.lineTo(27, 23);
    art.strokePath();
    art.lineStyle(1.5, 0x7eeaff, 0.75);
    art.strokeCircle(0, 5, 27);
    this.container = scene.add.container(x, y, [shadow, this.aura, art]);
    this.container.setDepth(20);
  }

  initializePlayer(): void {
    this.stats.currentHP = this.stats.maxHP;
    this.movement.set(0, 0);
    this.invulnerableUntil = 0;
  }

  updateMovement(delta: number, worldWidth: number, worldHeight: number): void {
    const length = this.movement.length();
    if (length > 0.02) {
      const direction = this.movement.clone().normalize();
      this.container.x = Phaser.Math.Clamp(this.container.x + direction.x * this.stats.moveSpeed * delta, 34, worldWidth - 34);
      this.container.y = Phaser.Math.Clamp(this.container.y + direction.y * this.stats.moveSpeed * delta, 76, worldHeight - 34);
    }
    this.visualTime += delta;
    this.container.y += Math.sin(this.visualTime * 6) * 0.05;
    this.aura.setScale(1 + Math.sin(this.visualTime * 3) * 0.06);
  }

  setMovementVector(x: number, y: number): void {
    const vector = new Phaser.Math.Vector2(x, y);
    if (vector.length() < 0.12) vector.set(0, 0);
    this.movement.copy(vector.limit(1));
  }

  getMovementVector(): Phaser.Math.Vector2 { return this.movement.clone(); }

  takeDamage(amount: number, now: number, invulnerabilityDuration = 0.58): boolean {
    if (this.isInvulnerable(now)) return false;
    this.stats.currentHP = Math.max(0, this.stats.currentHP - Math.max(1, amount));
    this.applyInvulnerability(now, invulnerabilityDuration);
    this.container.setAlpha(0.52);
    this.scene.time.delayedCall(invulnerabilityDuration * 1000, () => this.container.setAlpha(1));
    return true;
  }

  heal(amount: number): void {
    this.stats.currentHP = Math.min(this.stats.maxHP, this.stats.currentHP + Math.max(0, amount));
  }

  applyInvulnerability(now: number, duration: number): void { this.invulnerableUntil = Math.max(this.invulnerableUntil, now + duration); }
  isInvulnerable(now: number): boolean { return now < this.invulnerableUntil; }
  setMoveSpeed(value: number): void { this.stats.moveSpeed = Math.max(40, value); }
  resetPlayer(): void { this.initializePlayer(); }
  destroy(): void { this.container.destroy(true); }
}
