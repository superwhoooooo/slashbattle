// The Realist style's creature bodies. On top of a monster's textured jelly body this
// grows the parts that make it a creature, picked by its body shape: spider-like
// crawlers get six jointed legs, boxy and tubular walkers get stumpy feet and clawed
// arms, and floaters (pointy shapes, winged / haloed / flaming ones) get flapping fins.
// Every creature also gets a tail, a row of bone spikes down its back, angry brows
// and a toothed maw. Each part group is baked into ONE merged mesh (vertex-coloured, one
// shared material) so a wave of them stays cheap; `update` swings legs, arms, tail and
// fins from how fast the monster is moving.
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { bodySurfaceDistance, faceLayout } from './logic/faceLayout.js'
import { createShardMaterial } from './shardStyle.js'

const BONE = 0xe7dcc2
const INK = 0x15101c
const UP = new THREE.Vector3(0, 1, 0)
const FORWARD = new THREE.Vector3(0, 0, 1)

let partMaterial = null
const getPartMaterial = () => (partMaterial ??= createShardMaterial(0xffffff, { rim: 0.4, vertexColors: true }))

const shade = (hex, k) => new THREE.Color(hex).multiplyScalar(k)

// Collects shapes (each with a matrix and a colour) and bakes them into one geometry.
function createKit() {
  const items = []
  const q = new THREE.Quaternion()
  const m = new THREE.Matrix4()
  const kit = {
    add(geometry, color, position, quaternion, scale) {
      m.compose(new THREE.Vector3(...position), quaternion ?? q.identity(), new THREE.Vector3(...(scale ?? [1, 1, 1])))
      items.push({ geometry, color: new THREE.Color(color), matrix: m.clone() })
      return kit
    },
    ball(position, scale, color) {
      return kit.add(SPHERE, color, position, null, typeof scale === 'number' ? [scale, scale, scale] : scale)
    },
    // A tapering rod from a to b (r1 at a, r2 at b).
    limb(a, b, r1, r2, color) {
      const A = new THREE.Vector3(...a)
      const B = new THREE.Vector3(...b)
      const d = B.clone().sub(A)
      const rotation = new THREE.Quaternion().setFromUnitVectors(UP, d.clone().normalize())
      return kit.add(rod(r1 > 0 ? r2 / r1 : 1), color, A.add(B).multiplyScalar(0.5).toArray(), rotation, [r1, d.length(), r1])
    },
    // A cone standing on `position`, pointing along `dir`.
    spike(position, dir, radius, length, color) {
      const d = new THREE.Vector3(...dir).normalize()
      const rotation = new THREE.Quaternion().setFromUnitVectors(UP, d)
      const base = new THREE.Vector3(...position).addScaledVector(d, length * 0.5)
      return kit.add(CONE, color, base.toArray(), rotation, [radius, length, radius])
    },
    build() {
      if (items.length === 0) return null
      const parts = items.map(({ geometry, color, matrix }) => {
        const g = geometry.index ? geometry.toNonIndexed() : geometry.clone()
        g.applyMatrix4(matrix)
        const colors = new Float32Array(g.attributes.position.count * 3)
        for (let i = 0; i < g.attributes.position.count; i++) colors.set([color.r, color.g, color.b], i * 3)
        g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
        return g
      })
      const merged = mergeGeometries(parts, false)
      parts.forEach((g) => g.dispose())
      return merged
    },
  }
  return kit
}

const SPHERE = new THREE.SphereGeometry(1, 8, 6)
const CONE = new THREE.ConeGeometry(1, 1, 6)
const BOX = new THREE.BoxGeometry(1, 1, 1)
const rods = new Map()
// A cylinder of unit length whose far end is `taper` times as wide as the near end.
function rod(taper) {
  const key = Math.round(taper * 100)
  if (!rods.has(key)) rods.set(key, new THREE.CylinderGeometry(taper, 1, 1, 6))
  return rods.get(key)
}

function bakedMesh(kit) {
  const geometry = kit.build()
  if (!geometry) return null
  const mesh = new THREE.Mesh(geometry, getPartMaterial())
  mesh.castShadow = false
  return mesh
}

// Which kind of creature a monster is, from its body and add-ons. null: it already has a
// body of its own (the hopper's limbs, the eel's long body), so only the face parts are added.
export function creatureKind(stats) {
  if (stats.accessory === 'limbs' || stats.accessory === 'eelBody') return null
  if (['wings', 'halo', 'flame', 'icicles', 'rings', 'lure'].includes(stats.accessory)) return 'floater'
  if (['octahedron', 'tetrahedron', 'cone'].includes(stats.shape)) return 'floater'
  if (stats.shape === 'box' || stats.shape === 'cylinder') return 'walker'
  return 'crawler'
}

