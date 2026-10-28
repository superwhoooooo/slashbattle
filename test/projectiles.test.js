import { describe, expect, it } from 'vitest'
import { fanVelocities, projectileHits, stepProjectile } from '../src/logic/projectiles.js'

describe('fanVelocities', () => {
  it('centers the fan on the aim angle and spans the spread', () => {
    const v = fanVelocities(0, 3, Math.PI / 2, 10)
    expect(v).toHaveLength(3)
    expect(v[1].vx).toBeCloseTo(0, 5)
    expect(v[1].vz).toBeCloseTo(10, 5)
    expect(v[0].vx).toBeLessThan(0)
    expect(v[2].vx).toBeGreaterThan(0)
    for (const { vx, vz } of v) expect(Math.hypot(vx, vz)).toBeCloseTo(10, 5)
  })

  it('fires straight ahead for a single orb', () => {
    const [only] = fanVelocities(Math.PI / 2, 1, 1, 4)
    expect(only.vx).toBeCloseTo(4, 5)
    expect(only.vz).toBeCloseTo(0, 5)
  })
})

describe('stepProjectile', () => {
  it('moves in a straight line and reports when its life runs out', () => {
    const p = { x: 0, z: 0, vx: 2, vz: 1, life: 1, damage: 5, radius: 0.3 }
    expect(stepProjectile(p, 0.5)).toBe(true)
    expect(p.x).toBeCloseTo(1)
    expect(p.z).toBeCloseTo(0.5)
    expect(stepProjectile(p, 0.6)).toBe(false)
  })
})

describe('projectileHits', () => {
  it('hits when the circles overlap and not otherwise', () => {
    const p = { x: 0, z: 0, radius: 0.3 }
    expect(projectileHits(p, { x: 0.5, z: 0 }, 0.35)).toBe(true)
    expect(projectileHits(p, { x: 1, z: 0 }, 0.35)).toBe(false)
  })
})
