import { describe, expect, it } from 'vitest'
import {
  abilityCooldownFraction,
  addCrystals,
  availableLoot,
  chestCost,
  createInventory,
  grantItem,
  needsSwap,
  swapItem,
  swappableIds,
  rollChestLoot,
  selectWeaponSlot,
  selectedWeaponId,
  spendCrystals,
  toggleEquipPowerup,
  useAbility,
} from '../src/logic/inventory.js'
import { ABILITIES, ABILITY_SLOTS, BASE_MAGNET_RADIUS, HOTBAR_SLOTS, MAX_PETS, PETS, POWERUPS, POWERUP_SLOTS, WEAPONS, petEffects, powerupEffects } from '../src/logic/items.js'

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
    expect(Object.keys(PETS)).toHaveLength(38)
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
      lunge: ['damage', 'interval', 'strike'],
      explode: ['damage', 'interval', 'blast'],
      shot: ['damage', 'interval', 'range', 'projectile'],
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
    for (let i = 0; i < 200; i++) {
      const loot = rollChestLoot(inv, rng)
      if (!loot) break
      // Never something currently owned (a swapped-out item may come back).
      const owned = { weapon: inv.weapons, ability: inv.abilities, pet: inv.pets, powerup: inv.powerups }[loot.kind]
      expect(owned).not.toContain(loot.id)
      seen.add(`${loot.kind}:${loot.id}`)
      // A full category swaps the new item in for the first swappable one.
      inv = needsSwap(inv, loot) ? swapItem(inv, loot, swappableIds(inv, loot.kind)[0]) : grantItem(inv, loot)
    }
    expect(inv.weapons).toHaveLength(HOTBAR_SLOTS)
    expect(inv.abilities).toHaveLength(ABILITY_SLOTS)
    expect(inv.pets).toHaveLength(MAX_PETS)
    expect(seen.size).toBeGreaterThan(HOTBAR_SLOTS + ABILITY_SLOTS + MAX_PETS)
  })

  it('still offers weapons, abilities and pets once their slots are full', () => {
    const inv = { ...createInventory(), weapons: ['staff', 'sword', 'dagger', 'spear', 'hammer'], abilities: ['blink', 'shockwave', 'heal', 'shield', 'rage'], pets: ['sparky', 'blasty', 'healbit', 'magneto', 'shieldy'] }
    const loot = availableLoot(inv)
    for (const kind of ['weapon', 'ability', 'pet']) expect(loot.some((item) => item.kind === kind)).toBe(true)
    expect(needsSwap(inv, { kind: 'weapon', id: 'axe' })).toBe(true)
    expect(needsSwap(inv, { kind: 'powerup', id: 'swift' })).toBe(false)
    expect(needsSwap(createInventory(), { kind: 'weapon', id: 'axe' })).toBe(false)
  })

  it('swaps an owned item for the new one in the same slot, never the staff', () => {
    const inv = { ...createInventory(), weapons: ['staff', 'sword', 'dagger', 'spear', 'hammer'], abilities: ['blink', 'shockwave', 'heal', 'shield', 'rage'], pets: ['sparky', 'blasty', 'healbit', 'magneto', 'shieldy'] }
    expect(swappableIds(inv, 'weapon')).not.toContain('staff')
    expect(swapItem(inv, { kind: 'weapon', id: 'axe' }, 'staff')).toBe(inv)
    const w = swapItem(inv, { kind: 'weapon', id: 'axe' }, 'dagger')
    expect(w.weapons).toEqual(['staff', 'sword', 'axe', 'spear', 'hammer'])
    expect(w.selected).toBe(2)
    expect(swapItem(inv, { kind: 'ability', id: 'meteor' }, 'heal').abilities).toEqual(['blink', 'shockwave', 'meteor', 'shield', 'rage'])
    expect(swapItem(inv, { kind: 'pet', id: 'pandy' }, 'sparky').pets[0]).toBe('pandy')
    expect(swapItem(inv, { kind: 'pet', id: 'pandy' }, 'nope')).toBe(inv)
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

  it('rolls across the three chest categories (power-ups lie on the ground)', () => {
    const kinds = new Set()
    for (let seed = 0; seed < 60; seed++) kinds.add(rollChestLoot(createInventory(), createSeededRng(seed)).kind)
    expect(kinds).toEqual(new Set(['weapon', 'ability', 'pet']))
  })

  it('keeps scopes and ammo to a small share of chests once you carry a rifle', () => {
    const rifle = Object.keys(WEAPONS).find((id) => WEAPONS[id].rifle)
    const inv = grantItem(createInventory(), { kind: 'weapon', id: rifle })
    const unlocked = { scopes: [], ammo: [] }
    const rng = createSeededRng(7)
    let attachments = 0
    const rolls = 4000
    for (let i = 0; i < rolls; i++) {
      const { kind } = rollChestLoot(inv, rng, unlocked)
      if (kind === 'scope' || kind === 'ammo') attachments++
    }
    // weight 0.35 against three categories of weight 1 -> about 10.4%
    expect(attachments / rolls).toBeGreaterThan(0.07)
    expect(attachments / rolls).toBeLessThan(0.14)
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
      expect(['lunge', 'explode', 'zap', 'shot', 'pulse', 'throw', 'heal', 'magnet', 'guard']).toContain(pet.kind)
    }
    const fighters = Object.values(PETS).filter((pet) => pet.kind !== 'heal' && pet.kind !== 'magnet' && pet.kind !== 'guard')
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
      let meshes = 0
      model.traverse((child) => child.isMesh && meshes++)
      expect(meshes).toBeGreaterThan(2)
      expect(typeof model.userData.fly).toBe('boolean')
      expect(() => model.userData.animate(1.3, true)).not.toThrow()
    }
  }, 30000) // builds every pet's model (38 now): slow when the whole suite runs at once

  it('keeps the damage floor with several guard pets', () => {
    expect(petEffects(['shieldy', 'plated']).damageTakenMultiplier).toBeCloseTo(0.75 * 0.85)
  })
})

