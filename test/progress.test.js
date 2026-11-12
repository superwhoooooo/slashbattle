import { describe, expect, it } from 'vitest'
import { DIFFICULTIES, difficultyById, runPayout } from '../src/logic/difficulty.js'
import { ACTIVE_CONTRACTS, CONTRACT_TEMPLATES, MASTERY_XP, createProgress, makeContract, masteryBar, masteryLevel, normalizeProgress, progressEvent } from '../src/logic/progress.js'
import { setWaveTuning, waveSize, waveSpawnInterval } from '../src/logic/waves.js'
import { HEROES, broadsideSpots, grantSkin, isBehind, ownsSkin } from '../src/logic/heroes.js'
import { createProfile } from '../src/logic/profile.js'

describe('difficulty', () => {
  it('relax is easier than normal, hard is harder and pays more', () => {
    const { relax, normal, hard } = DIFFICULTIES
    for (const key of ['monsterHp', 'bossHp', 'damageTaken', 'waveSize']) {
      expect(relax[key]).toBeLessThan(normal[key])
      expect(hard[key]).toBeGreaterThan(normal[key])
    }
    expect(relax.spawnInterval).toBeGreaterThan(1)
    expect(hard.spawnInterval).toBeLessThan(1)
    expect(hard.reward).toBeGreaterThan(1)
    expect(difficultyById('nonsense').id).toBe('normal')
  })

  it('wave tuning scales size and arrival speed, and normal leaves them alone', () => {
    const size = waveSize(5)
    const interval = waveSpawnInterval(5)
    setWaveTuning({ size: 1.35, interval: 0.8 })
    expect(waveSize(5)).toBeGreaterThan(size)
    expect(waveSpawnInterval(5)).toBeLessThan(interval)
    setWaveTuning({ size: 0.7, interval: 1.4 })
    expect(waveSize(1)).toBeGreaterThanOrEqual(2)
    setWaveTuning()
    expect(waveSize(5)).toBe(size)
  })

  it('the checkout tip grows with the run and the difficulty', () => {
    const run = { wave: 10, score: 20000, bosses: 2 }
    expect(runPayout({ ...run, difficulty: 'normal' })).toBe(36 + 50 + 40)
    expect(runPayout({ ...run, difficulty: 'hard' })).toBeGreaterThan(runPayout(run))
    expect(runPayout({ ...run, difficulty: 'relax' })).toBeLessThan(runPayout(run))
    expect(runPayout({ wave: 1, score: 0 })).toBe(0)
  })
})

describe('contracts', () => {
  it('a new profile has three open contracts', () => {
    const p = createProgress()
    expect(p.contracts).toHaveLength(ACTIVE_CONTRACTS)
    expect(new Set(p.contracts.map((c) => c.id)).size).toBe(ACTIVE_CONTRACTS)
  })

  it('count contracts add up, finish, pay, and get replaced', () => {
    let progress = { ...createProgress(), contracts: [makeContract('ringouts', 0), makeContract('kills', 0), makeContract('reach', 0)] }
    const goal = progress.contracts[0].goal
    let bank = 0
    for (let i = 0; i < goal; i++) {
      const r = progressEvent(progress, { type: 'kill', monster: 'blobbo', trick: 'checkout' }, { rng: () => 0.5 })
      progress = r.progress
      bank += r.bank
    }
    expect(progress.contractsDone).toBe(1)
    expect(progress.contracts).toHaveLength(ACTIVE_CONTRACTS)
    expect(progress.contracts.some((c) => c.id === 'ringouts')).toBe(false)
    expect(bank).toBeGreaterThanOrEqual(makeContract('ringouts', 0).reward)
    expect(progress.contracts.find((c) => c.id === 'kills').progress).toBe(goal)
  })

  it('best contracts take the best single value; hard pays more', () => {
    const progress = { ...createProgress(), contracts: [makeContract('reach', 0), makeContract('kills', 0), makeContract('chests', 0)] }
    const low = progressEvent(progress, { type: 'wave', value: 3 })
    expect(low.progress.contracts[0].progress).toBe(3)
    expect(progressEvent(low.progress, { type: 'wave', value: 2 }).progress.contracts[0].progress).toBe(3)
    const normal = progressEvent(progress, { type: 'wave', value: 99 }, { difficulty: 'normal' })
    const hard = progressEvent(progress, { type: 'wave', value: 99 }, { difficulty: 'hard' })
    expect(hard.bank).toBeGreaterThan(normal.bank)
  })

  it('every template is reachable by some event', () => {
    for (const tpl of CONTRACT_TEMPLATES) expect(makeContract(tpl.id, 0).goal).toBeGreaterThan(0)
  })

  it('normalize keeps good saves and repairs junk', () => {
    expect(normalizeProgress(null)).toEqual(createProgress())
    const fixed = normalizeProgress({ contracts: [{ id: 'kills', tier: 1, progress: 9999 }, { id: 'nope' }], mastery: { guest: 50, bad: -3 }, records: { kills: 'x', runs: 4 } })
    expect(fixed.contracts).toHaveLength(ACTIVE_CONTRACTS)
    expect(fixed.contracts[0].progress).toBe(fixed.contracts[0].goal)
    expect(fixed.mastery).toEqual({ guest: 50 })
    expect(fixed.records.runs).toBe(4)
    expect(fixed.records.kills).toBe(0)
  })
})

describe('mastery', () => {
  it('levels follow the xp table', () => {
    expect(masteryLevel(0)).toBe(1)
    expect(masteryLevel(MASTERY_XP[1])).toBe(2)
    expect(masteryLevel(1e9)).toBe(MASTERY_XP.length)
    expect(masteryBar(1e9).span).toBe(0)
  })

  it('kills level the hero you play and pay crystals and skins', () => {
    let progress = createProgress()
    const ups = []
    for (let i = 0; i < 40; i++) {
      const r = progressEvent(progress, { type: 'boss' }, { hero: 'chef' })
      progress = r.progress
      ups.push(...r.levelUps)
    }
    expect(masteryLevel(progress.mastery.chef)).toBeGreaterThanOrEqual(7)
    expect(ups.find((u) => u.level === 4).skin).toBe(1)
    expect(ups.every((u) => u.reward > 0)).toBe(true)
    expect(progress.records.bosses).toBe(40)
    const profile = grantSkin({ ...createProfile(), heroesOwned: ['chef'] }, 'chef', 1)
    expect(ownsSkin(profile, 'chef', HEROES.find((h) => h.id === 'chef').skins[1].id)).toBe(true)
  })
})

describe('new hero traits', () => {
  it('backstab: behind is behind', () => {
    // A monster at the origin facing +z (rotation 0).
    expect(isBehind({ x: 0, z: 0 }, 0, { x: 0, z: -3 })).toBe(true)
    expect(isBehind({ x: 0, z: 0 }, 0, { x: 0, z: 3 })).toBe(false)
    expect(isBehind({ x: 0, z: 0 }, Math.PI, { x: 0, z: 3 })).toBe(true)
  })

  it('broadside marches away from the shooter', () => {
    const spots = broadsideSpots({ x: 0, z: 0 }, { x: 0, z: 5 })
    expect(spots).toHaveLength(3)
    expect(spots[0]).toEqual({ x: 0, z: 5 })
    expect(spots[2].z).toBeCloseTo(10)
  })
})
