import * as THREE from 'three'
import {
  LOUNGER_LENGTH,
  LOUNGER_WIDTH,
  UMBRELLA_CANOPY_HEIGHT,
  UMBRELLA_POLE_COLOR,
  UMBRELLA_POLE_HEIGHT,
  UMBRELLA_POLE_RADIUS,
} from './config.js'

// Per-place prop models. Every level's layout (logic/resortLayout.js) has
// two kinds of solid props -- tall "feature" props (the layout's umbrellas,
// footprint radius ~1.1) and low "seat" props (its loungers, radius ~0.5) --
// and each style below draws its own version of both. A builder returns an
// Object3D positioned at the prop's spot with its base on y = topY. Colors
// come from the level (`color` is the layout's rolled palette color for that
// prop, `level.props` has the rest).

function shadowed(mesh) {
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

function glowing(color, intensity) {
  return { color, emissive: new THREE.Color(color), emissiveIntensity: intensity }
}

// ---- Orbital Resort: beach umbrellas and slatted loungers ----------------

function resortFeature(prop, topY) {
  const group = new THREE.Group()
  group.position.set(prop.x, topY, prop.z)
  const pole = shadowed(
    new THREE.Mesh(
      new THREE.CylinderGeometry(UMBRELLA_POLE_RADIUS, UMBRELLA_POLE_RADIUS, UMBRELLA_POLE_HEIGHT, 8),
      new THREE.MeshStandardMaterial({ color: UMBRELLA_POLE_COLOR, metalness: 0.4, roughness: 0.4 }),
    ),
  )
  pole.position.y = UMBRELLA_POLE_HEIGHT / 2
  group.add(pole)
  const canopy = shadowed(
    new THREE.Mesh(
      new THREE.ConeGeometry(prop.radius * 0.9, UMBRELLA_CANOPY_HEIGHT, 12, 1, true),
      new THREE.MeshStandardMaterial({ color: prop.color, roughness: 0.5, side: THREE.DoubleSide }),
    ),
  )
  canopy.position.y = UMBRELLA_POLE_HEIGHT
  group.add(canopy)
  return group
}

function resortSeat(prop, topY, level) {
  const group = new THREE.Group()
  group.position.set(prop.x, topY, prop.z)
  group.rotation.y = prop.rotation
  const material = new THREE.MeshStandardMaterial({ color: level.props.loungerColor, roughness: 0.6 })
  const seat = shadowed(new THREE.Mesh(new THREE.BoxGeometry(LOUNGER_WIDTH, 0.08, LOUNGER_LENGTH), material))
  seat.position.y = 0.14
  group.add(seat)
  const backOffset = LOUNGER_LENGTH / 2 - 0.1
  const back = shadowed(new THREE.Mesh(new THREE.BoxGeometry(LOUNGER_WIDTH, 0.5, 0.08), material))
  back.position.set(0, 0.35, -backOffset)
  back.rotation.x = -0.3
  group.add(back)
  return group
}

// ---- Frostbite Spa: ice crystal clusters and snow mounds -----------------

function frostFeature(prop, topY) {
  const group = new THREE.Group()
  group.position.set(prop.x, topY, prop.z)
  const material = new THREE.MeshPhysicalMaterial({
    color: prop.color,
    roughness: 0.12,
    metalness: 0,
    transmission: 0.2,
    transparent: true,
    opacity: 0.85,
    flatShading: true,
    ...glowing(prop.color, 0.15),
  })
  // A tall central spike with a ring of shorter, leaning ones.
  const spikes = [
    { x: 0, z: 0, h: 2.6, r: 0.42, tilt: 0 },
    { x: 0.55, z: 0.1, h: 1.6, r: 0.28, tilt: 0.25 },
    { x: -0.45, z: 0.3, h: 1.9, r: 0.3, tilt: -0.22 },
    { x: 0.05, z: -0.55, h: 1.4, r: 0.26, tilt: 0.18 },
  ]
  for (const spike of spikes) {
    const mesh = shadowed(new THREE.Mesh(new THREE.ConeGeometry(spike.r, spike.h, 5), material))
    mesh.position.set(spike.x, spike.h / 2, spike.z)
    mesh.rotation.z = spike.tilt
    group.add(mesh)
  }
  return group
}

function frostSeat(prop, topY, level) {
  const group = new THREE.Group()
  group.position.set(prop.x, topY, prop.z)
  group.rotation.y = prop.rotation
  const snow = new THREE.MeshStandardMaterial({ color: level.props.loungerColor, roughness: 0.9 })
  const mound = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), snow))
  mound.scale.set(1.05, 0.7, 1.4)
  group.add(mound)
  return group
}

// ---- Magma Marina: volcanic rock spires and lava rocks -------------------

