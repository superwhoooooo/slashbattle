import * as THREE from 'three'
import { ANIMAL_BUILDERS } from './petAnimals.js'

// Pet models: little real animals and real things (a fox, a bee, a bomb, a
// medkit...) built from a handful of primitives, instead of the jellies'
// faceted shapes. Every model faces +Z (the way pets.js turns them to face
// where they are heading), stands on y = 0 and is roughly 0.9 units tall at
// most. `createPetModel(def)` returns a Group whose userData has:
//   fly      - true for things that hover (birds, bee, fish, rocket, heart...)
//   animate  - (elapsedSeconds, moving) => void, wagging tails, flapping wings
// def.model picks the builder.

const matCache = new Map()
function mat(color, extra = {}) {
  const key = `${color}:${JSON.stringify(extra)}`
  if (!matCache.has(key)) {
    matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0, ...extra }))
  }
  return matCache.get(key)
}

function glow(color, intensity = 1.2) {
  return mat(color, { emissive: new THREE.Color(color), emissiveIntensity: intensity, roughness: 0.4 })
}

// A mesh in one call: geometry, material, position, optional scale.
function part(geometry, material, [x, y, z], scale = [1, 1, 1]) {
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(x, y, z)
  mesh.scale.set(...scale)
  return mesh
}

// Sets a mesh's pitch and hands it back (so it can go straight into group.add).
const pitched = (mesh, rx) => {
  mesh.rotation.x = rx
  return mesh
}

const sphere = (r) => new THREE.SphereGeometry(r, 16, 12)

// A pair of googly-ish eyes: white ball, dark pupil poking forward.
function addEyes(group, { x = 0.09, y, z, r = 0.055 }) {
  for (const side of [-1, 1]) {
    group.add(part(sphere(r), mat(0xffffff), [side * x, y, z]))
    group.add(part(sphere(r * 0.6), mat(0x1b1b1b), [side * x, y, z + r * 0.7]))
  }
}

// ---- Birds ---------------------------------------------------------------

