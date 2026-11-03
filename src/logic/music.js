// The background track as pure data: a 16-step-per-bar, 8-bar loop in D
// minor at a bouncy, Brawl Stars-ish tempo. `eventsForStep` turns an
// absolute step counter into the notes/drum hits that land on it; the
// Web Audio side (src/music.js) just schedules and voices them.
export const MUSIC_BPM = 134
export const STEPS_PER_BAR = 16
export const LOOP_BARS = 8
export const LOOP_STEPS = STEPS_PER_BAR * LOOP_BARS

// Bars 1-4 then 5-8; the second half swaps to the lead hook and ends on
// an A major turnaround so the loop pulls back to Dm.
const CHORDS = [
  { root: 38, tones: [50, 53, 57] }, // Dm
  { root: 34, tones: [46, 50, 53] }, // Bb
  { root: 41, tones: [53, 57, 60] }, // F
  { root: 36, tones: [48, 52, 55] }, // C
  { root: 38, tones: [50, 53, 57] }, // Dm
  { root: 34, tones: [46, 50, 53] }, // Bb
  { root: 41, tones: [53, 57, 60] }, // F
  { root: 33, tones: [49, 52, 57] }, // A
]

// Bouncy, syncopated bass: step -> semitones above the chord root.
const BASS_PATTERN = { 0: 0, 3: 0, 6: 12, 8: 0, 11: 0, 14: 7 }

// The hook, per bar of the second half: [step, midi note, length in steps].
const LEAD_BARS = [
  [[0, 69, 2], [3, 74, 1], [4, 77, 2], [8, 76, 2], [10, 74, 2], [12, 69, 4]],
  [[0, 70, 2], [3, 74, 1], [4, 77, 2], [8, 74, 2], [10, 70, 2], [12, 65, 4]],
  [[0, 72, 2], [3, 77, 1], [4, 81, 2], [8, 79, 2], [10, 77, 2], [12, 72, 4]],
  [[0, 73, 2], [3, 76, 1], [4, 81, 2], [8, 79, 2], [10, 76, 2], [12, 73, 2], [14, 69, 2]],
]

const STAB_STEPS_FIRST_HALF = [2, 10]
const STAB_STEPS_SECOND_HALF = [2, 6, 10, 14]
const ARP_SHAPE = [0, 1, 2, 1]

export function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

export function stepDuration(bpm = MUSIC_BPM) {
  return 60 / bpm / 4
}

// Every event landing on `stepIndex` (an ever-increasing counter; it
// wraps around the loop internally). Each event is
// { kind, note?, steps, velocity } where `steps` is its length in 16ths.
export function eventsForStep(stepIndex) {
  const loopStep = ((stepIndex % LOOP_STEPS) + LOOP_STEPS) % LOOP_STEPS
  const bar = Math.floor(loopStep / STEPS_PER_BAR)
  const step = loopStep % STEPS_PER_BAR
  const secondHalf = bar >= LOOP_BARS / 2
  const chord = CHORDS[bar]
  const events = []

  // Drums: kick on the beat plus a bounce on the "and" of 3, clap on 2 & 4.
  if (step % 4 === 0) events.push({ kind: 'kick', steps: 1, velocity: 1 })
  if (step === 10) events.push({ kind: 'kick', steps: 1, velocity: 0.7 })
  if (step === 4 || step === 12) events.push({ kind: 'snare', steps: 1, velocity: 0.9 })
  if (step % 2 === 0) {
    events.push({ kind: 'hat', steps: 1, velocity: step % 4 === 2 ? 0.55 : 0.3 })
  }
  if (step === 14) events.push({ kind: 'openHat', steps: 2, velocity: 0.5 })

  // Four-bar-end fills: a snare roll across the last beat, and a crash
  // on the downbeat that follows each fill.
  const endOfFourBars = bar % 4 === 3
  if (endOfFourBars && step >= 12) {
    events.push({ kind: 'snare', steps: 1, velocity: 0.45 + (step - 12) * 0.15 })
  }
  if (bar % 4 === 0 && step === 0 && loopStep > 0) {
    events.push({ kind: 'crash', steps: 8, velocity: 0.6 })
  }

  if (step in BASS_PATTERN) {
    events.push({ kind: 'bass', note: chord.root + BASS_PATTERN[step], steps: 2, velocity: 1 })
  }

  const stabSteps = secondHalf ? STAB_STEPS_SECOND_HALF : STAB_STEPS_FIRST_HALF
  if (stabSteps.includes(step)) {
    for (const tone of chord.tones) {
      events.push({ kind: 'stab', note: tone + 12, steps: 1, velocity: 0.8 })
    }
  }

  if (secondHalf) {
    for (const [leadStep, note, steps] of LEAD_BARS[bar - LOOP_BARS / 2]) {
      if (leadStep === step) events.push({ kind: 'lead', note, steps, velocity: 1 })
    }
  } else if (step % 2 === 0) {
    const tone = chord.tones[ARP_SHAPE[(step / 2) % ARP_SHAPE.length] % chord.tones.length]
    events.push({ kind: 'arp', note: tone + 24, steps: 1, velocity: 0.7 })
  }

  return events
}

