// Pure, Three-free rules for the free roam world: a big mystical floating continent split into five
// biomes around a safe central sanctum. Everything is a deterministic function of a seed, so the same
// world comes back every run and chunks can be streamed in and out around the player.
//
//   biomeAt(x, z)        - which biome a point is in
//   groundColorAt(x, z)  - the ground colour there, blended smoothly across biome borders
//   dangerAt(x, z)       - 0 at the sanctum up to 1 at the rim: how tough the monsters are
//   chunkContent(cx, cz) - the props, monsters and treasure seeded into one chunk

export const WORLD_RADIUS = 320
export const WORLD_SEED = 7219
export const CHUNK_SIZE = 40
export const LOAD_RADIUS = 125 // chunks whose centre is this close to the player are alive
export const UNLOAD_RADIUS = 150 // ...and drop away beyond this
export const SANCTUM_RADIUS = 46 // the safe, healing heart of the world
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
    monsters: [['blobbo', 5, 0], ['hopper', 3, 0.1], ['grumpus', 3, 0.15], ['splitter', 2, 0.45]],
  },
  amethyst: {
    name: 'Amethyst Dunes',
    ground: [0.55, 0.38, 0.62],
    glow: 0xe28bff,
    fog: 0x3c2352,
    grass: 110,
    props: [['crystal', 6], ['dunerock', 3], ['wisp', 1]],
    monsters: [['zippy', 5, 0], ['mirror', 3, 0.25], ['glimmer', 3, 0.3], ['spinner', 2, 0.4]],
  },
  frostveil: {
    name: 'Frostveil Reach',
    ground: [0.7, 0.82, 0.92],
    glow: 0x9be7ff,
    fog: 0x27415c,
    grass: 100,
    props: [['iceSpire', 5], ['frostPine', 5], ['wisp', 1]],
    monsters: [['zippy', 3, 0], ['grumpus', 4, 0.1], ['splitter', 3, 0.3], ['bloater', 2, 0.4]],
  },
  emberwaste: {
    name: 'Emberwaste',
    ground: [0.26, 0.15, 0.14],
    glow: 0xff7a3a,
    fog: 0x401a14,
    grass: 45,
    props: [['obsidian', 6], ['emberRock', 4], ['wisp', 1]],
    monsters: [['grumpus', 4, 0], ['spinner', 3, 0.2], ['bloater', 3, 0.25], ['hopper', 2, 0.3]],
  },
  gloomfen: {
    name: 'Gloomfen',
    ground: [0.2, 0.26, 0.14],
    glow: 0xc6ff4a,
    fog: 0x22301a,
    grass: 170,
    props: [['deadTree', 5], ['lanternReed', 5], ['mooncap', 2]],
    monsters: [['blobbo', 3, 0], ['bloater', 4, 0.1], ['splitter', 3, 0.2], ['hopper', 3, 0.2]],
  },
}

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
  const land = color.map((c, i) => Math.min(1, mix(c, sanctum[i], toSanctum) * dapple))
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
  for (let i = 0; i < 18; i++) {
    const angle = rng() * Math.PI * 2
    const r = SANCTUM_RADIUS + 55 + rng() * (WORLD_RADIUS - SANCTUM_RADIUS - 120)
    list.push({ x: Math.cos(angle) * r, z: Math.sin(angle) * r, radius: 22 + rng() * 18, height: 6 + rng() * 7 })
  }
  return list
})()

// Ground height before the sanctum, rim and villages flatten it: broad rolling swells, finer bumps, and the mounds.
function rawTerrain(x, z) {
  const broad = (valueNoise(x * 0.009, z * 0.009, WORLD_SEED + 21) - 0.5) * 2
  const mid = (valueNoise(x * 0.024, z * 0.024, WORLD_SEED + 22) - 0.5) * 2
  let h = broad * 6.5 + mid * 2.2 + 1.2
  for (const m of MOUNDS) {
    const d2 = ((x - m.x) ** 2 + (z - m.z) ** 2) / (m.radius * m.radius)
    if (d2 < 9) h += m.height * Math.exp(-d2 * 1.3)
  }
  return h > 0 ? h : h * 0.1 // valleys flatten into meadows instead of digging pits
}

