interface GameLogoProps {
  compact?: boolean;
  showSubtitle?: boolean;
}

export function GameLogo({ compact = false, showSubtitle = true }: GameLogoProps) {
  return (
    <div className={`game-logo ${compact ? 'game-logo--compact' : ''}`} aria-label="Tiny Survivor">
      <div className="game-logo__title-group">
        <span className="game-logo__tiny" data-text="TINY">TINY</span>
        <span className="game-logo__survivor" data-text="SURVIVOR">SURVIVOR</span>
      </div>
      {!compact && showSubtitle && (
        <span className="game-logo__tagline">SURVIVE &bull; UPGRADE &bull; GET STRONGER</span>
      )}
    </div>
  );
}
