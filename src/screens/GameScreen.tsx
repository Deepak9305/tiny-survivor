import { useEffect, useRef, useState } from 'react';
import { Clock, Coins, Crosshair, Flame, Heart, Pause, Play, RotateCw, Shield, Skull, Sparkles, Swords, Target, Zap } from 'lucide-react';
import { getActiveThreeGame, mountThreeGame, destroyThreeGame } from '../game3d/ThreeGame';
import { VirtualJoystick } from '../components/VirtualJoystick';
import { StagePreloadScreen } from '../components/StagePreloadScreen';
import { modelRegistry } from '../game3d/assets/ModelRegistry';
import { AdService } from '../services/adService';
import { audioService } from '../services/audioService';
import { GameOverScreen } from './GameOverScreen';
import type { GameSnapshot, RunResult, SaveData, StageDefinition, UpgradeChoice } from '../types';

interface GameScreenProps { stage: StageDefinition; save: SaveData; onStageClear: (result: RunResult) => void; onGameOver: (result: RunResult) => void; onRetry: () => void; onHome: () => void; onBestiary: () => void }

const initialSnapshot: GameSnapshot = { time: 0, duration: 180, kills: 0, eliteKills: 0, level: 1, xp: 0, xpRequired: 82, hp: 100, maxHp: 100, coins: 0, aliveEnemies: 0, weaponLevels: { 'magic-bolt': 1 }, passiveLevels: {} };

