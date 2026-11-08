import { describe, expect, it } from 'vitest'
import { JUMP_GRAVITY, JUMP_VELOCITY, createJumpState, isAirborne, stepJump } from '../src/logic/jump.js'

const run = (state, want, seconds, dt = 1 / 60) => {
  let s = state
  let peak = 0
  let landed = false
  for (let t = 0; t < seconds; t += dt) {
    const r = stepJump(s, want && t === 0, dt)
    s = r.state
    peak = Math.max(peak, s.y)
    landed ||= r.landed
  }
  return { s, peak, landed }
}

describe('jump', () => {
  it('stays on the ground until you press jump', () => {
    const r = stepJump(createJumpState(), false, 1 / 60)
    expect(r.state).toEqual({ y: 0, vy: 0 })
    expect(r.jumped).toBe(false)
  })

  it('rises, peaks near v^2/2g, and lands', () => {
    const { s, peak, landed } = run(createJumpState(), true, 1.5)
    expect(peak).toBeCloseTo((JUMP_VELOCITY ** 2) / (2 * JUMP_GRAVITY), 0)
    expect(landed).toBe(true)
    expect(s.y).toBe(0)
    expect(isAirborne(s)).toBe(false)
  })

  it('cannot jump again in mid-air', () => {
    let s = stepJump(createJumpState(), true, 1 / 60).state
    const second = stepJump(s, true, 1 / 60)
    expect(second.jumped).toBe(false)
    expect(second.state.vy).toBeLessThan(s.vy)
  })

  it('can jump again right after landing', () => {
    const { s } = run(createJumpState(), true, 1.5)
    expect(stepJump(s, true, 1 / 60).jumped).toBe(true)
  })
})
