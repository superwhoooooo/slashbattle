// Pure rules for sandbox mode's item picker: clicking an item in the
// sandbox menu equips it (swapping out another if that bucket is full) or,
// if you already have it, takes it away. Every function returns a NEW
// inventory, like logic/inventory.js.
import { ABILITY_SLOTS, HOTBAR_SLOTS, MAX_PETS } from './items.js'
import { toggleEquipPowerup } from './inventory.js'

// The Wizard Staff is fixed in the first hotbar slot, so it never gets
// removed or swapped out.
const FIXED_WEAPON = 'staff'

// Toggles `{ kind, id }`. Returns { inventory, petRemoved, petAdded }:
// `petRemoved` is the index of the pet that left the pet list (or null) and
// `petAdded` the id of one that joined (or null), so the caller can keep
// the pet meshes in step with `inventory.pets`.
export function sandboxToggleItem(inventory, { kind, id }) {
  const result = { inventory, petRemoved: null, petAdded: null }

  if (kind === 'weapon') {
    const index = inventory.weapons.indexOf(id)
    if (index !== -1) {
      if (id === FIXED_WEAPON) return result
      const weapons = inventory.weapons.filter((w) => w !== id)
      const selected = Math.min(inventory.selected >= index ? Math.max(0, inventory.selected - 1) : inventory.selected, weapons.length - 1)
      result.inventory = { ...inventory, weapons, selected }
    } else if (inventory.weapons.length < HOTBAR_SLOTS) {
      const weapons = [...inventory.weapons, id]
      result.inventory = { ...inventory, weapons, selected: weapons.length - 1 }
    } else {
      // Full: replace the selected weapon, or the last slot if the staff is selected.
      const slot = inventory.weapons[inventory.selected] === FIXED_WEAPON ? inventory.weapons.length - 1 : inventory.selected
      const weapons = inventory.weapons.map((w, i) => (i === slot ? id : w))
      result.inventory = { ...inventory, weapons, selected: slot }
    }
    return result
  }

  if (kind === 'ability') {
    const index = inventory.abilities.indexOf(id)
    if (index !== -1) {
      result.inventory = { ...inventory, abilities: inventory.abilities.filter((a) => a !== id) }
    } else if (inventory.abilities.length < ABILITY_SLOTS) {
      result.inventory = { ...inventory, abilities: [...inventory.abilities, id] }
    } else {
      const abilities = [...inventory.abilities.slice(0, -1), id]
      result.inventory = { ...inventory, abilities }
    }
    return result
  }

  if (kind === 'pet') {
    const index = inventory.pets.indexOf(id)
    if (index !== -1) {
      result.inventory = { ...inventory, pets: inventory.pets.filter((p) => p !== id) }
      result.petRemoved = index
    } else if (inventory.pets.length < MAX_PETS) {
      result.inventory = { ...inventory, pets: [...inventory.pets, id] }
      result.petAdded = id
    } else {
      result.inventory = { ...inventory, pets: [...inventory.pets.slice(0, -1), id] }
      result.petRemoved = inventory.pets.length - 1
      result.petAdded = id
    }
    return result
  }

  if (kind === 'powerup') {
    // Free play: clicking owns AND equips it, clicking again takes it away.
    if (inventory.equipped.includes(id)) {
      result.inventory = { ...inventory, equipped: inventory.equipped.filter((p) => p !== id), powerups: inventory.powerups.filter((p) => p !== id) }
    } else {
      const owned = inventory.powerups.includes(id) ? inventory : { ...inventory, powerups: [...inventory.powerups, id] }
      result.inventory = toggleEquipPowerup(owned, id)
    }
    return result
  }

  return result
}

// Sandbox gives you everything free: a huge crystal stash and no ability
// cooldowns.
export const SANDBOX_CRYSTALS = 9999
export function sandboxTopUp(inventory) {
  return { ...inventory, crystals: SANDBOX_CRYSTALS, abilityReadyAt: {} }
}
