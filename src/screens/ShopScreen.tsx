import { Check, Coins, Gem, Gift, Play, Shield, Sparkles, Swords } from 'lucide-react';
import { useState } from 'react';
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
          (item): item is NonNullable<typeof item> => item !== undefined && item.slot === (activeTab as EquipmentSlot)
        )
      : [];

  return (
    <main className="meta-screen shop-landscape-screen">
      <ScreenHeader
        title="ARMORY & SHOP"
        onBack={onBack}
        right={
          <span className="header-currency">
            <Coins size={15} /> {save.coins.toLocaleString()}{' '}
            <Gem size={15} /> {save.gems}
          </span>
        }
      />

      <div className="shop-landscape-container">
        <nav className="shop-tabs-bar" aria-label="Shop categories">
          <button type="button" className={`shop-tab-btn ${activeTab === 'daily' ? 'is-active' : ''}`} onClick={() => setActiveTab('daily')}>
            <Gift size={16} /><span>DAILY REWARD</span>
          </button>
          <button type="button" className={`shop-tab-btn ${activeTab === 'heroes' ? 'is-active' : ''}`} onClick={() => setActiveTab('heroes')}>
            <Swords size={16} /><span>HEROES</span>
          </button>
          <button type="button" className={`shop-tab-btn ${activeTab === 'armor' ? 'is-active' : ''}`} onClick={() => setActiveTab('armor')}>
            <Shield size={16} /><span>ARMOR</span>
          </button>
          <button type="button" className={`shop-tab-btn ${activeTab === 'relic' ? 'is-active' : ''}`} onClick={() => setActiveTab('relic')}>
            <span>💎</span><span>RELICS</span>
          </button>
          <button type="button" className={`shop-tab-btn ${activeTab === 'pet' ? 'is-active' : ''}`} onClick={() => setActiveTab('pet')}>
            <span>🐾</span><span>PETS</span>
          </button>
          <button type="button" className={`shop-tab-btn ${activeTab === 'charm' ? 'is-active' : ''}`} onClick={() => setActiveTab('charm')}>
            <Sparkles size={16} /><span>CHARMS</span>
          </button>
        </nav>

        <div className="shop-tab-content">
          {activeTab === 'daily' && (
            <div className="shop-daily-panel">
              <section className="free-chest-card">
                <div className="free-chest-card__art"><Gift size={48} /></div>
                <div className="free-chest-card__copy">
                  <span className="eyebrow">DAILY REWARD CHEST</span>
                  <h2>Daily Coin Cache</h2>
                  <p><Coins size={15} /> Watch one short rewarded video each day to claim +120 bonus gold.</p>
                </div>
                <PrimaryButton variant="gold" onClick={handleClaimChest} disabled={claimed || loadingChest}>
                  <Play size={15} fill="currentColor" />{' '}
                  {claimed ? 'CLAIMED TODAY' : loadingChest ? 'CONNECTING…' : 'CLAIM +120 COINS'}
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
                  <div key={heroId} className={`shop-card shop-card--hero shop-card--${def.tone} ${owned ? 'is-owned' : ''}`}>
                    <div className="shop-card__art" style={{ overflow: 'hidden', padding: 0 }}>
                      <img
                        src={HERO_SHOP_PORTRAITS[heroId]}
                        alt={def.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 24%', display: 'block' }}
                      />
                    </div>
                    <div className="shop-card__body">
                      <div className="shop-card__title-row">
                        <strong>{def.name}</strong>
                        <span className={`shop-card__gender-badge shop-card__gender--${def.gender}`}>{def.gender.toUpperCase()}</span>
                      </div>
                      <span className="shop-card__role">{def.role}</span>
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
                          <Coins size={14} />
                          <span>{def.price.toLocaleString()} COINS</span>
                        </button>
                      )}
                    </div>
                  </div>
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
                  <div key={item.id} className={`shop-card shop-card--equipment item-rarity-border--${item.rarity} ${owned ? 'is-owned' : ''}`}>
                    <div className="shop-card__art shop-card__art--eq">
                      <span className="shop-card__emoji">{item.icon}</span>
                    </div>
                    <div className="shop-card__body">
                      <div className="shop-card__title-row">
                        <strong>{item.name}</strong>
                        <span className={`item-rarity-badge item-rarity--${item.rarity}`}>{item.rarity.toUpperCase()}</span>
                      </div>
                      <p className="shop-card__desc">{item.description}</p>
                      <small className="shop-card__effect">{item.shortEffect}</small>
                      {item.bossDropFrom && <span className="shop-card__drop-source">World Boss First Clear Drop</span>}
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
                          <Coins size={14} /><span>{item.price.toLocaleString()} COINS</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
