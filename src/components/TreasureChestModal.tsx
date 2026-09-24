import React, { useEffect } from 'react';
import {
  Award,
  BookOpen,
  Check,
  Compass,
  Coins,
  Dices,
  Flame,
  Gem,
  Heart,
  Shield,
  Sparkles,
  Swords,
  Target,
  Wind,
  Zap,
} from 'lucide-react';
import type { ChestReward, UpgradeChoice } from '../types';
import { audioService } from '../services/audioService';

interface TreasureChestModalProps {
  rewards: ChestReward;
  onClaim: () => void;
}

export function TreasureChestModal({ rewards, onClaim }: TreasureChestModalProps) {
  useEffect(() => {
    audioService.playSFX('chest-open', { volume: 1.0 });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        onClaim();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClaim]);

  return (
    <div className="chest-modal-overlay" role="dialog" aria-modal="true" aria-label="Treasure Chest Rewards">
      <div className="chest-modal-backdrop" />

      <div className="chest-modal-card">
        {/* Shimmering Sunburst Rays */}
        <div className="chest-modal-rays" aria-hidden="true" />

        <div className="chest-modal-header">
          <div className="chest-modal-badge">
            <Sparkles size={32} className="chest-modal-badge__icon" />
          </div>
          <span className="chest-modal-eyebrow">SHINY LOOT DROP! ⭐</span>
          <h2 className="chest-modal-title">TREASURE OPENED! 🎁</h2>
          <p className="chest-modal-sub">
            The vanquished mob dropped delicious upgrades and shiny riches:
          </p>
        </div>

        {/* Upgrade Cards Granted */}
        {rewards.upgrades.length > 0 && (
          <div className="chest-upgrades-grid">
            {rewards.upgrades.map((upgrade, idx) => {
              const rarity = upgrade.rarity || 'rare';
              return (
                <div key={`${upgrade.id}-${idx}`} className={`chest-reward-card chest-reward-card--${rarity}`}>
                  <div className="chest-reward-card__icon-box">
                    {getUpgradeIcon(upgrade)}
                  </div>
                  <div className="chest-reward-card__details">
                    <div className="chest-reward-card__top">
                      <span className={`chest-rarity-tag chest-rarity-tag--${rarity}`}>
                        {rarity.toUpperCase()}
                      </span>
                      <strong className="chest-reward-card__name">{upgrade.title}</strong>
                    </div>
                    <div className="chest-reward-card__tier">
                      <span>UPGRADED:</span>
                      <strong className="text-gold">Lv. {upgrade.level} ➔ Lv. {upgrade.level + 1}</strong>
                    </div>
                    <p className="chest-reward-card__effect">{upgrade.nextEffect}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Currency Piles */}
        <div className="chest-currency-row">
          {rewards.coins > 0 && (
            <div className="chest-currency-pill chest-currency-pill--gold">
              <Coins size={18} className="text-gold" />
              <span>+{rewards.coins} Gold</span>
            </div>
          )}
          {rewards.gems > 0 && (
            <div className="chest-currency-pill chest-currency-pill--gem">
              <Gem size={18} className="text-cyan" />
              <span>+{rewards.gems} {rewards.gems === 1 ? 'Gem' : 'Gems'}</span>
            </div>
          )}
        </div>

        {/* Claim Action */}
        <div className="chest-modal-footer">
          <button
            type="button"
            className="chest-claim-btn"
            onClick={() => {
              audioService.playSFX('upgrade', { pitch: 1.1 });
              onClaim();
            }}
          >
            <Check size={20} />
            <span>CLAIM TREASURE</span>
            <kbd className="chest-key-hint">[SPACE]</kbd>
          </button>
        </div>
      </div>
    </div>
  );
}

function getUpgradeIcon(choice: UpgradeChoice) {
  const id = choice.id.toLowerCase();
  if (id.includes('fire')) return <Flame size={26} />;
  if (id.includes('blades') || id.includes('sword') || id.includes('slash')) return <Swords size={26} />;
  if (id.includes('bolt') || id.includes('lightning') || id.includes('shock') || id.includes('zap')) return <Zap size={26} />;
  if (id.includes('vitality') || id.includes('heal') || id.includes('hp')) return <Heart size={26} />;
  if (id.includes('armor') || id.includes('shield') || id.includes('barrier')) return <Shield size={26} />;
  if (id.includes('power') || id.includes('might') || id.includes('orb')) return <Sparkles size={26} />;
  if (id.includes('speed') || id.includes('boots') || id.includes('swift')) return <Wind size={26} />;
  if (id.includes('magnet') || id.includes('compass')) return <Compass size={26} />;
  if (id.includes('luck') || id.includes('crit')) return <Dices size={26} />;
  if (id.includes('book') || id.includes('tome') || id.includes('growth')) return <BookOpen size={26} />;
  return <Target size={26} />;
}
