// Pure, Three-free line-of-sight check: walks the grid cells between two
// world points with a DDA (Amanatides-Woo style) line walk and returns
// false as soon as a wall tile lies between them. Kept free of Three.js
// imports so Vitest can exercise it without WebGL.
import { isWalkable } from './grid.js'

const EPSILON = 1e-9

// True if every grid cell between fromWorld and toWorld (inclusive) is
// walkable, i.e. nothing blocks a straight line between the two points.
export function hasLineOfSight(grid, fromWorld, toWorld, tileSize) {
  const x0 = fromWorld.x / tileSize
  const z0 = fromWorld.z / tileSize
  const x1 = toWorld.x / tileSize
  const z1 = toWorld.z / tileSize

  let gx = Math.floor(x0)
  let gz = Math.floor(z0)
  const gx1 = Math.floor(x1)
  const gz1 = Math.floor(z1)

  if (!isWalkable(grid, gx, gz)) return false
  if (gx === gx1 && gz === gz1) return true

  const dx = x1 - x0
  const dz = z1 - z0
  const stepX = dx > 0 ? 1 : dx < 0 ? -1 : 0
  const stepZ = dz > 0 ? 1 : dz < 0 ? -1 : 0

  // Distance (in units of t, the segment's own parameterization) to cross
  // one full grid cell along each axis.
  const tDeltaX = stepX !== 0 ? Math.abs(1 / dx) : Infinity
  const tDeltaZ = stepZ !== 0 ? Math.abs(1 / dz) : Infinity

  // Distance (in t) to the first grid line crossing in each axis.
  const tMaxXStart =
    stepX > 0 ? (gx + 1 - x0) * tDeltaX : stepX < 0 ? (x0 - gx) * tDeltaX : Infinity
  const tMaxZStart =
    stepZ > 0 ? (gz + 1 - z0) * tDeltaZ : stepZ < 0 ? (z0 - gz) * tDeltaZ : Infinity

  let tMaxX = tMaxXStart
  let tMaxZ = tMaxZStart

  // A supercover walk visits at most width + height cells; cap the loop
  // there so float drift can never spin it forever.
  const maxSteps = grid.width + grid.height + 2

  for (let i = 0; i < maxSteps; i++) {
    // When the line crosses a grid corner almost exactly, step both axes
    // so the walk doesn't cut diagonally between two wall tiles that only
    // touch at that corner.
    if (Math.abs(tMaxX - tMaxZ) < EPSILON) {
      gx += stepX
      gz += stepZ
      tMaxX += tDeltaX
      tMaxZ += tDeltaZ
    } else if (tMaxX < tMaxZ) {
      gx += stepX
      tMaxX += tDeltaX
    } else {
      gz += stepZ
      tMaxZ += tDeltaZ
    }

    if (!isWalkable(grid, gx, gz)) return false
    if (gx === gx1 && gz === gz1) return true
  }

  return true
}
