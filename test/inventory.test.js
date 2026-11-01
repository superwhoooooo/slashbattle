import { describe, expect, it } from 'vitest'
import {
  abilityCooldownFraction,
  addCrystals,
  availableLoot,
  chestCost,
  createInventory,
  grantItem,
  rollChestLoot,
  selectWeaponSlot,
  selectedWeaponId,
  spendCrystals,
  useAbility,
} from '../src/logic/inventory.js'
import { ABILITIES, ABILITY_SLOTS, BASE_MAGNET_RADIUS, HOTBAR_SLOTS, MAX_PETS, PETS, WEAPONS, petEffects } from '../src/logic/items.js'

function createSeededRng(seed) {
  let state = seed + 1
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff
    return state / 0x7fffffff
  }
}

describe('catalogs', () => {
  it('are bigger than the slots, so a full loadout differs run to run', () => {
    expect(Object.keys(WEAPONS).length).toBeGreaterThan(HOTBAR_SLOTS)
    expect(Object.keys(ABILITIES).length).toBeGreaterThan(ABILITY_SLOTS)
    expect(Object.keys(PETS).length).toBeGreaterThan(MAX_PETS)
    expect(Object.keys(PETS)).toHaveLength(21)
  })

  it('makes the staff a ranged starter whose orbs are magic, and the sword a chest find', () => {
    expect(WEAPONS.staff.gun).toBe(true)
    expect(WEAPONS.staff.cause).toBe('magic')
    expect(createInventory().weapons).toEqual(['staff'])
    expect(availableLoot(createInventory())).toContainEqual({ kind: 'weapon', id: 'sword' })
    expect(availableLoot(createInventory())).not.toContainEqual({ kind: 'weapon', id: 'staff' })
  })

  it('keys every entry by its own id', () => {
    for (const catalog of [WEAPONS, ABILITIES, PETS]) {
      for (const [key, item] of Object.entries(catalog)) expect(item.id).toBe(key)
    }
  })

  it('gives every firearm bullet stats and every non-gun a melee arc', () => {
    const guns = Object.values(WEAPONS).filter((w) => w.gun)
    expect(guns.length).toBeGreaterThanOrEqual(5)
    for (const gun of guns) {
      expect(gun.pellets).toBeGreaterThan(0)
      for (const key of ['speed', 'life', 'radius']) expect(gun.bullet[key]).toBeGreaterThan(0)
    }
  })

  it('gives every pet a known kind with the numbers that kind needs', () => {
    const needs = {
      zap: ['damage', 'interval', 'range'],
      throw: ['damage', 'interval', 'range', 'saberColor'],
      pulse: ['damage', 'interval', 'radius'],
      heal: ['amount', 'interval'],
      magnet: ['radius'],
      guard: ['reduction'],
    }
    for (const pet of Object.values(PETS)) {
      expect(Object.keys(needs)).toContain(pet.kind)
      for (const key of needs[pet.kind]) expect(pet[key]).toBeTruthy()
    }
  })

  it('gives every weapon positive stats', () => {
    for (const w of Object.values(WEAPONS)) {
      for (const key of ['damage', 'range', 'cooldown', 'swing']) expect(w[key]).toBeGreaterThan(0)
      if (!w.gun) expect(w.arc).toBeGreaterThan(0) // a firearm has no melee arc
      expect(w.swing).toBeLessThanOrEqual(w.cooldown + 0.1)
    }
  })

  it('gives every weapon a short hotbar label', () => {
    expect(WEAPONS.staff.short).toBe('Staff')
    expect(WEAPONS.sword.short).toBe('Sword')
    expect(WEAPONS.dagger.short).toBe('Dagger')
    expect(WEAPONS.spear.short).toBe('Spear')
    expect(WEAPONS.hammer.short).toBe('Hammer')
    expect(WEAPONS.scythe.short).toBe('Scythe')
  })
})

describe('crystals', () => {
  it('adds and spends, refusing when short', () => {
    let inv = addCrystals(createInventory(), 10)
    expect(inv.crystals).toBe(10)
    const paid = spendCrystals(inv, 4)
    expect(paid.ok).toBe(true)
    expect(paid.inventory.crystals).toBe(6)
    const broke = spendCrystals(paid.inventory, 7)
    expect(broke.ok).toBe(false)
    expect(broke.inventory.crystals).toBe(6)
  })

  it('does not mutate the inventory passed in', () => {
    const inv = createInventory()
    addCrystals(inv, 5)
    expect(inv.crystals).toBe(0)
  })
})

describe('hotbar', () => {
  it('starts with the wizard staff selected', () => {
    expect(selectedWeaponId(createInventory())).toBe('staff')
  })

  it('selects filled slots and ignores empty ones', () => {
    let inv = grantItem(createInventory(), { kind: 'weapon', id: 'hammer' })
    expect(selectedWeaponId(inv)).toBe('hammer') // a new weapon is equipped right away
    inv = selectWeaponSlot(inv, 0)
    expect(selectedWeaponId(inv)).toBe('staff')
    expect(selectWeaponSlot(inv, 3).selected).toBe(0)
  })

  it('does not grant a duplicate', () => {
    const inv = grantItem(createInventory(), { kind: 'weapon', id: 'staff' })
    expect(inv.weapons).toEqual(['staff'])
  })
})

