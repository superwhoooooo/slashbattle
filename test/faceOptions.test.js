import { describe, expect, it } from 'vitest'
import {
  EYE_SIZE_MAX,
  EYE_SIZE_MIN,
  EYE_SIZE_MIN_DELTA,
  MOUTH_TYPES,
  pickFaceOptions,
  SQUINT_SIDES,
} from '../src/logic/faceOptions.js'

// Deterministic seeded PRNG (mulberry32) so tests can exercise many seeds
// without depending on Math.random.
function createRng(seed) {
  let state = seed
  return () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const SEED_COUNT = 200

describe('pickFaceOptions', () => {
  it('is deterministic for a given seed', () => {
    const a = pickFaceOptions(createRng(42))
    const b = pickFaceOptions(createRng(42))
    expect(a).toEqual(b)
  })

  it('keeps eye sizes within range and always mismatched, across many seeds', () => {
    for (let seed = 0; seed < SEED_COUNT; seed++) {
      const { eyes } = pickFaceOptions(createRng(seed))
      expect(eyes.leftSize).toBeGreaterThanOrEqual(EYE_SIZE_MIN)
      expect(eyes.leftSize).toBeLessThanOrEqual(EYE_SIZE_MAX)
      expect(eyes.rightSize).toBeGreaterThanOrEqual(EYE_SIZE_MIN)
      expect(eyes.rightSize).toBeLessThanOrEqual(EYE_SIZE_MAX)
      expect(Math.abs(eyes.leftSize - eyes.rightSize)).toBeGreaterThanOrEqual(
        EYE_SIZE_MIN_DELTA,
      )
    }
  })

  it('keeps every other pick within its valid enum/type, across many seeds', () => {
    for (let seed = 0; seed < SEED_COUNT; seed++) {
      const options = pickFaceOptions(createRng(seed))
      expect(typeof options.eyes.crossEyed).toBe('boolean')
      expect(
        options.eyes.squintEye === null ||
          SQUINT_SIDES.includes(options.eyes.squintEye),
      ).toBe(true)
      expect(MOUTH_TYPES).toContain(options.mouth.type)
      expect(typeof options.mouth.tongueOut).toBe('boolean')
      expect(typeof options.unibrow).toBe('boolean')
      expect(typeof options.rosyCheeks).toBe('boolean')
      expect(typeof options.freckles).toBe('boolean')
    }
  })
})
