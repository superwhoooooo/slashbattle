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

describe('Realist creatures', () => {
  it('has a creature design for every monster and boss', async () => {
    const { MONSTER_TYPES } = await import('../src/config.js')
    const { hasBeast } = await import('../src/beasts.js')
    for (const type of Object.keys(MONSTER_TYPES)) expect(hasBeast(type), type).toBe(true)
  })

  it('builds every type as one baked, shared, finite mesh standing on the ground', async () => {
    const { setGraphicsStyle } = await import('../src/graphicsStyle.js')
    const { MONSTER_TYPES } = await import('../src/config.js')
    const { createMonsterMesh } = await import('../src/characters.js')
    const { updateJelly, jellyHit } = await import('../src/jelly.js')
    setGraphicsStyle('shard')
    for (const [type, stats] of Object.entries(MONSTER_TYPES)) {
      const mesh = createMonsterMesh(type)
      const { body, rigid } = mesh.userData.jelly
      expect(rigid, type).toBe(true)
      expect(mesh.userData.face3d, type).toBeUndefined()
      const geo = body.geometry
      expect(geo.userData.shared, type).toBe(true)
      for (const name of ['position', 'normal', 'color', 'aGlow', 'aWig', 'aWigX']) expect(geo.attributes[name], `${type} ${name}`).toBeDefined()
      expect(geo.attributes.position.array.every(Number.isFinite), type).toBe(true)
      expect(geo.attributes.normal.array.every(Number.isFinite), type).toBe(true)
      geo.computeBoundingBox()
      // Feet on the floor (a little sink or float is fine), and roughly the monster's size.
      expect(geo.boundingBox.min.y, type).toBeGreaterThan(-0.4)
      expect(geo.boundingBox.min.y, type).toBeLessThan(0.75)
      const height = (geo.boundingBox.max.y - geo.boundingBox.min.y) * body.scale.y
      expect(height, type).toBeGreaterThan(stats.size * 0.6)
      expect(height, type).toBeLessThan(stats.size * 2.2)
      // Same type, same geometry: one upload however many spawn.
      expect(createMonsterMesh(type).userData.jelly.body.geometry, type).toBe(geo)

      mesh.userData.creature.update(0.016, 3, 1)
      mesh.userData.creature.update(0.016, 0, 1.1)
      jellyHit(mesh, 0.9)
      updateJelly(mesh, 0.016, 1, { speed: 2, moveDir: { x: 0, z: 1 } })
      expect(body.scale.y, type).toBeLessThan(body.scale.x)
    }
    setGraphicsStyle('jelly')
  })

  it('uses jelly bodies in the Jelly style, and creatures in the Wilds regardless', async () => {
    const { setGraphicsStyle, setWildsLook } = await import('../src/graphicsStyle.js')
    const { createMonsterMesh } = await import('../src/characters.js')
    setGraphicsStyle('jelly')
    setWildsLook(false)
    expect(createMonsterMesh('blobbo').userData.creature).toBeUndefined()
    expect(createMonsterMesh('blobbo').userData.face3d).toBeDefined()
    setWildsLook(true)
    expect(createMonsterMesh('blobbo').userData.creature).toBeDefined()
    setWildsLook(false)
  })

  it('gives each creature a Shardfall-style skin, boss forms wearing their regular form\'s', async () => {
    const { MONSTER_TYPES } = await import('../src/config.js')
    const { SKINS, beastSkin, beastLook } = await import('../src/beasts.js')
    for (const type of Object.keys(MONSTER_TYPES)) expect(SKINS, type).toContain(beastSkin(type))
    expect(beastSkin('blobbo')).toBe('hide')
    expect(beastSkin('bumble')).toBe('fuzz')
    expect(beastSkin('drillbit')).toBe('metal')
    expect(beastSkin('boss_bumble')).toBe('fuzz')
    expect(beastLook('grumpus').skin).toBe('shell')
    expect(new Set(Object.keys(MONSTER_TYPES).map(beastSkin)).size).toBe(SKINS.length) // every skin is used
  })
})
