import { describe, expect, it } from 'vitest'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { FRONTIER_MODELS } from '../src/frontierModels.js'
import { BIOMES, LANDMARK_KINDS, PROP_RADIUS, landmarkLayout, landmarks } from '../src/logic/world.js'

describe('Frontier and landmark models', () => {
  it('builds every model into mergeable lit / glow geometry', () => {
    for (const [kind, build] of Object.entries(FRONTIER_MODELS)) {
      const model = build()
      expect(model.lit.length + model.glow.length, kind).toBeGreaterThan(0)
      for (const parts of [model.lit, model.glow]) {
        if (!parts.length) continue
        const merged = mergeGeometries(parts)
        expect(merged, kind).not.toBeNull()
        expect(merged.attributes.color, kind).toBeDefined()
      }
    }
  })

  it('has a model and a collision radius for every Frontier prop and landmark prop', () => {
    const kinds = new Set()
    for (const id of ['glowcap', 'saltglass', 'drowned', 'stormcrown', 'bonewaste', 'skyshard']) for (const [kind] of BIOMES[id].props) kinds.add(kind)
    for (const lm of landmarks()) for (const p of landmarkLayout(lm).props) if (p.kind !== 'blocker') kinds.add(p.kind)
    for (const kind of kinds) expect(PROP_RADIUS[kind], kind).toBeTypeOf('number')
    // Every landmark kind is laid out with something to see.
    for (const kind of Object.keys(LANDMARK_KINDS)) {
      const lm = landmarks().find((l) => l.kind === kind)
      if (lm) expect(landmarkLayout(lm).props.length, kind).toBeGreaterThan(0)
    }
  })
})
