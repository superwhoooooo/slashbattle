// Pure, Three-free rules for the free roam world: a vast mystical floating continent. A safe central Sanctum
// sits inside the Heartland (a ring of five biomes), and beyond it the Frontier, a second, wilder ring of six
// stranger biomes reaching out to the rim. Everything is a deterministic function of a seed, so the same world
// comes back every run and chunks can be streamed in and out around the player.
//
//   biomeAt(x, z)        - which biome a point is in
//   groundColorAt(x, z)  - the ground colour there, blended smoothly across biome (and ring) borders
//   dangerAt(x, z)       - 0 at the sanctum up to 1 at the rim: how tough the monsters are
//   heightAt(x, z)       - the ground height (hills, mesas, lakes, levelled plazas)
//   villages() / ruins() / landmarks() - the seeded sites, each with a *Layout() of props, treasure, guards
//   chunkContent(cx, cz) - the props, monsters and treasure seeded into one chunk
//
// Adding a biome: give it an entry in BIOMES (with `ring`), list it in OUTER_BIOMES or FAR_BIOMES, and give
// worldArena.js its look (ROCK / GRASS_STYLE / DRIFT fall back to the sanctum's if you forget). Adding a landmark:
// an entry in LANDMARK_KINDS, a case in landmarkLayout, and models for any new prop kinds.

import { BOSSES } from './bosses.js'

export const WORLD_RADIUS = 560
export const HEARTLAND_RADIUS = 300 // roughly where the Heartland ring gives way to the Frontier (the border meanders)
export const WORLD_SEED = 7219
export const CHUNK_SIZE = 40
export const LOAD_RADIUS = 125 // chunks whose centre is this close to the player are alive
export const UNLOAD_RADIUS = 150 // ...and drop away beyond this
export const SANCTUM_RADIUS = 46 // the safe, healing heart of the world
export const BOSS_RESPAWN_SECONDS = 900 // a guardian boss takes much longer to return
export const RESPAWN_SECONDS = 200 // a slain camp comes back this long after you killed it

// Per biome: name, ring, ground colour [r, g, b], glow (fireflies / banner) and fog colours, grass tufts per chunk,
// weighted scenery props, weighted monsters [type, weight, minDanger], weighted landmark kinds, and optional
//   fogRange [near, far] (default 50-185), aurora 0-1 (curtains of light in the sky), storm (lightning flashes),
//   density (scenery multiplier, default 1).
export const BIOMES = {
  sanctum: {
    name: 'The Sanctum',
    ring: 'center',
    ground: [0.62, 0.58, 0.82],
    glow: 0xb9a6ff,
    fog: 0x2a2352,
    grass: 55,
    props: [['obelisk', 1], ['standingStone', 3]],
    monsters: [],
    landmarks: [],
  },
  whisperwood: {
    name: 'Whisperwood',
    ring: 'heart',
    ground: [0.16, 0.34, 0.3],
    glow: 0x6dffc9,
    fog: 0x1a3a40,
    grass: 190,
    props: [['mooncap', 3], ['gloomTree', 6], ['wisp', 2]],
    monsters: [['blobbo', 5, 0], ['hopper', 3, 0.1], ['grumpus', 3, 0.15], ['splitter', 2, 0.45], ['bumble', 3, 0.05], ['sporeling', 3, 0.1], ['wispy', 2, 0.35]],
    landmarks: [['camp', 3], ['circle', 2], ['greatArch', 1], ['cave', 1]],
  },
  amethyst: {
    name: 'Amethyst Dunes',
    ring: 'heart',
    ground: [0.55, 0.38, 0.62],
    glow: 0xe28bff,
    fog: 0x3c2352,
    grass: 110,
    props: [['crystal', 6], ['dunerock', 3], ['wisp', 1]],
    monsters: [['zippy', 5, 0], ['mirror', 3, 0.25], ['glimmer', 3, 0.3], ['spinner', 2, 0.4], ['boogle', 3, 0.15], ['snapper', 3, 0.2], ['drillbit', 3, 0.3]],
    landmarks: [['colossus', 2], ['greatArch', 2], ['camp', 1], ['circle', 1]],
  },
  frostveil: {
    name: 'Frostveil Reach',
    ring: 'heart',
    ground: [0.7, 0.82, 0.92],
    glow: 0x9be7ff,
    fog: 0x27415c,
    grass: 100,
    props: [['iceSpire', 5], ['frostPine', 5], ['wisp', 1]],
    monsters: [['zippy', 3, 0], ['grumpus', 4, 0.1], ['splitter', 3, 0.3], ['bloater', 2, 0.4], ['icicle', 4, 0.05], ['twister', 3, 0.35], ['boogle', 2, 0.3]],
    landmarks: [['cave', 3], ['circle', 2], ['camp', 1]],
    aurora: 1,
  },
  emberwaste: {
    name: 'Emberwaste',
    ring: 'heart',
    ground: [0.26, 0.15, 0.14],
    glow: 0xff7a3a,
    fog: 0x401a14,
    grass: 45,
    props: [['obsidian', 6], ['emberRock', 4], ['wisp', 1]],
    monsters: [['grumpus', 4, 0], ['spinner', 3, 0.2], ['bloater', 3, 0.25], ['hopper', 2, 0.3], ['kablooma', 4, 0.1], ['prickle', 4, 0.05], ['drillbit', 3, 0.25]],
    landmarks: [['camp', 3], ['cave', 2], ['colossus', 1]],
  },
  gloomfen: {
    name: 'Gloomfen',
    ring: 'heart',
    ground: [0.2, 0.26, 0.14],
    glow: 0xc6ff4a,
    fog: 0x22301a,
    grass: 170,
    props: [['deadTree', 5], ['lanternReed', 5], ['mooncap', 2]],
    monsters: [['blobbo', 3, 0], ['bloater', 4, 0.1], ['splitter', 3, 0.2], ['hopper', 3, 0.2], ['sporeling', 3, 0.05], ['boogle', 3, 0.1], ['snapper', 2, 0.25], ['wispy', 3, 0.2]],
    landmarks: [['circle', 2], ['camp', 2], ['greatArch', 1]],
    fogRange: [38, 160],
  },
  // ---- the Frontier: the outer ring ----
  glowcap: {
    name: 'Glowcap Hollow',
    ring: 'far',
    ground: [0.14, 0.12, 0.3],
    glow: 0x4ad8ff,
    fog: 0x141238,
    grass: 150,
    props: [['giantShroom', 5], ['shroomCluster', 5], ['mooncap', 3], ['wisp', 2]],
    monsters: [['sporeling', 5, 0], ['bloater', 3, 0], ['wispy', 3, 0], ['blobbo', 2, 0], ['splitter', 2, 0.5], ['boogle', 2, 0], ['hopper', 2, 0]],
    landmarks: [['elderShroom', 4], ['circle', 1], ['cave', 1]],
    fogRange: [34, 150],
    density: 1.15,
  },
  saltglass: {
    name: 'Saltglass Flats',
    ring: 'far',
    ground: [0.86, 0.82, 0.8],
    glow: 0xffb3d1,
    fog: 0x5a4a66,
    grass: 25,
    props: [['saltPillar', 5], ['saltCrystal', 4], ['dunerock', 1]],
    monsters: [['zippy', 4, 0], ['prickle', 4, 0], ['drillbit', 3, 0], ['mirror', 3, 0], ['glimmer', 3, 0], ['snapper', 2, 0], ['spinner', 2, 0]],
    landmarks: [['colossus', 4], ['greatArch', 2], ['camp', 1]],
    fogRange: [70, 240],
    density: 0.6,
  },
  drowned: {
    name: 'The Drowned Reach',
    ring: 'far',
    ground: [0.15, 0.3, 0.27],
    glow: 0x5affd8,
    fog: 0x123a3a,
    grass: 160,
    props: [['mangrove', 5], ['sunkenColumn', 3], ['lanternReed', 4], ['deadTree', 1]],
    monsters: [['snapper', 4, 0], ['boogle', 4, 0], ['bloater', 3, 0], ['splitter', 3, 0], ['hopper', 2, 0], ['wispy', 2, 0]],
    landmarks: [['greatArch', 2], ['circle', 2], ['camp', 1]],
    fogRange: [30, 140],
    lakes: 7, // extra lakes seeded here: it is half under water
  },
  stormcrown: {
    name: 'Stormcrown Heights',
    ring: 'far',
    ground: [0.3, 0.32, 0.4],
    glow: 0x8fb8ff,
    fog: 0x1c2238,
    grass: 70,
    props: [['stormRod', 3], ['slateStack', 5], ['chargedRock', 4]],
    monsters: [['twister', 4, 0], ['spinner', 3, 0], ['glimmer', 3, 0], ['kablooma', 3, 0], ['zippy', 2, 0], ['grumpus', 2, 0]],
    landmarks: [['stormSpire', 4], ['cave', 1], ['camp', 1]],
    storm: true,
    mesas: 7, // flat-topped plateaus to climb and glide from
  },
  bonewaste: {
    name: 'The Bonewaste',
    ring: 'far',
    ground: [0.62, 0.52, 0.38],
    glow: 0xffd27a,
    fog: 0x4a3420,
    grass: 30,
    props: [['ribcage', 3], ['boneSpike', 4], ['skull', 2], ['dunerock', 2]],
    monsters: [['grumpus', 4, 0], ['prickle', 3, 0], ['drillbit', 3, 0], ['kablooma', 3, 0], ['splitter', 2, 0], ['boogle', 2, 0]],
    landmarks: [['leviathan', 4], ['camp', 2], ['colossus', 1]],
    fogRange: [55, 210],
    density: 0.75,
  },
  skyshard: {
    name: 'Skyshard Expanse',
    ring: 'far',
    ground: [0.36, 0.5, 0.66],
    glow: 0xd6f0ff,
    fog: 0x2a3e66,
    grass: 120,
    props: [['floatIsle', 3], ['shardPillar', 4], ['crystal', 2], ['frostPine', 2]],
    monsters: [['glimmer', 4, 0], ['bumble', 4, 0], ['mirror', 3, 0], ['twister', 3, 0], ['wispy', 2, 0], ['zippy', 2, 0]],
    landmarks: [['skyAnchor', 4], ['greatArch', 1], ['circle', 1]],
    aurora: 0.6,
    fogRange: [60, 220],
  },
}

