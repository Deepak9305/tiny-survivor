import { useEffect, useRef, useState } from 'react';
import { Crosshair, Swords } from 'lucide-react';
import { setCombatHeroId, setPrimaryFireActive } from '../game/systems/CombatTargeting';
import { getActiveThreeGame } from '../game3d/ThreeGame';
import type { HeroId } from '../types';
import { VirtualStick } from './VirtualStick';

interface TwinStickControlsProps {
  disabled?: boolean;
  heroId?: HeroId;
}

export function TwinStickControls({ disabled = false, heroId = 'shadow' }: TwinStickControlsProps) {
  const [showTutorial, setShowTutorial] = useState(true);
  const [firing, setFiring] = useState(false);
  const firePointerId = useRef<number | undefined>(undefined);

  useEffect(() => {
    setCombatHeroId(heroId);
  }, [heroId]);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowTutorial(false), 5500);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!disabled) return;
    firePointerId.current = undefined;
    setFiring(false);
    setPrimaryFireActive(false);
  }, [disabled]);

  useEffect(() => () => { setPrimaryFireActive(false); }, []);

  const handleMovementChange = (x: number, y: number) => {
    getActiveThreeGame()?.setMovementVector(x, y);
  };

  const stopFiring = () => {
    firePointerId.current = undefined;
    setFiring(false);
    setPrimaryFireActive(false);
  };

  const melee = heroId === 'warrior';

  return (
    <div className={`twin-stick-controls${disabled ? ' is-disabled' : ''}${melee ? ' is-melee' : ''}`}>
      {showTutorial && (
        <div className="twin-stick-tutorial" aria-live="polite">
          <div className="twin-stick-tutorial__pill">
            <span className="twin-stick-tutorial__left">MOVE</span>
            <span className="twin-stick-tutorial__bullet">•</span>
            <span className="twin-stick-tutorial__right">{melee ? 'HOLD ATTACK · CLOSE FOR SWORD CLEAVES' : 'HOLD FIRE · SPECIALS AUTO-AIM'}</span>
          </div>
        </div>
      )}

      <div className="twin-stick-zone twin-stick-zone--left">
        <VirtualStick mode="movement" disabled={disabled} label="Move hero with left virtual stick" onVectorChange={handleMovementChange} />
        <div className="twin-stick-label">MOVE</div>
      </div>

      <div className="twin-stick-zone twin-stick-zone--fire">
        <button
          type="button"
          className={`primary-fire-btn${firing ? ' is-firing' : ''}${melee ? ' is-melee' : ''}`}
          disabled={disabled}
          aria-label={melee ? 'Hold to auto-target and swing the Runeblade' : 'Hold to auto-target and fire primary weapon'}
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (disabled || firePointerId.current !== undefined) return;
            setCombatHeroId(heroId);
            firePointerId.current = event.pointerId;
            try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* capture is optional */ }
            setFiring(true);
            setPrimaryFireActive(true);
          }}
          onPointerUp={(event) => { event.preventDefault(); event.stopPropagation(); if (firePointerId.current === event.pointerId) stopFiring(); }}
          onPointerCancel={(event) => { event.preventDefault(); event.stopPropagation(); if (firePointerId.current === event.pointerId) stopFiring(); }}
          onLostPointerCapture={() => { if (firePointerId.current !== undefined) stopFiring(); }}
        >
          <span className="primary-fire-btn__pulse" aria-hidden="true" />
          <span className="primary-fire-btn__inner" aria-hidden="true">
            {melee ? <Swords size={32} strokeWidth={2.25} /> : <Crosshair size={32} strokeWidth={2.25} />}
          </span>
          <span className="primary-fire-btn__text">{melee ? 'ATTACK' : 'FIRE'}</span>
        </button>
        <div className="twin-stick-label twin-stick-label--fire">HOLD</div>
      </div>
    </div>
  );
}
