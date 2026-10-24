import { describe, expect, it } from 'vitest'
import { parseMap } from '../src/logic/grid.js'
import { hasLineOfSight } from '../src/logic/lineOfSight.js'

// A small room with one wall tile poking into the middle of column 2:
//   #####
//   #...#
//   #.#.#
//   #...#
//   #####
const MAP = ['#####', '#...#', '#.#.#', '#...#', '#####']
const grid = parseMap(MAP)
const tileSize = 1

describe('hasLineOfSight', () => {
  it('is true along a clear line with no walls between', () => {
    expect(hasLineOfSight(grid, { x: 1.5, z: 1.5 }, { x: 3.5, z: 1.5 }, tileSize)).toBe(true)
  })

  it('is false when a wall tile lies between the two points', () => {
    // Straight up column 2, which has a wall at row 2.
    expect(hasLineOfSight(grid, { x: 2.5, z: 1.5 }, { x: 2.5, z: 3.5 }, tileSize)).toBe(false)
  })

  it('is true between two adjacent walkable tiles', () => {
    expect(hasLineOfSight(grid, { x: 1.5, z: 1.5 }, { x: 2.5, z: 1.5 }, tileSize)).toBe(true)
  })

  it('is true for two points within the same tile', () => {
    expect(hasLineOfSight(grid, { x: 1.2, z: 1.2 }, { x: 1.8, z: 1.8 }, tileSize)).toBe(true)
  })
})
