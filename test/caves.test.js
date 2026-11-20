import { describe, expect, it } from 'vitest'
import { CAVE_ENTER_RADIUS, CAVE_ROCK_RADIUS, caveArrival, caveAt, caveBeacons, caveById, caveExit, caveLayout, caveObstacles, caves } from '../src/logic/caves.js'
import { beacons, chasms, depthsChunk, depthsLairs } from '../src/logic/depths.js'
import { skyArchipelagos } from '../src/logic/skyIslands.js'
import { CHUNK_SIZE, WORLD_RADIUS } from '../src/logic/world.js'

describe('caves', () => {
  it('seeds land caves and isle caves, all inside the world, stable between calls', () => {
    const list = caves()
    expect(list.filter((c) => c.kind === 'land').length).toBeGreaterThanOrEqual(5)
    expect(list.filter((c) => c.kind === 'isle').length).toBeGreaterThanOrEqual(1)
    expect(caves()).toBe(list)
    for (const c of list) {
      expect(Math.hypot(c.x, c.z)).toBeLessThan(WORLD_RADIUS)
      expect(new Set(list.map((o) => o.id)).size).toBe(list.length)
    }
  })

  it('puts the doorway just outside the solid outcrop, so you can reach it', () => {
    for (const c of caves()) {
      const d = Math.hypot(c.x - c.rock.x, c.z - c.rock.z)
      expect(d).toBeGreaterThan(CAVE_ROCK_RADIUS + 0.8)
      expect(caveObstacles(c)[0].radius).toBe(CAVE_ROCK_RADIUS)
      expect(caveAt(c.x, c.z, c.y)).toBe(c)
      expect(caveAt(c.x, c.z, c.y + 40)).toBe(null) // a different level
      expect(caveAt(c.rock.x, c.rock.z)).toBe(null)
      const out = caveExit(c)
      expect(Math.hypot(out.x - c.x, out.z - c.z)).toBeGreaterThan(CAVE_ENTER_RADIUS) // an exit never re-enters
    }
  })

  it('isle caves sit on the main isle at its top', () => {
    const isles = skyArchipelagos().flatMap((a) => a.isles)
    for (const c of caves().filter((k) => k.kind === 'isle')) {
      const isle = isles.find((i) => i.id === c.isleId)
      expect(isle.main).toBe(true)
      expect(c.y).toBe(isle.y)
      expect(Math.hypot(c.rock.x - isle.x, c.rock.z - isle.z)).toBeLessThan(isle.radius)
    }
  })

  it('each cave has a Lightroot in its chamber and a chest, guards and props', () => {
    const roots = caveBeacons()
    expect(roots.length).toBe(caves().length)
    for (const c of caves()) {
      const b = roots.find((r) => r.caveId === c.id)
      expect(b).toBeTruthy()
      expect(beacons()).toContainEqual(b)
      const a = caveArrival(c)
      expect(Math.hypot(a.x - b.x, a.z - b.z)).toBeGreaterThan(3)
      const layout = caveLayout(c)
      expect(layout.treasure.length).toBeGreaterThanOrEqual(1)
      expect(layout.guards.length).toBeGreaterThanOrEqual(2)
      expect(layout.props.length).toBeGreaterThan(5)
      expect(caveById(c.id)).toBe(c)
    }
    expect(caves().some((c) => c.kind === 'isle' && caveLayout(c).treasure.length === 2)).toBe(true)
  })

  it('chasms and lairs keep clear of the caves', () => {
    for (const ch of chasms()) for (const c of caves()) expect(Math.hypot(ch.x - c.rock.x, ch.z - c.rock.z)).toBeGreaterThan(ch.radius + 20)
    for (const l of depthsLairs()) for (const c of caves()) expect(Math.hypot(l.x - c.chamber.x, l.z - c.chamber.z)).toBeGreaterThan(l.radius + 14)
  })

  it('the Depths chunks hold each chamber\'s chest and guards', () => {
    for (const c of caves()) {
      const layout = caveLayout(c)
      const ids = new Set()
      for (const t of layout.treasure.concat(layout.guards)) {
        const cx = Math.floor(t.x / CHUNK_SIZE)
        const cz = Math.floor(t.z / CHUNK_SIZE)
        const chunk = depthsChunk(cx, cz)
        for (const e of chunk.treasure) ids.add(e.id)
        for (const e of chunk.monsters) ids.add(e.id)
      }
      for (const t of layout.treasure.concat(layout.guards)) expect(ids.has(t.id), t.id).toBe(true)
    }
  })
})
