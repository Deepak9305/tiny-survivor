import { Coins, Heart, RotateCw, Skull, Swords } from 'lucide-react';
import { PrimaryButton } from '../components/PrimaryButton';
import type { RunResult } from '../types';

interface GameOverScreenProps { result: RunResult; onRevive: () => void; onRetry: () => void; onHome: () => void }

export function GameOverScreen({ result, onRevive, onRetry, onHome }: GameOverScreenProps) {
  return <section className="result-overlay result-overlay--loss"><div className="result-card"><div className="result-icon result-icon--loss"><Skull size={31} /></div><span className="eyebrow">RUN ENDED · STAGE {result.stageId}</span><h1>Game Over</h1><p>You survived {formatTime(result.time)} in this run.</p><div className="result-stats"><span><strong>{result.kills}</strong><small>Enemies defeated</small></span><span><strong>{result.coins}</strong><small>Coins earned</small></span><span><strong>Lv {result.highestLevel}</strong><small>Highest level</small></span></div><PrimaryButton variant="blue" wide onClick={onRevive}><Heart size={18} fill="currentColor" /> REVIVE <small>WATCH AD</small></PrimaryButton><div className="result-actions"><PrimaryButton variant="gold" onClick={onRetry}><RotateCw size={17} /> RETRY</PrimaryButton><PrimaryButton variant="ghost" onClick={onHome}><Swords size={17} /> HOME</PrimaryButton></div><div className="result-disclaimer"><Coins size={13} /> Rewarded ads are optional · one revive per run</div></div></section>;
}

export function formatTime(seconds: number): string { return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`; }
