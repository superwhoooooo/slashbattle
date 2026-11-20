// Caves in the Wilds (pure, seeded; tested in test/caves.test.js). A cave mouth is a rock outcrop with a dark doorway,
// on the land and on the main isles of some sky archipelagos. Walk into the doorway and you go down into a small
// cave chamber: a pocket of the Depths (logic/depths.js) with its own chest(s), guards and a Lightroot that lifts you
// out through the SAME doorway (so an isle cave brings you back up onto its isle).
import { BIOMES, PROP_RADIUS, SANCTUM_RADIUS, WORLD_RADIUS, WORLD_SEED, heightAt, lakeAt, mulberry32, nearestSite, nearestVillage, roadDistance, withSurface } from './world.js'
import { isleLayout, skyArchipelagos, skyTowers } from './skyIslands.js'

export const CAVE_ENTER_RADIUS = 1.9 // stand this close to the doorway to go in
export const CAVE_ROCK_RADIUS = 3.4 // the solid part of the outcrop (the doorway sticks out past it)
export const CAVE_DOOR_DISTANCE = 4.9 // doorway distance from the outcrop's middle
export const CAVE_FIRST_REWARD = 45 // crystals for the first ever visit to a cave
export const CHAMBER_RADIUS = 14

const LAND_NAMES = ['Mossmouth Cave', 'Echo Hollow', 'The Gullet', 'Pebble Burrow', 'Hush Grotto', 'Ember Cellar', 'Dripstone Den', 'Lantern Cave']
const ISLE_NAMES = ['Cloudhollow', 'Windwhistle Grotto', 'Skylark Den', 'Mistcap Cave', 'The Hanging Cellar']

let caveCache = null

function landSpotOk(x, z) {
  const r = Math.hypot(x, z)
  if (r < SANCTUM_RADIUS + 30 || r > WORLD_RADIUS - 90) return false
  if (lakeAt(x, z, 8)) return false
  if (nearestVillage(x, z, 45)) return false
  if (nearestSite(x, z, 16)) return false
  if (roadDistance(x, z) < 8) return false
  for (const t of skyTowers()) if (Math.hypot(t.x - x, t.z - z) < 40) return false
  const h = heightAt(x, z)
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    if (Math.abs(heightAt(x + Math.cos(a) * 6, z + Math.sin(a) * 6) - h) > 2.4) return false
  }
  return true
}

// Every cave: { id, index, name, kind: 'land' | 'isle', isleId?, rock: { x, z, radius }, x, z (the doorway), y (the
// ground / isle top at the doorway), face (the direction the doorway looks), chamber: { x, z } (where it leads, in the Depths) }.
export function caves() {
  caveCache ??= withSurface(() => {
    const rand = mulberry32(WORLD_SEED + 8100)
    const list = []
    const make = (kind, rock, y, face, extra = {}) => {
      const index = list.length
      const x = rock.x + Math.cos(face) * CAVE_DOOR_DISTANCE
      const z = rock.z + Math.sin(face) * CAVE_DOOR_DISTANCE
      list.push({
        id: `cave${index}`, index, kind, name: kind === 'land' ? LAND_NAMES[index % LAND_NAMES.length] : ISLE_NAMES[(index - LAND_NAMES.length) % ISLE_NAMES.length],
        rock: { ...rock, radius: CAVE_ROCK_RADIUS }, x, z, y, face, chamber: { x: rock.x, z: rock.z }, ...extra,
      })
    }
    // Land caves: out in the Heartland and the Frontier, doorway looking toward the middle of the world.
    for (let i = 0; i < LAND_NAMES.length; i++) {
      for (let tries = 0; tries < 500; tries++) {
        const r = 85 + rand() * (WORLD_RADIUS - 200)
        const a = rand() * Math.PI * 2
        const x = Math.cos(a) * r
        const z = Math.sin(a) * r
        if (list.some((c) => Math.hypot(c.rock.x - x, c.rock.z - z) < 75)) continue
        if (!landSpotOk(x, z)) continue
        make('land', { x, z }, heightAt(x, z), a + Math.PI + (rand() - 0.5) * 0.8) // the doorway looks toward the middle of the world
        break
      }
    }
    // Isle caves: on the main isle of every other archipelago, set in the rim so the doorway looks across the isle.
    skyArchipelagos().forEach((arch, k) => {
      if (k % 2 !== 0) return
      const isle = arch.isles.find((i) => i.main)
      if (!isle || isle.radius < 11) return
      const props = isleLayout(isle).props
      let best = null
      for (let s = 0; s < 16; s++) {
        const a = (s / 16) * Math.PI * 2 + rand() * 0.2
        const d = isle.radius - 6.2
        const x = isle.x + Math.cos(a) * d
        const z = isle.z + Math.sin(a) * d
        const door = { x: x - Math.cos(a) * CAVE_DOOR_DISTANCE, z: z - Math.sin(a) * CAVE_DOOR_DISTANCE }
        const clear = Math.min(...props.map((p) => Math.min(Math.hypot(p.x - x, p.z - z), Math.hypot(p.x - door.x, p.z - door.z))), 99)
        if (!best || clear > best.clear) best = { a, x, z, clear }
      }
      make('isle', { x: best.x, z: best.z }, isle.y, best.a + Math.PI, { isleId: isle.id, archId: arch.id })
    })
    return list
  })
  return caveCache
}

