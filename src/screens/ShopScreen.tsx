import {
  Check,
  Coins,
  Gem,
  Gift,
  PawPrint,
  Play,
  Shield,
  Sparkles,
  Swords,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { EquipmentIcon } from '../components/EquipmentIcon';
import { ScreenHeader } from '../components/ScreenHeader';
import { ALL_HERO_IDS, getHeroDefinition } from '../data/heroes';
import { ALL_EQUIPMENT_IDS, getEquipmentDefinition } from '../data/equipment';
import { audioService } from '../services/audioService';
import type { EquipmentId, EquipmentSlot, HeroId, SaveData } from '../types';

type ShopTab = 'heroes' | 'armor' | 'relic' | 'pet' | 'charm' | 'daily';

interface ShopTabMeta {
  id: ShopTab;
  label: string;
  icon: LucideIcon;
}

const SHOP_TABS: ShopTabMeta[] = [
  { id: 'heroes', label: 'Heroes', icon: Swords },
  { id: 'armor', label: 'Armor', icon: Shield },
  { id: 'relic', label: 'Relics', icon: Gem },
  { id: 'pet', label: 'Pets', icon: PawPrint },
  { id: 'charm', label: 'Charms', icon: Sparkles },
  { id: 'daily', label: 'Daily', icon: Gift },
];

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
  const [chestMessage, setChestMessage] = useState<string>();

  const claimed = save.freeChestClaimedDate === localDate();

  const handleClaimChest = async () => {
    if (loadingChest || claimed) return;
    setLoadingChest(true);
    setChestMessage(undefined);
    const earned = await onFreeChest();
    setChestMessage(earned ? '+120 coins added.' : 'Reward unavailable right now.');
    setLoadingChest(false);
  };

  const handlePurchaseHero = (heroId: HeroId, price: number) => {
    if (save.coins < price || save.heroesUnlocked.includes(heroId)) return;
    audioService.playSFX('upgrade');
    onBuyHero?.(heroId, price);
  };

  const handlePurchaseEquipment = (equipmentId: EquipmentId, price: number) => {
    if (save.coins < price || save.ownedEquipment.includes(equipmentId)) return;
    audioService.playSFX('upgrade');
    onBuyEquipment?.(equipmentId, price);
  };

  const currentSlotEquipment =
    activeTab === 'armor' || activeTab === 'relic' || activeTab === 'pet' || activeTab === 'charm'
      ? ALL_EQUIPMENT_IDS.map(getEquipmentDefinition).filter(
          (item): item is NonNullable<typeof item> => item !== undefined && item.slot === (activeTab as EquipmentSlot),
        )
      : [];

  return (
    <main className="armory-screen">
      <ScreenHeader
        title="ARMORY"
        onBack={onBack}
        right={
          <div className="armory-wallet" aria-label="Currencies">
            <span><Coins size={14} /> {save.coins.toLocaleString()}</span>
            <span><Gem size={14} /> {save.gems.toLocaleString()}</span>
          </div>
        }
      />

      <div className="armory-shell">
        <nav className="armory-tabs" aria-label="Armory categories">
          {SHOP_TABS.map(({ id, label, icon: Icon }) => (
            <button
              type="button"
              key={id}
              className={activeTab === id ? 'is-active' : ''}
              onClick={() => setActiveTab(id)}
              aria-pressed={activeTab === id}
            >
              <Icon size={15} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <section className="armory-content">
          {activeTab === 'heroes' && (
            <div className="armory-hero-grid">
              {ALL_HERO_IDS.map((heroId) => {
                const def = getHeroDefinition(heroId);
                const owned = save.heroesUnlocked.includes(heroId);
                const canAfford = save.coins >= def.price;
                return (
                  <article key={heroId} className={`armory-hero-card ${owned ? 'is-owned' : ''}`}>
                    <div className="armory-hero-card__art">
                      <img src={HERO_SHOP_PORTRAITS[heroId]} alt={def.name} />
                      <div className="armory-hero-card__shade" />
                      <span className="armory-hero-card__role">{def.role}</span>
                    </div>
                    <div className="armory-hero-card__body">
                      <div>
                        <h2>{def.name}</h2>
                        <span>{def.traitName}</span>
                      </div>
                      <p>{def.traitDescription}</p>
                    </div>
                    <div className="armory-card-footer">
                      {owned ? (
                        <span className="armory-owned"><Check size={14} /> Owned</span>
                      ) : (
                        <button
                          type="button"
                          className="armory-buy"
                          disabled={!canAfford}
                          onClick={() => handlePurchaseHero(heroId, def.price)}
                        >
                          <Coins size={14} />
                          {def.price.toLocaleString()}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {(activeTab === 'armor' || activeTab === 'relic' || activeTab === 'pet' || activeTab === 'charm') && (
            <div className="armory-item-grid">
              {currentSlotEquipment.map((item) => {
                const owned = save.ownedEquipment.includes(item.id);
                const canAfford = save.coins >= item.price;
                return (
                  <article key={item.id} className={`armory-item-card armory-rarity--${item.rarity} ${owned ? 'is-owned' : ''}`}>
                    <div className="armory-item-card__icon">
                      <EquipmentIcon id={item.id} size={28} />
                    </div>
                    <div className="armory-item-card__copy">
                      <span className="armory-rarity">{item.rarity}</span>
                      <h2>{item.name}</h2>
                      <strong>{item.shortEffect}</strong>
                      <p>{item.description}</p>
                      {item.bossDropFrom && <small>Boss first-clear drop</small>}
                    </div>
                    <div className="armory-card-footer">
                      {owned ? (
                        <span className="armory-owned"><Check size={14} /> Owned</span>
                      ) : (
                        <button
                          type="button"
                          className="armory-buy"
                          disabled={!canAfford}
                          onClick={() => handlePurchaseEquipment(item.id, item.price)}
                        >
                          <Coins size={14} />
                          {item.price.toLocaleString()}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {activeTab === 'daily' && (
            <div className="armory-daily-wrap">
              <article className="armory-daily-card">
                <div className="armory-daily-card__icon"><Gift size={30} /></div>
                <div className="armory-daily-card__copy">
                  <span>DAILY CACHE</span>
                  <h2>120 bonus coins</h2>
                  <p>One optional rewarded video. Available once per day.</p>
                </div>
                <button
                  type="button"
                  className="armory-daily-card__button"
                  onClick={handleClaimChest}
                  disabled={claimed || loadingChest}
                >
                  {claimed ? <Check size={16} /> : <Play size={16} fill="currentColor" />}
                  {claimed ? 'Claimed' : loadingChest ? 'Connecting…' : 'Claim'}
                </button>
              </article>
              {chestMessage && <p className="armory-message" role="status">{chestMessage}</p>}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
