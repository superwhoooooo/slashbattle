import { describe, expect, it } from 'vitest'
import { restPose, weaponPose } from '../src/logic/weaponAnim.js'
import { PLAYER_BODY_RADIUS } from '../src/config.js'
import { WEAPONS } from '../src/logic/items.js'

describe('weapon animation', () => {
  it('keeps its rest radius in step with the player body', () => {
    expect(restPose('sword').r).toBeCloseTo(PLAYER_BODY_RADIUS + 0.1)
  })
  it('gives every weapon finite poses across the swing and returns to rest', () => {
    for (const id of Object.keys(WEAPONS)) {
      for (let t = 0; t <= 1.0001; t += 0.05) {
        for (const v of Object.values(weaponPose(id, t))) expect(Number.isFinite(v)).toBe(true)
      }
      expect(weaponPose(id, 0)).toEqual(expect.objectContaining({ r: restPose(id).r }))
      expect(weaponPose(id, null)).toEqual(restPose(id))
    }
  })
  it('moves each weapon in its own way', () => {
    const reach = (id, t) => weaponPose(id, t).r
    expect(reach('spear', 0.55)).toBeGreaterThan(reach('spear', 0.3) + 1) // a thrust
    expect(weaponPose('hammer', 0.55).pitch).toBeGreaterThan(weaponPose('hammer', 0.3).pitch + 2) // an overhead slam
    expect(weaponPose('flail', 0.9).yaw - weaponPose('flail', 0.1).yaw).toBeGreaterThan(Math.PI) // a whirl
    expect(reach('railgun', 0.55)).toBeLessThan(reach('railgun', 0.2)) // recoil
  })
})
