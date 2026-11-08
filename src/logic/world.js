// Pure, Three-free rules for the free roam world: a big mystical floating continent split into five
// biomes around a safe central sanctum. Everything is a deterministic function of a seed, so the same
// world comes back every run and chunks can be streamed in and out around the player.
//
//   biomeAt(x, z)        - which biome a point is in
//   groundColorAt(x, z)  - the ground colour there, blended smoothly across biome borders
//   dangerAt(x, z)       - 0 at the sanctum up to 1 at the rim: how tough the monsters are
//   chunkContent(cx, cz) - the props, monsters and treasure seeded into one chunk

import { BOSSES } from './bosses.js'

export const WORLD_RADIUS = 320
export const WORLD_SEED = 7219
export const CHUNK_SIZE = 40
export const LOAD_RADIUS = 125 // chunks whose centre is this close to the player are alive
export const UNLOAD_RADIUS = 150 // ...and drop away beyond this
export const SANCTUM_RADIUS = 46 // the safe, healing heart of the world
export const BOSS_RESPAWN_SECONDS = 900 // a guardian boss takes much longer to return
export const RESPAWN_SECONDS = 200 // a slain camp comes back this long after you killed it

export const BIOMES = {
  sanctum: {
    name: 'The Sanctum',
    ground: [0.62, 0.58, 0.82],
    glow: 0xb9a6ff,
    fog: 0x2a2352,
    grass: 55,
    props: [['obelisk', 1], ['standingStone', 3]],
    monsters: [],
  },
  whisperwood: {
    name: 'Whisperwood',
    ground: [0.16, 0.34, 0.3],
    glow: 0x6dffc9,
    fog: 0x1a3a40,
    grass: 190,
    props: [['mooncap', 3], ['gloomTree', 6], ['wisp', 2]],
    monsters: [['blobbo', 5, 0], ['hopper', 3, 0.1], ['grumpus', 3, 0.15], ['splitter', 2, 0.45], ['bumble', 3, 0.05], ['sporeling', 3, 0.1], ['wispy', 2, 0.35]],
  },
  amethyst: {
    name: 'Amethyst Dunes',
    ground: [0.55, 0.38, 0.62],
    glow: 0xe28bff,
    fog: 0x3c2352,
    grass: 110,
    props: [['crystal', 6], ['dunerock', 3], ['wisp', 1]],
    monsters: [['zippy', 5, 0], ['mirror', 3, 0.25], ['glimmer', 3, 0.3], ['spinner', 2, 0.4], ['boogle', 3, 0.15], ['snapper', 3, 0.2], ['drillbit', 3, 0.3]],
  },
  frostveil: {
    name: 'Frostveil Reach',
    ground: [0.7, 0.82, 0.92],
    glow: 0x9be7ff,
    fog: 0x27415c,
    grass: 100,
    props: [['iceSpire', 5], ['frostPine', 5], ['wisp', 1]],
    monsters: [['zippy', 3, 0], ['grumpus', 4, 0.1], ['splitter', 3, 0.3], ['bloater', 2, 0.4], ['icicle', 4, 0.05], ['twister', 3, 0.35], ['boogle', 2, 0.3]],
  },
  emberwaste: {
    name: 'Emberwaste',
    ground: [0.26, 0.15, 0.14],
    glow: 0xff7a3a,
    fog: 0x401a14,
    grass: 45,
    props: [['obsidian', 6], ['emberRock', 4], ['wisp', 1]],
    monsters: [['grumpus', 4, 0], ['spinner', 3, 0.2], ['bloater', 3, 0.25], ['hopper', 2, 0.3], ['kablooma', 4, 0.1], ['prickle', 4, 0.05], ['drillbit', 3, 0.25]],
  },
  gloomfen: {
    name: 'Gloomfen',
    ground: [0.2, 0.26, 0.14],
    glow: 0xc6ff4a,
    fog: 0x22301a,
    grass: 170,
    props: [['deadTree', 5], ['lanternReed', 5], ['mooncap', 2]],
    monsters: [['blobbo', 3, 0], ['bloater', 4, 0.1], ['splitter', 3, 0.2], ['hopper', 3, 0.2], ['sporeling', 3, 0.05], ['boogle', 3, 0.1], ['snapper', 2, 0.25], ['wispy', 3, 0.2]],
  },
}

const WATER_MONSTERS = [['urchin', 3, 0], ['eel', 3, 0.08], ['angler', 2, 0.22]] // [type, weight, minDanger]
export const OUTER_BIOMES = ['whisperwood', 'amethyst', 'frostveil', 'emberwaste', 'gloomfen']

// ---- seeded noise -----------------------------------------------------------------------------

function hash2(x, z, seed) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(z | 0, 668265263) + Math.imul(seed | 0, 2147483647)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

const smooth = (t) => t * t * (3 - 2 * t)

// Smooth value noise in [0, 1].
export function valueNoise(x, z, seed = WORLD_SEED) {
  const x0 = Math.floor(x)
  const z0 = Math.floor(z)
  const tx = smooth(x - x0)
  const tz = smooth(z - z0)
  const a = hash2(x0, z0, seed)
  const b = hash2(x0 + 1, z0, seed)
  const c = hash2(x0, z0 + 1, seed)
  const d = hash2(x0 + 1, z0 + 1, seed)
  return a + (b - a) * tx + (c - a) * tz + (a - b - c + d) * tx * tz
}

