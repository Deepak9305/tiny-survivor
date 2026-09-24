import { lazy, Suspense, useCallback, useEffect, useState, type ReactNode } from 'react';
import { Sparkles, Smartphone } from 'lucide-react';
import { AdService } from './services/adService';
import { audioService } from './services/audioService';
import { registerAppLifecycle } from './services/nativeService';
import { DEFAULT_SAVE, loadSave, normalizeSave, resetSave, saveGame } from './services/saveService';
import { getPermanentUpgradeCost } from './data/balance';
import { getCurrentStage, getNextCampaignStageId, getStage, getTotalCampaignStageCount, isStageUnlocked, isWorldCleared, stageNumber } from './data/stages';
import { ALL_EQUIPMENT_IDS, getBossFirstClearEquipment } from './data/equipment';
import { getHeroDefinition } from './data/heroes';
import { HomeScreen } from './screens/HomeScreen';
import { SplashScreen } from './screens/SplashScreen';
import { ScreenTransition } from './components/ScreenTransition';
import { getAbilitiesUnlockedByStageClear } from './data/abilities';
import type { AbilityId, BossId, EnemyKind, EquipmentId, EquipmentSlot, HeroId, MissionProgress, RunMode, RunResult, SaveData, Screen, Settings } from './types';

const GameScreen = lazy(() => import('./screens/GameScreen').then((module) => ({ default: module.GameScreen })));
const HeroesScreen = lazy(() => import('./screens/HeroesScreen').then((module) => ({ default: module.HeroesScreen })));
const MissionsScreen = lazy(() => import('./screens/MissionsScreen').then((module) => ({ default: module.MissionsScreen })));
const SettingsScreen = lazy(() => import('./screens/SettingsScreen').then((module) => ({ default: module.SettingsScreen })));
const ShopScreen = lazy(() => import('./screens/ShopScreen').then((module) => ({ default: module.ShopScreen })));
const BestiaryScreen = lazy(() => import('./screens/BestiaryScreen').then((module) => ({ default: module.BestiaryScreen })));
const StageClearScreen = lazy(() => import('./screens/StageClearScreen').then((module) => ({ default: module.StageClearScreen })));
const StageDetailScreen = lazy(() => import('./screens/StageDetailScreen').then((module) => ({ default: module.StageDetailScreen })));
const SurvivalScreen = lazy(() => import('./screens/SurvivalScreen').then((module) => ({ default: module.SurvivalScreen })));
const UpgradesScreen = lazy(() => import('./screens/UpgradesScreen').then((module) => ({ default: module.UpgradesScreen })));
const WorldMapScreen = lazy(() => import('./screens/WorldMapScreen').then((module) => ({ default: module.WorldMapScreen })));

