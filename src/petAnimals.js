import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

// The pets that walk on the ground, built to look like the real animal instead of a
// round toy: a proper four-legged build (`quadruped`: chest, hips, neck, a real muzzle,
// small glossy eyes, jointed legs ending in paws or hooves, a jointed tail) with each
// species' own markings (stripes, mane, mask, horns...), plus a penguin and a tortoise.
// Same contract as petModels.js: faces +Z, stands on y = 0, userData.fly = false and
// userData.animate(t, moving) walks the legs (a trot, or a hop for the rabbit), sways
// the tail, breathes and looks about. userData.claws marks a pet whose melee hits show
// as claw scratches (main.js's scratch overlay). userData.gait tells pets.js how much to
// bob the whole model: 'walk' barely, 'hop' a real bounce.

const matCache = new Map()
function fur(color, extra = {}) {
  const key = `${color}:${JSON.stringify(extra)}`
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...extra }))
  return matCache.get(key)
}
const gloss = (color) => fur(color, { roughness: 0.25 })

function mesh(geometry, material, [x, y, z] = [0, 0, 0], [sx, sy, sz] = [1, 1, 1], [rx, ry, rz] = [0, 0, 0]) {
  const m = new THREE.Mesh(geometry, material)
  m.position.set(x, y, z)
  m.scale.set(sx, sy, sz)
  m.rotation.set(rx, ry, rz)
  return m
}
const sph = (r, w = 14, h = 10) => new THREE.SphereGeometry(r, w, h)
const capY = (r, len) => new THREE.CapsuleGeometry(r, len, 4, 10)
const capZ = (r, len) => capY(r, len).rotateX(Math.PI / 2)
const cone = (r, h, seg = 10) => new THREE.ConeGeometry(r, h, seg)
const tube = (points, r, seg = 28) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))), seg, r, 7, false)

// Collapses each group's plain (non-group) mesh children into one mesh per material, so a
// detailed animal costs a few draw calls per moving part instead of one per primitive.
// Groups (the animated joints) are kept and merged inside the same way.
function mergeRigid(group) {
  const buckets = new Map()
  for (const child of group.children) {
    if (!child.isMesh) continue
    if (!buckets.has(child.material)) buckets.set(child.material, [])
    buckets.get(child.material).push(child)
  }
  for (const [material, meshes] of buckets) {
    if (meshes.length < 2) continue
    const geometries = meshes.map((m) => {
      m.updateMatrix()
      const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone()
      for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name)
      g.applyMatrix4(m.matrix)
      return g
    })
    const merged = mergeGeometries(geometries, false)
    geometries.forEach((g) => g.dispose())
    if (!merged) continue
    for (const m of meshes) {
      group.remove(m)
      m.geometry.dispose()
    }
    group.add(new THREE.Mesh(merged, material))
  }
  for (const child of group.children) if (!child.isMesh) mergeRigid(child)
}

// A small, glossy, realistic eye: a dark iris-coloured ball and a pinprick of light.
function eye(parent, x, y, z, r, iris = 0x2a1a0e) {
  parent.add(mesh(sph(r, 12, 8), gloss(iris), [x, y, z]))
  parent.add(mesh(sph(r * 0.28, 6, 4), fur(0xffffff, { roughness: 0.1 }), [x + Math.sign(x) * r * 0.15, y + r * 0.4, z + r * 0.75]))
}

