// Pets: small hovering jellies that orbit the player and help out
// according to their kind -- zap the nearest enemy, patch you up, or
// (via logic/items.js's petEffects, applied by main.js) pull crystals in
// and soften hits. Pets can't be hurt.
import { PLAYER_MAX_HP } from './config.js'
import { createPetMesh } from './characters.js'
import { damageMonster } from './combat.js'
import { updateFace3D } from './face3d.js'
import { updateJelly } from './jelly.js'
import { PETS } from './logic/items.js'
import { dampAngle } from './logic/smoothing.js'
import { burst } from './particles.js'

const ORBIT_RADIUS = 1.9
const FOLLOW_RATE = 6
const HOVER_HEIGHT = 0.55
const SPAWN_IN_TIME = 0.45
const HEAL_COLOR = 0x7dffb0

// Creates the pet `id` right next to the player, growing in.
export function createPet(id, scene, player) {
  const def = PETS[id]
  const mesh = createPetMesh(def)
  mesh.position.set(player.position.x + 1, HOVER_HEIGHT, player.position.z + 1)
  mesh.scale.setScalar(0.01)
  scene.add(mesh)
  return { def, mesh, age: 0, timer: def.interval ?? 0, lastX: mesh.position.x, lastZ: mesh.position.z }
}

// Nearest monster to (x, z) within `range` that can be hit.
function nearestTarget(monsters, x, z, range) {
  let best = null
  let bestDistance = range
  for (const monster of monsters) {
    if (monster.userData.dying || monster.userData.spawning || monster.userData.falling) continue
    const distance = Math.hypot(monster.position.x - x, monster.position.z - z)
    if (distance < bestDistance) {
      best = monster
      bestDistance = distance
    }
  }
  return best
}

// Moves every pet around the player and runs its behavior for one tick.
export function updatePets(pets, { dt, elapsed, player, monsters, obstacles, particleSystem }) {
  const count = pets.length
  pets.forEach((pet, index) => {
    const { def, mesh } = pet
    pet.age += dt

    const angle = elapsed * 0.7 + (index / count) * Math.PI * 2
    const targetX = player.position.x + Math.cos(angle) * ORBIT_RADIUS
    const targetZ = player.position.z + Math.sin(angle) * ORBIT_RADIUS
    const follow = 1 - Math.exp(-FOLLOW_RATE * dt)
    mesh.position.x += (targetX - mesh.position.x) * follow
    mesh.position.z += (targetZ - mesh.position.z) * follow
    mesh.position.y = HOVER_HEIGHT + Math.sin(elapsed * 3 + index * 1.7) * 0.12
    mesh.scale.setScalar(Math.max(0.01, Math.min(1, pet.age / SPAWN_IN_TIME)))

    const moveX = mesh.position.x - pet.lastX
    const moveZ = mesh.position.z - pet.lastZ
    const speed = Math.hypot(moveX, moveZ) / Math.max(dt, 1e-4)
    if (speed > 0.3) mesh.rotation.y = dampAngle(mesh.rotation.y, Math.atan2(moveX, moveZ), 10, dt)
    pet.lastX = mesh.position.x
    pet.lastZ = mesh.position.z

    updateJelly(mesh, dt, elapsed, { speed, moveDir: { x: Math.sin(mesh.rotation.y), z: Math.cos(mesh.rotation.y) } })
    updateFace3D(mesh, dt, elapsed)

    if (def.kind === 'zap') {
      pet.timer -= dt
      if (pet.timer > 0) return
      const target = nearestTarget(monsters, mesh.position.x, mesh.position.z, def.range)
      if (!target) return
      pet.timer = def.interval
      const from = { x: mesh.position.x, y: mesh.position.y + 0.3, z: mesh.position.z }
      const to = { x: target.position.x, y: target.position.y + 0.8, z: target.position.z }
      // A streak of sparks from the pet to the target reads as a zap.
      for (const t of [0, 0.3, 0.6, 0.9]) {
        const point = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t, z: from.z + (to.z - from.z) * t }
        burst(particleSystem, point, def.color, 3, 1.2)
      }
      damageMonster(target, def.damage, {
        fromPos: { x: mesh.position.x, z: mesh.position.z },
        knockback: def.knockback ?? 0,
        obstacles,
        particleSystem,
        cause: 'pet',
      })
    } else if (def.kind === 'heal') {
      pet.timer -= dt
      if (pet.timer > 0) return
      if (player.hp >= PLAYER_MAX_HP) return
      pet.timer = def.interval
      player.hp = Math.min(PLAYER_MAX_HP, player.hp + def.amount)
      burst(particleSystem, { x: player.position.x, y: 1, z: player.position.z }, HEAL_COLOR, 6, 1.5, 1)
    }
  })
}

export function disposePets(pets, scene) {
  for (const pet of pets) {
    pet.mesh.traverse((child) => {
      if (child.geometry) child.geometry.dispose()
      if (child.material) (Array.isArray(child.material) ? child.material : [child.material]).forEach((m) => m.dispose())
    })
    scene.remove(pet.mesh)
  }
  pets.length = 0
}
