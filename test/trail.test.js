import { describe, expect, it } from 'vitest'
import { pushTrailPoint, trailAlphaAt } from '../src/logic/trail.js'

describe('pushTrailPoint', () => {
  it('appends the new point', () => {
    const history = [{ x: 0, y: 0, z: 0 }]
    const next = pushTrailPoint(history, { x: 1, y: 0, z: 0 }, 5)
    expect(next).toEqual([{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }])
  })

  it('drops the oldest point once maxLength is exceeded', () => {
    const history = [{ x: 0 }, { x: 1 }, { x: 2 }]
    const next = pushTrailPoint(history, { x: 3 }, 3)
    expect(next).toEqual([{ x: 1 }, { x: 2 }, { x: 3 }])
  })

  it('never grows past maxLength even starting over it', () => {
    const history = [{ x: 0 }, { x: 1 }, { x: 2 }, { x: 3 }]
    const next = pushTrailPoint(history, { x: 4 }, 2)
    expect(next).toEqual([{ x: 3 }, { x: 4 }])
  })

  it('does not mutate the history array passed in', () => {
    const history = [{ x: 0 }]
    pushTrailPoint(history, { x: 1 }, 5)
    expect(history).toEqual([{ x: 0 }])
  })
})

describe('trailAlphaAt', () => {
  it('is 0 at the oldest point and 1 at the newest', () => {
    expect(trailAlphaAt(0, 5)).toBe(0)
    expect(trailAlphaAt(4, 5)).toBe(1)
  })

  it('ramps linearly in between', () => {
    expect(trailAlphaAt(2, 5)).toBeCloseTo(0.5)
  })

  it('is fully opaque for a single-point trail', () => {
    expect(trailAlphaAt(0, 1)).toBe(1)
  })
})