export function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ---- biomes -----------------------------------------------------------------------------------

// The continuous "sector" coordinate of a point: which fifth of the ring it lies in, wobbled by noise so
// the borders meander instead of running as straight spokes. Integer part = biome slot, fraction = place in it.
function sectorCoordinate(x, z) {
  const angle = Math.atan2(z, x) / (Math.PI * 2) + 0.5 // 0..1
  const r = Math.hypot(x, z)
  const wobble = (valueNoise(x * 0.012, z * 0.012, WORLD_SEED + 1) - 0.5) * 0.22 + (valueNoise(x * 0.04, z * 0.04, WORLD_SEED + 2) - 0.5) * 0.05
  const coordinate = (angle + wobble) * OUTER_BIOMES.length
  return { coordinate, r }
}

export function biomeAt(x, z) {
  const { coordinate, r } = sectorCoordinate(x, z)
  if (r < SANCTUM_RADIUS) return 'sanctum'
  const slot = ((Math.floor(coordinate) % OUTER_BIOMES.length) + OUTER_BIOMES.length) % OUTER_BIOMES.length
  return OUTER_BIOMES[slot]
}

// 0 at the sanctum's edge to 1 at the rim of the world.
export function dangerAt(x, z) {
  const r = Math.hypot(x, z)
  return Math.min(1, Math.max(0, (r - SANCTUM_RADIUS) / (WORLD_RADIUS - SANCTUM_RADIUS)))
}

const mix = (a, b, t) => a + (b - a) * t

// Ground colour [r, g, b] (0-1) at a point: the biome's colour, blended with its neighbour near a border and
// with the sanctum near the centre, then dappled by noise so the ground isn't flat.
export function groundColorAt(x, z) {
  const { coordinate, r } = sectorCoordinate(x, z)
  const n = OUTER_BIOMES.length
  const base = Math.floor(coordinate)
  const frac = coordinate - base
  const slot = ((base % n) + n) % n
  const here = BIOMES[OUTER_BIOMES[slot]].ground
  const next = BIOMES[OUTER_BIOMES[(slot + 1) % n]].ground
  const prev = BIOMES[OUTER_BIOMES[(slot + n - 1) % n]].ground
  // Blend over the outer 22% of each sector toward the neighbour on that side.
  const edge = 0.22
  let color = here
  if (frac > 1 - edge) color = here.map((c, i) => mix(c, (c + next[i]) / 2, smooth((frac - (1 - edge)) / edge)))
  else if (frac < edge) color = here.map((c, i) => mix(c, (c + prev[i]) / 2, smooth((edge - frac) / edge)))
  const sanctum = BIOMES.sanctum.ground
  const toSanctum = 1 - smooth(Math.min(1, Math.max(0, (r - (SANCTUM_RADIUS - 10)) / 26)))
  const dapple = 0.82 + valueNoise(x * 0.09, z * 0.09, WORLD_SEED + 3) * 0.36 + (valueNoise(x * 0.4, z * 0.4, WORLD_SEED + 4) - 0.5) * 0.08
  let land = color.map((c, i) => Math.min(1, mix(c, sanctum[i], toSanctum) * dapple))
  // Lakes: pale sand on the shore, a dark blue-green bed under the water.
  for (const lake of LAKES) {
    if (Math.hypot(x - lake.x, z - lake.z) > lake.radius * 1.9) continue
    const d = lakeDistance(lake, x, z)
    if (d >= 1.3) continue
    const sand = [0.78, 0.72, 0.52]
    const bed = [0.1, 0.28, 0.36]
    land = land.map((c, i) => mix(mix(c, sand[i] * dapple, smooth((1.3 - d) / 0.35)), bed[i], smooth((1 - d) / 0.4)))
  }
  // Ruins sit on old flagstones.
  const ruin = nearestRuin(x, z, RUIN_PLATFORM_RADIUS + 4)
  if (ruin) {
    const t = 1 - smooth(Math.min(1, Math.max(0, (ruin.distance - (RUIN_PLATFORM_RADIUS - 3)) / 7)))
    const flags = [0.5, 0.48, 0.56]
    land = land.map((c, i) => mix(c, flags[i] * (0.85 + dapple * 0.18), t * 0.85))
  }
  // A village's plaza is paved in warm stone, fading back into the grass.
  const near = nearestVillage(x, z, VILLAGE_PLAZA_RADIUS + 5)
  if (near) {
    const t = 1 - smooth(Math.min(1, Math.max(0, (near.distance - (VILLAGE_PLAZA_RADIUS - 3)) / 8)))
    const paving = [0.74, 0.68, 0.62]
    return land.map((c, i) => mix(c, Math.min(1, paving[i] * (0.9 + dapple * 0.12)), t))
  }
  return land
}


// ---- hills --------------------------------------------------------------------------------------------

