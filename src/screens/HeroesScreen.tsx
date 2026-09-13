import { Check, Lock, Sparkles, Swords, Zap } from 'lucide-react';
import { ScreenHeader } from '../components/ScreenHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import type { SaveData } from '../types';

interface HeroesScreenProps { save: SaveData; onBack: () => void; onSelect: (id: string) => void }

const heroes = [
  { id: 'shadow', name: 'Shadow', role: 'Balanced & reliable', stats: ['100 HP', '20 DMG', '5.0 SPD'], weapon: 'Magic Bolt', passive: 'Arcane Start', tone: 'blue', unlocked: true },
  { id: 'knight', name: 'Knight', role: 'Sturdy frontline', stats: ['135 HP', '25 DMG', '4.2 SPD'], weapon: 'Orbiting Blades', passive: 'Iron Heart', tone: 'gold', unlocked: false },
  { id: 'ranger', name: 'Ranger', role: 'Fast & precise', stats: ['85 HP', '18 DMG', '6.3 SPD'], weapon: 'Twin Bolts', passive: 'Quick Draw', tone: 'purple', unlocked: false },
];

export function HeroesScreen({ save, onBack, onSelect }: HeroesScreenProps) {
  const selected = heroes.find((hero) => hero.id === save.selectedHero) ?? heroes[0];
  return <main className="meta-screen"><ScreenHeader title="HEROES" onBack={onBack} />
    <section className={`hero-showcase hero-showcase--${selected.tone}`}><div className="hero-showcase__glow" /><div className="hero-showcase__portrait" style={{ backgroundImage: "url('/assets/tiny-survivor-key-art.png')" }}><span>{selected.id === 'shadow' ? 'S' : selected.id === 'knight' ? 'K' : 'R'}</span></div><div className="hero-showcase__copy"><span className="eyebrow">SELECTED HERO</span><h1>{selected.name}</h1><p>{selected.role}</p><div className="hero-stats">{selected.stats.map((stat) => <span key={stat}>{stat}</span>)}</div></div><PrimaryButton variant="blue" onClick={() => onSelect(selected.id)}><Check size={16} /> EQUIPPED</PrimaryButton></section>
    <div className="section-label"><span>ROSTER</span><small>{save.heroesUnlocked.length}/3 unlocked</small></div>
    <section className="hero-list">{heroes.map((hero) => { const unlocked = hero.unlocked || save.heroesUnlocked.includes(hero.id); const isSelected = selected.id === hero.id; return <button key={hero.id} className={`hero-list__item hero-list__item--${hero.tone} ${isSelected ? 'is-selected' : ''}`} onClick={() => unlocked && onSelect(hero.id)}><span className="mini-portrait"><span>{hero.id === 'shadow' ? 'S' : hero.id === 'knight' ? 'K' : 'R'}</span></span><span className="hero-list__copy"><strong>{hero.name}</strong><small>{hero.role}</small><em>{hero.weapon} · {hero.passive}</em></span>{unlocked ? isSelected ? <Check size={19} /> : <span className="hero-select-label">SELECT</span> : <span className="hero-lock"><Lock size={14} /> {hero.id === 'knight' ? '1,000' : 'Clear 1-5'}</span>}</button>; })}</section>
    <div className="info-callout"><Sparkles size={16} /><span><strong>Every hero changes the run.</strong><small>Unlock new starting weapons and passive bonuses.</small></span><Zap size={15} /></div>
  </main>;
}
