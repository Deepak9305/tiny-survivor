import { Crown, Gem, House, Map, ScrollText, Swords } from 'lucide-react';
import type { Screen } from '../types';

interface BottomNavProps {
  current: Screen;
  onNavigate: (screen: Screen) => void;
}

const items: Array<{ id: Screen; label: string; icon: typeof House }> = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'heroes', label: 'Heroes', icon: Swords },
  { id: 'upgrades', label: 'Upgrades', icon: Crown },
  { id: 'missions', label: 'Missions', icon: ScrollText },
  { id: 'shop', label: 'Shop', icon: Gem },
];

export function BottomNav({ current, onNavigate }: BottomNavProps) {
  return <nav className="bottom-nav">{items.map(({ id, label, icon: Icon }) => <button key={id} className={current === id ? 'is-active' : ''} onClick={() => onNavigate(id)}><Icon size={17} /><span>{label}</span></button>)}<button className={current === 'map' ? 'is-active' : ''} onClick={() => onNavigate('map')}><Map size={17} /><span>Map</span></button></nav>;
}
