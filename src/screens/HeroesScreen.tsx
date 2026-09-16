import {
  Check,
  ChevronLeft,
  ChevronRight,
  Coins,
  Heart,
  Lock,
  Move,
  Shield,
  Sparkles,
  Swords,
  X,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { EquipmentIcon } from '../components/EquipmentIcon';
import { ALL_HERO_IDS, HERO_DEFINITIONS, getHeroDefinition } from '../data/heroes';
import { getEquipmentDefinition } from '../data/equipment';
import { resolvePlayerStats } from '../data/statsResolver';
import type { EquipmentId, EquipmentSlot, HeroId, SaveData } from '../types';

interface HeroesScreenProps {
  save: SaveData;
  onBack: () => void;
  /** Selects an owned hero. For a locked hero this is also the purchase action. */
  onSelect: (id: HeroId) => void;
  onEquip?: (heroId: HeroId, slot: EquipmentSlot, equipmentId?: EquipmentId) => void;
}

const HERO_PORTRAITS: Record<HeroId, string> = {
  shadow: '/assets/images/hero_portrait_shadow.jpg',
  warrior: '/assets/images/hero_portrait_warrior.jpg',
  monk: '/assets/images/hero_portrait_monk.jpg',
  gunslinger: '/assets/images/hero_portrait_gunslinger.jpg',
};

const SLOT_LABELS: Record<EquipmentSlot, string> = { armor: 'Armor', relic: 'Relic', pet: 'Pet', charm: 'Charm' };

export function HeroesScreen({ save, onBack, onSelect, onEquip }: HeroesScreenProps) {
  const [previewHeroId, setPreviewHeroId] = useState<HeroId>(save.selectedHero ?? 'shadow');
  const [activeSlotModal, setActiveSlotModal] = useState<EquipmentSlot | null>(null);

  const heroDef = getHeroDefinition(previewHeroId);
  const isUnlocked = save.heroesUnlocked.includes(previewHeroId);
  const isCurrentlySelected = save.selectedHero === previewHeroId;
  const canAffordHero = save.coins >= heroDef.price;
  const currentLoadout = save.heroLoadouts?.[previewHeroId] ?? {};
  const resolvedStats = resolvePlayerStats(previewHeroId, currentLoadout, save.permanentUpgrades);

  const slotOwnedItems = activeSlotModal
    ? save.ownedEquipment
        .map((id) => getEquipmentDefinition(id))
        .filter((item): item is NonNullable<typeof item> => item !== undefined && item.slot === activeSlotModal)
    : [];

  const handleEquipItem = (slot: EquipmentSlot, equipmentId?: EquipmentId) => {
    onEquip?.(previewHeroId, slot, equipmentId);
    setActiveSlotModal(null);
  };

  return (
    <main className="hero-deck-screen">
      <header className="hero-deck-header">
        <button type="button" className="hero-deck-back" onClick={onBack} aria-label="Back"><ChevronLeft size={19} /></button>
        <div className="hero-deck-heading"><span>ROSTER</span><h1>Heroes & Loadout</h1></div>
        <div className="hero-deck-wallet"><Coins size={14} /><strong>{save.coins.toLocaleString()}</strong></div>
      </header>

      <div className="hero-deck-layout">
        <section className={`hero-deck-feature hero-deck-feature--${heroDef.tone}`}>
          <img src={HERO_PORTRAITS[previewHeroId]} alt={heroDef.name} className="hero-deck-feature__art" />
          <div className="hero-deck-feature__shade" />
          <div className="hero-deck-feature__topline">
            <span>{heroDef.role}</span>
            {!isUnlocked && <span><Lock size={12} /> Locked</span>}
          </div>
          <div className="hero-deck-feature__copy"><h2>{heroDef.name}</h2><p>{heroDef.traitName}</p></div>
          <div className="hero-deck-feature__action">
            {isCurrentlySelected ? (
              <span className="hero-deck-equipped"><Check size={15} /> Equipped</span>
            ) : isUnlocked ? (
              <button type="button" onClick={() => onSelect(previewHeroId)}>Equip hero</button>
            ) : (
              <button
                type="button"
                className="hero-deck-buy"
                disabled={!canAffordHero}
                onClick={() => onSelect(previewHeroId)}
                aria-label={`Buy ${heroDef.name} for ${heroDef.price} coins`}
              >
                <Coins size={15} /> {heroDef.price.toLocaleString()}
                <span>{canAffordHero ? 'BUY & EQUIP' : 'NEED MORE COINS'}</span>
              </button>
            )}
          </div>
        </section>

        <section className="hero-deck-panel">
          <div className="hero-deck-summary">
            <div><span className="hero-deck-kicker">TRAIT</span><h2>{heroDef.traitName}</h2><p>{heroDef.traitDescription}</p></div>
            <p className="hero-deck-bio">{heroDef.description}</p>
          </div>

          <div className="hero-deck-stats" aria-label="Hero stats">
            <StatChip icon={<Heart size={15} />} label="HP" value={String(resolvedStats.maxHp)} />
            <StatChip icon={<Shield size={15} />} label="Armor" value={`${Math.round(resolvedStats.armor * 100)}%`} />
            <StatChip icon={<Move size={15} />} label="Speed" value={String(resolvedStats.moveSpeed)} />
            <StatChip icon={<Sparkles size={15} />} label="Crit" value={`${Math.round(resolvedStats.critChance * 100)}%`} />
            <StatChip icon={<Swords size={15} />} label="Primary" value={`${Math.round(resolvedStats.primaryDamageMultiplier * 100)}%`} />
            <StatChip icon={<Zap size={15} />} label="Special" value={`${Math.round(resolvedStats.specialDamageMultiplier * 100)}%`} />
          </div>

          <div className="hero-deck-loadout">
            <div className="hero-deck-section-title"><span>Loadout</span><small>Tap a slot to change it</small></div>
            <div className="hero-deck-slots">
              {(['armor', 'relic', 'pet', 'charm'] as const).map((slot) => {
                const equippedId = currentLoadout[slot];
                const item = equippedId ? getEquipmentDefinition(equippedId) : undefined;
                return (
                  <button type="button" key={slot} className={`hero-deck-slot ${item ? 'is-equipped' : 'is-empty'}`} onClick={() => setActiveSlotModal(slot)} disabled={!isUnlocked}>
                    <EquipmentIcon id={item?.id} slot={slot} size={19} />
                    <span><small>{SLOT_LABELS[slot]}</small><strong>{item?.name ?? 'Empty'}</strong><em>{item?.shortEffect ?? (isUnlocked ? 'No item equipped' : 'Unlock hero first')}</em></span>
                    <ChevronRight size={15} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="hero-deck-roster" role="radiogroup" aria-label="Hero roster">
            {ALL_HERO_IDS.map((id) => {
              const def = HERO_DEFINITIONS[id];
              const unlocked = save.heroesUnlocked.includes(id);
              const active = save.selectedHero === id;
              const selected = previewHeroId === id;
              return (
                <button type="button" key={id} className={`hero-deck-roster__item ${selected ? 'is-selected' : ''} ${unlocked ? '' : 'is-locked'}`} onClick={() => setPreviewHeroId(id)} aria-label={`${def.name}${unlocked ? '' : `, ${def.price} coins`}`}>
                  <img src={HERO_PORTRAITS[id]} alt="" />
                  <span><strong>{def.name}</strong><small>{active ? 'Equipped' : unlocked ? def.role : `${def.price.toLocaleString()} coins`}</small></span>
                  {active && <Check size={13} />}
                  {!unlocked && <Lock size={12} />}
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {activeSlotModal && (
        <div className="hero-equip-overlay" onClick={() => setActiveSlotModal(null)}>
          <section className="hero-equip-sheet" role="dialog" aria-modal="true" aria-label={`Select ${SLOT_LABELS[activeSlotModal]}`} onClick={(event) => event.stopPropagation()}>
            <header>
              <div><span>LOADOUT</span><h2>Select {SLOT_LABELS[activeSlotModal]}</h2></div>
              <button type="button" onClick={() => setActiveSlotModal(null)} aria-label="Close"><X size={18} /></button>
            </header>
            <div className="hero-equip-list">
              <button type="button" className={!currentLoadout[activeSlotModal] ? 'is-selected' : ''} onClick={() => handleEquipItem(activeSlotModal, undefined)}>
                <EquipmentIcon slot={activeSlotModal} size={18} />
                <span><strong>None</strong><small>Unequip this slot</small></span>
                {!currentLoadout[activeSlotModal] && <Check size={14} />}
              </button>
              {slotOwnedItems.map((item) => {
                const equipped = currentLoadout[activeSlotModal] === item.id;
                return (
                  <button type="button" key={item.id} className={equipped ? 'is-selected' : ''} onClick={() => handleEquipItem(activeSlotModal, item.id)}>
                    <EquipmentIcon id={item.id} size={18} />
                    <span><strong>{item.name}</strong><small>{item.shortEffect}</small></span>
                    <em>{item.rarity}</em>
                    {equipped && <Check size={14} />}
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function StatChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="hero-deck-stat"><span>{icon}</span><small>{label}</small><strong>{value}</strong></div>;
}
