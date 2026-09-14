import { Play } from 'lucide-react';
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

export function HomeScreen({ save, onNavigate, onPlay }: HomeScreenProps) {
  const stage = getCurrentStage(save);
  return (
    <main className="home-screen">
      <section className="home-hero">
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
            <button
              type="button"
              className="home-stage-link"
              onClick={() => onNavigate('map')}
              aria-label="Open the stage map"
            >
              <span className="home-stage-link__eyebrow">WORLD {stage.worldId} · {stage.biome.toUpperCase()}</span>
              <strong>Stage {stage.id} : {stage.name}</strong>
            </button>
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

