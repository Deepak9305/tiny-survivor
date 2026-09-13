import Phaser from 'phaser';
import { ENEMY_BALANCE, BOSS_BALANCE, PLAYER_BALANCE } from '../../data/balance';
import { generateUpgradeChoices } from '../../data/upgrades';
import type { GameSnapshot, SaveData, StageDefinition, UpgradeChoice, RunResult, EnemyKind } from '../../types';
import { HapticsService } from '../../services/hapticsService';
import { EnemyEntity } from '../entities/EnemyEntity';
import { PlayerController, type PlayerStats } from '../entities/PlayerController';
import { ProjectileEntity } from '../entities/ProjectileEntity';
import { BossSystem, type BossAttack } from '../systems/BossSystem';
import { calculateDamage } from '../systems/DamageSystem';
import { EnemySpawner } from '../systems/EnemySpawner';
import { RunController } from '../systems/RunController';
import { SpatialGrid } from '../systems/SpatialGrid';
import { WeaponSystem, type ProjectileSpec, type TargetPoint } from '../systems/WeaponSystem';
import { XPSystem } from '../systems/XPSystem';

const WORLD_WIDTH = 1100;
const WORLD_HEIGHT = 1900;
const VIEW_WIDTH = 360;
const VIEW_HEIGHT = 720;

interface XpPickup {
  id: string;
  x: number;
  y: number;
  value: number;
  body: Phaser.GameObjects.Arc;
  active: boolean;
  speed: number;
}

interface EnemyProjectile {
  body: Phaser.GameObjects.Arc;
  x: number;
  y: number;
  velocity: Phaser.Math.Vector2;
  age: number;
  active: boolean;
}

export interface GameSceneCallbacks {
  onSnapshot: (snapshot: GameSnapshot) => void;
  onLevelUp: (choices: UpgradeChoice[]) => void;
  onGameOver: (result: RunResult) => void;
  onStageClear: (result: RunResult) => void;
  onPaused: (paused: boolean) => void;
  onBossWarning: () => void;
}

export interface GameSceneData {
  stage: StageDefinition;
  save: SaveData;
  callbacks: GameSceneCallbacks;
}

