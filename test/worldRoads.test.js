import { describe, expect, it } from 'vitest'
import {
  DAY_SECONDS,
  ROAD_WIDTH,
  chunkContent,
  chunksAround,
  dayName,
  daylight,
  heightAt,
  onRoad,
  roadDistance,
  roadPaths,
  roads,
  skystars,
  villages,
} from '../src/logic/world.js'

describe('the Wilds roads', () => {
  it('runs a road from the Sanctum clearing to every village', () => {
    expect(roads().length).toBeGreaterThan(villages().length)
    for (const v of villages()) expect(roadDistance(v.x, v.z), v.name).toBeLessThan(1)
    expect(roadPaths().every((p) => p.length >= 3)).toBe(true)
  })

  it('agrees with onRoad, and is Infinity far from any road', () => {
    const [x, z] = roadPaths()[0][1]
    expect(onRoad(x, z)).toBe(true)
    expect(roadDistance(x, z)).toBeLessThan(ROAD_WIDTH)
    expect(roadDistance(5000, 5000)).toBe(Infinity)
  })

  it('keeps scenery and grass off the road, and lines it with lanterns', () => {
    let lanterns = 0
    for (const { cx, cz } of chunksAround(0, 0, 300)) {
      const c = chunkContent(cx, cz)
      for (const p of c.props) {
        if (['roadLantern', 'signpost', 'windmill'].includes(p.kind)) {
          lanterns++
          expect(onRoad(p.x, p.z), p.kind).toBe(false)
        }
      }
      for (const g of c.grass) expect(onRoad(g.x, g.z, -0.8)).toBe(false)
    }
    expect(lanterns).toBeGreaterThan(20)
  })
})

describe('skystars', () => {
  it('perch on the tops of the tall hills', () => {
    const stars = skystars()
    expect(stars.length).toBeGreaterThanOrEqual(5)
    for (const s of stars) {
      expect(s.y).toBeGreaterThan(12)
      expect(s.y).toBeCloseTo(heightAt(s.x, s.z), 5)
      // Nothing close by is higher: it's the summit.
      for (const [dx, dz] of [[3, 0], [-3, 0], [0, 3], [0, -3]]) expect(heightAt(s.x + dx, s.z + dz)).toBeLessThanOrEqual(s.y + 0.05)
    }
    expect(new Set(stars.map((s) => s.id)).size).toBe(stars.length)
  })
})

describe('day and night', () => {
  it('cycles daylight between 0 and 1 every DAY_SECONDS', () => {
    for (let t = 0; t < DAY_SECONDS; t += 7) {
      expect(daylight(t)).toBeGreaterThanOrEqual(0)
      expect(daylight(t)).toBeLessThanOrEqual(1)
      expect(daylight(t + DAY_SECONDS)).toBeCloseTo(daylight(t), 6)
    }
    const names = new Set()
    for (let t = 0; t < DAY_SECONDS; t += 5) names.add(dayName(t))
    expect([...names].sort()).toEqual(['Dawn', 'Day', 'Dusk', 'Night'])
    // The night really is dark and the day bright.
    const lights = Array.from({ length: 96 }, (_, i) => daylight((i / 96) * DAY_SECONDS))
    expect(Math.min(...lights)).toBeLessThan(0.05)
    expect(Math.max(...lights)).toBeGreaterThan(0.95)
  })
})
