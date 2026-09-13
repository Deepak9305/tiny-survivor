export interface SpatialEntity {
  id: string;
  x: number;
  y: number;
}

export class SpatialGrid<T extends SpatialEntity> {
  private readonly cells = new Map<string, Set<T>>();
  private readonly entityCells = new Map<string, string>();

  constructor(private readonly cellSize = 160) {}

  private key(x: number, y: number): string {
    return `${Math.floor(x / this.cellSize)}:${Math.floor(y / this.cellSize)}`;
  }

  clear(): void {
    this.cells.clear();
    this.entityCells.clear();
  }

  insert(entity: T): void {
    const key = this.key(entity.x, entity.y);
    const cell = this.cells.get(key) ?? new Set<T>();
    cell.add(entity);
    this.cells.set(key, cell);
    this.entityCells.set(entity.id, key);
  }

  remove(entity: T): void {
    const key = this.entityCells.get(entity.id);
    if (!key) return;
    const cell = this.cells.get(key);
    cell?.delete(entity);
    if (cell && cell.size === 0) this.cells.delete(key);
    this.entityCells.delete(entity.id);
  }

  update(entity: T): void {
    const nextKey = this.key(entity.x, entity.y);
    if (this.entityCells.get(entity.id) === nextKey) return;
    this.remove(entity);
    this.insert(entity);
  }

  queryRadius(x: number, y: number, radius: number): T[] {
    const result: T[] = [];
    const minX = Math.floor((x - radius) / this.cellSize);
    const maxX = Math.floor((x + radius) / this.cellSize);
    const minY = Math.floor((y - radius) / this.cellSize);
    const maxY = Math.floor((y + radius) / this.cellSize);
    const radiusSquared = radius * radius;
    for (let cellX = minX; cellX <= maxX; cellX += 1) {
      for (let cellY = minY; cellY <= maxY; cellY += 1) {
        const cell = this.cells.get(`${cellX}:${cellY}`);
        if (!cell) continue;
        for (const entity of cell) {
          const dx = entity.x - x;
          const dy = entity.y - y;
          if (dx * dx + dy * dy <= radiusSquared) result.push(entity);
        }
      }
    }
    return result;
  }
}
