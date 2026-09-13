import { Check, Lock, Skull, Star } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { ScreenHeader } from '../components/ScreenHeader';
import { getStage, isStageUnlocked, stageNumber, STAGES, WORLD_META } from '../data/stages';
import type { SaveData, Screen } from '../types';

interface WorldMapScreenProps { save: SaveData; onBack: () => void; onNavigate: (screen: Screen) => void; onSelect: (stageId: string) => void }

export function WorldMapScreen({ save, onBack, onNavigate, onSelect }: WorldMapScreenProps) {
  return <main className="map-screen screen-with-nav"><ScreenHeader title="WORLD MAP" onBack={onBack} right={<span className="header-progress">{save.completedStages.length} / 20</span>} />
    <div className="map-scroll">{WORLD_META.map((world) => {
      const worldStages = STAGES.filter((stage) => stage.worldId === world.id);
      const completed = worldStages.filter((stage) => save.completedStages.includes(stage.id)).length;
      return <section className="world-section" key={world.id}>
        <div className="world-section__heading"><div><span className="eyebrow" style={{ color: world.color }}>WORLD {world.id}</span><h2>{world.name}</h2><p>{world.subtitle}</p></div><span className="world-progress"><Star size={14} fill="currentColor" /> {completed}/5</span></div>
        <div className="stage-path">{worldStages.map((stage, index) => {
          const unlocked = isStageUnlocked(stage.id, save);
          const completedStage = save.completedStages.includes(stage.id);
          const current = stageNumber(stage.id) === save.highestUnlockedStage;
          return <button key={stage.id} className={`stage-node ${unlocked ? 'is-unlocked' : 'is-locked'} ${completedStage ? 'is-complete' : ''} ${current ? 'is-current' : ''}`} onClick={() => unlocked && onSelect(stage.id)} disabled={!unlocked}>
            <span className="stage-node__line" />
            <span className="stage-node__circle">{stage.stageNumber === 5 ? <Skull size={17} /> : completedStage ? <Check size={17} /> : unlocked ? <span>{stage.stageNumber}</span> : <Lock size={14} />}</span>
            <span className="stage-node__copy"><strong>{stage.stageNumber}. {stage.name}</strong><small>{stage.stageNumber === 5 ? 'BOSS FIGHT' : current ? 'CURRENT STAGE' : completedStage ? 'CLEARED' : `POWER ${stage.recommendedPower}`}</small></span>
          </button>;
        })}</div>
      </section>;
    })}<button className="endless-card" onClick={() => onNavigate('stage')}><span className="endless-card__icon">∞</span><span><strong>Endless Survival</strong><small>Unlock after Stage 5 · {save.highestUnlockedStage >= 6 ? 'Available' : 'Locked'}</small></span></button></div>
    <BottomNav current="map" onNavigate={onNavigate} />
  </main>;
}
