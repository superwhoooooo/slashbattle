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
