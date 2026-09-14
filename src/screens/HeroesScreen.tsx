import { Check, Lock, Shield, Sparkles, Swords, Target, Zap } from 'lucide-react';
import { ScreenHeader } from '../components/ScreenHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { HeroPreview3D } from '../components/HeroPreview3D';
import type { SaveData } from '../types';

interface HeroesScreenProps {
  save: SaveData;
  onBack: () => void;
  onSelect: (id: string) => void;
}

const heroes = [
  {
    id: 'shadow',
    name: 'Shadow',
    role: 'Balanced arcane mage & agile rogue',
    stats: ['100 HP', '20 DMG', '5.0 SPD', '12% CRIT'],
    weapon: 'Magic Bolt',
    passive: 'Arcane Focus (+10% Spell Piercing)',
    tone: 'blue',
    unlocked: true,
    requirement: 'STARTER HERO',
  },
  {
    id: 'knight',
    name: 'Cursed Knight',
    role: 'Heavy armored vanguard & shield blocker',
    stats: ['145 HP', '25 DMG', '4.2 SPD', '15% ARMOR'],
    weapon: 'Orbiting Blades',
    passive: 'Iron Bulwark (-25% Physical Damage)',
    tone: 'gold',
    unlocked: false,
    requirement: '1,000 COINS',
  },
  {
    id: 'ranger',
    name: 'Ranger',
    role: 'High-speed sniper & critical specialist',
    stats: ['85 HP', '30 DMG', '5.8 SPD', '25% CRIT'],
    weapon: 'Chain Lightning',
    passive: 'Windrunner (+15% Movement)',
    tone: 'purple',
    unlocked: false,
    requirement: 'CLEAR STAGE 1-5',
  },
];

function HeroMark({ id, size = 26 }: { id: string; size?: number }) {
  const Icon = id === 'knight' ? Shield : id === 'ranger' ? Target : Zap;
  return <Icon size={size} strokeWidth={1.8} />;
}

export function HeroesScreen({ save, onBack, onSelect }: HeroesScreenProps) {
  const selected = heroes.find((hero) => hero.id === save.selectedHero) ?? heroes[0];

  return (
    <main className="meta-screen heroes-landscape-screen">
      <ScreenHeader
        title="HERO ROSTER"
        onBack={onBack}
        right={<span className="header-progress">{save.heroesUnlocked.length} / 3 UNLOCKED</span>}
      />

      <div className="heroes-landscape-container">
        {/* Left ~50%: Large 3D Preview */}
        <div className={`heroes-left-stage heroes-left-stage--${selected.tone}`}>
          <div className="heroes-stage-glow" />
          {selected.id === 'shadow' ? (
            <HeroPreview3D worldId={1} className="heroes-landscape-3d" />
          ) : (
            <div className={`heroes-alt-portrait heroes-alt-portrait--${selected.id}`}>
              <HeroMark id={selected.id} size={64} />
              <span className="heroes-alt-locked-badge">
                <Lock size={16} /> COMING SOON
              </span>
            </div>
          )}
          <div className="heroes-stage-pedestal" />
        </div>

        {/* Right ~50%: Hero Details & Selector */}
        <div className="heroes-right-details">
          <div className="heroes-header-info">
            <span className="eyebrow">ACTIVE SURVIVOR</span>
            <h1 className="heroes-name">{selected.name}</h1>
            <p className="heroes-role">{selected.role}</p>
          </div>

          <div className="heroes-stats-bar">
            {selected.stats.map((stat) => (
              <div className="heroes-stat-badge" key={stat}>
                {stat}
              </div>
            ))}
          </div>

          {selected.weapon && selected.passive && (
            <div className="heroes-abilities-grid">
              <div className="heroes-ability-card">
                <span className="eyebrow">STARTING WEAPON</span>
                <strong>
                  <Swords size={16} /> {selected.weapon}
                </strong>
              </div>
              <div className="heroes-ability-card">
                <span className="eyebrow">PASSIVE TRAIT</span>
                <strong>
                  <Sparkles size={16} /> {selected.passive}
                </strong>
              </div>
            </div>
          )}

          {/* Hero Selection Row */}
          <div className="heroes-selector-row" role="radiogroup" aria-label="Available heroes">
            {heroes.map((hero) => {
              const isUnlocked = hero.unlocked || save.heroesUnlocked.includes(hero.id);
              const isSelected = selected.id === hero.id;

              return (
                <button
                  type="button"
                  key={hero.id}
                  className={`heroes-thumb-card ${isSelected ? 'is-selected' : ''} ${
                    isUnlocked ? 'is-unlocked' : 'is-locked'
                  }`}
                  onClick={() => isUnlocked && onSelect(hero.id)}
                  disabled={!isUnlocked}
                  aria-label={`${hero.name}${isUnlocked ? '' : `, ${hero.requirement}`}`}
                >
                  <span className="heroes-thumb-card__icon">
                    <HeroMark id={hero.id} size={22} />
                    {!isUnlocked && <Lock size={12} className="heroes-thumb-card__lock" />}
                  </span>
                  <strong>{hero.name}</strong>
                  <small>{isSelected ? 'EQUIPPED' : isUnlocked ? 'SELECT' : hero.requirement}</small>
                </button>
              );
            })}
          </div>

          <div className="heroes-cta-area">
            <PrimaryButton
              variant="blue"
              wide
              disabled={selected.id === save.selectedHero}
              onClick={() => onSelect(selected.id)}
            >
              <Check size={18} /> {selected.id === save.selectedHero ? 'CURRENTLY EQUIPPED' : 'SELECT HERO'}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </main>
  );
}
