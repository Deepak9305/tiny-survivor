import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Smartphone } from 'lucide-react';
import { AdService } from './services/adService';
import { audioService } from './services/audioService';
import { registerAppLifecycle } from './services/nativeService';
import { DEFAULT_SAVE, loadSave, normalizeSave, resetSave, saveGame } from './services/saveService';
import { getPermanentUpgradeCost } from './data/balance';
import { getCurrentStage, getStage, isStageUnlocked, stageNumber } from './data/stages';
import { GameScreen } from './screens/GameScreen';
import { HeroesScreen } from './screens/HeroesScreen';
import { HomeScreen } from './screens/HomeScreen';
import { MissionsScreen } from './screens/MissionsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { ShopScreen } from './screens/ShopScreen';
import { BestiaryScreen } from './screens/BestiaryScreen';
import { SplashScreen } from './screens/SplashScreen';
import { StageClearScreen } from './screens/StageClearScreen';
import { StageDetailScreen } from './screens/StageDetailScreen';
import { UpgradesScreen } from './screens/UpgradesScreen';
import { WorldMapScreen } from './screens/WorldMapScreen';
import { ScreenTransition } from './components/ScreenTransition';
import { getActiveThreeGame } from './game3d/ThreeGame';
import type { BossId, EnemyKind, MissionProgress, RunResult, SaveData, Screen, Settings } from './types';

