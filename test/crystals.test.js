import { describe, expect, it } from 'vitest'
import {
  CRYSTAL_GROUND_Y,
  CRYSTAL_PICKUP_RADIUS,
  CRYSTAL_SETTLE_TIME,
  createCrystal,
  crystalDrops,
  stepCrystal,
} from '../src/logic/crystals.js'

const sum = (values) => values.reduce((a, b) => a + b, 0)

describe('crystalDrops', () => {
  it('drops more for tougher monsters, and a lot for a boss', () => {
    expect(sum(crystalDrops('grumpus'))).toBeGreaterThan(sum(crystalDrops('blobbo')))
    expect(sum(crystalDrops('zippy'))).toBeGreaterThan(0)
    expect(sum(crystalDrops('boss_gloop', true))).toBeGreaterThanOrEqual(30)
  })
})

describe('stepCrystal', () => {
  it('pops up, falls back, and comes to rest on the ground', () => {
    const c = createCrystal(0, 0, 1, () => 0.5)
    for (let i = 0; i < 200; i++) stepCrystal(c, 0.016, 100, 100, 3)
    expect(c.y).toBeCloseTo(CRYSTAL_GROUND_Y, 2)
    expect(Math.abs(c.vy)).toBeLessThan(0.01)
  })

  it('is not collected during its settle time, even right on the player', () => {
    const c = createCrystal(0, 0, 1, () => 0.5)
    expect(stepCrystal(c, 0.05, 0, 0, 3)).toBe(false)
    expect(c.age).toBeLessThan(CRYSTAL_SETTLE_TIME)
  })

  it('homes in on a nearby player and is collected', () => {
    const c = createCrystal(2, 0, 1, () => 0.5)
    c.age = CRYSTAL_SETTLE_TIME
    c.vx = c.vz = 0
    let collected = false
    for (let i = 0; i < 200 && !collected; i++) collected = stepCrystal(c, 0.016, 0, 0, 3.2)
    expect(collected).toBe(true)
    expect(c.homing).toBe(true)
  })

  it('leaves a far-away crystal alone', () => {
    const c = createCrystal(20, 0, 1, () => 0.5)
    c.age = 5
    c.vx = c.vz = 0
    expect(stepCrystal(c, 0.016, 0, 0, 3.2)).toBe(false)
    expect(c.homing).toBe(false)
  })

  it('a bigger magnet radius reaches further', () => {
    const near = createCrystal(8, 0, 1, () => 0.5)
    near.age = 5
    near.vx = near.vz = 0
    stepCrystal(near, 0.016, 0, 0, 3.2)
    expect(near.homing).toBe(false)
    stepCrystal(near, 0.016, 0, 0, 10)
    expect(near.homing).toBe(true)
  })

  it('picks up only within the pickup radius', () => {
    const c = createCrystal(CRYSTAL_PICKUP_RADIUS + 0.5, 0, 1, () => 0.5)
    c.age = 5
    c.vx = c.vz = 0
    c.y = CRYSTAL_GROUND_Y
    expect(stepCrystal(c, 0.001, 0, 0, 0)).toBe(false)
  })
})