// A bird in flight: horizontal body, head and beak forward, wings spread wide and bending
// at the wrist, a tail fan and tucked (or trailing) feet. pets.js lets these soar over the
// player (userData.soar), banking into turns and diving on enemies. Faces +Z.
// opts: body, belly, beak, beakTip, beakKind ('cone' | 'hook' | 'big' | 'flat'), wing,
// wingTip, tail, tailTip, legs (color), legStyle ('tucked' | 'trail'), eye ('plain' |
// 'owl'), disc (owl face), tufts, crest, span, chord, sweep, bodyR, bodyLen, headR, neck,
// tailLen, tailFeathers, tailFan, tailWidth, cruise (soaring altitude)
function bird(opts) {
  const group = new THREE.Group()
  const cy = 0.5
  const R = opts.bodyR ?? 0.19
  const len = opts.bodyLen ?? 1.8
  const headR = opts.headR ?? 0.12
  const body = mat(opts.body)
  const legColor = mat(opts.legs ?? 0xffa63d)

  group.add(part(sphere(R), body, [0, cy, 0], [1, 0.9, len]))
  if (opts.belly) group.add(part(sphere(R * 0.92), mat(opts.belly), [0, cy - 0.05, 0.05], [0.95, 0.72, len * 0.85]))

  // Neck and head.
  const neck = opts.neck ?? 0
  const hz = R * len * 0.85 + neck
  const hy = cy + 0.06
  if (neck > 0) group.add(pitched(part(new THREE.CylinderGeometry(0.045, 0.06, neck + 0.12, 8), body, [0, cy + 0.03, R * len * 0.85 + neck / 2 - 0.02]), Math.PI / 2 - 0.1))
  group.add(part(sphere(headR), body, [0, hy, hz], opts.eye === 'owl' ? [1.1, 1, 1] : [1, 1, 1.1]))
  if (opts.eye === 'owl') {
    for (const side of [-1, 1]) {
      group.add(part(sphere(0.1), mat(opts.disc ?? 0xf3e6c8), [side * 0.085, hy + 0.01, hz + 0.1], [1, 1, 0.4]))
      group.add(part(sphere(0.055), mat(0xffc93c), [side * 0.085, hy + 0.01, hz + 0.135], [1, 1, 0.5]))
      group.add(part(sphere(0.03), mat(0x1b1b1b), [side * 0.085, hy + 0.01, hz + 0.152], [1, 1, 0.5]))
    }
  } else {
    addEyes(group, { x: headR * 0.72, y: hy + 0.03, z: hz + headR * 0.45, r: headR * 0.3 })
  }

  // Beak.
  const beakMat = mat(opts.beak ?? 0xffa63d)
  const bz = hz + headR * 0.8
  const kind = opts.beakKind ?? 'cone'
  if (kind === 'big') {
    const beak = part(new THREE.ConeGeometry(0.085, 0.44, 8), beakMat, [0, hy - 0.02, bz + 0.2])
    beak.rotation.x = Math.PI / 2 + 0.1
    group.add(beak)
    group.add(part(sphere(0.045), mat(opts.beakTip ?? 0x1b1b1b), [0, hy - 0.06, bz + 0.41]))
  } else if (kind === 'flat') {
    group.add(part(new THREE.BoxGeometry(0.1, 0.035, 0.15), beakMat, [0, hy - 0.025, bz + 0.07]))
    group.add(part(sphere(0.05), beakMat, [0, hy - 0.025, bz + 0.15], [1.1, 0.5, 0.8]))
  } else {
    const hook = kind === 'hook'
    const beak = part(new THREE.ConeGeometry(hook ? 0.065 : 0.045, hook ? 0.17 : 0.16, 8), beakMat, [0, hy - 0.025, bz + 0.07])
    beak.rotation.x = Math.PI / 2 + (hook ? 0.35 : 0.05)
    group.add(beak)
  }
  if (opts.tufts) {
    for (const side of [-1, 1]) {
      const tuft = part(new THREE.ConeGeometry(0.05, 0.15, 4), body, [side * 0.1, hy + headR * 0.95, hz - 0.03])
      tuft.rotation.z = side * -0.35
      group.add(tuft)
    }
  }
  if (opts.crest) {
    const crest = part(new THREE.ConeGeometry(0.04, 0.12, 4), mat(opts.crest), [0, hy + headR * 0.95, hz - 0.04])
    crest.rotation.x = -0.5
    group.add(crest)
  }

  // Tail: a fan of flat feathers spreading back from the rump.
  const tailLen = opts.tailLen ?? 0.34
  const feathers = opts.tailFeathers ?? 5
  const fan = opts.tailFan ?? 0.4
  const tailG = new THREE.Group()
  tailG.position.set(0, cy - 0.01, -R * len * 0.8)
  tailG.rotation.x = -0.08
  for (let i = 0; i < feathers; i++) {
    const a = feathers === 1 ? 0 : ((i / (feathers - 1)) * 2 - 1) * fan
    const color = opts.tailTip && i % 2 ? opts.tailTip : opts.tail ?? opts.body
    const feather = part(new THREE.BoxGeometry(opts.tailWidth ?? 0.075, 0.014, tailLen), mat(color), [Math.sin(a) * tailLen * 0.5, 0, -Math.cos(a) * tailLen * 0.5])
    feather.rotation.y = -a
    tailG.add(feather)
  }
  group.add(tailG)

  // Feet: tucked up under the tail, or (flamingo) trailing straight out behind.
  for (const x of [-0.05, 0.05]) {
    if (opts.legStyle === 'trail') {
      group.add(pitched(part(new THREE.CylinderGeometry(0.014, 0.014, 0.6, 6), legColor, [x, cy - 0.06, -R * len - 0.18]), Math.PI / 2))
    } else {
      group.add(pitched(part(new THREE.CylinderGeometry(0.014, 0.014, 0.15, 6), legColor, [x, cy - 0.15, -0.14]), Math.PI / 2 - 0.5))
      group.add(part(new THREE.BoxGeometry(0.05, 0.012, 0.06), legColor, [x, cy - 0.17, -0.2]))
    }
  }

  // Wings: an inner section from the shoulder and an outer section from the wrist ending in
  // a fan of primary feathers.
  const span = opts.span ?? 0.5
  const chord = opts.chord ?? 0.26
  const inner = span * 0.55
  const outer = span * 0.45
  const wingMat = mat(opts.wing ?? opts.body)
  const tipMat = mat(opts.wingTip ?? opts.wing ?? opts.body)
  const wings = []
  for (const side of [-1, 1]) {
    const shoulder = new THREE.Group()
    shoulder.position.set(side * R * 0.7, cy + 0.06, 0.06)
    shoulder.rotation.order = 'ZYX' // sweep back first, then flap about the body's own axis
    shoulder.rotation.y = side * (opts.sweep ?? 0.18)
    shoulder.add(part(sphere(1), wingMat, [side * inner * 0.55, 0, 0], [inner * 0.68, 0.02, chord * 0.58]))
    const wrist = new THREE.Group()
    wrist.position.set(side * inner * 0.95, 0, -0.02)
    wrist.add(part(sphere(1), wingMat, [side * outer * 0.42, 0, -0.01], [outer * 0.68, 0.016, chord * 0.46]))
    for (let j = 0; j < 4; j++) {
      const fl = outer * 0.7
      const feather = part(new THREE.BoxGeometry(fl, 0.01, 0.05), tipMat, [side * (outer * 0.62 + fl * 0.45), 0, -0.02 - j * 0.045 + 0.045])
      feather.rotation.y = side * (j - 1) * 0.14
      wrist.add(feather)
    }
    shoulder.add(wrist)
    group.add(shoulder)
    shoulder.rotation.z = side * 0.12
    wings.push({ shoulder, wrist, side })
  }

  group.userData.fly = true
  group.userData.soar = { cruise: opts.cruise ?? 1.2 }
  // userData.effort (0 gliding .. 1 flapping hard) is set each tick by pets.js; without it a
  // moving bird flaps and a still one glides.
  group.userData.animate = (t, moving) => {
    const effort = group.userData.effort ?? (moving ? 0.7 : 0.2)
    const beat = Math.min(1, Math.max(0, Math.sin(t * 1.1) * 1.6)) // glide, then a few strong beats
    const amp = beat * 0.5 * (1 - effort) + 0.7 * effort * effort
    const rate = 9 + effort * 8
    const stroke = Math.sin(t * rate)
    const dihedral = 0.12 + Math.sin(t * 0.7) * 0.03
    for (const { shoulder, wrist, side } of wings) {
      shoulder.rotation.z = side * (dihedral + stroke * amp)
      wrist.rotation.z = side * (-0.12 + Math.sin(t * rate - 0.9) * amp * 0.7)
    }
  }
  return group
}


// ---- Things ---------------------------------------------------------------

function bomb() {
  const group = new THREE.Group()
  group.add(part(sphere(0.31), mat(0x222831, { roughness: 0.35, metalness: 0.3 }), [0, 0.34, 0]))
  group.add(part(new THREE.CylinderGeometry(0.1, 0.12, 0.1, 12), mat(0x4a4f57, { metalness: 0.6 }), [0, 0.66, 0]))
  const fuse = part(new THREE.TorusGeometry(0.12, 0.018, 6, 12, Math.PI * 1.1), mat(0xc9a15b), [0.1, 0.78, 0])
  group.add(fuse)
  const spark = part(sphere(0.06), glow(0xffa640, 2), [0.2, 0.86, 0])
  group.add(spark)
  group.add(part(sphere(0.07), mat(0xffffff, { opacity: 0.35, transparent: true }), [-0.12, 0.46, 0.24]))
  group.userData.fly = false
  group.userData.animate = (t) => {
    spark.scale.setScalar(0.8 + Math.abs(Math.sin(t * 20)) * 0.6)
  }
  return group
}

