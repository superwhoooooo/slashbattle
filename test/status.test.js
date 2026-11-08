import { describe, expect, it } from 'vitest'
import { applyFreeze, applySlow, BOSS_FREEZE_SLOW, isFrozen, statusTimeScale, TIME_WARP_FACTOR } from '../src/logic/status.js'

describe('freeze and slow', () => {
  it('freezes a normal monster solid for the duration', () => {
    const ai = {}
    expect(applyFreeze(ai, 10, 3)).toBe('frozen')
    expect(isFrozen(ai, 12.9)).toBe(true)
    expect(isFrozen(ai, 13.1)).toBe(false)
    expect(statusTimeScale(ai, 11)).toBe(0)
    expect(statusTimeScale(ai, 14)).toBe(1)
  })

  it('never shortens a freeze already running', () => {
    const ai = {}
    applyFreeze(ai, 10, 5)
    applyFreeze(ai, 11, 1)
    expect(isFrozen(ai, 14.5)).toBe(true)
  })

  it('slows a boss instead of freezing it', () => {
    const boss = { isBoss: true }
    expect(applyFreeze(boss, 0, 2)).toBe('slowed')
    expect(isFrozen(boss, 1)).toBe(false)
    expect(statusTimeScale(boss, 1)).toBe(BOSS_FREEZE_SLOW)
    expect(statusTimeScale(boss, 3)).toBe(1)
  })

  it('keeps the stronger of two overlapping slows', () => {
    const ai = {}
    applySlow(ai, 0, 4, 0.6)
    applySlow(ai, 1, 2, 0.3)
    expect(statusTimeScale(ai, 2)).toBe(0.3)
    expect(statusTimeScale(ai, 3.5)).toBe(0.3) // slowUntil extends to the later end (4)
    expect(statusTimeScale(ai, 4.5)).toBe(1)
  })

  it('applies Time Warp arena-wide, and the slowest effect wins', () => {
    const ai = {}
    expect(statusTimeScale(ai, 5, 8)).toBe(TIME_WARP_FACTOR)
    expect(statusTimeScale(ai, 9, 8)).toBe(1)
    applySlow(ai, 5, 2, 0.2)
    expect(statusTimeScale(ai, 6, 8)).toBe(0.2)
    applyFreeze(ai, 5, 2)
    expect(statusTimeScale(ai, 6, 8)).toBe(0)
  })
})
