// The dragon pets' 3D model: a horned, fanged, spined dragon with a long neck and tail, tucked
// legs, a glowing chest gem and big membrane wings, all coloured by a SCALES entry
// (logic/dragons.js) so the same build comes out crimson, azure, amethyst, obsidian...
// `createDragonModel(def)` returns a Group facing +Z whose userData matches the other pet models
// (`fly`, `soar`, `animate(elapsed, moving)`); pets.js sets `userData.effort` (wing-beat
// strength) and `userData.breathe` (1 when it just breathed: jaw opens, mouth flares).
import * as THREE from 'three'
import { DEFAULT_SCALE, SCALES } from './logic/dragons.js'

const CRUISE = 3.6 // how high a dragon flies over the ground
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

function materials(scale) {
  const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.2, ...extra })
  return {
    body: std(scale.body, { roughness: 0.38, metalness: 0.3 }),
    belly: std(scale.belly, { roughness: 0.55, metalness: 0.05 }),
    horn: std(scale.horn, { roughness: 0.3, metalness: 0.1 }),
    dark: std(new THREE.Color(scale.body).multiplyScalar(0.55), { roughness: 0.5 }),
    wing: new THREE.MeshStandardMaterial({ color: scale.wing, roughness: 0.6, metalness: 0, side: THREE.DoubleSide, emissive: new THREE.Color(scale.glow), emissiveIntensity: 0.22, transparent: true, opacity: 0.93 }),
    glow: new THREE.MeshStandardMaterial({ color: scale.glow, emissive: new THREE.Color(scale.glow), emissiveIntensity: 2.2, roughness: 0.3 }),
    mote: new THREE.MeshBasicMaterial({ color: scale.glow, transparent: true, opacity: 0.85 }),
    pupil: new THREE.MeshBasicMaterial({ color: 0x07070b }),
    tooth: std(0xfff6e6, { roughness: 0.25 }),
  }
}

const sph = (r, w = 14, h = 10) => new THREE.SphereGeometry(r, w, h)
function put(mesh, [x, y, z], scale) {
  mesh.position.set(x, y, z)
  if (scale) mesh.scale.set(...scale)
  return mesh
}
function cone(r, h, m, pos, rot = [0, 0, 0], seg = 8) {
  const mesh = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), m)
  mesh.position.set(...pos)
  mesh.rotation.set(...rot)
  return mesh
}

// A cylinder bone from point a to point b.
function bone(a, b, r, m) {
  const va = new THREE.Vector3(...a)
  const vb = new THREE.Vector3(...b)
  const length = va.distanceTo(vb)
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.7, r, length, 7), m)
  mesh.position.copy(va).add(vb).multiplyScalar(0.5)
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.sub(va).normalize())
  return mesh
}

// A curving horn: nested segments, each bent a little more than the last, ending in a point.
function horn(m, { length = 0.5, radius = 0.05, segments = 4, bend = -0.3, twist = 0 }) {
  const root = new THREE.Group()
  let parent = root
  const segLength = length / segments
  for (let i = 0; i < segments; i++) {
    const r0 = radius * (1 - i / segments)
    const r1 = radius * (1 - (i + 1) / segments) + 0.004
    const piece = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, segLength * 1.05, 7), m)
    piece.position.y = segLength / 2
    const joint = new THREE.Group()
    joint.position.y = segLength
    joint.rotation.set(bend, twist, 0)
    parent.add(piece, joint)
    parent = joint
  }
  return root
}

