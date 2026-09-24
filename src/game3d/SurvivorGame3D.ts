import * as THREE from 'three';
import { PLAYER_BALANCE, WEAPON_BALANCE } from '../data/balance';
import { getBossDefinition } from '../data/bosses';
import { getMonsterDefinition } from '../data/monsters';
import { generateUpgradeChoices } from '../data/upgrades';
import { resolvePlayerStats, type ResolvedPlayerStats } from '../data/statsResolver';
import type { BossAttack, BossId, ChestReward, DamageType, EnemyKind, GameSnapshot, RunMode, RunResult, SaveData, StageDefinition, UpgradeChoice, WeaponId, AbilityId } from '../types';
import { ALL_ABILITY_IDS } from '../data/abilities';
import { isWorldCleared, getSurvivalEnemyPool } from '../data/stages';
import { HapticsService } from '../services/hapticsService';
import { audioService, type SfxId } from '../services/audioService';
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
import { BossEcho3D } from './entities/BossEcho3D';
import { Projectile3D } from './entities/Projectile3D';
import { XPPickup3D } from './entities/XPPickup3D';
import { DiamondPickup3D } from './entities/DiamondPickup3D';
import { ArenaRune3D, type ArenaRuneKind } from './entities/ArenaRune3D';
import { TreasureGoblin3D } from './entities/TreasureGoblin3D';
import { TreasureChest3D } from './entities/TreasureChest3D';
import { announceCombatWave, setCombatFlowState, getCombatFlowState } from '../game/systems/CombatTargeting';
import { InputController } from './input/InputController';
import { CameraController } from './scene/CameraController';
import { createArena } from './scene/Arena3D';
import { createLighting } from './scene/Lighting3D';
import { biomeThemeFor } from './scene/BiomeTheme';
import { resolveObstacleCollision, resolveSafeSpawnPosition } from './scene/WorldObstacles';
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
  private readonly mode: RunMode;
  private resolvedStats!: ResolvedPlayerStats;
  private currentBossEcho?: BossEcho3D;
  private queuedEcho?: BossId;
  private queuedEchoSpawnTimer = 0;
  private readonly echoesSummoned = new Set<BossId>();
  private batPetTimer = 4.5;
  private fairyPetTimer = 25.0;
  private primaryShotCounter = 0;
  private survivalBossTimer = 240;
  private survivalEscalationTimer = 60;
  private readonly diamondPickups: DiamondPickup3D[] = [];
  private readonly arenaRunes: ArenaRune3D[] = [];
  private readonly activeChests: TreasureChest3D[] = [];
  private activeTreasureGoblin?: TreasureGoblin3D;
  private collectedDiamonds = 0;
  private rerollsRemaining = 2;
  private runeSpawnTimer = 20.0;
  private goblinSpawnTimer = 34.0;
  private bloodMoonTimer = 70.0;
  private isBloodMoonActive = false;
  private bloodMoonRemaining = 0;
  private meteorShowerTimer = 110.0;
  private isMeteorShowerActive = false;
  private meteorShowerRemaining = 0;
  private nextMeteorDropTimer = 0;
  private recentKillTimestamps: number[] = [];
  private lastAnnouncedCombo = 0;
  private hitStopFrames = 0;
  private hasteBuffTimer = 0;
  private readonly dashedEnemiesThisDash = new Set<string>();
  private overdriveAuraTimer = 0;

  constructor({ parent, stage, save, callbacks, mode = 'campaign' }: Game3DOptions) {
    this.parent = parent;
    this.stage = stage;
    this.save = save;
    this.callbacks = callbacks;
    this.mode = mode;
    this.lowPerformanceMode = save.settings.lowPerformanceMode;
    const theme = biomeThemeFor(stage);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.16;
    if (!this.lowPerformanceMode) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.lowPerformanceMode ? 1 : 1.5));
    this.renderer.setClearColor(theme.background, 1);
    this.renderer.domElement.className = 'three-canvas';
    this.renderer.domElement.setAttribute('aria-label', `${stage.name} 3D gameplay arena`);
    this.renderer.domElement.setAttribute('role', 'img');
    this.parent.appendChild(this.renderer.domElement);

    this.scene.background = new THREE.Color(theme.background);
    this.scene.fog = new THREE.Fog(theme.fog, this.lowPerformanceMode ? 24 : 32, this.lowPerformanceMode ? 65 : 95);
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
      },
      () => this.triggerPlayerDash()
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

  /** Called by the UI dash button and keyboard/mouse (Space, Shift, RightClick). */
  triggerPlayerDash(): boolean {
    if (this.isRunPaused || this.isFinished || this.levelUpOpen || !this.player) return false;
    const didDash = this.player.triggerDash((x, y, dirX, dirY) => {
      const color = 0x38bdf8;
      this.effects.dashStreak(x, y, dirX, dirY, color);
    });
    if (didDash) this.cameraController.triggerShake(0.06, 0.12);
    return didDash;
  }

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
    } else if (id in this.weaponSystem.getLevels() || ['magic-bolt', 'orbiting-blades', 'chain-lightning', 'fire-orb'].includes(id)) {
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

  rerollUpgrades(): void {
    if (this.rerollsRemaining <= 0 || !this.levelUpOpen || this.isFinished) return;
    this.rerollsRemaining -= 1;
    audioService.playSFX('reroll', { pitch: 1.0 });
    const choices = generateUpgradeChoices(
      this.weaponSystem.getLevels(),
      this.passiveLevels,
      this.abilitySystem.getLevels(),
      this.save.unlockedAbilities,
      3
    );
    this.callbacks.onLevelUp(choices);
    this.callbacks.onSnapshot(this.getSnapshot());
  }

  skipUpgrade(): void {
    if (!this.levelUpOpen || this.isFinished) return;
    this.save.coins += 60;
    this.player.stats.currentHP = Math.min(this.player.stats.maxHP, this.player.stats.currentHP + 30);
    this.effects.burst(this.player.x, this.player.y, 0x22c55e);
    this.spawnDamageNumber(this.player.x, this.player.y - 35, 30, false, 0x22c55e);
    audioService.playSFX('skip-heal', { pitch: 1.0 });

    this.xpSystem.processQueuedLevelUps();
    this.levelUpOpen = false;
    if (this.xpSystem.checkLevelUp()) {
      this.levelUpOpen = true;
      audioService.playSFX('upgrade');
      this.callbacks.onLevelUp(
        generateUpgradeChoices(
          this.weaponSystem.getLevels(),
          this.passiveLevels,
          this.abilitySystem.getLevels(),
          this.save.unlockedAbilities,
          3
        )
      );
      return;
    }
    audioService.restoreMusicVolume();
    this.isRunPaused = false;
    this.runController.resumeRun();
    this.callbacks.onPaused(false);
    this.callbacks.onSnapshot(this.getSnapshot());
  }

  claimChestReward(reward: ChestReward): void {
    for (const up of reward.upgrades) {
      if (ALL_ABILITY_IDS.includes(up.id as AbilityId)) {
        this.abilitySystem.upgradeAbility(up.id as AbilityId);
      } else if (
        up.id in this.weaponSystem.getLevels() ||
        ['magic-bolt', 'orbiting-blades', 'chain-lightning', 'fire-orb'].includes(up.id)
      ) {
        this.weaponSystem.upgradeWeapon(up.id as WeaponId);
      } else {
        const level = Math.min(5, (this.passiveLevels[up.id] ?? 0) + 1);
        this.passiveLevels[up.id] = level;
        this.applyPassive(up.id, level);
      }
    }

    this.save.coins += reward.coins;
    this.collectedDiamonds += reward.gems;

    this.effects.burst(this.player.x, this.player.y, 0xfbbf24);
    this.effects.levelUp(this.player.x, this.player.y);
    audioService.playSFX('upgrade', { pitch: 1.2 });

    this.resumeRun();
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
      stats: this.player ? {
        damageMultiplier: this.player.stats.damageMultiplier,
        moveSpeed: this.player.stats.moveSpeed,
        armor: this.player.stats.armor,
        critChance: this.player.stats.critChance,
        pickupRadius: this.player.stats.pickupRadius,
        cooldownMultiplier: this.player.stats.cooldownMultiplier,
      } : undefined,
      boss: bossState ? { name: bossState.name, hp: bossState.hp, maxHp: bossState.maxHp, phase: bossState.phase } : undefined,
      dashCooldownRatio: this.player ? this.player.getDashCooldownRatio() : 0,
      isDashing: this.player ? this.player.isDashing() : false,
      gems: this.collectedDiamonds,
      comboStreak: this.recentKillTimestamps.length,
      bloodMoonActive: this.isBloodMoonActive,
      rerollsRemaining: this.rerollsRemaining,
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
    for (const diamond of this.diamondPickups) diamond.destroy();
    for (const rune of this.arenaRunes) rune.destroy();
    for (const chest of this.activeChests) chest.destroy();
    this.activeChests.length = 0;
    this.activeTreasureGoblin?.destroy();
    this.boss?.destroy();
    this.currentBossEcho?.destroy();
    this.queuedEcho = undefined;
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
    if (this.hitStopFrames > 0) {
      this.hitStopFrames -= 1;
    } else if (!this.isRunPaused && !this.isFinished) {
      this.update(delta);
    }
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
    const heroId = this.save.selectedHero ?? 'shadow';
    const loadout = this.save.heroLoadouts?.[heroId];
    this.resolvedStats = resolvePlayerStats(heroId, loadout, this.save.permanentUpgrades);

    const stats: PlayerStats = {
      maxHP: this.resolvedStats.maxHp,
      currentHP: this.resolvedStats.maxHp,
      armor: this.resolvedStats.armor,
      moveSpeed: this.resolvedStats.moveSpeed,
      pickupRadius: this.resolvedStats.pickupRadius,
      damageMultiplier: this.resolvedStats.allDamageMultiplier,
      cooldownMultiplier: 1,
      critChance: this.resolvedStats.critChance,
      critMultiplier: this.resolvedStats.critMultiplier,
      xpMultiplier: this.resolvedStats.xpMultiplier,
    };
    this.player = new Player3D(
      this.actors,
      WORLD_WIDTH / 2,
      WORLD_HEIGHT / 2,
      stats,
      this.resources,
      this.stage.worldId,
      heroId,
      loadout,
      (x, y) => this.effects.dustPuff(x, y)
    );
    this.player.initializePlayer();
    this.runController = new RunController(this.stage.id, this.mode === 'survival' ? 'Survival Mode' : this.stage.name);
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
      dealAreaDamage: (x, y, radius, damage, color, damageType, maxTargets, knockbackForce) =>
        this.dealAreaDamage(x, y, radius, damage, color, damageType, maxTargets, knockbackForce),
      dealOrbitDamage: (x, y, radius, damage, damageType) =>
        this.dealOrbitDamage(x, y, radius, damage, damageType),
      getPrimaryDamageMultiplier: () => this.player.stats.damageMultiplier * this.resolvedStats.primaryDamageMultiplier,
      getAutoWeaponDamageMultiplier: () => this.player.stats.damageMultiplier * this.resolvedStats.autoWeaponDamageMultiplier,
      getCooldownMultiplier: () => (this.player.stats.cooldownMultiplier * this.resolvedStats.primaryCooldownMultiplier) / this.resolvedStats.primaryFireRateMultiplier,
      triggerMeleeSwing: (originX, originY, dirX, dirY, reach, color, empowered) => {
        this.player.triggerAttack();
        const heroId = this.save.selectedHero ?? 'shadow';
        this.effects.heroMeleeStrike(heroId, originX, originY, dirX, dirY, reach, color, empowered);
        const sfx =
          heroId === 'warrior' ? 'sword-cleave' :
          heroId === 'monk' ? 'chi-punch' :
          heroId === 'gunslinger' ? 'shotgun-blast' : 'scythe-slash';
        audioService.playSFX(sfx, { throttle: 0.08 });
        this.cameraController.triggerShake(empowered ? 0.045 : 0.025, 0.09);
      },
    });
    this.abilitySystem = new AbilitySystem({
      onFireball: (dirX, dirY, level) => this.triggerFireball(dirX, dirY, level),
      onFreeze: (level) => this.triggerFreeze(level),
      onHealTick: (amount, isFinished) => this.triggerHealTick(amount * this.resolvedStats.healMultiplier, isFinished),
      onArcaneBeam: (dirX, dirY, level) => this.triggerArcaneBeam(dirX, dirY, level),
      getCooldownMultiplier: (id?: AbilityId) => {
        let mult = this.player.stats.cooldownMultiplier * this.resolvedStats.specialCooldownMultiplier;
        if (id === 'freeze') {
          mult *= this.resolvedStats.freezeCooldownMultiplier;
        }
        return mult;
      },
      getPlayerHP: () => ({
        current: this.player.stats.currentHP,
        max: this.player.stats.maxHP,
      }),
    });
    this.abilitySystem.setUnlockedAbilities(this.save.unlockedAbilities || []);
    this.enemySpawner = new EnemySpawner({
      getPlayerPosition: () => this.player.getPosition(),
      getPlayerVelocity: () => this.player.getVelocity(),
      getWorldSize: () => ({ width: WORLD_WIDTH, height: WORLD_HEIGHT }),
      getAliveCount: () => this.enemies.length,
      spawnEnemy: (type, x, y, elite) => this.spawnEnemy(type, x, y, elite),
    });
    if (this.mode === 'survival') {
      this.enemySpawner.loadStageTimeline(this.stage, getSurvivalEnemyPool(this.save), true);
    } else {
      this.enemySpawner.loadStageTimeline(this.stage);
    }
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
    if (this.mode !== 'survival' && !this.stage.bossStage && this.gameTime >= this.stage.duration) {
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

    // Tactical Dash Strike & Projectile Deflection
    if (this.player.isDashing()) {
      const pX = this.player.x;
      const pY = this.player.y;
      const flow = getCombatFlowState();

      // Dash Strike slicing damage through enemy contacts
      const nearbyEnemies = this.spatialGrid.queryRadius(pX, pY, 36);
      for (const enemy of nearbyEnemies) {
        if (!this.dashedEnemiesThisDash.has(enemy.id)) {
          this.dashedEnemiesThisDash.add(enemy.id);
          const dashDamage = Math.round(
            38 * this.player.stats.damageMultiplier * (flow.overdrive ? 1.5 : 1.0)
          );
          this.damageEnemy(enemy, dashDamage, 0x38bdf8, 'physical', pX, pY);
          this.effects.ring(enemy.x, enemy.y, 0.42, 0x38bdf8);
          this.effects.burst(enemy.x, enemy.y, 0x7dd3fc, false);
          audioService.playSFX('hit', { pitch: 1.3, throttle: 0.08 });
        }
      }

      // Dash Projectile Deflect & Cleanse
      for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
        const proj = this.enemyProjectiles[i];
        const dist = Math.hypot(pX - proj.x, pY - proj.y);
        if (dist < 34) {
          proj.destroy();
          this.enemyProjectiles.splice(i, 1);
          this.effects.ring(proj.x, proj.y, 0.55, 0x67e8f9);
          this.effects.burst(proj.x, proj.y, 0xffffff, true);
          this.cameraController.triggerShake(0.04, 0.1);
          audioService.playSFX('dash', { pitch: 1.45, throttle: 0.1 });
          this.weaponSystem.onPrimaryHit(pX, pY);
        }
      }
    } else {
      this.dashedEnemiesThisDash.clear();
    }

    // Overdrive Mode Active Surges & Super Magnet
    const flow = getCombatFlowState();
    if (flow.overdrive) {
      this.overdriveAuraTimer -= delta;
      if (this.overdriveAuraTimer <= 0) {
        this.overdriveAuraTimer = 0.75;
        const pX = this.player.x;
        const pY = this.player.y;
        this.effects.ring(pX, pY, 2.2, 0xffd166);
        this.effects.burst(pX, pY, 0xffe277, false);
        audioService.playSFX('combo-stinger', { pitch: 1.25, volume: 0.7, throttle: 0.3 });
        this.dealAreaDamage(
          pX,
          pY,
          85,
          32 * this.player.stats.damageMultiplier,
          0xffd166,
          'arcane'
        );
      }
      for (const xp of this.xpPickups) {
        const dist = Math.hypot(this.player.x - xp.x, this.player.y - xp.y);
        if (dist < 260) {
          xp.speed = Math.max(xp.speed, 620);
        }
      }
    } else {
      this.overdriveAuraTimer = 0;
    }

    this.lastLightningPoint = undefined;
    this.weaponSystem.update(delta);
    this.abilitySystem.update(delta, this.isRunPaused || this.levelUpOpen);
    this.updateProjectiles(delta);
    this.updateEnemyProjectiles(delta);
    this.updatePickups(delta);
    this.updateDiamonds(delta);
    this.updateArenaRunes(delta);
    this.updateChests(delta);
    this.updateDynamicEvents(delta);
    this.updateOrbitVisuals();

    // Survival Mode escalation & periodic bosses
    if (this.mode === 'survival') {
      this.survivalEscalationTimer -= delta;
      if (this.survivalEscalationTimer <= 0) {
        this.survivalEscalationTimer = 60;
        this.enemySpawner.spawnRegularWave();
      }
      this.survivalBossTimer -= delta;
      if (this.survivalBossTimer <= 0 && !this.bossSpawned) {
        this.survivalBossTimer = 240;
        this.spawnSurvivalBoss();
      }
    }

    // Equipped Pet periodic combat behaviors
    if (this.resolvedStats.equippedPet === 'bat-familiar') {
      this.batPetTimer -= delta;
      if (this.batPetTimer <= 0) {
        this.batPetTimer = 4.5;
        this.triggerBatPetAttack();
      }
    } else if (this.resolvedStats.equippedPet === 'fairy') {
      this.fairyPetTimer -= delta;
      if (this.fairyPetTimer <= 0) {
        this.fairyPetTimer = 25.0;
        this.triggerFairyHeal();
      }
    }

    this.checkBossTimer(delta);
    if (this.bossSpawned) {
      this.bossSystem.updateBoss(delta);
      this.boss?.update(delta, this.player.x, this.player.y);
    }

    // Demon King Boss Echo update
    if (this.currentBossEcho) {
      this.currentBossEcho.update(
        delta,
        this.player.x,
        this.player.y,
        (attack, x, y) => this.telegraphBossAttack(attack, x, y),
        (attack, x, y, dmg) => this.executeEchoAttack(attack, x, y, dmg)
      );
      if (this.currentBossEcho.isDead) {
        this.effects.bossDeath(this.currentBossEcho.x, this.currentBossEcho.y);
        audioService.playSFX('death');
        this.currentBossEcho.destroy();
        this.currentBossEcho = undefined;
        this.bossSystem.setEchoActive(false);
        if (this.queuedEcho) {
          this.queuedEchoSpawnTimer = 1.5;
        }
      }
    } else if (this.queuedEcho) {
      this.queuedEchoSpawnTimer -= delta;
      if (this.queuedEchoSpawnTimer <= 0) {
        const nextEcho = this.queuedEcho;
        this.queuedEcho = undefined;
        this.spawnBossEcho(nextEcho);
      }
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
        (e.kind === 'archer' || e.kind === 'bat' || e.kind === 'slime' || e.kind === 'imp' ||
         e.kind === 'cursed-wolf' || e.kind === 'thornling' || e.kind === 'frost-wraith')
      ) {
        highThreatActiveCount += 1;
      }
    }

    // High-performance Swarm Dispersion Pass:
    // Prevents enemy clumping and spreads the swarm into an encircling net around player
    for (let i = 0; i < this.enemies.length; i += 1) {
      const enemy = this.enemies[i];
      const sepRadius = Math.max(36, enemy.radius * 2.4);
      const neighbors = this.spatialGrid.queryRadius(enemy.x, enemy.y, sepRadius);
      let pushX = 0;
      let pushY = 0;
      for (let n = 0; n < neighbors.length; n += 1) {
        const other = neighbors[n];
        if (other !== enemy) {
          const dx = enemy.x - other.x;
          const dy = enemy.y - other.y;
          const distSq = dx * dx + dy * dy;
          const idealDist = enemy.radius + other.radius + 18;
          if (distSq > 0.001 && distSq < idealDist * idealDist) {
            const dist = Math.sqrt(distSq);
            const factor = (idealDist - dist) / idealDist;
            const force = factor * 110;
            pushX += (dx / dist) * force;
            pushY += (dy / dist) * force;
          }
        }
      }
      if (pushX !== 0 || pushY !== 0) {
        enemy.x += pushX * delta;
        enemy.y += pushY * delta;
      }
    }

    for (let index = this.enemies.length - 1; index >= 0; index -= 1) {
      const enemy = this.enemies[index];

      // Execute combat state machine and receive any emitted attack event
      const playerVel = this.player.getVelocity();
      const attackEvent = enemy.update(
        playerX,
        playerY,
        delta,
        this.gameTime,
        () => highThreatActiveCount < 3,
        playerVel.x,
        playerVel.y
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
          // Chain reaction: imp explosions deal amplified damage to surrounding hordes!
          this.dealAreaDamage(
            attackEvent.originX,
            attackEvent.originY,
            attackEvent.radius * 1.15,
            Math.max(attackEvent.damage * 4.2, 85 * this.player.stats.damageMultiplier),
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
          this.onEnemyKilled(enemy.kind, enemy.elite, enemy.x, enemy.y);
        } else {
          // Melee, dive, leap
          const hitDist = Math.hypot(playerX - attackEvent.targetX, playerY - attackEvent.targetY);
          if (
            hitDist < attackEvent.radius + 18 &&
            this.player.takeDamage(this.getPlayerDamage(attackEvent.damage), this.gameTime, 0.58)
          ) {
            if (attackEvent.slow) {
              this.player.applyChill(0.75, 2.0);
              this.effects.ring(playerX, playerY, 0.6, 0x38bdf8);
            }
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

  private getPlayerDamage(amount: number): number {
    return Math.max(1, Math.round(amount * 0.88 * (1 - Math.min(0.70, this.player.stats.armor))));
  }

  private spawnEnemy(type: EnemyKind, x: number, y: number, elite: boolean): void {
    this.encounteredEnemies.add(type);
    let hpMultiplier: number;
    let damageMultiplier: number;
    if (this.mode === 'survival') {
      const minutes = this.gameTime / 60;
      hpMultiplier = 1 + minutes * 0.28;
      damageMultiplier = 1 + minutes * 0.18;
    } else {
      const progress = Math.min(1, this.gameTime / Math.max(1, this.stage.duration));
      hpMultiplier = this.stage.difficulty.enemyHpMultiplier * (0.95 + progress * 0.45);
      damageMultiplier = this.stage.difficulty.enemyDamageMultiplier * (0.95 + progress * 0.25);
    }
    const safe = resolveSafeSpawnPosition(x, y, 16, this.stage.worldId);
    const enemy = new Enemy3D(this.actors, type, safe.x, safe.y, this.resources, elite, hpMultiplier, damageMultiplier, this.stage.worldId);
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

    if (this.currentBossEcho && !this.currentBossEcho.isDead) {
      const dx = this.currentBossEcho.x - originX;
      const dy = this.currentBossEcho.y - originY;
      const distSq = dx * dx + dy * dy;
      if (distSq <= maxDist * maxDist) {
        const dist = Math.sqrt(distSq);
        const dot = (dx / dist) * dirX + (dy / dist) * dirY;
        const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
        if (angle <= maxAngleRad) {
          const score = angle * 2.0 + (dist / maxDist);
          if (score < bestScore) {
            bestScore = score;
            bestTarget = { id: 'boss-echo', x: this.currentBossEcho.x, y: this.currentBossEcho.y };
          }
        }
      }
    }

    if (this.activeTreasureGoblin && !this.activeTreasureGoblin.isDead && !this.activeTreasureGoblin.hasEscaped) {
      const dx = this.activeTreasureGoblin.x - originX;
      const dy = this.activeTreasureGoblin.y - originY;
      const distSq = dx * dx + dy * dy;
      if (distSq <= maxDist * maxDist) {
        const dist = Math.sqrt(distSq);
        const dot = (dx / dist) * dirX + (dy / dist) * dirY;
        const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
        if (angle <= maxAngleRad) {
          const score = angle * 2.0 + (dist / maxDist) - 0.25;
          if (score < bestScore) {
            bestScore = score;
            bestTarget = { id: 'treasure-goblin', x: this.activeTreasureGoblin.x, y: this.activeTreasureGoblin.y };
          }
        }
      }
    }

    return bestTarget;
  }

  private fireProjectile(spec: ProjectileSpec): void {
    this.player.triggerAttack();
    audioService.playSFX(spec.weaponId, { throttle: spec.weaponId === 'magic-bolt' ? 0.1 : 0.16, volume: spec.weaponId === 'chain-lightning' ? 0.8 : 1 });

    const adjustedSpec: ProjectileSpec = {
      ...spec,
      speed: spec.speed * (spec.weaponId === 'magic-bolt' ? (this.resolvedStats?.projectileSpeedMultiplier ?? 1) : 1),
    };
    this.projectiles.push(new Projectile3D(this.actors, this.player.x, this.player.y, adjustedSpec, this.resources));

    if (spec.weaponId === 'magic-bolt') {
      this.primaryShotCounter += 1;
      if (
        this.resolvedStats?.bonusProjectileEveryNShots &&
        this.resolvedStats.bonusProjectileEveryNShots > 0 &&
        this.primaryShotCounter % this.resolvedStats.bonusProjectileEveryNShots === 0
      ) {
        // Gunslinger 6th-shot signature: bonus arcane bullet with slight spread
        const bonusSpec: ProjectileSpec = {
          ...adjustedSpec,
          angle: (spec.angle ?? 0) + 0.16,
          color: 0x80e5ff,
        };
        this.projectiles.push(new Projectile3D(this.actors, this.player.x, this.player.y, bonusSpec, this.resources));
      }
    }
  }

  private updateProjectiles(delta: number): void {
    for (let projectileIndex = this.projectiles.length - 1; projectileIndex >= 0; projectileIndex -= 1) {
      const projectile = this.projectiles[projectileIndex];
      projectile.update(delta);
      let hit = false;
      if (this.bossSpawned && this.bossSystem.isActive() && this.boss) {
        const dx = projectile.x - this.boss.x;
        const dy = projectile.y - this.boss.y;
        if (Math.hypot(dx, dy) < 42 + projectile.spec.radius) {
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
      if (!hit && this.currentBossEcho && !this.currentBossEcho.isDead) {
        const dx = projectile.x - this.currentBossEcho.x;
        const dy = projectile.y - this.currentBossEcho.y;
        if (Math.hypot(dx, dy) < 38 + projectile.spec.radius) {
          this.damageBossEcho(projectile.spec.damage, projectile.spec.damageType);
          if (projectile.spec.explosive) {
            this.dealAreaDamage(projectile.x, projectile.y, 88, projectile.spec.damage * 0.72, projectile.spec.color, projectile.spec.damageType);
            this.effects.explosion(projectile.x, projectile.y, 1.4, projectile.spec.color);
          }
          this.effects.projectileImpact(projectile.x, projectile.y, projectile.spec.color);
          audioService.playSFX('hit', { pitch: 0.92 });
          hit = true;
          projectile.canPierce();
        }
      }
      if (!hit && this.activeTreasureGoblin && !this.activeTreasureGoblin.isDead && !this.activeTreasureGoblin.hasEscaped) {
        const dx = projectile.x - this.activeTreasureGoblin.x;
        const dy = projectile.y - this.activeTreasureGoblin.y;
        if (Math.hypot(dx, dy) < this.activeTreasureGoblin.radius + projectile.spec.radius + 3) {
          const killed = this.activeTreasureGoblin.damage(projectile.spec.damage);
          const kx = this.activeTreasureGoblin.x - projectile.x;
          const ky = this.activeTreasureGoblin.y - projectile.y;
          const kDist = Math.max(1, Math.hypot(kx, ky));
          this.activeTreasureGoblin.applyKnockback(kx / kDist, ky / kDist, 60);
          this.spawnDamageNumber(this.activeTreasureGoblin.x, this.activeTreasureGoblin.y - 30, Math.round(projectile.spec.damage), true, 0xfacc15);
          this.effects.burst(this.activeTreasureGoblin.x, this.activeTreasureGoblin.y, 0xfacc15);
          audioService.playSFX(killed ? 'event-fanfare' : 'hit', { pitch: 1.25 });
          if (killed) {
            this.onGoblinDefeated(this.activeTreasureGoblin.x, this.activeTreasureGoblin.y);
            this.activeTreasureGoblin.destroy();
            this.activeTreasureGoblin = undefined;
          }
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
    const originX = sourceX ?? this.player.x;
    const originY = sourceY ?? this.player.y;
    const kx = enemy.x - originX;
    const ky = enemy.y - originY;
    const kDist = Math.max(1, Math.hypot(kx, ky));
    const force = damageType === 'physical' ? 95 : 62;
    enemy.applyKnockback(kx / kDist, ky / kDist, force * (result.critical ? 1.35 : 1.0));
    if (result.critical || enemy.elite) {
      this.hitStopFrames = 2;
      this.cameraController.triggerShake(result.critical ? 0.055 : 0.12, 0.14);
    }
    this.spawnDamageNumber(enemy.x, enemy.y - enemy.radius - 8, result.finalDamage, result.critical, result.critical ? 0xffd37c : color);
    this.effects.burst(enemy.x, enemy.y, result.critical ? 0xffd37c : color, result.critical);
    audioService.playSFX(killed ? 'death' : 'hit', { pitch: result.critical ? 1.2 : 1, throttle: killed ? 0.05 : 0.08 });
    if (killed) {
      this.effects.enemyDeath(enemy.x, enemy.y, color, enemy.elite);
      this.removeEnemy(enemy, true);
      this.onEnemyKilled(enemy.kind, enemy.elite, enemy.x, enemy.y);
    }
  }

  private dealAreaDamage(
    x: number,
    y: number,
    radius: number,
    damage: number,
    color: number,
    damageType: DamageType,
    maxTargets?: number,
    knockbackForceOverride?: number
  ): void {
    if (color === 0x9f8cff) {
      const isFirstChainHit = !this.lastLightningPoint;
      const from = this.lastLightningPoint ?? this.player.getPosition();
      this.effects.lightning(from.x, from.y, x, y, color);
      this.lastLightningPoint = { x, y };
      if (isFirstChainHit) audioService.playSFX('chain-lightning');
    }
    this.effects.ring(x, y, radius * 0.025, color);

    if (this.currentBossEcho && !this.currentBossEcho.isDead) {
      const dist = Math.hypot(this.currentBossEcho.x - x, this.currentBossEcho.y - y);
      if (dist <= radius + 35) {
        this.damageBossEcho(damage * 0.85, damageType);
      }
    }

    if (this.activeTreasureGoblin && !this.activeTreasureGoblin.isDead && !this.activeTreasureGoblin.hasEscaped) {
      const dist = Math.hypot(this.activeTreasureGoblin.x - x, this.activeTreasureGoblin.y - y);
      if (dist <= radius + this.activeTreasureGoblin.radius) {
        const killed = this.activeTreasureGoblin.damage(damage);
        this.spawnDamageNumber(this.activeTreasureGoblin.x, this.activeTreasureGoblin.y - 28, Math.round(damage), true, 0xfacc15);
        this.effects.burst(this.activeTreasureGoblin.x, this.activeTreasureGoblin.y, 0xfacc15);
        if (killed) {
          this.onGoblinDefeated(this.activeTreasureGoblin.x, this.activeTreasureGoblin.y);
          this.activeTreasureGoblin.destroy();
          this.activeTreasureGoblin = undefined;
        }
      }
    }

    const queried = [...this.spatialGrid.queryRadius(x, y, radius)];
    if (maxTargets && queried.length > maxTargets) {
      queried.sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y));
    }
    const targets = maxTargets ? queried.slice(0, maxTargets) : queried;

    const defaultForce = damageType === 'physical' ? 52 : damageType === 'fire' ? 45 : 38;
    const baseForce = knockbackForceOverride ?? defaultForce;

    for (const enemy of targets) {
      if (!this.enemies.includes(enemy)) continue;
      const monster = getMonsterDefinition(enemy.kind);
      const result = calculateDamage({
        baseDamage: damage,
        damageType,
        weakness: monster.weakness,
        resistance: monster.resistance,
        canCrit: true,
        critChance: this.player.stats.critChance,
        critMultiplier: this.player.stats.critMultiplier,
      });
      if (enemy.kind === 'slime') enemy.applySlow(0.82, 1.5, this.gameTime);
      const killed = enemy.damage(result.finalDamage);
      const kx = enemy.x - x;
      const ky = enemy.y - y;
      const kDist = Math.max(1, Math.hypot(kx, ky));
      enemy.applyKnockback(kx / kDist, ky / kDist, baseForce * (result.critical ? 1.25 : 1.0));
      this.spawnDamageNumber(enemy.x, enemy.y - enemy.radius - 8, result.finalDamage, result.critical, color);
      if (killed) {
        this.effects.enemyDeath(enemy.x, enemy.y, color, enemy.elite);
        audioService.playSFX('death', { throttle: 0.08 });
        this.removeEnemy(enemy, true);
        this.onEnemyKilled(enemy.kind, enemy.elite, enemy.x, enemy.y);
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
    const specMultiplier = this.resolvedStats?.specialDamageMultiplier ?? 1;
    const damage = 64 * this.player.stats.damageMultiplier * specMultiplier * (1 + (level - 1) * 0.32);
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
    const freezeDurationMultiplier = this.resolvedStats?.freezeDurationMultiplier ?? 1;
    const duration = (2.4 + (level - 1) * 0.45) * freezeDurationMultiplier;
    this.effects.freezeRing(this.player.x, this.player.y, radius * 0.024);
    this.cameraController.triggerShake(0.1, 0.16);

    const enemies = this.spatialGrid.queryRadius(this.player.x, this.player.y, radius);
    for (const enemy of enemies) {
      if (!this.enemies.includes(enemy)) continue;
      enemy.applyFreeze(duration, this.gameTime);
      if (level >= 5) {
        const specMultiplier = this.resolvedStats?.specialDamageMultiplier ?? 1;
        this.damageEnemy(enemy, 38 * this.player.stats.damageMultiplier * specMultiplier, 0x5ddcff, 'arcane', this.player.x, this.player.y);
      }
    }

    if (this.bossSpawned && this.bossSystem?.isActive() && this.boss) {
      const dist = Math.hypot(this.boss.x - this.player.x, this.boss.y - this.player.y);
      if (dist <= radius + 30) {
        const specMultiplier = this.resolvedStats?.specialDamageMultiplier ?? 1;
        this.damageBoss(42 * this.player.stats.damageMultiplier * specMultiplier, 'arcane');
      }
    }

    if (this.currentBossEcho && !this.currentBossEcho.isDead) {
      const dist = Math.hypot(this.currentBossEcho.x - this.player.x, this.currentBossEcho.y - this.player.y);
      if (dist <= radius + 30) {
        const specMultiplier = this.resolvedStats?.specialDamageMultiplier ?? 1;
        this.damageBossEcho(42 * this.player.stats.damageMultiplier * specMultiplier, 'arcane');
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

    const specMultiplier = this.resolvedStats?.specialDamageMultiplier ?? 1;
    const damage = 88 * this.player.stats.damageMultiplier * specMultiplier * (1 + (level - 1) * 0.32);

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

    if (this.currentBossEcho && !this.currentBossEcho.isDead) {
      const dist = distToSegment(this.currentBossEcho.x, this.currentBossEcho.y, pX, pY, endX, endY);
      if (dist <= 38 + beamWidth / 2) {
        this.damageBossEcho(damage * 1.1, 'arcane');
        this.effects.burst(this.currentBossEcho.x, this.currentBossEcho.y, 0xa87aff, true);
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
    const finalValue = this.isBloodMoonActive ? value * 2 : value;
    const pickup = new XPPickup3D(`xp-${this.pickupSequence += 1}`, this.actors, x, y, finalValue, this.resources);
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

  private spawnDiamond(x: number, y: number, value = 1): void {
    const safe = resolveSafeSpawnPosition(x, y, 16, this.stage.worldId);
    const diamond = new DiamondPickup3D(
      `diamond-${this.pickupSequence += 1}`,
      this.actors,
      safe.x,
      safe.y,
      value,
      this.resources
    );
    this.diamondPickups.push(diamond);
    this.effects.burst(safe.x, safe.y, 0x38bdf8, false);
  }

  private updateDiamonds(delta: number): void {
    const playerX = this.player.x;
    const playerY = this.player.y;
    for (let index = this.diamondPickups.length - 1; index >= 0; index -= 1) {
      const diamond = this.diamondPickups[index];
      if (!diamond.update(delta, this.gameTime, playerX, playerY, this.player.stats.pickupRadius)) continue;
      this.collectedDiamonds += diamond.value;
      this.effects.burst(diamond.x, diamond.y, 0x38bdf8, true);
      this.effects.ring(diamond.x, diamond.y, 0.65, 0x38bdf8);
      this.spawnDamageNumber(diamond.x, diamond.y - 28, diamond.value, true, 0x38bdf8);
      audioService.playSFX('gem-chime');
      void HapticsService.light(this.save.settings.haptics);
      diamond.destroy();
      this.diamondPickups.splice(index, 1);
      this.callbacks.onSnapshot(this.getSnapshot());
    }
  }

  private spawnArenaRune(kind?: ArenaRuneKind): void {
    const kinds: ArenaRuneKind[] = ['bomb', 'magnet', 'freeze', 'haste'];
    const chosenKind = kind ?? kinds[Math.floor(Math.random() * kinds.length)];
    const angle = Math.random() * Math.PI * 2;
    const dist = 140 + Math.random() * 140;
    const rawX = THREE.MathUtils.clamp(this.player.x + Math.cos(angle) * dist, 80, WORLD_WIDTH - 80);
    const rawY = THREE.MathUtils.clamp(this.player.y + Math.sin(angle) * dist, 80, WORLD_HEIGHT - 80);
    const safe = resolveSafeSpawnPosition(rawX, rawY, 22, this.stage.worldId);
    const rune = new ArenaRune3D(
      `rune-${this.pickupSequence += 1}`,
      this.actors,
      safe.x,
      safe.y,
      chosenKind,
      this.resources
    );
    this.arenaRunes.push(rune);
    this.effects.levelUp(safe.x, safe.y);
    audioService.playSFX('rune-pickup', { pitch: 1.3, volume: 0.8 });
  }

  private updateArenaRunes(delta: number): void {
    const playerX = this.player.x;
    const playerY = this.player.y;
    for (let index = this.arenaRunes.length - 1; index >= 0; index -= 1) {
      const rune = this.arenaRunes[index];
      const collected = rune.update(delta, this.gameTime, playerX, playerY);
      if (collected) {
        this.activateRune(rune);
        rune.destroy();
        this.arenaRunes.splice(index, 1);
      } else if (rune.hasExpired()) {
        rune.destroy();
        this.arenaRunes.splice(index, 1);
      }
    }
  }

  spawnChest(x: number, y: number): void {
    const id = `chest-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const chest = new TreasureChest3D(id, this.actors, x, y, this.resources);
    this.activeChests.push(chest);
    audioService.playSFX('chest-drop');
    this.effects.burst(x, y, 0xfbbf24, true);
    announceCombatWave({
      label: 'TREASURE CHEST DROPPED! 🎁',
      detail: 'Touch the golden chest to claim elite spoils!',
      tone: 'elite',
    });
  }

  private updateChests(delta: number): void {
    const playerX = this.player.x;
    const playerY = this.player.y;
    for (let index = this.activeChests.length - 1; index >= 0; index -= 1) {
      const chest = this.activeChests[index];
      const opened = chest.update(delta, this.gameTime, playerX, playerY);
      if (opened) {
        this.activeChests.splice(index, 1);
        chest.destroy();
        this.openChest(chest);
        break;
      }
    }
  }

  private openChest(chest: TreasureChest3D): void {
    const possibleUpgrades = generateUpgradeChoices(
      this.weaponSystem.getLevels(),
      this.passiveLevels,
      this.abilitySystem.getLevels(),
      this.save.unlockedAbilities,
      3
    );

    const count = Math.min(possibleUpgrades.length, Math.random() < 0.45 ? 2 : 1);
    const selectedUpgrades = possibleUpgrades.slice(0, count);
    const bonusCoins = 120 + Math.floor(Math.random() * 140);
    const bonusGems = Math.random() < 0.6 ? 1 : 0;

    const reward: ChestReward = {
      upgrades: selectedUpgrades,
      coins: bonusCoins,
      gems: bonusGems,
    };

    this.isRunPaused = true;
    this.runController.pauseRun();
    this.callbacks.onPaused(true);
    this.callbacks.onChestOpened?.(reward);
  }

  private activateRune(rune: ArenaRune3D): void {
    audioService.playSFX('rune-pickup');
    this.effects.levelUp(rune.x, rune.y);
    this.spawnDamageNumber(rune.x, rune.y - 32, 1, true, rune.definition.color);
    announceCombatWave({
      label: `${rune.definition.name.toUpperCase()}!`,
      detail:
        rune.kind === 'bomb'
          ? 'Cataclysmic shockwave obliterating the horde!'
          : rune.kind === 'magnet'
          ? 'Vortex pulling all XP & Diamonds to your hero!'
          : rune.kind === 'freeze'
          ? 'Absolute zero! All enemies frozen solid!'
          : 'Solar frenzy! Maximum attack and movement speed!',
      tone: 'elite',
    });

    if (rune.kind === 'bomb') {
      this.detonateBombRune(rune.x, rune.y);
    } else if (rune.kind === 'magnet') {
      this.vacuumAllPickups();
    } else if (rune.kind === 'freeze') {
      this.triggerFreeze(5);
    } else if (rune.kind === 'haste') {
      this.triggerHasteRune();
    }
  }

  private detonateBombRune(originX: number, originY: number): void {
    audioService.playSFX('imp-explode', { volume: 1.3 });
    this.effects.meteorBlast(originX, originY, 150);
    this.cameraController.triggerShake(0.25, 0.32);
    for (const enemy of [...this.enemies]) {
      const damage = enemy.elite ? 1200 : 9999;
      this.damageEnemy(enemy, damage, 0xff3b30, 'fire', originX, originY);
    }
    if (this.boss && this.bossSpawned) {
      this.damageBoss(800, 'fire');
    }
  }

  private vacuumAllPickups(): void {
    for (const xp of this.xpPickups) {
      xp.speed = 680;
    }
    for (const diamond of this.diamondPickups) {
      diamond.speed = 780;
    }
    this.effects.levelUp(this.player.x, this.player.y);
    this.cameraController.triggerShake(0.08, 0.18);
  }

  private triggerHasteRune(): void {
    this.hasteBuffTimer = 8.0;
    this.player.applyInvulnerability(this.gameTime, 8.0);
    audioService.playSFX('event-fanfare', { pitch: 1.2 });
    this.effects.levelUp(this.player.x, this.player.y);
    setCombatFlowState({
      meter: 100,
      overdrive: true,
      overdriveRemaining: 8.0,
      streak: Math.max(10, getCombatFlowState().streak),
    });
  }

  private spawnTreasureGoblin(): void {
    if (this.activeTreasureGoblin && !this.activeTreasureGoblin.isDead && !this.activeTreasureGoblin.hasEscaped) return;
    const angle = Math.random() * Math.PI * 2;
    const spawnDist = 220;
    const rawX = THREE.MathUtils.clamp(this.player.x + Math.cos(angle) * spawnDist, 100, WORLD_WIDTH - 100);
    const rawY = THREE.MathUtils.clamp(this.player.y + Math.sin(angle) * spawnDist, 100, WORLD_HEIGHT - 100);
    const safe = resolveSafeSpawnPosition(rawX, rawY, 24, this.stage.worldId);
    this.activeTreasureGoblin = new TreasureGoblin3D(
      this.actors,
      safe.x,
      safe.y,
      this.resources,
      this.stage.worldId,
      this.stage.difficulty.enemyHpMultiplier
    );
    this.effects.bossArrival(safe.x, safe.y);
    audioService.playSFX('event-fanfare', { pitch: 1.1 });
    announceCombatWave({
      label: 'TREASURE GOBLIN!',
      detail: 'Hunt the greedy goblin before it portals away with the diamonds!',
      tone: 'elite',
    });
  }

  private onGoblinDefeated(x: number, y: number): void {
    const diamondCount = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < diamondCount; i++) {
      const angle = (i / diamondCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const dist = 24 + Math.random() * 20;
      this.spawnDiamond(x + Math.cos(angle) * dist, y + Math.sin(angle) * dist, 1);
    }
    this.spawnXP(x, y, 180);
    this.spawnChest(x, y);
    this.effects.burst(x, y, 0x38bdf8, true);
    this.effects.burst(x, y, 0xffd700, true);
    this.effects.levelUp(x, y);
    this.cameraController.triggerShake(0.2, 0.28);
    this.cameraController.triggerPullback(1.5, 0.9);
    audioService.playSFX('event-fanfare', { pitch: 1.15 });
    announceCombatWave({
      label: 'GOBLIN VANQUISHED!',
      detail: `Fountain of loot! Recovered ${diamondCount} sparkling Diamonds!`,
      tone: 'elite',
    });
  }

  private updateDynamicEvents(delta: number): void {
    // 1. Treasure Goblin hunt
    if (!this.activeTreasureGoblin) {
      this.goblinSpawnTimer -= delta;
      if (this.goblinSpawnTimer <= 0) {
        this.goblinSpawnTimer = this.mode === 'survival' ? 85 : 115;
        this.spawnTreasureGoblin();
      }
    } else {
      const g = this.activeTreasureGoblin;
      const escaped = g.update(delta, this.gameTime, this.player.x, this.player.y, (cx, cy) => {
        if (Math.random() < 0.45) {
          this.effects.burst(cx, cy, 0xffd700, false);
        }
      });
      if (g.isDead) {
        this.onGoblinDefeated(g.x, g.y);
        g.destroy();
        this.activeTreasureGoblin = undefined;
      } else if (escaped || g.hasEscaped) {
        this.effects.ring(g.x, g.y, 1.2, 0xa855f7);
        audioService.playSFX('ghost-phase');
        announceCombatWave({
          label: 'GOBLIN ESCAPED!',
          detail: 'The greedy goblin portaled away with its loot!',
          tone: 'danger',
        });
        g.destroy();
        this.activeTreasureGoblin = undefined;
      }
    }

    // 2. Arena Runes
    this.runeSpawnTimer -= delta;
    if (this.runeSpawnTimer <= 0 && this.arenaRunes.length < 2) {
      this.runeSpawnTimer = 34 + Math.random() * 12;
      this.spawnArenaRune();
    }

    // 3. Blood Moon Surge (every ~75s)
    if (!this.isBloodMoonActive) {
      this.bloodMoonTimer -= delta;
      if (this.bloodMoonTimer <= 0) {
        this.startBloodMoon();
      }
    } else {
      this.bloodMoonRemaining -= delta;
      if (this.bloodMoonRemaining <= 0) {
        this.endBloodMoon();
      }
    }

    // 4. Arcane Meteor Shower (every ~110s)
    if (!this.isMeteorShowerActive) {
      this.meteorShowerTimer -= delta;
      if (this.meteorShowerTimer <= 0) {
        this.startMeteorShower();
      }
    } else {
      this.meteorShowerRemaining -= delta;
      this.nextMeteorDropTimer -= delta;
      if (this.nextMeteorDropTimer <= 0) {
        this.nextMeteorDropTimer = 1.35;
        this.dropArcaneMeteor();
      }
      if (this.meteorShowerRemaining <= 0) {
        this.isMeteorShowerActive = false;
        this.meteorShowerTimer = this.mode === 'survival' ? 100 : 120;
      }
    }

    // 5. Haste buff decay
    if (this.hasteBuffTimer > 0) {
      this.hasteBuffTimer -= delta;
      this.effects.dustPuff(this.player.x, this.player.y, 1);
    }
  }

  private startBloodMoon(): void {
    this.isBloodMoonActive = true;
    this.bloodMoonRemaining = 18.0;
    this.cameraController.triggerPullback(1.5, 1.2);
    this.cameraController.triggerShake(0.15, 0.25);
    audioService.playSFX('frenzy-horn');
    announceCombatWave({
      label: 'BLOOD MOON RISES!',
      detail: 'Blood Frenzy! Enemies are hyper-aggressive — 2X XP & DOUBLE GOLD drops!',
      tone: 'danger',
    });
    if (this.scene.fog instanceof THREE.Fog) {
      this.scene.fog.color.setHex(0x550a0a);
    }
    this.scene.background = new THREE.Color(0x280505);
  }

  private endBloodMoon(): void {
    this.isBloodMoonActive = false;
    this.bloodMoonTimer = this.mode === 'survival' ? 75 : 95;
    const theme = biomeThemeFor(this.stage);
    if (this.scene.fog instanceof THREE.Fog) {
      this.scene.fog.color.setHex(theme.fog);
    }
    this.scene.background = new THREE.Color(theme.background);
  }

  private startMeteorShower(): void {
    this.isMeteorShowerActive = true;
    this.meteorShowerRemaining = 12.0;
    this.nextMeteorDropTimer = 0.5;
    audioService.playSFX('boss-warning', { throttle: 0.2 });
    announceCombatWave({
      label: 'METEOR SHOWER!',
      detail: 'Cataclysmic arcane meteors incoming! Dodge the impact circles!',
      tone: 'danger',
    });
  }

  private dropArcaneMeteor(): void {
    const angle = Math.random() * Math.PI * 2;
    const dist = 60 + Math.random() * 150;
    const mx = THREE.MathUtils.clamp(this.player.x + Math.cos(angle) * dist, 70, WORLD_WIDTH - 70);
    const my = THREE.MathUtils.clamp(this.player.y + Math.sin(angle) * dist, 70, WORLD_HEIGHT - 70);

    this.telegraphs.show('meteor', mx, my, mx, my);
    window.setTimeout(() => {
      if (this.destroyed || this.isFinished) return;
      audioService.playSFX('meteor-fall');
      this.effects.meteorBlast(mx, my, 85);
      this.cameraController.triggerShake(0.16, 0.22);

      const radius = 90;
      const targets = this.spatialGrid.queryRadius(mx, my, radius);
      for (const enemy of targets) {
        if (!this.enemies.includes(enemy)) continue;
        this.damageEnemy(enemy, 360 * this.player.stats.damageMultiplier, 0xf97316, 'fire', mx, my);
      }

      const distToPlayer = Math.hypot(this.player.x - mx, this.player.y - my);
      if (distToPlayer < radius * 0.75) {
        if (this.player.takeDamage(this.getPlayerDamage(22), this.gameTime, 0.7)) {
          this.spawnDamageNumber(this.player.x, this.player.y - 30, 22, true, 0xf97316);
          audioService.playSFX('hurt');
          this.callbacks.onPlayerHit?.();
        }
      }
    }, 1100);
  }

  private spawnMiniEnemy(type: EnemyKind, x: number, y: number): void {
    const safe = resolveSafeSpawnPosition(x, y, 12, this.stage.worldId);
    const enemy = new Enemy3D(this.actors, type, safe.x, safe.y, this.resources, false, 0.45, 0.65, this.stage.worldId, true);
    this.enemies.push(enemy);
    this.spatialGrid.insert(enemy);
    this.effects.ring(safe.x, safe.y, 0.45, 0x22c55e);
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
    if (id === 'power') {
      this.player.stats.damageMultiplier = this.resolvedStats.allDamageMultiplier * (1 + level * 0.12);
    }
    if (id === 'vitality') {
      const prevMaxHp = this.player.stats.maxHP;
      const newMaxHp = Math.round(this.resolvedStats.maxHp * (1 + level * 0.15));
      this.player.stats.maxHP = newMaxHp;
      const hpGain = newMaxHp - prevMaxHp;
      if (hpGain > 0) this.player.heal(hpGain);
    }
    if (id === 'swift-boots') {
      this.player.setMoveSpeed(Math.round(this.resolvedStats.moveSpeed * (1 + level * 0.08)));
    }
    if (id === 'magnet') {
      this.player.stats.pickupRadius = Math.round(this.resolvedStats.pickupRadius * (1 + level * 0.20));
    }
    if (id === 'focus') {
      this.player.stats.cooldownMultiplier = Math.max(0.5, 1 - level * 0.08);
    }
    if (id === 'luck') {
      this.player.stats.critChance = Math.min(0.85, this.resolvedStats.critChance + level * 0.04);
    }
    if (id === 'growth') {
      this.player.stats.xpMultiplier = Number((this.resolvedStats.xpMultiplier * (1 + level * 0.10)).toFixed(2));
    }
    if (id === 'armor') {
      this.player.stats.armor = Math.min(0.70, this.resolvedStats.armor + level * 0.05);
    }
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
    const rawX = THREE.MathUtils.clamp(this.player.x + Math.cos(angle) * 190, 100, WORLD_WIDTH - 100);
    const rawY = THREE.MathUtils.clamp(this.player.y + Math.sin(angle) * 190, 120, WORLD_HEIGHT - 120);
    const safe = resolveSafeSpawnPosition(rawX, rawY, 32, this.stage.worldId);
    const x = safe.x;
    const y = safe.y;
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
    const clampedX = THREE.MathUtils.clamp(x, 90, WORLD_WIDTH - 90);
    const clampedY = THREE.MathUtils.clamp(y, 120, WORLD_HEIGHT - 100);
    const resolved = resolveObstacleCollision(clampedX, clampedY, 30, this.stage.worldId);
    this.boss.setPosition(resolved.x, resolved.y);
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

    // Demon King Boss Echo Summon Check (~70%, ~45%, ~25% HP)
    if (bossDefinition?.id === 'demon-lord' && this.boss) {
      const state = this.bossSystem.getState();
      if (state) {
        const hpRatio = state.hp / state.maxHp;
        if (hpRatio <= 0.70 && !this.echoesSummoned.has('skeleton-king')) {
          this.spawnBossEcho('skeleton-king');
        } else if (hpRatio <= 0.45 && !this.echoesSummoned.has('forest-witch')) {
          this.spawnBossEcho('forest-witch');
        } else if (hpRatio <= 0.25 && !this.echoesSummoned.has('frost-golem')) {
          this.spawnBossEcho('frost-golem');
        }
      }
    }

    if (this.bossSystem.damageBoss(result.finalDamage)) {
      if (bossDefinition) this.bossKillsById[bossDefinition.id] = (this.bossKillsById[bossDefinition.id] ?? 0) + 1;
      if (this.boss) {
        this.boss.startDeath();
        this.effects.bossDeath(this.boss.x, this.boss.y);
        this.cameraController.triggerPullback(1.8, 1.1);
      }
      audioService.playSFX('boss-death', { throttle: 0.4 });

      // Dismiss any active echo
      if (this.currentBossEcho) {
        this.currentBossEcho.destroy();
        this.currentBossEcho = undefined;
        this.bossSystem.setEchoActive(false);
      }

      if (this.mode === 'survival') {
        // In survival, boss death rewards generously and run continues!
        this.bossSpawned = false;
        this.boss?.destroy();
        this.boss = undefined;
        this.spawnXP(this.player.x, this.player.y, 160);
        for (let i = 0; i < 3; i++) {
          const angle = (i / 3) * Math.PI * 2;
          this.spawnDiamond(this.player.x + Math.cos(angle) * 36, this.player.y + Math.sin(angle) * 36, 1);
        }
        this.spawnChest(this.player.x, this.player.y);
        audioService.crossfadeMusic('run', 1.0);
        return;
      }

      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2;
        if (this.boss) this.spawnDiamond(this.boss.x + Math.cos(angle) * 36, this.boss.y + Math.sin(angle) * 36, 1);
      }
      this.finishStageClear();
    }
  }

  private damageBossEcho(baseDamage: number, damageType: DamageType): void {
    if (!this.currentBossEcho || this.currentBossEcho.isDead) return;
    const result = calculateDamage({
      baseDamage,
      damageType,
      canCrit: true,
      critChance: this.player.stats.critChance,
      critMultiplier: this.player.stats.critMultiplier,
    });
    this.spawnDamageNumber(this.currentBossEcho.x, this.currentBossEcho.y - 50, result.finalDamage, result.critical, 0xc084fc);
    this.effects.burst(this.currentBossEcho.x, this.currentBossEcho.y, 0xa855f7, result.critical);
    this.currentBossEcho.takeDamage(result.finalDamage);
  }

  private spawnBossEcho(bossId: BossId): void {
    if (this.currentBossEcho && !this.currentBossEcho.isDead) {
      this.queuedEcho = bossId;
      return;
    }
    this.echoesSummoned.add(bossId);
    const angle = Math.random() * Math.PI * 2;
    const spawnX = THREE.MathUtils.clamp(this.player.x + Math.cos(angle) * 160, 100, WORLD_WIDTH - 100);
    const spawnY = THREE.MathUtils.clamp(this.player.y + Math.sin(angle) * 160, 120, WORLD_HEIGHT - 120);
    this.currentBossEcho = new BossEcho3D(this.actors, spawnX, spawnY, bossId, this.resources);
    this.bossSystem.setEchoActive(true);
    this.effects.bossArrival(spawnX, spawnY);
    this.cameraController.triggerShake(0.18, 0.25);
    audioService.playSFX('boss-warning', { volume: 0.9, throttle: 0.3 });
  }

  private executeEchoAttack(attack: BossAttack, x: number, y: number, damage: number): void {
    const dx = this.player.x - x;
    const dy = this.player.y - y;
    const distance = Math.hypot(dx, dy);
    const echoColor = 0xa855f7;

    if (attack === 'slam' || attack === 'ground-slam' || attack === 'thorn-circle') {
      const radius = attack === 'slam' ? 95 : attack === 'ground-slam' ? 100 : 88;
      this.effects.ring(x, y, radius * 0.025, echoColor);
      if (distance < radius) {
        this.damagePlayerFromBoss(damage, echoColor);
      }
    } else if (attack === 'charge') {
      if (this.currentBossEcho) {
        this.currentBossEcho.x += (dx / Math.max(1, distance)) * 110;
        this.currentBossEcho.y += (dy / Math.max(1, distance)) * 110;
        if (distance < 120) {
          this.damagePlayerFromBoss(damage * 1.1, echoColor);
        }
      }
    } else if (attack === 'spirit-volley' || attack === 'ice-shard-fan') {
      const angle = Math.atan2(dy, dx);
      const count = 3;
      for (let i = 0; i < count; i++) {
        const spread = (i - 1) * 0.22;
        this.spawnEnemyProjectile(x, y, angle + spread, 140, damage * 0.7, echoColor);
      }
    }
  }

  private triggerBatPetAttack(): void {
    const targets = this.spatialGrid.queryRadius(this.player.x, this.player.y, 220);
    if (targets.length === 0) return;
    const target = targets[0];
    const angle = Math.atan2(target.y - this.player.y, target.x - this.player.x);
    this.fireProjectile({
      weaponId: 'magic-bolt',
      direction: { x: Math.cos(angle), y: Math.sin(angle) },
      damage: 28,
      speed: 310,
      radius: 7,
      pierce: 0,
      color: 0x9333ea,
      damageType: 'arcane',
    });
    this.effects.burst(this.player.x, this.player.y, 0x9333ea);
  }

  private triggerFairyHeal(): void {
    const healAmount = 6 * (this.resolvedStats?.healMultiplier ?? 1);
    this.player.heal(healAmount);
    this.spawnDamageNumber(this.player.x, this.player.y - 32, Math.round(healAmount), false, 0x4ade80);
    this.effects.levelUp(this.player.x, this.player.y);
    audioService.playSFX('ability-heal', { throttle: 0.5 });
    this.callbacks.onSnapshot(this.getSnapshot());
  }

  private spawnSurvivalBoss(): void {
    const eligibleBosses: BossId[] = ['skeleton-king', 'forest-witch'];
    if (isWorldCleared(3, this.save)) eligibleBosses.push('frost-golem');
    if (isWorldCleared(4, this.save)) eligibleBosses.push('demon-lord');

    const chosenBoss = eligibleBosses[Math.floor(Math.random() * eligibleBosses.length)];
    const bossDef = getBossDefinition(chosenBoss);
    if (!bossDef) return;

    this.bossSpawned = true;
    this.encounteredBosses.add(bossDef.id);
    const angle = Math.atan2(WORLD_HEIGHT / 2 - this.player.y, WORLD_WIDTH / 2 - this.player.x);
    const rawX = THREE.MathUtils.clamp(this.player.x + Math.cos(angle) * 190, 100, WORLD_WIDTH - 100);
    const rawY = THREE.MathUtils.clamp(this.player.y + Math.sin(angle) * 190, 120, WORLD_HEIGHT - 120);
    const safe = resolveSafeSpawnPosition(rawX, rawY, 32, this.stage.worldId);
    const x = safe.x;
    const y = safe.y;
    this.boss = new Boss3D(this.actors, x, y, this.resources, bossDef.id);
    this.bossSystem.spawnBoss(bossDef.id);
    this.effects.bossArrival(x, y);
    audioService.crossfadeMusic('boss');
    audioService.playSFX('boss-warning', { volume: 1.1, throttle: 0.2 });
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

  private onEnemyKilled(kind: EnemyKind, elite: boolean, x?: number, y?: number): void {
    this.kills += 1;
    if (elite) this.eliteKills += 1;
    this.enemyKillsByKind[kind] = (this.enemyKillsByKind[kind] ?? 0) + 1;
    this.effects.burst(this.player.x, this.player.y, elite ? 0xffba58 : 0x5ddcff);
    this.runController.updateStats({ kills: this.kills, eliteKills: this.eliteKills, highestLevel: this.xpSystem.level });

    const posX = x ?? this.player.x;
    const posY = y ?? this.player.y;

    // 1. Diamond drop chances: 35% on elite, plus extra chance during blood moon
    if (elite && Math.random() < 0.35) {
      this.spawnDiamond(posX, posY, 1);
    } else if (this.isBloodMoonActive && Math.random() < 0.04) {
      this.spawnDiamond(posX, posY, 1);
    }

    // 1b. Treasure Chest drop: 70% chance from Elites!
    if (elite && Math.random() < 0.70) {
      this.spawnChest(posX, posY);
    }

    // 2. Slime splitting into mini-slimes
    if (kind === 'slime' && !elite && this.enemies.length < 85 && Math.random() < 0.55) {
      for (let i = 0; i < 2; i++) {
        const offsetAngle = (i === 0 ? -1 : 1) * (0.45 + Math.random() * 0.3);
        const miniX = THREE.MathUtils.clamp(posX + Math.cos(offsetAngle) * 22, 60, WORLD_WIDTH - 60);
        const miniY = THREE.MathUtils.clamp(posY + Math.sin(offsetAngle) * 22, 60, WORLD_HEIGHT - 60);
        this.spawnMiniEnemy('slime', miniX, miniY);
      }
    }

    // 2b. Exploding Imp Chain Reaction on Death
    if (kind === 'imp') {
      this.effects.explosion(posX, posY, 1.6, 0xf97316);
      this.cameraController.triggerShake(0.12, 0.18);
      audioService.playSFX('imp-explode', { volume: 0.9, pitch: 1.15, throttle: 0.1 });
      this.dealAreaDamage(posX, posY, 82, 68 * this.player.stats.damageMultiplier, 0xf97316, 'fire');
    }

    // 3. Multi-Kill Streak Announcer & Goofy Combat Combo Perks
    const goofySounds: SfxId[] = ['squeak', 'splat', 'boing', 'honk'];
    if (Math.random() < 0.35) {
      const sound = goofySounds[Math.floor(Math.random() * goofySounds.length)];
      audioService.playSFX(sound, { pitch: 0.9 + Math.random() * 0.3, volume: 0.7, throttle: 0.08 });
    }

    const now = this.gameTime;
    this.recentKillTimestamps.push(now);
    this.recentKillTimestamps = this.recentKillTimestamps.filter((t) => now - t <= 3.2);
    const combo = this.recentKillTimestamps.length;

    if (combo >= 10 && this.lastAnnouncedCombo < 10) {
      this.lastAnnouncedCombo = 10;
      audioService.playSFX('honk', { pitch: 1.1 });
      announceCombatWave({ label: 'BONK SPREE x10! 🔨', detail: 'Haste Turbo Activated! +15 Flow Meter!', tone: 'elite' });
      this.weaponSystem.onPrimaryHit(this.player.x, this.player.y);
      this.hasteBuffTimer = Math.max(this.hasteBuffTimer, 3.5);
    } else if (combo >= 25 && this.lastAnnouncedCombo < 25) {
      this.lastAnnouncedCombo = 25;
      audioService.playSFX('boing', { pitch: 1.2 });
      announceCombatWave({ label: 'SLAP-TASTIC x25! 🤪', detail: '+18 HP Snack Heal & Frenzy Speed!', tone: 'elite' });
      this.player.heal(18);
      this.spawnDamageNumber(this.player.x, this.player.y - 32, 18, false, 0x22c55e);
      this.effects.burst(this.player.x, this.player.y, 0x22c55e, false);
    } else if (combo >= 50 && this.lastAnnouncedCombo < 50) {
      this.lastAnnouncedCombo = 50;
      audioService.playSFX('fanfare', { pitch: 1.2 });
      this.cameraController.triggerPullback(1.4, 0.9);
      announceCombatWave({ label: 'GIGA BONK GOD x50!! 👑', detail: 'Instant OVERDRIVE Madness!', tone: 'danger' });
      this.effects.meteorBlast(this.player.x, this.player.y, 140);
      setCombatFlowState({
        meter: 100,
        overdrive: true,
        overdriveRemaining: 7.0,
        streak: combo,
      });
      this.spawnDiamond(posX, posY, 2);
    } else if (combo < 5) {
      this.lastAnnouncedCombo = 0;
    }
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
    let coins: number;
    if (this.mode === 'survival') {
      const bossKills = Object.values(this.bossKillsById).reduce((total, count) => total + count, 0);
      coins = Math.max(10, Math.round(this.gameTime / 5) + Math.floor(this.kills / 4) + this.eliteKills * 6 + bossKills * 60);
    } else {
      coins = Math.max(6, Math.round(this.gameTime / 14) + Math.round(this.enemies.length / 8));
    }
    const result = this.buildRunResult(coins);
    this.callbacks.onSnapshot(this.getSnapshot());
    audioService.playSFX('game-over', { throttle: 0.4 });
    audioService.crossfadeMusic('menu', 1.2);
    this.pendingResultTimer = window.setTimeout(() => { this.pendingResultTimer = undefined; this.callbacks.onGameOver(result); }, 500);
  }

  private buildRunResult(coins: number): RunResult {
    const bossKills = Object.values(this.bossKillsById).reduce((total, count) => total + count, 0);
    const isNewBest = this.mode === 'survival' ? (this.gameTime > (this.save.endlessBestTime ?? 0)) : false;
    return {
      stageId: this.stage.id,
      stageName: this.mode === 'survival' ? 'Survival Mode' : this.stage.name,
      time: this.gameTime,
      kills: this.kills,
      eliteKills: this.eliteKills,
      bossKills,
      coins,
      gems: this.collectedDiamonds,
      xpCollected: this.xpCollected,
      highestLevel: this.xpSystem.level,
      mode: this.mode,
      isNewBest,
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
