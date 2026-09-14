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
  | 'revive'
  | 'archer-charge'
  | 'bat-dive'
  | 'slime-jump'
  | 'ghost-phase'
  | 'knight-charge'
  | 'imp-fuse'
  | 'imp-explode'
  | 'skeleton-slash'
  | 'demon-slash'
  | 'ability-fireball'
  | 'ability-freeze'
  | 'ability-beam'
  | 'ability-heal';

interface SfxOptions {
  volume?: number;
  pitch?: number;
  throttle?: number;
}

type AudioContextConstructor = new () => AudioContext;

const TRACK_PATHS: Record<MusicTrack, string> = {
  menu: '/assets/audio/music/menu-calm.mp3',
  run: '/assets/audio/music/battle-intense.mp3',
  boss: '/assets/audio/music/boss-intense.mp3',
};

interface MusicChannel {
  source?: AudioBufferSourceNode;
  gain: GainNode;
  track?: MusicTrack;
  fadeEndTime: number;
}

class TinyAudioService {
  private context?: AudioContext;
  private masterMusicGain?: GainNode;
  private sfxGain?: GainNode;
  private channels: MusicChannel[] = [];
  private activeChannelIndex = 0;
  private musicBuffers = new Map<MusicTrack, AudioBuffer>();
  private loadingTracks = new Set<MusicTrack>();
  private currentTrack?: MusicTrack;
  private musicEnabled = true;
  private sfxEnabled = true;
  private musicVolume = 0.65;
  private sfxVolume = 0.80;
  private duckFactor = 1.0;
  private activeVoices = 0;
  private readonly lastPlayed = new Map<string, number>();
  private unlocked = false;

  initialize(): void {
    this.ensureContext();
    this.setupUnlockListeners();
    this.preloadMusic('menu');
  }

  private setupUnlockListeners(): void {
    if (typeof window === 'undefined' || this.unlocked) return;
    const unlock = () => {
      this.unlocked = true;
      if (this.context && this.context.state === 'suspended') {
        void this.context.resume().catch(() => undefined);
      }
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
  }

  private ensureContext(): AudioContext | undefined {
    if (this.context) return this.context;
    if (typeof window === 'undefined') return undefined;
    const audioWindow = window as Window & { webkitAudioContext?: AudioContextConstructor };
    const Constructor = window.AudioContext ?? audioWindow.webkitAudioContext;
    if (!Constructor) return undefined;

    try {
      this.context = new Constructor();
      this.masterMusicGain = this.context.createGain();
      this.masterMusicGain.gain.setValueAtTime(this.musicEnabled ? this.musicVolume * this.duckFactor : 0.0001, this.context.currentTime);
      this.masterMusicGain.connect(this.context.destination);

      this.sfxGain = this.context.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxEnabled ? this.sfxVolume : 0.0001, this.context.currentTime);
      this.sfxGain.connect(this.context.destination);

      // Create two independent channels for true smooth crossfading
      this.channels = [
        { gain: this.context.createGain(), fadeEndTime: 0 },
        { gain: this.context.createGain(), fadeEndTime: 0 },
      ];
      this.channels[0].gain.connect(this.masterMusicGain);
      this.channels[1].gain.connect(this.masterMusicGain);
      this.channels[0].gain.gain.setValueAtTime(0, this.context.currentTime);
      this.channels[1].gain.gain.setValueAtTime(0, this.context.currentTime);

      return this.context;
    } catch {
      this.context = undefined;
      return undefined;
    }
  }

  async preloadMusic(track: MusicTrack): Promise<AudioBuffer | undefined> {
    if (this.musicBuffers.has(track)) return this.musicBuffers.get(track);
    if (this.loadingTracks.has(track)) return undefined;
    this.loadingTracks.add(track);

    const context = this.ensureContext();
    if (!context) {
      this.loadingTracks.delete(track);
      return undefined;
    }

    try {
      const response = await fetch(TRACK_PATHS[track]);
      if (!response.ok) throw new Error(`HTTP ${response.status} for ${TRACK_PATHS[track]}`);
      const arrayBuffer = await response.arrayBuffer();
      const decoded = await context.decodeAudioData(arrayBuffer);
      this.musicBuffers.set(track, decoded);
      this.loadingTracks.delete(track);
      return decoded;
    } catch {
      this.loadingTracks.delete(track);
      return undefined;
    }
  }

  playMusic(track: MusicTrack = 'menu', crossfadeDuration = 0.8): void {
    if (this.currentTrack === track && this.getCurrentPlayingChannel()?.source) {
      return;
    }
    this.currentTrack = track;
    if (!this.musicEnabled) return;

    void this.startTrack(track, crossfadeDuration);
  }

  crossfadeMusic(track: MusicTrack, duration = 0.8): void {
    this.playMusic(track, duration);
  }

