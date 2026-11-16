import { describe, expect, it } from 'vitest'
import { HEROES, broadsideSpots, rewindTarget, spinReels } from '../src/logic/heroes.js'
import {
  AWAKEN_LEVEL, AWAKENED, HERO_ABILITIES, TUNED_TRAITS, awakenedStats, heroAbilityFraction, isAwakened, pointsAlong, ringPoints,
  steerToward, traitTune, turnToward, useHeroAbility,
} from '../src/logic/heroPowers.js'
import { MASTERY_XP } from '../src/logic/progress.js'

describe('hero awakening (mastery 4)', () => {
  it('awakens exactly at mastery level 4', () => {
    expect(AWAKEN_LEVEL).toBe(4)
    expect(isAwakened(0)).toBe(false)
    expect(isAwakened(MASTERY_XP[AWAKEN_LEVEL - 1] - 1)).toBe(false)
    expect(isAwakened(MASTERY_XP[AWAKEN_LEVEL - 1])).toBe(true)
  })

  it('every hero has an awakened description and a hero ability; every trait has tuning', () => {
    for (const hero of HEROES) {
      expect(AWAKENED[hero.id]?.desc, hero.id).toBeTruthy()
      const ability = HERO_ABILITIES[hero.id]
      expect(ability?.name, hero.id).toBeTruthy()
      expect(ability.desc).toBeTruthy()
      expect(ability.cooldown).toBeGreaterThan(5)
      if (hero.trait.id) expect(TUNED_TRAITS, hero.trait.id).toContain(hero.trait.id)
    }
  })

  it('un-awakened tuning matches the traits as they always were', () => {
    expect(traitTune('static', false)).toMatchObject({ every: 6, targets: 3, range: 7, damage: 1 })
    expect(traitTune('highnoon', false)).toMatchObject({ cooldown: 16, slow: 1.3, marks: 6, boost: 1 })
    expect(traitTune('hammer', false).hover).toBe(0)
    expect(traitTune('atomic', false).hold).toBe(0)
    expect(traitTune('nope', true)).toEqual({})
  })

  it('awakened tuning is stronger, with the headline changes', () => {
    expect(traitTune('hammer', true).hover).toBe(10) // Thundra's hammer hovers 10 s
    expect(traitTune('atomic', true).hold).toBeGreaterThan(0) // Kaiju's beam is held
    const noon = traitTune('highnoon', true)
    expect(noon.slow).toBeGreaterThan(traitTune('highnoon', false).slow * 3) // Dakota slows time much longer
    expect(noon.factor).toBeLessThan(traitTune('highnoon', false).factor) // and harder
    for (const id of TUNED_TRAITS) {
      const base = traitTune(id, false)
      const awake = traitTune(id, true)
      const changed = Object.keys(base).some((k) => base[k] !== awake[k])
      expect(changed, id).toBe(true)
      for (const k of ['damage', 'radius', 'chance']) if (typeof base[k] === 'number') expect(awake[k], `${id}.${k}`).toBeGreaterThanOrEqual(base[k])
      for (const k of ['cooldown', 'every']) if (typeof base[k] === 'number') expect(awake[k], `${id}.${k}`).toBeLessThanOrEqual(base[k])
    }
  })

  it('awakened stats only apply where listed', () => {
    expect(awakenedStats('guest').damage).toBeGreaterThan(1)
    expect(awakenedStats('ember')).toEqual({})
  })
})

describe('hero ability cooldown', () => {
  it('needs awakening, then goes on cooldown (scaled by haste)', () => {
    expect(useHeroAbility('kaiju', false, 10, 0).used).toBe(false)
    const first = useHeroAbility('kaiju', true, 10, 0)
    expect(first.used).toBe(true)
    expect(first.readyAt).toBe(10 + HERO_ABILITIES.kaiju.cooldown)
    expect(useHeroAbility('kaiju', true, 11, first.readyAt).used).toBe(false)
    expect(useHeroAbility('kaiju', true, 10, 0, 0.5).readyAt).toBe(10 + HERO_ABILITIES.kaiju.cooldown * 0.5)
    expect(useHeroAbility('nobody', true, 10, 0).used).toBe(false)
  })

  it('reports a 0..1 cooldown fraction', () => {
    const cd = HERO_ABILITIES.dakota.cooldown
    expect(heroAbilityFraction('dakota', 5, 0)).toBe(0)
    expect(heroAbilityFraction('dakota', 0, cd)).toBe(1)
    expect(heroAbilityFraction('dakota', cd / 2, cd)).toBeCloseTo(0.5)
  })
})

describe('steering and placement helpers', () => {
  it('steerToward moves at most speed*dt and never overshoots', () => {
    expect(steerToward({ x: 0, z: 0 }, { x: 10, z: 0 }, 5, 1)).toEqual({ x: 5, z: 0 })
    expect(steerToward({ x: 0, z: 0 }, { x: 1, z: 0 }, 5, 1)).toEqual({ x: 1, z: 0 })
  })

  it('turnToward turns the short way, capped by rate', () => {
    expect(turnToward(0, 1, 0.5, 1)).toBeCloseTo(0.5)
    expect(turnToward(0, 0.2, 0.5, 1)).toBeCloseTo(0.2)
    // From just under +pi to just over -pi is a short step across the seam, not a full turn back.
    expect(turnToward(3.1, -3.1, 1, 1)).toBeCloseTo(-3.1)
  })

  it('pointsAlong and ringPoints place evenly', () => {
    const line = pointsAlong({ x: 0, z: 0 }, 0, 3, 2, 1)
    expect(line.map((p) => p.z)).toEqual([1, 3, 5])
    const ring = ringPoints({ x: 1, z: 1 }, 4, 2)
    for (const p of ring) expect(Math.hypot(p.x - 1, p.z - 1)).toBeCloseTo(2)
  })
})

describe('trait helpers take the awakened numbers', () => {
  it('broadsideSpots fires as many blasts as asked', () => {
    expect(broadsideSpots({ x: 0, z: 0 }, { x: 0, z: 5 })).toHaveLength(3)
    expect(broadsideSpots({ x: 0, z: 0 }, { x: 0, z: 5 }, 2.5, 5)).toHaveLength(5)
  })

  it('spinReels pays at the chance given', () => {
    expect(spinReels(() => 0.2).win).toBe(false)
    expect(spinReels(() => 0.2, 0.25).win).toBe(true)
  })

  it('rewindTarget floors health at the fraction given', () => {
    const history = [{ t: 0, x: 1, z: 2, hp: 5 }]
    expect(rewindTarget(history, 1, 100).hp).toBe(30)
    expect(rewindTarget(history, 1, 100, 0.6).hp).toBe(60)
  })
})

describe('Spartan Rage', () => {
  it('fills sooner and, while it runs, hits harder, shrugs hits off and moves faster (more when awakened)', () => {
    const base = traitTune('spartan', false)
    const awake = traitTune('spartan', true)
    expect(base.max).toBeLessThanOrEqual(20)
    expect(base.bonus).toBeGreaterThan(1.5)
    expect(base.guard).toBeLessThan(1)
    expect(base.speed).toBeGreaterThan(1)
    expect(awake.max).toBeLessThan(base.max)
    expect(awake.guard).toBeLessThan(base.guard)
    expect(awake.bonus).toBeGreaterThan(base.bonus)
  })
})