function rocket() {
  const group = new THREE.Group()
  const hull = mat(0xf2f4f7, { roughness: 0.35 })
  group.add(part(new THREE.CylinderGeometry(0.15, 0.17, 0.55, 14), hull, [0, 0.55, 0]))
  group.add(part(new THREE.ConeGeometry(0.15, 0.28, 14), mat(0xe5484d), [0, 0.96, 0]))
  group.add(part(sphere(0.07), mat(0x6ec6ff, { roughness: 0.1 }), [0, 0.65, 0.14], [1, 1, 0.6]))
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2
    const fin = part(new THREE.BoxGeometry(0.03, 0.22, 0.16), mat(0xe5484d), [Math.sin(a) * 0.19, 0.38, Math.cos(a) * 0.19])
    fin.rotation.y = a
    group.add(fin)
  }
  const flame = part(new THREE.ConeGeometry(0.1, 0.3, 10), glow(0xff9d2e, 1.8), [0, 0.12, 0])
  flame.rotation.x = Math.PI
  group.add(flame)
  group.userData.fly = true
  group.userData.animate = (t) => {
    flame.scale.set(1, 0.8 + Math.abs(Math.sin(t * 25)) * 0.6, 1)
  }
  return group
}

function cactus() {
  const group = new THREE.Group()
  group.add(part(new THREE.CylinderGeometry(0.2, 0.15, 0.22, 12), mat(0xc8683c), [0, 0.11, 0]))
  group.add(part(new THREE.CylinderGeometry(0.21, 0.21, 0.04, 12), mat(0xd9794a), [0, 0.23, 0]))
  const green = mat(0x4fae4a)
  group.add(part(new THREE.CapsuleGeometry(0.15, 0.4, 6, 12), green, [0, 0.58, 0]))
  for (const side of [-1, 1]) {
    group.add(part(new THREE.CapsuleGeometry(0.06, 0.12, 4, 8), green, [side * 0.22, 0.52, 0]))
    group.add(part(new THREE.CapsuleGeometry(0.055, 0.18, 4, 8), green, [side * 0.3, 0.66, 0]))
  }
  group.add(part(sphere(0.07), glow(0xff6fa5, 0.4), [0, 0.92, 0]))
  addEyes(group, { x: 0.065, y: 0.62, z: 0.14, r: 0.04 })
  for (let i = 0; i < 8; i++) {
    const a = i * 2.4
    const spine = part(new THREE.ConeGeometry(0.012, 0.06, 4), mat(0xfff5d6), [Math.sin(a) * 0.15, 0.4 + (i % 4) * 0.1, Math.cos(a) * 0.15])
    spine.rotation.z = -Math.sin(a) * 1.4
    spine.rotation.x = Math.cos(a) * 1.4
    group.add(spine)
  }
  group.userData.fly = false
  group.userData.animate = () => {}
  return group
}

function tnt() {
  const group = new THREE.Group()
  const red = mat(0xd9382e)
  for (const [x, z] of [[-0.1, 0], [0.1, 0], [0, -0.17]]) {
    group.add(part(new THREE.CylinderGeometry(0.095, 0.095, 0.55, 12), red, [x, 0.3, z]))
  }
  group.add(part(new THREE.CylinderGeometry(0.2, 0.2, 0.09, 12), mat(0xefe6cf), [0, 0.32, 0.0], [1.1, 1, 0.9]))
  group.add(part(new THREE.CylinderGeometry(0.012, 0.012, 0.18, 6), mat(0xc9a15b), [0, 0.65, 0]))
  const spark = part(sphere(0.05), glow(0xffd23f, 2), [0, 0.76, 0])
  group.add(spark)
  group.userData.fly = false
  group.userData.animate = (t) => {
    spark.scale.setScalar(0.7 + Math.abs(Math.sin(t * 18)) * 0.7)
  }
  return group
}

function heart() {
  const group = new THREE.Group()
  const shape = new THREE.Shape()
  shape.moveTo(0.25, 0.25)
  shape.bezierCurveTo(0.25, 0.25, 0.2, 0, 0, 0)
  shape.bezierCurveTo(-0.3, 0, -0.3, 0.35, -0.3, 0.35)
  shape.bezierCurveTo(-0.3, 0.55, -0.15, 0.77, 0.25, 0.95)
  shape.bezierCurveTo(0.6, 0.77, 0.8, 0.55, 0.8, 0.35)
  shape.bezierCurveTo(0.8, 0.35, 0.8, 0, 0.5, 0)
  shape.bezierCurveTo(0.35, 0, 0.25, 0.25, 0.25, 0.25)
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.18, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 4 })
  geometry.translate(-0.25, -0.475, -0.09)
  const body = new THREE.Mesh(geometry, mat(0xff4d7d, { roughness: 0.3 }))
  body.scale.setScalar(0.62)
  body.rotation.z = Math.PI // the shape's point is its (0, 0) end; flip it to point down
  body.position.y = 0.6
  group.add(body)
  addEyes(group, { x: 0.08, y: 0.64, z: 0.17, r: 0.045 })
  group.userData.fly = true
  group.userData.animate = (t) => {
    const beat = 1 + Math.max(0, Math.sin(t * 6)) * 0.12
    body.scale.setScalar(0.62 * beat)
  }
  return group
}

