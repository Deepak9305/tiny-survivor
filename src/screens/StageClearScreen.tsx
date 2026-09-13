import { Check, Coins, Gem, Home, Play, Star, Trophy } from 'lucide-react';
import { PrimaryButton } from '../components/PrimaryButton';
import { formatTime } from './GameOverScreen';
import type { RunResult } from '../types';

interface StageClearScreenProps { result: RunResult; onNext: () => void; onReplay: () => void; onHome: () => void }

export function StageClearScreen({ result, onNext, onReplay, onHome }: StageClearScreenProps) {
  return <main className="result-page result-page--clear"><div className="result-page__stars"><Star size={39} fill="currentColor" /><Star size={58} fill="currentColor" /><Star size={39} fill="currentColor" /></div><span className="eyebrow">WORLD 1 · {result.stageName.toUpperCase()}</span><h1>Stage Clear!</h1><p className="result-page__sub">The graveyard is quiet. For now.</p><section className="clear-stats"><span><Trophy size={16} /><strong>{formatTime(result.time)}</strong><small>Time</small></span><span><Check size={16} /><strong>{result.kills}</strong><small>Defeated</small></span><span><Coins size={16} /><strong>+{result.coins}</strong><small>Coins earned</small></span></section><section className="clear-reward"><span><Gem size={18} /> FIRST CLEAR REWARD</span><strong>+50</strong><small>GEMS</small></section><div className="result-page__actions"><PrimaryButton variant="green" wide onClick={onNext}><Play size={18} fill="currentColor" /> NEXT STAGE</PrimaryButton><PrimaryButton variant="gold" wide onClick={onReplay}>REPLAY STAGE</PrimaryButton><PrimaryButton variant="blue" wide onClick={onHome}><Home size={17} /> HOME</PrimaryButton></div></main>;
}
