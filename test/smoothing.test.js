import { describe, expect, it } from 'vitest'
import { damp, dampAngle, rampToward, wrapAngle } from '../src/logic/smoothing.js'

describe('damp', () => {
  it('leaves current unchanged at dt = 0', () => {
    expect(damp(3, 10, 5, 0)).toBeCloseTo(3, 10)
  })

  it('converges to target as dt grows large', () => {
    expect(damp(0, 10, 5, 1000)).toBeCloseTo(10, 6)
  })

  it('is frame-rate independent: many small steps match one big step', () => {
    const lambda = 6
    const totalDt = 0.5
    let steppedMany = 0
    const steps = 50
    for (let i = 0; i < steps; i++) {
      steppedMany = damp(steppedMany, 10, lambda, totalDt / steps)
    }
    const steppedOnce = damp(0, 10, lambda, totalDt)
    expect(steppedMany).toBeCloseTo(steppedOnce, 9)
  })

  it('moves toward target without ever overshooting it', () => {
    const result = damp(0, 10, 5, 0.1)
    expect(result).toBeGreaterThan(0)
    expect(result).toBeLessThan(10)
  })
})

describe('wrapAngle', () => {
  it('leaves an angle already in (-PI, PI] unchanged', () => {
    expect(wrapAngle(1)).toBeCloseTo(1, 10)
    expect(wrapAngle(-1)).toBeCloseTo(-1, 10)
  })

  it('wraps an angle past PI back around', () => {
    expect(wrapAngle(Math.PI * 1.5)).toBeCloseTo(-Math.PI * 0.5, 10)
    expect(wrapAngle(-Math.PI * 1.5)).toBeCloseTo(Math.PI * 0.5, 10)
  })
})

describe('dampAngle', () => {
  it('turns the short way around the +-PI wraparound, not the long way', () => {
    // From just past +PI*0.9 to just past -PI*0.9: the short way crosses
    // the wraparound (a small step), the long way would sweep almost a
    // full turn back through 0.
    const current = Math.PI * 0.9
    const target = -Math.PI * 0.9
    const result = dampAngle(current, target, 10, 0.01)
    // A small step toward target should increase (wrap-adjusted) past
    // PI, not decrease toward 0.
    const stepSize = wrapAngle(result - current)
    expect(Math.abs(stepSize)).toBeLessThan(0.2)
  })

  it('converges to the target angle as dt grows large', () => {
    expect(dampAngle(0, Math.PI * 0.5, 5, 1000)).toBeCloseTo(Math.PI * 0.5, 6)
  })

  it('is a no-op when current already equals target', () => {
    expect(dampAngle(1.2, 1.2, 5, 0.1)).toBeCloseTo(1.2, 10)
  })
})

describe('rampToward', () => {
  it('increases by at most rate * dt per step', () => {
    const result = rampToward(0, 10, 5, 0.1)
    expect(result).toBeCloseTo(0.5, 10)
  })

  it('reaches target exactly, without overshooting, once within one step', () => {
    const result = rampToward(9.97, 10, 5, 0.1)
    expect(result).toBe(10)
  })

  it('ramps down toward a lower target the same way', () => {
    const result = rampToward(10, 0, 5, 0.1)
    expect(result).toBeCloseTo(9.5, 10)
  })

  it('reaches a fixed target in about rampTime seconds at rate = target / rampTime', () => {
    const target = 4
    const rampTime = 0.1
    const rate = target / rampTime
    const dt = 1 / 60
    let current = 0
    let elapsed = 0
    while (current < target) {
      current = rampToward(current, target, rate, dt)
      elapsed += dt
    }
    expect(elapsed).toBeCloseTo(rampTime, 1)
  })
})
