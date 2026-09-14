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
    background: 0x05172b, fog: 0x0a2035, ground: 0x123653, groundDeep: 0x081d30, groundDetail: 0x28536b,
    prop: 0x334e67, propAlt: 0x58748b, accent: 0x70d8f5, moon: 0xbbeaff, warm: 0xffbf5a, keyLight: 0xb8e5ff, fillLight: 0x35678e,
  }, ['skeleton', 'bat', 'slime', 'ghost', 'archer', 'knight', 'imp'], 'skeleton-king', 'graveyard'),
  world(2, 'Haunted Forest', 'Whispers between the pines', {
    background: 0x061a18, fog: 0x0a2824, ground: 0x0c2826, groundDeep: 0x071b1a, groundDetail: 0x1c4a3f,
    prop: 0x1b493b, propAlt: 0x326b4c, accent: 0x81e2ae, moon: 0xb9ffe1, warm: 0xffc768, keyLight: 0xb8f5d1, fillLight: 0x245e4c,
  }, ['skeleton', 'bat', 'slime', 'ghost', 'archer', 'demon'], 'forest-witch', 'forest'),
  world(3, 'Frozen Ruins', 'Cold stone, colder things', {
    background: 0x081b31, fog: 0x102a43, ground: 0x173554, groundDeep: 0x0c223a, groundDetail: 0x345c7b,
    prop: 0x5f8eaa, propAlt: 0x9bc9db, accent: 0x9ce7ff, moon: 0xd4f7ff, warm: 0x8bdcff, keyLight: 0xbdeaff, fillLight: 0x325b85,
  }, ['ghost', 'slime', 'archer', 'knight', 'demon', 'bat'], 'frost-golem', 'frozen'),
  world(4, 'Demon Castle', 'The last light fades here', {
    background: 0x1c0e1b, fog: 0x321426, ground: 0x301928, groundDeep: 0x1b101e, groundDetail: 0x5e2b36,
    prop: 0x622d3e, propAlt: 0x9b4350, accent: 0xff9c63, moon: 0xffd295, warm: 0xff784d, keyLight: 0xffc09a, fillLight: 0x6b2637,
  }, ['knight', 'demon', 'imp', 'archer', 'skeleton', 'ghost'], 'demon-lord', 'castle'),
];

export function getWorld(worldId: number): WorldDefinition {
  return WORLD_DEFINITIONS.find((world) => world.id === worldId) ?? WORLD_DEFINITIONS[0];
}

export function getWorldMapSeed(worldId: number): number { return getWorld(worldId).mapSeed; }