// ---- The four-legged build --------------------------------------------------------------
//
// spec: coat, under (chest/belly), legs, paws, muzzle (colour), nose, eye (iris colour),
//   bodyR, bodyLen, chest, hip (radius scales), legLen, legR, neckLen, neckR, neckTilt,
//   headR, headW, headPitch, muzzleLen, muzzleR, muzzleW, noseR, eyeR,
//   ear: { kind: 'point'|'round'|'long'|'floppy'|'fluffy', size, inner, back },
//   tail: { kind: 'bushy'|'thin'|'ringed'|'tuft'|'puff'|'stub'|'curl'|'flowing'|'none',
//           len, r, lift, curl, tip, ring, colors },
//   feet: 'paw'|'hoof', hoof (colour), gait: 'walk'|'hop', cadence, size,
//   extras(parts) - species markings, given the built parts and dimensions.
function quadruped(spec) {
  const root = new THREE.Group()
  const g = new THREE.Group() // everything, so `size` scales the animal (pets.js owns root's scale)
  g.scale.setScalar(spec.size ?? 1)
  root.add(g)

  const coat = fur(spec.coat)
  const under = fur(spec.under ?? spec.coat)
  const R = spec.bodyR ?? 0.15
  const L = spec.bodyLen ?? 0.34
  const chestR = R * (spec.chest ?? 1.08)
  const hipR = R * (spec.hip ?? 1)
  const legLen = spec.legLen ?? 0.24
  const torsoY = legLen + R * 0.6

  // Torso: chest and hips joined by a barrel, with the paler underside.
  const torso = new THREE.Group()
  torso.position.y = torsoY
  g.add(torso)
  torso.add(mesh(sph(chestR), coat, [0, 0.01, L / 2], [0.9, 1, 1.05]))
  torso.add(mesh(sph(hipR), coat, [0, 0, -L / 2], [0.92, 0.98, 1.05]))
  torso.add(mesh(capZ(Math.min(chestR, hipR) * 0.94, L), coat, [0, 0, 0], [0.93, 1, 1]))
  torso.add(mesh(sph(R * 0.8), under, [0, -R * 0.36, L * 0.22], [0.82, 0.68, 1.5]))

  // Neck, then the head held level at its top.
  const tilt = spec.neckTilt ?? 0.8
  const neckLen = spec.neckLen ?? 0.1
  const neckR = spec.neckR ?? R * 0.62
  const neck = new THREE.Group()
  neck.position.set(0, R * 0.35, L / 2 + chestR * 0.35)
  neck.rotation.x = tilt
  torso.add(neck)
  neck.add(mesh(capY(neckR, neckLen), coat, [0, neckLen / 2, 0]))
  const head = new THREE.Group()
  head.position.y = neckLen + neckR * 0.35
  head.rotation.x = -tilt + (spec.headPitch ?? 0)
  neck.add(head)

  const H = spec.headR ?? 0.11
  head.add(mesh(sph(H), coat, [0, 0, 0], [spec.headW ?? 1, 0.92, 1.05]))
  const ml = spec.muzzleLen ?? 0.08
  const mr = spec.muzzleR ?? H * 0.48
  const muzzleMat = fur(spec.muzzle ?? spec.coat)
  head.add(mesh(capZ(mr, ml), muzzleMat, [0, -H * 0.3, H * 0.55 + ml / 2], [spec.muzzleW ?? 1, 0.85, 1]))
  const noseZ = H * 0.55 + ml + mr * 0.85
  if (spec.nose !== null) head.add(mesh(sph(spec.noseR ?? mr * 0.42), gloss(spec.nose ?? 0x1b1414), [0, -H * 0.3 + mr * 0.35, noseZ], [1.2, 0.8, 0.75]))
  const eyeR = spec.eyeR ?? H * 0.15
  for (const side of [-1, 1]) eye(head, side * H * (spec.eyeX ?? 0.5), H * 0.2, H * 0.74, eyeR, spec.eye)

  // Ears, each on its own pivot so they can flick.
  const ears = []
  const ear = spec.ear ?? { kind: 'point' }
  const es = ear.size ?? 1
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group()
    const outer = fur(ear.back ?? spec.coat)
    const inner = fur(ear.inner ?? 0x3a2a24)
    if (ear.kind === 'round') {
      pivot.position.set(side * H * 0.6, H * 0.72, -H * 0.1)
      pivot.add(mesh(sph(H * 0.32 * es), outer, [0, 0, 0], [1, 1, 0.45]))
      pivot.add(mesh(sph(H * 0.2 * es), inner, [0, -H * 0.02, H * 0.06], [1, 1, 0.3]))
    } else if (ear.kind === 'fluffy') {
      pivot.position.set(side * H * 0.85, H * 0.5, -H * 0.05)
      pivot.add(mesh(sph(H * 0.48 * es), outer, [0, 0, 0], [1, 1, 0.5]))
      pivot.add(mesh(sph(H * 0.34 * es), inner, [0, 0, H * 0.1], [1, 1, 0.35]))
    } else if (ear.kind === 'long') {
      pivot.position.set(side * H * 0.32, H * 0.75, -H * 0.15)
      pivot.rotation.set(-0.25, 0, side * -0.12)
      pivot.add(mesh(capY(H * 0.3 * es, H * 1.4 * es), outer, [0, H * 0.85 * es, 0], [1, 1, 0.55]))
      pivot.add(mesh(capY(H * 0.19 * es, H * 1.2 * es), inner, [0, H * 0.85 * es, H * 0.07], [1, 1, 0.25]))
    } else if (ear.kind === 'floppy') {
      pivot.position.set(side * H * 0.72, H * 0.45, 0)
      pivot.rotation.set(0.3, 0, side * 0.9)
      pivot.add(mesh(sph(H * 0.36 * es), outer, [0, H * 0.25 * es, 0], [0.9, 1.15, 0.35]))
    } else {
      // Pointed: a flat triangle with a paler inside, leaning out a little.
      pivot.position.set(side * H * 0.5, H * 0.7, -H * 0.12)
      pivot.rotation.set(-0.1, 0, side * -0.32)
      pivot.add(mesh(cone(H * 0.36 * es, H * 0.85 * es, 4), outer, [0, H * 0.4 * es, 0], [1, 1, 0.42], [0, Math.PI / 4, 0]))
      pivot.add(mesh(cone(H * 0.22 * es, H * 0.6 * es, 4), inner, [0, H * 0.34 * es, H * 0.06], [1, 1, 0.3], [0, Math.PI / 4, 0]))
    }
    head.add(pivot)
    ears.push({ pivot, side, base: pivot.rotation.z })
  }

  // Legs: shoulder/hip pivot, upper leg (with a shoulder or haunch), knee, lower leg, foot.
  const legR = spec.legR ?? R * 0.28
  const pivotY = legLen + R * 0.15
  const legMat = fur(spec.legs ?? spec.coat)
  const footMat = spec.feet === 'hoof' ? fur(spec.hoof ?? 0x2b2622, { roughness: 0.5 }) : fur(spec.paws ?? spec.legs ?? spec.coat)
  const footH = spec.feet === 'hoof' ? legR * 1.3 : legR * 0.9
  const hop = spec.gait === 'hop'
  const legs = []
  for (const front of [true, false]) {
    for (const side of [-1, 1]) {
      const pivot = new THREE.Group()
      pivot.position.set(side * R * 0.55, pivotY, front ? L / 2 + chestR * 0.1 : -L / 2 - hipR * 0.05)
      g.add(pivot)
      const up = pivotY * 0.5
      const lo = pivotY - up - footH * 0.5
      const thick = front ? 1 : spec.hindThick ?? 1.2
      if (front) pivot.add(mesh(sph(chestR * 0.45), coat, [0, R * 0.05, 0], [0.75, 1.2, 1]))
      else pivot.add(mesh(sph(hipR * (hop ? 0.75 : 0.58)), coat, [0, 0, 0], [0.75, 1.1, 1.15]))
      pivot.add(mesh(capY(legR * thick, up), front ? legMat : coat, [0, -up / 2, 0]))
      const knee = new THREE.Group()
      knee.position.y = -up
      pivot.add(knee)
      knee.add(mesh(capY(legR * 0.8, lo), legMat, [0, -lo / 2, 0]))
      if (spec.feet === 'hoof') knee.add(mesh(new THREE.CylinderGeometry(legR * 0.85, legR * 1.05, footH, 10), footMat, [0, -lo - footH * 0.1, 0]))
      else knee.add(mesh(sph(legR * 1.1), footMat, [0, -lo, legR * 0.35], [1, 0.62, 1.4]))
      // Trot: diagonal pairs move together. Hop: front pair, then hind pair.
      const phase = hop ? (front ? 0 : Math.PI * 0.6) : (((front ? 0 : 1) + (side > 0 ? 1 : 0)) % 2) * Math.PI
      legs.push({ pivot, knee, phase, front })
    }
  }

  // Tail: a chain of segments hung off the rump, each bending a little more (curl).
  const tailSpec = spec.tail ?? { kind: 'thin' }
  const tailSegs = []
  const tailBase = new THREE.Group()
  tailBase.position.set(0, torsoY + hipR * 0.35, -L / 2 - hipR * 0.82)
  tailBase.rotation.x = tailSpec.lift ?? 0.3
  g.add(tailBase)
  const kind = tailSpec.kind
  if (kind === 'puff') {
    tailBase.add(mesh(sph(R * 0.38), fur(tailSpec.tip ?? 0xffffff), [0, 0, -R * 0.1]))
  } else if (kind === 'stub') {
    tailBase.add(mesh(sph(R * 0.2), coat, [0, 0, -R * 0.05], [1, 1, 1.3]))
  } else if (kind === 'curl') {
    // A corkscrew (pig, pug): a little helix rising off the rump.
    const pts = []
    for (let i = 0; i <= 20; i++) {
      const a = (i / 20) * Math.PI * 3.2
      const rr = R * 0.22 * (1 - i / 34)
      pts.push([Math.cos(a) * rr - rr, (i / 20) * R * 0.5, -Math.sin(a) * rr - (i / 20) * R * 0.15])
    }
    tailBase.rotation.x = 0
    tailBase.add(mesh(tube(pts, R * 0.07), fur(tailSpec.tip ?? spec.coat)))
  } else if (kind !== 'none') {
    const segs = tailSpec.segments ?? (kind === 'ringed' ? 6 : 5)
    const len = tailSpec.len ?? 0.36
    const segLen = len / segs
    const baseR = tailSpec.r ?? (kind === 'bushy' || kind === 'flowing' ? R * 0.42 : R * 0.13)
    let parent = tailBase
    for (let i = 0; i < segs; i++) {
      const seg = new THREE.Group()
      if (i > 0) seg.position.z = -segLen * 0.92
      seg.rotation.x = tailSpec.curl ?? 0
      parent.add(seg)
      const t = i / segs
      let r = baseR * (1 - t * 0.55)
      if (kind === 'bushy') r = baseR * (0.7 + Math.sin(Math.PI * Math.min(1, t + 0.25)) * 0.4)
      if (kind === 'flowing') r = baseR * (0.75 + t * 0.35)
      let m = coat
      if (kind === 'ringed') m = i % 2 ? fur(tailSpec.ring ?? 0x222222) : coat
      if (tailSpec.colors) m = fur(tailSpec.colors[i % tailSpec.colors.length])
      if (tailSpec.tip && i === segs - 1) m = fur(tailSpec.tip)
      seg.add(mesh(capZ(r, segLen * 0.75), m, [0, 0, -segLen / 2], kind === 'flowing' ? [0.7, 1.2, 1] : [1, 1, 1]))
      tailSegs.push(seg)
      parent = seg
    }
    if (kind === 'tuft') parent.add(mesh(sph(R * 0.2), fur(tailSpec.tip ?? 0x5a3418), [0, 0, -segLen * 1.05], [1, 1, 1.4]))
  }

  const parts = { root, g, torso, neck, head, tailBase, tailSegs, legs, ears, R, L, H, chestR, hipR, legLen, torsoY, neckLen, neckR, mr, ml, coat, under }
  spec.extras?.(parts)
  mergeRigid(g)

  const cadence = spec.cadence ?? (hop ? 9 : 11)
  const amp = spec.stride ?? (hop ? 0.75 : 0.55)
  const ease = (from, to) => from + (to - from) * 0.3
  root.userData.fly = false
  root.userData.gait = hop ? 'hop' : 'walk'
  root.userData.claws = true
  root.userData.animate = (t, moving) => {
    for (const leg of legs) {
      const s = Math.sin(t * cadence + leg.phase)
      const swing = moving ? s * amp : 0
      // The foot lifts (knee folds) on the forward half of the stride.
      const lift = moving ? Math.max(0, Math.sin(t * cadence + leg.phase + Math.PI / 2)) * amp * 1.3 : 0
      leg.pivot.rotation.x = ease(leg.pivot.rotation.x, -swing)
      leg.knee.rotation.x = ease(leg.knee.rotation.x, leg.front ? lift : -lift * 0.6)
    }
    torso.position.y = torsoY + (moving ? Math.abs(Math.sin(t * cadence)) * 0.01 : 0)
    torso.scale.y = 1 + Math.sin(t * 2.3) * 0.012 // breathing
    head.rotation.y = ease(head.rotation.y, moving ? 0 : Math.sin(t * 0.6) * 0.25)
    head.rotation.z = moving ? 0 : Math.sin(t * 0.4) * 0.06
    const sway = tailSpec.sway ?? (kind === 'flowing' || kind === 'bushy' ? 0.22 : 0.35)
    tailSegs.forEach((seg, i) => {
      seg.rotation.y = Math.sin(t * (moving ? 7 : 2.4) - i * 0.6) * sway
    })
    if (kind === 'puff' || kind === 'curl' || kind === 'stub') tailBase.rotation.y = Math.sin(t * (moving ? 12 : 3)) * 0.25
    // Now and then an ear flicks.
    const flick = Math.max(0, Math.sin(t * 0.9) - 0.94) * 6
    for (const e of ears) e.pivot.rotation.z = e.base + e.side * flick * 0.6 * (e.side > 0 ? 1 : 0)
    spec.animate?.(parts, t, moving)
  }
  return root
}

