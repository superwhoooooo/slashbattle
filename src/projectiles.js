// A fixed pool of glowing orbs a boss's barrage fires at the player. The
// motion/hit rules are pure (src/logic/projectiles.js); this just owns
// the meshes, hands out free slots, and applies a hit to the player.
import * as THREE from 'three'
import { PLAYER_RADIUS } from './config.js'
import { isOnPlatform } from './logic/arena.js'
import { projectileHits, stepProjectile } from './logic/projectiles.js'

const POOL_SIZE = 40
const ORB_RADIUS = 0.32
const ORB_HEIGHT = 0.7
const ORB_LIFE = 3.2

export function createProjectilePool() {
  const group = new THREE.Group()
  const geometry = new THREE.IcosahedronGeometry(ORB_RADIUS, 1)
  const slots = []
  for (let i = 0; i < POOL_SIZE; i++) {
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({ color: 0xff5a7a, transparent: true, opacity: 0.95 }),
    )
    mesh.visible = false
    group.add(mesh)
    slots.push({ mesh, active: false, data: null })
  }
  return { group, slots, geometry }
}

// Launches an orb from (x, z) with velocity (vx, vz) that deals `damage`.
// Silently skipped when the pool is full.
export function fireProjectile(pool, { x, z, vx, vz, damage, color = 0xff5a7a }) {
  const slot = pool.slots.find((s) => !s.active)
  if (!slot) return
  slot.active = true
  slot.data = { x, z, vx, vz, life: ORB_LIFE, damage, radius: ORB_RADIUS }
  slot.mesh.material.color.setHex(color)
  slot.mesh.position.set(x, ORB_HEIGHT, z)
  slot.mesh.visible = true
}

// Advances every orb; one that reaches the player calls
// player.damagePlayer (returning true if it landed, so the caller can
// shake the screen). Orbs vanish on a hit, on timing out, or off the edge.
export function updateProjectiles(pool, dt, player, now, arenaRadius) {
  let hitPlayer = false
  for (const slot of pool.slots) {
    if (!slot.active) continue
    const alive = stepProjectile(slot.data, dt)
    const hit = alive && !player.hidden && projectileHits(slot.data, player.position, PLAYER_RADIUS)
    if (hit && player.damagePlayer(slot.data.damage, now)) hitPlayer = true
    if (!alive || hit || !isOnPlatform(slot.data, arenaRadius + 6)) {
      slot.active = false
      slot.mesh.visible = false
      continue
    }
    slot.mesh.position.set(slot.data.x, ORB_HEIGHT, slot.data.z)
    slot.mesh.rotation.y += dt * 5
  }
  return hitPlayer
}

export function resetProjectiles(pool) {
  for (const slot of pool.slots) {
    slot.active = false
    slot.mesh.visible = false
  }
}
