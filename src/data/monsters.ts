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
    id: 'skeleton', name: 'Rattlin\' Bones', category: 'elite-capable', worldIds: [1, 3, 4], firstStage: '1-1', role: 'Calcium enthusiast',
    description: 'A skeleton who drinks 3 gallons of milk a day. Clatters loudly when nervous.',
    behavior: 'Waddles forward, winds up a goofy slash, freezes for a second, then whacks you.',
    weakness: ['physical'], resistance: [],
    combatTip: 'Step sideways when he winds up his goofy swing!',
  },
  zombie: {
    id: 'zombie', name: 'Sleepy Shambler', category: 'elite-capable', worldIds: [1, 3, 4], firstStage: '1-2', role: 'Needs coffee',
    description: 'A groggy zombie that walks like a dad at 6 AM searching for caffeine.',
    behavior: 'Shambles toward you slowly, pauses for a heavy yawn swipe, and keeps stumbling.',
    weakness: ['fire'], resistance: ['physical'],
    combatTip: 'Don\'t get cornered by a bunch of sleepy dudes! Burn them with spicy meatballs.',
  },
  'bone-mage': {
    id: 'bone-mage', name: 'Skull Magician', category: 'elite-capable', worldIds: [1, 3, 4], firstStage: '1-4', role: 'Spooky purple shooter',
    description: 'Wears a robe two sizes too big and hurls purple glittery spooky orbs.',
    behavior: 'Stands far away, charges a sparkly purple shot, and fires right at you.',
    weakness: ['fire'], resistance: ['arcane'],
    combatTip: 'Change directions right when he fires his purple glitter ball!',
  },
  bat: {
    id: 'bat', name: 'Flappy Boi', category: 'normal', worldIds: [1, 3, 4], firstStage: '1-2', role: 'Zoomy haircut thief',
    description: 'Flaps around at hyper-speed trying to mess up your fresh hairstyle.',
    behavior: 'Hovers, squeaks dramatically, then commits to a high-speed zoom pass.',
    weakness: ['lightning'], resistance: [],
    combatTip: 'Wait for the zoom lane and side-step at the last second!',
  },
  ghost: {
    id: 'ghost', name: 'Bedsheet Phantom', category: 'elite-capable', worldIds: [1, 3, 4], firstStage: '1-5', role: 'Flank spookster',
    description: 'Literally just an angry floating bedsheet shouting "BOO!" at strangers.',
    behavior: 'Floats around your flank, paints a short dash lane, and zooms right through you.',
    weakness: ['arcane'], resistance: ['physical'],
    combatTip: 'Stay in the open middle so he doesn\'t push you into the wall!',
  },
  archer: {
    id: 'archer', name: 'Silly Sniper', category: 'elite-capable', worldIds: [1, 3, 4], firstStage: '1-3', role: 'Cardboard archer',
    description: 'Claims he never misses. Misses quite often, but fires plenty of arrows.',
    behavior: 'Backs up, squints with nonexistent eyes, and shoots a fast arrow down a lane.',
    weakness: ['fire'], resistance: [],
    combatTip: 'Dodge diagonally right after the red targeting lane locks!',
  },
  slime: {
    id: 'slime', name: 'Jiggly Blob', category: 'elite-capable', worldIds: [2, 3, 4], firstStage: '2-1', role: 'Strawberry gelatin',
    description: '100% tasty strawberry jelly, 0% brain cells. Loves making loud squish noises.',
    behavior: 'Squashes flat like a pancake, marks a landing circle, then boings high into the air!',
    weakness: ['fire'], resistance: ['physical'],
    combatTip: 'Step out of the landing circle before the jelly splats down!',
  },
  'cursed-wolf': {
    id: 'cursed-wolf', name: 'Barky Boi', category: 'elite-capable', worldIds: [2, 3, 4], firstStage: '2-2', role: 'Hyper doggo',
    description: 'Too energetic for his own good. Thinks you\'re holding a giant tennis ball.',
    behavior: 'Circles rapidly, crouches in zoomies mode, and pounces directly at you.',
    weakness: ['fire'], resistance: [],
    combatTip: 'Bait his zoomie pounce, side-step, and bonk him on the landing!',
  },
  thornling: {
    id: 'thornling', name: 'Prickly Cactus', category: 'normal', worldIds: [2, 3, 4], firstStage: '2-3', role: 'Shin poker',
    description: 'An angry green cactus plant that shoots tiny prickly needles at your shins.',
    behavior: 'Strafes around and shoots a fast thorn along a green laser line.',
    weakness: ['fire'], resistance: ['lightning'],
    combatTip: 'Zig-zag frequently so he can\'t lead your running path!',
  },
  'forest-mage': {
    id: 'forest-mage', name: 'Salad Sorceress', category: 'elite-capable', worldIds: [2, 3, 4], firstStage: '2-5', role: 'Cabbage caster',
    description: 'Angry that nobody finished their vegetables. Casts giant flying cabbages.',
    behavior: 'Floats at distance and launches slow-moving heavy bramble orbs.',
    weakness: ['fire'], resistance: ['physical'],
    combatTip: 'Rush through the open side rather than getting trapped in the cabbage zone!',
  },
  'forest-guardian': {
    id: 'forest-guardian', name: 'Bark Shield Dude', category: 'elite-capable', worldIds: [2, 3, 4], firstStage: '2-6', role: 'Tree bodyguard',
    description: 'Wears a huge chunk of tree bark. Blocks all frontal attacks like a bouncer.',
    behavior: 'Marches forward with shield up, then commits to a heavy branch shoulder check.',
    weakness: ['lightning'], resistance: ['physical'],
    combatTip: 'Circle behind his wooden shield to bonk him from the rear!',
  },
  treant: {
    id: 'treant', name: 'Angry Big Tree', category: 'elite-capable', worldIds: [2, 3, 4], firstStage: '2-7', role: 'Grumpy lumber',
    description: 'Extremely upset because a woodpecker woke him up from a 200-year nap.',
    behavior: 'Waddles slowly, lifts his massive root-arms, and does a colossal ground belly-flop.',
    weakness: ['fire'], resistance: ['physical'],
    combatTip: 'Leave the red slam zone and unleash full combos during his long recovery nap!',
  },
  knight: {
    id: 'knight', name: 'Clanky Knight', category: 'elite-capable', worldIds: [3, 4], firstStage: '3-1', role: 'Metal soup can',
    description: 'Armored from head to toe. Sounds like a toolbox falling down stairs.',
    behavior: 'Charges behind a big shield, then executes a wide sweeping sword bonk.',
    weakness: ['lightning'], resistance: ['physical'],
    combatTip: 'Zap him with lightning or dash behind his clanky armor!',
  },
  'frost-wraith': {
    id: 'frost-wraith', name: 'Icy Ghostie', category: 'elite-capable', worldIds: [3, 4], firstStage: '3-2', role: 'Ice cube flyer',
    description: 'A shivering phantom that forgets to wear a winter coat. Gives frosty chills.',
    behavior: 'Flies to an angle, paints an icy dash lane, and surges across to freeze you.',
    weakness: ['fire'], resistance: ['arcane'],
    combatTip: 'Save room to dodge laterally across his icy flight path!',
  },
  'ice-mage': {
    id: 'ice-mage', name: 'Snowball Wizard', category: 'elite-capable', worldIds: [3, 4], firstStage: '3-4', role: 'Snowball hurler',
    description: 'Reigning champion of the Winter Snowball Fight of 1492. Fast ice thrower.',
    behavior: 'Stands back and fires chilled ice darts that slow your movement speed.',
    weakness: ['fire'], resistance: ['arcane'],
    combatTip: 'Take out the snowball thrower before the melee goons close in!',
  },
  demon: {
    id: 'demon', name: 'Spicy Gremlin', category: 'elite-capable', worldIds: [4], firstStage: '4-1', role: 'Hyper scratcher',
    description: 'A little red gremlin fueled purely by hot salsa and pure hyperactivity.',
    behavior: 'Rushes right in your face and unleashes a furious flurry of goofy scratches.',
    weakness: ['arcane'], resistance: ['fire'],
    combatTip: 'Use your Laser or Scythe while he recovers from his scratch tantrum!',
  },
  'demon-warrior': {
    id: 'demon-warrior', name: 'Beefy Hellguard', category: 'elite-capable', worldIds: [4], firstStage: '4-4', role: 'Infernal bouncer',
    description: 'Super muscular demon who never skips leg day. Swings a giant spicy meat cleaver.',
    behavior: 'Marches in, charges forward, and delivers a gigantic room-clearing cleaver swing.',
    weakness: ['arcane'], resistance: ['fire', 'physical'],
    combatTip: 'Dodge across his cleaver telegraph and unleash your highest burst damage!',
  },
  imp: {
    id: 'imp', name: 'Boom Potato', category: 'elite-capable', worldIds: [4], firstStage: '4-2', role: 'Walking dynamite',
    description: 'Sprints close, gets super red in the face, and goes KABOOM like a popcorn kernel!',
    behavior: 'Rushes straight into you, shows an expanding fuse ring, and detonates dramatically.',
    weakness: ['physical'], resistance: ['fire'],
    combatTip: 'Pop him from range or dash away before the popcorn fuse pops!',
  },
};

export function getMonsterDefinition(id: EnemyKind | string): MonsterDefinition {
  return MONSTER_DEFINITIONS[id as EnemyKind] ?? MONSTER_DEFINITIONS.skeleton;
}

export const ALL_MONSTER_KINDS = Object.keys(MONSTER_DEFINITIONS) as EnemyKind[];