function localDate(): string {
  const date = new Date();
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function createDailyMissions(): MissionProgress[] {
  return [
    { id: 'daily-kills', title: 'Defeat 500 enemies', target: 500, progress: 0, reward: 100, claimed: false },
    { id: 'daily-survive', title: 'Survive for 10 minutes', target: 600, progress: 0, reward: 150, claimed: false },
    { id: 'daily-clear', title: 'Clear a boss stage', target: 1, progress: 0, reward: 200, claimed: false },
  ];
}

function getInitialParams() {
  if (typeof window === 'undefined') return { initialScreen: null, initialStage: null };
  const params = new URLSearchParams(window.location.search);
  return {
    initialScreen: params.get('screen') as Screen | null,
    initialStage: params.get('stage'),
  };
}

const { initialScreen: INITIAL_SCREEN, initialStage: INITIAL_STAGE } = getInitialParams();

export default function App() {
  const [screen, setScreen] = useState<Screen>(INITIAL_SCREEN || 'splash');
  const [save, setSave] = useState<SaveData>(DEFAULT_SAVE);
  const [ready, setReady] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState(INITIAL_STAGE || '1-1');
  const [runMode, setRunMode] = useState<RunMode>('campaign');
  const [lastResult, setLastResult] = useState<RunResult | undefined>();
  const [selectedBestiaryId, setSelectedBestiaryId] = useState<string>('skeleton');
  const [runKey, setRunKey] = useState(0);
  const [newlyUnlockedAbilities, setNewlyUnlockedAbilities] = useState<AbilityId[]>([]);
  const [newlyUnlockedSurvival, setNewlyUnlockedSurvival] = useState(false);
  const [newlyUnlockedEquipment, setNewlyUnlockedEquipment] = useState<EquipmentId | undefined>();

  useEffect(() => {
    let mounted = true;
    void loadSave().then((loaded) => {
      if (!mounted) return;
      const withDaily = loaded.missionDate === localDate()
        ? loaded
        : normalizeSave({ ...loaded, missionDate: localDate(), missions: createDailyMissions() });
      setSave(withDaily);
      setSelectedStageId(INITIAL_STAGE || getCurrentStage(withDaily).id);
      if (INITIAL_SCREEN) setScreen(INITIAL_SCREEN);
      setReady(true);
      void saveGame(withDaily);
      void AdService.initialize();
    });
    return () => { mounted = false; };
  }, []);

  const handleNativeBack = useCallback(() => {
    if (screen === 'game') {
      void import('./game3d/ThreeGame').then(({ getActiveThreeGame }) => {
        getActiveThreeGame()?.togglePauseRun();
      });
      return;
    }
    if (screen === 'stage') setScreen('map');
    else if (screen !== 'home') setScreen('home');
  }, [screen]);

  useEffect(() => {
    let cleanup: () => void = () => undefined;
    let disposed = false;
    void registerAppLifecycle(() => save, handleNativeBack).then((removeListener) => {
      if (disposed) removeListener();
      else cleanup = removeListener;
    });
    return () => { disposed = true; cleanup(); };
  }, [handleNativeBack, save]);

  useEffect(() => {
    audioService.initialize();
    audioService.setMusicEnabled(save.settings.music);
    audioService.setSfxEnabled(save.settings.soundEffects);
    if (ready && screen !== 'game') audioService.playMusic('menu');
  }, [ready, save.settings.music, save.settings.soundEffects, screen]);

  useEffect(() => {
    if (!ready || screen !== 'home') return undefined;
    const timer = window.setTimeout(() => {
      void import('./screens/GameScreen');
      void import('./screens/WorldMapScreen');
      void import('./screens/HeroesScreen');
    }, 220);
    return () => window.clearTimeout(timer);
  }, [ready, screen]);

  const persist = useCallback((next: SaveData) => {
    const normalized = normalizeSave(next);
    setSave(normalized);
    void saveGame(normalized);
  }, []);

  const startStage = useCallback((stageId = selectedStageId) => {
    if (!isStageUnlocked(stageId, save)) return;
    setSelectedStageId(stageId);
    setRunMode('campaign');
    setRunKey((key) => key + 1);
    setScreen('game');
  }, [save, selectedStageId]);

  const startSurvival = useCallback(() => {
    const candidates = ['1-1', '2-1'];
    if (isWorldCleared(3, save)) candidates.push('3-1');
    if (isWorldCleared(4, save)) candidates.push('4-1');
    const chosenStageId = candidates[Math.floor(Math.random() * candidates.length)] ?? '2-1';
    setSelectedStageId(chosenStageId);
    setRunMode('survival');
    setRunKey((key) => key + 1);
    setScreen('game');
  }, [save]);

  const handleStageClear = useCallback((result: RunResult) => {
    const stage = getStage(result.stageId);
    const firstClear = !save.completedStages.includes(result.stageId);
    const completedStages = [...new Set([...save.completedStages, result.stageId])];
    const newlyUnlocked = getAbilitiesUnlockedByStageClear(result.stageId, save.unlockedAbilities || []);
    setNewlyUnlockedAbilities(newlyUnlocked);
    const unlockedAbilities = [...new Set([...(save.unlockedAbilities || []), ...newlyUnlocked])];

    const w2WasCleared = isWorldCleared(2, save);
    const tempSave = { ...save, completedStages };
    const w2NowCleared = isWorldCleared(2, tempSave);
    const survivalUnlockedNow = !w2WasCleared && w2NowCleared;
    setNewlyUnlockedSurvival(survivalUnlockedNow);

    const bossDrop = firstClear ? getBossFirstClearEquipment(result.stageId, stage.worldId, stage.bossStage) : undefined;
    setNewlyUnlockedEquipment(bossDrop);
    const ownedEquipment = bossDrop && !save.ownedEquipment.includes(bossDrop)
      ? [...save.ownedEquipment, bossDrop]
      : save.ownedEquipment;

    const next = Math.min(getTotalCampaignStageCount(), stageNumber(result.stageId) + 1);
    const best = save.bestStageTimes[result.stageId];
    const codex = mergeCodexProgress(save, result);
    const nextSave = normalizeSave({
      ...codex,
      coins: save.coins + result.coins,
      gems: save.gems + (result.gems ?? 0) + (firstClear ? stage.firstClearReward : 0),
      highestUnlockedStage: Math.max(save.highestUnlockedStage, next),
      completedStages,
      unlockedAbilities,
      ownedEquipment,
      bestStageTimes: { ...save.bestStageTimes, [result.stageId]: best ? Math.min(best, result.time) : result.time },
      totalRuns: save.totalRuns + 1,
      totalKills: save.totalKills + result.kills,
      totalBossKills: save.totalBossKills + result.bossKills,
      totalPlayTime: save.totalPlayTime + result.time,
      missions: updateMissionProgress(save.missions, result, stage),
    });
    setSave(nextSave);
    void saveGame(nextSave);
    setLastResult(result);
    setScreen('stageClear');
  }, [save]);

  const handleGameOver = useCallback((result: RunResult) => {
    const stage = getStage(result.stageId);
    const isSurvival = result.mode === 'survival' || runMode === 'survival';
    const endlessBestTime = isSurvival ? Math.max(save.endlessBestTime ?? 0, Math.floor(result.time)) : (save.endlessBestTime ?? 0);
    const endlessBestKills = isSurvival ? Math.max(save.endlessBestKills ?? 0, result.kills) : (save.endlessBestKills ?? 0);
    const isNewBest = isSurvival && (result.time > (save.endlessBestTime ?? 0) || result.kills > (save.endlessBestKills ?? 0));

    const finalResult: RunResult = { ...result, mode: isSurvival ? 'survival' : 'campaign', isNewBest };
    const nextSave = normalizeSave({
      ...mergeCodexProgress(save, finalResult),
      coins: save.coins + finalResult.coins,
      gems: save.gems + (finalResult.gems ?? 0),
      totalRuns: save.totalRuns + 1,
      totalDeaths: save.totalDeaths + 1,
      totalKills: save.totalKills + finalResult.kills,
      totalPlayTime: save.totalPlayTime + finalResult.time,
      endlessBestTime,
      endlessBestKills,
      missions: updateMissionProgress(save.missions, finalResult, stage),
    });
    setSave(nextSave);
    void saveGame(nextSave);
    setLastResult(finalResult);
  }, [runMode, save]);

  const handleUpgrade = useCallback((id: string, useGems = false) => {
    const level = save.permanentUpgrades[id] ?? 0;
    if (level >= 5) return;
    const coinCost = getPermanentUpgradeCost(id, level);
    const gemCost = Math.max(4, Math.round(coinCost / 40));

    if (useGems) {
      if (save.gems < gemCost) return;
      persist({ ...save, gems: save.gems - gemCost, permanentUpgrades: { ...save.permanentUpgrades, [id]: level + 1 } });
    } else {
      if (save.coins < coinCost) return;
      persist({ ...save, coins: save.coins - coinCost, permanentUpgrades: { ...save.permanentUpgrades, [id]: level + 1 } });
    }
  }, [persist, save]);

  const handleHeroSelect = useCallback((id: HeroId | string) => {
    const heroId = id as HeroId;
    if (save.heroesUnlocked.includes(heroId)) {
      persist({ ...save, selectedHero: heroId });
      return;
    }

    const cost = getHeroDefinition(heroId).price;
    if (cost <= 0 || save.coins < cost) return;
    persist({
      ...save,
      coins: save.coins - cost,
      heroesUnlocked: [...save.heroesUnlocked, heroId],
      selectedHero: heroId,
    });
  }, [persist, save]);

  const handleEquip = useCallback((heroId: HeroId, slot: EquipmentSlot, equipmentId?: EquipmentId) => {
    const currentLoadouts = { ...save.heroLoadouts };
    const heroLoadout = { ...(currentLoadouts[heroId] || {}) };
    if (equipmentId) {
      if (!save.ownedEquipment.includes(equipmentId)) return;
      heroLoadout[slot] = equipmentId;
    } else {
      delete heroLoadout[slot];
    }
    currentLoadouts[heroId] = heroLoadout;
    persist({ ...save, heroLoadouts: currentLoadouts });
  }, [persist, save]);

  const handleBuyHero = useCallback((heroId: HeroId, cost: number, currency: 'coins' | 'gems' = 'coins') => {
    if (save.heroesUnlocked.includes(heroId)) return;
    if (currency === 'gems') {
      if (save.gems < cost) return;
      persist({ ...save, gems: save.gems - cost, heroesUnlocked: [...save.heroesUnlocked, heroId] });
    } else {
      if (save.coins < cost) return;
      persist({ ...save, coins: save.coins - cost, heroesUnlocked: [...save.heroesUnlocked, heroId] });
    }
  }, [persist, save]);

  const handleBuyEquipment = useCallback((equipmentId: EquipmentId, cost: number, currency: 'coins' | 'gems' = 'coins') => {
    if (save.ownedEquipment.includes(equipmentId)) return;
    if (currency === 'gems') {
      if (save.gems < cost) return;
      persist({ ...save, gems: save.gems - cost, ownedEquipment: [...save.ownedEquipment, equipmentId] });
    } else {
      if (save.coins < cost) return;
      persist({ ...save, coins: save.coins - cost, ownedEquipment: [...save.ownedEquipment, equipmentId] });
    }
  }, [persist, save]);

  const handleOpenGemChest = useCallback((cost = 15): { rewardItem?: EquipmentId; bonusCoins: number } | false => {
    if (save.gems < cost) return false;
    const unowned = ALL_EQUIPMENT_IDS.filter((id) => !save.ownedEquipment.includes(id));
    let rewardItem: EquipmentId | undefined = undefined;
    let bonusCoins = 400;
    let newOwnedEquipment = save.ownedEquipment;

    if (unowned.length > 0) {
      rewardItem = unowned[Math.floor(Math.random() * unowned.length)];
      newOwnedEquipment = [...save.ownedEquipment, rewardItem];
    } else {
      bonusCoins = 1200;
    }

    persist({
      ...save,
      gems: save.gems - cost,
      coins: save.coins + bonusCoins,
      ownedEquipment: newOwnedEquipment,
    });
    return { rewardItem, bonusCoins };
  }, [persist, save]);

  const handleConvertGems = useCallback((gemCost = 10, coinsReward = 650): boolean => {
    if (save.gems < gemCost) return false;
    persist({
      ...save,
      gems: save.gems - gemCost,
      coins: save.coins + coinsReward,
    });
    return true;
  }, [persist, save]);

  const handleMissionClaim = useCallback((id: string) => {
    const mission = save.missions.find((item) => item.id === id);
    if (!mission || mission.claimed || mission.progress < mission.target) return;
    persist({ ...save, coins: save.coins + mission.reward, missions: save.missions.map((item) => item.id === id ? { ...item, claimed: true } : item) });
  }, [persist, save]);

  const handleSettings = useCallback((settings: Settings) => persist({ ...save, settings }), [persist, save]);

  const handleFreeChest = useCallback(async (): Promise<boolean> => {
    if (save.freeChestClaimedDate === localDate()) return false;
    const earned = await AdService.showRewarded('free-chest');
    if (!earned) return false;
    persist({ ...save, coins: save.coins + 120, freeChestClaimedDate: localDate() });
    return true;
  }, [persist, save]);

  const handleBestiarySelect = useCallback((id: string) => { setSelectedBestiaryId(id); setScreen('bestiary'); }, []);

  const navigate = useCallback((next: Screen) => {
    if (next === 'home') setSelectedStageId(getCurrentStage(save).id);
    setScreen(next);
  }, [save]);

  const handleSplashDone = useCallback(() => { setScreen('home'); }, []);

  if (screen === 'splash') return <SplashScreen ready={ready} onDone={handleSplashDone} />;

  const sharedBack = () => setScreen('home');
  const stage = getStage(selectedStageId);

  let view: ReactNode;
  switch (screen) {
    case 'home':
      view = <HomeScreen save={save} onNavigate={navigate} onPlay={() => startStage()} />;
      break;
    case 'map':
      view = <WorldMapScreen save={save} onBack={sharedBack} onSelect={(id) => { setSelectedStageId(id); setScreen('stage'); }} />;
      break;
    case 'stage':
      view = <StageDetailScreen stageId={selectedStageId} save={save} onBack={() => setScreen('map')} onStart={() => startStage(selectedStageId)} onBestiary={handleBestiarySelect} />;
      break;
    case 'bestiary':
      view = <BestiaryScreen save={save} initialId={selectedBestiaryId} onBack={sharedBack} onSelect={setSelectedBestiaryId} />;
      break;
    case 'heroes':
      view = <HeroesScreen save={save} onBack={sharedBack} onSelect={handleHeroSelect} onEquip={handleEquip} />;
      break;
    case 'upgrades':
      view = <UpgradesScreen save={save} onBack={sharedBack} onUpgrade={handleUpgrade} />;
      break;
    case 'missions':
      view = <MissionsScreen save={save} onBack={sharedBack} onClaim={handleMissionClaim} />;
      break;
    case 'shop':
      view = (
        <ShopScreen
          save={save}
          onBack={sharedBack}
          onFreeChest={handleFreeChest}
          onOpenGemChest={handleOpenGemChest}
          onConvertGems={handleConvertGems}
          onBuyHero={handleBuyHero}
          onBuyEquipment={handleBuyEquipment}
        />
      );
      break;
    case 'settings':
      view = <SettingsScreen save={save} onBack={sharedBack} onUpdate={handleSettings} onReset={() => { void resetSave().then((fresh) => { setSave(fresh); setScreen('home'); }); }} />;
      break;
    case 'survival':
      view = <SurvivalScreen save={save} onBack={sharedBack} onStart={startSurvival} onSelectHero={() => setScreen('heroes')} />;
      break;
    case 'stageClear':
      view = lastResult ? (
        <StageClearScreen
          result={lastResult}
          newlyUnlockedAbilities={newlyUnlockedAbilities}
          unlockedSurvival={newlyUnlockedSurvival}
          unlockedEquipment={newlyUnlockedEquipment}
          onNext={() => {
            const next = getNextCampaignStageId(lastResult.stageId);
            if (next) startStage(next);
            else sharedBack();
          }}
          onReplay={() => startStage(lastResult.stageId)}
          onHome={sharedBack}
        />
      ) : <HomeScreen save={save} onNavigate={navigate} onPlay={() => startStage()} />;
      break;
    case 'game':
      view = (
        <GameScreen
          key={`${stage.id}-${runKey}`}
          stage={stage}
          save={save}
          mode={runMode}
          onStageClear={handleStageClear}
          onGameOver={handleGameOver}
          onRetry={() => { setRunKey((key) => key + 1); setScreen('game'); }}
          onHome={() => setScreen('home')}
          onBestiary={() => handleBestiarySelect('skeleton')}
          onSettingsChange={handleSettings}
        />
      );
      break;
    default:
      view = <HomeScreen save={save} onNavigate={navigate} onPlay={() => startStage()} />;
  }

  return (
    <>
      {screen === 'game' && (
        <div className="rotate-device-overlay" role="dialog" aria-modal="true" aria-label="Rotate device to landscape">
          <div className="rotate-device-card">
            <div className="rotate-device-icon-box"><Smartphone size={38} className="rotate-device-phone" /></div>
            <h2>ROTATE TO PLAY</h2>
            <p>Tiny Survivor is designed for landscape combat. Please turn your device sideways.</p>
          </div>
        </div>
      )}
      <Suspense fallback={<RouteLoadingFallback />}>
        <ScreenTransition screen={`${screen}-${runKey}`}>{view}</ScreenTransition>
      </Suspense>
    </>
  );
}

function RouteLoadingFallback() {
  return (
    <div className="route-loading-screen" role="status" aria-live="polite">
      <div className="route-loading-screen__sigil"><Sparkles size={20} /></div>
      <span>PREPARING SANCTUARY</span>
    </div>
  );
}

function mergeCodexProgress(save: SaveData, result: RunResult): SaveData {
  const enemyKillCounts = { ...save.enemyKillCounts };
  for (const [kind, count] of Object.entries(result.enemyKillsByKind ?? {})) {
    enemyKillCounts[kind] = (enemyKillCounts[kind] ?? 0) + Math.max(0, count);
  }
  const bossKillCounts = { ...save.bossKillCounts };
  for (const [bossId, count] of Object.entries(result.bossKillsById ?? {})) {
    bossKillCounts[bossId] = (bossKillCounts[bossId] ?? 0) + Math.max(0, count);
  }
  return {
    ...save,
    discoveredEnemies: [...new Set([...save.discoveredEnemies, ...(result.encounteredEnemies ?? [])])] as EnemyKind[],
    enemyKillCounts,
    discoveredBosses: [...new Set([...save.discoveredBosses, ...(result.encounteredBosses ?? [])])] as BossId[],
    bossKillCounts,
  };
}

function updateMissionProgress(missions: MissionProgress[], result: RunResult, stage: ReturnType<typeof getStage>): MissionProgress[] {
  return missions.map((mission) => {
    const increment = mission.id === 'daily-kills'
      ? result.kills
      : mission.id === 'daily-survive'
        ? Math.floor(result.time)
        : mission.id === 'daily-clear'
          ? (stage.bossStage ? 1 : 0)
          : 0;
    return increment > 0 ? { ...mission, progress: Math.min(mission.target, mission.progress + increment) } : mission;
  });
}
