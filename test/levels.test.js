import { describe, expect, it } from 'vitest'
import { LEVELS, LEVEL_ORDER, levelAt, levelIndexAfterBosses } from '../src/logic/levels.js'
import { resortLayout } from '../src/logic/resortLayout.js'

describe('levels', () => {
  it('advances one level per boss and wraps around', () => {
    expect(levelIndexAfterBosses(0)).toBe(0)
    expect(levelIndexAfterBosses(1)).toBe(LEVELS.findIndex((l) => l.name === 'Frostbite Spa'))
    expect(levelIndexAfterBosses(LEVELS.length)).toBe(0)
    expect(levelAt(LEVELS.length + 2)).toBe(LEVELS[2])
    expect(levelAt(-1)).toBe(LEVELS[LEVELS.length - 1])
  })

  it('visits every level once per cycle, with water rooms every other map after Frostbite Spa', () => {
    expect([...LEVEL_ORDER].sort((a, b) => a - b)).toEqual(LEVELS.map((_, i) => i))
    const names = LEVEL_ORDER.map((i) => LEVELS[i].name)
    expect(names.slice(0, 2)).toEqual(['Orbital Resort', 'Frostbite Spa'])
    const after = LEVEL_ORDER.slice(2).map((i) => Boolean(LEVELS[i].water))
    expect(after).toEqual([true, false, true, false, true, false])
  })

  it('gives every level a unique name and seed and a full theme', () => {
    expect(new Set(LEVELS.map((l) => l.name)).size).toBe(LEVELS.length)
    expect(new Set(LEVELS.map((l) => l.seed)).size).toBe(LEVELS.length)
    for (const level of LEVELS) {
      expect(level.props.umbrellaColors.length).toBeGreaterThan(0)
      expect(level.props.signTexts.length).toBeGreaterThan(0)
      expect(level.sky.top && level.sky.horizon && level.sky.ground).toBeTruthy()
    }
  })

  it('lays out props with the level palette and keeps them off avoided spots', () => {
    const avoid = [{ x: 20, z: 0, radius: 6 }]
    const layout = resortLayout({
      radius: 48,
      seed: LEVELS[1].seed,
      avoid,
      umbrellaColors: LEVELS[1].props.umbrellaColors,
      signTexts: LEVELS[1].props.signTexts,
    })
    for (const u of layout.umbrellas) expect(LEVELS[1].props.umbrellaColors).toContain(u.color)
    for (const s of layout.signs) expect(LEVELS[1].props.signTexts).toContain(s.text)
    for (const prop of [...layout.umbrellas, ...layout.loungers, ...layout.signs]) {
      expect(Math.hypot(prop.x - 20, prop.z) - prop.radius).toBeGreaterThanOrEqual(6)
    }
  })
})

describe('level prop styles', () => {
  it('has a feature and seat model for every level style', async () => {
    const { PROP_STYLES } = await import('../src/props.js')
    for (const level of LEVELS) {
      expect(PROP_STYLES[level.props.style]).toBeDefined()
      expect(typeof PROP_STYLES[level.props.style].feature).toBe('function')
      expect(typeof PROP_STYLES[level.props.style].seat).toBe('function')
    }
  })

  it('builds every style without throwing', async () => {
    const { PROP_STYLES } = await import('../src/props.js')
    for (const level of LEVELS) {
      const style = PROP_STYLES[level.props.style]
      const feature = style.feature({ x: 1, z: 2, radius: 1.1, color: level.props.umbrellaColors[0] }, 0, level)
      const seat = style.seat({ x: 3, z: 4, radius: 0.5, rotation: 0.5 }, 0, level)
      expect(feature.position.x).toBe(1)
      expect(seat.position.z).toBe(4)
    }
  })

  // A transmissive material makes three.js re-render the whole scene every frame (see props.js).
  it('uses no transmissive materials in any style', async () => {
    const { PROP_STYLES } = await import('../src/props.js')
    for (const level of LEVELS) {
      const style = PROP_STYLES[level.props.style]
      for (const object of [
        style.feature({ x: 0, z: 0, radius: 1.1, color: level.props.umbrellaColors[0] }, 0, level),
        style.seat({ x: 0, z: 0, radius: 0.5, rotation: 0 }, 0, level),
      ]) {
        object.traverse((o) => {
          for (const m of [o.material].flat().filter(Boolean)) expect(m.transmission ?? 0).toBe(0)
        })
      }
    }
  })
})
