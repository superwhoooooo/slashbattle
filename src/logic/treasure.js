// Treasure maps and buried treasure. A map (found at a newly discovered landmark, or bought from the travelling
// merchant) marks a hidden dig spot somewhere out on open ground. The map is vague: the minimap only shows a
// circle the treasure lies within (HINT_RADIUS), and as you walk about it a "heat" reading tells you how close
// you are. Press F right on top of it (within DIG_RADIUS) to dig up a chest and a purse of crystals. Pure.
import { dangerAt, mulberry32 } from './world.js'
import { hashString, openGround } from './wildsSpots.js'

export const DIG_RADIUS = 3.4
export const HINT_RADIUS = 30 // the circle drawn on the minimap
export const MAX_MAPS = 2 // you can carry this many unsolved maps
const MIN_FROM = 70
const MAX_FROM = 170

// A map keyed by `key` (stable: the same landmark always points to the same spot) for treasure buried somewhere
// MIN_FROM..MAX_FROM from `origin`. `from` names where it came from ("The Old Henge").
export function makeTreasureMap(key, origin, from = 'an old map') {
  const rng = mulberry32(hashString(`treasure#${key}`))
  let spot = null
  for (let attempt = 0; attempt < 400 && !spot; attempt++) {
    const a = rng() * Math.PI * 2
    const d = MIN_FROM + rng() * (MAX_FROM - MIN_FROM) * (attempt < 200 ? 1 : 1.5)
    const x = origin.x + Math.cos(a) * d
    const z = origin.z + Math.sin(a) * d
    if (openGround(x, z, { edge: 32, villageClear: 50, siteMargin: 8 })) spot = { x, z }
  }
  if (!spot) {
    // Fall back to somewhere plain near the middle of the Heartland.
    for (let r = 120; !spot && r < 400; r += 20) {
      for (let k = 0; k < 16 && !spot; k++) {
        const x = Math.cos((k / 16) * Math.PI * 2) * r
        const z = Math.sin((k / 16) * Math.PI * 2) * r
        if (openGround(x, z)) spot = { x, z }
      }
    }
  }
  // The circle on the map is off-centre, so the treasure isn't simply in its middle.
  const ha = rng() * Math.PI * 2
  const hd = rng() * HINT_RADIUS * 0.65
  return {
    id: `map:${key}`,
    from,
    x: spot.x,
    z: spot.z,
    hintX: spot.x + Math.cos(ha) * hd,
    hintZ: spot.z + Math.sin(ha) * hd,
    hintRadius: HINT_RADIUS,
    reward: treasureReward(spot),
  }
}

// Crystals in the chest's purse: more the further out it was buried.
export const treasureReward = (spot) => Math.round(40 + dangerAt(spot.x, spot.z) * 90)

// How warm you are, by distance to the treasure: 'here' | 'hot' | 'warm' | 'cool' | 'cold'.
export function heatOf(distance) {
  if (distance <= DIG_RADIUS) return 'here'
  if (distance < 10) return 'hot'
  if (distance < 22) return 'warm'
  if (distance < 45) return 'cool'
  return 'cold'
}
export const HEAT_TEXT = { here: 'RIGHT HERE! DIG (F)', hot: 'HOT!', warm: 'WARM', cool: 'COOL', cold: 'COLD' }

// Digging at (x, z) with `map`: { found, distance, heat }.
export function digAt(map, x, z) {
  const distance = Math.hypot(map.x - x, map.z - z)
  return { found: distance <= DIG_RADIUS, distance, heat: heatOf(distance) }
}

// Adds a map to the ones you carry (unless you carry MAX_MAPS already, or that one's been dug / is held).
export function addMap(maps, map, dug = []) {
  if (maps.length >= MAX_MAPS || maps.some((m) => m.id === map.id) || dug.includes(map.id)) return maps
  return [...maps, map]
}

// The map whose treasure is nearest (x, z), or null.
export function nearestMap(maps, x, z) {
  let best = null
  for (const m of maps) {
    const d = Math.hypot(m.x - x, m.z - z)
    if (!best || d < best.distance) best = { map: m, distance: d }
  }
  return best
}
