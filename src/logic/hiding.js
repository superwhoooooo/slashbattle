// Pure, Three-free hiding logic: finding a nearby box, whether the player
// can enter one, picking a point to pop back out onto, and the ambush
// damage window after exiting. Kept free of Three.js imports so Vitest
// can exercise it without WebGL. The Three-side driver lives in
// src/hiding.js.
import { clampToPlatform } from './arena.js'

function distanceBetween(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z)
}

// Returns the box (from `boxes`, each a { position: {x,z}, ... }) nearest
// to playerPos and within maxRange, or null if none qualify (including an
// empty list).
export function findNearestBox(playerPos, boxes, maxRange) {
  let nearest = null
  let nearestDistance = Infinity

  for (const box of boxes) {
    const distance = distanceBetween(playerPos, box.position)
    if (distance <= maxRange && distance < nearestDistance) {
      nearest = box
      nearestDistance = distance
    }
  }

  return nearest
}

// True if playerState ({ hp, hidden, position }) can enter `box`
// ({ position, occupied }): the player is alive, not already hidden, the
// box is unoccupied, and it's within range.
export function canEnterBox(playerState, box, range) {
  if (playerState.hp <= 0) return false
  if (playerState.hidden) return false
  if (box.occupied) return false
  return distanceBetween(playerState.position, box.position) <= range
}

// Picks a point just outside the box's circle to pop the player out onto,
// along facingAngle (the same atan2(dx, dz) convention used throughout:
// 0 = +Z, PI/2 = +X, PI = -Z, -PI/2 = -X), pulled back onto the platform
// if that would otherwise land past the edge.
export function pickExitPoint(boxPos, boxRadius, facingAngle, arenaRadius, exitMargin = 0.3) {
  const exitDistance = boxRadius + exitMargin
  const point = {
    x: boxPos.x + Math.sin(facingAngle) * exitDistance,
    z: boxPos.z + Math.cos(facingAngle) * exitDistance,
  }
  return clampToPlatform(point, arenaRadius)
}

// True if `now` is within `window` seconds after exitedAt, i.e. the
// ambush bonus damage still applies. False if the player has never
// exited a box (exitedAt is null/undefined).
export function isAmbushActive(now, exitedAt, window) {
  if (exitedAt == null) return false
  return now - exitedAt <= window
}

// Seconds left before a player hidden since `enteredAt` is ejected at
// `limit` (clamped to 0, so a caller driving a countdown display never
// has to clamp it themselves).
export function hideTimeRemaining(enteredAt, now, limit) {
  return Math.max(0, limit - (now - enteredAt))
}

// True once a player hidden since `enteredAt` has reached `limit`
// seconds in hiding -- the moment they should be ejected.
export function shouldEject(enteredAt, now, limit) {
  return now - enteredAt >= limit
}

// The HP penalty for being ejected: `fraction` of `maxHp` (e.g. 0.1 for
// a 10% penalty).
export function ejectPenalty(maxHp, fraction) {
  return maxHp * fraction
}
