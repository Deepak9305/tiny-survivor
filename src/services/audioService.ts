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
  | 'ability-heal'
  | 'dash'
  | 'event-fanfare'
  | 'gem-chime'
  | 'rune-pickup'
  | 'frenzy-horn'
  | 'meteor-fall'
  | 'combo-stinger'
  | 'chest-drop'
  | 'chest-open'
  | 'sword-cleave'
  | 'scythe-slash'
  | 'chi-punch'
  | 'shotgun-blast'
  | 'reroll'
  | 'skip-heal'
  | 'boing'
  | 'squeak'
  | 'whoosh'
  | 'splat'
  | 'honk'
  | 'wah-wah'
  | 'fanfare';

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
  tap: { frequency: 520, duration: 0.04, volume: 0.05, type: 'triangle' },
  play: { frequency: 320, endFrequency: 780, duration: 0.18, volume: 0.12, type: 'triangle', harmony: 480 },
  'magic-bolt': { frequency: 680, endFrequency: 960, duration: 0.075, volume: 0.07, type: 'sine', harmony: 1360 },
  'fire-orb': { frequency: 180, endFrequency: 85, duration: 0.19, volume: 0.09, type: 'sawtooth', harmony: 360 },
  'orbiting-blades': { frequency: 420, endFrequency: 680, duration: 0.09, volume: 0.065, type: 'triangle', harmony: 840 },
  'chain-lightning': { frequency: 980, endFrequency: 380, duration: 0.13, volume: 0.10, type: 'square', harmony: 1470 },
  hit: { frequency: 240, endFrequency: 80, duration: 0.08, volume: 0.09, type: 'triangle', harmony: 480 },
  death: { frequency: 280, endFrequency: 60, duration: 0.24, volume: 0.12, type: 'sawtooth', harmony: 140 },
  hurt: { frequency: 140, endFrequency: 70, duration: 0.18, volume: 0.13, type: 'sawtooth', harmony: 280 },
  xp: { frequency: 880, endFrequency: 1320, duration: 0.06, volume: 0.055, type: 'sine', harmony: 1760 },
  'level-up': { frequency: 440, endFrequency: 1100, duration: 0.35, volume: 0.15, type: 'triangle', harmony: 880 },
  elite: { frequency: 330, endFrequency: 660, duration: 0.22, volume: 0.13, type: 'triangle', harmony: 495 },
  'boss-warning': { frequency: 110, endFrequency: 55, duration: 0.52, volume: 0.19, type: 'sawtooth', harmony: 220 },
  'boss-slam': { frequency: 85, endFrequency: 40, duration: 0.32, volume: 0.18, type: 'sawtooth', harmony: 170 },
  'boss-death': { frequency: 360, endFrequency: 45, duration: 0.75, volume: 0.19, type: 'sawtooth', harmony: 180 },
  'stage-clear': { frequency: 523, endFrequency: 1046, duration: 0.45, volume: 0.16, type: 'triangle', harmony: 784 },
  'game-over': { frequency: 290, endFrequency: 65, duration: 0.55, volume: 0.15, type: 'sawtooth' },
  upgrade: { frequency: 587, endFrequency: 880, duration: 0.14, volume: 0.10, type: 'triangle', harmony: 1174 },
  revive: { frequency: 260, endFrequency: 780, duration: 0.42, volume: 0.15, type: 'triangle', harmony: 520 },
  // Enemy Attack Cues
  'archer-charge': { frequency: 620, endFrequency: 840, duration: 0.36, volume: 0.08, type: 'sine', harmony: 1240 },
  'bat-dive': { frequency: 960, endFrequency: 280, duration: 0.22, volume: 0.095, type: 'sawtooth', harmony: 480 },
  'slime-jump': { frequency: 170, endFrequency: 580, duration: 0.24, volume: 0.11, type: 'sine', harmony: 340 },
  'ghost-phase': { frequency: 440, endFrequency: 720, duration: 0.35, volume: 0.075, type: 'sine', harmony: 880 },
  'knight-charge': { frequency: 130, endFrequency: 70, duration: 0.32, volume: 0.12, type: 'square', harmony: 260 },
  'imp-fuse': { frequency: 880, endFrequency: 1100, duration: 0.07, volume: 0.07, type: 'square' },
  'imp-explode': { frequency: 160, endFrequency: 50, duration: 0.38, volume: 0.16, type: 'sawtooth', harmony: 320 },
  'skeleton-slash': { frequency: 320, endFrequency: 140, duration: 0.14, volume: 0.085, type: 'triangle', harmony: 640 },
  'demon-slash': { frequency: 240, endFrequency: 95, duration: 0.20, volume: 0.11, type: 'sawtooth', harmony: 480 },
  'ability-fireball': { frequency: 180, endFrequency: 80, duration: 0.28, volume: 0.13, type: 'sawtooth', harmony: 270 },
  'ability-freeze': { frequency: 1046, endFrequency: 1568, duration: 0.32, volume: 0.12, type: 'sine', harmony: 2093 },
  'ability-beam': { frequency: 523, endFrequency: 1046, duration: 0.38, volume: 0.14, type: 'triangle', harmony: 784 },
  'ability-heal': { frequency: 392, endFrequency: 784, duration: 0.42, volume: 0.11, type: 'sine', harmony: 1176 },
  dash: { frequency: 660, endFrequency: 200, duration: 0.16, volume: 0.15, type: 'sine', harmony: 1320 },
  'event-fanfare': { frequency: 440, endFrequency: 880, duration: 0.38, volume: 0.16, type: 'triangle', harmony: 660 },
  'gem-chime': { frequency: 1175, endFrequency: 1760, duration: 0.24, volume: 0.15, type: 'sine', harmony: 2350 },
  'rune-pickup': { frequency: 523, endFrequency: 1046, duration: 0.32, volume: 0.16, type: 'triangle', harmony: 784 },
  'frenzy-horn': { frequency: 130, endFrequency: 85, duration: 0.52, volume: 0.19, type: 'sawtooth', harmony: 195 },
  'meteor-fall': { frequency: 840, endFrequency: 95, duration: 0.42, volume: 0.16, type: 'sawtooth', harmony: 210 },
  'combo-stinger': { frequency: 587, endFrequency: 1175, duration: 0.24, volume: 0.14, type: 'triangle', harmony: 880 },
  'chest-drop': { frequency: 494, endFrequency: 988, duration: 0.32, volume: 0.17, type: 'triangle', harmony: 740 },
  'chest-open': { frequency: 587, endFrequency: 1480, duration: 0.55, volume: 0.22, type: 'triangle', harmony: 1175 },
  'sword-cleave': { frequency: 220, endFrequency: 80, duration: 0.15, volume: 0.14, type: 'triangle', harmony: 440 },
  'scythe-slash': { frequency: 580, endFrequency: 190, duration: 0.14, volume: 0.12, type: 'triangle', harmony: 870 },
  'chi-punch': { frequency: 320, endFrequency: 90, duration: 0.10, volume: 0.13, type: 'square', harmony: 640 },
  'shotgun-blast': { frequency: 240, endFrequency: 60, duration: 0.17, volume: 0.16, type: 'sawtooth', harmony: 360 },
  reroll: { frequency: 659, endFrequency: 330, duration: 0.15, volume: 0.15, type: 'triangle', harmony: 988 },
  'skip-heal': { frequency: 440, endFrequency: 880, duration: 0.28, volume: 0.15, type: 'sine', harmony: 660 },
  // Goofy Cartoon SFX
  boing: { frequency: 220, endFrequency: 680, duration: 0.26, volume: 0.16, type: 'sine', harmony: 440 },
  squeak: { frequency: 1280, endFrequency: 2400, duration: 0.09, volume: 0.14, type: 'sine', harmony: 3840 },
  whoosh: { frequency: 720, endFrequency: 180, duration: 0.20, volume: 0.14, type: 'sine', harmony: 1080 },
  splat: { frequency: 240, endFrequency: 65, duration: 0.18, volume: 0.15, type: 'sawtooth', harmony: 120 },
  honk: { frequency: 390, endFrequency: 410, duration: 0.22, volume: 0.16, type: 'square', harmony: 585 },
  'wah-wah': { frequency: 260, endFrequency: 75, duration: 0.65, volume: 0.18, type: 'sawtooth', harmony: 130 },
  fanfare: { frequency: 523, endFrequency: 1046, duration: 0.48, volume: 0.18, type: 'triangle', harmony: 784 },
};

function definitionFor(id: SfxId) {
  return DEFINITIONS[id] ?? DEFINITIONS.tap;
}

function defaultThrottle(id: SfxId): number {
  if (id === 'hit' || id === 'xp' || id === 'magic-bolt' || id === 'gem-chime' || id === 'squeak') return 0.06;
  if (id === 'sword-cleave' || id === 'scythe-slash' || id === 'chi-punch' || id === 'shotgun-blast' || id === 'splat') return 0.08;
  if (id === 'fire-orb' || id === 'chain-lightning' || id === 'combo-stinger' || id === 'boing' || id === 'whoosh') return 0.10;
  if (id === 'imp-fuse' || id === 'reroll' || id === 'honk') return 0.14;
  if (id === 'archer-charge' || id === 'bat-dive' || id === 'slime-jump') return 0.25;
  if (id === 'rune-pickup' || id === 'frenzy-horn' || id === 'meteor-fall' || id === 'chest-drop' || id === 'chest-open' || id === 'skip-heal' || id === 'wah-wah' || id === 'fanfare') return 0.25;
  return 0.14;
}

export const audioService = new TinyAudioService();
