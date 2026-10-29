import { describe, expect, it } from 'vitest'
import { isInPool, resortLayout } from '../src/logic/resortLayout.js'

const RADIUS = 48
// Mirrors resortLayout.js's own CENTER_CLEARANCE/EDGE_MARGIN -- kept in
// sync here the same way other arena tests mirror platformLayout's math.
const CENTER_CLEARANCE = 8
const EDGE_MARGIN = 3

// Every prop, flattened to a plain {x, z, radius} circle -- a pool's
// radius is the larger of its two ellipse half-axes, matching the
// effective circle resortLayout.js places it with.
function allProps(layout) {
  return [
    ...layout.pools.map((pool) => ({ x: pool.x, z: pool.z, radius: Math.max(pool.rx, pool.rz) })),
    ...layout.umbrellas,
    ...layout.loungers,
    ...layout.signs,
  ]
}

describe('resortLayout', () => {
  it('is deterministic for the same seed', () => {
    const a = resortLayout({ radius: RADIUS, seed: 42 })
    const b = resortLayout({ radius: RADIUS, seed: 42 })
    expect(a).toEqual(b)
  })

  it('differs for a different seed', () => {
    const a = resortLayout({ radius: RADIUS, seed: 1 })
    const b = resortLayout({ radius: RADIUS, seed: 2 })
    expect(a).not.toEqual(b)
  })

  it('keeps every prop clear of the center (player spawn/respawn point)', () => {
    for (let seed = 0; seed < 20; seed++) {
      const layout = resortLayout({ radius: RADIUS, seed })
      for (const prop of allProps(layout)) {
        expect(Math.hypot(prop.x, prop.z) - prop.radius).toBeGreaterThanOrEqual(CENTER_CLEARANCE - 1e-9)
      }
    }
  })

  it('keeps every prop at least EDGE_MARGIN in from the platform edge', () => {
    for (let seed = 0; seed < 20; seed++) {
      const layout = resortLayout({ radius: RADIUS, seed })
      for (const prop of allProps(layout)) {
        expect(Math.hypot(prop.x, prop.z) + prop.radius).toBeLessThanOrEqual(RADIUS - EDGE_MARGIN + 1e-9)
      }
    }
  })

  it('never overlaps two props, respecting their radii', () => {
    for (let seed = 0; seed < 20; seed++) {
      const layout = resortLayout({ radius: RADIUS, seed })
      const props = allProps(layout)
      for (let i = 0; i < props.length; i++) {
        for (let j = i + 1; j < props.length; j++) {
          const dist = Math.hypot(props[i].x - props[j].x, props[i].z - props[j].z)
          expect(dist).toBeGreaterThanOrEqual(props[i].radius + props[j].radius - 1e-9)
        }
      }
    }
  })

  it('places a modest, bounded count of each prop type', () => {
    for (let seed = 0; seed < 30; seed++) {
      const layout = resortLayout({ radius: RADIUS, seed })
      expect(layout.pools.length).toBeGreaterThanOrEqual(4)
      expect(layout.pools.length).toBeLessThanOrEqual(6)
      expect(layout.umbrellas.length).toBeGreaterThanOrEqual(14)
      expect(layout.umbrellas.length).toBeLessThanOrEqual(20)
      expect(layout.loungers.length).toBeGreaterThan(0)
      expect(layout.signs.length).toBeGreaterThan(0)
    }
  })

  it('gives every umbrella a positive radius and a color', () => {
    const layout = resortLayout({ radius: RADIUS, seed: 5 })
    for (const umbrella of layout.umbrellas) {
      expect(umbrella.radius).toBeGreaterThan(0)
      expect(typeof umbrella.color).toBe('number')
    }
  })
})

describe('isInPool', () => {
  it('is true at a pool center and false far away', () => {
    const pools = [{ x: 10, z: 10, rx: 3, rz: 2 }]
    expect(isInPool(pools, 10, 10)).toBe(true)
    expect(isInPool(pools, 100, 100)).toBe(false)
  })

  it('respects the ellipse radii along each axis, not a single circle', () => {
    const pools = [{ x: 0, z: 0, rx: 5, rz: 2 }]
    expect(isInPool(pools, 4.5, 0)).toBe(true) // within rx along x
    expect(isInPool(pools, 0, 1.9)).toBe(true) // within rz along z
    expect(isInPool(pools, 0, 2.1)).toBe(false) // outside rz along z
  })

  it('is false when there are no pools', () => {
    expect(isInPool([], 0, 0)).toBe(false)
  })
})
