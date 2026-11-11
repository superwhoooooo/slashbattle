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
