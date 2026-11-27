import { describe, expect, it } from 'vitest'
import { CHUNK_SIZE, chunkContent, propCircles, setDepthsMode, villageLayout, villages } from '../src/logic/world.js'
import { beacons, colosseumLayout, colosseums, depthsChunk } from '../src/logic/depths.js'
import { deepTemples } from '../src/logic/stormTemples.js'

const key = (p) => `${p.kind}:${p.x.toFixed(3)}:${p.z.toFixed(3)}`
const chunkOf = (p) => [Math.floor(p.x / CHUNK_SIZE), Math.floor(p.z / CHUNK_SIZE)]

describe('solid walls', () => {
  it('every solid piece of a village or storm city streams in with its chunk', () => {
    for (const v of villages()) {
      for (const p of villageLayout(v).props.filter((q) => propCircles(q).length)) {
        const props = chunkContent(...chunkOf(p)).props.map(key)
        expect(props, `${v.name} ${p.kind}`).toContain(key(p))
      }
    }
  })

  it('a ruin wall is solid along its whole length, turned with the model', () => {
    const circles = propCircles({ kind: 'ruinWall', x: 10, z: 5, scale: 1, rot: Math.PI / 2, radius: 2 })
    // rotation.y = PI/2 sends model x to world -z.
    const zs = circles.map((c) => c.z - 5)
    expect(Math.min(...zs)).toBeLessThan(-2)
    expect(Math.max(...zs)).toBeGreaterThan(2)
    for (const c of circles) expect(Math.abs(c.x - 10)).toBeLessThan(1e-9)
  })

  it("the colosseum's gate towers stand either side of its gate, and the seating leaves the gate open", () => {
    for (const c of colosseums()) {
      const model = colosseumLayout(c).props.find((p) => p.kind === 'colosseum')
      const circles = propCircles(model)
      const gate = { x: c.x + Math.cos(c.gate) * 27, z: c.z + Math.sin(c.gate) * 27 }
      expect(circles.some((o) => Math.hypot(o.x - gate.x, o.z - gate.z) < o.radius + 1.5)).toBe(false)
      const towers = circles.slice(-2)
      for (const t of towers) {
        const a = Math.atan2(t.z - c.z, t.x - c.x)
        expect(Math.abs(Math.atan2(Math.sin(a - c.gate), Math.cos(a - c.gate)))).toBeLessThan(0.3)
      }
    }
  })

  it("the sunken temples' walls stand in the Depths, leave the gate open and keep off the chests and Lightroots", () => {
    setDepthsMode(true)
    try {
      for (const t of deepTemples()) {
        const [cx, cz] = chunkOf(t)
        const model = depthsChunk(cx, cz).props.find((p) => p.kind === 'deepTemple')
        expect(model).toBeTruthy()
        const circles = propCircles(model)
        expect(circles.length).toBeGreaterThan(40)
        const towardMiddle = Math.atan2(-t.z, -t.x)
        const gate = { x: t.x + Math.cos(towardMiddle) * 26, z: t.z + Math.sin(towardMiddle) * 26 }
        expect(circles.some((o) => Math.hypot(o.x - gate.x, o.z - gate.z) < o.radius + 1.5)).toBe(false)
        const chests = [0.8, 3.9].map((a) => ({ x: t.x + Math.cos(a) * 15, z: t.z + Math.sin(a) * 15 }))
        for (const p of [...chests, ...beacons(), { x: t.x, z: t.z }]) {
          for (const o of circles) expect(Math.hypot(o.x - p.x, o.z - p.z)).toBeGreaterThan(o.radius + 0.5)
        }
      }
    } finally {
      setDepthsMode(false)
    }
  })
})