function magmaFeature(prop, topY) {
  const group = new THREE.Group()
  group.position.set(prop.x, topY, prop.z)
  const rock = new THREE.MeshStandardMaterial({ color: 0x3b3230, roughness: 0.95, flatShading: true })
  const lava = new THREE.MeshStandardMaterial({ roughness: 0.4, ...glowing(prop.color, 1.1) })
  const base = shadowed(new THREE.Mesh(new THREE.DodecahedronGeometry(0.95, 0), rock))
  base.scale.y = 1.2
  base.position.y = 0.8
  group.add(base)
  const mid = shadowed(new THREE.Mesh(new THREE.DodecahedronGeometry(0.62, 0), rock))
  mid.position.set(0.05, 1.8, 0)
  mid.rotation.y = 0.7
  group.add(mid)
  // A glowing molten cap and a crack band.
  const cap = new THREE.Mesh(new THREE.DodecahedronGeometry(0.34, 0), lava)
  cap.position.set(0, 2.45, 0)
  group.add(cap)
  const crack = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.07, 6, 10), lava)
  crack.rotation.x = Math.PI / 2
  crack.position.y = 1.15
  group.add(crack)
  return group
}

function magmaSeat(prop, topY) {
  const group = new THREE.Group()
  group.position.set(prop.x, topY, prop.z)
  group.rotation.y = prop.rotation
  const rock = new THREE.MeshStandardMaterial({ color: 0x4a4140, roughness: 0.95, flatShading: true })
  const stone = shadowed(new THREE.Mesh(new THREE.DodecahedronGeometry(0.42, 0), rock))
  stone.scale.set(1, 0.6, 1.2)
  stone.position.y = 0.2
  group.add(stone)
  const ember = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.14, 0),
    new THREE.MeshStandardMaterial(glowing(0xff7a2a, 1.4)),
  )
  ember.position.set(0.12, 0.42, 0.05)
  group.add(ember)
  return group
}

// ---- Neon Nightclub: light pylons and speaker stacks ---------------------

function neonFeature(prop, topY) {
  const group = new THREE.Group()
  group.position.set(prop.x, topY, prop.z)
  const dark = new THREE.MeshStandardMaterial({ color: 0x1a1536, roughness: 0.4, metalness: 0.5 })
  const neon = new THREE.MeshStandardMaterial({ roughness: 0.3, ...glowing(prop.color, 1.6) })
  const post = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 2.8, 10), dark))
  post.position.y = 1.4
  group.add(post)
  for (const y of [0.7, 1.5, 2.3]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.06, 8, 20), neon)
    ring.rotation.x = Math.PI / 2
    ring.position.y = y
    group.add(ring)
  }
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 12), neon)
  orb.position.y = 3.0
  group.add(orb)
  return group
}

function neonSeat(prop, topY, level) {
  const group = new THREE.Group()
  group.position.set(prop.x, topY, prop.z)
  group.rotation.y = prop.rotation
  const body = new THREE.MeshStandardMaterial({ color: level.props.loungerColor, roughness: 0.5, metalness: 0.3 })
  const speaker = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.55), body))
  speaker.position.y = 0.4
  group.add(speaker)
  const cone = new THREE.Mesh(
    new THREE.CircleGeometry(0.2, 16),
    new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, ...glowing(0x37f2ff, 1.2) }),
  )
  cone.position.set(0, 0.42, 0.28)
  group.add(cone)
  return group
}

// ---- Candy Cove: lollipops and gumdrops ----------------------------------

function candyFeature(prop, topY) {
  const group = new THREE.Group()
  group.position.set(prop.x, topY, prop.z)
  const stick = shadowed(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 1.9, 8),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 }),
    ),
  )
  stick.position.y = 0.95
  group.add(stick)
  const candy = new THREE.MeshPhysicalMaterial({ color: prop.color, roughness: 0.25, clearcoat: 1 })
  const swirl = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 })
  const head = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.85, 20, 14), candy))
  head.position.y = 2.3
  group.add(head)
  for (const radius of [0.5, 0.78]) {
    const stripe = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.9, 0.06, 6, 24), swirl)
    stripe.position.set(0, 2.3, 0.4 + (0.78 - radius) * 0.6)
    group.add(stripe)
  }
  return group
}

function candySeat(prop, topY, level) {
  const group = new THREE.Group()
  group.position.set(prop.x, topY, prop.z)
  group.rotation.y = prop.rotation
  const material = new THREE.MeshPhysicalMaterial({ color: level.props.umbrellaColors[Math.floor(Math.abs(prop.x * 7 + prop.z * 3)) % level.props.umbrellaColors.length], roughness: 0.3, clearcoat: 0.8 })
  const drop = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.46, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), material))
  drop.scale.set(1, 0.85, 1)
  group.add(drop)
  const sugar = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.04, 6, 20), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }))
  sugar.rotation.x = Math.PI / 2
  sugar.position.y = 0.04
  group.add(sugar)
  return group
}

export const PROP_STYLES = {
  resort: { feature: resortFeature, seat: resortSeat },
  frost: { feature: frostFeature, seat: frostSeat },
  magma: { feature: magmaFeature, seat: magmaSeat },
  neon: { feature: neonFeature, seat: neonSeat },
  candy: { feature: candyFeature, seat: candySeat },
}
