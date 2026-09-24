import React, { useEffect, useRef, useState } from 'react';
import { Gem, Heart, Pause, Play, Shield, Skull, Zap } from 'lucide-react';
import { getActiveThreeGame, mountThreeGame, destroyThreeGame } from '../game3d/ThreeGame';
import { TwinStickControls } from '../components/TwinStickControls';
import { AbilityControls } from '../components/AbilityControls';
import { StagePreloadScreen } from '../components/StagePreloadScreen';
import { LevelUpOverlay } from '../components/LevelUpOverlay';
import { PauseOverlay } from '../components/PauseOverlay';
import { modelRegistry } from '../game3d/assets/ModelRegistry';
import { AdService } from '../services/adService';
import { audioService } from '../services/audioService';
import {
  getCombatFlowState,
  type CombatFlowState,
  type CombatWaveAnnouncement,
} from '../game/systems/CombatTargeting';
import { GameOverScreen } from './GameOverScreen';
import { TreasureChestModal } from '../components/TreasureChestModal';
import type { ChestReward, GameSnapshot, RunMode, RunResult, SaveData, Settings, StageDefinition, UpgradeChoice } from '../types';

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

const initialSnapshot: GameSnapshot = {
  time: 0,
  duration: 180,
  kills: 0,
  eliteKills: 0,
  level: 1,
  xp: 0,
  xpRequired: 82,
  hp: 100,
  maxHp: 100,
  coins: 0,
  aliveEnemies: 0,
  weaponLevels: { 'magic-bolt': 1 },
  passiveLevels: {},
};

const HERO_SIGILS = {
  shadow: '✦',
  warrior: '⚔',
  monk: '◉',
  gunslinger: '✧',
} as const;

