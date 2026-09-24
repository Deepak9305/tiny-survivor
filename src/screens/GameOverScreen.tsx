import { useEffect, useState } from 'react';
import { Heart, Home, Play, RotateCw, Skull, Sparkles, Timer } from 'lucide-react';
import { audioService } from '../services/audioService';
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

const GOOFY_DEFEAT_QUOTES = [
  'Did you try turning it off and on again? 🔌',
  'The floor looked super comfy anyway. 😴',
  '10/10 graceful flop! Solid form! 🤸',
  'Bonk counter reached maximum capacity! 🔨',
  'Emotional damage: 9999 📉',
  'Skill issue? Never heard of her. 💅',
  'Sent directly to the Shadow Realm! 👻',
  'That wasn\'t a defeat, that was tactical resting! 🛋️',
];

export function GameOverScreen({
  result,
  onRevive,
  reviveLoading = false,
  reviveMessage,
  onRetry,
  onHome,
}: GameOverScreenProps) {
  const [defeatQuote] = useState(() => GOOFY_DEFEAT_QUOTES[Math.floor(Math.random() * GOOFY_DEFEAT_QUOTES.length)]);

  useEffect(() => {
    audioService.playSFX('wah-wah', { volume: 0.9, throttle: 0.3 });
  }, []);

  return (
    <section className="result-overlay-landscape result-overlay--loss" role="dialog" aria-modal="true" aria-label="Game Over Defeat">
      <div className="run-over-container-landscape">
        {/* Left ~42%: Defeat Diorama */}
        <div className="run-over-left-diorama">
          <div className="run-over-skull-glow">
            <Skull size={52} className="skull-danger-icon" />
          </div>
          <span className="run-over-eyebrow">OOPS! YOU GOT BONKED! 💥</span>
          <h1 className="run-over-title">KNOCKED OUT!</h1>
          {result.isNewBest && (
            <div className="run-over-new-best-badge">
              <Sparkles size={14} /> NEW TROPHY RECORD! 🏆
            </div>
          )}
          <p className="run-over-tagline">{defeatQuote}</p>
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
                <Skull size={14} /> BRAWL KNOCKOUTS
              </span>
              <strong className="run-over-stat-val">{result.kills.toLocaleString()}</strong>
            </div>

            <div className="run-over-stat-card">
              <span className="run-over-stat-label">
                <Sparkles size={14} /> BRAWLER LEVEL
              </span>
              <strong className="run-over-stat-val">Lv. {result.highestLevel}</strong>
            </div>

            <div className="run-over-stat-card">
              <span className="run-over-stat-label">
                <Heart size={14} /> COINS EARNED
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
              <span>{reviveLoading ? 'Loading Ad...' : 'ONE MORE CHANCE! 🎬'}</span>
            </button>

            <button
              type="button"
              className="run-over-btn run-over-btn--retry"
              onClick={onRetry}
            >
              <RotateCw size={16} />
              <span>BRAWL AGAIN! 🔄</span>
            </button>

            <button
              type="button"
              className="run-over-btn run-over-btn--home"
              onClick={onHome}
            >
              <Home size={16} />
              <span>LOBBY</span>
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
