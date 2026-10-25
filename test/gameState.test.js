import { describe, expect, it } from 'vitest'
import { evaluateGameState } from '../src/logic/gameState.js'

describe('evaluateGameState', () => {
  it('is playing while the player is alive', () => {
    expect(evaluateGameState({ playerHp: 50 })).toBe('playing')
  })

  it('is lost when the player has no hp left', () => {
    expect(evaluateGameState({ playerHp: 0 })).toBe('lost')
  })

  it('is lost when the player hp drops below zero', () => {
    expect(evaluateGameState({ playerHp: -5 })).toBe('lost')
  })
})
