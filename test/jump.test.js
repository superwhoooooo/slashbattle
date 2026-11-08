import { describe, expect, it } from 'vitest'
import { GLIDE_SINK, JUMP_GRAVITY, JUMP_VELOCITY, createJumpState, isAirborne, isGliding, stepJump } from '../src/logic/jump.js'

const run = (state, seconds, { ground = 0, presses = [] } = {}, dt = 1 / 60) => {
  let s = state
  let peak = 0
  let landed = false
  let i = 0
  for (let t = 0; t < seconds; t += dt, i++) {
    const r = stepJump(s, presses.includes(i), dt, ground)
    s = r.state
    peak = Math.max(peak, r.height)
    landed ||= r.landed
  }
  return { s, peak, landed }
}

describe('jump', () => {
  it('stays on the ground until you press jump', () => {
    const r = stepJump(createJumpState(), false, 1 / 60, 5)
    expect(r.state.alt).toBe(5)
    expect(r.jumped).toBe(false)
    expect(isAirborne(r.state)).toBe(false)
  })

  it('rises, peaks near v^2/2g, and lands', () => {
    const { s, peak, landed } = run(createJumpState(), 1.5, { presses: [0] })
    expect(peak).toBeCloseTo((JUMP_VELOCITY ** 2) / (2 * JUMP_GRAVITY), 0)
    expect(landed).toBe(true)
    expect(isAirborne(s)).toBe(false)
  })

  it('a second press in the air opens the paraglider instead of jumping again', () => {
    const s = stepJump(createJumpState(), true, 1 / 60).state
    const second = stepJump(s, true, 1 / 60)
    expect(second.jumped).toBe(false)
    expect(second.opened).toBe(true)
    expect(isGliding(second.state)).toBe(true)
  })

  it('a third press folds it again', () => {
    let s = stepJump(createJumpState(), true, 1 / 60).state
    s = stepJump(s, true, 1 / 60).state
    const third = stepJump(s, true, 1 / 60)
    expect(third.closed).toBe(true)
    expect(isGliding(third.state)).toBe(false)
  })

  it('under the glider you sink slowly and steadily, far slower than a free fall', () => {
    // Launch from a 30-high hilltop (altitude 30), open the glider, and sink.
    let s = { alt: 30, vy: 0, air: true, gliding: false }
    s = stepJump(s, true, 1 / 60, 0).state
    for (let i = 0; i < 120; i++) s = stepJump(s, false, 1 / 60, 0).state
    expect(s.vy).toBeCloseTo(-GLIDE_SINK, 5)
    expect(s.alt).toBeGreaterThan(30 - GLIDE_SINK * 2.2)
  })

  it('lands on higher ground it glides onto, and can then jump again', () => {
    let s = { alt: 12, vy: -GLIDE_SINK, air: true, gliding: true }
    for (let i = 0; i < 200 && s.air; i++) s = stepJump(s, false, 1 / 60, 10).state
    expect(s.air).toBe(false)
    expect(s.gliding).toBe(false)
    expect(s.alt).toBe(10)
    expect(stepJump(s, true, 1 / 60, 10).jumped).toBe(true)
  })

  it('rides the ground up and down while walking', () => {
    let s = createJumpState()
    s = stepJump(s, false, 1 / 60, 4).state
    s = stepJump(s, false, 1 / 60, 2).state
    expect(s.alt).toBe(2)
  })
})