const WATER_MONSTERS = [['urchin', 3, 0], ['eel', 3, 0.08], ['angler', 2, 0.22]] // [type, weight, minDanger]
export const OUTER_BIOMES = ['whisperwood', 'amethyst', 'frostveil', 'emberwaste', 'gloomfen'] // the Heartland ring
export const FAR_BIOMES = ['glowcap', 'saltglass', 'drowned', 'stormcrown', 'bonewaste', 'skyshard'] // the Frontier ring
export const WILD_BIOMES = [...OUTER_BIOMES, ...FAR_BIOMES] // every biome with monsters in it

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

// ---- a coarse spatial index ----------------------------------------------------------------------

// Buckets items into GRID_CELL squares by the area each one reaches (`reach(item)` units around its x, z), so a
// lookup at a point only checks the few that can matter there. Used for hills, lakes, villages and sites.
const GRID_CELL = 64
function makeGrid(items, reach) {
  const grid = new Map()
  for (const item of items) {
    const r = reach(item)
    for (let cx = Math.floor((item.x - r) / GRID_CELL); cx <= Math.floor((item.x + r) / GRID_CELL); cx++) {
      for (let cz = Math.floor((item.z - r) / GRID_CELL); cz <= Math.floor((item.z + r) / GRID_CELL); cz++) {
        const key = `${cx},${cz}`
        if (!grid.has(key)) grid.set(key, [])
        grid.get(key).push(item)
      }
    }
  }
  return grid
}
const EMPTY = []
const gridAt = (grid, x, z) => grid.get(`${Math.floor(x / GRID_CELL)},${Math.floor(z / GRID_CELL)}`) ?? EMPTY

// ---- biomes -----------------------------------------------------------------------------------

// Where the Heartland gives way to the Frontier at this point: a meandering border, not a perfect circle.
function ringBorder(x, z) {
  return HEARTLAND_RADIUS + (valueNoise(x * 0.006, z * 0.006, WORLD_SEED + 40) - 0.5) * 70 + (valueNoise(x * 0.03, z * 0.03, WORLD_SEED + 41) - 0.5) * 12
}

// The continuous "sector" coordinate of a point within a ring: which slice of the ring it lies in, wobbled by noise
// so the borders meander instead of running as straight spokes. Integer part = biome slot, fraction = place in it.
function sectorCoordinate(x, z, count, seed, offset = 0) {
  const angle = Math.atan2(z, x) / (Math.PI * 2) + 0.5 // 0..1
  const wobble = (valueNoise(x * 0.012, z * 0.012, seed + 1) - 0.5) * 0.22 + (valueNoise(x * 0.04, z * 0.04, seed + 2) - 0.5) * 0.05
  return (angle + wobble + offset) * count
}
const innerCoordinate = (x, z) => sectorCoordinate(x, z, OUTER_BIOMES.length, WORLD_SEED)
const farCoordinate = (x, z) => sectorCoordinate(x, z, FAR_BIOMES.length, WORLD_SEED + 50, 0.37)
const slotOf = (coordinate, n) => ((Math.floor(coordinate) % n) + n) % n

export function biomeAt(x, z) {
  const r = Math.hypot(x, z)
  if (r < SANCTUM_RADIUS) return 'sanctum'
  if (r < ringBorder(x, z)) return OUTER_BIOMES[slotOf(innerCoordinate(x, z), OUTER_BIOMES.length)]
  return FAR_BIOMES[slotOf(farCoordinate(x, z), FAR_BIOMES.length)]
}

// 'center' | 'heart' | 'far': which ring a point lies in.
export const ringAt = (x, z) => BIOMES[biomeAt(x, z)].ring

// 0 at the sanctum's edge to 1 at the rim of the world.
export function dangerAt(x, z) {
  const r = Math.hypot(x, z)
  return Math.min(1, Math.max(0, (r - SANCTUM_RADIUS) / (WORLD_RADIUS - SANCTUM_RADIUS)))
}

const mix = (a, b, t) => a + (b - a) * t
const clamp01 = (v) => Math.min(1, Math.max(0, v))

// A ring's colour at a sector coordinate: the biome's own, blended with its neighbour over the outer 22% of each side.
function sectorColor(list, coordinate) {
  const n = list.length
  const base = Math.floor(coordinate)
  const frac = coordinate - base
  const slot = ((base % n) + n) % n
  const here = BIOMES[list[slot]].ground
  const next = BIOMES[list[(slot + 1) % n]].ground
  const prev = BIOMES[list[(slot + n - 1) % n]].ground
  const edge = 0.22
  if (frac > 1 - edge) return here.map((c, i) => mix(c, (c + next[i]) / 2, smooth((frac - (1 - edge)) / edge)))
  if (frac < edge) return here.map((c, i) => mix(c, (c + prev[i]) / 2, smooth((edge - frac) / edge)))
  return here
}

