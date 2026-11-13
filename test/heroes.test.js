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
    const rich = { ...createProfile(), bank: 1000 }
    const { profile, ok } = buyHero(rich, 'plague')
    expect(ok).toBe(true)
    expect(profile.bank).toBe(1000 - HEROES.find((h) => h.id === 'plague').cost)
    expect(profile.hero).toBe('plague')
    expect(heroLook(profile).mask).toBe(true)
    expect(selectHero(profile, 'guest').profile.hero).toBe('guest')
    expect(selectHero(createProfile(), 'plague').ok).toBe(false)
  })

  it('skins need the hero, cost crystals once, and are worn', () => {
    const start = { ...createProfile(), bank: 2000 }
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

import { BOOMERANG_EVERY, JACKPOT_CHANCE, boomerangPoint, rootsTriggered, saberPoint, spinReels } from '../src/logic/heroes.js'

describe('new hero traits', () => {
  it('the Plasma Wake blade flies straight out along the aim to its full reach', () => {
    const from = { x: 1, z: 2 }
    expect(saberPoint(from, 0, 0)).toEqual(from)
    const end = saberPoint(from, Math.PI / 2, 1)
    expect(end.x).toBeCloseTo(10)
    expect(end.z).toBeCloseTo(2)
    expect(saberPoint(from, 0, 0.5).z - 2).toBeGreaterThan(4.5) // eases off: more than half way at half time
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
