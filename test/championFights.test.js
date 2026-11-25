import { describe, expect, it } from 'vitest'
import { ARENA_KEEP, CHAMPION_PROP_TYPES, FIGHTS, FIGHT_START_RADIUS, createFight, fightStatus, inCone, isWarm, keepInArena, stepFight } from '../src/logic/championFights.js'
import { COLOSSEUM_BOSSES } from '../src/logic/bosses.js'
import { colosseums } from '../src/logic/depths.js'
import { MONSTER_TYPES } from '../src/config.js'

const arena = (bossId) => colosseums().find((c) => c.boss === bossId)
const fixedRng = () => 0.5

// Runs a fight for `secs` with a scripted player / boss; collects every event.
function run(s, secs, { player, boss, hpFrac = 1, podsAlive = 0, t0 = 0, dt = 0.05 }) {
  const out = []
  for (let t = 0; t < secs; t += dt) {
    const now = t0 + t
    const pl = typeof player === 'function' ? player(now) : player
    const bo = typeof boss === 'function' ? boss(now) : boss
    out.push(...stepFight(s, { dt, now, player: pl, boss: { radius: 2, ...bo }, hpFrac, podsAlive: typeof podsAlive === 'function' ? podsAlive(now) : podsAlive, rng: fixedRng }))
  }
  return out
}
const types = (evs) => evs.map((e) => e.type)

describe('storm champion fights', () => {
  it('gives every colosseum champion its own kind of fight', () => {
    const kinds = COLOSSEUM_BOSSES.map((b) => FIGHTS[b.id]?.kind)
    expect(new Set(kinds).size).toBe(4)
    expect(MONSTER_TYPES.rot_pod).toMatchObject(CHAMPION_PROP_TYPES.rot_pod)
  })

  it('sleeps until you walk in, then wakes with its ward up', () => {
    const c = arena('boss_sirocco')
    const s = createFight('boss_sirocco', c)
    const center = { x: c.x, z: c.z }
    expect(run(s, 1, { player: { x: c.x + FIGHT_START_RADIUS + 3, z: c.z }, boss: center })).toEqual([])
    expect(types(run(s, 0.1, { player: { x: c.x + 5, z: c.z }, boss: center }))).toContain('begin')
    expect(s.exposed).toBe(false)
    expect(fightStatus(s, 0)).toContain('SAND VEIL')
  })

  it('Sultan Sirocco: three sun mirrors burn his veil away, then it comes back with mirages below half health', () => {
    const c = arena('boss_sirocco')
    const s = createFight('boss_sirocco', c)
    const boss = { x: c.x, z: c.z }
    run(s, 0.1, { player: { x: c.x, z: c.z }, boss })
    let t = 1
    for (const m of s.mirrors) {
      const evs = run(s, 1.3, { player: m, boss, t0: t })
      t += 1.3
      expect(types(evs)).toContain('mirrorLit')
    }
    expect(s.exposed).toBe(true)
    // the window closes and the mirrors reset; below half, mirages rise
    const evs = run(s, FIGHTS.boss_sirocco.open + 0.5, { player: { x: c.x, z: c.z }, boss, t0: t, hpFrac: 0.4 })
    expect(types(evs)).toEqual(expect.arrayContaining(['cover', 'mirage']))
    expect(s.mirrors.every((m) => !m.lit)).toBe(true)
  })

  it('Queen Rimefang: a fire melts her armour, the cold bites away from the fires, and only a fire shelters you from her breath', () => {
    const c = arena('boss_rime')
    const s = createFight('boss_rime', c)
    const far = { x: c.x, z: c.z }
    run(s, 0.1, { player: far, boss: far })
    // cold climbs away from the fires until it bites
    const cold = run(s, 22, { player: far, boss: { x: c.x + 100, z: c.z }, t0: 0.1 })
    expect(types(cold)).toContain('chill')
    // the breath: a warning, then a hit unless you're warm
    expect(types(cold)).toEqual(expect.arrayContaining(['breathWarn', 'breath']))
    const b0 = s.braziers[0]
    expect(isWarm(s, b0.x, b0.z)).toBe(true)
    expect(inCone({ x: 0, z: 0 }, 0, 10, 0.5, { x: 5, z: 0 })).toBe(true)
    expect(inCone({ x: 0, z: 0 }, 0, 10, 0.5, { x: 0, z: 5 })).toBe(false)
    // lure her into a brazier: it melts her armour and the fire gutters out
    const lure = run(s, 2, { player: b0, boss: { x: b0.x + 1, z: b0.z }, t0: 30 })
    expect(types(lure)).toEqual(expect.arrayContaining(['brazierOut', 'expose']))
    expect(s.braziers[0].lit).toBe(false)
    const relit = run(s, FIGHTS.boss_rime.relight + 1, { player: far, boss: far, t0: 32 })
    expect(types(relit)).toEqual(expect.arrayContaining(['cover', 'brazierLit']))
  })

  it('the Cinder Tyrant: bombs blow up if left, and three kicked back crack his shell open', () => {
    const c = arena('boss_cinder')
    const s = createFight('boss_cinder', c)
    const boss = { x: c.x, z: c.z }
    const away = { x: c.x + 12, z: c.z }
    run(s, 0.1, { player: away, boss })
    const left = run(s, 8, { player: away, boss, t0: 0.1 })
    expect(types(left)).toContain('throw')
    const blasts = left.filter((e) => e.type === 'blast')
    expect(blasts.length).toBeGreaterThan(0)
    expect(blasts[0].hit).toBe(true) // it landed at your feet
    // walk onto every bomb that lands: each kicked one flies home and cracks the shell
    let t = 9
    while (!s.exposed && t < 60) {
      const bomb = s.bombs.find((b) => b.phase === 'fizz')
      run(s, 0.2, { player: bomb ? { x: bomb.x, z: bomb.z } : away, boss, t0: t })
      t += 0.2
    }
    expect(s.exposed).toBe(true)
    expect(s.bombs).toEqual([])
  })

  it('Mother Miasma: rot pods ward her, popping them all makes her wilt, and she replants more', () => {
    const c = arena('boss_mire')
    const s = createFight('boss_mire', c)
    const boss = { x: c.x, z: c.z }
    const begin = run(s, 0.1, { player: boss, boss, podsAlive: 0 })
    const plant = begin.find((e) => e.type === 'plant')
    expect(plant.spots).toHaveLength(3)
    expect(s.exposed).toBe(false) // a grace moment for the pods to grow in
    run(s, 3, { player: boss, boss, podsAlive: 3, t0: 0.1 })
    expect(s.exposed).toBe(false)
    run(s, 0.2, { player: boss, boss, podsAlive: 0, t0: 3.1 })
    expect(s.exposed).toBe(true)
    const again = run(s, FIGHTS.boss_mire.open + 0.5, { player: boss, boss, podsAlive: 0, t0: 3.3 })
    expect(again.find((e) => e.type === 'plant').spots).toHaveLength(4)
  })

  it('keeps the champion in its arena', () => {
    const c = arena('boss_rime')
    const s = createFight('boss_rime', c)
    expect(keepInArena(s, c.x + 5, c.z, 2)).toBe(null)
    const back = keepInArena(s, c.x + 40, c.z, 2)
    expect(Math.hypot(back.x - c.x, back.z - c.z)).toBeCloseTo(ARENA_KEEP - 2, 5)
  })
})
