import { BookOpen, Play } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { CurrencyBar } from '../components/CurrencyBar';
import { GameLogo } from '../components/GameLogo';
import { PrimaryButton } from '../components/PrimaryButton';
import { getCurrentStage } from '../data/stages';
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
  const worldBg = getWorldBg(stage.worldId);

  return (
    <main className="home-screen">
      <section className="home-hero" style={{ backgroundImage: `url(${worldBg})` }}>
        <div className="home-hero__content">
          <CurrencyBar
            coins={save.coins}
            gems={save.gems}
            selectedHero={save.selectedHero}
            cleanHeader
            onShop={() => onNavigate('shop')}
            onSettings={() => onNavigate('settings')}
          />
          <div className="home-hero__brand">
            <GameLogo />
          </div>
          <div className="home-hero__lower">
            <div className="home-stage-row">
              <button
                type="button"
                className="home-stage-link"
                onClick={() => onNavigate('map')}
                aria-label="Open the stage map"
              >
                <span className="home-stage-link__eyebrow">WORLD {stage.worldId} · {stage.biome.toUpperCase()}</span>
                <strong>Stage {stage.id} : {stage.name}</strong>
              </button>
              <button
                type="button"
                className="home-codex-shortcut"
                onClick={() => onNavigate('bestiary')}
                aria-label="Open Monster Codex"
                title="Monster Codex"
              >
                <BookOpen size={18} />
                <span>CODEX</span>
              </button>
            </div>
            <PrimaryButton wide variant="gold" className="home-play-btn" onClick={onPlay}>
              <Play size={24} fill="currentColor" /> PLAY
            </PrimaryButton>
          </div>
        </div>
      </section>
      <BottomNav current="home" onNavigate={onNavigate} />
    </main>
  );
}