// Hills fade out toward the sanctum (a level, sacred floor) and toward the rim (so the edge meets the rock).
function terrainHeight(x, z) {
  const r = Math.hypot(x, z)
  const inner = smooth(Math.min(1, Math.max(0, (r - (SANCTUM_RADIUS - 6)) / 44)))
  const outer = 1 - smooth(Math.min(1, Math.max(0, (r - (WORLD_RADIUS - 46)) / 40)))
  return rawTerrain(x, z) * inner * outer
}

// ---- villages -----------------------------------------------------------------------------------------

export const VILLAGE_PLAZA_RADIUS = 13 // the paved, level square at a village's heart
export const VILLAGE_SAFE_RADIUS = 46 // no wild monsters inside this
const VILLAGE_CELL = 150
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
      const x = (i + 0.5) * VILLAGE_CELL + (rng() - 0.5) * 90
      const z = (j + 0.5) * VILLAGE_CELL + (rng() - 0.5) * 90
      const r = Math.hypot(x, z)
      if (r < SANCTUM_RADIUS + 50 || r > WORLD_RADIUS - 55) continue
      if (sites.some((s) => Math.hypot(s.x - x, s.z - z) < 95)) continue
      sites.push({ x, z })
    }
  }
  // Every biome gets at least one village, so no region is left without people.
  for (const biome of OUTER_BIOMES) {
    if (sites.some((s) => biomeAt(s.x, s.z) === biome)) continue
    search: for (const r of [170, 200, 140, 225]) {
      for (let a = 0; a < 360; a += 6) {
        const x = Math.cos((a * Math.PI) / 180) * r
        const z = Math.sin((a * Math.PI) / 180) * r
        if (biomeAt(x, z) !== biome || sites.some((s) => Math.hypot(s.x - x, s.z - z) < 95)) continue
        sites.push({ x, z })
        break search
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
  return h
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
    const kind = pickWeighted(rng, biome.props)[0]
    const scale = 0.75 + rng() * 0.8
    out.props.push({ kind, x: p.x, z: p.z, scale, rot: rng() * Math.PI * 2, radius: PROP_RADIUS[kind] * scale })
  }
  // A ruined arch now and then, anywhere out of the sanctum: a landmark to steer by.
  if (out.biome !== 'sanctum' && rng() < 0.12) {
    const p = place()
    if (inWorld(p)) out.props.push({ kind: 'ruinArch', x: p.x, z: p.z, scale: 1.2 + rng() * 0.6, rot: rng() * Math.PI * 2, radius: PROP_RADIUS.ruinArch })
  }

  // Monsters in camps: a few per chunk, more and meaner the farther from the sanctum.
  if (biome.monsters.length) {
    const danger = dangerAt(center.x, center.z)
    const count = Math.floor(rng() * (2 + danger * 3.2)) + (rng() < 0.55 ? 1 : 0)
    for (let i = 0; i < count; i++) {
      const p = place()
      if (!inWorld(p) || Math.hypot(p.x, p.z) < SANCTUM_RADIUS + 6) continue
      if (nearestVillage(p.x, p.z, VILLAGE_SAFE_RADIUS)) continue // villages are safe
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
    out.grass.push({ x: gx, z: gz, scale: 0.7 + grassRng() * 0.9 + patch * 0.4, rot: grassRng() * Math.PI * 2, tint: grassRng() })
  }

  // Treasure: the odd chest, hiding suitcase or power-up, away from the spawn point.
  const far = Math.hypot(center.x, center.z) > 20
  if (far && rng() < 0.1) out.treasure.push({ id: `${out.key}:chest`, kind: 'chest', ...place() })
  if (far && rng() < 0.16) out.treasure.push({ id: `${out.key}:pod`, kind: 'pod', ...place() })
  if (far && rng() < 0.04) out.treasure.push({ id: `${out.key}:perk`, kind: 'perk', ...place() })
  out.treasure = out.treasure.filter((t) => inWorld(t) && !nearestVillage(t.x, t.z, VILLAGE_PLAZA_RADIUS + 24))
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
export function canRespawn(killedAt, now) {
  return killedAt == null || now - killedAt >= RESPAWN_SECONDS
}
