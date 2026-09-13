import type { RunResult } from '../../types';

export type RunStatus = 'idle' | 'running' | 'paused' | 'finished' | 'failed';

export class RunController {
  private status: RunStatus = 'idle';
  private result: RunResult;

  constructor(stageId: string, stageName: string) {
    this.result = { stageId, stageName, time: 0, kills: 0, eliteKills: 0, bossKills: 0, coins: 0, xpCollected: 0, highestLevel: 1 };
  }

  startRun(): void { if (this.status === 'idle') this.status = 'running'; }
  pauseRun(): void { if (this.status === 'running') this.status = 'paused'; }
  resumeRun(): void { if (this.status === 'paused') this.status = 'running'; }
  finishRun(): boolean { if (this.status === 'finished' || this.status === 'failed') return false; this.status = 'finished'; return true; }
  failRun(): boolean { if (this.status === 'finished' || this.status === 'failed') return false; this.status = 'failed'; return true; }
  reviveRun(): boolean { if (this.status !== 'failed') return false; this.status = 'running'; return true; }
  quitRun(): void { this.status = 'failed'; }
  getStatus(): RunStatus { return this.status; }
  getRunStats(): RunResult { return { ...this.result }; }
  updateStats(patch: Partial<RunResult>): void { this.result = { ...this.result, ...patch }; }
}
