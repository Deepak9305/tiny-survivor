import { BookOpen, Check, Flame, Ghost, Heart, Lock, Shield, Skull, Sparkles, Swords, Zap } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { ScreenHeader } from '../components/ScreenHeader';
import { CreaturePreview3D } from '../components/CreaturePreview3D';
import { ENEMY_BALANCE } from '../data/balance';
import { BOSS_DEFINITIONS, type BossDefinition } from '../data/bosses';
import { ALL_MONSTER_KINDS, getMonsterDefinition, type MonsterDefinition } from '../data/monsters';
import { WORLD_META } from '../data/stages';
import type { BossId, DamageType, EnemyKind, SaveData } from '../types';

type Filter = 'all' | 'graveyard' | 'forest' | 'frozen' | 'castle' | 'bosses';
type CodexEntry = { id: string; kind?: EnemyKind; boss?: BossDefinition; name: string; worldIds: number[]; role: string; discovered: boolean };

interface BestiaryScreenProps {
  save: SaveData;
  initialId?: string;
  onBack: () => void;
  onSelect: (id: string) => void;
}

const filters: Array<{ id: Filter; label: string; worldId?: number }> = [
  { id: 'all', label: 'ALL' }, { id: 'graveyard', label: 'GRAVEYARD', worldId: 1 }, { id: 'forest', label: 'FOREST', worldId: 2 },
  { id: 'frozen', label: 'FROZEN', worldId: 3 }, { id: 'castle', label: 'CASTLE', worldId: 4 }, { id: 'bosses', label: 'BOSSES' },
];

export function BestiaryScreen({ save, initialId = 'skeleton', onBack, onSelect }: BestiaryScreenProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedId, setSelectedId] = useState(initialId);
  const allEntries = createEntries(save);
  const visibleEntries = allEntries.filter((entry) => matchesFilter(entry, filter));
  const selected = allEntries.find((entry) => entry.id === selectedId) ?? visibleEntries[0] ?? allEntries[0];

  const selectEntry = (id: string) => { setSelectedId(id); onSelect(id); };
  return <main className="meta-screen bestiary-screen">
    <ScreenHeader title="MONSTER CODEX" onBack={onBack} right={<span className="header-progress">{allEntries.filter((entry) => entry.discovered).length} / {allEntries.length} DISCOVERED</span>} />
    <section className="bestiary-intro"><div className="bestiary-intro__icon"><BookOpen size={23} /></div><div><span className="eyebrow">FIELD GUIDE</span><h1>Know what hunts you.</h1><p>Every first encounter reveals a new entry.</p></div></section>
    <div className="bestiary-filters" role="tablist" aria-label="Codex filters">{filters.map((item) => <button type="button" role="tab" aria-selected={filter === item.id} className={filter === item.id ? 'is-active' : ''} key={item.id} onClick={() => setFilter(item.id)}>{item.label}</button>)}</div>
    <section className="bestiary-list" aria-label="Codex entries">{visibleEntries.map((entry) => <button type="button" key={entry.id} className={`bestiary-entry ${entry.id === selected?.id ? 'is-selected' : ''} ${entry.discovered ? 'is-discovered' : 'is-locked'}`} onClick={() => selectEntry(entry.id)}><span className={`codex-glyph codex-glyph--${entry.id}`}><CodexIcon id={entry.id} /></span><span><strong>{entry.discovered ? entry.name : '???'}</strong><small>{entry.discovered ? entry.role : 'NOT YET ENCOUNTERED'}</small></span>{entry.discovered ? <Check size={15} /> : <Lock size={14} />}</button>)}</section>
    {selected && <CodexDetail entry={selected} save={save} />}
  </main>;
}

function createEntries(save: SaveData): CodexEntry[] {
  const monsters = ALL_MONSTER_KINDS.map((kind) => {
    const monster = getMonsterDefinition(kind);
    return { id: kind, kind, name: monster.name, worldIds: monster.worldIds, role: monster.role, discovered: save.discoveredEnemies.includes(kind) };
  });
  const bosses = (Object.values(BOSS_DEFINITIONS) as BossDefinition[]).map((boss) => ({ id: boss.id, boss, name: boss.name, worldIds: [boss.worldId], role: 'World boss', discovered: save.discoveredBosses.includes(boss.id) }));
  return [...monsters, ...bosses];
}

