// Pure, Three-free hiding logic: finding a nearby box, whether the player
// can enter one, picking a tile to pop back out onto, and the ambush
// damage window after exiting. Kept free of Three.js imports so Vitest
// can exercise it without WebGL. The Three-side driver lives in
// src/hiding.js.
import { gridToWorld, isWalkable } from './grid.js'

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

// Candidate exit directions as grid offsets, each paired with the facing
// angle that direction represents (the same atan2(dx, dz) convention used
// throughout: 0 = +Z, PI/2 = +X, PI = -Z, -PI/2 = -X).
const EXIT_DIRECTIONS = [
  { dx: 0, dz: 1, angle: 0 },
  { dx: 1, dz: 0, angle: Math.PI / 2 },
  { dx: 0, dz: -1, angle: Math.PI },
  { dx: -1, dz: 0, angle: -Math.PI / 2 },
]

function normalizeAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle))
}

// Picks a walkable tile adjacent to the box's grid tile to pop the player
// out onto, preferring whichever side is closest to facingAngle. Falls
// back to the box's own tile if every side is blocked.
export function pickExitTile(grid, tileSize, boxGridPos, facingAngle) {
  const candidates = EXIT_DIRECTIONS.map((dir) => ({
    x: boxGridPos.x + dir.dx,
    z: boxGridPos.z + dir.dz,
    angleDiff: Math.abs(normalizeAngle(dir.angle - facingAngle)),
  }))
    .filter((candidate) => isWalkable(grid, candidate.x, candidate.z))
    .sort((a, b) => a.angleDiff - b.angleDiff)

  const chosen = candidates[0] ?? boxGridPos
  return gridToWorld(chosen.x, chosen.z, tileSize)
}

// True if `now` is within `window` seconds after exitedAt, i.e. the
// ambush bonus damage still applies. False if the player has never
// exited a box (exitedAt is null/undefined).
export function isAmbushActive(now, exitedAt, window) {
  if (exitedAt == null) return false
  return now - exitedAt <= window
}
