// Pure, Three-free boss data and rules: the bosses (looks, stats,
// special move, goofy cutscene dialogue), which one comes next, how
// tough they get on later visits, and the tiny timer their specials use.
// Kept free of Three.js (and of config.js, which imports THIS file to fold
// the boss stats into MONSTER_TYPES) so Vitest can exercise it without WebGL.

// Each boss has its own body shape ('sphere', 'tetrahedron', 'box',
// 'cylinder', 'cone', 'octahedron', 'dodecahedron') and one or two
// `specials` from BOSS_SPECIALS below.
//
// `stats` mirrors a MONSTER_TYPES entry; attackRange/reachBonus are derived
// from `radius` below so a big body can still reach, and be reached by,
// the player (ranges are measured center to center).
// Tuning for every boss special. `interval` is the cooldown between uses
// (each boss starts its timers part-way down so they don't all fire the
// moment the fight starts), `windup` the telegraphed pause before it
// lands. Damage is a multiple of the boss's own stat.
//   charge  - dash at the player at a multiple of its speed
//   summon  - call in `count` minions (never past `maxMinions` alive); the first
//             call comes `firstDelay` seconds into the fight, then one per `interval`
//   slam    - ground-pound: damages everything within `radius`
//   blink   - teleport to `distance` from the player
//   barrage - fire a fan of `count` orbs at the player
//   spin    - whirl for `duration`, hitting everything within the boss's
//             radius + `radiusBonus` every `tickInterval`
export const BOSS_SPECIALS = {
  charge: { interval: 6, windup: 0, duration: 1.2, speedMultiplier: 2.6 },
  summon: { interval: 22, firstDelay: 6, windup: 0.6, count: 2, maxMinions: 4 },
  slam: { interval: 7, windup: 0.9, radius: 6.5, damageMultiplier: 1.3 },
  blink: { interval: 6.5, windup: 0.5, distance: 3.5 },
  barrage: { interval: 5, windup: 0.7, count: 5, spread: 0.9, speed: 9, damageMultiplier: 0.6 },
  spin: { interval: 9, windup: 0.8, duration: 2.2, tickInterval: 0.45, radiusBonus: 2.4, damageMultiplier: 0.7 },
  //   leap - crouch, then jump onto the player's spot and land with a stomp (`range` is how far
  //          out it will jump from, `height` the arc's peak)
  //   lob - toss a poison glob at where the player is heading (the Bloater's move); it lands as a
  //         damaging puddle. Its flight/puddle numbers are RANGED_ATTACKS.boss_bloater's.
  lob: { interval: 5.5, windup: 0.6, damageMultiplier: 0.5 },
  leap: { interval: 5, windup: 0.45, duration: 0.75, radius: 2.6, damageMultiplier: 1.1, range: 11, height: 3.2 },
}

