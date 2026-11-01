// Poison from a bloater: a glob arcs through the air toward where it
// predicted you'd be (a faint ring marks the landing spot), then bursts into
// a bubbling puddle that hurts anyone standing in it. The rules are pure
// (src/logic/enemies.js); this owns the pooled meshes.
import * as THREE from 'three'
import { PLAYER_RADIUS } from './config.js'
import { createPoison, stepPoison } from './logic/enemies.js'

const POOL_SIZE = 10
const POISON_COLOR = 0x8fe02e
const ARC_HEIGHT = 4.5

export function createPoisonPool() {
  const group = new THREE.Group()
  const discGeometry = new THREE.CircleGeometry(1, 36)
  const ringGeometry = new THREE.RingGeometry(0.9, 1, 36)
  const globGeometry = new THREE.IcosahedronGeometry(0.35, 1)
  const slots = []
  for (let i = 0; i < POOL_SIZE; i++) {
    const disc = new THREE.Mesh(discGeometry, new THREE.MeshBasicMaterial({ color: POISON_COLOR, transparent: true, opacity: 0.4, depthWrite: false }))
    const ring = new THREE.Mesh(ringGeometry, new THREE.MeshBasicMaterial({ color: POISON_COLOR, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false }))
    const glob = new THREE.Mesh(globGeometry, new THREE.MeshBasicMaterial({ color: POISON_COLOR }))
    disc.rotation.x = ring.rotation.x = -Math.PI / 2
    disc.position.y = 0.05
    ring.position.y = 0.07
    for (const mesh of [disc, ring, glob]) {
      mesh.visible = false
      group.add(mesh)
    }
    slots.push({ disc, ring, glob, data: null })
  }
  return { group, slots, geometries: [discGeometry, ringGeometry, globGeometry] }
}

function hideSlot(slot) {
  slot.data = null
  slot.disc.visible = slot.ring.visible = slot.glob.visible = false
}

// Lobs a glob from (x, z) that lands at (tx, tz). Skipped when the pool is full.
export function lobPoison(pool, { x, z, tx, tz, flight, radius, life, tick, damage }) {
  const slot = pool.slots.find((s) => !s.data)
  if (!slot) return
  slot.data = createPoison({ sx: x, sz: z, x: tx, z: tz, flight, radius, life, tick, damage })
  slot.ring.position.set(tx, 0.07, tz)
  slot.ring.scale.setScalar(radius)
  slot.ring.visible = true
  slot.disc.visible = false
  slot.glob.visible = true
}

// Advances every glob / puddle; returns true when one hurt the player this
// frame (so the caller can shake the screen).
export function updatePoison(pool, dt, player, now) {
  let hurt = false
  for (const slot of pool.slots) {
    const p = slot.data
    if (!p) continue
    const before = p.phase
    const { alive, hit } = stepPoison(p, dt, player, PLAYER_RADIUS)
    if (!alive) {
      hideSlot(slot)
      continue
    }
    if (p.phase === 'flying') {
      const t = Math.min(1, p.elapsed / p.flight)
      slot.glob.position.set(p.sx + (p.x - p.sx) * t, 0.6 + Math.sin(t * Math.PI) * ARC_HEIGHT, p.sz + (p.z - p.sz) * t)
      slot.ring.material.opacity = 0.35 + 0.5 * t
    } else {
      if (before === 'flying') {
        slot.glob.visible = false
        slot.disc.position.set(p.x, 0.05, p.z)
        slot.disc.visible = true
        slot.ring.material.opacity = 0.9
      }
      const fade = Math.min(1, (p.life - p.elapsed) / 1.2)
      slot.disc.scale.setScalar(p.radius * (0.9 + 0.05 * Math.sin(p.elapsed * 7)))
      slot.disc.material.opacity = 0.4 * fade
      slot.ring.material.opacity = 0.9 * fade
    }
    if (hit && player.damagePlayer(p.damage, now)) hurt = true
  }
  return hurt
}

export function resetPoison(pool) {
  for (const slot of pool.slots) hideSlot(slot)
}
