// Pets: small animals and objects (src/petModels.js) that stay by the player and help out
// according to their kind. Fighters roam: with an enemy in sight (src/logic/petAI.js) they
// run out and fight it the way their description says -- lunge in and peck / bite / sting
// it, roll up and explode, charge in and pulse, or stand off and zap / shoot / throw --
// then come back to the player when nothing is in sight. Healers, magnets and guards stay
// by your side (the latter two via logic/items.js's petEffects, applied by main.js).
// Pets can't be hurt.
import * as THREE from 'three'
import { createPetModel, createSaber, createThrown } from './petModels.js'
import { damageMonster } from './combat.js'
import { PETS, petBoost, petLevel, petRate } from './logic/items.js'
import { disposeSpecials, startSpecial, stepSpecials } from './dragonSpecials.js'
import { breathVictims, isDragon, tuneDragon } from './logic/dragons.js'
import { damp, dampAngle, wrapAngle } from './logic/smoothing.js'
import { burst } from './particles.js'
import { hasWallLineOfSight, isInsideWall } from './monster.js'
import { spawnShockwave } from './shockwave.js'
import { ARENA_RADIUS } from './config.js'
import { clampToPlatform } from './logic/arena.js'
import { SOAR_RADIUS, SOAR_TURN_RATE, STRIKES, SNAP_DISTANCE, canEngage, dist, engageGoal, homeSpot, isFighter, returnSpeed, stepToward, strikeReach } from './logic/petAI.js'

const ORBIT_RADIUS = 1.9
const FOLLOW_RATE = 6
const HOVER_HEIGHT = 0.6 // flyers (birds, bee, fish, rocket...) float this high; walkers hop along the ground
const SPAWN_IN_TIME = 0.45
const HEAL_COLOR = 0x7dffb0
const SABER_SPEED = 24
const SABER_SPIN = 28
const SABER_HIT_DISTANCE = 0.9
const SABER_MAX_LIFE = 1.2
const STRIKE_TIME = 0.28 // how long a lunge hit's pitch / roll animation lasts
const STUCK_TIME = 1.2 // blocked this long (a labyrinth wall in the way) and the pet pops back to you
const PET_EDGE_MARGIN = 1.5
const DIVE_FLOOR = 0.35 // a diving bird's height when it reaches an enemy (its body rides ~0.5 above this)
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

// Projectile pets: speed, arc height and look of each `projectile`.
const SHOTS = {
  snowball: { speed: 13, arc: 0, height: 0.3, color: 0xffffff, hit: 9, splash: 0 },
  droplet: { speed: 11, arc: 1.5, height: 0.7, color: 0x5ec8ff, hit: 12, splash: 1.5 },
  squawk: { speed: 18, arc: 0, height: 0.7, color: 0xff4a4a, hit: 8, splash: 0 },
}

// Creates the pet `id` right next to the player, growing in. A pet with `split` parts (Remy &
// Benji) comes out as one pet per part: the first is the pet, the rest ride along as its
// `buddies` and move, aim and throw on their own (they share the pet's id, level and slot).
export function createPet(id, scene, player, dragonSetup = null) {
  const base = PETS[id]
  const def = isDragon(base) ? tuneDragon(base, dragonSetup ?? {}) : base
  if (!def.split) return makePet(def, scene, player, 1)
  const [first, ...rest] = def.split.map((part, i) => makePet(splitDef(def, part), scene, player, i % 2 ? -1 : 1))
  first.buddies = rest
  return first
}

const splitDef = (def, part) => ({ ...def, ...part, interval: def.interval * def.split.length, split: undefined })

