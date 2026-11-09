// The Realist look (and every monster in the Wilds): real creatures instead of jelly shapes.
//
// Each monster type has its own creature design, built from many simple shapes -- lumpy
// noise-sculpted blobs, tapering limbs, cones, rounded boxes, rings -- that are baked into ONE
// vertex-coloured geometry per type (cached and shared, so a big wave costs one draw call per
// monster). The material is a hide-textured, bump-mapped standard material with a fresnel rim
// light, plus two extra vertex attributes the shader reads:
//   aGlow  -- how much a part glows in its own colour (eyes, blisters, cores, embers);
//   aWig   -- how a part moves: legs step in time with how fast the monster actually walks
//             (uWalkT / uWalkA), while wings, fins, tails, tendrils and flames sway on the clock.
// Bosses are their regular form with a boss dressing: red eyes, horns, a spiked ridge.
import * as THREE from 'three'

const TAU = Math.PI * 2
const BONE = 0xe7dcc2
const INK = 0x140d1a
const EYE = 0xfff1d0
const EYE_BOSS = 0xff4a5a
const IRON = 0x4a4d58
const V = (x, y, z) => new THREE.Vector3(x, y, z)
const UP = V(0, 1, 0)

// A colour, lighter (k > 1) or darker (k < 1).
export function shade(hex, k) {
  const c = new THREE.Color(hex)
  return c.setRGB(Math.min(1, c.r * k), Math.min(1, c.g * k), Math.min(1, c.b * k)).getHex()
}

// Smooth lumps for organic surfaces: a few products of sines at unrelated frequencies.
const lumpy = (x, y, z) =>
  Math.sin(x * 2.9 + 0.4) * Math.sin(y * 3.3 + 1.9) * Math.sin(z * 2.6 + 0.8) + 0.45 * Math.sin(x * 7.1 + 2) * Math.sin(y * 6.4) * Math.sin(z * 7.7 + 1.1)

// ---- textures ------------------------------------------------------------------------------

let hideTexture = null
// A near-white hide: mottled blotches, rows of small overlapping scales and fine grit. It is
// tinted by the vertex colours and doubles as the bump map, so every creature has a skin.
function getHideTexture() {
  if (hideTexture) return hideTexture
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const x = canvas.getContext('2d')
  let seed = 9
  const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  x.fillStyle = '#ececec'
  x.fillRect(0, 0, size, size)
  const blots = (n, min, max, darkShare, alpha) => {
    for (let i = 0; i < n; i++) {
      x.fillStyle = `rgba(${r() < darkShare ? '0,0,0' : '255,255,255'},${r() * alpha})`
      x.beginPath()
      x.arc(r() * size, r() * size, min + r() * (max - min), 0, TAU)
      x.fill()
    }
  }
  blots(150, 14, 50, 0.6, 0.08)
  x.lineWidth = 2
  const rows = 24
  for (let j = 0; j <= rows; j++) {
    for (let i = 0; i <= rows; i++) {
      x.strokeStyle = `rgba(0,0,0,${0.05 + r() * 0.08})`
      x.beginPath()
      x.arc(((i + (j % 2) / 2) * size) / rows, (j * size) / rows, size / (rows * 2), 0, Math.PI)
      x.stroke()
    }
  }
  blots(1000, 1, 3, 0.5, 0.18)
  hideTexture = new THREE.CanvasTexture(canvas)
  hideTexture.wrapS = hideTexture.wrapT = THREE.RepeatWrapping
  hideTexture.colorSpace = THREE.SRGBColorSpace
  hideTexture.anisotropy = 8
  hideTexture.userData.shared = true // never disposed with a monster
  return hideTexture
}

// ---- the material --------------------------------------------------------------------------

// One material per monster (the hit flash and spawn fade change its colours), all sharing one
// shader program. Returns it with `userData.beast` = the uniforms update() drives.
export function createBeastMaterial({ rim = 0.5, roughness = 0.62, metalness = 0, emissive = 0 } = {}) {
  const hide = getHideTexture()
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    roughness,
    metalness,
    map: hide,
    bumpMap: hide,
    bumpScale: 0.6,
    emissive: new THREE.Color(emissive),
  })
  material.userData.baseEmissive = material.emissive.clone() // the hit flash fades back to this
  const uniforms = { uTime: { value: Math.random() * 20 }, uWalkT: { value: 0 }, uWalkA: { value: 0 }, uRim: { value: rim } }
  material.userData.beast = uniforms
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader =
      'attribute float aGlow;\nattribute vec4 aWig;\nattribute float aWigX;\nuniform float uTime;\nuniform float uWalkT;\nuniform float uWalkA;\nvarying float vGlow;\n' +
      shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vGlow = aGlow;
        if (aWig.z < 0.0) {
          float stepP = uWalkT + aWig.w;
          transformed.y += aWig.x * uWalkA * max(0.0, cos(stepP));
          transformed.z += aWig.y * uWalkA * sin(stepP);
        } else if (aWig.z > 0.0) {
          float swayS = sin(uTime * aWig.z + aWig.w);
          transformed.y += aWig.x * swayS;
          transformed.z += aWig.y * swayS;
          transformed.x += aWigX * swayS;
        }`,
      )
    shader.fragmentShader =
      'varying float vGlow;\nuniform float uRim;\n' +
      shader.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        totalEmissiveRadiance += diffuseColor.rgb * vGlow;
        totalEmissiveRadiance += (diffuseColor.rgb * 0.7 + 0.08) * pow(1.0 - saturate(dot(normalize(vViewPosition), normal)), 3.0) * uRim;`,
      )
  }
  material.customProgramCacheKey = () => 'beast'
  return material
}

// ---- primitives (unit sized, cached) -------------------------------------------------------

const prims = new Map()
const prim = (key, make) => {
  if (!prims.has(key)) prims.set(key, make())
  return prims.get(key)
}
// Share normals between vertices at the same spot, so a sculpted sphere has no seam.
function weld(g) {
  g.computeVertexNormals()
  const pos = g.attributes.position
  const nor = g.attributes.normal
  const groups = new Map()
  for (let i = 0; i < pos.count; i++) {
    const k = `${Math.round(pos.getX(i) * 1e3)},${Math.round(pos.getY(i) * 1e3)},${Math.round(pos.getZ(i) * 1e3)}`
    let a = groups.get(k)
    if (!a) groups.set(k, (a = { n: V(0, 0, 0), ids: [] }))
    a.n.x += nor.getX(i)
    a.n.y += nor.getY(i)
    a.n.z += nor.getZ(i)
    a.ids.push(i)
  }
  for (const a of groups.values()) {
    a.n.normalize()
    for (const i of a.ids) nor.setXYZ(i, a.n.x, a.n.y, a.n.z)
  }
  return g
}
const sph = (n = 12) => prim(`s${n}`, () => new THREE.SphereGeometry(1, n, Math.ceil(n * 0.7)))
const cone = (n = 7) => prim(`c${n}`, () => new THREE.ConeGeometry(1, 1, n))
const cyl = (top = 1, bottom = 1, n = 8) => prim(`y${top},${bottom},${n}`, () => new THREE.CylinderGeometry(top, bottom, 1, n))
const torus = (R = 1, t = 0.2, n = 18) => prim(`t${R},${t},${n}`, () => new THREE.TorusGeometry(R, t, 7, n))
const gem = () => prim('gem', () => new THREE.OctahedronGeometry(1, 0))
// A sphere pushed in and out by fn(x, y, z) (how far out each direction goes).
const blob = (key, fn, n = 24) =>
  prim(`b${key}`, () => {
    const g = new THREE.SphereGeometry(1, n, Math.ceil(n * 0.72))
    const p = g.attributes.position
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i)
      const y = p.getY(i)
      const z = p.getZ(i)
      const k = fn(x, y, z)
      p.setXYZ(i, x * k, y * k, z * k)
    }
    return weld(g)
  })
// A box with rounded edges.
function rbox(w, h, d, rad = Math.min(w, h, d) * 0.22) {
  return prim(`r${w},${h},${d},${rad}`, () => {
    const g = new THREE.BoxGeometry(w, h, d, 3, 3, 3)
    const p = g.attributes.position
    const n = g.attributes.normal
    const ix = w / 2 - rad
    const iy = h / 2 - rad
    const iz = d / 2 - rad
    const clamp = (v, m) => Math.max(-m, Math.min(m, v))
    const o = V(0, 0, 0)
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i)
      const y = p.getY(i)
      const z = p.getZ(i)
      const cx = clamp(x, ix)
      const cy = clamp(y, iy)
      const cz = clamp(z, iz)
      o.set(x - cx, y - cy, z - cz).normalize()
      p.setXYZ(i, cx + o.x * rad, cy + o.y * rad, cz + o.z * rad)
      n.setXYZ(i, o.x, o.y, o.z)
    }
    return g
  })
}
// A surface of revolution from [radius, height] points (robes, hoods, funnels, flames).
// LatheGeometry's faces point outward when its points run bottom to top, so they are put in
// that order whichever way they were written.
const lathe = (key, pts, n = 20) =>
  prim(`l${key}`, () => new THREE.LatheGeometry((pts[0][1] > pts[pts.length - 1][1] ? [...pts].reverse() : pts).map(([r, y]) => new THREE.Vector2(r, y)), n))

// ---- the forge: shapes baked into one geometry ---------------------------------------------

