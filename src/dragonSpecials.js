// The dragons' special abilities (SPECIALS in logic/dragons.js): meteors, blizzard, thunderstorm,
// toxic cloud, aurora nova and the void beam. `startSpecial` begins one; each is a small timed
// effect kept in `pet.effects` and advanced by `stepSpecials`, which hits through the `hit`
// callback pets.js hands in so credit, knockback and hitstop stay the same as every other pet hit.
import * as THREE from 'three'
import { burst } from './particles.js'
import { spawnShockwave } from './shockwave.js'
import { distanceToSegment } from './logic/dragons.js'

const alive = (m) => !m.userData.dying && !m.userData.spawning && !m.userData.falling
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z)
const additive = (color, opacity) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })

// Where the dragon's mouth is (the breath leaves from here too).
export function mouthOf(pet) {
  const yaw = pet.mesh.rotation.y
  return { x: pet.mesh.position.x + Math.sin(yaw) * 1.0, y: pet.mesh.position.y + 0.65, z: pet.mesh.position.z + Math.cos(yaw) * 1.0 }
}

function add(pet, effect) {
  pet.effects = pet.effects ?? []
  pet.effects.push(effect)
  if (effect.mesh) pet.scene.add(effect.mesh)
}

function drop(pet, effect) {
  if (!effect.mesh) return
  pet.scene.remove(effect.mesh)
  effect.mesh.traverse((c) => {
    c.geometry?.dispose()
    c.material?.dispose?.()
  })
}

// Starts the dragon's special at `target`. `ctx` is pets.js's context (monsters, particleSystem,
// shockwavePool, player); `hit(monster, damage, fromPos, knockback)` lands a hit.
export function startSpecial(pet, target, ctx) {
  const info = pet.def.specialInfo
  if (!info) return
  const color = pet.def.scale.glow
  const damage = pet.def.baseDamage * (pet.damageMult ?? 1) * info.mult
  pet.mesh.userData.breathe = 1.4
  const common = { info, color, damage, t: 0 }
  const here = { x: target.position.x, z: target.position.z }
  switch (info.id) {
    case 'meteors': {
      for (let i = 0; i < info.count; i++) {
        const a = (i / info.count) * Math.PI * 2 + Math.random()
        const r = i === 0 ? 0 : 1.2 + Math.random() * info.spread
        const at = { x: here.x + Math.cos(a) * r, z: here.z + Math.sin(a) * r }
        const mesh = new THREE.Group()
        mesh.add(new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 10), new THREE.MeshBasicMaterial({ color: 0xfff2c0 })))
        mesh.add(new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 10), additive(color, 0.55)))
        mesh.visible = false
        add(pet, { ...common, kind: 'meteor', mesh, at, delay: i * 0.16, fall: 0.5 })
      }
      break
    }
    case 'blizzard': {
      const mesh = new THREE.Group()
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.6, 6), new THREE.MeshStandardMaterial({ color: 0xdff6ff, emissive: color, emissiveIntensity: 0.9, roughness: 0.2 }))
        spike.position.set(Math.cos(a) * info.radius * 0.8, 0, Math.sin(a) * info.radius * 0.8)
        mesh.add(spike)
      }
      mesh.position.set(here.x, 0, here.z)
      add(pet, { ...common, kind: 'blizzard', mesh, at: here, life: 1 })
      blizzardHit(pet, here, damage, info, ctx)
      break
    }
    case 'thunderstorm': {
      const targets = ctx.monsters.filter(alive).sort((a, b) => dist(a.position, pet.mesh.position) - dist(b.position, pet.mesh.position)).slice(0, info.strikes)
      targets.forEach((m, i) => {
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.3, 14, 6, 1, true), additive(color, 0.9))
        add(pet, { ...common, kind: 'bolt', mesh, victim: m, delay: i * 0.1, life: 0.3, struck: false })
      })
      break
    }
    case 'toxic': {
      const mesh = new THREE.Group()
      const disc = new THREE.Mesh(new THREE.CircleGeometry(info.radius, 28), additive(color, 0.4))
      disc.rotation.x = -Math.PI / 2
      disc.position.y = 0.06
      mesh.add(disc)
      mesh.position.set(here.x, 0, here.z)
      add(pet, { ...common, kind: 'cloud', mesh, at: here, life: info.duration, tickT: 0 })
      break
    }
    case 'aurora': {
      const at = { x: ctx.player.position.x, z: ctx.player.position.z }
      spawnShockwave(ctx.shockwavePool, at.x, at.z, info.radius, color)
      burst(ctx.particleSystem, { x: at.x, y: 1, z: at.z }, color, 40, info.radius * 1.2)
      burst(ctx.particleSystem, { x: at.x, y: 1, z: at.z }, 0xffffff, 16, info.radius)
      ctx.player.hp = Math.min(ctx.player.maxHp, ctx.player.hp + ctx.player.maxHp * info.heal)
      for (const m of ctx.monsters) if (alive(m) && dist(m.position, at) <= info.radius + (m.userData.reachBonus ?? 0)) ctx.hit(pet, m, damage, at, 3)
      break
    }
    case 'voidbeam': {
      const mesh = new THREE.Group()
      mesh.add(new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 10), new THREE.MeshBasicMaterial({ color: 0xffffff })))
      mesh.add(new THREE.Mesh(new THREE.SphereGeometry(0.7, 14, 10), additive(color, 0.6)))
      add(pet, { ...common, kind: 'charge', mesh, target, life: info.charge })
      break
    }
    default:
  }
}

