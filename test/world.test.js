import { describe, expect, it } from 'vitest'
import {
  BIOMES, CHUNK_SIZE, OUTER_BIOMES, SANCTUM_RADIUS, WORLD_RADIUS, UNLOAD_RADIUS,
  biomeAt, canRespawn, chunkContent, chunksAround, dangerAt, diffChunks, groundColorAt, valueNoise,
  LAKES, WATER_LEVEL, chunkCoord, lakeAt, ruinLayout, ruins,
} from '../src/logic/world.js'

describe('world biomes', () => {
  it('has a sanctum in the middle and every outer biome somewhere around it', () => {
    expect(biomeAt(0, 0)).toBe('sanctum')
    expect(biomeAt(SANCTUM_RADIUS - 2, 0)).toBe('sanctum')
    const seen = new Set()
    for (let a = 0; a < 360; a += 3) {
      const r = 200
      seen.add(biomeAt(Math.cos((a * Math.PI) / 180) * r, Math.sin((a * Math.PI) / 180) * r))
    }
    for (const id of OUTER_BIOMES) expect(seen.has(id), id).toBe(true)
  })

  it('is deterministic', () => {
    expect(biomeAt(123, -88)).toBe(biomeAt(123, -88))
    expect(valueNoise(3.3, 4.4)).toBe(valueNoise(3.3, 4.4))
    expect(groundColorAt(50, 60)).toEqual(groundColorAt(50, 60))
  })

  it('ground colours are valid and danger rises outward', () => {
    for (const [x, z] of [[0, 0], [100, 40], [-200, 120], [300, 0]]) {
      for (const c of groundColorAt(x, z)) expect(c).toBeGreaterThanOrEqual(0), expect(c).toBeLessThanOrEqual(1)
    }
    expect(dangerAt(0, 0)).toBe(0)
    expect(dangerAt(WORLD_RADIUS, 0)).toBe(1)
    expect(dangerAt(200, 0)).toBeGreaterThan(dangerAt(100, 0))
  })
})

describe('world chunks', () => {
  it('seeds the same content every time, inside the chunk and the world', () => {
    const a = chunkContent(3, -2)
    expect(chunkContent(3, -2)).toEqual(a)
    for (const p of [...a.props, ...a.monsters, ...a.treasure]) {
      expect(p.x).toBeGreaterThanOrEqual(3 * CHUNK_SIZE)
      expect(p.x).toBeLessThanOrEqual(4 * CHUNK_SIZE)
      expect(p.z).toBeGreaterThanOrEqual(-2 * CHUNK_SIZE)
      expect(p.z).toBeLessThanOrEqual(-1 * CHUNK_SIZE)
    }
  })

  it('keeps the sanctum free of monsters and the spawn point clear', () => {
    for (let cx = -2; cx < 2; cx++) {
      for (let cz = -2; cz < 2; cz++) {
        const c = chunkContent(cx, cz)
        for (const m of c.monsters) expect(Math.hypot(m.x, m.z)).toBeGreaterThan(SANCTUM_RADIUS)
        for (const p of c.props) expect(Math.hypot(p.x, p.z)).toBeGreaterThan(8)
      }
    }
  })

  it('fills the wild with monsters of its biome, tougher farther out', () => {
    let near = 0, far = 0, nearHp = 0, farHp = 0, nearN = 0, farN = 0
    for (let cx = -9; cx < 9; cx++) {
      for (let cz = -9; cz < 9; cz++) {
        const c = chunkContent(cx, cz)
        const r = Math.hypot((cx + 0.5) * CHUNK_SIZE, (cz + 0.5) * CHUNK_SIZE)
        for (const m of c.monsters) {
          expect(Boolean(m.lake || m.ruinId || m.id.includes(':g') || BIOMES[c.biome].monsters.some((e) => e[0] === m.type))).toBe(true)
          if (r < 140) { near++; nearHp += m.hpScale; nearN++ } else if (r > 200) { far++; farHp += m.hpScale; farN++ }
        }
      }
    }
    expect(near).toBeGreaterThan(20)
    expect(far).toBeGreaterThan(20)
    expect(farHp / farN).toBeGreaterThan(nearHp / nearN)
  })

  it('streams chunks with hysteresis', () => {
    const alive = new Set()
    const first = diffChunks(alive, 0, 0)
    expect(first.load.length).toBeGreaterThan(10)
    expect(first.unload).toEqual([])
    for (const c of chunksAround(0, 0)) alive.add(`${c.cx},${c.cz}`)
    expect(diffChunks(alive, 0, 0).load).toEqual([])
    // Walk far away: everything old unloads, new ones load.
    const far = diffChunks(alive, UNLOAD_RADIUS * 2, 0)
    expect(far.unload.length).toBe(alive.size)
    expect(far.load.length).toBeGreaterThan(5)
  })

  it('lets a slain camp come back after a while', () => {
    expect(canRespawn(undefined, 5)).toBe(true)
    expect(canRespawn(10, 20)).toBe(false)
    expect(canRespawn(10, 500)).toBe(true)
  })
})

