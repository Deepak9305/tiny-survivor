import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';

interface ScreenHeaderProps {
  title: string;
  onBack: () => void;
  right?: ReactNode;
}

export function ScreenHeader({ title, onBack, right }: ScreenHeaderProps) {
  return (
    <header className="dark-fantasy-header">
      <button
        type="button"
        className="dark-fantasy-back-btn"
        onClick={onBack}
        aria-label="Back"
      >
        <ChevronLeft size={24} />
      </button>

      <div className="dark-fantasy-title-wrap">
        <h1 className="dark-fantasy-main-title">{title}</h1>
        <div className="dark-fantasy-title-ornament">
          <span className="dark-fantasy-title-diamond" />
        </div>
      </div>

      <div className="dark-fantasy-right-slot">
        {right ?? <span className="dark-fantasy-spacer" aria-hidden="true" />}
      </div>
    </header>
  );
}

