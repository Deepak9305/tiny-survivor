import type { BossId, EnemyKind, WorldDefinition } from '../types';

export const WORLD_MAP_SEEDS: Record<number, number> = {
  1: 11371,
  2: 22943,
  3: 34877,
  4: 45139,
};

const world = (
  id: number,
  name: string,
  subtitle: string,
  theme: WorldDefinition['theme'],
  enemyPool: EnemyKind[],
  bossId: BossId,
  mapProfile: WorldDefinition['mapProfile'],
): WorldDefinition => ({ id, name, subtitle, theme, enemyPool, bossId, mapProfile, mapSeed: WORLD_MAP_SEEDS[id] });

export const WORLD_DEFINITIONS: WorldDefinition[] = [
  world(1, 'Graveyard', 'Where the first night begins', {
    background: 0x1a1236, fog: 0x241648, ground: 0x2b304c, groundDeep: 0x1b1e32, groundDetail: 0x4f5d82,
    prop: 0x5c6b8c, propAlt: 0x8b9dbf, accent: 0x38e5ff, moon: 0xfef08a, warm: 0xf59e0b, keyLight: 0xfff4d6, fillLight: 0x4338ca,
  }, ['skeleton', 'zombie', 'bat', 'archer', 'bone-mage', 'ghost'], 'skeleton-king', 'graveyard'),
  world(2, 'Haunted Forest', 'Whispers between the pines', {
    background: 0x064e3b, fog: 0x047857, ground: 0x16a34a, groundDeep: 0x15803d, groundDetail: 0x4ade80,
    prop: 0x854d0e, propAlt: 0xa16207, accent: 0xd946ef, moon: 0xfef9c3, warm: 0xfacc15, keyLight: 0xfef08a, fillLight: 0x10b981,
  }, ['slime', 'cursed-wolf', 'thornling', 'forest-mage', 'forest-guardian', 'treant'], 'forest-witch', 'forest'),
  world(3, 'Frozen Ruins', 'Cold stone, colder things', {
    background: 0x0c4a6e, fog: 0x0284c7, ground: 0xbae6fd, groundDeep: 0x7dd3fc, groundDetail: 0xe0f2fe,
    prop: 0x0369a1, propAlt: 0x38bdf8, accent: 0xf43f5e, moon: 0xffffff, warm: 0xfbbf24, keyLight: 0xf0f9ff, fillLight: 0x38bdf8,
  }, ['knight', 'frost-wraith', 'ice-mage', 'zombie', 'archer', 'bone-mage', 'ghost'], 'frost-golem', 'frozen'),
  world(4, 'Demon Castle', 'The last light fades here', {
    background: 0x450a0a, fog: 0x7f1d1d, ground: 0x78350f, groundDeep: 0x451a03, groundDetail: 0xf97316,
    prop: 0x991b1b, propAlt: 0xef4444, accent: 0xfacc15, moon: 0xfde047, warm: 0xff7b00, keyLight: 0xffedd5, fillLight: 0xb91c1c,
  }, ['demon', 'imp', 'demon-warrior', 'knight', 'ice-mage', 'bone-mage', 'ghost'], 'demon-lord', 'castle'),
];

export function getWorld(worldId: number): WorldDefinition {
  return WORLD_DEFINITIONS.find((world) => world.id === worldId) ?? WORLD_DEFINITIONS[0];
}

export function getWorldMapSeed(worldId: number): number { return getWorld(worldId).mapSeed; }
