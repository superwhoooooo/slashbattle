// Pure, Three-free arena logic: whether a point is still on the floating
// platform, circle-vs-circle movement against obstacles (pods), and
// picking random points on the platform (for wandering and for spawning
// at its edge). Kept free of Three.js imports so Vitest can exercise it
// without WebGL. The platform is centered at the world origin.

// The platform disc's vertical layout, derived from its thickness.
// Every character/pod/particle treats y = 0 as the ground they stand
// on, so `topY` is always 0 -- it's the disc's CENTER (discCenterY) and
// bottom (bottomY) that move to keep the disc's actual top surface
// flush with that ground plane, rather than the disc sitting centered
// on y = 0 (which used to leave its top at +thickness/2, burying
// everything standing "on" y = 0 by that much).
export function platformLayout(thickness) {
  const topY = 0
  const discCenterY = topY - thickness / 2
  const bottomY = discCenterY - thickness / 2
  return { topY, discCenterY, bottomY }
}

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
//
// `obstacles` (each { x, z, radius }, default none) are retried around --
// a monster shouldn't materialize inside a sundeck prop -- with
// `obstacleMargin` added to the obstacle's own radius (typically the
// spawning monster's own collision radius). If every attempt in
// `maxAttempts` still lands on one, the last candidate is used anyway: a
// monster has to spawn somewhere, so this is a best effort rather than a
// skippable attempt like pickPodSpawnPoint's.
export function spawnPointNearPlayer(
  rng = Math.random,
  playerPos,
  minDist,
  maxDist,
  arenaRadius,
  margin = 0,
  obstacles = [],
  obstacleMargin = 0,
  maxAttempts = 10,
) {
  let point = null
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const angle = rng() * Math.PI * 2
    const distance = minDist + rng() * (maxDist - minDist)
    point = clampToPlatform(
      { x: playerPos.x + Math.sin(angle) * distance, z: playerPos.z + Math.cos(angle) * distance },
      Math.max(arenaRadius - margin, 0),
    )
    if (!hitsObstacle(point.x, point.z, obstacleMargin, obstacles)) return point
  }
  return point
}
