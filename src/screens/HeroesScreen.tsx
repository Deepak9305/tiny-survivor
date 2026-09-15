import { Check, ChevronRight, Lock, Shield, Sparkles, Swords, X, Zap } from 'lucide-react';
import { useState } from 'react';
import { ScreenHeader } from '../components/ScreenHeader';
import { PrimaryButton } from '../components/PrimaryButton';
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

const SLOT_CONFIG: Record<EquipmentSlot, { label: string; icon: string; emptyLabel: string }> = {
  armor: { label: 'ARMOR', icon: '🛡️', emptyLabel: 'No Armor' },
  relic: { label: 'RELIC', icon: '💎', emptyLabel: 'No Relic' },
  pet: { label: 'PET', icon: '🐾', emptyLabel: 'No Pet' },
  charm: { label: 'CHARM', icon: '✨', emptyLabel: 'No Charm' },
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

  // Filter owned equipment for the active slot
  const slotOwnedItems = activeSlotModal
    ? save.ownedEquipment
        .map((id) => getEquipmentDefinition(id))
        .filter((item): item is NonNullable<typeof item> => item !== undefined && item.slot === activeSlotModal)
    : [];

  return (
    <main className="meta-screen heroes-landscape-screen">
      <ScreenHeader
        title="HEROES & LOADOUT"
        onBack={onBack}
        right={
          <span className="header-progress">
            {save.heroesUnlocked.length} / {ALL_HERO_IDS.length} HEROES UNLOCKED
          </span>
        }
      />

      <div className="heroes-landscape-container">
        {/* Left Column: 3D Preview + Hero Status */}
        <div className={`heroes-left-stage heroes-left-stage--${heroDef.tone}`}>
          <div className="heroes-stage-glow" />

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
                <Check size={16} /> ACTIVE SURVIVOR
              </div>
            ) : isUnlocked ? (
              <PrimaryButton variant="gold" onClick={handleSelectHero}>
                SELECT HERO
              </PrimaryButton>
            ) : (
              <div className="heroes-unowned-tag">
                <Lock size={14} /> UNLOCK IN SHOP
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Hero Details, Stats, Equipment Loadout & Selector */}
        <div className="heroes-right-details">
          {/* Header Info */}
          <div className="heroes-header-info">
            <div className="heroes-title-row">
              <span className="eyebrow">{heroDef.role}</span>
              <span className={`heroes-gender-tag heroes-gender-tag--${heroDef.gender}`}>
                {heroDef.gender.toUpperCase()}
              </span>
            </div>
            <h1 className="heroes-name">{heroDef.name}</h1>
            <p className="heroes-trait-desc">
              <strong>{heroDef.traitName}:</strong> {heroDef.traitDescription}
            </p>
          </div>

          {/* Resolved Concrete Gameplay Stats */}
          <div className="heroes-stats-bar">
            <div className="heroes-stat-badge" title="Max Health">
              <span className="stat-label">HP</span>
              <strong>{resolvedStats.maxHp}</strong>
            </div>
            <div className="heroes-stat-badge" title="Damage Reduction Armor">
              <span className="stat-label">ARMOR</span>
              <strong>{Math.round(resolvedStats.armor * 100)}%</strong>
            </div>
            <div className="heroes-stat-badge" title="Movement Speed">
              <span className="stat-label">SPD</span>
              <strong>{resolvedStats.moveSpeed}</strong>
            </div>
            <div className="heroes-stat-badge" title="Critical Strike Chance">
              <span className="stat-label">CRIT</span>
              <strong>{Math.round(resolvedStats.critChance * 100)}%</strong>
            </div>
            <div className="heroes-stat-badge" title="Primary Attack Damage">
              <span className="stat-label">PRIMARY</span>
              <strong>{resolvedStats.primaryDamage}</strong>
            </div>
            <div className="heroes-stat-badge" title="Special Ability Damage Multiplier">
              <span className="stat-label">SPECIAL</span>
              <strong>{Math.round(resolvedStats.specialDamageMultiplier * 100)}%</strong>
            </div>
          </div>

          {/* 4 Universal Equipment Slots */}
          <div className="heroes-loadout-section">
            <span className="eyebrow">EQUIPPED LOADOUT ({heroDef.name})</span>
            <div className="heroes-slots-grid">
              {(['armor', 'relic', 'pet', 'charm'] as const).map((slot) => {
                const config = SLOT_CONFIG[slot];
                const equippedId = currentLoadout[slot];
                const itemDef = equippedId ? getEquipmentDefinition(equippedId) : undefined;

                return (
                  <button
                    type="button"
                    key={slot}
                    className={`heroes-slot-card ${itemDef ? 'is-equipped' : 'is-empty'}`}
                    onClick={() => setActiveSlotModal(slot)}
                  >
                    <div className="heroes-slot-card__icon">{itemDef?.icon ?? config.icon}</div>
                    <div className="heroes-slot-card__info">
                      <span className="heroes-slot-card__slot-name">{config.label}</span>
                      <strong className="heroes-slot-card__item-name">
                        {itemDef ? itemDef.name : config.emptyLabel}
                      </strong>
                      <small className="heroes-slot-card__effect">
                        {itemDef ? itemDef.shortEffect : 'Tap to equip'}
                      </small>
                    </div>
                    <ChevronRight size={14} className="heroes-slot-card__arrow" />
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

              return (
                <button
                  type="button"
                  key={id}
                  className={`heroes-thumb-card ${isSelected ? 'is-selected' : ''} ${
                    unlocked ? 'is-unlocked' : 'is-locked'
                  }`}
                  onClick={() => setPreviewHeroId(id)}
                  aria-label={`${def.name}${unlocked ? '' : `, ${def.requirement}`}`}
                >
                  <span className="heroes-thumb-card__icon">
                    {id === 'warrior' ? (
                      <Swords size={20} />
                    ) : id === 'monk' ? (
                      <Shield size={20} />
                    ) : id === 'gunslinger' ? (
                      <Sparkles size={20} />
                    ) : (
                      <Zap size={20} />
                    )}
                    {!unlocked && <Lock size={12} className="heroes-thumb-card__lock" />}
                  </span>
                  <strong>{def.name}</strong>
                  <small>
                    {isActive ? 'ACTIVE' : isSelected ? 'VIEWING' : unlocked ? 'SELECT' : 'LOCKED'}
                  </small>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Equipment Selector Modal */}
      {activeSlotModal && (
        <div className="heroes-modal-backdrop" onClick={() => setActiveSlotModal(null)}>
          <div className="heroes-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="heroes-modal-header">
              <div className="heroes-modal-title">
                <span className="heroes-modal-icon">{SLOT_CONFIG[activeSlotModal].icon}</span>
                <h3>SELECT {SLOT_CONFIG[activeSlotModal].label}</h3>
              </div>
              <button
                type="button"
                className="heroes-modal-close"
                onClick={() => setActiveSlotModal(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="heroes-modal-content">
              {/* Unequip button */}
              {currentLoadout[activeSlotModal] && (
                <div className="heroes-modal-item heroes-modal-item--unequip">
                  <div className="heroes-modal-item__info">
                    <strong>Unequip {SLOT_CONFIG[activeSlotModal].label}</strong>
                    <small>Remove item from this slot</small>
                  </div>
                  <button
                    type="button"
                    className="heroes-modal-btn heroes-modal-btn--unequip"
                    onClick={() => handleEquipItem(activeSlotModal, undefined)}
                  >
                    UNEQUIP
                  </button>
                </div>
              )}

              {slotOwnedItems.length === 0 ? (
                <div className="heroes-modal-empty">
                  <p>
                    No owned {SLOT_CONFIG[activeSlotModal].label.toLowerCase()} yet.
                  </p>
                  <small>
                    Defeat World Bosses on first clear or visit the Shop to acquire gear!
                  </small>
                </div>
              ) : (
                slotOwnedItems.map((item) => {
                  const isEquippedHere = currentLoadout[activeSlotModal] === item.id;

                  return (
                    <div
                      key={item.id}
                      className={`heroes-modal-item ${isEquippedHere ? 'is-currently-equipped' : ''}`}
                    >
                      <span className="heroes-modal-item__icon">{item.icon}</span>
                      <div className="heroes-modal-item__info">
                        <div className="heroes-modal-item__title-row">
                          <strong>{item.name}</strong>
                          <span className={`item-rarity-badge item-rarity--${item.rarity}`}>
                            {item.rarity.toUpperCase()}
                          </span>
                        </div>
                        <p className="heroes-modal-item__desc">{item.description}</p>
                        <small className="heroes-modal-item__effect">{item.shortEffect}</small>
                      </div>
                      <button
                        type="button"
                        className={`heroes-modal-btn ${
                          isEquippedHere ? 'heroes-modal-btn--active' : 'heroes-modal-btn--equip'
                        }`}
                        onClick={() => handleEquipItem(activeSlotModal, item.id)}
                        disabled={isEquippedHere}
                      >
                        {isEquippedHere ? 'EQUIPPED' : 'EQUIP'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
