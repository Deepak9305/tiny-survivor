import { Check, Coins, Gem, Gift, PawPrint, Play, Shield, Sparkles, Swords } from 'lucide-react';
import { useState } from 'react';
import { EquipmentIcon } from '../components/EquipmentIcon';
import { ScreenHeader } from '../components/ScreenHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { ALL_HERO_IDS, getHeroDefinition } from '../data/heroes';
import { ALL_EQUIPMENT_IDS, getEquipmentDefinition } from '../data/equipment';
import { audioService } from '../services/audioService';
import type { EquipmentId, EquipmentSlot, HeroId, SaveData } from '../types';

type ShopTab = 'daily' | 'heroes' | 'armor' | 'relic' | 'pet' | 'charm';

const HERO_SHOP_PORTRAITS: Record<HeroId, string> = {
  shadow: '/assets/images/hero_portrait_shadow.jpg',
  warrior: '/assets/images/hero_portrait_warrior.jpg',
  monk: '/assets/images/hero_portrait_monk.jpg',
  gunslinger: '/assets/images/hero_portrait_gunslinger.jpg',
};

interface ShopScreenProps {
  save: SaveData;
  onBack: () => void;
  onFreeChest: () => Promise<boolean>;
  onBuyHero?: (heroId: HeroId, cost: number) => void;
  onBuyEquipment?: (equipmentId: EquipmentId, cost: number) => void;
}

