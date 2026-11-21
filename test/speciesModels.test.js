import { describe, expect, it } from 'vitest'
import { animateSpecies, buildSpecies, setMood, speciesHeight } from '../src/speciesModels.js'
import { SPECIES } from '../src/logic/species.js'

describe('the storm peoples\' bodies', () => {
  it('builds each people as its own creature, and its champion bigger with gear and a glow', () => {
    const builds = new Set()
    for (const id of Object.keys(SPECIES)) {
      const folk = buildSpecies(id, SPECIES[id].colors[0])
      const champ = buildSpecies(id, SPECIES[id].champion.color, { champion: true })
      let n = 0
      folk.traverse((o) => o.isMesh && n++)
      let m = 0
      champ.traverse((o) => o.isMesh && m++)
      const shape = []
      folk.traverse((o) => o.isMesh && shape.push(o.geometry.type))
      builds.add(shape.sort().join(','))
      expect(m).toBeGreaterThan(n) // gear + the glow ring
      expect(champ.scale.x).toBeGreaterThan(folk.scale.x)
      expect(speciesHeight(folk)).toBeGreaterThan(2)
      expect(folk.userData.rig.legs).toHaveLength(2)
      // Walking swings the legs; standing still lets them hang.
      animateSpecies(folk, 1, 3, 0.1)
      expect(Math.abs(folk.userData.rig.legs[0].rotation.x)).toBeGreaterThan(0)
    }
    expect(builds.size).toBe(4) // four different builds, not one body with ears
  })
})

describe('their moods', () => {
  it('fret (brows up in the middle, a frown, sweat) until their storm is calm, then smile', () => {
    for (const id of Object.keys(SPECIES)) {
      const folk = buildSpecies(id, SPECIES[id].colors[1])
      const { brows, mouth, sweat } = folk.userData.rig.mood
      expect(folk.userData.rig.worried).toBe(true)
      expect(sweat.visible).toBe(true)
      const left = brows.find((b) => b.userData.side < 0)
      expect(left.rotation.z).toBeGreaterThan(0.3) // the inner end raised
      if (mouth) expect(mouth.rotation.z).toBe(0) // a frown
      animateSpecies(folk, 2, 0, 0.1) // standing about: wringing their hands
      expect(folk.userData.rig.arms[0].rotation.x).toBeLessThan(-0.5)
      setMood(folk, false)
      expect(sweat.visible).toBe(false)
      expect(Math.abs(left.rotation.z)).toBeLessThan(0.15)
      if (mouth) expect(mouth.rotation.z).toBeCloseTo(Math.PI) // a smile
      const champ = buildSpecies(id, SPECIES[id].champion.color, { champion: true })
      expect(champ.userData.rig.mood.sweat.visible).toBe(false) // champions look grim, not scared
    }
  })
})
