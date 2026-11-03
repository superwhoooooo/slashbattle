// Power-up pickups: a glowing, bobbing icon on the ground that you collect by
// walking over it. Spawned over time (and dropped by bosses) with a perk you
// don't own yet; main.js decides where/when and hands the loot to receiveLoot.
import * as THREE from 'three'
import { iconUrl } from './icons.js'
import { POWERUPS } from './logic/items.js'

export const PICKUP_RADIUS = 1.5

export function createPerkPickup(point, id) {
  const perk = POWERUPS[id]
  const color = new THREE.Color(perk.color)
  const group = new THREE.Group()
  group.position.set(point.x, 0, point.z)
  group.userData = { id, pickup: true, age: 0 }

  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.07, 8, 36), new THREE.MeshBasicMaterial({ color }))
  ring.rotation.x = Math.PI / 2
  ring.position.y = 0.1
  group.add(ring)
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(1.0, 28),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.AdditiveBlending }),
  )
  disc.rotation.x = -Math.PI / 2
  disc.position.y = 0.08
  group.add(disc)
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.8, 4, 16, 1, true),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }),
  )
  beam.position.y = 2
  group.add(beam)

  const texture = new THREE.TextureLoader().load(iconUrl('powerup', id))
  texture.colorSpace = THREE.SRGBColorSpace
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }))
  sprite.scale.set(1.5, 1.5, 1)
  sprite.position.y = 1.4
  group.add(sprite)
  group.userData.sprite = sprite
  group.userData.ring = ring
  group.userData.beam = beam
  return group
}

export function updatePerkPickup(pickup, dt) {
  const u = pickup.userData
  u.age += dt
  u.ring.rotation.z += dt * 1.2
  u.sprite.position.y = 1.4 + Math.sin(u.age * 2.6) * 0.18
  const grow = Math.min(1, u.age / 0.4) // pops in
  pickup.scale.setScalar(grow)
  u.beam.material.opacity = 0.13 + 0.05 * Math.sin(u.age * 4)
}
