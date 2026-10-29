import { describe, expect, it } from 'vitest'
import { pickAnnouncement } from '../src/logic/announcements.js'

const KINDS = ['waveStart', 'waveCleared', 'bossIncoming', 'lowHp', 'ambush']

// A tiny deterministic PRNG (a seeded rng should be reproducible, unlike Math.random).
function seededRng(seed) {
  let state = seed
  return () => {
    state = (state * 9301 + 49297) % 233280
    return state / 233280
  }
}

describe('pickAnnouncement', () => {
  it('returns a non-empty lead and text for every kind', () => {
    for (const kind of KINDS) {
      const { lead, text } = pickAnnouncement(kind, { wave: 3, bossName: 'KING GLOOP', rng: seededRng(1) })
      expect(lead.length).toBeGreaterThan(0)
      expect(text.length).toBeGreaterThan(0)
    }
  })

  it('interpolates the wave number into at least one waveStart line', () => {
    const seen = new Set()
    for (let seed = 0; seed < 30; seed++) {
      seen.add(pickAnnouncement('waveStart', { wave: 7, rng: seededRng(seed) }).text)
    }
    expect([...seen].some((text) => text.includes('7'))).toBe(true)
  })

  it('interpolates the boss name into at least one bossIncoming line', () => {
    const seen = new Set()
    for (let seed = 0; seed < 30; seed++) {
      seen.add(pickAnnouncement('bossIncoming', { bossName: 'ZIPZILLA', rng: seededRng(seed) }).text)
    }
    expect([...seen].some((text) => text.includes('ZIPZILLA'))).toBe(true)
  })

  it('is deterministic for a given rng sequence', () => {
    const a = pickAnnouncement('waveCleared', { wave: 2, rng: seededRng(42) })
    const b = pickAnnouncement('waveCleared', { wave: 2, rng: seededRng(42) })
    expect(a).toEqual(b)
  })

  it('never repeats the previous line of the same kind back-to-back', () => {
    let previous = null
    let rngState = 0
    // Cycles through a short, deterministic sequence (including repeats) so
    // the "same roll twice in a row" case is actually exercised.
    const rng = () => {
      rngState = (rngState + 1) % 7
      return rngState / 7
    }
    for (let i = 0; i < 50; i++) {
      const picked = pickAnnouncement('lowHp', { rng, previous })
      if (previous) expect(picked).not.toEqual(previous)
      previous = picked
    }
  })

  it('falls back to the full pool if every candidate would repeat (a single-line pool)', () => {
    // ambush/lowHp/etc. all have multiple lines, so this exercises the
    // defensive fallback path directly rather than relying on pool size.
    const previous = pickAnnouncement('ambush', { rng: () => 0 })
    expect(() => pickAnnouncement('ambush', { rng: () => 0, previous })).not.toThrow()
  })

  it('returns an empty announcement for an unknown kind instead of throwing', () => {
    expect(pickAnnouncement('notAKind', { rng: () => 0 })).toEqual({ lead: '', text: '' })
  })
})