// o: p position, r euler rotation (or q quaternion), s scale (number or [x, y, z]),
//    glow (0..2), wig [up, forward, speed, phase] (speed -1: steps with the walk),
//    side (sideways sway amplitude), ramp [from, to] weight along the shape's own height, or
//    at(p) a weight from the baked unit-space point (feet move most, wing tips flap most...).
function forge() {
  const items = []
  const f = {
    add(geometry, color, o = {}) {
      const s = o.s === undefined ? [1, 1, 1] : typeof o.s === 'number' ? [o.s, o.s, o.s] : o.s
      const q = o.q || new THREE.Quaternion().setFromEuler(new THREE.Euler(...(o.r || [0, 0, 0])))
      items.push({ geometry, color: new THREE.Color(color), matrix: new THREE.Matrix4().compose(V(...(o.p || [0, 0, 0])), q, V(...s)), o })
      return f
    },
    // A tapering rod from a (radius r1) to b (radius r2).
    limb(a, b, r1, r2, color, o = {}) {
      const A = V(...a)
      const B = V(...b)
      const d = B.clone().sub(A)
      const q = new THREE.Quaternion().setFromUnitVectors(UP, d.clone().normalize())
      const taper = Math.round((r2 / r1) * 100) / 100
      return f.add(cyl(taper, 1, o.n || 7), color, { ...o, q, p: A.add(B).multiplyScalar(0.5).toArray(), s: [r1, d.length(), r1] })
    },
    // A cone whose base sits at `at`, pointing along `dir`.
    spike(at, dir, radius, length, color, o = {}) {
      const d = V(...dir).normalize()
      const q = new THREE.Quaternion().setFromUnitVectors(UP, d)
      return f.add(cone(o.n || 6), color, { ...o, q, p: V(...at).addScaledVector(d, length / 2).toArray(), s: [radius, length, radius] })
    },
    // A jointed leg that steps: hip still, knee a little, foot the most.
    leg(hip, knee, foot, r, color, phase, { lift = 0.14, stride = 0.2, claw = null } = {}) {
      const top = hip[1]
      const bottom = foot[1]
      const at = (p) => Math.min(1, Math.max(0, (top - p.y) / ((top - bottom) || 1)))
      const wig = [lift, stride, -1, phase]
      f.limb(hip, knee, r, r * 0.8, color, { wig, at })
      f.limb(knee, foot, r * 0.8, r * 0.4, color, { wig, at })
      f.add(sph(7), color, { p: knee, s: r * 0.95, wig, at })
      if (claw) f.spike(foot, [0, -0.3, 1], r * 0.35, r * 1.6, claw, { wig, at: () => 1 })
      return f
    },
    both(fn) {
      fn(-1)
      fn(1)
      return f
    },
    done() {
      let verts = 0
      let idx = 0
      for (const it of items) {
        verts += it.geometry.attributes.position.count
        idx += it.geometry.index ? it.geometry.index.count : it.geometry.attributes.position.count
      }
      const pos = new Float32Array(verts * 3)
      const nor = new Float32Array(verts * 3)
      const uv = new Float32Array(verts * 2)
      const col = new Float32Array(verts * 3)
      const glow = new Float32Array(verts)
      const wig = new Float32Array(verts * 4)
      const wigX = new Float32Array(verts)
      const index = new Uint32Array(idx)
      const a = V(0, 0, 0)
      const local = V(0, 0, 0)
      const nm = new THREE.Matrix3()
      let v = 0
      let ii = 0
      for (const it of items) {
        const P = it.geometry.attributes.position
        const N = it.geometry.attributes.normal
        const U = it.geometry.attributes.uv
        const { o } = it
        nm.getNormalMatrix(it.matrix)
        it.geometry.computeBoundingBox()
        const lo = it.geometry.boundingBox.min.y
        const hi = it.geometry.boundingBox.max.y
        for (let i = 0; i < P.count; i++) {
          local.fromBufferAttribute(P, i)
          a.copy(local).applyMatrix4(it.matrix)
          pos.set([a.x, a.y, a.z], (v + i) * 3)
          const n = V(0, 0, 0).fromBufferAttribute(N, i).applyMatrix3(nm).normalize()
          nor.set([n.x, n.y, n.z], (v + i) * 3)
          if (U) uv.set([U.getX(i), U.getY(i)], (v + i) * 2)
          col.set([it.color.r, it.color.g, it.color.b], (v + i) * 3)
          glow[v + i] = o.glow || 0
          if (o.wig) {
            const ly = (local.y - lo) / ((hi - lo) || 1)
            const w = o.at ? o.at(a) : o.ramp ? o.ramp[0] + (o.ramp[1] - o.ramp[0]) * ly : 1
            wig.set([o.wig[0] * w, o.wig[1] * w, o.wig[2], o.wig[3]], (v + i) * 4)
            wigX[v + i] = (o.side || 0) * w
          }
        }
        if (it.geometry.index) for (let i = 0; i < it.geometry.index.count; i++) index[ii++] = it.geometry.index.getX(i) + v
        else for (let i = 0; i < P.count; i++) index[ii++] = i + v
        v += P.count
      }
      const g = new THREE.BufferGeometry()
      g.setIndex(new THREE.BufferAttribute(index, 1))
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      g.setAttribute('normal', new THREE.BufferAttribute(nor, 3))
      g.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
      g.setAttribute('color', new THREE.BufferAttribute(col, 3))
      g.setAttribute('aGlow', new THREE.BufferAttribute(glow, 1))
      g.setAttribute('aWig', new THREE.BufferAttribute(wig, 4))
      g.setAttribute('aWigX', new THREE.BufferAttribute(wigX, 1))
      return g
    },
  }
  return f
}

// ---- shared features -----------------------------------------------------------------------

// Glowing eyes (cream; red on a boss) with a dark slit of a pupil.
function eyes(f, { at = [0.32, 0.24, 0.84], size = 0.14, boss = false, slit = true } = {}) {
  return f.both((s) => {
    f.add(sph(10), boss ? EYE_BOSS : EYE, { p: [s * at[0], at[1], at[2]], s: size, glow: boss ? 1.1 : 0.85 })
    if (slit) f.add(sph(6), INK, { p: [s * at[0], at[1], at[2] + size * 0.8], s: [size * 0.22, size * 0.7, size * 0.25] })
  })
}
// Heavy brows slanting down to the middle: every creature looks cross.
function brows(f, color, { at = [0.32, 0.42, 0.82], w = 0.42, tilt = 0.4 } = {}) {
  return f.both((s) => f.add(rbox(w, 0.13, 0.2), color, { p: [s * at[0], at[1], at[2]], r: [0.25, 0, s * tilt] }))
}
// A dark mouth slit with a row of teeth along its top edge (or both edges).
function maw(f, { y = -0.15, z = 0.9, w = 0.55, h = 0.11, teeth = 4, tooth = 0.13, color = BONE, lower = false } = {}) {
  f.add(rbox(w, h, 0.12), INK, { p: [0, y, z] })
  for (let i = 0; i < teeth; i++) {
    const x = (teeth > 1 ? i / (teeth - 1) - 0.5 : 0) * w * 0.85
    f.spike([x, y + h * 0.45, z + 0.03], [0, -1, 0.15], tooth * 0.38, tooth, color)
    if (lower) f.spike([x + w * 0.08, y - h * 0.45, z + 0.03], [0, 1, 0.15], tooth * 0.32, tooth * 0.8, color)
  }
  return f
}
// Cones standing out of the surface at each point, pointing away from the centre.
function spikesAt(f, list, color, [r, len] = [0.1, 0.35], o = {}) {
  for (const [x, y, z] of list) f.spike([x, y, z], V(x, y, z).normalize().toArray(), r, len, color, o)
  return f
}
// A ridge of spikes over the back, from the crown down to the rump.
function ridge(f, color, { n = 5, from = 0.2, to = 1.45, r = 0.09, len = 0.34, radius = 0.95, y0 = 0 } = {}) {
  for (let i = 0; i < n; i++) {
    const a = from + (i / Math.max(1, n - 1)) * (to - from)
    const d = V(0, Math.cos(a), -Math.sin(a))
    f.spike([0, y0 + d.y * radius, d.z * radius], [0, d.y + 0.35, d.z], r, len * (1 - i * 0.06), color)
  }
  return f
}
// A tail of tapering segments curving back from `root`, swaying side to side.
function tail(f, color, { root = [0, -0.2, -0.85], len = 1.1, r = 0.16, lift = 0.35, tip = BONE, sway = 0.25, speed = 2.4 } = {}) {
  const pts = [0, 1, 2, 3].map((i) => [root[0], root[1] + lift * (i / 3) ** 2, root[2] - (len * i) / 3])
  const at = (p) => Math.min(1, Math.max(0, (root[2] - p.z) / len))
  const o = { wig: [0, 0, speed, 0], side: sway, at }
  for (let i = 0; i < 3; i++) f.limb(pts[i], pts[i + 1], r * (1 - i * 0.28), r * (1 - (i + 1) * 0.28), color, o)
  if (tip) f.spike(pts[3], [0, 0.4, -1], r * 0.4, r * 2, tip, o)
  return f
}
// Six stepping legs, three a side.
function sixLegs(f, color, { inX = 0.55, fromY = -0.2, wide = 0.9, r = 0.085, zs = [0.45, 0, -0.45], lift = 0.12, stride = 0.18, claw = null } = {}) {
  return f.both((s) =>
    zs.forEach((z, i) =>
      f.leg([s * inX, fromY, z], [s * (inX + wide * 0.5), fromY + 0.28, z * 1.15], [s * (inX + wide), -1, z * 1.35], r, color, (i + (s > 0 ? 1 : 0)) * Math.PI, { lift, stride, claw }),
    ),
  )
}
// Four sturdy legs under a body, front and back pairs stepping in turn.
function fourLegs(f, color, { x = 0.5, zf = 0.45, zb = -0.45, top = -0.35, r = 0.18, lift = 0.12, stride = 0.2, foot = null } = {}) {
  return f.both((s) => {
    for (const [z, ph] of [[zf, s > 0 ? 0 : Math.PI], [zb, s > 0 ? Math.PI : 0]]) {
      f.leg([s * x, top, z], [s * (x + 0.06), (top - 1) / 2, z + 0.06], [s * (x + 0.04), -0.95, z + 0.04], r, color, ph, { lift, stride })
      if (foot) f.add(rbox(r * 2.1, r * 0.9, r * 2.6), foot, { p: [s * (x + 0.04), -0.95, z + 0.1], wig: [lift, stride, -1, ph] })
    }
  })
}
// A pair of flat wings (ellipsoids) out of the back that flap on the clock.
function wings(f, color, { at = [0.35, 0.45, -0.2], span = 1.1, chord = 0.55, speed = 22, flap = 0.35, glow = 0, tilt = 0.25, veins = null } = {}) {
  return f.both((s) => {
    const root = Math.abs(at[0])
    const o = { wig: [flap, 0, speed, s > 0 ? 0 : 0.2], glow, at: (p) => Math.max(0, (Math.abs(p.x) - root) / span) }
    f.add(sph(12), color, { ...o, p: [s * (root + span / 2), at[1] + span * 0.12, at[2]], s: [span / 2, 0.03, chord / 2], r: [0, s * 0.2, s * tilt] })
    if (veins) for (const dz of [-0.6, 0, 0.6]) f.limb([s * root, at[1], at[2]], [s * (root + span * 0.92), at[1] + span * 0.2, at[2] + dz * chord * 0.4], 0.02, 0.008, veins, { ...o, n: 4 })
  })
}

// ---- the creatures -------------------------------------------------------------------------
// Unit space: the body's centre near the origin, the ground at y = -1, the front toward +z.
// Each entry: build(f, color, boss) plus optional look settings.

