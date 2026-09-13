import Phaser from 'phaser';
import { ENEMY_BALANCE } from '../../data/balance';
import type { EnemyKind } from '../../types';
import type { SpatialEntity } from '../systems/SpatialGrid';

let enemySequence = 0;

export class EnemyEntity implements SpatialEntity {
  readonly id: string;
  readonly kind: EnemyKind;
  readonly elite: boolean;
  readonly radius: number;
  readonly maxHP: number;
  readonly baseSpeed: number;
  readonly contactDamage: number;
  readonly xpValue: number;
  readonly container: Phaser.GameObjects.Container;
  private readonly art: Phaser.GameObjects.Graphics;
  private readonly hpBar: Phaser.GameObjects.Graphics;
  private hp: number;
  private slowMultiplier = 1;
  private slowUntil = 0;
  private phaseTime = Math.random() * 5;

  constructor(private readonly scene: Phaser.Scene, kind: EnemyKind, x: number, y: number, elite = false, difficulty = 1) {
    const balance = ENEMY_BALANCE[kind];
    this.id = `enemy-${enemySequence += 1}`;
    this.kind = kind;
    this.elite = elite;
    this.radius = balance.radius * (elite ? 1.28 : 1);
    this.maxHP = balance.hp * difficulty * (elite ? 2.35 : 1);
    this.hp = this.maxHP;
    this.baseSpeed = balance.speed * (elite ? 1.08 : 1);
    this.contactDamage = balance.damage * difficulty * (elite ? 1.2 : 1);
    this.xpValue = balance.xp * (elite ? 4 : 1);
    this.art = scene.add.graphics();
    this.drawArt(balance.color);
    this.hpBar = scene.add.graphics();
    this.container = scene.add.container(x, y, [this.art, this.hpBar]);
    this.container.setDepth(10);
    this.updateHealthBar();
  }

  get x(): number { return this.container.x; }
  set x(value: number) { this.container.x = value; }
  get y(): number { return this.container.y; }
  set y(value: number) { this.container.y = value; }
  get currentHP(): number { return this.hp; }