function makePet(def, scene, player, side) {
  const mesh = createPetModel(def)
  mesh.position.set(player.position.x + side, 0, player.position.z + 1)
  mesh.scale.setScalar(0.01)
  mesh.rotation.order = 'YXZ' // yaw first, so pitch and bank (soaring birds, strike tilts) are about the pet's own axes
  scene.add(mesh)
  return { def, mesh, scene, alt: 0.4, lastAlt: 0.4, bank: 0, pitch: 0, sabers: [], shots: [], strikeT: 0, stuck: 0, age: 0, timer: def.interval ?? 0, lastX: mesh.position.x, lastZ: mesh.position.z }
}

const targetable = (monster) => !monster.userData.dying && !monster.userData.spawning && !monster.userData.falling

// Every live unit: each pet, followed by any buddies it split into.
const unitsOf = (pets) => pets.flatMap((pet) => [pet, ...(pet.buddies ?? [])])

// The nearest enemy this pet can see (and, for a fighter, would chase): in sight of the
// pet, near enough to the player, and not behind a labyrinth wall. `avoid` (a split pet's
// partners' targets) is skipped when there is any other enemy to go for, so they spread out.
function pickTarget(pet, monsters, player, avoid = []) {
  if (avoid.length) {
    const other = pickTarget(pet, monsters.filter((m) => !avoid.includes(m)), player)
    if (other) return other
  }
  const here = pet.mesh.position
  let best = null
  let bestDistance = Infinity
  for (const monster of monsters) {
    if (!targetable(monster)) continue
    const distance = dist(here, monster.position)
    if (distance < bestDistance && canEngage(pet.def, here, player.position, monster.position) && hasWallLineOfSight(here, monster.position)) {
      best = monster
      bestDistance = distance
    }
  }
  return best
}

// Every fight hits through here so a pet's damage, knockback and credit stay the same.
function hitMonster(pet, target, damage, fromPos, ctx) {
  damageMonster(target, damage, {
    fromPos,
    knockback: pet.def.knockback ?? 0,
    obstacles: ctx.obstacles,
    particleSystem: ctx.particleSystem,
    cause: 'pet',
    hitstop: ctx.hitstop,
  })
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

// Fires the pet's `projectile` at `target`: it flies (arcing for a lobbed droplet), homing on
// the target, and lands the hit in stepShots.
function fireShot(pet, target) {
  const kind = pet.def.projectile
  const spec = SHOTS[kind]
  const group = new THREE.Group()
  const basic = (color, opacity = 1) => new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity })
  if (kind === 'squawk') {
    // Three rings stacked along the flight direction read as a sound wave.
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.16 + i * 0.1, 0.03, 6, 20), basic(spec.color, 0.9 - i * 0.2))
      ring.position.z = -i * 0.22
      group.add(ring)
    }
  } else {
    group.add(new THREE.Mesh(new THREE.SphereGeometry(kind === 'snowball' ? 0.24 : 0.17, 12, 10), new THREE.MeshStandardMaterial({ color: spec.color, roughness: 0.5, emissive: kind === 'droplet' ? spec.color : 0x000000, emissiveIntensity: 0.4 })))
  }
  const from = { x: pet.mesh.position.x, y: pet.mesh.position.y + spec.height, z: pet.mesh.position.z }
  group.position.set(from.x, from.y, from.z)
  pet.scene.add(group)
  const distance = dist(from, target.position)
  pet.shots.push({ mesh: group, kind, spec, from, target, t: 0, duration: Math.max(0.12, distance / spec.speed) })
}

