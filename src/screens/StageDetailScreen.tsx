import { ArrowRight, BookOpen, Clock3, Coins, Ghost, Flame, Shield, Skull, Sparkles, Star, Swords, Zap } from 'lucide-react';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { BOSS_DEFINITIONS } from '../data/bosses';
import { getMonsterDefinition } from '../data/monsters';
import { getStage, WORLD_META } from '../data/stages';
import type { EnemyKind, SaveData } from '../types';

interface StageDetailScreenProps {
  stageId: string;
  save: SaveData;
  onBack: () => void;
  onStart: () => void;
  onBestiary: (id: string) => void;
}

function getWorldBg(worldId: number): string {
  if (worldId === 2) return '/assets/images/bg_forest.jpg';
  if (worldId === 3) return '/assets/images/bg_frozen.jpg';
  if (worldId === 4) return '/assets/images/bg_castle.jpg';
  return '/assets/images/bg_graveyard.jpg';
}

function getCreatureThumb(kind: EnemyKind): string | undefined {
  const map: Record<EnemyKind, string> = {
    skeleton: '/assets/images/creature_skeleton.jpg',
    bat: '/assets/images/creature_bat.jpg',
    slime: '/assets/images/creature_slime.jpg',
    ghost: '/assets/images/creature_ghost.jpg',
    archer: '/assets/images/creature_archer.jpg',
    knight: '/assets/images/creature_knight.jpg',
    demon: '/assets/images/creature_demon.jpg',
    imp: '/assets/images/creature_imp.jpg',
  };
  return map[kind];
}

function getBossArt(bossId: string): string {
  const map: Record<string, string> = {
    'skeleton-king': '/assets/images/boss_skeleton_king.jpg',
    'forest-witch': '/assets/images/boss_forest_witch.jpg',
    'frost-golem': '/assets/images/boss_frost_golem.jpg',
    'demon-lord': '/assets/images/boss_demon_lord.jpg',
  };
  return map[bossId] ?? '/assets/images/boss_skeleton_king.jpg';
}

export function StageDetailScreen({ stageId, save, onBack, onStart, onBestiary }: StageDetailScreenProps) {
  const stage = getStage(stageId);
  const best = save.bestStageTimes[stage.id];
  const world = WORLD_META.find((item) => item.id === stage.worldId);
  const duration = `${Math.floor(stage.duration / 60)}:${String(stage.duration % 60).padStart(2, '0')}`;
  const boss = stage.bossId ? BOSS_DEFINITIONS[stage.bossId] : undefined;

  return (
    <main className="stage-detail-screen">
      <ScreenHeader title={`${stage.id} ${stage.name}`} onBack={onBack} />
      <section
        className={`stage-art stage-art--world-${stage.worldId}`}
        style={{ backgroundImage: `url(${getWorldBg(stage.worldId)})` }}
      >
        <div className="stage-art__shade" />
        <div className="stage-art__topline">
          <span className="eyebrow">WORLD {stage.worldId} · {world?.name ?? stage.biome}</span>
          <span className="stage-art__tag">{stage.bossStage ? 'WORLD BOSS' : 'ADVENTURE'}</span>
        </div>

        {boss && (
          <button type="button" className="stage-art__boss-feature" onClick={() => onBestiary(boss.id)}>
            <img src={getBossArt(boss.id)} alt={boss.name} className="stage-art__boss-portrait" />
            <div className="stage-art__boss-info">
              <span className="stage-art__boss-badge"><Skull size={13} /> STAGE 5 WORLD BOSS</span>
              <strong className="stage-art__boss-title">{boss.name}</strong>
              <small className="stage-art__boss-sub">{boss.description || 'Supreme Boss'}</small>
            </div>
            <ArrowRight size={18} className="stage-art__boss-arrow" />
          </button>
        )}
      </section>

      <section className="stage-info-card">
        <div className="stage-info-card__stats">
          <span><Clock3 size={15} /><small>SURVIVAL</small><strong>{duration}</strong></span>
          <span><Shield size={15} /><small>POWER</small><strong>{stage.recommendedPower || '—'}</strong></span>
          <span><Star size={15} fill="currentColor" /><small>BEST</small><strong>{best ? `${Math.floor(best / 60)}:${String(Math.floor(best % 60)).padStart(2, '0')}` : '—'}</strong></span>
        </div>

        <div className="stage-info-card__enemies">
          <div className="stage-section-heading">
            <h3>Enemies</h3>
            <button type="button" onClick={() => onBestiary(stage.enemies[0])}><BookOpen size={14} /> CODEX</button>
          </div>
          <div className="enemy-previews">
            {stage.enemies.map((enemy) => {
              const thumbUrl = getCreatureThumb(enemy);
              return (
                <button type="button" className="enemy-preview" key={enemy} onClick={() => onBestiary(enemy)}>
                  <span className={`creature-thumb creature-thumb--${enemy}`}>
                    {thumbUrl ? (
                      <img src={thumbUrl} alt={enemy} className="creature-thumb-img" />
                    ) : (
                      <CreatureIcon kind={enemy} />
                    )}
                  </span>
                  <strong>{getMonsterDefinition(enemy).name}</strong>
                  <small>{save.discoveredEnemies.includes(enemy) ? 'DISCOVERED' : 'CODEX'}</small>
                </button>
              );
            })}
          </div>
        </div>

        <div className="stage-reward-row">
          <div className="stage-reward-box">
            <span className="stage-reward-label">Rewards</span>
            <div className="stage-reward-val">
              <Coins size={18} className="text-gold" />
              <strong>+{stage.coinReward}</strong>
            </div>
          </div>
          <div className="stage-reward-box">
            <span className="stage-reward-label">Recommended Power</span>
            <div className="stage-reward-val">
              <Swords size={18} className="text-blue" />
              <strong>{stage.recommendedPower}</strong>
            </div>
          </div>
        </div>
      </section>

      <div className="stage-detail__cta">
        <PrimaryButton variant="gold" wide onClick={onStart}>
          <Swords size={18} /> START
        </PrimaryButton>
      </div>
    </main>
  );
}

function CreatureIcon({ kind }: { kind: EnemyKind }) {
  if (kind === 'bat' || kind === 'ghost') return <Ghost size={20} />;
  if (kind === 'slime') return <Sparkles size={20} />;
  if (kind === 'archer') return <Zap size={20} />;
  if (kind === 'knight') return <Shield size={20} />;
  if (kind === 'demon' || kind === 'imp') return <Flame size={20} />;
  return <Skull size={20} />;
}
