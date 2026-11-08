import { describe, expect, it } from 'vitest'
import { inRingBand, onBeam, puddleTargets, rainZones, ringAngles, wallOrbs } from '../src/logic/signatures.js'

describe('signature geometry', () => {
  it('spreads ring angles evenly', () => {
    const a = ringAngles(4, 0)
    expect(a).toHaveLength(4)
    expect(a[1] - a[0]).toBeCloseTo(Math.PI / 2)
  })

  it('leaves a gap in a wall', () => {
    const full = wallOrbs({ x: 0, z: 0, aim: 0, count: 12, spacing: 1.5, speed: 8, gap: 0.01, gapAt: 0.5 })
    const gapped = wallOrbs({ x: 0, z: 0, aim: 0, count: 12, spacing: 1.5, speed: 8, gap: 2, gapAt: 0.5 })
    expect(gapped.length).toBeLessThan(full.length)
    for (const o of gapped) expect(o.vz).toBeCloseTo(8) // flying along the aim
  })

  it('scatters rain zones near the player, tighter in player mode and none for chase', () => {
    const rng = () => 0.99
    expect(rainZones('chase', 5, { x: 0, z: 0 })).toEqual([])
    for (const z of rainZones('player', 6, { x: 5, z: 5 }, rng)) expect(Math.hypot(z.x - 5, z.z - 5)).toBeLessThanOrEqual(3.01)
    for (const z of rainZones('around', 6, { x: 5, z: 5 }, rng)) expect(Math.hypot(z.x - 5, z.z - 5)).toBeLessThanOrEqual(9.01)
  })

  it('puts a ring of puddles round the boss', () => {
    const t = puddleTargets('ring', 8, { x: 0, z: 0 }, { x: 20, z: 20 })
    expect(t).toHaveLength(8)
    for (const p of t) expect(Math.hypot(p.x, p.z)).toBeGreaterThanOrEqual(4.9)
  })

  it('tells whether a point is on a beam or in a ring band', () => {
    const beam = { x: 0, z: 0, aim: 0, length: 20, width: 1 }
    expect(onBeam({ x: 0.5, z: 10 }, beam)).toBe(true)
    expect(onBeam({ x: 5, z: 10 }, beam)).toBe(false)
    expect(onBeam({ x: 0, z: -5 }, beam)).toBe(false)
    expect(inRingBand({ x: 6, z: 0 }, 0, 0, 6)).toBe(true)
    expect(inRingBand({ x: 2, z: 0 }, 0, 0, 6)).toBe(false)
  })
})
