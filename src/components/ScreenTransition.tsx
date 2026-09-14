import { useEffect, useState, type ReactNode } from 'react';

export function ScreenTransition({ screen, children }: { screen: string; children: ReactNode }) {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    setEntered(false);
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, [screen]);
  return <div className={`screen-transition${entered ? ' is-entered' : ''}`}>{children}</div>;
}
