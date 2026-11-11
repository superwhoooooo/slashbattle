// Dresses the player's jelly as a hero (logic/heroes.js): recolours the body for the skin and
// hangs the hero's gear on it -- hats, the plague doctor's beak mask and lantern, capes, halos,
// horns, antlers, wings... Inspired by Shardfall's hero gear, built from primitives in
// SlashBattle's candy style. Gear is a child of the player group, so it turns with the body; a
// few pieces sway or orbit through `gear.userData.animate(time, speed)`.
//
// The body is an icosahedron of radius PLAYER_BODY_RADIUS sitting on y = 0, face toward +z.
import * as THREE from 'three'
import { PLAYER_BODY_RADIUS } from './config.js'

// Gear owns all its geometry and materials, so swapping heroes frees them.
function disposeGear(group) {
  group.traverse((o) => {
    o.geometry?.dispose()
    o.material?.dispose?.()
  })
}

const R = PLAYER_BODY_RADIUS
const TOP = R * 2 // top of the body
const FRONT = Math.PI / 2 // rotate a +y cone to point +z

const solid = (color, roughness = 0.6, metalness = 0.05) => new THREE.MeshStandardMaterial({ color, roughness, metalness, flatShading: true })
const glowMat = (color) => new THREE.MeshBasicMaterial({ color })
const clothMat = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, side: THREE.DoubleSide, flatShading: true })

function part(group, geometry, material, [x, y, z] = [0, 0, 0], [rx, ry, rz] = [0, 0, 0], scale = null) {
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(x, y, z)
  mesh.rotation.set(rx, ry, rz)
  if (scale) mesh.scale.set(...scale)
  mesh.castShadow = true
  group.add(mesh)
  return mesh
}

// A pair of mirrored parts (x and -x), each from make(side).
const both = (make) => [make(-1), make(1)]

