import {
  ChevronLeft,
  ChevronRight,
  Info,
  Lightbulb,
  Lock,
  Shield,
  Skull,
  Swords,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { CreaturePreview3D } from '../components/CreaturePreview3D';
import { ENEMY_BALANCE } from '../data/balance';
import { BOSS_DEFINITIONS, type BossDefinition } from '../data/bosses';
import { ALL_MONSTER_KINDS, getMonsterDefinition } from '../data/monsters';
import type { DamageType, EnemyKind, SaveData } from '../types';

type Filter = 'all' | 'graveyard' | 'forest' | 'frozen' | 'castle' | 'bosses';
type CodexEntry = {
  id: string;
  kind?: EnemyKind;
  boss?: BossDefinition;
  name: string;
  worldIds: number[];
  role: string;
  discovered: boolean;
};

interface BestiaryScreenProps {
  save: SaveData;
  initialId?: string;
  onBack: () => void;
  onSelect: (id: string) => void;
}

const filters: Array<{ id: Filter; label: string; worldId?: number }> = [
  { id: 'all', label: 'All' },
  { id: 'graveyard', label: 'Graveyard', worldId: 1 },
  { id: 'forest', label: 'Forest', worldId: 2 },
  { id: 'frozen', label: 'Frozen', worldId: 3 },
  { id: 'castle', label: 'Castle', worldId: 4 },
  { id: 'bosses', label: 'Bosses' },
];

function getEntryImage(id: string): string | undefined {
  const images: Record<string, string> = {
    skeleton: '/assets/images/creature_skeleton.jpg',
    bat: '/assets/images/creature_bat.jpg',
    slime: '/assets/images/creature_slime.jpg',
    ghost: '/assets/images/creature_ghost.jpg',
    archer: '/assets/images/creature_archer.jpg',
    knight: '/assets/images/creature_knight.jpg',
    demon: '/assets/images/creature_demon.jpg',
    imp: '/assets/images/creature_imp.jpg',
    'skeleton-king': '/assets/images/portrait_skeleton_king.jpg',
    'forest-witch': '/assets/images/boss_forest_witch.jpg',
    'frost-golem': '/assets/images/boss_frost_golem.jpg',
    'demon-lord': '/assets/images/boss_demon_lord.jpg',
  };
  return images[id];
}

export function BestiaryScreen({ save, initialId = 'skeleton', onBack, onSelect }: BestiaryScreenProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedId, setSelectedId] = useState(initialId);
  const [mobileIntelOpen, setMobileIntelOpen] = useState(false);

  const allEntries = createEntries(save);
  const visibleEntries = allEntries.filter((entry) => matchesFilter(entry, filter));
  const selected = allEntries.find((entry) => entry.id === selectedId) ?? visibleEntries[0] ?? allEntries[0];
  const currentIndex = visibleEntries.findIndex((entry) => entry.id === selected?.id);
  const discoveredCount = allEntries.filter((entry) => entry.discovered).length;

  const selectEntry = (id: string) => {
    setSelectedId(id);
    setMobileIntelOpen(false);
    onSelect(id);
  };

  const handlePrev = () => {
    if (visibleEntries.length <= 1) return;
    const newIndex = (currentIndex - 1 + visibleEntries.length) % visibleEntries.length;
    selectEntry(visibleEntries[newIndex].id);
  };

  const handleNext = () => {
    if (visibleEntries.length <= 1) return;
    const newIndex = (currentIndex + 1) % visibleEntries.length;
    selectEntry(visibleEntries[newIndex].id);
  };

  const monster = selected?.kind ? getMonsterDefinition(selected.kind) : undefined;
  const boss = selected?.boss;
  const worldId = boss?.worldId ?? monster?.worldIds[0] ?? 1;
  const balance = selected?.kind ? ENEMY_BALANCE[selected.kind] : boss;
  const weakness = boss?.weakness ?? monster?.weakness ?? [];
  const resistance = boss?.resistance ?? monster?.resistance ?? [];
  const kills = selected?.kind
    ? save.enemyKillCounts[selected.kind] ?? 0
    : save.bossKillCounts[selected?.id ?? ''] ?? 0;
  const imgUrl = selected ? getEntryImage(selected.id) : undefined;

  const hpSegments = balance ? Math.min(5, Math.max(1, Math.ceil(balance.hp / (selected?.kind ? 55 : 550)))) : 3;
  const dmgSegments = balance ? Math.min(5, Math.max(1, Math.ceil(balance.damage / 6))) : 2;
  const spdSegments = balance ? Math.min(5, Math.max(1, Math.ceil(balance.speed / (selected?.kind ? 18 : 8)))) : 4;

  return (
    <main className="meta-screen codex-screen-landscape">
      <header className="codex-header">
        <button type="button" className="codex-back-btn" onClick={onBack} aria-label="Back">
          <ChevronLeft size={20} />
          <span>BACK</span>
        </button>

        <div className="codex-title-wrap">
          <h1 className="codex-title">MONSTER CODEX</h1>
          <div className="codex-title-ornament">
            <span className="codex-title-diamond" />
          </div>
        </div>

        <span className="codex-discovery-count">
          <strong>{discoveredCount}</strong> / {allEntries.length} DISCOVERED
        </span>
      </header>

      <div className="codex-tri-layout">
        <aside className="codex-roster-col">
          <nav className="codex-tabs-row" role="tablist" aria-label="Codex category tabs">
            {filters.map((item) => (
              <button
                type="button"
                key={item.id}
                role="tab"
                aria-selected={filter === item.id}
                className={`codex-tab-btn ${filter === item.id ? 'is-active' : ''}`}
                onClick={() => {
                  setFilter(item.id);
                  setMobileIntelOpen(false);
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="codex-roster-list">
            {visibleEntries.map((entry) => {
              const isSelected = entry.id === selected?.id;
              const entryImg = getEntryImage(entry.id);

              return (
                <button
                  type="button"
                  key={entry.id}
                  className={`codex-roster-item ${isSelected ? 'is-selected' : ''} ${
                    entry.discovered ? 'is-discovered' : 'is-locked'
                  }`}
                  onClick={() => selectEntry(entry.id)}
                >
                  <div className="codex-roster-thumb">
                    {entry.discovered && entryImg ? (
                      <img src={entryImg} alt={entry.name} className="codex-roster-img" />
                    ) : entry.discovered ? (
                      <Skull size={18} className="codex-fallback-icon" />
                    ) : (
                      <Lock size={16} className="codex-lock-icon" />
                    )}
                  </div>
                  <div className="codex-roster-info">
                    <strong className="codex-roster-name">
                      {entry.discovered ? entry.name : '???'}
                    </strong>
                    <small className="codex-roster-sub">
                      {entry.discovered ? entry.role : 'Undiscovered'}
                    </small>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="codex-stage-col">
          <div className="codex-stage-container">
            <button
              type="button"
              className="codex-stepper-btn codex-stepper-btn--left"
              onClick={handlePrev}
              aria-label="Previous monster"
            >
              <ChevronLeft size={28} />
            </button>

            <div className="codex-stage-inner">
              <CreaturePreview3D
                kind={selected?.kind}
                bossId={boss?.id}
                worldId={worldId}
                discovered={selected?.discovered ?? false}
                className="codex-3d-canvas"
              />
              <div className="codex-stage-pedestal" />
            </div>

            <button
              type="button"
              className="codex-stepper-btn codex-stepper-btn--right"
              onClick={handleNext}
              aria-label="Next monster"
            >
              <ChevronRight size={28} />
            </button>
          </div>

          <div className="codex-stage-pagination">
            <span className="codex-stage-name-caps">
              {selected?.discovered ? selected.name.toUpperCase() : 'UNDISCOVERED'}
            </span>
            <div className="codex-stage-dots">
              <Skull size={14} className="codex-stage-skull" />
              <span>
                {Math.max(1, currentIndex + 1)} / {Math.max(1, visibleEntries.length)}
              </span>
            </div>
            <button
              type="button"
              className="codex-mobile-intel-btn"
              onClick={() => setMobileIntelOpen(true)}
              aria-label="Open monster intel"
            >
              <Info size={14} />
              INTEL
            </button>
          </div>
        </section>

        <button
          type="button"
          className={`codex-mobile-intel-backdrop ${mobileIntelOpen ? 'is-open' : ''}`}
          onClick={() => setMobileIntelOpen(false)}
          aria-label="Close monster intel"
          tabIndex={mobileIntelOpen ? 0 : -1}
        />

        <section className={`codex-intel-col ${mobileIntelOpen ? 'is-mobile-open' : ''}`}>
          <button
            type="button"
            className="codex-mobile-intel-close"
            onClick={() => setMobileIntelOpen(false)}
            aria-label="Close monster intel"
          >
            <X size={18} />
          </button>

          {selected?.discovered ? (
            <div className="codex-intel-card">
              <div className="codex-intel-header">
                <div className="codex-intel-title-group">
                  <span className="codex-intel-role">{selected.role.toUpperCase()}</span>
                  <h2 className="codex-intel-name">{selected.name}</h2>
                </div>

                {imgUrl && (
                  <div className="codex-intel-portrait-box">
                    <img src={imgUrl} alt={selected.name} className="codex-intel-portrait-img" />
                    <div className="codex-intel-portrait-frame" />
                  </div>
                )}
              </div>

              <div className="codex-intel-divider">
                <span className="codex-intel-diamond" />
              </div>

              <div className="codex-segmented-stats">
                <CodexStat label="Health" value={hpSegments} />
                <CodexStat label="Damage" value={dmgSegments} />
                <CodexStat label="Speed" value={spdSegments} />
              </div>

              <div className="codex-affinities-row">
                <div className="codex-affinity-box">
                  <span className="codex-affinity-tag">WEAK TO</span>
                  <div className="codex-pill codex-pill--weak">
                    <Swords size={13} />
                    <span>{formatWeakness(weakness)}</span>
                  </div>
                </div>

                <div className="codex-affinity-box">
                  <span className="codex-affinity-tag">RESISTS</span>
                  <div className="codex-pill codex-pill--resist">
                    <Shield size={13} />
                    <span>{formatResistance(resistance)}</span>
                  </div>
                </div>
              </div>

              <div className="codex-intel-section">
                <div className="codex-section-label">
                  <Swords size={14} className="text-cyan" />
                  <span>ATTACK BEHAVIOR</span>
                </div>
                <p className="codex-section-desc">
                  {monster?.behavior ??
                    boss?.description ??
                    'Winds up a readable forward sword slash, locks direction, and executes. Recovers before pursuing again.'}
                </p>
              </div>

              <div className="codex-counter-box">
                <div className="codex-counter-header">
                  <Lightbulb size={15} className="codex-counter-icon" />
                  <span className="codex-counter-label">TACTICAL COUNTER</span>
                </div>
                <p className="codex-counter-desc">
                  {monster?.combatTip ??
                    'Sidestep during its 0.4s windup. Normal body touch deals no damage—only the blade swing hurts.'}
                </p>
              </div>

              <div className="codex-intel-footer">
                <Skull size={15} className="codex-kills-icon" />
                <span className="codex-kills-text">
                  Enemies Defeated: <strong>{kills.toLocaleString()}</strong>
                </span>
              </div>
            </div>
          ) : (
            <div className="codex-locked-panel">
              <Lock size={40} className="codex-locked-big-icon" />
              <h3>Undiscovered Monster</h3>
              <p>
                Encounter this enemy or boss in the arena to analyze its attack telegraphs, stats,
                and elemental weaknesses.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function CodexStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="codex-stat-row">
      <span className="codex-stat-label">{label}</span>
      <div className="codex-stat-segments">
        {Array.from({ length: 5 }, (_, index) => (
          <span key={index} className={`codex-stat-seg ${index < value ? 'is-filled' : ''}`} />
        ))}
      </div>
    </div>
  );
}

function createEntries(save: SaveData): CodexEntry[] {
  const monsters = ALL_MONSTER_KINDS.map((kind) => {
    const monster = getMonsterDefinition(kind);
    return {
      id: kind,
      kind,
      name: monster.name,
      worldIds: monster.worldIds,
      role: monster.role,
      discovered: (save.enemyKillCounts[kind] ?? 0) > 0 || (save.discoveredEnemies ?? []).includes(kind),
    };
  });

  const bosses = Object.values(BOSS_DEFINITIONS).map((boss) => ({
    id: boss.id,
    boss,
    name: boss.name,
    worldIds: [boss.worldId],
    role: 'World Boss',
    discovered: (save.bossKillCounts[boss.id] ?? 0) > 0 || (save.discoveredBosses ?? []).includes(boss.id),
  }));

  return [...monsters, ...bosses];
}

function matchesFilter(entry: CodexEntry, filter: Filter): boolean {
  if (filter === 'all') return true;
  if (filter === 'bosses') return Boolean(entry.boss);
  const worldId = filters.find((item) => item.id === filter)?.worldId;
  return worldId !== undefined && entry.worldIds.includes(worldId);
}

function formatWeakness(weakness: DamageType[]): string {
  if (weakness.length === 0) return 'None';
  return weakness.map((value) => value.charAt(0).toUpperCase() + value.slice(1)).join(', ');
}

function formatResistance(resists: DamageType[]): string {
  if (resists.length === 0) return 'None';
  return resists.map((value) => value.charAt(0).toUpperCase() + value.slice(1)).join(', ');
}
