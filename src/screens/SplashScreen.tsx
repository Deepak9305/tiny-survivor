import { useEffect, useRef, useState } from 'react';
import { GameLogo } from '../components/GameLogo';

interface SplashScreenProps {
  ready: boolean;
  onDone: () => void;
}

export function SplashScreen({ ready, onDone }: SplashScreenProps) {
  const [progress, setProgress] = useState(12);
  const doneRef = useRef(false);

  const finish = () => {
    if (!doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      setProgress((value) => {
        if (!ready) {
          // Progress smoothly up to 88% while loading save & assets
          return Math.min(88, value + 8);
        }
        // Accelerate to 100% when ready
        const next = Math.min(100, value + 24);
        return next;
      });
    }, 45);

    return () => window.clearInterval(timer);
  }, [ready]);

  useEffect(() => {
    if (ready && progress >= 100) {
      const delay = window.setTimeout(finish, 120);
      return () => window.clearTimeout(delay);
    }
  }, [ready, progress]);

  // Watchdog fallback: never get stuck on splash if ready
  useEffect(() => {
    if (!ready) return;
    const watchdog = window.setTimeout(finish, 900);
    return () => window.clearTimeout(watchdog);
  }, [ready]);

  return (
    <main
      className="splash-screen"
      style={{ backgroundImage: "url('/assets/images/bg_gothic_cemetery.jpg')", cursor: ready ? 'pointer' : 'default' }}
      onClick={() => { if (ready) finish(); }}
    >
      <div className="splash-screen__shade" />
      <div className="splash-screen__content">
        <GameLogo />
        <p className="splash-screen__kicker">SURVIVE &bull; UPGRADE &bull; GET STRONGER</p>
        <div className="splash-screen__loading">
          <div style={{ width: `${progress}%` }} />
          <span>{progress < 100 ? `Entering the dark realm &bull; ${progress}%` : 'Entering the fray...'}</span>
        </div>
      </div>
    </main>
  );
}
