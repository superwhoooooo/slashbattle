import { describe, expect, it } from 'vitest'
import { FIRST_PACK_DELAY, MAX_FLYERS, createFlight, createFlyerDirector, flyerSpawnPoint, stepFlight, stepFlyerDirector, stepRock } from '../src/logic/skyFlyers.js'
import { MONSTER_TYPES } from '../src/config.js'
import { creatureName } from '../src/logic/wildsJournal.js'
import { hasBeast } from '../src/beasts.js'

const seq = (...vals) => {
  let i = 0
  return () => vals[i++ % vals.length]
}

describe('Skyfin director', () => {
  it('only sends packs while you are up in the sky, after a moment', () => {
    let d = createFlyerDirector()
    let out = stepFlyerDirector(d, { now: 0, aloft: false, alive: 0 })
    expect(out.spawn).toBe(0)
    out = stepFlyerDirector(out.state, { now: 1, aloft: true, alive: 0, rand: () => 0.5 })
    expect(out.spawn).toBe(0)
    out = stepFlyerDirector(out.state, { now: 1 + FIRST_PACK_DELAY, aloft: true, alive: 0, rand: () => 0.5 })
    expect(out.spawn).toBeGreaterThan(0)
    // Never more than MAX_FLYERS at once.
    d = { nextAt: 0, wasAloft: true }
    expect(stepFlyerDirector(d, { now: 5, aloft: true, alive: MAX_FLYERS, danger: 1, rand: () => 0.99 }).spawn).toBe(0)
    // Back on the land: nothing more comes.
    out = stepFlyerDirector({ nextAt: 0, wasAloft: true }, { now: 5, aloft: false, alive: 0 })
    expect(out.spawn).toBe(0)
  })
})

describe('Skyfin flight', () => {
  const p = { x: 0, y: 200, z: 0 }
  const fly = (f, secs, opts = {}) => {
    const events = []
    let now = opts.now ?? 0
    for (let i = 0; i < secs * 60; i++) {
      now += 1 / 60
      const out = stepFlight(f, { p: opts.p ?? p, dt: 1 / 60, now, leave: opts.leave, rand: opts.rand ?? (() => 0.3) })
      f = out.flight
      events.push(...out.events)
    }
    return { f, events, now }
  }

  it('comes in from high and to one side, then circles above you', () => {
    const at = flyerSpawnPoint(0, 199, 0, () => 0.25)
    expect(at.y).toBeGreaterThan(215)
    const { f } = fly(createFlight(at, () => 0.5), 2.5, { rand: () => 0.5 })
    expect(f.mode).toBe('circle')
    expect(f.y).toBeGreaterThan(p.y + 4)
    expect(Math.hypot(f.x, f.z)).toBeGreaterThan(8)
  })

  it('shrieks, then swoops and bites you if you stand still', () => {
    const { events } = fly(createFlight({ x: 15, y: 210, z: 0 }, () => 0.1), 12, { rand: () => 0.1 })
    const wind = events.findIndex((e) => e.type === 'wind')
    const bite = events.findIndex((e) => e.type === 'bite')
    expect(wind).toBeGreaterThanOrEqual(0)
    expect(bite).toBeGreaterThan(wind)
  })

  it('bombs: flies over you and drops a rock that falls onto you', () => {
    const { events } = fly(createFlight({ x: 15, y: 210, z: 0 }, () => 0.9), 14, { rand: () => 0.9 })
    const drop = events.find((e) => e.type === 'drop')
    expect(drop).toBeTruthy()
    let rock = { x: p.x, y: drop.y, z: p.z, vy: 0 }
    let hit = false
    for (let i = 0; i < 300 && !hit; i++) {
      const s = stepRock(rock, { p, dt: 1 / 60, floor: 0 })
      rock = s.rock
      hit = s.hit
    }
    expect(hit).toBe(true)
    // A rock that misses carries on to the floor.
    let miss = { x: 10, y: 210, z: 0, vy: 0 }
    let landed = false
    for (let i = 0; i < 600 && !landed; i++) {
      const s = stepRock(miss, { p, dt: 1 / 60, floor: 190 })
      miss = s.rock
      landed = s.landed
      expect(s.hit).toBe(false)
    }
    expect(landed).toBe(true)
  })

  it('flies off and is gone once you are back on the land', () => {
    const { events, f } = fly(createFlight({ x: 15, y: 210, z: 0 }, () => 0.5), 8, { leave: true })
    expect(f.mode).toBe('flee')
    expect(events.some((e) => e.type === 'gone')).toBe(true)
  })

  it('is a real monster with a Realist body and a name', () => {
    expect(MONSTER_TYPES.skyfin.flyer).toBe(true)
    expect(hasBeast('skyfin')).toBe(true)
    expect(creatureName('skyfin')).toBe('Skyfin')
  })
})
