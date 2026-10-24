import { describe, expect, it } from 'vitest'
import {
  gridToWorld,
  isWalkable,
  parseMap,
  resolveMove,
  withObstacles,
  worldToGrid,
} from '../src/logic/grid.js'

const SAMPLE_MAP = ['#####', '#P..#', '#.#.#', '#..M#', '#####']

describe('parseMap', () => {
  it('reports the grid dimensions', () => {
    const grid = parseMap(SAMPLE_MAP)
    expect(grid.width).toBe(5)
    expect(grid.height).toBe(5)
  })

  it('marks # cells as walls and everything else as floor', () => {
    const grid = parseMap(SAMPLE_MAP)
    expect(grid.cells[0][0]).toBe('#')
    expect(grid.cells[2][2]).toBe('#')
    expect(grid.cells[1][1]).toBe('.')
  })

  it('extracts spawn points and leaves the underlying tile walkable', () => {
    const grid = parseMap(SAMPLE_MAP)
    expect(grid.playerSpawns).toEqual([{ x: 1, z: 1 }])
    expect(grid.monsterSpawns).toEqual([{ x: 3, z: 3 }])
    expect(grid.boxSpawns).toEqual([])
    expect(grid.cells[1][1]).toBe('.')
    expect(grid.cells[3][3]).toBe('.')
  })
})

describe('isWalkable', () => {
  const grid = parseMap(SAMPLE_MAP)

  it('is false for a wall tile', () => {
    expect(isWalkable(grid, 0, 0)).toBe(false)
  })

  it('is true for a floor tile', () => {
    expect(isWalkable(grid, 1, 1)).toBe(true)
  })

  it('is false for out-of-bounds coordinates', () => {
    expect(isWalkable(grid, -1, 0)).toBe(false)
    expect(isWalkable(grid, 0, -1)).toBe(false)
    expect(isWalkable(grid, grid.width, 0)).toBe(false)
    expect(isWalkable(grid, 0, grid.height)).toBe(false)
  })
})

describe('coordinate conversion', () => {
  it('converts grid coordinates to the center of the tile in world space', () => {
    expect(gridToWorld(0, 0, 2)).toEqual({ x: 1, z: 1 })
    expect(gridToWorld(3, 2, 2)).toEqual({ x: 7, z: 5 })
  })

  it('converts world coordinates back to the containing tile', () => {
    expect(worldToGrid(1, 1, 2)).toEqual({ x: 0, z: 0 })
    expect(worldToGrid(7, 5, 2)).toEqual({ x: 3, z: 2 })
  })

  it('round-trips through gridToWorld and worldToGrid', () => {
    const tileSize = 2.5
    const world = gridToWorld(4, 6, tileSize)
    expect(worldToGrid(world.x, world.z, tileSize)).toEqual({ x: 4, z: 6 })
  })
})

describe('resolveMove', () => {
  // A 5x5 room (rows/cols 1-3 are floor) with a tile size of 1, so world
  // coordinates line up one-to-one with grid indices.
  const grid = parseMap(['#####', '#...#', '#...#', '#...#', '#####'])
  const tileSize = 1
  const radius = 0.3

  it('moves freely across open floor', () => {
    const result = resolveMove(
      grid,
      tileSize,
      { x: 1.5, z: 1.5 },
      radius,
      { x: 0.2, z: 0.1 },
    )
    expect(result).toEqual({ x: 1.7, z: 1.6 })
  })

  it('blocks movement straight into a wall', () => {
    const result = resolveMove(
      grid,
      tileSize,
      { x: 1.3, z: 1.5 },
      radius,
      { x: -1, z: 0 },
    )
    // Moving left would push the circle into the wall at x < 1, so the x
    // axis is blocked and the position does not change.
    expect(result.x).toBe(1.3)
    expect(result.z).toBe(1.5)
  })

  it('slides along a wall when moving diagonally into it', () => {
    // Pressed against the left wall, moving up-and-left: the x component
    // is blocked but the z component should still apply.
    const result = resolveMove(
      grid,
      tileSize,
      { x: 1.3, z: 1.5 },
      radius,
      { x: -0.5, z: -0.2 },
    )
    expect(result.x).toBe(1.3)
    expect(result.z).toBeCloseTo(1.3)
  })
})

describe('withObstacles', () => {
  const grid = parseMap(['#####', '#...#', '#...#', '#...#', '#####'])
  const tileSize = 1
  const radius = 0.3

  it('marks the given tiles as walls without mutating the original grid', () => {
    const withCrate = withObstacles(grid, [{ x: 2, z: 2 }])
    expect(isWalkable(withCrate, 2, 2)).toBe(false)
    expect(isWalkable(grid, 2, 2)).toBe(true)
  })

  it('blocks the player from walking into the obstacle tile (crate collision)', () => {
    const withCrate = withObstacles(grid, [{ x: 2, z: 2 }])
    const result = resolveMove(withCrate, tileSize, { x: 1.6, z: 2.5 }, radius, {
      x: 0.5,
      z: 0,
    })
    // Moving right would push the circle into the crate's tile at x >= 2,
    // so the x axis is blocked and the position does not change.
    expect(result.x).toBe(1.6)
    expect(result.z).toBe(2.5)
  })
})
