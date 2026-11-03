// Pets: small animals and objects (src/petModels.js) that orbit the player and help out
// according to their kind -- zap the nearest enemy, pulse at everything
// close, patch you up, or (via logic/items.js's petEffects, applied by
// main.js) pull crystals in or soften hits. Pets can't be hurt.
import * as THREE from 'three'
import { createPetModel, createSaber, createThrown } from './petModels.js'
import { damageMonster } from './combat.js'
import { PETS } from './logic/items.js'
import { dampAngle } from './logic/smoothing.js'
import { burst } from './particles.js'
import { hasWallLineOfSight } from './monster.js'

const ORBIT_RADIUS = 1.9
const FOLLOW_RATE = 6
const HOVER_HEIGHT = 0.6 // flyers (birds, bee, fish, rocket...) float this high; walkers hop along the ground
const SPAWN_IN_TIME = 0.45
const HEAL_COLOR = 0x7dffb0
const SABER_SPEED = 24
const SABER_SPIN = 28
const SABER_HIT_DISTANCE = 0.9
const SABER_MAX_LIFE = 1.2

// Creates the pet `id` right next to the player, growing in.
export function createPet(id, scene, player) {
  const def = PETS[id]
  const mesh = createPetModel(def)
  mesh.position.set(player.position.x + 1, 0, player.position.z + 1)
  mesh.scale.setScalar(0.01)
  scene.add(mesh)
  return { def, mesh, scene, sabers: [], age: 0, timer: def.interval ?? 0, lastX: mesh.position.x, lastZ: mesh.position.z }
}

// Nearest monster to (x, z) within `range` that can be hit.
function nearestTarget(monsters, x, z, range) {
  let best = null
  let bestDistance = range
  for (const monster of monsters) {
    if (monster.userData.dying || monster.userData.spawning || monster.userData.falling) continue
    const distance = Math.hypot(monster.position.x - x, monster.position.z - z)
    // Pets only fight what is in view: nothing behind a labyrinth wall.
    if (distance < bestDistance && hasWallLineOfSight({ x, z }, monster.position)) {
      best = monster
      bestDistance = distance
    }
  }
  return best
}

// Hurls a spinning lightsaber from the pet's raised hand at `target`; it
// homes on the target's position and lands the hit in stepSabers.
function throwSaber(pet, target) {
  // Remy & Benji alternate their `thrown` items (junk, banana); everyone else throws a saber.
  const kinds = pet.def.thrown
  const thrownKind = kinds ? kinds[(pet.throws = (pet.throws ?? 0) + 1) % kinds.length] : null
  const mesh = thrownKind ? createThrown(thrownKind, pet.throws) : createSaber(pet.def.saberColor ?? pet.def.color, 0.55)
  const holder = new THREE.Group()
  holder.add(mesh)
  if (!thrownKind) mesh.position.y = -0.3 // spin about the saber's middle, not its hilt
  holder.userData.tumble = Boolean(thrownKind)
  holder.position.set(pet.mesh.position.x, pet.mesh.position.y + 0.85, pet.mesh.position.z)
  pet.scene.add(holder)
  pet.sabers.push({ mesh: holder, target, life: SABER_MAX_LIFE })
}

// Flies every thrown saber toward its target, spinning flat like a
// boomerang, and damages it on arrival (or drops the saber if the target is
// already gone or it flew too long).
function stepSabers(pet, dt, monsters, obstacles, particleSystem, hitstop) {
  pet.sabers = pet.sabers.filter((saber) => {
    saber.life -= dt
    const { target } = saber
    const gone = !monsters.includes(target) || target.userData.dying
    if (gone || saber.life <= 0) {
      pet.scene.remove(saber.mesh)
      disposeTree(saber.mesh)
      return false
    }
    const dx = target.position.x - saber.mesh.position.x
    const dy = target.position.y + 0.8 - saber.mesh.position.y
    const dz = target.position.z - saber.mesh.position.z
    const distance = Math.hypot(dx, dy, dz)
    if (distance <= SABER_HIT_DISTANCE) {
      burst(particleSystem, { x: target.position.x, y: target.position.y + 0.8, z: target.position.z }, pet.def.saberColor ?? pet.def.color, 8, 2)
      damageMonster(target, pet.def.damage * (pet.damageMult ?? 1), {
        fromPos: { x: saber.mesh.position.x, z: saber.mesh.position.z },
        knockback: pet.def.knockback ?? 0,
        obstacles,
        particleSystem,
        cause: 'pet',
        hitstop,
      })
      pet.scene.remove(saber.mesh)
      disposeTree(saber.mesh)
      return false
    }
    const stepLength = Math.min(distance, SABER_SPEED * dt)
    saber.mesh.position.x += (dx / distance) * stepLength
    saber.mesh.position.y += (dy / distance) * stepLength
    saber.mesh.position.z += (dz / distance) * stepLength
    if (saber.mesh.userData.tumble) {
      saber.mesh.rotation.x += SABER_SPIN * 0.4 * dt
      saber.mesh.rotation.z += SABER_SPIN * 0.3 * dt
    } else {
      saber.mesh.rotation.x = Math.PI / 2 // lie flat, then spin like a helicopter blade
      saber.mesh.rotation.z += SABER_SPIN * dt
    }
    return true
  })
}

