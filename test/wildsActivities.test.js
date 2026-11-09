import { describe, expect, it } from 'vitest'
import { LANTERN_BONUS, LANTERN_REWARD, lanternReward, lanterns, lanternsNear } from '../src/logic/lanterns.js'
import { BOONS, SHRINE_RECHARGE, activeBoons, boonEffects, createShrineState, foldBoons, grantBoon, shrineReady, useShrine, wayshrines } from '../src/logic/wayshrines.js'
import { DIG_RADIUS, MAX_MAPS, addMap, digAt, heatOf, makeTreasureMap, nearestMap } from '../src/logic/treasure.js'
import { RING_RADIUS, createRaceState, inRing, medalFor, raceCourses, raceReward, stepRace } from '../src/logic/races.js'
import { EVENTS, createEventDirector, endEvent, hordePlan, merchantStock, meteorPlan, pickEventKind, stepEventDirector, wandererPlan } from '../src/logic/wildEvents.js'
import {
  MILESTONES, claimMilestone, createJournal, creatureName, journalStat, noteBiome, noteKill, noteLandmark, noteLantern, noteRace, noteTreasure, parseJournal, pickUnowned, readyMilestones, serializeJournal,
} from '../src/logic/wildsJournal.js'
import { formatTime, openGround, pickWeighted } from '../src/logic/wildsSpots.js'
import { WORLD_RADIUS, heightAt, landmarks, lakeAt, mulberry32, nearestSite } from '../src/logic/world.js'
import { createInventory } from '../src/logic/inventory.js'
import { PETS, WEAPONS } from '../src/logic/items.js'
import { BOSSES } from '../src/logic/bosses.js'

describe('lost lanterns', () => {
  it('scatters plenty of lanterns over open ground, spaced apart, deterministically', () => {
    const list = lanterns()
    expect(list.length).toBeGreaterThan(120)
    expect(lanterns()).toBe(list)
    for (const l of list) {
      expect(Math.hypot(l.x, l.z)).toBeLessThan(WORLD_RADIUS - 20)
      expect(lakeAt(l.x, l.z)).toBeNull()
      expect(nearestSite(l.x, l.z)).toBeNull()
    }
    expect(new Set(list.map((l) => l.id)).size).toBe(list.length)
  })
  it('finds lanterns near a point through the grid', () => {
    const l = lanterns()[5]
    const near = lanternsNear(l.x, l.z, 30)
    expect(near).toContain(l)
    for (const n of near) expect(Math.hypot(n.x - l.x, n.z - l.z)).toBeLessThanOrEqual(30)
    const brute = lanterns().filter((n) => Math.hypot(n.x - l.x, n.z - l.z) <= 60)
    expect(lanternsNear(l.x, l.z, 60).length).toBe(brute.length)
  })
  it('pays a bonus on every tenth lantern', () => {
    expect(lanternReward(1)).toBe(LANTERN_REWARD)
    expect(lanternReward(10)).toBe(LANTERN_REWARD + LANTERN_BONUS)
    expect(lanternReward(11)).toBe(LANTERN_REWARD)
  })
})

describe('wayshrines', () => {
  it('stands shrines beside the roads, every boon represented', () => {
    const list = wayshrines()
    expect(list.length).toBeGreaterThan(10)
    for (const b of Object.keys(BOONS)) expect(list.some((s) => s.boon === b)).toBe(true)
  })
  it('grants a boon, then sleeps until recharged', () => {
    const shrine = wayshrines().find((s) => s.boon === 'swift')
    let state = createShrineState()
    const first = useShrine(state, shrine, 10)
    expect(first.boon).toBe('swift')
    state = first.state
    expect(boonEffects(state, 11).speed).toBe(BOONS.swift.speed)
    expect(useShrine(state, shrine, 20).boon).toBeNull()
    expect(shrineReady(state, shrine.id, 10 + SHRINE_RECHARGE)).toBe(true)
    expect(boonEffects(state, 10 + BOONS.swift.duration + 1).speed).toBe(1)
  })
  it('stacks different boons and lists them by time left', () => {
    let state = grantBoon(createShrineState(), 'might', 0)
    state = grantBoon(state, 'fortune', 0)
    const fx = boonEffects(state, 5)
    expect(fx.damage).toBe(BOONS.might.damage)
    expect(fx.crystal).toBe(BOONS.fortune.crystal)
    expect(activeBoons(state, 5).map((b) => b.id)).toEqual(['fortune', 'might'])
    const folded = foldBoons({ speed: 1.1, damage: 1, damageTaken: 0.9, crystal: 1, regen: 1, other: 7 }, fx)
    expect(folded.damage).toBe(BOONS.might.damage)
    expect(folded.speed).toBe(1.1)
    expect(folded.other).toBe(7)
  })
})

