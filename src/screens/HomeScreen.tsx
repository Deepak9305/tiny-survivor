import { BookOpen, Flame, Lock, Map, Play, Shield } from 'lucide-react';
import { CurrencyBar } from '../components/CurrencyBar';
import { GameLogo } from '../components/GameLogo';
import { NavRail } from '../components/NavRail';
import { PrimaryButton } from '../components/PrimaryButton';
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
  return '/assets/images/bg_graveyard.jpg';
}

export function HomeScreen({ save, onNavigate, onPlay }: HomeScreenProps) {
  const stage = getCurrentStage(save);
  const worldMeta = WORLD_META.find((w) => w.id === stage.worldId) ?? WORLD_META[0];
  const worldBg = getWorldBg(stage.worldId);
  const survivalUnlocked = isWorldCleared(2, save);

  return (
    <main className="home-landscape-screen">
      <NavRail current="home" onNavigate={onNavigate} />

      <div className="home-landscape-body">
        {/* Left ~56%: Cinematic World Diorama + Logo */}
        <section
          className={`home-cinema-panel home-cinema-panel--world-${stage.worldId}`}
          style={{ backgroundImage: `url(${worldBg})` }}
        >
          <div className="home-cinema-panel__overlay" />
          <div className="home-cinema-panel__content">
            <div className="home-cinema-panel__brand">
              <GameLogo />
              <p className="home-cinema-panel__tagline">
                TWIN-STICK SURVIVOR &middot; LANDSCAPE ACTION ROGUELITE
              </p>
            </div>

            <div className="home-cinema-panel__world-pill">
              <Shield size={14} className="home-cinema-panel__world-icon" />
              <span>
                WORLD {stage.worldId}: {worldMeta.name.toUpperCase()} &middot; {worldMeta.subtitle}
              </span>
            </div>
          </div>
        </section>

        {/* Right ~44%: Controls & Action */}
        <section className="home-action-panel">
          {/* Top Bar: Currencies, Shop, Settings */}
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

          {/* Center Stage & Mission Summary */}
          <div className="home-action-panel__center">
            <div className="home-stage-card">
              <div className="home-stage-card__badge">CURRENT CAMPAIGN</div>
              <div className="home-stage-card__details">
                <span className="home-stage-card__sub">
                  STAGE {stage.id} &bull; {stage.biome.toUpperCase()}
                </span>
                <strong className="home-stage-card__name">{stage.name}</strong>
              </div>
              <button
                type="button"
                className="home-stage-card__map-btn"
                onClick={() => onNavigate('map')}
                aria-label="View world stage map"
              >
                <Map size={18} />
                <span>WORLD MAP</span>
              </button>
            </div>

            <div className="home-secondary-row">
              <button
                type="button"
                className="home-secondary-btn home-secondary-btn--codex"
                onClick={() => onNavigate('bestiary')}
                aria-label="Open Monster Codex"
              >
                <BookOpen size={18} />
                <span>MONSTER CODEX</span>
              </button>

              <button
                type="button"
                className={`home-secondary-btn home-secondary-btn--survival ${survivalUnlocked ? 'is-unlocked' : 'is-locked'}`}
                onClick={() => survivalUnlocked && onNavigate('survival')}
                disabled={!survivalUnlocked}
                aria-label={survivalUnlocked ? 'Open Survival Mode' : 'Survival Mode Locked: Clear World 2'}
              >
                {survivalUnlocked ? (
                  <>
                    <Flame size={18} className="home-survival-icon" />
                    <span>SURVIVAL</span>
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    <span>SURVIVAL (CLEAR W2)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Bottom Primary CTA */}
          <footer className="home-action-panel__footer">
            <PrimaryButton
              wide
              variant="gold"
              className="home-play-btn-landscape"
              onClick={onPlay}
            >
              <Play size={26} fill="currentColor" />
              <span>BATTLE NOW</span>
            </PrimaryButton>
          </footer>
        </section>
      </div>
    </main>
  );
}