// ---- Species markings ----------------------------------------------------------------

// The torso's radius at depth z (chest sphere, barrel, hip sphere), so markings sit on the fur.
function bodyRadiusAt({ R, L, chestR, hipR }, z) {
  const inSphere = (r, zc) => Math.sqrt(Math.max(0, r * r - ((z - zc) / 1.05) ** 2))
  return Math.max(Math.min(chestR, hipR) * 0.94, inSphere(chestR, L / 2), inSphere(hipR * 0.98, -L / 2))
}

// Stripes over the back: half-rings across the torso (and a few on the head and legs).
function stripes(p, color, count = 7, { head = true, legs = true, width = 0.016 } = {}) {
  const m = fur(color)
  const { torso, R, L, chestR, hipR } = p
  for (let i = 0; i < count; i++) {
    const f = i / (count - 1)
    const z = -L / 2 - hipR * 0.4 + f * (L + hipR * 0.4 + chestR * 0.3)
    // Sunk into the fur and flattened, so it reads as a painted stripe, not a ridge.
    const r = bodyRadiusAt(p, z) * 0.985
    const arc = Math.PI * (0.62 + (i % 2) * 0.12)
    torso.add(mesh(new THREE.TorusGeometry(r, R * width * 5, 4, 18, arc), m, [0, 0, z], [0.9, 1, 0.55], [0, 0, Math.PI / 2 - arc / 2]))
  }
  if (head) {
    for (const [x, rz] of [[0, 0], [-0.4, 0.5], [0.4, -0.5]]) p.head.add(mesh(capY(p.H * 0.05, p.H * 0.3), m, [x * p.H, p.H * 0.72, p.H * 0.35], [1, 1, 0.5], [0.5, 0, rz]))
  }
  if (legs) {
    for (const leg of p.legs) for (const y of [-0.025, -0.06]) leg.knee.add(mesh(new THREE.TorusGeometry(R * 0.26, R * 0.05, 4, 12, Math.PI), m, [0, y, 0], [1, 1, 1], [Math.PI / 2, 0, 0]))
  }
}

