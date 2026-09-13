export type Screen =
  | 'splash'
  | 'home'
  | 'map'
  | 'stage'
  | 'heroes'
  | 'upgrades'
  | 'missions'
  | 'shop'
  | 'settings'
  | 'game'
  | 'stageClear'
  | 'gameOver';

export type Rarity = 'common' | 'rare' | 'epic';

export type EnemyKind =
  | 'skeleton'
  | 'bat'
  | 'slime'
  | 'ghost'
  | 'archer'
  | 'knight'
  | 'demon'
  | 'imp';

export type WeaponId = 'magic-bolt' | 'fire-orb' | 'orbiting-blades' | 'chain-lightning';
export type PassiveId = 'power' | 'vitality' | 'swift-boots' | 'magnet' | 'focus' | 'luck' | 'growth' | 'armor';

export interface Settings {
  music: boolean;
  soundEffects: boolean;
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
  bestStageTimes: Record<string, number>;
  selectedHero: string;
  heroesUnlocked: string[];
  permanentUpgrades: Record<string, number>;
  totalRuns: number;
  totalKills: number;
  totalDeaths: number;
  totalBossKills: number;
  totalPlayTime: number;
  missions: MissionProgress[];
  missionDate: string;
  achievements: Record<string, number>;
  claimedAchievements: string[];
  settings: Settings;
  endlessBestTime: number;
  endlessBestKills: number;
  ownedCosmetics: string[];
  selectedCosmetics: Record<string, string>;
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
  kind: 'weapon' | 'passive';
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
  revived?: boolean;
}

export interface StageDefinition {
  id: string;
  worldId: number;
  stageNumber: number;
  name: string;
  biome: string;
  duration: number;
  bossId: string;
  bossName: string;
  recommendedPower: number;
  coinReward: number;
  firstClearReward: number;
  enemies: EnemyKind[];
  description: string;
}
