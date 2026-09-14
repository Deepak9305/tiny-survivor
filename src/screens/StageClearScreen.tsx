import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { formatTime } from './GameOverScreen';
import type { RunResult } from '../types';

interface StageClearScreenProps {
  result: RunResult;
  onNext: () => void;
  onReplay: () => void;
  onHome: () => void;
}

export function StageClearScreen({ result, onNext, onHome }: StageClearScreenProps) {
  const [coinsCount, setCoinsCount] = useState(0);
  const isFinalCampaign = result.stageId === '4-5';

  useEffect(() => {
    const started = performance.now();
    let frame = 0;
    const animate = (now: number) => {
      const progress = Math.min(1, (now - started) / 600);
      setCoinsCount(Math.round(result.coins * progress));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [result.coins]);

  return (
    <main className="stage-clear-screen">
      <div className="stage-clear-container">
        {/* 3 Golden Stars */}
        <div className="stage-clear-stars">
          <Star size={36} fill="#ffc83d" stroke="#ffe599" className="stage-clear-star" />
          <Star size={48} fill="#ffc83d" stroke="#ffe599" className="stage-clear-star stage-clear-star--center" />
          <Star size={36} fill="#ffc83d" stroke="#ffe599" className="stage-clear-star" />
        </div>

        {/* Title */}
        <h1 className="stage-clear-title">STAGE CLEAR</h1>

        {/* Stats Card */}
        <div className="stage-clear-stats-card">
          <div className="stage-clear-stat-row">
            <span className="stage-clear-stat-label">Time</span>
            <strong className="stage-clear-stat-val">{formatTime(result.time)}</strong>
          </div>
          <div className="stage-clear-stat-row">
            <span className="stage-clear-stat-label">Enemies</span>
            <strong className="stage-clear-stat-val">{result.kills}</strong>
          </div>
          <div className="stage-clear-stat-row">
            <span className="stage-clear-stat-label">Coins</span>
            <strong className="stage-clear-stat-val">+{coinsCount}</strong>
          </div>
        </div>

        {/* Action Button */}
        <div className="stage-clear-actions">
          <button
            type="button"
            className="stage-clear-btn"
            onClick={isFinalCampaign ? onHome : onNext}
          >
            {isFinalCampaign ? 'Return Home' : 'Next Stage'}
          </button>
        </div>
      </div>
    </main>
  );
}

