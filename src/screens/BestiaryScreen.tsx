import { Check, ChevronLeft, Flame, Ghost, Lock, Shield, Skull, Sparkles, Swords, Zap } from 'lucide-react';
import { useState } from 'react';
import { CreaturePreview3D } from '../components/CreaturePreview3D';
import { ENEMY_BALANCE } from '../data/balance';
import { BOSS_DEFINITIONS, type BossDefinition } from '../data/bosses';
import { ALL_MONSTER_KINDS, getMonsterDefinition, type MonsterDefinition } from '../data/monsters';
import { WORLD_META } from '../data/stages';
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
    'skeleton-king': '/assets/images/boss_skeleton_king.jpg',
    'forest-witch': '/assets/images/boss_forest_witch.jpg',
    'frost-golem': '/assets/images/boss_frost_golem.jpg',
    'demon-lord': '/assets/images/boss_demon_lord.jpg',
  };
  return images[id];
}

export function BestiaryScreen({ save, initialId = 'skeleton', onBack, onSelect }: BestiaryScreenProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedId, setSelectedId] = useState(initialId);
  const allEntries = createEntries(save);
  const visibleEntries = allEntries.filter((entry) => matchesFilter(entry, filter));
  const selected = allEntries.find((entry) => entry.id === selectedId) ?? visibleEntries[0] ?? allEntries[0];

  const discoveredCount = allEntries.filter((e) => e.discovered).length;

  const selectEntry = (id: string) => {
    setSelectedId(id);
    onSelect(id);
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
  const worldName = WORLD_META[worldId - 1]?.name ?? 'Graveyard';
  const categoryTag = boss ? `WORLD BOSS · ${worldName.toUpperCase()}` : `MONSTER · ${worldName.toUpperCase()}`;

  return (
    <main className="meta-screen codex-screen-landscape">
      {/* Header Bar */}
      <header className="codex-header">
        <button type="button" className="codex-back-btn" onClick={onBack} aria-label="Back">
          <ChevronLeft size={24} />
        </button>
        <h1 className="codex-title">MONSTER CODEX</h1>
        <span className="codex-discovery-count">
          {discoveredCount} / {allEntries.length} DISCOVERED
        </span>
      </header>

      {/* 3-Column Landscape Body */}
      <div className="codex-tri-layout">
        {/* Left Column ~26%: Filter & Monster Roster */}
        <aside className="codex-roster-col">
          <nav className="codex-tabs-row" role="tablist" aria-label="Codex category tabs">
            {filters.map((item) => (
              <button
                type="button"
                key={item.id}
                role="tab"
                aria-selected={filter === item.id}
                className={`codex-tab-btn ${filter === item.id ? 'is-active' : ''}`}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="codex-roster-list">
            {visibleEntries.map((entry) => {
              const isSelected = entry.id === selected?.id;
              const imgUrl = getEntryImage(entry.id);

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
                    {entry.discovered && imgUrl ? (
                      <img src={imgUrl} alt={entry.name} className="codex-card__img" />
                    ) : entry.discovered ? (
                      <CodexIcon id={entry.id} />
                    ) : (
                      <Lock size={14} className="codex-lock-icon" />
                    )}
                  </div>
                  <div className="codex-roster-info">
                    <strong className="codex-roster-name">{entry.discovered ? entry.name : '???'}</strong>
                    <small className="codex-roster-sub">{entry.discovered ? entry.role : 'Undiscovered'}</small>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Center Column ~38%: 3D Model Stage */}
        <section className="codex-stage-col">
          <div className="codex-stage-container">
            <CreaturePreview3D
              kind={selected?.kind}
              bossId={boss?.id}
              worldId={worldId}
              discovered={selected?.discovered ?? false}
              className="codex-3d-canvas"
            />
            <div className="codex-stage-pedestal" />
          </div>
          <div className="codex-stage-tag">{selected?.discovered ? categoryTag : 'UNDISCOVERED'}</div>
        </section>

        {/* Right Column ~36%: Lore, Combat Behavior, Stats */}
        <section className="codex-intel-col">
          {selected?.discovered ? (
            <div className="codex-intel-content">
              <div className="codex-intel-header">
                <span className="eyebrow">{selected.role.toUpperCase()}</span>
                <h2>{selected.name}</h2>
              </div>

              {/* Stat Pips */}
              <div className="codex-stat-bars">
                <StatPips
                  label="Health"
                  value={balance ? Math.min(5, Math.max(1, Math.ceil(balance.hp / (selected.kind ? 55 : 550)))) : 2}
                />
                <StatPips
                  label="Damage"
                  value={balance ? Math.min(5, Math.max(1, Math.ceil(balance.damage / (selected.kind ? 7 : 7)))) : 3}
                />
                <StatPips
                  label="Speed"
                  value={balance ? Math.min(5, Math.max(1, Math.ceil(balance.speed / (selected.kind ? 15 : 7)))) : 2}
                />
              </div>

              {/* Elemental Affinities */}
              <div className="codex-affinity-row">
                <div className="codex-affinity-item">
                  <span className="codex-affinity-label">WEAK TO</span>
                  <span className="codex-badge codex-badge--weak">
                    <Swords size={13} /> {formatWeakness(weakness)}
                  </span>
                </div>
                <div className="codex-affinity-item">
                  <span className="codex-affinity-label">RESISTS</span>
                  <span className="codex-badge codex-badge--resist">{formatResistance(resistance)}</span>
                </div>
              </div>

              {/* Attack Pattern & Tip */}
              <div className="codex-combat-intel">
                <div className="codex-combat-section">
                  <span className="eyebrow">ATTACK BEHAVIOR</span>
                  <p>{monster?.behavior ?? boss?.description ?? 'Approaches and attacks in readable patterns.'}</p>
                </div>
                <div className="codex-combat-section codex-combat-section--tip">
                  <span className="eyebrow">TACTICAL COUNTER</span>
                  <p>{monster?.combatTip ?? 'Watch for the telegraph window and strike during recovery.'}</p>
                </div>
              </div>

              {/* Defeated Count */}
              <div className="codex-detail__kills">
                <Skull size={15} />
                <span>
                  Enemies Defeated: <strong>{kills.toLocaleString()}</strong>
                </span>
              </div>
            </div>
          ) : (
            <div className="codex-locked-panel">
              <Lock size={36} />
              <h3>Undiscovered Monster</h3>
              <p>Encounter this enemy or boss in the arena to analyze its attack telegraphs, stats, and elemental weaknesses.</p>
            </div>
          )}
        </section>
      </div>
    </main>
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
      discovered: save.discoveredEnemies.includes(kind),
    };
  });
  const bosses = (Object.values(BOSS_DEFINITIONS) as BossDefinition[]).map((boss) => ({
    id: boss.id,
    boss,
    name: boss.name,
    worldIds: [boss.worldId],
    role: 'World Boss',
    discovered: save.discoveredBosses.includes(boss.id),
  }));
  return [...monsters, ...bosses];
}

function matchesFilter(entry: CodexEntry, filter: Filter): boolean {
  if (filter === 'all') return true;
  if (filter === 'bosses') return Boolean(entry.boss);
  const worldId = filters.find((item) => item.id === filter)?.worldId;
  return Boolean(worldId && entry.worldIds.includes(worldId));
}

function StatPips({ label, value }: { label: string; value: number }) {
  return (
    <div className="codex-pip-row">
      <span className="codex-pip-label">{label}</span>
      <div className="codex-pips">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={`codex-pip ${i < value ? 'is-filled' : ''}`} />
        ))}
      </div>
    </div>
  );
}

function formatWeakness(types: DamageType[]): string {
  if (!types.length) return 'Physical';
  return types.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(', ');
}

function formatResistance(types: DamageType[]): string {
  if (!types.length) return 'None';
  return types.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(', ');
}

function CodexIcon({ id }: { id: string }) {
  if (id.includes('witch')) return <Sparkles size={20} />;
  if (id.includes('golem')) return <Shield size={20} />;
  if (id.includes('demon') || id.includes('imp')) return <Flame size={20} />;
  if (id.includes('ghost') || id.includes('bat')) return <Ghost size={20} />;
  return <Skull size={20} />;
}
