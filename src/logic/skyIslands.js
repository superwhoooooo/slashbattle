// Skylift towers and the sky islands above the Wilds. A handful of tall towers stand out on the land; step onto
// the glowing pad inside one, hold still while it charges, and it fires you hundreds of metres straight up. From
// the top of the launch you glide out to that tower's archipelago: a big main isle (a grove with a waterfall,
// old sky ruins, a flower garden, a forge, an observatory), a chain of smaller islets stepping down and away from
// it, and, high above the main isle, a small crown isle reached by riding an updraft with the glider open. The
// crown holds a Sky Relic. Walk off any edge and you fall back to the land (open the glider!).
// Pure and seeded: the main game (main.js) and the look (src/skyIslands.js) both read this.
import { WORLD_RADIUS, SANCTUM_RADIUS, heightAt, lakeAt, mulberry32, nearestSite, nearestVillage, roadDistance, dangerAt } from './world.js'
import { GLIDE_SINK, GLIDE_SPEED_MULTIPLIER, JUMP_GRAVITY } from './jump.js'
import { PLAYER_SPEED } from '../config.js'

const GLIDE_RATIO = GLIDE_SINK / (PLAYER_SPEED * GLIDE_SPEED_MULTIPLIER) // metres lost per metre glided

export const TOWER_HEIGHT = 44 // the tower's crown above its base
export const TOWER_RING = 5.6 // the pillars stand on a ring this wide around the pad
export const TOWER_PILLARS = 6
export const PILLAR_RADIUS = 0.9
export const PAD_RADIUS = 2.6 // stand inside this to charge the lift
export const CHARGE_SECONDS = 1.8 // hold still on the pad this long
export const LAUNCH_RISE = 360 // a launch peaks this far above the tower's base (well over the isles, so you can look down on the archipelago)
export const ISLE_APEX = 215 // the height the isles are laid out against (they stay put; the launch just carries you past them)
export const ISLE_STEP = 2.5 // you land on an isle when your feet are no more than this below its top
export const UPDRAFT_LIFT = 10 // how fast an updraft carries an open glider up
export const UPDRAFT_RADIUS = 4.2
export const RELIC_REWARD = 75 // crystals for a Sky Relic (the first time ever; it stays taken)
export const RELIC_CATCH_RADIUS = 2.8
export const ALOFT_HEIGHT = 14 // this far above the land counts as being up in the sky (ground monsters lose you)

const TOWER_NAMES = ['Zephyr', 'Halcyon', 'Cirrus', 'Aerie', 'Nimbus', 'Seraph', 'Stratus', 'Lumen', 'Gale']
const MAIN_KINDS = ['grove', 'ruins', 'garden', 'forge', 'observatory']
const MAIN_SUFFIX = { grove: 'Grove', ruins: 'Ruins', garden: 'Gardens', forge: 'Forge', observatory: 'Observatory' }
const ISLET_NAMES = ['Driftstone', 'Featherrock', 'Cloudstep', 'Windshelf', 'Mistcap', 'Skypebble', 'Gullrest', 'Haloreef']
// Who haunts the isles: sky folk only (nothing that blinks -- it would blink straight off the edge).
const SKY_MONSTERS = ['bumble', 'boogle', 'mirror', 'spinner', 'bloater', 'twister', 'zippy', 'grumpus']
const SKY_GUARDIANS = ['boss_bumble', 'boss_mirror', 'boss_grumpsalot', 'boss_gloop', 'boss_snapper', 'boss_twister']

const launchVelocityCache = Math.sqrt(2 * JUMP_GRAVITY * LAUNCH_RISE)
// The upward speed a launch leaves the pad with (so it peaks LAUNCH_RISE above it, under normal gravity).
export const launchVelocity = () => launchVelocityCache

// ---- towers -------------------------------------------------------------------------------------------

// Is this a good spot for a tower: dry, level enough, clear of villages, ruins, landmarks and roads.
function towerSpotOk(x, z) {
  const r = Math.hypot(x, z)
  if (r < SANCTUM_RADIUS + 26 || r > WORLD_RADIUS - 90) return false
  if (lakeAt(x, z, 10)) return false
  if (nearestVillage(x, z, 60)) return false
  if (nearestSite(x, z, 16)) return false
  if (roadDistance(x, z) < 9) return false
  const h = heightAt(x, z)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    if (Math.abs(heightAt(x + Math.cos(a) * 7, z + Math.sin(a) * 7) - h) > 2.2) return false
  }
  return true
}

