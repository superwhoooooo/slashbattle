import { describe, expect, it } from 'vitest'
import { jellyOffset, springStep } from '../src/logic/jelly.js'

describe('springStep', () => {
  it('converges to the target over many small steps', () => {
    let state = { value: 0, velocity: 0 }
    for (let i = 0; i < 300; i++) {
      state = springStep(state, 1, 120, 14, 1 / 60)
    }
    expect(state.value).toBeCloseTo(1, 2)
    expect(state.velocity).toBeCloseTo(0, 1)
  })

  it('overshoots the target when damping is low', () => {
    let state = { value: 0, velocity: 0 }
    let maxValue = 0
    for (let i = 0; i < 120; i++) {
      state = springStep(state, 1, 200, 2, 1 / 60)
      maxValue = Math.max(maxValue, state.value)
    }
    expect(maxValue).toBeGreaterThan(1)
  })

  it('stays stable (finite, non-NaN) at a large dt', () => {
    let state = { value: 0, velocity: 0 }
    for (let i = 0; i < 50; i++) {
      state = springStep(state, 1, 120, 14, 0.1)
      expect(Number.isFinite(state.value)).toBe(true)
      expect(Number.isFinite(state.velocity)).toBe(true)
    }
    // Still broadly converging, not blowing up.
    expect(state.value).toBeCloseTo(1, 1)
  })

  it('does not mutate the state object passed in', () => {
    const state = { value: 0, velocity: 0 }
    springStep(state, 1, 120, 14, 1 / 60)
    expect(state).toEqual({ value: 0, velocity: 0 })
  })
})

describe('jellyOffset', () => {
  it('is deterministic: identical inputs give identical outputs', () => {
    const params = { idleAmplitude: 0.05, idleSpeed: 2, idlePhase: 0.3, bulge: 0.1, bulgeDirX: 0, bulgeDirZ: 1, hit: 0.2 }
    const a = jellyOffset(0.4, 0.6, -0.3, 1.25, params)
    const b = jellyOffset(0.4, 0.6, -0.3, 1.25, params)
    expect(a).toEqual(b)
  })

  it('gives the same offset to two different vertices that share an original position (no tearing)', () => {
    // Flat shading duplicates vertices per face; two "different" vertex
    // indices at the same original position must deform identically.
    const params = { idleAmplitude: 0.05, idleSpeed: 2, idlePhase: 0, bulge: 0.2, bulgeDirX: 1, bulgeDirZ: 0, hit: -0.1 }
    const vertexA = jellyOffset(0.5, 0.2, 0.1, 3, params)
    const vertexB = jellyOffset(0.5, 0.2, 0.1, 3, params)
    expect(vertexA).toEqual(vertexB)
  })

  it('is the zero vector at the origin with no hit/inflate', () => {
    const params = { idleAmplitude: 0.05, idleSpeed: 2, bulge: 0.3, bulgeDirX: 1, bulgeDirZ: 0, hit: 0 }
    expect(jellyOffset(0, 0, 0, 5, params)).toEqual([0, 0, 0])
  })

  it('flattens vertically and widens for a positive hit value', () => {
    const [dx, dy, dz] = jellyOffset(1, 1, 0, 0, { hit: 0.5 })
    expect(dy).toBeLessThan(0) // squashed down
    expect(dx).toBeGreaterThan(0) // widened out
  })

  it('inflates outward in every axis for a negative hit value', () => {
    const [dx, dy, dz] = jellyOffset(1, 1, 1, 0, { hit: -0.5 })
    expect(dx).toBeGreaterThan(0)
    expect(dy).toBeGreaterThan(0)
    expect(dz).toBeGreaterThan(0)
  })
})
