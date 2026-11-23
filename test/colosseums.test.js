import { describe, expect, it } from 'vitest'
import { COLOSSEUM_GATE, COLOSSEUM_WALL, colosseumLayout, colosseums, depthsChunk, depthsLairs, beacons, nearColosseum } from '../src/logic/depths.js'
import { DEEP_TEMPLE_RADIUS, deepTemples } from '../src/logic/stormTemples.js'
import { PHENOMENON_ORDER, advanceStage, joinChampion, phenomenonEye, stageCount } from '../src/logic/phenomena.js'
import { BOSSES, COLOSSEUM_BOSSES, bossById } from '../src/logic/bosses.js'
import { MONSTER_TYPES } from '../src/config.js'
import { CHUNK_SIZE, WORLD_RADIUS, heightAt, setDepthsMode } from '../src/logic/world.js'
import { createJournal, noteColosseum, parseJournal, readyMilestones } from '../src/logic/wildsJournal.js'
import { STAFF_UPGRADES, staffUpgrades } from '../src/logic/stormStaff.js'
import { CHAMPION_LAND, companionStorm } from '../src/logic/stormGuide.js'
import { hasBeast } from '../src/beasts.js'

describe('storm colosseums in the Depths', () => {
  it('has one per storm, each with its own champion boss that never joins a wave rotation', () => {
    const list = colosseums()
    expect(list.map((c) => c.stormId)).toEqual(PHENOMENON_ORDER)
    expect(new Set(list.map((c) => c.boss)).size).toBe(4)
    for (const c of list) {
      const boss = bossById(c.boss)
      expect(boss).toBeTruthy()
      expect(MONSTER_TYPES[c.boss]?.boss).toBe(true)
      expect(boss.stats.signature).toBeTruthy()
      expect(hasBeast(c.boss)).toBe(true)
      expect(BOSSES.some((b) => b.id === c.boss)).toBe(false)
    }
    expect(COLOSSEUM_BOSSES).toHaveLength(4)
  })

  it('sits inside the world, under its own storm, clear of temples, lairs and Lightroots', () => {
    for (const c of colosseums()) {
      expect(Math.hypot(c.x, c.z) + c.radius).toBeLessThan(WORLD_RADIUS)
      const eye = phenomenonEye(c.stormId)
      expect(Math.hypot(eye.x - c.x, eye.z - c.z)).toBeLessThan(CHAMPION_LAND)
      for (const t of deepTemples()) expect(Math.hypot(t.x - c.x, t.z - c.z)).toBeGreaterThan(DEEP_TEMPLE_RADIUS + c.radius)
      for (const l of depthsLairs()) expect(Math.hypot(l.x - c.x, l.z - c.z)).toBeGreaterThan(l.radius + c.radius)
      for (const b of beacons()) expect(Math.hypot(b.x - c.x, b.z - c.z)).toBeGreaterThan(c.radius)
    }
  })

  it('has a level floor, a solid wall with a gate facing the middle, and its champion in the chunks', () => {
    const c = colosseums()[0]
    setDepthsMode(true)
    try {
      for (const d of [0, 8, 20]) expect(heightAt(c.x + d, c.z)).toBeCloseTo(c.floor, 5)
      const layout = colosseumLayout(c)
      const wall = layout.props.filter((p) => p.kind === 'blocker')
      expect(wall.length).toBeGreaterThan(40)
      const gateSpot = { x: c.x + Math.cos(c.gate) * COLOSSEUM_WALL, z: c.z + Math.sin(c.gate) * COLOSSEUM_WALL }
      expect(wall.some((p) => Math.hypot(p.x - gateSpot.x, p.z - gateSpot.z) < p.radius + 1)).toBe(false)
      expect(COLOSSEUM_GATE).toBeGreaterThan(0)
      const chunk = depthsChunk(Math.floor(c.x / CHUNK_SIZE), Math.floor(c.z / CHUNK_SIZE))
      const champ = chunk.monsters.find((m) => m.colosseumId === c.id)
      expect(champ).toMatchObject({ type: c.boss, boss: true })
      expect(chunk.monsters.filter((m) => !m.colosseumId).every((m) => !nearColosseum(m.x, m.z))).toBe(true)
    } finally {
      setDepthsMode(false)
    }
  })

  it('remembers a beaten champion for good, with a milestone for all four', () => {
    let j = createJournal()
    const ids = colosseums().map((c) => c.id)
    const first = noteColosseum(j, ids[0])
    expect(first.first).toBe(true)
    expect(noteColosseum(first.journal, ids[0]).first).toBe(false)
    j = parseJournal(JSON.stringify(first.journal))
    expect(j.colossi).toEqual([ids[0]])
    for (const id of ids) j = noteColosseum(j, id).journal
    expect(readyMilestones(j).some((m) => m.id === 'colossi4')).toBe(true)
  })
})

const calm = (ph, id) => {
  for (let i = 0; i < stageCount(id); i++) ph = advanceStage(ph, id).phenomena
  return ph
}

describe('the storm-touched staff', () => {
  it('earns one upgrade per calmed storm', () => {
    expect(staffUpgrades({})).toEqual([])
    let ph = calm(joinChampion({}, 'ashstorm'), 'ashstorm')
    expect(staffUpgrades(ph)).toEqual([STAFF_UPGRADES.ashstorm])
    for (const id of PHENOMENON_ORDER) ph = calm(joinChampion(ph, id), id)
    expect(staffUpgrades(ph).map((u) => u.id)).toEqual(PHENOMENON_ORDER)
  })
})

describe('champions stay in their own land', () => {
  it('only walks with you inside its storm region', () => {
    const ph = joinChampion({}, 'whiteout')
    const eye = phenomenonEye('whiteout')
    expect(companionStorm(ph, null, { x: eye.x, z: eye.z })).toBe('whiteout')
    expect(companionStorm(ph, null, { x: 0, z: 0 })).toBe(null)
  })
})