// ---- Boss track -----------------------------------------------------------
// A faster, darker 8-bar loop in E minor for boss fights: a galloping bass,
// double-kick drums, a held pad, a stabbing riff over the first four bars
// and a soaring hook over the last four (Em-Em-C-D, Em-Em-C-B).
export const BOSS_BPM = 156

const BOSS_CHORDS = [
  { root: 40, tones: [52, 55, 59] }, // Em
  { root: 40, tones: [52, 55, 59] }, // Em
  { root: 36, tones: [48, 52, 55] }, // C
  { root: 38, tones: [50, 54, 57] }, // D
  { root: 40, tones: [52, 55, 59] }, // Em
  { root: 40, tones: [52, 55, 59] }, // Em
  { root: 36, tones: [48, 52, 55] }, // C
  { root: 35, tones: [51, 54, 59] }, // B (major, so the loop pulls back to Em)
]

const BOSS_GALLOP_STEPS = [0, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15]
const BOSS_RIFF_STEPS = [0, 3, 6, 8, 11, 14]

// The hook, per bar of the second half: [step, midi note, length in steps].
const BOSS_LEAD_BARS = [
  [[0, 76, 3], [3, 79, 3], [6, 83, 2], [8, 81, 2], [10, 79, 2], [12, 76, 4]],
  [[0, 76, 3], [3, 79, 3], [6, 83, 2], [8, 86, 4], [12, 83, 4]],
  [[0, 79, 3], [3, 84, 3], [6, 88, 2], [8, 86, 2], [10, 84, 2], [12, 79, 4]],
  [[0, 78, 2], [2, 83, 2], [4, 86, 2], [6, 87, 2], [8, 86, 4], [12, 83, 4]],
]

export function bossEventsForStep(stepIndex) {
  const loopStep = ((stepIndex % LOOP_STEPS) + LOOP_STEPS) % LOOP_STEPS
  const bar = Math.floor(loopStep / STEPS_PER_BAR)
  const step = loopStep % STEPS_PER_BAR
  const secondHalf = bar >= LOOP_BARS / 2
  const chord = BOSS_CHORDS[bar]
  const events = []

  // Drums: double kick, backbeat snare, driving 16th hats.
  if (step === 0 || step === 6 || step === 8 || step === 10) events.push({ kind: 'kick', steps: 1, velocity: step === 0 ? 1 : 0.8 })
  if (step === 4 || step === 12) events.push({ kind: 'snare', steps: 1, velocity: 1 })
  events.push({ kind: 'hat', steps: 1, velocity: step % 2 === 0 ? 0.5 : 0.28 })
  if (step === 14) events.push({ kind: 'openHat', steps: 2, velocity: 0.55 })
  // Tom run on the last beat of every fourth bar, a crash on every fourth downbeat.
  if (bar % 4 === 3 && step >= 12) events.push({ kind: 'tom', note: 50 - (step - 12) * 3, steps: 1, velocity: 0.9 })
  if (bar % 4 === 0 && step === 0) events.push({ kind: 'crash', steps: 8, velocity: 0.7 })

  if (BOSS_GALLOP_STEPS.includes(step)) {
    events.push({ kind: 'bass', note: chord.root + (step === 7 || step === 15 ? 12 : 0), steps: 1, velocity: 1 })
  }

  if (step === 0) {
    for (const tone of chord.tones) events.push({ kind: 'pad', note: tone, steps: STEPS_PER_BAR, velocity: 1 })
  }

  if (secondHalf) {
    for (const [leadStep, note, steps] of BOSS_LEAD_BARS[bar - LOOP_BARS / 2]) {
      if (leadStep === step) events.push({ kind: 'lead', note, steps, velocity: 1 })
    }
  } else if (BOSS_RIFF_STEPS.includes(step)) {
    events.push({ kind: 'riff', note: chord.root + 24 + (step === 8 || step === 14 ? 3 : 0), steps: 2, velocity: 1 })
  }

  return events
}