// Whiskers: fine pale hairs fanning out from either side of the muzzle.
function whiskers(p, color = 0xf4f4f4) {
  const m = fur(color, { roughness: 0.4 })
  for (const side of [-1, 1]) {
    for (const [dy, rz] of [[0.01, 0.1], [-0.005, -0.05], [-0.02, -0.2]]) {
      p.head.add(mesh(new THREE.CylinderGeometry(0.003, 0.003, p.H * 1.3, 3), m, [side * (p.mr + p.H * 0.6), -p.H * 0.3 + dy, p.H * 0.55 + p.ml * 0.8], [1, 1, 1], [0, 0, Math.PI / 2 + side * rz]))
    }
  }
}

// A pale lower jaw / cheek patch (foxes, wolves, cats).
function cheeks(p, color) {
  p.head.add(mesh(sph(p.mr * 1.05), fur(color), [0, -p.H * 0.42, p.H * 0.52 + p.ml * 0.45], [1.25, 0.65, 1.35]))
}

// ---- The animals ---------------------------------------------------------------------

const fox = () =>
  quadruped({
    coat: 0xd2601f, under: 0xf6eee2, legs: 0x2a1c16, muzzle: 0xd2601f, eye: 0x8a4a12,
    bodyR: 0.13, bodyLen: 0.36, legLen: 0.22, headR: 0.1, muzzleLen: 0.11, muzzleR: 0.042,
    ear: { kind: 'point', size: 1.3, inner: 0xfff2e2, back: 0x2a1c16 },
    tail: { kind: 'bushy', len: 0.4, lift: -0.15, curl: 0.12, tip: 0xffffff },
    extras: (p) => { cheeks(p, 0xf6eee2); whiskers(p, 0x1b1b1b) },
  })

const wolf = () =>
  quadruped({
    coat: 0xe4ebf0, under: 0xffffff, legs: 0xd2dce3, muzzle: 0xf2f5f7, eye: 0x6fb8e8, nose: 0x2a2f36,
    bodyR: 0.15, bodyLen: 0.42, chest: 1.15, legLen: 0.28, headR: 0.115, muzzleLen: 0.12, muzzleR: 0.05, neckTilt: 0.7,
    ear: { kind: 'point', size: 1.1, inner: 0xc9d4dc }, tail: { kind: 'bushy', len: 0.42, lift: -0.55, curl: 0.05 },
    extras: (p) => {
      cheeks(p, 0xffffff)
      // A thick ruff of fur around the neck.
      p.neck.add(mesh(sph(p.neckR * 1.35), fur(0xf4f7f9), [0, p.neckLen * 0.3, 0], [1.1, 0.9, 1]))
      p.torso.add(mesh(sph(p.R * 0.7), fur(0xc6d0d8), [0, p.R * 0.55, 0], [0.8, 0.5, 2.4])) // grey saddle
    },
  })

const cat = () =>
  quadruped({
    coat: 0xe39a55, under: 0xfff6ec, muzzle: 0xfff6ec, nose: 0xe8798e, eye: 0x7cc23a, eyeR: 0.019,
    bodyR: 0.11, bodyLen: 0.32, chest: 1, legLen: 0.2, legR: 0.026, headR: 0.095, muzzleLen: 0.025, muzzleR: 0.04, muzzleW: 1.2, neckTilt: 0.9,
    ear: { kind: 'point', size: 1.05, inner: 0xf2b8b0 },
    tail: { kind: 'thin', len: 0.42, lift: 1.25, curl: -0.18, r: 0.022, segments: 6 },
    extras: (p) => { stripes(p, 0xb5652a, 6, { legs: false, width: 0.012 }); whiskers(p) },
  })

const tiger = () =>
  quadruped({
    coat: 0xee8420, under: 0xfff6ea, legs: 0xee8420, muzzle: 0xfff6ea, nose: 0xd98a8a, eye: 0xd9a024,
    bodyR: 0.16, bodyLen: 0.46, chest: 1.1, legLen: 0.24, legR: 0.05, headR: 0.125, headW: 1.12, muzzleLen: 0.05, muzzleR: 0.06, muzzleW: 1.15, neckTilt: 1.0,
    ear: { kind: 'round', size: 0.85, inner: 0xfff6ea, back: 0x1b1b1b },
    tail: { kind: 'ringed', len: 0.44, lift: -0.2, curl: 0.12, r: 0.03, ring: 0x1b1b1b, tip: 0x1b1b1b },
    size: 1.05,
    extras: (p) => { stripes(p, 0x1b1b1b, 9); whiskers(p); cheeks(p, 0xfff6ea) },
  })

const lion = () =>
  quadruped({
    coat: 0xd8a24a, under: 0xf0d9a8, muzzle: 0xf0d9a8, nose: 0x7a4a3a, eye: 0xb9781e,
    bodyR: 0.16, bodyLen: 0.46, legLen: 0.26, legR: 0.05, headR: 0.12, headW: 1.08, muzzleLen: 0.06, muzzleR: 0.06, muzzleW: 1.1, neckTilt: 0.9,
    ear: { kind: 'round', size: 0.75, inner: 0x3a2618 }, tail: { kind: 'tuft', len: 0.42, lift: -0.4, curl: 0.18, tip: 0x4a2a14 },
    size: 1.08,
    extras: (p) => {
      // The mane: a full shaggy ring round the face, a second darker layer behind, down the neck.
      const outer = fur(0x8a4e1e)
      const innerMane = fur(0xb06a28)
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2
        p.head.add(mesh(sph(p.H * 0.42), innerMane, [Math.cos(a) * p.H * 0.95, Math.sin(a) * p.H * 0.95 + p.H * 0.05, -p.H * 0.2], [1, 1, 0.8]))
        p.head.add(mesh(sph(p.H * 0.5), outer, [Math.cos(a + 0.2) * p.H * 1.2, Math.sin(a + 0.2) * p.H * 1.15, -p.H * 0.55], [1, 1, 0.9]))
      }
      for (let i = 0; i < 4; i++) p.neck.add(mesh(sph(p.neckR * 1.3), outer, [0, p.neckLen * (0.1 + i * 0.25), -p.neckR * 0.3], [1.15, 0.9, 1.1]))
      whiskers(p)
    },
  })

