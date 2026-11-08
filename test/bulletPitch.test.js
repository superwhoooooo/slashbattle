import { describe, expect, it } from 'vitest'
import { BULLET_START_Y, clampSlope, makeBullets, MAX_AIM_SLOPE, stepBullet } from '../src/logic/bullets.js'

const weapon = { damage: 10, knockback: 1, pellets: 1, spread: 0, bullet: { speed: 20, life: 2, radius: 0.3, pierce: 0, explode: 0, color: 0xffffff } }
const fire = (slope) => makeBullets(weapon, { x: 0, z: 0, aimAngle: 0, slope })[0]
const target = (z, y0 = -0.3, y1 = 1.6) => ({ id: 't', x: 0, z, radius: 0.5, y0, y1 })

describe('aiming bullets up and down', () => {
  it('starts level at the muzzle height with no slope', () => {
    const b = fire(0)
    expect(b.y).toBe(BULLET_START_Y)
    expect(b.vy).toBe(0)
  })

  it('climbs or falls by slope per unit flown along the ground', () => {
    const up = fire(0.5)
    expect(up.vy).toBeCloseTo(10)
    stepBullet(up, 0.1, [])
    expect(up.y).toBeCloseTo(BULLET_START_Y + 1)
    const down = fire(-0.2)
    stepBullet(down, 0.1, [])
    expect(down.y).toBeCloseTo(BULLET_START_Y - 0.4)
  })

  it('clamps an extreme slope', () => {
    expect(clampSlope(99)).toBe(MAX_AIM_SLOPE)
    expect(clampSlope(-99)).toBe(-MAX_AIM_SLOPE)
    expect(clampSlope(NaN)).toBe(0)
  })

  it('a level shot hits a ground monster, a shot aimed high flies over it', () => {
    const level = fire(0)
    expect(stepBullet(level, 0.25, [target(5)]).hits).toHaveLength(1)
    const high = fire(1)
    expect(stepBullet(high, 0.25, [target(5)]).hits).toHaveLength(0)
  })

  it('a shot aimed up reaches a monster hovering high', () => {
    const b = fire(0.4) // 0.7 + 0.4 * 5 = 2.7 at 5 units out
    expect(stepBullet(b, 0.25, [target(5, 2, 3.6)]).hits).toHaveLength(1)
  })

  it('a bullet that sinks below the floor is spent', () => {
    expect(stepBullet(fire(-1), 0.2, []).alive).toBe(false)
  })

  it('targets without a vertical extent are still hit (old behaviour)', () => {
    const b = fire(0)
    expect(stepBullet(b, 0.25, [{ id: 'x', x: 0, z: 5, radius: 0.5 }]).hits).toHaveLength(1)
  })
})
