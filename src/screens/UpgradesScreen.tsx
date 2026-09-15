import { ChevronLeft, Coins, Crosshair, Gem, Heart, Magnet, Move, Shield, Swords } from 'lucide-react';
import { getPermanentUpgradeCost } from '../data/balance';
import type { SaveData } from '../types';

interface UpgradesScreenProps {
  save: SaveData;
  onBack: () => void;
  onUpgrade: (id: string) => void;
}

interface TalentMeta {
  id: string;
  title: string;
  desc: string;
  icon: typeof Heart;
  art: string;
  colorClass: string;
}

const TALENTS: TalentMeta[] = [
  {
    id: 'maxHp',
    title: 'Max Health',
    desc: '+12% HP per rank',
    icon: Heart,
    art: '/assets/images/talent_health.jpg',
    colorClass: 'green',
  },
  {
    id: 'damage',
    title: 'Damage Output',
    desc: '+10% All weapons per rank',
    icon: Swords,
    art: '/assets/images/talent_damage.jpg',
    colorClass: 'blue',
  },
  {
    id: 'moveSpeed',
    title: 'Move Speed',
    desc: '+6% Base speed per rank',
    icon: Move,
    art: '/assets/images/talent_speed.jpg',
    colorClass: 'gold',
  },
  {
    id: 'magnet',
    title: 'Pickup Magnet',
    desc: '+20 Radius per rank',
    icon: Magnet,
    art: '/assets/images/talent_magnet.jpg',
    colorClass: 'purple',
  },
  {
    id: 'armor',
    title: 'Iron Armor',
    desc: '+7% Damage mitigation',
    icon: Shield,
    art: '/assets/images/talent_armor.jpg',
    colorClass: 'silver',
  },
  {
    id: 'critChance',
    title: 'Precision Sight',
    desc: '+2.5% Critical strike',
    icon: Crosshair,
    art: '/assets/images/talent_crit.jpg',
    colorClass: 'cyan',
  },
];

export function UpgradesScreen({ save, onBack, onUpgrade }: UpgradesScreenProps) {
  const totalRanks = Object.values(save.permanentUpgrades).reduce((a, b) => a + (b ?? 0), 0);
  const powerRating = Math.round(100 + totalRanks * 15);

  return (
    <main className="meta-screen upgrades-landscape-screen">
      {/* Top Header matching Reference 3 */}
      <header className="talents-header">
        <button
          type="button"
          className="talents-back-btn"
          onClick={onBack}
          aria-label="Back to previous screen"
        >
          <ChevronLeft size={22} />
        </button>

        <div className="talents-title-wrap">
          <h1 className="talents-main-title">PERMANENT TALENTS</h1>
          <div className="talents-title-ornament">
            <span className="talents-title-diamond" />
          </div>
        </div>

        <div className="talents-currency-row">
          <div className="currency-pill currency-pill--gold">
            <span className="currency-pill__icon-wrap"><Coins size={14} /></span>
            <span className="currency-pill__amount">{save.coins.toLocaleString()}</span>
            <span className="currency-pill__plus">+</span>
          </div>
          <div className="currency-pill currency-pill--gem">
            <span className="currency-pill__icon-wrap"><Gem size={14} /></span>
            <span className="currency-pill__amount">{save.gems.toLocaleString()}</span>
            <span className="currency-pill__plus">+</span>
          </div>
        </div>
      </header>

      {/* Body: Left Forge Column + Right 2x3 Grid */}
      <div className="talents-body-container">
        {/* Left Sanctuary Forge Column */}
        <aside className="talents-forge-panel">
          <div className="talents-forge-panel__inner">
            <div className="talents-forge-art-box">
              <img
                src="/assets/images/sanctuary_forge_altar.jpg"
                alt="Sanctuary Forge"
                className="talents-forge-art-img"
              />
              <div className="talents-forge-art-glow" />
            </div>

            <div className="talents-forge-header">
              <span className="talents-forge-kicker">SANCTUARY FORGE</span>
              <div className="talents-forge-divider">
                <span className="talents-forge-diamond" />
              </div>
            </div>

            <div className="talents-forge-power-box">
              <span className="talents-forge-power-label">Survivor Power</span>
              <strong className="talents-forge-power-score">{powerRating}</strong>
              <span className="talents-forge-power-sub">RATING</span>
            </div>

            <p className="talents-forge-desc">
              Talents permanently enhance Shadow across every world and run.
            </p>

            <div className="talents-forge-invested-row">
              <span className="talents-forge-invested-label">Invested Ranks</span>
              <strong className="talents-forge-invested-count">{totalRanks} / 30</strong>
            </div>

            <div className="talents-forge-bottom-spires" />
          </div>
        </aside>

        {/* Right 2x3 Grid of 6 Talents */}
        <section className="talents-grid-section">
          {TALENTS.map((talent) => {
            const Icon = talent.icon;
            const level = save.permanentUpgrades[talent.id] ?? 0;
            const cost = getPermanentUpgradeCost(talent.id, level);
            const maxed = level >= 5;
            const affordable = save.coins >= cost;

            return (
              <div
                key={talent.id}
                className={`talent-card ${maxed ? 'is-maxed' : ''}`}
                style={{ backgroundImage: `url(${talent.art})` }}
              >
                <div className="talent-card__art-overlay" />

                <div className="talent-card__content">
                  {/* Icon on left */}
                  <div className={`talent-card__icon-box talent-card__icon-box--${talent.colorClass}`}>
                    <Icon size={24} />
                  </div>

                  {/* Info in middle */}
                  <div className="talent-card__info">
                    <strong className="talent-card__title">{talent.title}</strong>
                    <span className="talent-card__rank-label">RANK {level}/5</span>
                    <span className="talent-card__desc">{talent.desc}</span>

                    {/* 5 Rank Dots */}
                    <div className="talent-card__dots-row">
                      {Array.from({ length: 5 }, (_, i) => (
                        <span
                          key={i}
                          className={`talent-card__dot ${i < level ? 'is-filled' : 'is-empty'}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Action Button on right */}
                  <div className="talent-card__action">
                    <button
                      type="button"
                      className={`talent-price-btn ${
                        maxed
                          ? 'is-maxed'
                          : affordable
                          ? 'is-affordable'
                          : 'is-unaffordable'
                      }`}
                      disabled={maxed || !affordable}
                      onClick={() => onUpgrade(talent.id)}
                      aria-label={`${talent.title} upgrade, ${
                        maxed ? 'Maxed' : `Cost ${cost} coins`
                      }`}
                    >
                      {maxed ? (
                        'MAX'
                      ) : (
                        <>
                          <Coins size={14} className="talent-price-btn__coin" />
                          <span className="talent-price-btn__text">{cost}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}
