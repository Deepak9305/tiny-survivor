/**
 * Single source of truth for major solid environment pieces across all worlds.
 * Visual arena builders and gameplay collision resolvers both consume this authored data.
 */

export type ColliderDef =
  | { type: 'circle'; radius: number; offsetX?: number; offsetZ?: number }
  | { type: 'box'; width: number; depth: number; offsetX?: number; offsetZ?: number };

export interface WorldPropPlacement {
  id: string;
  propType: string;
  x: number;
  z: number;
  rotationY?: number;
  scale?: { x: number; y: number; z: number } | number;
  collider?: ColliderDef;
  isOccluder?: boolean;
  name?: string;
}

export interface WorldLayoutData {
  worldId: number;
  slug: 'graveyard' | 'forest' | 'frozen' | 'castle';
  name: string;
  props: WorldPropPlacement[];
}

/**
 * WORLD 1: GRAVEYARD
 * Identity: OPEN / READABLE / BEGINNER FRIENDLY
 * - Broad courtyard with mostly open combat space
 * - Chapel concentrated toward NORTH-WEST (not centered)
 * - Mausoleum cluster on EAST side
 * - Broken grave wall along part of WEST
 * - Cemetery pond / deep basin toward SOUTH-EAST
 * - Large central combat clearing completely clear of obstacles
 * - Orderly grave rows creating partial dodging lanes
 */
export const GRAVEYARD_LAYOUT: WorldLayoutData = {
  worldId: 1,
  slug: 'graveyard',
  name: 'Graveyard of the Fallen',
  props: [
    // North-West Chapel Facade
    {
      id: 'gy-chapel',
      propType: 'chapel_ruin',
      x: -7.5,
      z: -9.5,
      rotationY: 0.18,
      collider: { type: 'box', width: 5.4, depth: 2.2 },
      isOccluder: true,
      name: 'Chapel of the Fallen',
    },
    // East Mausoleum Complex
    {
      id: 'gy-mausoleum-east',
      propType: 'crypt_large',
      x: 8.5,
      z: -3.5,
      rotationY: -0.32,
      collider: { type: 'box', width: 3.4, depth: 3.4 },
      isOccluder: true,
      name: 'East Royal Mausoleum',
    },
    {
      id: 'gy-crypt-east-annex',
      propType: 'crypt_small',
      x: 10.5,
      z: 3.5,
      rotationY: -0.2,
      collider: { type: 'box', width: 2.4, depth: 2.4 },
      isOccluder: true,
      name: 'East Crypt Annex',
    },
    // West Broken Grave Wall Section
    {
      id: 'gy-west-wall-north',
      propType: 'stone_wall_segment',
      x: -9.5,
      z: 1.5,
      rotationY: 0.1,
      collider: { type: 'box', width: 1.4, depth: 4.2 },
      name: 'West Ruined Wall',
    },
    // South-East Deep Cemetery Pond
    {
      id: 'gy-se-pond',
      propType: 'cemetery_pond',
      x: 7.5,
      z: 7.5,
      collider: { type: 'circle', radius: 2.2 },
      name: 'Sealed Pond Basin',
    },
    // South Gatehouse Pillars (wide central gap for south traversal)
    {
      id: 'gy-south-pillar-l',
      propType: 'gate_pillar',
      x: -3.4,
      z: 11.2,
      collider: { type: 'box', width: 1.4, depth: 1.4 },
      name: 'South Gate Pillar Left',
    },
    {
      id: 'gy-south-pillar-r',
      propType: 'gate_pillar',
      x: 3.4,
      z: 11.2,
      collider: { type: 'box', width: 1.4, depth: 1.4 },
      name: 'South Gate Pillar Right',
    },
    // Perimeter Ancient Oaks (large tree trunks that collide)
    {
      id: 'gy-tree-nw',
      propType: 'ancient_oak',
      x: -14.5,
      z: -7.5,
      collider: { type: 'circle', radius: 1.1 },
      isOccluder: true,
      name: 'Ancient Oak NW',
    },
    {
      id: 'gy-tree-ne',
      propType: 'ancient_oak',
      x: 14.0,
      z: -8.5,
      collider: { type: 'circle', radius: 1.1 },
      isOccluder: true,
      name: 'Ancient Oak NE',
    },
    {
      id: 'gy-tree-sw',
      propType: 'ancient_oak',
      x: -14.0,
      z: 8.5,
      collider: { type: 'circle', radius: 1.1 },
      isOccluder: true,
      name: 'Ancient Oak SW',
    },
    // Partial Grave Plot Rows (Short partial lanes, not solid walls)
    {
      id: 'gy-graverow-w1',
      propType: 'grave_plot_row',
      x: -4.5,
      z: -5.0,
      rotationY: 0.05,
      collider: { type: 'box', width: 1.8, depth: 0.7 },
      name: 'Grave Plot Row W1',
    },
    {
      id: 'gy-graverow-w2',
      propType: 'grave_plot_row',
      x: -4.5,
      z: -2.5,
      rotationY: -0.05,
      collider: { type: 'box', width: 1.8, depth: 0.7 },
      name: 'Grave Plot Row W2',
    },
    // North-East Weeping Angel Shrine (shifted far from center)
    {
      id: 'gy-angel-statue',
      propType: 'angel_statue',
      x: 3.5,
      z: -8.5,
      collider: { type: 'circle', radius: 1.0 },
      isOccluder: true,
      name: 'Weeping Angel Plinth',
    },
  ],
};