function localDate(): string { const date = new Date(); return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`; }

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
  const [lastResult, setLastResult] = useState<RunResult | undefined>();
  const [selectedBestiaryId, setSelectedBestiaryId] = useState<string>('skeleton');
  const [runKey, setRunKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    void loadSave().then((loaded) => {
      if (!mounted) return;
      const withDaily = loaded.missionDate === localDate() ? loaded : normalizeSave({ ...loaded, missionDate: localDate(), missions: createDailyMissions() });
      setSave(withDaily);
      if (INITIAL_STAGE) {
        setSelectedStageId(INITIAL_STAGE);
      } else {
        setSelectedStageId(getCurrentStage(withDaily).id);
      }
      if (INITIAL_SCREEN) {
        setScreen(INITIAL_SCREEN);
      }
      setReady(true);
      void saveGame(withDaily);
      void AdService.initialize();
    });
    return () => { mounted = false; };
  }, []);

  const handleNativeBack = useCallback(() => {
    if (screen === 'game') {
      getActiveThreeGame()?.togglePauseRun();
      return;
    }
    if (screen === 'stage') setScreen('map');
    else if (screen !== 'home') setScreen('home');
  }, [screen]);

  useEffect(() => {
    let cleanup: () => void = () => undefined;
    let disposed = false;
    void registerAppLifecycle(() => save, handleNativeBack).then((removeListener) => { if (disposed) removeListener(); else cleanup = removeListener; });
    return () => { disposed = true; cleanup(); };
  }, [handleNativeBack, save]);

  useEffect(() => {
    audioService.initialize();
    audioService.setMusicEnabled(save.settings.music);
    audioService.setSfxEnabled(save.settings.soundEffects);
    if (ready && screen !== 'game') audioService.playMusic('menu');
  }, [ready, save.settings.music, save.settings.soundEffects, screen]);

  const persist = useCallback((next: SaveData) => { const normalized = normalizeSave(next); setSave(normalized); void saveGame(normalized); }, []);

  const startStage = useCallback((stageId = selectedStageId) => {
    if (!isStageUnlocked(stageId, save)) return;
    setSelectedStageId(stageId);
    setRunKey((key) => key + 1);
    setScreen('game');
  }, [save, selectedStageId]);

  const handleStageClear = useCallback((result: RunResult) => {
    const stage = getStage(result.stageId);
    const firstClear = !save.completedStages.includes(result.stageId);
    const completedStages = [...new Set([...save.completedStages, result.stageId])];
    const next = Math.min(20, stageNumber(result.stageId) + 1);
    const best = save.bestStageTimes[result.stageId];
    const codex = mergeCodexProgress(save, result);
    const nextSave = normalizeSave({
      ...codex,
      coins: save.coins + result.coins,
      gems: save.gems + (firstClear ? stage.firstClearReward : 0),
      highestUnlockedStage: Math.max(save.highestUnlockedStage, next),
      completedStages,
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
    const nextSave = normalizeSave({ ...mergeCodexProgress(save, result), coins: save.coins + result.coins, totalRuns: save.totalRuns + 1, totalDeaths: save.totalDeaths + 1, totalKills: save.totalKills + result.kills, totalPlayTime: save.totalPlayTime + result.time, missions: updateMissionProgress(save.missions, result, stage) });
    setSave(nextSave);
    void saveGame(nextSave);
  }, [save]);

  const handleUpgrade = useCallback((id: string) => {
    const level = save.permanentUpgrades[id] ?? 0;
    const cost = getPermanentUpgradeCost(id, level);
    if (level >= 5 || save.coins < cost) return;
    persist({ ...save, coins: save.coins - cost, permanentUpgrades: { ...save.permanentUpgrades, [id]: level + 1 } });
  }, [persist, save]);

  const handleHeroSelect = useCallback((id: string) => {
    if (!save.heroesUnlocked.includes(id)) return;
    persist({ ...save, selectedHero: id });
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

  const handleSplashDone = useCallback(() => {
    setScreen('home');
  }, []);

  if (screen === 'splash') return <SplashScreen ready={ready} onDone={handleSplashDone} />;

  const sharedBack = () => setScreen('home');
  const stage = getStage(selectedStageId);

  let view: ReactNode;
  switch (screen) {
    case 'home': view = <HomeScreen save={save} onNavigate={navigate} onPlay={() => startStage()} />; break;
    case 'map': view = <WorldMapScreen save={save} onBack={sharedBack} onSelect={(id) => { setSelectedStageId(id); setScreen('stage'); }} />; break;
    case 'stage': view = <StageDetailScreen stageId={selectedStageId} save={save} onBack={() => setScreen('map')} onStart={() => startStage(selectedStageId)} onBestiary={handleBestiarySelect} />; break;
    case 'bestiary': view = <BestiaryScreen save={save} initialId={selectedBestiaryId} onBack={sharedBack} onSelect={setSelectedBestiaryId} />; break;
    case 'heroes': view = <HeroesScreen save={save} onBack={sharedBack} onSelect={handleHeroSelect} />; break;
    case 'upgrades': view = <UpgradesScreen save={save} onBack={sharedBack} onUpgrade={handleUpgrade} />; break;
    case 'missions': view = <MissionsScreen save={save} onBack={sharedBack} onClaim={handleMissionClaim} />; break;
    case 'shop': view = <ShopScreen save={save} onBack={sharedBack} onFreeChest={handleFreeChest} />; break;
    case 'settings': view = <SettingsScreen save={save} onBack={sharedBack} onUpdate={handleSettings} onReset={() => { void resetSave().then((fresh) => { setSave(fresh); setScreen('home'); }); }} />; break;
    case 'stageClear': view = lastResult ? <StageClearScreen result={lastResult} onNext={() => startStage(getNextStageId(lastResult.stageId))} onReplay={() => startStage(lastResult.stageId)} onHome={sharedBack} /> : <HomeScreen save={save} onNavigate={navigate} onPlay={() => startStage()} />; break;
    case 'game': view = <GameScreen key={`${stage.id}-${runKey}`} stage={stage} save={save} onStageClear={handleStageClear} onGameOver={handleGameOver} onRetry={() => { setRunKey((key) => key + 1); setScreen('game'); }} onHome={() => setScreen('home')} onBestiary={() => handleBestiarySelect('skeleton')} />; break;
    default: view = <HomeScreen save={save} onNavigate={navigate} onPlay={() => startStage()} />;
  }
  return (
    <>
      <div className="rotate-device-overlay" aria-hidden="true">
        <div className="rotate-device-card">
          <div className="rotate-device-icon-box">
            <Smartphone size={38} className="rotate-device-phone" />
          </div>
          <h2>ROTATE YOUR DEVICE</h2>
          <p>Tiny Survivor is built for landscape twin-stick combat. Please turn your device sideways.</p>
        </div>
      </div>
      <ScreenTransition screen={`${screen}-${runKey}`}>{view}</ScreenTransition>
    </>
  );
}

function getNextStageId(stageId: string): string {
  const [world, stage] = stageId.split('-').map(Number);
  if (world >= 4 && stage >= 5) return '4-5';
  if (stage >= 5) return `${world + 1}-1`;
  return `${world}-${stage + 1}`;
}

function mergeCodexProgress(save: SaveData, result: RunResult): SaveData {
  const enemyKillCounts = { ...save.enemyKillCounts };
  for (const [kind, count] of Object.entries(result.enemyKillsByKind ?? {})) enemyKillCounts[kind] = (enemyKillCounts[kind] ?? 0) + Math.max(0, count);
  const bossKillCounts = { ...save.bossKillCounts };
  for (const [bossId, count] of Object.entries(result.bossKillsById ?? {})) bossKillCounts[bossId] = (bossKillCounts[bossId] ?? 0) + Math.max(0, count);
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
    const increment = mission.id === 'daily-kills' ? result.kills : mission.id === 'daily-survive' ? Math.floor(result.time) : mission.id === 'daily-clear' ? (stage.bossStage ? 1 : 0) : 0;
    return increment > 0 ? { ...mission, progress: Math.min(mission.target, mission.progress + increment) } : mission;
  });
}
