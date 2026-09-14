import { Coins, ChevronLeft, Gem, Heart, Magnet, Move, Swords } from 'lucide-react';
import { getPermanentUpgradeCost } from '../data/balance';
import type { SaveData } from '../types';

interface UpgradesScreenProps {
  save: SaveData;
  onBack: () => void;
  onUpgrade: (id: string) => void;
}

const upgrades = [
  { id: 'maxHp', title: 'Max HP', icon: Heart, iconColor: 'green' },
  { id: 'damage', title: 'Damage', icon: Swords, iconColor: 'blue' },
  { id: 'moveSpeed', title: 'Move Speed', icon: Move, iconColor: 'orange' },
  { id: 'magnet', title: 'Pickup Range', icon: Magnet, iconColor: 'purple' },
];

export function UpgradesScreen({ save, onBack, onUpgrade }: UpgradesScreenProps) {
  return (
    <main className="meta-screen upgrades-screen-v2">
      {/* Top Header */}
      <header className="upgrades-header">
        <button type="button" className="codex-back-btn" onClick={onBack} aria-label="Back">
          <ChevronLeft size={24} />
        </button>
        <div className="upgrades-currency-row">
          <span className="currency-pill currency-pill--gold">
            <Coins size={15} /> {save.coins.toLocaleString()}
          </span>
          <span className="currency-pill currency-pill--gem">
            <Gem size={14} /> {save.gems}
          </span>
        </div>
      </header>

      {/* Upgrades List */}
      <div className="upgrades-list">
        {upgrades.map((item) => {
          const Icon = item.icon;
          const level = save.permanentUpgrades[item.id] ?? 0;
          const cost = getPermanentUpgradeCost(item.id, level);
          const maxed = level >= 5;
          const affordable = save.coins >= cost;

          return (
            <div key={item.id} className="upgrade-card-clean">
              <div className={`upgrade-icon-box upgrade-icon-box--${item.iconColor}`}>
                <Icon size={22} />
              </div>

              <div className="upgrade-info-col">
                <strong className="upgrade-title">{item.title}</strong>
                <div className="upgrade-pips-row">
                  <span className="upgrade-pips-text">{level} / 5</span>
                  <div className="upgrade-pips-dots">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i} className={`upgrade-dot ${i < level ? 'is-active' : ''}`} />
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="button"
                className={`upgrade-buy-btn ${affordable && !maxed ? 'is-affordable' : ''}`}
                disabled={maxed || !affordable}
                onClick={() => onUpgrade(item.id)}
              >
                {maxed ? (
                  'MAX'
                ) : (
                  <>
                    <Coins size={14} /> {cost}
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </main>
  );
}

