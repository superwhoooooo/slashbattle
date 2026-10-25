import { describe, expect, it } from 'vitest'
import {
  allocateSlots,
  isParticleDead,
  particleAlpha,
  particleScale,
  stepParticle,
} from '../src/logic/particles.js'

describe('stepParticle', () => {
  it('accelerates downward under gravity', () => {
    const particle = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, age: 0 }
    const next = stepParticle(particle, 1, 10, 1)
    expect(next.vy).toBe(-10)
    expect(next.y).toBe(-10)
  })

  it('scales velocity down each tick under drag', () => {
    const particle = { x: 0, y: 0, z: 0, vx: 2, vy: 0, vz: 0, age: 0 }
    const next = stepParticle(particle, 1, 0, 0.5)
    expect(next.vx).toBe(1)
  })

  it('advances age by dt', () => {
    const particle = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, age: 1 }
    const next = stepParticle(particle, 0.5, 0, 1)
    expect(next.age).toBe(1.5)
  })

  it('does not mutate the particle passed in', () => {
    const particle = { x: 0, y: 0, z: 0, vx: 1, vy: 1, vz: 1, age: 0 }
    stepParticle(particle, 1, 10, 0.9)
    expect(particle).toEqual({ x: 0, y: 0, z: 0, vx: 1, vy: 1, vz: 1, age: 0 })
  })
})

describe('particleAlpha / particleScale', () => {
  it('is 1 at birth and 0 at the end of life', () => {
    expect(particleAlpha(0, 1)).toBe(1)
    expect(particleAlpha(1, 1)).toBe(0)
    expect(particleScale(0, 1)).toBe(1)
    expect(particleScale(1, 1)).toBe(0)
  })

  it('fades linearly in between', () => {
    expect(particleAlpha(0.5, 1)).toBeCloseTo(0.5)
  })

  it('clamps past the end of life instead of going negative', () => {
    expect(particleAlpha(2, 1)).toBe(0)
  })

  it('is 0 for a zero or negative life', () => {
    expect(particleAlpha(0, 0)).toBe(0)
  })
})

describe('isParticleDead', () => {
  it('is false before the end of life and true at/after it', () => {
    expect(isParticleDead(0.9, 1)).toBe(false)
    expect(isParticleDead(1, 1)).toBe(true)
    expect(isParticleDead(1.1, 1)).toBe(true)
  })
})

describe('allocateSlots', () => {
  it('returns count consecutive indices starting at the cursor', () => {
    const { indices, nextCursor } = allocateSlots(2, 10, 3)
    expect(indices).toEqual([2, 3, 4])
    expect(nextCursor).toBe(5)
  })

  it('wraps around the pool size (ring buffer)', () => {
    const { indices, nextCursor } = allocateSlots(8, 10, 4)
    expect(indices).toEqual([8, 9, 0, 1])
    expect(nextCursor).toBe(2)
  })

  it('wraps the cursor itself back to 0 when it lands exactly on poolSize', () => {
    const { nextCursor } = allocateSlots(8, 10, 2)
    expect(nextCursor).toBe(0)
  })

  it('never allocates more slots than the pool has, even if count exceeds it', () => {
    const { indices } = allocateSlots(0, 5, 12)
    expect(indices).toHaveLength(12)
    for (const index of indices) {
      expect(index).toBeGreaterThanOrEqual(0)
      expect(index).toBeLessThan(5)
    }
  })
})