// ---- Chill track ----------------------------------------------------------
// A slow lo-fi loop for the pause menu and hub: 76 BPM, a soft boom-bap kick
// and rim, hazy hats, vinyl crackle, warm electric-piano chords
// (Dm9-G13-Cmaj9-Am9, Fmaj7-Em7-Dm9-G13), a mellow sine bass and a sparse
// bell melody in D minor pentatonic.
export const CHILL_BPM = 76

const CHILL_CHORDS = [
  { root: 38, tones: [53, 57, 60, 64] }, // Dm9
  { root: 43, tones: [53, 59, 62, 64] }, // G13
  { root: 36, tones: [52, 55, 59, 62] }, // Cmaj9
  { root: 33, tones: [55, 60, 64, 71] }, // Am9
  { root: 41, tones: [57, 60, 64, 67] }, // Fmaj7
  { root: 40, tones: [55, 59, 62, 67] }, // Em7
  { root: 38, tones: [53, 57, 60, 64] }, // Dm9
  { root: 43, tones: [53, 59, 62, 64] }, // G13 (turns back to Dm9)
]

// The bell melody, per bar: [step, midi note, length in steps].
const CHILL_MELODY = [
  [[2, 81, 3], [8, 77, 2], [12, 74, 4]],
  [[0, 79, 3], [6, 81, 2], [10, 77, 3]],
  [[2, 76, 3], [8, 79, 3], [12, 81, 2]],
  [[0, 81, 4], [8, 76, 2], [12, 79, 2]],
  [[2, 77, 3], [8, 81, 2], [12, 84, 4]],
  [[0, 79, 3], [6, 76, 2], [10, 74, 4]],
  [[2, 74, 2], [6, 77, 2], [10, 81, 4]],
  [[0, 79, 3], [8, 76, 3], [12, 74, 4]],
]

export function chillEventsForStep(stepIndex) {
  const loopStep = ((stepIndex % LOOP_STEPS) + LOOP_STEPS) % LOOP_STEPS
  const bar = Math.floor(loopStep / STEPS_PER_BAR)
  const step = loopStep % STEPS_PER_BAR
  const chord = CHILL_CHORDS[bar]
  const events = []

  // Boom-bap: kick on 1 with a lazy ghost, soft rim on 2 and 4, hazy off-beat hats.
  if (step === 0) events.push({ kind: 'kick', steps: 1, velocity: 0.8 })
  if (step === 7 || (step === 10 && bar % 2 === 1)) events.push({ kind: 'kick', steps: 1, velocity: 0.45 })
  if (step === 4 || step === 12) events.push({ kind: 'snare', steps: 1, velocity: 0.35 })
  if (step % 2 === 0) events.push({ kind: 'hat', steps: 1, velocity: step % 4 === 2 ? 0.3 : 0.16 })
  // Vinyl crackle: a deterministic scatter of tiny ticks.
  if ((stepIndex * 7919) % 11 === 0) events.push({ kind: 'crackle', steps: 1, velocity: 0.5 })

  // Warm electric-piano chords: a held one on the downbeat, a short comp later.
  if (step === 0) for (const tone of chord.tones) events.push({ kind: 'keys', note: tone, steps: 12, velocity: 1 })
  if (step === 10) for (const tone of chord.tones.slice(1)) events.push({ kind: 'keys', note: tone, steps: 4, velocity: 0.55 })

  // Round sine bass.
  if (step === 0) events.push({ kind: 'sub', note: chord.root, steps: 6, velocity: 1 })
  if (step === 10) events.push({ kind: 'sub', note: chord.root + 7, steps: 4, velocity: 0.8 })

  for (const [melodyStep, note, steps] of CHILL_MELODY[bar]) {
    if (melodyStep === step) events.push({ kind: 'bell', note, steps, velocity: 1 })
  }
  return events
}

// The tracks the music player can switch between.
export const MUSIC_TRACKS = {
  chill: { bpm: CHILL_BPM, events: chillEventsForStep },
  normal: { bpm: MUSIC_BPM, events: eventsForStep },
  boss: { bpm: BOSS_BPM, events: bossEventsForStep },
}
