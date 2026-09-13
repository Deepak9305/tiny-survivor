import { useCallback, useEffect, useState } from 'react';
import { AdService } from './services/adService';
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
import { SplashScreen } from './screens/SplashScreen';
import { StageClearScreen } from './screens/StageClearScreen';
import { StageDetailScreen } from './screens/StageDetailScreen';
import { UpgradesScreen } from './screens/UpgradesScreen';
import { WorldMapScreen } from './screens/WorldMapScreen';
import type { MissionProgress, RunResult, SaveData, Screen, Settings } from './types';

function localDate(): string { const date = new Date(); return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`; }

function createDailyMissions(): MissionProgress[] {
  return [
    { id: 'daily-kills', title: 'Defeat 500 enemies', target: 500, progress: 0, reward: 100, claimed: false },
    { id: 'daily-survive', title: 'Survive for 10 minutes', target: 600, progress: 0, reward: 150, claimed: false },
    { id: 'daily-clear', title: 'Clear stage 1-5', target: 1, progress: 0, reward: 200, claimed: false },
  ];
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('splash');
  const [save, setSave] = useState<SaveData>(DEFAULT_SAVE);
  const [ready, setReady] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState('1-1');
  const [lastResult, setLastResult] = useState<RunResult | undefined>();
  const [runKey, setRunKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    void loadSave().then((loaded) => {
      if (!mounted) return;
      const withDaily = loaded.missionDate === localDate() ? loaded : normalizeSave({ ...loaded, missionDate: localDate(), missions: createDailyMissions() });
      setSave(withDaily);
      setSelectedStageId(getCurrentStage(withDaily).id);
      setReady(true);
      void saveGame(withDaily);
      void AdService.initialize();
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let cleanup: () => void = () => undefined;
    void registerAppLifecycle(() => save).then((removeListener) => { cleanup = removeListener; });
    return () => cleanup();
  }, [save]);

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
    const nextSave = normalizeSave({
      ...save,
      coins: save.coins + result.coins,
      gems: save.gems + (firstClear ? stage.firstClearReward : 0),
      highestUnlockedStage: Math.max(save.highestUnlockedStage, next),
      completedStages,
      bestStageTimes: { ...save.bestStageTimes, [result.stageId]: best ? Math.min(best, result.time) : result.time },
      totalRuns: save.totalRuns + 1,
      totalKills: save.totalKills + result.kills,
      totalBossKills: save.totalBossKills + result.bossKills,
      totalPlayTime: save.totalPlayTime + result.time,
      missions: save.missions.map((mission) => mission.id === 'daily-clear' ? { ...mission, progress: Math.min(mission.target, mission.progress + (stage.stageNumber === 5 ? 1 : 0)) } : mission),
    });
    setSave(nextSave);
    void saveGame(nextSave);
    setLastResult(result);
    setScreen('stageClear');
  }, [save]);

  const handleGameOver = useCallback((result: RunResult) => {
    const nextSave = normalizeSave({ ...save, coins: save.coins + result.coins, totalRuns: save.totalRuns + 1, totalDeaths: save.totalDeaths + 1, totalKills: save.totalKills + result.kills, totalPlayTime: save.totalPlayTime + result.time });
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

  const navigate = useCallback((next: Screen) => {
    if (next === 'home') setSelectedStageId(getCurrentStage(save).id);
    setScreen(next);
  }, [save]);

  if (screen === 'splash') return <SplashScreen onDone={() => setScreen(ready ? 'home' : 'home')} />;

  const sharedBack = () => setScreen('home');
  const stage = getStage(selectedStageId);

  switch (screen) {
    case 'home': return <HomeScreen save={save} onNavigate={navigate} onPlay={() => startStage()} />;
    case 'map': return <WorldMapScreen save={save} onBack={sharedBack} onNavigate={navigate} onSelect={(id) => { setSelectedStageId(id); setScreen('stage'); }} />;
    case 'stage': return <StageDetailScreen stageId={selectedStageId} save={save} onBack={() => setScreen('map')} onStart={() => startStage(selectedStageId)} />;
    case 'heroes': return <HeroesScreen save={save} onBack={sharedBack} onSelect={handleHeroSelect} />;
    case 'upgrades': return <UpgradesScreen save={save} onBack={sharedBack} onUpgrade={handleUpgrade} />;
    case 'missions': return <MissionsScreen save={save} onBack={sharedBack} onClaim={handleMissionClaim} />;
    case 'shop': return <ShopScreen save={save} onBack={sharedBack} onFreeChest={() => persist({ ...save, coins: save.coins + 120 })} />;
    case 'settings': return <SettingsScreen save={save} onBack={sharedBack} onUpdate={handleSettings} onReset={() => { void resetSave().then((fresh) => { setSave(fresh); setScreen('home'); }); }} />;
    case 'stageClear': return lastResult ? <StageClearScreen result={lastResult} onNext={() => startStage(getStage(lastResult.stageId).id === '1-5' ? '2-1' : getNextStageId(lastResult.stageId))} onReplay={() => startStage(lastResult.stageId)} onHome={sharedBack} /> : <HomeScreen save={save} onNavigate={navigate} onPlay={() => startStage()} />;
    case 'game': return <GameScreen key={`${stage.id}-${runKey}`} stage={stage} save={save} onStageClear={handleStageClear} onGameOver={handleGameOver} onRetry={() => { setRunKey((key) => key + 1); setScreen('game'); }} onHome={() => setScreen('home')} />;
    default: return <HomeScreen save={save} onNavigate={navigate} onPlay={() => startStage()} />;
  }
}

function getNextStageId(stageId: string): string {
  const [world, stage] = stageId.split('-').map(Number);
  if (stage >= 5) return `${Math.min(4, world + 1)}-1`;
  return `${world}-${stage + 1}`;
}
