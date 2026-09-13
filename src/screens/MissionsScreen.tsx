import { Check, Coins, Crosshair, Gift, ScrollText, Sparkles } from 'lucide-react';
import { ScreenHeader } from '../components/ScreenHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import type { MissionProgress, SaveData } from '../types';

interface MissionsScreenProps { save: SaveData; onBack: () => void; onClaim: (id: string) => void }

const fallbackMissions: MissionProgress[] = [
  { id: 'daily-kills', title: 'Defeat 500 enemies', target: 500, progress: 320, reward: 100, claimed: false },
  { id: 'daily-survive', title: 'Survive for 10 minutes', target: 600, progress: 364, reward: 150, claimed: false },
  { id: 'daily-clear', title: 'Clear stage 1-5', target: 1, progress: 0, reward: 200, claimed: false },
];

export function MissionsScreen({ save, onBack, onClaim }: MissionsScreenProps) {
  const missions = save.missions.length ? save.missions : fallbackMissions;
  return <main className="meta-screen"><ScreenHeader title="MISSIONS" onBack={onBack} right={<span className="daily-label"><Sparkles size={14} /> DAILY</span>} />
    <section className="mission-banner"><div className="mission-banner__icon"><ScrollText size={25} /></div><div><span className="eyebrow">TODAY'S CHALLENGES</span><h1>Make every run count.</h1><p>Refreshes at midnight · Local progress</p></div></section>
    <div className="section-label"><span>DAILY MISSIONS</span><small>2h 14m left</small></div>
    <section className="mission-list">{missions.map((mission) => { const percent = Math.min(100, mission.progress / mission.target * 100); const done = mission.progress >= mission.target; return <div className="mission-card" key={mission.id}><span className="mission-card__icon"><Crosshair size={18} /></span><span className="mission-card__copy"><strong>{mission.title}</strong><small>{Math.min(mission.progress, mission.target).toLocaleString()} / {mission.target.toLocaleString()}</small><span className="progress-track"><i style={{ width: `${percent}%` }} /></span></span><button className={done && !mission.claimed ? 'is-ready' : ''} disabled={!done || mission.claimed} onClick={() => onClaim(mission.id)}>{mission.claimed ? <Check size={16} /> : <><Coins size={12} /> {mission.reward}</>}</button></div>; })}</section>
    <div className="reward-strip"><Gift size={17} /><span><strong>Weekly chest</strong><small>Complete 5 daily missions to open</small></span><span className="reward-strip__count">2/5</span></div>
  </main>;
}