describe('world grass', () => {
  it('seeds deterministic tufts inside the chunk, lusher in forests than in the embers', () => {
    const a = chunkContent(4, 3)
    expect(chunkContent(4, 3).grass).toEqual(a.grass)
    for (const g of a.grass) {
      expect(g.x).toBeGreaterThanOrEqual(4 * CHUNK_SIZE)
      expect(g.x).toBeLessThanOrEqual(5 * CHUNK_SIZE)
      expect(g.tint).toBeGreaterThanOrEqual(0)
      expect(g.tint).toBeLessThanOrEqual(1)
    }
    const totals = {}
    for (let cx = -8; cx < 8; cx++) {
      for (let cz = -8; cz < 8; cz++) {
        const c = chunkContent(cx, cz)
        totals[c.biome] = totals[c.biome] ?? { n: 0, chunks: 0 }
        totals[c.biome].n += c.grass.length
        totals[c.biome].chunks += 1
      }
    }
    const avg = (b) => totals[b].n / totals[b].chunks
    expect(avg('whisperwood')).toBeGreaterThan(avg('emberwaste'))
    expect(avg('gloomfen')).toBeGreaterThan(avg('emberwaste'))
  })
})

import { VILLAGE_PLAZA_RADIUS, VILLAGE_SAFE_RADIUS, heightAt, villageLayout, villages, nearestVillage } from '../src/logic/world.js'

describe('world hills', () => {
  it('is level in the sanctum and at the rim, deterministic, and rolls in between', () => {
    expect(heightAt(0, 0)).toBeCloseTo(0, 5)
    expect(heightAt(WORLD_RADIUS - 2, 0)).toBeCloseTo(0, 1)
    expect(heightAt(100, 100)).toBe(heightAt(100, 100))
    let lo = Infinity, hi = -Infinity
    for (let x = -280; x <= 280; x += 14) for (let z = -280; z <= 280; z += 14) {
      if (Math.hypot(x, z) > WORLD_RADIUS - 10) continue
      const h = heightAt(x, z)
      lo = Math.min(lo, h); hi = Math.max(hi, h)
      expect(Number.isFinite(h)).toBe(true)
    }
    expect(lo).toBeGreaterThan(-2.2) // lake floors
    expect(hi).toBeGreaterThan(20) // real, tall hills
  })

  it('is smooth: neighbouring points never jump', () => {
    for (let x = -250; x < 250; x += 37) for (let z = -250; z < 250; z += 41) {
      expect(Math.abs(heightAt(x, z) - heightAt(x + 1, z))).toBeLessThan(1.6)
    }
  })
})

