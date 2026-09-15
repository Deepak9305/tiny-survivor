import type { DamageType, EnemyKind } from '../types';

export interface MonsterDefinition {
  id: EnemyKind;
  name: string;
  category: 'normal' | 'elite-capable';
  worldIds: number[];
  firstStage: string;
  role: string;
  description: string;
  behavior: string;
  weakness: DamageType[];
  resistance: DamageType[];
  combatTip: string;
}

export const MONSTER_DEFINITIONS: Record<EnemyKind, MonsterDefinition> = {
  skeleton: {
    id: 'skeleton', name: 'Skeleton', category: 'elite-capable', worldIds: [1, 3, 4], firstStage: '1-1', role: 'Undead melee',
    description: 'A relentless bone soldier armed with an ancient blade.',
    behavior: 'Winds up a readable forward sword slash, locks direction, and executes. Recovers before pursuing again.',
    weakness: ['physical'], resistance: [],
    combatTip: 'Sidestep during its 0.4s windup. Normal body touch deals no damage—only the blade swing hurts.',
  },
  bat: {
    id: 'bat', name: 'Bat', category: 'normal', worldIds: [1, 3, 4], firstStage: '1-1', role: 'Flying skirmisher',
    description: 'A swift predator that dives from above.',
    behavior: 'Hovers in range, screeches, locks player position, and executes a high-speed dive pass.',
    weakness: ['lightning'], resistance: [],
    combatTip: 'Wait for the audible screech and red dive lane, then dodge perpendicular to its path.',
  },
  ghost: {
    id: 'ghost', name: 'Ghost', category: 'elite-capable', worldIds: [1, 3, 4], firstStage: '1-1', role: 'Spectral pursuer',
    description: 'A drifting spirit that shifts between planes.',
    behavior: 'Phases out into spectral transparency, repositions to flank, telegraphs a dash lane, and surges forward.',
    weakness: ['arcane'], resistance: ['physical'],
    combatTip: 'Aim Arcane Bolts along its approach. Watch for the directional telegraph when it emerges from phasing.',
  },
  archer: {
    id: 'archer', name: 'Skeleton Archer', category: 'elite-capable', worldIds: [1, 3, 4], firstStage: '1-3', role: 'Ranged threat',
    description: 'A disciplined marksman that controls firing lanes.',
    behavior: 'Strafes at range, locks a visible aiming beam for 0.5s, then releases a piercing arrow.',
    weakness: ['fire'], resistance: [],
    combatTip: 'Never run directly along its aim line. Step sideways as the beam intensifies to dodge the arrow.',
  },
  slime: {
    id: 'slime', name: 'Slime', category: 'elite-capable', worldIds: [2, 3, 4], firstStage: '2-1', role: 'Heavy bruiser',
    description: 'A dense, living puddle that leaps and crushes.',
    behavior: 'Squashes down in a heavy windup, leaps high, and slams into a circular landing zone.',
    weakness: ['fire'], resistance: ['physical'],
    combatTip: 'Escape the red landing zone before impact. Aim Fireballs to exploit its elemental weakness.',
  },
  'cursed-wolf': {
    id: 'cursed-wolf', name: 'Cursed Wolf', category: 'elite-capable', worldIds: [2, 3, 4], firstStage: '2-1', role: 'Fast melee hunter',
    description: 'A corrupted forest predator that stalks prey before lunging at blinding speed.',
    behavior: 'Circles into range, lets out a brief crouch-growl telegraph, then pounces in a locked direction before recovering.',
    weakness: ['fire'], resistance: [],
    combatTip: 'Dodge sideways the moment the wolf crouches and growls. Its pounce cannot track once unleashed.',
  },
  thornling: {
    id: 'thornling', name: 'Thornling', category: 'normal', worldIds: [2, 3, 4], firstStage: '2-2', role: 'Forest ranged',
    description: 'A thorny wood sprite that peppers interlopers with poisonous bramble volleys.',
    behavior: 'Maintains medium distance, briefly projects a green aim trajectory, and launches a sharp thorn projectile.',
    weakness: ['fire'], resistance: ['lightning'],
    combatTip: 'Keep moving in cross-angles to throw off its thorn trajectory before it fires.',
  },
  treant: {
    id: 'treant', name: 'Treant', category: 'elite-capable', worldIds: [2, 3, 4], firstStage: '2-3', role: 'Slow high-HP bruiser',
    description: 'A massive ancient arbor humanoid with hardened bark that withstands heavy punishment.',
    behavior: 'Slowly stalks toward the hero, raises root-arms high, and unleashes a wide crushing ground slam with a long recovery window.',
    weakness: ['fire'], resistance: ['physical'],
    combatTip: 'Escape the large ground slam radius during its generous windup, then punish its lengthy recovery with high-damage specials.',
  },
  knight: {
    id: 'knight', name: 'Cursed Knight', category: 'elite-capable', worldIds: [3, 4], firstStage: '3-1', role: 'Armored vanguard',
    description: 'A shielded champion bearing an impervious iron bulwark.',
    behavior: 'Advances with a heavy shield blocking 45% of incoming frontal damage. Winds up a wide sweep.',
    weakness: ['lightning'], resistance: ['physical'],
    combatTip: 'Flank around its sides or back for 100% full damage. Frontal attacks trigger metallic shield reduction.',
  },
  'frost-wraith': {
    id: 'frost-wraith', name: 'Frost Wraith', category: 'elite-capable', worldIds: [3, 4], firstStage: '3-2', role: 'High-threat spectral striker',
    description: 'A biting blizzard phantom that drifts silently and strikes with numbing cold.',
    behavior: 'Drifts through obstacles, paints an icy telegraph lane, and executes a rapid frost dash that briefly chills on hit.',
    weakness: ['fire'], resistance: ['arcane'],
    combatTip: 'Never stay stationary when an icy dash lane forms. Fireball explodes with bonus damage against its frost nature.',
  },
  demon: {
    id: 'demon', name: 'Demon', category: 'elite-capable', worldIds: [4], firstStage: '4-1', role: 'Aggressive hunter',
    description: 'A vicious hunter from the infernal depths.',
    behavior: 'Aggressive pursuit followed by a rapid, heavy two-part claw attack sequence.',
    weakness: ['arcane'], resistance: ['fire'],
    combatTip: 'Keep moving in wide arcs. Use Arcane Beam to stagger it before it closes into melee range.',
  },
  imp: {
    id: 'imp', name: 'Exploding Imp', category: 'elite-capable', worldIds: [4], firstStage: '4-2', role: 'Detonation hazard',
    description: 'An unstable fiend primed to explode.',
    behavior: 'Rushes into trigger range, stops, and ticks rapidly with an expanding danger circle before detonating.',
    weakness: ['physical'], resistance: ['fire'],
    combatTip: 'Prioritize aim to eliminate it during its 0.8s fuse window, or sprint out of the blast radius.',
  },
};

export function getMonsterDefinition(id: EnemyKind | string): MonsterDefinition {
  return MONSTER_DEFINITIONS[id as EnemyKind] ?? MONSTER_DEFINITIONS.skeleton;
}

export const ALL_MONSTER_KINDS = Object.keys(MONSTER_DEFINITIONS) as EnemyKind[];
