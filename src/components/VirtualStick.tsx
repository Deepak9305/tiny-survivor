import { useCallback, useEffect, useRef, useState } from 'react';

export type StickMode = 'movement' | 'aim';

interface VirtualStickProps {
  mode: StickMode;
  disabled?: boolean;
  onVectorChange: (x: number, y: number) => void;
  label: string;
}

const DEAD_ZONE = 0.10;
// Knob max travel = 38% of the ring's half-width
const CLAMP_RATIO = 0.38;

export function VirtualStick({
  mode,
  disabled = false,
  onVectorChange,
  label,
}: VirtualStickProps) {
  const zoneRef  = useRef<HTMLDivElement>(null);
  const ringRef  = useRef<HTMLDivElement>(null);
  const knobRef  = useRef<HTMLSpanElement>(null);
  const pointerId = useRef<number | undefined>(undefined);
  // Touch origin (clientX/Y of the initial pointer-down) used for all delta calc
  const origin   = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);

  const reset = useCallback(() => {
    pointerId.current = undefined;
    origin.current    = { x: 0, y: 0 };
    setIsActive(false);
    // Snap knob back to ring center
    if (knobRef.current)
      knobRef.current.style.transform = 'translate(-50%, -50%)';
    // Snap ring back to zone center
    if (ringRef.current)
      ringRef.current.style.transform = 'translate3d(-50%, -50%, 0)';
    onVectorChange(0, 0);
  }, [onVectorChange]);

  useEffect(() => { if (disabled) reset(); }, [disabled, reset]);
  useEffect(() => reset, [reset]); // cleanup on unmount

  /** Move knob relative to ring center, clamped to radius. */
  const moveKnob = (clientX: number, clientY: number) => {
    const ring = ringRef.current;
    if (!ring) return;
    const ringSize = ring.getBoundingClientRect();
    const radius = (ringSize.width || 104) * CLAMP_RATIO;

    let dx = clientX - origin.current.x;
    let dy = clientY - origin.current.y;
    const dist = Math.hypot(dx, dy);
    if (dist > radius) {
      dx = (dx / dist) * radius;
      dy = (dy / dist) * radius;
    }

    const nx = dx / radius;
    const ny = dy / radius;

    if (Math.hypot(nx, ny) < DEAD_ZONE) {
      if (knobRef.current)
        knobRef.current.style.transform = 'translate(-50%, -50%)';
      onVectorChange(0, 0);
      setIsActive(false);
      return;
    }

    setIsActive(true);
    // Knob offset from ring center (ring uses left:50% top:50% as base)
    if (knobRef.current)
      knobRef.current.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    onVectorChange(nx, ny);
  };

  /** Float the ring to wherever the thumb lands. */
  const placeRingAt = (clientX: number, clientY: number) => {
    const zone = zoneRef.current;
    const ring = ringRef.current;
    if (!zone || !ring) return;
    const b = zone.getBoundingClientRect();
    const relX = clientX - b.left;
    const relY = clientY - b.top;
    ring.style.transform = `translate3d(calc(${relX}px - 50%), calc(${relY}px - 50%), 0)`;
  };

  return (
    <div
      ref={zoneRef}
      className={`virtual-stick virtual-stick--${mode}${disabled ? ' is-disabled' : ''}${isActive ? ' is-active' : ''}`}
      aria-label={label}
      role="application"
      style={{ touchAction: 'none' }}
      onPointerDown={(event) => {
        if (disabled || pointerId.current !== undefined) return;
        event.preventDefault();
        pointerId.current = event.pointerId;
        try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* ignore */ }

        // Record touch origin BEFORE moving the ring
        origin.current = { x: event.clientX, y: event.clientY };

        // Float ring to finger
        placeRingAt(event.clientX, event.clientY);
        setIsActive(true);
      }}
      onPointerMove={(event) => {
        if (pointerId.current !== event.pointerId) return;
        event.preventDefault();
        moveKnob(event.clientX, event.clientY);
      }}
      onPointerUp={(event)     => { if (pointerId.current === event.pointerId) reset(); }}
      onPointerCancel={(event) => { if (pointerId.current === event.pointerId) reset(); }}
    >
      {/* Invisible full-zone capture surface */}
      <div className="virtual-stick__touch-area" />

      {/* Floating base ring — JS repositions via transform */}
      <div ref={ringRef} className="virtual-stick__ring">
        <span className="virtual-stick__ticks" aria-hidden="true" />
        {mode === 'aim' && <span className="virtual-stick__aim-crosshair" aria-hidden="true" />}

        {/* Thumb knob: centered in ring, offset by moveKnob() */}
        <span ref={knobRef} className="virtual-stick__knob">
          <span className="virtual-stick__knob-center" />
        </span>
      </div>
    </div>
  );
}
