import { describe, expect, it } from 'vitest'
import { BOSS_VOICES, babbleFor, newestBlip, voiceFor } from '../src/logic/bossVoice.js'
import { BOSSES } from '../src/logic/bosses.js'

describe('boss voices', () => {
  it('gives every boss and the concierge a voice of their own', () => {
    const list = Array.isArray(BOSSES) ? BOSSES : Object.values(BOSSES)
    for (const boss of list) expect(BOSS_VOICES[boss.id], boss.id).toBeTruthy()
    expect(BOSS_VOICES.concierge).toBeTruthy()
    const sigs = new Set(Object.values(BOSS_VOICES).map((v) => JSON.stringify(v)))
    expect(sigs.size).toBe(Object.keys(BOSS_VOICES).length)
  })

  it('falls back to a stable made-up voice', () => {
    expect(voiceFor('boss_new')).toEqual(voiceFor('boss_new'))
    expect(voiceFor('boss_new').base).toBeGreaterThan(0)
  })

  it('blips on every other letter, never on spaces or punctuation, and the same letter always sounds the same', () => {
    const v = BOSS_VOICES.boss_gloop
    expect(babbleFor(' ', 0, v)).toBeNull()
    expect(babbleFor('!', 2, v)).toBeNull()
    expect(babbleFor('a', 1, v)).toBeNull()
    expect(babbleFor('a', 2, v).freq).toBe(babbleFor('a', 4, v).freq)
    expect(babbleFor('a', 0, v).freq).toBeGreaterThanOrEqual(v.base)
  })

  it('makes at most one blip when many letters appear at once', () => {
    const blip = newestBlip('hello there', 0, 11, BOSS_VOICES.boss_zippy)
    expect(blip).toBeTruthy()
    expect(newestBlip('hello there', 5, 6, BOSS_VOICES.boss_zippy)).toBeNull() // just a space
  })
})
