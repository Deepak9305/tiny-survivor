import { Heart, Home, Play, RotateCw, Skull, Sparkles, Timer } from 'lucide-react';
import { PrimaryButton } from '../components/PrimaryButton';
import type { RunResult } from '../types';

interface GameOverScreenProps {
  result: RunResult;
  onRevive: () => void;
  reviveLoading?: boolean;
  reviveMessage?: string;
  onRetry: () => void;
  onHome: () => void;
}

export function formatTime(seconds: number): string {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}

export function GameOverScreen({
  result,
  onRevive,
  reviveLoading = false,
  reviveMessage,
  onRetry,
  onHome,
}: GameOverScreenProps) {
  return (
    <section className="result-overlay-landscape result-overlay--loss">
      <div className="run-over-container-landscape">
        {/* Left ~45%: Defeat Diorama / World Art */}
        <div className="run-over-left-diorama">
          <div className="run-over-skull-glow">
            <Skull size={56} className="skull-danger-icon" />
          </div>
          <h1 className="run-over-title">DEFEATED</h1>
          <p className="run-over-tagline">Your soul returns to the sanctuary...</p>
        </div>

        {/* Right ~55%: Stats & Actions */}
        <div className="run-over-right-stats">
          <div className="run-over-stats-grid">
            <div className="run-over-stat-card">
              <span className="run-over-stat-label">
                <Timer size={14} /> TIME SURVIVED
              </span>
              <strong className="run-over-stat-val">{formatTime(result.time)}</strong>
            </div>

            <div className="run-over-stat-card">
              <span className="run-over-stat-label">
                <Skull size={14} /> FOES SLAIN
              </span>
              <strong className="run-over-stat-val">{result.kills.toLocaleString()}</strong>
            </div>

            <div className="run-over-stat-card">
              <span className="run-over-stat-label">
                <Sparkles size={14} /> LEVEL REACHED
              </span>
              <strong className="run-over-stat-val">Lv. {result.highestLevel}</strong>
            </div>

            <div className="run-over-stat-card">
              <span className="run-over-stat-label">
                <Heart size={14} /> COINS COLLECTED
              </span>
              <strong className="run-over-stat-val">+{result.coins.toLocaleString()}</strong>
            </div>
          </div>

          <div className="run-over-actions-landscape">
            <button
              type="button"
              className="run-over-btn run-over-btn--revive"
              onClick={onRevive}
              disabled={reviveLoading}
            >
              <Play size={18} fill="currentColor" />
              <span>{reviveLoading ? 'Loading Ad...' : 'REVIVE WITH AD'}</span>
            </button>

            <button
              type="button"
              className="run-over-btn run-over-btn--retry"
              onClick={onRetry}
            >
              <RotateCw size={16} />
              <span>RETRY</span>
            </button>

            <button
              type="button"
              className="run-over-btn run-over-btn--home"
              onClick={onHome}
            >
              <Home size={16} />
              <span>SANCTUARY</span>
            </button>
          </div>

          {reviveMessage && (
            <p className="result-ad-message" role="status">
              {reviveMessage}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
