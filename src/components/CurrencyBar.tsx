import { Coins, Gem, Mail, Plus, Settings, ShoppingBag, UserRound } from 'lucide-react';
import { getHeroDefinition } from '../data/heroes';
import type { HeroId } from '../types';

interface CurrencyBarProps {
  coins: number;
  gems: number;
  selectedHero?: string;
  cleanHeader?: boolean;
  onShop?: () => void;
  onSettings?: () => void;
  onMail?: () => void;
}

const HERO_PORTRAITS: Partial<Record<HeroId, string>> = {
  shadow: '/assets/images/hero_portrait_shadow.jpg',
  warrior: '/assets/images/hero_portrait_warrior.jpg',
  monk: '/assets/images/hero_portrait_monk.jpg',
  gunslinger: '/assets/images/hero_portrait_gunslinger.jpg',
};

function getHeroDisplayName(selectedHero?: string): string {
  if (!selectedHero) return 'Hero';
  try {
    return getHeroDefinition(selectedHero as HeroId).name;
  } catch {
    return selectedHero.replace(/[-_]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  }
}

export function CurrencyBar({ coins, gems, selectedHero, cleanHeader, onShop, onSettings, onMail }: CurrencyBarProps) {
  if (cleanHeader) {
    return (
      <div className="currency-bar currency-bar--clean">
        <div className="currency-bar__currencies">
          <button type="button" className="currency-pill currency-pill--gold" onClick={onShop} title="Coins · Open Armory" disabled={!onShop}>
            <span className="currency-pill__icon-wrap"><Coins size={14} /></span>
            <span className="currency-pill__amount">{coins.toLocaleString()}</span>
            {onShop && <span className="currency-pill__plus"><Plus size={11} strokeWidth={3} /></span>}
          </button>
          <button type="button" className="currency-pill currency-pill--gem" onClick={onShop} title="Gems · Open Armory" disabled={!onShop}>
            <span className="currency-pill__icon-wrap"><Gem size={14} /></span>
            <span className="currency-pill__amount">{gems.toLocaleString()}</span>
            {onShop && <span className="currency-pill__plus"><Plus size={11} strokeWidth={3} /></span>}
          </button>
        </div>
        <div className="currency-bar__actions">
          {onMail && (
            <button type="button" className="icon-button icon-button--mail" onClick={onMail} aria-label="Mailbox / Announcements">
              <Mail size={16} />
            </button>
          )}
          {onSettings && (
            <button type="button" className="icon-button icon-button--settings" onClick={onSettings} aria-label="Settings">
              <Settings size={16} />
            </button>
          )}
        </div>
      </div>
    );
  }

  const heroId = selectedHero as HeroId | undefined;
  const heroPortrait = heroId ? HERO_PORTRAITS[heroId] : undefined;

  return (
    <div className="currency-bar">
      <div className="player-chip">
        <span className="avatar-dot">
          {heroPortrait ? <img src={heroPortrait} alt="" aria-hidden="true" /> : <UserRound size={16} strokeWidth={2.2} />}
        </span>
        <span><strong>{getHeroDisplayName(selectedHero)}</strong><small>Selected hero</small></span>
      </div>
      <div className="currency-bar__actions">
        <span className="currency-pill currency-pill--gold"><Coins size={15} /> {coins.toLocaleString()}</span>
        <span className="currency-pill currency-pill--gem"><Gem size={14} /> {gems.toLocaleString()}</span>
        {onShop && <button type="button" className="icon-button currency-bar__shop" onClick={onShop} aria-label="Open shop"><ShoppingBag size={18} /></button>}
        {onSettings && <button type="button" className="icon-button" onClick={onSettings} aria-label="Open settings"><Settings size={18} /></button>}
      </div>
    </div>
  );
}
