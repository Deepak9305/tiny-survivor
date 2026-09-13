import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import type { RunResult, SaveData } from '../types';
import { saveGame } from './saveService';

export async function registerAppLifecycle(getSave: () => SaveData): Promise<() => void> {
  if (!Capacitor.isNativePlatform()) return () => undefined;
  const listener = await App.addListener('appStateChange', ({ isActive }) => {
    if (!isActive) void saveGame(getSave());
  });
  return () => { void listener.remove(); };
}

export async function shareRunResult(result: RunResult): Promise<void> {
  try {
    await Share.share({ title: 'Tiny Survivor', text: `I survived ${formatSeconds(result.time)} in Tiny Survivor and defeated ${result.kills} enemies.`, dialogTitle: 'Share your run' });
  } catch {
    // Sharing is optional and unavailable on some web hosts.
  }
}

function formatSeconds(seconds: number): string { return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`; }
