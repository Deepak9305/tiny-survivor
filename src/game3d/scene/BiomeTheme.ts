import type { StageDefinition } from '../../types';

export interface BiomeTheme {
  background: number;
  fog: number;
  ground: number;
  groundDeep: number;
  groundDetail: number;
  prop: number;
  propAlt: number;
  accent: number;
  moon: number;
  warm: number;
  keyLight: number;
  fillLight: number;
}

const BIOME_THEMES: Record<number, BiomeTheme> = {
  1: { background: 0x041222, fog: 0x071827, ground: 0x0b2233, groundDeep: 0x071724, groundDetail: 0x17374a, prop: 0x1d3449, propAlt: 0x2b4d61, accent: 0x70d8f5, moon: 0xbbeaff, warm: 0xffbf5a, keyLight: 0xa7dcff, fillLight: 0x244e72 },
  2: { background: 0x061a18, fog: 0x0a2824, ground: 0x0c2826, groundDeep: 0x071b1a, groundDetail: 0x1c4a3f, prop: 0x1b493b, propAlt: 0x326b4c, accent: 0x81e2ae, moon: 0xb9ffe1, warm: 0xffc768, keyLight: 0xb8f5d1, fillLight: 0x245e4c },
  3: { background: 0x081b31, fog: 0x102a43, ground: 0x173554, groundDeep: 0x0c223a, groundDetail: 0x345c7b, prop: 0x5f8eaa, propAlt: 0x9bc9db, accent: 0x9ce7ff, moon: 0xd4f7ff, warm: 0x8bdcff, keyLight: 0xbdeaff, fillLight: 0x325b85 },
  4: { background: 0x1c0e1b, fog: 0x321426, ground: 0x301928, groundDeep: 0x1b101e, groundDetail: 0x5e2b36, prop: 0x622d3e, propAlt: 0x9b4350, accent: 0xff9c63, moon: 0xffd295, warm: 0xff784d, keyLight: 0xffc09a, fillLight: 0x6b2637 },
};

export function biomeThemeFor(stage: StageDefinition): BiomeTheme {
  return BIOME_THEMES[stage.worldId] ?? BIOME_THEMES[1];
}