// Dragons: a glowing bolt of the dragon's breath leaves its mouth (a fan of them for venom) and
// lands in stepShots -> landBreath, where the breath's splash blast and chain arcs apply.
function fireBreath(pet, target) {
  const { def, mesh } = pet
  const breath = def.breath
  const yaw = mesh.rotation.y
  const from = { x: mesh.position.x + Math.sin(yaw) * 1.0, y: mesh.position.y + 0.65, z: mesh.position.z + Math.cos(yaw) * 1.0 }
  const bolts = def.bolts ?? 1
  const big = breath.id === 'void' ? 1.5 : breath.id === 'flame' ? 1.15 : 1
  mesh.userData.breathe = 1
  for (let i = 0; i < bolts; i++) {
    const group = new THREE.Group()
    const additive = (color, opacity) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false })
    if (breath.id === 'solar') {
      group.add(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.6, 8), additive(breath.core, 0.95)).rotateX(Math.PI / 2))
      group.add(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.7, 10), additive(0xffd36b, 0.4)).rotateX(Math.PI / 2))
    } else if (breath.id === 'frost') {
      const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.24), new THREE.MeshBasicMaterial({ color: breath.core }))
      shard.scale.set(0.6, 0.6, 1.7)
      group.add(shard)
      group.add(new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), additive(breath.color, 0.35)))
    } else {
      group.add(new THREE.Mesh(new THREE.SphereGeometry(0.2 * big, 12, 10), new THREE.MeshBasicMaterial({ color: breath.core })))
      group.add(new THREE.Mesh(new THREE.SphereGeometry(0.42 * big, 12, 10), additive(breath.color, 0.55)))
    }
    group.position.set(from.x, from.y, from.z)
    pet.scene.add(group)
    const spec = { speed: breath.id === 'solar' ? 34 : breath.id === 'void' ? 15 : 22, arc: 0, height: 0.65, color: breath.color, hit: 14, splash: 0 }
    const distance = dist(from, target.position)
    const lane = bolts > 1 ? (i - (bolts - 1) / 2) * 1.3 : 0
    pet.shots.push({ mesh: group, kind: 'breath', spec, from, target, lane, t: 0, duration: Math.max(0.12, distance / spec.speed) })
  }
}

function landBreath(pet, shot, at, ctx) {
  const { def } = pet
  const { target } = shot
  const breath = def.breath
  const damage = def.damage * (pet.damageMult ?? 1)
  burst(ctx.particleSystem, at, breath.color, 18, 3.4)
  burst(ctx.particleSystem, at, breath.core, 8, 2)
  hitMonster(pet, target, damage, { x: shot.from.x, z: shot.from.z }, ctx)
  if (def.splash > 0 && ctx.shockwavePool) spawnShockwave(ctx.shockwavePool, at.x, at.z, def.splash, breath.color)
  const candidates = ctx.monsters.filter((m) => m !== target && targetable(m)).map((m) => ({ x: m.position.x, z: m.position.z, ref: m }))
  for (const { ref, share } of breathVictims(def, at, target, candidates)) {
    if (def.chain > 0 && share === def.chainShare) {
      // A lightning arc: a line of sparks from the impact to the next enemy.
      for (const t of [0.2, 0.4, 0.6, 0.8]) burst(ctx.particleSystem, { x: at.x + (ref.position.x - at.x) * t, y: at.y, z: at.z + (ref.position.z - at.z) * t }, breath.color, 2, 1)
    }
    burst(ctx.particleSystem, { x: ref.position.x, y: ref.position.y + 0.8, z: ref.position.z }, breath.color, 8, 2)
    hitMonster(pet, ref, damage * share, at, ctx)
  }
}

