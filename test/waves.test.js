import { describe, expect, it } from 'vitest'
import {
  beginBossFight,
  createWaveState,
  currentBoss,
  isBossNext,
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

describe('boss rounds', () => {
  // Drives the controller until `eventName` fires (or gives up), clearing
  // every wave instantly so only the phase flow is under test.
  function runUntil(state, eventName) {
    let s = state
    const seen = []
    for (let i = 0; i < 5000; i++) {
      const alive = s.phase === 'clearing' || s.phase === 'bossFight' ? 0 : 1
      const out = stepWaves(s, 0.5, alive, () => 0.5)
      s = out.state
      seen.push(...out.events)
      if (out.events.includes(eventName)) return { state: s, events: seen }
    }
    throw new Error(`never saw ${eventName}`)
  }

  it('puts a boss after one regular wave, then two, then three', () => {
    let state = createWaveState(() => 0.5)
    const regularWavesBetweenBosses = []
    for (let boss = 0; boss < 3; boss++) {
      const before = state.waveNumber
      const intro = runUntil(state, 'bossIntro')
      const regular = intro.events.filter((e) => e === 'waveCleared').length
      regularWavesBetweenBosses.push(regular)
      expect(intro.state.phase).toBe('bossIntro')
      expect(intro.state.waveNumber).toBe(before + regular)
      state = beginBossFight(intro.state)
      state = runUntil(state, 'bossDefeated').state
      expect(state.phase).toBe('intermission')
    }
    expect(regularWavesBetweenBosses).toEqual([1, 2, 3])
  })

  it('waits in bossIntro until the cutscene starts the fight', () => {
    const intro = runUntil(createWaveState(() => 0.5), 'bossIntro').state
    let s = intro
    for (let i = 0; i < 50; i++) {
      const out = stepWaves(s, 1, 0, () => 0.5)
      expect(out.events).toEqual([])
      expect(out.spawns).toEqual([])
      s = out.state
    }
    expect(s.phase).toBe('bossIntro')
  })

  it('keeps the boss fight going while anything is still alive', () => {
    const fight = beginBossFight(runUntil(createWaveState(() => 0.5), 'bossIntro').state)
    const out = stepWaves(fight, 1, 3, () => 0.5)
    expect(out.state.phase).toBe('bossFight')
    expect(out.events).toEqual([])
  })

  it('announces the boss in the countdown before it and advances the boss each time', () => {
    const state = createWaveState(() => 0.5)
    expect(isBossNext(state)).toBe(false)
    const first = currentBoss(state)
    const afterFirst = runUntil(beginBossFight(runUntil(state, 'bossIntro').state), 'bossDefeated').state
    expect(afterFirst.bossesDefeated).toBe(1)
    expect(currentBoss(afterFirst).id).not.toBe(first.id)
  })

  it('scores a boss kill by its own value', () => {
    expect(scoreForKill('boss_gloop')).toBeGreaterThan(scoreForKill('grumpus'))
  })
})
