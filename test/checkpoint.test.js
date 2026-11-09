import { describe, expect, it } from 'vitest'
import { SANCTUM_SPOT, VILLAGE_SAVE_RADIUS, VILLAGE_SPAWN_OFFSET, parseCheckpoint, respawnSpot, saveSpotAt, serializeCheckpoint, shouldSave } from '../src/logic/checkpoint.js'
import { villages, WORLD_RADIUS } from '../src/logic/world.js'

describe('Wilds save points', () => {
  const list = villages()
  const village = list[0]

  it('the Sanctum and every village are save points; the wild is not', () => {
    expect(saveSpotAt(0, 0, list)).toBe(SANCTUM_SPOT)
    expect(saveSpotAt(20, -10, list).id).toBe('sanctum')
    const spot = saveSpotAt(village.x + 3, village.z - 2, list)
    expect(spot.id).toBe(village.id)
    expect(spot.name).toBe(village.name)
    expect(saveSpotAt(WORLD_RADIUS * 0.8, 0, [])).toBeNull()
    expect(saveSpotAt(village.x + VILLAGE_SAVE_RADIUS + 5, village.z, [village])).toBeNull()
  })

  it('a village save point gets you up beside the well, on its plaza', () => {
    const spot = saveSpotAt(village.x, village.z, list)
    expect(spot.x).toBeCloseTo(village.x + VILLAGE_SPAWN_OFFSET)
    expect(spot.z).toBeCloseTo(village.z)
  })

  it('saves only when you reach a new save point', () => {
    expect(shouldSave(null, SANCTUM_SPOT)).toBe(true)
    expect(shouldSave(SANCTUM_SPOT, SANCTUM_SPOT)).toBe(false)
    expect(shouldSave(SANCTUM_SPOT, saveSpotAt(village.x, village.z, list))).toBe(true)
    expect(shouldSave(SANCTUM_SPOT, null)).toBe(false) // out in the wild: nothing to save
  })

  it('gets you up at the saved spot, or the Sanctum before any save', () => {
    expect(respawnSpot(null)).toBe(SANCTUM_SPOT)
    const spot = saveSpotAt(village.x, village.z, list)
    expect(respawnSpot(spot)).toBe(spot)
  })

  it('round-trips through storage and rejects damaged saves', () => {
    const spot = saveSpotAt(village.x, village.z, list)
    expect(parseCheckpoint(serializeCheckpoint(spot))).toEqual(spot)
    for (const bad of [null, '', 'nope', '{}', '{"id":"v1","name":"X","x":"a","z":1}', JSON.stringify({ id: 'v1', name: 'X', x: WORLD_RADIUS * 2, z: 0 })]) {
      expect(parseCheckpoint(bad), String(bad)).toBeNull()
    }
  })
})
