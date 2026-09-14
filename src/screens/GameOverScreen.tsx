import { Heart, Home, Play, RotateCw } from 'lucide-react';
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

export function GameOverScreen({
  result,
  onRevive,
  reviveLoading = false,
  reviveMessage,
  onRetry,
  onHome,
}: GameOverScreenProps) {
  return (
    <section className="result-overlay result-overlay--loss">
      <div className="run-over-container">
        <h1 className="run-over-title">RUN OVER</h1>

        <div className="run-over-stats-card">
          <div className="run-over-stat-row">
            <span className="run-over-stat-label">Time Survived</span>
            <strong className="run-over-stat-val">{formatTime(result.time)}</strong>
          </div>
          <div className="run-over-stat-row">
            <span className="run-over-stat-label">Enemies Killed</span>
            <strong className="run-over-stat-val">{result.kills}</strong>
          </div>
          <div className="run-over-stat-row">
            <span className="run-over-stat-label">Level Reached</span>
            <strong className="run-over-stat-val">{result.highestLevel}</strong>
          </div>
          <div className="run-over-stat-row">
            <span className="run-over-stat-label">Coins Earned</span>
            <strong className="run-over-stat-val">{result.coins}</strong>
          </div>
        </div>

        <div className="run-over-actions">
          <button
            type="button"
            className="run-over-btn run-over-btn--revive"
            onClick={onRevive}
            disabled={reviveLoading}
          >
            <Play size={18} fill="currentColor" /> {reviveLoading ? 'Loading...' : 'Revive'}
          </button>

          <button
            type="button"
            className="run-over-btn run-over-btn--retry"
            onClick={onRetry}
          >
            Retry
          </button>

          <button
            type="button"
            className="run-over-btn run-over-btn--home"
            onClick={onHome}
          >
            Home
          </button>
        </div>

        {reviveMessage && (
          <p className="result-ad-message" role="status">
            {reviveMessage}
          </p>
        )}
      </div>
    </section>
  );
}

export function formatTime(seconds: number): string {
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${String(
    Math.floor(seconds % 60)
  ).padStart(2, '0')}`;
}

