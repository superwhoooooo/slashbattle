// Pure, Three-free inventory rules: crystals, the weapon hotbar, ability
// slots with cooldowns, owned pets, and what a chest rolls. Every
// function returns a NEW inventory (never mutating its argument), like
// the wave controller.
import {
  ABILITIES,
  ABILITY_SLOTS,
  HOTBAR_SLOTS,
  MAX_PETS,
  PETS,
  WEAPONS,
} from './items.js'

export function createInventory() {
  return {
    crystals: 0,
    weapons: ['sword'], // hotbar slots, in the order they were found
    selected: 0, // index into `weapons`
    abilities: [], // ability ids, in the order found (bound to ABILITY_KEYS)
    abilityReadyAt: {}, // ability id -> game time it's ready again
    pets: [],
    chestsOpened: 0,
  }
}

export function addCrystals(inventory, amount) {
  return { ...inventory, crystals: inventory.crystals + amount }
}

// Pays `cost` crystals; { ok: false } (and no change) if you can't afford it.
export function spendCrystals(inventory, cost) {
  if (inventory.crystals < cost) return { inventory, ok: false }
  return { inventory: { ...inventory, crystals: inventory.crystals - cost }, ok: true }
}

export function selectedWeaponId(inventory) {
  return inventory.weapons[inventory.selected]
}

// Selects hotbar `slot` if something's in it (otherwise no change).
export function selectWeaponSlot(inventory, slot) {
  if (slot < 0 || slot >= inventory.weapons.length) return inventory
  return { ...inventory, selected: slot }
}

// Everything a chest could still hand out: weapons, abilities and pets
// not yet owned, while there's room for them.
export function availableLoot(inventory) {
  const loot = []
  if (inventory.weapons.length < HOTBAR_SLOTS) {
    for (const id of Object.keys(WEAPONS)) if (!inventory.weapons.includes(id)) loot.push({ kind: 'weapon', id })
  }
  if (inventory.abilities.length < ABILITY_SLOTS) {
    for (const id of Object.keys(ABILITIES)) if (!inventory.abilities.includes(id)) loot.push({ kind: 'ability', id })
  }
  if (inventory.pets.length < MAX_PETS) {
    for (const id of Object.keys(PETS)) if (!inventory.pets.includes(id)) loot.push({ kind: 'pet', id })
  }
  return loot
}

// Rolls a chest's reward: first a category (weapon / ability / pet, equal
// odds among the categories that still have something to give), then an
// item within it. null once you own everything.
export function rollChestLoot(inventory, rng = Math.random) {
  const loot = availableLoot(inventory)
  if (loot.length === 0) return null
  const kinds = [...new Set(loot.map((item) => item.kind))]
  const kind = kinds[Math.min(Math.floor(rng() * kinds.length), kinds.length - 1)]
  const pool = loot.filter((item) => item.kind === kind)
  return pool[Math.min(Math.floor(rng() * pool.length), pool.length - 1)]
}

// Adds a rolled item. A new weapon goes in the next hotbar slot and is
// selected right away.
export function grantItem(inventory, { kind, id }) {
  if (kind === 'weapon' && !inventory.weapons.includes(id)) {
    const weapons = [...inventory.weapons, id]
    return { ...inventory, weapons, selected: weapons.length - 1 }
  }
  if (kind === 'ability' && !inventory.abilities.includes(id)) {
    return { ...inventory, abilities: [...inventory.abilities, id] }
  }
  if (kind === 'pet' && !inventory.pets.includes(id)) {
    return { ...inventory, pets: [...inventory.pets, id] }
  }
  return inventory
}

export const CHEST_BASE_COST = 6
export const CHEST_COST_GROWTH = 4

// What a chest costs, climbing with how many have been opened (with a
// little random wobble so two on the field aren't identical).
export function chestCost(chestsOpened, rng = Math.random) {
  return CHEST_BASE_COST + CHEST_COST_GROWTH * chestsOpened + Math.floor(rng() * 3)
}

// Uses the ability in `slot` if it exists and is off cooldown. Returns
// { inventory, abilityId } -- abilityId null when nothing fired.
export function useAbility(inventory, slot, now) {
  const id = inventory.abilities[slot]
  if (!id) return { inventory, abilityId: null }
  if (now < (inventory.abilityReadyAt[id] ?? 0)) return { inventory, abilityId: null }
  return {
    inventory: { ...inventory, abilityReadyAt: { ...inventory.abilityReadyAt, [id]: now + ABILITIES[id].cooldown } },
    abilityId: id,
  }
}

// 0 = ready, 1 = just used; for the cooldown overlay on an ability slot.
export function abilityCooldownFraction(inventory, id, now) {
  const readyAt = inventory.abilityReadyAt[id] ?? 0
  return Math.min(1, Math.max(0, (readyAt - now) / ABILITIES[id].cooldown))
}
