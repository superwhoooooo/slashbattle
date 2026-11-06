import { describe, expect, it } from 'vitest'
import { PET_MAX_LEVEL, PETS, petBoost, petEffects, petLevel, petRate, petUpgradeCost } from '../src/logic/items.js'
import { addToCollection, buyPetLevel, createProfile, normalizeProfile } from '../src/logic/profile.js'

describe('pet levels', () => {
  it('scale power and speed with level', () => {
    expect(petBoost(1)).toBe(1)
    expect(petBoost(5)).toBeGreaterThan(petBoost(2))
    expect(petRate(3)).toBeGreaterThan(petRate(1))
    expect(petLevel({}, 'sparky')).toBe(1)
    expect(petLevel({ sparky: 99 }, 'sparky')).toBe(PET_MAX_LEVEL)
  })

  it('costs more each level and stops at the max', () => {
    expect(petUpgradeCost(2)).toBeGreaterThan(petUpgradeCost(1))
    expect(petUpgradeCost(PET_MAX_LEVEL)).toBeNull()
  })

  it('buys levels with banked crystals, only for collected pets', () => {
    let p = { ...createProfile(), bank: 1000 }
    expect(buyPetLevel(p, 'sparky').ok).toBe(false)
    p = addToCollection(p, ['sparky'])
    const r = buyPetLevel(p, 'sparky')
    expect(r.ok).toBe(true)
    expect(r.profile.pets.sparky).toBe(2)
    expect(r.profile.bank).toBe(1000 - petUpgradeCost(1))
    expect(buyPetLevel({ ...p, bank: 0 }, 'sparky').ok).toBe(false)
  })

  it('survives a save round trip and bad data', () => {
    const p = normalizeProfile({ collection: ['sparky'], pets: { sparky: 3, nope: 4, ember: 'x' } })
    expect(p.pets).toEqual({ sparky: 3 })
  })

  it('makes a magnet or guard pet stronger', () => {
    const guard = Object.values(PETS).find((pet) => pet.kind === 'guard')
    expect(petEffects([guard.id], { [guard.id]: 5 }).damageTakenMultiplier).toBeLessThan(petEffects([guard.id]).damageTakenMultiplier)
  })
})
