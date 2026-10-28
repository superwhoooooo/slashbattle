// The crystals enemies drop: a pooled InstancedMesh of glowing gems. The
// scatter/homing/pickup rules are pure (src/logic/crystals.js); this owns
// the crystal list, draws them, and reports what was collected.
import * as THREE from 'three'
import { createCrystal, stepCrystal } from './logic/crystals.js'

const MAX_CRYSTALS = 160
const COLOR_BY_VALUE = [
  [5, new THREE.Color(0xffd23f)], // gold
  [2, new THREE.Color(0xff5fd6)], // magenta
  [0, new THREE.Color(0x3de8ff)], // cyan
]
const SCALE_BY_VALUE = [[5, 1.5], [2, 1.15], [0, 1]]

const scratchMatrix = new THREE.Matrix4()
const scratchQuaternion = new THREE.Quaternion()
const scratchPosition = new THREE.Vector3()
const scratchScale = new THREE.Vector3()
const scratchEuler = new THREE.Euler()

function pick(table, value) {
  return table.find(([min]) => value >= min)[1]
}

export function createCrystalSystem() {
  const geometry = new THREE.OctahedronGeometry(0.2, 0)
  geometry.scale(1, 1.5, 1)
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.9,
    metalness: 0.3,
    roughness: 0.25,
    flatShading: true,
  })
  const mesh = new THREE.InstancedMesh(geometry, material, MAX_CRYSTALS)
  mesh.count = 0
  mesh.frustumCulled = false
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  // Per-instance color: the white material is tinted by it.
  mesh.setColorAt(0, new THREE.Color(0xffffff))
  return { mesh, geometry, material, crystals: [] }
}

// Scatters crystals worth `values` (one gem each) from (x, z). If the
// pool is full, the extra value is folded into the newest gem instead of
// dropping it.
export function dropCrystals(system, x, z, values) {
  for (const value of values) {
    if (system.crystals.length >= MAX_CRYSTALS) {
      system.crystals[system.crystals.length - 1].value += value
      continue
    }
    system.crystals.push(createCrystal(x, z, value))
  }
}

// Steps and draws every crystal; returns the total value collected this
// frame (the caller adds it to the inventory).
export function updateCrystals(system, dt, elapsed, playerX, playerZ, magnetRadius) {
  let collected = 0
  let write = 0
  const { crystals, mesh } = system
  for (let i = 0; i < crystals.length; i++) {
    const crystal = crystals[i]
    if (stepCrystal(crystal, dt, playerX, playerZ, magnetRadius)) {
      collected += crystal.value
      continue
    }
    crystals[write++] = crystal

    const slot = write - 1
    const bob = crystal.vy === 0 && !crystal.homing ? Math.sin(elapsed * 3 + i) * 0.06 : 0
    scratchPosition.set(crystal.x, crystal.y + bob, crystal.z)
    scratchEuler.set(0, elapsed * 1.8 + i, 0)
    scratchQuaternion.setFromEuler(scratchEuler)
    scratchScale.setScalar(pick(SCALE_BY_VALUE, crystal.value))
    scratchMatrix.compose(scratchPosition, scratchQuaternion, scratchScale)
    mesh.setMatrixAt(slot, scratchMatrix)
    mesh.setColorAt(slot, pick(COLOR_BY_VALUE, crystal.value))
  }
  crystals.length = write
  mesh.count = write
  mesh.instanceMatrix.needsUpdate = true
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  return collected
}

// Pulls every crystal toward the player (they start homing).
export function attractAllCrystals(system) {
  for (const crystal of system.crystals) crystal.homing = true
}

export function resetCrystals(system) {
  system.crystals.length = 0
  system.mesh.count = 0
}
