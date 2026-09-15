export type Screen =
  | 'splash'
  | 'home'
  | 'map'
  | 'stage'
  | 'bestiary'
  | 'heroes'
  | 'upgrades'
  | 'missions'
  | 'shop'
  | 'settings'
  | 'game'
  | 'survival'
  | 'stageClear'
  | 'gameOver';

export type Rarity = 'common' | 'rare' | 'epic';

export type HeroId = 'shadow' | 'warrior' | 'monk' | 'gunslinger';

export interface HeroStatModifiers {
  maxHpMultiplier?: number;
  armorBonus?: number;
  moveSpeedMultiplier?: number;
  pickupRadiusMultiplier?: number;
  primaryDamageMultiplier?: number;
  autoWeaponDamageMultiplier?: number;
  specialDamageMultiplier?: number;
  allDamageMultiplier?: number;
  primaryFireRateMultiplier?: number;
  primaryCooldownMultiplier?: number;
  specialCooldownMultiplier?: number;
  projectileSpeedMultiplier?: number;
  healMultiplier?: number;
  freezeDurationMultiplier?: number;
  critChanceBonus?: number;
  xpMultiplier?: number;
  bonusProjectileEveryNShots?: number;
}

export type EquipmentSlot = 'armor' | 'relic' | 'pet' | 'charm';

export type EquipmentId =
  | 'bone-guard'
  | 'hunter-coat'
  | 'frost-plate'
  | 'arcane-crystal'
  | 'berserker-fang'
  | 'frost-rune'
  | 'demon-seal'
  | 'lucky-coin'
  | 'magnet-charm'
  | 'healing-totem'
  | 'bat-familiar'
  | 'spirit-fox'
  | 'tiny-golem'
  | 'fairy';

export type HeroLoadout = Partial<Record<EquipmentSlot, EquipmentId>>;

export type RunMode = 'campaign' | 'survival';

export type EnemyKind =
  | 'skeleton'
  | 'bat'
  | 'slime'
  | 'ghost'
  | 'archer'
  | 'knight'
  | 'demon'
  | 'imp'
  | 'cursed-wolf'
  | 'thornling'
  | 'treant'
  | 'frost-wraith';

export type AbilityId = 'fireball' | 'freeze' | 'heal' | 'arcane-beam';
export type WeaponId = 'magic-bolt' | 'orbiting-blades' | 'chain-lightning' | 'fire-orb';
export type PassiveId = 'power' | 'vitality' | 'swift-boots' | 'magnet' | 'focus' | 'luck' | 'growth' | 'armor';
export type DamageType = 'arcane' | 'fire' | 'physical' | 'lightning';
export type BossId = 'skeleton-king' | 'forest-witch' | 'frost-golem' | 'demon-lord';
export type BossAttack =
  | 'slam'
  | 'bone-ring'
  | 'summon'
  | 'charge'
  | 'thorn-circle'
  | 'spirit-volley'
  | 'blink'
  | 'ground-slam'
  | 'ice-shard-fan'
  | 'frost-zones'
  | 'fire-wave'
  | 'meteor'
  | 'summon-imps'
  | 'demon-charge';

export interface BiomeTheme {
  background: number;
  fog: number;
  ground: number;
  groundDeep: number;
  groundDetail: number;
  prop: number;
  propAlt: number;
  accent: number;
  moon: number;
  warm: number;
  keyLight: number;
  fillLight: number;
}

export type WorldMapProfile = 'graveyard' | 'forest' | 'frozen' | 'castle';

export interface StageDifficulty {
  enemyHpMultiplier: number;
  enemyDamageMultiplier: number;
  densityMultiplier: number;
  eliteMultiplier: number;
}

export interface WorldDefinition {
  id: number;
  name: string;
  subtitle: string;
  mapSeed: number;
  theme: BiomeTheme;
  enemyPool: EnemyKind[];
  bossId: BossId;
  mapProfile: WorldMapProfile;
}

export interface Settings {
  music: boolean;
  soundEffects: boolean;
  musicVolume: number;
  sfxVolume: number;
  haptics: boolean;
  damageNumbers: boolean;
  screenShake: boolean;
  reducedEffects: boolean;
  lowPerformanceMode: boolean;
}

export interface SaveData {
  schemaVersion: number;
  coins: number;
  gems: number;
  highestUnlockedStage: number;
  completedStages: string[];
  unlockedAbilities: AbilityId[];
  bestStageTimes: Record<string, number>;
  selectedHero: HeroId;
  heroesUnlocked: HeroId[];
  ownedEquipment: EquipmentId[];
  heroLoadouts: Record<HeroId, HeroLoadout>;
  permanentUpgrades: Record<string, number>;
  totalRuns: number;
  totalKills: number;
  totalDeaths: number;
  totalBossKills: number;
  totalPlayTime: number;
  discoveredEnemies: EnemyKind[];
  enemyKillCounts: Record<string, number>;
  discoveredBosses: BossId[];
  bossKillCounts: Record<string, number>;
  missions: MissionProgress[];
  missionDate: string;
  achievements: Record<string, number>;
  claimedAchievements: string[];
  settings: Settings;
  endlessBestTime: number;
  endlessBestKills: number;
  ownedCosmetics: string[];
  selectedCosmetics: Record<string, string>;
  freeChestClaimedDate: string;
  lastPlayedTimestamp: number;
}

export interface MissionProgress {
  id: string;
  title: string;
  target: number;
  progress: number;
  reward: number;
  claimed: boolean;
}

export interface AbilityStateSnapshot {
  id: AbilityId;
  unlocked: boolean;
  level: number;
  cooldownRemaining: number;
  cooldownDuration: number;
  active: boolean;
  activeRemaining: number;
}

export interface GameSnapshot {
  time: number;
  duration: number;
  kills: number;
  eliteKills: number;
  level: number;
  xp: number;
  xpRequired: number;
  hp: number;
  maxHp: number;
  coins: number;
  aliveEnemies: number;
  weaponLevels: Record<string, number>;
  passiveLevels: Record<string, number>;
  abilityLevels?: Record<string, number>;
  abilities?: AbilityStateSnapshot[];
  boss?: {
    name: string;
    hp: number;
    maxHp: number;
    phase: number;
  };
}

export interface UpgradeChoice {
  id: string;
  title: string;
  description: string;
  nextEffect: string;
  icon: string;
  kind: 'weapon' | 'passive' | 'ability';
  rarity: Rarity;
  level: number;
}

export interface RunResult {
  stageId: string;
  stageName: string;
  time: number;
  kills: number;
  eliteKills: number;
  bossKills: number;
  coins: number;
  xpCollected: number;
  highestLevel: number;
  mode?: RunMode;
  isNewBest?: boolean;
  enemyKillsByKind?: Record<string, number>;
  encounteredEnemies?: EnemyKind[];
  bossesDefeated?: BossId[];
  bossKillsById?: Record<string, number>;
  encounteredBosses?: BossId[];
  revived?: boolean;
}

export interface StageDefinition {
  id: string;
  worldId: number;
  mapSeed: number;
  stageNumber: number;
  name: string;
  biome: string;
  duration: number;
  bossStage: boolean;
  bossId?: BossId;
  bossName?: string;
  difficulty: StageDifficulty;
  recommendedPower: number;
  coinReward: number;
  firstClearReward: number;
  enemies: EnemyKind[];
  description: string;
}
