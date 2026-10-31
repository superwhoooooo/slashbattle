import { describe, expect, it } from 'vitest'
import { makeBullets, stepBullet } from '../src/logic/bullets.js'
import { WEAPONS } from '../src/logic/items.js'

const target = (id, x, z, radius = 0.5) => ({ id, x, z, radius })

describe('makeBullets', () => {
  it('fires one straight bullet from a pistol', () => {
    const [bullet, ...rest] = makeBullets(WEAPONS.pistol, { x: 1, z: 2, aimAngle: 0 })
    expect(rest).toHaveLength(0)
    expect(bullet.vx).toBeCloseTo(0)
    expect(bullet.vz).toBeCloseTo(WEAPONS.pistol.bullet.speed)
    expect(bullet.damage).toBe(WEAPONS.pistol.damage)
  })

  it('fans a shotgun into pellets centered on the aim', () => {
    const bullets = makeBullets(WEAPONS.shotgun, { x: 0, z: 0, aimAngle: 0 })
    expect(bullets).toHaveLength(WEAPONS.shotgun.pellets)
    const sideways = bullets.reduce((sum, b) => sum + b.vx, 0)
    expect(sideways).toBeCloseTo(0)
  })

  it('tags bullets with the weapon cause, defaulting to gun', () => {
    expect(makeBullets(WEAPONS.staff, { x: 0, z: 0, aimAngle: 0 })[0].cause).toBe('magic')
    expect(makeBullets(WEAPONS.pistol, { x: 0, z: 0, aimAngle: 0 })[0].cause).toBe('gun')
  })

  it('scales damage and knockback by the multipliers', () => {
    const [bullet] = makeBullets(WEAPONS.pistol, { x: 0, z: 0, aimAngle: 0, damageMultiplier: 2, knockbackMultiplier: 3 })
    expect(bullet.damage).toBe(WEAPONS.pistol.damage * 2)
    expect(bullet.knockback).toBeCloseTo(WEAPONS.pistol.knockback * 3)
  })
})

describe('stepBullet', () => {
  it('hits a monster in its path and is spent', () => {
    const [bullet] = makeBullets(WEAPONS.pistol, { x: 0, z: 0, aimAngle: 0 })
    const { alive, hits } = stepBullet(bullet, 0.1, [target('a', 0, 2.6)])
    expect(hits.map((h) => h.id)).toEqual(['a'])
    expect(alive).toBe(false)
  })

  it('misses a monster off to the side', () => {
    const [bullet] = makeBullets(WEAPONS.pistol, { x: 0, z: 0, aimAngle: 0 })
    const { alive, hits } = stepBullet(bullet, 0.1, [target('a', 5, 2.6)])
    expect(hits).toHaveLength(0)
    expect(alive).toBe(true)
  })

  it('pierces through a line of monsters, once each', () => {
    const [bullet] = makeBullets(WEAPONS.railgun, { x: 0, z: 0, aimAngle: 0 })
    const line = [target('a', 0, 3), target('b', 0, 3.2), target('c', 0, 3.4)]
    const first = stepBullet(bullet, 0.05, line)
    expect(first.hits).toHaveLength(3)
    expect(first.alive).toBe(true)
    expect(stepBullet(bullet, 0.001, line).hits).toHaveLength(0)
  })

  it('dies when its life runs out', () => {
    const [bullet] = makeBullets(WEAPONS.pistol, { x: 0, z: 0, aimAngle: 0 })
    expect(stepBullet(bullet, WEAPONS.pistol.bullet.life + 0.01, []).alive).toBe(false)
  })
})
