import { BookOpen, Crown, ScrollText, Swords } from 'lucide-react';
import type { Screen } from '../types';

interface BottomNavProps {
  current: Screen;
  onNavigate: (screen: Screen) => void;
}

const items: Array<{ id: Screen; label: string; icon: typeof Swords }> = [
  { id: 'heroes', label: 'Heroes', icon: Swords },
  { id: 'upgrades', label: 'Upgrades', icon: Crown },
  { id: 'missions', label: 'Missions', icon: ScrollText },
  { id: 'bestiary', label: 'Codex', icon: BookOpen },
];

export function BottomNav({ current, onNavigate }: BottomNavProps) {
  return <nav className="bottom-nav" aria-label="Primary navigation">{items.map(({ id, label, icon: Icon }) => <button type="button" key={id} className={current === id ? 'is-active' : ''} onClick={() => onNavigate(id)}><Icon size={21} strokeWidth={2.1} /><span>{label}</span></button>)}</nav>;
}
