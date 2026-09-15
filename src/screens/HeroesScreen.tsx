import {
  Check,
  ChevronLeft,
  ChevronRight,
  Gem,
  Heart,
  Lock,
  Move,
  PawPrint,
  Shield,
  Sparkles,
  Swords,
  X,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { HeroPreview3D } from '../components/HeroPreview3D';
import { ALL_HERO_IDS, getHeroDefinition, HERO_DEFINITIONS } from '../data/heroes';
import { getEquipmentDefinition } from '../data/equipment';
import { resolvePlayerStats } from '../data/statsResolver';
import type { EquipmentId, EquipmentSlot, HeroId, SaveData } from '../types';

interface HeroesScreenProps {
  save: SaveData;
  onBack: () => void;
  onSelect: (id: HeroId) => void;
  onEquip?: (heroId: HeroId, slot: EquipmentSlot, equipmentId?: EquipmentId) => void;
}

const SLOT_CONFIG: Record<
  EquipmentSlot,
  { label: string; icon: typeof Shield; emptyLabel: string; color: string }
> = {
  armor: { label: 'ARMOR', icon: Shield, emptyLabel: 'No Armor', color: '#38bdf8' },
  relic: { label: 'RELIC', icon: Gem, emptyLabel: 'No Relic', color: '#60a5fa' },
  pet: { label: 'PET', icon: PawPrint, emptyLabel: 'No Pet', color: '#c084fc' },
  charm: { label: 'CHARM', icon: Sparkles, emptyLabel: 'No Charm', color: '#facc15' },
};

const HERO_ICONS: Record<HeroId, typeof Swords> = {
  shadow: Sparkles,
  warrior: Shield,
  monk: Heart,
  gunslinger: Swords,
};

const HERO_PORTRAITS: Record<HeroId, string> = {
  shadow: '/assets/images/hero_portrait_shadow.jpg',
  warrior: '/assets/images/hero_portrait_warrior.jpg',
  monk: '/assets/images/hero_portrait_monk.jpg',
  gunslinger: '/assets/images/hero_portrait_gunslinger.jpg',
};

export function HeroesScreen({ save, onBack, onSelect, onEquip }: HeroesScreenProps) {
  const [previewHeroId, setPreviewHeroId] = useState<HeroId>(save.selectedHero ?? 'shadow');
  const [activeSlotModal, setActiveSlotModal] = useState<EquipmentSlot | null>(null);

  const heroDef = getHeroDefinition(previewHeroId);
  const isUnlocked = save.heroesUnlocked.includes(previewHeroId);
  const isCurrentlySelected = save.selectedHero === previewHeroId;

  const currentLoadout = save.heroLoadouts?.[previewHeroId] ?? {};
  const resolvedStats = resolvePlayerStats(previewHeroId, currentLoadout, save.permanentUpgrades);

  const handleSelectHero = () => {
    if (isUnlocked) {
      onSelect(previewHeroId);
    }
  };

  const handleEquipItem = (slot: EquipmentSlot, equipmentId?: EquipmentId) => {
    onEquip?.(previewHeroId, slot, equipmentId);
    setActiveSlotModal(null);
  };

  const slotOwnedItems = activeSlotModal
    ? save.ownedEquipment
        .map((id) => getEquipmentDefinition(id))
        .filter((item): item is NonNullable<typeof item> => item !== undefined && item.slot === activeSlotModal)
    : [];

  return (
    <main className="meta-screen heroes-landscape-screen">
      {/* Top Header */}
      <header className="heroes-header">
        <button
          type="button"
          className="heroes-back-btn"
          onClick={onBack}
          aria-label="Back to home"
        >
          <ChevronLeft size={24} />
        </button>

        <div className="heroes-title-wrap">
          <h1 className="heroes-main-title">HEROES &amp; LOADOUT</h1>
          <div className="heroes-title-ornament">
            <span className="heroes-title-diamond" />
          </div>
        </div>

        <span className="heroes-progress-badge">
          {save.heroesUnlocked.length} / {ALL_HERO_IDS.length} HEROES UNLOCKED
        </span>
      </header>

      {/* Main Container */}
      <div className="heroes-landscape-container">
        {/* Left Column: 3D Preview Pedestal */}
        <div className={`heroes-left-stage heroes-left-stage--${heroDef.tone}`}>
          <div className="heroes-pedestal-rune-circle" />

          <HeroPreview3D
            key={`${previewHeroId}-${currentLoadout.pet ?? ''}-${currentLoadout.relic ?? ''}`}
            heroId={previewHeroId}
            equippedPet={currentLoadout.pet}
            equippedRelic={currentLoadout.relic}
            worldId={1}
            className="heroes-landscape-3d"
          />

          {!isUnlocked && (
            <div className="heroes-locked-overlay">
              <Lock size={28} className="heroes-locked-icon" />
              <strong>{heroDef.requirement}</strong>
              <small>Unlock in Shop using Coins</small>
            </div>
          )}

          <div className="heroes-stage-footer">
            {isCurrentlySelected ? (
              <div className="heroes-active-pill">
                <Check size={16} />
                <span>ACTIVE SURVIVOR</span>
              </div>
            ) : isUnlocked ? (
              <button
                type="button"
                className="heroes-select-btn"
                onClick={handleSelectHero}
              >
                SELECT HERO
              </button>
            ) : (
              <div className="heroes-unowned-tag">
                <Lock size={14} /> UNLOCK IN SHOP
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Hero Specs, Stats, Loadout & Hero Selectors */}
        <div className="heroes-right-details">
          {/* Hero Header & Lore */}
          <div className="heroes-header-info">
            <div className="heroes-title-row">
              <span className="heroes-role-subtitle">
                {heroDef.role.toUpperCase()}
              </span>
              <span className={`heroes-gender-tag heroes-gender-tag--${heroDef.gender}`}>
                {heroDef.gender.toUpperCase()}
              </span>
            </div>
            <h2 className="heroes-name">{heroDef.name}</h2>
            <p className="heroes-lore">{heroDef.description}</p>
            <p className="heroes-trait-desc">
              <span className="heroes-trait-name">{heroDef.traitName}:</span>{' '}
              {heroDef.traitDescription}
            </p>
          </div>

          {/* 6 High-Contrast Stat Boxes */}
          <div className="heroes-stats-row">
            <div className="heroes-stat-box">
              <Heart size={16} className="heroes-stat-box__icon heroes-stat-box__icon--hp" />
              <div className="heroes-stat-box__data">
                <span className="heroes-stat-box__label">HP</span>
                <strong className="heroes-stat-box__val">{resolvedStats.maxHp}</strong>
              </div>
            </div>

            <div className="heroes-stat-box">
              <Shield size={16} className="heroes-stat-box__icon heroes-stat-box__icon--armor" />
              <div className="heroes-stat-box__data">
                <span className="heroes-stat-box__label">ARMOR</span>
                <strong className="heroes-stat-box__val">
                  {Math.round(resolvedStats.armor * 100)}%
                </strong>
              </div>
            </div>

            <div className="heroes-stat-box">
              <Move size={16} className="heroes-stat-box__icon heroes-stat-box__icon--spd" />
              <div className="heroes-stat-box__data">
                <span className="heroes-stat-box__label">SPD</span>
                <strong className="heroes-stat-box__val">{resolvedStats.moveSpeed}</strong>
              </div>
            </div>

            <div className="heroes-stat-box">
              <Sparkles size={16} className="heroes-stat-box__icon heroes-stat-box__icon--crit" />
              <div className="heroes-stat-box__data">
                <span className="heroes-stat-box__label">CRIT</span>
                <strong className="heroes-stat-box__val">
                  {Math.round(resolvedStats.critChance * 100)}%
                </strong>
              </div>
            </div>

            <div className="heroes-stat-box">
              <Swords size={16} className="heroes-stat-box__icon heroes-stat-box__icon--primary" />
              <div className="heroes-stat-box__data">
                <span className="heroes-stat-box__label">PRIMARY</span>
                <strong className="heroes-stat-box__val">{resolvedStats.primaryDamage}%</strong>
              </div>
            </div>

            <div className="heroes-stat-box">
              <Zap size={16} className="heroes-stat-box__icon heroes-stat-box__icon--special" />
              <div className="heroes-stat-box__data">
                <span className="heroes-stat-box__label">SPECIAL</span>
                <strong className="heroes-stat-box__val">
                  {Math.round(resolvedStats.specialDamageMultiplier * 100)}%
                </strong>
              </div>
            </div>
          </div>

          {/* Equipped Loadout 4 Slots (2x2 Grid) */}
          <div className="heroes-loadout-section">
            <div className="heroes-loadout-divider">
              <span className="heroes-loadout-title">
                EQUIPPED LOADOUT ({heroDef.name.toUpperCase()})
              </span>
            </div>

            <div className="heroes-slots-grid">
              {(['armor', 'relic', 'pet', 'charm'] as const).map((slot) => {
                const config = SLOT_CONFIG[slot];
                const SlotIcon = config.icon;
                const equippedId = currentLoadout[slot];
                const itemDef = equippedId ? getEquipmentDefinition(equippedId) : undefined;

                return (
                  <button
                    type="button"
                    key={slot}
                    className={`heroes-slot-card ${itemDef ? 'is-equipped' : 'is-empty'}`}
                    onClick={() => setActiveSlotModal(slot)}
                  >
                    <div
                      className="heroes-slot-card__icon-box"
                      style={{ color: config.color }}
                    >
                      <SlotIcon size={20} />
                    </div>
                    <div className="heroes-slot-card__info">
                      <span className="heroes-slot-card__slot-name">{config.label}</span>
                      <strong className="heroes-slot-card__item-name">
                        {itemDef ? itemDef.name : config.emptyLabel}
                      </strong>
                      <small className="heroes-slot-card__effect">
                        {itemDef ? itemDef.shortEffect : 'Tap to equip'}
                      </small>
                    </div>
                    <ChevronRight size={16} className="heroes-slot-card__arrow" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hero Selection Row */}
          <div className="heroes-roster-row" role="radiogroup" aria-label="Available heroes">
            {ALL_HERO_IDS.map((id) => {
              const def = HERO_DEFINITIONS[id];
              const unlocked = save.heroesUnlocked.includes(id);
              const isSelected = previewHeroId === id;
              const isActive = save.selectedHero === id;
              const Icon = HERO_ICONS[id];

              return (
                <button
                  type="button"
                  key={id}
                  className={`heroes-roster-card ${isSelected ? 'is-selected' : ''} ${
                    unlocked ? 'is-unlocked' : 'is-locked'
                  }`}
                  onClick={() => setPreviewHeroId(id)}
                  aria-label={`${def.name}${unlocked ? '' : `, ${def.requirement}`}`}
                >
                  <div className="heroes-roster-card__avatar">
                    <img
                      src={HERO_PORTRAITS[id]}
                      alt={def.name}
                      className="heroes-roster-card__img"
                    />
                    {!unlocked && (
                      <div className="heroes-roster-card__lock-overlay">
                        <Lock size={16} className="heroes-roster-card__lock" />
                      </div>
                    )}
                  </div>
                  <strong className="heroes-roster-card__name">{def.name}</strong>
                  <span
                    className={`heroes-roster-card__tag ${
                      isActive ? 'is-active' : unlocked ? 'is-ready' : 'is-locked'
                    }`}
                  >
                    {isActive ? 'ACTIVE' : unlocked ? 'READY' : 'LOCKED'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Equipment Selection Modal */}
      {activeSlotModal && (
        <div className="modal-overlay" onClick={() => setActiveSlotModal(null)}>
          <div
            className="heroes-equip-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`Select ${activeSlotModal}`}
          >
            <div className="heroes-equip-modal__header">
              <h3>Select {SLOT_CONFIG[activeSlotModal].label}</h3>
              <button
                type="button"
                className="heroes-equip-modal__close"
                onClick={() => setActiveSlotModal(null)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="heroes-equip-modal__list">
              <button
                type="button"
                className={`heroes-equip-option ${!currentLoadout[activeSlotModal] ? 'is-active' : ''}`}
                onClick={() => handleEquipItem(activeSlotModal, undefined)}
              >
                <div className="heroes-equip-option__info">
                  <strong>None</strong>
                  <small>Unequip item</small>
                </div>
                {!currentLoadout[activeSlotModal] && <Check size={16} className="text-blue" />}
              </button>

              {slotOwnedItems.map((item) => {
                const isEquipped = currentLoadout[activeSlotModal] === item.id;
                return (
                  <button
                    type="button"
                    key={item.id}
                    className={`heroes-equip-option ${isEquipped ? 'is-active' : ''}`}
                    onClick={() => handleEquipItem(activeSlotModal, item.id)}
                  >
                    <div className="heroes-equip-option__info">
                      <strong>{item.name}</strong>
                      <small>{item.shortEffect}</small>
                    </div>
                    {isEquipped && <Check size={16} className="text-blue" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
