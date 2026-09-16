import { ChevronLeft, ChevronRight, Check, Lock, MapPinned, Skull, Star } from 'lucide-react';
import { useState } from 'react';
import type { CSSProperties } from 'react';
import { ScreenHeader } from '../components/ScreenHeader';
import { getCurrentStage, getWorldStages, isStageUnlocked, isWorldUnlocked, stageNumber, WORLD_META } from '../data/stages';
import type { SaveData } from '../types';

interface WorldMapScreenProps { save: SaveData; onBack: () => void; onSelect: (stageId: string) => void }

function getWorldBg(worldId: number): string {
  if (worldId === 2) return '/assets/images/bg_forest.jpg';
  if (worldId === 3) return '/assets/images/bg_frozen.jpg';
  if (worldId === 4) return '/assets/images/bg_castle.jpg';
  return '/assets/images/bg_graveyard.jpg';
}

function getWorldTrail(worldId: number) {
  switch (worldId) {
    case 1:
      return { path: 'M 25 72 Q 85 36 145 74 T 265 52 L 315 54', stroke: 'rgba(176, 200, 216, 0.88)', dash: '5,7' };
    case 2:
      return { path: 'M 25 80 C 75 35 110 95 170 55 S 255 85 315 50', stroke: 'rgba(74, 222, 128, 0.92)', dash: '4,8' };
    case 3:
      return { path: 'M 25 65 L 85 45 L 155 75 L 235 48 L 315 62', stroke: 'rgba(103, 232, 249, 0.92)', dash: '7,5' };
    case 4:
    default:
      return { path: 'M 25 85 Q 95 65 140 45 T 255 60 L 315 38', stroke: 'rgba(251, 146, 60, 0.94)', dash: '6,5' };
  }
}

export function WorldMapScreen({ save, onBack, onSelect }: WorldMapScreenProps) {
  const currentStage = getCurrentStage(save);
  const [worldId, setWorldId] = useState(currentStage.worldId);
  const world = WORLD_META.find((item) => item.id === worldId) ?? WORLD_META[0];
  const worldStages = getWorldStages(world.id);
  const worldUnlocked = isWorldUnlocked(world.id, save);
  const completed = worldStages.filter((stage) => save.completedStages.includes(stage.id)).length;
  const shiftWorld = (direction: number) => setWorldId(Math.min(4, Math.max(1, world.id + direction)));
  const trail = getWorldTrail(world.id);
  const worldBg = getWorldBg(world.id);

  return (
    <main className="map-screen">
      <ScreenHeader
        title="WORLD MAP"
        onBack={onBack}
        right={<span className="map-header-badge"><MapPinned size={15} /><strong>{completed}</strong>/5</span>}
      />

      <div
        className={`map-world-view map-world-view--world-${world.id} ${worldUnlocked ? '' : 'is-locked'}`}
        style={{ '--world-accent': world.color } as CSSProperties}
      >
        <div className="map-world-view__backdrop" style={{ backgroundImage: `url(${worldBg})` }} />
        <div className="map-world-view__cinematic-shade" />

        <section className="map-world-intro" aria-label={`World ${world.id} ${world.name}`}>
          <span className="map-world-intro__kicker">WORLD {String(world.id).padStart(2, '0')}</span>
          <h2>{world.name}</h2>
          <p>{world.subtitle}</p>
          <div className="map-world-intro__progress">
            <span><Star size={12} fill="currentColor" /> {completed}/5 CLEARED</span>
            <div className="map-world-intro__track"><i style={{ width: `${completed * 20}%` }} /></div>
          </div>
        </section>

        <button type="button" className="map-arrow map-arrow--left" onClick={() => shiftWorld(-1)} disabled={world.id === 1} aria-label="Previous world">
          <ChevronLeft size={28} />
        </button>
        <button type="button" className="map-arrow map-arrow--right" onClick={() => shiftWorld(1)} disabled={world.id === 4} aria-label="Next world">
          <ChevronRight size={28} />
        </button>

        <div className="map-stage-trail">
          <svg className="map-trail-svg" viewBox="0 0 340 120" preserveAspectRatio="none" aria-hidden="true">
            <path className="map-trail-svg__shadow" d={trail.path} fill="none" stroke="rgba(0,0,0,.55)" strokeWidth="8" />
            <path d={trail.path} fill="none" stroke={trail.stroke} strokeWidth="3" strokeDasharray={trail.dash} />
          </svg>

          <div className="map-nodes-container">
            {worldStages.map((stage) => {
              const unlocked = worldUnlocked && isStageUnlocked(stage.id, save);
              const completedStage = save.completedStages.includes(stage.id);
              const current = stageNumber(stage.id) === save.highestUnlockedStage;
              const isBoss = stage.bossStage;

              return (
                <button
                  type="button"
                  key={stage.id}
                  className={`map-node ${unlocked ? 'is-unlocked' : 'is-locked'} ${completedStage ? 'is-complete' : ''} ${current ? 'is-current' : ''} ${isBoss ? 'is-boss-node' : ''}`}
                  onClick={() => unlocked && onSelect(stage.id)}
                  disabled={!unlocked}
                  aria-label={`${stage.name}, ${unlocked ? 'available' : 'locked'}`}
                >
                  <div className="map-node__halo" />
                  <div className="map-node__circle">
                    {isBoss ? <Skull size={20} className="map-node__skull" /> : completedStage ? <Check size={18} /> : unlocked ? <span>{stage.stageNumber}</span> : <Lock size={14} />}
                  </div>
                  <span className="map-node__label">{isBoss ? 'BOSS' : `STAGE ${stage.stageNumber}`}</span>
                  <span className="map-node__name">{stage.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {!worldUnlocked && (
          <div className="map-world-locked-message"><Lock size={16} /><span>Clear the previous world to enter this realm.</span></div>
        )}

        <div className="map-world-carousel" role="tablist" aria-label="World selection">
          {WORLD_META.map((meta) => {
            const isMetaUnlocked = isWorldUnlocked(meta.id, save);
            const isSelected = meta.id === world.id;
            const metaStages = getWorldStages(meta.id);
            const metaCompleted = metaStages.filter((stage) => save.completedStages.includes(stage.id)).length;

            return (
              <button
                type="button"
                role="tab"
                aria-selected={isSelected}
                key={meta.id}
                className={`map-world-card map-world-card--world-${meta.id} ${isSelected ? 'is-selected' : ''} ${isMetaUnlocked ? 'is-unlocked' : 'is-locked'}`}
                onClick={() => setWorldId(meta.id)}
                aria-label={`World ${meta.id} ${meta.name}${isMetaUnlocked ? '' : ', locked'}`}
              >
                <div className="map-world-card__inner">
                  <span className="map-world-card__number">W{meta.id}</span>
                  <span className="map-world-card__copy">
                    <strong className="map-world-card__name">{meta.name}</strong>
                    <small>{isMetaUnlocked ? `${metaCompleted}/5 CLEARED` : 'LOCKED'}</small>
                  </span>
                  {!isMetaUnlocked && <Lock size={15} className="map-world-card__lock" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}
