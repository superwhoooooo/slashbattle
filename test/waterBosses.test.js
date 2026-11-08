import { describe, expect, it } from 'vitest'
import { ALL_BOSSES, BOSSES, BOSS_SPECIALS, WATER_BOSSES, bossById, shuffleWaterBossOrder, waterBossForFight } from '../src/logic/bosses.js'
import { MONSTER_TYPES } from '../src/config.js'
import { createWaveState, currentBoss } from '../src/logic/waves.js'
import { createMonsterAIState, isUntouchable, setDeepShield } from '../src/monster.js'

describe('water bosses', () => {
  it('are the eel, angler and urchin, kept out of the dry-land pool', () => {
    expect(WATER_BOSSES.map((b) => b.id)).toEqual(['boss_eel', 'boss_angler', 'boss_urchin'])
    for (const b of WATER_BOSSES) {
      expect(BOSSES.includes(b)).toBe(false)
      expect(ALL_BOSSES.includes(b)).toBe(true)
      expect(MONSTER_TYPES[b.id].amphibious).toBeTruthy()
      expect(bossById(b.id)).toBe(b)
      for (const name of b.specials) expect(BOSS_SPECIALS[name]).toBeDefined()
    }
  })

  it('eel and angler live underwater for good; the urchin comes and goes', () => {
    expect(bossById('boss_eel').stats.amphibious.always).toBe(true)
    expect(bossById('boss_angler').stats.amphibious.always).toBe(true)
    expect(bossById('boss_urchin').stats.amphibious.always).toBeUndefined()
  })

  it('a water room only ever draws water bosses, each once before any repeat', () => {
    let state = { ...createWaveState(() => 0.3), inWater: true }
    const seen = []
    for (let n = 0; n < 3; n++) {
      seen.push(currentBoss(state).id)
      state = { ...state, waterBossesDefeated: n + 1 }
    }
    expect(new Set(seen).size).toBe(3)
    expect(seen.every((id) => WATER_BOSSES.some((b) => b.id === id))).toBe(true)
    expect(WATER_BOSSES).toContain(waterBossForFight(shuffleWaterBossOrder(), 7))
    const dry = currentBoss(createWaveState())
    expect(BOSSES).toContain(dry)
  })

  it('a submerged boss is out of reach until you dive, and always reaches you', () => {
    const ai = createMonsterAIState(MONSTER_TYPES.boss_eel)
    expect(ai.reachAll).toBe(true)
    const mesh = { userData: { ...ai, submerged: true } }
    setDeepShield(true)
    expect(isUntouchable(mesh)).toBe(true)
    setDeepShield(false)
    expect(isUntouchable(mesh)).toBe(false)
  })
})

describe('prince pricklepants', () => {
  it('sinks and fires a heavy beam after the first hit while floating', async () => {
    const { BOSS_SPECIALS: SP } = await import('../src/logic/bosses.js')
    const { updateMonster, setWaterRoom } = await import('../src/monster.js')
    expect(bossById('boss_urchin').stats.amphibious.beamOnHit).toBe(true)
    expect(SP.beam.damageMultiplier).toBeGreaterThan(SP.geyser.damageMultiplier)
    setWaterRoom(true)
    const stats = MONSTER_TYPES.boss_urchin
    const ai = { ...createMonsterAIState(stats), type: 'boss_urchin', hp: 1000, maxHp: 1000, radius: stats.radius, isBoss: true }
    const monster = { position: { x: 0, z: 0 }, rotation: { y: 0 }, userData: ai }
    const player = { position: { x: 6, z: 0 }, hidden: false }
    const events = []
    const tick = (now) => events.push(...updateMonster(monster, player, [], 0.1, now).events)
    tick(1) // sees the player, floating, no hit yet
    expect(ai.submerged).toBe(false)
    ai.hp = 900 // the player hits it
    tick(1.1)
    expect(ai.submerged).toBe(true)
    expect(events.map((e) => e.type)).toEqual(expect.arrayContaining(['dive', 'beamWarn']))
    for (let t = 1.2; t < 3; t += 0.1) tick(t)
    const beam = events.find((e) => e.type === 'beam')
    expect(beam).toBeTruthy()
    expect(beam.aim).toBeCloseTo(Math.PI / 2, 1) // along +x toward where the player stood
    setWaterRoom(false)
  })
})