function stepShots(pet, dt, monsters, ctx) {
  pet.shots = pet.shots.filter((shot) => {
    const { target, spec } = shot
    if (!monsters.includes(target) || target.userData.dying) {
      pet.scene.remove(shot.mesh)
      disposeTree(shot.mesh)
      return false
    }
    shot.t += dt / shot.duration
    const aimY = shot.kind === 'snowball' ? spec.height : target.position.y + 0.8
    const t = Math.min(1, shot.t)
    const x = shot.from.x + (target.position.x - shot.from.x) * t
    const z = shot.from.z + (target.position.z - shot.from.z) * t
    const y = shot.from.y + (aimY - shot.from.y) * t + Math.sin(Math.PI * t) * spec.arc
    if (shot.kind === 'squawk') {
      shot.mesh.lookAt(target.position.x, aimY, target.position.z)
      shot.mesh.scale.setScalar(0.7 + t * 1.2) // the wave spreads as it travels
    } else if (shot.kind === 'snowball') {
      shot.mesh.rotation.x -= 12 * dt // rolls along the ground
    }
    if (shot.kind === 'breath') {
      // Fan lanes bow out sideways, then pinch in on the target; every bolt faces where it is going and leaves embers.
      const len = Math.hypot(target.position.x - shot.from.x, target.position.z - shot.from.z) || 1
      const bow = (shot.lane ?? 0) * Math.sin(Math.PI * t)
      shot.mesh.position.set(x + (-(target.position.z - shot.from.z) / len) * bow, y, z + ((target.position.x - shot.from.x) / len) * bow)
      shot.mesh.lookAt(target.position.x, aimY, target.position.z)
      burst(ctx.particleSystem, shot.mesh.position, pet.def.breath.color, 1, 0.6)
      if (shot.t >= 1) {
        landBreath(pet, shot, { x, y: aimY, z }, ctx)
        pet.scene.remove(shot.mesh)
        disposeTree(shot.mesh)
        return false
      }
      return true
    }
    shot.mesh.position.set(x, y, z)
    if (shot.t < 1) return true
    burst(ctx.particleSystem, { x, y, z }, spec.color, spec.hit, 2.2)
    if (spec.splash && ctx.shockwavePool) spawnShockwave(ctx.shockwavePool, x, z, spec.splash, spec.color)
    hitMonster(pet, target, pet.def.damage * (pet.damageMult ?? 1), { x: shot.from.x, z: shot.from.z }, ctx)
    pet.scene.remove(shot.mesh)
    disposeTree(shot.mesh)
    return false
  })
}

// Moves a pet to (x, z), keeping it on the platform and out of labyrinth walls (sliding along
// a wall when it can). Returns how far it actually got.
function placePet(pet, x, z) {
  const mesh = pet.mesh
  const clamped = clampToPlatform({ x, z }, ARENA_RADIUS - PET_EDGE_MARGIN)
  const tries = [clamped, { x: clamped.x, z: mesh.position.z }, { x: mesh.position.x, z: clamped.z }]
  for (const spot of tries) {
    if (isInsideWall(spot.x, spot.z)) continue
    const moved = Math.hypot(spot.x - mesh.position.x, spot.z - mesh.position.z)
    mesh.position.x = spot.x
    mesh.position.z = spot.z
    return moved
  }
  return 0
}

// Pops the pet back next to the player, growing in again.
function recallPet(pet, spot) {
  pet.mesh.position.x = spot.x
  pet.mesh.position.z = spot.z
  pet.lastX = spot.x
  pet.lastZ = spot.z
  pet.age = 0
  pet.stuck = 0
}

// Lunge pets hit the enemy in person once they reach it.
function strikeTarget(pet, target, ctx) {
  const { def, mesh } = pet
  const look = STRIKES[def.strike] ?? STRIKES.bite
  pet.timer = def.interval / (pet.rate ?? 1)
  pet.strikeT = STRIKE_TIME
  mesh.userData.snarl = 1 // real animals bare their teeth (petAnimals.js)
  // Animals with claws rake the enemy (a scratch across the screen); everyone else throws sparks.
  if (mesh.userData.claws && ctx.onScratch) ctx.onScratch(target, def)
  else burst(ctx.particleSystem, { x: (mesh.position.x + target.position.x) / 2, y: 0.7, z: (mesh.position.z + target.position.z) / 2 }, def.color, look.sparks, look.speed)
  hitMonster(pet, target, def.damage * (pet.damageMult ?? 1), { x: mesh.position.x, z: mesh.position.z }, ctx)
}

