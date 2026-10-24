import { describe, expect, it } from 'vitest'
import {
  AMBUSH_DAMAGE_MULTIPLIER,
  applyDamage,
  computeDamage,
  createCooldown,
  isInAttackArc,
  knockbackVector,
} from '../src/logic/combat.js'

describe('isInAttackArc', () => {
  const attackerPos = { x: 0, z: 0 }

  it('is true for a target directly in front, within range and arc', () => {
    expect(isInAttackArc(attackerPos, 0, { x: 0, z: 2 }, 3, Math.PI / 2)).toBe(true)
  })

  it('is false for a target directly behind, outside the arc', () => {
    expect(isInAttackArc(attackerPos, 0, { x: 0, z: -2 }, 3, Math.PI / 2)).toBe(false)
  })

  it('is false for a target in front but outside range', () => {
    expect(isInAttackArc(attackerPos, 0, { x: 0, z: 10 }, 3, Math.PI / 2)).toBe(false)
  })

  it('treats the range boundary as inclusive', () => {
    expect(isInAttackArc(attackerPos, 0, { x: 0, z: 3 }, 3, Math.PI / 2)).toBe(true)
    expect(isInAttackArc(attackerPos, 0, { x: 0, z: 3.01 }, 3, Math.PI / 2)).toBe(false)
  })

  it('handles the angle wrap case near the -PI/PI seam', () => {
    // Facing just below +PI and a target just above -PI are close together
    // going the short way around the seam. A naive (non-normalized) angle
    // difference would be about 6.1 radians and wrongly reject this.
    const facing = Math.PI - 0.1
    const targetAngle = -Math.PI + 0.05
    const distance = 1
    const targetPos = {
      x: attackerPos.x + Math.sin(targetAngle) * distance,
      z: attackerPos.z + Math.cos(targetAngle) * distance,
    }
    expect(isInAttackArc(attackerPos, facing, targetPos, 5, Math.PI / 2)).toBe(true)
  })
})

describe('applyDamage', () => {
  it('subtracts the amount from hp', () => {
    expect(applyDamage({ hp: 50 }, 20)).toEqual({ hp: 30, lethal: false })
  })

  it('clamps hp at 0 when the hit would reduce it below 0', () => {
    expect(applyDamage({ hp: 10 }, 999)).toEqual({ hp: 0, lethal: true })
  })

  it('reports lethal when the hit brings hp to exactly 0', () => {
    expect(applyDamage({ hp: 20 }, 20)).toEqual({ hp: 0, lethal: true })
  })

  it('does not mutate the entity passed in', () => {
    const entity = { hp: 50 }
    applyDamage(entity, 20)
    expect(entity.hp).toBe(50)
  })
})

describe('knockbackVector', () => {
  it('points from the attacker toward the target, scaled by strength', () => {
    const result = knockbackVector({ x: 0, z: 0 }, { x: 3, z: 0 }, 2)
    expect(result.x).toBeCloseTo(2)
    expect(result.z).toBeCloseTo(0)
  })

  it('returns a zero vector when the positions coincide', () => {
    expect(knockbackVector({ x: 1, z: 1 }, { x: 1, z: 1 }, 5)).toEqual({ x: 0, z: 0 })
  })
})

describe('createCooldown', () => {
  it('is ready before the first trigger', () => {
    const cooldown = createCooldown(1)
    expect(cooldown.ready(0)).toBe(true)
  })

  it('is not ready until the cooldown duration has passed since trigger', () => {
    const cooldown = createCooldown(1)
    cooldown.trigger(10)
    expect(cooldown.ready(10.5)).toBe(false)
    expect(cooldown.ready(11)).toBe(true)
  })
})

describe('computeDamage', () => {
  it('defaults to the base amount with no ambush bonus', () => {
    expect(computeDamage(10)).toBe(10)
    expect(computeDamage(10, { ambush: false })).toBe(10)
  })

  it('applies the ambush multiplier when ambush is true', () => {
    expect(computeDamage(10, { ambush: true })).toBe(10 * AMBUSH_DAMAGE_MULTIPLIER)
  })
})
