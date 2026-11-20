// The Depths: chasms in the Wilds drop you into a dark world far below. Pure and seeded (tested in test/depths.test.js).
//   - chasms: wide pits dotted over the Heartland and the Frontier; walk into one and you fall.
//   - the Depths: a second world on the same coordinates (logic/world.js's setDepthsMode makes heightAt, biomeAt and
//     friends answer for it). Dark cavern floor, glowing fungus and crystal, dwellers that never saw the sun.
//   - Lightroots: a pillar of light beside each chasm's footprint. Stand in it and hold still and it lifts you home,
//     to the rim of that chasm.
//   - Umbral lairs: five sunken lairs, each guarded by a boss and holding an Umbral Heart. Claim all five and the
//     secret hero of the Depths is yours.
import { BIOMES, CHUNK_SIZE, PROP_RADIUS, SANCTUM_RADIUS, WORLD_RADIUS, WORLD_SEED, chunkKey, heightAt, lakeAt, mulberry32, nearestSite, nearestVillage, roadDistance, withSurface, inDepths } from './world.js'
import { BOSSES } from './bosses.js'
import { skyTowers } from './skyIslands.js'
import { CHAMBER_RADIUS, caveBeacons, caveLayout, caveDanger, caves } from './caves.js'

export const CHASM_FALL_FRACTION = 0.8 // inside this fraction of a chasm's radius you fall in
export const ASCEND_RADIUS = 2.8 // stand this close to a Lightroot's heart
export const ASCEND_SECONDS = 1.6 // ...and hold still this long
export const RELIC_CLAIM_RADIUS = 2.8
export const DEPTH_RELIC_REWARD = 90 // crystals for an Umbral Heart (the first time ever)
export const DEPTH_FIRST_REWARD = 60 // crystals for the first ever fall into the Depths
export const LAIR_RADIUS = 16

const CHASM_NAMES = ['Gloomgap', 'Maw of Echoes', 'The Swallow', 'Hollow Throat', 'Duskpit', 'Nightwell', 'Yawning Deep', 'Starless Hole', 'Umbral Rift', 'Cinder Gullet', 'Lanternless Pit', 'The Long Drop', 'Moonless Mouth', 'Whisper Drop']
const LAIR_NAMES = ['Hollow of Whispers', 'Throne of Ash', 'Sunless Vault', 'The Weeping Cistern', 'Bone Cathedral']
const LAIR_BOSSES = ['boss_gloop', 'boss_zipzilla', 'boss_grumpsalot', 'boss_wobble', 'boss_conefather']

// ---- chasms (on the surface) --------------------------------------------------------------------------

let chasmCache = null

function chasmSpotOk(x, z, radius, flat) {
  const r = Math.hypot(x, z)
  if (r < SANCTUM_RADIUS + 25 || r > WORLD_RADIUS - 70) return false
  if (lakeAt(x, z, 2.5)) return false
  if (nearestVillage(x, z, 75)) return false
  if (nearestSite(x, z, radius + 20)) return false
  if (roadDistance(x, z) < radius + 8) return false
  for (const t of skyTowers()) if (Math.hypot(t.x - x, t.z - z) < 45) return false
  for (const c of caves()) if (Math.hypot(c.rock.x - x, c.rock.z - z) < radius + 22) return false
  const h = heightAt(x, z)
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    if (Math.abs(heightAt(x + Math.cos(a) * radius * 1.15, z + Math.sin(a) * radius * 1.15) - h) > flat) return false
  }
  return true
}

// Every chasm: { id, index, name, x, z, radius, y (the ground at its middle) }. Always the surface's layout.
export function chasms() {
  chasmCache ??= withSurface(() => {
    const rand = mulberry32(WORLD_SEED + 6100)
    const list = []
    for (let i = 0; i < CHASM_NAMES.length; i++) {
      const radius = 9 + rand() * 6
      let spot = null
      for (let tries = 0; tries < 600 && !spot; tries++) {
        // The first one lies close to the Sanctum, so a first fall is never far away.
        const r = i === 0 ? 75 + rand() * 45 : 110 + rand() * (WORLD_RADIUS - 200)
        const a = rand() * Math.PI * 2
        const x = Math.cos(a) * r
        const z = Math.sin(a) * r
        if (list.some((c) => Math.hypot(c.x - x, c.z - z) < 85)) continue
        if (chasmSpotOk(x, z, radius, tries < 300 ? 1.6 : 3.4)) spot = { x, z }
      }
      if (!spot) continue
      list.push({ id: `c${i}`, index: i, name: CHASM_NAMES[i], x: spot.x, z: spot.z, radius, y: heightAt(spot.x, spot.z) })
    }
    return list
  })
  return chasmCache
}