const BOSS_DEFS = [
  {
    id: 'boss_gloop',
    name: 'KING GLOOP',
    title: 'Monarch of the Mildly Damp',
    specials: ['slam', 'barrage', 'summon'],
    score: 1000,
    stats: { shape: 'sphere', size: 4.2, color: 0x2e8b57, edgeColor: 0xabd1bc, speed: 1.6, hp: 1140, damage: 18, radius: 1.9 },
    lines: [
      'BEHOLD! I am KING GLOOP, ruler of all things squishy!',
      'I have eaten forty-seven sandwiches today. You look like sandwich number forty-eight.',
      'Kneel before my jiggle!',
    ],
  },
  {
    id: 'boss_zipzilla',
    name: 'ZIPZILLA',
    title: 'Speed Limit: Yes',
    specials: ['charge', 'blink', 'barrage', 'summon'],
    score: 1100,
    stats: { shape: 'tetrahedron', size: 3.4, color: 0x7b2fd1, edgeColor: 0xcaaced, speed: 2.6, hp: 960, damage: 16, radius: 1.3 },
    lines: [
      'ZOOM ZOOM ZOOM! Did you see me? No? I was already behind you!',
      'I drank nine energy drinks and a smoothie. The smoothie was a mistake.',
      "Hold still so I can... ZOOM!",
    ],
  },
  {
    id: 'boss_grumpsalot',
    name: 'SIR GRUMPSALOT',
    title: 'Knight of the Bad Mood',
    specials: ['spin', 'barrage', 'summon'],
    score: 1200,
    stats: { shape: 'box', size: 3.6, color: 0xd2491e, edgeColor: 0xedb6a5, speed: 1.9, hp: 1380, damage: 22, radius: 1.5 },
    lines: [
      'Hmph. Who dares step on my platform? I did not RSVP you.',
      'I have been grumpy for nine hundred years and I am just getting STARTED.',
      'Prepare to be mildly inconvenienced... BY MY SWORD!',
    ],
  },
  {
    id: 'boss_wobble',
    name: 'DOCTOR WOBBLE',
    title: 'Surgeon of Silly Business',
    specials: ['summon', 'barrage', 'blink'],
    score: 1300,
    stats: { shape: 'cylinder', size: 3.6, color: 0xc2217d, edgeColor: 0xe7a6cb, speed: 1.7, hp: 1020, damage: 14, radius: 1.6 },
    lines: [
      'Good evening! I am Doctor Wobble, and I have diagnosed you with LOSING.',
      'The only cure is a heavy dose of my friends!',
      'Nurse! Bring in the minions!',
    ],
  },
  {
    id: 'boss_conefather',
    name: 'THE CONE FATHER',
    title: 'He Made You an Offer',
    specials: ['barrage', 'slam', 'summon', 'spin'],
    score: 1400,
    stats: { shape: 'cone', size: 4.4, color: 0x1f4fa8, edgeColor: 0xa5b9dc, speed: 1.5, hp: 1680, damage: 24, radius: 2.0 },
    lines: [
      "Ah, you've come to see me on the day of my... cone party.",
      "I'm gonna make you an offer you can't refract.",
      "Don't go against the family. We are very pointed about loyalty.",
    ],
  },
  {
    id: 'boss_mayhem',
    name: 'MADAM MAYHEM',
    title: 'Queen of Questionable Decisions',
    specials: ['blink', 'spin', 'barrage', 'summon'],
    score: 1500,
    stats: { shape: 'octahedron', size: 3.8, color: 0xd6243f, edgeColor: 0xefa7b2, speed: 2.4, hp: 1260, damage: 20, radius: 1.45 },
    lines: [
      'Ooooh, a visitor! I LOVE visitors. They make such a satisfying noise.',
      'I did not read the instructions. I do not intend to.',
      'Time for a very bad idea!',
    ],
  },
  {
    id: 'boss_omega',
    name: 'OMEGA JELLO',
    title: 'The Final Dessert',
    specials: ['summon', 'slam', 'barrage', 'charge'],
    score: 1800,
    stats: { shape: 'dodecahedron', size: 5, color: 0x14b8ae, edgeColor: 0xa1e3df, speed: 1.4, hp: 1920, damage: 20, radius: 2.3 },
    lines: [
      'I am OMEGA JELLO. I am the wobble at the end of the universe.',
      "They said I'd never set. THEY WERE WRONG.",
      'Dessert is served... and YOU are the topping!',
    ],
  },
  // ---- Boss versions of every regular enemy ----
  {
    id: 'boss_blobbo',
    name: 'MEGA BLOBBO',
    title: 'Blobbo, But More',
    specials: ['slam', 'summon', 'charge'],
    score: 1050,
    stats: { shape: 'dodecahedron', size: 4.0, color: 0x3fbf74, edgeColor: 0xbfeed2, speed: 1.7, hp: 1000, damage: 17, radius: 1.8 },
    lines: ['Blobbo! BLOBBO! Blobbo blobbo BLOBBO!', '(Translation: I have been working out.)', 'Blobbo.'],
  },
  {
    id: 'boss_zippy',
    name: 'ZIPPY ZOOMER',
    title: 'Faster Than This Intro',
    specials: ['charge', 'blink', 'barrage'],
    score: 1150,
    stats: { shape: 'octahedron', size: 3.0, color: 0xff3d77, edgeColor: 0xffbed0, speed: 3.0, hp: 760, damage: 14, radius: 1.2 },
    lines: ['Hi! Bye! Hi! Where did you go? Hi!', 'I grew. Nobody warned me about the zoomies.', 'Try to keep up. You will not.'],
  },
  {
    id: 'boss_grumpus',
    name: 'GRUMPUS MAXIMUS',
    title: 'Emperor of Eye-Rolls',
    specials: ['spin', 'slam', 'charge'],
    score: 1250,
    stats: { shape: 'box', size: 3.4, color: 0x3f6fe0, edgeColor: 0xbed1ff, speed: 2.1, hp: 1320, damage: 22, radius: 1.5 },
    lines: ['Ugh. You again. Or someone like you.', 'I have been a Grumpus all my life and now I am a BIG one.', 'This is going to be so inconvenient for you.'],
  },
  {
    id: 'boss_bloater',
    name: 'DUKE BLOATSWORTH',
    title: 'Lord of the Lobbed Goo',
    specials: ['slam', 'barrage', 'spin'],
    score: 1350,
    stats: { shape: 'sphere', size: 4.0, color: 0x86c21f, edgeColor: 0xdff59a, speed: 1.3, hp: 1200, damage: 12, radius: 1.8, attackRange: 14 },
    lines: ['Good day! I am the Duke of Bloatsworth, and I brought a casserole.', 'It is poison. Please do not stand in the casserole.', 'Splendid, you are standing in the casserole.'],
  },
  {
    id: 'boss_spinner',
    name: 'SPINNER SUPREME',
    title: 'Dizzy With Power',
    specials: ['spin', 'barrage', 'blink'],
    score: 1300,
    stats: { shape: 'tetrahedron', size: 3.2, color: 0xff8c00, edgeColor: 0xffd699, speed: 2.3, hp: 920, damage: 12, radius: 1.3, attackRange: 11 },
    lines: ['Wheeeeee! Oh. Oh no. Wheeeeeee!', 'I cannot stop. I do not want to stop.', 'Stand still so I can spin AT you!'],
  },
  {
    id: 'boss_splitter',
    name: 'SPLITZILLA',
    title: 'Two Problems, Then Four',
    specials: ['charge', 'summon', 'spin'],
    score: 1450,
    stats: { shape: 'cone', size: 4.0, color: 0x9a4dff, edgeColor: 0xdcc2ff, speed: 2.0, hp: 1100, damage: 20, radius: 1.7 },
    lines: ['Hit me once and I become two of me.', 'Hit me twice and, well, you know the rest.', 'I really need to see someone about this.'],
  },
  {
    id: 'boss_mirror',
    name: 'SIR REFLECTALOT',
    title: 'Fairest of Them All',
    specials: ['barrage', 'blink', 'slam'],
    score: 1400,
    stats: { shape: 'cylinder', size: 3.8, color: 0xaebfd8, edgeColor: 0xe6f0ff, speed: 1.3, hp: 1100, damage: 17, radius: 1.6, reflect: { halfArc: 1.1, hits: 6, regrow: 30 }, accessory: 'mirror' },
    lines: ['Mirror, mirror, in my hand... who will fall by my command?', 'Go on, hit me. Everything you throw, I throw back.', 'Hit me from behind? That is RUDE.'],
  },
  {
    id: 'boss_hopper',
    name: 'KING HOPALOT',
    title: 'Look Out Below',
    specials: ['leap', 'slam', 'summon'],
    score: 1500,
    stats: { shape: 'sphere', size: 4.0, color: 0x1fd1c3, edgeColor: 0xb6fff6, speed: 1.7, hp: 1240, damage: 18, radius: 1.8, accessory: 'limbs', specialIntervals: { leap: 4.5 } },
    lines: ['Ribbit. Wait, no. That is a different monarch.', 'I have legs. I have ARMS. I have a crown and a plan.', 'The plan is: land on you.'],
  },
  {
    id: 'boss_glimmer',
    name: 'THE BLINKMASTER',
    title: 'Now You See Him',
    specials: ['blink', 'spin', 'slam', 'summon'],
    score: 1550,
    stats: { shape: 'octahedron', size: 3.4, color: 0xffc400, edgeColor: 0xfff1a8, speed: 2.4, hp: 980, damage: 16, radius: 1.4 },
    lines: ['Boo! Behind you. No, the other behind you.', 'I do not walk. I simply arrive.', 'Blink and you will miss it. Do not blink.'],
  },
]

