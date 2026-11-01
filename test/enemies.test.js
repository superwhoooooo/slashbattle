import { describe, expect, it } from 'vitest'
import { createPoison, enemyScale, predictPosition, smoothVelocity, stepPoison } from '../src/logic/enemies.js'
import { waveSize, waveSpawnInterval } from '../src/logic/waves.js'

describe('predictPosition', () => {
  it('leads a moving target and leaves a still one alone', () => {
    expect(predictPosition({ x: 1, z: 2 }, { x: 3, z: -2 }, 0.5)).toEqual({ x: 2.5, z: 1 })
    expect(predictPosition({ x: 1, z: 2 }, { x: 0, z: 0 }, 1)).toEqual({ x: 1, z: 2 })
  })
})

describe('smoothVelocity', () => {
  it('moves toward the measured velocity and ignores a frozen frame', () => {
    const v = smoothVelocity({ x: 0, z: 0 }, { x: 0, z: 0 }, { x: 1, z: 0 }, 0.5, 0.5)
    expect(v).toEqual({ x: 1, z: 0 })
    expect(smoothVelocity(v, { x: 0, z: 0 }, { x: 9, z: 9 }, 0)).toBe(v)
  })
})

describe('enemyScale', () => {
  it('starts at 1 and gets harder every wave, with speed and damage capped', () => {
    expect(enemyScale(1)).toEqual({ hp: 1, damage: 1, speed: 1 })
    for (let n = 1; n < 30; n++) expect(enemyScale(n + 1).hp).toBeGreaterThan(enemyScale(n).hp)
    expect(enemyScale(100).speed).toBe(1.5)
    expect(enemyScale(100).damage).toBe(2.5)
  })
})

describe('the waves ramp up', () => {
  it('has more enemies, arriving faster', () => {
    expect(waveSize(10)).toBeGreaterThanOrEqual(30)
    expect(waveSpawnInterval(10)).toBeLessThan(waveSpawnInterval(1) - 1)
  })
})

describe('stepPoison', () => {
  const player = { hidden: false, position: { x: 5, z: 5 } }
  const poison = () => createPoison({ sx: 0, sz: 0, x: 5, z: 5, flight: 1, radius: 2, life: 3, tick: 0.5, damage: 4 })

  it('flies, then lands, then ticks damage while you stand in it', () => {
    const p = poison()
    expect(stepPoison(p, 0.5, player, 0.35)).toEqual({ alive: true, hit: false })
    expect(p.phase).toBe('flying')
    stepPoison(p, 0.6, player, 0.35)
    expect(p.phase).toBe('puddle')
    let hits = 0
    for (let i = 0; i < 20; i++) if (stepPoison(p, 0.1, player, 0.35).hit) hits++
    expect(hits).toBe(4) // 2s in: ticks at 0.1, 0.6, 1.1, 1.6
  })

  it('spares a hidden or distant player and expires', () => {
    const p = poison()
    stepPoison(p, 1.1, player, 0.35)
    expect(stepPoison(p, 0.1, { hidden: true, position: player.position }, 0.35).hit).toBe(false)
    expect(stepPoison(p, 0.1, { hidden: false, position: { x: 50, z: 50 } }, 0.35).hit).toBe(false)
    expect(stepPoison(p, 4, player, 0.35).alive).toBe(false)
  })
})