const bear = () =>
  quadruped({
    coat: 0x5e3b22, under: 0x6b4429, legs: 0x4a2e1a, muzzle: 0xa8825a, nose: 0x161010, eye: 0x1a120c,
    bodyR: 0.19, bodyLen: 0.4, chest: 1.12, hip: 1.02, legLen: 0.2, legR: 0.065, hindThick: 1.15, headR: 0.12, muzzleLen: 0.07, muzzleR: 0.055, neckTilt: 1.15, neckLen: 0.05, neckR: 0.11, headPitch: 0.15,
    ear: { kind: 'round', size: 0.75, inner: 0x3a2414 }, tail: { kind: 'stub' }, cadence: 8, stride: 0.45,
    size: 1.08,
    extras: (p) => {
      p.torso.add(mesh(sph(p.R * 0.75), p.coat, [0, p.R * 0.65, p.L * 0.4], [0.9, 0.7, 1.1])) // shoulder hump
      for (const leg of p.legs.filter((l) => l.front)) for (const x of [-0.025, 0, 0.025]) leg.knee.add(mesh(cone(0.008, 0.035, 5), fur(0xe8e0d0, { roughness: 0.4 }), [x, -leg.pivot.position.y * 0.5 + 0.01, 0.075], [1, 1, 1], [Math.PI / 2, 0, 0]))
    },
  })

const panda = () =>
  quadruped({
    coat: 0xf3f1ea, under: 0xf3f1ea, legs: 0x1b1b1d, muzzle: 0xf3f1ea, nose: 0x161616, eye: 0x101010, eyeR: 0.014,
    bodyR: 0.19, bodyLen: 0.38, chest: 1.08, legLen: 0.19, legR: 0.065, headR: 0.135, headW: 1.1, muzzleLen: 0.04, muzzleR: 0.055, neckTilt: 1.15, neckLen: 0.04, neckR: 0.12, headPitch: 0.1,
    ear: { kind: 'round', size: 0.9, inner: 0x1b1b1d, back: 0x1b1b1d }, tail: { kind: 'stub' }, cadence: 8, stride: 0.45,
    size: 1.08,
    extras: (p) => {
      const black = fur(0x1b1b1d)
      // Eye patches: tear-drop smudges sloping down and out.
      for (const side of [-1, 1]) p.head.add(mesh(sph(p.H * 0.24), black, [side * p.H * 0.45, p.H * 0.12, p.H * 0.66], [0.8, 1.15, 0.5], [0, 0, side * 0.6]))
      // The black band over the shoulders that joins the front legs.
      p.torso.add(mesh(new THREE.TorusGeometry(p.chestR * 0.86, p.R * 0.42, 8, 20), black, [0, -p.R * 0.05, p.L * 0.4], [0.95, 1, 1.2]))
    },
  })

const koala = () =>
  quadruped({
    coat: 0x9aa0a8, under: 0xe4e6ea, legs: 0x8a9098, muzzle: 0x9aa0a8, nose: 0x1a1a1c, noseR: 0.045, eye: 0x101010, eyeR: 0.013,
    bodyR: 0.17, bodyLen: 0.3, chest: 1.05, legLen: 0.18, legR: 0.055, headR: 0.13, headW: 1.15, muzzleLen: 0.02, muzzleR: 0.04, neckTilt: 1.2, neckLen: 0.03, neckR: 0.11, eyeX: 0.45,
    ear: { kind: 'fluffy', size: 1.1, inner: 0xf4f4f4 }, tail: { kind: 'none' }, cadence: 7, stride: 0.4,
    extras: (p) => {
      // The big leathery nose: a tall dark oval down the middle of the face.
      p.head.add(mesh(sph(p.H * 0.22), gloss(0x1a1a1c), [0, -p.H * 0.12, p.H * 0.82], [0.75, 1.15, 0.6]))
      p.head.add(mesh(sph(p.H * 0.5), fur(0xe4e6ea), [0, -p.H * 0.55, p.H * 0.45], [1, 0.5, 0.8])) // pale chin
    },
  })

function raccoonExtras(p, { mask = 0x1b1b1b, brow = 0xf2f2f2 } = {}) {
  p.head.add(mesh(sph(p.H * 0.5), fur(mask), [0, p.H * 0.16, p.H * 0.52], [1.55, 0.42, 0.75]))
  for (const side of [-1, 1]) p.head.add(mesh(sph(p.H * 0.18), fur(brow), [side * p.H * 0.36, p.H * 0.45, p.H * 0.62], [1.6, 0.5, 0.6], [0, 0, side * -0.25]))
  p.head.add(mesh(sph(p.mr * 1.1), fur(brow), [0, -p.H * 0.36, p.H * 0.5 + p.ml * 0.4], [1.2, 0.7, 1.3]))
  whiskers(p, 0xdedede)
}

const raccoon = () =>
  quadruped({
    coat: 0x85888e, under: 0xb9bcc2, legs: 0x2a2a2c, muzzle: 0xb9bcc2, nose: 0x161616, eye: 0x101010,
    bodyR: 0.14, bodyLen: 0.32, hip: 1.12, legLen: 0.18, headR: 0.1, headW: 1.1, muzzleLen: 0.07, muzzleR: 0.035, neckTilt: 1.0,
    ear: { kind: 'point', size: 0.85, inner: 0xe8e8e8, back: 0x2a2a2c },
    tail: { kind: 'ringed', len: 0.36, lift: 0.15, curl: 0.06, r: 0.05, ring: 0x2a2a2c, segments: 7 },
    extras: (p) => raccoonExtras(p),
  })

const ninjacoon = () =>
  quadruped({
    coat: 0x3b3650, under: 0x58507a, legs: 0x18161f, muzzle: 0x58507a, nose: 0x0e0e12, eye: 0xd8e4ff,
    bodyR: 0.14, bodyLen: 0.32, hip: 1.12, legLen: 0.2, headR: 0.1, headW: 1.1, muzzleLen: 0.07, muzzleR: 0.035, neckTilt: 1.0,
    ear: { kind: 'point', size: 0.85, inner: 0x8a80b0, back: 0x18161f },
    tail: { kind: 'ringed', len: 0.36, lift: 0.15, curl: 0.06, r: 0.05, ring: 0x18161f, segments: 7 },
    extras: (p) => {
      raccoonExtras(p, { mask: 0x0e0e12, brow: 0x8a80b0 })
      // A red ninja headband with two tails streaming off the back.
      const red = fur(0xe0304a, { roughness: 0.6 })
      p.head.add(mesh(new THREE.TorusGeometry(p.H * 1.0, p.H * 0.1, 6, 24), red, [0, p.H * 0.38, -p.H * 0.02], [1.05, 1, 1], [Math.PI / 2 - 0.15, 0, 0]))
      const ribbons = new THREE.Group()
      ribbons.position.set(0, p.H * 0.4, -p.H * 1.0)
      for (const side of [-1, 1]) ribbons.add(mesh(new THREE.BoxGeometry(p.H * 0.18, p.H * 0.04, p.H * 1.2), red, [side * p.H * 0.12, 0, -p.H * 0.6], [1, 1, 1], [0, side * 0.25, 0]))
      p.head.add(ribbons)
      p.ribbons = ribbons
    },
    animate: (p, t, moving) => {
      p.ribbons.rotation.x = 0.2 + Math.sin(t * (moving ? 16 : 3)) * (moving ? 0.25 : 0.08)
    },
  })

