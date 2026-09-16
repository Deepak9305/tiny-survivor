import { BookOpen, ChevronRight, Flame, Globe, Lock, Map, Swords } from 'lucide-react';
import { CurrencyBar } from '../components/CurrencyBar';
import { GameLogo } from '../components/GameLogo';
import { NavRail } from '../components/NavRail';
import { getCurrentStage, isWorldCleared, WORLD_META } from '../data/stages';
import type { SaveData, Screen } from '../types';

interface HomeScreenProps {
  save: SaveData;
  onNavigate: (screen: Screen) => void;
  onPlay: () => void;
}

function getWorldBg(worldId: number): string {
  if (worldId === 2) return '/assets/images/bg_forest.jpg';
  if (worldId === 3) return '/assets/images/bg_frozen.jpg';
  if (worldId === 4) return '/assets/images/bg_castle.jpg';
  return '/assets/images/bg_gothic_cemetery.jpg';
}

interface CampaignBossMeta {
  name: string;
  lore: string;
  portrait: string;
}

const CAMPAIGN_BOSS_META: Record<number, CampaignBossMeta> = {
  1: {
    name: 'SKELETON KING',
    lore: 'Ancient bones stir beneath moonlit stone. The king is waiting.',
    portrait: '/assets/images/portrait_skeleton_king.jpg',
  },
  2: {
    name: 'FOREST WITCH',
    lore: 'A forgotten forest. A lingering magic. Something watches between the trees.',
    portrait: '/assets/images/boss_forest_witch.jpg',
  },
  3: {
    name: 'FROST GOLEM',
    lore: 'The ruins breathe cold. Break the guardian before the storm closes in.',
    portrait: '/assets/images/boss_frost_golem.jpg',
  },
  4: {
    name: 'DEMON KING',
    lore: 'Beyond the black gates, hell itself is awake. End the infernal reign.',
    portrait: '/assets/images/boss_demon_lord.jpg',
  },
};

export function HomeScreen({ save, onNavigate, onPlay }: HomeScreenProps) {
  const stage = getCurrentStage(save);
  const worldMeta = WORLD_META.find((w) => w.id === stage.worldId) ?? WORLD_META[0];
  const worldBg = getWorldBg(stage.worldId);
  const survivalUnlocked = isWorldCleared(2, save);
  const bossMeta = CAMPAIGN_BOSS_META[stage.worldId] ?? CAMPAIGN_BOSS_META[1];

  return (
    <main
      className="home-landscape-screen"
      style={{ backgroundImage: `url(${worldBg})` }}
    >
      <div className="home-screen-backdrop-overlay" />

      <NavRail current="home" onNavigate={onNavigate} />

      <div className="home-landscape-body">
        <section className="home-brand-panel" aria-label={`${worldMeta.name} campaign artwork`}>
          <div className="home-brand-panel__content">
            <div className="home-brand-panel__logo-box">
              <GameLogo />
              <p className="home-brand-panel__subtag">
                AUTO-AIM SURVIVOR &bull; DARK FANTASY ACTION ROGUELITE
              </p>
            </div>

            <button
              type="button"
              className="home-world-pill"
              onClick={() => onNavigate('map')}
              aria-label={`Open World ${stage.worldId}: ${worldMeta.name}`}
            >
              <Globe size={15} className="home-world-pill__icon" />
              <span className="home-world-pill__text">
                WORLD {stage.worldId}: {worldMeta.name.toUpperCase()} &mdash; {worldMeta.subtitle}
              </span>
            </button>
          </div>
        </section>

        <section className="home-action-panel" aria-label="Campaign actions">
          <header className="home-action-panel__header">
            <CurrencyBar
              coins={save.coins}
              gems={save.gems}
              selectedHero={save.selectedHero}
              cleanHeader
              onShop={() => onNavigate('shop')}
              onSettings={() => onNavigate('settings')}
            />
          </header>

          <div className="home-campaign-card">
            <div className="home-campaign-card__ornament" aria-hidden="true">
              <span className="home-campaign-card__diamond" />
            </div>

            <div className="home-campaign-card__header">
              <div className="home-campaign-card__info">
                <span className="home-campaign-card__kicker">CURRENT CAMPAIGN</span>
                <span className="home-campaign-card__stage-tag">
                  STAGE {stage.id} &bull; {worldMeta.name.toUpperCase()}
                </span>
                <h2 className="home-campaign-card__boss-name">{bossMeta.name}</h2>
                <p className="home-campaign-card__lore">{bossMeta.lore}</p>
              </div>

              <div className="home-campaign-card__portrait-box">
                <img
                  src={bossMeta.portrait}
                  alt={bossMeta.name}
                  className="home-campaign-card__portrait-img"
                />
                <div className="home-campaign-card__portrait-frame" aria-hidden="true" />
                <span className="home-campaign-card__portrait-badge">BOSS</span>
              </div>
            </div>

            <div className="home-menu-stack">
              <button
                type="button"
                className="home-menu-row"
                onClick={() => onNavigate('map')}
                aria-label="Open World Map"
              >
                <div className="home-menu-row__icon-wrap">
                  <Map size={20} />
                </div>
                <div className="home-menu-row__copy">
                  <strong className="home-menu-row__title">WORLD MAP</strong>
                  <span className="home-menu-row__sub">Explore stages and discover new areas.</span>
                </div>
                <ChevronRight size={18} className="home-menu-row__arrow" />
              </button>

              <button
                type="button"
                className="home-menu-row"
                onClick={() => onNavigate('bestiary')}
                aria-label="Open Monster Codex"
              >
                <div className="home-menu-row__icon-wrap">
                  <BookOpen size={20} />
                </div>
                <div className="home-menu-row__copy">
                  <strong className="home-menu-row__title">MONSTER CODEX</strong>
                  <span className="home-menu-row__sub">View monsters, lore, weaknesses and rewards.</span>
                </div>
                <ChevronRight size={18} className="home-menu-row__arrow" />
              </button>

              <button
                type="button"
                className={`home-menu-row ${survivalUnlocked ? 'is-unlocked' : 'is-locked'}`}
                onClick={() => survivalUnlocked && onNavigate('survival')}
                disabled={!survivalUnlocked}
                aria-label={survivalUnlocked ? 'Open Survival Mode' : 'Survival Mode locked, clear World 2'}
              >
                <div className="home-menu-row__icon-wrap home-menu-row__icon-wrap--survival">
                  {survivalUnlocked ? <Flame size={20} /> : <Lock size={18} />}
                </div>
                <div className="home-menu-row__copy">
                  <strong className="home-menu-row__title">SURVIVAL MODE</strong>
                  <span className="home-menu-row__sub">
                    {survivalUnlocked ? 'Face an endless escalating onslaught.' : 'Complete World 2 to unlock.'}
                  </span>
                </div>
                {survivalUnlocked ? (
                  <ChevronRight size={18} className="home-menu-row__arrow" />
                ) : (
                  <Lock size={16} className="home-menu-row__arrow" />
                )}
              </button>
            </div>
          </div>

          <footer className="home-action-panel__footer">
            <button
              type="button"
              className="battle-now-gold-btn"
              onClick={onPlay}
              aria-label={`Start ${stage.name}`}
            >
              <span className="battle-now-gold-btn__glow" aria-hidden="true" />
              <div className="battle-now-gold-btn__content">
                <Swords size={24} className="battle-now-gold-btn__icon" />
                <span className="battle-now-gold-btn__text">BATTLE NOW</span>
                <ChevronRight size={22} className="battle-now-gold-btn__arrow" />
              </div>
            </button>
          </footer>
        </section>
      </div>
    </main>
  );
}