export class GameScene extends Phaser.Scene {
  private stage!: StageDefinition;
  private save!: SaveData;
  private callbacks!: GameSceneCallbacks;
  private player!: PlayerController;
  private readonly enemies: EnemyEntity[] = [];
  private readonly projectiles: ProjectileEntity[] = [];
  private readonly enemyProjectiles: EnemyProjectile[] = [];
  private readonly xpPickups: XpPickup[] = [];
  private readonly spatialGrid = new SpatialGrid<EnemyEntity>(150);
  private xpSystem = new XPSystem();
  private weaponSystem!: WeaponSystem;
  private enemySpawner!: EnemySpawner;
  private bossSystem!: BossSystem;
  private runController!: RunController;
  private passiveLevels: Record<string, number> = {};
  private gameTime = 0;
  private snapshotTimer = 0;
  private orbitAngle = 0;
  private readonly orbitVisuals: Phaser.GameObjects.Arc[] = [];
  private bossVisual?: Phaser.GameObjects.Container;
  private bossArt?: Phaser.GameObjects.Graphics;
  private bossWarning?: Phaser.GameObjects.Graphics;
  private bossSpawned = false;
  private bossWarningShown = false;
  private isRunPaused = false;
  private isFinished = false;
  private levelUpOpen = false;
  private reviveUsed = false;
  private joystickPointerId?: number;
  private joystickOrigin = new Phaser.Math.Vector2(76, VIEW_HEIGHT - 92);
  private readonly joystickRadius = 48;
  private joystickBase!: Phaser.GameObjects.Arc;
  private joystickKnob!: Phaser.GameObjects.Arc;
  private keyboard?: Phaser.Input.Keyboard.KeyboardPlugin;
  private inputKeys: Record<string, Phaser.Input.Keyboard.Key> = {};
  private readonly joystickMovement = new Phaser.Math.Vector2();
  private lastOrbitDamage = 0;
  private pickupSequence = 0;
  private enemyProjectileSequence = 0;
  private kills = 0;
  private eliteKills = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: GameSceneData): void {
    this.stage = data.stage;
    this.save = data.save;
    this.callbacks = data.callbacks;
    this.runController = new RunController(this.stage.id, this.stage.name);
  }

  create(): void {
    this.createArena();
    this.createPlayer();
    this.createSystems();
    this.createJoystick();
    this.createKeyboard();
    this.resizeCamera(this.scale.gameSize);
    this.scale.on('resize', this.resizeCamera, this);
    this.cameras.main.startFollow(this.player.container, true, 0.09, 0.09);
    this.runController.startRun();
    this.callbacks.onSnapshot(this.getSnapshot());
  }

  private createArena(): void {
    this.add.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT, 0x071322).setDepth(-20);
    const atmosphere = this.add.graphics().setDepth(-19);
    atmosphere.fillStyle(0x0d2540, 0.55);
    atmosphere.fillCircle(190, 230, 210);
    atmosphere.fillStyle(0x18395c, 0.2);
    atmosphere.fillCircle(900, 470, 320);
    atmosphere.fillStyle(0x251c4d, 0.2);
    atmosphere.fillCircle(520, 1500, 360);
    atmosphere.lineStyle(1, 0x1d4c70, 0.22);
    for (let x = 20; x < WORLD_WIDTH; x += 64) atmosphere.lineBetween(x, 0, x, WORLD_HEIGHT);
    for (let y = 40; y < WORLD_HEIGHT; y += 64) atmosphere.lineBetween(0, y, WORLD_WIDTH, y);
    for (let index = 0; index < 88; index += 1) {
      const x = 32 + ((index * 173) % (WORLD_WIDTH - 64));
      const y = 44 + ((index * 97) % (WORLD_HEIGHT - 88));
      if (Math.abs(x - WORLD_WIDTH / 2) < 120 && Math.abs(y - WORLD_HEIGHT / 2) < 180) continue;
      const grave = this.add.graphics().setDepth(-5);
      grave.fillStyle(index % 4 === 0 ? 0x16273e : 0x101f34, 0.92);
      grave.fillRoundedRect(x - 9, y - 13, 18, 27, 7);
      grave.fillStyle(0x0a1422, 0.8);
      grave.fillRect(x - 2, y - 3, 4, 9);
      grave.fillRect(x - 5, y, 10, 3);
      if (index % 5 === 0) {
        grave.fillStyle(0xf4b35e, 0.42);
        grave.fillCircle(x + 14, y + 10, 2);
      }
    }
    const moon = this.add.circle(870, 170, 74, 0x9edfff, 0.12).setDepth(-18);
    this.add.circle(870, 170, 53, 0x8be9ff, 0.16).setDepth(-18);
    moon.setBlendMode(Phaser.BlendModes.ADD);
    this.add.text(54, 92, this.stage.biome.toUpperCase(), { fontFamily: 'Barlow Condensed', fontSize: '13px', color: '#79c9ed', letterSpacing: 2 }).setDepth(-2).setAlpha(0.6);
  }

  private createPlayer(): void {
    const upgrades = this.save.permanentUpgrades;
    const maxHP = PLAYER_BALANCE.maxHp * (1 + (upgrades.maxHp ?? 0) * 0.12);
    const stats: PlayerStats = {
      maxHP,
      currentHP: maxHP,
      armor: (upgrades.armor ?? 0) * 0.07,
      moveSpeed: PLAYER_BALANCE.moveSpeed * (1 + (upgrades.moveSpeed ?? 0) * 0.06),
      pickupRadius: PLAYER_BALANCE.pickupRadius + (upgrades.magnet ?? 0) * 20,
      damageMultiplier: 1 + (upgrades.damage ?? 0) * 0.1,
      cooldownMultiplier: 1,
      critChance: PLAYER_BALANCE.critChance + (upgrades.critChance ?? 0) * 0.025,
      critMultiplier: PLAYER_BALANCE.critMultiplier,
      xpMultiplier: 1 + (upgrades.xpGain ?? 0) * 0.08,
    };
    this.player = new PlayerController(this, WORLD_WIDTH / 2, WORLD_HEIGHT / 2, stats);
    this.player.initializePlayer();
  }

  private createSystems(): void {
    this.weaponSystem = new WeaponSystem({
      getPlayerPosition: () => ({ x: this.player.container.x, y: this.player.container.y }),
      findNearestTarget: () => this.findNearestTarget(),
      findTargetsInRadius: (x, y, radius) => this.spatialGrid.queryRadius(x, y, radius).map((enemy) => ({ id: enemy.id, x: enemy.x, y: enemy.y })),
      fireProjectile: (spec) => this.fireProjectile(spec),
      dealAreaDamage: (x, y, radius, damage, color) => this.dealAreaDamage(x, y, radius, damage, color),
      dealOrbitDamage: (x, y, radius, damage) => this.dealOrbitDamage(x, y, radius, damage),
      getDamageMultiplier: () => this.player.stats.damageMultiplier,
      getCooldownMultiplier: () => this.player.stats.cooldownMultiplier,
    });
    this.enemySpawner = new EnemySpawner({
      getPlayerPosition: () => ({ x: this.player.container.x, y: this.player.container.y }),
      getWorldSize: () => ({ width: WORLD_WIDTH, height: WORLD_HEIGHT }),
      getAliveCount: () => this.enemies.length,
      spawnEnemy: (type, x, y, elite) => this.spawnEnemy(type, x, y, elite),
    });
    this.enemySpawner.loadStageTimeline(this.stage);
    this.bossSystem = new BossSystem({
      getPlayerPosition: () => ({ x: this.player.container.x, y: this.player.container.y }),
      getBossPosition: () => ({ x: this.bossVisual?.x ?? 0, y: this.bossVisual?.y ?? 0 }),
      setBossPosition: (x, y) => this.setBossPosition(x, y),
      spawnSummon: () => {
        for (let index = 0; index < 4; index += 1) {
          const angle = index * (Math.PI / 2);
          this.spawnEnemy('skeleton', (this.bossVisual?.x ?? WORLD_WIDTH / 2) + Math.cos(angle) * 88, (this.bossVisual?.y ?? WORLD_HEIGHT / 2) + Math.sin(angle) * 88, false);
        }
      },
      telegraphAttack: (attack, x, y) => this.telegraphBossAttack(attack, x, y),
      executeAttack: (attack, x, y) => this.executeBossAttack(attack, x, y),
    });
  }

  private createJoystick(): void {
    this.joystickBase = this.add.circle(0, 0, this.joystickRadius, 0x0b1e34, 0.78);
    this.joystickKnob = this.add.circle(0, 0, 22, 0x86b6cf, 0.82);
    this.joystickBase.setScrollFactor(0).setDepth(100).setStrokeStyle(2, 0x6b9bb8, 0.45);
    this.joystickKnob.setScrollFactor(0).setDepth(101).setStrokeStyle(2, 0xb8e6f7, 0.55);
    this.positionJoystick(this.scale.gameSize);
    this.input.addPointer(2);
    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);
    this.input.on('pointerout', this.onPointerUp, this);
    this.input.on('gameout', this.resetJoystick, this);
  }

  private createKeyboard(): void {
    if (!this.input.keyboard) return;
    this.keyboard = this.input.keyboard;
    this.inputKeys = this.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT') as Record<string, Phaser.Input.Keyboard.Key>;
  }

  private resizeCamera(gameSize: Phaser.Structs.Size): void {
    const zoom = Math.min(gameSize.width / VIEW_WIDTH, gameSize.height / VIEW_HEIGHT);
    this.cameras.main.setZoom(Math.max(0.7, zoom));
    this.positionJoystick(gameSize);
  }

  private positionJoystick(gameSize: Phaser.Structs.Size): void {
    this.joystickOrigin.set(76, gameSize.height - 92);
    this.joystickBase.setPosition(this.joystickOrigin.x, this.joystickOrigin.y);
    if (this.joystickPointerId === undefined) this.joystickKnob.setPosition(this.joystickOrigin.x, this.joystickOrigin.y);
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.isRunPaused || this.isFinished || this.joystickPointerId !== undefined) return;
    const bottomSafe = this.scale.gameSize.height * 0.55;
    if (pointer.y < bottomSafe || pointer.x > this.scale.gameSize.width * 0.48) return;
    this.joystickPointerId = pointer.id;
    this.onPointerMove(pointer);
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (this.joystickPointerId !== pointer.id) return;
    const offset = new Phaser.Math.Vector2(pointer.x - this.joystickOrigin.x, pointer.y - this.joystickOrigin.y);
    if (offset.length() > this.joystickRadius) offset.setLength(this.joystickRadius);
    this.joystickKnob.setPosition(this.joystickOrigin.x + offset.x, this.joystickOrigin.y + offset.y);
    this.joystickMovement.set(offset.x / this.joystickRadius, offset.y / this.joystickRadius);
  }

  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    if (this.joystickPointerId !== pointer.id) return;
    this.resetJoystick();
  }

  resetJoystick = (): void => {
    this.joystickPointerId = undefined;
    this.joystickMovement.set(0, 0);
    this.joystickKnob.setPosition(this.joystickOrigin.x, this.joystickOrigin.y);
  };

  update(_time: number, deltaMs: number): void {
    if (this.isRunPaused || this.isFinished) return;
    const delta = Math.min(0.034, Math.max(0.001, deltaMs / 1000));
    this.gameTime += delta;
    this.snapshotTimer -= delta;
    this.orbitAngle += delta * 1.8;
    const keyboardVector = this.getKeyboardVector();
    this.player.setMovementVector(keyboardVector.x || this.joystickMovement.x, keyboardVector.y || this.joystickMovement.y);
    this.player.updateMovement(delta, WORLD_WIDTH, WORLD_HEIGHT);
    this.enemySpawner.update(delta);
    this.spatialGrid.clear();
    for (const enemy of this.enemies) this.spatialGrid.insert(enemy);
    this.updateEnemies(delta);
    this.weaponSystem.update(delta);
    this.updateProjectiles(delta);
    this.updateEnemyProjectiles(delta);
    this.updatePickups(delta);
    this.updateOrbitVisuals();
    this.checkBossTimer();
    if (this.bossSpawned) this.bossSystem.updateBoss(delta);
    this.checkQueuedLevelUp();
    if (this.snapshotTimer <= 0) {
      this.snapshotTimer = 0.1;
      this.callbacks.onSnapshot(this.getSnapshot());
    }
  }

  private getKeyboardVector(): Phaser.Math.Vector2 {
    if (!this.keyboard) return new Phaser.Math.Vector2();
    const keys = this.inputKeys;
    const x = Number(Boolean(keys.A?.isDown || keys.LEFT?.isDown)) * -1 + Number(Boolean(keys.D?.isDown || keys.RIGHT?.isDown));
    const y = Number(Boolean(keys.W?.isDown || keys.UP?.isDown)) * -1 + Number(Boolean(keys.S?.isDown || keys.DOWN?.isDown));
    return new Phaser.Math.Vector2(x, y).limit(1);
  }

  private updateEnemies(delta: number): void {
    const playerX = this.player.container.x;
    const playerY = this.player.container.y;
    for (let index = this.enemies.length - 1; index >= 0; index -= 1) {
      const enemy = this.enemies[index];
      enemy.update(playerX, playerY, delta, this.gameTime);
      const dx = enemy.x - playerX;
      const dy = enemy.y - playerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < enemy.radius + 24 && this.player.takeDamage(this.getPlayerDamage(enemy.contactDamage), this.gameTime, 0.72)) {
        this.spawnDamageNumber(playerX, playerY - 30, Math.round(enemy.contactDamage), false, 0xff6673);
        HapticsService.medium(this.save.settings.haptics);
        this.callbacks.onSnapshot(this.getSnapshot());
        if (this.player.stats.currentHP <= 0) {
          this.finishGameOver();
          return;
        }
      }
      if (enemy.kind === 'archer' && distance < 250 && Math.random() < delta * 0.25) this.fireEnemyProjectile(enemy);
      if (enemy.kind === 'imp' && distance < enemy.radius + 22) {
        this.dealAreaDamage(enemy.x, enemy.y, 88, enemy.contactDamage * 1.35, 0xff774b);
        this.removeEnemy(index, enemy, false);
      }
    }
  }

  private getPlayerDamage(amount: number): number {
    return Math.max(1, amount * 0.68 * (1 - Math.min(0.75, this.player.stats.armor)));
  }

  private spawnEnemy(type: EnemyKind, x: number, y: number, elite: boolean): void {
    const difficulty = 0.86 + this.gameTime / this.stage.duration * 0.85;
    const enemy = new EnemyEntity(this, type, x, y, elite, difficulty);
    this.enemies.push(enemy);
    this.spatialGrid.insert(enemy);
  }

  private removeEnemy(index: number, enemy: EnemyEntity, dropXp = true): void {
    const x = enemy.x;
    const y = enemy.y;
    this.spatialGrid.remove(enemy);
    enemy.destroy();
    this.enemies.splice(index, 1);
    if (dropXp) this.spawnXP(x, y, enemy.xpValue);
  }

  private findNearestTarget(): TargetPoint | undefined {
    const playerX = this.player.container.x;
    const playerY = this.player.container.y;
    const targets = this.spatialGrid.queryRadius(playerX, playerY, 570);
    let nearest: TargetPoint | undefined;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const enemy of targets) {
      const dx = enemy.x - playerX;
      const dy = enemy.y - playerY;
      const distance = dx * dx + dy * dy;
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = { id: enemy.id, x: enemy.x, y: enemy.y };
      }
    }
    if (this.bossSpawned && this.bossSystem.isActive() && this.bossVisual) {
      const dx = this.bossVisual.x - playerX;
      const dy = this.bossVisual.y - playerY;
      if (dx * dx + dy * dy < nearestDistance) nearest = { id: 'boss', x: this.bossVisual.x, y: this.bossVisual.y };
    }
    return nearest;
  }

  private fireProjectile(spec: ProjectileSpec): void {
    const projectile = new ProjectileEntity(this, this.player.container.x, this.player.container.y, spec);
    this.projectiles.push(projectile);
  }

  private updateProjectiles(delta: number): void {
    for (let projectileIndex = this.projectiles.length - 1; projectileIndex >= 0; projectileIndex -= 1) {
      const projectile = this.projectiles[projectileIndex];
      projectile.update(delta);
      let hit = false;
      if (projectile.spec.target?.id === 'boss' && this.bossSpawned && this.bossSystem.isActive() && this.bossVisual) {
        const dx = projectile.x - this.bossVisual.x;
        const dy = projectile.y - this.bossVisual.y;
        if (Math.sqrt(dx * dx + dy * dy) < 42 + projectile.spec.radius) {
          this.damageBoss(projectile.spec.damage);
          hit = true;
          projectile.canPierce();
        }
      }
      if (!hit) {
        for (let enemyIndex = this.enemies.length - 1; enemyIndex >= 0; enemyIndex -= 1) {
          const enemy = this.enemies[enemyIndex];
          const dx = projectile.x - enemy.x;
          const dy = projectile.y - enemy.y;
          if (Math.sqrt(dx * dx + dy * dy) > enemy.radius + projectile.spec.radius + 2) continue;
          this.damageEnemy(enemyIndex, enemy, projectile.spec.damage, projectile.spec.color);
          if (projectile.spec.explosive) this.dealAreaDamage(projectile.x, projectile.y, 68, projectile.spec.damage * 0.64, projectile.spec.color);
          hit = true;
          if (projectile.canPierce()) break;
        }
      }
      if (!projectile.active || hit && !projectile.active) {
        projectile.destroy();
        this.projectiles.splice(projectileIndex, 1);
      }
    }
  }

  private damageEnemy(index: number, enemy: EnemyEntity, baseDamage: number, color: number): void {
    const result = calculateDamage({ baseDamage, canCrit: true, critChance: this.player.stats.critChance, critMultiplier: this.player.stats.critMultiplier });
    const killed = enemy.damage(result.finalDamage);
    this.spawnDamageNumber(enemy.x, enemy.y - enemy.radius - 8, result.finalDamage, result.critical, result.critical ? 0xffd37c : color);
    this.spawnHitSpark(enemy.x, enemy.y, color);
    if (killed) {
      const wasElite = enemy.elite;
      this.removeEnemy(index, enemy, true);
      this.onEnemyKilled(wasElite);
    }
  }

  private dealAreaDamage(x: number, y: number, radius: number, damage: number, color: number): void {
    const ring = this.add.circle(x, y, radius, color, 0.12).setStrokeStyle(2, color, 0.6).setDepth(7);
    this.tweens.add({ targets: ring, scale: 1.35, alpha: 0, duration: 280, onComplete: () => ring.destroy() });
    const targets = this.spatialGrid.queryRadius(x, y, radius);
    for (const enemy of [...targets]) {
      const index = this.enemies.indexOf(enemy);
      if (index < 0) continue;
      const result = calculateDamage({ baseDamage: damage, canCrit: true, critChance: this.player.stats.critChance, critMultiplier: this.player.stats.critMultiplier });
      if (enemy.kind === 'slime') enemy.applySlow(0.82, 1.5, this.gameTime);
      const killed = enemy.damage(result.finalDamage);
      this.spawnDamageNumber(enemy.x, enemy.y - enemy.radius - 8, result.finalDamage, result.critical, color);
      if (killed) {
        const wasElite = enemy.elite;
        this.removeEnemy(index, enemy, true);
        this.onEnemyKilled(wasElite);
      }
    }
  }

  private dealOrbitDamage(x: number, y: number, radius: number, damage: number): void {
    if (this.gameTime - this.lastOrbitDamage < 0.52) return;
    this.lastOrbitDamage = this.gameTime;
    this.dealAreaDamage(x, y, radius, damage, 0xb8d8ff);
  }

  private updateOrbitVisuals(): void {
    const level = this.weaponSystem.getWeaponLevel('orbiting-blades');
    if (level === 0) {
      for (const visual of this.orbitVisuals) visual.setVisible(false);
      return;
    }
    while (this.orbitVisuals.length < level + 1) this.orbitVisuals.push(this.add.circle(0, 0, 7, 0xd9ecff, 0.9).setStrokeStyle(2, 0x7bdfff, 0.85).setDepth(17));
    for (let index = 0; index < this.orbitVisuals.length; index += 1) {
      const visual = this.orbitVisuals[index];
      if (index >= level) { visual.setVisible(false); continue; }
      visual.setVisible(true);
      const angle = this.orbitAngle + index * (Math.PI * 2 / level);
      visual.setPosition(this.player.container.x + Math.cos(angle) * (45 + level * 3), this.player.container.y + Math.sin(angle) * (45 + level * 3));
    }
  }

  private spawnXP(x: number, y: number, value: number): void {
    if (this.xpPickups.length > 260) return;
    const color = value > 30 ? 0xc58cff : value > 15 ? 0x5de7ff : 0x4aafff;
    const body = this.add.circle(x, y, value > 30 ? 6 : value > 15 ? 5 : 4, color, 0.94).setStrokeStyle(1, 0xdaf8ff, 0.55).setDepth(8);
    this.xpPickups.push({ id: `xp-${this.pickupSequence += 1}`, x, y, value, body, active: true, speed: 40 });
  }

  private updatePickups(delta: number): void {
    const playerX = this.player.container.x;
    const playerY = this.player.container.y;
    for (let index = this.xpPickups.length - 1; index >= 0; index -= 1) {
      const pickup = this.xpPickups[index];
      const dx = playerX - pickup.x;
      const dy = playerY - pickup.y;
      const distance = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      if (distance < this.player.stats.pickupRadius) {
        pickup.speed = Math.min(640, pickup.speed + delta * 840);
        pickup.x += (dx / distance) * pickup.speed * delta;
        pickup.y += (dy / distance) * pickup.speed * delta;
      }
      pickup.body.setPosition(pickup.x, pickup.y);
      pickup.body.setScale(1 + Math.sin(this.gameTime * 7 + index) * 0.13);
      if (distance < 22) {
        const levels = this.xpSystem.addXP(pickup.value * this.player.stats.xpMultiplier);
        pickup.body.destroy();
        this.xpPickups.splice(index, 1);
        if (levels > 0) {
          this.spawnHitSpark(playerX, playerY, 0x7ceaff);
          HapticsService.success(this.save.settings.haptics);
        }
      }
    }
  }

  private checkQueuedLevelUp(): void {
    if (this.levelUpOpen || !this.xpSystem.checkLevelUp() || this.isFinished) return;
    this.levelUpOpen = true;
    this.isRunPaused = true;
    this.resetJoystick();
    this.callbacks.onLevelUp(generateUpgradeChoices(this.weaponSystem.getLevels(), this.passiveLevels, 3));
  }

  selectUpgrade(id: string): void {
    if (!this.levelUpOpen) return;
    if (id in this.weaponSystem.getLevels() || ['magic-bolt', 'fire-orb', 'orbiting-blades', 'chain-lightning'].includes(id)) {
      const weaponId = id as 'magic-bolt' | 'fire-orb' | 'orbiting-blades' | 'chain-lightning';
      if (this.weaponSystem.getWeaponLevel(weaponId) < 5) this.weaponSystem.upgradeWeapon(weaponId);
    } else {
      const level = Math.min(5, (this.passiveLevels[id] ?? 0) + 1);
      this.passiveLevels[id] = level;
      this.applyPassive(id, level);
    }
    this.xpSystem.processQueuedLevelUps();
    this.levelUpOpen = false;
    if (this.xpSystem.checkLevelUp()) {
      this.levelUpOpen = true;
      this.callbacks.onLevelUp(generateUpgradeChoices(this.weaponSystem.getLevels(), this.passiveLevels, 3));
      return;
    }
    this.isRunPaused = false;
    this.callbacks.onSnapshot(this.getSnapshot());
  }

  private applyPassive(id: string, level: number): void {
    if (id === 'power') this.player.stats.damageMultiplier = (1 + (this.save.permanentUpgrades.damage ?? 0) * 0.1) * (1 + level * 0.12);
    if (id === 'vitality') { this.player.stats.maxHP = PLAYER_BALANCE.maxHp * (1 + (this.save.permanentUpgrades.maxHp ?? 0) * 0.12 + level * 0.15); this.player.heal(this.player.stats.maxHP * 0.2); }
    if (id === 'swift-boots') this.player.setMoveSpeed(PLAYER_BALANCE.moveSpeed * (1 + (this.save.permanentUpgrades.moveSpeed ?? 0) * 0.06 + level * 0.08));
    if (id === 'magnet') this.player.stats.pickupRadius = PLAYER_BALANCE.pickupRadius + (this.save.permanentUpgrades.magnet ?? 0) * 20 + level * 28;
    if (id === 'focus') this.player.stats.cooldownMultiplier = Math.max(0.5, 1 - level * 0.08);
    if (id === 'luck') this.player.stats.critChance = PLAYER_BALANCE.critChance + (this.save.permanentUpgrades.critChance ?? 0) * 0.025 + level * 0.04;
    if (id === 'growth') this.player.stats.xpMultiplier = 1 + (this.save.permanentUpgrades.xpGain ?? 0) * 0.08 + level * 0.1;
    if (id === 'armor') this.player.stats.armor = Math.min(0.72, (this.save.permanentUpgrades.armor ?? 0) * 0.07 + level * 0.08);
  }

  private checkBossTimer(): void {
    if (this.bossSpawned || this.bossWarningShown) return;
    if (this.gameTime < this.stage.duration - 31) return;
    this.bossWarningShown = true;
    this.callbacks.onBossWarning();
    HapticsService.heavy(this.save.settings.haptics);
    this.time.delayedCall(3400, () => this.spawnBoss());
  }

  private spawnBoss(): void {
    if (this.bossSpawned || this.isFinished) return;
    this.bossSpawned = true;
    this.enemySpawner.stopSpawning();
    const angle = Phaser.Math.Angle.Between(this.player.container.x, this.player.container.y, WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
    const x = Phaser.Math.Clamp(this.player.container.x + Math.cos(angle) * 190, 100, WORLD_WIDTH - 100);
    const y = Phaser.Math.Clamp(this.player.container.y + Math.sin(angle) * 190, 120, WORLD_HEIGHT - 120);
    this.bossArt = this.add.graphics();
    this.bossArt.fillStyle(0x231d35, 1);
    this.bossArt.fillRoundedRect(-34, -2, 68, 78, 16);
    this.bossArt.fillStyle(0xb2c1d4, 1);
    this.bossArt.fillCircle(0, -33, 35);
    this.bossArt.fillStyle(0x151c2b, 1);
    this.bossArt.fillTriangle(-21, -59, -31, -84, -8, -70);
    this.bossArt.fillTriangle(21, -59, 31, -84, 8, -70);
    this.bossArt.fillStyle(0xff5f68, 1);
    this.bossArt.fillCircle(-12, -35, 5);
    this.bossArt.fillCircle(12, -35, 5);
    this.bossArt.lineStyle(5, 0xffbd59, 1);
    this.bossArt.lineBetween(-31, 4, 38, 52);
    this.bossArt.lineStyle(3, 0xddeaff, 1);
    this.bossArt.lineBetween(-28, 0, -49, 52);
    this.bossVisual = this.add.container(x, y, [this.bossArt]).setDepth(15);
    this.bossSystem.spawnBoss(this.stage.bossId);
    this.spawnHitSpark(x, y, 0xff5b66);
    this.callbacks.onSnapshot(this.getSnapshot());
  }

  private setBossPosition(x: number, y: number): void {
    if (!this.bossVisual) return;
    this.bossVisual.setPosition(Phaser.Math.Clamp(x, 90, WORLD_WIDTH - 90), Phaser.Math.Clamp(y, 120, WORLD_HEIGHT - 100));
  }

  private telegraphBossAttack(attack: BossAttack, x: number, y: number): void {
    this.bossWarning?.destroy();
    this.bossWarning = this.add.graphics().setDepth(4);
    this.bossWarning.lineStyle(3, 0xff5d65, 0.84);
    if (attack === 'charge') this.bossWarning.lineBetween(x, y, this.player.container.x, this.player.container.y);
    else this.bossWarning.strokeCircle(x, y, attack === 'slam' ? 114 : 74);
    this.tweens.add({ targets: this.bossWarning, alpha: 0.18, duration: 650, yoyo: true, repeat: 1, onComplete: () => { this.bossWarning?.destroy(); this.bossWarning = undefined; } });
  }

  private executeBossAttack(attack: BossAttack, x: number, y: number): void {
    const dx = this.player.container.x - x;
    const dy = this.player.container.y - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (attack === 'slam') {
      this.dealAreaDamage(x, y, 112, BOSS_BALANCE.damage * 0.88, 0xff4e62);
      if (distance < 112 && this.player.takeDamage(this.getPlayerDamage(BOSS_BALANCE.damage), this.gameTime)) this.callbacks.onSnapshot(this.getSnapshot());
      return;
    }
    if (attack === 'bone-ring') {
      for (let index = 0; index < 10; index += 1) {
        const angle = index * (Math.PI * 2 / 10);
        this.spawnEnemyProjectile(x, y, angle, 176, 12);
      }
      return;
    }
    if (attack === 'charge') {
      this.setBossPosition(x + (dx / Math.max(1, distance)) * 130, y + (dy / Math.max(1, distance)) * 130);
      if (distance < 150 && this.player.takeDamage(this.getPlayerDamage(BOSS_BALANCE.damage * 1.15), this.gameTime)) this.callbacks.onSnapshot(this.getSnapshot());
    }
  }

  private damageBoss(baseDamage: number): void {
    const result = calculateDamage({ baseDamage, canCrit: true, critChance: this.player.stats.critChance, critMultiplier: this.player.stats.critMultiplier });
    this.spawnDamageNumber(this.bossVisual?.x ?? 0, (this.bossVisual?.y ?? 0) - 72, result.finalDamage, result.critical, 0xffd37c);
    const killed = this.bossSystem.damageBoss(result.finalDamage);
    if (killed) this.finishStageClear();
  }

  private fireEnemyProjectile(enemy: EnemyEntity): void {
    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.container.x, this.player.container.y);
    this.spawnEnemyProjectile(enemy.x, enemy.y, angle, 135, enemy.contactDamage * 0.72);
  }

  private spawnEnemyProjectile(x: number, y: number, angle: number, speed: number, damage: number): void {
    const body = this.add.circle(x, y, 6, 0xff7684, 0.9).setStrokeStyle(1, 0xffd7d7, 0.65).setDepth(13);
    this.enemyProjectiles.push({ body, x, y, velocity: new Phaser.Math.Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed), age: 0, active: true });
    this.enemyProjectileSequence += 1;
  }

  private updateEnemyProjectiles(delta: number): void {
    for (let index = this.enemyProjectiles.length - 1; index >= 0; index -= 1) {
      const projectile = this.enemyProjectiles[index];
      projectile.age += delta;
      projectile.x += projectile.velocity.x * delta;
      projectile.y += projectile.velocity.y * delta;
      projectile.body.setPosition(projectile.x, projectile.y);
      const dx = projectile.x - this.player.container.x;
      const dy = projectile.y - this.player.container.y;
      if (Math.sqrt(dx * dx + dy * dy) < 25 && this.player.takeDamage(13, this.gameTime, 0.72)) {
        projectile.active = false;
        this.spawnDamageNumber(this.player.container.x, this.player.container.y - 28, 13, false, 0xff6372);
        if (this.player.stats.currentHP <= 0) this.finishGameOver();
      }
      if (projectile.age > 6 || projectile.x < -30 || projectile.x > WORLD_WIDTH + 30 || projectile.y < -30 || projectile.y > WORLD_HEIGHT + 30) projectile.active = false;
      if (!projectile.active) {
        projectile.body.destroy();
        this.enemyProjectiles.splice(index, 1);
      }
    }
  }

  private onEnemyKilled(elite: boolean): void {
    this.kills += 1;
    if (elite) this.eliteKills += 1;
    this.spawnHitSpark(this.player.container.x, this.player.container.y, elite ? 0xffba58 : 0x5ddcff);
  }

  private spawnHitSpark(x: number, y: number, color: number): void {
    const spark = this.add.circle(x, y, 4, color, 0.8).setDepth(19);
    this.tweens.add({ targets: spark, scale: 2.7, alpha: 0, duration: this.save.settings.reducedEffects ? 160 : 280, onComplete: () => spark.destroy() });
  }

  private spawnDamageNumber(x: number, y: number, damage: number, critical: boolean, color: number): void {
    if (!this.save.settings.damageNumbers) return;
    const text = this.add.text(x + Phaser.Math.Between(-4, 4), y, critical ? `${damage}!` : `${damage}`, { fontFamily: 'Barlow Condensed', fontSize: critical ? '19px' : '14px', color: Phaser.Display.Color.IntegerToColor(color).rgba, stroke: '#071322', strokeThickness: 3 }).setDepth(30).setOrigin(0.5);
    this.tweens.add({ targets: text, y: y - 27, alpha: 0, duration: 520, onComplete: () => text.destroy() });
  }

  private finishStageClear(): void {
    if (this.isFinished) return;
    this.isFinished = true;
    this.enemySpawner.stopSpawning();
    this.runController.finishRun();
    const result = this.buildRunResult(this.stage.coinReward + Math.round(this.gameTime / 10) + this.enemies.length + 30);
    this.callbacks.onSnapshot(this.getSnapshot());
    HapticsService.success(this.save.settings.haptics);
    this.time.delayedCall(800, () => this.callbacks.onStageClear(result));
  }

  private finishGameOver(): void {
    if (this.isFinished) return;
    this.isFinished = true;
    this.enemySpawner.stopSpawning();
    this.runController.failRun();
    const result = this.buildRunResult(Math.max(6, Math.round(this.gameTime / 14) + Math.round(this.enemies.length / 8)));
    this.callbacks.onSnapshot(this.getSnapshot());
    this.time.delayedCall(500, () => this.callbacks.onGameOver(result));
  }

  revive(): boolean {
    if (!this.isFinished || this.reviveUsed) return false;
    this.reviveUsed = true;
    this.isFinished = false;
    this.runController.reviveRun();
    this.player.stats.currentHP = this.player.stats.maxHP * 0.55;
    this.player.applyInvulnerability(this.gameTime, 2.1);
    this.isRunPaused = false;
    return true;
  }

  pauseRun(): void {
    if (this.isFinished || this.levelUpOpen) return;
    this.isRunPaused = true;
    this.resetJoystick();
    this.runController.pauseRun();
    this.callbacks.onPaused(true);
  }

  resumeRun(): void {
    if (this.isFinished || this.levelUpOpen) return;
    this.isRunPaused = false;
    this.runController.resumeRun();
    this.callbacks.onPaused(false);
  }

  quitRun(): void {
    if (this.isFinished) return;
    this.isFinished = true;
    this.enemySpawner.stopSpawning();
    this.runController.quitRun();
  }

  private buildRunResult(coins: number): RunResult {
    const bossKills = this.bossSpawned && !this.bossSystem.isActive() ? 1 : 0;
    return { stageId: this.stage.id, stageName: this.stage.name, time: this.gameTime, kills: this.kills, eliteKills: this.eliteKills, bossKills, coins, xpCollected: 0, highestLevel: this.xpSystem.level };
  }

  getSnapshot(): GameSnapshot {
    const bossState = this.bossSystem?.getState();
    return {
      time: this.gameTime,
      duration: this.stage.duration,
      kills: this.kills,
      eliteKills: this.eliteKills,
      level: this.xpSystem.level,
      xp: this.xpSystem.xp,
      xpRequired: this.xpSystem.getXPRequired(),
      hp: this.player?.stats.currentHP ?? PLAYER_BALANCE.maxHp,
      maxHp: this.player?.stats.maxHP ?? PLAYER_BALANCE.maxHp,
      coins: this.save.coins,
      aliveEnemies: this.enemies.length,
      weaponLevels: this.weaponSystem?.getLevels() ?? { 'magic-bolt': 1 },
      passiveLevels: { ...this.passiveLevels },
      boss: bossState ? { name: this.stage.bossName, hp: bossState.hp, maxHp: bossState.maxHp, phase: bossState.phase } : undefined,
    };
  }

  shutdown(): void {
    this.resetJoystick();
    this.input.off('pointerdown', this.onPointerDown, this);
    this.input.off('pointermove', this.onPointerMove, this);
    this.input.off('pointerup', this.onPointerUp, this);
    this.scale.off('resize', this.resizeCamera, this);
    for (const enemy of this.enemies) enemy.destroy();
    for (const projectile of this.projectiles) projectile.destroy();
    for (const pickup of this.xpPickups) pickup.body.destroy();
    for (const projectile of this.enemyProjectiles) projectile.body.destroy();
    this.player?.destroy();
  }
}
