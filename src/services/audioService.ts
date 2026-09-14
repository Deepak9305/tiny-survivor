export type MusicTrack = 'menu' | 'run' | 'boss';
export type SfxId =
  | 'tap'
  | 'play'
  | 'magic-bolt'
  | 'fire-orb'
  | 'orbiting-blades'
  | 'chain-lightning'
  | 'hit'
  | 'death'
  | 'hurt'
  | 'xp'
  | 'level-up'
  | 'elite'
  | 'boss-warning'
  | 'boss-slam'
  | 'boss-death'
  | 'stage-clear'
  | 'game-over'
  | 'upgrade'
  | 'revive';

interface SfxOptions { volume?: number; pitch?: number; throttle?: number }
type AudioContextConstructor = new () => AudioContext;

class TinyAudioService {
  private context?: AudioContext;
  private musicGain?: GainNode;
  private sfxGain?: GainNode;
  private musicNodes: AudioScheduledSourceNode[] = [];
  private musicTrack?: MusicTrack;
  private musicEnabled = true;
  private sfxEnabled = true;
  private activeVoices = 0;
  private readonly lastPlayed = new Map<string, number>();

  initialize(): void {
    this.ensureContext();
  }

  playMusic(track: MusicTrack = 'menu'): void {
    this.musicTrack = track;
    if (!this.musicEnabled) return;
    const context = this.ensureContext();
    if (!context || this.musicNodes.length > 0) return;
    const root = track === 'boss' ? 73.42 : track === 'run' ? 98 : 82.41;
    const notes = track === 'boss' ? [root, root * 1.5] : track === 'run' ? [root, root * 1.25] : [root, root * 1.333];
    const now = context.currentTime;
    this.musicGain?.gain.cancelScheduledValues(now);
    this.musicGain?.gain.setValueAtTime(0.0001, now);
    this.musicGain?.gain.exponentialRampToValueAtTime(0.42, now + 0.8);
    for (let index = 0; index < notes.length; index += 1) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = index === 0 ? 'triangle' : 'sine';
      oscillator.frequency.setValueAtTime(notes[index], now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(track === 'boss' ? 0.018 : 0.012, now + 1.2);
      oscillator.connect(gain).connect(this.musicGain!);
      oscillator.start(now);
      this.musicNodes.push(oscillator);
    }
  }

  stopMusic(fadeSeconds = 0.18): void {
    const context = this.context;
    const nodes = this.musicNodes;
    this.musicNodes = [];
    if (!context) return;
    const now = context.currentTime;
    this.musicGain?.gain.cancelScheduledValues(now);
    this.musicGain?.gain.setValueAtTime(Math.max(0.0001, this.musicGain.gain.value), now);
    this.musicGain?.gain.exponentialRampToValueAtTime(0.0001, now + fadeSeconds);
    window.setTimeout(() => nodes.forEach((node) => { try { node.stop(); } catch { /* already stopped */ } }), fadeSeconds * 1000 + 40);
  }

  crossfadeMusic(track: MusicTrack, _duration = 0.4): void {
    if (this.musicTrack === track && this.musicNodes.length > 0) return;
    this.stopMusic();
    this.musicNodes = [];
    this.playMusic(track);
  }

  playSFX(id: SfxId, options: SfxOptions = {}): void {
    if (!this.sfxEnabled) return;
    const now = performance.now();
    const throttle = options.throttle ?? defaultThrottle(id);
    const previous = this.lastPlayed.get(id) ?? -Infinity;
    if (now - previous < throttle * 1000) return;
    if (this.activeVoices >= 12) return;
    this.lastPlayed.set(id, now);
    const context = this.ensureContext();
    if (!context || !this.sfxGain) return;
    const definition = definitionFor(id);
    const pitch = options.pitch ?? 1;
    this.playTone(context, definition.frequency * pitch, definition.duration, (options.volume ?? 1) * definition.volume, definition.type, definition.endFrequency ? definition.endFrequency * pitch : undefined);
    if (definition.harmony) this.playTone(context, definition.harmony * pitch, definition.duration * 0.8, (options.volume ?? 1) * definition.volume * 0.46, 'sine');
  }

  playUISound(id: 'tap' | 'confirm' | 'back' = 'tap'): void {
    this.playSFX(id === 'confirm' ? 'upgrade' : id === 'back' ? 'tap' : 'tap', { volume: 0.72, throttle: 0.04 });
  }

  setMusicEnabled(enabled: boolean): void {
    if (this.musicEnabled === enabled) return;
    this.musicEnabled = enabled;
    if (!enabled) this.stopMusic();
    else if (this.musicTrack) this.playMusic(this.musicTrack);
  }

  setSfxEnabled(enabled: boolean): void { this.sfxEnabled = enabled; }

