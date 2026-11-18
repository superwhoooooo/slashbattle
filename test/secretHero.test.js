import { describe, expect, it } from 'vitest'
import { CROWN_HERO, HEROES, SECRET_HEROES, buyHero, grantHero, heroById, heroForCrowns, isSecretHero, normalizeHeroFields, ownsHero, visibleHeroes } from '../src/logic/heroes.js'
import { AWAKENED, HERO_ABILITIES, traitTune } from '../src/logic/heroPowers.js'
import { HERO_ULTIMATES } from '../src/logic/heroUltimates.js'
import { GEAR_PARTS } from '../src/heroGear.js'

const fresh = { bank: 999999, heroesOwned: [], skinsOwned: [], heroSkins: {}, hero: 'guest' }

describe('the secret hero (Nimbus Sovereign)', () => {
  it('is the one secret hero, with its trait, awakening, ability, ultimate and gear', () => {
    expect(SECRET_HEROES).toEqual([CROWN_HERO])
    const hero = heroById(CROWN_HERO)
    expect(hero.id).toBe('sovereign')
    expect(isSecretHero('sovereign')).toBe(true)
    expect(isSecretHero('shiro')).toBe(false)
    expect(AWAKENED.sovereign.desc).toBeTruthy()
    expect(HERO_ABILITIES.sovereign.name).toBe('Ascension')
    expect(HERO_ULTIMATES.sovereign.steps.length).toBeGreaterThan(0)
    for (const g of hero.gear) expect(GEAR_PARTS, g).toContain(g)
    expect(traitTune('heavenly', true).seraphs).toBeGreaterThan(traitTune('heavenly', false).seraphs)
    // Not immortal: no damage reduction, no invulnerability step in its ultimate.
    expect(hero.stats.damageTaken ?? 1).toBe(1)
    expect(HERO_ULTIMATES.sovereign.steps.some((s) => s.k === 'invuln')).toBe(false)
  })

  it('stays hidden until owned, and cannot be bought', () => {
    expect(visibleHeroes(fresh).some((h) => h.id === 'sovereign')).toBe(false)
    expect(visibleHeroes(fresh)).toHaveLength(HEROES.length - 1)
    const tried = buyHero(fresh, 'sovereign')
    expect(tried.ok).toBe(false)
    expect(tried.profile.bank).toBe(fresh.bank)
    const owned = grantHero(fresh, 'sovereign')
    expect(ownsHero(owned, 'sovereign')).toBe(true)
    expect(visibleHeroes(owned).some((h) => h.id === 'sovereign')).toBe(true)
    expect(buyHero(owned, 'sovereign')).toMatchObject({ ok: true, profile: { hero: 'sovereign' } })
    expect(grantHero(owned, 'sovereign')).toBe(owned)
    expect(normalizeHeroFields({ ...owned, hero: 'sovereign' }).hero).toBe('sovereign')
  })

  it('comes only with every Nimbus Crown', () => {
    expect(heroForCrowns(8, 9)).toBe(null)
    expect(heroForCrowns(9, 9)).toBe('sovereign')
    expect(heroForCrowns(0, 0)).toBe(null)
  })
})

describe('Shiro the Limitless, nerfed', () => {
  it('no more damage reduction, Infinity only flickers, smaller Blue and Hollow Violet', () => {
    const shiro = heroById('shiro')
    expect(shiro.stats.damageTaken ?? 1).toBe(1)
    expect(AWAKENED.shiro.stats).toBeUndefined()
    const base = traitTune('limitless', false)
    expect(base.on).toBeLessThan(base.off)
    expect(base.damage).toBeLessThanOrEqual(1.2)
    expect(base.cooldown).toBeGreaterThanOrEqual(12)
    expect(HERO_ABILITIES.shiro.cooldown).toBeGreaterThanOrEqual(45)
    expect(HERO_ULTIMATES.shiro.cooldown).toBeGreaterThanOrEqual(75)
  })
})