// A handful of big seeded mounds, to give the land landmarks to climb and steer by.
const MOUNDS = (() => {
  const rng = mulberry32(WORLD_SEED + 500)
  const list = []
  for (let i = 0; i < 30; i++) {
    const angle = rng() * Math.PI * 2
    const r = SANCTUM_RADIUS + 50 + rng() * (WORLD_RADIUS - SANCTUM_RADIUS - 115)
    // Most are tall hills; every fifth is a real peak, high enough to launch a paraglider from.
    const peak = i % 5 === 0
    list.push({ x: Math.cos(angle) * r, z: Math.sin(angle) * r, radius: (peak ? 34 : 24) + rng() * 20, height: peak ? 26 + rng() * 10 : 12 + rng() * 9 })
  }
  return list
})()

// Ground height before the sanctum, rim and villages flatten it: broad rolling swells, finer bumps, and the mounds.
function rawTerrain(x, z) {
  const broad = (valueNoise(x * 0.009, z * 0.009, WORLD_SEED + 21) - 0.5) * 2
  const mid = (valueNoise(x * 0.024, z * 0.024, WORLD_SEED + 22) - 0.5) * 2
  let h = broad * 8 + mid * 3 + 1.4
  let hill = 0
  for (const m of MOUNDS) {
    const d2 = ((x - m.x) ** 2 + (z - m.z) ** 2) / (m.radius * m.radius)
    if (d2 < 9) hill = Math.max(hill, m.height * Math.exp(-d2 * 1.3)) // overlapping hills merge instead of stacking
  }
  h += hill
  return h > 0 ? h : h * 0.1 // valleys flatten into meadows instead of digging pits
}

// Hills fade out toward the sanctum (a level, sacred floor) and toward the rim (so the edge meets the rock).
function terrainHeight(x, z) {
  const r = Math.hypot(x, z)
  const inner = smooth(Math.min(1, Math.max(0, (r - (SANCTUM_RADIUS - 6)) / 44)))
  const outer = 1 - smooth(Math.min(1, Math.max(0, (r - (WORLD_RADIUS - 46)) / 40)))
  return lakeHeight(x, z, rawTerrain(x, z) * inner * outer)
}

// ---- lakes --------------------------------------------------------------------------------------------

export const WATER_LEVEL = 0 // the surface of every lake
const LAKE_BED = -1.9 // the lake floor: wadeable, with the head and shoulders above the surface
const LAKE_NOISE_SEED = WORLD_SEED + 30
const STARTER_SITE = { x: 62, z: -46 }

// Seeded lakes scattered over the outer land, clear of the Sanctum and the starter village.
export const LAKES = (() => {
  const rng = mulberry32(WORLD_SEED + 700)
  const list = []
  for (let attempt = 0; attempt < 5000 && list.length < 9; attempt++) {
    const angle = rng() * Math.PI * 2
    const r = SANCTUM_RADIUS + 62 + rng() * (WORLD_RADIUS - SANCTUM_RADIUS - 135)
    const x = Math.cos(angle) * r
    const z = Math.sin(angle) * r
    const radius = 17 + rng() * 14
    if (Math.hypot(x - STARTER_SITE.x, z - STARTER_SITE.z) < radius + 80) continue
    if (list.some((l) => Math.hypot(l.x - x, l.z - z) < l.radius + radius + 55)) continue
    // Only on low ground: a lake dug into a hillside would leave a cliff.
    let low = true
    for (let k = 0; k < 12 && low; k++) low = rawTerrain(x + Math.cos(k * 0.52) * radius * 1.6, z + Math.sin(k * 0.52) * radius * 1.6) < 6.5
    if (!low || rawTerrain(x, z) > 6.5) continue
    list.push({ id: `lake${list.length}`, x, z, radius })
  }
  return list
})()

// How far (in lake radii, with a wobbly shoreline) a point is from a lake's middle: < 1 is water.
function lakeDistance(lake, x, z) {
  return Math.hypot(x - lake.x, z - lake.z) / lake.radius + (valueNoise(x * 0.045, z * 0.045, LAKE_NOISE_SEED) - 0.5) * 0.45
}

// The lake whose bed contains this point (the ground is below the surface), else null.
export function lakeAt(x, z, margin = 0) {
  for (const lake of LAKES) {
    if (Math.hypot(x - lake.x, z - lake.z) > lake.radius * 1.9) continue
    if (lakeDistance(lake, x, z) < 0.85 + margin) return lake
  }
  return null
}

// Banks level out toward the lake and the floor drops away to LAKE_BED.
function lakeHeight(x, z, h) {
  for (const lake of LAKES) {
    if (Math.hypot(x - lake.x, z - lake.z) > lake.radius * 1.9) continue
    const d = lakeDistance(lake, x, z)
    if (d >= 1.3) continue
    const bank = smooth(Math.min(1, Math.max(0, (1.3 - d) / 0.5)))
    h = h + (Math.min(h, 1) - h) * bank
    const bed = smooth(Math.min(1, Math.max(0, (1 - d) / 0.45)))
    h = h * (1 - bed) + LAKE_BED * bed
  }
  return h
}

// ---- villages -----------------------------------------------------------------------------------------

