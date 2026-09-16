import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Ghost,
  Leaf,
  Lightbulb,
  Lock,
  PawPrint,
  Shield,
  Skull,
  Snowflake,
  Swords,
  TreePine,
  Zap,
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

export function BestiaryScreen({ save, initialId = 'skeleton', onBack, onSelect }: BestiaryScreenProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedId, setSelectedId] = useState(initialId);

  const allEntries = createEntries(save);
  const visibleEntries = allEntries.filter((entry) => matchesFilter(entry, filter));
  const selected = allEntries.find((entry) => entry.id === selectedId) ?? visibleEntries[0] ?? allEntries[0];
  const currentIndex = Math.max(0, visibleEntries.findIndex((entry) => entry.id === selected?.id));
  const discoveredCount = allEntries.filter((entry) => entry.discovered).length;

  const selectEntry = (id: string) => {
    setSelectedId(id);
    onSelect(id);
  };

  const setActiveFilter = (nextFilter: Filter) => {
    setFilter(nextFilter);
    const first = allEntries.find((entry) => matchesFilter(entry, nextFilter));
    if (first && !matchesFilter(selected, nextFilter)) selectEntry(first.id);
  };

  const handlePrev = () => {
    if (visibleEntries.length <= 1) return;
    const nextIndex = (currentIndex - 1 + visibleEntries.length) % visibleEntries.length;
    selectEntry(visibleEntries[nextIndex].id);
  };

  const handleNext = () => {
    if (visibleEntries.length <= 1) return;
    const nextIndex = (currentIndex + 1) % visibleEntries.length;
    selectEntry(visibleEntries[nextIndex].id);
  };

  const monster = selected?.kind ? getMonsterDefinition(selected.kind) : undefined;
  const boss = selected?.boss;
  const balance = selected?.kind ? ENEMY_BALANCE[selected.kind] : boss;
  const weakness = boss?.weakness ?? monster?.weakness ?? [];
  const resistance = boss?.resistance ?? monster?.resistance ?? [];
  const kills = selected?.kind
    ? save.enemyKillCounts[selected.kind] ?? 0
    : save.bossKillCounts[selected?.id ?? ''] ?? 0;
  const previewWorldId = selected?.worldIds[0] ?? 1;

  return (
    <main className="codex-clean-screen codex-clean-screen--3d">
      <header className="codex-clean-header">
        <button type="button" className="codex-clean-back" onClick={onBack} aria-label="Back">
          <ChevronLeft size={18} />
        </button>
        <div className="codex-clean-heading">
          <span>FIELD ARCHIVE</span>
          <h1>Monster Codex</h1>
        </div>
        <div className="codex-clean-progress" aria-label={`${discoveredCount} of ${allEntries.length} monsters discovered`}>
          <strong>{discoveredCount}</strong>
          <span>/ {allEntries.length}</span>
          <small>discovered</small>
        </div>
      </header>

      <div className="codex-clean-layout">
        <aside className="codex-clean-index">
          <nav className="codex-clean-filters" aria-label="Codex categories">
            {filters.map((item) => (
              <button
                type="button"
                key={item.id}
                className={filter === item.id ? 'is-active' : ''}
                onClick={() => setActiveFilter(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="codex-clean-list">
            {visibleEntries.map((entry) => (
              <button
                type="button"
                key={entry.id}
                className={`codex-clean-row ${entry.id === selected?.id ? 'is-active' : ''}`}
                onClick={() => selectEntry(entry.id)}
              >
                <span className="codex-clean-row__thumb codex-clean-row__thumb--glyph">
                  {entry.discovered ? <CodexGlyph id={entry.id} size={18} /> : <Lock size={14} />}
                </span>
                <span className="codex-clean-row__copy">
                  <strong>{entry.discovered ? entry.name : 'Unknown'}</strong>
                  <small>{entry.discovered ? entry.role : 'Not encountered'}</small>
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className="codex-clean-subject" aria-label="Selected monster">
          <div className={`codex-clean-art codex-clean-art--3d ${selected?.discovered ? '' : 'is-locked'}`}>
            {selected && (
              <CreaturePreview3D
                kind={selected.kind}
                bossId={selected.boss?.id}
                worldId={previewWorldId}
                discovered={selected.discovered}
                className="codex-clean-art__model"
              />
            )}
            <div className="codex-clean-art__shade" />
            <div className="codex-clean-art__live-badge">LIVE 3D</div>
            <div className="codex-clean-art__caption">
              <span>{selected?.discovered ? selected.role : 'Unidentified threat'}</span>
              <strong>{selected?.discovered ? selected.name : 'Unknown'}</strong>
            </div>
          </div>

          <div className="codex-clean-stepper">
            <button type="button" onClick={handlePrev} aria-label="Previous entry">
              <ChevronLeft size={18} />
            </button>
            <span>{Math.max(1, currentIndex + 1)} / {Math.max(1, visibleEntries.length)}</span>
            <button type="button" onClick={handleNext} aria-label="Next entry">
              <ChevronRight size={18} />
            </button>
          </div>
        </section>

        <section className="codex-clean-dossier">
          {selected?.discovered ? (
            <div className="codex-clean-dossier__inner">
              <div className="codex-clean-dossier__top">
                <div>
                  <span className="codex-clean-kicker">THREAT DOSSIER</span>
                  <h2>{selected.name}</h2>
                  <p>{selected.role}</p>
                </div>
                <div className="codex-clean-kills">
                  <Skull size={14} />
                  <span>{kills.toLocaleString()} defeated</span>
                </div>
              </div>

              <div className="codex-clean-stats">
                <DossierStat label="Health" value={balance?.hp ?? 0} tone="health" />
                <DossierStat label="Damage" value={balance?.damage ?? 0} tone="damage" />
                <DossierStat label="Speed" value={Math.round(balance?.speed ?? 0)} tone="speed" />
              </div>

              <div className="codex-clean-affinities">
                <div>
                  <span>Weak to</span>
                  <strong><Swords size={13} /> {formatWeakness(weakness)}</strong>
                </div>
                <div>
                  <span>Resists</span>
                  <strong><Shield size={13} /> {formatResistance(resistance)}</strong>
                </div>
              </div>

              <div className="codex-clean-note">
                <span><Swords size={14} /> Attack pattern</span>
                <p>{monster?.behavior ?? boss?.description ?? 'Aggressive close-range pressure with a readable committed attack.'}</p>
              </div>

              <div className="codex-clean-note codex-clean-note--tip">
                <span><Lightbulb size={14} /> Counterplay</span>
                <p>{monster?.combatTip ?? 'Wait for the telegraph, move across the attack line, then punish the recovery window.'}</p>
              </div>
            </div>
          ) : (
            <div className="codex-clean-locked">
              <Lock size={34} />
              <h2>Entry locked</h2>
              <p>Encounter this enemy in a run to reveal its combat data and counterplay notes.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function DossierStat({ label, value, tone }: { label: string; value: number; tone: 'health' | 'damage' | 'speed' }) {
  return (
    <div className={`codex-clean-stat codex-clean-stat--${tone}`}>
      <span>{label}</span>
      <strong>{value.toLocaleString()}</strong>
    </div>
  );
}

function CodexGlyph({ id, size }: { id: string; size: number }) {
  if (id === 'cursed-wolf') return <PawPrint size={size} />;
  if (id === 'thornling') return <Leaf size={size} />;
  if (id === 'treant') return <TreePine size={size} />;
  if (id === 'frost-wraith' || id === 'ice-mage' || id === 'frost-golem') return <Snowflake size={size} />;
  if (id === 'ghost') return <Ghost size={size} />;
  if (id === 'demon' || id === 'imp' || id === 'demon-lord' || id === 'demon-warrior') return <Flame size={size} />;
  if (id === 'archer' || id === 'bone-mage' || id === 'forest-mage') return <Zap size={size} />;
  return <Skull size={size} />;
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
  return weakness.map(capitalize).join(', ');
}

function formatResistance(resists: DamageType[]): string {
  if (resists.length === 0) return 'None';
  return resists.map(capitalize).join(', ');
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
