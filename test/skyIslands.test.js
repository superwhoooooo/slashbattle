import { describe, expect, it } from 'vitest'
import { heightAt, WORLD_RADIUS } from '../src/logic/world.js'
import {
  CHARGE_SECONDS, LAUNCH_RISE, PAD_RADIUS, chargeFraction, createLaunchState, isAloft, isleAt, isleLayout, isleUnder, launchVelocity,
  skyArchipelagos, skyIsles, skyTowers, stepLaunch, surfaceAt, towerObstacles, updraftLift,
} from '../src/logic/skyIslands.js'
import { JUMP_GRAVITY, GLIDE_SINK, GLIDE_SPEED_MULTIPLIER } from '../src/logic/jump.js'
import { PLAYER_SPEED } from '../src/config.js'

describe('Skylift towers', () => {
  it('stand all over the Wilds, well apart, on the land', () => {
    const towers = skyTowers()
    expect(towers.length).toBeGreaterThanOrEqual(7)
    for (const t of towers) {
      expect(Math.hypot(t.x, t.z)).toBeLessThan(WORLD_RADIUS - 60)
      expect(t.y).toBeCloseTo(heightAt(t.x, t.z), 5)
      for (const o of towers) if (o !== t) expect(Math.hypot(o.x - t.x, o.z - t.z)).toBeGreaterThanOrEqual(160)
    }
  })

  it('leave gaps between the pillars to walk in through, and the pad clear', () => {
    const t = skyTowers()[0]
    const pillars = towerObstacles(t)
    for (const o of pillars) expect(Math.hypot(o.x - t.x, o.z - t.z) - o.radius).toBeGreaterThan(PAD_RADIUS + 1)
    const gap = Math.hypot(pillars[0].x - pillars[1].x, pillars[0].z - pillars[1].z) - pillars[0].radius * 2
    expect(gap).toBeGreaterThan(2.5)
  })

  it('charge while you stand on the pad, then launch you', () => {
    const t = skyTowers()[0]
    let st = createLaunchState()
    let out = stepLaunch(st, { x: t.x, z: t.z, alt: t.y, now: 10 })
    expect(out.events[0].type).toBe('charge')
    st = out.state
    expect(chargeFraction(st, 10 + CHARGE_SECONDS / 2)).toBeCloseTo(0.5)
    out = stepLaunch(st, { x: t.x, z: t.z, alt: t.y, now: 10 + CHARGE_SECONDS / 2 })
    expect(out.events).toEqual([])
    out = stepLaunch(out.state, { x: t.x, z: t.z, alt: t.y, now: 10 + CHARGE_SECONDS + 0.01 })
    expect(out.events[0].type).toBe('launch')
    // Peaks LAUNCH_RISE above the pad.
    expect((out.events[0].vy * out.events[0].vy) / (2 * JUMP_GRAVITY)).toBeCloseTo(LAUNCH_RISE)
    // Landing back on the pad does not fire again until you step off it.
    out = stepLaunch(out.state, { x: t.x, z: t.z, alt: t.y, now: 30 })
    expect(out.events).toEqual([])
    out = stepLaunch(out.state, { x: t.x + 9, z: t.z, alt: t.y, now: 31 })
    out = stepLaunch(out.state, { x: t.x, z: t.z, alt: t.y, now: 32 })
    expect(out.events[0].type).toBe('charge')
  })

  it('cancel the charge if you step off (or are not free to go)', () => {
    const t = skyTowers()[0]
    let out = stepLaunch(createLaunchState(), { x: t.x, z: t.z, alt: t.y, now: 0 })
    out = stepLaunch(out.state, { x: t.x + 5, z: t.z, alt: t.y, now: 0.5 })
    expect(out.events[0].type).toBe('cancel')
    out = stepLaunch(createLaunchState(), { x: t.x, z: t.z, alt: t.y, now: 0 })
    out = stepLaunch(out.state, { x: t.x, z: t.z, alt: t.y, now: 0.5, ok: false })
    expect(out.events[0].type).toBe('cancel')
  })
})

