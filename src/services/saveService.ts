import { Preferences } from '@capacitor/preferences';
import type { AbilityId, BossId, EnemyKind, EquipmentId, HeroId, HeroLoadout, MissionProgress, SaveData, Settings } from '../types';
import { ALL_ABILITY_IDS, isAbilityMilestoneCleared } from '../data/abilities';
import { ALL_HERO_IDS } from '../data/heroes';
import { ALL_EQUIPMENT_IDS } from '../data/equipment';

const SAVE_KEY = 'tiny-survivor-save-v1';
const SAVE_SCHEMA_VERSION = 5;

export const DEFAULT_SETTINGS: Settings = {
  music: true,
  soundEffects: true,
  musicVolume: 0.65,
  sfxVolume: 0.80,
  haptics: true,
  damageNumbers: true,
  screenShake: true,
  reducedEffects: false,
  lowPerformanceMode: false,
};

export const DEFAULT_LOADOUTS: Record<HeroId, HeroLoadout> = {
  shadow: {},
  warrior: {},
  monk: {},
  gunslinger: {},
};

export const DEFAULT_SAVE: SaveData = {
  schemaVersion: SAVE_SCHEMA_VERSION,
  coins: 1280,
  gems: 36,
  highestUnlockedStage: 1,
  completedStages: [],
  unlockedAbilities: [],
  bestStageTimes: {},
  selectedHero: 'shadow',
  heroesUnlocked: ['shadow'],
  ownedEquipment: [],
  heroLoadouts: DEFAULT_LOADOUTS,
  permanentUpgrades: { maxHp: 0, damage: 0, moveSpeed: 0, magnet: 0, xpGain: 0, critChance: 0, armor: 0 },
  totalRuns: 0,
  totalKills: 0,
  totalDeaths: 0,
  totalBossKills: 0,
  totalPlayTime: 0,
  discoveredEnemies: [],
  enemyKillCounts: {},
  discoveredBosses: [],
  bossKillCounts: {},
  missions: [],
  missionDate: '',
  achievements: {},
  claimedAchievements: [],
  settings: DEFAULT_SETTINGS,
  endlessBestTime: 0,
  endlessBestKills: 0,
  ownedCosmetics: ['classic'],
  selectedCosmetics: { hero: 'classic', trail: 'ember', projectile: 'arcane' },
  freeChestClaimedDate: '',
  lastPlayedTimestamp: Date.now(),
};

const validNumber = (value: unknown, fallback: number, min = 0): number => {
  const number = typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  return Math.max(min, number);
};

const validInteger = (value: unknown, fallback: number, min = 0): number => Math.floor(validNumber(value, fallback, min));

function normalizeMissions(value: unknown): MissionProgress[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((mission): mission is Partial<MissionProgress> => Boolean(mission && typeof mission === 'object'))
    .map((mission, index) => ({
      id: typeof mission.id === 'string' ? mission.id : `mission-${index}`,
      title: typeof mission.title === 'string' ? mission.title : 'Survive a little longer',
      target: validInteger(mission.target, 1, 1),
      progress: Math.min(validInteger(mission.progress, 0), validInteger(mission.target, 1, 1)),
      reward: validInteger(mission.reward, 50, 1),
      claimed: Boolean(mission.claimed),
    }));
}

function normalizeIdList<T extends string>(value: unknown): T[] {
  return Array.isArray(value) ? [...new Set(value.filter((item): item is T => typeof item === 'string'))] : [];
}

function normalizeCountMap(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(Object.entries(value).filter(([key, count]) => typeof key === 'string' && typeof count === 'number' && Number.isFinite(count) && count > 0).map(([key, count]) => [key, Math.floor(count as number)]));
}

