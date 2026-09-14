import { useEffect, useState } from 'react';
import { ArrowRight, Clock3, Coins, Home, Play, RotateCw, Skull, Star, Zap } from 'lucide-react';
import { PrimaryButton } from '../components/PrimaryButton';
import { formatTime } from './GameOverScreen';
import type { RunResult } from '../types';

interface StageClearScreenProps { result: RunResult; onNext: () => void; onReplay: () => void; onHome: () => void }

export function StageClearScreen({ result, onNext, onReplay, onHome }: StageClearScreenProps) {
  const [rewardCount, setRewardCount] = useState(0);
  useEffect(() => {
    const started = performance.now();
    let frame = 0;
    const animate = (now: number) => {
      const progress = Math.min(1, (now - started) / 620);
      setRewardCount(Math.round(result.coins * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [result.coins]);

  return <main className="result-page result-page--clear"><div className="result-page__stars"><Star size={39} fill="currentColor" /><Star size={58} fill="currentColor" /><Star size={39} fill="currentColor" /></div><span className="eyebrow">STAGE {result.stageId} · {result.stageName.toUpperCase()}</span><h1>Stage Clear!</h1><p className="result-page__sub">Run complete. Your rewards are ready.</p><section className="clear-stats"><span><Clock3 size={16} /><strong>{formatTime(result.time)}</strong><small>Time</small></span><span><Skull size={16} /><strong>{result.kills}</strong><small>Enemies defeated</small></span><span><Zap size={16} /><strong>Lv {result.highestLevel}</strong><small>Highest level</small></span></section><section className="clear-reward"><span><Coins size={18} /> RUN REWARD</span><strong>+{rewardCount}</strong><small>COINS</small></section><div className="result-page__actions"><PrimaryButton variant="gold" wide onClick={onNext}><Play size={18} fill="currentColor" /> NEXT STAGE <ArrowRight size={17} /></PrimaryButton><PrimaryButton variant="blue" wide onClick={onReplay}><RotateCw size={17} /> REPLAY STAGE</PrimaryButton><PrimaryButton variant="ghost" wide onClick={onHome}><Home size={17} /> HOME</PrimaryButton></div></main>;
}
