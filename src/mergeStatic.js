import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

// Collapses a static (never animated, never individually toggled) group of meshes into one mesh per
// distinct material look + shadow setting. The sundeck's props and deck bands were ~90 separate
// meshes, each with its own material, so every frame paid ~90 draw calls plus ~70 more in the
// shadow pass; merged, that's a handful. Each Chrome draw call costs GPU-process CPU, and on a
// laptop that work turns into heat and thermal throttling.
//
// Left untouched (they stay where they are): multi-material meshes, non-Mesh objects (sprites,
// lights, points), meshes mirrored by a negative scale, and any mesh whose geometry attributes
// don't match the rest of its bucket. Returns { before, after } mesh counts.
export function mergeStaticMeshes(root) {
  root.updateMatrixWorld(true)
  const toRoot = new THREE.Matrix4().copy(root.matrixWorld).invert()
  const buckets = new Map()
  const candidates = []
  root.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || Array.isArray(o.material) || !o.geometry) return
    if (o.matrixWorld.determinant() < 0) return
    candidates.push(o)
  })
  for (const mesh of candidates) {
    const key = `${materialKey(mesh.material)}|${mesh.castShadow ? 1 : 0}${mesh.receiveShadow ? 1 : 0}|${attributeKey(mesh.geometry)}`
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key).push(mesh)
  }

  let after = 0
  const dropped = new Set()
  for (const meshes of buckets.values()) {
    if (meshes.length < 2) {
      after += meshes.length
      continue
    }
    const geometries = meshes.map((mesh) => {
      const matrix = new THREE.Matrix4().multiplyMatrices(toRoot, mesh.matrixWorld)
      const g = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone()
      g.applyMatrix4(matrix)
      // Groups are per-source-geometry material slots; a single-material merge doesn't need them.
      g.clearGroups()
      return g
    })
    const merged = mergeGeometries(geometries, false)
    geometries.forEach((g) => g.dispose())
    if (!merged) {
      after += meshes.length
      continue
    }
    const first = meshes[0]
    const out = new THREE.Mesh(merged, first.material)
    out.castShadow = first.castShadow
    out.receiveShadow = first.receiveShadow
    out.name = 'mergedStatic'
    root.add(out)
    after++
    for (const mesh of meshes) {
      mesh.removeFromParent()
      mesh.geometry.dispose()
      dropped.add(mesh.material)
    }
  }
  // Dispose replaced materials only if nothing left in the group still uses them.
  const inUse = new Set()
  root.traverse((o) => [o.material].flat().forEach((m) => m && inUse.add(m)))
  for (const m of dropped) if (!inUse.has(m)) m.dispose()
  return { before: candidates.length, after }
}

// Two materials with the same key render identically, so their meshes can share one draw.
function materialKey(m) {
  const hex = (c) => (c ? c.getHexString() : '-')
  return [
    m.type, hex(m.color), hex(m.emissive), m.emissiveIntensity ?? '-', m.roughness ?? '-', m.metalness ?? '-',
    m.map?.uuid ?? '-', m.side, m.flatShading ? 1 : 0, m.transparent ? 1 : 0, m.opacity, m.depthWrite ? 1 : 0,
    m.blending, m.vertexColors ? 1 : 0, m.envMapIntensity ?? '-', m.toneMapped ? 1 : 0, m.fog ? 1 : 0,
  ].join(',')
}

function attributeKey(g) {
  return Object.keys(g.attributes).sort().join(',')
}
