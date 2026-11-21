// The storms' temples (Tears of the Kingdom-style): where each regional phenomenon's final fight happens. Two hang in the
// SKY over their storm (the Whiteout's and the Miasma's: reach them from the STORM PAD at the eye, which launches you up
// like a Skylift, then glide across) and two are sunk in the DEPTHS under theirs (the Sandstorm's and the Ashstorm's: a
// chasm opens at the eye and drops you straight into the temple). Pure, seeded off the storm eyes; no Three.
// The look is src/phenomenaFx.js; the sky temples join logic/skyIslands.js's isles (so you can stand on them) and the
// temple chasms join logic/depths.js's chasms (so you fall through them). Tests: test/stormTemples.test.js.
import { PHENOMENA, PHENOMENON_ORDER, phenomenonEye } from './phenomena.js'
import { WORLD_RADIUS } from './world.js'

export const TEMPLE_PLACE = { sandstorm: 'depths', whiteout: 'sky', ashstorm: 'depths', miasma: 'sky' }
export const TEMPLE_NAMES = {
  sandstorm: 'The Sunken Sun Temple',
  whiteout: 'The Wind Temple',
  ashstorm: 'The Buried Forge Temple',
  miasma: 'The Floating Lantern Temple',
}
export const SKY_TEMPLE_HEIGHT = 150 // the temple isle's top, above the storm's eye
export const SKY_TEMPLE_RADIUS = 24
export const SKY_TEMPLE_OFFSET = 48 // ...hanging this far off the pad, toward the middle of the world (a short glide)
export const STORM_PAD_RADIUS = 2.6
export const STORM_PAD_CHARGE = 1.5 // seconds to stand on the pad before it throws you up
export const TEMPLE_CHASM_RADIUS = 11
export const DEEP_TEMPLE_RADIUS = 30 // the sunken temple's floor in the Depths (other things there keep off it)

export const templePlace = (stormId) => TEMPLE_PLACE[stormId] ?? 'sky'

let skyCache = null
// The sky temples as isles: { id, stormId, name, kind: 'stormTemple', x, z, y (top), radius, depth, main, crown, seed }.
export function skyTemples() {
  skyCache ??= PHENOMENON_ORDER.filter((id) => templePlace(id) === 'sky').map((id, i) => {
    const eye = phenomenonEye(id)
    const r = Math.hypot(eye.x, eye.z) || 1
    let x = eye.x - (eye.x / r) * SKY_TEMPLE_OFFSET
    let z = eye.z - (eye.z / r) * SKY_TEMPLE_OFFSET
    const out = Math.hypot(x, z)
    if (out + SKY_TEMPLE_RADIUS > WORLD_RADIUS - 24) {
      x *= (WORLD_RADIUS - 24 - SKY_TEMPLE_RADIUS) / out
      z *= (WORLD_RADIUS - 24 - SKY_TEMPLE_RADIUS) / out
    }
    return { id: `skytemple-${id}`, stormId: id, name: TEMPLE_NAMES[id], kind: 'stormTemple', x, z, y: eye.y + SKY_TEMPLE_HEIGHT, radius: SKY_TEMPLE_RADIUS, depth: 30, main: false, crown: false, seed: 900 + i }
  })
  return skyCache
}
export const skyTempleFor = (stormId) => skyTemples().find((t) => t.stormId === stormId) ?? null

// The pads that throw you up to a sky temple: { stormId, x, z } (at the storm's eye).
export function stormPads() {
  return skyTemples().map((t) => {
    const eye = phenomenonEye(t.stormId)
    return { stormId: t.stormId, x: eye.x, z: eye.z }
  })
}
export const padAt = (x, z) => stormPads().find((p) => Math.hypot(p.x - x, p.z - z) < STORM_PAD_RADIUS) ?? null

// The chasms at the eyes of the Depths storms, in logic/depths.js's chasm shape (+ `stormTemple`).
export function templeChasms() {
  return PHENOMENON_ORDER.filter((id) => templePlace(id) === 'depths').map((id, i) => {
    const eye = phenomenonEye(id)
    return { id: `tc-${id}`, index: 100 + i, name: `${TEMPLE_NAMES[id]} Pit`, x: eye.x, z: eye.z, radius: TEMPLE_CHASM_RADIUS, y: eye.y, stormTemple: id }
  })
}
// The sunken temples in the Depths (at the same spot as the eye above): { stormId, name, x, z, radius }.
export function deepTemples() {
  return PHENOMENON_ORDER.filter((id) => templePlace(id) === 'depths').map((id) => {
    const eye = phenomenonEye(id)
    return { stormId: id, name: TEMPLE_NAMES[id], x: eye.x, z: eye.z, radius: DEEP_TEMPLE_RADIUS }
  })
}
export const nearDeepTemple = (x, z, margin = 0) => deepTemples().some((t) => Math.hypot(t.x - x, t.z - z) < t.radius + margin)

// Where a storm's boss fight happens: { x, z, y?, place: 'sky' | 'depths', isleId? }.
export function templeArena(stormId) {
  if (templePlace(stormId) === 'sky') {
    const t = skyTempleFor(stormId)
    return { x: t.x, z: t.z, y: t.y, place: 'sky', isleId: t.id }
  }
  const eye = phenomenonEye(stormId)
  return { x: eye.x, z: eye.z, place: 'depths' }
}

// How to get there, in words (the guide and the champion use it).
export function templeDirections(stormId) {
  const name = TEMPLE_NAMES[stormId]
  return templePlace(stormId) === 'sky'
    ? `${name} floats in the sky over the storm's eye: stand on the storm pad there to be thrown up, then open your glider (Space) and land on it`
    : `${name} lies in the Depths under the storm's eye: drop into the pit there`
}
export const templeLabel = (stormId) => `${PHENOMENA[stormId]?.short ?? ''}: ${TEMPLE_NAMES[stormId]}`
