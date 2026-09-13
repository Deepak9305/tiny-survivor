import { useEffect, useRef } from 'react';
import { getActiveThreeGame } from '../game3d/ThreeGame';

interface VirtualJoystickProps { disabled?: boolean }

const RADIUS = 48;
const DEAD_ZONE = 0.12;

export function VirtualJoystick({ disabled = false }: VirtualJoystickProps) {
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const pointerId = useRef<number | undefined>(undefined);

  const reset = () => {
    pointerId.current = undefined;
    if (knobRef.current) knobRef.current.style.transform = 'translate3d(0, 0, 0)';
    getActiveThreeGame()?.setMovementVector(0, 0);
  };

  useEffect(() => {
    if (disabled) reset();
  }, [disabled]);

  useEffect(() => () => reset(), []);

  const update = (clientX: number, clientY: number) => {
    const base = baseRef.current;
    if (!base) return;
    const bounds = base.getBoundingClientRect();
    let x = clientX - (bounds.left + bounds.width / 2);
    let y = clientY - (bounds.top + bounds.height / 2);
    const distance = Math.sqrt(x * x + y * y);
    if (distance > RADIUS) {
      x = x / distance * RADIUS;
      y = y / distance * RADIUS;
    }
    const vectorX = x / RADIUS;
    const vectorY = y / RADIUS;
    const magnitude = Math.sqrt(vectorX * vectorX + vectorY * vectorY);
    if (magnitude < DEAD_ZONE) {
      if (knobRef.current) knobRef.current.style.transform = 'translate3d(0, 0, 0)';
      getActiveThreeGame()?.setMovementVector(0, 0);
      return;
    }
    if (knobRef.current) knobRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    getActiveThreeGame()?.setMovementVector(vectorX, vectorY);
  };

  return <div
    ref={baseRef}
    className={`virtual-joystick${disabled ? ' is-disabled' : ''}`}
    aria-label="Move hero"
    role="application"
    onPointerDown={(event) => {
      if (disabled || pointerId.current !== undefined) return;
      pointerId.current = event.pointerId;
      event.currentTarget.setPointerCapture(event.pointerId);
      update(event.clientX, event.clientY);
    }}
    onPointerMove={(event) => { if (pointerId.current === event.pointerId) update(event.clientX, event.clientY); }}
    onPointerUp={(event) => { if (pointerId.current === event.pointerId) reset(); }}
    onPointerCancel={(event) => { if (pointerId.current === event.pointerId) reset(); }}
  >
    <span className="virtual-joystick__ring" />
    <span ref={knobRef} className="virtual-joystick__knob" />
  </div>;
}
