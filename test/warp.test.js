import { describe, expect, it } from 'vitest'
import { clampTargetToRange, inCircle, rippleState, swirlStrength } from '../src/logic/warp.js'
import { WEAPON_FX_IDS } from '../src/weaponFx.js'
import { WEAPONS, weaponBase } from '../src/logic/items.js'

describe('warp', () => {
  it('fades a swirl in and out', () => {
    expect(swirlStrength(0, 4)).toBe(0)
    expect(swirlStrength(1, 4)).toBe(1)
    expect(swirlStrength(3.9, 4)).toBeLessThan(0.5)
    expect(swirlStrength(5, 4)).toBe(0)
  })
  it('grows a ripple ring while it fades', () => {
    const a = rippleState(0.1, 0.5)
    const b = rippleState(0.4, 0.5)
    expect(b.radiusFraction).toBeGreaterThan(a.radiusFraction)
    expect(b.strength).toBeLessThan(a.strength)
  })
  it('clamps a target to range and tests circles', () => {
    expect(clampTargetToRange({ x: 0, z: 0 }, { x: 30, z: 0 }, 18)).toEqual({ x: 18, z: 0 })
    expect(clampTargetToRange({ x: 0, z: 0 }, { x: 3, z: 4 }, 18)).toEqual({ x: 3, z: 4 })
    expect(inCircle(1, 1, 0, 0, 2)).toBe(true)
    expect(inCircle(3, 0, 0, 0, 2)).toBe(false)
  })
  it('gives every weapon its own swing effect', () => {
    for (const id of Object.keys(WEAPONS)) expect(WEAPON_FX_IDS).toContain(weaponBase(id))
  })
})
