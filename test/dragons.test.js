import { describe, expect, it } from 'vitest'
import { BREATHS, SCALES, breathVictims, dragonSetup, isDragon, tuneDragon } from '../src/logic/dragons.js'
import { PETS } from '../src/logic/items.js'
import { createProfile, normalizeProfile, setDragonOption } from '../src/logic/profile.js'
import { isFighter, isRanged } from '../src/logic/petAI.js'

const dragons = Object.values(PETS).filter(isDragon)

describe('dragon pets', () => {
  it('ships several dragons that default to a real scale and breath', () => {
    expect(dragons.length).toBeGreaterThanOrEqual(5)
    for (const d of dragons) {
      expect(SCALES[d.defaultScale], d.id).toBeTruthy()
      expect(BREATHS[d.defaultBreath], d.id).toBeTruthy()
      expect(d.model).toBe('dragon')
      expect(isRanged(d) && isFighter(d)).toBe(true)
    }
  })

  it('folds the breath into the dragon', () => {
    const d = PETS.cinderwing
    const venom = tuneDragon(d, { scale: 'obsidian', breath: 'venom' })
    expect(venom.bolts).toBe(3)
    expect(venom.damage).toBeLessThan(d.damage)
    expect(venom.scale.id).toBe('obsidian')
    const voidBreath = tuneDragon(d, { scale: 'crimson', breath: 'void' })
    expect(voidBreath.damage).toBeGreaterThan(d.damage)
    expect(voidBreath.interval).toBeGreaterThan(d.interval)
  })

  it('uses the saved picks, then the dragon\'s own defaults', () => {
    expect(dragonSetup(createProfile(), PETS.glacier)).toEqual({ scale: 'azure', breath: 'frost' })
    const p = setDragonOption(createProfile(), 'glacier', 'scale', 'amethyst')
    expect(dragonSetup(p, PETS.glacier)).toEqual({ scale: 'amethyst', breath: 'frost' })
  })

  it('ignores bad picks and non-dragons, steps through every option', () => {
    const p = createProfile()
    expect(setDragonOption(p, 'sparky', 'scale', 'azure')).toBe(p)
    expect(setDragonOption(p, 'glacier', 'scale', 'nope')).toBe(p)
    let q = p
    const seen = new Set()
    for (let i = 0; i < Object.keys(SCALES).length; i++) {
      q = setDragonOption(q, 'glacier', 'scale', 1, true)
      seen.add(q.dragons.glacier.scale)
    }
    expect(seen.size).toBe(Object.keys(SCALES).length)
  })

  it('keeps only valid dragon picks when loading a save', () => {
    const profile = normalizeProfile({ dragons: { glacier: { scale: 'opal', breath: 'bogus' }, sparky: { scale: 'opal' } } })
    expect(profile.dragons).toEqual({ glacier: { scale: 'opal' } })
  })

  it('splashes nearby enemies and chains lightning to the closest ones', () => {
    const at = { x: 0, z: 0 }
    const primary = {}
    const near = { x: 1, z: 0, ref: {} }
    const far = { x: 3, z: 0, ref: {} }
    const flame = tuneDragon(PETS.cinderwing, { scale: 'crimson', breath: 'flame' })
    expect(breathVictims(flame, at, primary, [near, far]).map((v) => v.ref)).toEqual([near.ref])
    const storm = tuneDragon(PETS.cinderwing, { scale: 'crimson', breath: 'storm' })
    expect(breathVictims(storm, at, primary, [far, near]).map((v) => v.ref)).toEqual([near.ref, far.ref])
  })
})

import { SPECIALS, distanceToSegment } from '../src/logic/dragons.js'

describe('dragon specials', () => {
  it('gives every dragon its own special', () => {
    const ids = dragons.map((d) => d.special)
    expect(new Set(ids).size).toBe(dragons.length)
    for (const d of dragons) expect(SPECIALS[d.special], d.id).toBeTruthy()
    expect(PETS.voidmaw.special).toBe('voidbeam')
    expect(tuneDragon(PETS.voidmaw, {}).specialInfo.id).toBe('voidbeam')
  })

  it('measures distance to a beam line', () => {
    const a = { x: 0, z: 0 }
    const b = { x: 10, z: 0 }
    expect(distanceToSegment({ x: 5, z: 2 }, a, b)).toBeCloseTo(2)
    expect(distanceToSegment({ x: 13, z: 4 }, a, b)).toBeCloseTo(5)
  })
})
