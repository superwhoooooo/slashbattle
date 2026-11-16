import { describe, expect, it } from 'vitest'
import { FLAG, MAX_NET_PETS, MAX_NET_SHOTS, packMonster, packPets, packShots, unpackMonster, unpackPets, unpackShots } from '../src/logic/coop.js'

describe('co-op: what else crosses the wire', () => {
  it('carries an amphibious boss being under water', () => {
    const ud = { netId: 4, type: 'boss_x', hp: 10, maxHp: 20, submerged: true }
    const row = unpackMonster(packMonster(ud, { x: 1, y: -2, z: 3 }, 0))
    expect(row.submerged).toBe(true)
    expect(unpackMonster(packMonster({ ...ud, submerged: false }, { x: 1, y: 0, z: 3 }, 0)).submerged).toBe(false)
    expect(FLAG.submerged).toBe(1024)
  })

  it('round-trips pets (with a beam target only while beaming), capped, ignoring junk', () => {
    const rows = packPets([
      { key: 'dylan', x: 1.234, z: 2, y: 0, rotY: 0.5, beamTo: { x: 5, z: 6 } },
      { key: 'd:cinderwing', x: 0, z: 0, y: 3.6, rotY: 0 },
    ])
    const back = unpackPets(JSON.parse(JSON.stringify(rows)))
    expect(back).toHaveLength(2)
    expect(back[0]).toMatchObject({ key: 'dylan', x: 1.23, beamTo: { x: 5, z: 6 } })
    expect(back[1].beamTo).toBeNull()
    expect(unpackPets([[1, 2], ['fox', 'a', 0, 0, 0], 'nope'])).toEqual([])
    expect(unpackPets(Array.from({ length: 20 }, () => ['fox', 0, 0, 0, 0]))).toHaveLength(MAX_NET_PETS)
  })

  it("turns a friend's shots into harmless ghost bullets", () => {
    const shots = unpackShots(packShots([{ x: 0, z: 0, y: 0.7, vx: 10, vz: 0, vy: 0, life: 1, radius: 0.2, color: 0xff00ff, damage: 50 }]))
    expect(shots).toHaveLength(1)
    expect(shots[0]).toMatchObject({ ghost: true, damage: 0, color: 0xff00ff, vx: 10 })
    expect(unpackShots(Array.from({ length: 99 }, () => [0, 0, 0, 1, 1, 0, 1, 0.2, 1]))).toHaveLength(MAX_NET_SHOTS)
    expect(unpackShots([[0, 0, 'x']])).toEqual([])
  })
})