export const VILLAGE_PLAZA_RADIUS = 13 // the paved, level square at a village's heart
export const VILLAGE_SAFE_RADIUS = 46 // no wild monsters inside this
const VILLAGE_CELL = 190
export const VILLAGE_MIN_SEPARATION = 150 // villages are a real trek apart
const VILLAGE_PREFIX = ['Mist', 'Star', 'Moon', 'Ember', 'Frost', 'Glim', 'Whisper', 'Amber', 'Silver', 'Dusk', 'Lantern', 'Briar', 'Thistle', 'Hollow']
const VILLAGE_SUFFIX = ['haven', 'hollow', 'watch', 'rest', 'fall', 'ford', 'moor', 'glade', 'reach', 'wick']
const NPC_NAMES = ['Mira', 'Oren', 'Thessaly', 'Bram', 'Lyra', 'Corin', 'Isolde', 'Fenn', 'Maren', 'Tobin', 'Sable', 'Wren', 'Edda', 'Joss', 'Nell', 'Perrin', 'Anwen', 'Kestrel', 'Odell', 'Ysolde', 'Haldor', 'Sorrel', 'Pim', 'Garrick']
const NPC_COLORS = [0x7fe0b8, 0xb9a6ff, 0xffd98a, 0x8fd0ff, 0xff9ab8, 0xa6f0a0, 0xffb38a, 0xd0a6ff]
const NPC_ROLES = ['Warden', 'Lantern-keeper', 'Herbalist', 'Stargazer', 'Wayfinder', 'Elder', 'Tinker', 'Ranger']

let villageCache = null

// Every village in the world: one guaranteed just outside the Sanctum, the rest seeded across a coarse grid.
export function villages() {
  if (villageCache) return villageCache
  const sites = [{ x: 62, z: -46, starter: true }]
  const span = Math.ceil(WORLD_RADIUS / VILLAGE_CELL) + 1
  for (let i = -span; i <= span; i++) {
    for (let j = -span; j <= span; j++) {
      const rng = mulberry32(Math.imul(i, 40503) ^ Math.imul(j, 9176) ^ (WORLD_SEED + 91))
      if (rng() > 0.97) continue
      const x = (i + 0.5) * VILLAGE_CELL + (rng() - 0.5) * 110
      const z = (j + 0.5) * VILLAGE_CELL + (rng() - 0.5) * 110
      const r = Math.hypot(x, z)
      if (r < SANCTUM_RADIUS + 50 || r > WORLD_RADIUS - 55) continue
      if (lakeAt(x, z, 0.9) || LAKES.some((l) => Math.hypot(l.x - x, l.z - z) < l.radius * 1.25 + 30)) continue
      if (sites.some((s) => Math.hypot(s.x - x, s.z - z) < VILLAGE_MIN_SEPARATION)) continue
      sites.push({ x, z })
    }
  }
  // Every biome gets at least one village, so no region is left without people.
  for (const biome of OUTER_BIOMES) {
    if (sites.some((s) => biomeAt(s.x, s.z) === biome)) continue
    search: for (const separation of [VILLAGE_MIN_SEPARATION, 120, 95]) {
      for (const r of [170, 200, 140, 225]) {
        for (let a = 0; a < 360; a += 6) {
          const x = Math.cos((a * Math.PI) / 180) * r
          const z = Math.sin((a * Math.PI) / 180) * r
          if (biomeAt(x, z) !== biome || sites.some((s) => Math.hypot(s.x - x, s.z - z) < separation)) continue
          if (LAKES.some((l) => Math.hypot(l.x - x, l.z - z) < l.radius * 1.25 + 30)) continue
          sites.push({ x, z })
          break search
        }
      }
    }
  }
  villageCache = sites.map((site, index) => {
    const rng = mulberry32(index * 7919 + WORLD_SEED + 3)
    return {
      id: `v${index}`,
      index,
      x: site.x,
      z: site.z,
      starter: Boolean(site.starter),
      name: VILLAGE_PREFIX[Math.floor(rng() * VILLAGE_PREFIX.length)] + VILLAGE_SUFFIX[Math.floor(rng() * VILLAGE_SUFFIX.length)],
      baseHeight: terrainHeight(site.x, site.z),
      biome: biomeAt(site.x, site.z),
    }
  })
  return villageCache
}

export const villageById = (id) => villages().find((v) => v.id === id) ?? null

// The village (if any) whose centre is within `radius` of a point, with the distance.
export function nearestVillage(x, z, radius = Infinity) {
  let best = null
  for (const v of villages()) {
    const d = Math.hypot(v.x - x, v.z - z)
    if (d <= radius && (!best || d < best.distance)) best = { village: v, distance: d }
  }
  return best
}

// Ground height at any point: the hills, levelled flat under each village's plaza and easing back into the land.
export function heightAt(x, z) {
  let h = terrainHeight(x, z)
  for (const v of villages()) {
    const d = Math.hypot(v.x - x, v.z - z)
    if (d > VILLAGE_PLAZA_RADIUS + 26) continue
    const w = 1 - smooth(Math.min(1, Math.max(0, (d - VILLAGE_PLAZA_RADIUS) / 26)))
    h = h + (v.baseHeight - h) * w
  }
  for (const r of ruins()) {
    const d = Math.hypot(r.x - x, r.z - z)
    if (d > RUIN_PLATFORM_RADIUS + 30) continue
    const w = 1 - smooth(Math.min(1, Math.max(0, (d - RUIN_PLATFORM_RADIUS) / 30)))
    h = h + (r.baseHeight - h) * w
  }
  return h
}

// ---- ruins, temples and towers ----------------------------------------------------------------------

