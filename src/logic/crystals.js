// Pure, Three-free crystal rules: what a kill drops, and how a dropped
// crystal moves (scatter, settle, get pulled toward the player, get
// collected). A crystal is a plain mutable { x, y, z, vx, vy, vz, value,
// age, homing } object -- there can be a hundred of them updating every
// frame, so stepCrystal mutates in place rather than allocating.

export const CRYSTAL_GROUND_Y = 0.35
export const CRYSTAL_GRAVITY = 22
export const CRYSTAL_PICKUP_RADIUS = 0.9
export const CRYSTAL_BASE_MAGNET_RADIUS = 3.2
export const CRYSTAL_HOMING_SPEED = 15
export const CRYSTAL_SETTLE_TIME = 0.45 // seconds before a dropped crystal can be picked up/pulled

// The values of the crystals a dead monster drops: small fry drop a couple
// of 1s, a grumpus a few 2s, a boss a shower of 5s.
export function crystalDrops(type, isBoss = false) {
  if (isBoss) return Array(8).fill(5)
  if (type === 'grumpus') return [2, 2, 2]
  if (type === 'zippy') return [2]
  return [1, 1]
}

// A fresh crystal at (x, z) that pops up and outward in a random direction.
export function createCrystal(x, z, value, rng = Math.random) {
  const angle = rng() * Math.PI * 2
  const speed = 1.5 + rng() * 2.5
  return {
    x,
    y: 0.6,
    z,
    vx: Math.sin(angle) * speed,
    vy: 5 + rng() * 3,
    vz: Math.cos(angle) * speed,
    value,
    age: 0,
    homing: false,
  }
}

// Advances one crystal by dt (mutating it). Returns true if the player
// picked it up this tick. Within `magnetRadius` of the player it starts
// homing (and stays homing), accelerating toward them.
export function stepCrystal(crystal, dt, playerX, playerZ, magnetRadius) {
  crystal.age += dt
  const dx = playerX - crystal.x
  const dz = playerZ - crystal.z
  const distance = Math.hypot(dx, dz)
  const pickable = crystal.age >= CRYSTAL_SETTLE_TIME

  if (pickable && !crystal.homing && distance <= magnetRadius) crystal.homing = true

  if (crystal.homing && pickable) {
    const speed = CRYSTAL_HOMING_SPEED * Math.min(1, 0.4 + crystal.age * 0.5)
    if (distance > 1e-6) {
      crystal.x += (dx / distance) * Math.min(speed * dt, distance)
      crystal.z += (dz / distance) * Math.min(speed * dt, distance)
    }
    crystal.y += (CRYSTAL_GROUND_Y + 0.5 - crystal.y) * Math.min(1, dt * 8)
    return distance <= CRYSTAL_PICKUP_RADIUS
  }

  // Scatter: fly out, fall under gravity, bounce a little, then rest.
  crystal.x += crystal.vx * dt
  crystal.z += crystal.vz * dt
  crystal.vy -= CRYSTAL_GRAVITY * dt
  crystal.y += crystal.vy * dt
  if (crystal.y <= CRYSTAL_GROUND_Y) {
    crystal.y = CRYSTAL_GROUND_Y
    crystal.vy = Math.abs(crystal.vy) > 2 ? -crystal.vy * 0.4 : 0
    crystal.vx *= 0.8
    crystal.vz *= 0.8
  }
  return pickable && distance <= CRYSTAL_PICKUP_RADIUS
}
