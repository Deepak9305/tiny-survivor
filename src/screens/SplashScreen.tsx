import { useEffect, useState } from 'react';
import { GameLogo } from '../components/GameLogo';

interface SplashScreenProps {
  ready: boolean;
  onDone: () => void;
}

export function SplashScreen({ ready, onDone }: SplashScreenProps) {
  const [progress, setProgress] = useState(12);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setProgress((value) => {
        if (!ready) {
          // Progress smoothly up to 88% while loading save & assets
          return Math.min(88, value + 6);
        }
        // Accelerate to 100% when ready
        const next = Math.min(100, value + 18);
        return next;
      });
    }, 60);

    return () => window.clearInterval(timer);
  }, [ready]);

  useEffect(() => {
    if (ready && progress >= 100) {
      const delay = window.setTimeout(onDone, 240);
      return () => window.clearTimeout(delay);
    }
  }, [ready, progress, onDone]);

  return <main className="splash-screen" style={{ backgroundImage: "url('/assets/tiny-survivor-key-art.png')" }}>
    <div className="splash-screen__shade" />
    <div className="splash-screen__content">
      <GameLogo />
      <p className="splash-screen__kicker">SMALL HERO. BIG BATTLES.</p>
      <div className="splash-screen__loading">
        <div style={{ width: `${progress}%` }} />
        <span>{progress < 100 ? `Preparing the dark realms · ${progress}%` : 'Entering the fray...'}</span>
      </div>
    </div>
  </main>;
}
