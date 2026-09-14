import * as THREE from 'three';
import { PLAYER_BALANCE, WEAPON_BALANCE } from '../data/balance';
import { getBossDefinition } from '../data/bosses';
import { getMonsterDefinition } from '../data/monsters';
import { generateUpgradeChoices } from '../data/upgrades';
import type { BossAttack, BossId, DamageType, EnemyKind, GameSnapshot, RunResult, SaveData, StageDefinition, UpgradeChoice, WeaponId, AbilityId } from '../types';
import { ALL_ABILITY_IDS } from '../data/abilities';
import { HapticsService } from '../services/hapticsService';
import { audioService } from '../services/audioService';
import { AbilitySystem } from '../game/systems/AbilitySystem';
import { BossSystem } from '../game/systems/BossSystem';
import { calculateDamage } from '../game/systems/DamageSystem';
import { EnemySpawner } from '../game/systems/EnemySpawner';
import { RunController } from '../game/systems/RunController';
import { SpatialGrid } from '../game/systems/SpatialGrid';
import { WeaponSystem, type ProjectileSpec, type TargetPoint } from '../game/systems/WeaponSystem';
import { XPSystem } from '../game/systems/XPSystem';
import { EnemyProjectile3D } from './entities/EnemyProjectile3D';
import { Enemy3D } from './entities/Enemy3D';
import { Player3D, type PlayerStats } from './entities/Player3D';
import { Boss3D } from './entities/Boss3D';
import { Projectile3D } from './entities/Projectile3D';
import { XPPickup3D } from './entities/XPPickup3D';
import { InputController } from './input/InputController';
import { CameraController } from './scene/CameraController';
import { createArena } from './scene/Arena3D';
import { createLighting } from './scene/Lighting3D';
import { biomeThemeFor } from './scene/BiomeTheme';
import { logicalToWorld, WORLD_HEIGHT, WORLD_WIDTH } from './core/coordinates';
import { SharedResources, addMesh } from './core/SharedResources';
import { CombatEffects3D } from './visuals/CombatEffects3D';
import { DamageText3D } from './visuals/DamageText3D';
import { Telegraph3D } from './visuals/Telegraph3D';
import type { Game3DCallbacks, Game3DOptions } from './types';

export class SurvivorGame3D {
  private readonly parent: HTMLElement;
  private readonly stage: StageDefinition;
  private readonly save: SaveData;
  private readonly callbacks: Game3DCallbacks;
  private readonly resources = new SharedResources();
  private readonly scene = new THREE.Scene();
  private readonly renderer: THREE.WebGLRenderer;
  private readonly cameraController: CameraController;
  private readonly actors = new THREE.Group();
  private readonly effectsRoot = new THREE.Group();
  private readonly spatialGrid = new SpatialGrid<Enemy3D>(150);
  private readonly enemies: Enemy3D[] = [];
  private readonly projectiles: Projectile3D[] = [];
  private readonly enemyProjectiles: EnemyProjectile3D[] = [];
  private readonly xpPickups: XPPickup3D[] = [];
  private readonly orbitVisuals: THREE.Group[] = [];
  private readonly effects: CombatEffects3D;
  private readonly damageText: DamageText3D;
  private readonly telegraphs: Telegraph3D;
  private readonly input: InputController;
  private readonly clock = new THREE.Clock();
  private readonly resizeObserver: ResizeObserver;
  private arena?: THREE.Group;
  private readonly lowPerformanceMode: boolean;
  private player!: Player3D;
  private xpSystem = new XPSystem();
  private weaponSystem!: WeaponSystem;
  private abilitySystem!: AbilitySystem;
  private enemySpawner!: EnemySpawner;
  private bossSystem!: BossSystem;
  private runController!: RunController;
  private boss?: Boss3D;
  private passiveLevels: Record<string, number> = {};
  private gameTime = 0;
  private snapshotTimer = 0;
  private orbitAngle = 0;
  private lastOrbitDamage = 0;
  private pickupSequence = 0;
  private kills = 0;
  private eliteKills = 0;
  private xpCollected = 0;
  private readonly encounteredEnemies = new Set<EnemyKind>();
  private readonly enemyKillsByKind: Record<string, number> = {};
  private readonly encounteredBosses = new Set<BossId>();
  private readonly bossKillsById: Record<string, number> = {};
  private lastLightningPoint?: { x: number; y: number };
  private bossSpawned = false;
  private bossWarningShown = false;
  private bossSpawnCountdown = 0;
  private isRunPaused = false;
  private isFinished = false;
  private levelUpOpen = false;
  private reviveUsed = false;
  private frameId = 0;
  private started = false;
  private destroyed = false;
  private pendingResultTimer?: number;

