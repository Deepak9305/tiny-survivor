import type { BossId, EnemyKind, StageDefinition } from '../types';

export interface WorldPropDefinition {
  id: string;
  name: string;
  category: 'landmark' | 'structure' | 'foliage' | 'grave' | 'light' | 'detail';
}

export const GRAVEYARD_PROPS: WorldPropDefinition[] = [
  { id: 'grave_a', name: 'Weathered Headstone', category: 'grave' },
  { id: 'grave_b', name: 'Gothic Tombstone', category: 'grave' },
  { id: 'grave_cross', name: 'Runic Cross Grave', category: 'grave' },
  { id: 'grave_broken', name: 'Shattered Tombstone', category: 'grave' },
  { id: 'crypt_small', name: 'Ancient Stone Crypt', category: 'structure' },
  { id: 'crypt_large', name: 'Noble Mausoleum', category: 'landmark' },
  { id: 'dead_tree_a', name: 'Gnarled Dead Tree', category: 'foliage' },
  { id: 'dead_tree_b', name: 'Forked Dead Tree', category: 'foliage' },
  { id: 'dead_tree_twisted', name: 'Twisted Cemetery Oak', category: 'foliage' },
  { id: 'iron_fence', name: 'Wrought Iron Fence', category: 'structure' },
  { id: 'iron_gate', name: 'Cemetery Gate', category: 'structure' },
  { id: 'lantern_post', name: 'Warden Lantern Post', category: 'light' },
  { id: 'candle_cluster', name: 'Votive Candle Cluster', category: 'light' },
  { id: 'angel_statue', name: 'Weeping Angel Statue', category: 'landmark' },
  { id: 'stone_arch', name: 'Ruined Gothic Arch', category: 'landmark' },
  { id: 'chapel_ruin', name: 'Ruined Chapel Facade', category: 'landmark' },
  { id: 'rock_cluster', name: 'Mossy Graveyard Rocks', category: 'detail' },
  { id: 'path_slab', name: 'Cracked Cobblestone Slab', category: 'detail' },
];

export const FOREST_PROPS: WorldPropDefinition[] = [
  { id: 'cursed_tree_giant', name: 'The Great Cursed Tree', category: 'landmark' },
  { id: 'tree_twisted_a', name: 'Twisted Hollow Oak', category: 'foliage' },
  { id: 'tree_twisted_b', name: 'Bent Birch of Sorrows', category: 'foliage' },
  { id: 'tree_twisted_c', name: 'Ancient Grove Willow', category: 'foliage' },
  { id: 'exposed_roots', name: 'Serpentine Root Flare', category: 'foliage' },
  { id: 'fallen_log', name: 'Hollow Mossy Log', category: 'foliage' },
  { id: 'tree_stump', name: 'Ancient Stump', category: 'foliage' },
  { id: 'mushroom_cluster_a', name: 'Bioluminescent Mushrooms', category: 'detail' },
  { id: 'mushroom_cluster_b', name: 'Spore Caps', category: 'detail' },
  { id: 'standing_stone', name: 'Spectral Menhir', category: 'structure' },
  { id: 'ancient_shrine', name: 'Spirit Shrine of Elders', category: 'landmark' },
  { id: 'spirit_lantern', name: 'Ghostflame Lantern', category: 'light' },
  { id: 'broken_bridge', name: 'Rotten Timber Footbridge', category: 'structure' },
  { id: 'mossy_rock', name: 'Overgrown Boulder', category: 'detail' },
  { id: 'spectral_wisp_post', name: 'Wisp Tether Post', category: 'light' },
];

