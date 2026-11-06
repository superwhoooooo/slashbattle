import { describe, expect, it } from 'vitest'
import { WEAPONS } from '../src/logic/items.js'
import { makeBullets } from '../src/logic/bullets.js'
import { buyAmmoLevel, buyRifleLevel, createProfile, normalizeProfile, setRifleOption, unlockAttachment } from '../src/logic/profile.js'
import { availableLoot, createInventory, grantItem, rollChestLoot } from '../src/logic/inventory.js'
import { bulletDamage, stepBullet } from '../src/logic/bullets.js'
import { cycleIn, distanceBonus, rifleSetup, rollCrit, stepSteady, tuneRifle } from '../src/logic/rifles.js'

const rifles = Object.values(WEAPONS).filter((w) => w.rifle)

describe('rifle catalog', () => {
  it('has at least ten rifles, all guns with bullets', () => {
    expect(rifles.length).toBeGreaterThanOrEqual(10)
    for (const r of rifles) expect(r.gun && r.bullet && r.pellets >= 1).toBeTruthy()
  })
})

describe('tuneRifle', () => {
  const hunter = WEAPONS.hunter
  it('leaves iron sights + standard ammo at the base stats', () => {
    const t = tuneRifle(hunter)
    expect(t.damage).toBe(hunter.damage)
    expect(t.bullet.pierce).toBe(hunter.bullet.pierce)
    expect(t.critChance).toBeCloseTo(hunter.critChance)
  })
  it('a scope adds crit, range and zoom without touching the catalog', () => {
    const t = tuneRifle(hunter, { scope: 'x8' })
    expect(t.critChance).toBeGreaterThan(hunter.critChance)
    expect(t.bullet.life).toBeGreaterThan(hunter.bullet.life)
    expect(t.zoom).toBeGreaterThan(1)
    expect(hunter.bullet.life).toBe(0.6)
  })
  it('ammo changes the bullet', () => {
    expect(tuneRifle(hunter, { ammo: 'ap' }).bullet.pierce).toBe(2)
    expect(tuneRifle(WEAPONS.lever, { ammo: 'hollow' }).bullet.pierce).toBe(0)
    expect(tuneRifle(hunter, { ammo: 'explosive' }).bullet.explode).toBeGreaterThan(0)
    expect(tuneRifle(hunter, { ammo: 'flechette' }).pellets).toBe(3)
  })
  it('caps crit chance and survives unknown ids', () => {
    expect(tuneRifle(hunter, { scope: 'deadeye', ammo: 'lucky' }).critChance).toBeLessThanOrEqual(0.95)
    expect(tuneRifle(hunter, { scope: 'nope', ammo: 'nope' }).damage).toBe(hunter.damage)
  })
})

describe('crits', () => {
  it('rollCrit follows the chance', () => {
    expect(rollCrit(0, () => 0)).toBe(false)
    expect(rollCrit(0.5, () => 0.4)).toBe(true)
    expect(rollCrit(0.5, () => 0.6)).toBe(false)
  })
  it('a crit bullet carries the multiplied damage and a flag', () => {
    const t = tuneRifle(WEAPONS.bolt, { scope: 'deadeye' })
    const [b] = makeBullets(t, { x: 0, z: 0, aimAngle: 0, rng: () => 0 })
    expect(b.crit).toBe(true)
    expect(b.damage).toBeCloseTo(t.damage * t.critMult)
    const [n] = makeBullets(t, { x: 0, z: 0, aimAngle: 0, rng: () => 0.99 })
    expect(n.crit).toBe(false)
    expect(n.damage).toBeCloseTo(t.damage)
  })
  it('non-rifles never crit', () => {
    expect(makeBullets(WEAPONS.pistol, { x: 0, z: 0, aimAngle: 0, rng: () => 0 })[0].crit).toBe(false)
  })
})

