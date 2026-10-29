import { describe, expect, it } from 'vitest'
import { canPlayVoice, createVoiceState, killVoiceForTrick, registerVoicePlay } from '../src/logic/sfx.js'

describe('killVoiceForTrick', () => {
  it('plays the ring-out slide whistle for a fall, boss or not', () => {
    expect(killVoiceForTrick('checkout')).toBe('ringOut')
    expect(killVoiceForTrick('vipCheckout')).toBe('ringOut')
  })

  it('plays the splash for a pool kill', () => {
    expect(killVoiceForTrick('cannonball')).toBe('cannonball')
  })

  it('falls back to the plain kill splat for every other trick', () => {
    expect(killVoiceForTrick('slash')).toBe('kill')
    expect(killVoiceForTrick('roomService')).toBe('kill')
    expect(killVoiceForTrick('turndownService')).toBe('kill')
    expect(killVoiceForTrick('wakeUpCall')).toBe('kill')
    expect(killVoiceForTrick('doNotDisturb')).toBe('kill')
  })
})

describe('createVoiceState', () => {
  it('starts with no voice ever played', () => {
    expect(canPlayVoice(createVoiceState(), 'crystal', 0)).toBe(true)
  })
})

describe('canPlayVoice / registerVoicePlay', () => {
  it('blocks a rate-limited voice (crystal) from retriggering immediately after', () => {
    let state = createVoiceState()
    expect(canPlayVoice(state, 'crystal', 10)).toBe(true)
    state = registerVoicePlay(state, 'crystal', 10)
    expect(canPlayVoice(state, 'crystal', 10.001)).toBe(false)
  })

  it('allows a rate-limited voice again once its minimum interval has passed', () => {
    let state = createVoiceState()
    state = registerVoicePlay(state, 'crystal', 10)
    expect(canPlayVoice(state, 'crystal', 10.2)).toBe(true)
  })

  it('does not mutate the state passed in', () => {
    const state = createVoiceState()
    registerVoicePlay(state, 'crystal', 10)
    expect(state).toEqual(createVoiceState())
  })

  it('never rate-limits a voice with no configured minimum interval', () => {
    let state = createVoiceState()
    state = registerVoicePlay(state, 'swing', 5)
    expect(canPlayVoice(state, 'swing', 5)).toBe(true)
  })
})
