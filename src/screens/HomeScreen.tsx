import { Map, Play } from 'lucide-react';
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
  return <main className="home-screen">
    <section className="home-hero" style={{ backgroundImage: "url('/assets/tiny-survivor-key-art.png')" }}>
      <div className="home-hero__shade" />
      <div className="home-hero__content">
        <CurrencyBar coins={save.coins} gems={save.gems} onShop={() => onNavigate('shop')} onSettings={() => onNavigate('settings')} />
        <div className="home-hero__brand"><GameLogo /></div>
        <div className="home-hero__lower">
          <button className="home-stage-link" onClick={() => onNavigate('map')} aria-label="Open the stage map">
            <span className="home-stage-link__eyebrow">CURRENT STAGE</span>
            <strong>{stage.id} <span aria-hidden="true">&middot;</span> {stage.name}</strong>
            <small>WORLD {stage.worldId} <span aria-hidden="true">&middot;</span> {stage.biome}</small>
            <Map size={17} aria-hidden="true" />
          </button>
          <PrimaryButton wide onClick={onPlay}><Play size={20} fill="currentColor" /> PLAY</PrimaryButton>
          <span className="home-hero__microcopy">Continue <span aria-hidden="true">&middot;</span> Stage {stage.id}</span>
        </div>
      </div>
    </section>
    <BottomNav current="home" onNavigate={onNavigate} />
  </main>;
}
