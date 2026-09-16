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
    background: 0x08101a, fog: 0x0e1b2a, ground: 0x1e2c3a, groundDeep: 0x121c26, groundDetail: 0x32475c,
    prop: 0x485e74, propAlt: 0x6a849e, accent: 0x38e5ff, moon: 0xdcf2ff, warm: 0xffaa33, keyLight: 0xc5e8ff, fillLight: 0x2c4358,
  }, ['skeleton', 'zombie', 'bat', 'archer', 'bone-mage', 'ghost'], 'skeleton-king', 'graveyard'),
  world(2, 'Haunted Forest', 'Whispers between the pines', {
    background: 0x091416, fog: 0x0f2224, ground: 0x1c2e28, groundDeep: 0x101e1a, groundDetail: 0x2d483e,
    prop: 0x384a3c, propAlt: 0x526b56, accent: 0xb455ff, moon: 0xa4f5e0, warm: 0xffb844, keyLight: 0x9aeed8, fillLight: 0x243e36,
  }, ['slime', 'cursed-wolf', 'thornling', 'forest-mage', 'forest-guardian', 'treant'], 'forest-witch', 'forest'),
  world(3, 'Frozen Ruins', 'Cold stone, colder things', {
    background: 0x081628, fog: 0x10243c, ground: 0x243b52, groundDeep: 0x142436, groundDetail: 0x3c5e82,
    prop: 0x6288aa, propAlt: 0x8eb2d4, accent: 0x55e2ff, moon: 0xeaf6ff, warm: 0x7ae8ff, keyLight: 0xdcf0ff, fillLight: 0x284666,
  }, ['knight', 'frost-wraith', 'ice-mage', 'zombie', 'archer', 'bone-mage', 'ghost'], 'frost-golem', 'frozen'),
  world(4, 'Demon Castle', 'The last light fades here', {
    background: 0x180b14, fog: 0x281220, ground: 0x321a24, groundDeep: 0x1c0d14, groundDetail: 0x542636,
    prop: 0x582a3a, propAlt: 0x863e52, accent: 0xff3d2e, moon: 0xff8844, warm: 0xff6618, keyLight: 0xff8a50, fillLight: 0x4a1824,
  }, ['demon', 'imp', 'demon-warrior', 'knight', 'ice-mage', 'bone-mage', 'ghost'], 'demon-lord', 'castle'),
];

export function getWorld(worldId: number): WorldDefinition {
  return WORLD_DEFINITIONS.find((world) => world.id === worldId) ?? WORLD_DEFINITIONS[0];
}

export function getWorldMapSeed(worldId: number): number { return getWorld(worldId).mapSeed; }
