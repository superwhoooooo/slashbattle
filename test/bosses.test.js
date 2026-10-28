import { describe, expect, it } from 'vitest'
import {
  BOSSES,
  BOSS_COUNT,
  BOSS_SPECIALS,
  BOSS_MONSTER_TYPES,
  bossById,
  bossForFight,
  bossHpScale,
  shuffleBossOrder,
  stepSpecialTimer,
  wavesBeforeBoss,
} from '../src/logic/bosses.js'
import { MONSTER_TYPES } from '../src/config.js'

function createSeededRng(seed) {
  let state = seed + 1
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff
    return state / 0x7fffffff
  }
}

describe('BOSSES', () => {
  it('has seven distinct bosses, each with a name, goofy lines, and sane stats', () => {
    expect(BOSS_COUNT).toBe(7)
    expect(new Set(BOSSES.map((b) => b.id)).size).toBe(7)
    expect(new Set(BOSSES.map((b) => b.name)).size).toBe(7)
    for (const boss of BOSSES) {
      expect(boss.lines.length).toBeGreaterThanOrEqual(2)
      expect(boss.specials.length).toBeGreaterThanOrEqual(1)
      for (const name of boss.specials) expect(BOSS_SPECIALS[name]).toBeDefined()
      expect(boss.stats.hp).toBeGreaterThan(200)
      expect(boss.stats.radius).toBeGreaterThan(1)
      expect(boss.stats.attackRange).toBeGreaterThan(boss.stats.radius)
      expect(boss.stats.boss).toBe(true)
    }
  })

  it('is folded into MONSTER_TYPES so spawning/combat find boss stats by id', () => {
    for (const boss of BOSSES) expect(MONSTER_TYPES[boss.id]).toBe(BOSS_MONSTER_TYPES[boss.id])
    expect(bossById('boss_gloop').name).toBe('KING GLOOP')
    expect(bossById('boss_conefather').name).toBe('THE CONE FATHER')
    expect(bossById('blobbo')).toBeNull()
  })
})

describe('boss variety', () => {
  it('gives every boss a different body shape', () => {
    expect(new Set(BOSSES.map((b) => b.stats.shape)).size).toBe(7)
  })

  it('uses the shapes bodySurfaceDistance knows how to place a face on', () => {
    const known = ['sphere', 'tetrahedron', 'box', 'cylinder', 'cone', 'octahedron', 'dodecahedron']
    for (const boss of BOSSES) expect(known).toContain(boss.stats.shape)
  })

  it('does not give two bosses the same set of abilities', () => {
    expect(new Set(BOSSES.map((b) => [...b.specials].sort().join('+'))).size).toBe(7)
  })
})

describe('shuffleBossOrder / bossForFight', () => {
  it('is a permutation of all seven bosses, whatever the seed', () => {
    for (let seed = 0; seed < 20; seed++) {
      const order = shuffleBossOrder(createSeededRng(seed))
      expect([...order].sort()).toEqual([0, 1, 2, 3, 4, 5, 6])
    }
  })

  it('meets all seven different bosses before any repeat, then cycles', () => {
    const order = shuffleBossOrder(createSeededRng(3))
    const firstCycle = Array.from({ length: 7 }, (_, n) => bossForFight(order, n).id)
    expect(new Set(firstCycle).size).toBe(7)
    expect(bossForFight(order, 7).id).toBe(firstCycle[0])
  })
})

describe('wavesBeforeBoss / bossHpScale', () => {
  it('asks for one wave before the first boss, then one more each time', () => {
    expect([0, 1, 2, 3].map(wavesBeforeBoss)).toEqual([1, 2, 3, 4])
  })

  it('makes later boss fights tougher', () => {
    expect(bossHpScale(0)).toBe(1)
    expect(bossHpScale(7)).toBeGreaterThan(bossHpScale(3))
  })
})

describe('stepSpecialTimer', () => {
  it('counts down, fires at zero, and rewinds', () => {
    expect(stepSpecialTimer(5, 1, 8)).toEqual({ timer: 4, fire: false })
    expect(stepSpecialTimer(0.5, 1, 8)).toEqual({ timer: 8, fire: true })
  })
})
