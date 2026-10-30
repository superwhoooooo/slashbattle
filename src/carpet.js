import * as THREE from 'three'
import { CARPET_COLOR, CARPET_THICKNESS, CARPET_TRIM_COLOR, CARPET_TRIM_WIDTH, CARPET_WIDTH, CARPET_Y } from './config.js'
import { carpetLengthFraction } from './logic/carpet.js'

// Builds the red carpet for a boss's VIP arrival: a flat red runner with
// a thin gold trim strip down each edge, running from `from` toward
// `to` (both {x, z} points on the deck). The group is pivoted at `from`
// and its geometry spans local z 0..length (not centered), so scaling
// the group's z axis grows the carpet toward `to` without moving the
// near end -- see updateCarpet, driven by the cutscene's `enter` phase.
export function createCarpet(from, to) {
  const dx = to.x - from.x
  const dz = to.z - from.z
  const length = Math.hypot(dx, dz) || 1
  const angle = Math.atan2(dx, dz)

  const group = new THREE.Group()
  group.position.set(from.x, CARPET_Y, from.z)
  group.rotation.y = angle

  const runnerGeometry = new THREE.BoxGeometry(CARPET_WIDTH, CARPET_THICKNESS, length)
  runnerGeometry.translate(0, 0, length / 2)
  const runner = new THREE.Mesh(runnerGeometry, new THREE.MeshStandardMaterial({ color: CARPET_COLOR, roughness: 0.85 }))

  const trimGeometry = new THREE.BoxGeometry(CARPET_TRIM_WIDTH, CARPET_THICKNESS, length)
  trimGeometry.translate(0, 0, length / 2)
  const trimMaterial = new THREE.MeshStandardMaterial({ color: CARPET_TRIM_COLOR, roughness: 0.4, metalness: 0.3 })
  const trimOffset = CARPET_WIDTH / 2 - CARPET_TRIM_WIDTH / 2
  const trimLeft = new THREE.Mesh(trimGeometry, trimMaterial)
  trimLeft.position.x = -trimOffset
  const trimRight = trimLeft.clone()
  trimRight.position.x = trimOffset

  group.add(runner, trimLeft, trimRight)
  return { group, length }
}

// Grows the carpet's unrolled length to match `elapsed` seconds into a
// roll of `duration` seconds (see logic/carpet.js's carpetLengthFraction).
export function updateCarpet(carpet, elapsed, duration) {
  carpet.group.scale.z = carpetLengthFraction(elapsed, duration)
}
