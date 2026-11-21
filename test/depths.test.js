import { describe, expect, it } from 'vitest'
import { WORLD_RADIUS, biomeAt, depthsFloor, heightAt, inDepths, lakeAt, setDepthsMode, nearestVillage } from '../src/logic/world.js'
import { ASCEND_SECONDS, arrivalSpot, ascendFraction, beacons, chasmAt, chasmFalls, chasmRim, chasms, createAscendState, depthsChunk, depthsLairs, lairLayout, stepAscend } from '../src/logic/depths.js'
import { MONSTER_TYPES } from '../src/config.js'

describe('chasms', () => {
  it('seeds a good handful, apart from each other, inside the world', () => {
    const list = chasms()
    expect(list.length).toBeGreaterThanOrEqual(10)
    for (const a of list) {
      expect(Math.hypot(a.x, a.z)).toBeLessThan(WORLD_RADIUS - 60)
      for (const b of list) if (a !== b) expect(Math.hypot(a.x - b.x, a.z - b.z)).toBeGreaterThan(80)
    }
  })
  it('is stable, and finds the pit from inside it', () => {
    expect(chasms()).toBe(chasms())
    const c = chasms()[0]
    expect(chasmAt(c.x, c.z)).toBe(c)
    expect(chasmFalls(c.x, c.z)).toBe(c)
    expect(chasmFalls(c.x + c.radius * 0.95, c.z)).toBeNull() // the rim is safe to stand on
    expect(chasmAt(c.x + c.radius * 3, c.z)).toBeNull()
  })
  it('puts you down on its rim, outside the fall zone', () => {
    for (const c of chasms()) {
      const r = chasmRim(c)
      expect(chasmFalls(r.x, r.z)).toBeNull()
      expect(Math.hypot(r.x - c.x, r.z - c.z)).toBeGreaterThan(c.radius)
    }
  })
})

describe('depths mode', () => {
  it('swaps the ground, biome and land features, and restores them', () => {
    const c = chasms()[0]
    const surface = heightAt(c.x + 40, c.z)
    setDepthsMode(true)
    try {
      expect(inDepths()).toBe(true)
      expect(biomeAt(c.x, c.z)).toBe('depths')
      expect(heightAt(c.x + 40, c.z)).toBe(depthsFloor(c.x + 40, c.z))
      expect(Math.abs(heightAt(120, -80))).toBeLessThan(8)
      expect(lakeAt(0, 0)).toBeNull()
      expect(nearestVillage(0, 0)).toBeNull()
      expect(chasmAt(c.x, c.z)).toBeNull() // no chasms down here
    } finally {
      setDepthsMode(false)
    }
    expect(heightAt(c.x + 40, c.z)).toBe(surface)
    expect(biomeAt(c.x, c.z)).not.toBe('depths')
  })
})

describe('Lightroots', () => {
  it('has one per chasm, each a walk from its drop', () => {
    const roots = beacons().filter((b) => b.chasmId)
    expect(roots.length).toBe(chasms().length)
    for (const b of roots) {
      const c = chasms().find((x) => x.id === b.chasmId)
      expect(Math.hypot(b.x - c.x, b.z - c.z)).toBeLessThan(75)
    }
  })
  it('charges while you stand in one, cancels if you leave, then lifts you', () => {
    const b = beacons()[0]
    let s = createAscendState()
    let out = stepAscend(s, { x: b.x, z: b.z, now: 10 })
    expect(out.events[0].type).toBe('charge')
    s = out.state
    out = stepAscend(s, { x: b.x + 9, z: b.z, now: 10.5 })
    expect(out.events[0].type).toBe('cancel')
    s = stepAscend(out.state, { x: b.x, z: b.z, now: 11 }).state
    expect(ascendFraction(s, 11 + ASCEND_SECONDS / 2)).toBeCloseTo(0.5)
    out = stepAscend(s, { x: b.x, z: b.z, now: 11 + ASCEND_SECONDS + 0.01 })
    expect(out.events[0]).toMatchObject({ type: 'ascend', beacon: b })
    // Locked out until you step off, so you are not lifted again at once.
    expect(stepAscend(out.state, { x: b.x, z: b.z, now: 20 }).events).toEqual([])
  })
  it('does nothing when you may not use it (hiding, menus)', () => {
    const b = beacons()[0]
    expect(stepAscend(createAscendState(), { x: b.x, z: b.z, now: 1, ok: false }).events).toEqual([])
  })
})

describe('lairs and chunks', () => {
  it('seeds five lairs far apart, each with a boss that exists', () => {
    const lairs = depthsLairs()
    expect(lairs.length).toBe(5)
    for (const l of lairs) {
      expect(MONSTER_TYPES[l.boss]?.boss).toBe(true)
      const layout = lairLayout(l)
      expect(layout.guards.some((g) => g.role === 'boss')).toBe(true)
      expect(layout.treasure.length).toBeGreaterThan(0)
    }
  })
  it('streams the same chunk every time, with its lair guards in the right chunk', () => {
    const l = depthsLairs()[0]
    const cx = Math.floor((l.x + 7) / 40)
    const cz = Math.floor((l.z - 2) / 40)
    const a = depthsChunk(cx, cz)
    expect(JSON.stringify(depthsChunk(cx, cz))).toBe(JSON.stringify(a))
    expect(a.biome).toBe('depths')
    expect(a.monsters.some((m) => m.boss && m.lairId === l.id)).toBe(true)
  })
  it('keeps monsters off the Lightroots', () => {
    const b = beacons().find((x) => x.chasmId) // (a cave's own guards stand in its chamber)
    const cx = Math.floor(b.x / 40)
    const cz = Math.floor(b.z / 40)
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      for (const m of depthsChunk(cx + dx, cz + dz).monsters) if (!m.boss) expect(Math.hypot(m.x - b.x, m.z - b.z)).toBeGreaterThanOrEqual(22 - 0.001)
    }
  })
  it('keeps an arrival inside the world', () => {
    const p = arrivalSpot(WORLD_RADIUS * 2, 0)
    expect(Math.hypot(p.x, p.z)).toBeLessThan(WORLD_RADIUS)
  })
})