export function GameScreen({
  stage,
  save,
  mode = 'campaign',
  onStageClear,
  onGameOver,
  onRetry,
  onHome,
  onBestiary,
  onSettingsChange,
}: GameScreenProps) {
  const gameRoot = useRef<HTMLDivElement>(null);
  const runSave = useRef(save);
  const runStage = useRef(stage);
  const runMode = useRef(mode);
  const callbacks = useRef({ onStageClear, onGameOver });

  const [snapshot, setSnapshot] = useState<GameSnapshot>(initialSnapshot);
  const [upgradeChoices, setUpgradeChoices] = useState<UpgradeChoice[] | undefined>();
  const [activeChestRewards, setActiveChestRewards] = useState<ChestReward | undefined>();
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
  const [flow, setFlow] = useState<CombatFlowState>(() => getCombatFlowState());
  const [waveCallout, setWaveCallout] = useState<CombatWaveAnnouncement | undefined>();
  const [killCallout, setKillCallout] = useState<string | undefined>();

  const warningTimer = useRef<number | undefined>(undefined);
  const hitTimer = useRef<number | undefined>(undefined);
  const waveTimer = useRef<number | undefined>(undefined);
  const killTimer = useRef<number | undefined>(undefined);
  const wasOverdrive = useRef(false);
  const lastKillMilestone = useRef(0);
  const dashCooldownRatio = snapshot.dashCooldownRatio ?? 0;
  const isDashing = snapshot.isDashing ?? false;

  useEffect(() => {
    callbacks.current = { onStageClear, onGameOver };
  }, [onStageClear, onGameOver]);

  useEffect(() => {
    let mounted = true;
    let cleanupGame: (() => void) | undefined;
    const initialSave = runSave.current;
    const initialStage = runStage.current;
    const initialMode = runMode.current;

    void (async () => {
      await modelRegistry.preloadStage(initialStage, initialSave.selectedHero, (loaded, total) => {
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
        initialStage,
        initialSave,
        {
          onSnapshot: setSnapshot,
          onLevelUp: setUpgradeChoices,
          onGameOver: (result) => {
            setGameOver(result);
            callbacks.current.onGameOver(result);
          },
          onStageClear: (result) => callbacks.current.onStageClear(result),
          onPaused: setPaused,
          onBossWarning: () => {
            setWarning(true);
            warningTimer.current = window.setTimeout(() => setWarning(false), 2300);
          },
          onPlayerHit: () => {
            setHitVignette(true);
            if (hitTimer.current) window.clearTimeout(hitTimer.current);
            hitTimer.current = window.setTimeout(() => setHitVignette(false), 220);
          },
          onChestOpened: setActiveChestRewards,
          onRendererError: setRendererError,
        },
        initialMode,
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
  }, []);

  useEffect(() => {
    audioService.setMusicEnabled(save.settings.music);
    audioService.setSfxEnabled(save.settings.soundEffects);
  }, [save.settings.music, save.settings.soundEffects]);

  useEffect(() => {
    const tutorialTimer = window.setTimeout(() => setTutorialVisible(false), 5200);
    return () => window.clearTimeout(tutorialTimer);
  }, []);

  useEffect(() => {
    const handleFlow = (event: Event) => {
      const next = (event as CustomEvent<CombatFlowState>).detail;
      if (!next) return;
      setFlow(next);
      if (next.overdrive && !wasOverdrive.current) {
        audioService.playSFX('level-up', { pitch: 1.2, volume: 0.62, throttle: 0.5 });
      }
      wasOverdrive.current = next.overdrive;
    };

    const handleWave = (event: Event) => {
      const next = (event as CustomEvent<CombatWaveAnnouncement>).detail;
      if (!next) return;
      setWaveCallout(next);
      if (waveTimer.current) window.clearTimeout(waveTimer.current);
      waveTimer.current = window.setTimeout(() => setWaveCallout(undefined), 1700);
    };

    window.addEventListener('tiny-survivor-combat-flow', handleFlow);
    window.addEventListener('tiny-survivor-wave', handleWave);
    return () => {
      window.removeEventListener('tiny-survivor-combat-flow', handleFlow);
      window.removeEventListener('tiny-survivor-wave', handleWave);
      if (waveTimer.current) window.clearTimeout(waveTimer.current);
    };
  }, []);

  useEffect(() => {
    const milestone = Math.floor(snapshot.kills / 25) * 25;
    if (milestone < 25 || milestone <= lastKillMilestone.current) return;
    lastKillMilestone.current = milestone;
    setKillCallout(
      milestone >= 200
        ? `ABSOLUTE BANANAS! · ${milestone} KILLS 🍌`
        : milestone >= 150
        ? `GIGA BONK GOD! · ${milestone} KILLS 👑`
        : milestone >= 100
        ? `TOTAL KNOCKOUT! · ${milestone} KILLS 🚀`
        : milestone >= 75
        ? `SLAP-TASTIC! · ${milestone} KILLS 💥`
        : milestone >= 50
        ? `MEGA DERP! · ${milestone} KILLS 🤪`
        : `BONK FEVER! · ${milestone} KILLS 🔨`
    );
    if (killTimer.current) window.clearTimeout(killTimer.current);
    killTimer.current = window.setTimeout(() => setKillCallout(undefined), 1400);
  }, [snapshot.kills]);

  useEffect(() => () => {
    if (killTimer.current) window.clearTimeout(killTimer.current);
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
  const heroId = save.selectedHero ?? 'shadow';
  const heroSigil = HERO_SIGILS[heroId];

  return (
    <main className={`game-screen${hpPercent < 30 ? ' game-screen--low-health' : ''}${flow.overdrive ? ' game-screen--overdrive' : ''}${snapshot.bloodMoonActive ? ' game-screen--blood-moon' : ''}`}>
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
            <div className={`game-hero-sigil game-hero-sigil--${heroId}`} aria-label={`${heroId} hero`}>
              {heroSigil}
            </div>
            <div className="game-player-bars">
              <div className={`game-health${hpPercent < 30 ? ' game-health--low' : ''}`}>
                <div className="game-health__icon" aria-hidden="true"><Heart size={15} fill="currentColor" /></div>
                <div className="game-health__track">
                  <i style={{ width: `${hpPercent}%` }} />
                  <span className="game-health__value">{Math.ceil(snapshot.hp)} / {Math.ceil(snapshot.maxHp)}</span>
                </div>
              </div>
              <div className="game-level-xp">
                <span className="game-level-text" title="XP Crystals increase Hero Level">
                  <Gem size={12} className="game-xp-gem-icon" /> Lv. {snapshot.level}
                </span>
                <div className="game-progress__track"><i style={{ width: `${xpPercent}%` }} /></div>
              </div>
            </div>
          </div>

          <div className="game-timer">
            <span className="game-stage-title">
              {mode === 'survival' ? 'SURVIVAL' : stage.bossStage ? 'BOSS' : `STAGE ${stage.stageNumber || (stage.id.includes('-') ? stage.id.split('-')[1] : stage.id)}`}
            </span>
            <strong className="game-stage-time">{formatRunTime(snapshot.time)}</strong>
          </div>

          <div className="game-actions">
            {(snapshot.gems ?? 0) > 0 && (
              <div className="game-diamonds" aria-label={`${snapshot.gems} diamonds collected`}>
                <Gem size={15} className="game-diamonds__icon" />
                <div className="game-diamonds__text">
                  <span className="game-diamonds__label">Gems</span>
                  <strong className="game-diamonds__num">{snapshot.gems}</strong>
                </div>
              </div>
            )}
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

        <div className={`game-flow-hud${flow.overdrive ? ' game-flow-hud--overdrive' : ''}${flow.meter <= 0 ? ' game-flow-hud--empty' : ''}`}>
          <span className="game-flow-hud__label"><Zap size={11} fill="currentColor" /> {flow.overdrive ? 'SUPER ACTIVE! ⭐' : 'SUPER CHARGE'}</span>
          <div className="game-flow-hud__track"><i style={{ width: `${flow.meter}%` }} /></div>
          <strong className="game-flow-hud__value">
            {flow.overdrive ? `${flow.overdriveRemaining.toFixed(1)}s` : flow.streak >= 3 ? `x${flow.streak} BRAWL` : `${Math.round(flow.meter)}%`}
          </strong>
        </div>

        {snapshot.comboStreak && snapshot.comboStreak >= 6 && (
          <div className="game-combo-callout" role="status">
            <span className="game-combo-callout__count">{snapshot.comboStreak}x</span>
            <span className="game-combo-callout__title">
              {snapshot.comboStreak >= 50
                ? 'ULTIMATE SHOWDOWN! 👑'
                : snapshot.comboStreak >= 25
                ? 'MEGA BONK SPREE! 🔨'
                : snapshot.comboStreak >= 15
                ? 'BRAWL-TASTIC! ⭐'
                : snapshot.comboStreak >= 10
                ? 'DOUBLE BRAWL! 💥'
                : 'BONK COMBO! 🎯'}
            </span>
          </div>
        )}

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

        {waveCallout && (
          <div className={`game-wave-callout game-wave-callout--${waveCallout.tone}`} role="status">
            <strong>{waveCallout.label}</strong>
            <span>{waveCallout.detail}</span>
          </div>
        )}

        {killCallout && <div className="game-kill-callout" aria-live="polite">{killCallout}</div>}

        {tutorialVisible && (
          <div className="game-tip game-tip--twin-stick">
            LEFT STICK — MOVE &middot; HOLD FIRE — AUTO-TARGET &middot; TAP SPECIALS — AUTO-AIM
          </div>
        )}
      </div>

      <TwinStickControls disabled={paused || Boolean(upgradeChoices) || Boolean(gameOver) || Boolean(activeChestRewards)} />
      <AbilityControls abilities={snapshot.abilities} disabled={paused || Boolean(upgradeChoices) || Boolean(gameOver) || Boolean(activeChestRewards)} />

      {/* Dash Button — floating between movement zone and fire zone */}
      {!paused && !upgradeChoices && !gameOver && !activeChestRewards && (
        <button
          type="button"
          id="game-dash-btn"
          className={`game-dash-btn${isDashing ? ' is-dashing' : ''}${dashCooldownRatio > 0 ? ' is-cooldown' : ' is-ready'}`}
          style={{ '--dash-cd': dashCooldownRatio } as React.CSSProperties}
          onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); getActiveThreeGame()?.triggerPlayerDash(); }}
          aria-label={`Dash / Dodge Roll${dashCooldownRatio > 0 ? ' (cooling down)' : ' (ready)'}`}
        >
          <svg className="game-dash-btn__arc" viewBox="0 0 40 40" aria-hidden="true">
            <circle cx="20" cy="20" r="17" fill="none" stroke="rgba(56,189,248,0.18)" strokeWidth="3"/>
            <circle
              cx="20" cy="20" r="17" fill="none"
              stroke="rgba(56,189,248,0.82)" strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${(1 - dashCooldownRatio) * 106.8} 106.8`}
              strokeDashoffset="26.7"
              transform="rotate(-90 20 20)"
            />
          </svg>
          <span className="game-dash-btn__icon" aria-hidden="true">⚡</span>
          <span className="game-dash-btn__label">DASH</span>
        </button>
      )}

      {upgradeChoices && (
        <LevelUpOverlay
          choices={upgradeChoices}
          playerLevel={snapshot.level}
          rerollsRemaining={snapshot.rerollsRemaining ?? 2}
          onChoose={chooseUpgrade}
          onReroll={() => getActiveThreeGame()?.rerollUpgrades()}
          onSkip={() => {
            getActiveThreeGame()?.skipUpgrade();
            setUpgradeChoices(undefined);
          }}
        />
      )}

      {activeChestRewards && (
        <TreasureChestModal
          rewards={activeChestRewards}
          onClaim={() => {
            const game = getActiveThreeGame();
            if (game) game.claimChestReward(activeChestRewards);
            setActiveChestRewards(undefined);
          }}
        />
      )}

      {paused && !upgradeChoices && !gameOver && !activeChestRewards && (
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