// Blasty: runs up to the enemy, goes off around itself, then reforms beside the player.
function explode(pet, ctx, home) {
  const { def, mesh } = pet
  const radius = def.blast ?? 3
  const here = { x: mesh.position.x, z: mesh.position.z }
  pet.timer = def.interval / (pet.rate ?? 1)
  burst(ctx.particleSystem, { x: here.x, y: 0.6, z: here.z }, def.color, 26, radius * 1.6)
  burst(ctx.particleSystem, { x: here.x, y: 0.6, z: here.z }, 0xffffff, 10, radius)
  if (ctx.shockwavePool) spawnShockwave(ctx.shockwavePool, here.x, here.z, radius, def.color)
  for (const monster of ctx.monsters) {
    if (!targetable(monster)) continue
    if (dist(here, monster.position) <= radius + (monster.userData.reachBonus ?? 0) && hasWallLineOfSight(here, monster.position)) {
      hitMonster(pet, monster, def.damage * (pet.damageMult ?? 1), here, ctx)
    }
  }
  recallPet(pet, home)
}

// Spikes, bears, pandas...: everything within reach of the pet takes a hit.
function pulse(pet, ctx) {
  const { def, mesh } = pet
  const inReach = ctx.monsters.filter(
    (monster) =>
      targetable(monster) &&
      dist(mesh.position, monster.position) <= def.radius + (monster.userData.reachBonus ?? 0) &&
      hasWallLineOfSight(mesh.position, monster.position),
  )
  if (inReach.length === 0) return
  pet.timer = def.interval / (pet.rate ?? 1)
  pet.strikeT = STRIKE_TIME
  mesh.userData.snarl = 1
  if (mesh.userData.claws && ctx.onScratch) inReach.slice(0, 3).forEach((target) => ctx.onScratch(target, def))
  else burst(ctx.particleSystem, { x: mesh.position.x, y: 0.5, z: mesh.position.z }, def.color, 14, def.radius * 1.3)
  if (ctx.shockwavePool) spawnShockwave(ctx.shockwavePool, mesh.position.x, mesh.position.z, def.radius, def.color)
  for (const target of inReach) hitMonster(pet, target, def.damage * (pet.damageMult ?? 1), { x: mesh.position.x, z: mesh.position.z }, ctx)
}

// Sparky / Bolt: a streak of sparks from the pet to the target reads as a zap.
function zap(pet, target, ctx) {
  const { def, mesh } = pet
  pet.timer = def.interval / (pet.rate ?? 1)
  const from = { x: mesh.position.x, y: mesh.position.y + 0.3, z: mesh.position.z }
  const to = { x: target.position.x, y: target.position.y + 0.8, z: target.position.z }
  for (const t of [0, 0.3, 0.6, 0.9]) {
    burst(ctx.particleSystem, { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t, z: from.z + (to.z - from.z) * t }, def.color, 3, 1.2)
  }
  hitMonster(pet, target, def.damage * (pet.damageMult ?? 1), { x: mesh.position.x, z: mesh.position.z }, ctx)
}

