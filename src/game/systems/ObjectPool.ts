export class ObjectPool<T> {
  private readonly available: T[] = [];
  private readonly active = new Set<T>();

  constructor(private readonly factory: () => T, private readonly reset?: (item: T) => void) {}

  prewarm(count: number): void {
    for (let index = 0; index < count; index += 1) this.available.push(this.factory());
  }

  acquire(): T {
    const item = this.available.pop() ?? this.factory();
    this.active.add(item);
    return item;
  }

  release(item: T): void {
    if (!this.active.delete(item)) return;
    this.reset?.(item);
    this.available.push(item);
  }

  clear(): void {
    this.available.length = 0;
    this.active.clear();
  }
}
