// Pure, Three-free dungeon grid logic: parsing the ASCII map, walkability
// checks, coordinate conversion, and circle-vs-grid collision resolution.
// Kept free of Three.js imports so Vitest can exercise it without WebGL.
import { clamp } from './math.js'

export const TILE = {
  WALL: '#',
  FLOOR: '.',
  PLAYER_SPAWN: 'P',
  MONSTER_SPAWN: 'M',
  BOX_SPAWN: 'B',
}

// Parses an array of equal-length map rows into a grid of wall/floor cells
// plus the spawn points recorded for each marker. Spawn markers sit on
// floor tiles, so the cell underneath a marker is always walkable.
export function parseMap(rows) {
  const height = rows.length
  const width = rows[0].length
  const cells = []
  const playerSpawns = []
  const monsterSpawns = []
  const boxSpawns = []

  for (let z = 0; z < height; z++) {
    const row = rows[z]
    const cellRow = []
    for (let x = 0; x < width; x++) {
      const char = row[x]
      cellRow.push(char === TILE.WALL ? TILE.WALL : TILE.FLOOR)

      if (char === TILE.PLAYER_SPAWN) playerSpawns.push({ x, z })
      else if (char === TILE.MONSTER_SPAWN) monsterSpawns.push({ x, z })
      else if (char === TILE.BOX_SPAWN) boxSpawns.push({ x, z })
    }
    cells.push(cellRow)
  }

  return { width, height, cells, playerSpawns, monsterSpawns, boxSpawns }
}

// Out-of-bounds tiles count as walls so edge checks never need extra guards.
export function isWalkable(grid, x, z) {
  if (x < 0 || z < 0 || x >= grid.width || z >= grid.height) return false
  return grid.cells[z][x] !== TILE.WALL
}

// Converts grid coordinates (tile indices) to world coordinates (the
// center of that tile), given the world size of one tile.
export function gridToWorld(x, z, tileSize) {
  return { x: (x + 0.5) * tileSize, z: (z + 0.5) * tileSize }
}

// Converts world coordinates to the grid tile they fall in.
export function worldToGrid(x, z, tileSize) {
  return { x: Math.floor(x / tileSize), z: Math.floor(z / tileSize) }
}

// True if a circle centered at (cx, cz) with the given radius overlaps any
// wall tile, checking only the tiles the circle's bounding box could reach.
function circleHitsWall(grid, tileSize, cx, cz, radius) {
  const minGX = Math.floor((cx - radius) / tileSize)
  const maxGX = Math.floor((cx + radius) / tileSize)
  const minGZ = Math.floor((cz - radius) / tileSize)
  const maxGZ = Math.floor((cz + radius) / tileSize)

  for (let gz = minGZ; gz <= maxGZ; gz++) {
    for (let gx = minGX; gx <= maxGX; gx++) {
      if (isWalkable(grid, gx, gz)) continue

      const tileMinX = gx * tileSize
      const tileMaxX = tileMinX + tileSize
      const tileMinZ = gz * tileSize
      const tileMaxZ = tileMinZ + tileSize

      const closestX = clamp(cx, tileMinX, tileMaxX)
      const closestZ = clamp(cz, tileMinZ, tileMaxZ)
      const dx = cx - closestX
      const dz = cz - closestZ
      if (dx * dx + dz * dz < radius * radius) return true
    }
  }
  return false
}

// Moves a circle (position + radius) by delta against the wall grid,
// resolving the X and Z axes separately so the circle slides along a wall
// instead of stopping dead when moving diagonally into it.
export function resolveMove(grid, tileSize, position, radius, delta) {
  let { x, z } = position

  const nextX = x + delta.x
  if (!circleHitsWall(grid, tileSize, nextX, z, radius)) {
    x = nextX
  }

  const nextZ = z + delta.z
  if (!circleHitsWall(grid, tileSize, x, nextZ, radius)) {
    z = nextZ
  }

  return { x, z }
}