let towerCache = null
// Every tower: { id, name, x, z, y (base), top, dir (which way its isles lie) }.
export function skyTowers() {
  if (towerCache) return towerCache
  const rand = mulberry32(55117)
  // A starter just outside the Sanctum, four out in the Heartland, four out in the Frontier.
  const rings = [
    { r: 92, n: 1, a0: 0.6 },
    { r: 205, n: 4, a0: 1.3 },
    { r: 395, n: 4, a0: 0.2 },
  ]
  const list = []
  for (const ring of rings) {
    for (let k = 0; k < ring.n; k++) {
      const base = ring.a0 + (k / ring.n) * Math.PI * 2
      let spot = null
      for (let tries = 0; tries < 220 && !spot; tries++) {
        const a = base + (rand() - 0.5) * (tries < 60 ? 0.5 : 1.2)
        const r = ring.r + (rand() - 0.5) * (tries < 60 ? 30 : 70)
        const x = Math.cos(a) * r
        const z = Math.sin(a) * r
        if (!towerSpotOk(x, z)) continue
        if (list.some((t) => Math.hypot(t.x - x, t.z - z) < 160)) continue
        spot = { x, z, a }
      }
      if (!spot) continue
      const i = list.length
      // The isles drift off sideways along the ring (and a touch inward, so they never hang past the rim).
      const side = rand() < 0.5 ? -1 : 1
      const dir = spot.a + side * (Math.PI / 2) + (ring.r > 300 ? side * 0.45 : 0)
      const y = heightAt(spot.x, spot.z)
      list.push({ id: `tower${i}`, name: `${TOWER_NAMES[i % TOWER_NAMES.length]} Skylift`, isles: `The ${TOWER_NAMES[i % TOWER_NAMES.length]} Isles`, x: spot.x, z: spot.z, y, top: y + TOWER_HEIGHT, dir, index: i })
    }
  }
  towerCache = list
  return towerCache
}
export const towerById = (id) => skyTowers().find((t) => t.id === id) ?? null

// The pillars around a tower's pad: solid circles (the gaps between them are the way in).
export function towerObstacles(tower) {
  const out = []
  for (let i = 0; i < TOWER_PILLARS; i++) {
    const a = (i / TOWER_PILLARS) * Math.PI * 2 + Math.PI / TOWER_PILLARS
    out.push({ x: tower.x + Math.cos(a) * TOWER_RING, z: tower.z + Math.sin(a) * TOWER_RING, radius: PILLAR_RADIUS })
  }
  return out
}

// ---- the isles ------------------------------------------------------------------------------------------

let isleCache = null
let archCache = null
// Every archipelago: { id, towerId, name, x, z (rough centre), radius (reach), low, high, isles: [...], updraft, relic }.
// An isle: { id, archId, name, kind, x, z, y (top), radius, depth, main, crown, seed }.
export function skyArchipelagos() {
  if (archCache) return archCache
  const placed = []
  archCache = skyTowers().map((tower) => {
    const arch = planArchipelago(tower, placed)
    placed.push(...arch.isles)
    return arch
  })
  isleCache = archCache.flatMap((a) => a.isles)
  return archCache
}
export function skyIsles() {
  skyArchipelagos()
  return isleCache
}
export const isleById = (id) => skyIsles().find((i) => i.id === id) ?? null
export const archipelagoById = (id) => skyArchipelagos().find((a) => a.id === id) ?? null

const insideWorld = (x, z, r) => Math.hypot(x, z) + r < WORLD_RADIUS - 24

