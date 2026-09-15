import { Check, ChevronLeft, Coins, Hourglass, Skull, Sparkles, Swords } from 'lucide-react';
import type { MissionProgress, SaveData } from '../types';

interface MissionsScreenProps {
  save: SaveData;
  onBack: () => void;
  onClaim: (id: string) => void;
}

const fallbackMissions: MissionProgress[] = [
  {
    id: 'daily-kills',
    title: 'Defeat 500 enemies',
    target: 500,
    progress: 212,
    reward: 100,
    claimed: false,
  },
  {
    id: 'daily-survive',
    title: 'Survive for 10 minutes',
    target: 600,
    progress: 240,
    reward: 150,
    claimed: false,
  },
  {
    id: 'daily-clear',
    title: 'Clear a boss stage',
    target: 1,
    progress: 0,
    reward: 200,
    claimed: false,
  },
];

const MISSION_METAS: Record<
  string,
  { subtitle: string; art: string; icon: typeof Swords }
> = {
  'daily-kills': {
    subtitle: 'Cut through the darkness.',
    art: '/assets/images/mission_skeletons.jpg',
    icon: Swords,
  },
  'daily-survive': {
    subtitle: 'Endure and become stronger.',
    art: '/assets/images/mission_hourglass.jpg',
    icon: Hourglass,
  },
  'daily-clear': {
    subtitle: 'Face the ruler of the darkness.',
    art: '/assets/images/mission_boss.jpg',
    icon: Skull,
  },
};

export function MissionsScreen({ save, onBack, onClaim }: MissionsScreenProps) {
  const missions = save.missions.length ? save.missions : fallbackMissions;

  return (
    <main className="meta-screen missions-landscape-screen">
      {/* Top Header */}
      <header className="missions-header">
        <button
          type="button"
          className="missions-back-btn"
          onClick={onBack}
          aria-label="Back to previous screen"
        >
          <ChevronLeft size={24} />
        </button>

        <h1 className="missions-main-title">MISSIONS</h1>

        <div className="missions-daily-badge">
          <Sparkles size={14} className="missions-daily-badge__sparkle" />
          <span>DAILY</span>
        </div>
      </header>

      <div className="missions-body-container">
        {/* Top Feature Banner */}
        <section className="missions-top-banner">
          <div className="missions-top-banner__bg-overlay" />
          <div className="missions-top-banner__ornament">
            <span className="missions-top-banner__diamond" />
          </div>

          <div className="missions-top-banner__content">
            <div className="missions-top-banner__left">
              <div className="missions-top-banner__icon-circle">
                <svg
                  viewBox="0 0 24 24"
                  width="26"
                  height="26"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <line x1="10" y1="9" x2="8" y2="9" />
                </svg>
              </div>

              <div className="missions-top-banner__text">
                <span className="missions-top-banner__kicker">TODAY'S OBJECTIVES</span>
                <h2 className="missions-top-banner__headline">Make every run count.</h2>
                <p className="missions-top-banner__sub">
                  Refreshes daily &bull; Progress saved locally
                </p>
              </div>
            </div>

            <div className="missions-top-banner__right">
              <blockquote className="missions-top-banner__quote">
                &ldquo;SMALL VICTORIES FOR A STRONGER TOMORROW.&rdquo;
              </blockquote>
            </div>
          </div>
        </section>

        {/* Active Missions Section */}
        <section className="missions-active-section">
          <div className="missions-section-bar">
            <span className="missions-section-title">ACTIVE MISSIONS</span>
            <span className="missions-section-sub">Refreshes daily</span>
          </div>

          <div className="missions-cards-list">
            {missions.map((mission) => {
              const meta = MISSION_METAS[mission.id] ?? MISSION_METAS['daily-kills'];
              const Icon = meta.icon;
              const currentProgress = Math.min(mission.progress, mission.target);
              const percent =
                mission.target > 0
                  ? Math.min(100, Math.round((mission.progress / mission.target) * 100))
                  : 0;
              const isDone = mission.progress >= mission.target;

              return (
                <div
                  key={mission.id}
                  className={`mission-card-landscape ${isDone ? 'is-complete' : ''} ${
                    mission.claimed ? 'is-claimed' : ''
                  }`}
                  style={{ backgroundImage: `url(${meta.art})` }}
                >
                  <div className="mission-card-landscape__art-overlay" />

                  <div className="mission-card-landscape__content">
                    {/* Circular Icon */}
                    <div className="mission-card-landscape__icon-circle">
                      <Icon size={24} />
                    </div>

                    {/* Copy & Progress Bar */}
                    <div className="mission-card-landscape__body">
                      <div className="mission-card-landscape__title-row">
                        <strong className="mission-card-landscape__title">{mission.title}</strong>
                        <span className="mission-card-landscape__numbers">
                          {currentProgress.toLocaleString()} / {mission.target.toLocaleString()}
                        </span>
                      </div>

                      <p className="mission-card-landscape__subtitle">{meta.subtitle}</p>

                      {/* Cyan Glowing Progress Track */}
                      <div className="mission-card-landscape__track">
                        <div
                          className="mission-card-landscape__fill"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    {/* Reward Button */}
                    <div className="mission-card-landscape__action">
                      <button
                        type="button"
                        className={`mission-reward-gold-btn ${
                          mission.claimed ? 'is-claimed' : isDone ? 'is-ready' : 'is-pending'
                        }`}
                        disabled={!isDone || mission.claimed}
                        onClick={() => onClaim(mission.id)}
                        aria-label={
                          mission.claimed
                            ? `${mission.title}, claimed`
                            : `${mission.title}, reward ${mission.reward} coins`
                        }
                      >
                        {mission.claimed ? (
                          <>
                            <Check size={16} />
                            <span>CLAIMED</span>
                          </>
                        ) : (
                          <>
                            <span className="mission-reward-gold-btn__coin-circle">
                              <Coins size={14} />
                            </span>
                            <span className="mission-reward-gold-btn__val">{mission.reward}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