  private async startTrack(track: MusicTrack, crossfadeDuration: number): Promise<void> {
    const context = this.ensureContext();
    if (!context) return;
    if (context.state === 'suspended') {
      void context.resume().catch(() => undefined);
    }

    let buffer = this.musicBuffers.get(track);
    if (!buffer) {
      buffer = await this.preloadMusic(track);
    }
    if (!buffer || this.currentTrack !== track) return;

    const now = context.currentTime;
    const oldChannel = this.channels[this.activeChannelIndex];
    const newChannelIndex = (this.activeChannelIndex + 1) % 2;
    const newChannel = this.channels[newChannelIndex];

    // Fade out old channel
    if (oldChannel.source) {
      oldChannel.gain.gain.cancelScheduledValues(now);
      const currentVol = oldChannel.gain.gain.value;
      oldChannel.gain.gain.setValueAtTime(Math.max(0.0001, currentVol), now);
      oldChannel.gain.gain.exponentialRampToValueAtTime(0.0001, now + crossfadeDuration);
      const sourceToStop = oldChannel.source;
      window.setTimeout(() => {
        try { sourceToStop.stop(); } catch { /* ignore */ }
      }, (crossfadeDuration + 0.1) * 1000);
      oldChannel.source = undefined;
    }

    // Start and fade in new channel
    try {
      if (newChannel.source) {
        try { newChannel.source.stop(); } catch { /* ignore */ }
      }
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(newChannel.gain);

      newChannel.gain.gain.cancelScheduledValues(now);
      newChannel.gain.gain.setValueAtTime(0.0001, now);
      newChannel.gain.gain.exponentialRampToValueAtTime(1.0, now + Math.max(0.1, crossfadeDuration));
      source.start(now);

      newChannel.source = source;
      newChannel.track = track;
      this.activeChannelIndex = newChannelIndex;
    } catch {
      // Audio node start failure fallback
    }
  }

  stopMusic(fadeSeconds = 0.3): void {
    const context = this.context;
    if (!context) return;
    const now = context.currentTime;
    for (const channel of this.channels) {
      if (channel.source) {
        channel.gain.gain.cancelScheduledValues(now);
        const cur = Math.max(0.0001, channel.gain.gain.value);
        channel.gain.gain.setValueAtTime(cur, now);
        channel.gain.gain.exponentialRampToValueAtTime(0.0001, now + fadeSeconds);
        const src = channel.source;
        window.setTimeout(() => {
          try { src.stop(); } catch { /* ignore */ }
        }, (fadeSeconds + 0.05) * 1000);
        channel.source = undefined;
      }
    }
    this.currentTrack = undefined;
  }

  duckMusic(ratio = 0.42, duration = 0.28): void {
    this.duckFactor = Math.max(0.1, Math.min(1.0, ratio));
    this.applyMusicVolume(duration);
  }

  unduckMusic(duration = 0.35): void {
    this.duckFactor = 1.0;
    this.applyMusicVolume(duration);
  }