const GEAR = {
  // A brimmed bucket hat (the plague doctor's is wide and flat-topped).
  plagueHat(g, look) {
    const hat = solid(look.cloak, 0.8)
    part(g, new THREE.CylinderGeometry(0.72, 0.72, 0.04, 28), hat, [0, TOP - 0.06, 0])
    part(g, new THREE.CylinderGeometry(0.3, 0.36, 0.42, 20), hat, [0, TOP + 0.15, 0])
    part(g, new THREE.CylinderGeometry(0.365, 0.365, 0.08, 20), solid(look.trim), [0, TOP + 0.01, 0])
  },
  // The beak mask: a pale curved beak, a mask plate and two round glowing lenses.
  beak(g, look) {
    const leather = solid(look.trim, 0.55)
    part(g, new THREE.SphereGeometry(0.42, 16, 12), leather, [0, R * 1.32, R * 0.52], [0, 0, 0], [1, 0.75, 0.55])
    const beak = part(g, new THREE.ConeGeometry(0.13, 0.7, 14), leather, [0, R * 1.08, R + 0.42], [FRONT + 0.35, 0, 0], [1, 1, 0.8])
    beak.userData.beak = true
    for (const side of [-1, 1]) {
      part(g, new THREE.TorusGeometry(0.1, 0.03, 8, 18), solid(0x2a2620, 0.4, 0.5), [side * 0.17, R * 1.42, R * 0.98])
      part(g, new THREE.CircleGeometry(0.09, 18), glowMat(look.glow), [side * 0.17, R * 1.42, R * 0.985])
    }
  },
  // A long cloak hanging from the back, almost to the floor, with a high collar.
  longCape(g, look) {
    GEAR.cape(g, look, 1.15)
    part(g, new THREE.TorusGeometry(R * 0.86, 0.06, 8, 24, Math.PI * 1.2), clothMat(look.cloak), [0, R * 1.35, -0.02], [Math.PI / 2, 0, Math.PI * 0.9 - Math.PI * 0.6 + Math.PI / 2])
  },
  cape(g, look, length = 0.9) {
    const geo = new THREE.CylinderGeometry(R * 0.92, R * 1.2, length, 18, 3, true, Math.PI - 1.1, 2.2)
    const cape = part(g, geo, clothMat(look.cloak), [0, R * 1.5 - length / 2, -0.04])
    cape.userData.sway = true
  },
  leafCape(g, look) {
    GEAR.cape(g, look, 0.95)
    const leaf = solid(look.glow, 0.7)
    for (let i = 0; i < 7; i++) {
      const a = Math.PI - 0.9 + (i / 6) * 1.8
      part(g, new THREE.ConeGeometry(0.08, 0.26, 5), leaf, [Math.sin(a) * R * 1.02, R * 1.55, Math.cos(a) * R * 1.02], [0.4 * Math.cos(a), 0, -0.4 * Math.sin(a)])
    }
  },
  // A knight's cap-helm over the crown of the head (stops above the googly eyes).
  helm(g, look) {
    part(g, new THREE.SphereGeometry(R * 1.06, 22, 10, 0, Math.PI * 2, 0, Math.PI * 0.3), solid(look.trim, 0.35, 0.6), [0, R, 0])
    part(g, new THREE.TorusGeometry(R * 0.62, 0.035, 6, 24), solid(look.trim, 0.35, 0.6), [0, R + R * 1.06 * Math.cos(Math.PI * 0.3), 0], [Math.PI / 2, 0, 0])
  },
  plume(g, look) {
    const plume = part(g, new THREE.ConeGeometry(0.12, 0.5, 8), glowMat(look.glow), [0, TOP + 0.24, -0.08], [-0.35, 0, 0])
    plume.userData.flicker = true
  },
  horns(g, look) {
    both((side) => part(g, new THREE.ConeGeometry(0.09, 0.42, 8), solid(look.trim, 0.45), [side * 0.36, TOP - 0.02, 0.02], [0, 0, -side * 0.7]))
    both((side) => part(g, new THREE.SphereGeometry(0.035, 6, 4), glowMat(look.glow), [side * 0.5, TOP + 0.15, 0.02]))
  },
  antlers(g, look) {
    const wood = solid(look.trim, 0.8)
    both((side) => {
      part(g, new THREE.CylinderGeometry(0.03, 0.045, 0.5, 6), wood, [side * 0.3, TOP + 0.12, 0], [0, 0, -side * 0.5])
      part(g, new THREE.CylinderGeometry(0.022, 0.03, 0.26, 6), wood, [side * 0.46, TOP + 0.3, 0.04], [0.3, 0, side * 0.4])
      part(g, new THREE.CylinderGeometry(0.02, 0.028, 0.22, 6), wood, [side * 0.34, TOP + 0.38, -0.02], [-0.2, 0, -side * 0.2])
      return part(g, new THREE.SphereGeometry(0.05, 6, 4), glowMat(look.glow), [side * 0.48, TOP + 0.44, 0.06])
    })
  },
  halo(g, look) {
    const halo = part(g, new THREE.TorusGeometry(0.34, 0.035, 8, 32), glowMat(look.glow), [0, TOP + 0.38, -0.05], [Math.PI / 2 - 0.25, 0, 0])
    halo.userData.bob = true
  },
  crystals(g, look) {
    const orbit = new THREE.Group()
    orbit.position.y = R * 1.2
    orbit.userData.orbit = true
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2
      part(orbit, new THREE.OctahedronGeometry(0.1), glowMat(look.glow), [Math.cos(a) * 0.95, 0.25 * Math.sin(a * 2), Math.sin(a) * 0.95], [0, 0, 0], [0.8, 1.4, 0.8])
    }
    g.add(orbit)
  },
  wizardHat(g, look) {
    const cloth = solid(look.cloak, 0.75)
    part(g, new THREE.CylinderGeometry(0.62, 0.62, 0.035, 24), cloth, [0, TOP - 0.08, 0])
    const cone = part(g, new THREE.ConeGeometry(0.34, 0.85, 18), cloth, [0, TOP + 0.33, -0.04], [-0.18, 0, 0.12])
    cone.userData.sway = true
    part(g, new THREE.CylinderGeometry(0.345, 0.35, 0.07, 18), solid(look.trim), [0, TOP - 0.03, 0])
    part(g, new THREE.OctahedronGeometry(0.08), glowMat(look.glow), [0.1, TOP + 0.74, -0.2])
  },
  minerHat(g, look) {
    part(g, new THREE.SphereGeometry(R * 0.78, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), solid(look.cloak, 0.5, 0.2), [0, TOP - 0.16, 0])
    part(g, new THREE.CylinderGeometry(0.62, 0.62, 0.03, 22), solid(look.cloak, 0.5, 0.2), [0, TOP - 0.15, 0.04])
    part(g, new THREE.CylinderGeometry(0.09, 0.11, 0.08, 12), solid(look.trim, 0.3, 0.6), [0, TOP + 0.05, R * 0.66], [FRONT, 0, 0])
    part(g, new THREE.CircleGeometry(0.075, 14), glowMat(look.glow), [0, TOP + 0.05, R * 0.66 + 0.045])
  },
  pickaxe(g, look) {
    const pick = new THREE.Group()
    pick.position.set(-0.1, R * 1.1, -R - 0.08)
    pick.rotation.z = 0.7
    part(pick, new THREE.CylinderGeometry(0.03, 0.03, 0.9, 6), solid(0x6a4a2a, 0.8))
    part(pick, new THREE.BoxGeometry(0.62, 0.07, 0.07), solid(look.trim, 0.35, 0.6), [0, 0.42, 0], [0, 0, 0], [1, 1, 1])
    g.add(pick)
  },
  scarf(g, look) {
    const cloth = clothMat(look.cloak)
    part(g, new THREE.TorusGeometry(R * 0.9, 0.09, 8, 24), cloth, [0, R * 0.62, 0], [Math.PI / 2, 0, 0])
    const tail = part(g, new THREE.BoxGeometry(0.16, 0.05, 0.7), cloth, [0.2, R * 0.66, -R - 0.3], [0.2, 0.2, 0])
    tail.userData.flap = true
  },
  goggles(g, look) {
    part(g, new THREE.TorusGeometry(R * 0.86, 0.04, 6, 26), solid(look.trim, 0.6), [0, R * 1.68, 0], [Math.PI / 2 + 0.15, 0, 0])
    for (const side of [-1, 1]) {
      part(g, new THREE.CylinderGeometry(0.12, 0.12, 0.08, 14), solid(look.trim, 0.4, 0.4), [side * 0.17, R * 1.74, R * 0.66], [FRONT - 0.5, 0, 0])
      part(g, new THREE.CircleGeometry(0.095, 14), glowMat(look.glow), [side * 0.17, R * 1.76, R * 0.7], [-0.5, 0, 0])
    }
  },
  hood(g, look) {
    part(g, new THREE.SphereGeometry(R * 1.08, 20, 10, Math.PI * 0.35, Math.PI * 1.3, 0, Math.PI * 0.42), clothMat(look.cloak), [0, R * 1.02, -0.03])
    GEAR.cape(g, look, 0.85)
  },
  moon(g, look) {
    const moon = part(g, new THREE.TorusGeometry(0.2, 0.055, 8, 24, Math.PI * 1.25), glowMat(look.glow), [0, TOP + 0.45, -0.05], [0, 0, 0.9])
    moon.userData.bob = true
  },
  quiver(g, look) {
    const q = new THREE.Group()
    q.position.set(0.22, R * 1.05, -R - 0.05)
    q.rotation.z = -0.4
    part(q, new THREE.CylinderGeometry(0.1, 0.09, 0.6, 10), solid(look.trim, 0.8))
    for (const dx of [-0.04, 0.03]) part(q, new THREE.ConeGeometry(0.04, 0.12, 4), glowMat(look.glow), [dx, 0.38, 0])
    g.add(q)
  },
  beads(g, look) {
    const bead = solid(look.trim, 0.4)
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2
      part(g, new THREE.SphereGeometry(0.055, 8, 6), bead, [Math.sin(a) * R * 0.98, R * 0.58 - 0.12 * Math.cos(a), Math.cos(a) * R * 0.98])
    }
  },
  plate(g, look) {
    part(g, new THREE.SphereGeometry(R * 1.04, 20, 8, 0, Math.PI * 2, Math.PI * 0.62, Math.PI * 0.2), solid(look.trim, 0.35, 0.6), [0, R, 0])
    part(g, new THREE.OctahedronGeometry(0.07), glowMat(look.glow), [0, R * 0.55, R * 1.0])
  },
  wings(g, look) {
    const feather = solid(look.cloak, 0.6)
    for (const side of [-1, 1]) {
      const wing = new THREE.Group()
      wing.position.set(side * 0.28, R * 1.3, -R * 0.75)
      wing.rotation.y = side * 0.5
      wing.userData.wing = side
      for (let i = 0; i < 4; i++) part(wing, new THREE.SphereGeometry(0.2, 10, 6), feather, [side * (0.18 + i * 0.16), 0.08 + i * 0.06 - i * i * 0.03, 0], [0, 0, side * (0.4 + i * 0.25)], [1.6 - i * 0.2, 0.42, 0.18])
      g.add(wing)
    }
  },
  lantern(g, look) {
    const lantern = new THREE.Group()
    lantern.position.set(R + 0.12, R * 0.7, 0.15)
    lantern.userData.swing = true
    part(lantern, new THREE.CylinderGeometry(0.008, 0.008, 0.24, 4), solid(0x2a2620), [0, 0.12, 0])
    part(lantern, new THREE.CylinderGeometry(0.09, 0.11, 0.04, 8), solid(look.trim, 0.4, 0.5), [0, 0, 0])
    part(lantern, new THREE.SphereGeometry(0.075, 10, 8), glowMat(look.glow), [0, -0.09, 0])
    part(lantern, new THREE.CylinderGeometry(0.11, 0.09, 0.04, 8), solid(look.trim, 0.4, 0.5), [0, -0.18, 0])
    g.add(lantern)
  },
}

