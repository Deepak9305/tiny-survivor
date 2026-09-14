import { Check, Coins, Crosshair, ScrollText, Sparkles } from 'lucide-react';
import { ScreenHeader } from '../components/ScreenHeader';
import type { MissionProgress, SaveData } from '../types';

interface MissionsScreenProps { save: SaveData; onBack: () => void; onClaim: (id: string) => void }

const fallbackMissions: MissionProgress[] = [
  { id: 'daily-kills', title: 'Defeat 500 enemies', target: 500, progress: 0, reward: 100, claimed: false },
  { id: 'daily-survive', title: 'Survive for 10 minutes', target: 600, progress: 0, reward: 150, claimed: false },
  { id: 'daily-clear', title: 'Clear a boss stage', target: 1, progress: 0, reward: 200, claimed: false },
];

export function MissionsScreen({ save, onBack, onClaim }: MissionsScreenProps) {
  const missions = save.missions.length ? save.missions : fallbackMissions;
  return <main className="meta-screen"><ScreenHeader title="MISSIONS" onBack={onBack} right={<span className="daily-label"><Sparkles size={14} /> DAILY</span>} />
    <section className="mission-banner"><div className="mission-banner__icon"><ScrollText size={25} /></div><div><span className="eyebrow">TODAY'S OBJECTIVES</span><h1>Make every run count.</h1><p>Refreshes daily · Progress saved locally</p></div></section>
    <div className="section-label"><span>ACTIVE MISSIONS</span><small>Refreshes daily</small></div>
    <section className="mission-list">{missions.map((mission) => { const currentProgress = Math.min(mission.progress, mission.target); const percent = mission.target > 0 ? Math.min(100, mission.progress / mission.target * 100) : 0; const done = mission.progress >= mission.target; return <div className={`mission-card ${done ? 'is-complete' : ''}`} key={mission.id}><span className="mission-card__icon"><Crosshair size={18} /></span><span className="mission-card__copy"><strong>{mission.title}</strong><small>{currentProgress.toLocaleString()} / {mission.target.toLocaleString()}</small><span className="progress-track"><i style={{ width: `${percent}%` }} /></span></span><button type="button" aria-label={mission.claimed ? `${mission.title}, claimed` : `${mission.title}, reward ${mission.reward} coins`} className={done && !mission.claimed ? 'is-ready' : ''} disabled={!done || mission.claimed} onClick={() => onClaim(mission.id)}>{mission.claimed ? <><Check size={16} /> CLAIMED</> : <><Coins size={12} /> {mission.reward}</>}</button></div>; })}</section>
  </main>;
}
