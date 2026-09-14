import { useEffect, useState } from 'react';
import { getActiveThreeGame } from '../game3d/ThreeGame';
import { VirtualStick } from './VirtualStick';

interface TwinStickControlsProps {
  disabled?: boolean;
}

export function TwinStickControls({ disabled = false }: TwinStickControlsProps) {
  const [showTutorial, setShowTutorial] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowTutorial(false);
    }, 5500);
    return () => window.clearTimeout(timer);
  }, []);

  const handleMovementChange = (x: number, y: number) => {
    getActiveThreeGame()?.setMovementVector(x, y);
  };

  const handleAimChange = (x: number, y: number) => {
    getActiveThreeGame()?.setAimVector(x, y);
  };

  return (
    <div className={`twin-stick-controls${disabled ? ' is-disabled' : ''}`}>
      {showTutorial && (
        <div className="twin-stick-tutorial" aria-live="polite">
          <div className="twin-stick-tutorial__pill">
            <span className="twin-stick-tutorial__left">MOVE</span>
            <span className="twin-stick-tutorial__bullet">•</span>
            <span className="twin-stick-tutorial__right">AIM TO ATTACK</span>
          </div>
        </div>
      )}

      {/* Left Stick: Movement */}
      <div className="twin-stick-zone twin-stick-zone--left">
        <VirtualStick
          mode="movement"
          disabled={disabled}
          label="Move hero with left virtual stick"
          onVectorChange={handleMovementChange}
        />
        <div className="twin-stick-label">MOVE</div>
      </div>

      {/* Right Stick: Aim */}
      <div className="twin-stick-zone twin-stick-zone--right">
        <VirtualStick
          mode="aim"
          disabled={disabled}
          label="Aim weapon with right virtual stick"
          onVectorChange={handleAimChange}
        />
        <div className="twin-stick-label twin-stick-label--aim">AIM</div>
      </div>
    </div>
  );
}
