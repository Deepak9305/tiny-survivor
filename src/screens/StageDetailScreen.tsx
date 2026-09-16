import { ArrowRight, BookOpen, Clock3, Coins, Flame, Gem, Ghost, Play, Shield, Skull, Sparkles, Star, Zap } from 'lucide-react';
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
  const map: Partial<Record<EnemyKind, string>> = {
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
    <main className="meta-screen stage-detail-landscape">
      <ScreenHeader title={`STAGE ${stage.stageNumber} · ${stage.name.toUpperCase()}`} onBack={onBack} />

      <div className="stage-detail-landscape-grid">
        <section
          className={`stage-landscape-art stage-art--world-${stage.worldId}`}
          style={{ backgroundImage: `url(${getWorldBg(stage.worldId)})` }}
        >
          <div className="stage-landscape-art__overlay" />
          <div className="stage-landscape-art__badge-row">
            <span className="eyebrow">WORLD {stage.worldId} &middot; {world?.name.toUpperCase() ?? stage.biome.toUpperCase()}</span>
            <span className={`stage-badge-tag ${stage.bossStage ? 'is-boss' : ''}`}>
              {stage.bossStage ? 'WORLD BOSS ARENA' : 'SURVIVAL RUN'}
            </span>
          </div>

          {boss ? (
            <button type="button" className="stage-landscape-boss-feature" onClick={() => onBestiary(boss.id)} aria-label={`Inspect ${boss.name} in Monster Codex`}>
              <div className="stage-landscape-boss-img-box">
                <img src={getBossArt(boss.id)} alt={boss.name} className="stage-landscape-boss-img" />
              </div>
              <div className="stage-landscape-boss-details">
                <span className="stage-boss-sub-tag"><Skull size={14} /> CLIMACTIC BOSS</span>
                <h2>{boss.name}</h2>
                <p>{boss.description}</p>
                <div className="stage-boss-inspect-link"><span>Inspect telegraphs & affinities</span><ArrowRight size={14} /></div>
              </div>
            </button>
          ) : (
            <div className="stage-landscape-world-info">
              <span className="stage-landscape-world-info__kicker">BATTLEFIELD BRIEFING</span>
              <h2>{stage.name}</h2>
              <p>Survive the encroaching swarm across the {world?.name} battleground.</p>
            </div>
          )}
        </section>

        <section className="stage-landscape-intel">
          <div className="stage-landscape-metrics">
            <div className="stage-metric-box"><Clock3 size={16} /><small>SURVIVAL</small><strong>{duration}</strong></div>
            <div className="stage-metric-box"><Shield size={16} /><small>REC. POWER</small><strong>{stage.recommendedPower}</strong></div>
            <div className="stage-metric-box"><Star size={16} fill="currentColor" /><small>BEST RECORD</small><strong>{best ? `${Math.floor(best / 60)}:${String(Math.floor(best % 60)).padStart(2, '0')}` : '—'}</strong></div>
          </div>

          <div className="stage-landscape-enemies">
            <div className="stage-enemies-header">
              <span className="eyebrow">ENCOUNTERED ENEMIES</span>
              <button type="button" className="stage-codex-shortcut" onClick={() => onBestiary(stage.enemies[0])}>
                <BookOpen size={13} /><span>OPEN CODEX</span>
              </button>
            </div>

            <div className="stage-enemies-row">
              {stage.enemies.map((enemy) => {
                const thumbUrl = getCreatureThumb(enemy);
                const monster = getMonsterDefinition(enemy);
                return (
                  <button type="button" className="stage-enemy-chip" key={enemy} onClick={() => onBestiary(enemy)} title={`Inspect ${monster.name}`}>
                    <div className="stage-enemy-chip__thumb">
                      {thumbUrl ? <img src={thumbUrl} alt="" aria-hidden="true" /> : <CreatureIcon kind={enemy} />}
                    </div>
                    <span>{monster.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="stage-landscape-rewards">
            <div className="stage-reward-item">
              <span className="stage-reward-label">BASE REWARD</span>
              <div className="stage-reward-val"><Coins size={18} className="text-gold" /><strong>+{stage.coinReward} COINS</strong></div>
            </div>
            {stage.firstClearReward > 0 && !save.completedStages.includes(stage.id) && (
              <div className="stage-reward-item stage-reward-item--first">
                <span className="stage-reward-label">FIRST CLEAR</span>
                <div className="stage-reward-val text-gem"><Gem size={17} /><strong>+{stage.firstClearReward} GEMS</strong></div>
              </div>
            )}
          </div>

          <footer className="stage-landscape-cta">
            <PrimaryButton variant="gold" wide onClick={onStart} className="stage-start-btn">
              <Play size={22} fill="currentColor" /><span>START BATTLE</span>
            </PrimaryButton>
          </footer>
        </section>
      </div>
    </main>
  );
}

function CreatureIcon({ kind }: { kind: EnemyKind }) {
  if (kind === 'bat' || kind === 'ghost' || kind === 'frost-wraith') return <Ghost size={18} />;
  if (kind === 'slime' || kind === 'thornling') return <Sparkles size={18} />;
  if (kind === 'archer') return <Zap size={18} />;
  if (kind === 'knight' || kind === 'treant') return <Shield size={18} />;
  if (kind === 'demon' || kind === 'imp') return <Flame size={18} />;
  return <Skull size={18} />;
}
