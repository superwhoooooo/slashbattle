import { describe, expect, it } from 'vitest'
import { canEnterBox, findNearestBox, isAmbushActive } from '../src/logic/hiding.js'

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
