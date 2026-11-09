import { describe, expect, it } from 'vitest'
import { createBulletPool, fireBullets, updateBullets } from '../src/bullets.js'
import { makeBullets } from '../src/logic/bullets.js'
import { WEAPONS } from '../src/logic/items.js'

const opts = { monsters: [], obstacles: [], particleSystem: null, hitstop: null, arenaRadius: 500 }
const worldY = (pool, slot) => slot.mesh.position.y + pool.group.position.y

describe('bullets and the jump layer', () => {
  it('a bullet stays at the height it was fired from while the layer rises with your jump', () => {
    const pool = createBulletPool()
    pool.group.position.y = 0
    fireBullets(pool, makeBullets(WEAPONS.staff, { x: 0, z: 0, aimAngle: 0 }))
    const slot = pool.slots.find((s) => s.active)
    updateBullets(pool, 1 / 60, opts)
    const before = worldY(pool, slot)
    pool.group.position.y = 2.7 // you jump: the layer rides up with you
    updateBullets(pool, 1 / 60, opts)
    expect(worldY(pool, slot)).toBeCloseTo(before, 5)
    pool.group.position.y = 0 // ...and land again
    updateBullets(pool, 1 / 60, opts)
    expect(worldY(pool, slot)).toBeCloseTo(before, 5)
  })

  it('a bullet fired mid-jump leaves from your height and keeps it', () => {
    const pool = createBulletPool()
    pool.group.position.y = 2
    fireBullets(pool, makeBullets(WEAPONS.staff, { x: 0, z: 0, aimAngle: 0 }))
    const slot = pool.slots.find((s) => s.active)
    updateBullets(pool, 1 / 60, opts)
    expect(worldY(pool, slot)).toBeGreaterThan(2.5)
    pool.group.position.y = 0 // you land: it keeps flying up there, not dragged down with you
    updateBullets(pool, 1 / 60, opts)
    expect(slot.active).toBe(true)
    expect(worldY(pool, slot)).toBeGreaterThan(2.5)
  })
})
