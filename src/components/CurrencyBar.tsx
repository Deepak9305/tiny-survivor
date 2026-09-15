import { Coins, Gem, Mail, Plus, Settings, ShoppingBag, UserRound } from 'lucide-react';

interface CurrencyBarProps {
  coins: number;
  gems: number;
  selectedHero?: string;
  cleanHeader?: boolean;
  onShop?: () => void;
  onSettings?: () => void;
  onMail?: () => void;
}

const heroNames: Record<string, string> = { shadow: 'Shadow', knight: 'Knight', ranger: 'Ranger' };

function getHeroDisplayName(selectedHero?: string): string {
  if (!selectedHero) return 'Hero';
  return heroNames[selectedHero] ?? selectedHero.replace(/[-_]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function CurrencyBar({ coins, gems, selectedHero, cleanHeader, onShop, onSettings, onMail }: CurrencyBarProps) {
  if (cleanHeader) {
    return (
      <div className="currency-bar currency-bar--clean">
        <div className="currency-bar__currencies">
          <button type="button" className="currency-pill currency-pill--gold" onClick={onShop} title="Coins (Tap for shop)">
            <span className="currency-pill__icon-wrap"><Coins size={14} /></span>
            <span className="currency-pill__amount">{coins.toLocaleString()}</span>
            <span className="currency-pill__plus"><Plus size={11} strokeWidth={3} /></span>
          </button>
          <button type="button" className="currency-pill currency-pill--gem" onClick={onShop} title="Diamonds (Tap for shop)">
            <span className="currency-pill__icon-wrap"><Gem size={14} /></span>
            <span className="currency-pill__amount">{gems.toLocaleString()}</span>
            <span className="currency-pill__plus"><Plus size={11} strokeWidth={3} /></span>
          </button>
        </div>
        <div className="currency-bar__actions">
          <button type="button" className="icon-button icon-button--mail" onClick={onMail ?? onShop} aria-label="Mailbox / Announcements">
            <Mail size={16} />
          </button>
          {onSettings && (
            <button type="button" className="icon-button icon-button--settings" onClick={onSettings} aria-label="Settings">
              <Settings size={16} />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="currency-bar">
      <div className="player-chip">
        <span className="avatar-dot"><UserRound size={16} strokeWidth={2.2} /></span>
        <span><strong>{getHeroDisplayName(selectedHero)}</strong><small>Selected hero</small></span>
      </div>
      <div className="currency-bar__actions">
        <span className="currency-pill currency-pill--gold"><Coins size={15} /> {coins.toLocaleString()}</span>
        <span className="currency-pill currency-pill--gem"><Gem size={14} /> {gems}</span>
        {onShop && <button type="button" className="icon-button currency-bar__shop" onClick={onShop} aria-label="Open shop"><ShoppingBag size={18} /></button>}
        {onSettings && <button type="button" className="icon-button" onClick={onSettings} aria-label="Open settings"><Settings size={18} /></button>}
      </div>
    </div>
  );
}
