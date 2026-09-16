import { ChevronLeft, ChevronRight, Check, Lock, MapPinned, Skull, Star } from 'lucide-react';
import { useState, type CSSProperties } from 'react';
import { ScreenHeader } from '../components/ScreenHeader';
import { getCurrentStage, getWorldStages, isStageUnlocked, isWorldUnlocked, stageNumber, WORLD_META } from '../data/stages';
import type { SaveData } from '../types';

interface WorldMapScreenProps { save: SaveData; onBack: () => void; onSelect: (stageId: string) => void }

type RoutePoint = { x: number; y: number };
const ROUTE_POINTS: RoutePoint[] = [
  { x: 8, y: 72 }, { x: 17, y: 57 }, { x: 27, y: 68 }, { x: 37, y: 45 }, { x: 47, y: 55 },
  { x: 57, y: 34 }, { x: 67, y: 47 }, { x: 77, y: 25 }, { x: 87, y: 38 }, { x: 94, y: 18 },
];

function getWorldBg(worldId: number): string {
  if (worldId === 2) return '/assets/images/bg_forest.jpg';
  if (worldId === 3) return '/assets/images/bg_frozen.jpg';
  if (worldId === 4) return '/assets/images/bg_castle.jpg';
  return '/assets/images/bg_graveyard.jpg';
}

function routePath(points: RoutePoint[]): string {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x * 10} ${point.y * 3.6}`).join(' ');
}

export function WorldMapScreen({ save, onBack, onSelect }: WorldMapScreenProps) {
  const currentStage = getCurrentStage(save);
  const [worldId, setWorldId] = useState(currentStage.worldId);
  const world = WORLD_META.find((item) => item.id === worldId) ?? WORLD_META[0];
  const worldStages = getWorldStages(world.id);
  const worldUnlocked = isWorldUnlocked(world.id, save);
  const completed = worldStages.filter((stage) => save.completedStages.includes(stage.id)).length;
  const stageCount = Math.max(1, worldStages.length);
  const progress = Math.round((completed / stageCount) * 100);
  const shiftWorld = (direction: number) => setWorldId(Math.min(4, Math.max(1, world.id + direction)));
  const path = routePath(ROUTE_POINTS.slice(0, stageCount));

  return (
    <main className="campaign-map-screen">
      <ScreenHeader
        title="WORLD MAP"
        onBack={onBack}
        right={<span className="campaign-map-header-progress"><MapPinned size={15} /><strong>{completed}</strong>/{stageCount}</span>}
      />

      <section
        className={`campaign-map-frame campaign-map-frame--world-${world.id} ${worldUnlocked ? '' : 'is-locked'}`}
        style={{ '--world-accent': world.color, '--map-bg': `url(${getWorldBg(world.id)})` } as CSSProperties}
      >
        <div className="campaign-map-backdrop" aria-hidden="true" />
        <div className="campaign-map-vignette" aria-hidden="true" />
        <div className="campaign-map-boundary" aria-hidden="true" />

        <div className="campaign-map-title">
          <span>WORLD {String(world.id).padStart(2, '0')}</span>
          <h1>{world.name}</h1>
          <p>{world.subtitle}</p>
          <div className="campaign-map-progress">
            <div><Star size={11} fill="currentColor" /><strong>{completed}/{stageCount}</strong><span>CLEARED</span></div>
            <div className="campaign-map-progress__track"><i style={{ width: `${progress}%` }} /></div>
          </div>
        </div>

        <button type="button" className="campaign-map-arrow campaign-map-arrow--left" onClick={() => shiftWorld(-1)} disabled={world.id === 1} aria-label="Previous world">
          <ChevronLeft size={24} />
        </button>
        <button type="button" className="campaign-map-arrow campaign-map-arrow--right" onClick={() => shiftWorld(1)} disabled={world.id === 4} aria-label="Next world">
          <ChevronRight size={24} />
        </button>

        <div className="campaign-map-route" aria-label={`${world.name} stages`}>
          <svg viewBox="0 0 1000 360" preserveAspectRatio="none" aria-hidden="true">
            <path d={path} className="campaign-map-route__shadow" />
            <path d={path} className="campaign-map-route__line" />
          </svg>

          {worldStages.map((stage, index) => {
            const point = ROUTE_POINTS[index] ?? ROUTE_POINTS[ROUTE_POINTS.length - 1];
            const unlocked = worldUnlocked && isStageUnlocked(stage.id, save);
            const completedStage = save.completedStages.includes(stage.id);
            const current = stageNumber(stage.id) === save.highestUnlockedStage;
            const isBoss = stage.bossStage;
            return (
              <button
                type="button"
                key={stage.id}
                className={`campaign-stage-node ${unlocked ? 'is-unlocked' : 'is-locked'} ${completedStage ? 'is-complete' : ''} ${current ? 'is-current' : ''} ${isBoss ? 'is-boss' : ''}`}
                style={{ left: `${point.x}%`, top: `${point.y}%` }}
                onClick={() => unlocked && onSelect(stage.id)}
                disabled={!unlocked}
                aria-label={`${stage.name}, stage ${stage.stageNumber}, ${unlocked ? 'available' : 'locked'}`}
              >
                <span className="campaign-stage-node__ring" />
                <span className="campaign-stage-node__core">
                  {isBoss ? <Skull size={18} /> : completedStage ? <Check size={16} /> : unlocked ? stage.stageNumber : <Lock size={13} />}
                </span>
                <span className="campaign-stage-node__label">{isBoss ? 'BOSS' : String(stage.stageNumber).padStart(2, '0')}</span>
                <span className="campaign-stage-node__name">{stage.name}</span>
              </button>
            );
          })}
        </div>

        {!worldUnlocked && (
          <div className="campaign-map-locked"><Lock size={15} /> Clear the previous world to enter this realm.</div>
        )}

        <nav className="campaign-world-strip" aria-label="World selection">
          {WORLD_META.map((meta) => {
            const unlocked = isWorldUnlocked(meta.id, save);
            const selected = meta.id === world.id;
            const stages = getWorldStages(meta.id);
            const cleared = stages.filter((stage) => save.completedStages.includes(stage.id)).length;
            return (
              <button
                type="button"
                key={meta.id}
                className={`${selected ? 'is-selected' : ''} ${unlocked ? '' : 'is-locked'}`}
                onClick={() => setWorldId(meta.id)}
                aria-pressed={selected}
              >
                <span>W{meta.id}</span>
                <strong>{meta.name}</strong>
                <small>{unlocked ? `${cleared}/${stages.length}` : 'LOCKED'}</small>
                {!unlocked && <Lock size={12} />}
              </button>
            );
          })}
        </nav>
      </section>
    </main>
  );
}