function planArchipelago(tower, others = []) {
  const rand = mulberry32(9001 + tower.index * 131)
  const apex = tower.y + ISLE_APEX
  const kind = MAIN_KINDS[tower.index % MAIN_KINDS.length]
  const archId = `arch${tower.index}`
  const isles = []
  const fits = (x, z, r) => insideWorld(x, z, r) && [...isles, ...others].every((o) => Math.hypot(o.x - x, o.z - z) > o.radius + r + 6)
  // The main isle: a short glide out from the top of the launch.
  let dir = tower.dir
  let mx = tower.x + Math.cos(dir) * 60
  let mz = tower.z + Math.sin(dir) * 60
  for (let k = 0; k < 18 && !fits(mx, mz, 30); k++) {
    dir += 0.35
    mx = tower.x + Math.cos(dir) * 60
    mz = tower.z + Math.sin(dir) * 60
  }
  const main = { id: `${archId}-main`, archId, name: `${TOWER_NAMES[tower.index % TOWER_NAMES.length]} ${MAIN_SUFFIX[kind]}`, kind, x: mx, z: mz, y: apex - 24, radius: 23 + rand() * 4, main: true, crown: false, seed: tower.index * 17 + 1 }
  main.depth = main.radius * 0.95
  isles.push(main)

  // A chain of islets stepping down and away from the main isle: each one a comfortable glide from the last.
  let prev = main
  let heading = dir + (rand() - 0.5) * 0.6
  const chain = 4 + Math.floor(rand() * 2)
  for (let i = 0; i < chain; i++) {
    const r = 8 + rand() * 6
    const drop = 6 + rand() * 5
    let placed = null
    for (let tries = 0; tries < 16 && !placed; tries++) {
      const h = heading + (rand() - 0.5) * 1.1 + (tries > 6 ? (tries - 6) * 0.5 : 0)
      const gap = Math.min(12 + rand() * 9, (drop / GLIDE_RATIO) * 0.7) // always a comfortable glide
      const d = prev.radius + r + gap
      const x = prev.x + Math.cos(h) * d
      const z = prev.z + Math.sin(h) * d
      if (fits(x, z, r)) placed = { x, z, h }
    }
    if (!placed) break
    heading = placed.h
    const isle = {
      id: `${archId}-i${i}`,
      archId,
      name: `${ISLET_NAMES[(tower.index * 3 + i) % ISLET_NAMES.length]} Isle`,
      kind: ['islet', 'crystal', 'islet', 'shrine', 'islet', 'crystal'][i % 6],
      x: placed.x,
      z: placed.z,
      y: prev.y - drop,
      radius: r,
      depth: r * (0.9 + rand() * 0.5),
      main: false,
      crown: false,
      seed: tower.index * 17 + 3 + i,
    }
    isles.push(isle)
    prev = isle
  }

  // An updraft just off the main isle's far side, and the crown isle hanging above it.
  let ua = dir + Math.PI * 0.85
  let ux = main.x + Math.cos(ua) * (main.radius + 5)
  let uz = main.z + Math.sin(ua) * (main.radius + 5)
  let cx = ux + Math.cos(ua) * 15
  let cz = uz + Math.sin(ua) * 15
  for (let k = 0; k < 16 && !fits(cx, cz, 10); k++) {
    ua += 0.4
    ux = main.x + Math.cos(ua) * (main.radius + 5)
    uz = main.z + Math.sin(ua) * (main.radius + 5)
    cx = ux + Math.cos(ua) * 15
    cz = uz + Math.sin(ua) * 15
  }
  const crown = { id: `${archId}-crown`, archId, name: `${TOWER_NAMES[tower.index % TOWER_NAMES.length]} Crown`, kind: 'crown', x: cx, z: cz, y: main.y + 34, radius: 9, depth: 11, main: false, crown: true, seed: tower.index * 17 + 11 }
  isles.push(crown)
  const updraft = { id: `${archId}-draft`, x: ux, z: uz, radius: UPDRAFT_RADIUS, y0: main.y - 30, y1: crown.y + 12 }
  const relic = { id: `relic${tower.index}`, archId, x: crown.x, z: crown.z, y: crown.y }

  let sx = 0
  let sz = 0
  for (const i of isles) {
    sx += i.x
    sz += i.z
  }
  const x = sx / isles.length
  const z = sz / isles.length
  let reach = 0
  for (const i of isles) reach = Math.max(reach, Math.hypot(i.x - x, i.z - z) + i.radius)
  const danger = Math.min(1, dangerAt(tower.x, tower.z) + 0.25)
  return {
    id: archId,
    towerId: tower.id,
    name: tower.isles,
    x,
    z,
    radius: reach,
    low: Math.min(...isles.map((i) => i.y)),
    high: Math.max(...isles.map((i) => i.y)),
    danger,
    isles,
    updraft,
    relic,
  }
}

// The isle whose top covers (x, z) (within `margin` of its edge), or null.
export function isleAt(x, z, margin = 0) {
  for (const isle of skyIsles()) {
    const dx = isle.x - x
    const dz = isle.z - z
    const r = isle.radius + margin
    if (dx * dx + dz * dz <= r * r) return isle
  }
  return null
}

// The isle you'd be standing on at (x, z) with your feet at `alt`, or null (below it, or not over one).
export function isleUnder(x, z, alt) {
  let best = null
  for (const isle of skyIsles()) {
    const dx = isle.x - x
    const dz = isle.z - z
    if (dx * dx + dz * dz > isle.radius * isle.radius) continue
    if (alt < isle.y - ISLE_STEP) continue
    if (!best || isle.y > best.y) best = isle
  }
  return best
}

