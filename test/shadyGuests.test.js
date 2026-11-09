import { describe, expect, it } from 'vitest'
import {
  BANDIT,
  BURROW,
  SNIPE,
  beamHits,
  createBurrowState,
  createSnipeState,
  crystalChange,
  fleeTarget,
  isBurrowed,
  leakAmount,
  refundWithTip,
  shadyWeights,
  snipeAim,
  stealAmount,
  stepBurrow,
  stepSnipe,
} from '../src/logic/shadyGuests.js'
import { pickMonsterType, scoreForKill } from '../src/logic/waves.js'
import { nameTrick } from '../src/logic/tricks.js'
import { MONSTER_TYPES } from '../src/config.js'

describe('shady guests: registration', () => {
  it('adds the three types to MONSTER_TYPES with a behavior', () => {
    expect(MONSTER_TYPES.paparazzo.behavior).toBe('snipe')
    expect(MONSTER_TYPES.gopher.behavior).toBe('burrow')
    expect(MONSTER_TYPES.bandit.behavior).toBe('bandit')
  })
  it('unlocks gophers at wave 4, paparazzi at 5, bandits at 6', () => {
    expect(shadyWeights(3)).toEqual({})
    expect(Object.keys(shadyWeights(4))).toEqual(['gopher'])
    expect(Object.keys(shadyWeights(5)).sort()).toEqual(['gopher', 'paparazzo'])
    expect(Object.keys(shadyWeights(6)).sort()).toEqual(['bandit', 'gopher', 'paparazzo'])
  })
  it('can actually be picked by the wave controller', () => {
    const seen = new Set()
    let seed = 1
    const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    for (let i = 0; i < 4000; i++) seen.add(pickMonsterType(10, rng))
    for (const id of ['paparazzo', 'gopher', 'bandit']) expect(seen.has(id), id).toBe(true)
  })
  it('scores a kill of each', () => {
    for (const id of ['paparazzo', 'gopher', 'bandit']) expect(scoreForKill(id)).toBeGreaterThan(0)
  })
})

describe('paparazzo', () => {
  it('cycles cool -> aim -> lock -> fire -> cool', () => {
    let s = createSnipeState()
    let r = stepSnipe(s, SNIPE.firstDelay + 0.01)
    expect(r.state.phase).toBe('aim')
    r = stepSnipe(r.state, SNIPE.aim + 0.01)
    expect(r.state.phase).toBe('lock')
    expect(r.fire).toBe(false)
    r = stepSnipe(r.state, SNIPE.lock + 0.01)
    expect(r.fire).toBe(true)
    expect(r.state).toEqual({ phase: 'cool', t: SNIPE.cooldown })
  })
  it('leads a moving target', () => {
    // Player straight ahead (+z), running along +x: the aim swings toward +x.
    const aim = snipeAim({ x: 0, z: 0 }, { x: 0, z: 10 }, { x: 4, z: 0 }, 0.5)
    expect(aim).toBeGreaterThan(0.1)
    expect(snipeAim({ x: 0, z: 0 }, { x: 0, z: 10 }, { x: 0, z: 0 })).toBeCloseTo(0)
  })
  it('beam hits only forward, along its length and within its width', () => {
    const o = { x: 0, z: 0 }
    expect(beamHits(o, 0, 20, 0.7, { x: 0.5, z: 10 })).toBe(true)
    expect(beamHits(o, 0, 20, 0.7, { x: 1.5, z: 10 })).toBe(false)
    expect(beamHits(o, 0, 20, 0.7, { x: 1.5, z: 10 }, 1)).toBe(true) // a fat target
    expect(beamHits(o, 0, 20, 0.7, { x: 0, z: -5 })).toBe(false) // behind
    expect(beamHits(o, 0, 20, 0.7, { x: 0, z: 25 })).toBe(false) // past the end
    expect(beamHits(o, Math.PI / 2, 20, 0.7, { x: 10, z: 0 })).toBe(true)
  })
})

