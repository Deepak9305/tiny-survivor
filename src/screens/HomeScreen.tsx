import { ChevronRight, Map, Play, Settings, Sparkles, Trophy } from 'lucide-react';
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
  return <main className="home-screen screen-with-nav">
    <CurrencyBar coins={save.coins} gems={save.gems} onSettings={() => onNavigate('settings')} />
    <section className="home-hero" style={{ backgroundImage: "url('/assets/tiny-survivor-key-art.png')" }}>
      <div className="home-hero__shade" />
      <div className="home-hero__topline"><span className="eyebrow">WORLD 1 · GRAVEYARD</span><span className="status-badge"><Sparkles size={13} /> READY</span></div>
      <div className="home-hero__center"><GameLogo /><div className="home-hero__copy"><span>1-1 · {stage.name.toUpperCase()}</span><strong>First Night</strong><small>Recommended power · {stage.recommendedPower || '—'}</small></div></div>
      <PrimaryButton wide onClick={onPlay}><Play size={19} fill="currentColor" /> PLAY</PrimaryButton>
      <div className="home-hero__hint"><span><Trophy size={13} /> Best time —</span><span>{save.completedStages.length}/20 stages cleared</span></div>
    </section>
    <section className="quick-actions">
      <button onClick={() => onNavigate('map')}><span className="quick-actions__icon quick-actions__icon--blue"><Map size={21} /></span><span><strong>Stage Map</strong><small>Choose your next fight</small></span><ChevronRight size={17} /></button>
      <button onClick={() => onNavigate('upgrades')}><span className="quick-actions__icon quick-actions__icon--gold"><Sparkles size={21} /></span><span><strong>Permanent Upgrades</strong><small>Spend coins · get stronger</small></span><ChevronRight size={17} /></button>
    </section>
    <BottomNav current="home" onNavigate={onNavigate} />
  </main>;
}