// The surface under your feet: an isle's top when you're on (or above) one, otherwise the land.
export function surfaceAt(x, z, alt = -Infinity) {
  const isle = isleUnder(x, z, alt)
  const ground = heightAt(x, z)
  return isle && isle.y > ground ? isle.y : ground
}

// Is a point at `alt` up in the sky (on an isle, or far above the land)?
export const isAloft = (x, z, alt) => alt - heightAt(x, z) > ALOFT_HEIGHT

// The lift an updraft gives at a point (0 when outside every updraft's column).
export function updraftLift(x, z, alt) {
  for (const a of skyArchipelagos()) {
    const u = a.updraft
    if (alt < u.y0 || alt > u.y1) continue
    if (Math.hypot(u.x - x, u.z - z) > u.radius) continue
    const top = (u.y1 - alt) / 10 // eases off over the last few metres, so you bob at the top rather than shoot out
    return UPDRAFT_LIFT * Math.max(0.15, Math.min(1, top))
  }
  return 0
}

// ---- what's on each isle --------------------------------------------------------------------------------

// Props (look only), treasure and guards for one isle, in world coordinates. Props: { kind, x, z, y, rot, scale }.
// Treasure: { id, kind: 'chest', x, z, y }. Guards: { id, type, x, z, elite, boss }.
export function isleLayout(isle) {
  const rand = mulberry32(4242 + isle.seed * 97)
  const props = []
  const treasure = []
  const guards = []
  const at = (r, a) => ({ x: isle.x + Math.cos(a) * r, z: isle.z + Math.sin(a) * r })
  const add = (kind, r, a, scale = 1, rot = rand() * Math.PI * 2) => props.push({ kind, ...at(r, a), y: isle.y, rot, scale })
  const scatter = (kind, n, rMin, rMax, sMin = 0.8, sMax = 1.2) => {
    for (let i = 0; i < n; i++) add(kind, isle.radius * (rMin + rand() * (rMax - rMin)), rand() * Math.PI * 2, sMin + rand() * (sMax - sMin))
  }
  const R = isle.radius
  const monster = () => SKY_MONSTERS[Math.floor(rand() * SKY_MONSTERS.length)]
  const guard = (n, elite = false) => {
    for (let i = 0; i < n; i++) {
      const p = at(R * (0.25 + rand() * 0.45), rand() * Math.PI * 2)
      guards.push({ id: `${isle.id}:g${guards.length}`, type: monster(), ...p, elite })
    }
  }
  const chest = (r = 0, a = 0) => treasure.push({ id: `${isle.id}:chest${treasure.length}`, kind: 'chest', ...at(r, a), y: isle.y })

  switch (isle.kind) {
    case 'grove':
      scatter('skytree', 7, 0.35, 0.82, 0.9, 1.5)
      scatter('shrub', 8, 0.2, 0.9)
      scatter('boulder', 4, 0.5, 0.88)
      add('pond', R * 0.32, 0.3, 1.2, 0)
      add('waterfall', R * 0.97, 0.3, 1, 0.3)
      chest(R * 0.1, 2.2)
      guard(2)
      break
    case 'ruins':
      for (let i = 0; i < 8; i++) add(i % 3 === 1 ? 'brokenPillar' : 'pillar', R * 0.62, (i / 8) * Math.PI * 2, 1.1, 0)
      add('arch', R * 0.0, 0, 1.4, rand() * Math.PI)
      for (let i = 0; i < 4; i++) add('runeSlab', R * 0.38, (i / 4) * Math.PI * 2 + 0.4, 1, (i / 4) * Math.PI * 2 + 0.4)
      scatter('boulder', 5, 0.7, 0.92)
      scatter('shrub', 5, 0.3, 0.9)
      chest(R * 0.18, 1.1)
      guard(3, true)
      break
    case 'garden':
      scatter('flowerbed', 12, 0.15, 0.88, 0.8, 1.4)
      scatter('skytree', 4, 0.55, 0.85, 1, 1.3)
      for (let i = 0; i < 6; i++) add('lamp', R * 0.5, (i / 6) * Math.PI * 2, 1, 0)
      add('fountain', 0, 0, 1.2, 0)
      add('waterfall', R * 0.97, 2.4, 0.8, 2.4)
      chest(R * 0.3, 0.6)
      guard(2)
      break
    case 'forge':
      add('brazier', 0, 0, 1.6, 0)
      for (let i = 0; i < 5; i++) add('pillar', R * 0.7, (i / 5) * Math.PI * 2, 1.2, 0)
      for (let i = 0; i < 3; i++) add('runeSlab', R * 0.35, (i / 3) * Math.PI * 2 + 0.9, 1.2, (i / 3) * Math.PI * 2 + 0.9)
      scatter('crystal', 5, 0.55, 0.9, 0.8, 1.4)
      scatter('boulder', 4, 0.6, 0.92)
      chest(R * 0.22, 2.6)
      guards.push({ id: `${isle.id}:boss`, type: SKY_GUARDIANS[isle.seed % SKY_GUARDIANS.length], ...at(R * 0.25, 4.2), boss: true })
      guard(2, true)
      break
    case 'observatory':
      add('telescope', R * 0.12, 0.5, 1.5, rand() * Math.PI * 2)
      for (let i = 0; i < 10; i++) add('lamp', R * 0.78, (i / 10) * Math.PI * 2, 0.9, 0)
      add('arch', R * 0.55, 3.6, 1.1, 3.6)
      scatter('shrub', 6, 0.4, 0.9)
      scatter('crystal', 3, 0.6, 0.85)
      chest(R * 0.45, 1.7)
      guard(3)
      break
    case 'crystal':
      scatter('crystal', 6, 0.1, 0.8, 0.9, 1.6)
      scatter('boulder', 2, 0.5, 0.8)
      if (rand() < 0.6) chest(R * 0.15, rand() * 6)
      guard(1)
      break
    case 'shrine':
      add('arch', 0, 0, 1, rand() * Math.PI)
      for (let i = 0; i < 4; i++) add('lamp', R * 0.55, (i / 4) * Math.PI * 2 + 0.785, 0.9, 0)
      scatter('shrub', 3, 0.5, 0.85)
      chest(R * 0.3, rand() * 6)
      break
    case 'crown':
      add('relicPedestal', 0, 0, 1, 0)
      for (let i = 0; i < 5; i++) add('pillar', R * 0.72, (i / 5) * Math.PI * 2, 0.8, 0)
      scatter('shrub', 4, 0.4, 0.85, 0.6, 0.9)
      break
    default: // a plain islet: a tree or two, rocks, maybe a cache
      scatter('skytree', 1 + Math.floor(rand() * 2), 0.1, 0.6, 0.9, 1.3)
      scatter('shrub', 3, 0.2, 0.85)
      scatter('boulder', 2, 0.4, 0.85)
      if (rand() < 0.35) chest(R * 0.3, rand() * 6)
      if (rand() < 0.5) guard(1)
  }
  return { props, treasure, guards }
}