/**
 * WORLD 2: HAUNTED FOREST
 * Identity: ORGANIC / WINDING / UNEVEN
 * - Giant Cursed Tree offset toward NORTH-EAST
 * - Large central clearing shifted toward South/West (not at 0,0)
 * - Dense tree/root cluster dividing West and Center
 * - Ancient Spirit Shrine toward SOUTH-WEST
 * - Murky Deep Bog / Mire toward EAST
 * - Fallen giant tree creating a long diagonal obstacle
 * - Organic standing stone circle toward North-West
 */
export const FOREST_LAYOUT: WorldLayoutData = {
  worldId: 2,
  slug: 'forest',
  name: 'Haunted Forest',
  props: [
    // Giant Cursed Tree at North-East
    {
      id: 'forest-giant-tree',
      propType: 'cursed_tree_giant',
      x: 7.2,
      z: -8.0,
      rotationY: -0.35,
      collider: { type: 'circle', radius: 2.2 },
      isOccluder: true,
      name: 'Great Cursed Tree',
    },
    // Dense Root & Tree Barrier dividing West and Center
    {
      id: 'forest-root-barrier-1',
      propType: 'ancient_oak',
      x: -4.6,
      z: -0.5,
      collider: { type: 'circle', radius: 1.5 },
      isOccluder: true,
      name: 'Gnarled Trunk Central West',
    },
    {
      id: 'forest-root-barrier-2',
      propType: 'ancient_oak',
      x: -3.8,
      z: 3.8,
      collider: { type: 'circle', radius: 1.4 },
      isOccluder: true,
      name: 'Twisted Burl Trunk',
    },
    // Ancient Spirit Shrine at South-West
    {
      id: 'forest-spirit-shrine',
      propType: 'spirit_shrine',
      x: -8.2,
      z: 8.0,
      rotationY: 0.38,
      collider: { type: 'box', width: 3.2, depth: 3.2 },
      isOccluder: true,
      name: 'Ancient Spirit Shrine',
    },
    // Deep Bog Basin at East
    {
      id: 'forest-deep-bog',
      propType: 'deep_bog',
      x: 8.5,
      z: 3.5,
      collider: { type: 'circle', radius: 2.2 },
      name: 'Deep Forest Bog',
    },
    // Fallen Giant Trunk (Long diagonal obstacle dividing North and Center)
    {
      id: 'forest-fallen-trunk-1',
      propType: 'fallen_log_segment',
      x: -2.0,
      z: -7.2,
      rotationY: 0.45,
      collider: { type: 'box', width: 3.0, depth: 1.2 },
      name: 'Fallen Giant Trunk Upper',
    },
    {
      id: 'forest-fallen-trunk-2',
      propType: 'fallen_log_segment',
      x: 0.6,
      z: -5.8,
      rotationY: 0.45,
      collider: { type: 'box', width: 3.0, depth: 1.2 },
      name: 'Fallen Giant Trunk Lower',
    },
    // Standing Stone Henge at North-West
    {
      id: 'forest-standing-stones',
      propType: 'standing_stones',
      x: -10.5,
      z: -7.5,
      collider: { type: 'circle', radius: 1.6 },
      isOccluder: true,
      name: 'Ancient Standing Stones',
    },
    // Peripheral Spire Trunks
    {
      id: 'forest-perimeter-e',
      propType: 'ancient_oak',
      x: 14.2,
      z: -2.0,
      collider: { type: 'circle', radius: 1.2 },
      isOccluder: true,
      name: 'Perimeter Trunk East',
    },
    {
      id: 'forest-perimeter-w',
      propType: 'ancient_oak',
      x: -14.5,
      z: -1.0,
      collider: { type: 'circle', radius: 1.2 },
      isOccluder: true,
      name: 'Perimeter Trunk West',
    },
    // South Crossing Posts
    {
      id: 'forest-south-post-l',
      propType: 'gate_pillar',
      x: -3.0,
      z: 11.2,
      collider: { type: 'box', width: 1.1, depth: 1.1 },
      name: 'South Forest Post Left',
    },
    {
      id: 'forest-south-post-r',
      propType: 'gate_pillar',
      x: 3.0,
      z: 11.2,
      collider: { type: 'box', width: 1.1, depth: 1.1 },
      name: 'South Forest Post Right',
    },
  ],
};

