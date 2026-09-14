import { ChevronLeft, ChevronRight, Check, Lock, Moon, Skull, Star } from 'lucide-react';
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
      return {
        path: 'M 25 72 Q 85 36 145 74 T 265 52 L 315 54',
        stroke: 'rgba(148, 163, 184, 0.75)',
        dash: '6,6',
      };
    case 2:
      return {
        path: 'M 25 80 C 75 35 110 95 170 55 S 255 85 315 50',
        stroke: 'rgba(52, 211, 153, 0.8)',
        dash: '4,8',
      };
    case 3:
      return {
        path: 'M 25 65 L 85 45 L 155 75 L 235 48 L 315 62',
        stroke: 'rgba(56, 189, 248, 0.85)',
        dash: '8,4',
      };
    case 4:
    default:
      return {
        path: 'M 25 85 Q 95 65 140 45 T 255 60 L 315 38',
        stroke: 'rgba(249, 115, 22, 0.85)',
        dash: '6,4',
      };
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
        title={`World ${world.id} ${world.name.toUpperCase()}`}
        onBack={onBack}
        right={<span className="map-header-badge"><Moon size={16} /></span>}
      />

      <div
        className={`map-world-view map-world-view--world-${world.id} ${worldUnlocked ? '' : 'is-locked'}`}
        style={{ '--world-accent': world.color } as CSSProperties}
      >
        <div className="map-world-view__backdrop" style={{ backgroundImage: `url(${worldBg})` }} />

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

        {/* Center World-Specific Stage Path (1 - 2 - 3 - 4 - BOSS) */}
        <div className="map-stage-trail">
          <svg className="map-trail-svg" viewBox="0 0 340 120" preserveAspectRatio="none">
            <path
              d={trail.path}
              fill="none"
              stroke={trail.stroke}
              strokeWidth="4"
              strokeDasharray={trail.dash}
            />
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
    </main>
  );
}
