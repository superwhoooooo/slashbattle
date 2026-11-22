import { describe, expect, it } from 'vitest'
import { HEROES, buyHero, buySkin, heroEffects, heroLook, marksmanBonus, moltenBonus, normalizeHeroFields, ownsHero, ownsSkin, selectHero } from '../src/logic/heroes.js'
import { createProfile, normalizeProfile } from '../src/logic/profile.js'
import { GEAR_PARTS } from '../src/heroGear.js'

describe('heroes', () => {
  it('every hero has unique ids, four skins (first free), and buildable gear', () => {
    const ids = new Set()
    for (const hero of HEROES) {
      expect(ids.has(hero.id)).toBe(false)
      ids.add(hero.id)
      expect(hero.skins).toHaveLength(4)
      expect(hero.skins[0].cost).toBe(0)
      for (const part of hero.gear) expect(GEAR_PARTS).toContain(part)
    }
    expect(ids.has('plague')).toBe(true)
  })

  it('a new profile plays the free Guest in its first skin', () => {
    const profile = createProfile()
    expect(profile.hero).toBe('guest')
    expect(ownsHero(profile, 'guest')).toBe(true)
    expect(heroLook(profile).id).toBe('coral')
    expect(heroEffects('guest').dash).toBe(1)
  })

  it('buying a hero spends the bank, owns it and plays it; too poor fails', () => {
    const poor = { ...createProfile(), bank: 10 }
    expect(buyHero(poor, 'plague').ok).toBe(false)
    const rich = { ...createProfile(), bank: 5000 }
    const { profile, ok } = buyHero(rich, 'plague')
    expect(ok).toBe(true)
    expect(profile.bank).toBe(5000 - HEROES.find((h) => h.id === 'plague').cost)
    expect(profile.hero).toBe('plague')
    expect(heroLook(profile).mask).toBe(true)
    expect(selectHero(profile, 'guest').profile.hero).toBe('guest')
    expect(selectHero(createProfile(), 'plague').ok).toBe(false)
  })

  it('skins need the hero, cost crystals once, and are worn', () => {
    const start = { ...createProfile(), bank: 5000 }
    expect(buySkin(start, 'plague', 'toxic').ok).toBe(false) // hero first
    const withHero = buyHero(start, 'plague').profile
    const bought = buySkin(withHero, 'plague', 'toxic')
    expect(bought.ok).toBe(true)
    expect(ownsSkin(bought.profile, 'plague', 'toxic')).toBe(true)
    expect(heroLook(bought.profile).id).toBe('toxic')
    // Wearing it again (or switching back) is free.
    const back = buySkin(bought.profile, 'plague', 'classic').profile
    expect(back.bank).toBe(bought.profile.bank)
    expect(buySkin(back, 'plague', 'toxic').profile.bank).toBe(bought.profile.bank)
  })

  it('a saved profile round-trips its heroes; junk is dropped', () => {
    let profile = { ...createProfile(), bank: 5000 }
    profile = buyHero(profile, 'moon').profile
    profile = buySkin(profile, 'moon', 'eclipse').profile
    const loaded = normalizeProfile(JSON.parse(JSON.stringify(profile)))
    expect(loaded.hero).toBe('moon')
    expect(heroLook(loaded).id).toBe('eclipse')
    const junk = normalizeHeroFields({ hero: 'plague', heroesOwned: ['nope'], skinsOwned: ['plague:toxic', 'x:y'], heroSkins: { plague: 'toxic' } })
    expect(junk.hero).toBe('guest') // not owned
    expect(junk.heroesOwned).toEqual([])
    expect(junk.skinsOwned).toEqual(['plague:toxic'])
  })

  it('trait curves', () => {
    expect(marksmanBonus(0)).toBe(1)
    expect(marksmanBonus(14)).toBeCloseTo(1.5)
    expect(marksmanBonus(40)).toBeCloseTo(1.5)
    expect(moltenBonus(3)).toBeCloseTo(1.3)
    expect(moltenBonus(9)).toBeCloseTo(1.5)
  })
})

describe('new hero traits', () => {
  it('tip jar pays from a 3-chain, more from 5', async () => {
    const { tipJarCrystals } = await import('../src/logic/heroes.js')
    expect([1, 2, 3, 4, 5, 9].map(tipJarCrystals)).toEqual([0, 0, 1, 1, 2, 2])
  })
  it('rewind goes back about 3 s with at least 30% health', async () => {
    const { rewindTarget } = await import('../src/logic/heroes.js')
    const history = [0, 0.25, 0.5, 1, 2, 3].map((t) => ({ t: 10 + t, x: t, z: 0, hp: 5 }))
    const back = rewindTarget(history, 13.1, 100)
    expect(back.x).toBe(0) // 3.1 s ago
    expect(back.hp).toBe(30)
    expect(rewindTarget([], 5, 100)).toBe(null)
  })
})

import { BOOMERANG_EVERY, JACKPOT_CHANCE, boomerangPoint, rootsTriggered, returningPoint, spinReels } from '../src/logic/heroes.js'