export function normalizeSave(raw: unknown): SaveData {
  const data = raw && typeof raw === 'object' ? raw as Partial<SaveData> : {};
  const permanent = data.permanentUpgrades && typeof data.permanentUpgrades === 'object' ? data.permanentUpgrades : {};
  const settings = data.settings && typeof data.settings === 'object' ? data.settings as Partial<Settings> : {};
  const completedStages = Array.isArray(data.completedStages) ? data.completedStages.filter((id): id is string => typeof id === 'string') : [];
  const highestUnlockedStage = Math.min(20, Math.max(1, validInteger(data.highestUnlockedStage, 1, 1)));

  // Hero ID migration (knight -> warrior, ranger -> gunslinger)
  const mappedHeroes: HeroId[] = [];
  if (Array.isArray(data.heroesUnlocked)) {
    for (const rawId of data.heroesUnlocked) {
      const id = rawId as string;
      if (id === 'knight') mappedHeroes.push('warrior');
      else if (id === 'ranger') mappedHeroes.push('gunslinger');
      else if (ALL_HERO_IDS.includes(id as HeroId)) mappedHeroes.push(id as HeroId);
    }
  }
  if (!mappedHeroes.includes('shadow')) mappedHeroes.push('shadow');
  const heroesUnlocked = [...new Set(mappedHeroes)];

  let selectedHero = data.selectedHero as string | undefined;
  if (selectedHero === 'knight') selectedHero = 'warrior';
  else if (selectedHero === 'ranger') selectedHero = 'gunslinger';
  if (!selectedHero || !heroesUnlocked.includes(selectedHero as HeroId)) {
    selectedHero = 'shadow';
  }

  // Equipment and Loadout normalization
  const rawOwnedEquipment = Array.isArray(data.ownedEquipment) ? data.ownedEquipment : [];
  const ownedEquipment = [...new Set(rawOwnedEquipment.filter((id): id is EquipmentId => ALL_EQUIPMENT_IDS.includes(id as EquipmentId)))];

  const rawLoadouts = (data.heroLoadouts && typeof data.heroLoadouts === 'object') ? data.heroLoadouts : {};
  const heroLoadouts: Record<HeroId, HeroLoadout> = {
    shadow: {},
    warrior: {},
    monk: {},
    gunslinger: {},
  };
  for (const hId of ALL_HERO_IDS) {
    const hLoadout = (rawLoadouts as Record<string, unknown>)[hId];
    if (hLoadout && typeof hLoadout === 'object') {
      const cleanLoadout: HeroLoadout = {};
      for (const slot of ['armor', 'relic', 'pet', 'charm'] as const) {
        const eqId = (hLoadout as Record<string, unknown>)[slot];
        if (typeof eqId === 'string' && ownedEquipment.includes(eqId as EquipmentId)) {
          cleanLoadout[slot] = eqId as EquipmentId;
        }
      }
      heroLoadouts[hId] = cleanLoadout;
    }
  }

  // Preserve any previously unlocked abilities
  const explicitUnlocked = Array.isArray(data.unlockedAbilities)
    ? data.unlockedAbilities.filter((id): id is AbilityId => ALL_ABILITY_IDS.includes(id as AbilityId))
    : [];

  // Migration backfill for existing saves based on completed stage milestones
  const inferredUnlocked: AbilityId[] = [];
  for (const abilityId of ALL_ABILITY_IDS) {
    if (isAbilityMilestoneCleared(abilityId, completedStages, highestUnlockedStage)) {
      inferredUnlocked.push(abilityId);
    }
  }

  const unlockedAbilities = [...new Set([...explicitUnlocked, ...inferredUnlocked])];

  return {
    ...DEFAULT_SAVE,
    ...data,
    schemaVersion: SAVE_SCHEMA_VERSION,
    coins: validInteger(data.coins, DEFAULT_SAVE.coins),
    gems: validInteger(data.gems, DEFAULT_SAVE.gems),
    highestUnlockedStage,
    completedStages: [...new Set(completedStages)],
    unlockedAbilities,
    bestStageTimes: data.bestStageTimes && typeof data.bestStageTimes === 'object' ? data.bestStageTimes : {},
    selectedHero: selectedHero as HeroId,
    heroesUnlocked,
    ownedEquipment,
    heroLoadouts,
    permanentUpgrades: Object.fromEntries(Object.entries(DEFAULT_SAVE.permanentUpgrades).map(([id, fallback]) => [id, Math.min(5, validInteger((permanent as Record<string, unknown>)[id], fallback, 0))])),
    totalRuns: validInteger(data.totalRuns, 0),
    totalKills: validInteger(data.totalKills, 0),
    totalDeaths: validInteger(data.totalDeaths, 0),
    totalBossKills: validInteger(data.totalBossKills, 0),
    totalPlayTime: validNumber(data.totalPlayTime, 0),
    discoveredEnemies: normalizeIdList<EnemyKind>(data.discoveredEnemies),
    enemyKillCounts: normalizeCountMap(data.enemyKillCounts),
    discoveredBosses: normalizeIdList<BossId>(data.discoveredBosses),
    bossKillCounts: normalizeCountMap(data.bossKillCounts),
    missions: normalizeMissions(data.missions),
    missionDate: typeof data.missionDate === 'string' ? data.missionDate : '',
    achievements: data.achievements && typeof data.achievements === 'object' ? data.achievements : {},
    claimedAchievements: Array.isArray(data.claimedAchievements) ? data.claimedAchievements.filter((id): id is string => typeof id === 'string') : [],
    settings: {
      ...DEFAULT_SETTINGS,
      ...settings,
      musicVolume: typeof settings.musicVolume === 'number' && Number.isFinite(settings.musicVolume) ? Math.max(0, Math.min(1, settings.musicVolume)) : DEFAULT_SETTINGS.musicVolume,
      sfxVolume: typeof settings.sfxVolume === 'number' && Number.isFinite(settings.sfxVolume) ? Math.max(0, Math.min(1, settings.sfxVolume)) : DEFAULT_SETTINGS.sfxVolume,
    },
    endlessBestTime: validNumber(data.endlessBestTime, 0),
    endlessBestKills: validInteger(data.endlessBestKills, 0),
    ownedCosmetics: Array.isArray(data.ownedCosmetics) ? data.ownedCosmetics.filter((id): id is string => typeof id === 'string') : ['classic'],
    selectedCosmetics: data.selectedCosmetics && typeof data.selectedCosmetics === 'object' ? data.selectedCosmetics : DEFAULT_SAVE.selectedCosmetics,
    freeChestClaimedDate: typeof data.freeChestClaimedDate === 'string' ? data.freeChestClaimedDate : '',
    lastPlayedTimestamp: validNumber(data.lastPlayedTimestamp, Date.now()),
  };
}

async function readStoredValue(): Promise<string | null> {
  try {
    const result = await Preferences.get({ key: SAVE_KEY });
    if (result.value) return result.value;
  } catch {
    // Browser fallback below.
  }
  return window.localStorage.getItem(SAVE_KEY);
}

export async function loadSave(): Promise<SaveData> {
  try {
    const raw = await readStoredValue();
    return normalizeSave(raw ? JSON.parse(raw) : DEFAULT_SAVE);
  } catch {
    return normalizeSave(DEFAULT_SAVE);
  }
}

export async function saveGame(save: SaveData): Promise<void> {
  const normalized = normalizeSave({ ...save, lastPlayedTimestamp: Date.now() });
  const value = JSON.stringify(normalized);
  try {
    await Preferences.set({ key: SAVE_KEY, value });
  } catch {
    // Browser fallback / Capacitor web test fallback.
  }
  window.localStorage.setItem(SAVE_KEY, value);
}

export async function resetSave(): Promise<SaveData> {
  const fresh = normalizeSave({ ...DEFAULT_SAVE, lastPlayedTimestamp: Date.now() });
  await saveGame(fresh);
  return fresh;
}