// How far past the body's own radius a boss swings (and can be swung at).
const BOSS_ATTACK_REACH = 1.2

export const BOSSES = BOSS_DEFS.map((def) => ({
  ...def,
  stats: {
    ...def.stats,
    boss: true,
    specials: def.specials,
    // Shooter bosses (Duke Bloatsworth, Spinner Supreme) name a longer range of their own.
    attackRange: def.stats.attackRange ?? def.stats.radius + BOSS_ATTACK_REACH,
    reachBonus: def.stats.radius, // added to the player's ATTACK_RANGE so a swing reaches the boss's far side
    knockbackScale: 0.2, // a boss barely budges from a sword hit (but can still be shoved off the edge)
    attackCooldown: 1.6,
  },
}))

export const BOSS_COUNT = BOSSES.length

// Boss stats keyed by id, for folding into MONSTER_TYPES.
export const BOSS_MONSTER_TYPES = Object.fromEntries(BOSSES.map((boss) => [boss.id, boss.stats]))

export function bossById(id) {
  return BOSSES.find((boss) => boss.id === id) ?? null
}

// How many bosses are the originals (King Gloop ... Omega Jello): they are the
// first seven in BOSS_DEFS, and only they can open a run.
export const ORIGINAL_BOSS_COUNT = 7