describe('new hero traits', () => {
  it('the Plasma Wake blade flies out to full reach and comes back to wherever the thrower is now', () => {
    const from = { x: 1, z: 2 }
    expect(returningPoint(from, from, 0, 0, 12)).toEqual(from)
    const turn = returningPoint(from, from, Math.PI / 2, 0.5, 12)
    expect(turn.x).toBeCloseTo(13)
    expect(turn.z).toBeCloseTo(2)
    expect(returningPoint(from, from, 0, 0.25, 12).z - 2).toBeGreaterThan(6) // eases off: more than half way at half the out leg
    const home = { x: -3, z: 5 }
    expect(returningPoint(from, home, 0, 1, 12)).toEqual(home)
  })

  it('the boomerang goes out, bows to the side, and comes home to wherever the thrower is now', () => {
    const from = { x: 0, z: 0 }
    const home = { x: 3, z: -1 }
    expect(boomerangPoint(from, home, 0, 0)).toEqual({ x: 0, z: 0 })
    const far = boomerangPoint(from, home, 0, 0.5)
    expect(far.z).toBeGreaterThan(8)
    const back = boomerangPoint(from, home, 0, 1)
    expect(back.x).toBeCloseTo(3)
    expect(back.z).toBeCloseTo(-1)
    expect(Math.sign(boomerangPoint(from, from, 0, 0.25).x)).toBe(-Math.sign(boomerangPoint(from, from, 0, 0.75).x))
    expect(BOOMERANG_EVERY).toBe(4)
  })

  it('jackpot reels show three of a kind only on a win, about 1 in 10', () => {
    let seed = 7
    const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    let wins = 0
    for (let i = 0; i < 5000; i++) {
      const spin = spinReels(rng)
      const same = spin.reels[0] === spin.reels[1] && spin.reels[1] === spin.reels[2]
      expect(same).toBe(spin.win)
      if (spin.win) wins++
    }
    expect(wins / 5000).toBeGreaterThan(JACKPOT_CHANCE * 0.7)
    expect(wins / 5000).toBeLessThan(JACKPOT_CHANCE * 1.3)
  })

  it('Thorn Warden roots fire only on crossing below half, off cooldown', () => {
    expect(rootsTriggered(60, 40, 100, 5, 0)).toBe(true)
    expect(rootsTriggered(45, 40, 100, 5, 0)).toBe(false) // already below
    expect(rootsTriggered(60, 40, 100, 5, 10)).toBe(false) // cooling down
    expect(rootsTriggered(null, 40, 100, 5, 0)).toBe(false)
    expect(rootsTriggered(60, 0, 100, 5, 0)).toBe(false) // knocked out
  })
})

describe('archetype heroes', () => {
  it('are in the roster with their traits', async () => {
    const ids = HEROES.map((h) => h.id)
    for (const id of ['hana', 'rush', 'cobalt', 'kaiju', 'dakota']) expect(ids).toContain(id)
    expect(heroEffects('rush').dash).toBeCloseTo(0.7)
  })

  it('hookshot picks the farthest monster in range', async () => {
    const { farthestWithin } = await import('../src/logic/heroes.js')
    const pts = [{ x: 2, z: 0 }, { x: 10, z: 0 }, { x: 20, z: 0 }]
    expect(farthestWithin(pts, { x: 0, z: 0 }, 13)).toBe(pts[1])
    expect(farthestWithin([{ x: 30, z: 0 }], { x: 0, z: 0 }, 13)).toBe(null)
  })

  it('orbital strike aims at the biggest crowd', async () => {
    const { densestSpot } = await import('../src/logic/heroes.js')
    const spot = densestSpot([{ x: 0, z: 0 }, { x: 10, z: 10 }, { x: 11, z: 10 }, { x: 10, z: 11 }], 3)
    expect(spot.count).toBe(3)
    expect(spot.x).toBeCloseTo(31 / 3)
    expect(densestSpot([])).toBe(null)
  })

  it('atomic breath hits along the aim only', async () => {
    const { inBeam } = await import('../src/logic/heroes.js')
    const o = { x: 0, z: 0 }
    expect(inBeam(o, 0, { x: 0.5, z: 8 })).toBe(true) // ahead (+z)
    expect(inBeam(o, 0, { x: 0, z: -3 })).toBe(false) // behind
    expect(inBeam(o, 0, { x: 4, z: 5 })).toBe(false) // off to the side
    expect(inBeam(o, Math.PI / 2, { x: 10, z: 0.4 })).toBe(true) // aimed +x
    expect(inBeam(o, 0, { x: 0, z: 20 }, 14)).toBe(false) // past its reach
  })

  it('high noon marks the nearest six in range', async () => {
    const { pickMarks } = await import('../src/logic/heroes.js')
    const pts = Array.from({ length: 9 }, (_, i) => ({ x: 9 - i, z: 0 }))
    pts.push({ x: 40, z: 0 })
    const marks = pickMarks(pts, { x: 0, z: 0 }, 16, 6)
    expect(marks.map((p) => p.x)).toEqual([1, 2, 3, 4, 5, 6])
  })
})

describe('premium heroes', () => {
  it('cost 2200 and Vexar got buffed', async () => {
    const { SABER_CHANCE, SABER_REACH } = await import('../src/logic/heroes.js')
    for (const id of ['thundra', 'singularity', 'phoebe', 'kenji']) expect(HEROES.find((h) => h.id === id).cost).toBe(2200)
    for (const id of ['plague', 'dread']) expect(HEROES.find((h) => h.id === id).cost).toBe(3000)
    expect(SABER_CHANCE).toBeGreaterThan(0.5)
    expect(SABER_REACH).toBeGreaterThan(9)
  })

  it('thousand cuts hops to the nearest unvisited monster in reach', async () => {
    const { chainPath } = await import('../src/logic/heroes.js')
    const pts = [{ x: 3, z: 0 }, { x: 6, z: 0 }, { x: 1, z: 0 }, { x: 40, z: 0 }]
    expect(chainPath(pts, { x: 0, z: 0 }, 7, 8).map((p) => p.x)).toEqual([1, 3, 6]) // 40 is too far a hop
    expect(chainPath(pts, { x: 0, z: 0 }, 2, 8)).toHaveLength(2)
    expect(chainPath([], { x: 0, z: 0 })).toEqual([])
  })
})
