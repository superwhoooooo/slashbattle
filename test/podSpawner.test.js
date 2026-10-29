import { describe, expect, it } from 'vitest'
import { createPodSpawnerState, pickPodSpawnPoint, stepPodSpawner } from '../src/logic/podSpawner.js'

// A tiny deterministic PRNG (so "many seeds" doesn't mean Math.random).
function createSeededRng(seed) {
  let state = seed + 1
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff
    return state / 0x7fffffff
  }
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z)
}

describe('pickPodSpawnPoint', () => {
  it('stays within arenaRadius - margin of the center', () => {
    for (let seed = 0; seed < 100; seed++) {
      const point = pickPodSpawnPoint(createSeededRng(seed), { arenaRadius: 48, margin: 4 })
      expect(point).not.toBeNull()
      expect(Math.hypot(point.x, point.z)).toBeLessThanOrEqual(48 - 4 + 1e-9)
    }
  })

  it('stays at least minSpacing from every existing pod', () => {
    const existingPods = [{ x: 0, z: 0 }, { x: 20, z: 0 }, { x: -15, z: 10 }]
    for (let seed = 0; seed < 100; seed++) {
      const point = pickPodSpawnPoint(createSeededRng(seed), {
        arenaRadius: 48,
        margin: 4,
        existingPods,
        minSpacing: 10,
      })
      if (point === null) continue // ran out of attempts, acceptable
      for (const pod of existingPods) expect(distance(point, pod)).toBeGreaterThanOrEqual(10 - 1e-9)
    }
  })

  it('stays at least minPlayerDistance from the player', () => {
    const playerPos = { x: 5, z: 5 }
    for (let seed = 0; seed < 100; seed++) {
      const point = pickPodSpawnPoint(createSeededRng(seed), {
        arenaRadius: 48,
        margin: 4,
        playerPos,
        minPlayerDistance: 4,
      })
      expect(point).not.toBeNull()
      expect(distance(point, playerPos)).toBeGreaterThanOrEqual(4 - 1e-9)
    }
  })

  it('stays at least monsterAvoidRadius from every monster', () => {
    const monsterPositions = [{ x: 10, z: 10 }, { x: -10, z: -10 }]
    for (let seed = 0; seed < 100; seed++) {
      const point = pickPodSpawnPoint(createSeededRng(seed), {
        arenaRadius: 48,
        margin: 4,
        monsterPositions,
        monsterAvoidRadius: 3,
      })
      expect(point).not.toBeNull()
      for (const monster of monsterPositions) expect(distance(point, monster)).toBeGreaterThanOrEqual(3 - 1e-9)
    }
  })

  it('stays at least obstacle.radius + obstacleMargin from every obstacle (prop)', () => {
    const obstacles = [{ x: 8, z: 0, radius: 1.1 }, { x: -20, z: 15, radius: 0.5 }]
    for (let seed = 0; seed < 100; seed++) {
      const point = pickPodSpawnPoint(createSeededRng(seed), {
        arenaRadius: 48,
        margin: 4,
        obstacles,
        obstacleMargin: 0.75,
      })
      if (point === null) continue // ran out of attempts, acceptable
      for (const obstacle of obstacles) {
        expect(distance(point, obstacle)).toBeGreaterThanOrEqual(obstacle.radius + 0.75 - 1e-9)
      }
    }
  })

  it('returns null rather than a bad position when nothing fits', () => {
    // A tiny platform entirely covered by one existing pod's spacing
    // requirement -- no valid point exists.
    const point = pickPodSpawnPoint(createSeededRng(0), {
      arenaRadius: 5,
      margin: 0,
      existingPods: [{ x: 0, z: 0 }],
      minSpacing: 100,
      maxAttempts: 10,
    })
    expect(point).toBeNull()
  })

  it('is deterministic for a given seed', () => {
    const cfg = { arenaRadius: 48, margin: 4, playerPos: { x: 0, z: 0 }, minPlayerDistance: 4 }
    const a = pickPodSpawnPoint(createSeededRng(7), cfg)
    const b = pickPodSpawnPoint(createSeededRng(7), cfg)
    expect(a).toEqual(b)
  })
})

describe('stepPodSpawner', () => {
  it('never signals spawnNow while at or above maxActive', () => {
    const state = createPodSpawnerState()
    const result = stepPodSpawner(state, 100, 3, 3, [4, 10], createSeededRng(1))
    expect(result.spawnNow).toBe(false)
    expect(result.state.nextSpawnAt).toBeNull()
  })

  it('schedules a delay within [min, max] of now once below maxActive', () => {
    const state = createPodSpawnerState()
    const now = 50
    for (let seed = 0; seed < 50; seed++) {
      const result = stepPodSpawner(state, now, 1, 3, [4, 10], createSeededRng(seed))
      expect(result.spawnNow).toBe(false)
      expect(result.state.nextSpawnAt).toBeGreaterThanOrEqual(now + 4)
      expect(result.state.nextSpawnAt).toBeLessThanOrEqual(now + 10)
    }
  })

  it('spawns exactly once now reaches the scheduled time, then reschedules', () => {
    let state = { nextSpawnAt: 60 }
    const before = stepPodSpawner(state, 59.9, 1, 3, [4, 10], createSeededRng(2))
    expect(before.spawnNow).toBe(false)

    const at = stepPodSpawner(state, 60, 1, 3, [4, 10], createSeededRng(2))
    expect(at.spawnNow).toBe(true)
    expect(at.state.nextSpawnAt).toBeNull()
  })

  it('is deterministic for a given seed', () => {
    const state = createPodSpawnerState()
    const a = stepPodSpawner(state, 10, 0, 3, [4, 10], createSeededRng(3))
    const b = stepPodSpawner(state, 10, 0, 3, [4, 10], createSeededRng(3))
    expect(a).toEqual(b)
  })
})
