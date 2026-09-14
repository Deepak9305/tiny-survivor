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

  return (
    <main className="meta-screen codex-screen">
      {/* Top Bar */}
      <header className="codex-header">
        <button type="button" className="codex-back-btn" onClick={onBack} aria-label="Back">
          <ChevronLeft size={24} />
        </button>
        <h1 className="codex-title">Monster Codex</h1>
        <span className="codex-discovery-count">
          {discoveredCount} / {allEntries.length} Discovered
        </span>
      </header>

      {/* Filter Tabs */}
      <nav className="codex-tabs" role="tablist" aria-label="Codex category tabs">
        {filters.map((item) => (
          <button
            type="button"
            key={item.id}
            role="tab"
            aria-selected={filter === item.id}
            className={`codex-tab ${filter === item.id ? 'is-active' : ''}`}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* Split Two-Column Body */}
      <div className="codex-split-container">
        {/* Left Column: Monster List */}
        <div className="codex-left-col">
          {visibleEntries.map((entry) => {
            const isSelected = entry.id === selected?.id;
            const imgUrl = getEntryImage(entry.id);

            return (
              <button
                type="button"
                key={entry.id}
                className={`codex-card ${isSelected ? 'is-selected' : ''} ${entry.discovered ? 'is-discovered' : 'is-locked'}`}
                onClick={() => selectEntry(entry.id)}
              >
                <div className="codex-card__thumb">
                  {entry.discovered && imgUrl ? (
                    <img src={imgUrl} alt={entry.name} className="codex-card__img" />
                  ) : entry.discovered ? (
                    <CodexIcon id={entry.id} />
                  ) : (
                    <Lock size={16} className="codex-lock-icon" />
                  )}
                </div>
                <span className="codex-card__name">
                  {entry.discovered ? entry.name : '???'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Column: Creature Detail Panel */}
        <div className="codex-right-col">
          {selected && <CodexDetailPanel entry={selected} save={save} />}
        </div>
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

function CodexDetailPanel({ entry, save }: { entry: CodexEntry; save: SaveData }) {
  const discovered = entry.discovered;
  const monster = entry.kind ? getMonsterDefinition(entry.kind) : undefined;
  const boss = entry.boss;
  const worldId = boss?.worldId ?? monster?.worldIds[0] ?? 1;
  const balance = entry.kind ? ENEMY_BALANCE[entry.kind] : boss;
  const weakness = boss?.weakness ?? monster?.weakness ?? [];
  const resistance = boss?.resistance ?? monster?.resistance ?? [];

  const kills = entry.kind
    ? save.enemyKillCounts[entry.kind] ?? 0
    : save.bossKillCounts[entry.id] ?? 0;

  const worldName = WORLD_META[worldId - 1]?.name ?? 'Graveyard';
  const categoryTag = boss ? `Boss • ${worldName}` : `Undead • ${worldName}`;

  return (
    <div className={`codex-detail ${discovered ? 'is-discovered' : 'is-locked'}`}>
      {/* 3D Model View */}
      <div className="codex-detail__preview">
        <CreaturePreview3D
          kind={entry.kind}
          bossId={boss?.id}
          worldId={worldId}
          discovered={discovered}
          className="codex-3d-model"
        />
      </div>

      {/* Creature Name & Category */}
      <div className="codex-detail__header">
        <h2>{discovered ? entry.name : 'Unknown Creature'}</h2>
        <span className="codex-detail__category">
          {discovered ? categoryTag : 'Unidentified • Mystery'}
        </span>
      </div>

      {discovered ? (
        <>
          {/* 5-Pip Stat Bars */}
          <div className="codex-stat-bars">
            <StatPips
              label="Health"
              value={balance ? Math.min(5, Math.max(1, Math.ceil(balance.hp / (entry.kind ? 55 : 550)))) : 2}
            />
            <StatPips
              label="Damage"
              value={balance ? Math.min(5, Math.max(1, Math.ceil(balance.damage / (entry.kind ? 7 : 7)))) : 3}
            />
            <StatPips
              label="Speed"
              value={balance ? Math.min(5, Math.max(1, Math.ceil(balance.speed / (entry.kind ? 15 : 7)))) : 2}
            />
          </div>

          {/* Weakness & Resistance Badges */}
          <div className="codex-affinity-row">
            <div className="codex-affinity-item">
              <span className="codex-affinity-label">Weak to</span>
              <span className="codex-badge codex-badge--weak">
                <Swords size={12} /> {formatWeakness(weakness)}
              </span>
            </div>
            <div className="codex-affinity-item">
              <span className="codex-affinity-label">Resists</span>
              <span className="codex-badge codex-badge--resist">
                {formatResistance(resistance)}
              </span>
            </div>
          </div>

          {/* Description / Combat Tip */}
          <p className="codex-detail__desc">
            {boss?.description ?? monster?.description ?? monster?.combatTip ?? 'Approaches the survivor.'}
          </p>

          {/* Kill Count */}
          <div className="codex-detail__kills">
            Killed: <strong>{kills.toLocaleString()}</strong>
          </div>
        </>
      ) : (
        <div className="codex-detail__locked-msg">
          <Lock size={28} />
          <p>Encounter this creature in battle to unlock lore, combat stats, and weaknesses.</p>
        </div>
      )}
    </div>
  );
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

