import { useEffect, useState } from 'react';
import { Coins, Flame, Home, Play, RotateCw, Shield, Skull, Sparkles, Star, Timer } from 'lucide-react';
import { formatTime } from './GameOverScreen';
import { ABILITY_DEFINITIONS } from '../data/abilities';
import { getEquipmentDefinition } from '../data/equipment';
import { isLastCampaignStage } from '../data/stages';
import type { AbilityId, EquipmentId, RunResult } from '../types';

interface StageClearScreenProps {
  result: RunResult;
  newlyUnlockedAbilities?: AbilityId[];
  unlockedSurvival?: boolean;
  unlockedEquipment?: EquipmentId;
  onNext: () => void;
  onReplay: () => void;
  onHome: () => void;
}

export function StageClearScreen({
  result,
  newlyUnlockedAbilities = [],
  unlockedSurvival = false,
  unlockedEquipment,
  onNext,
  onReplay,
  onHome,
}: StageClearScreenProps) {
  const [coinsCount, setCoinsCount] = useState(0);
  const isFinalCampaign = isLastCampaignStage(result.stageId);
  const unlockedAbilityId = newlyUnlockedAbilities[0];
  const unlockedAbility = unlockedAbilityId ? ABILITY_DEFINITIONS[unlockedAbilityId] : undefined;
  const eqDef = unlockedEquipment ? getEquipmentDefinition(unlockedEquipment) : undefined;

  const hasAnyUnlocks = Boolean(unlockedAbility || unlockedSurvival || eqDef);

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

          {/* Multi-unlock Cards / Chips */}
          {hasAnyUnlocks && (
            <div className="stage-clear-unlocks-container">
              <span className="eyebrow unlocks-eyebrow">NEW UNLOCKS</span>

              {unlockedAbility && (
                <div className={`stage-clear-ability-reward ability-reward--${unlockedAbility.id}`}>
                  <div className="ability-reward__badge">NEW ABILITY UNLOCKED</div>
                  <div className="ability-reward__content">
                    <div className="ability-reward__icon" aria-hidden="true">{unlockedAbility.icon}</div>
                    <div className="ability-reward__details">
                      <strong className="ability-reward__name">{unlockedAbility.name}</strong>
                      <span className="ability-reward__desc">{unlockedAbility.description}</span>
                    </div>
                  </div>
                </div>
              )}

              {unlockedSurvival && (
                <div className="stage-clear-survival-reward">
                  <Flame size={20} className="survival-reward__icon" />
                  <div className="survival-reward__details">
                    <strong className="survival-reward__name">SURVIVAL MODE UNLOCKED</strong>
                    <span className="survival-reward__desc">Face infinite escalating hordes in endless combat!</span>
                  </div>
                </div>
              )}

              {eqDef && (
                <div className="stage-clear-equipment-reward">
                  <span className="equipment-reward__icon">{eqDef.icon}</span>
                  <div className="equipment-reward__details">
                    <div className="equipment-reward__header">
                      <strong className="equipment-reward__name">{eqDef.name}</strong>
                      <span className={`item-rarity-badge item-rarity--${eqDef.rarity}`}>
                        {eqDef.rarity.toUpperCase()}
                      </span>
                    </div>
                    <span className="equipment-reward__desc">{eqDef.shortEffect}</span>
                  </div>
                </div>
              )}
            </div>
          )}
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