  constructor({ parent, stage, save, callbacks }: Game3DOptions) {
    this.parent = parent;
    this.stage = stage;
    this.save = save;
    this.callbacks = callbacks;
    this.lowPerformanceMode = save.settings.lowPerformanceMode;
    const theme = biomeThemeFor(stage);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.lowPerformanceMode ? 1 : 1.5));
    this.renderer.setClearColor(theme.background, 1);
    this.renderer.domElement.className = 'three-canvas';
    this.renderer.domElement.setAttribute('aria-label', `${stage.name} 3D gameplay arena`);
    this.renderer.domElement.setAttribute('role', 'img');
    this.parent.appendChild(this.renderer.domElement);

    this.scene.background = new THREE.Color(theme.background);
    this.scene.fog = new THREE.Fog(theme.fog, this.lowPerformanceMode ? 13 : 17, this.lowPerformanceMode ? 43 : 56);
    this.scene.add(this.actors, this.effectsRoot);
    this.cameraController = new CameraController(this.lowPerformanceMode, save.settings.reducedEffects, save.settings.screenShake);
    createLighting(this.scene, stage, this.lowPerformanceMode);
    this.arena = createArena(this.scene, stage, this.resources, this.lowPerformanceMode);
    this.effects = new CombatEffects3D(this.effectsRoot, this.resources, save.settings.reducedEffects || this.lowPerformanceMode);
    this.damageText = new DamageText3D(this.effectsRoot, this.lowPerformanceMode);
    this.telegraphs = new Telegraph3D(this.effectsRoot, this.resources);
    this.input = new InputController(
      () => this.pauseFromBackground(),
      (slot) => {
        const ids: AbilityId[] = ['fireball', 'freeze', 'heal', 'arcane-beam'];
        const abilityId = ids[slot - 1];
        if (abilityId) this.activateAbility(abilityId);
      }
    );
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.parent);
    this.renderer.domElement.addEventListener('webglcontextlost', this.handleContextLost, false);
    this.renderer.domElement.addEventListener('webglcontextrestored', this.handleContextRestored, false);
    this.initializeSimulation();
    this.resize();
  }

  start(): void {
    if (this.started || this.destroyed) return;
    this.started = true;
    this.clock.start();
    this.frameId = requestAnimationFrame(this.frame);
  }

  setMovementVector(x: number, y: number): void { this.input.setMovementVector(x, y); }
  setAimVector(x: number, y: number): void { this.input.setAimVector(x, y); }

  activateAbility(id: AbilityId): boolean {
    if (this.isRunPaused || this.isFinished || this.levelUpOpen) return false;
    const aim = this.input.getAimVector();
    const lastAim = this.input.getLastAimVector();
    const isAiming = this.input.isAimActive();
    const aimDir = isAiming && Math.hypot(aim.x, aim.y) > 0.08 ? aim : lastAim;
    return this.abilitySystem.activate(id, aimDir);
  }

  selectUpgrade(id: string): void {
    if (!this.levelUpOpen || this.isFinished) return;
    if (ALL_ABILITY_IDS.includes(id as AbilityId)) {
      this.abilitySystem.upgradeAbility(id as AbilityId);
    } else if (id in this.weaponSystem.getLevels() || ['magic-bolt', 'orbiting-blades', 'chain-lightning'].includes(id)) {
      const weaponId = id as WeaponId;
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
      audioService.playSFX('upgrade');
      this.callbacks.onLevelUp(generateUpgradeChoices(this.weaponSystem.getLevels(), this.passiveLevels, this.abilitySystem.getLevels(), this.save.unlockedAbilities, 3));
      return;
    }
    audioService.restoreMusicVolume();
    this.isRunPaused = false;
    this.runController.resumeRun();
    this.callbacks.onPaused(false);
    this.callbacks.onSnapshot(this.getSnapshot());
  }

  revive(): boolean {
    if (!this.isFinished || this.reviveUsed) return false;
    if (this.pendingResultTimer) window.clearTimeout(this.pendingResultTimer);
    this.pendingResultTimer = undefined;
    this.reviveUsed = true;
    this.isFinished = false;
    this.runController.reviveRun();
    this.player.stats.currentHP = this.player.stats.maxHP * 0.55;
    this.player.applyInvulnerability(this.gameTime, 2.1);
    this.player.triggerRevive();
    this.effects.levelUp(this.player.x, this.player.y);
    audioService.playSFX('revive');
    this.cameraController.triggerPullback(0.45, 0.5);
    this.isRunPaused = false;
    this.input.reset();
    audioService.restoreMusicVolume();
    this.callbacks.onPaused(false);
    this.callbacks.onSnapshot(this.getSnapshot());
    return true;
  }

  pauseRun(): void {
    if (this.isFinished || this.levelUpOpen || this.isRunPaused) return;
    this.isRunPaused = true;
    this.input.reset();
    this.runController.pauseRun();
    audioService.pause();
    this.callbacks.onPaused(true);
  }

  resumeRun(): void {
    if (this.isFinished || this.levelUpOpen || !this.isRunPaused) return;
    this.isRunPaused = false;
    this.runController.resumeRun();
    audioService.resume();
    this.callbacks.onPaused(false);
  }

  togglePauseRun(): void {
    if (this.isRunPaused) this.resumeRun();
    else this.pauseRun();
  }

  quitRun(): void {
    if (this.isFinished) return;
    this.isFinished = true;
    this.isRunPaused = false;
    this.input.reset();
    this.enemySpawner.stopSpawning();
    audioService.crossfadeMusic('menu', 1.0);
    this.runController.quitRun();
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
      abilityLevels: this.abilitySystem?.getLevels() ?? {},
      abilities: this.abilitySystem?.getSnapshot() ?? [],
      boss: bossState ? { name: bossState.name, hp: bossState.hp, maxHp: bossState.maxHp, phase: bossState.phase } : undefined,
    };
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    cancelAnimationFrame(this.frameId);
    if (this.pendingResultTimer) window.clearTimeout(this.pendingResultTimer);
    this.pendingResultTimer = undefined;
    this.input.dispose();
    this.resizeObserver.disconnect();
    this.renderer.domElement.removeEventListener('webglcontextlost', this.handleContextLost);
    this.renderer.domElement.removeEventListener('webglcontextrestored', this.handleContextRestored);
    this.player?.destroy();
    for (const enemy of this.enemies) enemy.destroy();
    for (const projectile of this.projectiles) projectile.destroy();
    for (const projectile of this.enemyProjectiles) projectile.destroy();
    for (const pickup of this.xpPickups) pickup.destroy();
    this.boss?.destroy();
    this.effects.clear();
    this.telegraphs.clear();
    this.damageText.dispose();
    disposeScene(this.scene);
    this.resources.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private readonly frame = (): void => {
    if (this.destroyed) return;
    const delta = Math.min(0.034, Math.max(0.001, this.clock.getDelta()));
    if (!this.isRunPaused && !this.isFinished) this.update(delta);
    if (this.isFinished && this.boss) this.boss.update(delta);
    this.effects.update(delta);
    this.telegraphs.update(delta);
    this.damageText.update(delta);
    if (this.player) {
      this.cameraController.update(
        delta,
        this.player.x,
        this.player.y,
        this.player.getMovementVector(),
        this.input.getAimVector(),
        this.input.isAimActive(),
        !this.isRunPaused,
        this.scene,
        (this.arena?.userData.occluders as THREE.Object3D[] | undefined) ?? []
      );
      if (typeof this.arena?.userData.update === 'function') {
        this.arena.userData.update(this.cameraController.camera.position, this.player.group.position, delta);
      }
    }
    this.renderer.render(this.scene, this.cameraController.camera);
    this.frameId = requestAnimationFrame(this.frame);
  };

  private initializeSimulation(): void {
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
    this.player = new Player3D(this.actors, WORLD_WIDTH / 2, WORLD_HEIGHT / 2, stats, this.resources, this.stage.worldId);
    this.player.initializePlayer();
    this.runController = new RunController(this.stage.id, this.stage.name);
    this.xpSystem = new XPSystem();
    this.createSystems();
    this.runController.startRun();
    audioService.crossfadeMusic('run');
    this.callbacks.onSnapshot(this.getSnapshot());
  }

  private createSystems(): void {
    this.weaponSystem = new WeaponSystem({
      getPlayerPosition: () => this.player.getPosition(),
      getAimVector: () => this.input.getAimVector(),
      isAimActive: () => this.input.isAimActive(),
      findAimAssistTarget: (originX, originY, dirX, dirY, maxAngleRad, maxDist) =>
        this.findAimAssistTarget(originX, originY, dirX, dirY, maxAngleRad, maxDist),
      findTargetsInRadius: (x, y, radius) =>
        this.spatialGrid.queryRadius(x, y, radius).map((enemy) => ({ id: enemy.id, x: enemy.x, y: enemy.y })),
      fireProjectile: (spec) => this.fireProjectile(spec),
      dealAreaDamage: (x, y, radius, damage, color, damageType) =>
        this.dealAreaDamage(x, y, radius, damage, color, damageType),
      dealOrbitDamage: (x, y, radius, damage, damageType) =>
        this.dealOrbitDamage(x, y, radius, damage, damageType),
      getDamageMultiplier: () => this.player.stats.damageMultiplier,
      getCooldownMultiplier: () => this.player.stats.cooldownMultiplier,
    });
    this.abilitySystem = new AbilitySystem({
      onFireball: (dirX, dirY, level) => this.triggerFireball(dirX, dirY, level),
      onFreeze: (level) => this.triggerFreeze(level),
      onHealTick: (amount, isFinished) => this.triggerHealTick(amount, isFinished),
      onArcaneBeam: (dirX, dirY, level) => this.triggerArcaneBeam(dirX, dirY, level),
      getCooldownMultiplier: () => this.player.stats.cooldownMultiplier,
      getPlayerHP: () => ({
        current: this.player.stats.currentHP,
        max: this.player.stats.maxHP,
      }),
    });
    this.abilitySystem.setUnlockedAbilities(this.save.unlockedAbilities || []);
    this.enemySpawner = new EnemySpawner({
      getPlayerPosition: () => this.player.getPosition(),
      getWorldSize: () => ({ width: WORLD_WIDTH, height: WORLD_HEIGHT }),
      getAliveCount: () => this.enemies.length,
      spawnEnemy: (type, x, y, elite) => this.spawnEnemy(type, x, y, elite),
    });
    this.enemySpawner.loadStageTimeline(this.stage);
    this.bossSystem = new BossSystem({
      getPlayerPosition: () => this.player.getPosition(),
      getBossPosition: () => this.boss?.getPosition() ?? { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 },
      setBossPosition: (x, y) => this.setBossPosition(x, y),
      spawnSummon: (kind) => {
        const position = this.boss?.getPosition() ?? { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 };
        for (let index = 0; index < 4; index += 1) {
          const angle = index * Math.PI / 2;
          this.spawnEnemy(kind, position.x + Math.cos(angle) * 88, position.y + Math.sin(angle) * 88, false);
        }
      },
      telegraphAttack: (attack, x, y) => this.telegraphBossAttack(attack, x, y),
      executeAttack: (attack, x, y) => this.executeBossAttack(attack, x, y),
    });
  }

  private resize(): void {
    const width = Math.max(1, this.parent.clientWidth || 360);
    const height = Math.max(1, this.parent.clientHeight || 720);
    this.renderer.setSize(width, height, false);
    this.cameraController.resize(width, height);
  }

  private update(delta: number): void {
    this.gameTime += delta;
    this.snapshotTimer -= delta;
    if (!this.stage.bossStage && this.gameTime >= this.stage.duration) {
      this.finishStageClear();
      return;
    }
    this.orbitAngle += delta * 1.8;
    const movement = this.input.getMovementVector();
    this.player.setMovementVector(movement.x, movement.y);
    const aim = this.input.getAimVector();
    this.player.setAimVector(aim.x, aim.y, this.input.isAimActive());
    this.player.updateMovement(delta, WORLD_WIDTH, WORLD_HEIGHT);
    this.enemySpawner.update(delta);
    this.spatialGrid.clear();
    for (const enemy of this.enemies) this.spatialGrid.insert(enemy);
    this.updateEnemies(delta);
    this.spatialGrid.clear();
    for (const enemy of this.enemies) this.spatialGrid.insert(enemy);
    if (this.isFinished) return;
    this.lastLightningPoint = undefined;
    this.weaponSystem.update(delta);
    this.abilitySystem.update(delta, this.isRunPaused || this.levelUpOpen);
    this.updateProjectiles(delta);
    this.updateEnemyProjectiles(delta);
    this.updatePickups(delta);
    this.updateOrbitVisuals();
    this.checkBossTimer(delta);
    if (this.bossSpawned) {
      this.bossSystem.updateBoss(delta);
      this.boss?.update(delta);
    }
    this.checkQueuedLevelUp();
    if (this.snapshotTimer <= 0) {
      this.snapshotTimer = 0.1;
      this.callbacks.onSnapshot(this.getSnapshot());
    }
  }

  private updateEnemies(delta: number): void {
    const playerX = this.player.x;
    const playerY = this.player.y;

    // Attack pressure budget: limit concurrent high-threat animations (max 3)
    let highThreatActiveCount = 0;
    for (let i = 0; i < this.enemies.length; i += 1) {
      const e = this.enemies[i];
      if (
        (e.state === 'windup' || e.state === 'attack') &&
        (e.kind === 'archer' || e.kind === 'bat' || e.kind === 'slime' || e.kind === 'imp')
      ) {
        highThreatActiveCount += 1;
      }
    }

    for (let index = this.enemies.length - 1; index >= 0; index -= 1) {
      const enemy = this.enemies[index];

      // Inexpensive pairwise local separation against nearest neighbors
      const neighbors = this.spatialGrid.queryRadius(enemy.x, enemy.y, enemy.radius * 2.1);
      for (let n = 0; n < neighbors.length; n += 1) {
        const other = neighbors[n];
        if (other !== enemy) {
          const sepX = enemy.x - other.x;
          const sepY = enemy.y - other.y;
          const distSq = sepX * sepX + sepY * sepY;
          const minDist = enemy.radius + other.radius;
          if (distSq > 0.001 && distSq < minDist * minDist) {
            const dist = Math.sqrt(distSq);
            const push = (minDist - dist) * 0.45 * 16 * delta;
            enemy.x += (sepX / dist) * push;
            enemy.y += (sepY / dist) * push;
          }
        }
      }

      // Execute combat state machine and receive any emitted attack event
      const attackEvent = enemy.update(
        playerX,
        playerY,
        delta,
        this.gameTime,
        () => highThreatActiveCount < 3
      );

      if (attackEvent) {
        if (attackEvent.type === 'projectile') {
          const pAngle = Math.atan2(
            attackEvent.targetY - attackEvent.originY,
            attackEvent.targetX - attackEvent.originX
          );
          this.spawnEnemyProjectile(
            attackEvent.originX,
            attackEvent.originY,
            pAngle,
            145,
            attackEvent.damage,
            attackEvent.color
          );
        } else if (attackEvent.type === 'explosion') {
          this.dealAreaDamage(
            attackEvent.originX,
            attackEvent.originY,
            attackEvent.radius,
            attackEvent.damage,
            attackEvent.color,
            'fire'
          );
          this.effects.burst(attackEvent.originX, attackEvent.originY, attackEvent.color, true);
          this.cameraController.triggerShake(0.18, 0.22);
          const distToPlayer = Math.hypot(playerX - attackEvent.originX, playerY - attackEvent.originY);
          if (
            distToPlayer < attackEvent.radius &&
            this.player.takeDamage(this.getPlayerDamage(attackEvent.damage), this.gameTime, 0.65)
          ) {
            this.spawnDamageNumber(playerX, playerY - 30, Math.round(attackEvent.damage), false, attackEvent.color);
            audioService.playSFX('hurt', { throttle: 0.28 });
            this.callbacks.onPlayerHit?.();
            void HapticsService.medium(this.save.settings.haptics);
            if (this.player.stats.currentHP <= 0) {
              this.finishGameOver();
              return;
            }
          }
          this.removeEnemy(enemy, false);
          this.onEnemyKilled(enemy.kind, enemy.elite);
        } else {
          // Melee, dive, leap
          const hitDist = Math.hypot(playerX - attackEvent.targetX, playerY - attackEvent.targetY);
          if (
            hitDist < attackEvent.radius + 18 &&
            this.player.takeDamage(this.getPlayerDamage(attackEvent.damage), this.gameTime, 0.58)
          ) {
            this.spawnDamageNumber(playerX, playerY - 30, Math.round(attackEvent.damage), false, attackEvent.color);
            this.effects.burst(playerX, playerY, attackEvent.color);
            this.cameraController.triggerShake(0.12, 0.18);
            audioService.playSFX('hurt', { throttle: 0.32 });
            void HapticsService.medium(this.save.settings.haptics);
            this.callbacks.onPlayerHit?.();
            this.callbacks.onSnapshot(this.getSnapshot());
            if (this.player.stats.currentHP <= 0) {
              this.finishGameOver();
              return;
            }
          }
        }
      }
    }
  }

  private getPlayerDamage(amount: number): number { return Math.max(1, amount * 0.68 * (1 - Math.min(0.75, this.player.stats.armor))); }

  private spawnEnemy(type: EnemyKind, x: number, y: number, elite: boolean): void {
    this.encounteredEnemies.add(type);
    const progress = Math.min(1, this.gameTime / Math.max(1, this.stage.duration));
    const hpMultiplier = this.stage.difficulty.enemyHpMultiplier * (0.96 + progress * 0.16);
    const damageMultiplier = this.stage.difficulty.enemyDamageMultiplier * (0.96 + progress * 0.12);
    const enemy = new Enemy3D(this.actors, type, x, y, this.resources, elite, hpMultiplier, damageMultiplier, this.stage.worldId);
    this.enemies.push(enemy);
    this.spatialGrid.insert(enemy);
    if (elite) {
      this.effects.ring(x, y, 0.92, 0xffc04f);
      audioService.playSFX('elite', { throttle: 0.28 });
      void HapticsService.medium(this.save.settings.haptics);
    }
  }

  private removeEnemy(enemy: Enemy3D, dropXp = true): void {
    const index = this.enemies.indexOf(enemy);
    if (index < 0) return;
    this.spatialGrid.remove(enemy);
    const x = enemy.x;
    const y = enemy.y;
    enemy.destroy();
    this.enemies.splice(index, 1);
    if (dropXp) this.spawnXP(x, y, enemy.xpValue);
  }

  private findAimAssistTarget(
    originX: number,
    originY: number,
    dirX: number,
    dirY: number,
    maxAngleRad = 0.22,
    maxDist = 520
  ): TargetPoint | undefined {
    let bestTarget: TargetPoint | undefined;
    let bestScore = Number.POSITIVE_INFINITY;

    const candidates = this.spatialGrid.queryRadius(originX, originY, maxDist);
    for (const enemy of candidates) {
      const dx = enemy.x - originX;
      const dy = enemy.y - originY;
      const distSq = dx * dx + dy * dy;
      if (distSq < 16) continue;
      const dist = Math.sqrt(distSq);
      const dot = (dx / dist) * dirX + (dy / dist) * dirY;
      const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
      if (angle <= maxAngleRad) {
        const score = angle * 2.0 + (dist / maxDist);
        if (score < bestScore) {
          bestScore = score;
          bestTarget = { id: enemy.id, x: enemy.x, y: enemy.y };
        }
      }
    }

    if (this.bossSpawned && this.bossSystem?.isActive() && this.boss) {
      const dx = this.boss.x - originX;
      const dy = this.boss.y - originY;
      const distSq = dx * dx + dy * dy;
      if (distSq <= maxDist * maxDist) {
        const dist = Math.sqrt(distSq);
        const dot = (dx / dist) * dirX + (dy / dist) * dirY;
        const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
        if (angle <= maxAngleRad) {
          const score = angle * 2.0 + (dist / maxDist);
          if (score < bestScore) {
            bestScore = score;
            bestTarget = { id: 'boss', x: this.boss.x, y: this.boss.y };
          }
        }
      }
    }

    return bestTarget;
  }

  private fireProjectile(spec: ProjectileSpec): void {
    this.player.triggerAttack();
    audioService.playSFX(spec.weaponId, { throttle: spec.weaponId === 'magic-bolt' ? 0.1 : 0.16, volume: spec.weaponId === 'chain-lightning' ? 0.8 : 1 });
    this.projectiles.push(new Projectile3D(this.actors, this.player.x, this.player.y, spec, this.resources));
  }

  private updateProjectiles(delta: number): void {
    for (let projectileIndex = this.projectiles.length - 1; projectileIndex >= 0; projectileIndex -= 1) {
      const projectile = this.projectiles[projectileIndex];
      projectile.update(delta);
      let hit = false;
      if (this.bossSpawned && this.bossSystem.isActive() && this.boss) {
        const dx = projectile.x - this.boss.x;
        const dy = projectile.y - this.boss.y;
        if (Math.sqrt(dx * dx + dy * dy) < 42 + projectile.spec.radius) {
          this.damageBoss(projectile.spec.damage, projectile.spec.damageType);
          if (projectile.spec.weaponId === 'magic-bolt') {
            this.weaponSystem.onPrimaryHit(this.boss.x, this.boss.y, 'boss');
          }
          if (projectile.spec.explosive) {
            this.dealAreaDamage(projectile.x, projectile.y, 88, projectile.spec.damage * 0.72, projectile.spec.color, projectile.spec.damageType);
            this.effects.explosion(projectile.x, projectile.y, 1.4, projectile.spec.color);
          }
          this.effects.projectileImpact(projectile.x, projectile.y, projectile.spec.color);
          audioService.playSFX('hit', { pitch: 0.82 });
          hit = true;
          projectile.canPierce();
        }
      }
      if (!hit) {
        for (const enemy of [...this.enemies].reverse()) {
          const dx = projectile.x - enemy.x;
          const dy = projectile.y - enemy.y;
          if (Math.sqrt(dx * dx + dy * dy) > enemy.radius + projectile.spec.radius + 2) continue;
          this.damageEnemy(enemy, projectile.spec.damage, projectile.spec.color, projectile.spec.damageType, projectile.x, projectile.y);
          if (projectile.spec.weaponId === 'magic-bolt') {
            this.weaponSystem.onPrimaryHit(enemy.x, enemy.y, enemy.id);
          }
          if (projectile.spec.explosive) {
            this.dealAreaDamage(projectile.x, projectile.y, 88, projectile.spec.damage * 0.72, projectile.spec.color, projectile.spec.damageType);
            this.effects.explosion(projectile.x, projectile.y, 1.4, projectile.spec.color);
          }
          this.effects.projectileImpact(projectile.x, projectile.y, projectile.spec.color);
          audioService.playSFX('hit', { pitch: projectile.spec.explosive ? 0.76 : 1, throttle: 0.08 });
          hit = true;
          if (projectile.canPierce()) break;
        }
      }
      if (!projectile.active) {
        projectile.destroy();
        this.projectiles.splice(projectileIndex, 1);
      }
    }
  }

  private damageEnemy(
    enemy: Enemy3D,
    baseDamage: number,
    color: number,
    damageType: DamageType,
    sourceX?: number,
    sourceY?: number
  ): void {
    const monster = getMonsterDefinition(enemy.kind);
    let finalBase = baseDamage;

    // Cursed Knight frontal shield reduces incoming frontal damage by 45%
    if (sourceX !== undefined && sourceY !== undefined && enemy.checkFrontShield(sourceX, sourceY)) {
      finalBase *= 0.55;
      this.effects.burst(enemy.x, enemy.y, 0x5ea4ff);
    }

    const result = calculateDamage({
      baseDamage: finalBase,
      damageType,
      weakness: monster.weakness,
      resistance: monster.resistance,
      canCrit: true,
      critChance: this.player.stats.critChance,
      critMultiplier: this.player.stats.critMultiplier,
    });
    const killed = enemy.damage(result.finalDamage);
    this.spawnDamageNumber(enemy.x, enemy.y - enemy.radius - 8, result.finalDamage, result.critical, result.critical ? 0xffd37c : color);
    this.effects.burst(enemy.x, enemy.y, result.critical ? 0xffd37c : color, result.critical);
    audioService.playSFX(killed ? 'death' : 'hit', { pitch: result.critical ? 1.2 : 1, throttle: killed ? 0.05 : 0.08 });
    if (killed) {
      this.effects.enemyDeath(enemy.x, enemy.y, color, enemy.elite);
      this.removeEnemy(enemy, true);
      this.onEnemyKilled(enemy.kind, enemy.elite);
    }
  }

  private dealAreaDamage(x: number, y: number, radius: number, damage: number, color: number, damageType: DamageType): void {
    if (color === 0x9f8cff) {
      const isFirstChainHit = !this.lastLightningPoint;
      const from = this.lastLightningPoint ?? this.player.getPosition();
      this.effects.lightning(from.x, from.y, x, y, color);
      this.lastLightningPoint = { x, y };
      if (isFirstChainHit) audioService.playSFX('chain-lightning');
    }
    this.effects.ring(x, y, radius * 0.025, color);
    const targets = [...this.spatialGrid.queryRadius(x, y, radius)];
    for (const enemy of targets) {
      if (!this.enemies.includes(enemy)) continue;
      const monster = getMonsterDefinition(enemy.kind);
      const result = calculateDamage({ baseDamage: damage, damageType, weakness: monster.weakness, resistance: monster.resistance, canCrit: true, critChance: this.player.stats.critChance, critMultiplier: this.player.stats.critMultiplier });
      if (enemy.kind === 'slime') enemy.applySlow(0.82, 1.5, this.gameTime);
      const killed = enemy.damage(result.finalDamage);
      this.spawnDamageNumber(enemy.x, enemy.y - enemy.radius - 8, result.finalDamage, result.critical, color);
      if (killed) {
        this.effects.enemyDeath(enemy.x, enemy.y, color, enemy.elite);
        audioService.playSFX('death', { throttle: 0.08 });
        this.removeEnemy(enemy, true);
        this.onEnemyKilled(enemy.kind, enemy.elite);
      }
    }
  }

  private dealOrbitDamage(x: number, y: number, radius: number, damage: number, damageType: DamageType): void {
    if (this.gameTime - this.lastOrbitDamage < 0.52) return;
    this.lastOrbitDamage = this.gameTime;
    this.dealAreaDamage(x, y, radius, damage, 0xb8d8ff, damageType);
  }

  private triggerFireball(dirX: number, dirY: number, level: number): void {
    this.player.triggerAttack();
    audioService.playSFX('ability-fireball');
    const damage = 64 * this.player.stats.damageMultiplier * (1 + (level - 1) * 0.32);
    const speed = 250;
    const radius = 13 + (level - 1) * 2;
    const count = level >= 5 ? 2 : 1;

    for (let i = 0; i < count; i++) {
      const spreadAngle = count === 2 ? (i === 0 ? -0.14 : 0.14) : 0;
      this.fireProjectile({
        weaponId: 'fire-orb',
        direction: { x: dirX, y: dirY },
        angle: spreadAngle,
        damage,
        speed,
        radius,
        pierce: 0,
        color: 0xff6b35,
        damageType: 'fire',
        explosive: true,
      });
    }
  }

  private triggerFreeze(level: number): void {
    audioService.playSFX('ability-freeze');
    const radius = 160 + (level - 1) * 35;
    const duration = 2.4 + (level - 1) * 0.45;
    this.effects.freezeRing(this.player.x, this.player.y, radius * 0.024);
    this.cameraController.triggerShake(0.1, 0.16);

    const enemies = this.spatialGrid.queryRadius(this.player.x, this.player.y, radius);
    for (const enemy of enemies) {
      if (!this.enemies.includes(enemy)) continue;
      enemy.applyFreeze(duration, this.gameTime);
      if (level >= 5) {
        this.damageEnemy(enemy, 38 * this.player.stats.damageMultiplier, 0x5ddcff, 'arcane', this.player.x, this.player.y);
      }
    }

    if (this.bossSpawned && this.bossSystem?.isActive() && this.boss) {
      const dist = Math.hypot(this.boss.x - this.player.x, this.boss.y - this.player.y);
      if (dist <= radius + 30) {
        this.damageBoss(42 * this.player.stats.damageMultiplier, 'arcane');
      }
    }
  }

  private triggerHealTick(amount: number, isFinished: boolean): void {
    if (this.isFinished || this.player.stats.currentHP <= 0) return;
    this.player.heal(amount);
    this.spawnDamageNumber(this.player.x, this.player.y - 28, Math.round(amount), false, 0x48e076);
    this.effects.healPulse(this.player.x, this.player.y);
    audioService.playSFX('ability-heal', { throttle: 0.35 });
    this.callbacks.onSnapshot(this.getSnapshot());
  }

  private triggerArcaneBeam(dirX: number, dirY: number, level: number): void {
    this.player.triggerAttack();
    audioService.playSFX('ability-beam');
    const pX = this.player.x;
    const pY = this.player.y;
    const range = 520 + (level - 1) * 60;
    const beamWidth = 24 + (level - 1) * 6;
    const endX = pX + dirX * range;
    const endY = pY + dirY * range;

    this.effects.arcaneBeamEffect(pX, pY, endX, endY, 0xa87aff);
    this.cameraController.triggerShake(0.14, 0.22);

    const damage = 88 * this.player.stats.damageMultiplier * (1 + (level - 1) * 0.32);

    for (const enemy of [...this.enemies]) {
      const dist = distToSegment(enemy.x, enemy.y, pX, pY, endX, endY);
      if (dist <= enemy.radius + beamWidth / 2) {
        this.damageEnemy(enemy, damage, 0xa87aff, 'arcane', pX, pY);
        this.effects.burst(enemy.x, enemy.y, 0xa87aff, true);
      }
    }

    if (this.bossSpawned && this.bossSystem?.isActive() && this.boss) {
      const dist = distToSegment(this.boss.x, this.boss.y, pX, pY, endX, endY);
      if (dist <= 40 + beamWidth / 2) {
        this.damageBoss(damage * 1.25, 'arcane');
        this.effects.burst(this.boss.x, this.boss.y, 0xa87aff, true);
      }
    }
  }

  private updateOrbitVisuals(): void {
    const level = this.weaponSystem.getWeaponLevel('orbiting-blades');
    while (this.orbitVisuals.length < level) {
      const blade = new THREE.Group();
      blade.name = `orbit-blade-${this.orbitVisuals.length}`;

      // Steel crescent blade
      const steelBlade = addMesh(blade, this.resources.box('orbit-blade-steel'), this.resources.standardMaterial('orbit-steel-mat', 0xdce4f0, { metalness: 0.9, roughness: 0.15 }));
      steelBlade.scale.set(0.85, 0.06, 0.2);
      steelBlade.position.set(0.22, 0.76, 0);

      // Cyan rune edge / core
      const runeEdge = addMesh(blade, this.resources.box('orbit-blade-rune'), this.resources.standardMaterial('orbit-rune-mat', 0x62ecff, { emissive: 0x22c2ff, emissiveIntensity: 2.6, roughness: 0.15 }));
      runeEdge.scale.set(0.76, 0.08, 0.07);
      runeEdge.position.set(0.22, 0.76, 0);

      // Dark ornate crossguard
      const guard = addMesh(blade, this.resources.box('orbit-blade-guard'), this.resources.standardMaterial('orbit-guard-mat', 0x1e2430, { metalness: 0.7, roughness: 0.35 }));
      guard.scale.set(0.08, 0.1, 0.34);
      guard.position.set(-0.18, 0.76, 0);

      // Grip and pommel
      const grip = addMesh(blade, this.resources.cylinder('orbit-blade-grip'), this.resources.standardMaterial('orbit-grip-mat', 0x3d2b1f, { roughness: 0.7 }));
      grip.scale.set(0.04, 0.25, 0.04);
      grip.rotation.z = Math.PI / 2;
      grip.position.set(-0.32, 0.76, 0);

      const pommel = addMesh(blade, this.resources.octa('orbit-blade-pommel'), this.resources.standardMaterial('orbit-pommel-mat', 0xffd154, { emissive: 0xd49b20, emissiveIntensity: 1.2, metalness: 0.85 }));
      pommel.scale.setScalar(0.08);
      pommel.position.set(-0.46, 0.76, 0);

      // Motion trail streak behind the blade (bright glowing ribbon)
      const streak = addMesh(blade, this.resources.plane('orbit-blade-streak'), this.resources.basicMaterial('orbit-streak-mat', 0x5ee0ff, { transparent: true, opacity: 0.65, side: THREE.DoubleSide }));
      streak.scale.set(1.15, 0.3, 1);
      streak.position.set(-0.3, 0.76, -0.2);
      streak.rotation.x = Math.PI / 2;
      streak.rotation.z = 0.28;

      blade.visible = false;
      this.actors.add(blade);
      this.orbitVisuals.push(blade);
    }
    for (let index = 0; index < this.orbitVisuals.length; index += 1) {
      const visual = this.orbitVisuals[index];
      if (index >= level) { visual.visible = false; continue; }
      visual.visible = true;
      const angle = this.orbitAngle + index * Math.PI * 2 / level;
      const distance = 45 + level * 3;
      const position = logicalToWorld(this.player.x + Math.cos(angle) * distance, this.player.y + Math.sin(angle) * distance);
      visual.position.set(position.x, 0, position.z);
      visual.rotation.y = -angle;
    }
  }

  private spawnXP(x: number, y: number, value: number): void {
    if (this.xpPickups.length > 260) return;
    const pickup = new XPPickup3D(`xp-${this.pickupSequence += 1}`, this.actors, x, y, value, this.resources);
    this.xpPickups.push(pickup);
  }

  private updatePickups(delta: number): void {
    const playerX = this.player.x;
    const playerY = this.player.y;
    for (let index = this.xpPickups.length - 1; index >= 0; index -= 1) {
      const pickup = this.xpPickups[index];
      if (!pickup.update(delta, this.gameTime, playerX, playerY, this.player.stats.pickupRadius)) continue;
      const levels = this.xpSystem.addXP(pickup.value * this.player.stats.xpMultiplier);
      this.xpCollected += pickup.value;
      this.effects.collect(pickup.x, pickup.y, pickup.value > 30 ? 0xc58cff : 0x75eaff);
      audioService.playSFX('xp', { pitch: pickup.value > 30 ? 0.82 : 1, throttle: 0.09 });
      pickup.destroy();
      this.xpPickups.splice(index, 1);
      if (levels > 0) {
        this.player.triggerLevelUp();
        this.effects.levelUp(playerX, playerY);
        audioService.playSFX('level-up', { throttle: 0.2 });
        this.cameraController.triggerShake(0.14, 0.22);
        void HapticsService.success(this.save.settings.haptics);
      }
    }
  }

  private checkQueuedLevelUp(): void {
    if (this.levelUpOpen || !this.xpSystem.checkLevelUp() || this.isFinished) return;
    this.levelUpOpen = true;
    this.isRunPaused = true;
    this.input.reset();
    audioService.duckMusic(0.38, 60);
    this.runController.pauseRun();
    this.callbacks.onPaused(true);
    this.callbacks.onLevelUp(
      generateUpgradeChoices(
        this.weaponSystem.getLevels(),
        this.passiveLevels,
        this.abilitySystem.getLevels(),
        this.save.unlockedAbilities,
        3
      )
    );
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

  private checkBossTimer(delta: number): void {
    if (!this.stage.bossStage) return;
    if (this.bossSpawned) return;
    if (!this.bossWarningShown && this.gameTime >= this.stage.duration - 3.4) {
      this.bossWarningShown = true;
      this.bossSpawnCountdown = 3.4;
      this.callbacks.onBossWarning();
      audioService.duckMusic(0.32, 3.4);
      audioService.playSFX('boss-warning', { throttle: 0.5 });
      void HapticsService.heavy(this.save.settings.haptics);
    }
    if (this.bossWarningShown) {
      this.bossSpawnCountdown -= delta;
      if (this.bossSpawnCountdown <= 0) this.spawnBoss();
    }
  }

  private spawnBoss(): void {
    if (this.bossSpawned || this.isFinished || !this.stage.bossStage || !this.stage.bossId) return;
    const bossDefinition = getBossDefinition(this.stage.bossId);
    if (!bossDefinition) return;
    this.bossSpawned = true;
    this.encounteredBosses.add(bossDefinition.id);
    this.enemySpawner.stopSpawning();
    const angle = Math.atan2(WORLD_HEIGHT / 2 - this.player.y, WORLD_WIDTH / 2 - this.player.x);
    const x = THREE.MathUtils.clamp(this.player.x + Math.cos(angle) * 190, 100, WORLD_WIDTH - 100);
    const y = THREE.MathUtils.clamp(this.player.y + Math.sin(angle) * 190, 120, WORLD_HEIGHT - 120);
    this.boss = new Boss3D(this.actors, x, y, this.resources, bossDefinition.id);
    this.bossSystem.spawnBoss(bossDefinition.id);
    this.effects.bossArrival(x, y);
    this.cameraController.triggerPullback(1.15, 0.9);
    this.cameraController.triggerShake(0.2, 0.32);
    audioService.crossfadeMusic('boss');
    audioService.playSFX('boss-warning', { volume: 1.15, throttle: 0.2 });
    this.callbacks.onSnapshot(this.getSnapshot());
  }

  private setBossPosition(x: number, y: number): void {
    if (!this.boss) return;
    this.boss.setPosition(THREE.MathUtils.clamp(x, 90, WORLD_WIDTH - 90), THREE.MathUtils.clamp(y, 120, WORLD_HEIGHT - 100));
  }

  private telegraphBossAttack(attack: BossAttack, x: number, y: number): void {
    this.boss?.startAttack(attack);
    this.telegraphs.show(attack, x, y, this.player.x, this.player.y);
    audioService.playSFX(attack === 'slam' || attack === 'ground-slam' ? 'boss-slam' : 'boss-warning', { volume: 0.72, throttle: 0.24 });
  }

  private executeBossAttack(attack: BossAttack, x: number, y: number): void {
    const definition = this.bossSystem.getDefinition();
    if (!definition) return;
    const dx = this.player.x - x;
    const dy = this.player.y - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const dangerColor = definition.visualTheme === 'frost' ? 0x70dfff : definition.visualTheme === 'forest' ? 0xb875df : definition.visualTheme === 'infernal' ? 0xff654d : 0xff4e62;
    if (attack === 'slam' || attack === 'ground-slam' || attack === 'thorn-circle' || attack === 'frost-zones' || attack === 'meteor') {
      const radius = attack === 'meteor' ? 96 : attack === 'thorn-circle' ? 92 : attack === 'frost-zones' ? 88 : 112;
      const damageType: DamageType = attack === 'thorn-circle' || attack === 'meteor' ? 'fire' : attack === 'frost-zones' ? 'lightning' : 'physical';
      this.dealAreaDamage(x, y, radius, definition.damage * 0.72, dangerColor, damageType);
      if (distance < radius) this.damagePlayerFromBoss(definition.damage * (attack === 'meteor' ? 1.1 : 1), dangerColor);
      return;
    }
    if (attack === 'bone-ring' || attack === 'fire-wave') {
      const count = attack === 'fire-wave' ? 12 : 10;
      const color = attack === 'fire-wave' ? 0xff704d : dangerColor;
      for (let index = 0; index < count; index += 1) this.spawnEnemyProjectile(x, y, index * Math.PI * 2 / count, attack === 'fire-wave' ? 142 : 176, definition.damage * 0.62, color);
      return;
    }
    if (attack === 'spirit-volley' || attack === 'ice-shard-fan') {
      const angle = Math.atan2(dy, dx);
      const count = attack === 'ice-shard-fan' ? 5 : 4;
      const color = attack === 'ice-shard-fan' ? 0x70dfff : dangerColor;
      for (let index = 0; index < count; index += 1) {
        const spread = (index - (count - 1) / 2) * 0.18;
        this.spawnEnemyProjectile(x, y, angle + spread, attack === 'spirit-volley' ? 124 : 158, definition.damage * 0.58, color);
      }
      return;
    }
    if (attack === 'charge' || attack === 'demon-charge') {
      this.setBossPosition(x + (dx / Math.max(1, distance)) * 130, y + (dy / Math.max(1, distance)) * 130);
      if (distance < 150) this.damagePlayerFromBoss(definition.damage * 1.15, dangerColor);
      return;
    }
    if (attack === 'blink') {
      this.setBossPosition(this.player.x - (dx / Math.max(1, distance)) * 180, this.player.y - (dy / Math.max(1, distance)) * 180);
      this.effects.ring(this.player.x, this.player.y, 1.25, dangerColor);
    }
  }

  private damagePlayerFromBoss(amount: number, color: number): void {
    if (!this.player.takeDamage(this.getPlayerDamage(amount), this.gameTime)) return;
    this.spawnDamageNumber(this.player.x, this.player.y - 30, amount, false, color);
    this.effects.burst(this.player.x, this.player.y, color, true);
    this.cameraController.triggerShake(0.24, 0.26);
    audioService.playSFX('hurt', { throttle: 0.28 });
    this.callbacks.onPlayerHit?.();
    void HapticsService.heavy(this.save.settings.haptics);
    this.callbacks.onSnapshot(this.getSnapshot());
    if (this.player.stats.currentHP <= 0) this.finishGameOver();
  }

  private damageBoss(baseDamage: number, damageType: DamageType): void {
    const bossDefinition = this.bossSystem.getDefinition();
    const result = calculateDamage({ baseDamage, damageType, weakness: bossDefinition?.weakness, resistance: bossDefinition?.resistance, canCrit: true, critChance: this.player.stats.critChance, critMultiplier: this.player.stats.critMultiplier });
    this.spawnDamageNumber(this.boss?.x ?? 0, (this.boss?.y ?? 0) - 72, result.finalDamage, result.critical, 0xffd37c);
    this.effects.burst(this.boss?.x ?? 0, this.boss?.y ?? 0, 0xffd37c, result.critical);
    audioService.playSFX('hit', { pitch: result.critical ? 1.3 : 0.82, throttle: 0.08 });
    if (this.bossSystem.damageBoss(result.finalDamage)) {
      if (bossDefinition) this.bossKillsById[bossDefinition.id] = (this.bossKillsById[bossDefinition.id] ?? 0) + 1;
      if (this.boss) {
        this.boss.startDeath();
        this.effects.bossDeath(this.boss.x, this.boss.y);
        this.cameraController.triggerPullback(1.8, 1.1);
      }
      audioService.playSFX('boss-death', { throttle: 0.4 });
      this.finishStageClear();
    }
  }

  private fireEnemyProjectile(enemy: Enemy3D): void {
    const angle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
    this.spawnEnemyProjectile(enemy.x, enemy.y, angle, 135, enemy.contactDamage * 0.72, 0xff6372);
  }

  private spawnEnemyProjectile(x: number, y: number, angle: number, speed: number, damage: number, color = 0xff6372): void {
    this.enemyProjectiles.push(new EnemyProjectile3D(this.actors, x, y, angle, speed, this.resources, damage, color));
  }

  private updateEnemyProjectiles(delta: number): void {
    for (let index = this.enemyProjectiles.length - 1; index >= 0; index -= 1) {
      const projectile = this.enemyProjectiles[index];
      projectile.age += delta;
      projectile.update(delta);
      const dx = projectile.x - this.player.x;
      const dy = projectile.y - this.player.y;
      if (Math.sqrt(dx * dx + dy * dy) < 25 && this.player.takeDamage(this.getPlayerDamage(projectile.damage), this.gameTime, 0.72)) {
        projectile.active = false;
        this.spawnDamageNumber(this.player.x, this.player.y - 28, Math.round(projectile.damage), false, 0xff6372);
        this.effects.burst(this.player.x, this.player.y, 0xff6372);
        this.cameraController.triggerShake(0.1, 0.16);
        audioService.playSFX('hurt', { throttle: 0.3 });
        this.callbacks.onPlayerHit?.();
        void HapticsService.medium(this.save.settings.haptics);
        if (this.player.stats.currentHP <= 0) this.finishGameOver();
      }
      if (projectile.age > 6 || projectile.x < -30 || projectile.x > WORLD_WIDTH + 30 || projectile.y < -30 || projectile.y > WORLD_HEIGHT + 30) projectile.active = false;
      if (!projectile.active) {
        projectile.destroy();
        this.enemyProjectiles.splice(index, 1);
      }
    }
  }

  private onEnemyKilled(kind: EnemyKind, elite: boolean): void {
    this.kills += 1;
    if (elite) this.eliteKills += 1;
    this.enemyKillsByKind[kind] = (this.enemyKillsByKind[kind] ?? 0) + 1;
    this.effects.burst(this.player.x, this.player.y, elite ? 0xffba58 : 0x5ddcff);
    this.runController.updateStats({ kills: this.kills, eliteKills: this.eliteKills, highestLevel: this.xpSystem.level });
  }

  private spawnDamageNumber(x: number, y: number, damage: number, critical: boolean, color: number): void {
    if (!this.save.settings.damageNumbers) return;
    this.damageText.show(x, y, damage, critical, color);
  }

  private finishStageClear(): void {
    if (this.isFinished) return;
    this.isFinished = true;
    this.input.reset();
    this.enemySpawner.stopSpawning();
    this.runController.finishRun();
    const result = this.buildRunResult(this.stage.coinReward + Math.round(this.gameTime / 10) + this.enemies.length + 30);
    this.callbacks.onSnapshot(this.getSnapshot());
    audioService.playSFX('stage-clear', { throttle: 0.4 });
    audioService.crossfadeMusic('menu', 1.2);
    void HapticsService.success(this.save.settings.haptics);
    this.pendingResultTimer = window.setTimeout(() => { this.pendingResultTimer = undefined; this.callbacks.onStageClear(result); }, 800);
  }

  private finishGameOver(): void {
    if (this.isFinished) return;
    this.isFinished = true;
    this.input.reset();
    this.enemySpawner.stopSpawning();
    this.runController.failRun();
    const result = this.buildRunResult(Math.max(6, Math.round(this.gameTime / 14) + Math.round(this.enemies.length / 8)));
    this.callbacks.onSnapshot(this.getSnapshot());
    audioService.playSFX('game-over', { throttle: 0.4 });
    audioService.crossfadeMusic('menu', 1.2);
    this.pendingResultTimer = window.setTimeout(() => { this.pendingResultTimer = undefined; this.callbacks.onGameOver(result); }, 500);
  }

  private buildRunResult(coins: number): RunResult {
    const bossKills = Object.values(this.bossKillsById).reduce((total, count) => total + count, 0);
    return {
      stageId: this.stage.id,
      stageName: this.stage.name,
      time: this.gameTime,
      kills: this.kills,
      eliteKills: this.eliteKills,
      bossKills,
      coins,
      xpCollected: this.xpCollected,
      highestLevel: this.xpSystem.level,
      enemyKillsByKind: { ...this.enemyKillsByKind },
      encounteredEnemies: [...this.encounteredEnemies],
      bossesDefeated: Object.keys(this.bossKillsById) as BossId[],
      bossKillsById: { ...this.bossKillsById },
      encounteredBosses: [...this.encounteredBosses],
    };
  }

  private pauseFromBackground(): void {
    if (this.destroyed || this.isFinished || this.levelUpOpen || this.isRunPaused) return;
    this.isRunPaused = true;
    this.runController.pauseRun();
    audioService.pause();
    this.callbacks.onPaused(true);
  }

  private readonly handleContextLost = (event: Event): void => {
    event.preventDefault();
    this.pauseFromBackground();
    this.callbacks.onRendererError?.('The 3D context was interrupted. The run is paused; reload if the arena does not return.');
    console.warn('Tiny Survivor paused because the WebGL context was lost.');
  };

  private readonly handleContextRestored = (): void => { console.info('Tiny Survivor WebGL context restored; run remains paused.'); };
}

function disposeScene(scene: THREE.Scene): void {
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Sprite) {
      object.geometry?.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshBasicMaterial || material instanceof THREE.SpriteMaterial) material.map?.dispose();
        material.dispose();
      }
    }
  });
}

function distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}
