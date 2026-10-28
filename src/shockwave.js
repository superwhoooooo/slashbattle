// A small pool of flat rings that expand from a point on the ground and
// fade -- the visible punch of a boss slam and of the player's Shockwave
// ability. Purely visual: the damage is applied by the caller.
import * as THREE from 'three'

const POOL_SIZE = 8
const DURATION = 0.45

export function createShockwavePool() {
  const group = new THREE.Group()
  const geometry = new THREE.RingGeometry(0.88, 1, 56)
  const slots = []
  for (let i = 0; i < POOL_SIZE; i++) {
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }),
    )
    mesh.rotation.x = -Math.PI / 2
    mesh.position.y = 0.08
    mesh.visible = false
    group.add(mesh)
    slots.push({ mesh, elapsed: null, radius: 1 })
  }
  return { group, slots, geometry }
}

// Starts a ring at (x, z) that grows out to `radius`. Reuses the oldest
// ring if all are busy.
export function spawnShockwave(pool, x, z, radius, color) {
  const slot = pool.slots.find((s) => s.elapsed === null) ?? pool.slots.reduce((a, b) => (a.elapsed >= b.elapsed ? a : b))
  slot.elapsed = 0
  slot.radius = radius
  slot.mesh.position.x = x
  slot.mesh.position.z = z
  slot.mesh.material.color.setHex(color)
  slot.mesh.visible = true
}

export function updateShockwaves(pool, dt) {
  for (const slot of pool.slots) {
    if (slot.elapsed === null) continue
    slot.elapsed += dt
    const t = Math.min(slot.elapsed / DURATION, 1)
    const eased = 1 - (1 - t) * (1 - t)
    slot.mesh.scale.setScalar(Math.max(slot.radius * eased, 0.01))
    slot.mesh.material.opacity = 0.85 * (1 - t)
    if (t >= 1) {
      slot.elapsed = null
      slot.mesh.visible = false
    }
  }
}

export function resetShockwaves(pool) {
  for (const slot of pool.slots) {
    slot.elapsed = null
    slot.mesh.visible = false
  }
}