describe('sky isles', () => {
  it('hang high over the land, inside the world, never overlapping', () => {
    const isles = skyIsles()
    expect(isles.length).toBeGreaterThan(40)
    for (const i of isles) {
      expect(Math.hypot(i.x, i.z) + i.radius).toBeLessThan(WORLD_RADIUS - 20)
      expect(i.y - i.depth).toBeGreaterThan(heightAt(i.x, i.z) + 60)
      for (const o of isles) if (o !== i) expect(Math.hypot(o.x - i.x, o.z - i.z)).toBeGreaterThan(o.radius + i.radius + 5)
    }
  })

  it('each archipelago has a main isle in glide reach of its launch, a crown above, and an updraft up to it', () => {
    const glideRatio = GLIDE_SINK / (PLAYER_SPEED * GLIDE_SPEED_MULTIPLIER)
    for (const arch of skyArchipelagos()) {
      const tower = skyTowers().find((t) => t.id === arch.towerId)
      const main = arch.isles.find((i) => i.main)
      const crown = arch.isles.find((i) => i.crown)
      const apex = tower.y + LAUNCH_RISE
      const edge = Math.hypot(main.x - tower.x, main.z - tower.z) - main.radius
      expect((apex - main.y) / glideRatio).toBeGreaterThan(edge * 1.5)
      expect(crown.y).toBeGreaterThan(main.y + 20)
      const u = arch.updraft
      expect(u.y1).toBeGreaterThan(crown.y)
      expect(u.y0).toBeLessThan(main.y)
      expect(Math.hypot(u.x - crown.x, u.z - crown.z)).toBeLessThan(crown.radius + u.radius + 8)
      // The chain steps down: every islet is a glide from the one before.
      const chain = arch.isles.filter((i) => !i.main && !i.crown)
      let prev = main
      for (const isle of chain) {
        const gap = Math.hypot(isle.x - prev.x, isle.z - prev.z) - isle.radius - prev.radius
        expect((prev.y - isle.y) / glideRatio).toBeGreaterThan(gap)
        prev = isle
      }
    }
  })

  it('are walkable: their tops are the ground while you are on them, not while you are below', () => {
    const isle = skyIsles()[0]
    expect(isleAt(isle.x, isle.z)).toBe(isle)
    expect(surfaceAt(isle.x, isle.z, isle.y)).toBe(isle.y)
    expect(surfaceAt(isle.x, isle.z, isle.y + 50)).toBe(isle.y)
    expect(surfaceAt(isle.x, isle.z, 0)).toBe(heightAt(isle.x, isle.z))
    expect(isleUnder(isle.x + isle.radius + 1, isle.z, isle.y)).toBe(null)
    expect(isAloft(isle.x, isle.z, isle.y)).toBe(true)
    expect(isAloft(isle.x, isle.z, heightAt(isle.x, isle.z) + 2)).toBe(false)
  })

  it('updrafts lift only inside their column', () => {
    const u = skyArchipelagos()[0].updraft
    expect(updraftLift(u.x, u.z, (u.y0 + u.y1) / 2)).toBeGreaterThan(0)
    expect(updraftLift(u.x + u.radius + 1, u.z, (u.y0 + u.y1) / 2)).toBe(0)
    expect(updraftLift(u.x, u.z, u.y1 + 5)).toBe(0)
  })

  it('lay out props, chests and guards on the isle, with stable ids', () => {
    for (const isle of skyIsles()) {
      const a = isleLayout(isle)
      const b = isleLayout(isle)
      expect(a).toEqual(b)
      for (const t of [...a.treasure, ...a.guards]) expect(Math.hypot(t.x - isle.x, t.z - isle.z)).toBeLessThan(isle.radius)
      for (const p of a.props) expect(Math.hypot(p.x - isle.x, p.z - isle.z)).toBeLessThanOrEqual(isle.radius + 0.01)
    }
    const kinds = new Set(skyIsles().map((i) => i.kind))
    for (const k of ['grove', 'ruins', 'garden', 'forge', 'observatory', 'crown']) expect(kinds.has(k)).toBe(true)
    expect(skyIsles().some((i) => isleLayout(i).guards.some((g) => g.boss))).toBe(true)
    expect(launchVelocity()).toBeGreaterThan(50)
  })
})
