import { describe, expect, it } from 'vitest'
import { PHENOMENON_ORDER, advanceStage, phenomenonEye, stageCount, startPhenomenon } from '../src/logic/phenomena.js'
import { CITY_DEFS, CITY_PEOPLE, WORLD_RADIUS, biomeAt, heightAt, nearestVillage, villageLayout, villages } from '../src/logic/world.js'
import { SPECIES } from '../src/logic/species.js'
import { compassWord, distanceText, guideTarget, objectiveFor, sageDialog, stormCity } from '../src/logic/stormGuide.js'

describe('the four storm cities', () => {
  it('stand on the rim, one per storm, each a different species, spaced well apart', () => {
    const cities = villages().filter((v) => v.city)
    expect(cities).toHaveLength(4)
    expect(new Set(cities.map((c) => c.species)).size).toBe(4)
    for (const c of cities) {
      expect(Math.hypot(c.x, c.z)).toBeGreaterThan(WORLD_RADIUS - 90)
      expect(Math.hypot(c.x, c.z)).toBeLessThan(WORLD_RADIUS - 40)
      expect(c.name).toBe(CITY_DEFS.find((d) => d.stormId === c.stormId).name)
      expect(stormCity(c.stormId)).toBe(c)
      expect(nearestVillage(c.x, c.z, 5).village.id).toBe(c.id)
      expect(heightAt(c.x, c.z)).toBeGreaterThan(-5)
    }
    for (const a of cities) for (const b of cities) if (a !== b) expect(Math.hypot(a.x - b.x, a.z - b.z)).toBeGreaterThan(200)
    for (const v of villages().filter((x) => !x.city)) for (const c of cities) expect(Math.hypot(v.x - c.x, v.z - c.z)).toBeGreaterThan(110)
  })
  it('each has a temple, a hall, homes, a Sage and a whole people of its species', () => {
    for (const c of villages().filter((v) => v.city)) {
      const layout = villageLayout(c)
      const kinds = layout.props.map((p) => p.kind)
      for (const k of ['temple', 'column', 'shrine', 'hall', 'well', 'runeAltar', 'lampPost']) expect(kinds, c.name).toContain(k)
      expect(kinds.filter((k) => k.startsWith('cottage')).length).toBeGreaterThanOrEqual(4)
      expect(layout.npcs).toHaveLength(CITY_PEOPLE)
      expect(new Set(layout.npcs.map((n) => n.id)).size).toBe(CITY_PEOPLE)
      expect(layout.npcs.every((n) => n.species === c.species)).toBe(true)
      expect(layout.npcs.filter((n) => n.guide)).toEqual([expect.objectContaining({ guide: c.stormId })])
      expect(layout.npcs[0].role).toContain(SPECIES[c.species].name)
      expect(villageLayout(c)).toEqual(layout)
      for (const p of layout.props) expect(Math.hypot(p.x - c.x, p.z - c.z)).toBeLessThan(33)
    }
  })
})

describe('guidance', () => {
  const player = { x: 0, z: 0 }
  it('says directions in compass words (north is -z)', () => {
    expect(compassWord(0, 0, 0, -50)).toBe('north')
    expect(compassWord(0, 0, 50, 0)).toBe('east')
    expect(compassWord(0, 0, 0, 50)).toBe('south')
    expect(compassWord(0, 0, -50, -50)).toBe('north-west')
    expect(distanceText(137)).toBe('135 m')
    expect(distanceText(1500)).toBe('1.5 km')
  })
  it('sends you to the nearest unfinished storm\'s Sage first, then follows the stage you are on', () => {
    const first = guideTarget({}, player)
    expect(first.kind).toBe('sage')
    expect(first.label).toContain('Sage')
    let ph = startPhenomenon({}, 'whiteout')
    const t = guideTarget(ph, player)
    expect(t.kind).toBe('objective')
    expect(t.stormId).toBe('whiteout')
    const eye = phenomenonEye('whiteout')
    expect(Math.hypot(t.x - eye.x, t.z - eye.z)).toBeLessThan(80)
    ph = advanceStage(ph, 'whiteout').phenomena
    expect(guideTarget(ph, player).label).toContain('gate')
    expect(guideTarget(ph, player, 'sandstorm').stormId).toBe('whiteout') // an unstarted storm can't be tracked
  })
  it('has no target once every storm is calmed, and an objective for every stage of every storm', () => {
    const done = Object.fromEntries(PHENOMENON_ORDER.map((id) => [id, { started: true, stage: stageCount(id), n: 0, got: [] }]))
    expect(guideTarget(done, player)).toBe(null)
    for (const id of PHENOMENON_ORDER) {
      let ph = startPhenomenon({}, id)
      for (let i = 0; i < stageCount(id); i++) {
        const o = objectiveFor(ph, id, player)
        expect(o, `${id} stage ${i}`).toBeTruthy()
        expect(Number.isFinite(o.x) && Number.isFinite(o.z)).toBe(true)
        ph = advanceStage(ph, id).phenomena
      }
      expect(objectiveFor(ph, id, player)).toBe(null)
    }
  })
  it('the Sage offers the quest, then briefs the current stage with a direction, then celebrates', () => {
    let ph = {}
    expect(sageDialog(ph, 'sandstorm', player).buttons[0].id).toBe('accept')
    ph = startPhenomenon(ph, 'sandstorm')
    const d = sageDialog(ph, 'sandstorm', player)
    expect(d.text).toMatch(/Trial 1 of 6/)
    expect(d.text).toMatch(/to the (north|south|east|west)/)
    expect(d.buttons.map((b) => b.id)).toEqual(['mark', 'rest', 'close'])
    for (let i = 0; i < 6; i++) ph = advanceStage(ph, 'sandstorm').phenomena
    expect(sageDialog(ph, 'sandstorm', player).text).toMatch(/3 other/)
  })
  it('the storms sit in the same biome as the city\'s bearing', () => {
    for (const c of villages().filter((v) => v.city)) {
      const eye = phenomenonEye(c.stormId)
      const def = CITY_DEFS.find((d) => d.stormId === c.stormId)
      expect(biomeAt(eye.x, eye.z)).toBe(def.biome)
    }
  })
})
