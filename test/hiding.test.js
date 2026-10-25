import { describe, expect, it } from 'vitest'
import {
  canEnterBox,
  ejectPenalty,
  findNearestBox,
  hideTimeRemaining,
  isAmbushActive,
  pickExitPoint,
  shouldEject,
} from '../src/logic/hiding.js'

describe('findNearestBox', () => {
  const playerPos = { x: 0, z: 0 }

  it('returns the nearest box within range', () => {
    const boxes = [
      { position: { x: 3, z: 0 } },
      { position: { x: 1, z: 0 } },
      { position: { x: 2, z: 0 } },
    ]
    expect(findNearestBox(playerPos, boxes, 5)).toBe(boxes[1])
  })

  it('returns null when every box is out of range', () => {
    const boxes = [{ position: { x: 10, z: 0 } }, { position: { x: -10, z: 0 } }]
    expect(findNearestBox(playerPos, boxes, 5)).toBeNull()
  })

  it('returns null for an empty list', () => {
    expect(findNearestBox(playerPos, [], 5)).toBeNull()
  })
})

describe('canEnterBox', () => {
  const box = { position: { x: 1, z: 0 }, occupied: false }
  const alivePlayer = { hp: 50, hidden: false, position: { x: 0, z: 0 } }

  it('is false when the player is not alive', () => {
    expect(canEnterBox({ ...alivePlayer, hp: 0 }, box, 2)).toBe(false)
  })

  it('is false when the player is already hidden', () => {
    expect(canEnterBox({ ...alivePlayer, hidden: true }, box, 2)).toBe(false)
  })

  it('is false when the box is already occupied', () => {
    expect(canEnterBox(alivePlayer, { ...box, occupied: true }, 2)).toBe(false)
  })

  it('is false when the box is out of range', () => {
    expect(canEnterBox(alivePlayer, box, 0.5)).toBe(false)
  })

  it('is true when alive, not hidden, the box is free, and in range', () => {
    expect(canEnterBox(alivePlayer, box, 2)).toBe(true)
  })
})

describe('pickExitPoint', () => {
  it('lands just outside the box, in the facing direction', () => {
    const point = pickExitPoint({ x: 0, z: 0 }, 1, 0, 16, 0.3)
    // Facing angle 0 points toward +Z.
    expect(point.x).toBeCloseTo(0)
    expect(point.z).toBeCloseTo(1.3)
  })

  it('lands outside the box circle for a sideways facing angle too', () => {
    const point = pickExitPoint({ x: 2, z: 2 }, 1, Math.PI / 2, 16, 0.3)
    const distance = Math.hypot(point.x - 2, point.z - 2)
    expect(distance).toBeCloseTo(1.3)
  })

  it('is pulled back onto the platform when it would otherwise land past the edge', () => {
    const point = pickExitPoint({ x: 0, z: 15 }, 1, 0, 16, 0.3)
    expect(Math.hypot(point.x, point.z)).toBeLessThanOrEqual(16 + 1e-9)
  })
})

describe('isAmbushActive', () => {
  it('is true while inside the ambush window', () => {
    expect(isAmbushActive(10.5, 10, 1)).toBe(true)
  })

  it('is true exactly at the edge of the window', () => {
    expect(isAmbushActive(11, 10, 1)).toBe(true)
  })

  it('is false once the window has passed', () => {
    expect(isAmbushActive(11.01, 10, 1)).toBe(false)
  })

  it('is false when the player has never exited a box', () => {
    expect(isAmbushActive(10.5, null, 1)).toBe(false)
    expect(isAmbushActive(10.5, undefined, 1)).toBe(false)
  })
})

describe('hideTimeRemaining', () => {
  it('counts down linearly as time passes', () => {
    expect(hideTimeRemaining(0, 0, 10)).toBe(10)
    expect(hideTimeRemaining(0, 4, 10)).toBe(6)
    expect(hideTimeRemaining(5, 8, 10)).toBe(7)
  })

  it('clamps at 0 rather than going negative once past the limit', () => {
    expect(hideTimeRemaining(0, 15, 10)).toBe(0)
    expect(hideTimeRemaining(0, 10, 10)).toBe(0)
  })
})

describe('shouldEject', () => {
  it('is false before the limit', () => {
    expect(shouldEject(0, 9.99, 10)).toBe(false)
  })

  it('is true exactly at the limit', () => {
    expect(shouldEject(0, 10, 10)).toBe(true)
  })

  it('is true after the limit', () => {
    expect(shouldEject(0, 12, 10)).toBe(true)
  })
})

describe('ejectPenalty', () => {
  it('is the given fraction of max HP', () => {
    expect(ejectPenalty(100, 0.1)).toBe(10)
    expect(ejectPenalty(100, 0.5)).toBe(50)
  })
})