function medkit() {
  const group = new THREE.Group()
  group.add(part(new THREE.BoxGeometry(0.56, 0.4, 0.22), mat(0xf4f4f4, { roughness: 0.4 }), [0, 0.28, 0]))
  group.add(part(new THREE.BoxGeometry(0.58, 0.04, 0.24), mat(0xd7dbe0), [0, 0.2, 0]))
  const red = mat(0xe5484d)
  group.add(part(new THREE.BoxGeometry(0.2, 0.06, 0.03), red, [0, 0.3, 0.115]))
  group.add(part(new THREE.BoxGeometry(0.06, 0.2, 0.03), red, [0, 0.3, 0.115]))
  const handle = part(new THREE.TorusGeometry(0.1, 0.022, 6, 14, Math.PI), mat(0x8b9199, { metalness: 0.5 }), [0, 0.48, 0])
  group.add(handle)
  group.add(part(new THREE.BoxGeometry(0.06, 0.04, 0.02), mat(0xb0b6bd), [0.18, 0.28, 0.115]))
  group.userData.fly = false
  group.userData.animate = () => {}
  return group
}

function sprout() {
  const group = new THREE.Group()
  group.add(part(new THREE.CylinderGeometry(0.2, 0.14, 0.24, 12), mat(0xc8683c), [0, 0.12, 0]))
  group.add(part(new THREE.CylinderGeometry(0.21, 0.21, 0.04, 12), mat(0xd9794a), [0, 0.25, 0]))
  group.add(part(new THREE.CylinderGeometry(0.17, 0.17, 0.02, 12), mat(0x4a3322), [0, 0.26, 0]))
  group.add(part(new THREE.CylinderGeometry(0.025, 0.03, 0.36, 6), mat(0x5aa84a), [0, 0.44, 0]))
  const leaves = []
  for (const side of [-1, 1]) {
    const leaf = new THREE.Group()
    leaf.position.set(0, 0.6, 0)
    leaf.add(part(sphere(0.14), mat(0x7ed35a), [side * 0.14, 0.04, 0], [1, 0.3, 0.6]))
    group.add(leaf)
    leaves.push({ leaf, side })
  }
  addEyes(group, { x: 0.065, y: 0.17, z: 0.19, r: 0.04 })
  group.userData.fly = false
  group.userData.animate = (t) => {
    for (const { leaf, side } of leaves) leaf.rotation.z = side * (0.25 + Math.sin(t * 3 + side) * 0.12)
  }
  return group
}

function magnet() {
  const group = new THREE.Group()
  const red = mat(0xe5484d, { roughness: 0.35 })
  const arch = part(new THREE.TorusGeometry(0.22, 0.075, 10, 24, Math.PI), red, [0, 0.5, 0])
  group.add(arch)
  for (const side of [-1, 1]) {
    group.add(part(new THREE.CylinderGeometry(0.075, 0.075, 0.38, 12), red, [side * 0.22, 0.31, 0]))
    group.add(part(new THREE.CylinderGeometry(0.078, 0.078, 0.14, 12), mat(0xd8dde3, { metalness: 0.7, roughness: 0.25 }), [side * 0.22, 0.07, 0]))
  }
  addEyes(group, { x: 0.07, y: 0.4, z: 0.075, r: 0.04 })
  group.userData.fly = true
  group.userData.animate = (t) => {
    group.rotation.z = Math.sin(t * 2) * 0.08
  }
  return group
}

function shield() {
  const group = new THREE.Group()
  const outline = new THREE.Shape()
  outline.moveTo(-0.3, 0.32)
  outline.lineTo(0.3, 0.32)
  outline.lineTo(0.3, -0.05)
  outline.quadraticCurveTo(0.26, -0.32, 0, -0.45)
  outline.quadraticCurveTo(-0.26, -0.32, -0.3, -0.05)
  outline.closePath()
  const geometry = new THREE.ExtrudeGeometry(outline, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 3 })
  geometry.translate(0, 0, -0.03)
  const face = new THREE.Mesh(geometry, mat(0x9aa7b3, { metalness: 0.7, roughness: 0.3 }))
  face.position.y = 0.55
  group.add(face)
  group.add(part(new THREE.BoxGeometry(0.08, 0.55, 0.03), mat(0xe5484d), [0, 0.58, 0.075]))
  group.add(part(new THREE.BoxGeometry(0.4, 0.08, 0.03), mat(0xe5484d), [0, 0.64, 0.075]))
  addEyes(group, { x: 0.09, y: 0.7, z: 0.09, r: 0.04 })
  group.userData.fly = true
  group.userData.animate = (t) => {
    group.rotation.z = Math.sin(t * 1.6) * 0.05
  }
  return group
}

function bee() {
  const group = new THREE.Group()
  const yellow = mat(0xffd23f)
  group.add(part(sphere(0.26), yellow, [0, 0.5, -0.05], [0.9, 0.85, 1.2]))
  for (const z of [-0.12, -0.02, 0.08]) {
    const stripe = part(new THREE.TorusGeometry(0.2 - Math.abs(z + 0.02) * 0.15, 0.04, 6, 18), mat(0x2b2b2b), [0, 0.5, z])
    stripe.rotation.y = Math.PI / 2
    group.add(stripe)
  }
  group.add(part(sphere(0.17), mat(0x2b2b2b), [0, 0.54, 0.26]))
  addEyes(group, { x: 0.08, y: 0.58, z: 0.37, r: 0.05 })
  for (const side of [-1, 1]) {
    const feeler = part(new THREE.CylinderGeometry(0.01, 0.01, 0.16, 5), mat(0x2b2b2b), [side * 0.06, 0.74, 0.3])
    feeler.rotation.z = side * -0.4
    group.add(feeler)
  }
  const sting = part(new THREE.ConeGeometry(0.04, 0.12, 6), mat(0x2b2b2b), [0, 0.47, -0.38])
  sting.rotation.x = -Math.PI / 2
  group.add(sting)
  const wings = []
  for (const side of [-1, 1]) {
    const wing = new THREE.Group()
    wing.position.set(side * 0.1, 0.72, -0.04)
    wing.add(part(sphere(0.17), mat(0xffffff, { transparent: true, opacity: 0.6 }), [side * 0.12, 0.02, 0], [1, 0.1, 0.55]))
    group.add(wing)
    wings.push({ wing, side })
  }
  group.userData.fly = true
  group.userData.animate = (t) => {
    for (const { wing, side } of wings) wing.rotation.z = side * Math.sin(t * 50) * 0.5
  }
  return group
}