// A wing (extends along +X from the shoulder; the left one is mirrored). Every point is in shoulder
// space: an arm out to an elbow and wrist, finger bones fanning back from the wrist, and a scalloped
// membrane stretched between the fingertips, the body and the arm. The whole wing flaps from the
// shoulder; `tip` (a group holding the outer half's bones) just trails a little for a softer beat.
function buildWing(m, { span, fingers, glowM }) {
  const wing = new THREE.Group()
  const S = span
  const shoulder = [0, 0, 0]
  const elbow = [0.55 * S, 0.34, -0.12]
  const wrist = [1.1 * S, 0.2, 0.08]
  const attach = [0.1, -0.3, -0.95] // where the trailing edge meets the flank
  // Fingertips sweep from out-and-forward round to back-and-inward, each a little shorter.
  const tips = []
  for (let i = 0; i < fingers; i++) {
    const t = fingers === 1 ? 0 : i / (fingers - 1)
    const angle = 0.25 - t * 2.1
    const reach = (1.0 - t * 0.38) * S * 1.05
    tips.push([wrist[0] + Math.cos(angle) * reach, wrist[1] - 0.08 - t * 0.3, wrist[2] + Math.sin(angle) * reach])
  }
  const notch = (a, b) => {
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]
    return [mid[0] + (wrist[0] - mid[0]) * 0.3, mid[1] + (wrist[1] - mid[1]) * 0.3, mid[2] + (wrist[2] - mid[2]) * 0.3]
  }
  const verts = []
  const tri = (a, b, c) => verts.push(...a, ...b, ...c)
  for (let i = 0; i + 1 < tips.length; i++) {
    const n = notch(tips[i], tips[i + 1])
    tri(wrist, tips[i], n)
    tri(wrist, n, tips[i + 1])
  }
  const last = tips[tips.length - 1]
  tri(wrist, last, attach)
  tri(wrist, attach, elbow)
  tri(elbow, attach, shoulder)
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
  geometry.computeVertexNormals()
  const membrane = new THREE.Mesh(geometry, m.wing)
  wing.add(membrane)
  // Arm, wrist knuckle and claw, then the fingers, each with a claw and a glowing vein to the next notch.
  wing.add(bone(shoulder, elbow, 0.07, m.dark))
  wing.add(bone(elbow, wrist, 0.052, m.dark))
  wing.add(put(new THREE.Mesh(sph(0.08), m.horn), wrist))
  wing.add(cone(0.04, 0.26, m.horn, [wrist[0] + 0.05, wrist[1] + 0.08, wrist[2] + 0.18], [Math.PI / 2 - 0.3, 0, 0], 6))
  tips.forEach((tip, i) => {
    wing.add(bone(wrist, tip, 0.032, m.horn))
    const claw = cone(0.03, 0.15, m.horn, tip, [0, 0, 0], 5)
    claw.lookAt(new THREE.Vector3(...tip).multiplyScalar(2).sub(new THREE.Vector3(...wrist)))
    claw.rotateX(Math.PI / 2)
    wing.add(claw)
    if (i + 1 < tips.length) wing.add(bone(wrist, notch(tip, tips[i + 1]), 0.014, glowM))
  })
  wing.add(bone(elbow, attach, 0.014, glowM)) // a vein across the inner membrane
  return { wing }
}