const BEASTS = {
  // A squat, warty toad-grub with a mossy back, little tusks and four stumpy legs.
  blobbo: {
    build(f, c, boss) {
      f.add(blob('blobbo', (x, y, z) => 1 + 0.07 * lumpy(x, y, z) - (y < -0.4 ? (-y - 0.4) * 0.25 : 0)), c, { s: [1.05, 0.82, 1.08], p: [0, -0.1, 0] })
      f.add(blob('belly', () => 1), shade(c, 1.35), { s: [0.82, 0.4, 0.78], p: [0, -0.5, 0.12] })
      for (const [x, y, z, r] of [[0.45, 0.55, -0.2, 0.26], [-0.4, 0.6, 0.0, 0.22], [0.05, 0.72, -0.45, 0.28], [-0.55, 0.3, -0.5, 0.2], [0.6, 0.2, -0.55, 0.18]]) {
        f.add(blob('moss', (a, b, d) => 1 + 0.18 * lumpy(a * 3, b * 3, d * 3)), shade(c, 0.62), { p: [x, y, z], s: r })
      }
      for (const [x, y, z] of [[0.7, 0.05, 0.5], [-0.75, -0.05, 0.35], [0.3, 0.6, 0.55]]) f.add(sph(8), shade(c, 1.25), { p: [x, y, z], s: 0.08, glow: 0.15 })
      eyes(f, { at: [0.33, 0.2, 0.92], boss })
      brows(f, shade(c, 0.45), { at: [0.33, 0.38, 0.88] })
      maw(f, { y: -0.12, z: 1.05, w: 0.62, teeth: 4 })
      f.both((s) => f.spike([s * 0.28, -0.22, 1.02], [s * 0.2, 1, 0.35], 0.06, 0.28, BONE))
      fourLegs(f, shade(c, 0.6), { x: 0.55, zf: 0.4, zb: -0.4, top: -0.45, r: 0.17 })
    },
  },

  // A lean, fast hound-bug: a long low body, four long jointed legs, swept-back ears and antennae.
  zippy: {
    build(f, c, boss) {
      f.add(blob('zippy', (x, y, z) => (1 + 0.04 * lumpy(x, y, z)) * (z > 0 ? 1 : 1 - z * 0.08)), c, { s: [0.62, 0.58, 1.05], p: [0, 0.05, -0.1] })
      f.add(blob('zipHead', (x, y, z) => 1 + 0.03 * lumpy(x * 2, y * 2, z * 2) + (z > 0.4 ? (z - 0.4) * 0.35 : 0)), shade(c, 1.05), { s: [0.5, 0.46, 0.55], p: [0, 0.32, 0.8] })
      f.add(blob('belly', () => 1), shade(c, 1.4), { s: [0.45, 0.25, 0.85], p: [0, -0.25, -0.05] })
      eyes(f, { at: [0.22, 0.42, 1.18], size: 0.11, boss })
      brows(f, shade(c, 0.45), { at: [0.22, 0.55, 1.12], w: 0.3 })
      maw(f, { y: 0.18, z: 1.27, w: 0.36, h: 0.07, teeth: 4, tooth: 0.09 })
      f.both((s) => {
        f.add(cone(6), shade(c, 0.7), { p: [s * 0.3, 0.75, 0.6], r: [-0.9, 0, s * -0.5], s: [0.12, 0.5, 0.06], wig: [0.03, 0, 9, s], ramp: [0, 1] })
        f.limb([s * 0.1, 0.7, 0.95], [s * 0.35, 1.15, 1.35], 0.025, 0.015, INK, { wig: [0.05, 0.05, 7, s], ramp: [0, 1], n: 4 })
        f.add(sph(6), 0xffe066, { p: [s * 0.35, 1.15, 1.35], s: 0.05, glow: 1, wig: [0.05, 0.05, 7, s] })
      })
      f.both((s) => {
        for (const [z, ph] of [[0.4, s > 0 ? 0 : Math.PI], [-0.5, s > 0 ? Math.PI : 0]]) f.leg([s * 0.35, -0.1, z], [s * 0.7, -0.2, z + 0.15], [s * 0.55, -1, z + 0.1], 0.09, shade(c, 0.55), ph, { lift: 0.18, stride: 0.28, claw: BONE })
      })
      tail(f, shade(c, 0.8), { root: [0, 0.05, -1.0], len: 0.9, r: 0.1, lift: 0.5, speed: 6 })
    },
  },

  // An armoured shell-ogre: a domed carapace of plates over a low head with an underbite,
  // tusks, and four elephant-thick legs.
  grumpus: {
    build(f, c, boss) {
      f.add(blob('grumpus', (x, y, z) => 1 + 0.05 * lumpy(x, y, z)), shade(c, 0.8), { s: [1.0, 0.85, 1.0], p: [0, -0.05, 0] })
      for (let i = 0; i < 4; i++) {
        f.add(blob('plate', (x, y, z) => (y < 0 ? 0.12 : 1) + 0.03 * lumpy(x * 3, y, z * 3)), shade(c, 1.0 + i * 0.05), { p: [0, 0.32 - i * 0.05, 0.42 - i * 0.38], s: [1.02 - i * 0.04, 0.8 - i * 0.06, 0.48], r: [-0.3 + i * 0.25, 0, 0] })
      }
      f.both((s) => f.add(blob('plate', (x, y, z) => (y < 0 ? 0.12 : 1)), shade(c, 0.9), { p: [s * 0.78, 0.0, 0], s: [0.42, 0.6, 0.8], r: [0, 0, s * -1.1] }))
      f.add(blob('grHead', (x, y, z) => 1 + 0.04 * lumpy(x * 2, y * 2, z * 2)), shade(c, 1.15), { p: [0, -0.15, 0.82], s: [0.62, 0.5, 0.45] })
      f.add(rbox(0.7, 0.24, 0.32), shade(c, 1.0), { p: [0, -0.48, 0.92] })
      eyes(f, { at: [0.25, -0.02, 1.15], size: 0.11, boss })
      brows(f, shade(c, 0.4), { at: [0.25, 0.12, 1.12], w: 0.34, tilt: 0.35 })
      maw(f, { y: -0.38, z: 1.08, w: 0.5, h: 0.08, teeth: 0 })
      f.both((s) => f.spike([s * 0.24, -0.45, 1.06], [s * 0.15, 1, 0.3], 0.07, 0.36, BONE))
      fourLegs(f, shade(c, 0.6), { x: 0.6, zf: 0.42, zb: -0.42, top: -0.4, r: 0.24, foot: shade(c, 0.4), stride: 0.15 })
      tail(f, shade(c, 0.7), { root: [0, -0.3, -0.85], len: 0.6, r: 0.18, lift: 0.1, speed: 2 })
    },
  },

  // A floating gas sac, veined and blistered, with a glowing vent on top and long stinging
  // tendrils trailing beneath. Its little grumpy face sits low on the front.
  bloater: {
    float: 0.12,
    build(f, c, boss) {
      f.add(blob('bloater', (x, y, z) => 1 + 0.05 * lumpy(x, y, z) + 0.04 * Math.sin(y * 9)), c, { s: [0.95, 0.85, 0.95], p: [0, 0.15, 0] })
      for (const [x, y, z, r] of [[0.65, 0.45, 0.35, 0.18], [-0.7, 0.35, 0.25, 0.16], [0.3, 0.75, -0.35, 0.2], [-0.45, 0.1, -0.7, 0.18], [0.75, -0.05, -0.35, 0.15], [-0.25, 0.8, 0.2, 0.13]]) {
        f.add(sph(10), 0xd4ff4a, { p: [x, y, z], s: r, glow: 0.9 })
      }
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * TAU
        f.limb([Math.sin(a) * 0.2, 0.95, Math.cos(a) * 0.2], [Math.sin(a) * 0.75, 0.25, Math.cos(a) * 0.75], 0.025, 0.02, shade(c, 0.55), { n: 4 })
      }
      f.add(cyl(0.6, 1, 10), shade(c, 0.55), { p: [0, 1.0, 0], s: [0.22, 0.2, 0.22] })
      f.add(torus(1, 0.25, 12), shade(c, 0.7), { p: [0, 1.1, 0], r: [Math.PI / 2, 0, 0], s: 0.16 })
      f.add(sph(8), 0xe6ff7a, { p: [0, 1.1, 0], s: [0.12, 0.04, 0.12], glow: 1.4 })
      eyes(f, { at: [0.26, -0.1, 0.82], size: 0.12, boss })
      brows(f, shade(c, 0.45), { at: [0.26, 0.04, 0.8], w: 0.32 })
      maw(f, { y: -0.36, z: 0.78, w: 0.36, h: 0.08, teeth: 3, tooth: 0.08 })
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU + 0.3
        const x = Math.sin(a) * 0.45
        const z = Math.cos(a) * 0.45
        const at = (p) => Math.min(1, Math.max(0, (-0.5 - p.y) / 0.6))
        const o = { wig: [0.04, 0.12, 3, a], side: 0.12, at }
        f.limb([x, -0.5, z], [x * 1.2, -0.85, z * 1.2], 0.07, 0.05, shade(c, 0.6), o)
        f.limb([x * 1.2, -0.85, z * 1.2], [x * 1.1, -1.15, z * 1.1], 0.05, 0.02, shade(c, 0.5), o)
      }
    },
  },

  // A spinning-top beetle: a ribbed conical shell ringed with blade fins and a glowing core
  // band, on three stubby legs.
  spinner: {
    build(f, c, boss) {
      f.add(lathe('top', [[0.02, -0.75], [0.45, -0.55], [0.95, -0.05], [0.9, 0.2], [0.55, 0.55], [0.18, 0.85], [0, 0.95]], 18), c)
      f.add(torus(1, 0.08, 24), 0xffe08a, { p: [0, 0.0, 0], r: [Math.PI / 2, 0, 0], s: [0.96, 0.96, 1], glow: 1.1 })
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU
        f.add(rbox(0.5, 0.06, 0.18, 0.03), shade(c, 0.55), { p: [Math.sin(a) * 1.05, -0.08, Math.cos(a) * 1.05], r: [0, a + 0.5, 0.2] })
      }
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU
        f.limb([Math.sin(a) * 0.3, 0.75, Math.cos(a) * 0.3], [Math.sin(a) * 0.82, 0.12, Math.cos(a) * 0.82], 0.04, 0.03, shade(c, 0.7), { n: 4 })
      }
      f.add(cone(8), BONE, { p: [0, 1.1, 0], s: [0.1, 0.35, 0.1] })
      eyes(f, { at: [0.28, 0.32, 0.62], size: 0.12, boss })
      brows(f, shade(c, 0.45), { at: [0.28, 0.47, 0.58], w: 0.3 })
      maw(f, { y: 0.12, z: 0.82, w: 0.42, h: 0.07, teeth: 3, tooth: 0.09 })
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * TAU + Math.PI / 3
        f.leg([Math.sin(a) * 0.35, -0.5, Math.cos(a) * 0.35], [Math.sin(a) * 0.62, -0.62, Math.cos(a) * 0.62], [Math.sin(a) * 0.6, -1, Math.cos(a) * 0.6], 0.08, shade(c, 0.5), i * 2.1, { lift: 0.1, stride: 0.12 })
      }
    },
  },

  // Two heads sharing one swollen body, a glowing seam where it is coming apart, and a
  // nucleus pulsing inside each half. Kill it and it splits into two splitlings.
  splitter: {
    build(f, c, boss) {
      f.add(blob('splitter', (x, y, z) => (1 + 0.05 * lumpy(x, y, z)) * (1 - 0.14 * Math.exp(-x * x * 30))), c, { s: [1.1, 0.85, 0.95], p: [0, -0.05, 0] })
      f.add(rbox(0.05, 1.0, 1.25, 0.02), 0xf0b0ff, { p: [0, 0.0, 0], glow: 1.2 })
      f.both((s) => {
        f.add(blob('splHead', (x, y, z) => 1 + 0.04 * lumpy(x * 2, y * 2, z * 2)), shade(c, 1.1), { p: [s * 0.48, 0.55, 0.45], s: [0.42, 0.38, 0.42], r: [0, 0, s * -0.2] })
        f.add(sph(10), 0xf6c8ff, { p: [s * 0.45, 0.0, -0.1], s: 0.26, glow: 1.0 })
        for (const dx of [-0.13, 0.13]) f.add(sph(10), boss ? EYE_BOSS : EYE, { p: [s * 0.48 + dx, 0.62, 0.8], s: 0.09, glow: boss ? 1.1 : 0.85 })
        f.add(rbox(0.3, 0.09, 0.12), shade(c, 0.4), { p: [s * 0.48, 0.74, 0.77], r: [0.2, 0, s * 0.15] })
        f.add(rbox(0.24, 0.06, 0.08), INK, { p: [s * 0.48, 0.42, 0.85] })
        f.spike([s * 0.6, 0.85, 0.3], [s * 0.5, 1, -0.3], 0.06, 0.3, BONE)
      })
      sixLegs(f, shade(c, 0.55), { inX: 0.7, fromY: -0.35, wide: 0.45, r: 0.1, zs: [0.4, -0.05, -0.5] })
    },
  },

  // A splitting's half: a small one-headed scuttler with a long whip tail.
  splitling: {
    build(f, c, boss) {
      f.add(blob('splitling', (x, y, z) => 1 + 0.05 * lumpy(x, y, z)), c, { s: [0.8, 0.7, 0.95], p: [0, -0.15, 0] })
      f.add(sph(10), 0xf6c8ff, { p: [0, 0.05, -0.15], s: 0.25, glow: 0.9 })
      eyes(f, { at: [0.22, 0.12, 0.8], size: 0.12, boss })
      brows(f, shade(c, 0.45), { at: [0.22, 0.27, 0.77], w: 0.28 })
      maw(f, { y: -0.2, z: 0.82, w: 0.34, h: 0.07, teeth: 3, tooth: 0.08 })
      sixLegs(f, shade(c, 0.55), { inX: 0.5, fromY: -0.35, wide: 0.55, r: 0.08, lift: 0.16, stride: 0.24 })
      tail(f, shade(c, 0.8), { root: [0, -0.1, -0.85], len: 1.0, r: 0.1, lift: 0.4, speed: 5 })
    },
  },

  // A jumper on two huge springy hind feet: an upright body, little clawed hands, tall ears
  // and a long balancing tail.
  hopper: {
    build(f, c, boss) {
      f.add(blob('hopper', (x, y, z) => (1 + 0.04 * lumpy(x, y, z)) * (y > 0 ? 1 - y * 0.12 : 1)), c, { s: [0.85, 0.95, 0.85], p: [0, 0.0, 0] })
      f.add(blob('belly', () => 1), shade(c, 1.4), { s: [0.58, 0.68, 0.4], p: [0, -0.1, 0.48] })
      eyes(f, { at: [0.3, 0.42, 0.72], size: 0.15, boss })
      brows(f, shade(c, 0.45), { at: [0.3, 0.6, 0.68], w: 0.34 })
      maw(f, { y: 0.15, z: 0.82, w: 0.42, h: 0.08, teeth: 2, tooth: 0.14 })
      f.both((s) => {
        f.add(blob('ear', (x, y, z) => 1 + 0.03 * lumpy(x, y * 3, z)), shade(c, 0.9), { p: [s * 0.35, 1.25, -0.1], s: [0.13, 0.5, 0.08], r: [-0.25, 0, s * -0.3], wig: [0, 0.05, 4, s], ramp: [0, 1] })
        f.add(blob('ear', () => 1), 0xffb0c0, { p: [s * 0.35, 1.25, -0.04], s: [0.08, 0.38, 0.04], r: [-0.25, 0, s * -0.3], wig: [0, 0.05, 4, s], ramp: [0, 1] })
        f.add(blob('haunch', (x, y, z) => 1 + 0.03 * lumpy(x * 2, y * 2, z * 2)), shade(c, 0.85), { p: [s * 0.62, -0.5, -0.2], s: [0.36, 0.48, 0.58] })
        f.add(rbox(0.3, 0.14, 0.9, 0.06), shade(c, 0.6), { p: [s * 0.62, -0.93, 0.25], wig: [0.12, 0.2, -1, s > 0 ? 0 : 0.6] })
        for (const dx of [-0.08, 0.08]) f.spike([s * 0.62 + dx, -0.95, 0.7], [0, -0.2, 1], 0.04, 0.18, BONE, { wig: [0.12, 0.2, -1, s > 0 ? 0 : 0.6] })
        f.limb([s * 0.55, 0.05, 0.4], [s * 0.42, -0.3, 0.75], 0.08, 0.06, c, { wig: [0.04, 0.04, 5, s], ramp: [0, 1] })
        for (const dx of [-0.05, 0.05]) f.spike([s * 0.42 + dx, -0.32, 0.78], [0, -0.6, 0.6], 0.025, 0.12, BONE)
      })
      tail(f, shade(c, 0.75), { root: [0, -0.4, -0.7], len: 1.3, r: 0.14, lift: -0.4, tip: null, speed: 2.6, sway: 0.2 })
    },
  },

  // A hunched, armour-crested guardian with both long arms reaching forward to hold its
  // mirror (the mirror itself is the separate, crackable shield).
  mirror: {
    rough: 0.45,
    metal: 0.3,
    build(f, c, boss) {
      f.add(blob('mirrorBody', (x, y, z) => (1 + 0.03 * lumpy(x, y, z)) * (y > 0.3 ? 1 - (y - 0.3) * 0.2 : 1)), shade(c, 0.55), { s: [0.82, 0.95, 0.78] })
      f.add(rbox(1.1, 0.75, 0.32), c, { p: [0, 0.05, 0.42], r: [-0.12, 0, 0] })
      f.add(blob('mirHead', () => 1), c, { p: [0, 0.82, 0.12], s: [0.5, 0.42, 0.55] })
      f.add(rbox(0.08, 0.4, 0.75, 0.03), shade(c, 1.2), { p: [0, 1.18, 0.05] })
      f.add(rbox(0.66, 0.12, 0.2), 0x7ad8ff, { p: [0, 0.82, 0.6], glow: 1.2 })
      f.both((s) => {
        f.add(blob('pauldron', (x, y, z) => (y < -0.1 ? 0.45 : 1)), shade(c, 1.15), { p: [s * 0.82, 0.5, 0], s: [0.42, 0.4, 0.48] })
        f.spike([s * 0.95, 0.75, 0], [s * 0.6, 1, -0.2], 0.08, 0.32, shade(c, 0.7))
        f.limb([s * 0.85, 0.3, 0.1], [s * 0.7, 0.2, 0.7], 0.15, 0.12, shade(c, 0.6))
        f.limb([s * 0.7, 0.2, 0.7], [s * 0.6, 0.35, 1.1], 0.12, 0.1, shade(c, 0.5))
      })
      f.both((s) => f.leg([s * 0.32, -0.6, 0], [s * 0.42, -0.8, 0.05], [s * 0.42, -1, 0.05], 0.18, shade(c, 0.45), s > 0 ? 0 : Math.PI, { lift: 0.08, stride: 0.12 }))
    },
  },

  // A glimmering crystal moth: a faceted gem body, glassy wings and feathered antennae.
  glimmer: {
    float: 0.2,
    rim: 0.65,
    build(f, c, boss) {
      f.add(gem(), c, { s: [0.45, 0.75, 0.45], glow: 0.35 })
      f.add(gem(), shade(c, 1.4), { s: [0.25, 0.5, 0.25], p: [0, 0.05, 0.1], glow: 1.2 })
      f.add(blob('glimHead', () => 1), shade(c, 0.85), { p: [0, 0.55, 0.32], s: [0.32, 0.3, 0.3] })
      eyes(f, { at: [0.15, 0.6, 0.55], size: 0.1, boss, slit: false })
      f.both((s) => {
        f.limb([s * 0.08, 0.8, 0.4], [s * 0.4, 1.2, 0.65], 0.025, 0.015, INK, { n: 4, wig: [0.04, 0.03, 6, s], ramp: [0, 1] })
        for (let k = 0; k < 4; k++) f.add(sph(5), shade(c, 1.3), { p: [s * (0.15 + k * 0.07), 0.9 + k * 0.08, 0.45 + k * 0.05], s: [0.05, 0.015, 0.03], glow: 0.6, wig: [0.04, 0.03, 6, s] })
      })
      wings(f, shade(c, 1.25), { at: [0.25, 0.2, -0.05], span: 1.15, chord: 0.9, speed: 14, flap: 0.4, glow: 0.45, tilt: 0.15, veins: shade(c, 0.6) })
      f.both((s) => f.add(sph(10), shade(c, 1.1), { p: [s * 0.7, -0.15, -0.15], s: [0.45, 0.02, 0.3], r: [0, s * 0.4, s * -0.35], glow: 0.35, wig: [0.2, 0, 14, 0.4], at: (p) => Math.max(0, (Math.abs(p.x) - 0.25) / 0.9) }))
      for (let i = 0; i < 3; i++) f.add(gem(), shade(c, 1.2), { p: [0, -0.75 - i * 0.12, 0], s: [0.06, 0.08, 0.06], glow: 1, wig: [0.04, 0, 3, i] })
    },
  },

  // A deep-sea angler: a huge underslung jaw of needle teeth and a glowing lure on a stalk.
  angler: {
    float: 0.1,
    build(f, c, boss) {
      const body = shade(c, 1.6)
      f.add(blob('angler', (x, y, z) => 1 + 0.05 * lumpy(x, y, z)), body, { s: [0.95, 0.85, 1.0] })
      f.add(blob('anglerJaw', (x, y, z) => 1 + 0.03 * lumpy(x * 2, y * 2, z * 2)), shade(c, 1.35), { s: [0.85, 0.42, 0.75], p: [0, -0.45, 0.35] })
      f.add(blob('belly', () => 1), shade(c, 2.4), { s: [0.7, 0.3, 0.6], p: [0, -0.6, 0.35] })
      f.add(rbox(1.2, 0.16, 0.3), INK, { p: [0, -0.2, 0.95], r: [0.2, 0, 0] })
      for (let i = 0; i < 9; i++) {
        const x = (i / 8 - 0.5) * 1.05
        const z = 1.04 - x * x * 0.45
        f.spike([x, -0.1, z], [0, -1, 0.35], 0.035, 0.24 + (i % 2) * 0.1, 0xf4f0ff)
        f.spike([x + 0.06, -0.32, z - 0.02], [0, 1, 0.45], 0.03, 0.22 + ((i + 1) % 2) * 0.1, 0xf4f0ff)
      }
      eyes(f, { at: [0.36, 0.28, 0.8], size: 0.11, boss })
      brows(f, shade(c, 0.6), { at: [0.36, 0.43, 0.76], w: 0.3 })
      f.limb([0, 0.85, 0.2], [0, 1.35, 0.55], 0.05, 0.035, shade(c, 0.7), { wig: [0.05, 0.08, 2.5, 0], ramp: [0, 1] })
      f.limb([0, 1.35, 0.55], [0, 1.25, 1.0], 0.035, 0.025, shade(c, 0.7), { wig: [0.08, 0.08, 2.5, 0], ramp: [0.5, 1] })
      f.add(sph(10), 0xc8f4ff, { p: [0, 1.15, 1.05], s: 0.14, glow: 2, wig: [0.08, 0.08, 2.5, 0] })
      f.both((s) => f.add(sph(10), shade(c, 1.2), { p: [s * 0.9, -0.1, 0], s: [0.4, 0.03, 0.3], r: [0, s * 0.3, s * 0.4], wig: [0.12, 0, 5, s], at: (p) => Math.max(0, Math.abs(p.x) - 0.7) * 2 }))
      tail(f, shade(c, 1.3), { root: [0, 0, -0.85], len: 0.7, r: 0.22, lift: 0.0, tip: null, sway: 0.25, speed: 4 })
      f.add(sph(10), shade(c, 1.1), { p: [0, 0.05, -1.6], s: [0.05, 0.4, 0.3], wig: [0, 0, 4, 0], side: 0.25 })
      for (let i = 0; i < 5; i++) f.add(sph(6), 0x9fe8ff, { p: [0.6 * Math.sin(i * 1.3), -0.2 + 0.1 * i, 0.5 * Math.cos(i * 1.9)], s: 0.05, glow: 1.4 })
    },
  },

  // A sea urchin: a ball of long spines, tube feet underneath and two eyes on stalks.
  urchin: {
    build(f, c, boss) {
      f.add(blob('urchin', (x, y, z) => 1 + 0.06 * lumpy(x * 2, y * 2, z * 2)), c, { s: 0.75, p: [0, -0.1, 0] })
      for (let i = 0; i < 46; i++) {
        const y = 1 - (i / 45) * 1.5
        const r = Math.sqrt(Math.max(0, 1 - y * y))
        const a = i * 2.39996
        const d = [Math.sin(a) * r, y, Math.cos(a) * r]
        if (y < -0.4) continue
        f.spike([d[0] * 0.7, d[1] * 0.7 - 0.1, d[2] * 0.7], d, 0.045, 0.6 + (i % 3) * 0.15, i % 4 ? shade(c, 1.3) : 0xff9ae0, { glow: i % 4 ? 0 : 0.6 })
      }
      f.both((s) => {
        f.limb([s * 0.22, 0.5, 0.45], [s * 0.3, 0.95, 0.7], 0.05, 0.04, shade(c, 0.6), { wig: [0.04, 0.04, 3, s], ramp: [0, 1] })
        f.add(sph(10), boss ? EYE_BOSS : EYE, { p: [s * 0.3, 1.0, 0.72], s: 0.12, glow: 0.9, wig: [0.04, 0.04, 3, s] })
      })
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU
        f.limb([Math.sin(a) * 0.4, -0.6, Math.cos(a) * 0.4], [Math.sin(a) * 0.6, -1, Math.cos(a) * 0.6], 0.06, 0.04, 0xffb0e8, { wig: [0.05, 0.05, -1, a], ramp: [0, 1] })
      }
    },
  },

  // A long eel: a head with a toothy grin and a body of segments rippling in an S-wave,
  // with a fin running down its back.
  eel: {
    float: 0.08,
    build(f, c, boss) {
      f.add(blob('eelHead', (x, y, z) => (1 + 0.03 * lumpy(x, y, z)) * (z > 0 ? 1 - z * 0.15 : 1)), c, { s: [0.62, 0.55, 0.9], p: [0, 0, 0.2] })
      eyes(f, { at: [0.3, 0.22, 0.68], size: 0.1, boss })
      maw(f, { y: -0.15, z: 0.92, w: 0.4, h: 0.08, teeth: 5, tooth: 0.1, lower: true, color: 0xf4fff0 })
      const n = 9
      for (let i = 0; i < n; i++) {
        const z = -0.5 - i * 0.42
        const r = 0.52 * (1 - i / (n + 2))
        const o = { wig: [0, 0, 5, i * 0.75], side: 0.08 + i * 0.05 }
        f.add(sph(12), i % 2 ? c : shade(c, 0.85), { p: [0, -0.15 - i * 0.02, z], s: [r, r * 0.9, 0.32], ...o })
        f.add(cone(5), shade(c, 0.55), { p: [0, -0.15 + r * 0.95, z], s: [0.04, r * 0.7, 0.2], ...o })
        if (i % 2 === 0) f.add(sph(6), 0xeaffa0, { p: [r * 0.75, -0.1, z], s: 0.05, glow: 1.2, ...o })
      }
      f.add(sph(10), shade(c, 0.6), { p: [0, -0.3, -0.5 - n * 0.42], s: [0.04, 0.38, 0.3], wig: [0, 0, 5, n * 0.75], side: 0.55 })
    },
  },

  // A fuzzy striped bee-beast: a round fur body, a stinger, buzzing glassy wings and six legs.
  bumble: {
    float: 0.15,
    build(f, c, boss) {
      f.add(blob('bumble', (x, y, z) => 1 + 0.06 * lumpy(x * 3, y * 3, z * 3)), c, { s: [0.85, 0.8, 1.0] })
      for (let i = 0; i < 3; i++) f.add(torus(1, 0.16, 20), INK, { p: [0, 0, -0.15 - i * 0.3], s: [0.84 - i * 0.12, 0.8 - i * 0.12, 0.8], r: [0, 0, 0] })
      f.spike([0, -0.1, -0.95], [0, -0.2, -1], 0.08, 0.45, INK)
      f.add(blob('bumHead', () => 1), shade(c, 0.85), { p: [0, 0.15, 0.85], s: [0.48, 0.44, 0.4] })
      eyes(f, { at: [0.22, 0.28, 1.12], size: 0.12, boss })
      brows(f, INK, { at: [0.22, 0.43, 1.08], w: 0.28 })
      f.both((s) => {
        f.limb([s * 0.12, 0.5, 1.0], [s * 0.3, 0.9, 1.3], 0.025, 0.02, INK, { n: 4, wig: [0.04, 0.04, 6, s], ramp: [0, 1] })
        f.add(sph(6), INK, { p: [s * 0.3, 0.9, 1.3], s: 0.06 })
        f.spike([s * 0.12, -0.05, 1.15], [s * 0.3, -1, 0.4], 0.04, 0.22, INK)
      })
      wings(f, 0xe8f6ff, { at: [0.25, 0.65, -0.05], span: 0.95, chord: 0.6, speed: 38, flap: 0.3, glow: 0.25, tilt: 0.45, veins: 0x8090a0 })
      sixLegs(f, INK, { inX: 0.45, fromY: -0.45, wide: 0.4, r: 0.05, zs: [0.35, 0, -0.35], lift: 0.08, stride: 0.1 })
    },
  },

  // A crab: a wide shell, two huge serrated claws held up front, eyes on stalks, six legs.
  snapper: {
    build(f, c, boss) {
      f.add(blob('snapper', (x, y, z) => (1 + 0.05 * lumpy(x, y, z)) * (y < -0.2 ? 0.8 : 1)), c, { s: [1.15, 0.55, 0.9], p: [0, -0.15, 0] })
      for (const [x, z] of [[0.5, 0.3], [-0.5, 0.3], [0.7, -0.2], [-0.7, -0.2], [0.2, -0.5], [-0.2, -0.5]]) f.add(sph(8), shade(c, 1.25), { p: [x, 0.25, z], s: [0.12, 0.06, 0.12] })
      maw(f, { y: -0.2, z: 0.82, w: 0.42, h: 0.08, teeth: 0 })
      for (let i = 0; i < 4; i++) f.limb([-0.12 + i * 0.08, -0.25, 0.85], [-0.14 + i * 0.09, -0.4, 0.9], 0.02, 0.01, shade(c, 0.6), { wig: [0.02, 0.02, 9, i], ramp: [0, 1], n: 4 })
      f.both((s) => {
        f.limb([s * 0.2, 0.2, 0.6], [s * 0.28, 0.6, 0.72], 0.05, 0.04, shade(c, 0.7), { wig: [0.03, 0.03, 3, s], ramp: [0, 1] })
        f.add(sph(10), boss ? EYE_BOSS : EYE, { p: [s * 0.28, 0.65, 0.74], s: 0.1, glow: 0.9, wig: [0.03, 0.03, 3, s] })
        f.add(sph(5), INK, { p: [s * 0.28, 0.65, 0.83], s: [0.03, 0.06, 0.03], wig: [0.03, 0.03, 3, s] })
        const arm = { wig: [0.06, 0.04, 2.2, s], ramp: [0, 1] }
        f.limb([s * 0.85, -0.1, 0.35], [s * 1.0, 0.15, 0.85], 0.12, 0.1, shade(c, 0.85), arm)
        f.add(blob('claw', (x, y, z) => 1 + 0.04 * lumpy(x * 2, y * 2, z * 2)), shade(c, 1.1), { p: [s * 1.0, 0.25, 1.15], s: [0.32, 0.28, 0.42], wig: [0.06, 0.04, 2.2, s] })
        f.add(cone(6), shade(c, 1.15), { p: [s * 0.92, 0.42, 1.55], r: [1.4, 0, 0], s: [0.1, 0.45, 0.12], wig: [0.06, 0.04, 2.2, s] })
        f.add(cone(6), shade(c, 0.9), { p: [s * 1.02, 0.12, 1.5], r: [1.75, 0, 0], s: [0.09, 0.38, 0.1], wig: [0.06, 0.04, 2.2, s] })
        for (let k = 0; k < 3; k++) f.spike([s * 0.92, 0.35, 1.35 + k * 0.1], [0, -1, 0.2], 0.025, 0.08, BONE, { wig: [0.06, 0.04, 2.2, s] })
      })
      sixLegs(f, shade(c, 0.7), { inX: 0.75, fromY: -0.3, wide: 0.6, r: 0.07, zs: [0.15, -0.2, -0.55], lift: 0.12, stride: 0.15 })
    },
  },

  // A walking toadstool: a broad spotted cap with glowing freckles, gills under the rim, a
  // stout stalk with a scowl, and root-feet.
  sporeling: {
    build(f, c, boss) {
      f.add(lathe('cap', [[0, 0.95], [0.5, 0.88], [0.95, 0.6], [1.15, 0.25], [1.05, 0.12], [0.5, 0.2], [0, 0.22]], 22), c)
      for (const [x, y, z, r] of [[0.4, 0.82, 0.3, 0.12], [-0.5, 0.75, 0.15, 0.1], [0.1, 0.92, -0.35, 0.13], [-0.25, 0.85, -0.6, 0.09], [0.7, 0.55, -0.4, 0.1], [-0.75, 0.5, 0.45, 0.09], [0.75, 0.48, 0.55, 0.08]]) {
        f.add(sph(8), 0xfff2e0, { p: [x, y, z], s: [r, r * 0.4, r], glow: 0.7 })
      }
      f.add(cyl(1, 1, 22), 0xd8b8a0, { p: [0, 0.18, 0], s: [1.0, 0.04, 1.0] })
      f.add(blob('stalk', (x, y, z) => 1 + 0.04 * lumpy(x * 2, y * 2, z * 2) + (y < -0.5 ? 0.15 : 0)), 0xead2bc, { p: [0, -0.35, 0], s: [0.55, 0.6, 0.55] })
      eyes(f, { at: [0.2, -0.15, 0.5], size: 0.1, boss })
      brows(f, 0x6a4a3a, { at: [0.2, -0.02, 0.48], w: 0.26 })
      maw(f, { y: -0.45, z: 0.5, w: 0.3, h: 0.07, teeth: 3, tooth: 0.07 })
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * TAU + 0.3
        f.leg([Math.sin(a) * 0.4, -0.7, Math.cos(a) * 0.4], [Math.sin(a) * 0.62, -0.78, Math.cos(a) * 0.62], [Math.sin(a) * 0.8, -1, Math.cos(a) * 0.8], 0.07, 0xb08a6a, i * 2.5, { lift: 0.08, stride: 0.1 })
      }
    },
  },

  // A ghost: a drifting hooded sheet with a tattered hem, hollow glowing eyes, wispy arms and
  // a halo spinning above.
  boogle: {
    float: 0.25,
    rim: 0.75,
    build(f, c, boss) {
      const sheet = lathe('sheet', [[0, 1], [0.35, 0.95], [0.55, 0.6], [0.6, 0.1], [0.72, -0.45], [0.88, -0.95]], 22)
      f.add(sheet, c, { wig: [0.04, 0.08, 3, 0], side: 0.06, at: (p) => Math.max(0, (0.2 - p.y) / 1.2) ** 2, glow: 0.15 })
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU
        f.add(cone(5), c, { p: [Math.sin(a) * 0.8, -1.08, Math.cos(a) * 0.8], r: [Math.PI, 0, 0], s: [0.16, 0.3, 0.16], wig: [0.06, 0.1, 3, a], side: 0.08, glow: 0.15 })
      }
      f.both((s) => {
        f.add(sph(10), INK, { p: [s * 0.2, 0.55, 0.5], s: [0.13, 0.18, 0.08] })
        f.add(sph(8), boss ? EYE_BOSS : 0xb8f0ff, { p: [s * 0.2, 0.55, 0.56], s: 0.065, glow: 2 })
        f.limb([s * 0.5, 0.25, 0.1], [s * 0.85, -0.05, 0.5], 0.14, 0.05, c, { wig: [0.08, 0.05, 2.5, s], ramp: [0, 1], glow: 0.15 })
      })
      f.add(sph(10), INK, { p: [0, 0.24, 0.58], s: [0.12, 0.09, 0.06] })
      f.add(torus(1, 0.08, 28), 0xfff0a0, { p: [0, 1.3, 0], r: [Math.PI / 2 - 0.15, 0, 0], s: 0.45, glow: 1.6, wig: [0.05, 0, 2, 0] })
    },
  },

  // A walking powder keg: a hooped barrel with stubby legs, a cross face carved in the front and
  // a sputtering fuse on top.
  kablooma: {
    build(f, c, boss) {
      // A barrel: bulging staves, iron hoops hugging it, a dark lid.
      const barrel = (y) => 0.86 * (1 - 0.16 * y * y)
      f.add(lathe('keg', [[0, 0.8], [barrel(0.8), 0.8], [barrel(0.4), 0.4], [barrel(0), 0], [barrel(-0.4), -0.4], [barrel(-0.8), -0.8], [0, -0.8]], 16), 0x7a5230)
      for (const y of [-0.6, -0.15, 0.15, 0.6]) f.add(torus(1, 0.045, 24), IRON, { p: [0, y, 0], r: [Math.PI / 2, 0, 0], s: [barrel(y) + 0.02, barrel(y) + 0.02, 1] })
      f.add(cyl(1, 1, 18), c, { p: [0, 0.82, 0], s: [0.74, 0.06, 0.74] })
      eyes(f, { at: [0.27, 0.36, 0.8], size: 0.12, boss })
      brows(f, INK, { at: [0.27, 0.5, 0.78], w: 0.34, tilt: 0.5 })
      maw(f, { y: -0.35, z: 0.84, w: 0.48, h: 0.12, teeth: 4, tooth: 0.11, color: 0xffb03a })
      f.limb([0, 0.85, 0], [0.12, 1.25, -0.1], 0.05, 0.035, 0x8a6a3a, { wig: [0, 0.06, 11, 0], ramp: [0, 1], n: 5 })
      f.add(sph(8), 0xffd36e, { p: [0.12, 1.3, -0.1], s: 0.11, glow: 2, wig: [0.04, 0.06, 11, 0] })
      f.add(sph(6), 0xff6a1a, { p: [0.14, 1.42, -0.1], s: 0.07, glow: 2, wig: [0.08, 0.06, 17, 1] })
      fourLegs(f, 0x3a2a20, { x: 0.45, zf: 0.35, zb: -0.35, top: -0.6, r: 0.13, lift: 0.14, stride: 0.16 })
    },
  },

  // An ice golem: a body of frosted crystal shards, glowing blue cracks and a cold breath.
  icicle: {
    rough: 0.3,
    rim: 0.7,
    build(f, c, boss) {
      f.add(blob('icicle', (x, y, z) => 1 + 0.12 * lumpy(x * 1.5, y * 1.5, z * 1.5)), c, { s: [0.8, 0.85, 0.75] })
      for (let i = 0; i < 12; i++) {
        const y = 0.9 - (i / 11) * 1.1
        const r = Math.sqrt(Math.max(0, 1 - y * y))
        const a = i * 2.4
        const d = V(Math.sin(a) * r, y, Math.cos(a) * r - 0.2)
        if (d.z > 0.4 && Math.abs(d.y) < 0.4) continue
        f.spike([d.x * 0.7, d.y * 0.7, d.z * 0.7], d.toArray(), 0.12, 0.5 + (i % 3) * 0.18, shade(c, 1.25), { n: 4, glow: 0.25 })
      }
      for (let i = 0; i < 6; i++) f.add(rbox(0.03, 0.4, 0.03, 0.01), 0x9ff4ff, { p: [Math.sin(i * 1.7) * 0.6, Math.cos(i * 2.3) * 0.4, 0.55], r: [0, 0, i], glow: 1.4 })
      eyes(f, { at: [0.25, 0.25, 0.7], size: 0.12, boss })
      brows(f, shade(c, 0.55), { at: [0.25, 0.4, 0.68], w: 0.3 })
      maw(f, { y: -0.1, z: 0.74, w: 0.4, h: 0.08, teeth: 4, tooth: 0.12, color: 0xeefcff })
      f.both((s) => {
        f.add(gem(), shade(c, 0.85), { p: [s * 0.8, 0.0, 0.2], s: [0.18, 0.3, 0.18], wig: [0.04, 0.06, 2.4, s], glow: 0.2 })
        f.add(gem(), shade(c, 1.1), { p: [s * 0.9, -0.4, 0.35], s: [0.15, 0.25, 0.15], wig: [0.04, 0.06, 2.4, s], glow: 0.2 })
        f.leg([s * 0.35, -0.55, 0], [s * 0.42, -0.78, 0.05], [s * 0.42, -1, 0.05], 0.15, shade(c, 0.7), s > 0 ? 0 : Math.PI, { lift: 0.1, stride: 0.14 })
      })
    },
  },

  // A cactus brute: a ribbed column with needle clusters, raised arms, a flower blooming on
  // its head and root-feet.
  prickle: {
    build(f, c, boss) {
      f.add(blob('cactus', (x, y, z) => 1 + 0.07 * Math.cos(Math.atan2(x, z) * 8) + 0.02 * lumpy(x, y, z)), c, { s: [0.62, 1.0, 0.62], p: [0, 0, 0] })
      for (let i = 0; i < 26; i++) {
        const y = 0.85 - (i / 25) * 1.6
        const a = i * 2.2
        const r = 0.62 * Math.sqrt(Math.max(0.1, 1 - y * y))
        f.spike([Math.sin(a) * r, y, Math.cos(a) * r], [Math.sin(a), 0.2, Math.cos(a)], 0.02, 0.18, 0xfff6c8, { n: 4 })
      }
      f.both((s) => {
        const arm = { wig: [0.04, 0.04, 2, s], ramp: [0, 1] }
        f.limb([s * 0.55, 0.0, 0], [s * 0.95, 0.05, 0], 0.18, 0.17, c, arm)
        f.limb([s * 0.95, 0.0, 0], [s * 0.95, 0.65, 0.05], 0.17, 0.14, c, arm)
        f.add(sph(10), c, { p: [s * 0.95, 0.65, 0.05], s: 0.14, ...arm })
        for (let k = 0; k < 4; k++) f.spike([s * (0.85 + (k % 2) * 0.2), 0.2 + k * 0.12, 0.1], [s, 0.3, 0.3], 0.02, 0.14, 0xfff6c8, { n: 4, ...arm })
      })
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU
        f.add(sph(8), 0xff6ab0, { p: [Math.sin(a) * 0.16, 1.02, Math.cos(a) * 0.16], s: [0.13, 0.05, 0.13], r: [Math.cos(a) * 0.5, 0, -Math.sin(a) * 0.5], glow: 0.3 })
      }
      f.add(sph(8), 0xffe066, { p: [0, 1.05, 0], s: 0.08, glow: 1 })
      eyes(f, { at: [0.2, 0.42, 0.56], size: 0.1, boss })
      brows(f, shade(c, 0.45), { at: [0.2, 0.55, 0.54], w: 0.26 })
      maw(f, { y: 0.15, z: 0.6, w: 0.34, h: 0.07, teeth: 3, tooth: 0.08 })
      f.both((s) => f.leg([s * 0.28, -0.75, 0], [s * 0.42, -0.85, 0.05], [s * 0.5, -1, 0.1], 0.13, 0x8a6a3a, s > 0 ? 0 : Math.PI, { lift: 0.08, stride: 0.12 }))
    },
  },

  // A will-o-wisp: a teardrop of living flame with licking tongues, a white-hot core and embers
  // circling it.
  wispy: {
    float: 0.3,
    rim: 0.9,
    build(f, c, boss) {
      f.add(lathe('flame', [[0, -0.75], [0.45, -0.6], [0.62, -0.2], [0.55, 0.25], [0.32, 0.7], [0, 1.25]], 18), c, { glow: 0.55, wig: [0.04, 0, 7, 0], side: 0.05, at: (p) => Math.max(0, p.y) })
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU
        f.add(cone(6), shade(c, 1.2), { p: [Math.sin(a) * 0.35, 0.7, Math.cos(a) * 0.35], r: [Math.cos(a) * 0.35, 0, -Math.sin(a) * 0.35], s: [0.14, 0.6, 0.14], glow: 0.9, wig: [0.08, 0.05, 9 + i, a], side: 0.06, ramp: [0, 1] })
      }
      f.both((s) => {
        f.add(sph(10), INK, { p: [s * 0.2, 0.1, 0.56], s: [0.13, 0.15, 0.06] })
        f.add(sph(8), boss ? EYE_BOSS : 0xffffff, { p: [s * 0.2, 0.1, 0.6], s: 0.07, glow: 2 })
      })
      f.add(sph(10), INK, { p: [0, -0.2, 0.6], s: [0.16, 0.07, 0.05] })
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * TAU
        f.add(gem(), 0xffd06a, { p: [Math.sin(a) * 0.95, Math.sin(a * 2) * 0.25, Math.cos(a) * 0.95], s: 0.07, glow: 1.6, wig: [0.15, 0.12, 2.5, a], side: 0.12 })
      }
    },
  },

  // An armoured rhino-beetle: a plated back, a long spiral drill-horn on its snout and four
  // planted legs.
  drillbit: {
    rough: 0.4,
    metal: 0.35,
    build(f, c, boss) {
      f.add(blob('drill', (x, y, z) => (1 + 0.04 * lumpy(x, y, z)) * (z > 0 ? 1 + 0.08 * y : 0.92)), shade(c, 0.75), { s: [0.9, 0.8, 1.15] })
      for (let i = 0; i < 4; i++) f.add(blob('plate', (x, y, z) => (y < 0 ? 0.12 : 1)), shade(c, 1.0 + i * 0.04), { p: [0, 0.2, 0.6 - i * 0.42], s: [0.95 - Math.abs(i - 1.5) * 0.06, 0.78, 0.4], r: [-0.25 + i * 0.15, 0, 0] })
      f.add(blob('drHead', () => 1), shade(c, 0.85), { p: [0, -0.05, 0.98], s: [0.45, 0.4, 0.38] })
      for (let i = 0; i < 4; i++) f.add(cyl(0.95 - i * 0.22, 1.05 - i * 0.22, 10), i % 2 ? IRON : 0xc8ccd6, { p: [0, 0.05, 1.25 + i * 0.18], r: [Math.PI / 2, 0, 0], s: [0.24, 0.18, 0.24] })
      f.add(cone(10), 0xe0e4ee, { p: [0, 0.05, 2.05], r: [Math.PI / 2, 0, 0], s: [0.09, 0.4, 0.09] })
      for (let i = 0; i < 5; i++) f.add(torus(1, 0.12, 10), IRON, { p: [0, 0.05, 1.3 + i * 0.15], s: [0.24 - i * 0.04, 0.24 - i * 0.04, 0.24] })
      eyes(f, { at: [0.25, 0.1, 1.2], size: 0.09, boss })
      brows(f, shade(c, 0.4), { at: [0.25, 0.22, 1.17], w: 0.26 })
      fourLegs(f, shade(c, 0.5), { x: 0.6, zf: 0.5, zb: -0.5, top: -0.35, r: 0.15, foot: IRON })
    },
  },

  // A whirlwind spirit: a twisting funnel of wind with rings of debris whirling round it and a
  // scowl in the eye of the storm.
  twister: {
    float: 0.2,
    rim: 0.75,
    build(f, c, boss) {
      f.add(lathe('funnel', [[0.15, -1], [0.3, -0.6], [0.45, -0.1], [0.75, 0.45], [1.05, 0.95], [0.9, 1.05], [0, 0.95]], 20), c, { glow: 0.2, wig: [0, 0, 4, 0], side: 0.12, at: (p) => Math.max(0, (p.y + 1) / 2) })
      for (let i = 0; i < 4; i++) f.add(torus(1, 0.05, 28), shade(c, 1.3), { p: [0, -0.6 + i * 0.45, 0], r: [Math.PI / 2 + 0.2 * (i % 2 ? 1 : -1), 0, 0], s: 0.35 + i * 0.2, glow: 0.6, wig: [0.05, 0, 3, i], side: 0.06 })
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * TAU
        f.add(rbox(0.16, 0.1, 0.12, 0.03), 0x7a6a5a, { p: [Math.sin(a) * (0.7 + (i % 3) * 0.2), -0.4 + (i % 4) * 0.35, Math.cos(a) * (0.7 + (i % 3) * 0.2)], r: [i, i * 2, 0], wig: [0.12, 0.15, 3 + (i % 3), a], side: 0.15 })
      }
      eyes(f, { at: [0.22, 0.55, 0.75], size: 0.12, boss, slit: false })
      brows(f, shade(c, 0.4), { at: [0.22, 0.7, 0.72], w: 0.3 })
      f.add(rbox(0.35, 0.08, 0.08), INK, { p: [0, 0.35, 0.8] })
    },
  },

  // ---- the shady guests (logic/shadyGuests.js) ----

  // The paparazzo: a lanky, hunched creature in a trench coat and fedora, peering down a long-lens
  // camera held up at its right cheek (the aiming laser comes out of that lens, see characters.js).
  paparazzo: {
    rough: 0.55,
    build(f, c, boss) {
      const coat = shade(c, 0.8)
      f.add(lathe('trench', [[0.0, 0.55], [0.42, 0.5], [0.55, 0.0], [0.62, -0.55], [0.7, -0.8]]), coat, { p: [0, -0.05, 0] })
      f.add(rbox(0.16, 0.9, 0.06, 0.02), shade(c, 0.55), { p: [0, -0.2, 0.6], r: [-0.12, 0, 0] })
      f.add(blob('papHead', (x, y, z) => 1 + 0.03 * lumpy(x * 2, y * 2, z * 2) + (z > 0.4 && y < 0 ? 0.25 * z : 0)), c, { p: [0, 0.82, 0.12], s: [0.42, 0.4, 0.44] })
      eyes(f, { at: [0.15, 0.9, 0.48], size: 0.09, boss })
      brows(f, shade(c, 0.45), { at: [0.15, 1.0, 0.46], w: 0.22 })
      maw(f, { y: 0.66, z: 0.52, w: 0.26, h: 0.06, teeth: 3, tooth: 0.07 })
      // Fedora with a PRESS card.
      f.add(cyl(1, 1, 18), 0x2b2838, { p: [0, 1.2, 0.1], s: [0.62, 0.04, 0.62] })
      f.add(cyl(0.85, 1, 16), 0x2b2838, { p: [0, 1.34, 0.1], s: [0.36, 0.26, 0.36] })
      f.add(cyl(1, 1, 16), 0xc9a64a, { p: [0, 1.27, 0.1], s: [0.37, 0.06, 0.37] })
      f.add(rbox(0.18, 0.11, 0.02, 0.01), 0xfff6d8, { p: [0.12, 1.34, 0.46], r: [0, 0, -0.25] })
      // The camera: body, long lens, glinting glass, flash bulb.
      f.add(rbox(0.5, 0.34, 0.3), 0x1d1b26, { p: [0.62, 0.22, 0.62] })
      f.add(cyl(0.9, 1, 16), 0x1d1b26, { p: [0.67, 0.22, 0.95], r: [Math.PI / 2, 0, 0], s: [0.16, 0.42, 0.16] })
      f.add(cyl(1, 1, 16), 0x9fd8ff, { p: [0.67, 0.22, 1.17], r: [Math.PI / 2, 0, 0], s: [0.12, 0.03, 0.12], glow: 1 })
      f.add(rbox(0.2, 0.12, 0.1), 0xfffbe6, { p: [0.5, 0.45, 0.6], glow: 0.6 })
      // Arms up to the camera, legs under the coat.
      f.limb([0.45, 0.4, 0.15], [0.55, 0.05, 0.45], 0.1, 0.08, coat)
      f.limb([0.55, 0.05, 0.45], [0.6, 0.15, 0.6], 0.08, 0.07, coat)
      f.limb([-0.45, 0.4, 0.15], [-0.15, 0.05, 0.55], 0.1, 0.08, coat)
      f.limb([-0.15, 0.05, 0.55], [0.38, 0.15, 0.68], 0.08, 0.07, coat)
      f.both((s) => f.leg([s * 0.2, -0.75, 0], [s * 0.24, -0.88, 0.04], [s * 0.24, -1, 0.06], 0.1, 0x2b2838, s > 0 ? 0 : Math.PI, { lift: 0.1, stride: 0.18 }))
      f.both((s) => f.add(rbox(0.16, 0.08, 0.28), INK, { p: [s * 0.24, -0.97, 0.12], wig: [0.1, 0.18, -1, s > 0 ? 0 : Math.PI] }))
    },
  },

  // The gopher: a round, buck-toothed burrower with big digging claws, a dirt-smudged belly and a
  // golf flag stuck in its head from the last hole it came up through.
  gopher: {
    build(f, c, boss) {
      f.add(blob('gopher', (x, y, z) => 1 + 0.05 * lumpy(x, y, z) - (y < -0.5 ? (-y - 0.5) * 0.3 : 0)), c, { s: [0.95, 0.9, 1.0], p: [0, -0.08, 0] })
      f.add(blob('belly', () => 1), shade(c, 1.4), { s: [0.66, 0.6, 0.4], p: [0, -0.2, 0.55] })
      for (const [x, y, z] of [[0.3, -0.35, 0.82], [-0.2, -0.5, 0.78], [0.05, -0.15, 0.9]]) f.add(blob('dirt', (a, b, d) => 1 + 0.25 * lumpy(a * 3, b * 3, d * 3)), 0x6a4a2a, { p: [x, y, z], s: 0.1 })
      f.add(blob('snout', () => 1), shade(c, 1.2), { p: [0, 0.12, 0.88], s: [0.32, 0.22, 0.2] })
      f.add(sph(8), 0x3a2418, { p: [0, 0.2, 1.05], s: [0.09, 0.06, 0.05] })
      f.both((s) => f.add(rbox(0.12, 0.2, 0.05, 0.02), 0xfffbef, { p: [s * 0.065, -0.07, 1.02] }))
      eyes(f, { at: [0.26, 0.42, 0.78], size: 0.1, boss })
      brows(f, shade(c, 0.45), { at: [0.26, 0.55, 0.74], w: 0.26 })
      f.both((s) => {
        f.add(sph(10), shade(c, 0.8), { p: [s * 0.5, 0.65, 0.1], s: [0.17, 0.17, 0.07] })
        f.add(sph(10), 0xffb0a0, { p: [s * 0.5, 0.65, 0.14], s: [0.1, 0.1, 0.03] })
        // Big digging paws held up in front, claws out.
        f.limb([s * 0.6, -0.1, 0.45], [s * 0.45, -0.35, 0.85], 0.13, 0.11, shade(c, 0.85), { wig: [0.05, 0.06, 6, s], ramp: [0, 1] })
        for (const dx of [-0.07, 0, 0.07]) f.spike([s * 0.45 + dx, -0.42, 0.92], [0, -0.7, 0.6], 0.03, 0.16, BONE, { wig: [0.05, 0.06, 6, s] })
      })
      fourLegs(f, shade(c, 0.6), { x: 0.42, zf: 0.25, zb: -0.4, top: -0.55, r: 0.15, lift: 0.08, stride: 0.15 })
      // The golf flag.
      f.add(cyl(1, 1, 6), 0xf2f2f2, { p: [-0.18, 1.15, -0.15], r: [0, 0, 0.15], s: [0.025, 0.75, 0.025] })
      f.add(rbox(0.32, 0.2, 0.02, 0.005), 0xff4d5e, { p: [-0.05, 1.42, -0.15], wig: [0, 0, 7, 0], side: 0.08, at: (p) => Math.max(0, (p.x + 0.18) / 0.32) })
    },
  },

  // The Bellhop Bandit: a nimble, ring-tailed creature in a burglar's mask and a bellhop's pillbox
  // cap, a bulging loot sack slung over its back.
  bandit: {
    build(f, c, boss) {
      f.add(blob('bandit', (x, y, z) => 1 + 0.04 * lumpy(x, y, z)), c, { s: [0.72, 0.78, 0.82], p: [0, -0.05, 0] })
      f.add(blob('belly', () => 1), shade(c, 1.45), { s: [0.5, 0.55, 0.3], p: [0, -0.15, 0.55] })
      f.add(blob('banditHead', () => 1), c, { p: [0, 0.65, 0.3], s: [0.48, 0.4, 0.45] })
      f.add(blob('muzzle', () => 1), shade(c, 1.5), { p: [0, 0.55, 0.7], s: [0.2, 0.15, 0.18] })
      f.add(sph(8), INK, { p: [0, 0.6, 0.86], s: [0.06, 0.045, 0.04] })
      // The mask: a dark band across the eyes.
      f.add(rbox(0.86, 0.17, 0.2, 0.06), 0x16141c, { p: [0, 0.74, 0.55] })
      eyes(f, { at: [0.17, 0.75, 0.68], size: 0.08, boss })
      f.both((s) => f.add(cone(6), shade(c, 0.8), { p: [s * 0.3, 1.0, 0.22], r: [0, 0, s * -0.3], s: [0.11, 0.22, 0.08] }))
      // The pillbox cap.
      f.add(cyl(0.9, 1, 16), 0xd2334a, { p: [0.05, 1.08, 0.25], r: [0, 0, -0.2], s: [0.2, 0.18, 0.2] })
      f.add(torus(1, 0.1, 18), 0xf2c14e, { p: [0.04, 1.02, 0.25], r: [Math.PI / 2, 0, -0.2], s: 0.21, glow: 0.2 })
      // The loot sack, a crystal glinting at its mouth.
      f.add(blob('sack', (x, y, z) => 1 + 0.08 * lumpy(x * 2, y * 2, z * 2)), 0xc9a36a, { p: [0, 0.35, -0.75], s: [0.5, 0.55, 0.45], wig: [0.04, 0, 9, 0] })
      f.add(cone(8), 0xa8834c, { p: [0, 0.95, -0.72], s: [0.14, 0.22, 0.14], wig: [0.04, 0, 9, 0] })
      f.add(gem(), 0x7ff2ff, { p: [0.1, 1.1, -0.68], s: [0.07, 0.11, 0.07], glow: 1.2, wig: [0.04, 0, 9, 0] })
      f.limb([0.35, 0.4, 0.1], [0.1, 0.95, -0.55], 0.08, 0.06, c)
      fourLegs(f, shade(c, 0.6), { x: 0.36, zf: 0.3, zb: -0.3, top: -0.5, r: 0.11, lift: 0.16, stride: 0.26 })
      tail(f, shade(c, 0.7), { root: [0, -0.3, -0.6], len: 0.9, r: 0.13, lift: 0.4, tip: null, sway: 0.3, speed: 4 })
      for (let i = 0; i < 3; i++) f.add(torus(1, 0.3, 12), 0x16141c, { p: [0, -0.3 + 0.4 * ((i + 1) / 3) ** 2, -0.6 - 0.27 * (i + 1)], r: [Math.PI / 2, 0, 0], s: 0.11 - i * 0.02, wig: [0, 0, 4, 0], side: 0.3 * ((i + 1) / 3) })
    },
  },

  // ---- the original seven bosses' own forms ----

  // King Gloop: a huge dripping slime with bubbles rising inside it and a crown sunk in its top.
  boss_gloop: {
    rim: 0.6,
    build(f, c) {
      f.add(blob('gloop', (x, y, z) => 1 + 0.06 * lumpy(x, y, z) - (y < -0.5 ? (-y - 0.5) * 0.2 : 0) + (y < -0.2 ? 0.08 : 0)), c, { s: [1.1, 0.9, 1.05], glow: 0.08 })
      for (let i = 0; i < 9; i++) f.add(sph(8), shade(c, 1.6), { p: [Math.sin(i * 2.1) * 0.5, -0.5 + (i % 5) * 0.25, Math.cos(i * 1.7) * 0.5], s: 0.06 + (i % 3) * 0.03, glow: 0.8 })
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * TAU + 0.4
        f.add(blob('drip', () => 1), c, { p: [Math.sin(a) * 0.9, -0.55 - (i % 2) * 0.15, Math.cos(a) * 0.85], s: [0.14, 0.3, 0.14], wig: [0.05, 0, 2, a] })
      }
      crown(f, 0.98, 0.62)
      eyes(f, { at: [0.33, 0.2, 0.98], size: 0.16, boss: true })
      brows(f, shade(c, 0.4), { at: [0.33, 0.4, 0.94], w: 0.46 })
      maw(f, { y: -0.2, z: 1.08, w: 0.8, h: 0.14, teeth: 6, tooth: 0.15, lower: true })
    },
  },
  // Zipzilla: the zippy hound grown into a crested monster.
  boss_zipzilla: { like: 'zippy' },
  // Sir Grumpsalot: the shell-ogre in spiked plate, wearing a crown.
  boss_grumpsalot: { like: 'grumpus', extra: (f) => crown(f, 0.2, 0.36, 0.82) },
  // Doctor Wobble: a brain floating in a glass tank, carried on writhing tentacles.
  boss_wobble: {
    rough: 0.25,
    metal: 0.3,
    rim: 0.7,
    build(f, c) {
      // An open frame (no glass, so the brain shows), bubbling with glowing fluid.
      for (let i = 0; i < 7; i++) f.add(sph(8), 0x9fe8ff, { p: [Math.sin(i * 2.3) * 0.5, -0.35 + i * 0.16, Math.cos(i * 1.9) * 0.45], s: 0.05 + (i % 3) * 0.02, glow: 1.2, wig: [0.06, 0, 2 + i * 0.3, i] })
      f.add(cyl(1, 1, 20), IRON, { p: [0, 0.8, 0], s: [0.85, 0.12, 0.85] })
      f.add(cyl(1, 1, 20), IRON, { p: [0, -0.48, 0], s: [0.85, 0.14, 0.85] })
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * TAU + Math.PI / 4
        f.add(rbox(0.08, 1.3, 0.08, 0.02), IRON, { p: [Math.sin(a) * 0.8, 0.15, Math.cos(a) * 0.8] })
      }
      f.add(blob('brain', (x, y, z) => 1 + 0.1 * Math.sin(x * 14) * Math.sin(z * 9) + 0.06 * Math.sin(y * 18)), shade(c, 1.2), { p: [0, 0.22, 0], s: [0.62, 0.5, 0.58], glow: 0.35, wig: [0.03, 0, 3, 0] })
      f.add(rbox(0.04, 0.45, 1.0, 0.02), shade(c, 0.5), { p: [0, 0.42, 0] })
      eyes(f, { at: [0.22, 0.12, 0.58], size: 0.12, boss: true })
      brows(f, shade(c, 0.5), { at: [0.22, 0.28, 0.55], w: 0.3 })
      f.add(sph(8), 0xff5ad6, { p: [0, 0.95, 0], s: 0.12, glow: 2 })
      f.add(cyl(1, 1, 6), IRON, { p: [0, 0.9, 0], s: [0.04, 0.2, 0.04] })
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU
        const x = Math.sin(a) * 0.5
        const z = Math.cos(a) * 0.5
        f.leg([x, -0.55, z], [x * 1.6, -0.6, z * 1.6], [x * 1.9, -1, z * 1.9], 0.1, shade(c, 0.6), i * 2.1, { lift: 0.12, stride: 0.15 })
      }
    },
  },
  // The Cone Father: a towering hooded robe with a pointed cowl, burning eyes in the dark and two
  // floating hands, a ring of runes spinning round its hem.
  boss_conefather: {
    float: 0.12,
    rim: 0.7,
    build(f, c) {
      f.add(lathe('robe', [[0, 1.35], [0.12, 1.2], [0.4, 0.55], [0.55, 0.05], [0.72, -0.5], [0.95, -1]], 22), shade(c, 0.6), { wig: [0.03, 0.06, 2.4, 0], side: 0.04, at: (p) => Math.max(0, (0 - p.y) / 1) ** 2 })
      f.add(sph(12), INK, { p: [0, 0.52, 0.36], s: [0.3, 0.34, 0.16] })
      f.both((s) => f.add(sph(8), EYE_BOSS, { p: [s * 0.12, 0.56, 0.52], s: [0.075, 0.045, 0.03], glow: 2 }))
      f.add(torus(1, 0.04, 26), 0xffd36e, { p: [0, 0.05, 0], r: [Math.PI / 2, 0, 0], s: 0.6, glow: 0.8 })
      f.both((s) => {
        f.add(blob('hand', (x, y, z) => 1 + 0.05 * lumpy(x * 3, y * 3, z * 3)), shade(c, 1.2), { p: [s * 0.95, 0.1, 0.45], s: [0.16, 0.2, 0.14], wig: [0.08, 0.04, 1.8, s] })
        for (let k = 0; k < 3; k++) f.spike([s * (0.92 + k * 0.04), 0.25, 0.5], [0, 1, 0.2], 0.025, 0.14, shade(c, 1.2), { wig: [0.08, 0.04, 1.8, s] })
      })
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU
        f.add(gem(), 0x8ac8ff, { p: [Math.sin(a) * 1.2, -0.6, Math.cos(a) * 1.2], s: [0.07, 0.12, 0.07], glow: 1.5, wig: [0.1, 0, 2, a] })
      }
    },
  },
  // Madam Mayhem: a spiked horror with four scything bone arms.
  boss_mayhem: {
    build(f, c) {
      f.add(blob('mayhem', (x, y, z) => 1 + 0.08 * lumpy(x, y, z)), c, { s: [0.95, 0.95, 0.9] })
      spikesAt(f, [[0.5, 0.7, -0.3], [-0.5, 0.7, -0.3], [0, 0.85, -0.5], [0.75, 0.3, -0.5], [-0.75, 0.3, -0.5], [0.3, 0.9, 0], [-0.3, 0.9, 0]], BONE, [0.1, 0.45])
      eyes(f, { at: [0.3, 0.25, 0.82], size: 0.13, boss: true })
      f.both((s) => f.add(sph(8), EYE_BOSS, { p: [s * 0.15, 0.48, 0.8], s: 0.08, glow: 1.1 }))
      brows(f, shade(c, 0.4), { at: [0.3, 0.4, 0.8], w: 0.4 })
      maw(f, { y: -0.2, z: 0.88, w: 0.6, h: 0.13, teeth: 6, tooth: 0.14, lower: true })
      f.both((s) => {
        for (const [y, ph] of [[0.25, 0], [-0.25, 1.4]]) {
          const o = { wig: [0.08, 0.1, 3, s + ph], ramp: [0, 1] }
          f.limb([s * 0.8, y, 0.1], [s * 1.25, y + 0.3, 0.3], 0.1, 0.07, shade(c, 0.7), o)
          f.spike([s * 1.25, y + 0.3, 0.3], [s * 0.2, -0.4, 1], 0.07, 0.65, BONE, o)
        }
      })
      sixLegs(f, shade(c, 0.5), { inX: 0.55, fromY: -0.45, wide: 0.5, r: 0.09 })
    },
  },
  // Omega Jello: a vast many-eyed mass with a ring of shards orbiting it.
  boss_omega: {
    rim: 0.65,
    build(f, c) {
      f.add(blob('omega', (x, y, z) => 1 + 0.09 * lumpy(x * 1.2, y * 1.2, z * 1.2) - (y < -0.5 ? (-y - 0.5) * 0.25 : 0)), c, { s: [1.1, 0.95, 1.05], glow: 0.06 })
      for (const [x, y, z, r] of [[0.3, 0.25, 0.85, 0.15], [-0.32, 0.22, 0.86, 0.15], [0, 0.55, 0.75, 0.12], [0.6, 0.5, 0.5, 0.1], [-0.6, 0.48, 0.5, 0.1], [0.75, 0.0, 0.55, 0.08], [-0.78, 0.05, 0.5, 0.08], [0.3, 0.8, 0.35, 0.08], [-0.25, 0.82, 0.35, 0.07]]) {
        f.add(sph(10), EYE_BOSS, { p: [x, y, z], s: r, glow: 1.1 })
        f.add(sph(6), INK, { p: [x, y, z + r * 0.85], s: [r * 0.22, r * 0.6, r * 0.2] })
      }
      maw(f, { y: -0.3, z: 0.92, w: 0.9, h: 0.16, teeth: 7, tooth: 0.17, lower: true })
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU
        f.add(gem(), shade(c, 1.4), { p: [Math.sin(a) * 1.45, 0.2 + Math.sin(a * 3) * 0.2, Math.cos(a) * 1.45], s: [0.09, 0.2, 0.09], glow: 1.3, wig: [0.15, 0.1, 2.2, a], side: 0.1 })
      }
    },
  },
}