export const GEAR_PARTS = Object.keys(GEAR)

// Recolours the body for the skin, removes any old gear, builds the new set and returns it.
export function dressPlayer(mesh, look) {
  const body = mesh.userData.jelly?.body
  if (body) {
    // Same treatment createPlayerMesh gives the coral shell: a touch darker so it doesn't glare.
    body.material.color.set(look.body).multiplyScalar(0.8)
    body.material.emissive?.set(look.body)
  }
  const edges = mesh.userData.jelly?.edges
  if (edges) edges.material.color.set(look.body).lerp(new THREE.Color(0xffffff), 0.5)
  if (mesh.userData.face3d) mesh.userData.face3d.group.visible = !look.mask
  const old = mesh.userData.heroGear
  if (old) {
    mesh.remove(old)
    disposeGear(old)
  }
  const gear = new THREE.Group()
  gear.name = 'heroGear'
  for (const id of look.gear ?? []) GEAR[id]?.(gear, look)
  const moving = []
  gear.traverse((o) => {
    if (o !== gear && Object.keys(o.userData).length) moving.push(o)
  })
  for (const o of moving) o.userData.rest = { x: o.rotation.x, y: o.rotation.y, z: o.rotation.z, py: o.position.y }
  // A little life: capes sway with speed, halos bob, crystals orbit, the lantern swings, wings flap.
  gear.userData.animate = (time, speed = 0) => {
    const run = Math.min(1, speed / 6)
    for (const o of moving) {
      const rest = o.userData.rest
      if (o.userData.sway) o.rotation.x = rest.x - run * 0.25 + Math.sin(time * 3) * 0.03
      if (o.userData.bob) o.position.y = rest.py + Math.sin(time * 2.2) * 0.04
      if (o.userData.orbit) o.rotation.y = time * 1.4
      if (o.userData.swing) o.rotation.x = Math.sin(time * 4) * (0.1 + run * 0.3)
      if (o.userData.flap) o.rotation.x = rest.x + Math.sin(time * 9) * (0.08 + run * 0.25)
      if (o.userData.flicker) o.scale.y = 1 + Math.sin(time * 17) * 0.12
      if (o.userData.wing) o.rotation.y = o.userData.wing * (0.5 + Math.sin(time * (3 + run * 6)) * (0.12 + run * 0.2))
    }
  }
  mesh.add(gear)
  mesh.userData.heroGear = gear
  return gear
}
