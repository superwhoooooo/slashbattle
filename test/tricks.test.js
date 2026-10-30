import { describe, expect, it } from 'vitest'
import { CHAIN_MAX, CHAIN_STEP, CHAIN_WINDOW } from '../src/config.js'
import { createChainState, hasChainExpired, nameTrick, stepChain, trickPoints } from '../src/logic/tricks.js'

describe('nameTrick', () => {
  it('names a plain sword hit "Slash"', () => {
    expect(nameTrick({ cause: 'sword' })).toEqual({ id: 'slash', name: 'Slash' })
  })

  it('names a fall "Checkout"', () => {
    expect(nameTrick({ cause: 'fall' })).toEqual({ id: 'checkout', name: 'Checkout' })
  })

  it('names a kill on a monster standing in a pool "Cannonball"', () => {
    expect(nameTrick({ cause: 'sword', inPool: true })).toEqual({ id: 'cannonball', name: 'Cannonball' })
  })

  it('names an ambush kill "Room Service"', () => {
    expect(nameTrick({ cause: 'sword', ambush: true })).toEqual({ id: 'roomService', name: 'Room Service' })
  })

  it('names a pet-zap kill "Turndown Service"', () => {
    expect(nameTrick({ cause: 'pet' })).toEqual({ id: 'turndownService', name: 'Turndown Service' })
  })

  it('names a Shockwave kill "Wake-Up Call"', () => {
    expect(nameTrick({ cause: 'shockwave' })).toEqual({ id: 'wakeUpCall', name: 'Wake-Up Call' })
  })

  it('names a boss kill that fell "VIP Checkout"', () => {
    expect(nameTrick({ cause: 'fall', boss: true })).toEqual({ id: 'vipCheckout', name: 'VIP Checkout' })
  })

  it('names any other boss kill "Do Not Disturb"', () => {
    expect(nameTrick({ cause: 'sword', boss: true })).toEqual({ id: 'doNotDisturb', name: 'Do Not Disturb' })
  })

  it('fall beats pool when a monster falls while standing in one', () => {
    expect(nameTrick({ cause: 'fall', inPool: true })).toEqual({ id: 'checkout', name: 'Checkout' })
  })

  it('pool beats ambush when both apply', () => {
    expect(nameTrick({ cause: 'sword', inPool: true, ambush: true })).toEqual({ id: 'cannonball', name: 'Cannonball' })
  })

  it('boss precedence beats fall, pool, and ambush all at once except its own fell variant', () => {
    expect(nameTrick({ cause: 'sword', inPool: true, ambush: true, boss: true })).toEqual({
      id: 'doNotDisturb',
      name: 'Do Not Disturb',
    })
    expect(nameTrick({ cause: 'fall', inPool: true, ambush: true, boss: true })).toEqual({
      id: 'vipCheckout',
      name: 'VIP Checkout',
    })
  })

  it('defaults every flag to falsy, landing on "Slash" with no args', () => {
    expect(nameTrick()).toEqual({ id: 'slash', name: 'Slash' })
  })
})

describe('createChainState', () => {
  it('starts at count 0, multiplier 1x, and already expired', () => {
    const state = createChainState()
    expect(state.count).toBe(0)
    expect(state.multiplier).toBe(1)
    expect(hasChainExpired(state, 0)).toBe(true)
  })
})

describe('stepChain', () => {
  it('starts a fresh chain of 1 at 1x on the first kill', () => {
    const state = stepChain(createChainState(), 10)
    expect(state.count).toBe(1)
    expect(state.multiplier).toBe(1)
  })

  it('extends the chain and grows the multiplier for kills within CHAIN_WINDOW', () => {
    let state = stepChain(createChainState(), 0)
    state = stepChain(state, CHAIN_WINDOW * 0.5)
    expect(state.count).toBe(2)
    expect(state.multiplier).toBe(1 + CHAIN_STEP)

    state = stepChain(state, CHAIN_WINDOW)
    expect(state.count).toBe(3)
    expect(state.multiplier).toBe(1 + CHAIN_STEP * 2)
  })

  it('caps the multiplier at CHAIN_MAX no matter how long the chain gets', () => {
    let state = createChainState()
    let now = 0
    for (let i = 0; i < 20; i++) {
      state = stepChain(state, now)
      now += CHAIN_WINDOW * 0.1
    }
    expect(state.multiplier).toBe(CHAIN_MAX)
  })

  it('resets to a fresh chain of 1 once more than CHAIN_WINDOW seconds pass', () => {
    let state = stepChain(createChainState(), 0)
    state = stepChain(state, CHAIN_WINDOW * 0.5)
    expect(state.count).toBe(2)

    state = stepChain(state, state.lastKillAt + CHAIN_WINDOW + 0.01)
    expect(state.count).toBe(1)
    expect(state.multiplier).toBe(1)
  })

  it('does not mutate the state object passed in', () => {
    const before = createChainState()
    const snapshot = { ...before }
    stepChain(before, 5)
    expect(before).toEqual(snapshot)
  })
})

describe('hasChainExpired', () => {
  it('is false right up to CHAIN_WINDOW seconds after the last kill, true just past it', () => {
    const state = stepChain(createChainState(), 0)
    expect(hasChainExpired(state, CHAIN_WINDOW)).toBe(false)
    expect(hasChainExpired(state, CHAIN_WINDOW + 0.01)).toBe(true)
  })

  it('does not mutate the state object passed in', () => {
    const state = stepChain(createChainState(), 0)
    const snapshot = { ...state }
    hasChainExpired(state, CHAIN_WINDOW + 5)
    expect(state).toEqual(snapshot)
  })
})

describe('trickPoints', () => {
  it('multiplies and rounds to the nearest integer', () => {
    expect(trickPoints(100, 1)).toBe(100)
    expect(trickPoints(100, 1.5)).toBe(150)
    expect(trickPoints(75, 2.5)).toBe(188)
    expect(trickPoints(33, 1.5)).toBe(50)
  })
})
