import { describe, expect, it } from 'vitest'
import { PHENOMENON_ORDER, PHENOMENON_RADIUS, advanceStage, joinChampion, phenomenonEye, stageCount } from '../src/logic/phenomena.js'
import { STORM_PAD_RADIUS, TEMPLE_PLACE, deepTemples, nearDeepTemple, padAt, skyTempleFor, skyTemples, templeArena, templeChasms } from '../src/logic/stormTemples.js'
import { isleUnder, skyIsles, surfaceAt } from '../src/logic/skyIslands.js'
import { beacons, chasmFalls, chasms, depthsChunk, depthsLairs } from '../src/logic/depths.js'
import { CHUNK_SIZE, WORLD_RADIUS, heightAt } from '../src/logic/world.js'
import { objectiveFor } from '../src/logic/stormGuide.js'

describe('the storms\' temples', () => {
  it('two hang in the sky and two are sunk in the Depths', () => {
    expect(Object.values(TEMPLE_PLACE).filter((p) => p === 'sky')).toHaveLength(2)
    expect(Object.values(TEMPLE_PLACE).filter((p) => p === 'depths')).toHaveLength(2)
    expect(skyTemples()).toHaveLength(2)
    expect(deepTemples()).toHaveLength(2)
  })
  it('a sky temple is an isle you can stand on, high over its storm, a glide from the pad at the eye', () => {
    for (const t of skyTemples()) {
      const eye = phenomenonEye(t.stormId)
      expect(skyIsles()).toContain(t)
      expect(t.y - eye.y).toBeGreaterThan(100)
      expect(Math.hypot(t.x, t.z) + t.radius).toBeLessThan(WORLD_RADIUS)
      expect(Math.hypot(t.x - eye.x, t.z - eye.z)).toBeLessThan(PHENOMENON_RADIUS)
      expect(isleUnder(t.x, t.z, t.y + 0.1)?.id).toBe(t.id)
      expect(surfaceAt(t.x, t.z, t.y + 1)).toBe(t.y)
      expect(surfaceAt(t.x, t.z, heightAt(t.x, t.z))).toBe(heightAt(t.x, t.z)) // walking under it, you stay on the land
      expect(padAt(eye.x, eye.z)?.stormId).toBe(t.stormId)
      expect(padAt(eye.x + STORM_PAD_RADIUS + 1, eye.z)).toBe(null)
      expect(templeArena(t.stormId)).toMatchObject({ place: 'sky', isleId: t.id })
    }
  })
  it('a Depths temple waits under a pit at the eye, with its own way back up and nothing else crowding it', () => {
    for (const t of deepTemples()) {
      const pit = templeChasms().find((c) => c.stormTemple === t.stormId)
      expect(chasms()).toContainEqual(pit)
      expect(chasmFalls(t.x, t.z)?.id ?? chasmFalls(t.x, t.z)).toBeTruthy()
      expect(beacons().some((b) => b.chasmId === pit.id)).toBe(true)
      for (const l of depthsLairs()) expect(Math.hypot(l.x - t.x, l.z - t.z)).toBeGreaterThan(t.radius + l.radius)
      const c = depthsChunk(Math.floor(t.x / CHUNK_SIZE), Math.floor(t.z / CHUNK_SIZE))
      expect(c.props.some((p) => p.kind === 'deepTemple') || c.props.some((p) => p.kind === 'shardPillar')).toBe(true)
      for (const m of c.monsters) expect(nearDeepTemple(m.x, m.z, 0)).toBe(false)
      expect(templeArena(t.stormId).place).toBe('depths')
    }
  })
  it('the guide sends you to the pad or the pit for the boss stage', () => {
    for (const id of PHENOMENON_ORDER) {
      let ph = joinChampion({}, id)
      for (let i = 0; i < stageCount(id) - 1; i++) ph = advanceStage(ph, id).phenomena
      const o = objectiveFor(ph, id, { x: 0, z: 0 })
      expect(o.text).toMatch(TEMPLE_PLACE[id] === 'sky' ? /storm pad/ : /pit/)
      if (TEMPLE_PLACE[id] === 'sky') {
        const t = skyTempleFor(id)
        expect(objectiveFor(ph, id, { x: t.x, z: t.z, y: t.y }).text).toMatch(/^Face/)
      }
    }
  })
})
