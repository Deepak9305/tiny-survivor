import { useEffect } from 'react';
import {
  Award,
  BookOpen,
  Check,
  Compass,
  Dices,
  Flame,
  Heart,
  Shield,
  Sparkles,
  Swords,
  Target,
  Wind,
  Zap,
} from 'lucide-react';
import type { UpgradeChoice } from '../types';
import { audioService } from '../services/audioService';

interface LevelUpOverlayProps {
  choices: UpgradeChoice[];
  playerLevel: number;
  onChoose: (choice: UpgradeChoice) => void;
}

export function LevelUpOverlay({ choices, playerLevel, onChoose }: LevelUpOverlayProps) {
  useEffect(() => {
    audioService.playSFX('level-up', { volume: 0.9, throttle: 0.2 });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1' && choices[0]) onChoose(choices[0]);
      else if (e.key === '2' && choices[1]) onChoose(choices[1]);
      else if (e.key === '3' && choices[2]) onChoose(choices[2]);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [choices, onChoose]);

  return (
    <div className="level-up-overlay" role="dialog" aria-modal="true" aria-label="Level Up Power Selection">
      {/* Ambient background particles & radial aura */}
      <div className="level-up-overlay__backdrop" />

      <div className="level-up-modal">
        {/* Divine Header Banner */}
        <div className="level-up-modal__header">
          <div className="level-up-crest">
            <span className="level-up-crest__wing level-up-crest__wing--left">✦</span>
            <div className="level-up-crest__badge">
              <Award size={26} className="level-up-crest__icon" />
            </div>
            <span className="level-up-crest__wing level-up-crest__wing--right">✦</span>
          </div>

          <span className="level-up-eyebrow">SANCTUARY BLESSING · TACTICAL ASCENSION</span>
          <h1 className="level-up-heading">
            LEVEL UP! <span className="text-gold">REACHED LV. {playerLevel}</span>
          </h1>
          <p className="level-up-instruction">
            Select 1 of {choices.length} divine powers to infuse into your arsenal
          </p>
        </div>

        {/* 3 Skill Choice Cards */}
        <div className="level-up-choices-grid">
          {choices.map((choice, index) => {
            const rarity = choice.rarity || 'common';
            const isNew = choice.level === 0;

            return (
              <button
                type="button"
                key={choice.id}
                className={`power-card power-card--${rarity} power-card--${choice.kind}`}
                onClick={() => onChoose(choice)}
                aria-label={`${choice.title}: ${choice.nextEffect}`}
              >
                {/* Rarity & Kind Header Pill */}
                <div className="power-card__topbar">
                  <span className={`power-rarity-pill power-rarity-pill--${rarity}`}>
                    <Sparkles size={11} />
                    {rarity.toUpperCase()}
                  </span>
                  <span className="power-kind-pill">
                    {choice.kind === 'weapon'
                      ? '✦ WEAPON'
                      : choice.kind === 'ability'
                      ? '⚡ SPECIAL'
                      : '🛡 PASSIVE'}
                  </span>
                </div>

                {/* Concentric Glowing 3D Medallion */}
                <div className={`power-card__medallion power-card__medallion--${rarity}`}>
                  <div className="power-medallion-inner">
                    {getUpgradeIcon(choice)}
                  </div>
                  <div className="power-medallion-ring" />
                </div>

                {/* Title & Level Progression */}
                <div className="power-card__identity">
                  <h3 className="power-card__title">{choice.title}</h3>
                  <div className="power-card__progress">
                    {isNew ? (
                      <span className="power-badge-new">★ NEW UNLOCK</span>
                    ) : (
                      <div className="power-level-info">
                        <span className="power-level-transition">
                          Lv. {choice.level} ➔ <strong>Lv. {choice.level + 1}</strong>
                        </span>
                        <div className="power-pips-bar">
                          {[1, 2, 3, 4, 5].map((pip) => (
                            <span
                              key={pip}
                              className={`power-pip ${
                                pip <= choice.level + 1
                                  ? pip === choice.level + 1
                                    ? 'power-pip--next'
                                    : 'power-pip--filled'
                                  : 'power-pip--empty'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Highlighted Stat Callout */}
                <div className="power-card__effect-box">
                  <span className="effect-box__label">NEXT TIER BONUS</span>
                  <strong className="effect-box__value">{choice.nextEffect}</strong>
                </div>

                {/* Flavor / Description */}
                <p className="power-card__description">{choice.description}</p>

                {/* Bottom Choose Action Button */}
                <div className="power-card__action">
                  <span className="power-card__select-btn">
                    <Check size={16} />
                    <span>SELECT POWER</span>
                    <kbd className="power-card__key-hint">[{index + 1}]</kbd>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function getUpgradeIcon(choice: UpgradeChoice) {
  const id = choice.id.toLowerCase();
  if (id.includes('fire')) return <Flame size={32} />;
  if (id.includes('blades') || id.includes('sword') || id.includes('slash')) return <Swords size={32} />;
  if (id.includes('bolt') || id.includes('lightning') || id.includes('shock') || id.includes('zap')) return <Zap size={32} />;
  if (id.includes('vitality') || id.includes('heal') || id.includes('hp')) return <Heart size={32} />;
  if (id.includes('armor') || id.includes('shield') || id.includes('barrier')) return <Shield size={32} />;
  if (id.includes('power') || id.includes('might') || id.includes('orb')) return <Sparkles size={32} />;
  if (id.includes('speed') || id.includes('boots') || id.includes('swift')) return <Wind size={32} />;
  if (id.includes('magnet') || id.includes('compass')) return <Compass size={32} />;
  if (id.includes('luck') || id.includes('crit')) return <Dices size={32} />;
  if (id.includes('book') || id.includes('tome') || id.includes('growth')) return <BookOpen size={32} />;
  return <Target size={32} />;
}