const rabbit = () =>
  quadruped({
    coat: 0xc9b49a, under: 0xf6efe6, legs: 0xc9b49a, muzzle: 0xf6efe6, nose: 0xe88a9a, noseR: 0.012, eye: 0x1a0e08, eyeR: 0.02,
    bodyR: 0.12, bodyLen: 0.2, chest: 0.95, hip: 1.25, legLen: 0.13, legR: 0.03, hindThick: 1.6, headR: 0.09, muzzleLen: 0.03, muzzleR: 0.04, muzzleW: 1.15, neckTilt: 0.9, neckLen: 0.05, eyeX: 0.62,
    ear: { kind: 'long', size: 1.2, inner: 0xf2b6b8 }, tail: { kind: 'puff', tip: 0xffffff }, gait: 'hop',
    extras: (p) => whiskers(p),
  })

const ram = () =>
  quadruped({
    coat: 0xece4d2, under: 0xece4d2, legs: 0x3a2e26, muzzle: 0x3a2e26, nose: 0x1a1412, noseR: 0.012, eye: 0xb88a24, feet: 'hoof', hoof: 0x1e1a18,
    bodyR: 0.17, bodyLen: 0.38, chest: 1.05, legLen: 0.24, legR: 0.026, headR: 0.09, muzzleLen: 0.08, muzzleR: 0.045, neckTilt: 0.85, neckLen: 0.06,
    ear: { kind: 'floppy', size: 0.7, back: 0x3a2e26 }, tail: { kind: 'stub' },
    size: 1.05,
    extras: (p) => {
      // Fleece: lumpy wool clumps all over the body (the face and legs stay dark).
      const wool = fur(0xf4eedf, { roughness: 1 })
      for (let i = 0; i < 22; i++) {
        const a = (i * 2.399) % (Math.PI * 2)
        const z = -p.L * 0.6 + (i / 21) * p.L * 1.2
        const r = (z > 0 ? p.chestR : p.hipR) * 0.92
        if (Math.sin(a) < -0.6) continue
        p.torso.add(mesh(sph(p.R * 0.42), wool, [Math.cos(a) * r * 0.9, Math.sin(a) * r, z]))
      }
      p.head.add(mesh(sph(p.H * 0.6), wool, [0, p.H * 0.7, -p.H * 0.1], [1.2, 0.7, 1]))
      p.head.children[0].material = fur(0x3a2e26) // dark face
      // Curled horns: thick spirals sweeping back, down and forward round each ear.
      const horn = fur(0xcdb382, { roughness: 0.55 })
      for (const side of [-1, 1]) {
        const pts = []
        for (let i = 0; i <= 18; i++) {
          const f = i / 18
          const a = f * Math.PI * 1.7
          const rr = p.H * 0.95 * (1 - f * 0.5)
          pts.push([side * (p.H * 0.6 + f * p.H * 0.65), p.H * 0.1 + Math.cos(a) * rr, -p.H * 0.15 - Math.sin(a) * rr])
        }
        p.head.add(mesh(tube(pts, p.H * 0.24), horn))
      }
    },
  })

const pig = () =>
  quadruped({
    coat: 0xf2a7b4, under: 0xf6bcc6, muzzle: 0xf2a7b4, nose: null, eye: 0x1a1010, eyeR: 0.013, feet: 'hoof', hoof: 0x8a5a5e,
    bodyR: 0.17, bodyLen: 0.38, chest: 1.02, hip: 1.08, legLen: 0.14, legR: 0.03, headR: 0.11, muzzleLen: 0.06, muzzleR: 0.05, neckTilt: 1.1, neckLen: 0.03, neckR: 0.12, headPitch: 0.1,
    ear: { kind: 'floppy', size: 1.1, back: 0xf09aa8 }, tail: { kind: 'curl' }, cadence: 13, stride: 0.5,
    extras: (p) => {
      // The flat snout disc with two nostrils.
      const z = p.H * 0.55 + p.ml + p.mr * 0.7
      p.head.add(mesh(new THREE.CylinderGeometry(p.mr * 0.95, p.mr * 0.95, p.mr * 0.4, 16), fur(0xf08a9c), [0, -p.H * 0.3, z], [1.1, 1, 0.9], [Math.PI / 2, 0, 0]))
      for (const side of [-1, 1]) p.head.add(mesh(sph(p.mr * 0.17), fur(0x7a3a46), [side * p.mr * 0.35, -p.H * 0.3, z + p.mr * 0.18], [1, 1.4, 0.6]))
    },
  })

const pug = () =>
  quadruped({
    coat: 0xd9bb8c, under: 0xe8d2a8, legs: 0xd9bb8c, muzzle: 0x2a221e, nose: 0x0e0c0a, eye: 0x1a120c, eyeR: 0.022,
    bodyR: 0.14, bodyLen: 0.26, chest: 1.12, legLen: 0.15, legR: 0.035, headR: 0.115, headW: 1.12, muzzleLen: 0.015, muzzleR: 0.05, muzzleW: 1.25, neckTilt: 1.1, neckLen: 0.03, neckR: 0.1, eyeX: 0.55,
    ear: { kind: 'floppy', size: 0.75, back: 0x2a221e }, tail: { kind: 'curl', tip: 0xd9bb8c }, cadence: 13, stride: 0.5,
    extras: (p) => {
      const dark = fur(0x2a221e)
      // Forehead wrinkles and the dark mask round the eyes.
      for (const [y, s] of [[0.48, 1], [0.6, 0.8]]) p.head.add(mesh(new THREE.TorusGeometry(p.H * 0.32 * s, p.H * 0.03, 4, 14, Math.PI * 0.8), dark, [0, p.H * y, p.H * 0.7], [1, 0.5, 1], [-0.3, 0, Math.PI * 0.1]))
      for (const side of [-1, 1]) p.head.add(mesh(sph(p.H * 0.18), dark, [side * p.H * 0.52, p.H * 0.14, p.H * 0.66], [1, 1, 0.5]))
      p.head.add(mesh(sph(p.H * 0.09), fur(0xe0607a), [0, -p.H * 0.55, p.H * 0.72], [1, 0.4, 1])) // tongue tip
    },
  })

