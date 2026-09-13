import { Preferences } from '@capacitor/preferences';
import type { MissionProgress, SaveData, Settings } from '../types';

const SAVE_KEY = 'tiny-survivor-save-v1';

export const DEFAULT_SETTINGS: Settings = {
  music: true,
  soundEffects: true,
  haptics: true,
  damageNumbers: true,
  screenShake: true,
  reducedEffects: false,
  lowPerformanceMode: false,
};

export const DEFAULT_SAVE: SaveData = {
  schemaVersion: 1,
  coins: 1280,
  gems: 36,
  highestUnlockedStage: 1,
  completedStages: [],
  bestStageTimes: {},
  selectedHero: 'shadow',
  heroesUnlocked: ['shadow'],
  permanentUpgrades: { maxHp: 0, damage: 0, moveSpeed: 0, magnet: 0, xpGain: 0, critChance: 0, armor: 0 },
  totalRuns: 0,
  totalKills: 0,
  totalDeaths: 0,
  totalBossKills: 0,
  totalPlayTime: 0,
  missions: [],
  missionDate: '',
  achievements: {},
  claimedAchievements: [],
  settings: DEFAULT_SETTINGS,
  endlessBestTime: 0,
  endlessBestKills: 0,
  ownedCosmetics: ['classic'],
  selectedCosmetics: { hero: 'classic', trail: 'ember', projectile: 'arcane' },
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

export function normalizeSave(raw: unknown): SaveData {
  const data = raw && typeof raw === 'object' ? raw as Partial<SaveData> : {};
  const permanent = data.permanentUpgrades && typeof data.permanentUpgrades === 'object' ? data.permanentUpgrades : {};
  const settings = data.settings && typeof data.settings === 'object' ? data.settings as Partial<Settings> : {};
  const completedStages = Array.isArray(data.completedStages) ? data.completedStages.filter((id): id is string => typeof id === 'string') : [];
  const heroesUnlocked = Array.isArray(data.heroesUnlocked) ? data.heroesUnlocked.filter((id): id is string => typeof id === 'string') : ['shadow'];
  return {
    ...DEFAULT_SAVE,
    ...data,
    schemaVersion: 1,
    coins: validInteger(data.coins, DEFAULT_SAVE.coins),
    gems: validInteger(data.gems, DEFAULT_SAVE.gems),
    highestUnlockedStage: Math.min(20, Math.max(1, validInteger(data.highestUnlockedStage, 1, 1))),
    completedStages: [...new Set(completedStages)],
    bestStageTimes: data.bestStageTimes && typeof data.bestStageTimes === 'object' ? data.bestStageTimes : {},
    selectedHero: typeof data.selectedHero === 'string' && heroesUnlocked.includes(data.selectedHero) ? data.selectedHero : 'shadow',
    heroesUnlocked: heroesUnlocked.includes('shadow') ? [...new Set(heroesUnlocked)] : ['shadow', ...heroesUnlocked],
    permanentUpgrades: Object.fromEntries(Object.entries(DEFAULT_SAVE.permanentUpgrades).map(([id, fallback]) => [id, Math.min(5, validInteger((permanent as Record<string, unknown>)[id], fallback, 0))])),
    totalRuns: validInteger(data.totalRuns, 0),
    totalKills: validInteger(data.totalKills, 0),
    totalDeaths: validInteger(data.totalDeaths, 0),
    totalBossKills: validInteger(data.totalBossKills, 0),
    totalPlayTime: validNumber(data.totalPlayTime, 0),
    missions: normalizeMissions(data.missions),
    missionDate: typeof data.missionDate === 'string' ? data.missionDate : '',
    achievements: data.achievements && typeof data.achievements === 'object' ? data.achievements : {},
    claimedAchievements: Array.isArray(data.claimedAchievements) ? data.claimedAchievements.filter((id): id is string => typeof id === 'string') : [],
    settings: { ...DEFAULT_SETTINGS, ...settings },
    endlessBestTime: validNumber(data.endlessBestTime, 0),
    endlessBestKills: validInteger(data.endlessBestKills, 0),
    ownedCosmetics: Array.isArray(data.ownedCosmetics) ? data.ownedCosmetics.filter((id): id is string => typeof id === 'string') : ['classic'],
    selectedCosmetics: data.selectedCosmetics && typeof data.selectedCosmetics === 'object' ? data.selectedCosmetics : DEFAULT_SAVE.selectedCosmetics,
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
