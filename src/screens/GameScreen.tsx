import { useEffect, useRef, useState } from 'react';
import { Heart, Pause, Play, Shield, Skull } from 'lucide-react';
import { getActiveThreeGame, mountThreeGame, destroyThreeGame } from '../game3d/ThreeGame';
import { TwinStickControls } from '../components/TwinStickControls';
import { AbilityControls } from '../components/AbilityControls';
import { StagePreloadScreen } from '../components/StagePreloadScreen';
import { LevelUpOverlay } from '../components/LevelUpOverlay';
import { PauseOverlay } from '../components/PauseOverlay';
import { modelRegistry } from '../game3d/assets/ModelRegistry';
import { AdService } from '../services/adService';
import { audioService } from '../services/audioService';
import { GameOverScreen } from './GameOverScreen';
import type { GameSnapshot, RunMode, RunResult, SaveData, Settings, StageDefinition, UpgradeChoice } from '../types';

interface GameScreenProps {
  stage: StageDefinition;
  save: SaveData;
  mode?: RunMode;
  onStageClear: (result: RunResult) => void;
  onGameOver: (result: RunResult) => void;
  onRetry: () => void;
  onHome: () => void;
  onBestiary: () => void;
  onSettingsChange?: (settings: Settings) => void;
}

const initialSnapshot: GameSnapshot = { time: 0, duration: 180, kills: 0, eliteKills: 0, level: 1, xp: 0, xpRequired: 82, hp: 100, maxHp: 100, coins: 0, aliveEnemies: 0, weaponLevels: { 'magic-bolt': 1 }, passiveLevels: {} };

