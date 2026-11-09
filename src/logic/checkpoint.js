// Pure, Three-free rules for the Wilds' save points: the Sanctum and every village save your
// progress the moment you walk into them, and if you ever fall in battle (or off the world) you
// get back up at the last one instead of losing the run. The spot is also remembered between
// sessions (`slashbattle:checkpoint`, one of the save keys) so a new Wilds run starts there.
import { SANCTUM_RADIUS, WORLD_RADIUS } from './world.js'

export const CHECKPOINT_KEY = 'slashbattle:checkpoint'
export const SANCTUM_SPOT = { id: 'sanctum', name: 'The Sanctum', x: 0, z: 0 }
export const SANCTUM_SAVE_RADIUS = SANCTUM_RADIUS - 6 // the same ground that mends you
export const VILLAGE_SAVE_RADIUS = 18 // the plaza and the ring of cottages round it
export const VILLAGE_SPAWN_OFFSET = 4.5 // you get up beside the well, not inside it
export const RESPAWN_IFRAMES = 4 // seconds of invulnerability after getting back up

// The save point whose ground (x, z) is on: the Sanctum, a village (`villageList` is world.js's
// `villages()`), or null out in the wild. Returns { id, name, x, z } where x, z is where you'd get up.
export function saveSpotAt(x, z, villageList = []) {
  if (Math.hypot(x, z) < SANCTUM_SAVE_RADIUS) return SANCTUM_SPOT
  for (const v of villageList) {
    if (Math.hypot(x - v.x, z - v.z) < VILLAGE_SAVE_RADIUS) return { id: v.id, name: v.name, x: v.x + VILLAGE_SPAWN_OFFSET, z: v.z }
  }
  return null
}

// True when standing on `spot` should write a new save (it isn't the one already saved).
export const shouldSave = (current, spot) => !!spot && (!current || current.id !== spot.id)

// The spot to get up at: the saved one, or the Sanctum if nothing has been saved yet.
export const respawnSpot = (checkpoint) => checkpoint ?? SANCTUM_SPOT

export const serializeCheckpoint = (spot) => JSON.stringify({ id: spot.id, name: spot.name, x: spot.x, z: spot.z })

// Reads a saved spot back, or null if it is missing, damaged, or somewhere off the world.
export function parseCheckpoint(text) {
  if (typeof text !== 'string') return null
  let data
  try {
    data = JSON.parse(text)
  } catch {
    return null
  }
  if (!data || typeof data.id !== 'string' || typeof data.name !== 'string') return null
  if (!Number.isFinite(data.x) || !Number.isFinite(data.z)) return null
  if (Math.hypot(data.x, data.z) > WORLD_RADIUS - 5) return null
  return { id: data.id, name: data.name, x: data.x, z: data.z }
}
