import { Coins, Gem, Settings } from 'lucide-react';

interface CurrencyBarProps {
  coins: number;
  gems: number;
  onSettings?: () => void;
}

export function CurrencyBar({ coins, gems, onSettings }: CurrencyBarProps) {
  return (
    <div className="currency-bar">
      <div className="player-chip">
        <span className="avatar-dot">S</span>
        <span><strong>LV. 12</strong><small>Shadow</small></span>
      </div>
      <span className="currency-pill currency-pill--gold"><Coins size={15} /> {coins.toLocaleString()}</span>
      <span className="currency-pill currency-pill--gem"><Gem size={15} /> {gems}</span>
      {onSettings && <button className="icon-button" onClick={onSettings} aria-label="Open settings"><Settings size={19} /></button>}
    </div>
  );
}