function blizzardHit(pet, at, damage, info, ctx) {
  spawnShockwave(ctx.shockwavePool, at.x, at.z, info.radius, pet.def.scale.glow)
  burst(ctx.particleSystem, { x: at.x, y: 0.6, z: at.z }, pet.def.scale.glow, 40, info.radius)
  burst(ctx.particleSystem, { x: at.x, y: 0.6, z: at.z }, 0xffffff, 18, info.radius * 0.7)
  for (const m of ctx.monsters) if (alive(m) && dist(m.position, at) <= info.radius + (m.userData.reachBonus ?? 0)) ctx.hit(pet, m, damage, at, info.knockback)
}

// Fires the void beam from the mouth toward `target`: one long glowing column that hits every enemy on its line.
function fireBeam(pet, effect, ctx) {
  const { info, color, damage } = effect
  const from = mouthOf(pet)
  const aim = effect.target && alive(effect.target) ? effect.target.position : { x: from.x + Math.sin(pet.mesh.rotation.y), z: from.z + Math.cos(pet.mesh.rotation.y) }
  const dx = aim.x - from.x
  const dz = aim.z - from.z
  const d = Math.hypot(dx, dz) || 1
  const to = { x: from.x + (dx / d) * info.length, y: 0.4, z: from.z + (dz / d) * info.length }
  const a = new THREE.Vector3(from.x, from.y, from.z)
  const b = new THREE.Vector3(to.x, to.y, to.z)
  const length = a.distanceTo(b)
  const mesh = new THREE.Group()
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, length, 10), additive(0xffffff, 0.95))
  const glow = new THREE.Mesh(new THREE.CylinderGeometry(info.width, info.width, length, 14), additive(color, 0.5))
  const halo = new THREE.Mesh(new THREE.CylinderGeometry(info.width * 1.7, info.width * 1.7, length, 14), additive(color, 0.18))
  mesh.add(core, glow, halo)
  mesh.position.copy(a).add(b).multiplyScalar(0.5)
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize())
  add(pet, { ...effect, kind: 'beam', mesh, parts: [core, glow, halo], life: 0.75, t: 0 })
  // Hits everything within the beam's width of the line, then ripples along it.
  const line = { a: { x: from.x, z: from.z }, b: { x: to.x, z: to.z } }
  for (const m of ctx.monsters) {
    if (!alive(m)) continue
    if (distanceToSegment(m.position, line.a, line.b) <= info.width + (m.userData.reachBonus ?? 0) + 0.4) {
      ctx.hit(pet, m, damage, line.a, 5)
      burst(ctx.particleSystem, { x: m.position.x, y: m.position.y + 0.8, z: m.position.z }, color, 16, 3)
    }
  }
  for (let s = 3; s < info.length; s += 5) spawnShockwave(ctx.shockwavePool, from.x + (dx / d) * s, from.z + (dz / d) * s, 2.4, color)
  burst(ctx.particleSystem, from, 0xffffff, 24, 4)
}

