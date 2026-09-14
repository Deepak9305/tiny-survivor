import { useState } from 'react';
import {
  Check,
  ChevronRight,
  CircleHelp,
  Gauge,
  Headphones,
  RotateCcw,
  Smartphone,
  Sliders,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ScreenHeader } from '../components/ScreenHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { audioService } from '../services/audioService';
import type { SaveData, Settings } from '../types';

interface SettingsScreenProps {
  save: SaveData;
  onBack: () => void;
  onUpdate: (settings: Settings) => void;
  onReset: () => void;
}

export function SettingsScreen({ save, onBack, onUpdate, onReset }: SettingsScreenProps) {
  const [resetConfirm, setResetConfirm] = useState(false);

  const toggle = (key: keyof Settings) => {
    const nextVal = !save.settings[key];
    const nextSettings = { ...save.settings, [key]: nextVal };
    if (key === 'music') audioService.setMusicEnabled(Boolean(nextVal));
    if (key === 'soundEffects') audioService.setSfxEnabled(Boolean(nextVal));
    onUpdate(nextSettings);
  };

  const handleVolumeChange = (type: 'music' | 'sfx', value: number) => {
    const clamped = Math.max(0, Math.min(1, value));
    if (type === 'music') {
      audioService.setMusicVolume(clamped);
      onUpdate({ ...save.settings, musicVolume: clamped });
    } else {
      audioService.setSfxVolume(clamped);
      onUpdate({ ...save.settings, sfxVolume: clamped });
    }
  };

  return (
    <main className="meta-screen settings-screen-landscape">
      <ScreenHeader title="SETTINGS" onBack={onBack} />

      <div className="settings-landscape-grid">
        {/* Left Column: Audio & Feel */}
        <div className="settings-landscape-col">
          <section className="settings-section">
            <div className="settings-section__title">
              <Headphones size={16} /> AUDIO & FEEL
            </div>

            <SettingRow
              label="Music"
              icon={save.settings.music ? Volume2 : VolumeX}
              value={save.settings.music}
              onToggle={() => toggle('music')}
            />

            {/* Music Volume Slider */}
            <div className="setting-slider-row">
              <div className="setting-slider-row__header">
                <span>Music Volume</span>
                <span className="setting-slider-row__val">
                  {Math.round((save.settings.musicVolume ?? 0.65) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                disabled={!save.settings.music}
                value={save.settings.musicVolume ?? 0.65}
                onChange={(e) => handleVolumeChange('music', parseFloat(e.target.value))}
                className="setting-slider"
                aria-label="Music volume"
              />
            </div>

            <SettingRow
              label="Sound Effects"
              icon={Volume2}
              value={save.settings.soundEffects}
              onToggle={() => toggle('soundEffects')}
            />

            {/* SFX Volume Slider */}
            <div className="setting-slider-row">
              <div className="setting-slider-row__header">
                <span>SFX Volume</span>
                <span className="setting-slider-row__val">
                  {Math.round((save.settings.sfxVolume ?? 0.8) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                disabled={!save.settings.soundEffects}
                value={save.settings.sfxVolume ?? 0.8}
                onChange={(e) => handleVolumeChange('sfx', parseFloat(e.target.value))}
                className="setting-slider"
                aria-label="Sound effects volume"
              />
            </div>

            <SettingRow
              label="Haptics"
              icon={Smartphone}
              value={save.settings.haptics}
              onToggle={() => toggle('haptics')}
            />

            <SettingRow
              label="Screen Shake"
              icon={Gauge}
              value={save.settings.screenShake}
              onToggle={() => toggle('screenShake')}
            />
          </section>
        </div>

        {/* Right Column: Accessibility, Performance & Legal */}
        <div className="settings-landscape-col">
          <section className="settings-section">
            <div className="settings-section__title">
              <CircleHelp size={16} /> ACCESSIBILITY & PERFORMANCE
            </div>
            <SettingRow
              label="Damage Numbers"
              icon={Check}
              value={save.settings.damageNumbers}
              onToggle={() => toggle('damageNumbers')}
            />
            <SettingRow
              label="Reduced Effects"
              icon={Gauge}
              value={save.settings.reducedEffects}
              onToggle={() => toggle('reducedEffects')}
            />
            <SettingRow
              label="Low Performance Mode"
              icon={Gauge}
              value={save.settings.lowPerformanceMode}
              onToggle={() => toggle('lowPerformanceMode')}
            />
          </section>

          <section className="settings-section settings-section--links">
            <div className="settings-section__title">
              <CircleHelp size={16} /> SUPPORT & LEGAL
            </div>
            <div className="settings-links">
              <button type="button">
                <span>Language</span>
                <span>
                  English <ChevronRight size={15} />
                </span>
              </button>
              <button type="button">
                <span>Audio Licenses (CC0)</span>
                <span>
                  Verified <ChevronRight size={15} />
                </span>
              </button>
              <button type="button">
                <span>Terms of Service</span>
                <ChevronRight size={15} />
              </button>
            </div>
          </section>

          <div className="settings-danger-zone">
            <PrimaryButton variant="danger" wide onClick={() => setResetConfirm(true)}>
              <RotateCcw size={16} /> RESET PROGRESS
            </PrimaryButton>
            <p className="version-label">TINY SURVIVOR &middot; v0.2.0 &middot; Offline-first</p>
          </div>
        </div>
      </div>

      {resetConfirm && (
        <div className="reset-modal" role="dialog" aria-modal="true" aria-labelledby="reset-modal-title">
          <div className="reset-modal__card">
            <div className="reset-modal__icon">
              <RotateCcw size={22} />
            </div>
            <span className="eyebrow">IRREVERSIBLE ACTION</span>
            <h2 id="reset-modal-title">Reset progress?</h2>
            <p>All heroes, upgrades, missions, and stage progress will be deleted from this device.</p>
            <div className="reset-modal__actions">
              <button type="button" className="reset-modal__cancel" onClick={() => setResetConfirm(false)}>
                CANCEL
              </button>
              <PrimaryButton
                variant="danger"
                onClick={() => {
                  setResetConfirm(false);
                  onReset();
                }}
              >
                RESET DATA
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

interface SettingRowProps {
  label: string;
  icon: typeof Volume2;
  value: boolean;
  onToggle: () => void;
}

function SettingRow({ label, icon: Icon, value, onToggle }: SettingRowProps) {
  return (
    <div className="setting-row">
      <span>
        <Icon size={17} /> {label}
      </span>
      <button
        type="button"
        className={`toggle ${value ? 'is-on' : ''}`}
        onClick={onToggle}
        aria-label={`Toggle ${label}`}
        aria-pressed={value}
      >
        <i />
      </button>
    </div>
  );
}