export const RUIN_PLATFORM_RADIUS = 13
const RUIN_NAMES = ['Sunken Temple', 'Broken Watch', 'Old Shrine', 'Lost Sanctum', 'Hollow Spire', 'Dusk Temple', 'Forgotten Keep', 'Starfall Shrine']
let ruinCache = null

// Seeded ruin sites: a temple with a guardian boss, a tower with a chest, or a lone shrine. Kept away from
// villages, lakes and the Sanctum, and well spaced out.
export function ruins() {
  if (ruinCache) return ruinCache
  const rng = mulberry32(WORLD_SEED + 900)
  const sites = []
  const kinds = ['temple', 'tower', 'shrine', 'temple', 'tower', 'shrine', 'temple', 'tower', 'shrine', 'tower', 'temple', 'shrine']
  for (let attempt = 0; attempt < 900 && sites.length < kinds.length; attempt++) {
    const angle = rng() * Math.PI * 2
    const r = SANCTUM_RADIUS + 45 + rng() * (WORLD_RADIUS - SANCTUM_RADIUS - 105)
    const x = Math.cos(angle) * r
    const z = Math.sin(angle) * r
    if (villages().some((v) => Math.hypot(v.x - x, v.z - z) < 75)) continue
    if (LAKES.some((l) => Math.hypot(l.x - x, l.z - z) < l.radius * 1.5 + 30)) continue
    if (sites.some((q) => Math.hypot(q.x - x, q.z - z) < 85)) continue
    sites.push({ x, z, kind: kinds[sites.length] })
  }
  ruinCache = sites.map((site, index) => ({
    id: `r${index}`,
    index,
    kind: site.kind,
    x: site.x,
    z: site.z,
    name: RUIN_NAMES[index % RUIN_NAMES.length],
    baseHeight: terrainHeight(site.x, site.z),
    biome: biomeAt(site.x, site.z),
  }))
  return ruinCache
}

export function nearestRuin(x, z, radius = Infinity) {
  let best = null
  for (const r of ruins()) {
    const d = Math.hypot(r.x - x, r.z - z)
    if (d <= radius && (!best || d < best.distance)) best = { ruin: r, distance: d }
  }
  return best
}

// A ruin's stones, its loot and its guards (all seeded). A temple's guardian is a boss that waits inside.
//   props - like any prop   treasure - [{ id, kind, x, z }]   guards - [{ id, role: 'boss' | 'elite' | 'guard', x, z }]
export function ruinLayout(ruin) {
  const rng = mulberry32(ruin.index * 6151 + WORLD_SEED + 11)
  const props = []
  const treasure = []
  const guards = []
  const add = (kind, x, z, scale = 1, rot = rng() * Math.PI * 2) => props.push({ kind, x, z, scale, rot, radius: PROP_RADIUS[kind] * scale })
  const ring = (n, radius, pickKind, start = rng() * 6.28) => {
    for (let i = 0; i < n; i++) {
      const a = start + (i / n) * Math.PI * 2
      add(pickKind(i), ruin.x + Math.cos(a) * radius, ruin.z + Math.sin(a) * radius, 0.95 + rng() * 0.2)
    }
  }
  const guardAt = (role, i, radius) => {
    const a = rng() * Math.PI * 2
    guards.push({ id: `${ruin.id}:g${i}`, role, x: ruin.x + Math.cos(a) * radius, z: ruin.z + Math.sin(a) * radius })
  }
  if (ruin.kind === 'temple') {
    add('temple', ruin.x, ruin.z, 1, 0)
    ring(8, 8.5, (i) => (rng() < 0.4 ? 'columnBroken' : 'column'))
    for (let i = 0; i < 3; i++) add('ruinWall', ruin.x + Math.cos(0.5 + i * 0.7) * 11.5, ruin.z + Math.sin(0.5 + i * 0.7) * 11.5, 1, 0.5 + i * 0.7 + Math.PI / 2)
    add('shrine', ruin.x, ruin.z, 1.1, 0)
    treasure.push({ id: `${ruin.id}:chest`, kind: 'chest', x: ruin.x + 4.2, z: ruin.z + 1.5 })
    if (rng() < 0.6) treasure.push({ id: `${ruin.id}:perk`, kind: 'perk', x: ruin.x - 4, z: ruin.z - 1.5 })
    guards.push({ id: `${ruin.id}:boss`, role: 'boss', x: ruin.x - 5, z: ruin.z + 5 })
    guardAt('elite', 1, 9)
    guardAt('elite', 2, 9)
  } else if (ruin.kind === 'tower') {
    add('tower', ruin.x, ruin.z, 1.1 + rng() * 0.2, 0)
    for (let i = 0; i < 3; i++) add('ruinWall', ruin.x + Math.cos(i * 2.1 + 0.4) * 8, ruin.z + Math.sin(i * 2.1 + 0.4) * 8, 0.9, i * 2.1 + 0.4 + Math.PI / 2)
    ring(4, 11, () => 'columnBroken')
    treasure.push({ id: `${ruin.id}:chest`, kind: 'chest', x: ruin.x + 5, z: ruin.z + 4 })
    guardAt('elite', 1, 8)
    guardAt('guard', 2, 9)
    guardAt('guard', 3, 9)
  } else {
    add('shrine', ruin.x, ruin.z, 1.3, 0)
    ring(6, 6.5, (i) => (i % 2 ? 'standingStone' : 'columnBroken'))
    treasure.push({ id: `${ruin.id}:perk`, kind: 'perk', x: ruin.x + 3, z: ruin.z + 2 })
    treasure.push({ id: `${ruin.id}:pod`, kind: 'pod', x: ruin.x - 3.5, z: ruin.z - 2 })
    guardAt('elite', 1, 8)
  }
  return { props, treasure, guards }
}