// Every regular monster's boss form is its own creature, grown and dressed up.
const BOSS_OF = {
  boss_blobbo: 'blobbo', boss_zippy: 'zippy', boss_grumpus: 'grumpus', boss_bloater: 'bloater', boss_spinner: 'spinner',
  boss_splitter: 'splitter', boss_mirror: 'mirror', boss_hopper: 'hopper', boss_glimmer: 'glimmer', boss_bumble: 'bumble',
  boss_snapper: 'snapper', boss_sporeling: 'sporeling', boss_boogle: 'boogle', boss_kablooma: 'kablooma', boss_icicle: 'icicle',
  boss_prickle: 'prickle', boss_wispy: 'wispy', boss_drillbit: 'drillbit', boss_twister: 'twister', boss_eel: 'eel',
  boss_angler: 'angler', boss_urchin: 'urchin',
}

// A golden crown with gems, sitting at height y (scaled by s).
function crown(f, y, s, z = 0) {
  f.add(cyl(0.5, 0.42, 18), 0xffc847, { p: [0, y, z], s: [s, s * 0.3, s], glow: 0.15 })
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU
    f.add(cone(5), 0xffc847, { p: [Math.sin(a) * 0.47 * s, y + s * (0.22 + (i % 2) * 0.07), z + Math.cos(a) * 0.47 * s], s: [0.09 * s, (0.26 + (i % 2) * 0.14) * s, 0.09 * s], glow: 0.15 })
    f.add(gem(), i % 2 ? 0xff4a6a : 0x7fd0ff, { p: [Math.sin(a) * 0.48 * s, y, z + Math.cos(a) * 0.48 * s], s: 0.055 * s, glow: 1.2 })
  }
}

