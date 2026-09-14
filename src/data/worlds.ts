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
    background: 0x07111e, fog: 0x0c1b2c, ground: 0x14202d, groundDeep: 0x0a121b, groundDetail: 0x223244,
    prop: 0x3d4e60, propAlt: 0x5a7086, accent: 0x4bdcff, moon: 0xc8f0ff, warm: 0xffb347, keyLight: 0xa8e2ff, fillLight: 0x1f3448,
  }, ['skeleton', 'bat', 'slime', 'ghost', 'archer', 'knight', 'imp'], 'skeleton-king', 'graveyard'),
  world(2, 'Haunted Forest', 'Whispers between the pines', {
    background: 0x08131d, fog: 0x0d1f2b, ground: 0x112128, groundDeep: 0x091418, groundDetail: 0x1e363a,
    prop: 0x2e4242, propAlt: 0x48645e, accent: 0xa855f7, moon: 0x99e8ff, warm: 0xffaa44, keyLight: 0x88e2ff, fillLight: 0x1a2d3b,
  }, ['skeleton', 'bat', 'slime', 'ghost', 'archer', 'demon'], 'forest-witch', 'forest'),
  world(3, 'Frozen Ruins', 'Cold stone, colder things', {
    background: 0x071526, fog: 0x0e2238, ground: 0x13273c, groundDeep: 0x091829, groundDetail: 0x284768,
    prop: 0x527796, propAlt: 0x7da5c6, accent: 0x6be5ff, moon: 0xe0f7ff, warm: 0x7ae2ff, keyLight: 0xbfeaff, fillLight: 0x223e5a,
  }, ['ghost', 'slime', 'archer', 'knight', 'demon', 'bat'], 'frost-golem', 'frozen'),
  world(4, 'Demon Castle', 'The last light fades here', {
    background: 0x130a16, fog: 0x220e20, ground: 0x24141e, groundDeep: 0x12080f, groundDetail: 0x461a29,
    prop: 0x4e2230, propAlt: 0x7a3045, accent: 0xff4838, moon: 0xffaa66, warm: 0xff6a22, keyLight: 0xff9966, fillLight: 0x42101e,
  }, ['knight', 'demon', 'imp', 'archer', 'skeleton', 'ghost'], 'demon-lord', 'castle'),
];

export function getWorld(worldId: number): WorldDefinition {
  return WORLD_DEFINITIONS.find((world) => world.id === worldId) ?? WORLD_DEFINITIONS[0];
}

export function getWorldMapSeed(worldId: number): number { return getWorld(worldId).mapSeed; }
