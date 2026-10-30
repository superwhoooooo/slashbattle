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
  it('fit exactly in the hotbar, ability slots and pet cap', () => {
    expect(Object.keys(WEAPONS)).toHaveLength(HOTBAR_SLOTS)
    expect(Object.keys(ABILITIES)).toHaveLength(ABILITY_SLOTS)
    expect(Object.keys(PETS)).toHaveLength(MAX_PETS)
  })

  it('gives every weapon positive stats', () => {
    for (const w of Object.values(WEAPONS)) {
      for (const key of ['damage', 'range', 'arc', 'cooldown', 'swing']) expect(w[key]).toBeGreaterThan(0)
      expect(w.swing).toBeLessThanOrEqual(w.cooldown + 0.1)
    }
  })

  it('gives every weapon a short hotbar label', () => {
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
  it('starts with the sword selected', () => {
    expect(selectedWeaponId(createInventory())).toBe('sword')
  })

  it('selects filled slots and ignores empty ones', () => {
    let inv = grantItem(createInventory(), { kind: 'weapon', id: 'hammer' })
    expect(selectedWeaponId(inv)).toBe('hammer') // a new weapon is equipped right away
    inv = selectWeaponSlot(inv, 0)
    expect(selectedWeaponId(inv)).toBe('sword')
    expect(selectWeaponSlot(inv, 3).selected).toBe(0)
  })

  it('does not grant a duplicate', () => {
    const inv = grantItem(createInventory(), { kind: 'weapon', id: 'sword' })
    expect(inv.weapons).toEqual(['sword'])
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
    // 4 other weapons + 5 abilities + 5 pets
    expect(seen.size).toBe(14)
    expect(rollChestLoot(inv, rng)).toBeNull()
    expect(availableLoot(inv)).toEqual([])
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
    expect(petEffects([])).toEqual({ magnetRadius: BASE_MAGNET_RADIUS, damageTakenMultiplier: 1 })
  })

  it('widens the crystal pull with a magnet pet and trims damage with a guard pet', () => {
    const fx = petEffects(['magneto', 'shieldy', 'sparky'])
    expect(fx.magnetRadius).toBe(PETS.magneto.radius)
    expect(fx.damageTakenMultiplier).toBeCloseTo(0.75)
  })
})
