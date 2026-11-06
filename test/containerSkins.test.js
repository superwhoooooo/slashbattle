import { describe, expect, it } from 'vitest'
import { CONTAINER_SKINS, containerSkin } from '../src/logic/containerSkins.js'
import { LEVELS } from '../src/logic/levels.js'

describe('container skins', () => {
  it('has a chest and suitcase look for every level style and the labyrinth', () => {
    for (const level of LEVELS) {
      expect(CONTAINER_SKINS[level.props.style].chest).toBeTruthy()
      expect(CONTAINER_SKINS[level.props.style].case).toBeTruthy()
    }
    expect(CONTAINER_SKINS.dungeon).toBeTruthy()
  })

  it('looks different per place and falls back to the resort', () => {
    const shells = new Set(Object.values(CONTAINER_SKINS).map((s) => s.chest.body))
    expect(shells.size).toBe(Object.keys(CONTAINER_SKINS).length)
    expect(containerSkin('nope')).toBe(CONTAINER_SKINS.resort)
  })
})
