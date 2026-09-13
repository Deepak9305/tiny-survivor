import { ArrowRight, Clock3, Coins, Gem, Shield, Skull, Star, Swords } from 'lucide-react';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { getStage, WORLD_META } from '../data/stages';
import type { SaveData } from '../types';

interface StageDetailScreenProps { stageId: string; save: SaveData; onBack: () => void; onStart: () => void }

const enemyName: Record<string, string> = { skeleton: 'Skeleton', bat: 'Bat', slime: 'Slime', ghost: 'Ghost', archer: 'Archer', knight: 'Knight', demon: 'Demon', imp: 'Imp' };

export function StageDetailScreen({ stageId, save, onBack, onStart }: StageDetailScreenProps) {
  const stage = getStage(stageId);
  const best = save.bestStageTimes[stage.id];
  const world = WORLD_META.find((item) => item.id === stage.worldId);
  const firstClearClaimed = save.completedStages.includes(stage.id);
  const duration = `${Math.floor(stage.duration / 60)}:${String(stage.duration % 60).padStart(2, '0')}`;
  return <main className="stage-detail-screen"><ScreenHeader title={`WORLD ${stage.worldId} · STAGE ${stage.stageNumber}`} onBack={onBack} />
    <section className="stage-art" style={{ backgroundImage: "url('/assets/tiny-survivor-key-art.png')" }}>
      <div className="stage-art__shade" />
      <div className="stage-art__topline"><span className="eyebrow">WORLD {stage.worldId} · {world?.name ?? stage.biome}</span><span className="stage-art__tag">{stage.stageNumber === 5 ? 'BOSS STAGE' : 'ADVENTURE'}</span></div>
      <div className="stage-art__copy"><span className="stage-art__number">{stage.id}</span><h1>{stage.name}</h1><p>{stage.description}</p></div>
      <div className="stage-art__boss"><Skull size={15} /> BOSS · {stage.bossName.toUpperCase()}</div>
    </section>
    <section className="stage-info-card">
      <div className="stage-info-card__stats"><span><Clock3 size={15} /><small>TIME</small><strong>{duration}</strong></span><span><Shield size={15} /><small>POWER</small><strong>{stage.recommendedPower || '—'}</strong></span><span><Star size={15} fill="currentColor" /><small>BEST</small><strong>{best ? `${Math.floor(best / 60)}:${String(Math.floor(best % 60)).padStart(2, '0')}` : '—'}</strong></span></div>
      <div className="stage-info-card__enemies"><h3>Possible enemies</h3><div className="enemy-chips">{stage.enemies.slice(0, 5).map((enemy) => <span key={enemy}><i className={`enemy-dot enemy-dot--${enemy}`} />{enemyName[enemy]}</span>)}</div></div>
      <div className="stage-reward"><span><Coins size={17} /> CLEAR REWARDS</span><div className="stage-reward__items"><strong>+{stage.coinReward}<small> COINS</small></strong><strong><Gem size={15} /> {firstClearClaimed ? 'CLAIMED' : `+${stage.firstClearReward}`}<small> {firstClearClaimed ? 'FIRST CLEAR' : 'FIRST CLEAR GEMS'}</small></strong></div></div>
    </section>
    <div className="stage-detail__cta"><PrimaryButton variant="gold" wide onClick={onStart}><Swords size={18} /> START RUN <ArrowRight size={18} /></PrimaryButton></div>
  </main>;
}
