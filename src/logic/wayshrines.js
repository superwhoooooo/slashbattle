// Wayshrines: small glowing waystones beside the roads of the Wilds. Touch one and it grants its boon for a
// while (faster feet, harder hits, a ward, double crystals, or mending); then it sleeps for SHRINE_RECHARGE
// seconds. Boons of different kinds stack; touching the same kind again just refreshes it. Pure and seeded.
import { BIOMES, WORLD_SEED, biomeAt, mulberry32, roadPaths } from './world.js'
import { openGround } from './wildsSpots.js'

export const SHRINE_RADIUS = 2.6 // stand this close to take the boon
export const SHRINE_RECHARGE = 240 // seconds before a shrine can be used again
const SHRINE_SPACING = 75
const SHRINE_COUNT = 26

export const BOONS = {
  swift: { name: 'Swiftwind', blurb: 'Your feet barely touch the ground', color: 0x7ae8ff, duration: 75, speed: 1.5 },
  might: { name: 'Giant\'s Might', blurb: 'Your blows land like boulders', color: 0xff7a5c, duration: 60, damage: 1.4 },
  ward: { name: 'Stoneward', blurb: 'Blows glance off a shell of light', color: 0xb9a6ff, duration: 60, damageTaken: 0.6 },
  fortune: { name: 'Gilded Luck', blurb: 'Every crystal counts twice', color: 0xffd15c, duration: 90, crystal: 2 },
  vigor: { name: 'Wellspring', blurb: 'Your wounds close as you walk', color: 0x7dffb0, duration: 45, regen: 3, heal: 0.3 },
}
export const BOON_IDS = Object.keys(BOONS)

let cache = null
// Every wayshrine: { id, x, z, boon, biome }, a few steps off a road.
export function wayshrines() {
  if (cache) return cache
  const rng = mulberry32(WORLD_SEED + 5151)
  const points = []
  for (const path of roadPaths()) {
    for (let i = 2; i < path.length - 2; i += 3) {
      const [x0, z0] = path[i - 1]
      const [x1, z1] = path[i + 1]
      const len = Math.hypot(x1 - x0, z1 - z0) || 1
      points.push({ x: path[i][0], z: path[i][1], nx: -(z1 - z0) / len, nz: (x1 - x0) / len })
    }
  }
  // Shuffle so the shrines spread over every road instead of filling the first few.
  for (let i = points.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[points[i], points[j]] = [points[j], points[i]]
  }
  const list = []
  for (const p of points) {
    if (list.length >= SHRINE_COUNT) break
    const side = rng() < 0.5 ? -1 : 1
    const x = p.x + p.nx * 7 * side
    const z = p.z + p.nz * 7 * side
    if (!openGround(x, z, { villageClear: 40, edge: 26 })) continue
    if (list.some((s) => Math.hypot(s.x - x, s.z - z) < SHRINE_SPACING)) continue
    list.push({ id: `shrine${list.length}`, x, z, boon: BOON_IDS[list.length % BOON_IDS.length], biome: biomeAt(x, z), glow: BIOMES[biomeAt(x, z)].glow })
  }
  cache = list
  return cache
}

export function createShrineState() {
  return { usedAt: {}, boons: {} } // shrine id -> when it was used; boon id -> when it runs out
}

export const shrineReady = (state, id, now) => !(now < (state.usedAt[id] ?? -Infinity) + SHRINE_RECHARGE)
// 0..1: how far a sleeping shrine has recharged (1 when ready).
export const shrineCharge = (state, id, now) => Math.min(1, Math.max(0, (now - (state.usedAt[id] ?? -Infinity)) / SHRINE_RECHARGE))

// Takes a shrine's boon. Returns { state, boon } (boon is the BOONS id), or { state, boon: null } if it sleeps.
export function useShrine(state, shrine, now) {
  if (!shrineReady(state, shrine.id, now)) return { state, boon: null }
  const def = BOONS[shrine.boon]
  return {
    state: { usedAt: { ...state.usedAt, [shrine.id]: now }, boons: { ...state.boons, [shrine.boon]: now + def.duration } },
    boon: shrine.boon,
  }
}

// The boons running right now, as [{ id, left }] (seconds left), longest first.
export function activeBoons(state, now) {
  return Object.entries(state.boons)
    .filter(([, until]) => until > now)
    .map(([id, until]) => ({ id, left: until - now }))
    .sort((a, b) => b.left - a.left)
}

// Every running boon folded into one set of multipliers (1 = no change; regen in hp per second).
export function boonEffects(state, now) {
  const fx = { speed: 1, damage: 1, damageTaken: 1, crystal: 1, regen: 0 }
  for (const { id } of activeBoons(state, now)) {
    const def = BOONS[id]
    if (def.speed) fx.speed *= def.speed
    if (def.damage) fx.damage *= def.damage
    if (def.damageTaken) fx.damageTaken *= def.damageTaken
    if (def.crystal) fx.crystal *= def.crystal
    if (def.regen) fx.regen += def.regen
  }
  return fx
}

// Grants a boon without a shrine (the travelling merchant's tonics): starts or refreshes it.
export function grantBoon(state, boon, now) {
  return { ...state, boons: { ...state.boons, [boon]: Math.max(state.boons[boon] ?? 0, now + BOONS[boon].duration) } }
}

// Folds running boons into an effect set from activeFx (speed / damage / damageTaken / crystal multiply, regen adds).
export function foldBoons(fx, boons) {
  return { ...fx, speed: fx.speed * boons.speed, damage: fx.damage * boons.damage, damageTaken: fx.damageTaken * boons.damageTaken, crystal: fx.crystal * boons.crystal, regen: (fx.regen ?? 0) + boons.regen }
}
