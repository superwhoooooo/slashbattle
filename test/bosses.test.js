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

  it('tunes the first two fights for a staff-only player, then full hp and soft hits', async () => {
    const { BOSS_STARTER } = await import('../src/logic/bosses.js')
    for (const n of [0, 1]) expect(bossEase(n)).toEqual(BOSS_STARTER)
    for (const n of [2, 3, 9]) expect(bossEase(n)).toEqual(BOSS_BASE)
    expect(BOSS_STARTER.hp).toBeLessThan(BOSS_BASE.hp)
    expect(BOSS_STARTER.damage).toBeLessThanOrEqual(0.3)
    expect(BOSS_BASE.damage).toBeLessThan(0.5)
  })

  it('caps a fast boss to a fair pace early on, loosening each fight', async () => {
    const { bossSpeedScale } = await import('../src/logic/bosses.js')
    expect(bossSpeedScale(1.5, 0)).toBe(1) // the Cone Father keeps his pace
    expect(2.6 * bossSpeedScale(2.6, 0)).toBeCloseTo(1.8)
    expect(bossSpeedScale(2.6, 1)).toBe(bossSpeedScale(2.6, 0)) // still capped in the second fight
    expect(bossSpeedScale(2.6, 3)).toBeGreaterThan(bossSpeedScale(2.6, 0))
    expect(bossSpeedScale(2.6, 20)).toBe(1)
  })

  it('throws up fewer shields and enrages less in the opening fights', async () => {
    const { immunityThresholdsFor, immunityPhaseReached, bossEnrage, BOSS_IMMUNITY_THRESHOLDS } = await import('../src/logic/bosses.js')
    expect(immunityThresholdsFor(0)).toEqual([0.5])
    expect(immunityThresholdsFor(1)).toEqual([0.5])
    expect(immunityThresholdsFor(2)).toHaveLength(2)
    expect(immunityThresholdsFor(5)).toEqual(BOSS_IMMUNITY_THRESHOLDS)
    expect(immunityPhaseReached(70, 100, 0, [0.5])).toBeNull()
    expect(immunityPhaseReached(50, 100, 0, [0.5])).toBe(0)
    expect(immunityPhaseReached(10, 100, 1, [0.5])).toBeNull()
    expect(bossEnrage(0).damage).toBeLessThan(bossEnrage(5).damage)
    expect(bossEnrage(5).damage).toBeLessThanOrEqual(1.05)
  })

  it('makes later boss fights tougher', () => {
    expect(bossHpScale(0)).toBeLessThan(BOSS_BASE.hp) // a starter fight
    expect(bossHpScale(3)).toBeCloseTo(1.12 ** 3 * BOSS_BASE.hp)
    expect(bossHpScale(4) / bossHpScale(3)).toBeCloseTo(1.12) // +12% every fight
    expect(bossHpScale(7)).toBeGreaterThan(bossHpScale(3))
  })

  it('hits harder every fight', () => {
    expect(bossDamageScale(3)).toBeCloseTo(1.05 ** 3 * BOSS_BASE.damage)
    expect(bossDamageScale(5)).toBeGreaterThan(bossDamageScale(4))
    expect(bossDamageScale(100)).toBe(0.6) // never past the cap
    expect(bossDamageScale(1)).toBeLessThan(bossDamageScale(2))
  })

  it('attacks more often every fight, down to a floor', () => {
    expect(bossCooldownScale(0)).toBe(1)
    expect(bossCooldownScale(2)).toBeCloseTo(0.94 ** 2)
    expect(bossCooldownScale(50)).toBe(0.3)
  })

  it('learns one new special per fight won, never a duplicate', () => {
    expect(bossSpecialsFor(['slam', 'summon'], 0)).toEqual(['slam', 'summon'])
    const later = bossSpecialsFor(['slam', 'summon'], 3)
    expect(later).toEqual(['slam', 'summon', 'barrage', 'charge', 'spin']) // blink is learned last
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
      if (id === 'sporeling') continue // deliberately simple: just its 3-shot puff
      expect(stats.signature, id).toBeTruthy()
    }
  })

  it('keeps the Sporeling simple: no melee, no boss moves, three small shots', async () => {
    const { CRAZY_TYPES } = await import('../src/logic/crazyEnemies.js')
    const { RANGED_ATTACKS } = await import('../src/logic/enemies.js')
    const spore = CRAZY_TYPES.sporeling
    expect(spore.noMelee).toBe(true)
    expect(spore.specials ?? []).toEqual([])
    expect(spore.signature).toBeFalsy()
    expect(RANGED_ATTACKS.sporeling).toMatchObject({ kind: 'shoot', count: 3 })
    expect(RANGED_ATTACKS.sporeling.orbSize).toBeLessThan(RANGED_ATTACKS.spinner.orbSize)
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
      expect(stats.trueFraction, id).toBeGreaterThanOrEqual(0.1)
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
