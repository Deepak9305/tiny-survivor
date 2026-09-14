import { useEffect, useState } from 'react';
import { Award, Coins, Home, Play, RotateCw, Skull, Sparkles, Star, Timer } from 'lucide-react';
import { formatTime } from './GameOverScreen';
import type { RunResult } from '../types';

interface StageClearScreenProps {
  result: RunResult;
  onNext: () => void;
  onReplay: () => void;
  onHome: () => void;
}

export function StageClearScreen({ result, onNext, onReplay, onHome }: StageClearScreenProps) {
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
    <main className="stage-clear-landscape-screen">
      <div className="stage-clear-landscape-container">
        {/* Left ~45%: Victory Presentation */}
        <div className="stage-clear-left-victory">
          <div className="stage-clear-stars-row">
            <Star size={34} fill="#ffc83d" stroke="#ffe599" className="stage-clear-star" />
            <Star size={46} fill="#ffc83d" stroke="#ffe599" className="stage-clear-star stage-clear-star--center" />
            <Star size={34} fill="#ffc83d" stroke="#ffe599" className="stage-clear-star" />
          </div>

          <span className="eyebrow victory-eyebrow">VICTORY ACHIEVED</span>
          <h1 className="stage-clear-title">STAGE CLEAR</h1>
          <p className="stage-clear-sub">The darkness recedes before your power.</p>
        </div>

        {/* Right ~55%: Stats & CTAs */}
        <div className="stage-clear-right-stats">
          <div className="stage-clear-stats-grid">
            <div className="stage-clear-stat-box">
              <span className="stat-label">
                <Timer size={14} /> CLEAR TIME
              </span>
              <strong className="stat-val">{formatTime(result.time)}</strong>
            </div>

            <div className="stage-clear-stat-box">
              <span className="stat-label">
                <Skull size={14} /> KILLS
              </span>
              <strong className="stat-val">{result.kills.toLocaleString()}</strong>
            </div>

            <div className="stage-clear-stat-box">
              <span className="stat-label">
                <Sparkles size={14} /> LEVEL
              </span>
              <strong className="stat-val">Lv. {result.highestLevel}</strong>
            </div>

            <div className="stage-clear-stat-box stage-clear-stat-box--reward">
              <span className="stat-label">
                <Coins size={14} /> GOLD EARNED
              </span>
              <strong className="stat-val text-gold">+{coinsCount.toLocaleString()}</strong>
            </div>
          </div>

          <div className="stage-clear-actions-landscape">
            <button
              type="button"
              className="stage-clear-btn stage-clear-btn--primary"
              onClick={isFinalCampaign ? onHome : onNext}
            >
              <Play size={18} fill="currentColor" />
              <span>{isFinalCampaign ? 'RETURN HOME' : 'NEXT STAGE'}</span>
            </button>

            <button
              type="button"
              className="stage-clear-btn stage-clear-btn--secondary"
              onClick={onReplay}
            >
              <RotateCw size={16} />
              <span>REPLAY</span>
            </button>

            <button
              type="button"
              className="stage-clear-btn stage-clear-btn--secondary"
              onClick={onHome}
            >
              <Home size={16} />
              <span>SANCTUARY</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
