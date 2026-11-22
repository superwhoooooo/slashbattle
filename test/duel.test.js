import { describe, expect, it } from 'vitest'
import { DUEL_MAX_HIT, DUEL_ROUNDS_TO_WIN, DUEL_ROUND_PAUSE, DUEL_MATCH_PAUSE, canHit, createDuel, duelDamage, duelScoreText, duelSpawn, scoreKo, stepDuel } from '../src/logic/duel.js'
import { COOP_MODES, cleanMode } from '../src/logic/coop.js'

describe('1v1 duel rules', () => {
  it('is a co-op mode', () => {
    expect(COOP_MODES).toContain('duel')
    expect(cleanMode('duel')).toBe('duel')
  })

  it('softens hits and caps them, so nobody is one-shot', () => {
    expect(duelDamage(10)).toBeLessThan(10)
    expect(duelDamage(10)).toBeGreaterThan(0)
    expect(duelDamage(100000)).toBe(DUEL_MAX_HIT)
    expect(duelDamage(-5)).toBe(0)
    expect(duelDamage('nope')).toBe(0)
  })

  it('scores a knockout, pauses, then starts the next round', () => {
    let d = createDuel()
    expect(canHit(d)).toBe(true)
    d = scoreKo(d, true, 10)
    expect(d).toMatchObject({ me: 1, them: 0, phase: 'between' })
    expect(canHit(d)).toBe(false)
    expect(scoreKo(d, true, 10.5)).toBe(d) // a second report of the same knockout changes nothing
    expect(stepDuel(d, 10 + DUEL_ROUND_PAUSE - 0.1).reset).toBe(false)
    const next = stepDuel(d, 10 + DUEL_ROUND_PAUSE)
    expect(next.reset).toBe(true)
    expect(next.duel).toMatchObject({ phase: 'fight', round: 2, me: 1 })
  })

  it('ends the match at the winning score and starts a fresh one', () => {
    let d = createDuel()
    let t = 0
    for (let i = 0; i < DUEL_ROUNDS_TO_WIN; i++) {
      d = scoreKo(d, false, t)
      if (d.phase === 'between') d = stepDuel(d, (t += DUEL_ROUND_PAUSE)).duel
    }
    expect(d).toMatchObject({ phase: 'over', winner: 'them', them: DUEL_ROUNDS_TO_WIN })
    expect(duelScoreText(d, 'BENJI')).toContain('BENJI WINS')
    const fresh = stepDuel(d, t + DUEL_MATCH_PAUSE)
    expect(fresh.reset).toBe(true)
    expect(fresh.duel).toEqual(createDuel())
  })

  it('puts the two players on opposite sides, facing each other', () => {
    const a = duelSpawn(true)
    const b = duelSpawn(false)
    expect(a.x).toBe(-b.x)
    expect(Math.sin(a.facing)).toBeCloseTo(1) // facing +x, toward the guest
    expect(Math.sin(b.facing)).toBeCloseTo(-1)
  })
})