function goldfish() {
  const group = new THREE.Group()
  const orange = mat(0xff9a2e, { roughness: 0.35 })
  group.add(part(sphere(0.28), orange, [0, 0.5, 0.02], [0.7, 0.9, 1.25]))
  addEyes(group, { x: 0.13, y: 0.58, z: 0.26, r: 0.06 })
  const tail = new THREE.Group()
  tail.position.set(0, 0.5, -0.28)
  const fin = part(new THREE.ConeGeometry(0.2, 0.3, 3), mat(0xffb454, { transparent: true, opacity: 0.85 }), [0, 0, -0.12], [0.2, 1, 1])
  fin.rotation.x = -Math.PI / 2
  tail.add(fin)
  group.add(tail)
  const dorsal = part(new THREE.ConeGeometry(0.1, 0.22, 3), mat(0xffb454, { transparent: true, opacity: 0.85 }), [0, 0.78, -0.02], [0.2, 1, 1.4])
  group.add(dorsal)
  for (const side of [-1, 1]) {
    const flipper = part(sphere(0.09), mat(0xffb454), [side * 0.2, 0.42, 0.06], [0.2, 0.7, 1.3])
    flipper.rotation.z = side * -0.5
    group.add(flipper)
  }
  group.add(part(sphere(0.03), mat(0xd9602a), [0, 0.46, 0.37]))
  group.userData.fly = true
  group.userData.animate = (t, moving) => {
    tail.rotation.y = Math.sin(t * (moving ? 16 : 8)) * 0.5
  }
  return group
}

// ---- Matthias: a stylized, low-poly kid with a lightsaber ----------------

