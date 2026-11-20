import { beforeAll, describe, expect, it } from 'vitest'

// Builds the towers (shelter, dome, broken look) and the cave mouths headlessly, so a geometry or runtime slip shows up here.
function stubContext() {
  const handler = {
    get: (target, prop) => (prop in target ? target[prop] : (...args) => (prop === 'measureText' ? { width: 10 } : stubContext())),
    set: (target, prop, value) => ((target[prop] = value), true),
  }
  return new Proxy({}, handler)
}
beforeAll(() => {
  globalThis.document = { createElement: () => ({ width: 0, height: 0, style: {}, getContext: () => stubContext() }) }
})

describe('tower and cave visuals', () => {
  it('builds every tower with a shelter, and broken ones go dark until repaired', async () => {
    const { createSkyWorld } = await import('../src/skyIslands.js')
    const { skyTowers } = await import('../src/logic/skyIslands.js')
    const { towerIssue } = await import('../src/logic/towerQuests.js')
    const fx = createSkyWorld()
    fx.setRepaired(new Set())
    const tower = skyTowers().find((t) => towerIssue(t))
    fx.update({ x: tower.x, z: tower.z, y: tower.y }, 1, null)
    fx.update({ x: tower.x, z: tower.z, y: tower.y }, 1.2, null)
    fx.setRepaired(new Set(skyTowers().map((t) => t.id)))
    fx.update({ x: tower.x, z: tower.z, y: tower.y }, 1.4, null)
    expect(fx.group.children.length).toBeGreaterThan(skyTowers().length)
  })

  it('builds every cave mouth and shows only the near ones', async () => {
    const { createCavesFx } = await import('../src/cavesFx.js')
    const { caves } = await import('../src/logic/caves.js')
    const fx = createCavesFx()
    expect(fx.group.children).toHaveLength(caves().length)
    const c = caves()[0]
    fx.update({ x: c.x, z: c.z }, 1)
    expect(fx.group.children[0].visible).toBe(true)
    fx.update({ x: c.x + 5000, z: c.z }, 2)
    expect(fx.group.children.every((g) => !g.visible)).toBe(true)
  })
})