// Head: skull, snout, hinged jaw, teeth, eyes, brow, nostrils and horns.
function buildHead(m, def) {
  const head = new THREE.Group()
  head.add(put(new THREE.Mesh(sph(0.2), m.body), [0, 0, 0], [0.9, 0.78, 1.0]))
  head.add(put(new THREE.Mesh(sph(0.15), m.body), [0, -0.03, 0.2], [0.8, 0.62, 1.55])) // snout
  head.add(put(new THREE.Mesh(sph(0.07), m.dark), [0, 0.07, 0.43], [1.2, 0.7, 1.0])) // nose bridge bump
  for (const side of [-1, 1]) {
    head.add(put(new THREE.Mesh(sph(0.032, 8, 6), m.glow), [side * 0.045, 0.045, 0.5])) // glowing nostrils
    // Eyes: glowing, with a slit pupil and an angry brow slab.
    const eye = new THREE.Group()
    eye.position.set(side * 0.145, 0.075, 0.1)
    eye.add(new THREE.Mesh(sph(0.058, 12, 8), m.glow))
    eye.add(put(new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.07, 0.03), m.pupil), [side * 0.012, 0, 0.045]))
    head.add(eye)
    const brow = put(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.035, 0.1), m.dark), [side * 0.13, 0.145, 0.1])
    brow.rotation.set(0, side * -0.25, side * -0.4)
    head.add(brow)
    // Cheek spikes sweeping back.
    head.add(cone(0.035, 0.2, m.horn, [side * 0.2, -0.04, -0.06], [-Math.PI / 2 - 0.15, 0, side * -0.8], 6))
  }
  // Upper fangs along the snout.
  for (let i = 0; i < 4; i++) {
    for (const side of [-1, 1]) head.add(cone(0.013, i === 0 ? 0.11 : 0.07, m.tooth, [side * 0.075, -0.115, 0.14 + i * 0.1], [Math.PI, 0, 0], 5))
  }
  // Jaw: pivots at the back of the mouth.
  const jaw = new THREE.Group()
  jaw.position.set(0, -0.1, 0.02)
  jaw.add(put(new THREE.Mesh(sph(0.12), m.dark), [0, -0.02, 0.2], [0.75, 0.42, 1.6]))
  jaw.add(put(new THREE.Mesh(sph(0.075, 10, 8), m.glow), [0, 0.025, 0.2], [0.9, 0.28, 1.5])) // the fire inside
  for (let i = 0; i < 3; i++) {
    for (const side of [-1, 1]) jaw.add(cone(0.012, 0.06, m.tooth, [side * 0.06, 0.04, 0.2 + i * 0.1], [0, 0, 0], 5))
  }
  head.add(jaw)
  // Horns by style.
  const style = def.horns ?? 'swept'
  const addHorn = (opts, side, base, tilt) => {
    const h = horn(m.horn, opts)
    h.position.set(side * base[0], base[1], base[2])
    h.rotation.set(tilt[0], 0, side * tilt[1])
    head.add(h)
  }
  if (style === 'swept') {
    for (const side of [-1, 1]) addHorn({ length: 0.62, radius: 0.055, segments: 5, bend: -0.22 }, side, [0.09, 0.12, -0.06], [-1.15, -0.4])
    for (const side of [-1, 1]) addHorn({ length: 0.22, radius: 0.03, segments: 3, bend: -0.3 }, side, [0.17, 0.02, -0.02], [-1.25, -1.0])
  } else if (style === 'crown') {
    for (let i = 0; i < 5; i++) {
      const spread = (i - 2) * 0.42
      const h = horn(m.horn, { length: 0.3 + (2 - Math.abs(i - 2)) * 0.08, radius: 0.04, segments: 3, bend: -0.12 })
      h.position.set(Math.sin(spread) * 0.17, 0.13 - Math.abs(i - 2) * 0.02, -0.04)
      h.rotation.set(-0.5, 0, -spread * 1.1)
      head.add(h)
    }
  } else {
    // antler: two main beams with tines
    for (const side of [-1, 1]) {
      addHorn({ length: 0.55, radius: 0.05, segments: 4, bend: -0.2 }, side, [0.1, 0.12, -0.04], [-0.55, -0.45])
      addHorn({ length: 0.3, radius: 0.032, segments: 3, bend: -0.25 }, side, [0.2, 0.3, -0.12], [-0.6, -0.9])
      addHorn({ length: 0.24, radius: 0.028, segments: 3, bend: -0.25 }, side, [0.28, 0.42, -0.2], [-0.4, -1.1])
    }
  }
  return { head, jaw }
}

