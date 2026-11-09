// Lost Lanterns: little paper lanterns that drifted away from the villages and came to rest all over the Wilds.
// Walk into one to light it: a few crystals each, a bigger bonus every LANTERN_BONUS_EVERY, and they stay lit
// on this device (kept in the Wilds journal, logic/wildsJournal.js). Pure and seeded.
import { BIOMES, WORLD_SEED, biomeAt, mulberry32 } from './world.js'
import { openGround } from './wildsSpots.js'

export const LANTERN_COUNT = 160
export const LANTERN_CATCH_RADIUS = 2
export const LANTERN_REWARD = 4 // crystals per lantern
export const LANTERN_BONUS_EVERY = 10
export const LANTERN_BONUS = 40 // ...and this much more on every tenth one
const LANTERN_SPACING = 22

let cache = null
const CELL = 64
let grid = null

// Every lantern: { id, x, z, biome, color } (the colour is its biome's glow).
export function lanterns() {
  if (cache) return cache
  const rng = mulberry32(WORLD_SEED + 4242)
  const list = []
  for (let attempt = 0; attempt < 12000 && list.length < LANTERN_COUNT; attempt++) {
    const a = rng() * Math.PI * 2
    const r = Math.sqrt(rng()) * 560
    const x = Math.cos(a) * r
    const z = Math.sin(a) * r
    if (!openGround(x, z, { edge: 24, villageClear: 24, siteMargin: 2 })) continue
    if (list.some((l) => Math.hypot(l.x - x, l.z - z) < LANTERN_SPACING)) continue
    const biome = biomeAt(x, z)
    list.push({ id: `lan${list.length}`, x, z, biome, color: BIOMES[biome].glow })
  }
  cache = list
  grid = new Map()
  for (const l of list) {
    const key = `${Math.floor(l.x / CELL)},${Math.floor(l.z / CELL)}`
    if (!grid.has(key)) grid.set(key, [])
    grid.get(key).push(l)
  }
  return cache
}

// The lanterns within `radius` of (x, z).
export function lanternsNear(x, z, radius) {
  lanterns()
  const out = []
  for (let cx = Math.floor((x - radius) / CELL); cx <= Math.floor((x + radius) / CELL); cx++) {
    for (let cz = Math.floor((z - radius) / CELL); cz <= Math.floor((z + radius) / CELL); cz++) {
      for (const l of grid.get(`${cx},${cz}`) ?? []) if (Math.hypot(l.x - x, l.z - z) <= radius) out.push(l)
    }
  }
  return out
}

// What lighting your `total`th lantern pays (1-based).
export const lanternReward = (total) => LANTERN_REWARD + (total > 0 && total % LANTERN_BONUS_EVERY === 0 ? LANTERN_BONUS : 0)
