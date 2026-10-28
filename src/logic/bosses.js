// Pure, Three-free boss data and rules: the seven bosses (looks, stats,
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
//   summon  - call in `count` minions (never past `maxMinions` alive)
//   slam    - ground-pound: damages everything within `radius`
//   blink   - teleport to `distance` from the player
//   barrage - fire a fan of `count` orbs at the player
//   spin    - whirl for `duration`, hitting everything within the boss's
//             radius + `radiusBonus` every `tickInterval`
export const BOSS_SPECIALS = {
  charge: { interval: 6, windup: 0, duration: 1.2, speedMultiplier: 2.6 },
  summon: { interval: 8, windup: 0.6, count: 2, maxMinions: 5 },
  slam: { interval: 7, windup: 0.9, radius: 6.5, damageMultiplier: 1.3 },
  blink: { interval: 6.5, windup: 0.5, distance: 3.5 },
  barrage: { interval: 6, windup: 0.7, count: 5, spread: 0.9, speed: 9, damageMultiplier: 0.6 },
  spin: { interval: 9, windup: 0.8, duration: 2.2, tickInterval: 0.45, radiusBonus: 2.4, damageMultiplier: 0.7 },
}

const BOSS_DEFS = [
  {
    id: 'boss_gloop',
    name: 'KING GLOOP',
    title: 'Monarch of the Mildly Damp',
    specials: ['slam'],
    score: 1000,
    stats: { shape: 'sphere', size: 4.2, color: 0x6fd13b, edgeColor: 0xe9ff9a, speed: 1.6, hp: 380, damage: 18, radius: 1.9 },
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
    specials: ['charge', 'blink'],
    score: 1100,
    stats: { shape: 'tetrahedron', size: 3.4, color: 0xb02fe0, edgeColor: 0xf0b6ff, speed: 2.6, hp: 320, damage: 16, radius: 1.3 },
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
    specials: ['spin'],
    score: 1200,
    stats: { shape: 'box', size: 3.6, color: 0xf0561e, edgeColor: 0xffc9a3, speed: 1.9, hp: 460, damage: 22, radius: 1.5 },
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
    specials: ['summon', 'barrage'],
    score: 1300,
    stats: { shape: 'cylinder', size: 3.6, color: 0xff5fae, edgeColor: 0xffd0e8, speed: 1.7, hp: 340, damage: 14, radius: 1.6 },
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
    specials: ['barrage', 'slam'],
    score: 1400,
    stats: { shape: 'cone', size: 4.4, color: 0x2f6bd9, edgeColor: 0x9cc4ff, speed: 1.5, hp: 560, damage: 24, radius: 2.0 },
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
    specials: ['blink', 'spin'],
    score: 1500,
    stats: { shape: 'octahedron', size: 3.8, color: 0xe0233f, edgeColor: 0xffa3b0, speed: 2.4, hp: 420, damage: 20, radius: 1.45 },
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
    specials: ['summon', 'slam'],
    score: 1800,
    stats: { shape: 'dodecahedron', size: 5, color: 0x19d7d0, edgeColor: 0xbafffa, speed: 1.4, hp: 640, damage: 20, radius: 2.3 },
    lines: [
      'I am OMEGA JELLO. I am the wobble at the end of the universe.',
      "They said I'd never set. THEY WERE WRONG.",
      'Dessert is served... and YOU are the topping!',
    ],
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
    attackRange: def.stats.radius + BOSS_ATTACK_REACH,
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

// A shuffled order of the bosses for one run (Fisher-Yates), so each run
// meets all seven in a different order. rng is injectable for tests.
export function shuffleBossOrder(rng = Math.random) {
  const order = BOSSES.map((_, index) => index)
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
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

// A boss's hp multiplier on the `bossesDefeated`-th fight: +20% per boss
// already beaten, so a repeat visit (after all seven) is clearly tougher.
export function bossHpScale(bossesDefeated) {
  return 1 + 0.2 * bossesDefeated
}

// Special-move timer: counts `timer` down by dt and, when it reaches 0,
// reports { fire: true } and rewinds to `interval`. Returns the next
// timer value plus whether the special fires this tick.
export function stepSpecialTimer(timer, dt, interval) {
  const next = timer - dt
  if (next <= 0) return { timer: interval, fire: true }
  return { timer: next, fire: false }
}
