import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { createJellyBody, jellyHit, updateJelly } from '../src/jelly.js'

const makeBody = () => createJellyBody(new THREE.IcosahedronGeometry(0.5, 1), new THREE.MeshStandardMaterial(), 0xffffff, 0.5)
const positions = (body) => Array.from(body.userData.jelly.body.geometry.attributes.position.array)

describe('a hero in gear keeps a still jelly', () => {
  it('never moves a vertex (no breathing out through the mask), even after a hit', () => {
    const body = makeBody()
    const rest = Array.from(body.userData.jelly.originalPositions)
    updateJelly(body, 0.016, 0, { speed: 6, still: false }) // a frame of normal wobble first
    jellyHit(body, -1.4) // the big inflate
    for (let i = 0; i < 60; i++) {
      updateJelly(body, 0.016, i * 0.016, { speed: 6, still: true })
      expect(positions(body)).toEqual(rest)
    }
  })

  it('squashes the whole group (gear included) instead, and settles back to 1', () => {
    const body = makeBody()
    jellyHit(body, 0.9)
    updateJelly(body, 0.016, 0, { still: true })
    expect(body.scale.y).toBeLessThan(1)
    expect(body.scale.x).toBeGreaterThan(1)
    for (let i = 0; i < 400; i++) updateJelly(body, 0.016, i * 0.016, { still: true })
    expect(body.scale.y).toBeCloseTo(1, 2)
    updateJelly(body, 0.016, 7, { still: false }) // back to the Guest: group scale resets
    expect(body.scale.toArray()).toEqual([1, 1, 1])
  })

  it('the bare jelly (the Guest) still breathes', () => {
    const body = makeBody()
    const rest = positions(body)
    updateJelly(body, 0.016, 1.3, {})
    expect(positions(body)).not.toEqual(rest)
  })
})
