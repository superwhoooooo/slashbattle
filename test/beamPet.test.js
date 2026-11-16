import { describe, expect, it } from 'vitest'
import { PETS } from '../src/logic/items.js'
import { isFighter, isRanged, stepBeamCycle } from '../src/logic/petAI.js'

const run = (seconds, dt, hasTarget = () => true) => {
  let state
  let hits = 0
  const log = []
  for (let i = 0; i < Math.round(seconds / dt); i++) {
    const step = stepBeamCycle(state, dt, hasTarget(i * dt), PETS.dylan)
    state = step.state
    hits += step.hits
    log.push({ t: (i + 1) * dt, phase: state.phase, hits })
  }
  return { state, hits, log }
}

describe('Dylan, the beam pet', () => {
  it('is a ranged fighter dealing 5 damage every 0.5 s, on 5 s, off 1.825 s', () => {
    const d = PETS.dylan
    expect(d.kind).toBe('beam')
    expect(isRanged(d) && isFighter(d)).toBe(true)
    expect([d.damage, d.beamTick, d.beamOn, d.beamOff]).toEqual([5, 0.5, 5, 1.825])
  })

  it('hits 10 times in a 5 s beam, then rests 1.825 s before the next', () => {
    const { log } = run(8, 0.05)
    const at = (t) => log.find((e) => Math.abs(e.t - t) < 1e-6)
    expect(at(4.95).phase).toBe('on')
    expect(at(5).hits).toBe(10)
    expect(at(5.05).phase).toBe('off')
    expect(at(6.8).phase).toBe('off')
    expect(at(6.8).hits).toBe(10)
    // A new beam starts on the next step after the rest, first hit at once.
    expect(run(6.9, 0.05).hits).toBe(11)
  })

  it('does not start without an enemy in range, and holds fire if the target leaves mid-beam', () => {
    expect(run(3, 0.1, () => false).hits).toBe(0)
    const { hits, state } = run(5, 0.1, (t) => t < 1 || t >= 3)
    expect(hits).toBeLessThan(10)
    expect(hits).toBeGreaterThan(4)
    expect(state.phase).toBe('off')
  })

  it('works at a coarse frame rate too', () => {
    expect(run(5, 1 / 30).hits).toBe(10)
  })
})
