import { beforeAll, describe, expect, it } from 'vitest'

// No DOM in the test environment: a stub canvas whose 2D context accepts any call is enough
// for the textures the monsters build (they are never uploaded to a GPU here).
function stubContext() {
  const handler = {
    get: (target, prop) => {
      if (prop in target) return target[prop]
      return (...args) => (prop === 'measureText' ? { width: 10 } : stubContext())
    },
    set: (target, prop, value) => {
      target[prop] = value
      return true
    },
  }
  return new Proxy({}, handler)
}

beforeAll(() => {
  globalThis.document = {
    createElement: () => ({ width: 0, height: 0, style: {}, getContext: () => stubContext() }),
  }
})

describe('Realist style creatures', () => {
  it('builds every monster type without throwing, with a creature to animate', async () => {
    const { setGraphicsStyle } = await import('../src/graphicsStyle.js')
    const { MONSTER_TYPES } = await import('../src/config.js')
    const { createMonsterMesh } = await import('../src/characters.js')
    const { creatureKind } = await import('../src/creatures.js')
    setGraphicsStyle('shard')
    for (const type of Object.keys(MONSTER_TYPES)) {
      const mesh = createMonsterMesh(type)
      expect(mesh.userData.creature, type).toBeDefined()
      mesh.userData.creature.update(0.016, 3, 1)
      mesh.userData.creature.update(0.016, 0, 1.1)
    }
    expect(creatureKind({ shape: 'sphere' })).toBe('crawler')
    expect(creatureKind({ shape: 'box' })).toBe('walker')
    expect(creatureKind({ shape: 'octahedron' })).toBe('floater')
    expect(creatureKind({ shape: 'sphere', accessory: 'limbs' })).toBe(null)
    setGraphicsStyle('jelly')
    expect(createMonsterMesh('blobbo').userData.creature).toBeUndefined()
  })
})
