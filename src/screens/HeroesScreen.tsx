import { Check, Lock, Shield, Sparkles, Swords, Target, Zap } from 'lucide-react';
import { ScreenHeader } from '../components/ScreenHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import type { SaveData } from '../types';

import { HeroPreview3D } from '../components/HeroPreview3D';

interface HeroesScreenProps { save: SaveData; onBack: () => void; onSelect: (id: string) => void }

const heroes = [
  { id: 'shadow', name: 'Shadow', role: 'Balanced & reliable', stats: ['100 HP', '20 DMG', '5.0 SPD'], weapon: 'Magic Bolt', passive: 'Arcane Start', tone: 'blue', unlocked: true, requirement: 'STARTER HERO' },
  { id: 'knight', name: 'Knight', role: 'Sturdy frontline', stats: ['135 HP', '25 DMG', '4.2 SPD'], weapon: 'Orbiting Blades', passive: 'Iron Heart', tone: 'gold', unlocked: false, requirement: '1,000 COINS' },
  { id: 'ranger', name: 'Ranger', role: 'Fast & precise', stats: ['LOCKED', '—', '—'], weapon: undefined, passive: undefined, tone: 'purple', unlocked: false, requirement: 'CLEAR STAGE 1-5' },
];

function HeroMark({ id, size = 29 }: { id: string; size?: number }) {
  const Icon = id === 'knight' ? Shield : id === 'ranger' ? Target : Zap;
  return <Icon size={size} strokeWidth={1.8} />;
}

export function HeroesScreen({ save, onBack, onSelect }: HeroesScreenProps) {
  const selected = heroes.find((hero) => hero.id === save.selectedHero && hero.id === 'shadow') ?? heroes[0];
  return <main className="meta-screen heroes-screen"><ScreenHeader title="HEROES" onBack={onBack} right={<span className="header-progress">{save.heroesUnlocked.length} / 3</span>} />
    <section className={`hero-showcase hero-showcase--${selected.tone}`}>
      <div className="hero-showcase__glow" />
      {selected.id === 'shadow' ? (
        <div className="hero-showcase__preview3d">
          <HeroPreview3D worldId={1} className="heroes-screen-3d" />
        </div>
      ) : (
        <div className={`hero-showcase__portrait hero-showcase__portrait--${selected.id}`}>
          <span className="hero-mark"><HeroMark id={selected.id} size={42} /></span>
        </div>
      )}
      <div className="hero-showcase__copy"><span className="eyebrow">SELECTED HERO</span><h1>{selected.name}</h1><p>{selected.role}</p><div className="hero-stats">{selected.stats.map((stat) => <span key={stat}>{stat}</span>)}</div></div>
      <PrimaryButton variant="blue" disabled><Check size={16} /> EQUIPPED</PrimaryButton>
    </section>
    <div className="section-label"><span>CHOOSE YOUR HERO</span><small>{save.heroesUnlocked.length}/3 unlocked</small></div>
    <section className="hero-selector" aria-label="Hero selection">{heroes.map((hero) => { const unlocked = hero.unlocked || save.heroesUnlocked.includes(hero.id); const isSelected = selected.id === hero.id; return <button type="button" key={hero.id} className={`hero-selector__item hero-selector__item--${hero.tone} ${isSelected ? 'is-selected' : ''}`} onClick={() => unlocked && onSelect(hero.id)} disabled={!unlocked} aria-label={`${hero.name}${unlocked ? '' : `, locked: ${hero.requirement}`}`}><span className="hero-selector__portrait"><HeroMark id={hero.id} size={26} />{!unlocked && <span className="hero-selector__lock"><Lock size={12} /></span>}</span><strong>{hero.name}</strong><small>{isSelected ? 'EQUIPPED' : unlocked ? 'SELECT' : hero.requirement}</small></button>; })}</section>
    {selected.weapon && selected.passive && <section className="hero-loadout"><div><span className="eyebrow">STARTING WEAPON</span><strong><Swords size={15} /> {selected.weapon}</strong></div><div><span className="eyebrow">PASSIVE</span><strong><Sparkles size={15} /> {selected.passive}</strong></div></section>}
    <div className="info-callout"><Sparkles size={16} /><span><strong>Shadow is ready to run.</strong><small>Additional heroes will arrive with their own real loadouts.</small></span><Zap size={15} /></div>
  </main>;
}