export function createDragonModel(def = {}) {
  const scale = def.scale ?? SCALES[DEFAULT_SCALE]
  const m = materials(scale)
  const root = new THREE.Group()
  const rig = new THREE.Group() // everything, scaled by size
  rig.scale.setScalar(0.8 * (def.size ?? 1))
  root.add(rig)

  // Torso, belly plates and chest gem.
  const torso = new THREE.Group()
  rig.add(torso)
  torso.add(put(new THREE.Mesh(sph(0.34, 18, 14), m.body), [0, 0, 0], [0.82, 0.78, 1.5]))
  torso.add(put(new THREE.Mesh(sph(0.3, 16, 10), m.belly), [0, -0.12, 0.04], [0.72, 0.6, 1.4]))
  for (let i = 0; i < 6; i++) torso.add(put(new THREE.Mesh(new THREE.TorusGeometry(0.2 - Math.abs(i - 2.5) * 0.015, 0.012, 5, 14, Math.PI), m.dark), [0, -0.24 + Math.abs(i - 2.5) * 0.01, -0.36 + i * 0.15], [1, 1, 1]).rotateZ(Math.PI)) // belly ribs
  const gem = put(new THREE.Mesh(new THREE.OctahedronGeometry(0.075), m.glow), [0, 0.0, 0.52], [1, 1.35, 0.8])
  torso.add(gem)
  // Dorsal spines from the neck to the tail.
  const spines = []
  for (let i = 0; i < 9; i++) {
    const s = cone(0.05 - i * 0.002, 0.2 - Math.abs(i - 3) * 0.015, m.horn, [0, 0.27 - i * 0.012, 0.38 - i * 0.11], [-0.35, 0, 0], 6)
    torso.add(s)
    spines.push(s)
  }
  // Glowing runes down the flanks.
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) torso.add(put(new THREE.Mesh(sph(0.026, 8, 6), m.glow), [side * 0.26, 0.04 - i * 0.015, 0.24 - i * 0.22]))
  }

  // Neck: a chain of spheres rising forward to the head.
  const neck = []
  const neckGroup = new THREE.Group()
  neckGroup.position.set(0, 0.12, 0.42)
  torso.add(neckGroup)
  const neckSegs = 5
  for (let i = 0; i < neckSegs; i++) {
    const t = i / (neckSegs - 1)
    const seg = new THREE.Group()
    seg.add(put(new THREE.Mesh(sph(0.2 - t * 0.065, 14, 10), m.body), [0, 0, 0]))
    seg.add(put(new THREE.Mesh(sph(0.15 - t * 0.05, 12, 8), m.belly), [0, -0.07, 0.06])) // throat plates
    seg.add(cone(0.04, 0.15, m.horn, [0, 0.17 - t * 0.05, -0.04], [-0.4, 0, 0], 5)) // neck spine
    seg.position.set(0, 0.07 + t * 0.15, 0.13 + t * 0.09)
    neckGroup.add(seg)
    neck.push({ seg, t })
  }
  const { head, jaw } = buildHead(m, def)
  head.position.set(0, 0.52, 0.5)
  head.rotation.x = 0.28
  neckGroup.add(head)
  // Fix the neck's resting positions as a smooth S-curve (animate adds sway on top).
  neck.forEach(({ seg, t }) => {
    seg.userData.rest = seg.position.clone()
    seg.userData.t = t
  })

  // Tail: tapering segments with spikes, ending in a glowing blade.
  const tail = []
  let tailParent = new THREE.Group()
  tailParent.position.set(0, 0.0, -0.48)
  torso.add(tailParent)
  const tailSegs = 8
  for (let i = 0; i < tailSegs; i++) {
    const t = i / tailSegs
    const segLength = 0.26
    const seg = new THREE.Group()
    seg.add(put(new THREE.Mesh(sph(0.2 * (1 - t) + 0.045, 12, 8), m.body), [0, 0, -segLength * 0.5], [0.85, 0.85, 1.35]))
    seg.add(cone(0.045 * (1 - t) + 0.015, 0.16 * (1 - t) + 0.05, m.horn, [0, 0.17 * (1 - t) + 0.03, -segLength * 0.45], [-0.3, 0, 0], 5))
    const next = new THREE.Group()
    next.position.z = -segLength
    seg.add(next)
    tailParent.add(seg)
    tail.push(seg)
    tailParent = next
  }
  // The tail blade: a flat glowing diamond.
  const blade = put(new THREE.Mesh(new THREE.OctahedronGeometry(0.17), m.glow), [0, 0, -0.14], [0.22, 0.7, 1.5])
  tailParent.add(blade)
  tailParent.add(cone(0.05, 0.24, m.horn, [0, 0, -0.34], [-Math.PI / 2, 0, 0], 5))

  // Legs, tucked up under the body in flight.
  for (const side of [-1, 1]) {
    const hind = new THREE.Group()
    hind.position.set(side * 0.24, -0.18, -0.26)
    hind.add(put(new THREE.Mesh(sph(0.15), m.body), [0, 0, 0], [0.8, 1.1, 1.2]))
    hind.add(bone([0, -0.06, 0], [0, -0.26, -0.22], 0.055, m.dark))
    hind.add(bone([0, -0.26, -0.22], [0, -0.34, 0.05], 0.04, m.dark))
    for (let c = -1; c <= 1; c++) hind.add(cone(0.016, 0.1, m.tooth, [c * 0.035, -0.4, 0.12], [-Math.PI / 2 - 0.5, 0, 0], 5))
    torso.add(hind)
    const fore = new THREE.Group()
    fore.position.set(side * 0.2, -0.2, 0.3)
    fore.add(bone([0, 0, 0], [0, -0.12, 0.14], 0.045, m.dark))
    fore.add(bone([0, -0.12, 0.14], [0, -0.2, 0.3], 0.035, m.dark))
    for (let c = -1; c <= 1; c++) fore.add(cone(0.014, 0.09, m.tooth, [c * 0.03, -0.24, 0.36], [-Math.PI / 2 - 0.4, 0, 0], 5))
    torso.add(fore)
  }

  // Wings.
  const spanByStyle = { bat: 1.0, frill: 0.8, grand: 1.28 }
  const fingerByStyle = { bat: 4, frill: 5, grand: 5 }
  const style = def.wings ?? 'bat'
  const wings = []
  for (const side of [-1, 1]) {
    const w = buildWing(m, { span: spanByStyle[style] ?? 1, fingers: fingerByStyle[style] ?? 4, glowM: m.glow })
    w.wing.position.set(side * 0.22, 0.24, 0.12)
    w.wing.scale.x = side
    torso.add(w.wing)
    wings.push({ ...w, side })
  }

  // Mystic motes drifting around the dragon in its glow colour.
  const motes = []
  for (let i = 0; i < 7; i++) {
    const mote = new THREE.Mesh(new THREE.TetrahedronGeometry(0.045 + (i % 3) * 0.015), m.mote)
    root.add(mote)
    motes.push({ mesh: mote, phase: (i / 7) * Math.PI * 2, radius: 0.9 + (i % 3) * 0.28, height: -0.2 + (i % 4) * 0.25, speed: 0.6 + (i % 3) * 0.25 })
  }

  root.userData.fly = true
  root.userData.soar = { cruise: CRUISE }
  root.userData.effort = 0.3
  root.userData.breathe = 0
  let last = 0
  root.userData.animate = (t) => {
    const dt = clamp(t - last, 0, 0.1)
    last = t
    const ud = root.userData
    ud.breathe = Math.max(0, ud.breathe - dt * 2.4)
    const effort = clamp(ud.effort, 0, 1)
    const beat = t * (4.2 + effort * 6)
    const lift = 0.18 + effort * 0.12
    // The left wing is mirrored with a negative x scale, but rotations apply in the body's frame, so
    // its z and y turns are flipped (`side`) to beat in step with the right. A beat is a strong
    // downstroke and a slower, folded-up recovery.
    const stroke = Math.sin(beat) + 0.28 * Math.sin(2 * beat + 0.6)
    wings.forEach(({ wing, side }) => {
      wing.rotation.z = side * (stroke * (0.55 + effort * 0.25) + lift)
      wing.rotation.y = side * (-0.12 + Math.sin(beat - 0.9) * 0.14)
      wing.rotation.x = Math.sin(beat - 1.3) * 0.12
    })
    rig.position.y = -Math.sin(beat) * 0.05 // the body dips on the upstroke
    // The neck sways; the whole neck rears back when breathing.
    const rear = ud.breathe
    neck.forEach(({ seg, t: nt }) => {
      seg.position.x = seg.userData.rest.x + Math.sin(t * 1.7 - nt * 2) * 0.03 * nt
      seg.position.y = seg.userData.rest.y + Math.sin(t * 2.1 - nt * 1.4) * 0.02 * nt + rear * 0.06 * nt
      seg.position.z = seg.userData.rest.z - rear * 0.07 * nt
    })
    head.rotation.x = 0.28 - rear * 0.5
    head.rotation.y = Math.sin(t * 0.9) * 0.12
    jaw.rotation.x = 0.1 + rear * 0.55 + Math.max(0, Math.sin(t * 2.3)) * 0.05
    m.glow.emissiveIntensity = 2.0 + Math.sin(t * 3) * 0.35 + rear * 3.5
    gem.rotation.y = t * 1.6
    gem.scale.setScalar(1 + rear * 0.5 + Math.sin(t * 4) * 0.06)
    // The tail whips in a travelling wave.
    tail.forEach((seg, i) => {
      seg.rotation.y = Math.sin(t * 2.4 - i * 0.55) * (0.14 + i * 0.02)
      seg.rotation.x = Math.sin(t * 1.8 - i * 0.45) * 0.07 - 0.03
    })
    spines.forEach((s, i) => {
      s.rotation.x = -0.35 + Math.sin(t * 3 - i * 0.5) * 0.05
    })
    motes.forEach((o) => {
      const a = t * o.speed + o.phase
      o.mesh.position.set(Math.cos(a) * o.radius, o.height + Math.sin(t * 1.5 + o.phase) * 0.12, Math.sin(a) * o.radius)
      o.mesh.rotation.set(a * 2, a * 1.3, 0)
    })
  }
  root.userData.claws = false
  return root
}
