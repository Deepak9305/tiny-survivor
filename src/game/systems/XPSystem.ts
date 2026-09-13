import { getXPRequired } from '../../data/balance';

export class XPSystem {
  level = 1;
  xp = 0;
  private queuedLevelUps = 0;

  getXPRequired(): number {
    return getXPRequired(this.level);
  }

  addXP(value: number): number {
    this.xp += Math.max(0, value);
    let levels = 0;
    while (this.xp >= this.getXPRequired()) {
      this.xp -= this.getXPRequired();
      this.level += 1;
      this.queuedLevelUps += 1;
      levels += 1;
    }
    return levels;
  }

  checkLevelUp(): boolean {
    return this.queuedLevelUps > 0;
  }

  queueLevelUp(): void {
    this.queuedLevelUps += 1;
  }

  processQueuedLevelUps(): boolean {
    if (this.queuedLevelUps <= 0) return false;
    this.queuedLevelUps -= 1;
    return true;
  }
}