describe('scope advantages', () => {
  it('steady aim charges standing still and drops when moving', () => {
    let st = 0
    for (let i = 0; i < 20; i++) st = stepSteady(st, false, 0.05)
    expect(st).toBe(1)
    expect(stepSteady(1, true, 0.1)).toBeLessThan(1)
    expect(stepSteady(0, false, 0.35, 2)).toBeCloseTo(1)
  })
  it('steady adds the scope crit chance to a bullet roll', () => {
    const t = tuneRifle(WEAPONS.bolt, { scope: 'deadeye' })
    // rng just below chance + steady: crits only when steady
    const roll = t.critChance + t.steady * 0.5
    expect(makeBullets(t, { x: 0, z: 0, aimAngle: 0, steady: 1, rng: () => roll })[0].crit).toBe(true)
    expect(makeBullets(t, { x: 0, z: 0, aimAngle: 0, steady: 0, rng: () => roll })[0].crit).toBe(false)
  })
  it('long scopes hit harder far away, red dots hit harder up close', () => {
    const far = tuneRifle(WEAPONS.bolt, { scope: 'x8' })
    const [b] = makeBullets(far, { x: 0, z: 0, aimAngle: 0, rng: () => 0.99 })
    const near = bulletDamage({ ...b, traveled: 2 }).damage
    const late = bulletDamage({ ...b, traveled: b.maxRange }).damage
    expect(late).toBeGreaterThan(near * 1.5)
    const dot = tuneRifle(WEAPONS.bolt, { scope: 'reddot' })
    const [d] = makeBullets(dot, { x: 0, z: 0, aimAngle: 0, rng: () => 0.99 })
    expect(bulletDamage({ ...d, traveled: 2 }).bonus).toBeCloseTo(0.35)
    expect(bulletDamage({ ...d, traveled: 12 }).bonus).toBe(0)
    expect(distanceBonus({})).toBe(0)
  })
  it('stepBullet tracks distance flown', () => {
    const [b] = makeBullets(WEAPONS.hunter, { x: 0, z: 0, aimAngle: 0 })
    stepBullet(b, 0.1, [])
    expect(b.traveled).toBeGreaterThan(4)
  })
})

describe('unlocks, upgrades and picks', () => {
  it('only unlocked attachments can be picked or stepped', () => {
    let p = createProfile()
    expect(setRifleOption(p, 'hunter', 'scope', 'x4')).toBe(p)
    p = unlockAttachment(unlockAttachment(p, 'scope', 'x4'), 'ammo', 'ap')
    p = setRifleOption(p, 'hunter', 'scope', 'x4')
    p = setRifleOption(p, 'hunter', 'ammo', 1, true)
    expect(rifleSetup(p, 'hunter')).toMatchObject({ scope: 'x4', ammo: 'ap' })
    p = setRifleOption(p, 'hunter', 'ammo', 1, true)
    expect(rifleSetup(p, 'hunter').ammo).toBe('standard')
    expect(rifleSetup(normalizeProfile(JSON.parse(JSON.stringify(p))), 'hunter').scope).toBe('x4')
  })
  it('a pick that is not unlocked falls back to the default', () => {
    expect(rifleSetup({ rifles: { hunter: { scope: 'x8', ammo: 'lucky' } }, unlocked: { scopes: [], ammo: [] } }, 'hunter')).toMatchObject({ scope: 'iron', ammo: 'standard' })
  })
  it('chests only offer attachments once you carry a rifle, and not ones you have', () => {
    const inv = createInventory()
    expect(availableLoot(inv, createProfile().unlocked).some((l) => l.kind === 'scope')).toBe(false)
    const withRifle = grantItem(inv, { kind: 'weapon', id: 'hunter' })
    const unlocked = { scopes: ['x4'], ammo: [] }
    const loot = availableLoot(withRifle, unlocked)
    expect(loot.some((l) => l.kind === 'scope' && l.id === 'x4')).toBe(false)
    expect(loot.some((l) => l.kind === 'ammo' && l.id === 'ap')).toBe(true)
    expect(rollChestLoot(withRifle, () => 0.999, unlocked)).toBeTruthy()
  })
  it('gun and ammo levels cost crystals and power the rifle up', () => {
    let p = { ...createProfile(), bank: 500 }
    const r = buyRifleLevel(p, 'hunter')
    expect(r.ok).toBe(true)
    expect(r.profile.bank).toBe(460)
    expect(buyAmmoLevel(p, 'ap').ok).toBe(false) // locked
    const base = tuneRifle(WEAPONS.hunter)
    const up = tuneRifle(WEAPONS.hunter, { gunLevel: 5 })
    expect(up.damage).toBeGreaterThan(base.damage * 1.4)
    expect(up.critChance).toBeGreaterThan(base.critChance)
    expect(up.cooldown).toBeLessThan(base.cooldown)
    expect(tuneRifle(WEAPONS.hunter, { ammo: 'ap', ammoLevel: 5 }).bullet.pierce).toBeGreaterThan(tuneRifle(WEAPONS.hunter, { ammo: 'ap' }).bullet.pierce)
    p = buyAmmoLevel(unlockAttachment(p, 'ammo', 'ap'), 'ap').profile
    expect(normalizeProfile(p).ammoLevels.ap).toBe(2)
  })
  it('cycleIn wraps both ways', () => {
    expect(cycleIn(['a', 'b', 'c'], 'c', 1)).toBe('a')
    expect(cycleIn(['a', 'b', 'c'], 'a', -1)).toBe('c')
    expect(cycleIn(['a'], 'zzz')).toBe('a')
  })
})