// Ground colour [r, g, b] (0-1) at a point: the biome's colour, blended with its neighbours near a border (across
// the ring border too) and with the sanctum near the centre, then dappled by noise so the ground isn't flat.
export function groundColorAt(x, z) {
  const r = Math.hypot(x, z)
  const toFar = smooth(clamp01((r - ringBorder(x, z) + 16) / 32))
  let color
  if (toFar <= 0) color = sectorColor(OUTER_BIOMES, innerCoordinate(x, z))
  else if (toFar >= 1) color = sectorColor(FAR_BIOMES, farCoordinate(x, z))
  else {
    const a = sectorColor(OUTER_BIOMES, innerCoordinate(x, z))
    const b = sectorColor(FAR_BIOMES, farCoordinate(x, z))
    color = a.map((c, i) => mix(c, b[i], toFar))
  }
  const sanctum = BIOMES.sanctum.ground
  const toSanctum = 1 - smooth(clamp01((r - (SANCTUM_RADIUS - 10)) / 26))
  const dapple = 0.82 + valueNoise(x * 0.09, z * 0.09, WORLD_SEED + 3) * 0.36 + (valueNoise(x * 0.4, z * 0.4, WORLD_SEED + 4) - 0.5) * 0.08
  let land = color.map((c, i) => Math.min(1, mix(c, sanctum[i], toSanctum) * dapple))
  // Lakes: pale sand on the shore, a dark blue-green bed under the water.
  for (const lake of gridAt(lakeGrid, x, z)) {
    if (Math.hypot(x - lake.x, z - lake.z) > lake.radius * 1.9) continue
    const d = lakeDistance(lake, x, z)
    if (d >= 1.3) continue
    const sand = [0.78, 0.72, 0.52]
    const bed = [0.1, 0.28, 0.36]
    land = land.map((c, i) => mix(mix(c, sand[i] * dapple, smooth((1.3 - d) / 0.35)), bed[i], smooth((1 - d) / 0.4)))
  }
  // Roads: packed dirt (tinted by the land it runs through), fraying into the grass at the edges.
  const road = roadDistance(x, z)
  if (road < ROAD_WIDTH + 1.6) {
    const fray = (valueNoise(x * 0.35, z * 0.35, WORLD_SEED + 6) - 0.5) * 1.2
    const t = 1 - smooth(clamp01((road - ROAD_WIDTH + 1.4 + fray) / 2.2))
    const rut = Math.abs(road - ROAD_WIDTH * 0.45) < 0.35 ? 0.85 : 1
    const dirt = [0.5, 0.4, 0.3].map((c, i) => (c * 0.7 + color[i] * 0.3) * rut * (0.9 + dapple * 0.1))
    land = land.map((c, i) => mix(c, dirt[i], t * 0.55)) // a soft underlay; worldArena draws the crisp track on top
  }
  // Ruins sit on old flagstones; some landmarks have a floor of their own (a camp's trampled earth...).
  const site = nearestSite(x, z, 4)
  if (site?.floor) {
    const t = 1 - smooth(clamp01((site.distance - (site.radius - 3)) / 7))
    land = land.map((c, i) => mix(c, site.floor[i] * (0.85 + dapple * 0.18), t * 0.85))
  }
  // A village's plaza is paved in warm stone, fading back into the grass.
  const near = nearestVillage(x, z, VILLAGE_PLAZA_RADIUS + 5)
  if (near) {
    const t = 1 - smooth(clamp01((near.distance - (VILLAGE_PLAZA_RADIUS - 3)) / 8))
    const paving = [0.74, 0.68, 0.62]
    return land.map((c, i) => mix(c, Math.min(1, paving[i] * (0.9 + dapple * 0.12)), t))
  }
  return land
}


// ---- hills and mesas ------------------------------------------------------------------------------------

// Big seeded mounds all over the land, to give it landmarks to climb and steer by.
const MOUND_COUNT = 84
const MOUNDS = (() => {
  const rng = mulberry32(WORLD_SEED + 500)
  const list = []
  for (let i = 0; i < MOUND_COUNT; i++) {
    const angle = rng() * Math.PI * 2
    // Spread evenly over the area (sqrt), not bunched toward the middle.
    const inner = SANCTUM_RADIUS + 50
    const outer = WORLD_RADIUS - 65
    const r = Math.sqrt(inner * inner + rng() * (outer * outer - inner * inner))
    // Most are tall hills; every fifth is a real peak, high enough to launch a paraglider from.
    const peak = i % 5 === 0
    list.push({ x: Math.cos(angle) * r, z: Math.sin(angle) * r, radius: (peak ? 34 : 24) + rng() * 20, height: peak ? 26 + rng() * 10 : 12 + rng() * 9 })
  }
  return list
})()
const moundGrid = makeGrid(MOUNDS, (m) => m.radius * 3)

// Flat-topped plateaus with steep (but walkable) flanks, seeded in the biomes that ask for them (`mesas`).
const MESA_EDGE = 18
const MESAS = (() => {
  const rng = mulberry32(WORLD_SEED + 520)
  const list = []
  for (const [id, biome] of Object.entries(BIOMES)) {
    let placed = 0
    for (let attempt = 0; attempt < 600 && placed < (biome.mesas ?? 0); attempt++) {
      const angle = rng() * Math.PI * 2
      const r = HEARTLAND_RADIUS + 30 + rng() * (WORLD_RADIUS - HEARTLAND_RADIUS - 100)
      const x = Math.cos(angle) * r
      const z = Math.sin(angle) * r
      const radius = 20 + rng() * 14
      if (biomeAt(x, z) !== id || list.some((m) => Math.hypot(m.x - x, m.z - z) < m.radius + radius + 30)) continue
      list.push({ x, z, radius, height: 8 + rng() * 5 })
      placed++
    }
  }
  return list
})()
const mesaGrid = makeGrid(MESAS, (m) => m.radius + 8)

// Ground height before the sanctum, rim and sites flatten it: broad rolling swells, finer bumps, mounds and mesas.
function rawTerrain(x, z) {
  const broad = (valueNoise(x * 0.009, z * 0.009, WORLD_SEED + 21) - 0.5) * 2
  const mid = (valueNoise(x * 0.024, z * 0.024, WORLD_SEED + 22) - 0.5) * 2
  let h = broad * 8 + mid * 3 + 1.4
  let hill = 0
  for (const m of gridAt(moundGrid, x, z)) {
    const d2 = ((x - m.x) ** 2 + (z - m.z) ** 2) / (m.radius * m.radius)
    if (d2 < 9) hill = Math.max(hill, m.height * Math.exp(-d2 * 1.3)) // overlapping hills merge instead of stacking
  }
  h += hill
  // A mesa rises its full height above the land at its foot (never sunk into a valley), its rim wobbly so it
  // doesn't read as a perfect drum.
  const foot = Math.max(0, h)
  for (const m of gridAt(mesaGrid, x, z)) {
    const rim = m.radius + (valueNoise(x * 0.08, z * 0.08, WORLD_SEED + 23) - 0.5) * 6
    const top = m.height + (valueNoise(x * 0.05, z * 0.05, WORLD_SEED + 24) - 0.5) * 1.2
    const s = smooth(clamp01((rim - Math.hypot(x - m.x, z - m.z)) / MESA_EDGE + 1))
    if (s > 0) h = Math.max(h, foot + top * s)
  }
  return h > 0 ? h : h * 0.1 // valleys flatten into meadows instead of digging pits
}

// Hills fade out toward the sanctum (a level, sacred floor) and toward the rim (so the edge meets the rock).
function terrainHeight(x, z) {
  const r = Math.hypot(x, z)
  const inner = smooth(clamp01((r - (SANCTUM_RADIUS - 6)) / 44))
  const outer = 1 - smooth(clamp01((r - (WORLD_RADIUS - 46)) / 40))
  return lakeHeight(x, z, rawTerrain(x, z) * inner * outer)
}

// ---- lakes --------------------------------------------------------------------------------------------

export const WATER_LEVEL = 0 // the surface of every lake
const LAKE_BED = -1.9 // the lake floor: wadeable, with the head and shoulders above the surface
const LAKE_NOISE_SEED = WORLD_SEED + 30
const STARTER_SITE = { x: 62, z: -46 }
const LAKE_COUNT = 22 // scattered anywhere; a biome's own `lakes` add more inside it

// Seeded lakes scattered over the outer land, clear of the Sanctum and the starter village.
export const MESA_SITES = () => MESAS.map((m) => ({ ...m }))

