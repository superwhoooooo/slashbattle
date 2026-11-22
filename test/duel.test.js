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

describe('duel stakes and deck', async () => {
  const duelMod = await import('../src/logic/duel.js')
  const { CENTER_CLEARANCE } = await import('../src/logic/resortLayout.js')
  const { NO_STAKE, awardStake, cleanStake, ownsStake, stakeLabel, stakeLocked, stakeOptions, DUEL_RADIUS, DUEL_SPEED, DUEL_SPAWN_DISTANCE } = duelMod
  const host = { bank: 600, heroesOwned: ['plague'], collection: ['ember'] }

  it('is a smaller, slower fight, starting clear of the props', () => {
    expect(DUEL_RADIUS).toBeLessThan(48)
    expect(DUEL_SPEED).toBeLessThan(1)
    expect(DUEL_SPAWN_DISTANCE).toBeLessThan(CENTER_CLEARANCE)
  })

  it('offers only what the host owns', () => {
    const opts = stakeOptions(host)
    expect(opts[0]).toEqual(NO_STAKE)
    expect(opts).toContainEqual({ kind: 'crystals', amount: 500 })
    expect(opts).not.toContainEqual({ kind: 'crystals', amount: 1000 })
    expect(opts).toContainEqual({ kind: 'hero', id: 'plague' })
    expect(opts).toContainEqual({ kind: 'pet', id: 'ember' })
    expect(ownsStake(host, { kind: 'hero', id: 'plague' })).toBe(true)
    expect(ownsStake(host, { kind: 'hero', id: 'shiro' })).toBe(false)
    expect(ownsStake(host, { kind: 'hero', id: 'nope' })).toBe(false)
    expect(ownsStake(host, NO_STAKE)).toBe(true)
    expect(stakeLabel({ kind: 'hero', id: 'plague' })).toBe('the hero Plague Doctor')
  })

  it('cleans stakes from the network', () => {
    expect(cleanStake({ kind: 'hero', id: 'nope' })).toEqual(NO_STAKE)
    expect(cleanStake({ kind: 'crystals', amount: 999999 })).toEqual(NO_STAKE)
    expect(cleanStake({ kind: 'hero', id: 'guest' })).toEqual(NO_STAKE)
    expect(cleanStake(null)).toEqual(NO_STAKE)
  })

  it('gives the winner a copy', () => {
    const guest = { bank: 10, heroesOwned: [], collection: [] }
    expect(awardStake(guest, { kind: 'hero', id: 'plague' }).profile.heroesOwned).toEqual(['plague'])
    expect(awardStake(guest, { kind: 'pet', id: 'ember' }).profile.collection).toEqual(['ember'])
    expect(awardStake(guest, { kind: 'crystals', amount: 250 }).profile.bank).toBe(260)
    const again = awardStake({ ...guest, heroesOwned: ['plague'] }, { kind: 'hero', id: 'plague' })
    expect(again.gained).toBe(false)
  })

  it('locks the stake once a round is scored, until the match ends', () => {
    let d = duelMod.createDuel()
    expect(stakeLocked(d)).toBe(false)
    d = duelMod.scoreKo(d, true, 0)
    expect(stakeLocked(d)).toBe(true)
    d = { ...d, phase: 'over' }
    expect(stakeLocked(d)).toBe(false)
  })
})
