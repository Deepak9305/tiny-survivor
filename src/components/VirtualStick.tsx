import { useEffect, useRef, useState } from 'react';

export type StickMode = 'movement' | 'aim';

interface VirtualStickProps {
  mode: StickMode;
  disabled?: boolean;
  onVectorChange: (x: number, y: number) => void;
  label: string;
}

const RADIUS = 46;
const DEAD_ZONE = 0.12;

export function VirtualStick({
  mode,
  disabled = false,
  onVectorChange,
  label,
}: VirtualStickProps) {
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const pointerId = useRef<number | undefined>(undefined);
  const [isActive, setIsActive] = useState(false);

  const reset = () => {
    pointerId.current = undefined;
    setIsActive(false);
    if (knobRef.current) knobRef.current.style.transform = 'translate3d(0, 0, 0)';
    onVectorChange(0, 0);
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
      x = (x / distance) * RADIUS;
      y = (y / distance) * RADIUS;
    }
    const vectorX = x / RADIUS;
    const vectorY = y / RADIUS;
    const magnitude = Math.sqrt(vectorX * vectorX + vectorY * vectorY);
    if (magnitude < DEAD_ZONE) {
      if (knobRef.current) knobRef.current.style.transform = 'translate3d(0, 0, 0)';
      onVectorChange(0, 0);
      setIsActive(false);
      return;
    }
    setIsActive(true);
    if (knobRef.current) knobRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    onVectorChange(vectorX, vectorY);
  };

  return (
    <div
      ref={baseRef}
      className={`virtual-stick virtual-stick--${mode}${disabled ? ' is-disabled' : ''}${
        isActive ? ' is-active' : ''
      }`}
      aria-label={label}
      role="application"
      style={{ touchAction: 'none' }}
      onPointerDown={(event) => {
        if (disabled || pointerId.current !== undefined) return;
        pointerId.current = event.pointerId;
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          // ignore if capture fails in older webviews
        }
        update(event.clientX, event.clientY);
      }}
      onPointerMove={(event) => {
        if (pointerId.current === event.pointerId) {
          update(event.clientX, event.clientY);
        }
      }}
      onPointerUp={(event) => {
        if (pointerId.current === event.pointerId) reset();
      }}
      onPointerCancel={(event) => {
        if (pointerId.current === event.pointerId) reset();
      }}
    >
      <div className="virtual-stick__touch-area" />
      <span className="virtual-stick__ring" />
      <span className="virtual-stick__ticks" aria-hidden="true" />
      {mode === 'aim' && (
        <span className="virtual-stick__aim-crosshair" aria-hidden="true" />
      )}
      <span ref={knobRef} className="virtual-stick__knob">
        <span className="virtual-stick__knob-center" />
      </span>
    </div>
  );
}
