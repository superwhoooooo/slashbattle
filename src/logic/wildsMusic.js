// The Wilds' music (pure data, like logic/music.js): every place that is not the Orbital Resort has its own loop, all
// built from one small generator so they stay deterministic and testable.
//   - one track per Wilds biome (the Sanctum, the five Heartland biomes, the six Frontier biomes),
//   - 'sky'   for the sky isles (airy bells over a wide pad, no drums),
//   - 'depths' for the Depths under the chasms (a low drone, slow heartbeat, drips in the dark),
//   - 'dungeon' for the Labyrinth (a tense, marching minor loop).
// `pickTrack` decides which one plays; the music style 'classic' keeps today's behaviour (the resort loop everywhere).
// An event is { kind, note?, steps, velocity } on a 16-step bar, 8 bars to the loop, like the other tracks.
export const AMBIENT_STEPS_PER_BAR = 16
export const AMBIENT_LOOP_BARS = 8
export const AMBIENT_LOOP_STEPS = AMBIENT_STEPS_PER_BAR * AMBIENT_LOOP_BARS

// What the voices in src/music.js are called (the new ones are voiced there too).
export const AMBIENT_KINDS = ['kick', 'snare', 'hat', 'tom', 'bass', 'crackle', 'air', 'drone', 'pluck', 'shimmer', 'drip', 'thud', 'lead', 'bell', 'keys', 'sub', 'crash']

