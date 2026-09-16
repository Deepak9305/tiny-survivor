import { useState } from 'react';
import {
  BookOpen,
  Compass,
  Flame,
  Heart,
  Music,
  Play,
  RotateCw,
  Shield,
  Skull,
  Sparkles,
  Swords,
  Target,
  Timer,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import type { GameSnapshot, RunMode, SaveData, StageDefinition } from '../types';
import { HERO_DEFINITIONS } from '../data/heroes';
import { ABILITY_DEFINITIONS } from '../data/abilities';
import { WEAPON_BALANCE, PASSIVE_BALANCE } from '../data/balance';
import { audioService } from '../services/audioService';

type PausePane = 'run' | 'build' | 'stats';

interface PauseOverlayProps {
  snapshot: GameSnapshot;
  stage: StageDefinition;
  save: SaveData;
  mode?: RunMode;
  onResume: () => void;
  onHome: () => void;
  onBestiary: () => void;
}

export function PauseOverlay({
  snapshot,
  stage,
  save,
  mode = 'campaign',
  onResume,
  onHome,
  onBestiary,
}: PauseOverlayProps) {
  const [musicOn, setMusicOn] = useState(save.settings.music);
  const [sfxOn, setSfxOn] = useState(save.settings.soundEffects);
  const [compactPane, setCompactPane] = useState<PausePane>('run');

  const heroDef = HERO_DEFINITIONS[save.selectedHero] ?? HERO_DEFINITIONS.shadow;
  const hpPercent = snapshot.maxHp > 0 ? Math.max(0, Math.min(100, (snapshot.hp / snapshot.maxHp) * 100)) : 0;
  const xpPercent = snapshot.xpRequired > 0 ? Math.max(0, Math.min(100, (snapshot.xp / snapshot.xpRequired) * 100)) : 0;

  const toggleMusic = () => {
    const next = !musicOn;
    setMusicOn(next);
    audioService.setMusicEnabled(next);
    save.settings.music = next;
    audioService.playUISound('tap');
  };

  const toggleSfx = () => {
    const next = !sfxOn;
    setSfxOn(next);
    audioService.setSfxEnabled(next);
    save.settings.soundEffects = next;
    audioService.playUISound('tap');
  };

  const weaponEntries = Object.entries(snapshot.weaponLevels);
  const abilityEntries = Object.entries(snapshot.abilityLevels ?? {});
  const passiveEntries = Object.entries(snapshot.passiveLevels ?? {});

  return (
    <div className="pause-overlay" role="dialog" aria-modal="true" aria-label="Run Paused">
      <div className="pause-modal-landscape">
        <header className="pause-header">
          <div className="pause-header__left">
            <span className="pause-header__badge">SANCTUARY RESPITE</span>
            <h2 className="pause-header__title">TACTICAL JOURNAL</h2>
          </div>

          <div className="pause-header__center">
            <span className="pause-stage-badge">
              {mode === 'survival' ? 'ENDLESS SURVIVAL' : `WORLD ${stage.worldId} · STAGE ${stage.stageNumber}`}
            </span>
            <strong className="pause-stage-name">{stage.name}</strong>
          </div>

          <div className="pause-header__right">
            <div className="pause-live-timer">
              <Timer size={15} />
              <span>{formatRunTime(snapshot.time)}</span>
            </div>
            <button type="button" className="pause-close-btn" onClick={onResume} aria-label="Resume Run">
              <X size={20} />
            </button>
          </div>
        </header>

        <nav className="pause-compact-tabs" aria-label="Pause journal sections">
          <button
            type="button"
            className={compactPane === 'run' ? 'is-active' : ''}
            onClick={() => setCompactPane('run')}
            aria-pressed={compactPane === 'run'}
          >
            <Heart size={14} /> RUN
          </button>
          <button
            type="button"
            className={compactPane === 'build' ? 'is-active' : ''}
            onClick={() => setCompactPane('build')}
            aria-pressed={compactPane === 'build'}
          >
            <Swords size={14} /> BUILD
          </button>
          <button
            type="button"
            className={compactPane === 'stats' ? 'is-active' : ''}
            onClick={() => setCompactPane('stats')}
            aria-pressed={compactPane === 'stats'}
          >
            <Compass size={14} /> STATS
          </button>
        </nav>

        <div className="pause-body-grid">
          <section className={`pause-col pause-col--hero ${compactPane === 'run' ? 'is-compact-active' : ''}`}>
            <div className="pause-hero-card">
              <div className="pause-hero-avatar-box">
                <span className="pause-hero-rune">✦</span>
              </div>
              <div className="pause-hero-info">
                <span className="pause-hero-role">{heroDef.role}</span>
                <strong className="pause-hero-name">{heroDef.name}</strong>
              </div>
            </div>

            <div className="pause-vitals-group">
              <div className="pause-vital-row">
                <div className="pause-vital-label">
                  <Heart size={14} className="text-rose" />
                  <span>HEALTH POINTS</span>
                  <strong className="pause-vital-val">
                    {Math.ceil(snapshot.hp)} / {Math.ceil(snapshot.maxHp)}
                  </strong>
                </div>
                <div className="pause-track pause-track--health">
                  <div className="pause-track__fill" style={{ width: `${hpPercent}%` }} />
                </div>
              </div>

              <div className="pause-vital-row">
                <div className="pause-vital-label">
                  <Sparkles size={14} className="text-cyan" />
                  <span>LEVEL {snapshot.level}</span>
                  <strong className="pause-vital-val">
                    {Math.round(snapshot.xp)} / {Math.round(snapshot.xpRequired)} XP
                  </strong>
                </div>
                <div className="pause-track pause-track--xp">
                  <div className="pause-track__fill" style={{ width: `${xpPercent}%` }} />
                </div>
              </div>
            </div>

            <div className="pause-tallies-grid">
              <div className="pause-tally-box">
                <Skull size={15} />
                <span className="pause-tally-num">{snapshot.kills.toLocaleString()}</span>
                <small className="pause-tally-label">Foes Slain</small>
              </div>
              <div className="pause-tally-box">
                <Shield size={15} className="text-amber" />
                <span className="pause-tally-num">{snapshot.eliteKills}</span>
                <small className="pause-tally-label">Elites Slain</small>
              </div>
              <div className="pause-tally-box pause-tally-box--coins">
                <Sparkles size={15} className="text-gold" />
                <span className="pause-tally-num">+{snapshot.coins.toLocaleString()}</span>
                <small className="pause-tally-label">Gold Found</small>
              </div>
            </div>
          </section>

          <section className={`pause-col pause-col--arsenal ${compactPane === 'build' ? 'is-compact-active' : ''}`}>
            <h4 className="pause-section-title">
              <Swords size={16} /> ACTIVE WEAPONS & SPELLS
            </h4>
            <div className="pause-items-list">
              {weaponEntries.map(([id, lvl]) => {
                const def = WEAPON_BALANCE[id as keyof typeof WEAPON_BALANCE];
                return (
                  <div key={id} className="pause-item-card">
                    <div className="pause-item-icon">
                      {id === 'orbiting-blades' ? <Swords size={16} /> : id === 'chain-lightning' ? <Zap size={16} /> : <Target size={16} />}
                    </div>
                    <div className="pause-item-details">
                      <strong className="pause-item-name">{def?.name ?? id.replaceAll('-', ' ')}</strong>
                      <span className="pause-item-desc">
                        {def ? `${def.damageType.toUpperCase()} · ${def.baseDamage} BASE DMG` : 'Primary combat armament'}
                      </span>
                    </div>
                    <span className={`pause-item-tier ${lvl >= 5 ? 'pause-item-tier--max' : ''}`}>
                      {lvl >= 5 ? 'MAX LV.5' : `LV.${lvl}`}
                    </span>
                  </div>
                );
              })}
            </div>

            {abilityEntries.length > 0 && (
              <>
                <h4 className="pause-section-title pause-section-title--mt">
                  <Flame size={16} /> SPECIAL ABILITIES
                </h4>
                <div className="pause-items-list">
                  {abilityEntries.map(([id, lvl]) => {
                    const def = ABILITY_DEFINITIONS[id as keyof typeof ABILITY_DEFINITIONS];
                    return (
                      <div key={id} className="pause-item-card pause-item-card--ability">
                        <div className="pause-item-icon"><Zap size={16} /></div>
                        <div className="pause-item-details">
                          <strong className="pause-item-name">{def?.name ?? id.replaceAll('-', ' ')}</strong>
                          <span className="pause-item-desc">{def?.description ?? 'Manual trigger spell'}</span>
                        </div>
                        <span className="pause-item-tier">LV.{lvl}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {passiveEntries.length > 0 && (
              <>
                <h4 className="pause-section-title pause-section-title--mt">
                  <Shield size={16} /> PASSIVE RELICS
                </h4>
                <div className="pause-items-list">
                  {passiveEntries.map(([id, lvl]) => {
                    const def = PASSIVE_BALANCE[id as keyof typeof PASSIVE_BALANCE];
                    return (
                      <div key={id} className="pause-item-card pause-item-card--passive">
                        <div className="pause-item-icon"><Sparkles size={16} /></div>
                        <div className="pause-item-details">
                          <strong className="pause-item-name">{def?.name ?? id.replaceAll('-', ' ')}</strong>
                          <span className="pause-item-desc">Tier {lvl} persistent enhancement</span>
                        </div>
                        <span className="pause-item-tier">LV.{lvl}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </section>

          <section className={`pause-col pause-col--actions ${compactPane === 'stats' ? 'is-compact-active' : ''}`}>
            <h4 className="pause-section-title">
              <Compass size={16} /> COMBAT ATTRIBUTES
            </h4>
            <div className="pause-stats-grid">
              <PauseStat label="ATTACK MIGHT" value={`+${Math.round(((snapshot.stats?.damageMultiplier ?? 1) - 1) * 100)}%`} />
              <PauseStat label="ARMOR DEFENSE" value={`${Math.round((snapshot.stats?.armor ?? 0) * 100)}%`} />
              <PauseStat label="MOVE SPEED" value={`${Math.round(snapshot.stats?.moveSpeed ?? 140)}`} />
              <PauseStat label="CRITICAL HIT" value={`${Math.round((snapshot.stats?.critChance ?? 0.05) * 100)}%`} />
              <PauseStat label="MAGNET RADIUS" value={`${Math.round(snapshot.stats?.pickupRadius ?? 60)}`} />
              <PauseStat label="COOLDOWN RED." value={`-${Math.round((1 - (snapshot.stats?.cooldownMultiplier ?? 1)) * 100)}%`} />
            </div>

            <div className="pause-audio-toggles">
              <button
                type="button"
                className={`pause-audio-btn ${musicOn ? 'pause-audio-btn--active' : ''}`}
                onClick={toggleMusic}
              >
                <Music size={16} />
                <span>MUSIC: {musicOn ? 'ON' : 'OFF'}</span>
              </button>
              <button
                type="button"
                className={`pause-audio-btn ${sfxOn ? 'pause-audio-btn--active' : ''}`}
                onClick={toggleSfx}
              >
                {sfxOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
                <span>SFX: {sfxOn ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            <div className="pause-actions-group">
              <button type="button" className="pause-btn-resume" onClick={onResume}>
                <Play size={18} fill="currentColor" />
                <span>RESUME BATTLE</span>
              </button>
              <button type="button" className="pause-btn-bestiary" onClick={onBestiary}>
                <BookOpen size={17} />
                <span>MONSTER CODEX / BESTIARY</span>
              </button>
              <button type="button" className="pause-btn-quit" onClick={onHome}>
                <RotateCw size={16} />
                <span>ABANDON RUN & RETURN</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function PauseStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="pause-stat-chip">
      <span className="pause-stat-chip__label">{label}</span>
      <strong className="pause-stat-chip__val">{value}</strong>
    </div>
  );
}

function formatRunTime(seconds: number): string {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}
