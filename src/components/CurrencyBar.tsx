import { Coins, Gem, Settings, ShoppingBag, UserRound } from 'lucide-react';

interface CurrencyBarProps {
  coins: number;
  gems: number;
  selectedHero?: string;
  onShop?: () => void;
  onSettings?: () => void;
}

const heroNames: Record<string, string> = { shadow: 'Shadow', knight: 'Knight', ranger: 'Ranger' };

function getHeroDisplayName(selectedHero?: string): string {
  if (!selectedHero) return 'Hero';
  return heroNames[selectedHero] ?? selectedHero.replace(/[-_]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function CurrencyBar({ coins, gems, selectedHero, onShop, onSettings }: CurrencyBarProps) {
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
