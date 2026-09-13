import { useEffect, useState } from 'react';
import { GameLogo } from '../components/GameLogo';

interface SplashScreenProps { onDone: () => void }

export function SplashScreen({ onDone }: SplashScreenProps) {
  const [progress, setProgress] = useState(8);
  useEffect(() => {
    const timer = window.setInterval(() => setProgress((value) => Math.min(100, value + 9)), 90);
    const done = window.setTimeout(onDone, 1180);
    return () => { window.clearInterval(timer); window.clearTimeout(done); };
  }, [onDone]);
  return <main className="splash-screen" style={{ backgroundImage: "url('/assets/tiny-survivor-key-art.png')" }}>
    <div className="splash-screen__shade" />
    <div className="splash-screen__content">
      <GameLogo />
      <p className="splash-screen__kicker">SMALL HERO. BIG BATTLES.</p>
      <div className="splash-screen__loading"><div style={{ width: `${progress}%` }} /><span>Preparing the graveyard · {progress}%</span></div>
    </div>
  </main>;
}
