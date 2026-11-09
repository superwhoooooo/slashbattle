// Small shared helpers for the Wilds' activities (lanterns, wayshrines, treasure, races, events): where open
// ground is, a string hash for seeding, and a weighted pick. Pure, no Three.
import { SANCTUM_RADIUS, WORLD_RADIUS, lakeAt, nearestSite, onRoad, villages } from './world.js'

export function hashString(str) {
  let h = 2166136261
  for (const c of String(str)) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return h >>> 0
}

// True when (x, z) is plain wild ground: on the continent (clear of the rim by `edge`), outside the Sanctum,
// out of lakes, off every ruin / landmark floor, off the roads (unless `road` is false) and `villageClear` away
// from any village.
export function openGround(x, z, { edge = 30, road = true, villageClear = 30, siteMargin = 5 } = {}) {
  const r = Math.hypot(x, z)
  if (r > WORLD_RADIUS - edge || r < SANCTUM_RADIUS + 8) return false
  if (lakeAt(x, z, 0.35)) return false
  if (nearestSite(x, z, siteMargin)) return false
  if (road && onRoad(x, z, 1.5)) return false
  for (const v of villages()) if (Math.hypot(v.x - x, v.z - z) < villageClear) return false
  return true
}

// Picks from [[item, weight], ...] (weights > 0).
export function pickWeighted(rng, entries) {
  const total = entries.reduce((sum, e) => sum + e[1], 0)
  let roll = rng() * total
  for (const e of entries) {
    if (roll < e[1]) return e[0]
    roll -= e[1]
  }
  return entries[entries.length - 1][0]
}

// "4.2s" / "1:03.5" for a race clock.
export function formatTime(seconds) {
  const s = Math.max(0, seconds)
  if (s < 60) return `${s.toFixed(1)}s`
  const m = Math.floor(s / 60)
  return `${m}:${(s - m * 60).toFixed(1).padStart(4, '0')}`
}
