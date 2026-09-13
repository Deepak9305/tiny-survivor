import { useEffect, useRef, useState } from 'react';
import { Dices, Flame, Heart, Pause, Play, RotateCw, Shield, Skull, Sparkles, Target, Zap } from 'lucide-react';
import { getActiveThreeGame, mountThreeGame, destroyThreeGame } from '../game3d/ThreeGame';
import { VirtualJoystick } from '../components/VirtualJoystick';
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
  const [tutorialVisible, setTutorialVisible] = useState(true);
  const [gameOver, setGameOver] = useState<RunResult | undefined>();
  const warningTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!gameRoot.current) return;
    mountThreeGame(gameRoot.current, stage, save, {
      onSnapshot: setSnapshot,
      onLevelUp: setUpgradeChoices,
      onGameOver: (result) => { setGameOver(result); onGameOver(result); },
      onStageClear,
      onPaused: setPaused,
      onBossWarning: () => { setWarning(true); warningTimer.current = window.setTimeout(() => setWarning(false), 2300); },
    });
    return () => { if (warningTimer.current) window.clearTimeout(warningTimer.current); destroyThreeGame(); };
  }, [stage.id]);

  useEffect(() => {
    const tutorialTimer = window.setTimeout(() => setTutorialVisible(false), 4600);
    return () => window.clearTimeout(tutorialTimer);
  }, []);

  const chooseUpgrade = (choice: UpgradeChoice) => {
    setUpgradeChoices(undefined);
    getActiveThreeGame()?.selectUpgrade(choice.id);
  };

  const revive = async () => {
    const earned = await AdService.showRewarded('revive');
    if (earned && getActiveThreeGame()?.revive()) setGameOver(undefined);
  };

  const hpPercent = snapshot.maxHp > 0 ? Math.max(0, Math.min(100, snapshot.hp / snapshot.maxHp * 100)) : 0;
  const xpPercent = snapshot.xpRequired > 0 ? Math.min(100, snapshot.xp / snapshot.xpRequired * 100) : 0;

  return <main className="game-screen"><div ref={gameRoot} className="three-root" />
    <div className="game-ui">
      <div className="game-topbar">
        <div className={`game-health${hpPercent < 30 ? ' game-health--low' : ''}`}>
          <div className="game-health__labels"><span><Heart size={14} fill="currentColor" /> HP</span><strong>{Math.ceil(snapshot.hp)} / {Math.ceil(snapshot.maxHp)}</strong></div>
          <div className="game-health__track"><i style={{ width: `${hpPercent}%` }} /></div>
        </div>
        <div className="game-timer"><span>{stage.id}</span><strong>{formatRunTime(snapshot.time)}</strong></div>
        <div className="game-actions">
          <div className="game-kills" aria-label={`${snapshot.kills} enemies defeated`}><Skull size={15} /><strong>{snapshot.kills.toLocaleString()}</strong></div>
          <button className="game-pause" onClick={() => { if (paused) getActiveThreeGame()?.resumeRun(); else getActiveThreeGame()?.pauseRun(); }} aria-label={paused ? 'Resume run' : 'Pause run'}>{paused ? <Play size={18} fill="currentColor" /> : <Pause size={18} fill="currentColor" />}</button>
        </div>
      </div>
      <div className="game-progress"><div className="game-progress__label"><span>LV {snapshot.level}</span></div><div className="game-progress__track"><i style={{ width: `${xpPercent}%` }} /></div></div>
      {snapshot.boss && <div className="boss-hud"><div><span><Shield size={13} /> {snapshot.boss.name}</span><strong>PHASE {snapshot.boss.phase}</strong></div><div className="boss-hud__track"><i style={{ width: `${Math.max(0, snapshot.boss.hp / snapshot.boss.maxHp * 100)}%` }} /></div></div>}
      {warning && <div className="boss-warning" role="status"><span className="boss-warning__skull"><Skull size={27} /></span><strong>BOSS</strong><strong>APPROACHING</strong><small>{stage.bossName} enters the graveyard</small></div>}
      {tutorialVisible && <div className="game-tip">MOVE WITH JOYSTICK <span aria-hidden="true">&middot;</span> AUTO ATTACK</div>}
    </div>
    <VirtualJoystick disabled={paused || Boolean(upgradeChoices) || Boolean(gameOver)} />
    {upgradeChoices && <LevelUpOverlay choices={upgradeChoices} onChoose={chooseUpgrade} />}
    {paused && !upgradeChoices && !gameOver && <div className="pause-overlay"><div className="pause-card"><div className="pause-card__icon"><Pause size={22} /></div><span className="eyebrow">RUN PAUSED</span><h1>Catch your breath.</h1><button onClick={() => getActiveThreeGame()?.resumeRun()}><Play size={17} fill="currentColor" /> RESUME</button><button className="pause-card__quit" onClick={onHome}><RotateCw size={16} /> EXIT RUN</button></div></div>}
    {gameOver && <GameOverScreen result={gameOver} onRevive={revive} onRetry={onRetry} onHome={onHome} />}
  </main>;
}

function LevelUpOverlay({ choices, onChoose }: { choices: UpgradeChoice[]; onChoose: (choice: UpgradeChoice) => void }) {
  return <div className="level-up-overlay"><div className="level-up-panel"><Sparkles className="level-up-panel__spark" size={20} aria-hidden="true" /><h1>Level Up!</h1><p>Choose an Upgrade</p><div className="choice-grid">{choices.map((choice) => <button type="button" key={choice.id} className={`choice-card choice-card--${choice.rarity}`} onClick={() => onChoose(choice)} aria-label={`${choice.title}: ${choice.nextEffect}`}><span className="choice-card__icon">{getChoiceIcon(choice)}</span><span className="choice-card__content"><span className="choice-card__kind">{choice.kind === 'weapon' ? 'WEAPON' : 'PASSIVE'}</span><strong>{choice.title}</strong><small>Lv {choice.level} <span aria-hidden="true">→</span> {Math.min(5, choice.level + 1)}</small><em>{choice.nextEffect}</em></span><span className="choice-card__rarity">{choice.rarity.toUpperCase()}</span></button>)}</div><div className="level-up-panel__footer"><span>Choose one power</span><button type="button" disabled><Dices size={16} /><span>REROLL</span><small>WATCH AD</small></button></div></div></div>;
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