/**
 * WORLD 3: FROZEN RUINS
 * Identity: BROKEN RUINS / CHANNELS / CONTROLLED CHOKEPOINTS
 * - Large collapsed diagonal temple wall with traversal openings
 * - Ice crystal formation cluster in North-West quadrant
 * - Ruined pillar court in South-East quadrant
 * - Impassable frozen abyss crevasse in South-West
 * - Great ruined temple gate / hall in North-East
 * - Central cracked frozen plaza as clear fighting area
 * - Outer perimeter loop around ruins
 */
export const FROZEN_LAYOUT: WorldLayoutData = {
  worldId: 3,
  slug: 'frozen',
  name: 'Frozen Ruins',
  props: [
    // Diagonal Ruined Temple Wall: Segment 1 (NW side)
    {
      id: 'frozen-diag-wall-1',
      propType: 'ruined_wall_diag',
      x: -5.5,
      z: -2.5,
      rotationY: 0.52,
      collider: { type: 'box', width: 4.2, depth: 1.2 },
      isOccluder: true,
      name: 'Collapsed Temple Wall NW',
    },
    // Traversal Opening (width ~3.5 units at x: -2, z: 0)
    // Diagonal Ruined Temple Wall: Segment 2 (Center-SE side)
    {
      id: 'frozen-diag-wall-2',
      propType: 'ruined_wall_diag',
      x: 2.2,
      z: 3.2,
      rotationY: 0.52,
      collider: { type: 'box', width: 4.5, depth: 1.2 },
      isOccluder: true,
      name: 'Collapsed Temple Wall SE',
    },
    // North-West Ice Crystal Spire Cluster
    {
      id: 'frozen-crystal-cluster',
      propType: 'ice_spire_cluster',
      x: -8.8,
      z: -7.5,
      collider: { type: 'circle', radius: 1.9 },
      isOccluder: true,
      name: 'Glacial Crystal Cluster NW',
    },
    // North-East Ruined Temple Hall & Monolith
    {
      id: 'frozen-temple-gate',
      propType: 'frozen_temple_gate',
      x: 7.2,
      z: -8.5,
      rotationY: -0.15,
      collider: { type: 'box', width: 5.6, depth: 2.2 },
      isOccluder: true,
      name: 'Ruined Temple Gate NE',
    },
    // South-East Ruined Pillar Court (Pillar bases create tactical movement)
    {
      id: 'frozen-pillar-1',
      propType: 'ruined_pillar',
      x: 7.0,
      z: 6.0,
      collider: { type: 'circle', radius: 0.75 },
      isOccluder: true,
      name: 'Ruined Pillar SE 1',
    },
    {
      id: 'frozen-pillar-2',
      propType: 'ruined_pillar',
      x: 10.2,
      z: 6.0,
      collider: { type: 'circle', radius: 0.75 },
      isOccluder: true,
      name: 'Ruined Pillar SE 2',
    },
    {
      id: 'frozen-pillar-3',
      propType: 'ruined_pillar',
      x: 8.6,
      z: 9.0,
      collider: { type: 'circle', radius: 0.75 },
      isOccluder: true,
      name: 'Ruined Pillar SE 3',
    },
    // South-West Impassable Frozen Crevasse / Abyss
    {
      id: 'frozen-abyss',
      propType: 'frozen_abyss',
      x: -8.5,
      z: 6.8,
      collider: { type: 'circle', radius: 2.2 },
      name: 'Frozen Abyss Pit',
    },
    // Flanking Outer Glacial Spire Crags
    {
      id: 'frozen-crag-w',
      propType: 'ice_spire_cluster',
      x: -14.2,
      z: 0.5,
      collider: { type: 'circle', radius: 1.2 },
      name: 'Glacier Spire West Outer',
    },
    {
      id: 'frozen-crag-e',
      propType: 'ice_spire_cluster',
      x: 14.5,
      z: -0.5,
      collider: { type: 'circle', radius: 1.2 },
      name: 'Glacier Spire East Outer',
    },
  ],
};

