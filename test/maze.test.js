import { describe, expect, it } from 'vitest'
import {
  buildFloor, cellOf, createNavigator, distanceField, generateMaze, mulberry32, spikeState, wallObstacles, LABYRINTH_FLOORS,
} from '../src/logic/maze.js'

describe('maze', () => {
  it('is fully connected', () => {
    const maze = generateMaze(7, 7, mulberry32(5))
    expect(distanceField(maze, 0).every(Number.isFinite)).toBe(true)
  })
  it('every floor is solvable from the start to a sealed gate', () => {
    for (let i = 0; i < LABYRINTH_FLOORS; i++) {
      const f = buildFloor(i)
      const dist = distanceField(f.maze, f.startCell)
      expect(Number.isFinite(dist[f.gateCell])).toBe(true)
      expect(f.maze.open[f.gateCell].filter(Boolean)).toHaveLength(1)
      expect(f.traps.some((t) => t.cell === f.startCell || t.cell === f.gateCell)).toBe(false)
      expect(dist.every(Number.isFinite)).toBe(true)
    }
  })
  it('walls block line of sight; the navigator routes around them', () => {
    const f = buildFloor(0)
    const nav = createNavigator(f.maze)
    expect(nav.hasLineOfSight(f.start, f.start)).toBe(true)
    expect(nav.hasLineOfSight(f.start, f.exit)).toBe(false)
    let p = { ...f.start }
    for (let i = 0; i < 400 && cellOf(f.maze, p.x, p.z) !== f.gateCell; i++) {
      const w = nav.nextWaypoint(p, f.exit)
      const d = Math.hypot(w.x - p.x, w.z - p.z) || 1
      p = { x: p.x + ((w.x - p.x) / d) * 1, z: p.z + ((w.z - p.z) / d) * 1 }
      expect(nav.insideWall(p.x, p.z)).toBe(false)
    }
    expect(cellOf(f.maze, p.x, p.z)).toBe(f.gateCell)
  })
  it('spikes cycle down -> warn -> up', () => {
    const seen = new Set()
    for (let t = 0; t < 3.2; t += 0.05) seen.add(spikeState(0, t))
    expect([...seen].sort()).toEqual(['down', 'up', 'warn'])
  })
  it('builds wall obstacles', () => {
    expect(wallObstacles(buildFloor(0).maze, 0.75).length).toBeGreaterThan(100)
  })
})
