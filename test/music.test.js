import { describe, expect, it } from 'vitest'
import {
  LOOP_STEPS,
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
