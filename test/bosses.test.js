import { describe, expect, it } from 'vitest'
import {
  BOSSES,
  BOSS_BASE,
  BOSS_COUNT,
  BOSS_SPECIALS,
  BOSS_MONSTER_TYPES,
  bossById,
  bossForFight,
  bossEase,
  bossHpScale,
  bossDamageScale,
  bossCooldownScale,
  bossSpecialsFor,
  ORIGINAL_BOSS_COUNT,
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
  it('has distinct bosses, each with a name, goofy lines, and sane stats', () => {
    expect(BOSS_COUNT).toBeGreaterThanOrEqual(16) // the original 7 plus a boss version of every enemy
    expect(new Set(BOSSES.map((b) => b.id)).size).toBe(BOSS_COUNT)
    expect(new Set(BOSSES.map((b) => b.name)).size).toBe(BOSS_COUNT)
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
  it('uses every body shape across the bosses', () => {
    expect(new Set(BOSSES.map((b) => b.stats.shape)).size).toBe(7)
  })

  it('uses the shapes bodySurfaceDistance knows how to place a face on', () => {
    const known = ['sphere', 'tetrahedron', 'box', 'cylinder', 'cone', 'octahedron', 'dodecahedron']
    for (const boss of BOSSES) expect(known).toContain(boss.stats.shape)
  })

  it('does not give two bosses the same set of abilities', () => {
    expect(new Set(BOSSES.map((b) => [...b.specials].sort().join('+'))).size).toBe(BOSS_COUNT)
  })
})

describe('shuffleBossOrder / bossForFight', () => {
  it('is a permutation of all the bosses, whatever the seed', () => {
    for (let seed = 0; seed < 20; seed++) {
      const order = shuffleBossOrder(createSeededRng(seed))
      expect([...order].sort((a, b) => a - b)).toEqual(Array.from({ length: BOSS_COUNT }, (_, i) => i))
    }
  })

  it('always opens with one of the original seven', () => {
    for (let seed = 0; seed < 200; seed++) {
      expect(shuffleBossOrder(createSeededRng(seed))[0]).toBeLessThan(ORIGINAL_BOSS_COUNT)
    }
  })

  it('meets every different boss before any repeat, then cycles', () => {
    const order = shuffleBossOrder(createSeededRng(3))
    const firstCycle = Array.from({ length: BOSS_COUNT }, (_, n) => bossForFight(order, n).id)
    expect(new Set(firstCycle).size).toBe(BOSS_COUNT)
    expect(bossForFight(order, BOSS_COUNT).id).toBe(firstCycle[0])
  })
})

describe('wavesBeforeBoss / bossHpScale', () => {
  it('asks for one wave before the first boss, then one more each time', () => {
    expect([0, 1, 2, 3].map(wavesBeforeBoss)).toEqual([1, 2, 3, 4])
  })

  it('gives full strength from the very first boss fight', () => {
    for (const n of [0, 1, 2, 3]) expect(bossEase(n)).toEqual(BOSS_BASE)
    expect(BOSS_BASE.hp).toBeGreaterThan(1.3)
  })

  it('makes later boss fights tougher', () => {
    expect(bossHpScale(0)).toBe(BOSS_BASE.hp) // the opener is a real fight
    expect(bossHpScale(3)).toBeCloseTo(1.25 ** 3 * BOSS_BASE.hp)
    expect(bossHpScale(4) / bossHpScale(3)).toBeCloseTo(1.25) // +25% every fight once the easing ends
    expect(bossHpScale(7)).toBeGreaterThan(bossHpScale(3))
  })

  it('hits harder every fight', () => {
    expect(bossDamageScale(3)).toBeCloseTo(1.15 ** 3 * BOSS_BASE.damage)
    expect(bossDamageScale(5)).toBeGreaterThan(bossDamageScale(4))
  })

  it('attacks more often every fight, down to a floor', () => {
    expect(bossCooldownScale(0)).toBe(1)
    expect(bossCooldownScale(2)).toBeCloseTo(0.88 ** 2)
    expect(bossCooldownScale(50)).toBe(0.3)
  })

  it('learns one new special per fight won, never a duplicate', () => {
    expect(bossSpecialsFor(['slam', 'summon'], 0)).toEqual(['slam', 'summon'])
    const later = bossSpecialsFor(['slam', 'summon'], 3)
    expect(later).toEqual(['slam', 'summon', 'barrage', 'charge', 'blink'])
    const all = bossSpecialsFor(['slam'], 99)
    expect(new Set(all).size).toBe(all.length)
    expect(all).not.toContain('lob')
  })
})

describe('stepSpecialTimer', () => {
  it('counts down, fires at zero, and rewinds', () => {
    expect(stepSpecialTimer(5, 1, 8)).toEqual({ timer: 4, fire: false })
    expect(stepSpecialTimer(0.5, 1, 8)).toEqual({ timer: 8, fire: true })
  })
})

describe('signature attacks', () => {
  it('gives every boss its own named attack, no two alike', async () => {
    const { ALL_BOSSES } = await import('../src/logic/bosses.js')
    const labels = new Set()
    const recipes = new Set()
    for (const boss of ALL_BOSSES) {
      const s = boss.stats.signature
      expect(s, boss.id).toBeTruthy()
      labels.add(s.label)
      const { label, id, ...tuning } = s
      recipes.add(JSON.stringify(tuning))
    }
    expect(labels.size).toBe(ALL_BOSSES.length)
    expect(recipes.size).toBe(ALL_BOSSES.length)
  })

  it('uses a wide mix of attack kinds', async () => {
    const { ALL_BOSSES } = await import('../src/logic/bosses.js')
    expect(new Set(ALL_BOSSES.map((b) => b.stats.signature.kind)).size).toBeGreaterThanOrEqual(8)
  })

  it('gives each new regular enemy a signature and at least two moves', async () => {
    const { CRAZY_TYPES } = await import('../src/logic/crazyEnemies.js')
    for (const [id, stats] of Object.entries(CRAZY_TYPES)) {
      expect(stats.signature, id).toBeTruthy()
    }
  })
})

describe('immunity phases', () => {
  it('triggers once at each health threshold, in order', async () => {
    const { immunityPhaseReached, BOSS_IMMUNITY_THRESHOLDS } = await import('../src/logic/bosses.js')
    expect(BOSS_IMMUNITY_THRESHOLDS).toEqual([0.75, 0.5, 0.25])
    expect(immunityPhaseReached(1000, 1000, 0)).toBe(null)
    expect(immunityPhaseReached(750, 1000, 0)).toBe(0)
    expect(immunityPhaseReached(600, 1000, 1)).toBe(null)
    expect(immunityPhaseReached(500, 1000, 1)).toBe(1)
    expect(immunityPhaseReached(100, 1000, 3)).toBe(null)
  })
})

describe('the new enemies stay annoying against a maxed build', () => {
  it('gives every one a status on hit and a share of damage armour cannot stop', async () => {
    const { CRAZY_TYPES } = await import('../src/logic/crazyEnemies.js')
    for (const [id, stats] of Object.entries(CRAZY_TYPES)) {
      expect(stats.trueFraction, id).toBeGreaterThanOrEqual(0.4)
      if (id !== 'kablooma') expect(['poison', 'slow', 'weaken', 'drain', 'stun']).toContain(stats.onHit.status)
    }
  })

  it('has a conditioning tree that gives only small gains, even maxed', async () => {
    const { skillEffects, SKILLS } = await import('../src/logic/skills.js')
    const all = Object.fromEntries(Object.values(SKILLS).filter((n) => n.branch === 'conditioning').map((n) => [n.id, n.max]))
    const fx = skillEffects(all)
    expect(fx.damage).toBeLessThan(1.35)
    expect(fx.damageTaken).toBeGreaterThan(0.85)
    expect(fx.maxHp).toBeLessThan(45)
    expect(fx.regen).toBeLessThan(0.45)
  })
})
