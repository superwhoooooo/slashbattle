import { describe, expect, it } from 'vitest'
import { BREATHS, SCALES, breathVictims, dragonSetup, isDragon, tuneDragon } from '../src/logic/dragons.js'
import { PETS } from '../src/logic/items.js'
import { createProfile, normalizeProfile, setDragonOption, unlockDragonPart } from '../src/logic/profile.js'
import { availableLoot, rollChestLoot } from '../src/logic/inventory.js'
import { isFighter, isRanged } from '../src/logic/petAI.js'

const dragons = Object.values(PETS).filter(isDragon)

describe('dragon pets', () => {
  it('ships several dragons that default to a real scale and breath', () => {
    expect(dragons.length).toBeGreaterThanOrEqual(5)
    for (const d of dragons) {
      expect(SCALES[d.defaultScale], d.id).toBeTruthy()
      expect(BREATHS[d.defaultBreath], d.id).toBeTruthy()
      expect(d.model).toBe('dragon')
      expect(isRanged(d) && isFighter(d)).toBe(true)
    }
  })

  it('folds the breath into the dragon', () => {
    const d = PETS.cinderwing
    const venom = tuneDragon(d, { scale: 'obsidian', breath: 'venom' })
    expect(venom.bolts).toBe(3)
    expect(venom.damage).toBeLessThan(d.damage)
    expect(venom.scale.id).toBe('obsidian')
    const voidBreath = tuneDragon(d, { scale: 'crimson', breath: 'void' })
    expect(voidBreath.damage).toBeGreaterThan(d.damage)
    expect(voidBreath.interval).toBeGreaterThan(d.interval)
  })

  it('uses the saved picks, then the dragon\'s own defaults', () => {
    expect(dragonSetup(createProfile(), PETS.glacier)).toEqual({ scale: 'azure', breath: 'frost' })
    const p = setDragonOption(unlockDragonPart(createProfile(), 'skin', 'amethyst'), 'glacier', 'scale', 'amethyst')
    expect(dragonSetup(p, PETS.glacier)).toEqual({ scale: 'amethyst', breath: 'frost' })
  })

  it('ignores bad picks and non-dragons, steps through every option', () => {
    const p = createProfile()
    expect(setDragonOption(p, 'sparky', 'scale', 'azure')).toBe(p)
    expect(setDragonOption(p, 'glacier', 'scale', 'nope')).toBe(p)
    let q = p
    for (const id of Object.keys(SCALES)) q = unlockDragonPart(q, 'skin', id)
    const seen = new Set()
    for (let i = 0; i < Object.keys(SCALES).length; i++) {
      q = setDragonOption(q, 'glacier', 'scale', 1, true)
      seen.add(q.dragons.glacier.scale)
    }
    expect(seen.size).toBe(Object.keys(SCALES).length)
  })

  it('keeps only valid dragon picks when loading a save', () => {
    const profile = normalizeProfile({ dragons: { glacier: { scale: 'opal', breath: 'bogus' }, sparky: { scale: 'opal' } } })
    expect(profile.dragons).toEqual({ glacier: { scale: 'opal' } })
    expect(dragonSetup(profile, PETS.glacier).scale).toBe('azure') // opal is not unlocked, so back to its own skin
  })

  it('splashes nearby enemies and chains lightning to the closest ones', () => {
    const at = { x: 0, z: 0 }
    const primary = {}
    const near = { x: 1, z: 0, ref: {} }
    const far = { x: 3, z: 0, ref: {} }
    const flame = tuneDragon(PETS.cinderwing, { scale: 'crimson', breath: 'flame' })
    expect(breathVictims(flame, at, primary, [near, far]).map((v) => v.ref)).toEqual([near.ref])
    const storm = tuneDragon(PETS.cinderwing, { scale: 'crimson', breath: 'storm' })
    expect(breathVictims(storm, at, primary, [far, near]).map((v) => v.ref)).toEqual([near.ref, far.ref])
  })
})

import { SPECIALS, distanceToSegment } from '../src/logic/dragons.js'

describe('dragon specials', () => {
  it('gives every dragon its own special', () => {
    const ids = dragons.map((d) => d.special)
    expect(new Set(ids).size).toBe(dragons.length)
    for (const d of dragons) expect(SPECIALS[d.special], d.id).toBeTruthy()
    expect(PETS.voidmaw.special).toBe('voidbeam')
    expect(tuneDragon(PETS.voidmaw, {}).specialInfo.id).toBe('voidbeam')
  })

  it('measures distance to a beam line', () => {
    const a = { x: 0, z: 0 }
    const b = { x: 10, z: 0 }
    expect(distanceToSegment({ x: 5, z: 2 }, a, b)).toBeCloseTo(2)
    expect(distanceToSegment({ x: 13, z: 4 }, a, b)).toBeCloseTo(5)
  })
})

describe('dragon unlocks', () => {
  it('only lets you pick skins and breaths you have found, besides the dragon\'s own', () => {
    const p = createProfile()
    expect(setDragonOption(p, 'glacier', 'scale', 'obsidian')).toBe(p)
    expect(setDragonOption(p, 'glacier', 'breath', 'void')).toBe(p)
    expect(setDragonOption(p, 'glacier', 'scale', 'azure').dragons.glacier.scale).toBe('azure')
    const q = unlockDragonPart(unlockDragonPart(p, 'skin', 'obsidian'), 'breath', 'void')
    expect(setDragonOption(q, 'glacier', 'scale', 'obsidian').dragons.glacier.scale).toBe('obsidian')
    expect(setDragonOption(q, 'glacier', 'breath', 'void').dragons.glacier.breath).toBe('void')
    expect(unlockDragonPart(q, 'skin', 'obsidian')).toBe(q)
    expect(unlockDragonPart(q, 'skin', 'nope')).toBe(q)
  })

  it('drops skins and breaths from chests only once you have a dragon', () => {
    const inv = { weapons: ['staff'], abilities: [], pets: [], equipped: [], powerups: [] }
    const unlocked = createProfile().unlocked
    const kinds = (list) => new Set(list.map((l) => l.kind))
    expect(kinds(availableLoot(inv, unlocked)).has('skin')).toBe(false)
    expect(kinds(availableLoot({ ...inv, pets: ['glacier'] }, unlocked)).has('skin')).toBe(true)
    expect(kinds(availableLoot(inv, unlocked, ['voidmaw'])).has('breath')).toBe(false) // found once, but not out now
    const all = { ...unlocked, skins: Object.keys(SCALES), breaths: Object.keys(BREATHS) }
    expect(kinds(availableLoot({ ...inv, pets: ['glacier'] }, all)).has('skin')).toBe(false)
  })
})

describe('dragon part rarity', () => {
  it('keeps dragon parts to a small share of chests', () => {
    const inv = { weapons: ['staff'], abilities: [], pets: ['glacier'], equipped: [], powerups: [] }
    const unlocked = createProfile().unlocked
    let n = 0
    let parts = 0
    let seed = 7
    const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    for (let i = 0; i < 4000; i++) {
      const loot = rollChestLoot(inv, rng, unlocked)
      n++
      if (loot.kind === 'skin' || loot.kind === 'breath') parts++
    }
    expect(parts / n).toBeLessThan(0.07)
    expect(parts / n).toBeGreaterThan(0.01)
  })
})
