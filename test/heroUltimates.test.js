import { describe, expect, it } from 'vitest'
import { HEROES } from '../src/logic/heroes.js'
import { HERO_ABILITIES } from '../src/logic/heroPowers.js'
import {
  HERO_ULTIMATES, MASTERY_STAT_PICKS, STAT_PICK_BONUS, ULTIMATE_LEVEL, hasMasteryChoice, statPick, ultimateFraction, ultimatePower, useUltimate,
} from '../src/logic/heroUltimates.js'

const KINDS = new Set(['nova', 'waves', 'ring', 'line', 'strikes', 'rain', 'hole', 'blades', 'fan', 'pull', 'freeze', 'confuse', 'heal', 'buff', 'invuln', 'timewarp', 'cast'])
const STATUSES = new Set(['burn', 'freeze', 'confuse', 'slow', 'hex'])

describe('hero ultimates (mastery 8)', () => {
  it('every hero has its own, uniquely named ultimate', () => {
    const names = new Set()
    for (const hero of HEROES) {
      const u = HERO_ULTIMATES[hero.id]
      expect(u, hero.id).toBeTruthy()
      expect(u.name.length).toBeGreaterThan(3)
      expect(u.desc.length).toBeGreaterThan(20)
      expect(names.has(u.name)).toBe(false)
      names.add(u.name)
      expect(u.name).not.toBe(HERO_ABILITIES[hero.id].name)
    }
    expect(Object.keys(HERO_ULTIMATES)).toHaveLength(HEROES.length)
  })

  it('only uses step kinds and statuses the game knows, with sane numbers', () => {
    for (const [id, u] of Object.entries(HERO_ULTIMATES)) {
      expect(u.steps.length, id).toBeGreaterThan(0)
      for (const s of u.steps) {
        expect(KINDS.has(s.k), `${id}: ${s.k}`).toBe(true)
        if (s.status) expect(STATUSES.has(s.status), `${id}: ${s.status}`).toBe(true)
        if (s.dmg !== undefined) expect(s.dmg).toBeGreaterThan(0)
        if (s.n !== undefined) expect(Number.isInteger(s.n) && s.n > 0).toBe(true)
        if (s.k === 'cast') expect(s.times).toBeGreaterThan(0)
        if (s.k === 'buff') expect(s.secs).toBeGreaterThan(0)
        if (s.k === 'heal') expect(s.frac).toBeGreaterThan(0)
      }
    }
  })

  it('is way stronger than the hero ability, on a longer cooldown', () => {
    for (const [id, u] of Object.entries(HERO_ULTIMATES)) {
      expect(u.cooldown, id).toBeGreaterThan(HERO_ABILITIES[id].cooldown)
      expect(ultimatePower(id), id).toBeGreaterThanOrEqual(8)
    }
  })

  it('unlocks at mastery 8', () => {
    expect(ULTIMATE_LEVEL).toBe(8)
    expect(hasMasteryChoice(7)).toBe(false)
    expect(hasMasteryChoice(8)).toBe(true)
    expect(hasMasteryChoice(10)).toBe(true)
  })

  it('goes on cooldown only when picked and ready', () => {
    const cd = HERO_ULTIMATES.guest.cooldown
    expect(useUltimate('guest', false, 0, 0).used).toBe(false)
    const first = useUltimate('guest', true, 10, 0)
    expect(first).toEqual({ used: true, readyAt: 10 + cd })
    expect(useUltimate('guest', true, 11, first.readyAt).used).toBe(false)
    expect(useUltimate('guest', true, 10, 0, 0.5).readyAt).toBe(10 + cd / 2)
    expect(ultimateFraction('guest', 10, 10 + cd)).toBe(1)
    expect(ultimateFraction('guest', 10 + cd / 2, 10 + cd)).toBeCloseTo(0.5)
    expect(ultimateFraction('guest', 10 + cd, 10 + cd)).toBe(0)
  })
})

describe('mastery-8 stat picks', () => {
  it('each is a 10% boost to one stat', () => {
    expect(STAT_PICK_BONUS).toBe(0.1)
    expect(MASTERY_STAT_PICKS.length).toBeGreaterThanOrEqual(6)
    for (const pick of MASTERY_STAT_PICKS) {
      const entries = Object.entries(pick.fx)
      expect(entries).toHaveLength(1)
      const [, v] = entries[0]
      expect([0.1, 0.9, 1.1].some((x) => Math.abs(x - v) < 1e-9), pick.id).toBe(true)
      expect(statPick(pick.id)).toBe(pick)
    }
    expect(statPick('nope')).toBeNull()
  })
})
