import { describe, expect, it } from 'vitest'
import {
  clampToPlatform,
  edgeSpawnPoint,
  isOnPlatform,
  randomPointOnPlatform,
  resolveArenaMove,
} from '../src/logic/arena.js'

describe('isOnPlatform', () => {
  it('is true at the center', () => {
    expect(isOnPlatform({ x: 0, z: 0 }, 16)).toBe(true)
  })

  it('is true right at the edge', () => {
    expect(isOnPlatform({ x: 16, z: 0 }, 16)).toBe(true)
  })

  it('is false just past the edge', () => {
    expect(isOnPlatform({ x: 16.01, z: 0 }, 16)).toBe(false)
  })

  it('is false far outside the platform', () => {
    expect(isOnPlatform({ x: 50, z: 50 }, 16)).toBe(false)
  })
})

describe('resolveArenaMove', () => {
  const radius = 0.3

  it('moves freely across open platform with no obstacles', () => {
    const result = resolveArenaMove({ x: 0, z: 0 }, { x: 1, z: 2 }, radius, [])
    expect(result).toEqual({ x: 1, z: 2 })
  })

  it('is not clamped to the platform edge -- falling off is allowed', () => {
    const result = resolveArenaMove({ x: 15, z: 0 }, { x: 10, z: 0 }, radius, [])
    expect(result).toEqual({ x: 25, z: 0 })
  })

  it('blocks (pushes out from) movement straight into an obstacle', () => {
    const obstacles = [{ x: 5, z: 0, radius: 1 }]
    const result = resolveArenaMove({ x: 3, z: 0 }, { x: 1, z: 0 }, radius, obstacles)
    // Moving from x=3 to x=4 would land within radius+obstacleRadius=1.3
    // of the obstacle at x=5, so the x axis is blocked.
    expect(result.x).toBe(3)
    expect(result.z).toBe(0)
  })

  it('slides along an obstacle when moving diagonally into it', () => {
    const obstacles = [{ x: 5, z: 0, radius: 1 }]
    const result = resolveArenaMove({ x: 3.7, z: 0 }, { x: 0.5, z: 0.5 }, radius, obstacles)
    // The x component is blocked (too close to the obstacle) but the z
    // component, which doesn't approach it, still applies.
    expect(result.x).toBe(3.7)
    expect(result.z).toBeCloseTo(0.5)
  })
})

describe('clampToPlatform', () => {
  it('leaves a point inside maxRadius unchanged', () => {
    expect(clampToPlatform({ x: 3, z: 4 }, 16)).toEqual({ x: 3, z: 4 })
  })

  it('pulls a point beyond maxRadius back onto the platform, same direction', () => {
    const result = clampToPlatform({ x: 30, z: 0 }, 15)
    expect(result.x).toBeCloseTo(15)
    expect(result.z).toBeCloseTo(0)
  })
})

// A tiny deterministic PRNG (so "many seeds" doesn't mean Math.random).
function createSeededRng(seed) {
  let state = seed + 1
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff
    return state / 0x7fffffff
  }
}

describe('randomPointOnPlatform', () => {
  it('stays within radius minus margin across many seeds', () => {
    for (let seed = 0; seed < 200; seed++) {
      const point = randomPointOnPlatform(createSeededRng(seed), 16, 1.5)
      expect(Math.hypot(point.x, point.z)).toBeLessThanOrEqual(16 - 1.5 + 1e-9)
    }
  })
})

describe('edgeSpawnPoint', () => {
  it('lies at the given inward margin from the edge', () => {
    const point = edgeSpawnPoint(() => 0.25, 16, 1)
    expect(Math.hypot(point.x, point.z)).toBeCloseTo(15, 5)
  })

  it('lies near the edge across a range of angles', () => {
    for (let i = 0; i < 20; i++) {
      const point = edgeSpawnPoint(() => i / 20, 16, 1)
      expect(Math.hypot(point.x, point.z)).toBeCloseTo(15, 5)
      expect(isOnPlatform(point, 16)).toBe(true)
    }
  })
})
