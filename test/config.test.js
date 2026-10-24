import { describe, expect, it } from 'vitest'
import { MONSTER_TYPES } from '../src/config.js'

describe('MONSTER_TYPES', () => {
  it('gives every monster type a positive size, speed, hp, and damage', () => {
    for (const stats of Object.values(MONSTER_TYPES)) {
      expect(stats.size).toBeGreaterThan(0)
      expect(stats.speed).toBeGreaterThan(0)
      expect(stats.hp).toBeGreaterThan(0)
      expect(stats.damage).toBeGreaterThan(0)
    }
  })
})
