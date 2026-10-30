import { describe, expect, it } from 'vitest'
import { carpetLengthFraction } from '../src/logic/carpet.js'

describe('carpetLengthFraction', () => {
  it('starts at 0 and reaches 1 exactly at the duration', () => {
    expect(carpetLengthFraction(0, 2)).toBe(0)
    expect(carpetLengthFraction(2, 2)).toBeCloseTo(1)
  })

  it('never exceeds 1 past the duration', () => {
    expect(carpetLengthFraction(10, 2)).toBe(1)
  })

  it('clamps negative elapsed to 0', () => {
    expect(carpetLengthFraction(-1, 2)).toBe(0)
  })

  it('grows monotonically in between', () => {
    const a = carpetLengthFraction(0.5, 2)
    const b = carpetLengthFraction(1, 2)
    const c = carpetLengthFraction(1.5, 2)
    expect(a).toBeLessThan(b)
    expect(b).toBeLessThan(c)
  })
})