describe('chest loot', () => {
  it('never rolls something already owned, and eventually runs dry', () => {
    let inv = createInventory()
    const rng = createSeededRng(7)
    const seen = new Set()
    for (let i = 0; i < 100; i++) {
      const loot = rollChestLoot(inv, rng)
      if (!loot) break
      const key = `${loot.kind}:${loot.id}`
      expect(seen.has(key)).toBe(false)
      seen.add(key)
      inv = grantItem(inv, loot)
    }
    // 4 other hotbar slots + 5 ability slots + 5 pet slots, however big the catalogs are
    expect(seen.size).toBe(HOTBAR_SLOTS - 1 + ABILITY_SLOTS + MAX_PETS)
    expect(inv.weapons).toHaveLength(HOTBAR_SLOTS)
    expect(inv.abilities).toHaveLength(ABILITY_SLOTS)
    expect(inv.pets).toHaveLength(MAX_PETS)
    expect(rollChestLoot(inv, rng)).toBeNull()
    expect(availableLoot(inv)).toEqual([])
  })

  it('fills the same slots with different loadouts for different seeds', () => {
    const loadouts = new Set()
    for (let seed = 0; seed < 20; seed++) {
      let inv = createInventory()
      const rng = createSeededRng(seed)
      for (let i = 0; i < 100; i++) {
        const loot = rollChestLoot(inv, rng)
        if (!loot) break
        inv = grantItem(inv, loot)
      }
      loadouts.add(JSON.stringify([inv.weapons, inv.abilities, inv.pets]))
    }
    expect(loadouts.size).toBeGreaterThan(10)
  })

  it('rolls across all three categories', () => {
    const kinds = new Set()
    for (let seed = 0; seed < 60; seed++) kinds.add(rollChestLoot(createInventory(), createSeededRng(seed)).kind)
    expect(kinds).toEqual(new Set(['weapon', 'ability', 'pet']))
  })

  it('makes later chests cost more', () => {
    expect(chestCost(3, () => 0)).toBeGreaterThan(chestCost(0, () => 0.99))
    expect(chestCost(0, () => 0)).toBeGreaterThan(0)
  })
})

describe('abilities', () => {
  it('fires a bound ability, then holds it on cooldown', () => {
    let inv = grantItem(createInventory(), { kind: 'ability', id: 'blink' })
    const first = useAbility(inv, 0, 10)
    expect(first.abilityId).toBe('blink')
    inv = first.inventory
    expect(useAbility(inv, 0, 11).abilityId).toBeNull()
    expect(abilityCooldownFraction(inv, 'blink', 10)).toBe(1)
    expect(abilityCooldownFraction(inv, 'blink', 10 + ABILITIES.blink.cooldown / 2)).toBeCloseTo(0.5)
    expect(useAbility(inv, 0, 10 + ABILITIES.blink.cooldown).abilityId).toBe('blink')
  })

  it('does nothing for an empty slot', () => {
    expect(useAbility(createInventory(), 2, 5).abilityId).toBeNull()
  })
})

describe('petEffects', () => {
  it('has no effect with no pets', () => {
    expect(petEffects([])).toEqual({
      magnetRadius: BASE_MAGNET_RADIUS,
      damageTakenMultiplier: 1,
      damageMultiplier: 1,
      cooldownMultiplier: 1,
      speedMultiplier: 1,
      crystalMultiplier: 1,
      knockbackMultiplier: 1,
    })
  })

  it('widens the crystal pull with a magnet pet and trims damage with a guard pet', () => {
    const fx = petEffects(['magneto', 'shieldy', 'sparky'])
    expect(fx.magnetRadius).toBe(PETS.magneto.radius)
    expect(fx.damageTakenMultiplier).toBeCloseTo(0.75)
  })

  it('makes every pet that is not a healer, magnet or guard an attacker', () => {
    for (const pet of Object.values(PETS)) {
      expect(['zap', 'pulse', 'throw', 'heal', 'magnet', 'guard']).toContain(pet.kind)
    }
    const fighters = Object.values(PETS).filter((pet) => pet.kind === 'zap' || pet.kind === 'pulse')
    expect(fighters.length).toBeGreaterThanOrEqual(12)
    const fx = petEffects(Object.keys(PETS))
    expect(fx.damageMultiplier).toBe(1)
    expect(fx.speedMultiplier).toBe(1)
    expect(fx.crystalMultiplier).toBe(1)
  })

  it('gives every pet a real model', async () => {
    const { PET_MODELS } = await import('../src/petModels.js')
    const { createPetModel } = await import('../src/petModels.js')
    for (const pet of Object.values(PETS)) {
      expect(PET_MODELS).toContain(pet.model)
      const model = createPetModel(pet)
      expect(model.children.length).toBeGreaterThan(2)
      expect(typeof model.userData.fly).toBe('boolean')
      expect(() => model.userData.animate(1.3, true)).not.toThrow()
    }
  })

  it('keeps the damage floor with several guard pets', () => {
    expect(petEffects(['shieldy', 'plated']).damageTakenMultiplier).toBeCloseTo(0.75 * 0.85)
  })
})