export const caveById = (id) => caves().find((c) => c.id === id) ?? null

// The solid part of every cave's outcrop (circles for game.obstacles; `top` lets a jump or glide sail over it).
export function caveObstacles(cave) {
  return [{ x: cave.rock.x, z: cave.rock.z, radius: CAVE_ROCK_RADIUS, top: cave.y + 9 }]
}

// The cave whose doorway covers a point (on the surface or isle, near the cave's level), else null.
export function caveAt(x, z, alt = null) {
  for (const c of caves()) {
    if (Math.hypot(c.x - x, c.z - z) > CAVE_ENTER_RADIUS) continue
    if (alt !== null && Math.abs(alt - c.y) > 3) continue
    return c
  }
  return null
}

// Where a Lightroot in a cave chamber sets you down: just outside the doorway, looking out.
export function caveExit(cave) {
  return { x: cave.x + Math.cos(cave.face) * 2.6, z: cave.z + Math.sin(cave.face) * 2.6 }
}
// Where you arrive in the chamber (the Lightroot is on the far side).
export const caveArrival = (cave) => ({ x: cave.chamber.x - 4.5, z: cave.chamber.z })
// One Lightroot per cave, in the chamber: { id, name, x, z, caveId }.
export const caveBeacons = () => caves().map((c) => ({ id: `bc${c.index}`, name: `${c.name} Lightroot`, x: c.chamber.x + 4.5, z: c.chamber.z, caveId: c.id }))

// A chamber's props, loot and guards in world coordinates (the same shapes lairLayout / chunkContent use).
export function caveLayout(cave) {
  const rng = mulberry32(cave.index * 3371 + WORLD_SEED + 8300)
  const props = []
  const prop = (kind, x, z, scale) => props.push({ kind, x, z, scale, rot: rng() * Math.PI * 2, radius: PROP_RADIUS[kind] * scale })
  const gap = rng() * Math.PI * 2
  for (let i = 0; i < 11; i++) {
    const a = gap + 0.6 + (i / 11) * (Math.PI * 2 - 1.2)
    const d = CHAMBER_RADIUS - 2 + (rng() - 0.5) * 2
    prop(i % 3 === 0 ? 'boneSpike' : 'shardPillar', cave.chamber.x + Math.cos(a) * d, cave.chamber.z + Math.sin(a) * d, 1 + rng() * 0.5)
  }
  for (let i = 0; i < 6; i++) {
    const a = rng() * Math.PI * 2
    const d = 6 + rng() * 5
    prop('crystal', cave.chamber.x + Math.cos(a) * d, cave.chamber.z + Math.sin(a) * d, 0.7 + rng() * 0.5)
  }
  const rich = cave.kind === 'isle'
  const treasure = [{ id: `${cave.id}:chest`, kind: 'chest', x: cave.chamber.x + 1, z: cave.chamber.z + 7 }]
  if (rich) treasure.push({ id: `${cave.id}:chest2`, kind: 'chest', x: cave.chamber.x + 2, z: cave.chamber.z - 8 })
  const guards = [
    { id: `${cave.id}:e0`, x: cave.chamber.x - 3, z: cave.chamber.z - 9 },
    { id: `${cave.id}:e1`, x: cave.chamber.x + 8, z: cave.chamber.z + 2 },
  ]
  if (rich) guards.push({ id: `${cave.id}:e2`, x: cave.chamber.x - 8, z: cave.chamber.z + 5 })
  return { props, treasure, guards }
}

export const caveDanger = (cave) => Math.min(1, 0.4 + 0.6 * (Math.hypot(cave.x, cave.z) / WORLD_RADIUS))
export const CAVE_MONSTERS = BIOMES.depths.monsters
