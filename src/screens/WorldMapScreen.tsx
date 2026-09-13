import { Check, Infinity as InfinityIcon, Lock, Skull, Star } from 'lucide-react';
import { ScreenHeader } from '../components/ScreenHeader';
import { getCurrentStage, isStageUnlocked, stageNumber, STAGES, WORLD_META } from '../data/stages';
import type { SaveData } from '../types';
import type { CSSProperties } from 'react';

interface WorldMapScreenProps { save: SaveData; onBack: () => void; onSelect: (stageId: string) => void }

export function WorldMapScreen({ save, onBack, onSelect }: WorldMapScreenProps) {
  const currentStage = getCurrentStage(save);
  const currentWorld = WORLD_META.find((world) => world.id === currentStage.worldId) ?? WORLD_META[0];
  const endlessUnlocked = save.highestUnlockedStage >= 6;

  return <main className="map-screen"><ScreenHeader title="WORLD MAP" onBack={onBack} right={<span className="header-progress">{save.completedStages.length} / 20</span>} />
    <div className="map-scroll">
      <section className="map-world-hero" style={{ '--world-accent': currentWorld.color } as CSSProperties}>
        <div className="map-world-hero__copy"><span className="eyebrow">ADVENTURE PATH</span><strong>WORLD {currentWorld.id}</strong><h1>{currentWorld.name}</h1><p>{currentWorld.subtitle}</p></div>
        <div className="map-world-hero__stage"><span>CURRENT STAGE</span><strong>{currentStage.id} · {currentStage.name}</strong><small>{save.completedStages.filter((stageId) => stageId.startsWith(`${currentWorld.id}-`)).length} / 5 cleared</small></div>
      </section>
      {WORLD_META.map((world) => {
      const worldStages = STAGES.filter((stage) => stage.worldId === world.id);
      const completed = worldStages.filter((stage) => save.completedStages.includes(stage.id)).length;
      return <section className={`world-section ${world.id === currentWorld.id ? 'is-current-world' : ''}`} key={world.id} style={{ '--world-accent': world.color } as CSSProperties}>
        <div className="world-section__heading"><div><span className="eyebrow" style={{ color: world.color }}>WORLD {world.id}</span><h2>{world.name}</h2><p>{world.subtitle}</p></div><span className="world-progress"><Star size={14} fill="currentColor" /> {completed}/5</span></div>
        <div className="stage-path">{worldStages.map((stage, index) => {
          const unlocked = isStageUnlocked(stage.id, save);
          const completedStage = save.completedStages.includes(stage.id);
          const current = stageNumber(stage.id) === save.highestUnlockedStage;
          return <button type="button" key={stage.id} className={`stage-node ${unlocked ? 'is-unlocked' : 'is-locked'} ${completedStage ? 'is-complete' : ''} ${current ? 'is-current' : ''} ${stage.stageNumber === 5 ? 'is-boss' : ''} ${index % 2 === 0 ? 'is-left' : 'is-right'}`} onClick={() => unlocked && onSelect(stage.id)} disabled={!unlocked} aria-label={`${stage.name}, ${unlocked ? 'available' : 'locked'}`}>
            <span className="stage-node__line" />
            <span className="stage-node__circle">{stage.stageNumber === 5 ? <Skull size={17} /> : completedStage ? <Check size={17} /> : unlocked ? <span>{stage.stageNumber}</span> : <Lock size={14} />}</span>
            <span className="stage-node__copy"><strong>{stage.stageNumber}. {stage.name}</strong><small>{stage.stageNumber === 5 ? 'BOSS FIGHT' : current ? 'CURRENT STAGE' : completedStage ? 'CLEARED' : `POWER ${stage.recommendedPower}`}</small></span>
          </button>;
      })}</div>
      </section>;
    })}
      <button type="button" className={`endless-card ${endlessUnlocked ? 'is-unlocked' : 'is-locked'}`} disabled aria-label={endlessUnlocked ? 'Endless Survival, coming soon' : 'Endless Survival, locked'}><span className="endless-card__icon"><InfinityIcon size={32} /></span><span><strong>Endless Survival</strong><small>{endlessUnlocked ? 'Unlocked after World 1 · Coming soon' : 'Unlock after Stage 1-5'}</small></span><span className="endless-card__status">{endlessUnlocked ? 'SOON' : <Lock size={15} />}</span></button>
    </div>
  </main>;
}