  pause(): void { void this.context?.suspend().catch(() => undefined); }
  resume(): void { void this.context?.resume().catch(() => undefined); }

  dispose(): void {
    this.stopMusic(0);
    const context = this.context;
    this.context = undefined;
    this.musicGain = undefined;
    this.sfxGain = undefined;
    this.lastPlayed.clear();
    if (context) void context.close().catch(() => undefined);
  }

  private ensureContext(): AudioContext | undefined {
    if (this.context) return this.context;
    if (typeof window === 'undefined') return undefined;
    const audioWindow = window as Window & { webkitAudioContext?: AudioContextConstructor };
    const Constructor = window.AudioContext ?? audioWindow.webkitAudioContext;
    if (!Constructor) return undefined;
    try {
      this.context = new Constructor();
      this.musicGain = this.context.createGain();
      this.sfxGain = this.context.createGain();
      this.musicGain.gain.value = 0.42;
      this.sfxGain.gain.value = 0.72;
      this.musicGain.connect(this.context.destination);
      this.sfxGain.connect(this.context.destination);
      void this.context.resume().catch(() => undefined);
      return this.context;
    } catch {
      this.context = undefined;
      return undefined;
    }
  }

  private playTone(context: AudioContext, frequency: number, duration: number, volume: number, type: OscillatorType, endFrequency?: number): void {
    if (!this.sfxGain) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    this.activeVoices += 1;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(Math.max(20, frequency), now);
    if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain).connect(this.sfxGain);
    oscillator.onended = () => { this.activeVoices = Math.max(0, this.activeVoices - 1); gain.disconnect(); };
    oscillator.start(now);
    oscillator.stop(now + duration + 0.025);
  }
}

const DEFINITIONS: Record<SfxId, { frequency: number; duration: number; volume: number; type: OscillatorType; endFrequency?: number; harmony?: number }> = {
  tap: { frequency: 440, duration: 0.045, volume: 0.045, type: 'square' },
  play: { frequency: 280, endFrequency: 640, duration: 0.16, volume: 0.1, type: 'triangle', harmony: 420 },
  'magic-bolt': { frequency: 620, endFrequency: 850, duration: 0.08, volume: 0.06, type: 'sine' },
  'fire-orb': { frequency: 150, endFrequency: 90, duration: 0.18, volume: 0.08, type: 'sawtooth', harmony: 270 },
  'orbiting-blades': { frequency: 360, endFrequency: 540, duration: 0.1, volume: 0.055, type: 'triangle' },
  'chain-lightning': { frequency: 920, endFrequency: 420, duration: 0.14, volume: 0.09, type: 'square', harmony: 1320 },
  hit: { frequency: 170, endFrequency: 90, duration: 0.075, volume: 0.065, type: 'square' },
  death: { frequency: 250, endFrequency: 70, duration: 0.22, volume: 0.1, type: 'sawtooth' },
  hurt: { frequency: 120, endFrequency: 75, duration: 0.2, volume: 0.12, type: 'sawtooth' },
  xp: { frequency: 760, endFrequency: 1040, duration: 0.07, volume: 0.045, type: 'sine' },
  'level-up': { frequency: 420, endFrequency: 980, duration: 0.3, volume: 0.12, type: 'triangle', harmony: 630 },
  elite: { frequency: 260, endFrequency: 520, duration: 0.2, volume: 0.11, type: 'triangle', harmony: 390 },
  'boss-warning': { frequency: 92, endFrequency: 48, duration: 0.48, volume: 0.17, type: 'sawtooth' },
  'boss-slam': { frequency: 74, endFrequency: 38, duration: 0.3, volume: 0.16, type: 'sawtooth' },
  'boss-death': { frequency: 300, endFrequency: 42, duration: 0.72, volume: 0.17, type: 'sawtooth', harmony: 150 },
  'stage-clear': { frequency: 440, endFrequency: 880, duration: 0.42, volume: 0.14, type: 'triangle', harmony: 660 },
  'game-over': { frequency: 260, endFrequency: 72, duration: 0.52, volume: 0.14, type: 'sawtooth' },
  upgrade: { frequency: 520, endFrequency: 760, duration: 0.13, volume: 0.08, type: 'triangle' },
  revive: { frequency: 220, endFrequency: 660, duration: 0.4, volume: 0.13, type: 'triangle', harmony: 330 },
};

function definitionFor(id: SfxId) { return DEFINITIONS[id]; }

function defaultThrottle(id: SfxId): number {
  if (id === 'hit' || id === 'xp' || id === 'magic-bolt') return 0.07;
  if (id === 'fire-orb' || id === 'chain-lightning') return 0.12;
  return 0.16;
}

export const audioService = new TinyAudioService();