export const LAKES = (() => {
  const rng = mulberry32(WORLD_SEED + 700)
  const list = []
  const tryLake = (x, z, radius, lowest) => {
    if (Math.hypot(x, z) > WORLD_RADIUS - 70 || Math.hypot(x, z) < SANCTUM_RADIUS + 62) return false
    if (Math.hypot(x - STARTER_SITE.x, z - STARTER_SITE.z) < radius + 80) return false
    if (list.some((l) => Math.hypot(l.x - x, l.z - z) < l.radius + radius + 55)) return false
    if (MESAS.some((m) => Math.hypot(m.x - x, m.z - z) < m.radius + MESA_EDGE + radius * 1.4 + 10)) return false
    // Only on low ground: a lake dug into a hillside would leave a cliff.
    for (let k = 0; k < 12; k++) if (rawTerrain(x + Math.cos(k * 0.52) * radius * 1.6, z + Math.sin(k * 0.52) * radius * 1.6) >= lowest) return false
    if (rawTerrain(x, z) > lowest) return false
    list.push({ id: `lake${list.length}`, x, z, radius, biome: biomeAt(x, z) })
    return true
  }
  for (let attempt = 0; attempt < 8000 && list.length < LAKE_COUNT; attempt++) {
    const angle = rng() * Math.PI * 2
    const inner = SANCTUM_RADIUS + 62
    const outer = WORLD_RADIUS - 70
    const r = Math.sqrt(inner * inner + rng() * (outer * outer - inner * inner))
    tryLake(Math.cos(angle) * r, Math.sin(angle) * r, 17 + rng() * 14, 6.5)
  }
  // Biomes that want extra water (the Drowned Reach) get it.
  for (const [id, biome] of Object.entries(BIOMES)) {
    let placed = 0
    for (let attempt = 0; attempt < 4000 && placed < (biome.lakes ?? 0); attempt++) {
      const angle = rng() * Math.PI * 2
      const r = HEARTLAND_RADIUS + 20 + rng() * (WORLD_RADIUS - HEARTLAND_RADIUS - 90)
      const x = Math.cos(angle) * r
      const z = Math.sin(angle) * r
      if (biomeAt(x, z) === id && tryLake(x, z, 14 + rng() * 12, 8)) placed++
    }
  }
  return list
})()
const lakeGrid = makeGrid(LAKES, (l) => l.radius * 1.9)

// How far (in lake radii, with a wobbly shoreline) a point is from a lake's middle: < 1 is water.
function lakeDistance(lake, x, z) {
  return Math.hypot(x - lake.x, z - lake.z) / lake.radius + (valueNoise(x * 0.045, z * 0.045, LAKE_NOISE_SEED) - 0.5) * 0.45
}

// The lake whose bed contains this point (the ground is below the surface), else null.
export function lakeAt(x, z, margin = 0) {
  for (const lake of gridAt(lakeGrid, x, z)) {
    if (Math.hypot(x - lake.x, z - lake.z) > lake.radius * 1.9) continue
    if (lakeDistance(lake, x, z) < 0.85 + margin) return lake
  }
  return null
}

// Banks level out toward the lake and the floor drops away to LAKE_BED.
function lakeHeight(x, z, h) {
  for (const lake of gridAt(lakeGrid, x, z)) {
    if (Math.hypot(x - lake.x, z - lake.z) > lake.radius * 1.9) continue
    const d = lakeDistance(lake, x, z)
    if (d >= 1.3) continue
    const bank = smooth(clamp01((1.3 - d) / 0.5))
    h = h + (Math.min(h, 1) - h) * bank
    const bed = smooth(clamp01((1 - d) / 0.45))
    h = h * (1 - bed) + LAKE_BED * bed
  }
  return h
}

// ---- villages -----------------------------------------------------------------------------------------

export const VILLAGE_PLAZA_RADIUS = 13 // the paved, level square at a village's heart
export const VILLAGE_SAFE_RADIUS = 46 // no wild monsters inside this
const VILLAGE_CELL = 150
export const VILLAGE_MIN_SEPARATION = 135 // villages are a real trek apart
const VILLAGE_FLATTEN = 26 // the plaza's level ground eases back into the hills over this far
const VILLAGE_PREFIX = ['Mist', 'Star', 'Moon', 'Ember', 'Frost', 'Glim', 'Whisper', 'Amber', 'Silver', 'Dusk', 'Lantern', 'Briar', 'Thistle', 'Hollow', 'Salt', 'Storm', 'Bone', 'Sky', 'Spore', 'Reed', 'Cinder', 'Gale']
const VILLAGE_SUFFIX = ['haven', 'hollow', 'watch', 'rest', 'fall', 'ford', 'moor', 'glade', 'reach', 'wick', 'mere', 'stead', 'crest', 'gate']
const NPC_NAMES = ['Mira', 'Oren', 'Thessaly', 'Bram', 'Lyra', 'Corin', 'Isolde', 'Fenn', 'Maren', 'Tobin', 'Sable', 'Wren', 'Edda', 'Joss', 'Nell', 'Perrin', 'Anwen', 'Kestrel', 'Odell', 'Ysolde', 'Haldor', 'Sorrel', 'Pim', 'Garrick']
const NPC_COLORS = [0x7fe0b8, 0xb9a6ff, 0xffd98a, 0x8fd0ff, 0xff9ab8, 0xa6f0a0, 0xffb38a, 0xd0a6ff]
const NPC_ROLES = ['Warden', 'Lantern-keeper', 'Herbalist', 'Stargazer', 'Wayfinder', 'Elder', 'Tinker', 'Ranger']
// Radii to search when a biome still has no village (by ring).
const VILLAGE_SEARCH_RADII = { heart: [170, 200, 140, 225, 255], far: [400, 440, 360, 470, 340] }

let villageCache = null
let villageGrid = null

// Every village in the world: one guaranteed just outside the Sanctum, the rest seeded across a coarse grid,
// and at least one in every biome (Heartland and Frontier alike).
export function villages() {
  if (villageCache) return villageCache
  const sites = [{ ...STARTER_SITE, starter: true }]
  const span = Math.ceil(WORLD_RADIUS / VILLAGE_CELL) + 1
  // (Mesas count too: a plaza levelled into a plateau's flank would gouge it.)
  const nearLake = (x, z) => LAKES.some((l) => Math.hypot(l.x - x, l.z - z) < l.radius * 1.25 + 30) || MESAS.some((m) => Math.hypot(m.x - x, m.z - z) < m.radius + MESA_EDGE + VILLAGE_PLAZA_RADIUS + VILLAGE_FLATTEN)
  for (let i = -span; i <= span; i++) {
    for (let j = -span; j <= span; j++) {
      const rng = mulberry32(Math.imul(i, 40503) ^ Math.imul(j, 9176) ^ (WORLD_SEED + 91))
      if (rng() > 0.97) continue
      const x = (i + 0.5) * VILLAGE_CELL + (rng() - 0.5) * 110
      const z = (j + 0.5) * VILLAGE_CELL + (rng() - 0.5) * 110
      const r = Math.hypot(x, z)
      if (r < SANCTUM_RADIUS + 50 || r > WORLD_RADIUS - 55) continue
      if (lakeAt(x, z, 0.9) || nearLake(x, z)) continue
      if (sites.some((s) => Math.hypot(s.x - x, s.z - z) < VILLAGE_MIN_SEPARATION)) continue
      sites.push({ x, z })
    }
  }
  // Every biome gets at least one village, so no region is left without people.
  for (const biome of WILD_BIOMES) {
    if (sites.some((s) => biomeAt(s.x, s.z) === biome)) continue
    search: for (const separation of [VILLAGE_MIN_SEPARATION, 120, 95]) {
      for (const r of VILLAGE_SEARCH_RADII[BIOMES[biome].ring]) {
        for (let a = 0; a < 360; a += 4) {
          const x = Math.cos((a * Math.PI) / 180) * r
          const z = Math.sin((a * Math.PI) / 180) * r
          if (biomeAt(x, z) !== biome || sites.some((s) => Math.hypot(s.x - x, s.z - z) < separation)) continue
          if (nearLake(x, z)) continue
          sites.push({ x, z })
          break search
        }
      }
    }
  }
  const usedNames = new Set()
  villageCache = sites.map((site, index) => {
    const rng = mulberry32(index * 7919 + WORLD_SEED + 3)
    let name
    for (let k = 0; k < 40; k++) {
      name = VILLAGE_PREFIX[Math.floor(rng() * VILLAGE_PREFIX.length)] + VILLAGE_SUFFIX[Math.floor(rng() * VILLAGE_SUFFIX.length)]
      if (!usedNames.has(name)) break
    }
    usedNames.add(name)
    return {
      id: `v${index}`,
      index,
      x: site.x,
      z: site.z,
      starter: Boolean(site.starter),
      name,
      baseHeight: terrainHeight(site.x, site.z),
      biome: biomeAt(site.x, site.z),
    }
  })
  villageGrid = makeGrid(villageCache, () => Math.max(VILLAGE_SAFE_RADIUS, VILLAGE_PLAZA_RADIUS + VILLAGE_FLATTEN, 60))
  return villageCache
}

