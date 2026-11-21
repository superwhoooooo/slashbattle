import { describe, expect, it } from 'vitest'
import { PHENOMENON_ORDER, PHENOMENON_RADIUS, advanceStage, hasGift, hazardScale, joinChampion, phenomenonEye, stageCount, startPhenomenon } from '../src/logic/phenomena.js'
import { CITY_DEFS, CITY_PEOPLE, CITY_STYLE, STORM_TEMPLE_RADIUS, WORLD_RADIUS, biomeAt, heightAt, lakeAt, nearStormTemple, nearestSite, nearestVillage, ruins, stormRegionAt, stormRegions, villageLayout, villages } from '../src/logic/world.js'
import { SPECIES } from '../src/logic/species.js'
import { championFor, companionStorm, compassWord, distanceText, guideTarget, objectiveFor, sageDialog, stormCity } from '../src/logic/stormGuide.js'

describe('the four storm cities', () => {
  it('stand on the rim, one per storm, each a different species, spaced well apart', () => {
    const cities = villages().filter((v) => v.city)
    expect(cities).toHaveLength(4)
    expect(new Set(cities.map((c) => c.species)).size).toBe(4)
    for (const c of cities) {
      expect(Math.hypot(c.x, c.z)).toBeGreaterThan(WORLD_RADIUS - 120)
      expect(Math.hypot(c.x, c.z) + 58).toBeLessThan(WORLD_RADIUS) // the whole (big) town fits on the land
      expect(c.name).toBe(CITY_DEFS.find((d) => d.stormId === c.stormId).name)
      expect(stormCity(c.stormId)).toBe(c)
      expect(nearestVillage(c.x, c.z, 5).village.id).toBe(c.id)
      expect(heightAt(c.x, c.z)).toBeGreaterThan(-5)
    }
    for (const a of cities) for (const b of cities) if (a !== b) expect(Math.hypot(a.x - b.x, a.z - b.z)).toBeGreaterThan(200)
    for (const v of villages().filter((x) => !x.city)) for (const c of cities) expect(Math.hypot(v.x - c.x, v.z - c.z)).toBeGreaterThan(110)
  })
  it('each is built its own people\'s way, with the champion on a dais and a whole people of its species', () => {
    const own = {
      dunekin: ['duneOasis', 'duneWall', 'duneGate', 'duneStall', 'palm', 'duneHall'],
      frostkin: ['frostSpire', 'frostPerch', 'frostIgloo', 'frostHall'],
      embervolk: ['emberCrag', 'emberForge', 'emberBurrow', 'emberLava', 'emberHall'],
      mirefolk: ['mirePond', 'mireWalk', 'mireLily', 'mireHome', 'mireLamp', 'mireHall'],
    }
    const seen = {}
    for (const c of villages().filter((v) => v.city)) {
      const layout = villageLayout(c)
      const kinds = layout.props.map((p) => p.kind)
      const pre = CITY_STYLE[c.species]
      for (const k of [...own[c.species], `${pre}Dais`]) expect(kinds, c.name).toContain(k)
      for (const k of ['lampPost', 'noticeBoard', 'cottage', 'shrine', 'runeAltar', 'well']) expect(kinds, c.name).not.toContain(k) // no generic town
      seen[c.species] = new Set(kinds.filter((k) => k !== 'blocker' && k !== 'bonfire'))
      expect(layout.npcs).toHaveLength(CITY_PEOPLE)
      expect(new Set(layout.npcs.map((n) => n.id)).size).toBe(CITY_PEOPLE)
      expect(layout.npcs.every((n) => n.species === c.species)).toBe(true)
      const champ = layout.npcs.filter((n) => n.guide)
      expect(champ).toEqual([expect.objectContaining({ guide: c.stormId, champion: true, name: SPECIES[c.species].champion.name })])
      const dais = layout.props.find((p) => p.kind === `${pre}Dais`)
      expect(Math.hypot(champ[0].x - dais.x, champ[0].z - dais.z)).toBeLessThan(0.01) // someone stands on it
      expect(layout.npcs[1].role).toContain(SPECIES[c.species].name)
      expect(villageLayout(c)).toEqual(layout)
      for (const p of layout.props) expect(Math.hypot(p.x - c.x, p.z - c.z)).toBeLessThan(60)
      expect(layout.props.filter((p) => p.radius > 1.5 && p.kind !== 'blocker').length, c.name).toBeGreaterThanOrEqual(18) // a real town, not a hamlet
      for (const n of layout.npcs.slice(1)) for (const p of layout.props) if (p.radius > 0) expect(Math.hypot(p.x - n.x, p.z - n.z), `${n.name} in ${p.kind}`).toBeGreaterThan(p.radius)
    }
    // No two peoples share a building.
    const ids = Object.keys(seen)
    for (const a of ids) for (const b of ids) if (a < b) expect([...seen[a]].filter((k) => seen[b].has(k)), `${a} / ${b}`).toEqual([])
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
    expect(first.label).toContain(championFor(first.stormId).name)
    let ph = startPhenomenon({}, 'whiteout')
    const city = guideTarget(ph, player) // walked in alone: go and find their city and champion first
    expect(city.kind).toBe('sage')
    expect(city.stormId).toBe('whiteout')
    expect(city.label).toContain(stormCity('whiteout').name)
    ph = joinChampion(ph, 'whiteout')
    const t = guideTarget(ph, player)
    expect(t.kind).toBe('objective')
    expect(t.stormId).toBe('whiteout')
    const eye = phenomenonEye('whiteout')
    expect(Math.hypot(t.x - eye.x, t.z - eye.z)).toBeLessThan(160)
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
  it('the champion offers the quest and their gift, then briefs the current stage with a direction, then celebrates', () => {
    let ph = {}
    expect(sageDialog(ph, 'sandstorm', player).buttons[0].id).toBe('accept')
    expect(sageDialog(ph, 'sandstorm', player).text).toContain('Sand Veil')
    ph = startPhenomenon(ph, 'sandstorm')
    expect(sageDialog(ph, 'sandstorm', player).buttons[0].id).toBe('accept') // walked in without them: still offers
    ph = joinChampion(ph, 'sandstorm')
    const d = sageDialog(ph, 'sandstorm', player)
    expect(d.text).toMatch(/Trial 1 of 6/)
    expect(d.text).toMatch(/to the (north|south|east|west)/)
    expect(d.buttons.map((b) => b.id)).toEqual(['mark', 'rest', 'close'])
    for (let i = 0; i < 6; i++) ph = advanceStage(ph, 'sandstorm').phenomena
    expect(sageDialog(ph, 'sandstorm', player).text).toMatch(/3 other/)
  })
  it('a champion walks with you once they join, the tracked storm first, and stays on after the storm is calm', () => {
    expect(companionStorm({})).toBe(null)
    expect(companionStorm(startPhenomenon({}, 'whiteout'))).toBe(null) // walking in alone brings nobody
    let ph = joinChampion({}, 'ashstorm')
    ph = joinChampion(ph, 'miasma')
    expect(companionStorm(ph)).toBe('ashstorm')
    expect(companionStorm(ph, 'miasma')).toBe('miasma')
    for (let i = 0; i < 6; i++) ph = advanceStage(ph, 'ashstorm').phenomena
    expect(companionStorm(ph, 'ashstorm')).toBe('miasma')
    for (let i = 0; i < 6; i++) ph = advanceStage(ph, 'miasma').phenomena
    expect(companionStorm(ph)).toBe('miasma') // a sage now: the last one calmed stays
  })
  it('the storm is brutal without the people\'s gift and gentle with it', () => {
    expect(hazardScale({}, 'whiteout')).toBeGreaterThan(1)
    expect(hazardScale(joinChampion({}, 'whiteout'), 'whiteout')).toBeLessThan(0.5)
    expect(hasGift(advanceStage(joinChampion({}, 'whiteout'), 'whiteout').phenomena, 'whiteout')).toBe(true)
  })
  it('the storm regions lie on the edge of the map, each city inside its storm with the temple a trek away', () => {
    const regions = stormRegions()
    expect(regions).toHaveLength(4)
    for (const reg of regions) {
      const eye = phenomenonEye(reg.stormId)
      expect(Math.hypot(eye.x, eye.z)).toBeGreaterThan(WORLD_RADIUS - 200)
      expect(Math.hypot(eye.x, eye.z) + PHENOMENON_RADIUS).toBeLessThan(WORLD_RADIUS) // the wall stays on the land
      const city = stormCity(reg.stormId)
      const d = Math.hypot(city.x - eye.x, city.z - eye.z)
      expect(d).toBeLessThan(PHENOMENON_RADIUS - 20) // the city is inside its storm
      expect(d).toBeGreaterThan(90) // ...but the temple is a walk away
      expect(stormRegionAt(city.x, city.z)).toBe(reg)
      expect(biomeAt(city.x, city.z)).toBe(reg.biome)
      expect(nearestSite(eye.x, eye.z)?.kind).toBe('stormTemple') // its floor is levelled and kept clear
      expect(nearStormTemple(eye.x, eye.z)).toBe(true)
      expect(lakeAt(eye.x, eye.z, 1)).toBe(null)
      for (const r of ruins()) expect(Math.hypot(r.x - eye.x, r.z - eye.z)).toBeGreaterThan(STORM_TEMPLE_RADIUS)
    }
    for (const a of regions) for (const b of regions) if (a !== b) expect(Math.hypot(a.eye.x - b.eye.x, a.eye.z - b.eye.z)).toBeGreaterThan(PHENOMENON_RADIUS * 2)
    expect(stormRegionAt(0, 0)).toBe(null)
    expect(stormRegionAt(200, 0)).toBe(null)
  })
  it('the storms sit in the same biome as the city\'s bearing', () => {
    for (const c of villages().filter((v) => v.city)) {
      const eye = phenomenonEye(c.stormId)
      const def = CITY_DEFS.find((d) => d.stormId === c.stormId)
      expect(biomeAt(eye.x, eye.z)).toBe(def.biome)
    }
  })
})

describe('Gildenspire\'s ring wall', () => {
  it('runs along the ring with no gaps, open only at the gate', async () => {
    const { DUNE_WALL_RADIUS, DUNE_WALL_SEGMENTS } = await import('../src/logic/world.js')
    const city = villages().find((v) => v.species === 'dunekin')
    const layout = villageLayout(city)
    const walls = layout.props.filter((p) => p.kind === 'duneWall')
    expect(walls).toHaveLength(DUNE_WALL_SEGMENTS - 1)
    for (const w of walls) {
      // The model's long side (local x) after the turn must point along the ring (perpendicular to the radius).
      const dir = { x: Math.cos(w.rot), z: -Math.sin(w.rot) }
      const radial = { x: (w.x - city.x) / DUNE_WALL_RADIUS, z: (w.z - city.z) / DUNE_WALL_RADIUS }
      expect(Math.abs(dir.x * radial.x + dir.z * radial.z)).toBeLessThan(0.01)
    }
    // Walk round the ring: everywhere but the gate is blocked (no hole a player could slip through).
    const blocks = layout.props.filter((p) => p.kind === 'blocker')
    const gate = layout.props.find((p) => p.kind === 'duneGate')
    let open = 0
    for (let i = 0; i < 720; i++) {
      const a = (i / 720) * Math.PI * 2
      const x = city.x + Math.cos(a) * DUNE_WALL_RADIUS
      const z = city.z + Math.sin(a) * DUNE_WALL_RADIUS
      if (Math.hypot(x - gate.x, z - gate.z) < 2.5) continue // the gateway itself
      if (!blocks.some((b) => Math.hypot(b.x - x, b.z - z) < b.radius + 0.3)) open++
    }
    expect(open).toBe(0)
  })
})