export const FROZEN_PROPS: WorldPropDefinition[] = [
  { id: 'temple_gate_arch', name: 'Great Frost Gate', category: 'landmark' },
  { id: 'frozen_pillar_a', name: 'Fluted Ice Pillar', category: 'structure' },
  { id: 'frozen_pillar_b', name: 'Glacial Monolith', category: 'structure' },
  { id: 'broken_pillar', name: 'Toppled Frozen Column', category: 'structure' },
  { id: 'ice_crystal_huge', name: 'Shattered Glacial Spire', category: 'landmark' },
  { id: 'ice_crystal_cluster', name: 'Frost Diamond Cluster', category: 'detail' },
  { id: 'ice_shard_small', name: 'Sharp Ice Stalagmite', category: 'detail' },
  { id: 'frozen_statue', name: 'Frozen Warrior Monument', category: 'landmark' },
  { id: 'frozen_altar', name: 'Rime Carved Altar', category: 'structure' },
  { id: 'temple_wall', name: 'Frosted Temple Wall', category: 'structure' },
  { id: 'snowbank_large', name: 'Drifting Snowbank', category: 'detail' },
  { id: 'snowbank_small', name: 'Fresh Powder Mound', category: 'detail' },
  { id: 'frost_slab', name: 'Permafrost Flagstone', category: 'detail' },
];

export const CASTLE_PROPS: WorldPropDefinition[] = [
  { id: 'infernal_gate', name: 'Gates of Dis', category: 'landmark' },
  { id: 'demon_throne_silhouette', name: 'Brimstone Throne', category: 'landmark' },
  { id: 'demon_statue', name: 'Gargoyle of Wrath', category: 'landmark' },
  { id: 'obsidian_pillar', name: 'Fluted Obsidian Column', category: 'structure' },
  { id: 'castle_wall_spiked', name: 'Iron Crested Rampart', category: 'structure' },
  { id: 'fire_brazier', name: 'Hellfire Brazier', category: 'light' },
  { id: 'demon_altar', name: 'Bloodstone Sacrificial Altar', category: 'structure' },
  { id: 'blood_crystal_cluster', name: 'Crimson Brimstone Cluster', category: 'detail' },
  { id: 'iron_chains', name: 'Forged Infernal Chain', category: 'structure' },
  { id: 'iron_spike', name: 'Impaling Spike Cluster', category: 'detail' },
  { id: 'lava_fissure_prop', name: 'Molten Geyser Vent', category: 'detail' },
  { id: 'rubble_pile', name: 'Charred Ash Masonry', category: 'detail' },
];

export const WORLD_PROP_REGISTRY: Record<number, WorldPropDefinition[]> = {
  1: GRAVEYARD_PROPS,
  2: FOREST_PROPS,
  3: FROZEN_PROPS,
  4: CASTLE_PROPS,
};

export const WORLD_PROP_DIRECTORIES: Record<number, 'graveyard' | 'forest' | 'frozen' | 'castle'> = {
  1: 'graveyard',
  2: 'forest',
  3: 'frozen',
  4: 'castle',
};

export interface StageAssetRequirements {
  heroId: string;
  enemyKinds: EnemyKind[];
  bossId?: BossId;
  worldProps: WorldPropDefinition[];
  worldSlug: 'graveyard' | 'forest' | 'frozen' | 'castle';
}

export function getStageAssetRequirements(stage: StageDefinition, heroId = 'shadow'): StageAssetRequirements {
  const worldSlug = WORLD_PROP_DIRECTORIES[stage.worldId] ?? 'graveyard';
  return {
    heroId,
    enemyKinds: [...stage.enemies],
    bossId: stage.bossStage ? stage.bossId : undefined,
    worldProps: WORLD_PROP_REGISTRY[stage.worldId] ?? GRAVEYARD_PROPS,
    worldSlug,
  };
}

export const GAMEPLAY_TIPS = [
  'Keep moving! Circling enemies helps herd them into tight clusters for area spells.',
  'Magic Bolt pierces through enemies at higher levels, cutting lines through hordes.',
  'Fire Orb causes massive explosive ground flash upon impact. High damage to bosses!',
  'Chain Lightning arcs across dense swarms of enemies instantly.',
  'Orbiting Blades create a protective ring of steel and cyan runes around you.',
  'XP crystals magnetically accelerate toward you when you step inside your pickup radius.',
  'Watch for red telegraph rings before major boss attacks, then counterattack!',
  'Check the Monster Codex to learn each enemy\'s specific elemental weaknesses.',
  'World Bosses summon minions and cycle through multiple punishing combat phases.',
];

export function getRandomGameplayTip(): string {
  const index = Math.floor(Math.random() * GAMEPLAY_TIPS.length);
  return GAMEPLAY_TIPS[index];
}