const monkey = () =>
  quadruped({
    coat: 0x6e4224, under: 0x8a5a36, legs: 0x5a341c, paws: 0x2e1e14, muzzle: 0xe2b98e, nose: 0x5a3420, noseR: 0.008, eye: 0x2a160a,
    bodyR: 0.12, bodyLen: 0.26, chest: 1.05, legLen: 0.25, legR: 0.025, headR: 0.1, muzzleLen: 0.02, muzzleR: 0.05, muzzleW: 1.1, neckTilt: 0.6, neckLen: 0.05, headPitch: -0.1,
    ear: { kind: 'round', size: 0.8, inner: 0xe2b98e, back: 0xe2b98e }, tail: { kind: 'thin', len: 0.5, lift: 1.0, curl: 0.32, r: 0.018, segments: 7 },
    extras: (p) => {
      // A bare heart-shaped face.
      p.head.add(mesh(sph(p.H * 0.6), fur(0xe2b98e), [0, p.H * 0.12, p.H * 0.5], [1.15, 0.85, 0.55]))
      p.head.add(mesh(sph(p.H * 0.3), p.coat, [0, p.H * 0.72, p.H * 0.25], [1.5, 0.6, 1])) // brow tuft
    },
  })

const unicorn = () =>
  quadruped({
    coat: 0xfbf8fb, under: 0xffffff, legs: 0xf6f0f6, muzzle: 0xf9eef6, nose: 0xe4b6cc, noseR: 0.01, eye: 0x3a1e5a, eyeR: 0.02, feet: 'hoof', hoof: 0xd8b8f0,
    bodyR: 0.15, bodyLen: 0.44, chest: 1.1, legLen: 0.34, legR: 0.03, headR: 0.085, muzzleLen: 0.14, muzzleR: 0.045, neckTilt: 0.45, neckLen: 0.22, neckR: 0.065, headPitch: 0.7, eyeX: 0.62,
    ear: { kind: 'point', size: 0.75, inner: 0xf2c2e0 },
    tail: { kind: 'flowing', len: 0.42, lift: -0.4, curl: 0.12, r: 0.05, colors: [0xff9ad5, 0xc6a2ff, 0x9ad8ff, 0xa8f0c8, 0xfff0a0] },
    stride: 0.6, cadence: 10,
    extras: (p) => {
      // A rainbow mane down the back of the neck and a forelock between the ears.
      const colors = [0xff9ad5, 0xc6a2ff, 0x9ad8ff, 0xa8f0c8, 0xfff0a0]
      for (let i = 0; i < 7; i++) p.neck.add(mesh(sph(p.neckR * 0.75), fur(colors[i % colors.length]), [0, p.neckLen * (i / 6) + 0.01, -p.neckR * 0.85], [0.55, 1.2, 1]))
      p.head.add(mesh(sph(p.H * 0.38), fur(colors[0]), [0, p.H * 0.72, p.H * 0.25], [0.7, 0.8, 1.1]))
      // The spiral horn: a golden-pink cone wound with a thin ridge.
      const horn = new THREE.Group()
      horn.position.set(0, p.H * 0.8, p.H * 0.45)
      horn.rotation.x = 0.55
      const hl = p.H * 1.6
      horn.add(mesh(cone(p.H * 0.16, hl, 12), fur(0xffe2a8, { roughness: 0.3, metalness: 0.3 }), [0, hl / 2, 0]))
      const pts = []
      for (let i = 0; i <= 30; i++) {
        const f = i / 30
        const a = f * Math.PI * 7
        const rr = p.H * 0.16 * (1 - f) + 0.002
        pts.push([Math.cos(a) * rr, f * hl * 0.95, Math.sin(a) * rr])
      }
      horn.add(mesh(tube(pts, p.H * 0.025, 60), fur(0xffc8e6, { roughness: 0.3, metalness: 0.3 })))
      p.head.add(horn)
    },
  })

// ---- Penguin ---------------------------------------------------------------------------

// An emperor-ish penguin: sleek upright body, black back and head, white front, golden ear
// patches and throat, a long slender bill with an orange stripe, flippers and pink-grey feet.
// It waddles: rocks side to side with flippers out when it walks.
function penguin() {
  const root = new THREE.Group()
  const body = new THREE.Group()
  root.add(body)
  const black = fur(0x1a1f2a, { roughness: 0.55 })
  const white = fur(0xf6f6f2, { roughness: 0.6 })
  const gold = fur(0xffb43a, { roughness: 0.6 })
  body.add(mesh(capY(0.17, 0.32), black, [0, 0.38, -0.02], [1, 1, 0.92]))
  body.add(mesh(capY(0.155, 0.27), white, [0, 0.36, 0.035], [0.9, 1, 0.78]))
  body.add(mesh(sph(0.12), fur(0xffe7a0, { roughness: 0.6 }), [0, 0.58, 0.1], [1, 0.75, 0.6])) // pale-gold upper chest
  const head = new THREE.Group()
  head.position.set(0, 0.74, 0.0)
  body.add(head)
  head.add(mesh(sph(0.115), black, [0, 0, 0], [0.95, 1, 1.05]))
  for (const side of [-1, 1]) {
    head.add(mesh(sph(0.05), gold, [side * 0.085, -0.03, -0.01], [0.5, 1.2, 0.8], [0, 0, side * 0.3]))
    eye(head, side * 0.06, 0.025, 0.085, 0.014, 0x1a1210)
  }
  // The bill: long, slender, slightly down-curved, with an orange stripe.
  const bill = mesh(cone(0.026, 0.16, 8), black, [0, -0.015, 0.17], [1, 1, 0.8], [Math.PI / 2 + 0.15, 0, 0])
  head.add(bill)
  for (const side of [-1, 1]) head.add(mesh(capY(0.007, 0.07), gold, [side * 0.014, -0.02, 0.14], [1, 1, 1], [Math.PI / 2 + 0.15, 0, 0]))
  const flippers = []
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group()
    pivot.position.set(side * 0.16, 0.56, -0.01)
    pivot.add(mesh(capY(0.04, 0.24), black, [side * 0.01, -0.13, 0], [0.45, 1, 1]))
    pivot.add(mesh(capY(0.03, 0.2), white, [side * -0.006, -0.13, 0.004], [0.3, 1, 0.9]))
    body.add(pivot)
    flippers.push({ pivot, side })
  }
  body.add(mesh(cone(0.06, 0.12, 6), black, [0, 0.1, -0.17], [1, 1, 0.5], [-2.3, 0, 0])) // stiff little tail
  const feet = []
  for (const side of [-1, 1]) {
    const foot = new THREE.Group()
    foot.position.set(side * 0.07, 0.02, 0.06)
    foot.add(mesh(sph(0.045), fur(0x8a7a80), [0, 0, 0.02], [1, 0.35, 1.5]))
    root.add(foot)
    feet.push(foot)
  }
  mergeRigid(root)
  root.userData.fly = false
  root.userData.gait = 'walk'
  root.userData.animate = (t, moving) => {
    const w = Math.sin(t * (moving ? 11 : 1.5))
    body.rotation.z = moving ? w * 0.14 : w * 0.02 // the waddle
    for (const { pivot, side } of flippers) pivot.rotation.z = side * (moving ? 0.45 + Math.abs(w) * 0.2 : 0.12 + Math.sin(t * 1.2) * 0.04)
    feet.forEach((foot, i) => {
      foot.position.y = 0.02 + (moving ? Math.max(0, Math.sin(t * 11 + i * Math.PI)) * 0.04 : 0)
    })
    head.rotation.y = moving ? 0 : Math.sin(t * 0.7) * 0.4
  }
  return root
}