// The boss dressing: curling horns and a spiked ridge.
function bossDressing(f, c) {
  f.both((s) => {
    f.spike([s * 0.42, 0.72, 0.15], [s * 0.6, 1, -0.15], 0.11, 0.42, BONE)
    f.spike([s * 0.7, 1.05, -0.05], [s * 0.2, 1, -0.8], 0.065, 0.3, BONE)
  })
  ridge(f, shade(c, 0.45), { n: 5, from: 0.55, to: 1.55, r: 0.08, len: 0.32, radius: 0.85 })
}

// How a type's body is drawn: { build, float, rim, rough, metal } (bosses resolved to a design).
function designFor(type) {
  const own = BEASTS[type]
  if (own?.build) return { boss: type.startsWith('boss_'), ...own, own: true }
  const base = own?.like ?? BOSS_OF[type]
  if (base && BEASTS[base]) return { ...BEASTS[base], boss: true, extra: own?.extra }
  return null
}

export function hasBeast(type) {
  return !!designFor(type)
}

const geometries = new Map()
// The baked geometry for a type (cached; shared by every monster of that type). Its feet stand
// on y = 0, and it is unit sized (scale it by the monster's size / 2).
export function beastGeometry(type, color) {
  const key = `${type}:${color}`
  if (geometries.has(key)) return geometries.get(key)
  const design = designFor(type)
  const f = forge()
  design.build(f, color, design.boss)
  if (design.boss && !design.own) bossDressing(f, color)
  design.extra?.(f, color)
  const geometry = f.done()
  geometry.translate(0, 1, 0)
  geometry.computeBoundingSphere()
  geometry.userData.shared = true // never disposed with a monster
  geometries.set(key, geometry)
  return geometry
}

// Look settings for a type: how much it bobs, its rim glow, roughness and metalness.
export function beastLook(type) {
  const d = designFor(type) ?? {}
  return { float: d.float ?? 0, rim: d.rim ?? (d.boss ? 0.62 : 0.5), rough: d.rough ?? 0.62, metal: d.metal ?? 0 }
}

// The per-monster animation driver: walking legs step faster the faster it goes and settle
// when it stops; everything else sways on its own clock.
export function createBeastAnimator(material) {
  const u = material.userData.beast
  let amount = 0
  return {
    update(dt, speed, time) {
      const moving = Math.min(1, speed / 2)
      amount += (moving - amount) * (1 - Math.exp(-8 * dt))
      u.uWalkA.value = amount
      u.uWalkT.value += dt * (4 + speed * 2.6)
      u.uTime.value += dt
    },
  }
}
