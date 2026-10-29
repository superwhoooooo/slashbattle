// Pure, Three-free sundeck prop layout: where the pools, umbrellas,
// loungers, and signs sit on the platform. Kept free of Three.js imports
// so Vitest can exercise it without WebGL; src/arena.js turns the result
// into actual meshes, and src/main.js folds the non-pool props into the
// same circular-obstacle list pods use.
//
// A seeded PRNG (not Math.random) makes the layout the same every run,
// given the same seed -- config.js's RESORT_LAYOUT_SEED is the one main.js
// actually uses.

// A small, dependency-free seeded PRNG (mulberry32) so the layout is
// reproducible without pulling in Math.random anywhere in this module.
function createRng(seed) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// No prop's center may come closer than this to the origin minus its own
// radius -- the player spawns/respawns at the center, so this keeps that
// spot (and the walk-up to it) clear.
const CENTER_CLEARANCE = 8
// No prop may reach closer than this to the platform's actual edge.
const EDGE_MARGIN = 3
// Extra breathing room enforced between any two props, beyond just their
// radii touching.
const PROP_GAP = 0.6

const POOL_COUNT_MIN = 4
const POOL_COUNT_MAX = 6
const POOL_RX_MIN = 2.2
const POOL_RX_MAX = 3.6
const POOL_RZ_MIN = 1.6
const POOL_RZ_MAX = 2.8

const UMBRELLA_COUNT_MIN = 14
const UMBRELLA_COUNT_MAX = 20
const UMBRELLA_RADIUS = 1.1 // ground footprint (canopy + pole), for collision/placement
const UMBRELLA_COLORS = [0xff6a4d, 0xffd15c, 0x19b5a5] // coral, butter, teal

const LOUNGER_RADIUS = 0.5
// How many loungers cluster near each pool's rim, and near every other
// umbrella, so they read as grouped seating rather than scattered evenly.
const LOUNGERS_PER_POOL_MIN = 2
const LOUNGERS_PER_POOL_MAX = 3
const LOUNGER_POOL_OFFSET_MIN = 1.2 // world units out from the pool's own rim
const LOUNGER_POOL_OFFSET_MAX = 2.6
const LOUNGER_UMBRELLA_OFFSET_MIN = 1.2
const LOUNGER_UMBRELLA_OFFSET_MAX = 2.0

const SIGN_COUNT_MIN = 3
const SIGN_COUNT_MAX = 5
const SIGN_RADIUS = 0.35
const SIGN_TEXTS = ['DECK 4', 'POOL', 'SUNDECK', 'PLEASE DO NOT FEED THE GRUMPUS', 'NO DIVING (SERIOUSLY)']

const PLACEMENT_ATTEMPTS = 200
const NEAR_PLACEMENT_ATTEMPTS = 30

function lerp(min, max, t) {
  return min + (max - min) * t
}

// True if a point (world {x, z}) lies within any pool's ellipse --
// pools stay walkable (no obstacle), but this lets other game logic tell
// when the player or a falling monster is standing in the water (for
// naming "Cannonball" kills there).
export function isInPool(pools, x, z) {
  return pools.some((pool) => {
    const dx = (x - pool.x) / pool.rx
    const dz = (z - pool.z) / pool.rz
    return dx * dx + dz * dz <= 1
  })
}

