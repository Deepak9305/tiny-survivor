import type { BiomeTheme, StageDefinition } from '../../types';
import { getWorld } from '../../data/worlds';

export type { BiomeTheme } from '../../types';

export function biomeThemeFor(stage: StageDefinition): BiomeTheme { return getWorld(stage.worldId).theme; }
export function biomeThemeForWorld(worldId: number): BiomeTheme { return getWorld(worldId).theme; }