// A village's buildings, lamps, well and notice board, and the people who live there (all seeded).
//   props - [{ kind, x, z, scale, rot, radius }]   npcs - [{ id, name, role, color, x, z, villageId }]
export function villageLayout(village) {
  const rng = mulberry32(village.index * 104729 + WORLD_SEED)
  const props = [{ kind: 'well', x: village.x, z: village.z, scale: 1, rot: 0, radius: PROP_RADIUS.well }]
  const houseKinds = ['cottage', 'cottageTeal', 'cottageAmber']
  const houses = 5 + Math.floor(rng() * 3)
  const offset = rng() * Math.PI * 2
  for (let i = 0; i < houses; i++) {
    const a = offset + (i / houses) * Math.PI * 2 + (rng() - 0.5) * 0.25
    const r = 15 + rng() * 5
    const x = village.x + Math.cos(a) * r
    const z = village.z + Math.sin(a) * r
    const big = i === 0
    props.push({
      kind: big ? 'hall' : houseKinds[Math.floor(rng() * houseKinds.length)],
      x,
      z,
      scale: big ? 1 : 0.9 + rng() * 0.3,
      rot: Math.atan2(village.x - x, village.z - z), // the door faces the plaza
      radius: big ? PROP_RADIUS.hall : PROP_RADIUS.cottage,
    })
  }
  for (let i = 0; i < 4; i++) {
    const a = offset + Math.PI / 4 + (i / 4) * Math.PI * 2
    props.push({ kind: 'lampPost', x: village.x + Math.cos(a) * 7, z: village.z + Math.sin(a) * 7, scale: 1, rot: 0, radius: PROP_RADIUS.lampPost })
  }
  props.push({ kind: 'noticeBoard', x: village.x + Math.cos(offset + 0.4) * 10.5, z: village.z + Math.sin(offset + 0.4) * 10.5, scale: 1, rot: offset + 0.4 + Math.PI / 2, radius: PROP_RADIUS.noticeBoard })
  const npcs = []
  const count = 3
  const used = new Set()
  for (let i = 0; i < count; i++) {
    const a = offset + 0.9 + (i / count) * Math.PI * 2
    let name
    do name = NPC_NAMES[Math.floor(rng() * NPC_NAMES.length)]
    while (used.has(name))
    used.add(name)
    npcs.push({
      id: `${village.id}:${i}`,
      villageId: village.id,
      name,
      role: NPC_ROLES[Math.floor(rng() * NPC_ROLES.length)],
      color: NPC_COLORS[Math.floor(rng() * NPC_COLORS.length)],
      x: village.x + Math.cos(a) * 9,
      z: village.z + Math.sin(a) * 9,
    })
  }
  return { props, npcs }
}

// ---- chunks -----------------------------------------------------------------------------------

export const chunkCoord = (v) => Math.floor(v / CHUNK_SIZE)
export const chunkKey = (cx, cz) => `${cx},${cz}`
export const chunkCenter = (cx, cz) => ({ x: (cx + 0.5) * CHUNK_SIZE, z: (cz + 0.5) * CHUNK_SIZE })

// Every chunk whose centre lies within `radius` of (x, z) and inside the world.
export function chunksAround(x, z, radius = LOAD_RADIUS) {
  const out = []
  const span = Math.ceil(radius / CHUNK_SIZE) + 1
  const pcx = chunkCoord(x)
  const pcz = chunkCoord(z)
  for (let cx = pcx - span; cx <= pcx + span; cx++) {
    for (let cz = pcz - span; cz <= pcz + span; cz++) {
      const c = chunkCenter(cx, cz)
      if (Math.hypot(c.x - x, c.z - z) > radius) continue
      if (Math.hypot(c.x, c.z) > WORLD_RADIUS - 4) continue
      out.push({ cx, cz })
    }
  }
  return out
}

// Collision radius per prop kind (0 = walk-through decoration). `scale` multiplies it.
export const PROP_RADIUS = {
  obelisk: 1.4, standingStone: 1.1,
  mooncap: 1.3, gloomTree: 1.0, wisp: 0,
  crystal: 1.5, dunerock: 1.7,
  iceSpire: 1.2, frostPine: 0.8,
  obsidian: 1.3, emberRock: 1.5,
  deadTree: 0.7, lanternReed: 0,
  ruinArch: 2.4,
  column: 0.8, columnBroken: 0.8, ruinWall: 2.0, shrine: 1.2, tower: 2.8, temple: 0,
  cottage: 2.9, cottageTeal: 2.9, cottageAmber: 2.9, hall: 4.2, well: 1.3, lampPost: 0.35, noticeBoard: 0.9,
}

function pickWeighted(rng, entries, weightIndex = 1) {
  const total = entries.reduce((sum, e) => sum + e[weightIndex], 0)
  let roll = rng() * total
  for (const entry of entries) {
    roll -= entry[weightIndex]
    if (roll <= 0) return entry
  }
  return entries[entries.length - 1]
}

