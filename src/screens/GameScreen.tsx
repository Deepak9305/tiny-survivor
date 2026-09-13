import { useEffect, useRef, useState } from 'react';
import { Flame, Heart, Pause, Play, RotateCw, Shield, Sparkles, Target, Zap } from 'lucide-react';
import { getActiveGameScene, mountPhaserGame, destroyPhaserGame } from '../game/PhaserGame';
import { AdService } from '../services/adService';
import { GameOverScreen } from './GameOverScreen';
import type { GameSnapshot, RunResult, SaveData, StageDefinition, UpgradeChoice } from '../types';

interface GameScreenProps { stage: StageDefinition; save: SaveData; onStageClear: (result: RunResult) => void; onGameOver: (result: RunResult) => void; onRetry: () => void; onHome: () => void }

const initialSnapshot: GameSnapshot = { time: 0, duration: 180, kills: 0, eliteKills: 0, level: 1, xp: 0, xpRequired: 82, hp: 100, maxHp: 100, coins: 0, aliveEnemies: 0, weaponLevels: { 'magic-bolt': 1 }, passiveLevels: {} };

export function GameScreen({ stage, save, onStageClear, onGameOver, onRetry, onHome }: GameScreenProps) {
  const gameRoot = useRef<HTMLDivElement>(null);
  const [snapshot, setSnapshot] = useState<GameSnapshot>(initialSnapshot);
  const [upgradeChoices, setUpgradeChoices] = useState<UpgradeChoice[] | undefined>();
  const [paused, setPaused] = useState(false);
  const [warning, setWarning] = useState(false);
  const [gameOver, setGameOver] = useState<RunResult | undefined>();
  const warningTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!gameRoot.current) return;
    mountPhaserGame(gameRoot.current, stage, save, {
      onSnapshot: setSnapshot,
      onLevelUp: setUpgradeChoices,
      onGameOver: (result) => { setGameOver(result); onGameOver(result); },
      onStageClear,
      onPaused: setPaused,
      onBossWarning: () => { setWarning(true); warningTimer.current = window.setTimeout(() => setWarning(false), 2300); },
    });
    return () => { if (warningTimer.current) window.clearTimeout(warningTimer.current); destroyPhaserGame(); };
  }, [stage.id]);

  const chooseUpgrade = (choice: UpgradeChoice) => {
    setUpgradeChoices(undefined);
    getActiveGameScene()?.selectUpgrade(choice.id);
  };

  const revive = async () => {
    const earned = await AdService.showRewarded('revive');
    if (earned && getActiveGameScene()?.revive()) setGameOver(undefined);
  };

  return <main className="game-screen"><div ref={gameRoot} className="phaser-root" />
    <div className="game-ui">
      <div className="game-topbar"><div className="game-health"><div className="game-health__labels"><span><Heart size={14} fill="currentColor" /> HP</span><strong>{Math.ceil(snapshot.hp)} / {Math.ceil(snapshot.maxHp)}</strong></div><div className="game-health__track"><i style={{ width: `${Math.max(0, snapshot.hp / snapshot.maxHp * 100)}%` }} /></div></div><div className="game-timer"><span>STAGE {stage.id}</span><strong>{formatRunTime(snapshot.time)}</strong></div><button className="game-pause" onClick={() => { if (paused) getActiveGameScene()?.resumeRun(); else getActiveGameScene()?.pauseRun(); }} aria-label={paused ? 'Resume run' : 'Pause run'}>{paused ? <Play size={17} fill="currentColor" /> : <Pause size={17} fill="currentColor" />}</button></div>
      <div className="game-progress"><div className="game-progress__label"><span><Sparkles size={14} /> LV. {snapshot.level}</span><span>{snapshot.kills} defeated</span></div><div className="game-progress__track"><i style={{ width: `${Math.min(100, snapshot.xp / snapshot.xpRequired * 100)}%` }} /></div></div>
      {snapshot.boss && <div className="boss-hud"><div><span><Shield size={13} /> {snapshot.boss.name}</span><strong>PHASE {snapshot.boss.phase}</strong></div><div className="boss-hud__track"><i style={{ width: `${Math.max(0, snapshot.boss.hp / snapshot.boss.maxHp * 100)}%` }} /></div></div>}
      <div className="game-weapon-hud"><span><Zap size={14} /> Magic Bolt <b>LV {snapshot.weaponLevels['magic-bolt'] ?? 1}</b></span>{snapshot.weaponLevels['fire-orb'] && <span className="is-fire"><Flame size={14} /> Fire Orb <b>LV {snapshot.weaponLevels['fire-orb']}</b></span>}{snapshot.weaponLevels['orbiting-blades'] && <span><Target size={14} /> Blades <b>LV {snapshot.weaponLevels['orbiting-blades']}</b></span>}</div>
      {warning && <div className="boss-warning"><span>BOSS APPROACHING</span><small>{stage.bossName} enters the graveyard</small></div>}
      <div className="game-tip">DRAG TO MOVE · ATTACKS ARE AUTOMATIC</div>
    </div>
    {upgradeChoices && <LevelUpOverlay choices={upgradeChoices} onChoose={chooseUpgrade} />}
    {paused && !upgradeChoices && !gameOver && <div className="pause-overlay"><div className="pause-card"><div className="pause-card__icon"><Pause size={22} /></div><span className="eyebrow">RUN PAUSED</span><h1>Catch your breath.</h1><button onClick={() => getActiveGameScene()?.resumeRun()}><Play size={17} fill="currentColor" /> RESUME</button><button className="pause-card__quit" onClick={onHome}><RotateCw size={16} /> EXIT RUN</button></div></div>}
    {gameOver && <GameOverScreen result={gameOver} onRevive={revive} onRetry={onRetry} onHome={onHome} />}
  </main>;
}

function LevelUpOverlay({ choices, onChoose }: { choices: UpgradeChoice[]; onChoose: (choice: UpgradeChoice) => void }) {
  return <div className="level-up-overlay"><div className="level-up-panel"><div className="level-up-panel__spark">✦</div><span className="eyebrow">POWER SURGE</span><h1>Level Up!</h1><p>Choose 1 upgrade</p><div className="choice-grid">{choices.map((choice) => <button key={choice.id} className={`choice-card choice-card--${choice.rarity}`} onClick={() => onChoose(choice)}><span className="choice-card__icon">{getChoiceIcon(choice)}</span><span className="choice-card__rarity">{choice.rarity.toUpperCase()}</span><strong>{choice.title}</strong><small>LV {choice.level} → {Math.min(5, choice.level + 1)}</small><em>{choice.nextEffect}</em></button>)}</div><div className="level-up-panel__footer"><span>Run level {choices[0]?.level ? choices[0].level + 1 : 2}</span><button disabled>REROLL <small>WATCH AD</small></button></div></div></div>;
}

function getChoiceIcon(choice: UpgradeChoice) {
  if (choice.id.includes('fire')) return <Flame size={26} />;
  if (choice.id.includes('bolt') || choice.id.includes('lightning')) return <Zap size={26} />;
  if (choice.id.includes('vitality')) return <Heart size={26} />;
  if (choice.id.includes('armor')) return <Shield size={26} />;
  if (choice.id.includes('power')) return <Sparkles size={26} />;
  return <Target size={26} />;
}

function formatRunTime(seconds: number): string { return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`; }
