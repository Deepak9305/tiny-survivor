import { useEffect, useState } from 'react';
import { Compass, Sparkles, Swords } from 'lucide-react';
import type { StageDefinition } from '../types';
import { WORLD_META } from '../data/stages';
import { getRandomGameplayTip } from '../data/assets';

interface StagePreloadScreenProps {
  stage: StageDefinition;
  progress: number; // 0 - 100
}

export function StagePreloadScreen({ stage, progress }: StagePreloadScreenProps) {
  const world = WORLD_META.find((w) => w.id === stage.worldId) ?? WORLD_META[0];
  const [tip] = useState(() => getRandomGameplayTip());

  return (
    <div className={`stage-preload-screen stage-preload-screen--world-${stage.worldId}`}>
      <div className="stage-preload__shade" />
      <div className="stage-preload__content">
        <div className="stage-preload__header">
          <span className="eyebrow" style={{ color: world.color }}>
            WORLD {stage.worldId} · {world.name.toUpperCase()}
          </span>
          <h1>{stage.name}</h1>
          <p className="stage-preload__subtitle">{stage.description}</p>
        </div>

        <div className="stage-preload__badge">
          {stage.bossStage ? (
            <span className="stage-badge stage-badge--boss">
              <Swords size={18} /> WORLD BOSS ENGAGEMENT
            </span>
          ) : (
            <span className="stage-badge">
              <Compass size={18} /> SURVIVAL RUN
            </span>
          )}
        </div>

        <div className="stage-preload__center">
          <div className="stage-preload__pulse-circle">
            <Sparkles size={32} className="stage-preload__sparkle" />
          </div>
        </div>

        <div className="stage-preload__footer">
          <div className="stage-preload__progress-bar">
            <div
              className="stage-preload__progress-fill"
              style={{ width: `${Math.min(100, Math.max(12, progress))}%` }}
            />
          </div>
          <div className="stage-preload__meta">
            <span>Loading realm assets...</span>
            <strong>{Math.round(progress)}%</strong>
          </div>

          <div className="stage-preload__tip">
            <small>TIP</small>
            <p>{tip}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