export const villageById = (id) => villages().find((v) => v.id === id) ?? null

// The village (if any) whose centre is within `radius` of a point, with the distance.
export function nearestVillage(x, z, radius = Infinity) {
  villages()
  const pool = radius <= 60 ? gridAt(villageGrid, x, z) : villageCache
  let best = null
  for (const v of pool) {
    const d = Math.hypot(v.x - x, v.z - z)
    if (d <= radius && (!best || d < best.distance)) best = { village: v, distance: d }
  }
  return best
}

// Ground height at any point: the hills, levelled flat under each village's plaza and every ruin / landmark,
// easing back into the land.
export function heightAt(x, z) {
  let h = terrainHeight(x, z)
  villages()
  for (const v of gridAt(villageGrid, x, z)) {
    const d = Math.hypot(v.x - x, v.z - z)
    if (d > VILLAGE_PLAZA_RADIUS + VILLAGE_FLATTEN) continue
    const w = 1 - smooth(clamp01((d - VILLAGE_PLAZA_RADIUS) / VILLAGE_FLATTEN))
    h = h + (v.baseHeight - h) * w
  }
  for (const site of gridAt(siteIndex(), x, z)) {
    const d = Math.hypot(site.x - x, site.z - z)
    if (d > site.radius + SITE_FLATTEN) continue
    const w = 1 - smooth(clamp01((d - site.radius) / SITE_FLATTEN))
    h = h + (site.baseHeight - h) * w
  }
  return h
}

// ---- sites: ruins and landmarks share one index ---------------------------------------------------------

const SITE_FLATTEN = 30 // a site's levelled floor eases back into the land over this far
let siteGrid = null
let siteList = null
// Every ruin and landmark (each has x, z, radius, baseHeight and maybe a `floor` colour).
export function sites() {
  siteList ??= [...ruins(), ...landmarks()]
  return siteList
}
function siteIndex() {
  siteGrid ??= makeGrid(sites(), (s) => s.radius + SITE_FLATTEN)
  return siteGrid
}

// The ruin or landmark whose floor (its radius, plus `margin`) covers (x, z), with the distance, else null.
export function nearestSite(x, z, margin = 0) {
  let best = null
  for (const site of gridAt(siteIndex(), x, z)) {
    const d = Math.hypot(site.x - x, site.z - z)
    if (d <= site.radius + margin && (!best || d < best.distance)) best = { ...site, site, distance: d }
  }
  return best
}

// ---- ruins, temples and towers ----------------------------------------------------------------------

export const RUIN_PLATFORM_RADIUS = 13
const RUIN_FLOOR = [0.5, 0.48, 0.56] // old flagstones
const RUIN_COUNT = 30
const RUIN_NAMES = ['Sunken Temple', 'Broken Watch', 'Old Shrine', 'Lost Sanctum', 'Hollow Spire', 'Dusk Temple', 'Forgotten Keep', 'Starfall Shrine', 'Weeping Altar', 'Ashen Bastion', 'Moonwell Ruin', 'Silent Chapel', 'Shattered Crown', 'Gloaming Hall', 'Thornwatch', 'Veiled Fane']
let ruinCache = null