/**
 * WORLD 4: DEMON CASTLE
 * Identity: FORTRESS / DANGEROUS / FINAL WORLD
 * - Fortress courtyard / throne approach
 * - Gates of Dis / Throne Dais visual focal point at far North
 * - Central/north-shifted Infernal Dais
 * - Two large broken fortress curtain walls (West and East) creating side passages
 * - Magma chasms forcing routing
 * - Large open South combat zone for boss maneuvering (Demon King + boss echoes)
 */
export const CASTLE_LAYOUT: WorldLayoutData = {
  worldId: 4,
  slug: 'castle',
  name: 'Demon Castle',
  props: [
    // Far North: Gates of Dis / Infernal Throne
    {
      id: 'castle-gates-dis',
      propType: 'gates_of_dis',
      x: 0,
      z: -10.2,
      collider: { type: 'box', width: 7.2, depth: 2.2 },
      isOccluder: true,
      name: 'Gates of Dis',
    },
    // North-Central: Infernal Spire Dais (shifted to z: -4.5 so (0,0) is open!)
    {
      id: 'castle-infernal-spire',
      propType: 'infernal_spire',
      x: 0,
      z: -4.5,
      collider: { type: 'circle', radius: 1.4 },
      isOccluder: true,
      name: 'Infernal Core Dais',
    },
    // West Defensive Fortress Curtain Wall
    {
      id: 'castle-curtain-wall-west',
      propType: 'castle_wall_section',
      x: -6.8,
      z: 0.2,
      collider: { type: 'box', width: 1.6, depth: 4.8 },
      isOccluder: true,
      name: 'West Castle Bastion Wall',
    },
    // East Defensive Fortress Curtain Wall
    {
      id: 'castle-curtain-wall-east',
      propType: 'castle_wall_section',
      x: 6.8,
      z: 0.2,
      collider: { type: 'box', width: 1.6, depth: 4.8 },
      isOccluder: true,
      name: 'East Castle Bastion Wall',
    },
    // West Magma Chasm Pit
    {
      id: 'castle-magma-chasm-w',
      propType: 'magma_chasm_pit',
      x: -11.2,
      z: -5.5,
      collider: { type: 'circle', radius: 2.0 },
      name: 'West Magma Chasm Pit',
    },
    // East Magma Chasm Pit
    {
      id: 'castle-magma-chasm-e',
      propType: 'magma_chasm_pit',
      x: 11.2,
      z: 5.2,
      collider: { type: 'circle', radius: 2.0 },
      name: 'East Magma Chasm Pit',
    },
    // South Battlefield Flanking Bastion Pillars (wide central arena for boss)
    {
      id: 'castle-bastion-sw',
      propType: 'gate_pillar',
      x: -5.5,
      z: 11.2,
      collider: { type: 'box', width: 1.5, depth: 1.5 },
      name: 'South Bastion Pillar SW',
    },
    {
      id: 'castle-bastion-se',
      propType: 'gate_pillar',
      x: 5.5,
      z: 11.2,
      collider: { type: 'box', width: 1.5, depth: 1.5 },
      name: 'South Bastion Pillar SE',
    },
    // Outer Fortress Corner Spikes
    {
      id: 'castle-spike-nw',
      propType: 'gate_pillar',
      x: -14.2,
      z: -8.5,
      collider: { type: 'box', width: 1.4, depth: 1.4 },
      name: 'North-West Outer Spire',
    },
    {
      id: 'castle-spike-ne',
      propType: 'gate_pillar',
      x: 14.2,
      z: -8.5,
      collider: { type: 'box', width: 1.4, depth: 1.4 },
      name: 'North-East Outer Spire',
    },
  ],
};

export const WORLD_LAYOUTS: Record<number, WorldLayoutData> = {
  1: GRAVEYARD_LAYOUT,
  2: FOREST_LAYOUT,
  3: FROZEN_LAYOUT,
  4: CASTLE_LAYOUT,
};

export function getWorldLayout(worldId: number): WorldLayoutData {
  return WORLD_LAYOUTS[worldId] ?? GRAVEYARD_LAYOUT;
}