describe('treasure maps', () => {
  it('buries the treasure on open ground, the same spot for the same key, inside the hint circle', () => {
    for (const lm of landmarks().slice(0, 12)) {
      const map = makeTreasureMap(lm.id, lm, lm.name)
      expect(makeTreasureMap(lm.id, lm, lm.name)).toEqual(map)
      expect(openGround(map.x, map.z)).toBe(true)
      expect(Math.hypot(map.x - map.hintX, map.z - map.hintZ)).toBeLessThan(map.hintRadius)
      expect(map.reward).toBeGreaterThan(30)
    }
  })
  it('warms up as you close in and digs it up on the spot', () => {
    const map = makeTreasureMap('test', { x: 150, z: 40 })
    expect(digAt(map, map.x + 100, map.z).heat).toBe('cold')
    expect(digAt(map, map.x + 15, map.z).heat).toBe('warm')
    expect(digAt(map, map.x + 6, map.z).heat).toBe('hot')
    expect(digAt(map, map.x + DIG_RADIUS * 0.5, map.z).found).toBe(true)
    expect(heatOf(30)).toBe('cool')
  })
  it('caps the maps you carry and never re-adds a dug one', () => {
    const a = makeTreasureMap('a', { x: 100, z: 0 })
    const b = makeTreasureMap('b', { x: 0, z: 100 })
    const c = makeTreasureMap('c', { x: -100, z: 0 })
    let maps = addMap([], a)
    maps = addMap(maps, a)
    expect(maps.length).toBe(1)
    maps = addMap(addMap(maps, b), c)
    expect(maps.length).toBe(MAX_MAPS)
    expect(addMap([], a, [a.id])).toEqual([])
    expect(nearestMap([a, b], a.x, a.z).map).toBe(a)
  })
})

describe('sky-ring races', () => {
  const courses = raceCourses()
  it('lays several courses from summits, rings above the ground and in reach of a glide', () => {
    expect(courses.length).toBeGreaterThanOrEqual(4)
    for (const c of courses) {
      expect(c.rings.length).toBeGreaterThan(6)
      expect(c.gold).toBeLessThan(c.silver)
      expect(c.silver).toBeLessThan(c.limit)
      let prevY = c.start.y + 3
      for (const r of c.rings) {
        expect(r.y).toBeGreaterThan(heightAt(r.x, r.z) + 2)
        expect(r.y).toBeLessThanOrEqual(Math.max(prevY, heightAt(r.x, r.z) + 2.5)) // never climbs above the glide
        prevY = r.y
      }
    }
  })
  it('starts at the gate, counts rings in order, and finishes with a medal', () => {
    const c = courses[0]
    let state = createRaceState()
    let out = stepRace(state, { x: c.start.x, y: c.start.y, z: c.start.z, now: 0 })
    expect(out.events[0].type).toBe('start')
    state = out.state
    // Skipping ahead to the second ring doesn't count.
    out = stepRace(state, { ...c.rings[1], now: 1 })
    expect(out.events).toEqual([])
    c.rings.forEach((r, i) => {
      out = stepRace(state, { x: r.x, y: r.y, z: r.z, now: 1 + i })
      state = out.state
    })
    const finish = out.events.find((e) => e.type === 'finish')
    expect(finish.medal).toBe(medalFor(c, finish.time))
    expect(state.active).toBeNull()
    // Back at the gate, it starts again.
    expect(stepRace(state, { ...c.start, now: 50 }).events[0].type).toBe('start')
  })
  it('fails when time runs out', () => {
    const c = courses[0]
    const state = stepRace(createRaceState(), { ...c.start, now: 0 }).state
    const out = stepRace(state, { x: c.start.x, y: c.start.y, z: c.start.z, now: c.limit + 1 })
    expect(out.events[0]).toMatchObject({ type: 'fail', reason: 'time' })
    // Still standing in the gate: no instant restart until you step out of it.
    expect(stepRace(out.state, { ...c.start, now: c.limit + 2 }).events).toEqual([])
    const away = stepRace(out.state, { x: c.start.x + 30, y: c.start.y, z: c.start.z, now: c.limit + 3 }).state
    expect(stepRace(away, { ...c.start, now: c.limit + 4 }).events[0].type).toBe('start')
  })
  it('rings have an opening and rewards scale by medal', () => {
    const r = courses[0].rings[0]
    expect(inRing(r, r.x + RING_RADIUS * 0.5, r.y, r.z)).toBe(true)
    expect(inRing(r, r.x, r.y + RING_RADIUS + 1, r.z)).toBe(false)
    expect(raceReward('gold', false)).toBeGreaterThan(raceReward('silver', false))
    expect(raceReward('bronze', true)).toBeGreaterThan(raceReward('bronze', false))
  })
})

