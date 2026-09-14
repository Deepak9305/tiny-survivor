import { Coins, ChevronLeft, Gem, Heart, Magnet, Move, Shield, Sparkles, Swords, Zap } from 'lucide-react';
import { getPermanentUpgradeCost } from '../data/balance';
import type { SaveData } from '../types';

interface UpgradesScreenProps {
  save: SaveData;
  onBack: () => void;
  onUpgrade: (id: string) => void;
}

const upgrades = [
  { id: 'maxHp', title: 'Max Health', desc: '+12% HP per rank', icon: Heart, iconColor: 'green' },
  { id: 'damage', title: 'Damage Output', desc: '+10% All weapons per rank', icon: Swords, iconColor: 'blue' },
  { id: 'moveSpeed', title: 'Move Speed', desc: '+6% Base speed per rank', icon: Move, iconColor: 'orange' },
  { id: 'magnet', title: 'Pickup Magnet', desc: '+20 Radius per rank', icon: Magnet, iconColor: 'purple' },
  { id: 'armor', title: 'Iron Armor', desc: '+7% Damage mitigation', icon: Shield, iconColor: 'cyan' },
  { id: 'critChance', title: 'Precision Sight', desc: '+2.5% Critical strike', icon: Zap, iconColor: 'gold' },
];

export function UpgradesScreen({ save, onBack, onUpgrade }: UpgradesScreenProps) {
  const totalRanks = Object.values(save.permanentUpgrades).reduce((a, b) => a + (b ?? 0), 0);
  const powerRating = Math.round(100 + totalRanks * 15);

  return (
    <main className="meta-screen upgrades-landscape-screen">
      <header className="upgrades-header">
        <button type="button" className="codex-back-btn" onClick={onBack} aria-label="Back">
          <ChevronLeft size={24} />
        </button>
        <h1 className="upgrades-title">PERMANENT TALENTS</h1>
        <div className="upgrades-currency-row">
          <span className="currency-pill currency-pill--gold">
            <Coins size={15} /> {save.coins.toLocaleString()}
          </span>
          <span className="currency-pill currency-pill--gem">
            <Gem size={14} /> {save.gems}
          </span>
        </div>
      </header>

      <div className="upgrades-landscape-body">
        {/* Left Column ~30%: Hero Power Summary */}
        <aside className="upgrades-summary-card">
          <div className="upgrades-summary-icon">
            <Sparkles size={32} />
          </div>
          <span className="eyebrow">SANCTUARY FORGE</span>
          <h2>Survivor Power</h2>
          <div className="upgrades-power-score">
            <strong>{powerRating}</strong>
            <small>RATING</small>
          </div>
          <p className="upgrades-summary-desc">
            Talents permanently enhance Shadow across every world and run.
          </p>
          <div className="upgrades-summary-stat">
            <span>Invested Ranks:</span>
            <strong>{totalRanks} / 30</strong>
          </div>
        </aside>

        {/* Right Column ~70%: Upgrades Grid */}
        <section className="upgrades-grid-landscape">
          {upgrades.map((item) => {
            const Icon = item.icon;
            const level = save.permanentUpgrades[item.id] ?? 0;
            const cost = getPermanentUpgradeCost(item.id, level);
            const maxed = level >= 5;
            const affordable = save.coins >= cost;

            return (
              <div key={item.id} className={`upgrade-card-clean ${maxed ? 'is-maxed' : ''}`}>
                <div className={`upgrade-icon-box upgrade-icon-box--${item.iconColor}`}>
                  <Icon size={22} />
                </div>

                <div className="upgrade-info-col">
                  <div className="upgrade-info-top">
                    <strong className="upgrade-title">{item.title}</strong>
                    <span className="upgrade-level-label">RANK {level}/5</span>
                  </div>
                  <p className="upgrade-desc-text">{item.desc}</p>
                  <div className="upgrade-pips-dots">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i} className={`upgrade-dot ${i < level ? 'is-active' : ''}`} />
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  className={`upgrade-btn-clean ${maxed ? 'is-maxed' : affordable ? 'is-affordable' : 'is-disabled'}`}
                  disabled={maxed || !affordable}
                  onClick={() => onUpgrade(item.id)}
                  aria-label={`${item.title} upgrade, ${maxed ? 'Maxed' : `Cost ${cost} coins`}`}
                >
                  {maxed ? (
                    'MAX'
                  ) : (
                    <>
                      <Coins size={14} />
                      <span>{cost.toLocaleString()}</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}
