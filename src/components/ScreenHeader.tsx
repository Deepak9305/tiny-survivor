import { ArrowLeft } from 'lucide-react';

interface ScreenHeaderProps {
  title: string;
  onBack: () => void;
  right?: React.ReactNode;
}

export function ScreenHeader({ title, onBack, right }: ScreenHeaderProps) {
  return (
    <header className="screen-header">
      <button type="button" className="icon-button" onClick={onBack} aria-label="Back"><ArrowLeft size={21} /></button>
      <div className="screen-header__title">{title}</div>
      {right ?? <span className="screen-header__spacer" aria-hidden="true" />}
    </header>
  );
}