describe('gopher', () => {
  const run = (state, dt, ctx) => stepBurrow(state, dt, ctx)
  it('digs in once engaged and its timer is up, then tunnels out of reach', () => {
    let r = run(createBurrowState(), BURROW.firstDelay + 0.01, { engaged: true, distance: 8 })
    expect(r.event).toBe('dig')
    expect(isBurrowed(r.state)).toBe(true)
  })
  it('stays up while not engaged, or when already right next to you', () => {
    expect(run(createBurrowState(), 5, { engaged: false, distance: 8 }).event).toBe(null)
    expect(run(createBurrowState(), 5, { engaged: true, distance: 1 }).event).toBe(null)
  })
  it('marks the spot once under you, erupts after the warning, then sits dazed', () => {
    let r = run({ phase: 'under', t: 3 }, 0.1, { engaged: true, distance: 0.5 })
    expect(r.event).toBe('mark')
    expect(isBurrowed(r.state)).toBe(true)
    r = run(r.state, BURROW.warn + 0.01, { engaged: true, distance: 3 })
    expect(r.event).toBe('erupt')
    expect(r.state.phase).toBe('dazed')
    expect(isBurrowed(r.state)).toBe(false)
    r = run(r.state, BURROW.dazed + 0.01, { engaged: true, distance: 3 })
    expect(r.state.phase).toBe('up')
  })
  it('comes up wherever it got to when it runs out of time', () => {
    expect(run({ phase: 'under', t: 0.05 }, 0.1, { engaged: true, distance: 9 }).event).toBe('mark')
  })
  it('surfaces quietly if you hide while it tunnels', () => {
    const r = run({ phase: 'under', t: 3 }, 0.1, { engaged: false, distance: 5 })
    expect(r.event).toBe('surface')
    expect(r.state.phase).toBe('up')
  })
})

describe('bellhop bandit', () => {
  it('steals a share, at least a few, never more than you have, capped', () => {
    expect(stealAmount(0)).toBe(0)
    expect(stealAmount(2)).toBe(2)
    expect(stealAmount(5)).toBe(BANDIT.stealMin)
    expect(stealAmount(50)).toBe(15)
    expect(stealAmount(10000)).toBe(BANDIT.stealMax)
  })
  it('leaks at least one per hit and never more than it holds', () => {
    expect(leakAmount(0)).toBe(0)
    expect(leakAmount(1)).toBe(1)
    expect(leakAmount(20)).toBe(4)
  })
  it('pays the sack back with a tip', () => {
    expect(refundWithTip(0)).toBe(0)
    expect(refundWithTip(20)).toBe(25)
  })
  it('makes change in 5s, 2s and 1s', () => {
    expect(crystalChange(13)).toEqual([5, 5, 2, 1])
    expect(crystalChange(13).reduce((a, b) => a + b, 0)).toBe(13)
    expect(crystalChange(0)).toEqual([])
  })
  it('flees straight away from the player, and along the edge when cornered', () => {
    const away = fleeTarget({ x: 0, z: 0 }, { x: 0, z: -3 }, 48)
    expect(away.z).toBeGreaterThan(5)
    const edge = fleeTarget({ x: 0, z: 44 }, { x: 0, z: 40 }, 48, 2)
    expect(Math.hypot(edge.x, edge.z)).toBeLessThanOrEqual(46 + 1e-9)
    expect(Math.abs(edge.x)).toBeGreaterThan(3) // sliding sideways, not into the void
  })
})

describe('tricks', () => {
  it('names a flash kill and a dazed-gopher kill', () => {
    expect(nameTrick({ cause: 'photobomb' }).id).toBe('photobomb')
    expect(nameTrick({ cause: 'sword', whacked: true }).name).toBe('Whack-a-Mole')
    expect(nameTrick({ cause: 'fall', whacked: false }).id).toBe('checkout')
  })
})
