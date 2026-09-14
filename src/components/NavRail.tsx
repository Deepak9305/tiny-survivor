import { BookOpen, Crown, Home, ScrollText, Swords } from 'lucide-react';
import type { Screen } from '../types';

interface NavRailProps {
  current: Screen;
  onNavigate: (screen: Screen) => void;
}

const navItems: Array<{ id: Screen; label: string; icon: typeof Home }> = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'heroes', label: 'Heroes', icon: Swords },
  { id: 'upgrades', label: 'Upgrades', icon: Crown },
  { id: 'missions', label: 'Missions', icon: ScrollText },
  { id: 'bestiary', label: 'Codex', icon: BookOpen },
];

export function NavRail({ current, onNavigate }: NavRailProps) {
  return (
    <nav className="nav-rail" aria-label="Meta navigation rail">
      <div className="nav-rail__items">
        {navItems.map(({ id, label, icon: Icon }) => {
          const isActive = current === id;
          return (
            <button
              type="button"
              key={id}
              className={`nav-rail__btn ${isActive ? 'is-active' : ''}`}
              onClick={() => onNavigate(id)}
              aria-label={label}
              title={label}
            >
              <div className="nav-rail__icon-box">
                <Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} />
              </div>
              <span className="nav-rail__label">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
