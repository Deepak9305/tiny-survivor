import { ArrowLeft, ArrowRight, Check, Infinity as InfinityIcon, Lock, Skull, Star } from 'lucide-react';
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
  const endlessUnlocked = save.highestUnlockedStage >= 6;
  const shiftWorld = (direction: number) => setWorldId(Math.min(4, Math.max(1, world.id + direction)));

  return <main className="map-screen">
    <ScreenHeader title="WORLD MAP" onBack={onBack} right={<span className="header-progress">{save.completedStages.length} / 20</span>} />
    <div className="map-scroll">
      <section className={`map-world-hero map-world-hero--world-${world.id} ${worldUnlocked ? '' : 'is-locked'}`} style={{ '--world-accent': world.color } as CSSProperties}>
        <div className="map-world-hero__scene" aria-hidden="true"><span /><i /><b /></div>
        <div className="map-world-hero__controls"><button type="button" onClick={() => shiftWorld(-1)} disabled={world.id === 1} aria-label="Previous world"><ArrowLeft size={18} /></button><span>WORLD SELECTOR</span><button type="button" onClick={() => shiftWorld(1)} disabled={world.id === 4} aria-label="Next world"><ArrowRight size={18} /></button></div>
        <div className="map-world-hero__copy"><span className="eyebrow">{worldUnlocked ? 'ADVENTURE PATH' : 'LOCKED FRONTIER'}</span><strong>WORLD {world.id}</strong><h1>{worldUnlocked ? world.name : '???'}</h1><p>{worldUnlocked ? world.subtitle : 'Clear the previous world to reveal this realm.'}</p></div>
        <div className="map-world-hero__stage">{worldUnlocked ? <><span>WORLD PROGRESS</span><strong>{completed} / 5 CLEARED</strong><small>{world.id === currentStage.worldId ? `CURRENT · ${currentStage.id}` : 'Explore the unlocked path'}</small></> : <><Lock size={19} /><strong>WORLD LOCKED</strong><small>Complete the previous world</small></>}</div>
      </section>
      <section className={`world-section world-section--world-${world.id} ${worldUnlocked ? '' : 'is-locked'}`} style={{ '--world-accent': world.color } as CSSProperties}>
        <div className="world-section__heading"><div><span className="eyebrow" style={{ color: world.color }}>WORLD {world.id}</span><h2>{worldUnlocked ? world.name : 'Uncharted Realm'}</h2><p>{worldUnlocked ? world.subtitle : 'The path is sealed.'}</p></div><span className="world-progress"><Star size={14} fill="currentColor" /> {worldUnlocked ? completed : 0}/5</span></div>
        <div className="stage-path">{worldStages.map((stage, index) => {
          const unlocked = worldUnlocked && isStageUnlocked(stage.id, save);
          const completedStage = save.completedStages.includes(stage.id);
          const current = stageNumber(stage.id) === save.highestUnlockedStage;
          return <button type="button" key={stage.id} className={`stage-node ${unlocked ? 'is-unlocked' : 'is-locked'} ${completedStage ? 'is-complete' : ''} ${current ? 'is-current' : ''} ${stage.bossStage ? 'is-boss' : ''} ${index % 2 === 0 ? 'is-left' : 'is-right'}`} onClick={() => unlocked && onSelect(stage.id)} disabled={!unlocked} aria-label={`${stage.name}, ${unlocked ? 'available' : 'locked'}`}>
            <span className="stage-node__line" /><span className="stage-node__circle">{stage.bossStage ? <Skull size={17} /> : completedStage ? <Check size={17} /> : unlocked ? <span>{stage.stageNumber}</span> : <Lock size={14} />}</span><span className="stage-node__copy"><strong>{stage.stageNumber}. {worldUnlocked ? stage.name : '????'}</strong><small>{stage.bossStage ? `${world.name.toUpperCase()} BOSS` : current ? 'CURRENT STAGE' : completedStage ? 'CLEARED' : `POWER ${stage.recommendedPower}`}</small></span>
          </button>;
        })}</div>
      </section>
      <button type="button" className={`endless-card ${endlessUnlocked ? 'is-unlocked' : 'is-locked'}`} disabled aria-label={endlessUnlocked ? 'Endless Survival, coming soon' : 'Endless Survival, locked'}><span className="endless-card__icon"><InfinityIcon size={32} /></span><span><strong>Endless Survival</strong><small>{endlessUnlocked ? 'Unlocked after World 1 · Coming soon' : 'Unlock after Stage 1-5'}</small></span><span className="endless-card__status">{endlessUnlocked ? 'SOON' : <Lock size={15} />}</span></button>
    </div>
  </main>;
}
