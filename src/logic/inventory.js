// Pure, Three-free inventory rules: crystals, the weapon hotbar, ability
// slots with cooldowns, owned pets, and what a chest rolls. Every
// function returns a NEW inventory (never mutating its argument), like
// the wave controller.
import {
  ABILITIES,
  HOTBAR_SLOTS,
  PETS,
  POWERUPS,
  SLOT_LIMITS,
  WEAPONS,
} from './items.js'
import { BREATH_IDS, SKIN_IDS, isBreathUnlocked, isDragon, isSkinUnlocked } from './dragons.js'
import { AMMO_IDS, SCOPE_IDS, isAmmoUnlocked, isScopeUnlocked } from './rifles.js'

export function createInventory() {
  return {
    crystals: 0,
    weapons: ['staff'], // hotbar slots, in the order they were found
    selected: 0, // index into `weapons`
    abilities: [], // ability ids, in the order found (bound to ABILITY_KEYS)
    abilityReadyAt: {}, // ability id -> game time it's ready again
    pets: [],
    powerups: [], // power-ups found (owned)
    equipped: [], // the ones switched on in the Tab menu (up to SLOT_LIMITS.powerups)
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

// Everything a chest could still hand out: every weapon, ability and pet
// not yet owned. When that category is already full, the item is still
// on offer -- you get to swap it in for something you have (see needsSwap).
export function availableLoot(inventory, unlocked = null, collection = []) {
  const loot = []
  for (const id of Object.keys(WEAPONS)) if (!inventory.weapons.includes(id)) loot.push({ kind: 'weapon', id })
  for (const id of Object.keys(ABILITIES)) if (!inventory.abilities.includes(id)) loot.push({ kind: 'ability', id })
  for (const id of Object.keys(PETS)) if (!inventory.pets.includes(id)) loot.push({ kind: 'pet', id })
  // Scopes and ammo only drop once you carry a rifle to put them on, and only ones you haven't found.
  if (unlocked && inventory.weapons.some((id) => WEAPONS[id]?.rifle)) {
    for (const id of SCOPE_IDS) if (!isScopeUnlocked(unlocked, id)) loot.push({ kind: 'scope', id })
    for (const id of AMMO_IDS) if (!isAmmoUnlocked(unlocked, id)) loot.push({ kind: 'ammo', id })
  }
  // Dragon skins and breaths only drop while you are carrying a dragon to put them on (`collection` is unused).
  const hasDragon = inventory.pets.some((id) => isDragon(PETS[id]))
  if (unlocked && hasDragon) {
    for (const id of SKIN_IDS) if (!isSkinUnlocked(unlocked, id)) loot.push({ kind: 'skin', id })
    for (const id of BREATH_IDS) if (!isBreathUnlocked(unlocked, id)) loot.push({ kind: 'breath', id })
  }
  return loot
}

// Power-ups aren't in chests any more: they lie on the ground. These are the
// ones you don't own yet, i.e. what a pickup can be.
export function availablePowerups(inventory) {
  return Object.keys(POWERUPS).filter((id) => !(inventory.powerups ?? []).includes(id))
}

// True when `loot` is a weapon / ability / pet whose slots are all taken, so
// the player has to pick something to swap out (or pass on it).
export function needsSwap(inventory, { kind }) {
  if (kind === 'weapon') return inventory.weapons.length >= HOTBAR_SLOTS
  if (kind === 'ability') return inventory.abilities.length >= SLOT_LIMITS.abilities
  if (kind === 'pet') return inventory.pets.length >= SLOT_LIMITS.pets
  return false
}

// What can be swapped out for a `kind` of loot: everything owned of that
// kind except the Wizard Staff, which is fixed in hotbar slot 1.
export function swappableIds(inventory, kind) {
  if (kind === 'weapon') return inventory.weapons.filter((id) => id !== 'staff')
  if (kind === 'ability') return inventory.abilities
  if (kind === 'pet') return inventory.pets
  return []
}

// Replaces owned item `outId` with the new loot, in the same slot. A new
// weapon becomes the selected one. Returns the inventory unchanged if
// `outId` can't be swapped.
export function swapItem(inventory, { kind, id }, outId) {
  if (!swappableIds(inventory, kind).includes(outId)) return inventory
  if (kind === 'weapon') {
    const weapons = inventory.weapons.map((w) => (w === outId ? id : w))
    return { ...inventory, weapons, selected: weapons.indexOf(id) }
  }
  if (kind === 'ability') {
    const { [outId]: _gone, ...abilityReadyAt } = inventory.abilityReadyAt
    return { ...inventory, abilities: inventory.abilities.map((a) => (a === outId ? id : a)), abilityReadyAt }
  }
  return { ...inventory, pets: inventory.pets.map((p) => (p === outId ? id : p)) }
}

// How likely each chest category is, relative to the others. Scopes and ammo share one
// "attachment" category and are weighted well down: they never need a free slot, so late in a
// run -- with the pet slot, hotbar and ability slots full and everything else asking for a swap --
// they were the one thing a chest just handed over, a quarter of all chests. At 0.35 they're about
// 1 chest in 9 while weapons, abilities and pets are all still on offer.
// Dragon skins and breaths are their own, rarer category (0.12: roughly 1 chest in 25 while the other
// three are on offer) so the 12 of them never crowd out real loot, and they only drop while a dragon is out.
export const CHEST_CATEGORY_WEIGHTS = { weapon: 1, ability: 1, pet: 1, attachment: 0.35, dragonpart: 0.12 }

// Rolls a chest's reward: first a category (weighted by CHEST_CATEGORY_WEIGHTS among the
// categories that still have something to give), then an item within it. null once you own
// everything.
export function rollChestLoot(inventory, rng = Math.random, unlocked = null, collection = []) {
  const loot = availableLoot(inventory, unlocked, collection)
  if (loot.length === 0) return null
  const categoryOf = (item) => (item.kind === 'scope' || item.kind === 'ammo' ? 'attachment' : item.kind === 'skin' || item.kind === 'breath' ? 'dragonpart' : item.kind)
  const kinds = [...new Set(loot.map(categoryOf))]
  const weights = kinds.map((k) => CHEST_CATEGORY_WEIGHTS[k] ?? 1)
  let pick = rng() * weights.reduce((a, b) => a + b, 0)
  let kind = kinds[kinds.length - 1]
  for (let i = 0; i < kinds.length; i++) {
    if (pick < weights[i]) { kind = kinds[i]; break }
    pick -= weights[i]
  }
  const pool = loot.filter((item) => categoryOf(item) === kind)
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
  if (kind === 'powerup' && !inventory.powerups.includes(id)) {
    // A new power-up switches itself on if there's a free slot.
    const equipped = inventory.equipped.length < SLOT_LIMITS.powerups ? [...inventory.equipped, id] : inventory.equipped
    return { ...inventory, powerups: [...inventory.powerups, id], equipped }
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
export function useAbility(inventory, slot, now, cooldownScale = 1) {
  const id = inventory.abilities[slot]
  if (!id) return { inventory, abilityId: null }
  if (now < (inventory.abilityReadyAt[id] ?? 0)) return { inventory, abilityId: null }
  return {
    inventory: { ...inventory, abilityReadyAt: { ...inventory.abilityReadyAt, [id]: now + ABILITIES[id].cooldown * cooldownScale } },
    abilityId: id,
  }
}

// 0 = ready, 1 = just used; for the cooldown overlay on an ability slot.
export function abilityCooldownFraction(inventory, id, now) {
  const readyAt = inventory.abilityReadyAt[id] ?? 0
  return Math.min(1, Math.max(0, (readyAt - now) / ABILITIES[id].cooldown))
}

// Switches an OWNED power-up on or off (the Tab menu). Switching one on with
// every slot taken swaps out the one that's been on longest.
export function toggleEquipPowerup(inventory, id) {
  if (!inventory.powerups.includes(id)) return inventory
  if (inventory.equipped.includes(id)) return { ...inventory, equipped: inventory.equipped.filter((p) => p !== id) }
  const equipped = inventory.equipped.length < SLOT_LIMITS.powerups ? inventory.equipped : inventory.equipped.slice(1)
  return { ...inventory, equipped: [...equipped, id] }
}
