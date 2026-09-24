import { ChevronLeft, Coins, Crosshair, Gem, Heart, Magnet, Move, Shield, Swords } from 'lucide-react';
import { getPermanentUpgradeCost } from '../data/balance';
import type { SaveData } from '../types';

interface UpgradesScreenProps {
  save: SaveData;
  onBack: () => void;
  onUpgrade: (id: string, useGems?: boolean) => void;
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
  { id: 'maxHp', title: 'Max Health', desc: '+12% HP per rank', icon: Heart, art: '/assets/images/talent_health.jpg', colorClass: 'green' },
  { id: 'damage', title: 'Damage Output', desc: '+10% All weapons per rank', icon: Swords, art: '/assets/images/talent_damage.jpg', colorClass: 'blue' },
  { id: 'moveSpeed', title: 'Move Speed', desc: '+6% Base speed per rank', icon: Move, art: '/assets/images/talent_speed.jpg', colorClass: 'gold' },
  { id: 'magnet', title: 'Pickup Magnet', desc: '+20 Radius per rank', icon: Magnet, art: '/assets/images/talent_magnet.jpg', colorClass: 'purple' },
  { id: 'armor', title: 'Iron Armor', desc: '+7% Damage mitigation', icon: Shield, art: '/assets/images/talent_armor.jpg', colorClass: 'silver' },
  { id: 'critChance', title: 'Precision Sight', desc: '+2.5% Critical strike', icon: Crosshair, art: '/assets/images/talent_crit.jpg', colorClass: 'cyan' },
];

export function UpgradesScreen({ save, onBack, onUpgrade }: UpgradesScreenProps) {
  const totalRanks = Object.values(save.permanentUpgrades).reduce((a, b) => a + (b ?? 0), 0);
  const powerRating = Math.round(100 + totalRanks * 15);

  return (
    <main className="meta-screen upgrades-landscape-screen">
      <header className="talents-header">
        <button type="button" className="talents-back-btn" onClick={onBack} aria-label="Back to previous screen"><ChevronLeft size={22} /></button>

        <div className="talents-title-wrap">
          <h1 className="talents-main-title">PERMANENT TALENTS</h1>
          <div className="talents-title-ornament"><span className="talents-title-diamond" /></div>
        </div>

        <div className="talents-currency-row" aria-label="Available currencies">
          <div className="currency-pill currency-pill--gold"><span className="currency-pill__icon-wrap"><Coins size={14} /></span><span className="currency-pill__amount">{save.coins.toLocaleString()}</span></div>
          <div className="currency-pill currency-pill--gem"><span className="currency-pill__icon-wrap"><Gem size={14} /></span><span className="currency-pill__amount">{save.gems.toLocaleString()}</span></div>
        </div>
      </header>

      <div className="talents-body-container">
        <aside className="talents-forge-panel">
          <div className="talents-forge-panel__inner">
            <div className="talents-forge-art-box">
              <img src="/assets/images/sanctuary_forge_altar.jpg" alt="Sanctuary Forge" className="talents-forge-art-img" />
              <div className="talents-forge-art-glow" />
            </div>

            <div className="talents-forge-header">
              <span className="talents-forge-kicker">SANCTUARY FORGE</span>
              <div className="talents-forge-divider"><span className="talents-forge-diamond" /></div>
            </div>

            <div className="talents-forge-power-box">
              <span className="talents-forge-power-label">Roster Power</span>
              <strong className="talents-forge-power-score">{powerRating}</strong>
              <span className="talents-forge-power-sub">RATING</span>
            </div>

            <p className="talents-forge-desc">Talents permanently enhance every hero across every world and run.</p>

            <div className="talents-forge-invested-row">
              <span className="talents-forge-invested-label">Invested Ranks</span>
              <strong className="talents-forge-invested-count">{totalRanks} / 30</strong>
            </div>
            <div className="talents-forge-bottom-spires" />
          </div>
        </aside>

        <section className="talents-grid-section" aria-label="Permanent talent upgrades">
          {TALENTS.map((talent) => {
            const Icon = talent.icon;
            const level = save.permanentUpgrades[talent.id] ?? 0;
            const cost = getPermanentUpgradeCost(talent.id, level);
            const gemCost = Math.max(4, Math.round(cost / 40));
            const maxed = level >= 5;
            const affordableCoins = save.coins >= cost;
            const affordableGems = save.gems >= gemCost;

            return (
              <div key={talent.id} className={`talent-card ${maxed ? 'is-maxed' : ''}`} style={{ backgroundImage: `url(${talent.art})` }}>
                <div className="talent-card__art-overlay" />
                <div className="talent-card__content">
                  <div className={`talent-card__icon-box talent-card__icon-box--${talent.colorClass}`}><Icon size={24} /></div>
                  <div className="talent-card__info">
                    <strong className="talent-card__title">{talent.title}</strong>
                    <span className="talent-card__rank-label">RANK {level}/5</span>
                    <span className="talent-card__desc">{talent.desc}</span>
                    <div className="talent-card__dots-row" aria-hidden="true">
                      {Array.from({ length: 5 }, (_, i) => <span key={i} className={`talent-card__dot ${i < level ? 'is-filled' : 'is-empty'}`} />)}
                    </div>
                  </div>
                  <div className="talent-card__action">
                    {maxed ? (
                      <button
                        type="button"
                        className="talent-price-btn is-maxed"
                        disabled
                        aria-label={`${talent.title} upgrade, Maxed`}
                      >
                        MAX
                      </button>
                    ) : (
                      <div className="talent-actions-dual">
                        <button
                          type="button"
                          className={`talent-price-btn ${affordableCoins ? 'is-affordable' : 'is-unaffordable'}`}
                          disabled={!affordableCoins}
                          onClick={() => onUpgrade(talent.id, false)}
                          aria-label={`${talent.title} upgrade with Coins, Cost ${cost} coins`}
                          title="Upgrade with Gold Coins"
                        >
                          <Coins size={13} className="talent-price-btn__coin" />
                          <span className="talent-price-btn__text">{cost}</span>
                        </button>
                        <button
                          type="button"
                          className={`talent-price-btn talent-price-btn--gem ${affordableGems ? 'is-affordable' : 'is-unaffordable'}`}
                          disabled={!affordableGems}
                          onClick={() => onUpgrade(talent.id, true)}
                          aria-label={`${talent.title} upgrade with Diamonds, Cost ${gemCost} gems`}
                          title="Forge immediately with Diamonds"
                        >
                          <Gem size={13} className="talent-price-btn__coin" />
                          <span className="talent-price-btn__text">{gemCost}</span>
                        </button>
                      </div>
                    )}
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
