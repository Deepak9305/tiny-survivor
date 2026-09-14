import { ChevronLeft, ChevronRight, Check, Lock, Moon, Skull, Star } from 'lucide-react';
import { useState } from 'react';
import type { CSSProperties } from 'react';
import { ScreenHeader } from '../components/ScreenHeader';
import { getCurrentStage, getWorldStages, isStageUnlocked, isWorldUnlocked, stageNumber, WORLD_META } from '../data/stages';
import type { SaveData } from '../types';

interface WorldMapScreenProps { save: SaveData; onBack: () => void; onSelect: (stageId: string) => void }

export function WorldMapScreen({ save, onBack, onSelect }: WorldMapScreenProps) {
  const currentStage = getCurrentStage(save);
  const [worldId, setWorldId] = useState(currentStage.worldId);
  const world = WORLD_META.find((item) => item.id === worldId) ?? WORLD_META[0];
  const worldStages = getWorldStages(world.id);
  const worldUnlocked = isWorldUnlocked(world.id, save);
  const completed = worldStages.filter((stage) => save.completedStages.includes(stage.id)).length;
  const shiftWorld = (direction: number) => setWorldId(Math.min(4, Math.max(1, world.id + direction)));

  return <main className="map-screen">
    <ScreenHeader
      title={`World ${world.id} ${world.name.toUpperCase()}`}
      onBack={onBack}
      right={<span className="map-header-badge"><Moon size={16} /></span>}
    />

    <div className={`map-world-view map-world-view--world-${world.id} ${worldUnlocked ? '' : 'is-locked'}`} style={{ '--world-accent': world.color } as CSSProperties}>
      <div className="map-world-view__backdrop" />
      
      {/* Left / Right World Switchers */}
      <button
        type="button"
        className="map-arrow map-arrow--left"
        onClick={() => shiftWorld(-1)}
        disabled={world.id === 1}
        aria-label="Previous world"
      >
        <ChevronLeft size={28} />
      </button>

      <button
        type="button"
        className="map-arrow map-arrow--right"
        onClick={() => shiftWorld(1)}
        disabled={world.id === 4}
        aria-label="Next world"
      >
        <ChevronRight size={28} />
      </button>

      {/* Center Stage Path (1 - 2 - 3 - 4 - BOSS) */}
      <div className="map-stage-trail">
        <svg className="map-trail-svg" viewBox="0 0 340 120" preserveAspectRatio="none">
          <path d="M 30 70 Q 90 40 150 70 T 270 60 L 310 60" fill="none" stroke="rgba(120, 200, 255, 0.3)" strokeWidth="4" strokeDasharray="6,6" />
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
                <div className="map-node__circle">
                  {isBoss ? (
                    <Skull size={20} className="map-node__skull" />
                  ) : completedStage ? (
                    <Check size={18} />
                  ) : unlocked ? (
                    <span>{stage.stageNumber}</span>
                  ) : (
                    <Lock size={14} />
                  )}
                </div>
                <span className="map-node__label">{isBoss ? 'BOSS' : stage.stageNumber}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="map-progress-pill">
        <Star size={13} fill="currentColor" />
        <span>{completed}/5 Completed</span>
      </div>

      {/* Bottom World Selection Cards */}
      <div className="map-world-carousel">
        {WORLD_META.map((meta) => {
          const isMetaUnlocked = isWorldUnlocked(meta.id, save);
          const isSelected = meta.id === world.id;

          return (
            <button
              type="button"
              key={meta.id}
              className={`map-world-card map-world-card--world-${meta.id} ${isSelected ? 'is-selected' : ''} ${isMetaUnlocked ? 'is-unlocked' : 'is-locked'}`}
              onClick={() => setWorldId(meta.id)}
              aria-label={`World ${meta.id} ${meta.name}${isMetaUnlocked ? '' : ', locked'}`}
            >
              <div className="map-world-card__inner">
                <span className="map-world-card__name">World {meta.id}</span>
                {!isMetaUnlocked && <Lock size={18} className="map-world-card__lock" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  </main>;
}
