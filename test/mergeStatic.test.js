import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { mergeStaticMeshes } from '../src/mergeStatic.js'

const box = (material, x, { cast = false } = {}) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material)
  m.position.x = x
  m.castShadow = cast
  return m
}

describe('mergeStaticMeshes', () => {
  it('merges meshes whose materials look identical, keeping world placement', () => {
    const root = new THREE.Group()
    const inner = new THREE.Group()
    inner.position.y = 5
    root.add(inner)
    // Two distinct material objects with identical settings share one bucket.
    inner.add(box(new THREE.MeshStandardMaterial({ color: 0xff0000 }), 0))
    inner.add(box(new THREE.MeshStandardMaterial({ color: 0xff0000 }), 10))
    const { before, after } = mergeStaticMeshes(root)
    expect(before).toBe(2)
    expect(after).toBe(1)
    const meshes = []
    root.traverse((o) => o.isMesh && meshes.push(o))
    expect(meshes).toHaveLength(1)
    const bbox = new THREE.Box3().setFromBufferAttribute(meshes[0].geometry.attributes.position)
    expect(bbox.min.x).toBeCloseTo(-0.5)
    expect(bbox.max.x).toBeCloseTo(10.5)
    expect(bbox.min.y).toBeCloseTo(4.5)
  })

  it('keeps different colors and different shadow flags apart', () => {
    const root = new THREE.Group()
    const red = new THREE.MeshStandardMaterial({ color: 0xff0000 })
    root.add(box(red, 0), box(red, 2), box(red, 4, { cast: true }), box(new THREE.MeshStandardMaterial({ color: 0x00ff00 }), 6))
    const { after } = mergeStaticMeshes(root)
    expect(after).toBe(3) // red no-shadow (merged), red cast (single), green (single)
  })

  it('leaves multi-material meshes and sprites alone', () => {
    const root = new THREE.Group()
    const m = new THREE.MeshStandardMaterial()
    const multi = new THREE.Mesh(new THREE.CylinderGeometry(), [m, m, m])
    const sprite = new THREE.Sprite()
    root.add(multi, sprite)
    mergeStaticMeshes(root)
    expect(root.children).toContain(multi)
    expect(root.children).toContain(sprite)
  })
})
