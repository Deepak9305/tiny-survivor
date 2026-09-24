import { useEffect, useState } from 'react';
import { Coins, Flame, Home, Play, RotateCw, Skull, Sparkles, Star, Timer } from 'lucide-react';
import { EquipmentIcon } from '../components/EquipmentIcon';
import { formatTime } from './GameOverScreen';
import { ABILITY_DEFINITIONS } from '../data/abilities';
import { getEquipmentDefinition } from '../data/equipment';
import { isLastCampaignStage } from '../data/stages';
import { audioService } from '../services/audioService';
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

const GOOFY_VICTORY_QUOTES = [
  'Absolute Cinema! You clobbered every monster! 🎬',
  'You sent those monsters straight to bed! 🛏️',
  'Giga Chad performance! Trophy unlocked! 🗿',
  '1000/10 Star Player! Pure bonking excellence! 🌟',
  'Those monsters will need ice packs for a week! 🧊',
  'Certified Brawler of the Year! 🏆',
];

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
  const [victoryQuote] = useState(() => GOOFY_VICTORY_QUOTES[Math.floor(Math.random() * GOOFY_VICTORY_QUOTES.length)]);
  const isFinalCampaign = isLastCampaignStage(result.stageId);
  const unlockedAbilityId = newlyUnlockedAbilities[0];
  const unlockedAbility = unlockedAbilityId ? ABILITY_DEFINITIONS[unlockedAbilityId] : undefined;
  const eqDef = unlockedEquipment ? getEquipmentDefinition(unlockedEquipment) : undefined;
  const hasAnyUnlocks = Boolean(unlockedAbility || unlockedSurvival || eqDef);

  useEffect(() => {
    audioService.playSFX('fanfare', { volume: 0.9, throttle: 0.3 });
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
        <div className="stage-clear-left-victory">
          <div className="stage-clear-stars-row" aria-hidden="true">
            <Star size={34} fill="#ffc83d" stroke="#ffe599" className="stage-clear-star" />
            <Star size={46} fill="#ffc83d" stroke="#ffe599" className="stage-clear-star stage-clear-star--center" />
            <Star size={34} fill="#ffc83d" stroke="#ffe599" className="stage-clear-star" />
          </div>
          <span className="eyebrow victory-eyebrow">BRAWL-TASTIC VICTORY! 👑</span>
          <h1 className="stage-clear-title">STAR PLAYER!</h1>
          <p className="stage-clear-sub">{victoryQuote}</p>

          {hasAnyUnlocks && (
            <div className="stage-clear-unlocks-container">
              <span className="eyebrow unlocks-eyebrow">NEW BRAWL UNLOCKS! ⭐</span>

              {unlockedAbility && (
                <div className={`stage-clear-ability-reward ability-reward--${unlockedAbility.id}`}>
                  <div className="ability-reward__badge">NEW ABILITY</div>
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
                    <strong className="survival-reward__name">SURVIVAL SHOWDOWN UNLOCKED</strong>
                    <span className="survival-reward__desc">Endless escalating hordes are ready to brawl.</span>
                  </div>
                </div>
              )}

              {eqDef && (
                <div className="stage-clear-equipment-reward">
                  <div className="equipment-reward__icon"><EquipmentIcon id={eqDef.id} size={24} /></div>
                  <div className="equipment-reward__details">
                    <div className="equipment-reward__header">
                      <strong className="equipment-reward__name">{eqDef.name}</strong>
                      <span className={`item-rarity-badge item-rarity--${eqDef.rarity}`}>{eqDef.rarity.toUpperCase()}</span>
                    </div>
                    <span className="equipment-reward__desc">{eqDef.shortEffect}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="stage-clear-right-stats">
          <div className="stage-clear-stats-grid">
            <ResultStat icon={<Timer size={14} />} label="CLEAR TIME" value={formatTime(result.time)} />
            <ResultStat icon={<Skull size={14} />} label="KNOCKOUTS" value={result.kills.toLocaleString()} />
            <ResultStat icon={<Sparkles size={14} />} label="BRAWLER LEVEL" value={`Lv. ${result.highestLevel}`} />
            <ResultStat icon={<Coins size={14} />} label="COINS EARNED" value={`+${coinsCount.toLocaleString()}`} reward />
          </div>

          <div className="stage-clear-actions-landscape">
            <button type="button" className="stage-clear-btn stage-clear-btn--primary" onClick={isFinalCampaign ? onHome : onNext}>
              <Play size={18} fill="currentColor" />
              <span>{isFinalCampaign ? 'RETURN HOME' : 'NEXT BRAWL! ⚔️'}</span>
            </button>
            <button type="button" className="stage-clear-btn stage-clear-btn--secondary" onClick={onReplay}>
              <RotateCw size={16} /><span>BRAWL AGAIN! 🔄</span>
            </button>
            <button type="button" className="stage-clear-btn stage-clear-btn--secondary" onClick={onHome}>
              <Home size={16} /><span>LOBBY</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function ResultStat({ icon, label, value, reward = false }: { icon: React.ReactNode; label: string; value: string; reward?: boolean }) {
  return (
    <div className={`stage-clear-stat-box ${reward ? 'stage-clear-stat-box--reward' : ''}`}>
      <span className="stat-label">{icon} {label}</span>
      <strong className={`stat-val ${reward ? 'text-gold' : ''}`}>{value}</strong>
    </div>
  );
}
