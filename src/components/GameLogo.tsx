interface GameLogoProps { compact?: boolean }

export function GameLogo({ compact = false }: GameLogoProps) {
  return (
    <div className={`game-logo ${compact ? 'game-logo--compact' : ''}`} aria-label="Tiny Survivor">
      <span className="game-logo__tiny">TINY</span>
      <span className="game-logo__survivor">SURVIVOR</span>
      {!compact && <span className="game-logo__tagline">SURVIVE · UPGRADE · GET STRONGER</span>}
    </div>
  );
}