function disposeTree(object) {
  object.traverse((child) => {
    if (child.geometry) child.geometry.dispose()
    if (child.material && !child.material.userData?.shared) {
      ;(Array.isArray(child.material) ? child.material : [child.material]).forEach((m) => m.dispose())
    }
  })
}

// Moves every pet around the player and runs its behavior for one tick.
export function updatePets(pets, { petDamage = 1, dt, elapsed, player, monsters, obstacles, particleSystem, hitstop }) {
  const count = pets.length
  for (const pet of pets) pet.damageMult = petDamage
  for (const pet of pets) stepSabers(pet, dt, monsters, obstacles, particleSystem, hitstop)
  pets.forEach((pet, index) => {
    const { def, mesh } = pet
    pet.age += dt

    const angle = elapsed * 0.7 + (index / count) * Math.PI * 2
    const targetX = player.position.x + Math.cos(angle) * ORBIT_RADIUS
    const targetZ = player.position.z + Math.sin(angle) * ORBIT_RADIUS
    const follow = 1 - Math.exp(-FOLLOW_RATE * dt)
    mesh.position.x += (targetX - mesh.position.x) * follow
    mesh.position.z += (targetZ - mesh.position.z) * follow
    mesh.scale.setScalar(Math.max(0.01, Math.min(1, pet.age / SPAWN_IN_TIME)))

    const moveX = mesh.position.x - pet.lastX
    const moveZ = mesh.position.z - pet.lastZ
    const speed = Math.hypot(moveX, moveZ) / Math.max(dt, 1e-4)
    if (speed > 0.3) mesh.rotation.y = dampAngle(mesh.rotation.y, Math.atan2(moveX, moveZ), 10, dt)
    pet.lastX = mesh.position.x
    pet.lastZ = mesh.position.z

    // Flyers hover and bob; walkers sit on the ground and hop while moving.
    const moving = speed > 0.3
    mesh.position.y = mesh.userData.fly
      ? HOVER_HEIGHT + Math.sin(elapsed * 3 + index * 1.7) * 0.12
      : moving
        ? Math.abs(Math.sin(elapsed * 9 + index)) * 0.14
        : 0
    mesh.userData.animate(elapsed + index * 0.7, moving)

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
      damageMonster(target, def.damage * (pet.damageMult ?? 1), {
        fromPos: { x: mesh.position.x, z: mesh.position.z },
        knockback: def.knockback ?? 0,
        obstacles,
        particleSystem,
        cause: 'pet',
        hitstop,
      })
    } else if (def.kind === 'throw') {
      pet.timer -= dt
      if (pet.timer > 0) return
      const target = nearestTarget(monsters, mesh.position.x, mesh.position.z, def.range)
      if (!target) return
      pet.timer = def.interval
      throwSaber(pet, target)
    } else if (def.kind === 'pulse') {
      pet.timer -= dt
      if (pet.timer > 0) return
      const inReach = monsters.filter(
        (monster) =>
          !monster.userData.dying &&
          !monster.userData.spawning &&
          !monster.userData.falling &&
          Math.hypot(monster.position.x - mesh.position.x, monster.position.z - mesh.position.z) <= def.radius + (monster.userData.reachBonus ?? 0) &&
          hasWallLineOfSight(mesh.position, monster.position),
      )
      if (inReach.length === 0) return
      pet.timer = def.interval
      burst(particleSystem, { x: mesh.position.x, y: 0.5, z: mesh.position.z }, def.color, 14, def.radius * 1.3)
      for (const target of inReach) {
        damageMonster(target, def.damage * (pet.damageMult ?? 1), {
          fromPos: { x: mesh.position.x, z: mesh.position.z },
          knockback: def.knockback ?? 0,
          obstacles,
          particleSystem,
          cause: 'pet',
          hitstop,
        })
      }
    } else if (def.kind === 'heal') {
      pet.timer -= dt
      if (pet.timer > 0) return
      if (player.hp >= player.maxHp) return
      pet.timer = def.interval
      player.hp = Math.min(player.maxHp, player.hp + def.amount)
      burst(particleSystem, { x: player.position.x, y: 1, z: player.position.z }, HEAL_COLOR, 6, 1.5, 1)
    }
  })
}

export function disposePets(pets, scene) {
  for (const pet of pets) {
    for (const saber of pet.sabers ?? []) {
      scene.remove(saber.mesh)
      disposeTree(saber.mesh)
    }
    pet.mesh.traverse((child) => {
      if (child.geometry) child.geometry.dispose()
      if (child.material) (Array.isArray(child.material) ? child.material : [child.material]).forEach((m) => m.dispose())
    })
    scene.remove(pet.mesh)
  }
  pets.length = 0
}