describe('power-ups', () => {
  const owned = (...ids) => ids.reduce((inv, id) => grantItem(inv, { kind: 'powerup', id }), createInventory())

  it('switch themselves on while there is a free slot, then wait to be equipped', () => {
    const ids = Object.keys(POWERUPS)
    const inv = owned(...ids.slice(0, POWERUP_SLOTS + 1))
    expect(inv.powerups).toHaveLength(POWERUP_SLOTS + 1)
    expect(inv.equipped).toEqual(ids.slice(0, POWERUP_SLOTS))
  })

  it('toggle on and off, swapping out the oldest when full, and ignore ones you do not own', () => {
    const ids = Object.keys(POWERUPS)
    let inv = owned(...ids.slice(0, POWERUP_SLOTS + 1))
    inv = toggleEquipPowerup(inv, ids[POWERUP_SLOTS])
    expect(inv.equipped).toEqual([...ids.slice(1, POWERUP_SLOTS), ids[POWERUP_SLOTS]])
    inv = toggleEquipPowerup(inv, ids[POWERUP_SLOTS])
    expect(inv.equipped).not.toContain(ids[POWERUP_SLOTS])
    expect(toggleEquipPowerup(createInventory(), 'swift').equipped).toEqual([])
  })

  it('multiply together in powerupEffects, and do nothing when none are equipped', () => {
    expect(powerupEffects([])).toEqual({ speed: 1, damage: 1, cooldown: 1, damageTaken: 1, crystal: 1, knockback: 1, killHeal: 0, regen: 0, haste: 1, magnet: 1 })
    const fx = powerupEffects(['swift', 'heavy', 'thick', 'leech'])
    expect(fx.speed).toBeCloseTo(1.2)
    expect(fx.damage).toBeCloseTo(1.25)
    expect(fx.damageTaken).toBeCloseTo(0.8)
    expect(fx.killHeal).toBe(2)
  })
})

describe('Remy & Benji', () => {
  it('are one throwing pet that alternates junk and bananas', () => {
    expect(PETS.benji).toBeUndefined()
    expect(PETS.remy).toBeUndefined()
    expect(PETS.remybenji.kind).toBe('throw')
    expect(PETS.remybenji.thrown).toEqual(['junk', 'banana'])
    expect(PETS.remybenji.model).toBe('remybenji')
  })

  it('split into two kids once equipped, each throwing their own thing', async () => {
    const THREE = await import('three')
    const { createPet, updatePets, disposePets } = await import('../src/pets.js')
    const scene = new THREE.Scene()
    const player = { position: new THREE.Vector3(0, 0, 0), hp: 100, maxHp: 100 }
    const pet = createPet('remybenji', scene, player)
    expect(pet.def.model).toBe('remy')
    expect(pet.def.thrown).toEqual(['junk'])
    expect(pet.buddies).toHaveLength(1)
    expect(pet.buddies[0].def.model).toBe('benji')
    expect(pet.buddies[0].def.thrown).toEqual(['banana'])
    // Each throws at half the pair's rate, so together they hit as hard as the pair did.
    expect(pet.def.interval).toBeCloseTo(PETS.remybenji.interval * 2)
    expect(scene.children).toHaveLength(2)
    // Two enemies: the kids go after different ones.
    const enemy = (x, z) => {
      const m = new THREE.Group()
      m.position.set(x, 0, z)
      m.userData = { hp: 100, maxHp: 100 }
      return m
    }
    const monsters = [enemy(4, 0), enemy(-4, 0)]
    const pets = [pet]
    updatePets(pets, { dt: 0.016, elapsed: 0, player, monsters, obstacles: [], particleSystem: null, hitstop: null, shockwavePool: null })
    expect(pets).toHaveLength(1) // still one equipped pet
    expect(pet.target).toBeTruthy()
    expect(pet.buddies[0].target).toBeTruthy()
    expect(pet.buddies[0].target).not.toBe(pet.target)
    disposePets(pets, scene)
    expect(scene.children).toHaveLength(0)
  })
})