export const chasmById = (id) => chasms().find((c) => c.id === id) ?? null

// The chasm whose pit (its radius plus `margin`) covers a point, else null. Only on the surface.
export function chasmAt(x, z, margin = 0) {
  if (inDepths()) return null
  for (const c of chasms()) {
    const d = Math.hypot(c.x - x, c.z - z)
    if (d <= c.radius + margin) return c
  }
  return null
}

// Is this point far enough in to fall?
export function chasmFalls(x, z) {
  const c = chasmAt(x, z)
  return c && Math.hypot(c.x - x, c.z - z) < c.radius * CHASM_FALL_FRACTION ? c : null
}

// Where a Lightroot sets you down: on the chasm's rim, on the side facing the middle of the world.
export function chasmRim(c) {
  const d = Math.hypot(c.x, c.z) || 1
  return { x: c.x - (c.x / d) * (c.radius + 5), z: c.z - (c.z / d) * (c.radius + 5) }
}

// ---- Lightroots (in the Depths) -----------------------------------------------------------------------

let beaconCache = null
// One per chasm, a short walk from where the chasm's drop lands: { id, name, x, z, chasmId }.
export function beacons() {
  beaconCache ??= (() => {
    const rand = mulberry32(WORLD_SEED + 6200)
    const roots = chasms().map((c, i) => {
      const a = rand() * Math.PI * 2
      const d = 38 + rand() * 22
      let x = c.x + Math.cos(a) * d
      let z = c.z + Math.sin(a) * d
      const r = Math.hypot(x, z)
      if (r > WORLD_RADIUS - 25) {
        x *= (WORLD_RADIUS - 25) / r
        z *= (WORLD_RADIUS - 25) / r
      }
      return { id: `b${i}`, name: `Lightroot ${i + 1}`, x, z, chasmId: c.id }
    })
    return [...roots, ...caveBeacons()] // (a cave's Lightroot carries `caveId` instead of `chasmId`)
  })()
  return beaconCache
}
export const beaconById = (id) => beacons().find((b) => b.id === id) ?? null

export function createAscendState() {
  return { charging: null, since: 0, lockout: null }
}

// One step of the Lightroot rules (the same shape as the Skylift towers'): events { type: 'charge' | 'cancel' | 'ascend', beacon }.
export function stepAscend(state, { x, z, now, ok = true }) {
  const events = []
  let { charging, since, lockout } = state
  if (lockout) {
    const b = beaconById(lockout)
    if (!b || Math.hypot(b.x - x, b.z - z) > ASCEND_RADIUS + 2.5) lockout = null
  }
  if (charging) {
    const b = beaconById(charging)
    if (!b || !ok || Math.hypot(b.x - x, b.z - z) > ASCEND_RADIUS + 0.6) {
      events.push({ type: 'cancel', beacon: b })
      return { state: { charging: null, since: 0, lockout }, events }
    }
    if (now - since >= ASCEND_SECONDS) {
      events.push({ type: 'ascend', beacon: b })
      return { state: { charging: null, since: 0, lockout: b.id }, events }
    }
    return { state: { charging, since, lockout }, events }
  }
  if (!ok) return { state: { charging, since, lockout }, events }
  for (const b of beacons()) {
    if (b.id === lockout) continue
    if (Math.hypot(b.x - x, b.z - z) < ASCEND_RADIUS) {
      events.push({ type: 'charge', beacon: b })
      return { state: { charging: b.id, since: now, lockout }, events }
    }
  }
  return { state: { charging, since, lockout }, events }
}
export const ascendFraction = (state, now) => (state.charging ? Math.min(1, (now - state.since) / ASCEND_SECONDS) : 0)

// ---- the Umbral lairs ---------------------------------------------------------------------------------