describe('villages', () => {
  it('puts a starter village near the sanctum and several more around the continent', () => {
    const list = villages()
    expect(list.length).toBeGreaterThanOrEqual(5)
    const starter = list.find((v) => v.starter)
    expect(Math.hypot(starter.x, starter.z)).toBeLessThan(110)
    expect(new Set(list.map((v) => v.id)).size).toBe(list.length)
    for (const v of list) expect(Math.hypot(v.x, v.z)).toBeLessThan(WORLD_RADIUS - 40)
  })

  it('levels the ground under each plaza', () => {
    for (const v of villages()) {
      for (const [dx, dz] of [[0, 0], [8, 0], [0, -9]]) expect(heightAt(v.x + dx, v.z + dz)).toBeCloseTo(v.baseHeight, 1)
    }
  })

  it('lays out houses, lamps, a well and people, deterministically', () => {
    const v = villages()[0]
    const a = villageLayout(v)
    expect(villageLayout(v)).toEqual(a)
    const kinds = a.props.map((p) => p.kind)
    for (const k of ['well', 'hall', 'noticeBoard', 'lampPost']) expect(kinds).toContain(k)
    expect(kinds.filter((k) => k.startsWith('cottage')).length).toBeGreaterThanOrEqual(4)
    expect(a.npcs.length).toBe(3)
    expect(new Set(a.npcs.map((n) => n.name)).size).toBe(3)
  })

  it('shows up in chunks, keeps wild monsters out, and keeps its folk inside the chunk that holds them', () => {
    const v = villages().find((x) => x.starter)
    let npcs = 0
    for (let cx = -12; cx < 12; cx++) for (let cz = -12; cz < 12; cz++) {
      const c = chunkContent(cx, cz)
      npcs += c.npcs.length
      for (const m of c.monsters) expect(nearestVillage(m.x, m.z, VILLAGE_SAFE_RADIUS)).toBeNull()
      for (const n of c.npcs) {
        expect(n.x).toBeGreaterThanOrEqual(cx * CHUNK_SIZE)
        expect(n.x).toBeLessThan((cx + 1) * CHUNK_SIZE)
      }
    }
    expect(npcs).toBe(villages().length * 3)
    expect(nearestVillage(v.x + 3, v.z, VILLAGE_PLAZA_RADIUS).village.id).toBe(v.id)
  })
})

describe('lakes, ruins and spacing', () => {
  it('has lakes whose beds are below the surface, with water monsters and no trees in them', () => {
    expect(LAKES.length).toBeGreaterThanOrEqual(5)
    for (const lake of LAKES) {
      expect(heightAt(lake.x, lake.z)).toBeLessThan(WATER_LEVEL - 1)
      expect(lakeAt(lake.x, lake.z)).toBe(lake)
      const cx = chunkCoord(lake.x)
      const cz = chunkCoord(lake.z)
      const c = chunkContent(cx, cz)
      expect(c.monsters.filter((m) => m.lake).length).toBeGreaterThanOrEqual(2)
      for (const p of c.props) expect(lakeAt(p.x, p.z)).toBe(null)
    }
  })

  it('keeps villages far apart and out of the lakes, one in every biome', () => {
    const list = villages()
    for (const a of list) {
      for (const b of list) if (a !== b) expect(Math.hypot(a.x - b.x, a.z - b.z)).toBeGreaterThanOrEqual(95)
      expect(lakeAt(a.x, a.z, 0.9)).toBe(null)
    }
    for (const biome of ['whisperwood', 'amethyst', 'frostveil', 'emberwaste', 'gloomfen']) expect(list.some((v) => v.biome === biome)).toBe(true)
  })

  it('scatters ruins: temples guarded by a boss, towers and shrines with loot', () => {
    const list = ruins()
    expect(list.length).toBeGreaterThanOrEqual(8)
    const kinds = new Set(list.map((r) => r.kind))
    expect(kinds).toEqual(new Set(['temple', 'tower', 'shrine']))
    for (const r of list) {
      const layout = ruinLayout(r)
      expect(layout.props.length).toBeGreaterThan(2)
      expect(layout.treasure.length).toBeGreaterThan(0)
      expect(layout.guards.some((g) => g.role === 'boss')).toBe(r.kind === 'temple')
    }
    const temple = list.find((r) => r.kind === 'temple')
    const c = chunkContent(chunkCoord(temple.x - 5), chunkCoord(temple.z + 5))
    expect(c.monsters.some((m) => m.boss)).toBe(true)
  })

  it('has real peaks to glide from', () => {
    let hi = 0
    for (let x = -300; x < 300; x += 6) for (let z = -300; z < 300; z += 6) hi = Math.max(hi, heightAt(x, z))
    expect(hi).toBeGreaterThan(25)
  })
})