// What is seeded into chunk (cx, cz): { biome, props, monsters, treasure }.
//   props    - [{ kind, x, z, scale, rot, radius }] (radius > 0 blocks movement)
//   monsters - [{ id, type, x, z, hpScale, elite }] ; `id` is stable, so a slain one can be remembered
//   treasure - [{ id, kind: 'chest' | 'pod' | 'perk', x, z }]
export function chunkContent(cx, cz) {
  const rng = mulberry32(Math.imul(cx, 73856093) ^ Math.imul(cz, 19349663) ^ WORLD_SEED)
  const center = chunkCenter(cx, cz)
  const out = { cx, cz, key: chunkKey(cx, cz), biome: biomeAt(center.x, center.z), props: [], monsters: [], treasure: [], grass: [], npcs: [] }
  if (Math.hypot(center.x, center.z) > WORLD_RADIUS - 4) return out
  const biome = BIOMES[out.biome]
  const place = () => ({ x: cx * CHUNK_SIZE + 2 + rng() * (CHUNK_SIZE - 4), z: cz * CHUNK_SIZE + 2 + rng() * (CHUNK_SIZE - 4) })
  const inWorld = (p) => Math.hypot(p.x, p.z) < WORLD_RADIUS - 6

  // Scenery: denser in the wild, sparse and stately in the sanctum.
  const propCount = out.biome === 'sanctum' ? 3 + Math.floor(rng() * 3) : 8 + Math.floor(rng() * 8)
  for (let i = 0; i < propCount; i++) {
    const p = place()
    if (!inWorld(p)) continue
    // The very centre stays clear for the spawn point, and villages keep their own streets clear.
    if (Math.hypot(p.x, p.z) < 9) continue
    if (nearestVillage(p.x, p.z, VILLAGE_PLAZA_RADIUS + 22)) continue
    if (lakeAt(p.x, p.z, 0.35) || nearestRuin(p.x, p.z, RUIN_PLATFORM_RADIUS + 2)) continue // no trees in the water or in the ruins
    const kind = pickWeighted(rng, biome.props)[0]
    const scale = 0.75 + rng() * 0.8
    out.props.push({ kind, x: p.x, z: p.z, scale, rot: rng() * Math.PI * 2, radius: PROP_RADIUS[kind] * scale })
  }
  // A ruined arch now and then, anywhere out of the sanctum: a landmark to steer by.
  if (out.biome !== 'sanctum' && rng() < 0.12) {
    const p = place()
    if (inWorld(p) && !lakeAt(p.x, p.z, 0.5) && !nearestRuin(p.x, p.z, RUIN_PLATFORM_RADIUS + 4) && !nearestVillage(p.x, p.z, VILLAGE_PLAZA_RADIUS + 22)) out.props.push({ kind: 'ruinArch', x: p.x, z: p.z, scale: 1.2 + rng() * 0.6, rot: rng() * Math.PI * 2, radius: PROP_RADIUS.ruinArch })
  }

  // Monsters in camps: a few per chunk, more and meaner the farther from the sanctum.
  if (biome.monsters.length) {
    const danger = dangerAt(center.x, center.z)
    const count = Math.floor(rng() * (2 + danger * 3.2)) + (rng() < 0.55 ? 1 : 0)
    for (let i = 0; i < count; i++) {
      const p = place()
      if (!inWorld(p) || Math.hypot(p.x, p.z) < SANCTUM_RADIUS + 6) continue
      if (nearestVillage(p.x, p.z, VILLAGE_SAFE_RADIUS)) continue // villages are safe
      if (lakeAt(p.x, p.z, 0.3) || nearestRuin(p.x, p.z, RUIN_PLATFORM_RADIUS + 3)) continue // land monsters keep out of the water; ruins have their own guards
      const options = biome.monsters.filter((m) => danger >= m[2])
      const [type] = pickWeighted(rng, options)
      const elite = rng() < 0.05 + danger * 0.18
      out.monsters.push({
        id: `${out.key}:${i}`,
        type,
        x: p.x,
        z: p.z,
        elite,
        danger,
        hpScale: (1 + danger * 1.6) * (elite ? 2.4 : 1),
      })
    }
  }

  // The village that stands in this chunk: its buildings, and its people.
  const inChunk = (p) => p.x >= cx * CHUNK_SIZE && p.x < (cx + 1) * CHUNK_SIZE && p.z >= cz * CHUNK_SIZE && p.z < (cz + 1) * CHUNK_SIZE
  for (const v of villages()) {
    if (Math.hypot(v.x - center.x, v.z - center.z) > 60) continue
    const layout = villageLayout(v)
    for (const p of layout.props) if (inChunk(p)) out.props.push(p)
    for (const n of layout.npcs) if (inChunk(n)) out.npcs.push(n)
  }

  // Lakes: water monsters live in the one whose middle falls in this chunk (they stay in it).
  const lakeRng = mulberry32(Math.imul(cx, 15485863) ^ Math.imul(cz, 32452843) ^ (WORLD_SEED + 55))
  for (const lake of LAKES) {
    if (!inChunk(lake)) continue
    const danger = dangerAt(lake.x, lake.z)
    const options = WATER_MONSTERS.filter((m) => danger >= m[2])
    const count = 2 + Math.floor(lakeRng() * 3) + (lake.radius > 25 ? 1 : 0)
    for (let i = 0; i < count; i++) {
      const [type] = pickWeighted(lakeRng, options)
      const a = lakeRng() * Math.PI * 2
      const d = lake.radius * (0.15 + lakeRng() * 0.45)
      const elite = lakeRng() < 0.06 + danger * 0.2
      out.monsters.push({
        id: `${lake.id}:m${i}`,
        type,
        x: lake.x + Math.cos(a) * d,
        z: lake.z + Math.sin(a) * d,
        elite,
        danger,
        hpScale: (1 + danger * 1.4) * (elite ? 2.4 : 1),
        lake: { x: lake.x, z: lake.z, radius: lake.radius * 0.8 },
      })
    }
  }

  // Ruins: stones, loot and guards. A temple's guardian is a boss (hpScale / danger follow the land around it).
  for (const ruin of ruins()) {
    if (Math.hypot(ruin.x - center.x, ruin.z - center.z) > 60) continue
    const layout = ruinLayout(ruin)
    for (const prop of layout.props) if (inChunk(prop)) out.props.push(prop)
    for (const t of layout.treasure) if (inChunk(t)) out.treasure.push(t)
    const danger = Math.max(0.3, dangerAt(ruin.x, ruin.z))
    for (const g of layout.guards) {
      if (!inChunk(g)) continue
      if (g.role === 'boss') {
        const boss = BOSSES[ruin.index % BOSSES.length]
        out.monsters.push({ id: g.id, type: boss.id, x: g.x, z: g.z, elite: false, boss: true, danger, hpScale: 0.9 + danger * 1.1, ruinId: ruin.id, name: ruin.name })
        continue
      }
      const options = biome.monsters.filter((m) => danger >= m[2])
      if (!options.length) continue
      const elite = g.role === 'elite'
      const [type] = pickWeighted(rng, options)
      out.monsters.push({ id: g.id, type, x: g.x, z: g.z, elite, danger, hpScale: (1 + danger * 1.6) * (elite ? 2.4 : 1) })
    }
  }

  // Grass: tufts scattered over the chunk (a separate random stream, so it never shifts props or monsters).
  // `tint` (0-1) picks a shade between the biome's base and tip colours; `scale` varies the height.
  const grassRng = mulberry32((Math.imul(cx, 83492791) ^ Math.imul(cz, 297121507) ^ WORLD_SEED) + 17)
  for (let i = 0; i < biome.grass; i++) {
    // Clumps: half the tufts gather around a few patch centres, the rest are loose.
    const gx = cx * CHUNK_SIZE + grassRng() * CHUNK_SIZE
    const gz = cz * CHUNK_SIZE + grassRng() * CHUNK_SIZE
    const patch = valueNoise(gx * 0.07, gz * 0.07, WORLD_SEED + 9)
    if (patch < 0.32 && grassRng() < 0.7) continue // bare patches
    if (Math.hypot(gx, gz) > WORLD_RADIUS - 3) continue
    if (nearestVillage(gx, gz, VILLAGE_PLAZA_RADIUS + 1)) continue // the plaza is paved
    if (lakeAt(gx, gz, 0.1) || nearestRuin(gx, gz, RUIN_PLATFORM_RADIUS - 2)) continue // no grass under water or flagstones
    out.grass.push({ x: gx, z: gz, scale: 0.7 + grassRng() * 0.9 + patch * 0.4, rot: grassRng() * Math.PI * 2, tint: grassRng() })
  }

  // Treasure: the odd chest, hiding suitcase or power-up, away from the spawn point.
  const far = Math.hypot(center.x, center.z) > 20
  if (far && rng() < 0.1) out.treasure.push({ id: `${out.key}:chest`, kind: 'chest', ...place() })
  if (far && rng() < 0.16) out.treasure.push({ id: `${out.key}:pod`, kind: 'pod', ...place() })
  if (far && rng() < 0.04) out.treasure.push({ id: `${out.key}:perk`, kind: 'perk', ...place() })
  out.treasure = out.treasure.filter((t) => inWorld(t) && !nearestVillage(t.x, t.z, VILLAGE_PLAZA_RADIUS + 24) && !lakeAt(t.x, t.z, 0.2))
  return out
}

// ---- streaming --------------------------------------------------------------------------------

// Which chunk keys should be alive around the player, versus what is alive now. Hysteresis (load inside
// LOAD_RADIUS, keep until UNLOAD_RADIUS) stops a chunk popping in and out at the boundary.
export function diffChunks(aliveKeys, x, z) {
  const want = new Map(chunksAround(x, z, LOAD_RADIUS).map(({ cx, cz }) => [chunkKey(cx, cz), { cx, cz }]))
  const load = []
  for (const [key, c] of want) if (!aliveKeys.has(key)) load.push(c)
  const unload = []
  for (const key of aliveKeys) {
    const [cx, cz] = key.split(',').map(Number)
    const c = chunkCenter(cx, cz)
    if (Math.hypot(c.x - x, c.z - z) > UNLOAD_RADIUS) unload.push(key)
  }
  return { load, unload }
}

// Whether a slain camp member is ready to come back.
export function canRespawn(killedAt, now, after = RESPAWN_SECONDS) {
  return killedAt == null || now - killedAt >= after
}
