import { describe, expect, it } from 'vitest'
import { HEROES, addRage, chargeLevel, fanAngles, gloryKillReady, infinityPush, linePoint } from '../src/logic/heroes.js'
import { AWAKENED, HERO_ABILITIES, traitTune } from '../src/logic/heroPowers.js'

const LEGENDARY = ['shiro', 'ranger', 'ragnar', 'doomguard', 'paolo', 'chompy', 'blox', 'haru', 'poppy', 'buster']

describe('legendary heroes', () => {
  it('ten of them, all pricey, and Shiro costs the most at 3000', () => {
    const byId = Object.fromEntries(HEROES.map((h) => [h.id, h]))
    for (const id of LEGENDARY) {
      expect(byId[id], id).toBeTruthy()
      expect(byId[id].cost).toBeGreaterThanOrEqual(2500)
      expect(AWAKENED[id].desc).toBeTruthy()
      expect(HERO_ABILITIES[id].name).toBeTruthy()
    }
    expect(byId.shiro.cost).toBe(3000)
    expect(Math.max(...HEROES.map((h) => h.cost))).toBe(3000)
  })

  it('Infinity pushes a monster inside the gap out to its edge, and leaves others alone', () => {
    const c = { x: 0, z: 0 }
    const out = infinityPush(c, { x: 1, z: 0 }, 1.7, 0.5)
    expect(out.x).toBeCloseTo(2.2)
    expect(out.z).toBeCloseTo(0)
    expect(infinityPush(c, { x: 5, z: 0 }, 1.7, 0.5)).toBe(null)
    expect(Math.hypot(...Object.values(infinityPush(c, { x: 0, z: 0 }, 1.7, 0.5)))).toBeCloseTo(2.2)
    expect(traitTune('limitless', true).wall).toBeGreaterThan(traitTune('limitless', false).wall)
  })

  it('rage fills and caps; glory kills need a stagger (bosses only when awake)', () => {
    expect(addRage(28, 3, 30)).toEqual({ rage: 30, full: true })
    expect(addRage(5, 1, 30)).toEqual({ rage: 6, full: false })
    expect(gloryKillReady(20, 100, false, 0.25)).toBe(true)
    expect(gloryKillReady(30, 100, false, 0.25)).toBe(false)
    expect(gloryKillReady(5, 100, true, 0.25, 0)).toBe(false)
    expect(gloryKillReady(5, 100, true, 0.4, 0.08)).toBe(true)
    expect(gloryKillReady(0, 100, false)).toBe(false)
  })

  it('shots fly straight, fans are even, the charge fills over time', () => {
    const end = linePoint({ x: 1, z: 1 }, Math.PI / 2, 1, 10)
    expect(end.x).toBeCloseTo(11)
    expect(end.z).toBeCloseTo(1)
    expect(fanAngles(0, 1)).toEqual([0])
    const fan = fanAngles(0, 3, 0.6)
    expect(fan[0]).toBeCloseTo(-0.3)
    expect(fan[1]).toBeCloseTo(0)
    expect(fan[2]).toBeCloseTo(0.3)
    expect(chargeLevel(1.5, 0, 3)).toBeCloseTo(0.5)
    expect(chargeLevel(9, 0, 3)).toBe(1)
  })
})
