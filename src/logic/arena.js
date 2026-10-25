// Pure, Three-free arena logic: whether a point is still on the floating
// platform, circle-vs-circle movement against obstacles (pods), and
// picking random points on the platform (for wandering and for spawning
// at its edge). Kept free of Three.js imports so Vitest can exercise it
// without WebGL. The platform is centered at the world origin.

// True if a point (world {x, z}) is still within the platform's radius.
// False means its owner has walked/been knocked off the edge.
export function isOnPlatform(pos, arenaRadius) {
  return Math.hypot(pos.x, pos.z) <= arenaRadius
}

// True if a circle at (x, z) with the given radius would overlap any
// obstacle (each { x, z, radius }).
function hitsObstacle(x, z, radius, obstacles) {
  for (const obstacle of obstacles) {
    const dx = x - obstacle.x
    const dz = z - obstacle.z
    const minDistance = radius + obstacle.radius
    if (dx * dx + dz * dz < minDistance * minDistance) return true
  }
  return false
}

// Moves a circle (position + radius) by delta, resolving the X and Z axes
// separately against circular obstacles so it slides along an obstacle's
// edge instead of stopping dead when moving diagonally into it (the same
// per-axis approach the old grid collision used for walls). Deliberately
// does NOT clamp the result to the platform's edge -- walking or being
// knocked off is allowed, so the caller checks isOnPlatform afterward.
export function resolveArenaMove(pos, delta, radius, obstacles = []) {
  let { x, z } = pos

  const nextX = x + delta.x
  if (!hitsObstacle(nextX, z, radius, obstacles)) {
    x = nextX
  }

  const nextZ = z + delta.z
  if (!hitsObstacle(x, nextZ, radius, obstacles)) {
    z = nextZ
  }

  return { x, z }
}

// Pulls a point back onto the platform if it lies beyond maxRadius,
// scaling it toward the center along the same direction; leaves it
// unchanged otherwise. Used to keep monster steering targets (wander,
// chase, search) off the very edge, so only knockback -- never a
// monster's own steering -- can send it over the side.
export function clampToPlatform(pos, maxRadius) {
  const distance = Math.hypot(pos.x, pos.z)
  if (distance <= maxRadius || distance === 0) return { x: pos.x, z: pos.z }
  const scale = maxRadius / distance
  return { x: pos.x * scale, z: pos.z * scale }
}

// A uniformly-random point within (arenaRadius - margin) of the center.
// rng is injectable (default Math.random) for deterministic tests. Uses
// sqrt(rng()) for the radius so points are uniform over the disc's area
// rather than bunched toward the center.
export function randomPointOnPlatform(rng = Math.random, arenaRadius, margin = 0) {
  const maxRadius = Math.max(arenaRadius - margin, 0)
  const angle = rng() * Math.PI * 2
  const radius = Math.sqrt(rng()) * maxRadius
  return { x: Math.sin(angle) * radius, z: Math.cos(angle) * radius }
}

// A uniformly-random point within `maxDist` of `center` (area-uniform,
// same sqrt(rng()) trick as randomPointOnPlatform), clamped onto the
// platform. Used to bias a monster's wander target to stay near where
// it already is, rather than trekking clean across a big arena.
export function randomPointNear(rng = Math.random, center, maxDist, arenaRadius, margin = 0) {
  const angle = rng() * Math.PI * 2
  const distance = Math.sqrt(rng()) * maxDist
  const point = { x: center.x + Math.sin(angle) * distance, z: center.z + Math.cos(angle) * distance }
  return clampToPlatform(point, Math.max(arenaRadius - margin, 0))
}

// A random point on a ring `minDist`-`maxDist` from the PLAYER's current
// position, clamped onto the platform with `margin` in from the edge --
// used to spawn monsters close enough to the player to reach them in a
// reasonable time on a big arena, rather than always walking in from the
// platform's actual edge. rng is injectable (default Math.random) for
// deterministic tests.
export function spawnPointNearPlayer(rng = Math.random, playerPos, minDist, maxDist, arenaRadius, margin = 0) {
  const angle = rng() * Math.PI * 2
  const distance = minDist + rng() * (maxDist - minDist)
  const point = { x: playerPos.x + Math.sin(angle) * distance, z: playerPos.z + Math.cos(angle) * distance }
  return clampToPlatform(point, Math.max(arenaRadius - margin, 0))
}