// Advances every running special by dt.
export function stepSpecials(pet, dt, ctx) {
  if (!pet.effects?.length) return
  const pending = []
  pet.effects = pet.effects.filter((e) => {
    e.t += dt
    switch (e.kind) {
      case 'meteor': {
        if (e.t < e.delay) return true
        const f = Math.min(1, (e.t - e.delay) / e.fall)
        e.mesh.visible = true
        e.mesh.position.set(e.at.x - (1 - f) * 3, 0.4 + (1 - f) * 14, e.at.z)
        burst(ctx.particleSystem, e.mesh.position, e.color, 1, 0.8)
        if (f < 1) return true
        spawnShockwave(ctx.shockwavePool, e.at.x, e.at.z, e.info.radius, e.color)
        burst(ctx.particleSystem, { x: e.at.x, y: 0.5, z: e.at.z }, e.color, 24, 4)
        burst(ctx.particleSystem, { x: e.at.x, y: 0.5, z: e.at.z }, 0xfff2c0, 10, 2.5)
        for (const m of ctx.monsters) if (alive(m) && dist(m.position, e.at) <= e.info.radius + (m.userData.reachBonus ?? 0)) ctx.hit(pet, m, e.damage, e.at, 1.5)
        drop(pet, e)
        return false
      }
      case 'blizzard': {
        const f = Math.min(1, e.t / 0.25)
        e.mesh.children.forEach((s, i) => {
          s.scale.setScalar(f * (1 - Math.max(0, e.t - 0.7) / 0.3))
          s.position.y = 0.8 * s.scale.y
          s.rotation.y = i
        })
        if (e.t < e.life) return true
        drop(pet, e)
        return false
      }
      case 'bolt': {
        if (e.t < e.delay) return true
        const victim = e.victim
        if (!e.struck) {
          e.struck = true
          if (alive(victim)) {
            ctx.hit(pet, victim, e.damage, { x: victim.position.x, z: victim.position.z }, 1)
            burst(ctx.particleSystem, { x: victim.position.x, y: victim.position.y + 0.8, z: victim.position.z }, e.color, 18, 3.5)
            burst(ctx.particleSystem, { x: victim.position.x, y: victim.position.y + 0.8, z: victim.position.z }, 0xffffff, 8, 2)
          }
        }
        e.mesh.position.set(victim.position.x, 7, victim.position.z)
        e.mesh.material.opacity = Math.max(0, 0.9 * (1 - (e.t - e.delay) / e.life))
        if (e.t - e.delay < e.life) return true
        drop(pet, e)
        return false
      }
      case 'cloud': {
        e.tickT += dt
        e.mesh.children[0].material.opacity = 0.28 + Math.sin(e.t * 4) * 0.1 - Math.max(0, e.t - (e.life - 0.8)) * 0.3
        if (Math.random() < dt * 14) burst(ctx.particleSystem, { x: e.at.x + (Math.random() - 0.5) * e.info.radius * 1.6, y: 0.3, z: e.at.z + (Math.random() - 0.5) * e.info.radius * 1.6 }, e.color, 1, 0.5, 1)
        if (e.tickT >= e.info.tick) {
          e.tickT = 0
          for (const m of ctx.monsters) if (alive(m) && dist(m.position, e.at) <= e.info.radius + (m.userData.reachBonus ?? 0)) ctx.hit(pet, m, e.damage, e.at, 0)
        }
        if (e.t < e.life) return true
        drop(pet, e)
        return false
      }
      case 'charge': {
        // A dark orb swells at the mouth (the dragon keeps rearing), then the beam goes off.
        const m = mouthOf(pet)
        const f = Math.min(1, e.t / e.life)
        e.mesh.position.set(m.x, m.y, m.z)
        e.mesh.scale.setScalar(0.4 + f * 2.2 + Math.sin(e.t * 40) * 0.08)
        pet.mesh.userData.breathe = 1.2
        burst(ctx.particleSystem, { x: m.x + (Math.random() - 0.5) * 3, y: m.y + (Math.random() - 0.5) * 2, z: m.z + (Math.random() - 0.5) * 3 }, e.color, 1, -2)
        if (f < 1) return true
        pending.push(e)
        drop(pet, e)
        return false
      }
      case 'beam': {
        const f = e.t / e.life
        const width = f < 0.12 ? f / 0.12 : 1 - (f - 0.12) / 0.88
        e.mesh.scale.set(Math.max(0.01, width) * (1 + Math.sin(e.t * 50) * 0.06), 1, Math.max(0.01, width) * (1 + Math.sin(e.t * 50) * 0.06))
        if (f < 1) return true
        drop(pet, e)
        return false
      }
      default:
        return false
    }
  })
  for (const e of pending) fireBeam(pet, e, ctx)
}

export function disposeSpecials(pet) {
  for (const e of pet.effects ?? []) drop(pet, e)
  pet.effects = []
}