let lairCache = null
// Five lairs far apart: { id, index, name, x, z, radius, boss, relic: { id, name, x, z } }.
export function depthsLairs() {
  lairCache ??= (() => {
    const rand = mulberry32(WORLD_SEED + 6300)
    const list = []
    const base = rand() * Math.PI * 2
    for (let i = 0; i < LAIR_NAMES.length; i++) {
      for (let tries = 0; tries < 200; tries++) {
        const a = base + (i / LAIR_NAMES.length) * Math.PI * 2 + (rand() - 0.5) * 0.5
        const r = 190 + rand() * (WORLD_RADIUS - 290)
        const x = Math.cos(a) * r
        const z = Math.sin(a) * r
        if (beacons().some((b) => Math.hypot(b.x - x, b.z - z) < LAIR_RADIUS + 30)) continue
        if (caves().some((c) => Math.hypot(c.chamber.x - x, c.chamber.z - z) < LAIR_RADIUS + CHAMBER_RADIUS + 8)) continue
        const boss = BOSSES.find((b) => b.id === LAIR_BOSSES[i]) ?? BOSSES[i % BOSSES.length]
        list.push({ id: `d${i}`, index: i, name: LAIR_NAMES[i], x, z, radius: LAIR_RADIUS, boss: boss.id, relic: { id: `dr${i}`, name: 'Umbral Heart', x, z } })
        break
      }
    }
    return list
  })()
  return lairCache
}

// A lair's props, loot and guards, in world coordinates (the same shapes chunkContent uses).
export function lairLayout(lair) {
  const rng = mulberry32(lair.index * 4421 + WORLD_SEED + 6400)
  const props = []
  const prop = (kind, x, z, scale, rot) => props.push({ kind, x, z, scale, rot, radius: PROP_RADIUS[kind] * scale })
  // A ring of black shard pillars and bone spikes, with a gap on one side.
  const gap = rng() * Math.PI * 2
  for (let i = 0; i < 10; i++) {
    const a = gap + 0.5 + (i / 10) * (Math.PI * 2 - 1)
    const d = lair.radius - 3 + (rng() - 0.5) * 2
    prop(i % 3 === 0 ? 'boneSpike' : 'shardPillar', lair.x + Math.cos(a) * d, lair.z + Math.sin(a) * d, 1.1 + rng() * 0.6, rng() * Math.PI * 2)
  }
  for (let i = 0; i < 4; i++) {
    const a = rng() * Math.PI * 2
    const d = 5 + rng() * 5
    prop('crystal', lair.x + Math.cos(a) * d, lair.z + Math.sin(a) * d, 0.8 + rng() * 0.5, rng() * Math.PI * 2)
  }
  const treasure = [{ id: `${lair.id}:chest`, kind: 'chest', x: lair.x - 5, z: lair.z + 4 }]
  const guards = [
    { id: `${lair.id}:boss`, role: 'boss', x: lair.x + 7, z: lair.z - 2 },
    { id: `${lair.id}:e0`, role: 'elite', x: lair.x - 7, z: lair.z - 6 },
    { id: `${lair.id}:e1`, role: 'elite', x: lair.x + 2, z: lair.z + 9 },
  ]
  return { props, treasure, guards }
}

// ---- chunks of the Depths -----------------------------------------------------------------------------

const pickWeighted = (rng, entries) => {
  const total = entries.reduce((s, e) => s + e[1], 0)
  let t = rng() * total
  for (const e of entries) {
    t -= e[1]
    if (t <= 0) return e
  }
  return entries[entries.length - 1]
}

// How dangerous the Depths are at a point: never trivial, worse toward the rim.
export const depthsDanger = (x, z) => Math.min(1, 0.35 + 0.65 * (Math.hypot(x, z) / WORLD_RADIUS))