// Seeded ruin sites: a temple with a guardian boss, a tower with a chest, or a lone shrine. Kept away from
// villages, lakes and the Sanctum, and well spaced out.
export function ruins() {
  if (ruinCache) return ruinCache
  const rng = mulberry32(WORLD_SEED + 900)
  const placed = []
  const kinds = ['temple', 'tower', 'shrine']
  for (let attempt = 0; attempt < 3000 && placed.length < RUIN_COUNT; attempt++) {
    const angle = rng() * Math.PI * 2
    const inner = SANCTUM_RADIUS + 45
    const outer = WORLD_RADIUS - 60
    const r = Math.sqrt(inner * inner + rng() * (outer * outer - inner * inner))
    const x = Math.cos(angle) * r
    const z = Math.sin(angle) * r
    if (villages().some((v) => Math.hypot(v.x - x, v.z - z) < 75)) continue
    if (LAKES.some((l) => Math.hypot(l.x - x, l.z - z) < l.radius * 1.5 + 30)) continue
    if (MESAS.some((m) => Math.hypot(m.x - x, m.z - z) < m.radius + MESA_EDGE + 20)) continue
    if (placed.some((q) => Math.hypot(q.x - x, q.z - z) < 85)) continue
    placed.push({ x, z, kind: kinds[placed.length % kinds.length] })
  }
  ruinCache = placed.map((site, index) => ({
    id: `r${index}`,
    index,
    kind: site.kind,
    site: 'ruin',
    x: site.x,
    z: site.z,
    radius: RUIN_PLATFORM_RADIUS,
    floor: RUIN_FLOOR,
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
    ring(8, 8.5, () => (rng() < 0.4 ? 'columnBroken' : 'column'))
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

// ---- landmarks ----------------------------------------------------------------------------------------

// Big named sights to steer by and explore, each biome favouring its own (BIOMES[id].landmarks). A landmark has
// a levelled floor `radius` across, maybe a `floor` colour, and a layout of props, treasure and guards.
//   names - picked from at random   floor - ground colour under it (none: the land's own)
export const LANDMARK_KINDS = {
  colossus: { radius: 16, names: ['The Sleeping Colossus', 'The Fallen King', 'The Weeping Giant', 'The Buried Warden'] },
  circle: { radius: 12, floor: [0.46, 0.44, 0.58], names: ['Ring of Whispers', 'The Star Circle', 'Moonstone Ring', 'The Old Henge'] },
  camp: { radius: 12, floor: [0.36, 0.28, 0.22], names: ['Grumbler Camp', 'Raider Camp', 'The Rowdy Roost', 'Bandit Hollow', 'Gobble Camp'] },
  cave: { radius: 12, names: ['Echo Cave', 'The Yawning Grotto', 'Glimmer Cave', 'The Deep Mouth'] },
  greatArch: { radius: 10, names: ['The Great Arch', 'The Sky Gate', 'Gate of Ages', 'The Wanderer\'s Arch'] },
  elderShroom: { radius: 12, names: ['The Elder Cap', 'Grandmother Mushroom', 'The Glowing Crown'] },
  stormSpire: { radius: 12, names: ['The Thunder Spire', 'Stormcaller\'s Needle', 'The Lightning Tower'] },
  leviathan: { radius: 18, floor: [0.72, 0.64, 0.5], names: ['The Leviathan\'s Rest', 'Bones of the Old Wyrm', 'The Great Ribs'] },
  skyAnchor: { radius: 10, names: ['The Sky Anchor', 'The Tethered Isle', 'The Chained Rock'] },
}
const LANDMARK_COUNT = 40
let landmarkCache = null

// Every landmark: seeded across the land, well apart from each other, ruins, villages, lakes and mesas.
export function landmarks() {
  if (landmarkCache) return landmarkCache
  const rng = mulberry32(WORLD_SEED + 1300)
  const list = []
  for (let attempt = 0; attempt < 4000 && list.length < LANDMARK_COUNT; attempt++) {
    const angle = rng() * Math.PI * 2
    const inner = SANCTUM_RADIUS + 60
    const outer = WORLD_RADIUS - 45
    const r = Math.sqrt(inner * inner + rng() * (outer * outer - inner * inner))
    const x = Math.cos(angle) * r
    const z = Math.sin(angle) * r
    const biome = biomeAt(x, z)
    const options = BIOMES[biome].landmarks
    if (!options?.length) continue
    const kind = pickWeighted(rng, options)[0]
    const radius = LANDMARK_KINDS[kind].radius
    if (villages().some((v) => Math.hypot(v.x - x, v.z - z) < 58 + radius)) continue
    if (ruins().some((q) => Math.hypot(q.x - x, q.z - z) < 45 + radius)) continue
    if (LAKES.some((l) => Math.hypot(l.x - x, l.z - z) < l.radius * 1.5 + 22 + radius)) continue
    if (MESAS.some((m) => Math.hypot(m.x - x, m.z - z) < m.radius + MESA_EDGE + 16 + radius)) continue
    if (list.some((q) => Math.hypot(q.x - x, q.z - z) < 50 + radius + q.radius)) continue
    const names = LANDMARK_KINDS[kind].names
    list.push({
      id: `l${list.length}`,
      index: list.length,
      kind,
      site: 'landmark',
      x,
      z,
      radius,
      floor: LANDMARK_KINDS[kind].floor ?? null,
      name: names[Math.floor(rng() * names.length)],
      baseHeight: terrainHeight(x, z),
      biome,
    })
  }
  landmarkCache = list
  return landmarkCache
}

export const landmarkById = (id) => landmarks().find((l) => l.id === id) ?? null

// The landmark (if any) within `radius` of a point (default: standing on its floor), with the distance.
export function nearestLandmark(x, z, radius = null) {
  let best = null
  for (const l of landmarks()) {
    const d = Math.hypot(l.x - x, l.z - z)
    if (d <= (radius ?? l.radius) && (!best || d < best.distance)) best = { landmark: l, distance: d }
  }
  return best
}

// A landmark's props, loot and guards (all seeded), in the same shape as ruinLayout. Guards: 'elite' | 'guard'.
// A 'blocker' prop is an invisible obstacle (an arch's legs, a skull's jaw) with no model of its own.
export function landmarkLayout(lm) {
  const rng = mulberry32(lm.index * 7349 + WORLD_SEED + 13)
  const props = []
  const treasure = []
  const guards = []
  const at = (a, d) => ({ x: lm.x + Math.cos(a) * d, z: lm.z + Math.sin(a) * d })
  const add = (kind, p, scale = 1, rot = rng() * Math.PI * 2, radius = PROP_RADIUS[kind] * scale) => props.push({ kind, x: p.x, z: p.z, scale, rot, radius })
  const block = (p, radius) => props.push({ kind: 'blocker', x: p.x, z: p.z, scale: 1, rot: 0, radius })
  const loot = (kind, a, d, tag = kind) => treasure.push({ id: `${lm.id}:${tag}`, kind, ...at(a, d) })
  let guardN = 0
  const guard = (role, d = 7 + rng() * 3) => guards.push({ id: `${lm.id}:g${guardN++}`, role, ...at(rng() * Math.PI * 2, d) })
  const face = rng() * Math.PI * 2 // which way the landmark faces
  switch (lm.kind) {
    case 'colossus': // a giant stone head half-sunk in the earth, and its hand reaching out of the ground beside it
      add('colossusHead', lm, 1.1, Math.PI / 2 - face) // gazing out along `face`
      add('colossusHand', at(face + 1.6, 10), 1, face + 0.6)
      for (let i = 0; i < 4; i++) add('columnBroken', at(face + Math.PI + (i - 1.5) * 0.5, 12), 0.9)
      loot('chest', face + 0.8, 8)
      guard('elite')
      guard('guard')
      break
    case 'circle': // standing obelisks in a ring around a rune altar
      add('runeAltar', lm, 1, face)
      for (let i = 0; i < 7; i++) add('obelisk', at(face + (i / 7) * Math.PI * 2, 9), 0.75)
      loot('perk', face, 3)
      if (rng() < 0.5) loot('chest', face + Math.PI, 3.5)
      guard('elite', 6)
      break
    case 'camp': // a rowdy monster camp: tents round a bonfire, a banner, a chief and its crew guarding the loot
      add('bonfire', lm, 1, 0)
      for (let i = 0; i < 3; i++) {
        const p = at(face + (i / 3) * Math.PI * 2 + 0.3, 7.5)
        add('campTent', p, 0.95 + rng() * 0.2, Math.atan2(lm.x - p.x, lm.z - p.z)) // the flap faces the fire
      }
      add('campBanner', at(face + 1.0, 4.5), 1, face)
      loot('chest', face + 2.1, 4)
      guard('elite', 5)
      for (let i = 0; i < 3; i++) guard('guard', 4 + rng() * 5)
      break
    case 'cave': // a great rock mound with a glowing cave mouth; its treasure waits in the mouth
      add('caveMound', at(face + Math.PI, 3), 1, Math.PI / 2 - face, 7) // the mouth opens toward `face`
      loot('chest', face, 7)
      guard('elite', 8)
      guard('guard', 9)
      break
    case 'greatArch': // a towering arch to walk through, its legs solid
      add('greatArch', lm, 1, -face, 0) // its legs stand along `face`
      block(at(face, 6.2), 1.8)
      block(at(face + Math.PI, 6.2), 1.8)
      loot('pod', face + Math.PI / 2, 4)
      loot('perk', face - Math.PI / 2, 3)
      guard('guard', 8)
      break
    case 'elderShroom': // one enormous glowing mushroom, ringed by smaller ones
      add('elderShroom', lm, 1, face)
      for (let i = 0; i < 6; i++) add('shroomCluster', at(face + (i / 6) * Math.PI * 2 + 0.3, 8 + rng() * 2), 0.9 + rng() * 0.3)
      loot('chest', face, 5)
      guard('elite', 9)
      guard('guard', 9)
      break
    case 'stormSpire': // an iron needle that draws the lightning, charged rocks round its foot
      add('stormSpire', lm, 1, face)
      for (let i = 0; i < 5; i++) add('chargedRock', at(face + (i / 5) * Math.PI * 2, 8.5), 0.9 + rng() * 0.3)
      loot('chest', face + 0.6, 4.5)
      guard('elite', 7)
      guard('guard', 9)
      break
    case 'leviathan': // the bleached skeleton of something enormous: skull, spine and ribs to wander between
      add('leviathanSkull', at(face, 11), 1, Math.PI / 2 - face)
      block(at(face, 11), 3.2)
      add('ribcage', at(face, 2.5), 1.3, Math.PI / 2 - face) // the spine runs along `face`
      add('ribcage', at(face, -7.5), 1.05, Math.PI / 2 - face)
      loot('chest', face, -2.5)
      guard('elite', 10)
      guard('guard', 8)
      break
    case 'skyAnchor': // a carved anchor stone, its chains rising to a rocky isle hanging in the sky
      add('skyAnchor', lm, 1, face)
      loot('perk', face, 4)
      loot('pod', face + Math.PI, 4.5)
      guard('elite', 7)
      break
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
  // A village keeps a chest of its own on the plaza's edge (between the lamps and the cottages).
  const ca = offset + 1.9
  const treasure = [{ id: `${village.id}:chest`, kind: 'chest', x: village.x + Math.cos(ca) * 12.5, z: village.z + Math.sin(ca) * 12.5 }]
  return { props, npcs, treasure }
}

// ---- roads ------------------------------------------------------------------------------------

// Winding dirt roads: from the Sanctum out to every village, and from each village on to its nearest
// ruin. Each route bends with noise along the way (never at its ends), so it meanders like a real track.
export const ROAD_WIDTH = 3.2 // half-width of the dirt, before it frays into the grass
const ROAD_CELL = 24
let roadCache = null

function buildRoads() {
  const routes = []
  const vs = villages()
  // Heartland villages each get a road from the edge of the Sanctum's central clearing. A Frontier village links
  // to the nearest village already on the network that lies closer in, so the roads branch outward like a tree.
  const linked = []
  for (const v of [...vs].sort((a, b) => Math.hypot(a.x, a.z) - Math.hypot(b.x, b.z))) {
    const r = Math.hypot(v.x, v.z) || 1
    const from = r > HEARTLAND_RADIUS - 20
      ? linked.filter((o) => Math.hypot(o.x, o.z) < r - 40).sort((a, b) => Math.hypot(a.x - v.x, a.z - v.z) - Math.hypot(b.x - v.x, b.z - v.z))[0]
      : null
    routes.push([from ?? { x: (v.x / r) * 14, z: (v.z / r) * 14 }, v])
    linked.push(v)
  }
  // ...and from each village on to its nearest ruin and its nearest landmark.
  for (const v of vs) {
    const near = nearestRuin(v.x, v.z, 170)
    if (near) routes.push([v, near.ruin])
    const lm = nearestLandmark(v.x, v.z, 150)
    if (lm) routes.push([v, lm.landmark])
  }
  const segments = []
  const paths = []
  routes.forEach(([a, b], ri) => {
    const len = Math.hypot(b.x - a.x, b.z - a.z)
    const n = Math.max(2, Math.round(len / 14))
    const nx = -(b.z - a.z) / len
    const nz = (b.x - a.x) / len
    let px = a.x
    let pz = a.z
    const path = [[a.x, a.z]]
    paths.push(path)
    for (let i = 1; i <= n; i++) {
      const t = i / n
      const bend = i === n ? 0 : (valueNoise(t * 3.1, ri * 5.3, WORLD_SEED + 77) - 0.5) * Math.min(70, len * 0.4) * Math.sin(t * Math.PI)
      const x = a.x + (b.x - a.x) * t + nx * bend
      const z = a.z + (b.z - a.z) * t + nz * bend
      segments.push([px, pz, x, z])
      path.push([x, z])
      px = x
      pz = z
    }
  })
  // A coarse grid of which segments pass near each cell, so a lookup only checks a few.
  const grid = new Map()
  for (const seg of segments) {
    const pad = ROAD_WIDTH + 4
    const x0 = Math.floor((Math.min(seg[0], seg[2]) - pad) / ROAD_CELL)
    const x1 = Math.floor((Math.max(seg[0], seg[2]) + pad) / ROAD_CELL)
    const z0 = Math.floor((Math.min(seg[1], seg[3]) - pad) / ROAD_CELL)
    const z1 = Math.floor((Math.max(seg[1], seg[3]) + pad) / ROAD_CELL)
    for (let cx = x0; cx <= x1; cx++) {
      for (let cz = z0; cz <= z1; cz++) {
        const key = `${cx},${cz}`
        if (!grid.has(key)) grid.set(key, [])
        grid.get(key).push(seg)
      }
    }
  }
  return { segments, grid, paths }
}

// Every road as a polyline of [x, z] points (for drawing it).
export function roadPaths() {
  roadCache ??= buildRoads()
  return roadCache.paths
}

// Every road segment [x1, z1, x2, z2].
export function roads() {
  roadCache ??= buildRoads()
  return roadCache.segments
}

function segmentDistance(x, z, s) {
  const dx = s[2] - s[0]
  const dz = s[3] - s[1]
  const l2 = dx * dx + dz * dz
  const t = Math.max(0, Math.min(1, ((x - s[0]) * dx + (z - s[1]) * dz) / (l2 || 1)))
  return Math.hypot(x - s[0] - dx * t, z - s[1] - dz * t)
}

// How far (x, z) is from the nearest road's centre line (Infinity when no road passes close).
export function roadDistance(x, z) {
  roadCache ??= buildRoads()
  const list = roadCache.grid.get(`${Math.floor(x / ROAD_CELL)},${Math.floor(z / ROAD_CELL)}`)
  if (!list) return Infinity
  let best = Infinity
  for (const seg of list) best = Math.min(best, segmentDistance(x, z, seg))
  return best
}

// Is (x, z) on a road (plus `margin` either side)?
export const onRoad = (x, z, margin = 0) => roadDistance(x, z) < ROAD_WIDTH + margin

// ---- day and night ----------------------------------------------------------------------------

// The Wilds turn from day to night and back every DAY_SECONDS. Starts in the late afternoon.
export const DAY_SECONDS = 480
const dayPhase = (t) => (((t / DAY_SECONDS + 0.12) % 1) + 1) % 1
// 1 at high day, 0 in the deepest night.
export const daylight = (t) => 0.5 + 0.5 * Math.cos(dayPhase(t) * Math.PI * 2)
export function dayName(t) {
  const p = dayPhase(t)
  return p < 0.2 || p > 0.86 ? 'Day' : p < 0.34 ? 'Dusk' : p < 0.7 ? 'Night' : 'Dawn'
}

// ---- skystars ---------------------------------------------------------------------------------

// Little star spirits perched on the tops of the tallest hills: climb or glide up to catch them.
export const SKYSTAR_REWARD = 30 // crystals
export const SKYSTAR_CATCH_RADIUS = 2.6
let starCache = null
export function skystars() {
  if (starCache) return starCache
  const tops = MOUNDS.filter((m) => m.height > 15 && Math.hypot(m.x, m.z) < WORLD_RADIUS - 40)
    .map((m) => {
      // Climb onto the very top (overlapping hills and the rolling land move the summit): step uphill,
      // with ever smaller steps, until no step goes higher.
      let best = { x: m.x, z: m.z, h: heightAt(m.x, m.z) }
      for (const step of [6, 3, 1.5, 0.75, 0.4]) {
        for (let moved = true, guard = 0; moved && guard < 60; guard++) {
          moved = false
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2
            const x = best.x + Math.cos(a) * step
            const z = best.z + Math.sin(a) * step
            const h = heightAt(x, z)
            if (h > best.h + 1e-6) {
              best = { x, z, h }
              moved = true
            }
          }
        }
      }
      return best
    })
    // Two hills can share one summit: keep one star per top.
    .filter((t, i, all) => all.findIndex((o) => Math.hypot(o.x - t.x, o.z - t.z) < 6) === i)
    .filter((t) => !lakeAt(t.x, t.z, 0.5))
    .filter((t) => t.h > 12) // a hill levelled under a village or a landmark is no summit
  starCache = tops.map((t, i) => ({ id: `star${i}`, x: t.x, z: t.z, y: t.h }))
  return starCache
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
  blocker: 1, // an invisible obstacle (radius set per prop)
  obelisk: 1.4, standingStone: 1.1,
  mooncap: 1.3, gloomTree: 1.0, wisp: 0,
  crystal: 1.5, dunerock: 1.7,
  iceSpire: 1.2, frostPine: 0.8,
  obsidian: 1.3, emberRock: 1.5,
  deadTree: 0.7, lanternReed: 0,
  ruinArch: 2.4,
  roadLantern: 0.3, signpost: 0.3, windmill: 1.9,
  column: 0.8, columnBroken: 0.8, ruinWall: 2.0, shrine: 1.2, tower: 2.8, temple: 0,
  cottage: 2.9, cottageTeal: 2.9, cottageAmber: 2.9, hall: 4.2, well: 1.3, lampPost: 0.35, noticeBoard: 0.9,
  // the Frontier's scenery
  giantShroom: 1.1, shroomCluster: 0.9,
  saltPillar: 1.2, saltCrystal: 1.1,
  mangrove: 1.0, sunkenColumn: 0.9,
  stormRod: 0.5, slateStack: 1.6, chargedRock: 1.4,
  ribcage: 0, boneSpike: 0.5, skull: 1.5,
  floatIsle: 0, shardPillar: 0.9,
  // landmarks
  colossusHead: 5.5, colossusHand: 2.6, runeAltar: 1.6, bonfire: 1.1, campTent: 2.2, campBanner: 0.3,
  caveMound: 7, greatArch: 0, elderShroom: 2.4, stormSpire: 2.2, leviathanSkull: 0, skyAnchor: 2.2,
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
const WINDMILL_BIOMES = ['whisperwood', 'gloomfen', 'amethyst', 'saltglass', 'drowned']
export const WILD_CHEST_CHANCE = 0.3 // chance a chunk away from the spawn holds a chest
export function chunkContent(cx, cz) {
  const rng = mulberry32(Math.imul(cx, 73856093) ^ Math.imul(cz, 19349663) ^ WORLD_SEED)
  const center = chunkCenter(cx, cz)
  const out = { cx, cz, key: chunkKey(cx, cz), biome: biomeAt(center.x, center.z), props: [], monsters: [], treasure: [], grass: [], npcs: [] }
  if (Math.hypot(center.x, center.z) > WORLD_RADIUS - 4) return out
  const biome = BIOMES[out.biome]
  const place = () => ({ x: cx * CHUNK_SIZE + 2 + rng() * (CHUNK_SIZE - 4), z: cz * CHUNK_SIZE + 2 + rng() * (CHUNK_SIZE - 4) })
  const inWorld = (p) => Math.hypot(p.x, p.z) < WORLD_RADIUS - 6

  // Scenery: denser in the wild, sparse and stately in the sanctum.
  const propCount = out.biome === 'sanctum' ? 3 + Math.floor(rng() * 3) : Math.round((8 + Math.floor(rng() * 8)) * (biome.density ?? 1))
  for (let i = 0; i < propCount; i++) {
    const p = place()
    if (!inWorld(p)) continue
    // The very centre stays clear for the spawn point, and villages keep their own streets clear.
    if (Math.hypot(p.x, p.z) < 9) continue
    if (nearestVillage(p.x, p.z, VILLAGE_PLAZA_RADIUS + 22)) continue
    if (lakeAt(p.x, p.z, 0.35) || nearestSite(p.x, p.z, 2)) continue // no trees in the water, the ruins or the landmarks
    if (onRoad(p.x, p.z, 1.5)) continue // nor on the roads
    const kind = pickWeighted(rng, biome.props)[0]
    const scale = 0.75 + rng() * 0.8
    out.props.push({ kind, x: p.x, z: p.z, scale, rot: rng() * Math.PI * 2, radius: PROP_RADIUS[kind] * scale })
  }
  // A ruined arch now and then, anywhere out of the sanctum: a landmark to steer by.
  if (out.biome !== 'sanctum' && rng() < 0.12) {
    const p = place()
    if (inWorld(p) && !lakeAt(p.x, p.z, 0.5) && !nearestSite(p.x, p.z, 4) && !nearestVillage(p.x, p.z, VILLAGE_PLAZA_RADIUS + 22)) out.props.push({ kind: 'ruinArch', x: p.x, z: p.z, scale: 1.2 + rng() * 0.6, rot: rng() * Math.PI * 2, radius: PROP_RADIUS.ruinArch })
  }

  // Along the roads: wayside lanterns, the odd fingerpost, and now and then a windmill on the verge
  // where things grow (a separate random stream, so the scenery and camps above never shift).
  const roadRng = mulberry32((Math.imul(cx, 2654435761) ^ Math.imul(cz, 40503) ^ WORLD_SEED) + 101)
  for (let i = 0; i < 6; i++) {
    const p = place()
    const roll = roadRng()
    const side = roadRng()
    if (!inWorld(p) || nearestVillage(p.x, p.z, VILLAGE_PLAZA_RADIUS + 18) || lakeAt(p.x, p.z, 0.4) || nearestSite(p.x, p.z, 3)) continue
    const d = roadDistance(p.x, p.z)
    if (d > ROAD_WIDTH + 1 && d < ROAD_WIDTH + 3.5) {
      const kind = roll < 0.75 ? 'roadLantern' : 'signpost'
      out.props.push({ kind, x: p.x, z: p.z, scale: 1, rot: side * Math.PI * 2, radius: PROP_RADIUS[kind] })
    } else if (d > ROAD_WIDTH + 7 && d < ROAD_WIDTH + 16 && roll < 0.12 && WINDMILL_BIOMES.includes(out.biome)) {
      out.props.push({ kind: 'windmill', x: p.x, z: p.z, scale: 0.9 + side * 0.3, rot: side * Math.PI * 2, radius: PROP_RADIUS.windmill })
    }
  }

  // Monsters in camps: a few per chunk, more and meaner the farther from the sanctum.
  if (biome.monsters.length) {
    const danger = dangerAt(center.x, center.z)
    const count = Math.floor(rng() * (2 + danger * 3.2)) + (rng() < 0.55 ? 1 : 0)
    for (let i = 0; i < count; i++) {
      const p = place()
      if (!inWorld(p) || Math.hypot(p.x, p.z) < SANCTUM_RADIUS + 6) continue
      if (nearestVillage(p.x, p.z, VILLAGE_SAFE_RADIUS)) continue // villages are safe
      if (lakeAt(p.x, p.z, 0.3) || nearestSite(p.x, p.z, 3)) continue // land monsters keep out of the water; ruins and landmarks have their own guards
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
    for (const t of layout.treasure) if (inChunk(t)) out.treasure.push(t)
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

  // Ruins and landmarks: stones, loot and guards. A temple's guardian is a boss (hpScale / danger follow the land
  // around it); everyone else is drawn from the biome the site stands in.
  for (const site of sites()) {
    if (Math.hypot(site.x - center.x, site.z - center.z) > 60) continue
    const layout = site.site === 'ruin' ? ruinLayout(site) : landmarkLayout(site)
    for (const prop of layout.props) if (inChunk(prop)) out.props.push(prop)
    for (const t of layout.treasure) if (inChunk(t)) out.treasure.push(t)
    const danger = Math.max(0.3, dangerAt(site.x, site.z))
    const siteMonsters = BIOMES[site.biome].monsters.filter((m) => danger >= m[2])
    for (const g of layout.guards) {
      if (!inChunk(g)) continue
      if (g.role === 'boss') {
        const boss = BOSSES[site.index % BOSSES.length]
        out.monsters.push({ id: g.id, type: boss.id, x: g.x, z: g.z, elite: false, boss: true, danger, hpScale: 0.9 + danger * 1.1, ruinId: site.id, name: site.name })
        continue
      }
      if (!siteMonsters.length) continue
      const elite = g.role === 'elite'
      const [type] = pickWeighted(rng, siteMonsters)
      out.monsters.push({ id: g.id, type, x: g.x, z: g.z, elite, danger, hpScale: (1 + danger * 1.6) * (elite ? 2.4 : 1), siteId: site.id })
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
    if (lakeAt(gx, gz, 0.1)) continue // no grass under water
    const site = nearestSite(gx, gz, -2)
    if (site?.floor) continue // nor on flagstones or a camp's trampled earth
    if (onRoad(gx, gz, -0.8)) continue // the road is bare dirt
    out.grass.push({ x: gx, z: gz, scale: 0.7 + grassRng() * 0.9 + patch * 0.4, rot: grassRng() * Math.PI * 2, tint: grassRng() })
  }

  // Treasure: the odd chest, hiding suitcase or power-up, away from the spawn point.
  // Ruin and village chests (already in out.treasure) are fixed spots; the wild ones are filtered away from villages / lakes.
  const far = Math.hypot(center.x, center.z) > 20
  const wild = []
  if (far && rng() < WILD_CHEST_CHANCE) wild.push({ id: `${out.key}:chest`, kind: 'chest', ...place() })
  if (far && rng() < 0.16) wild.push({ id: `${out.key}:pod`, kind: 'pod', ...place() })
  if (far && rng() < 0.04) wild.push({ id: `${out.key}:perk`, kind: 'perk', ...place() })
  out.treasure.push(...wild.filter((t) => inWorld(t) && !nearestVillage(t.x, t.z, VILLAGE_PLAZA_RADIUS + 24) && !lakeAt(t.x, t.z, 0.2) && !onRoad(t.x, t.z, 0) && !nearestSite(t.x, t.z, 2) && !out.props.some((p) => p.radius > 0 && Math.hypot(p.x - t.x, p.z - t.z) < p.radius + 1.6)))
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