// A deterministic layout of the sundeck's props for a platform of the
// given `radius`, picked with a PRNG seeded from `seed` (same seed, same
// layout, every time). Shape of the result:
//   pools:     [{ x, z, rx, rz }]              -- ellipse half-axes, walkable
//   umbrellas: [{ x, z, radius, color }]       -- circular footprint, obstacle
//   loungers:  [{ x, z, radius, rotation }]    -- circular footprint, obstacle
//   signs:     [{ x, z, radius, text }]        -- circular footprint, obstacle
// Every non-pool prop keeps CENTER_CLEARANCE from the origin and
// EDGE_MARGIN from `radius`, and no two props (of any kind, including
// pools) overlap once PROP_GAP is added to their radii.
export function resortLayout({ radius, seed }) {
  const rng = createRng(seed)
  const placed = [] // every placed prop so far, as { x, z, radius } circles

  function fitsExisting(x, z, propRadius) {
    return placed.every((other) => {
      const dx = x - other.x
      const dz = z - other.z
      const minDistance = propRadius + other.radius + PROP_GAP
      return dx * dx + dz * dz >= minDistance * minDistance
    })
  }

  function withinBounds(x, z, propRadius) {
    const distance = Math.hypot(x, z)
    return distance - propRadius >= CENTER_CLEARANCE && distance + propRadius <= radius - EDGE_MARGIN
  }

  function tryPlace(x, z, propRadius) {
    if (!withinBounds(x, z, propRadius)) return false
    if (!fitsExisting(x, z, propRadius)) return false
    placed.push({ x, z, radius: propRadius })
    return true
  }

  // A uniformly-random point in the annulus [minDist, maxDist] of the
  // origin (area-uniform, the same sqrt trick src/logic/arena.js's
  // randomPointOnPlatform uses, generalized to a non-zero inner radius).
  function randomAnnulusPoint(minDist, maxDist) {
    const angle = rng() * Math.PI * 2
    const t = rng()
    const distance = Math.sqrt(minDist * minDist + t * (maxDist * maxDist - minDist * minDist))
    return { x: Math.sin(angle) * distance, z: Math.cos(angle) * distance }
  }

  // Tries a prop anywhere valid on the deck, retrying a fresh random spot
  // up to PLACEMENT_ATTEMPTS times. Returns the point, or null if nothing
  // fit (the caller just skips that prop rather than forcing a bad spot).
  function placeRandom(propRadius) {
    const minDist = CENTER_CLEARANCE + propRadius
    const maxDist = radius - EDGE_MARGIN - propRadius
    if (maxDist <= minDist) return null
    for (let attempt = 0; attempt < PLACEMENT_ATTEMPTS; attempt++) {
      const point = randomAnnulusPoint(minDist, maxDist)
      if (tryPlace(point.x, point.z, propRadius)) return point
    }
    return null
  }

  // Tries a prop near `center` (offset minOffset-maxOffset away, any
  // direction), for grouping loungers around a pool or an umbrella.
  // Returns { x, z, angle } (angle = direction from center), or null.
  function placeNear(center, minOffset, maxOffset, propRadius) {
    for (let attempt = 0; attempt < NEAR_PLACEMENT_ATTEMPTS; attempt++) {
      const angle = rng() * Math.PI * 2
      const offset = minOffset + rng() * (maxOffset - minOffset)
      const x = center.x + Math.sin(angle) * offset
      const z = center.z + Math.cos(angle) * offset
      if (tryPlace(x, z, propRadius)) return { x, z, angle }
    }
    return null
  }

  const pools = []
  const poolCount = POOL_COUNT_MIN + Math.floor(rng() * (POOL_COUNT_MAX - POOL_COUNT_MIN + 1))
  for (let i = 0; i < poolCount; i++) {
    const rx = lerp(POOL_RX_MIN, POOL_RX_MAX, rng())
    const rz = lerp(POOL_RZ_MIN, POOL_RZ_MAX, rng())
    const point = placeRandom(Math.max(rx, rz))
    if (point) pools.push({ x: point.x, z: point.z, rx, rz })
  }

  const umbrellas = []
  const umbrellaCount = UMBRELLA_COUNT_MIN + Math.floor(rng() * (UMBRELLA_COUNT_MAX - UMBRELLA_COUNT_MIN + 1))
  for (let i = 0; i < umbrellaCount; i++) {
    const point = placeRandom(UMBRELLA_RADIUS)
    if (point) {
      const color = UMBRELLA_COLORS[Math.floor(rng() * UMBRELLA_COLORS.length)]
      umbrellas.push({ x: point.x, z: point.z, radius: UMBRELLA_RADIUS, color })
    }
  }

  const loungers = []
  for (const pool of pools) {
    const count = LOUNGERS_PER_POOL_MIN + Math.floor(rng() * (LOUNGERS_PER_POOL_MAX - LOUNGERS_PER_POOL_MIN + 1))
    const poolRadius = Math.max(pool.rx, pool.rz)
    for (let i = 0; i < count; i++) {
      const point = placeNear(
        pool,
        poolRadius + LOUNGER_POOL_OFFSET_MIN,
        poolRadius + LOUNGER_POOL_OFFSET_MAX,
        LOUNGER_RADIUS,
      )
      if (point) loungers.push({ x: point.x, z: point.z, radius: LOUNGER_RADIUS, rotation: point.angle })
    }
  }
  for (let i = 0; i < umbrellas.length; i += 2) {
    const umbrella = umbrellas[i]
    const point = placeNear(umbrella, LOUNGER_UMBRELLA_OFFSET_MIN, LOUNGER_UMBRELLA_OFFSET_MAX, LOUNGER_RADIUS)
    if (point) loungers.push({ x: point.x, z: point.z, radius: LOUNGER_RADIUS, rotation: point.angle })
  }

  const signs = []
  const signCount = SIGN_COUNT_MIN + Math.floor(rng() * (SIGN_COUNT_MAX - SIGN_COUNT_MIN + 1))
  for (let i = 0; i < signCount; i++) {
    const point = placeRandom(SIGN_RADIUS)
    if (point) {
      const text = SIGN_TEXTS[Math.floor(rng() * SIGN_TEXTS.length)]
      signs.push({ x: point.x, z: point.z, radius: SIGN_RADIUS, text })
    }
  }

  return { pools, umbrellas, loungers, signs }
}
