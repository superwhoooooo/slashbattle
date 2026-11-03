import { describe, expect, it } from 'vitest'
import {
  BOSS_BPM,
  LOOP_STEPS,
  MUSIC_TRACKS,
  bossEventsForStep,
  MUSIC_BPM,
  eventsForStep,
  midiToFreq,
  stepDuration,
} from '../src/logic/music.js'

const kinds = (step) => eventsForStep(step).map((e) => e.kind)

describe('midiToFreq', () => {
  it('maps A4 to 440 Hz and octaves to doublings', () => {
    expect(midiToFreq(69)).toBeCloseTo(440)
    expect(midiToFreq(81)).toBeCloseTo(880)
    expect(midiToFreq(57)).toBeCloseTo(220)
  })
})

describe('stepDuration', () => {
  it('is a sixteenth note at the given tempo', () => {
    expect(stepDuration(120)).toBeCloseTo(0.125)
    expect(stepDuration()).toBeCloseTo(60 / MUSIC_BPM / 4)
  })
})

describe('eventsForStep', () => {
  it('puts a kick on every beat and a snare on 2 and 4', () => {
    for (const step of [0, 4, 8, 12]) expect(kinds(step)).toContain('kick')
    expect(kinds(4)).toContain('snare')
    expect(kinds(12)).toContain('snare')
    expect(kinds(2)).not.toContain('kick')
  })

  it('loops: a step and the same step one loop later match', () => {
    for (let step = 0; step < LOOP_STEPS; step += 7) {
      expect(eventsForStep(step)).toEqual(eventsForStep(step + LOOP_STEPS))
    }
  })

  it('plays the arp in the first half and the lead hook in the second', () => {
    const firstHalf = Array.from({ length: LOOP_STEPS / 2 }, (_, i) => kinds(i)).flat()
    const secondHalf = Array.from({ length: LOOP_STEPS / 2 }, (_, i) => kinds(i + LOOP_STEPS / 2)).flat()
    expect(firstHalf).toContain('arp')
    expect(firstHalf).not.toContain('lead')
    expect(secondHalf).toContain('lead')
    expect(secondHalf).not.toContain('arp')
  })

  it('only emits positive-length events with sane velocities and pitched notes', () => {
    for (let step = 0; step < LOOP_STEPS; step++) {
      for (const event of eventsForStep(step)) {
        expect(event.steps).toBeGreaterThan(0)
        expect(event.velocity).toBeGreaterThan(0)
        expect(event.velocity).toBeLessThanOrEqual(1)
        if (['bass', 'stab', 'lead', 'arp'].includes(event.kind)) {
          expect(Number.isFinite(event.note)).toBe(true)
        }
      }
    }
  })

  it('keeps the bass in a low register and the lead above it', () => {
    for (let step = 0; step < LOOP_STEPS; step++) {
      for (const event of eventsForStep(step)) {
        if (event.kind === 'bass') expect(event.note).toBeLessThan(60)
        if (event.kind === 'lead') expect(event.note).toBeGreaterThanOrEqual(60)
      }
    }
  })
})

describe('boss track', () => {
  const bossKinds = (step) => bossEventsForStep(step).map((e) => e.kind)

  it('is registered next to the normal track and runs faster', () => {
    expect(Object.keys(MUSIC_TRACKS)).toEqual(['chill', 'normal', 'boss'])
    expect(MUSIC_TRACKS.boss.bpm).toBe(BOSS_BPM)
    expect(BOSS_BPM).toBeGreaterThan(MUSIC_BPM)
    expect(MUSIC_TRACKS.boss.events).toBe(bossEventsForStep)
  })

  it('has a double kick, a backbeat snare and a gallop bass', () => {
    for (const step of [0, 6, 8]) expect(bossKinds(step)).toContain('kick')
    for (const step of [4, 12]) expect(bossKinds(step)).toContain('snare')
    expect(bossKinds(2)).toContain('bass')
    expect(bossKinds(1)).not.toContain('bass')
  })

  it('opens with a crash and a held chord on the first downbeat', () => {
    expect(bossKinds(0)).toContain('crash')
    expect(bossKinds(0).filter((k) => k === 'pad')).toHaveLength(3)
  })

  it('plays the riff in the first half and the hook in the second', () => {
    expect(bossKinds(0)).toContain('riff')
    expect(bossKinds(0)).not.toContain('lead')
    const secondHalf = LOOP_STEPS / 2
    expect(bossKinds(secondHalf)).toContain('lead')
    expect(bossKinds(secondHalf)).not.toContain('riff')
  })

  it('loops and only emits notes with a pitch where one is needed', () => {
    for (let step = 0; step < LOOP_STEPS; step++) {
      expect(bossEventsForStep(step)).toEqual(bossEventsForStep(step + LOOP_STEPS))
      for (const event of bossEventsForStep(step)) {
        if (['bass', 'pad', 'riff', 'lead', 'tom'].includes(event.kind)) expect(event.note).toBeGreaterThan(0)
      }
    }
  })
})

import { CHILL_BPM, MUSIC_TRACKS, chillEventsForStep, LOOP_STEPS } from '../src/logic/music.js'

describe('chill track', () => {
  it('is registered, slow, and loops', () => {
    expect(MUSIC_TRACKS.chill.bpm).toBe(CHILL_BPM)
    expect(CHILL_BPM).toBeLessThan(90)
    expect(chillEventsForStep(5).map((e) => e.kind)).toEqual(chillEventsForStep(5 + LOOP_STEPS).map((e) => e.kind))
  })

  it('has chords, bass and a kick on the downbeat of every bar', () => {
    for (let bar = 0; bar < 8; bar++) {
      const kinds = chillEventsForStep(bar * 16).map((e) => e.kind)
      expect(kinds).toContain('keys')
      expect(kinds).toContain('sub')
      expect(kinds).toContain('kick')
    }
  })
})
