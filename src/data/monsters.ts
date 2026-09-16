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
    id: 'skeleton', name: 'Skeleton', category: 'elite-capable', worldIds: [1, 3, 4], firstStage: '1-1', role: 'Undead duelist',
    description: 'A bone soldier that commits to deliberate sword cuts.',
    behavior: 'Closes into melee, winds up a forward slash, locks direction, attacks, then exposes itself during recovery.',
    weakness: ['physical'], resistance: [],
    combatTip: 'Step across the blade telegraph rather than running away from it.',
  },
  zombie: {
    id: 'zombie', name: 'Grave Zombie', category: 'elite-capable', worldIds: [1, 3, 4], firstStage: '1-2', role: 'Relentless bruiser',
    description: 'A slow corpse that soaks damage and forces space with a heavy two-handed swipe.',
    behavior: 'Walks directly into the hero, pauses for a broad close-range swipe, then shambles forward again. Difficult to kite through narrow lanes.',
    weakness: ['fire'], resistance: ['physical'],
    combatTip: 'Do not let several zombies body-block your escape. Burn them early or cut through the thinner side of the formation.',
  },
  'bone-mage': {
    id: 'bone-mage', name: 'Bone Mage', category: 'elite-capable', worldIds: [1, 3, 4], firstStage: '1-4', role: 'Arcane artillery',
    description: 'A grave-caster that pressures safe lanes from behind the frontline.',
    behavior: 'Keeps long range, sidesteps while charging, then fires a fast violet spell toward the hero. Frontliners try to hold you in its firing lane.',
    weakness: ['fire'], resistance: ['arcane'],
    combatTip: 'Break line pressure by changing direction after the cast locks. Prioritize the mage when melee enemies are recovering.',
  },
  bat: {
    id: 'bat', name: 'Bat', category: 'normal', worldIds: [1, 3, 4], firstStage: '1-2', role: 'Flying skirmisher',
    description: 'A swift predator that turns open space into a dive lane.',
    behavior: 'Hovers outside melee range, screeches, locks a lane, then commits to a high-speed pass.',
    weakness: ['lightning'], resistance: [],
    combatTip: 'Wait for the dive lane and cut across it. Running around the perimeter is less effective than a late perpendicular dodge.',
  },
  ghost: {
    id: 'ghost', name: 'Ghost', category: 'elite-capable', worldIds: [1, 3, 4], firstStage: '1-5', role: 'Spectral flanker',
    description: 'A spirit that attacks from an angle rather than joining the crowd.',
    behavior: 'Drifts to a flank, paints a short dash lane, and surges through the hero before resetting.',
    weakness: ['arcane'], resistance: ['physical'],
    combatTip: 'Keep some room in the center so a flank dash does not pin you against the arena edge.',
  },
  archer: {
    id: 'archer', name: 'Skeleton Archer', category: 'elite-capable', worldIds: [1, 3, 4], firstStage: '1-3', role: 'Ranged lane control',
    description: 'A disciplined marksman that punishes predictable circles.',
    behavior: 'Maintains range, tracks briefly, then releases a fast arrow along a visible lane.',
    weakness: ['fire'], resistance: [],
    combatTip: 'Change direction after the aim locks. Continuous edge-circling makes your path easy to lead.',
  },
  slime: {
    id: 'slime', name: 'Slime', category: 'elite-capable', worldIds: [2, 3, 4], firstStage: '2-1', role: 'Area bruiser',
    description: 'A dense living puddle that denies a circular patch of ground.',
    behavior: 'Compresses, marks a landing circle, then leaps into it with a slowing slam.',
    weakness: ['fire'], resistance: ['physical'],
    combatTip: 'Cut inward or sideways before the landing circle closes instead of hugging the map edge.',
  },
  'cursed-wolf': {
    id: 'cursed-wolf', name: 'Cursed Wolf', category: 'elite-capable', worldIds: [2, 3, 4], firstStage: '2-2', role: 'Pounce hunter',
    description: 'A corrupted predator built to punish straight-line escapes.',
    behavior: 'Circles briefly, crouches, then commits to a fast locked pounce.',
    weakness: ['fire'], resistance: [],
    combatTip: 'Bait the pounce, sidestep late, and punish the recovery.',
  },
  thornling: {
    id: 'thornling', name: 'Thornling', category: 'normal', worldIds: [2, 3, 4], firstStage: '2-3', role: 'Mid-range skirmisher',
    description: 'A mobile plant creature that peppers movement lanes with thorns.',
    behavior: 'Strafes at medium distance and fires a quick thorn after a green line telegraph.',
    weakness: ['fire'], resistance: ['lightning'],
    combatTip: 'Use short direction changes. Long predictable arcs make its shot easier to lead.',
  },
  'forest-mage': {
    id: 'forest-mage', name: 'Briar Witch', category: 'elite-capable', worldIds: [2, 3, 4], firstStage: '2-5', role: 'Control caster',
    description: 'A corrupted druid that pins routes with slow-moving bramble magic.',
    behavior: 'Maintains distance, rotates around the fight, then casts a slow heavy bramble orb designed to cut off the safest escape lane.',
    weakness: ['fire'], resistance: ['physical'],
    combatTip: 'Do not automatically retreat. Moving through the open side before the cast arrives is safer than circling behind it.',
  },
  'forest-guardian': {
    id: 'forest-guardian', name: 'Forest Guardian', category: 'elite-capable', worldIds: [2, 3, 4], firstStage: '2-6', role: 'Shielding vanguard',
    description: 'A bark-armored warrior that protects ranged forest creatures.',
    behavior: 'Advances steadily, blocks frontal pressure, then commits to a short shoulder charge and wide branch sweep.',
    weakness: ['lightning'], resistance: ['physical'],
    combatTip: 'Rotate around its shield, but watch the caster behind it. Killing support first may be safer than tunneling the tank.',
  },
  treant: {
    id: 'treant', name: 'Treant', category: 'elite-capable', worldIds: [2, 3, 4], firstStage: '2-7', role: 'Siege bruiser',
    description: 'An ancient arbor giant that turns nearby ground into a danger zone.',
    behavior: 'Slowly closes, lifts its root-arms, then performs a huge circular ground slam with a long recovery.',
    weakness: ['fire'], resistance: ['physical'],
    combatTip: 'Treat it as moving terrain. Leave the slam zone, then spend your cooldowns during its recovery.',
  },
  knight: {
    id: 'knight', name: 'Cursed Knight', category: 'elite-capable', worldIds: [3, 4], firstStage: '3-1', role: 'Armored vanguard',
    description: 'A shielded champion that makes frontal auto-fire inefficient.',
    behavior: 'Advances behind a shield that cuts frontal damage, then winds up a heavy sword sweep.',
    weakness: ['lightning'], resistance: ['physical'],
    combatTip: 'Cross its shoulder and attack from the side or rear. Do not spend an entire fight shooting the shield.',
  },
  'frost-wraith': {
    id: 'frost-wraith', name: 'Frost Wraith', category: 'elite-capable', worldIds: [3, 4], firstStage: '3-2', role: 'Chilling striker',
    description: 'A blizzard phantom that threatens a narrow lane with a slowing dash.',
    behavior: 'Drifts to an angle, paints an icy dash lane, then rapidly crosses it and chills on hit.',
    weakness: ['fire'], resistance: ['arcane'],
    combatTip: 'Save lateral room for the dash. Being pinned against the boundary makes the chill much more dangerous.',
  },
  'ice-mage': {
    id: 'ice-mage', name: 'Ice Magus', category: 'elite-capable', worldIds: [3, 4], firstStage: '3-4', role: 'Frost artillery',
    description: 'A ruined sorcerer that fires chilling projectiles from behind armored allies.',
    behavior: 'Kites at long range and casts fast ice bolts. Hits apply chill, making the next knight or wraith attack harder to dodge.',
    weakness: ['fire'], resistance: ['arcane'],
    combatTip: 'Pressure it before the frontline closes. A single chill can turn an otherwise safe route into a trap.',
  },
  demon: {
    id: 'demon', name: 'Demon', category: 'elite-capable', worldIds: [4], firstStage: '4-1', role: 'Aggressive hunter',
    description: 'A fast infernal hunter that keeps close pressure on the hero.',
    behavior: 'Tracks aggressively and commits to a short, heavy claw sequence.',
    weakness: ['arcane'], resistance: ['fire'],
    combatTip: 'Use its recovery to reposition through the center rather than endlessly circling the outside.',
  },
  'demon-warrior': {
    id: 'demon-warrior', name: 'Hellguard', category: 'elite-capable', worldIds: [4], firstStage: '4-4', role: 'Infernal heavy',
    description: 'A massive demon warrior carrying a brutal cleaver and plated infernal armor.',
    behavior: 'Marches into control range, then chains a short charge into a broad cleaver sweep. Very durable but commits hard to each attack.',
    weakness: ['arcane'], resistance: ['fire', 'physical'],
    combatTip: 'Bait the charge away from ranged enemies, dodge across the sweep, then punish its long recovery.',
  },
  imp: {
    id: 'imp', name: 'Exploding Imp', category: 'elite-capable', worldIds: [4], firstStage: '4-2', role: 'Detonation hazard',
    description: 'An unstable fiend that turns complacent positioning into a blast zone.',
    behavior: 'Rushes close, stops, shows an expanding fuse circle, then detonates.',
    weakness: ['physical'], resistance: ['fire'],
    combatTip: 'Burst it during the fuse or immediately cut out of the marked circle. Do not drag several into the same route.',
  },
};

export function getMonsterDefinition(id: EnemyKind | string): MonsterDefinition {
  return MONSTER_DEFINITIONS[id as EnemyKind] ?? MONSTER_DEFINITIONS.skeleton;
}

export const ALL_MONSTER_KINDS = Object.keys(MONSTER_DEFINITIONS) as EnemyKind[];