// ---- Tortoise ---------------------------------------------------------------------------

// A tortoise: a high domed shell tiled with raised scutes and a pale rim, a wrinkled head on
// a neck that pokes in and out, stumpy scaly legs with claws that plod, and a little tail.
function turtle() {
  const root = new THREE.Group()
  const shellMat = fur(0x5e4a26, { roughness: 0.6 })
  const scuteMat = fur(0x8a6a34, { roughness: 0.55 })
  const rimMat = fur(0xc9a860, { roughness: 0.6 })
  const skin = fur(0x8a8a5a)
  const shell = new THREE.Group()
  shell.position.y = 0.14
  root.add(shell)
  shell.add(mesh(new THREE.SphereGeometry(0.34, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), shellMat, [0, 0, 0], [1, 0.82, 1.18]))
  shell.add(mesh(new THREE.CylinderGeometry(0.35, 0.33, 0.05, 24), rimMat, [0, 0.0, 0], [1, 1, 1.18]))
  // Scutes: hexagonal plates following the dome (a ring of 8 around a spine of 3).
  const plate = (x, z, r) => {
    const nx = x / 0.34
    const nz = z / (0.34 * 1.18)
    const ny = Math.sqrt(Math.max(0, 1 - nx * nx - nz * nz))
    const p = mesh(new THREE.CylinderGeometry(r, r * 1.08, 0.025, 6), scuteMat, [x, ny * 0.34 * 0.82 + 0.005, z])
    p.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(nx * 0.8, ny, nz * 0.8).normalize())
    shell.add(p)
  }
  for (const z of [-0.17, 0, 0.17]) plate(0, z, 0.085)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8
    plate(Math.cos(a) * 0.2, Math.sin(a) * 0.24, 0.07)
  }
  const neck = new THREE.Group()
  neck.position.set(0, 0.13, 0.36)
  root.add(neck)
  neck.add(mesh(capZ(0.055, 0.1), skin, [0, 0.01, 0.02], [1, 0.9, 1], [-0.3, 0, 0]))
  const head = new THREE.Group()
  head.position.set(0, 0.05, 0.11)
  neck.add(head)
  head.add(mesh(sph(0.07), skin, [0, 0, 0], [0.9, 0.85, 1.2]))
  head.add(mesh(sph(0.035), fur(0x6a6a44), [0, -0.025, 0.065], [1.2, 0.6, 1])) // beak-like jaw
  for (const side of [-1, 1]) eye(head, side * 0.045, 0.02, 0.045, 0.013, 0x1a1408)
  const legs = []
  for (const [x, z, phase] of [[-0.24, 0.24, 0], [0.24, -0.24, 0], [0.24, 0.24, Math.PI], [-0.24, -0.24, Math.PI]]) {
    const pivot = new THREE.Group()
    pivot.position.set(x, 0.12, z)
    pivot.add(mesh(capY(0.055, 0.06), skin, [Math.sign(x) * 0.01, -0.06, 0], [1, 1, 1]))
    for (const dx of [-0.025, 0, 0.025]) pivot.add(mesh(cone(0.008, 0.025, 5), fur(0x3a3420), [dx, -0.12, 0.045], [1, 1, 1], [Math.PI / 2, 0, 0]))
    root.add(pivot)
    legs.push({ pivot, phase })
  }
  root.add(mesh(cone(0.03, 0.08, 6), skin, [0, 0.1, -0.42], [1, 1, 1], [-Math.PI / 2 - 0.3, 0, 0]))
  mergeRigid(root)
  root.userData.fly = false
  root.userData.gait = 'walk'
  root.userData.animate = (t, moving) => {
    for (const { pivot, phase } of legs) pivot.rotation.x = moving ? Math.sin(t * 6 + phase) * 0.45 : 0
    neck.position.z = 0.36 + (moving ? 0.03 : Math.sin(t * 0.8) * 0.03)
    head.rotation.y = moving ? 0 : Math.sin(t * 0.5) * 0.35
    shell.rotation.z = moving ? Math.sin(t * 6) * 0.03 : 0
  }
  return root
}

// How much bigger the ground walkers are than petModels.js's usual ~0.9-unit pet scale, so they
// read as real animals next to the player (~1.2 tall). The model goes inside a fresh root,
// because pets.js owns the root's scale (it grows the pet in when it spawns).
export const GROUND_PET_SCALE = 1.5
const grown = (build) => () => {
  const model = build()
  model.scale.setScalar(GROUND_PET_SCALE)
  const root = new THREE.Group()
  root.add(model)
  root.userData = model.userData
  return root
}

export const ANIMAL_BUILDERS = Object.fromEntries(
  Object.entries({ fox, wolf, cat, tiger, lion, bear, panda, koala, raccoon, ninjacoon, rabbit, ram, pig, pug, monkey, unicorn, penguin, turtle }).map(([name, build]) => [name, grown(build)]),
)