function matchesFilter(entry: CodexEntry, filter: Filter): boolean {
  if (filter === 'all') return true;
  if (filter === 'bosses') return Boolean(entry.boss);
  const worldId = filters.find((item) => item.id === filter)?.worldId;
  return Boolean(worldId && entry.worldIds.includes(worldId));
}

function CodexDetail({ entry, save }: { entry: CodexEntry; save: SaveData }) {
  const discovered = entry.discovered;
  const monster = entry.kind ? getMonsterDefinition(entry.kind) : undefined;
  const boss = entry.boss;
  const worldId = boss?.worldId ?? monster?.worldIds[0] ?? 1;
  const id = entry.kind ?? boss?.id;
  const balance = entry.kind ? ENEMY_BALANCE[entry.kind] : boss;
  const weakness = boss?.weakness ?? monster?.weakness ?? [];
  const resistance = boss?.resistance ?? monster?.resistance ?? [];
  return <section className={`bestiary-detail ${discovered ? 'is-discovered' : 'is-locked'}`}>
    <div className="bestiary-detail__world"><span className="eyebrow">{boss ? 'WORLD BOSS' : 'ENCOUNTERED IN'}</span><strong>{boss ? `${WORLD_META[worldId - 1]?.name ?? 'WORLD'} · CROWNED THREAT` : monster?.worldIds.map((idValue) => WORLD_META[idValue - 1]?.name).join(' · ')}</strong></div>
    <CreaturePreview3D kind={entry.kind} bossId={boss?.id} worldId={worldId} discovered={discovered} />
    <div className="bestiary-detail__heading">{boss && discovered && <span className="bestiary-boss-badge"><Skull size={13} /> BOSS</span>}<h2>{discovered ? entry.name : 'UNIDENTIFIED THREAT'}</h2><p>{discovered ? (boss?.description ?? monster?.description) : 'Encounter this creature in a run to reveal its identity.'}</p></div>
    {discovered && <>
      <div className="bestiary-ratings"><Rating label="HEALTH" value={balance ? Math.min(5, Math.ceil(balance.hp / (entry.kind ? 55 : 580))) : 1} icon={<Heart size={14} />} /><Rating label="DAMAGE" value={balance ? Math.min(5, Math.ceil(balance.damage / (entry.kind ? 8 : 8))) : 1} icon={<Swords size={14} />} /><Rating label="SPEED" value={balance ? Math.min(5, Math.ceil(balance.speed / (entry.kind ? 16 : 8))) : 1} icon={<Zap size={14} />} /></div>
      <div className="bestiary-facts"><Fact label="BEHAVIOR" value={boss ? boss.attackSet.map((attack) => attack.replaceAll('-', ' ')).join(' · ') : monster?.behavior ?? ''} /><Fact label="WEAK TO" value={formatTypes(weakness)} tone="good" /><Fact label="RESISTS" value={formatTypes(resistance)} tone="danger" /><Fact label="COMBAT TIP" value={boss ? `Watch the telegraph, then punish the ${formatTypes(boss.weakness)} weakness.` : monster?.combatTip ?? ''} /></div>
      <div className="bestiary-footer"><span><strong>{entry.kind ? save.enemyKillCounts[entry.kind] ?? 0 : save.bossKillCounts[entry.id] ?? 0}</strong><small>KILLED</small></span><span><strong>{boss ? `WORLD ${worldId} · STAGE 5` : `WORLD ${monster?.worldIds[0] ?? worldId}`}</strong><small>FIRST SEEN</small></span></div>
    </>}
  </section>;
}

function Rating({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return <span className="bestiary-rating"><small>{icon} {label}</small><i>{Array.from({ length: 5 }, (_, index) => <b className={index < value ? 'is-on' : ''} key={index} />)}</i></span>;
}

function Fact({ label, value, tone = '' }: { label: string; value: string; tone?: string }) { return <div className={`bestiary-fact ${tone ? `is-${tone}` : ''}`}><small>{label}</small><strong>{value || 'NONE'}</strong></div>; }

function formatTypes(types: DamageType[]): string { return types.length ? types.map((type) => type.toUpperCase()).join(' · ') : 'NONE'; }

function CodexIcon({ id }: { id: string }) {
  if (id.includes('witch')) return <Sparkles size={17} />;
  if (id.includes('golem')) return <Shield size={17} />;
  if (id.includes('demon') || id.includes('imp')) return <Flame size={17} />;
  if (id.includes('ghost')) return <Ghost size={17} />;
  return <Skull size={17} />;
}