  private drawArt(color: number): void {
    const dark = Phaser.Display.Color.ValueToColor(color).darken(35).color;
    if (this.kind === 'bat') {
      this.art.fillStyle(dark, 1);
      this.art.fillTriangle(-4, 0, -23, -11, -17, 12);
      this.art.fillTriangle(4, 0, 23, -11, 17, 12);
      this.art.fillStyle(color, 1);
      this.art.fillCircle(0, 0, this.radius * 0.66);
      this.art.fillStyle(0xffd86d, 1);
      this.art.fillCircle(-4, -2, 2);
      this.art.fillCircle(4, -2, 2);
    } else if (this.kind === 'slime') {
      this.art.fillStyle(color, 1);
      this.art.fillEllipse(0, 4, this.radius * 2.05, this.radius * 1.7);
      this.art.fillStyle(0x13364a, 1);
      this.art.fillCircle(-5, 2, 2.3);
      this.art.fillCircle(5, 2, 2.3);
      this.art.lineStyle(2, 0x0d2738, 1);
      this.art.lineBetween(-6, 7, 6, 7);
    } else if (this.kind === 'ghost') {
      this.art.fillStyle(color, 0.8);
      this.art.fillCircle(0, -4, this.radius * 0.85);
      this.art.fillTriangle(-this.radius, 4, -this.radius * 0.6, 22, -2, 10);
      this.art.fillTriangle(this.radius, 4, this.radius * 0.6, 22, 2, 10);
      this.art.fillStyle(0x173251, 1);
      this.art.fillCircle(-5, -5, 2.4);
      this.art.fillCircle(5, -5, 2.4);
    } else if (this.kind === 'archer') {
      this.art.fillStyle(0x3b2632, 1);
      this.art.fillRoundedRect(-11, -3, 22, 23, 7);
      this.art.fillStyle(color, 1);
      this.art.fillCircle(0, -11, 13);
      this.art.lineStyle(2, 0x9fe9ff, 1);
      this.art.strokeCircle(13, 2, 12);
      this.art.fillStyle(0x271f38, 1);
      this.art.fillCircle(-4, -12, 2);
      this.art.fillCircle(4, -12, 2);
    } else if (this.kind === 'knight') {
      this.art.fillStyle(0x253650, 1);
      this.art.fillRoundedRect(-16, -2, 32, 29, 8);
      this.art.fillStyle(color, 1);
      this.art.fillRoundedRect(-17, -21, 34, 26, 10);
      this.art.fillStyle(0xe64e67, 1);
      this.art.fillRect(-7, -9, 14, 4);
      this.art.lineStyle(3, 0xffc66b, 1);
      this.art.beginPath();
      this.art.moveTo(15, -7);
      this.art.lineTo(29, 23);
      this.art.strokePath();
    } else if (this.kind === 'demon' || this.kind === 'imp') {
      this.art.fillStyle(dark, 1);
      this.art.fillTriangle(-10, -11, -20, -26, -3, -18);
      this.art.fillTriangle(10, -11, 20, -26, 3, -18);
      this.art.fillStyle(color, 1);
      this.art.fillCircle(0, 0, this.radius);
      this.art.fillStyle(0xffd175, 1);
      this.art.fillCircle(-5, -3, 2.5);
      this.art.fillCircle(5, -3, 2.5);
    } else {
      this.art.fillStyle(0x26354b, 1);
      this.art.fillRoundedRect(-12, 0, 24, 22, 6);
      this.art.fillStyle(color, 1);
      this.art.fillCircle(0, -12, 13);
      this.art.fillStyle(0x172133, 1);
      this.art.fillRect(-8, -14, 16, 4);
      this.art.fillStyle(0x5ddcff, 1);
      this.art.fillCircle(-4, -12, 2);
      this.art.fillCircle(4, -12, 2);
      this.art.lineStyle(2, 0x9eaec4, 1);
      this.art.lineBetween(-7, 4, 7, 4);
      this.art.lineBetween(-6, 9, 6, 9);
    }
    if (this.elite) {
      this.art.lineStyle(2.5, 0xffbf52, 0.95);
      this.art.strokeCircle(0, 0, this.radius + 7);
      this.art.fillStyle(0xffbf52, 1);
      this.art.fillTriangle(0, -this.radius - 13, -5, -this.radius - 4, 5, -this.radius - 4);
    }
  }

  update(playerX: number, playerY: number, delta: number, now: number): void {
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const distance = Math.max(1, Math.sqrt(dx * dx + dy * dy));
    let directionX = dx / distance;
    let directionY = dy / distance;
    const preferredDistance = this.kind === 'archer' ? 172 : 0;
    if (preferredDistance && distance < preferredDistance) {
      directionX *= -1;
      directionY *= -1;
    }
    if (this.kind === 'ghost' && Math.floor(now * 2) % 9 === 0) {
      this.container.setAlpha(0.42);
    } else {
      this.container.setAlpha(1);
    }
    const speed = this.baseSpeed * (now < this.slowUntil ? this.slowMultiplier : 1);
    if (distance > 36 || preferredDistance) {
      this.x += directionX * speed * delta;
      this.y += directionY * speed * delta;
    }
    this.phaseTime += delta;
    this.container.setScale(1 + (this.elite ? Math.sin(this.phaseTime * 4) * 0.035 : 0));
    this.updateHealthBar();
  }

  applySlow(multiplier: number, duration: number, now: number): void {
    this.slowMultiplier = Math.min(this.slowMultiplier, multiplier);
    this.slowUntil = Math.max(this.slowUntil, now + duration);
  }

  damage(amount: number): boolean {
    this.hp = Math.max(0, this.hp - Math.max(1, amount));
    this.updateHealthBar();
    return this.hp <= 0;
  }

  private updateHealthBar(): void {
    this.hpBar.clear();
    if (!this.elite && this.hp >= this.maxHP) return;
    const width = this.radius * 2.2;
    this.hpBar.fillStyle(0x101b2b, 0.9);
    this.hpBar.fillRoundedRect(-width / 2, -this.radius - 18, width, 4, 2);
    this.hpBar.fillStyle(this.elite ? 0xffb64a : 0x59d7f5, 1);
    this.hpBar.fillRoundedRect(-width / 2, -this.radius - 18, width * Math.max(0, this.hp / this.maxHP), 4, 2);
  }

  destroy(): void { this.container.destroy(true); }
}