// The "VACAY FOREVER" shirt badge (palms, a lime sun over a striped sea),
// drawn on a canvas so the shirt has its print. Falls back to no texture
// where there's no DOM (the unit tests).
let badgeTexture = null
function shirtBadgeTexture() {
  if (typeof document === 'undefined') return null
  if (badgeTexture) return badgeTexture
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#f3f0e8'
  ctx.fillRect(0, 0, size, size)
  const cx = size / 2
  const cy = size * 0.58
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, 78, 0, Math.PI * 2)
  ctx.clip()
  const sky = ctx.createLinearGradient(0, cy - 78, 0, cy)
  sky.addColorStop(0, '#9be37a')
  sky.addColorStop(1, '#e8f7e0')
  ctx.fillStyle = sky
  ctx.fillRect(0, cy - 78, size, 80)
  ctx.fillStyle = '#c8f23a'
  ctx.beginPath()
  ctx.arc(cx, cy + 4, 30, Math.PI, 0)
  ctx.fill()
  const sea = ['#19a58f', '#27c4a8', '#1b7f6c', '#2b4a45']
  sea.forEach((color, i) => {
    ctx.fillStyle = color
    ctx.fillRect(0, cy + 4 + i * 18, size, 18)
  })
  ctx.fillStyle = '#2b4a45'
  for (const side of [-1, 1]) {
    ctx.fillRect(cx + side * 54 - 4, cy - 40, 8, 60)
    for (let i = 0; i < 5; i++) {
      const a = side * (0.3 + i * 0.5)
      ctx.beginPath()
      ctx.ellipse(cx + side * 54 + Math.sin(a) * 18, cy - 44 + Math.cos(a) * 3 + i * 2, 20, 5, a * 0.6, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()
  ctx.strokeStyle = '#2b4a45'
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.arc(cx, cy, 80, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = '#2b3a3a'
  ctx.font = 'bold 26px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('VACAY', cx - 2, 34)
  ctx.fillText('FOREVER', cx, 62)
  badgeTexture = new THREE.CanvasTexture(canvas)
  badgeTexture.colorSpace = THREE.SRGBColorSpace
  return badgeTexture
}

// A lightsaber: a silver hilt and a glowing blade (an emissive core plus a
// wider, additive halo), pointing along +Y from the origin. pets.js reuses
// it for the ones Matthias throws.
export function createSaber(color = 0x58ff6a, bladeLength = 0.5) {
  const saber = new THREE.Group()
  saber.add(part(new THREE.CylinderGeometry(0.022, 0.026, 0.16, 8), mat(0xc9ced6, { metalness: 0.8, roughness: 0.25 }), [0, 0.08, 0]))
  saber.add(part(new THREE.CylinderGeometry(0.03, 0.03, 0.025, 8), mat(0x3a3f47), [0, 0.15, 0]))
  saber.add(part(new THREE.CylinderGeometry(0.016, 0.016, bladeLength, 8), glow(0xffffff, 1.6), [0, 0.16 + bladeLength / 2, 0]))
  const halo = part(
    new THREE.CylinderGeometry(0.035, 0.035, bladeLength + 0.04, 10),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }),
    [0, 0.16 + bladeLength / 2, 0],
  )
  saber.add(halo)
  return saber
}

function matthias() {
  const group = new THREE.Group()
  const skin = mat(0xe3ac8c)
  const shirt = mat(0xf3f0e8, { roughness: 0.9 })
  const shorts = mat(0x1f4d45, { roughness: 0.9 })
  const hairMat = mat(0x4a3020, { roughness: 0.95 })

  for (const side of [-1, 1]) {
    group.add(part(new THREE.CylinderGeometry(0.05, 0.045, 0.2, 8), skin, [side * 0.075, 0.1, 0]))
    group.add(part(new THREE.CylinderGeometry(0.078, 0.085, 0.2, 10), shorts, [side * 0.075, 0.28, 0]))
    group.add(part(new THREE.BoxGeometry(0.085, 0.04, 0.14), mat(0xf5f5f5), [side * 0.075, 0.02, 0.025]))
  }
  group.add(part(new THREE.BoxGeometry(0.31, 0.12, 0.2), shorts, [0, 0.39, 0]))

  group.add(part(new THREE.BoxGeometry(0.34, 0.34, 0.2), shirt, [0, 0.62, 0]))
  const badgeMap = shirtBadgeTexture()
  const badge = part(new THREE.CircleGeometry(0.13, 24), badgeMap ? new THREE.MeshStandardMaterial({ map: badgeMap, roughness: 0.9 }) : mat(0x6ecb7a), [0, 0.62, 0.102])
  group.add(badge)

  // Left arm hangs; the right arm is raised, gripping a lightsaber.
  group.add(part(new THREE.CylinderGeometry(0.06, 0.065, 0.12, 10), shirt, [-0.22, 0.72, 0]))
  group.add(part(new THREE.CylinderGeometry(0.042, 0.04, 0.24, 8), skin, [-0.22, 0.54, 0]))
  group.add(part(sphere(0.045), skin, [-0.22, 0.4, 0.01]))
  const arm = new THREE.Group()
  arm.position.set(0.2, 0.72, 0)
  arm.add(part(new THREE.CylinderGeometry(0.06, 0.065, 0.12, 10), shirt, [0.02, -0.02, 0]))
  const forearm = part(new THREE.CylinderGeometry(0.042, 0.04, 0.24, 8), skin, [0.05, -0.15, 0.05])
  forearm.rotation.x = -0.5
  arm.add(forearm)
  const hand = part(sphere(0.047), skin, [0.06, -0.24, 0.12])
  arm.add(hand)
  const saber = createSaber(0x58ff6a, 0.5)
  saber.position.set(0.06, -0.27, 0.13)
  saber.rotation.x = 0.2
  arm.add(saber)
  group.add(arm)

  group.add(part(new THREE.CylinderGeometry(0.05, 0.055, 0.06, 8), skin, [0, 0.82, 0]))
  const head = new THREE.Group()
  head.position.set(0, 0.97, 0)
  head.add(part(sphere(0.19), skin, [0, 0, 0], [0.95, 1.05, 0.95]))
  for (const side of [-1, 1]) head.add(part(sphere(0.04), skin, [side * 0.18, -0.01, 0]))

  // Messy brown hair: a cap with a fringe and a few sticking-up tufts.
  head.add(part(new THREE.SphereGeometry(0.205, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat, [0, 0.03, -0.015], [1, 1, 1.02]))
  for (const [x, y, z, r] of [[-0.12, 0.1, 0.13, 0.07], [-0.04, 0.12, 0.15, 0.07], [0.05, 0.12, 0.15, 0.07], [0.13, 0.09, 0.12, 0.065]]) {
    head.add(part(sphere(r), hairMat, [x, y, z], [1, 0.8, 0.8]))
  }
  for (const [x, z, tilt] of [[-0.1, -0.05, -0.5], [0.08, -0.08, 0.4], [0.0, -0.12, 0.1]]) {
    const tuft = part(new THREE.ConeGeometry(0.05, 0.12, 5), hairMat, [x, 0.22, z])
    tuft.rotation.z = tilt
    head.add(tuft)
  }

  // A sideways squint and a lopsided smirk.
  for (const side of [-1, 1]) {
    head.add(part(sphere(0.04), mat(0xffffff), [side * 0.07, -0.01, 0.165], [1, 0.55, 0.6]))
    head.add(part(sphere(0.022), mat(0x2a1a10), [side * 0.07 + 0.016, -0.01, 0.182], [1, 0.8, 0.6]))
  }
  const browL = part(new THREE.BoxGeometry(0.09, 0.02, 0.02), hairMat, [-0.075, 0.055, 0.17])
  browL.rotation.z = -0.35
  const browR = part(new THREE.BoxGeometry(0.09, 0.02, 0.02), hairMat, [0.075, 0.07, 0.17])
  browR.rotation.z = -0.15
  head.add(browL, browR)
  head.add(part(sphere(0.022), mat(0xd49478), [0, -0.05, 0.185]))
  const smirk = part(new THREE.TorusGeometry(0.05, 0.011, 6, 12, Math.PI * 0.8), mat(0x8a3a3a), [-0.01, -0.08, 0.17])
  smirk.rotation.z = Math.PI * 1.1
  head.add(smirk)
  group.add(head)

  group.userData.fly = false
  group.userData.animate = (t, moving) => {
    head.rotation.z = Math.sin(t * 1.8) * 0.06
    head.rotation.y = Math.sin(t * 1.1) * 0.12
    arm.rotation.z = -0.25 + Math.sin(t * (moving ? 10 : 3)) * 0.12
  }
  return group
}


// ---- Benji and Remy: stylized, low-poly kids ------------------------------

// One kid, built from primitives: head with hair, a top (optionally with a
// chest pocket), trousers and shoes or socks, arms by their sides. Cartoon
// proportions in the same style as Matthias.
function kid({ skinColor, hairColor, hair, top, topColor, pocketColor, pants, shoes, grin = true }) {
  const group = new THREE.Group()
  const skin = mat(skinColor)
  const topMat = mat(topColor, { roughness: 0.95 })
  const pantsMat = mat(pants, { roughness: 0.9 })
  const hairMat = mat(hairColor, { roughness: 0.95 })

  for (const side of [-1, 1]) {
    group.add(part(new THREE.CylinderGeometry(0.06, 0.055, 0.34, 8), pantsMat, [side * 0.075, 0.22, 0]))
    group.add(part(new THREE.BoxGeometry(0.09, 0.045, 0.15), mat(shoes), [side * 0.075, 0.025, 0.03]))
  }
  group.add(part(new THREE.BoxGeometry(0.31, 0.1, 0.19), pantsMat, [0, 0.4, 0]))
  group.add(part(new THREE.BoxGeometry(0.34, 0.34, 0.2), topMat, [0, 0.62, 0]))
  if (top === 'fleece') {
    // Zip line and a dark chest pocket.
    group.add(part(new THREE.BoxGeometry(0.02, 0.32, 0.01), mat(0x16303a), [0, 0.62, 0.103]))
    group.add(part(new THREE.BoxGeometry(0.1, 0.12, 0.012), mat(pocketColor), [0.08, 0.66, 0.104]))
    group.add(part(new THREE.CylinderGeometry(0.075, 0.08, 0.06, 10), topMat, [0, 0.8, 0])) // stand collar
  }
  const arms = []
  for (const side of [-1, 1]) {
    const arm = new THREE.Group()
    arm.position.set(side * 0.225, 0.76, 0)
    arm.add(part(new THREE.CylinderGeometry(0.055, 0.05, 0.3, 8), topMat, [0, -0.15, 0]))
    arm.add(part(sphere(0.047), skin, [0, -0.32, 0.01]))
    group.add(arm)
    arms.push(arm)
  }
  group.add(part(new THREE.CylinderGeometry(0.05, 0.055, 0.06, 8), skin, [0, 0.82, 0]))

  const head = new THREE.Group()
  head.position.set(0, 0.97, 0)
  head.add(part(sphere(0.19), skin, [0, 0, 0], [0.95, 1.05, 0.95]))
  for (const side of [-1, 1]) head.add(part(sphere(0.04), skin, [side * 0.18, -0.01, 0]))
  // Hair: 'messy' = a dark mop with a fringe; 'sandy' = a longer, swept blond fringe.
  head.add(part(new THREE.SphereGeometry(0.205, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat, [0, 0.03, -0.015], [1, 1, 1.02]))
  if (hair === 'sandy') {
    for (const [x, y, z, r] of [[-0.13, 0.08, 0.12, 0.075], [-0.05, 0.1, 0.15, 0.075], [0.04, 0.11, 0.15, 0.075], [0.12, 0.08, 0.13, 0.07]]) {
      head.add(part(sphere(r), hairMat, [x, y, z], [1, 0.75, 0.8]))
    }
    for (const side of [-1, 1]) head.add(part(sphere(0.06), hairMat, [side * 0.17, 0.02, -0.02], [0.7, 1.1, 1]))
  } else {
    for (const [x, y, z, r] of [[-0.1, 0.1, 0.13, 0.065], [0, 0.12, 0.15, 0.065], [0.1, 0.1, 0.13, 0.065]]) {
      head.add(part(sphere(r), hairMat, [x, y, z], [1, 0.85, 0.8]))
    }
    const tuft = part(new THREE.ConeGeometry(0.05, 0.1, 5), hairMat, [0.02, 0.22, -0.04])
    tuft.rotation.z = 0.35
    head.add(tuft)
  }
  for (const side of [-1, 1]) {
    head.add(part(sphere(0.04), mat(0xffffff), [side * 0.07, -0.01, 0.165], [1, 0.8, 0.6]))
    head.add(part(sphere(0.022), mat(0x2a1a10), [side * 0.07, -0.01, 0.183], [1, 1, 0.6]))
  }
  head.add(part(sphere(0.022), mat(0xd49478), [0, -0.05, 0.185]))
  // A closed-mouth grin.
  const smile = part(new THREE.TorusGeometry(0.055, 0.011, 6, 12, Math.PI * 0.8), mat(0x8a3a3a), [0, -0.075, 0.17])
  smile.rotation.z = Math.PI * 1.1
  head.add(smile)
  group.add(head)

  group.userData.fly = false
  group.userData.animate = (t, moving) => {
    head.rotation.z = Math.sin(t * 1.8) * 0.06
    head.rotation.y = Math.sin(t * 1.1) * 0.12
    arms[0].rotation.z = 0.1 + Math.sin(t * (moving ? 10 : 2.5)) * 0.1
    arms[1].rotation.z = -0.1 - Math.sin(t * (moving ? 10 : 2.5)) * 0.1
  }
  return group
}

// Benji: dark tousled hair, a navy sweater, jeans.
const benji = () => kid({ skinColor: 0xe0aa86, hairColor: 0x2e2018, hair: 'messy', top: 'sweater', topColor: 0x2c3548, pants: 0x4a6a96, shoes: 0x3a3a3a })
// Remy: sandy-blond hair, a teal fleece with a dark chest pocket, grey jeans, teal socks.
const remy = () => kid({ skinColor: 0xeab494, hairColor: 0xb88a4e, hair: 'sandy', top: 'fleece', topColor: 0x1f7f95, pocketColor: 0x3b4048, pants: 0x6b7480, shoes: 0x1f6f80 })

// Remy (left) and Benji (right) as one pet, standing side by side.
function duo() {
  const group = new THREE.Group()
  const a = remy()
  const b = benji()
  for (const [kidModel, x] of [[a, -0.24], [b, 0.24]]) {
    kidModel.scale.setScalar(0.85)
    kidModel.position.x = x
    group.add(kidModel)
  }
  group.userData.fly = false
  group.userData.animate = (t, moving) => {
    a.userData.animate(t, moving)
    b.userData.animate(t + 0.9, moving)
  }
  return group
}

// One kid on their own, at the duo's size (for when the pair splits up, see pets.js). The
// kid sits in a fresh root because pets.js owns the root's scale (it grows the pet in).
function solo(build) {
  const kidModel = build()
  kidModel.scale.setScalar(0.85)
  const root = new THREE.Group()
  root.add(kidModel)
  root.userData = kidModel.userData
  root.userData.fly = false
  return root
}

// What the pair throws: a pile-of-junk item (tin can, old boot or cardboard box) or a banana.
export function createThrown(kind, variant = 0) {
  const item = new THREE.Group()
  if (kind === 'banana') {
    const peel = mat(0xffd84a, { roughness: 0.6 })
    item.add(part(new THREE.TorusGeometry(0.17, 0.05, 8, 16, Math.PI * 0.8), peel, [0, 0, 0]))
    item.add(part(sphere(0.035), mat(0x5a4326), [0.17, 0, 0]))
    item.add(part(sphere(0.035), mat(0x5a4326), [-0.17 * Math.cos(Math.PI * 0.8), 0.17 * Math.sin(Math.PI * 0.8), 0]))
    return item
  }
  const pick = variant % 3
  if (pick === 0) {
    item.add(part(new THREE.CylinderGeometry(0.1, 0.1, 0.2, 12), mat(0xb8bec6, { metalness: 0.7, roughness: 0.4 }), [0, 0, 0]))
    item.add(part(new THREE.CylinderGeometry(0.102, 0.102, 0.05, 12), mat(0xc83c3c), [0, 0.02, 0]))
  } else if (pick === 1) {
    item.add(part(new THREE.BoxGeometry(0.12, 0.2, 0.1), mat(0x6b4a2e, { roughness: 0.95 }), [0, 0.04, 0]))
    item.add(part(new THREE.BoxGeometry(0.28, 0.1, 0.1), mat(0x5a3d25, { roughness: 0.95 }), [0.08, -0.08, 0]))
  } else {
    item.add(part(new THREE.BoxGeometry(0.24, 0.2, 0.2), mat(0xc9a06a, { roughness: 0.95 }), [0, 0, 0]))
    item.add(part(new THREE.BoxGeometry(0.25, 0.03, 0.06), mat(0xe8d8b0), [0, 0.1, 0]))
  }
  return item
}

const BUILDERS = {
  ...ANIMAL_BUILDERS, // the ground walkers: realistic four-legged animals, the penguin and the tortoise
  matthias,
  remybenji: () => duo(),
  remy: () => solo(remy),
  benji: () => solo(benji),
  chick: () => bird({ body: 0xffd84a, belly: 0xffeb8a, beak: 0xff9a2e, wing: 0xffd84a, wingTip: 0xf0b02c, tail: 0xffd84a, crest: 0xffd84a, legs: 0xff9a2e, span: 0.3, chord: 0.2, bodyR: 0.23, bodyLen: 1.35, headR: 0.15, tailLen: 0.2, tailFeathers: 3, cruise: 1.0 }),
  owl: () => bird({ body: 0x8a6a4a, belly: 0xe0cfb0, eye: 'owl', disc: 0xf3e6c8, tufts: true, beak: 0xe0a030, wing: 0x6e5238, wingTip: 0x4f3b28, tail: 0x6e5238, legs: 0xe0a030, span: 0.62, chord: 0.36, bodyR: 0.21, bodyLen: 1.6, headR: 0.17, tailLen: 0.26, tailFeathers: 4, tailFan: 0.25, tailWidth: 0.09, cruise: 1.5 }),
  magpie: () => bird({ body: 0x23262d, belly: 0xffffff, beak: 0x1b1b1b, wing: 0x3b4a7a, wingTip: 0xf2f2f2, tail: 0x3b4a7a, tailTip: 0x2f7a6a, legs: 0x1b1b1b, span: 0.48, chord: 0.24, tailLen: 0.62, tailFeathers: 3, tailFan: 0.08, tailWidth: 0.07 }),
  parrot: () => bird({ body: 0xe0302e, belly: 0xff7a5a, beak: 0xffd23f, beakKind: 'hook', wing: 0x2e86de, wingTip: 0xffd23f, tail: 0x2e86de, tailTip: 0xe0302e, legs: 0x8a8a8a, span: 0.5, chord: 0.26, tailLen: 0.6, tailFeathers: 3, tailFan: 0.1, tailWidth: 0.07 }),
  duck: () => bird({ body: 0xffffff, belly: 0xf3f3f3, beak: 0xff9a2e, beakKind: 'flat', wing: 0xf3f3f3, wingTip: 0x5f93d6, tail: 0xffffff, legs: 0xff9a2e, span: 0.5, chord: 0.22, bodyR: 0.2, bodyLen: 1.9, headR: 0.12, neck: 0.07, tailLen: 0.22, tailFan: 0.3 }),
  flamingo: () => bird({ body: 0xff7fa8, belly: 0xffa0c0, beak: 0x2b2b2b, wing: 0xff5f90, wingTip: 0x2b2b2b, tail: 0xff7fa8, legs: 0xff7fa8, legStyle: 'trail', neck: 0.34, span: 0.62, chord: 0.2, bodyR: 0.17, bodyLen: 1.7, headR: 0.095, tailLen: 0.18, tailFeathers: 3, tailFan: 0.15, cruise: 1.4 }),
  toucan: () => bird({ body: 0x1b1b1b, belly: 0xffffff, beak: 0xff8a00, beakKind: 'big', beakTip: 0x1b1b1b, wing: 0x2b2b2b, wingTip: 0x1b1b1b, tail: 0x1b1b1b, tailTip: 0xe03a2e, legs: 0x4a6aa8, span: 0.46, chord: 0.26, headR: 0.14, tailLen: 0.38 }),
  bomb,
  rocket,
  cactus,
  tnt,
  heart,
  medkit,
  sprout,
  magnet,
  shield,
  bee,
  goldfish,
}

// Builds the model for pet `def` (by def.model), with shadows on.
export function createPetModel(def) {
  const model = (BUILDERS[def.model] ?? BUILDERS.chick)()
  model.traverse((child) => {
    if (child.isMesh) child.castShadow = true
  })
  return model
}

export const PET_MODELS = Object.keys(BUILDERS)