export function GameScreen({ stage, save, onStageClear, onGameOver, onRetry, onHome, onBestiary }: GameScreenProps) {
  const gameRoot = useRef<HTMLDivElement>(null);
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

    void (async () => {
      // Preload assets for this stage
      await modelRegistry.preloadStage(stage, save.selectedHero, (loaded, total) => {
        const pct = Math.max(15, Math.min(95, Math.round((loaded / Math.max(1, total)) * 100)));
        setPreloadProgress(pct);
      });

      if (!mounted) return;
      setPreloadProgress(100);

      await new Promise((resolve) => setTimeout(resolve, 260));
      if (!mounted || !gameRoot.current) return;
      setIsLoading(false);

      audioService.initialize();
      audioService.setMusicEnabled(save.settings.music);
      audioService.setSfxEnabled(save.settings.soundEffects);
      audioService.playMusic('run');

      mountThreeGame(gameRoot.current, stage, save, {
        onSnapshot: setSnapshot,
        onLevelUp: setUpgradeChoices,
        onGameOver: (result) => { setGameOver(result); onGameOver(result); },
        onStageClear,
        onPaused: setPaused,
        onBossWarning: () => { setWarning(true); warningTimer.current = window.setTimeout(() => setWarning(false), 2300); },
        onPlayerHit: () => { setHitVignette(true); if (hitTimer.current) window.clearTimeout(hitTimer.current); hitTimer.current = window.setTimeout(() => setHitVignette(false), 220); },
        onRendererError: setRendererError,
      });

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
  }, [save.settings.music, save.settings.soundEffects, stage.id]);

  useEffect(() => {
    const tutorialTimer = window.setTimeout(() => setTutorialVisible(false), 4600);
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

  const hpPercent = snapshot.maxHp > 0 ? Math.max(0, Math.min(100, (snapshot.hp / snapshot.maxHp) * 100)) : 0;
  const xpPercent = snapshot.xpRequired > 0 ? Math.min(100, (snapshot.xp / snapshot.xpRequired) * 100) : 0;
  const mainWeaponLevel = snapshot.weaponLevels['magic-bolt'] ?? 1;

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

      {/* Survivor.io Mobile HUD */}
      <div className="game-ui">
        {/* Top Controls & Counters */}
        <div className="survivor-topbar">
          {/* Pause Button */}
          <button
            type="button"
            className="survivor-pause-btn"
            onClick={() => {
              audioService.playUISound(paused ? 'confirm' : 'tap');
              if (paused) getActiveThreeGame()?.resumeRun();
              else getActiveThreeGame()?.pauseRun();
            }}
            aria-label={paused ? 'Resume run' : 'Pause run'}
          >
            {paused ? <Play size={20} fill="currentColor" /> : <Pause size={20} fill="currentColor" />}
          </button>

          {/* Yellow Stopwatch Timer */}
          <div className="survivor-timer-pill">
            <Clock size={16} className="survivor-timer-icon" />
            <strong className="survivor-timer-val">{formatRunTime(snapshot.time)}</strong>
          </div>

          {/* Wave Timeline Progress Bar with Skull */}
          <div className="survivor-wave-bar">
            <div
              className="survivor-wave-fill"
              style={{ width: `${Math.min(100, (snapshot.time / stage.duration) * 100)}%` }}
            />
            <span className="survivor-wave-skull">
              <Skull size={13} />
            </span>
          </div>

          {/* Coins & Kills Stack */}
          <div className="survivor-stats-stack">
            <div className="survivor-stat-pill survivor-stat-pill--coin">
              <Coins size={14} className="text-gold" />
              <span>{(save.coins + snapshot.coins).toLocaleString()}</span>
            </div>
            <div className="survivor-stat-pill survivor-stat-pill--kill">
              <Skull size={13} className="text-white" />
              <span>{snapshot.kills.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* EXP Bar: Full-Width with Purple Level Badge */}
        <div className="survivor-exp-container">
          <div className="survivor-level-badge">
            <span>{snapshot.level}</span>
          </div>
          <div className="survivor-exp-track">
            <span className="survivor-exp-label">EXP</span>
            <div className="survivor-exp-fill" style={{ width: `${xpPercent}%` }}>
              <div className="survivor-exp-shine" />
            </div>
          </div>
        </div>

        {/* Boss Warning HUD if active */}
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

        {/* Boss Warning Banner */}
        {warning && stage.bossStage && (
          <div className="boss-warning" role="status">
            <span className="boss-warning__skull"><Skull size={27} /></span>
            <strong>BOSS</strong>
            <strong>APPROACHING</strong>
            <small>{stage.bossName ?? 'World boss'} enters the arena</small>
          </div>
        )}

        {tutorialVisible && (
          <div className="game-tip">DRAG TO MOVE · WEAPONS AUTO-FIRE</div>
        )}

        {/* Bottom Left Weapon Card (Survivor.io style) */}
        <div className="survivor-weapon-card">
          <div className="survivor-weapon-level-col">
            <strong className="survivor-weapon-level">{mainWeaponLevel}</strong>
            <span className="survivor-weapon-ammo">∞</span>
          </div>
          <div className="survivor-weapon-icon">
            <Crosshair size={26} />
          </div>
          <div className="survivor-weapon-pips">
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} className={`survivor-wpn-pip ${i < mainWeaponLevel ? 'is-filled' : ''}`} />
            ))}
          </div>
        </div>
      </div>

      <VirtualJoystick disabled={paused || Boolean(upgradeChoices) || Boolean(gameOver)} />
      {upgradeChoices && <LevelUpOverlay choices={upgradeChoices} onChoose={chooseUpgrade} />}
      {paused && !upgradeChoices && !gameOver && (
        <div className="pause-overlay">
          <div className="pause-card">
            <div className="pause-card__icon"><Pause size={22} /></div>
            <span className="eyebrow">RUN PAUSED</span>
            <h1>Catch your breath.</h1>
            <div className="pause-build">
              <span>LV {snapshot.level}</span>
              <span>{snapshot.kills.toLocaleString()} KILLS</span>
              <span>{formatRunTime(snapshot.time)}</span>
            </div>
            <div className="pause-build__items">
              {Object.entries(snapshot.weaponLevels).map(([id, level]) => (
                <span key={id}>{id.replaceAll('-', ' ')} <strong>·{level}</strong></span>
              ))}
            </div>
            <button onClick={() => getActiveThreeGame()?.resumeRun()}><Play size={17} fill="currentColor" /> RESUME</button>
            <button className="pause-card__quit" onClick={onHome}><RotateCw size={16} /> QUIT RUN</button>
          </div>
        </div>
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

function LevelUpOverlay({ choices, onChoose }: { choices: UpgradeChoice[]; onChoose: (choice: UpgradeChoice) => void }) {
  return (
    <div className="level-up-overlay">
      <div className="level-up-panel">
        <h1 className="level-up-title">Level Up!</h1>
        <p className="level-up-subtitle">Choose a skill</p>
        <div className="choice-grid">
          {choices.map((choice) => (
            <button
              type="button"
              key={choice.id}
              className={`choice-card choice-card--${choice.id}`}
              onClick={() => onChoose(choice)}
              aria-label={`${choice.title}: ${choice.nextEffect}`}
            >
              <div className="choice-card__header">
                <strong>{choice.title}</strong>
                {choice.level === 0 ? (
                  <span className="choice-badge-new">New</span>
                ) : (
                  <span className="choice-badge-lv">Lv. {choice.level + 1}</span>
                )}
              </div>
              <div className={`choice-card__rune-icon choice-card__rune-icon--${choice.id}`}>
                {getChoiceIcon(choice)}
              </div>
              <p className="choice-card__desc">{choice.nextEffect}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function getChoiceIcon(choice: UpgradeChoice) {
  if (choice.id.includes('fire')) return <Flame size={32} />;
  if (choice.id.includes('blades')) return <Swords size={32} />;
  if (choice.id.includes('bolt') || choice.id.includes('lightning')) return <Zap size={32} />;
  if (choice.id.includes('vitality')) return <Heart size={32} />;
  if (choice.id.includes('armor')) return <Shield size={32} />;
  if (choice.id.includes('power')) return <Sparkles size={32} />;
  return <Target size={32} />;
}

function formatRunTime(seconds: number): string { return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`; }