export function GameScreen({ stage, save, mode = 'campaign', onStageClear, onGameOver, onRetry, onHome, onBestiary, onSettingsChange }: GameScreenProps) {
  const gameRoot = useRef<HTMLDivElement>(null);
  // GameScreen is keyed per run. Keep the run-start save snapshot stable so changing
  // settings while paused cannot tear down/recreate the live Three.js game.
  const runSave = useRef(save);
  const [snapshot, setSnapshot] = useState<GameSnapshot>(initialSnapshot);
  const [upgradeChoices, setUpgradeChoices] = useState<UpgradeChoice[] | undefined>();
  const [paused, setPaused] = useState(false);
  const [warning, setWarning] = useState(false);
  const [tutorialVisible, setTutorialVisible] = useState(true);
  const [gameOver, setGameOver] = useState<RunResult | undefined>();
  const [hitVignette, setHitVignette] = useState(false);
  const [rendererError, setRendererError] = useState<string | undefined>();
  const [reviveLoading, setReviveLoading] = useState(false);
  const [reviveMessage, setReviveMessage] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [preloadProgress, setPreloadProgress] = useState(15);
  const warningTimer = useRef<number | undefined>(undefined);
  const hitTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    let mounted = true;
    let cleanupGame: (() => void) | undefined;
    const initialSave = runSave.current;

    void (async () => {
      await modelRegistry.preloadStage(stage, initialSave.selectedHero, (loaded, total) => {
        if (!mounted) return;
        const pct = Math.max(15, Math.min(95, Math.round((loaded / Math.max(1, total)) * 100)));
        setPreloadProgress(pct);
      });

      if (!mounted) return;
      setPreloadProgress(100);

      await new Promise((resolve) => setTimeout(resolve, 280));
      if (!mounted) return;
      setIsLoading(false);

      if (!gameRoot.current) return;
      audioService.initialize();
      audioService.setMusicEnabled(initialSave.settings.music);
      audioService.setSfxEnabled(initialSave.settings.soundEffects);
      audioService.playMusic('run');

      mountThreeGame(
        gameRoot.current,
        stage,
        initialSave,
        {
          onSnapshot: setSnapshot,
          onLevelUp: setUpgradeChoices,
          onGameOver: (result) => { setGameOver(result); onGameOver(result); },
          onStageClear,
          onPaused: setPaused,
          onBossWarning: () => { setWarning(true); warningTimer.current = window.setTimeout(() => setWarning(false), 2300); },
          onPlayerHit: () => { setHitVignette(true); if (hitTimer.current) window.clearTimeout(hitTimer.current); hitTimer.current = window.setTimeout(() => setHitVignette(false), 220); },
          onRendererError: setRendererError,
        },
        mode,
      );

      cleanupGame = () => {
        if (warningTimer.current) window.clearTimeout(warningTimer.current);
        if (hitTimer.current) window.clearTimeout(hitTimer.current);
        audioService.stopMusic();
        destroyThreeGame();
      };
    })();

    return () => {
      mounted = false;
      cleanupGame?.();
    };
  }, [mode, onGameOver, onStageClear, stage]);

  // Audio preferences can update live without remounting or resetting the run.
  useEffect(() => {
    audioService.setMusicEnabled(save.settings.music);
    audioService.setSfxEnabled(save.settings.soundEffects);
  }, [save.settings.music, save.settings.soundEffects]);

  useEffect(() => {
    const tutorialTimer = window.setTimeout(() => setTutorialVisible(false), 5500);
    return () => window.clearTimeout(tutorialTimer);
  }, []);

  const chooseUpgrade = (choice: UpgradeChoice) => {
    setUpgradeChoices(undefined);
    audioService.playUISound('confirm');
    getActiveThreeGame()?.selectUpgrade(choice.id);
  };

  const revive = async () => {
    if (reviveLoading) return;
    setReviveLoading(true);
    setReviveMessage(undefined);
    const earned = await AdService.showRewarded('revive');
    if (earned && getActiveThreeGame()?.revive()) setGameOver(undefined);
    else if (!earned) setReviveMessage('Rewarded ad unavailable. Retry the run or return home.');
    setReviveLoading(false);
  };

  const hpPercent = snapshot.maxHp > 0 ? Math.max(0, Math.min(100, snapshot.hp / snapshot.maxHp * 100)) : 0;
  const xpPercent = snapshot.xpRequired > 0 ? Math.min(100, snapshot.xp / snapshot.xpRequired * 100) : 0;

  return (
    <main className={`game-screen${hpPercent < 30 ? ' game-screen--low-health' : ''}`}>
      <div ref={gameRoot} className="three-root" />
      {isLoading && <StagePreloadScreen stage={stage} progress={preloadProgress} />}
      {hitVignette && <div className="game-hit-vignette" aria-hidden="true" />}
      {rendererError && (
        <div className="game-renderer-error" role="alert">
          <div className="game-renderer-error__icon"><Shield size={22} /></div>
          <strong>3D ARENA PAUSED</strong>
          <p>{rendererError}</p>
          <button type="button" onClick={onHome}>RETURN HOME</button>
        </div>
      )}
      <div className="game-ui">
        <div className="game-topbar">
          <div className="game-player-hud">
            <div className={`game-health${hpPercent < 30 ? ' game-health--low' : ''}`}>
              <div className="game-health__icon" aria-hidden="true"><Heart size={15} fill="currentColor" /></div>
              <div className="game-health__track">
                <i style={{ width: `${hpPercent}%` }} />
                <span className="game-health__value">{Math.ceil(snapshot.hp)} / {Math.ceil(snapshot.maxHp)}</span>
              </div>
            </div>
            <div className="game-level-xp">
              <span className="game-level-text">Lv. {snapshot.level}</span>
              <div className="game-progress__track"><i style={{ width: `${xpPercent}%` }} /></div>
            </div>
          </div>
          <div className="game-timer">
            <span className="game-stage-title">
              {mode === 'survival' ? 'SURVIVAL' : stage.bossStage ? 'BOSS' : `STAGE ${stage.stageNumber || (stage.id.includes('-') ? stage.id.split('-')[1] : stage.id)}`}
            </span>
            <strong className="game-stage-time">{formatRunTime(snapshot.time)}</strong>
          </div>
          <div className="game-actions">
            <div className="game-kills" aria-label={`${snapshot.kills} enemies defeated`}>
              <Skull size={18} />
              <div className="game-kills__text">
                <span className="game-kills__label">Kills</span>
                <strong className="game-kills__num">{snapshot.kills.toLocaleString()}</strong>
              </div>
            </div>
            <button
              className="game-pause"
              onClick={() => {
                audioService.playUISound(paused ? 'confirm' : 'tap');
                if (paused) getActiveThreeGame()?.resumeRun();
                else getActiveThreeGame()?.pauseRun();
              }}
              aria-label={paused ? 'Resume run' : 'Pause run'}
            >
              {paused ? <Play size={18} fill="currentColor" /> : <Pause size={18} fill="currentColor" />}
            </button>
          </div>
        </div>
        {snapshot.boss && (
          <div className="boss-hud">
            <div>
              <span><Shield size={13} /> {snapshot.boss.name}</span>
              <strong>PHASE {snapshot.boss.phase}</strong>
            </div>
            <div className="boss-hud__track">
              <i style={{ width: `${Math.max(0, (snapshot.boss.hp / snapshot.boss.maxHp) * 100)}%` }} />
            </div>
          </div>
        )}
        {warning && stage.bossStage && (
          <div className="boss-warning" role="status">
            <span className="boss-warning__skull"><Skull size={27} /></span>
            <strong>BOSS</strong>
            <strong>APPROACHING</strong>
            <small>{stage.bossName ?? 'World boss'} enters the arena</small>
          </div>
        )}
        {tutorialVisible && (
          <div className="game-tip game-tip--twin-stick">
            LEFT STICK — MOVE &middot; RIGHT STICK — AIM &middot; TAP SPECIAL ABILITIES
          </div>
        )}
      </div>

      <TwinStickControls disabled={paused || Boolean(upgradeChoices) || Boolean(gameOver)} />
      <AbilityControls abilities={snapshot.abilities} disabled={paused || Boolean(upgradeChoices) || Boolean(gameOver)} />

      {upgradeChoices && (
        <LevelUpOverlay choices={upgradeChoices} playerLevel={snapshot.level} onChoose={chooseUpgrade} />
      )}

      {paused && !upgradeChoices && !gameOver && (
        <PauseOverlay
          snapshot={snapshot}
          stage={stage}
          save={save}
          mode={mode}
          onResume={() => getActiveThreeGame()?.resumeRun()}
          onHome={onHome}
          onBestiary={onBestiary}
          onSettingsChange={onSettingsChange}
        />
      )}
      {gameOver && (
        <GameOverScreen
          result={gameOver}
          onRevive={revive}
          reviveLoading={reviveLoading}
          reviveMessage={reviveMessage}
          onRetry={onRetry}
          onHome={onHome}
        />
      )}
    </main>
  );
}

function formatRunTime(seconds: number): string {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}
