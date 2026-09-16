import { Clock, Play, Skull, Trophy } from 'lucide-react';
import { EquipmentIcon } from '../components/EquipmentIcon';
import { ScreenHeader } from '../components/ScreenHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { getHeroDefinition } from '../data/heroes';
import { getEquipmentDefinition } from '../data/equipment';
import type { HeroId, SaveData } from '../types';

interface SurvivalScreenProps {
  save: SaveData;
  onBack: () => void;
  onStart: () => void;
  onSelectHero: () => void;
}

const HERO_PORTRAITS: Record<HeroId, string> = {
  shadow: '/assets/images/hero_portrait_shadow.jpg',
  warrior: '/assets/images/hero_portrait_warrior.jpg',
  monk: '/assets/images/hero_portrait_monk.jpg',
  gunslinger: '/assets/images/hero_portrait_gunslinger.jpg',
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function SurvivalScreen({ save, onBack, onStart, onSelectHero }: SurvivalScreenProps) {
  const heroId = save.selectedHero ?? 'shadow';
  const heroDef = getHeroDefinition(heroId);
  const loadout = save.heroLoadouts?.[heroId] ?? {};

  const armorDef = loadout.armor ? getEquipmentDefinition(loadout.armor) : undefined;
  const relicDef = loadout.relic ? getEquipmentDefinition(loadout.relic) : undefined;
  const petDef = loadout.pet ? getEquipmentDefinition(loadout.pet) : undefined;
  const charmDef = loadout.charm ? getEquipmentDefinition(loadout.charm) : undefined;

  return (
    <main className="meta-screen survival-landscape-screen">
      <ScreenHeader title="SURVIVAL MODE" onBack={onBack} />

      <div className="survival-landscape-container">
        <div className="survival-records-panel">
          <div className="survival-badge">
            <Trophy size={20} className="survival-trophy-icon" />
            <span>PERSONAL BESTS</span>
          </div>

          <div className="survival-records-grid">
            <div className="survival-stat-card">
              <span className="survival-stat-label"><Clock size={16} /> BEST TIME</span>
              <strong className="survival-stat-value">{formatTime(save.endlessBestTime ?? 0)}</strong>
            </div>
            <div className="survival-stat-card">
              <span className="survival-stat-label"><Skull size={16} /> BEST KILLS</span>
              <strong className="survival-stat-value">{(save.endlessBestKills ?? 0).toLocaleString()}</strong>
            </div>
          </div>

          <div className="survival-desc-box">
            <span className="survival-desc-box__kicker">ENDLESS ESCALATION</span>
            <p className="survival-lead">No finish line. No mercy.</p>
            <p className="survival-sub">
              Enemy pressure escalates continuously while conquered world bosses return at intervals. Build fast, move clean, and chase a new record.
            </p>
          </div>
        </div>

        <div className="survival-loadout-panel">
          <div className="survival-hero-card">
            <div className="survival-hero-header">
              <div className="survival-hero-icon-box survival-hero-icon-box--portrait">
                <img src={HERO_PORTRAITS[heroId]} alt={heroDef.name} className="survival-hero-portrait" />
              </div>
              <div className="survival-hero-info">
                <span className="eyebrow">EQUIPPED HERO</span>
                <h3 className="survival-hero-name">{heroDef.name}</h3>
                <p className="survival-hero-role">{heroDef.role}</p>
              </div>
              <button type="button" className="survival-change-hero-btn" onClick={onSelectHero}>CHANGE</button>
            </div>

            <div className="survival-equipment-strip">
              <div className={`survival-eq-chip ${armorDef ? 'is-equipped' : 'is-empty'}`}>
                <EquipmentIcon id={armorDef?.id} slot="armor" size={15} />
                <span>{armorDef ? armorDef.name : 'No Armor'}</span>
              </div>
              <div className={`survival-eq-chip ${relicDef ? 'is-equipped' : 'is-empty'}`}>
                <EquipmentIcon id={relicDef?.id} slot="relic" size={15} />
                <span>{relicDef ? relicDef.name : 'No Relic'}</span>
              </div>
              <div className={`survival-eq-chip ${petDef ? 'is-equipped' : 'is-empty'}`}>
                <EquipmentIcon id={petDef?.id} slot="pet" size={15} />
                <span>{petDef ? petDef.name : 'No Pet'}</span>
              </div>
              <div className={`survival-eq-chip ${charmDef ? 'is-equipped' : 'is-empty'}`}>
                <EquipmentIcon id={charmDef?.id} slot="charm" size={15} />
                <span>{charmDef ? charmDef.name : 'No Charm'}</span>
              </div>
            </div>
          </div>

          <div className="survival-actions">
            <div className="survival-actions__copy">
              <span>Threat increases without limit</span>
              <small>One run. One record.</small>
            </div>
            <PrimaryButton variant="danger" wide onClick={onStart}>
              <Play size={20} fill="currentColor" /> START SURVIVAL
            </PrimaryButton>
          </div>
        </div>
      </div>
    </main>
  );
}