// Same shape as world.js's chunkContent: { cx, cz, key, biome, props, monsters, treasure, grass, npcs }.
export function depthsChunk(cx, cz) {
  const rng = mulberry32(Math.imul(cx, 73856093) ^ Math.imul(cz, 19349663) ^ (WORLD_SEED + 7000))
  const center = { x: (cx + 0.5) * CHUNK_SIZE, z: (cz + 0.5) * CHUNK_SIZE }
  const out = { cx, cz, key: chunkKey(cx, cz), biome: 'depths', props: [], monsters: [], treasure: [], grass: [], npcs: [] }
  if (Math.hypot(center.x, center.z) > WORLD_RADIUS - 4) return out
  const biome = BIOMES.depths
  const place = () => ({ x: cx * CHUNK_SIZE + 2 + rng() * (CHUNK_SIZE - 4), z: cz * CHUNK_SIZE + 2 + rng() * (CHUNK_SIZE - 4) })
  const inWorld = (p) => Math.hypot(p.x, p.z) < WORLD_RADIUS - 6
  const lairs = depthsLairs()
  const nearLair = (p, extra) => lairs.some((l) => Math.hypot(l.x - p.x, l.z - p.z) < l.radius + extra)
  const nearBeacon = (p, d) => beacons().some((b) => Math.hypot(b.x - p.x, b.z - p.z) < d)
  const chambers = caves()
  const nearChamber = (p, extra) => chambers.some((c) => Math.hypot(c.chamber.x - p.x, c.chamber.z - p.z) < CHAMBER_RADIUS + extra)

  const propCount = 7 + Math.floor(rng() * 7)
  for (let i = 0; i < propCount; i++) {
    const p = place()
    if (!inWorld(p) || nearLair(p, 3) || nearBeacon(p, 4) || nearChamber(p, 1)) continue
    const kind = pickWeighted(rng, biome.props)[0]
    const scale = 0.8 + rng() * 0.9
    out.props.push({ kind, x: p.x, z: p.z, scale, rot: rng() * Math.PI * 2, radius: PROP_RADIUS[kind] * scale })
  }

  const danger = depthsDanger(center.x, center.z)
  const count = Math.floor(rng() * (1.5 + danger * 2.5)) + (rng() < 0.45 ? 1 : 0)
  for (let i = 0; i < count; i++) {
    const p = place()
    if (!inWorld(p) || nearLair(p, 6) || nearBeacon(p, 22) || nearChamber(p, 2)) continue // the Lightroots are a refuge
    const [type] = pickWeighted(rng, biome.monsters)
    const elite = rng() < 0.07 + danger * 0.12
    out.monsters.push({ id: `${out.key}:${i}`, type, x: p.x, z: p.z, elite, danger, hpScale: (1 + danger * 1.3) * (elite ? 2.4 : 1) })
  }
  if (rng() < 0.16) {
    const p = place()
    if (inWorld(p) && !nearLair(p, 3) && !nearBeacon(p, 6) && !nearChamber(p, 2)) out.treasure.push({ id: `${out.key}:chest`, kind: 'chest', x: p.x, z: p.z })
  }

  const inChunk = (p) => p.x >= cx * CHUNK_SIZE && p.x < (cx + 1) * CHUNK_SIZE && p.z >= cz * CHUNK_SIZE && p.z < (cz + 1) * CHUNK_SIZE
  for (const lair of lairs) {
    if (Math.hypot(lair.x - center.x, lair.z - center.z) > 60) continue
    const layout = lairLayout(lair)
    for (const p of layout.props) if (inChunk(p)) out.props.push(p)
    for (const t of layout.treasure) if (inChunk(t)) out.treasure.push(t)
    const lairDanger = Math.max(0.55, depthsDanger(lair.x, lair.z))
    const pool = biome.monsters
    for (const g of layout.guards) {
      if (!inChunk(g)) continue
      if (g.role === 'boss') {
        out.monsters.push({ id: g.id, type: lair.boss, x: g.x, z: g.z, elite: false, boss: true, danger: lairDanger, hpScale: 0.9 + lairDanger * 1.0, lairId: lair.id, name: lair.name })
        continue
      }
      const [type] = pickWeighted(rng, pool)
      out.monsters.push({ id: g.id, type, x: g.x, z: g.z, elite: true, danger: lairDanger, hpScale: (1 + lairDanger * 1.3) * 2.4 })
    }
  }
  // Cave chambers: a pocket with its own chest(s) and guards, entered through a doorway on the surface (logic/caves.js).
  for (const cave of chambers) {
    if (Math.hypot(cave.chamber.x - center.x, cave.chamber.z - center.z) > 60) continue
    const layout = caveLayout(cave)
    for (const p of layout.props) if (inChunk(p)) out.props.push(p)
    for (const t of layout.treasure) if (inChunk(t)) out.treasure.push(t)
    const danger2 = Math.max(0.45, caveDanger(cave))
    for (const g of layout.guards) {
      if (!inChunk(g)) continue
      const [type] = pickWeighted(rng, biome.monsters)
      out.monsters.push({ id: g.id, type, x: g.x, z: g.z, elite: true, danger: danger2, hpScale: (1 + danger2 * 1.3) * 2.2 })
    }
  }
  return out
}

// Where you land when you drop through a chasm: the same spot, kept inside the world and off the lairs' hearts.
export function arrivalSpot(x, z) {
  const r = Math.hypot(x, z)
  const max = WORLD_RADIUS - 14
  return r > max ? { x: (x / r) * max, z: (z / r) * max } : { x, z }
}