// Moves every pet for one tick: out to the nearest enemy in sight and into its attack, or
// back to its spot beside the player when there is none.
export function updatePets(pets, { petDamage = 1, levels = {}, dt, elapsed, player, monsters, obstacles, particleSystem, hitstop, shockwavePool, onScratch = null }) {
  const ctx = {
    monsters, obstacles, particleSystem, hitstop, shockwavePool, onScratch, player,
    // A special ability's hit: like any pet hit but with its own knockback.
    hit: (pet, target, damage, fromPos, knockback) => damageMonster(target, damage, { fromPos, knockback, obstacles, particleSystem, cause: 'pet', hitstop }),
  }
  // Split pets' partners (Remy & Benji): each unit knows the others of its pair.
  for (const pet of pets) {
    const team = [pet, ...(pet.buddies ?? [])]
    for (const unit of team) unit.partners = team.filter((other) => other !== unit)
  }
  pets = unitsOf(pets)
  const count = pets.length
  for (const pet of pets) {
    const level = petLevel(levels, pet.def.id)
    pet.boost = petBoost(level)
    pet.rate = petRate(level)
    pet.damageMult = petDamage * pet.boost
    stepSabers(pet, dt, monsters, obstacles, particleSystem, hitstop)
    stepShots(pet, dt, monsters, ctx)
    stepSpecials(pet, dt, ctx)
    if (pet.def.specialInfo) pet.specialTimer = (pet.specialTimer ?? pet.def.specialInfo.interval * 0.4) - dt * pet.rate
  }
  pets.forEach((pet, index) => {
    const { def, mesh } = pet
    pet.age += dt
    pet.timer -= dt
    pet.strikeT = Math.max(0, pet.strikeT - dt)
    const ready = pet.timer <= 0
    const soar = mesh.userData.soar
    const home = homeSpot(player.position, index, count, elapsed, soar ? { radius: SOAR_RADIUS, turnRate: SOAR_TURN_RATE } : undefined)

    if (dist(mesh.position, player.position) > SNAP_DISTANCE) recallPet(pet, home)

    // Decide where to be: at an enemy (fighters) or at home.
    const avoid = (pet.partners ?? []).map((other) => other.target).filter(Boolean)
    const target = isFighter(def) ? pickTarget(pet, monsters, player, avoid) : null
    pet.target = target
    let goal = home
    let speed = returnSpeed(dist(mesh.position, home))
    let holding = false
    if (target) {
      const engage = engageGoal(def, { pet: mesh.position, target: target.position, player: player.position, ready, angle: index * 2.1 + elapsed * 0.5 })
      if (engage) {
        goal = engage
        speed = engage.speed
      } else if (def.kind !== 'explode') {
        holding = true // already where it wants to be
      }
    }
    if (!holding) {
      const step = stepToward(mesh.position, goal, speed, dt)
      const moved = placePet(pet, step.x, step.z)
      pet.stuck = step.moved > 0.02 && moved < step.moved * 0.3 ? pet.stuck + dt : Math.max(0, pet.stuck - dt)
      if (pet.stuck > STUCK_TIME) recallPet(pet, home)
    }
    mesh.scale.setScalar(Math.max(0.01, Math.min(1, pet.age / SPAWN_IN_TIME)))

    // Face the enemy while fighting it, otherwise the way it is heading.
    const moveX = mesh.position.x - pet.lastX
    const moveZ = mesh.position.z - pet.lastZ
    const travelled = Math.hypot(moveX, moveZ) / Math.max(dt, 1e-4)
    const moving = travelled > 0.3
    const prevYaw = mesh.rotation.y
    if (target && (holding || !moving || def.kind === 'zap' || def.kind === 'shot' || def.kind === 'throw' || def.kind === 'breath')) {
      mesh.rotation.y = dampAngle(mesh.rotation.y, Math.atan2(target.position.x - mesh.position.x, target.position.z - mesh.position.z), 12, dt)
    } else if (moving) {
      mesh.rotation.y = dampAngle(mesh.rotation.y, Math.atan2(moveX, moveZ), 10, dt)
    }
    pet.lastX = mesh.position.x
    pet.lastZ = mesh.position.z

    // Soaring birds glide on a wide loop high over the player, bank into turns, and dive on
    // an enemy they are about to hit; other flyers hover and bob and walkers sit on the ground
    // and hop while moving. A strike pitches (or rolls) the model into the hit.
    let basePitch = 0
    let baseBank = 0
    if (soar) {
      let want = soar.cruise + Math.sin(elapsed * 1.3 + index * 1.7) * 0.12
      const diving = target && def.kind === 'lunge' && ready
      if (diving) want = DIVE_FLOOR + clamp((dist(mesh.position, target.position) - 1) / 7, 0, 1) * (soar.cruise - DIVE_FLOOR)
      pet.lastAlt = pet.alt
      pet.alt = damp(pet.alt, want, diving ? 6 : 3, dt)
      mesh.position.y = pet.alt
      const climb = (pet.alt - pet.lastAlt) / Math.max(dt, 1e-4)
      const yawRate = wrapAngle(mesh.rotation.y - prevYaw) / Math.max(dt, 1e-4)
      pet.bank = damp(pet.bank, clamp(-yawRate * 0.35, -0.65, 0.65), 7, dt)
      pet.pitch = damp(pet.pitch, clamp(-climb * 0.09, -0.5, 0.5), 7, dt)
      basePitch = pet.pitch
      baseBank = pet.bank
      mesh.userData.effort = clamp(0.15 + travelled / 16 + Math.max(0, climb) * 0.15, 0, 1) // flap harder when fast or climbing
    } else {
      mesh.position.y = mesh.userData.fly
        ? HOVER_HEIGHT + Math.sin(elapsed * 3 + index * 1.7) * 0.12
        : moving
          ? Math.abs(Math.sin(elapsed * (travelled > 6 ? 14 : 9) + index)) * (travelled > 6 ? 0.22 : 0.14) * (mesh.userData.gait === 'walk' ? 0.12 : 1) // real walkers stride (their legs move), hoppers bounce
          : 0
    }
    mesh.rotation.x = basePitch
    mesh.rotation.z = baseBank
    if (pet.strikeT > 0 && def.strike) {
      const [axis, amount] = (STRIKES[def.strike] ?? STRIKES.bite).tilt
      mesh.rotation[axis] += Math.sin(Math.PI * (1 - pet.strikeT / STRIKE_TIME)) * amount
    }
    mesh.userData.animate(elapsed + index * 0.7, moving)

    // Attack.
    if (def.kind === 'heal') {
      if (!ready || player.hp >= player.maxHp) return
      pet.timer = def.interval / (pet.rate ?? 1)
      player.hp = Math.min(player.maxHp, player.hp + def.amount * (pet.boost ?? 1))
      burst(particleSystem, { x: player.position.x, y: 1, z: player.position.z }, HEAL_COLOR, 6, 1.5, 1)
      return
    }
    if (!ready) return
    if (def.kind === 'pulse') {
      pulse(pet, ctx)
      return
    }
    if (!target) return
    const gap = dist(mesh.position, target.position)
    if (def.kind === 'lunge' || def.kind === 'explode') {
      if (gap > strikeReach(target.userData)) return
      if (def.kind === 'lunge') strikeTarget(pet, target, ctx)
      else explode(pet, ctx, home)
    } else if (gap <= def.range) {
      if (def.specialInfo && pet.specialTimer <= 0 && def.kind === 'breath') {
        pet.specialTimer = def.specialInfo.interval
        pet.timer = Math.max(pet.timer, 0.8) // the normal breath pauses a moment while it winds up
        startSpecial(pet, target, ctx)
        return
      }
      if (def.kind === 'zap') {
        zap(pet, target, ctx)
      } else {
        pet.timer = def.interval / (pet.rate ?? 1)
        if (def.kind === 'throw') throwSaber(pet, target)
        else if (def.kind === 'breath') fireBreath(pet, target)
        else if (def.kind === 'shot') fireShot(pet, target)
      }
    }
  })
}

export function disposePets(pets, scene) {
  for (const pet of unitsOf(pets)) {
    disposeSpecials(pet)
    for (const thrown of [...(pet.sabers ?? []), ...(pet.shots ?? [])]) {
      scene.remove(thrown.mesh)
      disposeTree(thrown.mesh)
    }
    pet.mesh.traverse((child) => {
      if (child.geometry) child.geometry.dispose()
      if (child.material) (Array.isArray(child.material) ? child.material : [child.material]).forEach((m) => m.dispose())
    })
    scene.remove(pet.mesh)
  }
  pets.length = 0
}