// ---- the launch -----------------------------------------------------------------------------------------

export function createLaunchState() {
  return { charging: null, since: 0, lockout: null } // charging: a tower id; lockout: a pad you must step off first
}

// One step of the lift rules. `x, z, alt`: the player's feet; `ok`: free to launch (not hiding, not in a menu...).
// Returns { state, events } with events { type: 'charge', tower } { type: 'cancel', tower } { type: 'launch', tower, vy }.
export function stepLaunch(state, { x, z, alt, now, ok = true }) {
  const events = []
  let { charging, since, lockout } = state
  if (lockout) {
    const t = towerById(lockout)
    if (!t || Math.hypot(t.x - x, t.z - z) > PAD_RADIUS + 2.5 || alt > t.y + 6) lockout = null
  }
  if (charging) {
    const t = towerById(charging)
    const onPad = t && ok && Math.hypot(t.x - x, t.z - z) < PAD_RADIUS + 0.6 && Math.abs(alt - t.y) < 2.2
    if (!onPad) {
      events.push({ type: 'cancel', tower: t })
      return { state: { charging: null, since: 0, lockout }, events }
    }
    if (now - since >= CHARGE_SECONDS) {
      events.push({ type: 'launch', tower: t, vy: launchVelocity() })
      return { state: { charging: null, since: 0, lockout: t.id }, events }
    }
    return { state: { charging, since, lockout }, events }
  }
  if (!ok) return { state: { charging, since, lockout }, events }
  for (const t of skyTowers()) {
    if (t.id === lockout) continue
    if (Math.hypot(t.x - x, t.z - z) < PAD_RADIUS && Math.abs(alt - t.y) < 2.2) {
      events.push({ type: 'charge', tower: t })
      return { state: { charging: t.id, since: now, lockout }, events }
    }
  }
  return { state: { charging, since, lockout }, events }
}

// 0..1 of the way through a charge.
export const chargeFraction = (state, now) => (state.charging ? Math.min(1, (now - state.since) / CHARGE_SECONDS) : 0)
