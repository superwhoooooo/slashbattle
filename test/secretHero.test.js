import { describe, expect, it } from 'vitest'
import { CROWN_HERO, HEROES, SECRET_HEROES, buyHero, grantHero, heroById, heroForCrowns, heroForHearts, heroForSecrets, isSecretHero, normalizeHeroFields, ownsHero, visibleHeroes } from '../src/logic/heroes.js'
import { AWAKENED, HERO_ABILITIES, WINDS, traitTune, windAt } from '../src/logic/heroPowers.js'
import { HERO_ULTIMATES } from '../src/logic/heroUltimates.js'
import { GEAR_PARTS } from '../src/heroGear.js'

const fresh = { bank: 999999, heroesOwned: [], skinsOwned: [], heroSkins: {}, hero: 'guest' }

describe('the secret hero (Nimbus Sovereign)', () => {
  it('is the one secret hero, with its trait, awakening, ability, ultimate and gear', () => {
    expect(SECRET_HEROES).toEqual([CROWN_HERO, 'umbral', 'twilight', 'tempest'])
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
    expect(visibleHeroes(fresh)).toHaveLength(HEROES.length - SECRET_HEROES.length)
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

describe('the second secret hero (Veyra, the Hollow Queen)', () => {
  it('has a trait, awakening, ability, ultimate and gear that all exist', () => {
    const hero = heroById('umbral')
    expect(hero.secret).toBe(true)
    expect(AWAKENED.umbral.desc).toBeTruthy()
    expect(HERO_ABILITIES.umbral.name).toBe('Eclipse')
    expect(HERO_ULTIMATES.umbral.steps.length).toBeGreaterThan(0)
    for (const g of hero.gear) expect(GEAR_PARTS, g).toContain(g)
    expect(hero.skins.length).toBe(4)
    const base = traitTune('abyss', false)
    const awake = traitTune('abyss', true)
    expect(awake.hunger).toBeGreaterThan(base.hunger)
    expect(awake.every).toBeLessThan(base.every)
    expect(awake.tendrils).toBeGreaterThan(base.tendrils)
    // Not immortal: no damage reduction and no invulnerability.
    expect(hero.stats.damageTaken ?? 1).toBe(1)
    expect(HERO_ULTIMATES.umbral.steps.some((s) => s.k === 'invuln')).toBe(false)
  })
  it('stays hidden, cannot be bought, and comes only with every Umbral Heart', () => {
    expect(visibleHeroes(fresh).some((h) => h.id === 'umbral')).toBe(false)
    const tried = buyHero(fresh, 'umbral')
    expect(tried.ok).toBe(false)
    expect(tried.profile.bank).toBe(fresh.bank)
    expect(heroForHearts(4, 5)).toBe(null)
    expect(heroForHearts(5, 5)).toBe('umbral')
    expect(heroForHearts(0, 0)).toBe(null)
    const owned = grantHero(fresh, 'umbral')
    expect(ownsHero(owned, 'umbral')).toBe(true)
    expect(visibleHeroes(owned).some((h) => h.id === 'umbral')).toBe(true)
  })
})

describe('the third secret hero (Nyxara, the Twilight Regent)', () => {
  it('has its trait, awakening, ability, ultimate and gear', () => {
    const hero = heroById('twilight')
    expect(isSecretHero('twilight')).toBe(true)
    expect(AWAKENED.twilight.desc).toBeTruthy()
    expect(HERO_ABILITIES.twilight.name).toBe('Syzygy')
    expect(HERO_ULTIMATES.twilight.steps.length).toBeGreaterThan(0)
    for (const g of hero.gear) expect(GEAR_PARTS, g).toContain(g)
    expect(traitTune('twilight', true).tendrils).toBeGreaterThan(traitTune('twilight', false).tendrils)
    expect(hero.stats.damageTaken ?? 1).toBe(1)
  })

  it('comes only to a player who owns both other secret heroes, and cannot be bought', () => {
    expect(heroForSecrets(fresh)).toBe(null)
    expect(heroForSecrets(grantHero(fresh, 'sovereign'))).toBe(null)
    expect(heroForSecrets(grantHero(fresh, 'umbral'))).toBe(null)
    const both = grantHero(grantHero(fresh, 'sovereign'), 'umbral')
    expect(heroForSecrets(both)).toBe('twilight')
    expect(visibleHeroes(both).some((h) => h.id === 'twilight')).toBe(false)
    expect(buyHero(both, 'twilight').ok).toBe(false)
    const owned = grantHero(both, 'twilight')
    expect(visibleHeroes(owned).some((h) => h.id === 'twilight')).toBe(true)
  })
})

describe('the fourth secret hero (Kestrel, the Stormbinder)', () => {
  it('has its trait, awakening, ability, ultimate and gear', () => {
    const hero = heroById('tempest')
    expect(hero.secret).toBe(true)
    expect(hero.skins.length).toBe(4)
    expect(AWAKENED.tempest.desc).toBeTruthy()
    expect(HERO_ABILITIES.tempest.name).toBe('Calamity Call')
    expect(HERO_ULTIMATES.tempest.steps.length).toBeGreaterThan(0)
    for (const g of hero.gear) expect(GEAR_PARTS, g).toContain(g)
    const base = traitTune('stormbound', false)
    const awake = traitTune('stormbound', true)
    expect(awake.every).toBeLessThan(base.every)
    expect(awake.radius).toBeGreaterThan(base.radius)
    expect(awake.ember).toBeGreaterThan(base.ember)
    expect(hero.stats.damageTaken ?? 1).toBe(1)
    expect(HERO_ULTIMATES.tempest.steps.some((s) => s.k === 'invuln')).toBe(false)
  })
  it('the four winds turn in order', () => {
    expect(WINDS.map((w) => w.id)).toEqual(['sand', 'frost', 'ember', 'mire'])
    expect([0, 7, 14, 21, 28].map((t) => windAt(t, 7).id)).toEqual(['sand', 'frost', 'ember', 'mire', 'sand'])
  })
  it('stays hidden and cannot be bought', () => {
    expect(visibleHeroes(fresh).some((h) => h.id === 'tempest')).toBe(false)
    expect(buyHero(fresh, 'tempest').ok).toBe(false)
    expect(visibleHeroes(grantHero(fresh, 'tempest')).some((h) => h.id === 'tempest')).toBe(true)
  })
})
