import { describe, expect, it } from 'vitest'
import { createInventory } from '../src/logic/inventory.js'
import { HOTBAR_SLOTS, MAX_PETS, WEAPONS } from '../src/logic/items.js'
import { SANDBOX_CRYSTALS, sandboxToggleItem, sandboxTopUp } from '../src/logic/sandbox.js'

describe('sandbox item toggling', () => {
  it('adds a weapon, selects it, and removes it on a second click', () => {
    const added = sandboxToggleItem(createInventory(), { kind: 'weapon', id: 'hammer' }).inventory
    expect(added.weapons).toEqual(['staff', 'hammer'])
    expect(added.selected).toBe(1)
    const removed = sandboxToggleItem(added, { kind: 'weapon', id: 'hammer' }).inventory
    expect(removed.weapons).toEqual(['staff'])
    expect(removed.selected).toBe(0)
  })

  it('never removes the fixed Wizard Staff', () => {
    const inv = createInventory()
    expect(sandboxToggleItem(inv, { kind: 'weapon', id: 'staff' }).inventory).toBe(inv)
  })

  it('swaps the selected weapon once the hotbar is full', () => {
    let inv = createInventory()
    const ids = Object.keys(WEAPONS).filter((id) => id !== 'staff').slice(0, HOTBAR_SLOTS)
    for (const id of ids.slice(0, HOTBAR_SLOTS - 1)) inv = sandboxToggleItem(inv, { kind: 'weapon', id }).inventory
    expect(inv.weapons).toHaveLength(HOTBAR_SLOTS)
    const extra = ids[HOTBAR_SLOTS - 1]
    const swapped = sandboxToggleItem(inv, { kind: 'weapon', id: extra }).inventory
    expect(swapped.weapons).toHaveLength(HOTBAR_SLOTS)
    expect(swapped.weapons).toContain(extra)
    expect(swapped.weapons[0]).toBe('staff')
  })

  it('toggles abilities and replaces the last when all keys are used', () => {
    let inv = createInventory()
    for (const id of ['blink', 'shockwave', 'heal', 'shield', 'rage']) inv = sandboxToggleItem(inv, { kind: 'ability', id }).inventory
    expect(inv.abilities).toHaveLength(5)
    const swapped = sandboxToggleItem(inv, { kind: 'ability', id: 'lunge' }).inventory
    expect(swapped.abilities).toEqual(['blink', 'shockwave', 'heal', 'shield', 'lunge'])
    expect(sandboxToggleItem(swapped, { kind: 'ability', id: 'blink' }).inventory.abilities).not.toContain('blink')
  })

  it('reports which pet meshes to add and remove', () => {
    let inv = createInventory()
    const first = sandboxToggleItem(inv, { kind: 'pet', id: 'sparky' })
    expect(first.petAdded).toBe('sparky')
    expect(first.petRemoved).toBeNull()
    inv = first.inventory
    const removed = sandboxToggleItem(inv, { kind: 'pet', id: 'sparky' })
    expect(removed.petRemoved).toBe(0)
    expect(removed.petAdded).toBeNull()

    inv = createInventory()
    for (const id of ['sparky', 'blasty', 'ember', 'bolt', 'comet']) inv = sandboxToggleItem(inv, { kind: 'pet', id }).inventory
    expect(inv.pets).toHaveLength(MAX_PETS)
    const swap = sandboxToggleItem(inv, { kind: 'pet', id: 'matthias' })
    expect(swap.inventory.pets).toHaveLength(MAX_PETS)
    expect(swap.petRemoved).toBe(MAX_PETS - 1)
    expect(swap.petAdded).toBe('matthias')
  })

  it('tops up crystals and clears cooldowns', () => {
    const inv = { ...createInventory(), abilityReadyAt: { blink: 99 } }
    const topped = sandboxTopUp(inv)
    expect(topped.crystals).toBe(SANDBOX_CRYSTALS)
    expect(topped.abilityReadyAt).toEqual({})
  })
})