// Builds a creature's parts and hangs them on `group`. `face` is createFace3D's result, so the
// brows ride the eyes and the maw rides the jelly. Returns { update(dt, speed) }.
export function addCreatureParts(group, { stats, face, bodyCenterY: C }) {
  const R = stats.size / 2
  const boss = !!stats.boss
  const kind = creatureKind(stats)
  const skin = shade(stats.color, 0.62)
  const dark = shade(stats.color, 0.42)
  const animated = [] // { object, kind, phase, ... } swung by update()

  // ---- legs / feet / arms / fins -----------------------------------------------------------
  if (kind === 'crawler') {
    const zs = [0.5, 0, -0.5]
    for (const side of [-1, 1]) {
      zs.forEach((zf, i) => {
        const z = zf * R
        const kit = createKit()
        // Hip at the pivot (the group's origin), knee out and up, foot planted wide on the floor.
        const hip = [0, 0, 0]
        const knee = [side * R * 0.55, R * 0.45, z * 0.15]
        const foot = [side * R * 0.9, -(C - R * 0.2) + 0.03, z * 0.3]
        kit.limb(hip, knee, R * 0.11, R * 0.085, skin)
        kit.limb(knee, foot, R * 0.085, R * 0.04, dark)
        kit.ball(knee, R * 0.1, skin)
        kit.spike(foot, [0, -1, 0], R * 0.05, R * 0.1, shade(BONE, 0.8))
        const mesh = bakedMesh(kit)
        const pivot = new THREE.Group()
        pivot.position.set(side * R * 0.68, C - R * 0.2, z)
        pivot.add(mesh)
        group.add(pivot)
        animated.push({ object: pivot, kind: 'leg', phase: (i + (side > 0 ? 1 : 0)) * Math.PI, baseY: pivot.position.y })
      })
    }
  } else if (kind === 'walker') {
    for (const side of [-1, 1]) {
      const foot = createKit()
      foot.ball([0, 0, 0], [R * 0.28, R * 0.13, R * 0.4], dark)
      for (const tx of [-0.1, 0, 0.1]) foot.spike([tx * R * 2, 0, R * 0.34], [0, 0.2, 1], R * 0.045, R * 0.16, BONE)
      const pivot = new THREE.Group()
      pivot.position.set(side * R * 0.42, R * 0.13, R * 0.92) // peeking out of the front of the body
      pivot.add(bakedMesh(foot))
      group.add(pivot)
      animated.push({ object: pivot, kind: 'foot', phase: side > 0 ? 0 : Math.PI, baseY: pivot.position.y, baseZ: pivot.position.z })

      const arm = createKit()
      const elbow = [side * R * 0.32, -R * 0.38, R * 0.12]
      const hand = [side * R * 0.28, -R * 0.78, R * 0.34]
      arm.limb([0, 0, 0], elbow, R * 0.14, R * 0.11, skin)
      arm.limb(elbow, hand, R * 0.11, R * 0.09, dark)
      arm.ball(elbow, R * 0.12, skin)
      arm.ball(hand, R * 0.15, dark)
      for (const dx of [-1, 0, 1]) arm.spike([hand[0] + dx * R * 0.08, hand[1] - R * 0.05, hand[2]], [dx * 0.25, -0.7, 0.7], R * 0.04, R * 0.22, BONE)
      const shoulder = new THREE.Group()
      shoulder.position.set(side * R * 1.0, C + R * 0.3, R * 0.05)
      shoulder.add(bakedMesh(arm))
      group.add(shoulder)
      animated.push({ object: shoulder, kind: 'arm', phase: side > 0 ? Math.PI : 0 })
    }
  } else if (kind === 'floater') {
    for (const side of [-1, 1]) {
      const fin = createKit()
      fin.ball([side * R * 0.5, 0, -R * 0.1], [R * 0.6, R * 0.05, R * 0.34], shade(stats.color, 0.8))
      fin.limb([0, 0, 0], [side * R * 0.95, R * 0.04, -R * 0.1], R * 0.05, R * 0.025, dark)
      fin.limb([0, 0, 0], [side * R * 0.85, R * 0.02, R * 0.22], R * 0.04, R * 0.02, dark)
      const pivot = new THREE.Group()
      pivot.position.set(side * R * 0.5, C + R * 0.05, -R * 0.05)
      pivot.add(bakedMesh(fin))
      group.add(pivot)
      animated.push({ object: pivot, kind: 'fin', phase: 0, side })
    }
  }

  // ---- tail --------------------------------------------------------------------------------
  if (kind) {
    const tail = createKit()
    const pts = [
      [0, 0, 0],
      [0, R * 0.12, -R * 0.6],
      [0, R * 0.38, -R * 1.1],
      [0, R * 0.7, -R * 1.45],
    ]
    for (let i = 0; i < pts.length - 1; i++) tail.limb(pts[i], pts[i + 1], R * (0.17 - i * 0.045), R * (0.17 - (i + 1) * 0.045), skin)
    tail.spike(pts[3], [0, 0.5, -1], R * 0.07, R * 0.3, BONE)
    const pivot = new THREE.Group()
    pivot.position.set(0, C - R * 0.35, -R * 0.82)
    pivot.add(bakedMesh(tail))
    group.add(pivot)
    animated.push({ object: pivot, kind: 'tail', phase: 0 })
  }

  // ---- a row of bone spikes down the back (more and bigger on bosses) -----------------------
  const spikes = createKit()
  const count = boss ? 8 : 4
  for (let i = 0; i < count; i++) {
    const a = 0.25 + (i / (count - 1)) * 1.05
    const dir = new THREE.Vector3(0, Math.cos(a), -Math.sin(a))
    const d = bodySurfaceDistance(stats.shape, stats.size, dir.x, dir.y, dir.z)
    const len = R * (boss ? 0.5 : 0.3) * (1 - i * 0.04)
    spikes.spike([0, C + dir.y * d * 0.95, dir.z * d * 0.95], [0, dir.y + 0.5, dir.z * 0.8 - 0.1], R * (boss ? 0.09 : 0.06), len, boss ? BONE : shade(BONE, 0.9))
    if (boss) {
      for (const side of [-1, 1]) spikes.spike([side * R * 0.38, C + dir.y * d * 0.8, dir.z * d * 0.8], [side * 0.7, dir.y + 0.4, dir.z * 0.6], R * 0.06, len * 0.7, shade(BONE, 0.85))
    }
  }
  group.add(bakedMesh(spikes))

  // ---- brows (riding the eyes) and a toothed maw (riding the jelly) -------------------------
  const layout = faceLayout(stats.shape, stats.size, C)
  const browKit = createKit()
  browKit.add(BOX, dark, [0, 0, 0], null, [2.5, 0.55, 1.0])
  for (const [eye, anchor, side] of [[layout.leftEye, face.features[0].anchorGroup, -1], [layout.rightEye, face.features[1].anchorGroup, 1]]) {
    const brow = bakedMesh(browKit)
    brow.position.set(eye.dir.x * 0.5, 1.2 + eye.dir.y * 0.5, eye.dir.z * 0.5)
    brow.rotation.z = -side * 0.4 // slanting down toward the middle: angry
    anchor.add(brow)
  }

  const mouthAt = layout.mouth
  const maw = createKit()
  const w = R * 0.72
  maw.add(BOX, INK, [0, 0, 0], null, [w, R * 0.12, R * 0.08])
  const teeth = boss ? 7 : 5
  for (let i = 0; i < teeth; i++) {
    const x = (i / (teeth - 1) - 0.5) * w * 0.9
    maw.spike([x, R * 0.05, R * 0.02], [0, -1, 0.1], R * 0.045, R * (i % 2 ? 0.1 : 0.16), BONE)
  }
  const mawMesh = bakedMesh(maw)
  const mawAnchor = new THREE.Group()
  mawAnchor.position.set(mouthAt.x, mouthAt.y, mouthAt.z)
  mawAnchor.quaternion.setFromUnitVectors(FORWARD, mouthAt.dir)
  mawAnchor.add(mawMesh)
  group.add(mawAnchor)
  // Registered with the face so it rides the jelly's wobble like the eyes do.
  face.features.push({
    anchorGroup: mawAnchor,
    rest: { x: mouthAt.x, y: mouthAt.y, z: mouthAt.z },
    rel: { x: mouthAt.x, y: mouthAt.y - C, z: mouthAt.z },
  })

  // ---- animation ---------------------------------------------------------------------------
  let clock = 0
  let amount = 0 // how much it is walking, eased 0..1
  return {
    update(dt, speed, time) {
      const moving = Math.min(1, speed / 2.5)
      amount += (moving - amount) * (1 - Math.exp(-8 * dt))
      clock += dt * (3 + speed * 2.4)
      for (const part of animated) {
        const o = part.object
        const wave = Math.sin(clock + part.phase)
        if (part.kind === 'leg') {
          o.rotation.x = wave * 0.5 * amount
          o.position.y = part.baseY + Math.max(0, Math.cos(clock + part.phase)) * R * 0.14 * amount
        } else if (part.kind === 'foot') {
          o.position.z = part.baseZ + wave * R * 0.16 * amount
          o.position.y = part.baseY + Math.max(0, Math.cos(clock + part.phase)) * R * 0.14 * amount
        } else if (part.kind === 'arm') {
          o.rotation.x = wave * 0.7 * amount + Math.sin(time * 1.6 + part.phase) * 0.05
        } else if (part.kind === 'tail') {
          o.rotation.y = Math.sin(time * 2.2) * 0.35 + wave * 0.25 * amount
        } else if (part.kind === 'fin') {
          o.rotation.z = part.side * (0.25 + Math.sin(time * (5 + speed * 2)) * 0.45)
        }
      }
    },
  }
}
