import { describe, expect, it } from 'vitest'
import {
  createWaveState,
  pickMonsterType,
  scoreForKill,
  stepWaves,
  waveClearBonus,
  WAVE_INTERMISSION,
  WAVE_MIN_SPAWN_INTERVAL,
  waveSize,
  waveSpawnInterval,
} from '../src/logic/waves.js'

describe('waveSize', () => {
  it('strictly increases with the wave number', () => {
    let previous = -Infinity
    for (let n = 1; n <= 20; n++) {
      const size = waveSize(n)
      expect(size).toBeGreaterThan(previous)
      previous = size
    }
  })
})

describe('waveSpawnInterval', () => {
  it('never drops below the minimum, even for very late waves', () => {
    for (let n = 1; n <= 200; n++) {
      expect(waveSpawnInterval(n)).toBeGreaterThanOrEqual(WAVE_MIN_SPAWN_INTERVAL)
    }
  })

  it('shrinks (or holds the floor) as the wave number increases', () => {
    expect(waveSpawnInterval(5)).toBeLessThanOrEqual(waveSpawnInterval(1))
  })
})

describe('pickMonsterType', () => {
  it('is only ever blobbo on wave 1', () => {
    for (let i = 0; i <= 10; i++) {
      expect(pickMonsterType(1, () => i / 10)).toBe('blobbo')
    }
  })

  it('never picks zippy or grumpus before they unlock', () => {
    for (let i = 0; i <= 10; i++) {
      expect(pickMonsterType(1, () => i / 10)).not.toBe('zippy')
      expect(pickMonsterType(1, () => i / 10)).not.toBe('grumpus')
      expect(pickMonsterType(2, () => i / 10)).not.toBe('grumpus')
    }
  })

  it('can pick all three types once grumpus unlocks', () => {
    const seen = new Set()
    for (let i = 0; i <= 100; i++) {
      seen.add(pickMonsterType(6, () => i / 100))
    }
    expect(seen).toEqual(new Set(['blobbo', 'zippy', 'grumpus']))
  })
})

describe('stepWaves', () => {
  const dt = 0.1
  const rng = () => 0 // deterministic: always rolls the first weighted type

  it('spawns nothing during the intermission', () => {
    let state = createWaveState()
    const allSpawns = []
    // 29 steps of 0.1s = 2.9s, safely under the 3s intermission.
    for (let i = 0; i < 29; i++) {
      const result = stepWaves(state, dt, 0, rng)
      state = result.state
      allSpawns.push(...result.spawns)
    }
    expect(allSpawns).toEqual([])
    expect(state.phase).toBe('intermission')
  })

  it('emits exactly waveSize(1) spawns, spaced by waveSpawnInterval(1), once spawning begins', () => {
    let state = createWaveState()
    const spawnTimes = []
    let clock = 0

    for (let i = 0; i < 400; i++) {
      const result = stepWaves(state, dt, 999, rng) // aliveCount is irrelevant until clearing
      state = result.state
      clock += dt
      for (let j = 0; j < result.spawns.length; j++) spawnTimes.push(clock)
      if (state.phase === 'clearing') break
    }

    expect(spawnTimes).toHaveLength(waveSize(1))
    // First spawn lands right when the intermission ends (within one dt
    // step of fixed-step quantization).
    expect(spawnTimes[0]).toBeCloseTo(WAVE_INTERMISSION, 0)
    // Subsequent spawns are spaced by waveSpawnInterval(1).
    for (let i = 1; i < spawnTimes.length; i++) {
      expect(spawnTimes[i] - spawnTimes[i - 1]).toBeCloseTo(waveSpawnInterval(1), 0)
    }
  })

  it('the clearing phase waits for aliveCount to reach 0 before clearing the wave', () => {
    const clearing = { waveNumber: 1, phase: 'clearing', phaseElapsed: 0, spawnedCount: waveSize(1) }

    const stillAlive = stepWaves(clearing, dt, 2, rng)
    expect(stillAlive.events).not.toContain('waveCleared')
    expect(stillAlive.state.phase).toBe('clearing')

    const allDead = stepWaves(stillAlive.state, dt, 0, rng)
    expect(allDead.events).toContain('waveCleared')
    expect(allDead.state.phase).toBe('intermission')
  })

  it('moves to a bigger wave after waveCleared', () => {
    const clearing = { waveNumber: 3, phase: 'clearing', phaseElapsed: 0, spawnedCount: waveSize(3) }
    const result = stepWaves(clearing, dt, 0, rng)
    expect(result.state.waveNumber).toBe(4)
    expect(waveSize(result.state.waveNumber)).toBeGreaterThan(waveSize(3))
  })
})

describe('scoreForKill', () => {
  it('gives each monster type its own point value', () => {
    expect(scoreForKill('blobbo')).toBe(100)
    expect(scoreForKill('zippy')).toBe(75)
    expect(scoreForKill('grumpus')).toBe(150)
  })

  it('falls back to 0 for an unknown type', () => {
    expect(scoreForKill('nonsense')).toBe(0)
  })
})

describe('waveClearBonus', () => {
  it('scales with the wave number', () => {
    expect(waveClearBonus(1)).toBe(250)
    expect(waveClearBonus(4)).toBe(1000)
  })
})
