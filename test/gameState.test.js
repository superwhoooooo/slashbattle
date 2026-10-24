import { describe, expect, it } from 'vitest'
import { evaluateGameState } from '../src/logic/gameState.js'

describe('evaluateGameState', () => {
  it('is playing when the player is alive and monsters remain', () => {
    expect(evaluateGameState({ playerHp: 50, monstersRemaining: 2 })).toBe('playing')
  })

  it('is won when no monsters remain and the player is alive', () => {
    expect(evaluateGameState({ playerHp: 50, monstersRemaining: 0 })).toBe('won')
  })

  it('is lost when the player has no hp left', () => {
    expect(evaluateGameState({ playerHp: 0, monstersRemaining: 2 })).toBe('lost')
  })

  it('prioritizes lost over won when both happen on the same frame', () => {
    expect(evaluateGameState({ playerHp: 0, monstersRemaining: 0 })).toBe('lost')
  })
})
