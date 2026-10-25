import { describe, expect, it } from 'vitest'
import { stepFall } from '../src/logic/falling.js'

describe('stepFall', () => {
  const gravity = 10

  it('accelerates downward from rest', () => {
    const result = stepFall({ velocityY: 0, fallenY: 0 }, 1, gravity)
    expect(result.velocityY).toBe(10)
    expect(result.fallenY).toBe(10)
  })

  it('keeps accelerating and accumulating fall distance over repeated ticks', () => {
    let fall = { velocityY: 0, fallenY: 0 }
    fall = stepFall(fall, 0.5, gravity) // velocityY 5, fallenY 2.5
    fall = stepFall(fall, 0.5, gravity) // velocityY 10, fallenY 2.5 + 5 = 7.5
    expect(fall.velocityY).toBeCloseTo(10)
    expect(fall.fallenY).toBeCloseTo(7.5)
  })

  it('does not mutate the fall state passed in', () => {
    const fall = { velocityY: 0, fallenY: 0 }
    stepFall(fall, 1, gravity)
    expect(fall).toEqual({ velocityY: 0, fallenY: 0 })
  })
})
