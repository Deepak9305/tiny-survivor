import { useState } from 'react';
import { Check, ChevronRight, CircleHelp, Gauge, Headphones, RotateCcw, Smartphone, Volume2, VolumeX } from 'lucide-react';
import { ScreenHeader } from '../components/ScreenHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import type { SaveData, Settings } from '../types';

interface SettingsScreenProps { save: SaveData; onBack: () => void; onUpdate: (settings: Settings) => void; onReset: () => void }

export function SettingsScreen({ save, onBack, onUpdate, onReset }: SettingsScreenProps) {
  const [resetConfirm, setResetConfirm] = useState(false);
  const toggle = (key: keyof Settings) => onUpdate({ ...save.settings, [key]: !save.settings[key] });
  return <main className="meta-screen"><ScreenHeader title="SETTINGS" onBack={onBack} />
    <section className="settings-section"><div className="settings-section__title"><Headphones size={16} /> AUDIO & FEEL</div><SettingRow label="Music" icon={save.settings.music ? Volume2 : VolumeX} value={save.settings.music} onToggle={() => toggle('music')} /><SettingRow label="Sound effects" icon={Volume2} value={save.settings.soundEffects} onToggle={() => toggle('soundEffects')} /><SettingRow label="Haptics" icon={Smartphone} value={save.settings.haptics} onToggle={() => toggle('haptics')} /><SettingRow label="Screen shake" icon={Gauge} value={save.settings.screenShake} onToggle={() => toggle('screenShake')} /></section>
    <section className="settings-section"><div className="settings-section__title"><CircleHelp size={16} /> ACCESSIBILITY</div><SettingRow label="Damage numbers" icon={Check} value={save.settings.damageNumbers} onToggle={() => toggle('damageNumbers')} /><SettingRow label="Reduced effects" icon={Gauge} value={save.settings.reducedEffects} onToggle={() => toggle('reducedEffects')} /><SettingRow label="Low performance mode" icon={Gauge} value={save.settings.lowPerformanceMode} onToggle={() => toggle('lowPerformanceMode')} /></section>
    <section className="settings-section settings-section--links"><div className="settings-section__title"><CircleHelp size={16} /> SUPPORT & LEGAL</div><div className="settings-links"><button type="button"><span>Language</span><span>English <ChevronRight size={15} /></span></button><button type="button"><span>Privacy policy</span><ChevronRight size={15} /></button><button type="button"><span>Terms of service</span><ChevronRight size={15} /></button></div></section>
    <PrimaryButton variant="danger" wide onClick={() => setResetConfirm(true)}><RotateCcw size={16} /> RESET PROGRESS</PrimaryButton><p className="version-label">TINY SURVIVOR · v0.1.0 · Offline-first</p>
    {resetConfirm && <div className="reset-modal" role="dialog" aria-modal="true" aria-labelledby="reset-modal-title"><div className="reset-modal__card"><div className="reset-modal__icon"><RotateCcw size={22} /></div><span className="eyebrow">IRREVERSIBLE ACTION</span><h2 id="reset-modal-title">Reset progress?</h2><p>All heroes, upgrades, missions, and stage progress will be deleted from this device.</p><div className="reset-modal__actions"><button type="button" className="reset-modal__cancel" onClick={() => setResetConfirm(false)}>CANCEL</button><PrimaryButton variant="danger" onClick={() => { setResetConfirm(false); onReset(); }}>RESET DATA</PrimaryButton></div></div></div>}
  </main>;
}

interface SettingRowProps { label: string; icon: typeof Volume2; value: boolean; onToggle: () => void }
function SettingRow({ label, icon: Icon, value, onToggle }: SettingRowProps) { return <div className="setting-row"><span><Icon size={17} /> {label}</span><button type="button" className={`toggle ${value ? 'is-on' : ''}`} onClick={onToggle} aria-label={`Toggle ${label}`} aria-pressed={value}><i /></button></div>; }
