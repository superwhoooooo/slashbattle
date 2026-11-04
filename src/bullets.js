// A fixed pool of glowing bullets the player's firearms (and the Bullet
// Ring ability) fire. The flight/hit rules are pure (src/logic/bullets.js);
// this owns the meshes, hands out free slots, and applies hits through
// combat.js's damageMonster.
import * as THREE from 'three'
import { damageMonster } from './combat.js'
import { isOnPlatform } from './logic/arena.js'
import { stepBullet } from './logic/bullets.js'
import { burst } from './particles.js'
import { isTouchDevice } from './touch.js'
import { hasWallLineOfSight, isInsideWall } from './monster.js'

const POOL_SIZE = 80
const BULLET_HEIGHT = 0.7

// True if the segment a -> b passes through any blocker circle ({ x, z, radius }),
// e.g. a Bulwark wall block. Checks both ends and a few points between so a
// fast shot can't hop over a block in one frame.
const BULLET_BRIGHTNESS = isTouchDevice() ? 0.5 : 0.8 // phones are far more dazzled by it // shots are unlit, so this dims them (and keeps them under the bloom threshold)

export function segmentBlocked(a, b, blockers) {
  if (!blockers || blockers.length === 0) return false
  for (let i = 0; i <= 4; i++) {
    const x = a.x + ((b.x - a.x) * i) / 4
    const z = a.z + ((b.z - a.z) * i) / 4
    for (const blocker of blockers) {
      if (Math.hypot(x - blocker.x, z - blocker.z) <= blocker.radius) return true
    }
  }
  return false
}

export function createBulletPool() {
  const group = new THREE.Group()
  const geometry = new THREE.IcosahedronGeometry(1, 1)
  const slots = []
  for (let i = 0; i < POOL_SIZE; i++) {
    const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0xffffff }))
    mesh.visible = false
    group.add(mesh)
    slots.push({ mesh, active: false, data: null })
  }
  return { group, slots, geometry }
}

// Launches `bullets` (from logic/bullets.js's makeBullets). Silently skips
// any that don't fit in the pool.
export function fireBullets(pool, bullets) {
  for (const bullet of bullets) {
    const slot = pool.slots.find((s) => !s.active)
    if (!slot) return
    slot.active = true
    slot.data = bullet
    slot.mesh.material.color.setHex(bullet.color).multiplyScalar(BULLET_BRIGHTNESS)
    slot.mesh.scale.setScalar(bullet.radius)
    slot.mesh.position.set(bullet.x, BULLET_HEIGHT, bullet.z)
    slot.mesh.visible = true
  }
}

function retire(slot) {
  slot.active = false
  slot.mesh.visible = false
}

// Advances every bullet, damaging whatever it touches (and blasting the
// surroundings for an exploding one). Returns whether anything was hit this
// frame, for the caller's hit shake/sound.
export function updateBullets(pool, dt, { monsters, obstacles, particleSystem, hitstop, arenaRadius, onExplode = null, onTrail = null, onHit = null, blockers = null }) {
  let hitAny = false
  const targets = []
  for (const mesh of monsters) {
    if (mesh.userData.dying || mesh.userData.spawning || mesh.userData.falling) continue
    targets.push({ id: mesh.uuid, x: mesh.position.x, z: mesh.position.z, radius: mesh.userData.radius, mesh })
  }

  for (const slot of pool.slots) {
    if (!slot.active) continue
    const bullet = slot.data
    const from = { x: bullet.x, z: bullet.z }
    const { alive, hits } = stepBullet(bullet, dt, targets)
    if (isInsideWall(bullet.x, bullet.z) || segmentBlocked(from, bullet, blockers)) {
      // Spent against a labyrinth wall or a Bulwark wall: a puff, and no hits through it.
      burst(particleSystem, { x: bullet.x, y: BULLET_HEIGHT, z: bullet.z }, bullet.color, 6, 2)
      retire(slot)
      continue
    }
    for (const { mesh } of hits) {
      if (!hasWallLineOfSight(from, mesh.position)) continue
      hitAny = true
      damageMonster(mesh, bullet.damage, { fromPos: from, knockback: bullet.knockback, obstacles, particleSystem, cause: bullet.cause, ambush: bullet.ambush, hitstop })
      if (onHit) onHit(bullet, mesh)
    }
    if (alive && onTrail) onTrail(bullet)
    if (hits.length > 0 && bullet.explode > 0) {
      burst(particleSystem, { x: bullet.x, y: BULLET_HEIGHT, z: bullet.z }, bullet.color, 30, 4)
      if (onExplode) onExplode(bullet.x, bullet.z, bullet.explode, bullet.color)
      for (const target of targets) {
        if (target.mesh.userData.dying || hits.some((h) => h.id === target.id)) continue
        if (Math.hypot(target.x - bullet.x, target.z - bullet.z) > bullet.explode + target.radius) continue
        damageMonster(target.mesh, bullet.damage * 0.6, { fromPos: { x: bullet.x, z: bullet.z }, knockback: bullet.knockback, obstacles, particleSystem, cause: bullet.cause, ambush: bullet.ambush, hitstop })
      }
    }
    if (!alive || !isOnPlatform(bullet, arenaRadius + 6)) {
      retire(slot)
      continue
    }
    slot.mesh.position.set(bullet.x, BULLET_HEIGHT, bullet.z)
  }
  return hitAny
}

export function resetBullets(pool) {
  for (const slot of pool.slots) retire(slot)
}
