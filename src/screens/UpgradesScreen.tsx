import { ArrowUp, Coins, Crown, Gem, Heart, Magnet, Move, Shield, Sparkles, Target, Zap } from 'lucide-react';
import { ScreenHeader } from '../components/ScreenHeader';
import { getPermanentUpgradeCost } from '../data/balance';
import type { SaveData } from '../types';

interface UpgradesScreenProps { save: SaveData; onBack: () => void; onUpgrade: (id: string) => void }

const upgradeRows = [
  { id: 'maxHp', title: 'Max HP', icon: Heart, tone: 'red', current: (level: number) => `+${level * 12}%`, next: (level: number) => `+${(level + 1) * 12}%` },
  { id: 'damage', title: 'Attack Damage', icon: Target, tone: 'orange', current: (level: number) => `+${level * 10}%`, next: (level: number) => `+${(level + 1) * 10}%` },
  { id: 'moveSpeed', title: 'Move Speed', icon: Move, tone: 'blue', current: (level: number) => `+${level * 6}%`, next: (level: number) => `+${(level + 1) * 6}%` },
  { id: 'magnet', title: 'Pickup Range', icon: Magnet, tone: 'purple', current: (level: number) => `+${level * 20}`, next: (level: number) => `+${(level + 1) * 20}` },
  { id: 'xpGain', title: 'XP Gain', icon: Sparkles, tone: 'cyan', current: (level: number) => `+${level * 8}%`, next: (level: number) => `+${(level + 1) * 8}%` },
  { id: 'critChance', title: 'Critical Chance', icon: Zap, tone: 'gold', current: (level: number) => `+${level * 2.5}%`, next: (level: number) => `+${(level + 1) * 2.5}%` },
  { id: 'armor', title: 'Armor', icon: Shield, tone: 'steel', current: (level: number) => `${level * 7}% less`, next: (level: number) => `${(level + 1) * 7}% less` },
];

export function UpgradesScreen({ save, onBack, onUpgrade }: UpgradesScreenProps) {
  return <main className="meta-screen"><ScreenHeader title="UPGRADES" onBack={onBack} right={<span className="header-currency"><Coins size={14} /> {save.coins.toLocaleString()}</span>} />
    <section className="upgrade-intro"><div className="upgrade-intro__badge"><Crown size={18} /></div><div><span className="eyebrow">PERMANENT POWER</span><h1>Build your legend.</h1><p>Every upgrade carries into your next run.</p></div></section>
    <section className="upgrade-list">{upgradeRows.map((row) => { const Icon = row.icon; const level = save.permanentUpgrades[row.id] ?? 0; const cost = getPermanentUpgradeCost(row.id, level); const maxed = level >= 5; const affordable = save.coins >= cost; return <div className="upgrade-row" key={row.id}><span className={`upgrade-row__icon upgrade-row__icon--${row.tone}`}><Icon size={20} /></span><span className="upgrade-row__copy"><strong>{row.title}</strong><small>Level {level} · {row.current(level)} <i>→</i> {maxed ? 'MAX' : row.next(level)}</small></span><button disabled={maxed || !affordable} onClick={() => onUpgrade(row.id)}>{maxed ? <span>MAX</span> : <><Coins size={13} /> {cost}</>}</button></div>; })}</section>
    <div className="upgrade-footer"><Gem size={15} /> Earn more coins by clearing stages and defeating elites.</div>
  </main>;
}
