// Pure, Three-free pod spawning: picking a valid random spot for a new
// pod, and the timer that decides when the next one should appear.
// Kept free of Three.js imports so Vitest can exercise it without
// WebGL; the Three-side driver (actually creating/removing pod meshes)
// lives in src/main.js.
import { randomPointOnPlatform } from './arena.js'

function distanceBetween(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z)
}

// Picks a random point on the platform (margin in from the edge) that's
// at least minSpacing from every existing pod, minPlayerDistance from
// the player (if given), monsterAvoidRadius from every monster (if
// given), and obstacleMargin from the edge of every obstacle (each
// { x, z, radius } -- the sundeck's static props, so a pod/chest never
// spawns inside or touching one) -- retrying up to maxAttempts times.
// Returns null if nothing fit in that many attempts, so the caller can
// just skip this spawn attempt rather than forcing a bad position. rng
// is injectable (default Math.random) for deterministic tests.
export function pickPodSpawnPoint(
  rng = Math.random,
  {
    arenaRadius,
    margin = 0,
    existingPods = [],
    playerPos = null,
    minPlayerDistance = 0,
    monsterPositions = [],
    monsterAvoidRadius = 0,
    obstacles = [],
    obstacleMargin = 0,
    minSpacing = 0,
    maxAttempts = 20,
  },
) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidate = randomPointOnPlatform(rng, arenaRadius, margin)

    const farFromPods = existingPods.every((pod) => distanceBetween(candidate, pod) >= minSpacing)
    if (!farFromPods) continue

    const farFromPlayer = !playerPos || distanceBetween(candidate, playerPos) >= minPlayerDistance
    if (!farFromPlayer) continue

    const farFromMonsters = monsterPositions.every(
      (monster) => distanceBetween(candidate, monster) >= monsterAvoidRadius,
    )
    if (!farFromMonsters) continue

    const farFromObstacles = obstacles.every(
      (obstacle) => distanceBetween(candidate, obstacle) >= obstacle.radius + obstacleMargin,
    )
    if (!farFromObstacles) continue

    return candidate
  }

  return null
}

// Starting state: no spawn scheduled yet.
export function createPodSpawnerState() {
  return { nextSpawnAt: null }
}

// Advances the pod spawn timer by one tick. Doesn't know how to find a
// valid spot itself (the caller does that with pickPodSpawnPoint only
// when this returns spawnNow); it only decides WHEN the next pod should
// try to appear, given how many are active right now.
//
// While `activeCount` is at or above `maxActive`, the timer resets (so
// a fresh random delay is rolled once a slot frees up, rather than
// spawning immediately the moment it does). Otherwise, once no spawn is
// scheduled, it rolls a random delay within `delayRange` ([min, max]
// seconds); once `now` reaches that time, `spawnNow` is true for this
// tick and the timer resets to schedule the next one. rng is injectable
// (default Math.random) for deterministic tests.
//
// Returns { state, spawnNow }; `state` is the next tick's state (the
// caller merges it back in; this does not mutate `state`).
export function stepPodSpawner(state, now, activeCount, maxActive, delayRange, rng = Math.random) {
  if (activeCount >= maxActive) {
    return { state: { nextSpawnAt: null }, spawnNow: false }
  }

  if (state.nextSpawnAt === null) {
    const [min, max] = delayRange
    return { state: { nextSpawnAt: now + min + rng() * (max - min) }, spawnNow: false }
  }

  if (now >= state.nextSpawnAt) {
    return { state: { nextSpawnAt: null }, spawnNow: true }
  }

  return { state: { nextSpawnAt: state.nextSpawnAt }, spawnNow: false }
}