const SCALES = {
  majorPent: [0, 2, 4, 7, 9],
  minorPent: [0, 3, 5, 7, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  aeolian: [0, 2, 3, 5, 7, 8, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
  wholeTone: [0, 2, 4, 6, 8, 10],
}
const QUALITY = {
  min: [0, 3, 7],
  maj: [0, 4, 7],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  min7: [0, 3, 7, 10],
  maj7: [0, 4, 7, 11],
  add9: [0, 4, 7, 14],
  min9: [0, 3, 7, 10, 14],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  lyd: [0, 4, 6, 11],
}
// A progression: [semitones above the root, quality] for each of the eight bars.
const P = (list) => list.map(([offset, quality]) => ({ offset, tones: QUALITY[quality] }))

// Every track. root: the tonic (MIDI). pad: the held chord voice ('air' soft, 'drone' dark). melody: a seeded walk through
// `scale` around MIDI note `centre`, `density` notes a bar, voiced by `kind`. arp: a repeating pattern over the chord.
// kick / snare / hat / tom: [steps, velocity]. bass: steps the bass plays the root on. drip: chance a step drips.
const DEFS = {
  // ---- the Sanctum and the Heartland ----
  wilds_sanctum: { bpm: 70, root: 50, scale: 'majorPent', prog: P([[0, 'maj7'], [7, 'sus2'], [9, 'min7'], [5, 'maj7'], [0, 'add9'], [7, 'sus2'], [9, 'min7'], [5, 'sus2']]), pad: 'air', padVel: 1, sub: true, kick: [[0, 8], 0.35], hat: [[4, 12], 0.12], melody: { kind: 'bell', density: 3, seed: 11, centre: 78 }, arp: { steps: [0, 6, 10], kind: 'pluck', oct: 12, vel: 0.35 } },
  wilds_whisperwood: { bpm: 84, root: 45, scale: 'dorian', prog: P([[0, 'min7'], [5, 'maj7'], [10, 'maj'], [7, 'min7'], [0, 'min9'], [5, 'maj7'], [3, 'maj7'], [7, 'sus4']]), pad: 'air', padVel: 0.8, sub: true, kick: [[0, 10], 0.4], hat: [[4, 12], 0.14], melody: { kind: 'keys', density: 3, seed: 23, centre: 76 }, arp: { steps: [0, 3, 6, 9, 12], kind: 'pluck', oct: 12, vel: 0.4 } },
  wilds_amethyst: { bpm: 88, root: 54, scale: 'lydian', prog: P([[0, 'maj7'], [2, 'maj'], [0, 'add9'], [7, 'maj'], [4, 'min7'], [2, 'maj'], [0, 'maj7'], [7, 'sus2']]), pad: 'air', padVel: 0.9, sub: true, hat: [[2, 6, 10, 14], 0.1], melody: { kind: 'bell', density: 4, seed: 37, centre: 82 }, arp: { steps: [0, 2, 4, 6, 8, 10, 12, 14], kind: 'shimmer', oct: 24, vel: 0.28 } },
  wilds_frostveil: { bpm: 76, root: 52, scale: 'aeolian', prog: P([[0, 'min9'], [8, 'maj7'], [3, 'maj7'], [10, 'maj'], [0, 'min7'], [8, 'maj7'], [5, 'min7'], [7, 'sus4']]), pad: 'air', padVel: 0.7, sub: false, melody: { kind: 'bell', density: 2, seed: 41, centre: 88 }, arp: { steps: [0, 8], kind: 'shimmer', oct: 24, vel: 0.35 } },
  wilds_emberwaste: { bpm: 100, root: 40, scale: 'phrygian', prog: P([[0, 'min'], [1, 'maj'], [0, 'min'], [10, 'maj'], [0, 'min'], [1, 'maj'], [8, 'maj'], [7, 'maj']]), pad: 'drone', padVel: 0.8, sub: true, kick: [[0, 6, 8, 11], 0.7], snare: [[12], 0.4], hat: [[2, 6, 10, 14], 0.18], tom: [[14], 0.5], bass: [0, 3, 6, 8, 11], melody: { kind: 'lead', density: 2, seed: 53, centre: 69 } },
  wilds_gloomfen: { bpm: 68, root: 41, scale: 'aeolian', prog: P([[0, 'min'], [1, 'maj'], [0, 'dim'], [10, 'maj'], [0, 'min7'], [8, 'maj'], [1, 'maj7'], [7, 'dim']]), pad: 'drone', padVel: 1, sub: true, kick: [[0], 0.4], crackle: true, drip: 0.05, melody: { kind: 'keys', density: 2, seed: 61, centre: 70 } },
  // ---- the Frontier ----
  wilds_glowcap: { bpm: 92, root: 47, scale: 'wholeTone', prog: P([[0, 'aug'], [2, 'maj'], [4, 'aug'], [6, 'maj'], [0, 'lyd'], [2, 'sus2'], [4, 'aug'], [8, 'maj']]), pad: 'air', padVel: 0.8, sub: true, hat: [[3, 7, 11, 15], 0.1], melody: { kind: 'bell', density: 4, seed: 71, centre: 80 }, arp: { steps: [0, 3, 6, 9, 12, 15], kind: 'pluck', oct: 24, vel: 0.3 } },
  wilds_saltglass: { bpm: 104, root: 43, scale: 'mixolydian', prog: P([[0, 'maj'], [10, 'maj'], [5, 'maj'], [0, 'maj'], [0, 'sus4'], [10, 'maj'], [7, 'min7'], [5, 'maj']]), pad: 'air', padVel: 0.6, sub: true, kick: [[0, 8], 0.4], hat: [[4, 12], 0.2], tom: [[6, 14], 0.3], melody: { kind: 'lead', density: 3, seed: 83, centre: 74 }, arp: { steps: [0, 4, 8, 12], kind: 'pluck', oct: 12, vel: 0.35 } },
  wilds_drowned: { bpm: 78, root: 44, scale: 'dorian', prog: P([[0, 'min9'], [5, 'maj7'], [0, 'min7'], [7, 'sus2'], [3, 'maj7'], [10, 'maj'], [0, 'min9'], [7, 'sus4']]), pad: 'air', padVel: 0.9, sub: true, drip: 0.1, kick: [[0], 0.3], melody: { kind: 'keys', density: 2, seed: 97, centre: 72 }, arp: { steps: [2, 5, 10, 13], kind: 'pluck', oct: 24, vel: 0.3 } },
  wilds_stormcrown: { bpm: 112, root: 38, scale: 'aeolian', prog: P([[0, 'min'], [8, 'maj'], [10, 'maj'], [7, 'min'], [0, 'min'], [8, 'maj'], [3, 'maj'], [7, 'maj']]), pad: 'drone', padVel: 0.9, sub: true, kick: [[0, 6, 8, 10], 0.75], snare: [[4, 12], 0.5], hat: [[2, 6, 10, 14], 0.2], tom: [[14, 15], 0.6], crashEvery: 4, bass: [0, 3, 6, 8, 11, 14], melody: { kind: 'lead', density: 3, seed: 109, centre: 69 } },
  wilds_bonewaste: { bpm: 66, root: 40, scale: 'phrygian', prog: P([[0, 'min'], [0, 'sus2'], [1, 'maj'], [0, 'min'], [0, 'min'], [10, 'maj'], [1, 'maj'], [0, 'dim']]), pad: 'drone', padVel: 1, sub: true, thud: [[0, 3], 0.7], hat: [[8], 0.25], drip: 0.04, melody: { kind: 'bell', density: 2, seed: 127, centre: 76 } },
  wilds_skyshard: { bpm: 80, root: 55, scale: 'lydian', prog: P([[0, 'maj7'], [7, 'maj'], [2, 'maj'], [9, 'min7'], [0, 'add9'], [7, 'maj'], [4, 'min7'], [2, 'lyd']]), pad: 'air', padVel: 0.85, sub: false, melody: { kind: 'bell', density: 4, seed: 131, centre: 86 }, arp: { steps: [0, 2, 4, 6, 8, 10, 12, 14], kind: 'shimmer', oct: 24, vel: 0.3 } },
  // ---- the sky isles, the Depths, the Labyrinth ----
  sky: { bpm: 86, root: 50, scale: 'lydian', prog: P([[0, 'maj7'], [7, 'maj'], [9, 'min7'], [2, 'maj'], [0, 'add9'], [7, 'maj'], [5, 'maj7'], [2, 'sus2']]), pad: 'air', padVel: 1, sub: false, melody: { kind: 'bell', density: 4, seed: 149, centre: 86 }, arp: { steps: [0, 2, 4, 6, 8, 10, 12, 14], kind: 'shimmer', oct: 24, vel: 0.32 } },
  depths: { bpm: 60, root: 34, scale: 'phrygian', prog: P([[0, 'min'], [0, 'sus2'], [1, 'maj'], [0, 'dim'], [0, 'min'], [6, 'dim'], [1, 'maj'], [0, 'sus2']]), pad: 'drone', padVel: 1.1, sub: true, thud: [[0, 6], 0.55], drip: 0.07, crackle: true, melody: { kind: 'bell', density: 2, seed: 163, centre: 82 } },
  dungeon: { bpm: 104, root: 45, scale: 'harmonicMinor', prog: P([[0, 'min'], [0, 'min'], [8, 'maj'], [7, 'maj'], [0, 'min'], [5, 'min'], [8, 'maj'], [7, 'maj']]), pad: 'drone', padVel: 0.8, sub: true, kick: [[0, 8], 0.8], snare: [[12], 0.4], hat: [[2, 6, 10, 14], 0.16], tom: [[6, 10], 0.4], bass: [0, 2, 4, 6, 8, 10, 12, 14], melody: { kind: 'lead', density: 2, seed: 179, centre: 69 } },
}

// ---- the seeded melody ----------------------------------------------------------------------------------

function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const SLOTS = [0, 2, 3, 4, 6, 8, 10, 11, 12, 14]
const melodyCache = new Map()

// Per bar: [[step, midi note, length in steps], ...]. A gentle random walk through the scale that comes home on the root.
function buildMelody(id, def) {
  const m = def.melody
  const r = rng(m.seed)
  const scale = SCALES[def.scale]
  const ladder = []
  for (let oct = -1; oct <= 1; oct++) for (const i of scale) ladder.push(def.root + 12 * Math.round((m.centre - def.root) / 12) + oct * 12 + i)
  ladder.sort((a, b) => a - b)
  let at = ladder.findIndex((n) => n >= m.centre)
  const bars = []
  for (let bar = 0; bar < AMBIENT_LOOP_BARS; bar++) {
    const steps = []
    while (steps.length < m.density) {
      const s = SLOTS[Math.floor(r() * SLOTS.length)]
      if (!steps.includes(s)) steps.push(s)
    }
    steps.sort((a, b) => a - b)
    const notes = steps.map((s, i) => {
      at = Math.max(1, Math.min(ladder.length - 2, at + Math.round((r() - 0.5) * 4)))
      const len = Math.min(8, (steps[i + 1] ?? AMBIENT_STEPS_PER_BAR) - s)
      return [s, ladder[at], Math.max(2, len)]
    })
    bars.push(notes)
  }
  // The last note of the loop lands on the tonic (an octave near the walk), so it pulls back to the top.
  const last = bars[AMBIENT_LOOP_BARS - 1]
  const home = ladder.reduce((best, n) => ((n - def.root) % 12 === 0 && Math.abs(n - m.centre) < Math.abs(best - m.centre) ? n : best), ladder[0])
  last[last.length - 1][1] = home
  melodyCache.set(id, bars)
  return bars
}

// ---- events ---------------------------------------------------------------------------------------------

function eventsFor(id, stepIndex) {
  const def = DEFS[id]
  const loopStep = ((stepIndex % AMBIENT_LOOP_STEPS) + AMBIENT_LOOP_STEPS) % AMBIENT_LOOP_STEPS
  const bar = Math.floor(loopStep / AMBIENT_STEPS_PER_BAR)
  const step = loopStep % AMBIENT_STEPS_PER_BAR
  const chord = def.prog[bar]
  const base = def.root + chord.offset
  const tones = chord.tones.map((t) => base + t)
  const events = []
  const at = (list, hit) => list && list[0].includes(step) && events.push(hit(list[1]))

  // The held chord: a soft 'air' pad, or a dark 'drone' pad an octave lower.
  if (step === 0) {
    const lift = def.pad === 'air' ? 12 : 0
    for (const t of tones) events.push({ kind: def.pad, note: t + lift, steps: AMBIENT_STEPS_PER_BAR, velocity: def.padVel })
    if (def.sub) events.push({ kind: 'sub', note: base - 12, steps: AMBIENT_STEPS_PER_BAR, velocity: 0.5 })
  }
  // Drums, only where the track has them.
  at(def.kick, (v) => ({ kind: 'kick', steps: 1, velocity: v }))
  at(def.snare, (v) => ({ kind: 'snare', steps: 1, velocity: v }))
  at(def.hat, (v) => ({ kind: 'hat', steps: 1, velocity: v }))
  at(def.tom, (v) => ({ kind: 'tom', note: 48 - Math.floor(step / 4), steps: 1, velocity: v }))
  // A slow heartbeat (two soft thuds) every other bar.
  if (def.thud && bar % 2 === 0) at(def.thud, (v) => ({ kind: 'thud', steps: 1, velocity: v }))
  if (def.crashEvery && bar % def.crashEvery === 0 && step === 0 && loopStep > 0) events.push({ kind: 'crash', steps: 8, velocity: 0.45 })
  if (def.bass && def.bass.includes(step)) events.push({ kind: 'bass', note: base - 12 + (step % 8 === 6 ? 12 : 0), steps: 1, velocity: 0.7 })
  // The arpeggio: chord tones in turn.
  if (def.arp && def.arp.steps.includes(step)) {
    const i = def.arp.steps.indexOf(step) + bar
    events.push({ kind: def.arp.kind, note: tones[i % tones.length] + def.arp.oct, steps: 2, velocity: def.arp.vel })
  }
  // The melody.
  if (def.melody) {
    const bars = melodyCache.get(id) ?? buildMelody(id, def)
    for (const [s, note, len] of bars[bar]) if (s === step) events.push({ kind: def.melody.kind, note, steps: len, velocity: def.melody.kind === 'lead' ? 0.55 : 0.8 })
  }
  // Drips and crackle: a deterministic scatter (a hash of the step, so every loop is the same).
  const h = ((stepIndex % AMBIENT_LOOP_STEPS) * 2654435761) >>> 0
  if (def.drip && (h % 1000) / 1000 < def.drip) events.push({ kind: 'drip', note: tones[h % tones.length] + 36, steps: 2, velocity: 0.5 })
  if (def.crackle && h % 13 === 0) events.push({ kind: 'crackle', steps: 1, velocity: 0.4 })
  return events
}

// Every track, in the shape logic/music.js's MUSIC_TRACKS uses: { bpm, events(stepIndex) }.
export const WILDS_TRACKS = Object.fromEntries(Object.entries(DEFS).map(([id, def]) => [id, { bpm: def.bpm, events: (stepIndex) => eventsFor(id, stepIndex) }]))
export const WILDS_TRACK_IDS = Object.keys(DEFS)

// The track for each biome of the Wilds (the Sanctum's is the default).
export const WILDS_BIOME_TRACKS = {
  sanctum: 'wilds_sanctum', whisperwood: 'wilds_whisperwood', amethyst: 'wilds_amethyst', frostveil: 'wilds_frostveil', emberwaste: 'wilds_emberwaste', gloomfen: 'wilds_gloomfen',
  glowcap: 'wilds_glowcap', saltglass: 'wilds_saltglass', drowned: 'wilds_drowned', stormcrown: 'wilds_stormcrown', bonewaste: 'wilds_bonewaste', skyshard: 'wilds_skyshard',
}

// ---- which track plays ----------------------------------------------------------------------------------

// 'places': each place has its own music (the Wilds' biomes, the sky isles, the Depths, the Labyrinth). 'classic': the
// resort's loop everywhere, exactly as it always was (still a boss loop for boss fights and a chill one when paused).
export const MUSIC_STYLES = ['places', 'classic']
export const DEFAULT_MUSIC_STYLE = 'places'
export const MUSIC_STYLE_LABELS = { places: 'Different for every place', classic: 'Same music always' }
export const parseMusicStyle = (text) => (MUSIC_STYLES.includes(text) ? text : DEFAULT_MUSIC_STYLE)
export const nextMusicStyle = (style) => MUSIC_STYLES[(MUSIC_STYLES.indexOf(style) + 1) % MUSIC_STYLES.length]

// ctx: { style, paused, bossFight (the waves' boss), bossNear (a boss close by in the Wilds), world, depths, aloft, labyrinth, biome }.
export function pickTrack({ style = DEFAULT_MUSIC_STYLE, paused = false, bossFight = false, bossNear = false, world = false, depths = false, aloft = false, labyrinth = false, biome = 'sanctum' } = {}) {
  if (paused) return 'chill'
  if (bossFight) return 'boss'
  if (style === 'classic') return 'normal'
  if (labyrinth) return 'dungeon'
  if (world) {
    if (bossNear) return 'boss'
    if (depths) return 'depths'
    if (aloft) return 'sky'
    return WILDS_BIOME_TRACKS[biome] ?? 'wilds_sanctum'
  }
  return 'normal' // the Orbital Resort (and the other places on the sundeck), untouched
}