describe('roaming events', () => {
  it('waits, starts an event away from safety, and waits again after it ends', () => {
    let d = createEventDirector(0)
    expect(stepEventDirector(d, { now: 10 }).start).toBeNull()
    const safe = stepEventDirector(d, { now: 60, safe: true })
    expect(safe.start).toBeNull()
    const out = stepEventDirector(d, { now: 60, rng: () => 0.1 })
    expect(Object.keys(EVENTS)).toContain(out.start)
    d = out.state
    expect(stepEventDirector(d, { now: 61 }).start).toBeNull() // one at a time
    d = endEvent(d, 100, () => 0)
    expect(d.active).toBeNull()
    expect(d.nextAt).toBeGreaterThan(100)
  })
  it('never repeats the last kind back to back', () => {
    const rng = mulberry32(3)
    for (let i = 0; i < 50; i++) expect(pickEventKind(rng, { last: 'horde' })).not.toBe('horde')
  })
  it('plans hordes from the local biome, meteors around you, a boss for the titan', () => {
    const plan = hordePlan(mulberry32(1), 'emberwaste', 0.5)
    expect(plan.waves.length).toBe(2)
    expect(plan.waves[0].length).toBeGreaterThan(3)
    expect(plan.reward).toBeGreaterThan(0)
    const drops = meteorPlan(mulberry32(2), { x: 10, z: 10 }, 8)
    expect(drops.length).toBe(8)
    for (const m of drops) expect(Math.hypot(m.x - 10, m.z - 10)).toBeLessThan(28)
    expect(BOSSES.map((b) => b.id)).toContain(wandererPlan(mulberry32(4), 0.5).type)
  })
  it('stocks the merchant with gear you lack, a map and a tonic or stew', () => {
    const inv = createInventory()
    const stock = merchantStock('seed', inv, 0.3)
    expect(stock.some((g) => g.kind === 'map')).toBe(true)
    for (const g of stock) expect(g.price).toBeGreaterThan(0)
    for (const g of stock.filter((s) => s.kind === 'weapon')) expect(inv.weapons).not.toContain(g.itemId)
    expect(merchantStock('seed', inv, 0.3)).toEqual(stock)
  })
})

describe('wilds journal', () => {
  it('notes firsts and survives a save round trip', () => {
    let j = createJournal()
    let r = noteLandmark(j, 'l1')
    expect(r.first).toBe(true)
    j = r.journal
    expect(noteLandmark(j, 'l1').first).toBe(false)
    j = noteKill(j, 'blobbo').journal
    r = noteKill(j, 'blobbo')
    expect(r.first).toBe(false)
    j = noteLantern(noteBiome(r.journal, 'gloomfen').journal, 'lan3').journal
    j = noteTreasure(j)
    const race = noteRace(j, 'race0', 22.34)
    expect(race.first && race.best).toBe(true)
    expect(noteRace(race.journal, 'race0', 30).best).toBe(false)
    j = race.journal
    expect(parseJournal(serializeJournal(j))).toEqual(j)
    expect(parseJournal('not json')).toEqual(createJournal())
    expect(parseJournal('{"landmarks":[1,"a"],"treasures":-3}').landmarks).toEqual(['a'])
  })
  it('makes milestones ready once and only once', () => {
    let j = createJournal()
    for (let i = 0; i < 5; i++) j = noteLandmark(j, `l${i}`).journal
    expect(journalStat(j, 'landmarks')).toBe(5)
    expect(readyMilestones(j).map((m) => m.id)).toContain('sights5')
    j = claimMilestone(j, 'sights5')
    expect(readyMilestones(j).map((m) => m.id)).not.toContain('sights5')
    expect(new Set(MILESTONES.map((m) => m.id)).size).toBe(MILESTONES.length)
  })
  it('picks gear you do not own, never a dragon, and names creatures', () => {
    const inv = createInventory()
    const w = pickUnowned('weapon', inv, 'x')
    expect(WEAPONS[w]).toBeTruthy()
    expect(inv.weapons).not.toContain(w)
    const p = pickUnowned('pet', inv, 'y')
    expect(PETS[p].kind).not.toBe('breath')
    expect(creatureName('bandit')).toBe('Bellhop Bandit')
    expect(creatureName('bumble')).toBe('Bumblo')
    expect(creatureName('zippy')).toBe('Zippy')
    expect(creatureName(BOSSES[0].id).length).toBeGreaterThan(3)
  })
})

describe('helpers', () => {
  it('formats race clocks and picks by weight', () => {
    expect(formatTime(4.25)).toBe('4.3s')
    expect(formatTime(63.5)).toBe('1:03.5')
    expect(pickWeighted(() => 0, [['a', 1], ['b', 1]])).toBe('a')
    expect(pickWeighted(() => 0.99, [['a', 1], ['b', 1]])).toBe('b')
  })
})
