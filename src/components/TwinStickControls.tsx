import { useEffect, useRef, useState } from 'react';
import { Crosshair } from 'lucide-react';
import { getActiveThreeGame } from '../game3d/ThreeGame';
import { VirtualStick } from './VirtualStick';

interface TwinStickControlsProps {
  disabled?: boolean;
}

export function TwinStickControls({ disabled = false }: TwinStickControlsProps) {
  const [showTutorial, setShowTutorial] = useState(true);
  const [firing, setFiring] = useState(false);
  const firePointerId = useRef<number | undefined>(undefined);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowTutorial(false);
    }, 5500);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!disabled) return;
    firePointerId.current = undefined;
    setFiring(false);
    getActiveThreeGame()?.setPrimaryFire(false);
  }, [disabled]);

  useEffect(() => () => {
    getActiveThreeGame()?.setPrimaryFire(false);
  }, []);

  const handleMovementChange = (x: number, y: number) => {
    getActiveThreeGame()?.setMovementVector(x, y);
  };

  const stopFiring = () => {
    firePointerId.current = undefined;
    setFiring(false);
    getActiveThreeGame()?.setPrimaryFire(false);
  };

  return (
    <div className={`twin-stick-controls${disabled ? ' is-disabled' : ''}`}>
      {showTutorial && (
        <div className="twin-stick-tutorial" aria-live="polite">
          <div className="twin-stick-tutorial__pill">
            <span className="twin-stick-tutorial__left">MOVE</span>
            <span className="twin-stick-tutorial__bullet">•</span>
            <span className="twin-stick-tutorial__right">HOLD FIRE · SPECIALS AUTO-AIM</span>
          </div>
        </div>
      )}

      <div className="twin-stick-zone twin-stick-zone--left">
        <VirtualStick
          mode="movement"
          disabled={disabled}
          label="Move hero with left virtual stick"
          onVectorChange={handleMovementChange}
        />
        <div className="twin-stick-label">MOVE</div>
      </div>

      <div className="twin-stick-zone twin-stick-zone--fire">
        <button
          type="button"
          className={`primary-fire-btn${firing ? ' is-firing' : ''}`}
          disabled={disabled}
          aria-label="Hold to auto-target and fire primary weapon"
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (disabled || firePointerId.current !== undefined) return;
            firePointerId.current = event.pointerId;
            try {
              event.currentTarget.setPointerCapture(event.pointerId);
            } catch {
              // Older Android WebViews can reject capture; firing still works.
            }
            setFiring(true);
            getActiveThreeGame()?.setPrimaryFire(true);
          }}
          onPointerUp={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (firePointerId.current === event.pointerId) stopFiring();
          }}
          onPointerCancel={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (firePointerId.current === event.pointerId) stopFiring();
          }}
          onLostPointerCapture={() => {
            if (firePointerId.current !== undefined) stopFiring();
          }}
        >
          <span className="primary-fire-btn__pulse" aria-hidden="true" />
          <span className="primary-fire-btn__inner" aria-hidden="true">
            <Crosshair size={32} strokeWidth={2.25} />
          </span>
          <span className="primary-fire-btn__text">FIRE</span>
        </button>
        <div className="twin-stick-label twin-stick-label--fire">HOLD</div>
      </div>
    </div>
  );
}
