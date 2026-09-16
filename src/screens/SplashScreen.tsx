import { useEffect, useRef, useState } from 'react';
import { Sparkles, Swords } from 'lucide-react';
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
        if (!ready) return Math.min(88, value + 8);
        return Math.min(100, value + 24);
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

  useEffect(() => {
    if (!ready) return;
    const watchdog = window.setTimeout(finish, 900);
    return () => window.clearTimeout(watchdog);
  }, [ready]);

  return (
    <main
      className={`splash-screen ${ready ? 'is-ready' : ''}`}
      style={{ backgroundImage: "url('/assets/images/bg_gothic_cemetery.jpg')", cursor: ready ? 'pointer' : 'default' }}
      onClick={() => { if (ready) finish(); }}
    >
      <div className="splash-screen__shade" />
      <div className="splash-screen__grain" />
      <div className="splash-screen__content">
        <div className="splash-screen__crest" aria-hidden="true">
          <span className="splash-screen__crest-ring" />
          <Swords size={26} />
          <Sparkles size={12} className="splash-screen__crest-spark" />
        </div>
        <GameLogo />
        <p className="splash-screen__kicker">DARK FANTASY &bull; AUTO-AIM ACTION &bull; OFFLINE ROGUELITE</p>
        <div className="splash-screen__loading" aria-label={`Loading ${progress}%`}>
          <div className="splash-screen__loading-track">
            <i style={{ width: `${progress}%` }} />
          </div>
          <div className="splash-screen__loading-copy">
            <span>{progress < 100 ? 'ENTERING THE SANCTUARY' : 'READY FOR BATTLE'}</span>
            <strong>{progress}%</strong>
          </div>
        </div>
        <span className="splash-screen__hint">{ready ? 'TAP TO CONTINUE' : 'PREPARING REALM…'}</span>
      </div>
    </main>
  );
}
