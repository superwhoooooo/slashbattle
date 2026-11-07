// Pure, Three-free pet roaming: where a pet wants to be this tick. With no enemy in
// sight a pet drifts back to its spot beside the player; with one in sight it runs out
// to fight it the way its description says (lunge in and hit it, charge up and explode,
// stand off and shoot). Kept free of Three.js so Vitest can exercise it; src/pets.js
// does the moving, the hitting and the drawing.

export const SIGHT = 16 // a pet notices enemies this far from itself...
export const LEASH = 15 // ...but only chases ones this close to the player, so it never wanders off
export const HOME_RADIUS = 1.9 // where a pet idles: this far from the player
export const ROAM_SPEED = 9 // world units/second when walking to a fight or to a stand-off spot
export const DASH_SPEED = 13 // a lunger's charge
export const RETURN_SPEED = 11 // heading back to the player
export const CONTACT = 1.15 // how close a lunger gets before its hit lands (plus the enemy's reachBonus)
export const GLUE_INTERVAL = 0.9 // lungers hitting faster than this stay stuck to the enemy (a flurry)
export const SNAP_DISTANCE = 32 // farther than this from the player, the pet pops back beside you

// How each lunge hit looks. `tilt` is the axis the model pitches/rolls on as it strikes.
export const STRIKES = {
  peck: { sparks: 5, speed: 2.4, tilt: ['x', 0.9] },
  burn: { sparks: 7, speed: 2.6, tilt: ['x', 0.5] },
  bite: { sparks: 7, speed: 2.4, tilt: ['x', 0.8] },
  swat: { sparks: 5, speed: 2.2, tilt: ['z', 0.7] },
  swipe: { sparks: 6, speed: 2.4, tilt: ['z', 0.8] },
  stab: { sparks: 4, speed: 3, tilt: ['x', 0.6] },
  sting: { sparks: 4, speed: 2, tilt: ['x', 0.9] },
  boing: { sparks: 8, speed: 2.8, tilt: ['x', 0.4] },
  headbutt: { sparks: 10, speed: 3.2, tilt: ['x', 0.7] },
  pounce: { sparks: 12, speed: 3.4, tilt: ['x', 0.9] },
  ram: { sparks: 12, speed: 3.6, tilt: ['x', 0.3] },
}

export const LUNGE_KINDS = ['lunge', 'explode']
export const RANGED_KINDS = ['zap', 'throw', 'shot']
export const isLunger = (def) => LUNGE_KINDS.includes(def.kind)
export const isRanged = (def) => RANGED_KINDS.includes(def.kind)
export const isFighter = (def) => isLunger(def) || isRanged(def) || def.kind === 'pulse'

export const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z)

// How far from itself a pet notices enemies, and how far from the player it will follow
// them. Healers, magnets and guards never roam.
export const sightOf = (def) => def.sight ?? SIGHT
export const leashOf = (def) => def.leash ?? LEASH
export const canEngage = (def, petPos, playerPos, monsterPos) =>
  isFighter(def) && dist(petPos, monsterPos) <= sightOf(def) && dist(playerPos, monsterPos) <= leashOf(def)

export const SOAR_RADIUS = 3.1 // birds circle wider than ground pets...
export const SOAR_TURN_RATE = 1.0 // ...and faster (radians/second)

// The idle spot for pet `index` of `count` orbiting the player (a soaring bird circles on a
// wide loop overhead, everyone else idles close by).
export function homeSpot(playerPos, index, count, elapsed, { radius = HOME_RADIUS, turnRate = 0.7 } = {}) {
  const angle = elapsed * turnRate + (index / Math.max(1, count)) * Math.PI * 2
  return { x: playerPos.x + Math.cos(angle) * radius, z: playerPos.z + Math.sin(angle) * radius }
}

// Pulls a point back inside `radius` of `center`.
export function leashPoint(point, center, radius) {
  const d = dist(point, center)
  if (d <= radius || d === 0) return { x: point.x, z: point.z }
  const k = radius / d
  return { x: center.x + (point.x - center.x) * k, z: center.z + (point.z - center.z) * k }
}

// A point `radius` from `target` on the side facing `from` (or along `fallbackAngle` if
// they coincide).
function ringPoint(target, from, radius, fallbackAngle = 0) {
  const dx = from.x - target.x
  const dz = from.z - target.z
  const d = Math.hypot(dx, dz)
  if (d < 1e-4) return { x: target.x + Math.cos(fallbackAngle) * radius, z: target.z + Math.sin(fallbackAngle) * radius }
  return { x: target.x + (dx / d) * radius, z: target.z + (dz / d) * radius }
}

// Where a fighting pet should head while `target` is in sight: {x, z, speed}, or null to
// stay put (it is already where it wants to be). `ready` is whether its attack is off cooldown.
export function engageGoal(def, { pet, target, player, ready, angle = 0 }) {
  let goal = null
  let speed = ROAM_SPEED
  if (def.kind === 'lunge') {
    speed = def.dash ?? DASH_SPEED
    if (ready) goal = { x: target.x, z: target.z }
    else if ((def.interval ?? 1) < GLUE_INTERVAL) goal = ringPoint(target, pet, 0.9, angle) // flurry: stay on it
    else goal = ringPoint(target, pet, 2.8, angle) // hit and back off
  } else if (def.kind === 'explode') {
    speed = def.dash ?? DASH_SPEED
    goal = ready ? { x: target.x, z: target.z } : null // reforming beside the player until it is ready
  } else if (def.kind === 'pulse') {
    const reach = (def.radius ?? 3) * 0.55
    goal = dist(pet, target) > reach ? { x: target.x, z: target.z } : null
  } else if (isRanged(def)) {
    const range = def.range ?? 8
    const stand = def.standoff ?? Math.min(range * 0.7, 7)
    goal = dist(pet, target) > range * 0.9 ? ringPoint(target, pet, stand, angle) : null
  }
  if (!goal) return null
  const leashed = leashPoint(goal, player, leashOf(def))
  return { x: leashed.x, z: leashed.z, speed }
}

// One speed-limited step from `pos` toward `goal`; slows into the goal so it never overshoots.
export function stepToward(pos, goal, speed, dt) {
  const dx = goal.x - pos.x
  const dz = goal.z - pos.z
  const d = Math.hypot(dx, dz)
  if (d < 1e-6) return { x: pos.x, z: pos.z, moved: 0 }
  const length = Math.min(d, Math.min(speed, d * 6) * dt)
  return { x: pos.x + (dx / d) * length, z: pos.z + (dz / d) * length, moved: length }
}

// Speed for heading back to the player: brisk, and faster the farther behind it is.
export const returnSpeed = (distance) => Math.max(RETURN_SPEED, distance * 1.8)

// A lunger lands its hit once it is this close.
export const strikeReach = (monsterUserData) => CONTACT + (monsterUserData?.reachBonus ?? 0)
