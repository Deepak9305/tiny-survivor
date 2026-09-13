import { ArrowRight, Clock3, Gem, Shield, Skull, Star, Swords } from 'lucide-react';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { getStage } from '../data/stages';
import type { SaveData } from '../types';

interface StageDetailScreenProps { stageId: string; save: SaveData; onBack: () => void; onStart: () => void }

const enemyName: Record<string, string> = { skeleton: 'Skeleton', bat: 'Bat', slime: 'Slime', ghost: 'Ghost', archer: 'Archer', knight: 'Knight', demon: 'Demon', imp: 'Imp' };

export function StageDetailScreen({ stageId, save, onBack, onStart }: StageDetailScreenProps) {
  const stage = getStage(stageId);
  const best = save.bestStageTimes[stage.id];
  return <main className="stage-detail-screen"><ScreenHeader title={`WORLD ${stage.worldId} · STAGE ${stage.stageNumber}`} onBack={onBack} />
    <section className="stage-art" style={{ backgroundImage: "url('/assets/tiny-survivor-key-art.png')" }}><div className="stage-art__shade" /><span className="eyebrow">{stage.biome.toUpperCase()}</span><h1>{stage.worldId}-{stage.stageNumber}<span>{stage.name}</span></h1><p>{stage.description}</p><div className="stage-art__boss"><Skull size={15} /> BOSS · {stage.bossName.toUpperCase()}</div></section>
    <section className="stage-info-card"><div className="stage-info-card__stats"><span><Clock3 size={15} />{Math.floor(stage.duration / 60)}:{String(stage.duration % 60).padStart(2, '0')} target</span><span><Shield size={15} />Power {stage.recommendedPower || '—'}</span><span><Star size={15} fill="currentColor" />First clear</span></div><h3>Possible enemies</h3><div className="enemy-chips">{stage.enemies.slice(0, 5).map((enemy) => <span key={enemy}><i className={`enemy-dot enemy-dot--${enemy}`} />{enemyName[enemy]}</span>)}</div><div className="stage-reward"><span><Gem size={17} /> First clear reward</span><strong>+{stage.firstClearReward} <small>gems</small></strong></div></section>
    {best && <div className="best-time"><Clock3 size={15} /> Best clear · {Math.floor(best / 60)}:{String(Math.floor(best % 60)).padStart(2, '0')}</div>}
    <div className="stage-detail__cta"><PrimaryButton wide onClick={onStart}><Swords size={18} /> START RUN <ArrowRight size={18} /></PrimaryButton></div>
  </main>;
}