function localDate(): string {
  const date = new Date();
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function ShopScreen({ save, onBack, onFreeChest, onBuyHero, onBuyEquipment }: ShopScreenProps) {
  const [activeTab, setActiveTab] = useState<ShopTab>('heroes');
  const [loadingChest, setLoadingChest] = useState(false);
  const [chestMessage, setChestMessage] = useState<string | undefined>();

  const claimed = save.freeChestClaimedDate === localDate();

  const handleClaimChest = async () => {
    if (loadingChest || claimed) return;
    setLoadingChest(true);
    setChestMessage(undefined);
    const earned = await onFreeChest();
    setChestMessage(earned ? 'Reward claimed: +120 coins.' : 'Rewarded ad unavailable. Try again later.');
    setLoadingChest(false);
  };

  const handlePurchaseHero = (heroId: HeroId, price: number) => {
    if (save.coins < price || save.heroesUnlocked.includes(heroId)) return;
    audioService.playSFX('upgrade');
    onBuyHero?.(heroId, price);
  };

  const handlePurchaseEquipment = (eqId: EquipmentId, price: number) => {
    if (save.coins < price || save.ownedEquipment.includes(eqId)) return;
    audioService.playSFX('upgrade');
    onBuyEquipment?.(eqId, price);
  };

  const currentSlotEquipment =
    activeTab === 'armor' || activeTab === 'relic' || activeTab === 'pet' || activeTab === 'charm'
      ? ALL_EQUIPMENT_IDS.map(getEquipmentDefinition).filter(
          (item): item is NonNullable<typeof item> => item !== undefined && item.slot === (activeTab as EquipmentSlot),
        )
      : [];

  return (
    <main className="meta-screen shop-landscape-screen">
      <ScreenHeader
        title="ARMORY & SHOP"
        onBack={onBack}
        right={
          <span className="header-currency">
            <span><Coins size={14} /> {save.coins.toLocaleString()}</span>
            <span><Gem size={14} /> {save.gems.toLocaleString()}</span>
          </span>
        }
      />

      <div className="shop-landscape-container">
        <nav className="shop-tabs-bar" aria-label="Shop categories">
          <button type="button" className={`shop-tab-btn ${activeTab === 'daily' ? 'is-active' : ''}`} onClick={() => setActiveTab('daily')} aria-pressed={activeTab === 'daily'}>
            <Gift size={16} /><span>DAILY</span>
          </button>
          <button type="button" className={`shop-tab-btn ${activeTab === 'heroes' ? 'is-active' : ''}`} onClick={() => setActiveTab('heroes')} aria-pressed={activeTab === 'heroes'}>
            <Swords size={16} /><span>HEROES</span>
          </button>
          <button type="button" className={`shop-tab-btn ${activeTab === 'armor' ? 'is-active' : ''}`} onClick={() => setActiveTab('armor')} aria-pressed={activeTab === 'armor'}>
            <Shield size={16} /><span>ARMOR</span>
          </button>
          <button type="button" className={`shop-tab-btn ${activeTab === 'relic' ? 'is-active' : ''}`} onClick={() => setActiveTab('relic')} aria-pressed={activeTab === 'relic'}>
            <Gem size={16} /><span>RELICS</span>
          </button>
          <button type="button" className={`shop-tab-btn ${activeTab === 'pet' ? 'is-active' : ''}`} onClick={() => setActiveTab('pet')} aria-pressed={activeTab === 'pet'}>
            <PawPrint size={16} /><span>PETS</span>
          </button>
          <button type="button" className={`shop-tab-btn ${activeTab === 'charm' ? 'is-active' : ''}`} onClick={() => setActiveTab('charm')} aria-pressed={activeTab === 'charm'}>
            <Sparkles size={16} /><span>CHARMS</span>
          </button>
        </nav>

        <div className="shop-tab-content">
          {activeTab === 'daily' && (
            <div className="shop-daily-panel">
              <section className="free-chest-card">
                <div className="free-chest-card__art">
                  <span className="free-chest-card__halo" />
                  <Gift size={52} />
                </div>
                <div className="free-chest-card__copy">
                  <span className="eyebrow">DAILY REWARD CHEST</span>
                  <h2>Sanctuary Coin Cache</h2>
                  <p>Watch one rewarded message to claim today's bonus. No purchase required.</p>
                  <div className="free-chest-card__reward"><Coins size={16} /> +120 COINS</div>
                </div>
                <PrimaryButton variant="gold" onClick={handleClaimChest} disabled={claimed || loadingChest}>
                  <Play size={15} fill="currentColor" />{' '}
                  {claimed ? 'CLAIMED TODAY' : loadingChest ? 'CONNECTING…' : 'CLAIM REWARD'}
                </PrimaryButton>
              </section>
              {chestMessage && <p className="shop-message" role="status">{chestMessage}</p>}
            </div>
          )}

          {activeTab === 'heroes' && (
            <div className="shop-grid shop-grid--heroes">
              {ALL_HERO_IDS.map((heroId) => {
                const def = getHeroDefinition(heroId);
                const owned = save.heroesUnlocked.includes(heroId);
                const canAfford = save.coins >= def.price;

                return (
                  <article key={heroId} className={`shop-card shop-card--hero shop-card--${def.tone} ${owned ? 'is-owned' : ''}`}>
                    <div className="shop-card__art shop-card__art--hero">
                      <img src={HERO_SHOP_PORTRAITS[heroId]} alt="" className="shop-card__hero-portrait" aria-hidden="true" />
                      <div className="shop-card__hero-shade" />
                      <span className="shop-card__hero-role">{def.role.toUpperCase()}</span>
                    </div>
                    <div className="shop-card__body">
                      <div className="shop-card__title-row">
                        <strong>{def.name}</strong>
                        <span className={`shop-card__gender-badge shop-card__gender--${def.gender}`}>{def.gender.toUpperCase()}</span>
                      </div>
                      <span className="shop-card__trait-name">{def.traitName}</span>
                      <p className="shop-card__trait">{def.traitDescription}</p>
                    </div>
                    <div className="shop-card__footer">
                      {owned ? (
                        <div className="shop-owned-tag"><Check size={14} /> OWNED</div>
                      ) : (
                        <button
                          type="button"
                          className="shop-buy-btn"
                          onClick={() => handlePurchaseHero(heroId, def.price)}
                          disabled={!canAfford}
                          title={!canAfford ? 'Not enough coins' : `Purchase ${def.name}`}
                        >
                          <Coins size={14} /><span>{def.price.toLocaleString()}</span>
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {(activeTab === 'armor' || activeTab === 'relic' || activeTab === 'pet' || activeTab === 'charm') && (
            <div className="shop-grid shop-grid--equipment">
              {currentSlotEquipment.map((item) => {
                const owned = save.ownedEquipment.includes(item.id);
                const canAfford = save.coins >= item.price;

                return (
                  <article key={item.id} className={`shop-card shop-card--equipment item-rarity-border--${item.rarity} ${owned ? 'is-owned' : ''}`}>
                    <div className="shop-card__art shop-card__art--eq">
                      <EquipmentIcon id={item.id} size={32} className="shop-card__equipment-icon" />
                      <span className={`item-rarity-badge item-rarity--${item.rarity}`}>{item.rarity.toUpperCase()}</span>
                    </div>
                    <div className="shop-card__body">
                      <div className="shop-card__title-row"><strong>{item.name}</strong></div>
                      <p className="shop-card__desc">{item.description}</p>
                      <small className="shop-card__effect">{item.shortEffect}</small>
                      {item.bossDropFrom && <span className="shop-card__drop-source">WORLD BOSS FIRST-CLEAR DROP</span>}
                    </div>
                    <div className="shop-card__footer">
                      {owned ? (
                        <div className="shop-owned-tag"><Check size={14} /> OWNED</div>
                      ) : (
                        <button
                          type="button"
                          className="shop-buy-btn"
                          onClick={() => handlePurchaseEquipment(item.id, item.price)}
                          disabled={!canAfford}
                          title={!canAfford ? 'Not enough coins' : `Purchase ${item.name}`}
                        >
                          <Coins size={14} /><span>{item.price.toLocaleString()}</span>
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
