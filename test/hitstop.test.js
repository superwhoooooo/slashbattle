import { describe, expect, it } from 'vitest'
import { createHitstopState, stepHitstop, triggerHitstop } from '../src/logic/hitstop.js'

describe('createHitstopState', () => {
  it('starts with no freeze pending', () => {
    expect(createHitstopState()).toEqual({ remaining: 0 })
  })
})

describe('triggerHitstop', () => {
  it('extends remaining to the triggered duration from zero', () => {
    const state = triggerHitstop(createHitstopState(), 0.08)
    expect(state.remaining).toBe(0.08)
  })

  it('never stacks additively: a repeated trigger does not add on top', () => {
    let state = triggerHitstop(createHitstopState(), 0.08)
    state = triggerHitstop(state, 0.08)
    expect(state.remaining).toBe(0.08)
  })

  it('extends to the longer of the two durations (e.g. a kill landing mid-freeze)', () => {
    let state = triggerHitstop(createHitstopState(), 0.045)
    state = triggerHitstop(state, 0.12)
    expect(state.remaining).toBe(0.12)
  })

  it('never shortens an already-longer freeze', () => {
    let state = triggerHitstop(createHitstopState(), 0.12)
    state = triggerHitstop(state, 0.045)
    expect(state.remaining).toBe(0.12)
  })
})

describe('stepHitstop', () => {
  it('returns scale 1 and leaves remaining at 0 when no freeze is pending', () => {
    const { state, scale } = stepHitstop(createHitstopState(), 1 / 60)
    expect(scale).toBe(1)
    expect(state.remaining).toBe(0)
  })

  it('returns scale 0 and counts down while still inside the freeze', () => {
    const triggered = triggerHitstop(createHitstopState(), 0.08)
    const { state, scale } = stepHitstop(triggered, 0.02)
    expect(scale).toBe(0)
    expect(state.remaining).toBeCloseTo(0.06, 5)
  })

  it('returns the leftover fraction of dt the moment the freeze ends partway through the frame', () => {
    const triggered = triggerHitstop(createHitstopState(), 0.01)
    const { state, scale } = stepHitstop(triggered, 0.016)
    expect(scale).toBeCloseTo(0.375, 5)
    expect(state.remaining).toBe(0)
  })

  it('stays unfrozen on the next tick once a freeze has fully elapsed', () => {
    let state = triggerHitstop(createHitstopState(), 0.01)
    ;({ state } = stepHitstop(state, 0.016))
    const second = stepHitstop(state, 0.016)
    expect(second.scale).toBe(1)
    expect(second.state.remaining).toBe(0)
  })

  it('consumes the whole dt as frozen when remaining exactly equals it', () => {
    const triggered = triggerHitstop(createHitstopState(), 0.02)
    const { state, scale } = stepHitstop(triggered, 0.02)
    expect(scale).toBe(0)
    expect(state.remaining).toBe(0)
  })
})