// A shuffled order of the bosses for one run (Fisher-Yates), so each run
// meets every boss in a different order. The first boss is always one of the
// original seven. rng is injectable for tests.
export function shuffleBossOrder(rng = Math.random) {
  const order = BOSSES.map((_, index) => index)
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  // If a newer boss landed first, swap it with the first original in the list.
  if (order[0] >= ORIGINAL_BOSS_COUNT) {
    const k = order.findIndex((n) => n < ORIGINAL_BOSS_COUNT)
    ;[order[0], order[k]] = [order[k], order[0]]
  }
  return order
}

// The boss for the `bossesDefeated`-th boss fight: all seven in
// `order` before any repeats, then around again.
export function bossForFight(order, bossesDefeated) {
  return BOSSES[order[bossesDefeated % order.length]]
}

// Regular waves to clear before the next boss: one before the first boss,
// two before the second, and so on.
export function wavesBeforeBoss(bossesDefeated) {
  return bossesDefeated + 1
}

// Bosses get tougher with every boss fight in a run (`bossesDefeated` = fights already won):
// hp compounds +25% per fight, damage +15% per fight, every fight teaches it one more special
// move it didn't have, and its special cooldowns shrink 10% per fight (floored at 40%).
export const BOSS_HP_GROWTH = 1.25
export const BOSS_DAMAGE_GROWTH = 1.15
export const BOSS_COOLDOWN_SHRINK = 0.9
export const BOSS_MIN_COOLDOWN_SCALE = 0.4
// Moves a boss can pick up on later fights, in the order it learns them (skipping ones it has).
// `lob` is left out: it needs the Bloater's ranged-attack tuning.
export const BOSS_EXTRA_SPECIALS = ['barrage', 'charge', 'slam', 'blink', 'spin', 'leap', 'summon']

export function bossHpScale(bossesDefeated) {
  return BOSS_HP_GROWTH ** bossesDefeated * bossEase(bossesDefeated).hp
}

export function bossDamageScale(bossesDefeated) {
  return BOSS_DAMAGE_GROWTH ** bossesDefeated * bossEase(bossesDefeated).damage
}

// Multiplier on every special's cooldown for this fight: lower = attacks more often.
export function bossCooldownScale(bossesDefeated) {
  return Math.max(BOSS_MIN_COOLDOWN_SCALE, BOSS_COOLDOWN_SHRINK ** bossesDefeated)
}

// The boss's own specials plus one extra learned move per fight already won.
export function bossSpecialsFor(specials, bossesDefeated) {
  const extras = BOSS_EXTRA_SPECIALS.filter((name) => !specials.includes(name)).slice(0, Math.max(0, bossesDefeated))
  return [...specials, ...extras]
}

// The first few boss fights of a run go easy: the opener has well under
// half the hp and hits much softer, easing back to full strength by the
// fourth boss. Returns multipliers for hp and damage.
export function bossEase(bossesDefeated) {
  const steps = [
    { hp: 0.5, damage: 0.55 },
    { hp: 0.7, damage: 0.7 },
    { hp: 0.85, damage: 0.85 },
  ]
  return steps[bossesDefeated] ?? { hp: 1, damage: 1 }
}

// Special-move timer: counts `timer` down by dt and, when it reaches 0,
// reports { fire: true } and rewinds to `interval`. Returns the next
// timer value plus whether the special fires this tick.
export function stepSpecialTimer(timer, dt, interval) {
  const next = timer - dt
  if (next <= 0) return { timer: interval, fire: true }
  return { timer: next, fire: false }
}