  restoreMusicVolume(duration = 0.35): void {
    this.unduckMusic(duration);
  }

  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    this.applyMusicVolume(0.05);
  }

  setSfxVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    if (this.context && this.sfxGain) {
      const now = this.context.currentTime;
      this.sfxGain.gain.cancelScheduledValues(now);
      this.sfxGain.gain.setValueAtTime(this.sfxEnabled ? this.sfxVolume : 0.0001, now);
    }
  }

  private applyMusicVolume(rampDuration = 0.1): void {
    if (!this.context || !this.masterMusicGain) return;
    const target = this.musicEnabled ? this.musicVolume * this.duckFactor : 0.0001;
    const now = this.context.currentTime;
    this.masterMusicGain.gain.cancelScheduledValues(now);
    this.masterMusicGain.gain.setValueAtTime(Math.max(0.0001, this.masterMusicGain.gain.value), now);
    this.masterMusicGain.gain.exponentialRampToValueAtTime(Math.max(0.0001, target), now + Math.max(0.02, rampDuration));
  }

  private getCurrentPlayingChannel(): MusicChannel | undefined {
    return this.channels[this.activeChannelIndex];
  }

  playSFX(id: SfxId, options: SfxOptions = {}): void {
    if (!this.sfxEnabled) return;
    const now = performance.now();
    const throttle = options.throttle ?? defaultThrottle(id);
    const previous = this.lastPlayed.get(id) ?? -Infinity;
    if (now - previous < throttle * 1000) return;
    if (this.activeVoices >= 14) return;
    this.lastPlayed.set(id, now);

    const context = this.ensureContext();
    if (!context || !this.sfxGain) return;
    const definition = definitionFor(id);
    const pitch = options.pitch ?? 1;
    this.playTone(
      context,
      definition.frequency * pitch,
      definition.duration,
      (options.volume ?? 1) * definition.volume,
      definition.type,
      definition.endFrequency ? definition.endFrequency * pitch : undefined
    );
    if (definition.harmony) {
      this.playTone(
        context,
        definition.harmony * pitch,
        definition.duration * 0.8,
        (options.volume ?? 1) * definition.volume * 0.46,
        'sine'
      );
    }
  }

  playUISound(id: 'tap' | 'confirm' | 'back' = 'tap'): void {
    this.playSFX(id === 'confirm' ? 'upgrade' : id === 'back' ? 'tap' : 'tap', { volume: 0.72, throttle: 0.04 });
  }

  setMusicEnabled(enabled: boolean): void {
    if (this.musicEnabled === enabled) return;
    this.musicEnabled = enabled;
    this.applyMusicVolume(0.15);
    if (enabled && this.currentTrack) {
      this.playMusic(this.currentTrack);
    }
  }

  setSfxEnabled(enabled: boolean): void {
    this.sfxEnabled = enabled;
    if (this.context && this.sfxGain) {
      const now = this.context.currentTime;
      this.sfxGain.gain.setValueAtTime(enabled ? this.sfxVolume : 0.0001, now);
    }
  }

  pause(): void {
    void this.context?.suspend().catch(() => undefined);
  }

  resume(): void {
    void this.context?.resume().catch(() => undefined);
  }

  dispose(): void {
    this.stopMusic(0);
    const context = this.context;
    this.context = undefined;
    this.masterMusicGain = undefined;
    this.sfxGain = undefined;
    this.channels = [];
    this.musicBuffers.clear();
    this.lastPlayed.clear();
    if (context) void context.close().catch(() => undefined);
  }

  private playTone(
    context: AudioContext,
    frequency: number,
    duration: number,
    volume: number,
    type: OscillatorType,
    endFrequency?: number
  ): void {
    if (!this.sfxGain) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    this.activeVoices += 1;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(Math.max(20, frequency), now);
    if (endFrequency) {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), now + duration);
    }
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain).connect(this.sfxGain);
    oscillator.onended = () => {
      this.activeVoices = Math.max(0, this.activeVoices - 1);
      gain.disconnect();
    };
    oscillator.start(now);
    oscillator.stop(now + duration + 0.025);
  }
}

const DEFINITIONS: Record<
  SfxId,
  { frequency: number; duration: number; volume: number; type: OscillatorType; endFrequency?: number; harmony?: number }
> = {
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
  // Enemy Attack Cues
  'archer-charge': { frequency: 580, endFrequency: 740, duration: 0.38, volume: 0.07, type: 'sine' },
  'bat-dive': { frequency: 820, endFrequency: 320, duration: 0.24, volume: 0.085, type: 'sawtooth' },
  'slime-jump': { frequency: 160, endFrequency: 340, duration: 0.22, volume: 0.08, type: 'triangle' },
  'ghost-phase': { frequency: 410, endFrequency: 620, duration: 0.35, volume: 0.065, type: 'sine', harmony: 820 },
  'knight-charge': { frequency: 110, endFrequency: 65, duration: 0.32, volume: 0.11, type: 'square' },
  'imp-fuse': { frequency: 750, endFrequency: 960, duration: 0.07, volume: 0.06, type: 'square' },
  'imp-explode': { frequency: 140, endFrequency: 45, duration: 0.36, volume: 0.14, type: 'sawtooth', harmony: 280 },
  'skeleton-slash': { frequency: 290, endFrequency: 130, duration: 0.15, volume: 0.075, type: 'triangle' },
  'demon-slash': { frequency: 220, endFrequency: 90, duration: 0.22, volume: 0.095, type: 'sawtooth' },
  'ability-fireball': { frequency: 160, endFrequency: 75, duration: 0.28, volume: 0.12, type: 'sawtooth', harmony: 240 },
  'ability-freeze': { frequency: 950, endFrequency: 1420, duration: 0.32, volume: 0.11, type: 'sine', harmony: 1900 },
  'ability-beam': { frequency: 480, endFrequency: 960, duration: 0.38, volume: 0.13, type: 'triangle', harmony: 720 },
  'ability-heal': { frequency: 330, endFrequency: 660, duration: 0.42, volume: 0.10, type: 'sine', harmony: 990 },
};

function definitionFor(id: SfxId) {
  return DEFINITIONS[id] ?? DEFINITIONS.tap;
}

function defaultThrottle(id: SfxId): number {
  if (id === 'hit' || id === 'xp' || id === 'magic-bolt') return 0.07;
  if (id === 'fire-orb' || id === 'chain-lightning') return 0.12;
  if (id === 'imp-fuse') return 0.14;
  if (id === 'archer-charge' || id === 'bat-dive' || id === 'slime-jump') return 0.25;
  return 0.16;
}

export const audioService = new TinyAudioService();
