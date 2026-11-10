import { describe, expect, it } from 'vitest'
import { WALK_AMP, createMotionState, stepMotion } from '../src/logic/creatureMotion.js'

const dt = 1 / 60
// Walks a creature forward (+z, facing 0) at `speed` for `seconds`; returns the last frame's output.
function walk(state, speed, seconds, reach = 0.3, facing = 0) {
  let out
  for (let t = 0; t < seconds; t += dt) out = stepMotion(state, { dx: Math.sin(facing) * speed * dt, dz: Math.cos(facing) * speed * dt, dt, facing, reach })
  return out
}

describe('creature motion (Shardfall-style)', () => {
  it('steps in proportion to the ground covered, so feet do not skate', () => {
    const slow = createMotionState(0)
    const fast = createMotionState(0)
    walk(slow, 1, 2)
    walk(fast, 2, 2)
    expect(fast.phase / slow.phase).toBeGreaterThan(1.8)
    expect(fast.phase / slow.phase).toBeLessThan(2.2)
  })

  it('longer legs take fewer steps for the same distance', () => {
    const short = createMotionState(0)
    const long = createMotionState(0)
    walk(short, 2, 2, 0.2)
    walk(long, 2, 2, 0.4)
    expect(long.phase).toBeLessThan(short.phase * 0.6)
  })

  it('tops out at a fast scuttle for tiny, quick creatures', () => {
    const s = createMotionState(0)
    walk(s, 30, 1, 0.01)
    expect(s.phase).toBeLessThan(35)
  })

  it('runs the step cycle backwards when walking backwards', () => {
    const s = createMotionState(5)
    for (let i = 0; i < 60; i++) stepMotion(s, { dx: 0, dz: -2 * dt, dt, facing: 0, reach: 0.3 })
    expect(s.phase).toBeLessThan(5)
  })

  it('treats a teleport as no stride', () => {
    const s = createMotionState(0)
    const out = stepMotion(s, { dx: 10, dz: 0, dt, facing: 0, reach: 0.3 })
    expect(out.phase).toBe(0)
    expect(s.speed).toBe(0)
  })

  it('swings legs fully at a walk and rests them when still', () => {
    const s = createMotionState(0)
    expect(walk(s, 3, 1).amp).toBeCloseTo(WALK_AMP, 2)
    const still = walk(s, 0, 1)
    expect(still.amp).toBeLessThan(0.05)
    expect(still.bob).toBeCloseTo(0, 2)
  })

  it('bobs with the stride when it has legs, and crawls with a pulse when it has none', () => {
    const legs = createMotionState(0.3)
    const blob = createMotionState(0.3)
    let maxBob = 0
    let maxCrawl = 0
    for (let i = 0; i < 120; i++) {
      maxBob = Math.max(maxBob, Math.abs(walk(legs, 2, dt, 0.3).bob))
      const c = walk(blob, 2, dt, 0)
      maxCrawl = Math.max(maxCrawl, Math.abs(c.crawl))
      expect(c.bob).toBe(0)
    }
    expect(maxBob).toBeGreaterThan(0.02)
    expect(maxCrawl).toBeGreaterThan(0.04)
  })

  it('leans into a run and banks into a turn', () => {
    const s = createMotionState(0)
    const run = walk(s, 4, 1)
    expect(run.lean).toBeGreaterThan(0.05)
    let out
    let facing = 0
    for (let i = 0; i < 30; i++) {
      facing += 2 * dt // turning left
      out = stepMotion(s, { dx: Math.sin(facing) * 4 * dt, dz: Math.cos(facing) * 4 * dt, dt, facing, reach: 0.3 })
    }
    expect(Math.abs(out.bank)).toBeGreaterThan(0.03)
    expect(Math.abs(out.bank)).toBeLessThanOrEqual(0.14)
  })

  it('breathes when idle, not mid-run', () => {
    const s = createMotionState(0)
    let idle = 0
    for (let i = 0; i < 200; i++) idle = Math.max(idle, Math.abs(stepMotion(s, { dt, reach: 0.3 }).breath))
    expect(idle).toBeGreaterThan(0.01)
    const run = walk(createMotionState(0), 4, 1)
    expect(Math.abs(run.breath)).toBeLessThan(0.002)
  })
})
