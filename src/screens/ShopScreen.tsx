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
  onOpenGemChest?: (cost: number) => { rewardItem?: EquipmentId; bonusCoins: number } | false;
  onConvertGems?: (gemCost: number, coinsReward: number) => boolean;
  onBuyHero?: (heroId: HeroId, cost: number, currency?: 'coins' | 'gems') => void;
  onBuyEquipment?: (equipmentId: EquipmentId, cost: number, currency?: 'coins' | 'gems') => void;
}

function localDate(): string {
  const date = new Date();
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function ShopScreen({
  save,
  onBack,
  onFreeChest,
  onOpenGemChest,
  onConvertGems,
  onBuyHero,
  onBuyEquipment,
}: ShopScreenProps) {
  const [activeTab, setActiveTab] = useState<ShopTab>('heroes');
  const [loadingChest, setLoadingChest] = useState(false);
  const [chestMessage, setChestMessage] = useState<string>();
  const [vaultMessage, setVaultMessage] = useState<string>();

  const claimed = save.freeChestClaimedDate === localDate();

  const handleClaimChest = async () => {
    if (loadingChest || claimed) return;
    setLoadingChest(true);
    setChestMessage(undefined);
    setVaultMessage(undefined);
    const earned = await onFreeChest();
    setChestMessage(earned ? '+120 coins added.' : 'Reward unavailable right now.');
    setLoadingChest(false);
  };

  const handleGemChest = () => {
    if (save.gems < 15) return;
    setChestMessage(undefined);
    audioService.playSFX('upgrade');
    const res = onOpenGemChest?.(15);
    if (res) {
      if (res.rewardItem) {
        const itemDef = getEquipmentDefinition(res.rewardItem);
        setVaultMessage(`Unlocked ${itemDef?.name || res.rewardItem} + ${res.bonusCoins} gold!`);
      } else {
        setVaultMessage(`Mythic Bounty Claimed: +${res.bonusCoins} gold!`);
      }
    }
  };

  const handleTransmute = () => {
    if (save.gems < 10) return;
    setChestMessage(undefined);
    audioService.playSFX('upgrade');
    const ok = onConvertGems?.(10, 650);
    if (ok) {
      setVaultMessage('Transmuted 10 Diamonds into 650 Gold Coins!');
    }
  };

  const handlePurchaseHero = (heroId: HeroId, price: number, currency: 'coins' | 'gems' = 'coins') => {
    if (save.heroesUnlocked.includes(heroId)) return;
    if (currency === 'gems' && save.gems < price) return;
    if (currency === 'coins' && save.coins < price) return;
    audioService.playSFX('upgrade');
    onBuyHero?.(heroId, price, currency);
  };

  const handlePurchaseEquipment = (equipmentId: EquipmentId, price: number, currency: 'coins' | 'gems' = 'coins') => {
    if (save.ownedEquipment.includes(equipmentId)) return;
    if (currency === 'gems' && save.gems < price) return;
    if (currency === 'coins' && save.coins < price) return;
    audioService.playSFX('upgrade');
    onBuyEquipment?.(equipmentId, price, currency);
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
                        <div className="armory-card-footer--dual" style={{ width: '100%' }}>
                          <button
                            type="button"
                            className="armory-buy"
                            disabled={!canAfford}
                            onClick={() => handlePurchaseHero(heroId, def.price, 'coins')}
                            title="Unlock with Gold Coins"
                          >
                            <Coins size={13} />
                            {def.price.toLocaleString()}
                          </button>
                          <button
                            type="button"
                            className="armory-buy armory-buy--gem"
                            disabled={save.gems < Math.max(10, Math.round(def.price / 40))}
                            onClick={() => handlePurchaseHero(heroId, Math.max(10, Math.round(def.price / 40)), 'gems')}
                            title="Unlock immediately with Diamonds"
                          >
                            <Gem size={13} />
                            {Math.max(10, Math.round(def.price / 40))}
                          </button>
                        </div>
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
                const gemPrice = Math.max(6, Math.round(item.price / 35));
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
                        <div className="armory-card-footer--dual" style={{ width: '100%' }}>
                          <button
                            type="button"
                            className="armory-buy"
                            disabled={!canAfford}
                            onClick={() => handlePurchaseEquipment(item.id, item.price, 'coins')}
                            title="Buy with Gold Coins"
                          >
                            <Coins size={13} />
                            {item.price.toLocaleString()}
                          </button>
                          <button
                            type="button"
                            className="armory-buy armory-buy--gem"
                            disabled={save.gems < gemPrice}
                            onClick={() => handlePurchaseEquipment(item.id, gemPrice, 'gems')}
                            title="Forge with Diamonds"
                          >
                            <Gem size={13} />
                            {gemPrice}
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {activeTab === 'daily' && (
            <div className="armory-daily-wrap">
              {/* 1. Free Daily Ad Cache */}
              <article className="armory-daily-card">
                <div className="armory-daily-card__icon"><Gift size={30} /></div>
                <div className="armory-daily-card__copy">
                  <span>DAILY SUPPLY</span>
                  <h2>Daily Gold Cache</h2>
                  <p>120 free bonus coins. Available once per day.</p>
                </div>
                <button
                  type="button"
                  className="armory-daily-card__button"
                  onClick={handleClaimChest}
                  disabled={claimed || loadingChest}
                >
                  {claimed ? <Check size={16} /> : <Play size={16} fill="currentColor" />}
                  {claimed ? 'Claimed' : loadingChest ? 'Connecting…' : 'Claim Free'}
                </button>
              </article>

              {/* 2. Mythic Diamond Chest */}
              <article className="armory-daily-card armory-daily-card--mythic">
                <div className="armory-daily-card__icon"><Sparkles size={30} /></div>
                <div className="armory-daily-card__copy">
                  <span>SANCTUARY VAULT</span>
                  <h2>Mythic Diamond Chest</h2>
                  <p>Guaranteed unowned Relic/Charm + 400 Gold (or 1,200 Gold if all gear collected).</p>
                </div>
                <button
                  type="button"
                  className="armory-daily-card__button armory-daily-card__button--gem"
                  onClick={handleGemChest}
                  disabled={save.gems < 15}
                  title="Open Mythic Chest for 15 Diamonds"
                >
                  <Gem size={15} />
                  15 Diamonds
                </button>
              </article>

              {/* 3. Diamond Transmutation */}
              <article className="armory-daily-card armory-daily-card--transmute">
                <div className="armory-daily-card__icon"><Coins size={30} /></div>
                <div className="armory-daily-card__copy">
                  <span>ALCHEMICAL FORGE</span>
                  <h2>Gold Transmutation</h2>
                  <p>Transmute 10 Diamonds into 650 Sanctuary Gold Coins instantly.</p>
                </div>
                <button
                  type="button"
                  className="armory-daily-card__button armory-daily-card__button--gem"
                  onClick={handleTransmute}
                  disabled={save.gems < 10}
                  title="Transmute 10 Diamonds to 650 Gold Coins"
                >
                  <Gem size={15} />
                  10 Diamonds
                </button>
              </article>

              {(vaultMessage || chestMessage) && (
                <p className="armory-message" role="status">
                  {vaultMessage || chestMessage}
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
