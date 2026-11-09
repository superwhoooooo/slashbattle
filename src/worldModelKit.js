// The building blocks of the Wilds' scenery models (worldArena.js, frontierModels.js): every model is a list of
// `part`s (a geometry with its colour baked into vertex colours, placed and turned), merged per kind.
import * as THREE from 'three'
import { mulberry32 } from './logic/world.js'

// One part of a model: a geometry, a colour, and where it sits. Parts are merged (with the colour baked
// into vertex colours) into one geometry per kind, so a whole forest is a few draw calls.
export function part(geometry, color, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1 } = {}) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry
  g.rotateX(rx)
  g.rotateY(ry)
  g.rotateZ(rz)
  g.scale(sx, sy, sz)
  g.translate(x, y, z)
  const c = new THREE.Color(color)
  const colors = new Float32Array(g.attributes.position.count * 3)
  for (let i = 0; i < colors.length; i += 3) {
    colors[i] = c.r
    colors[i + 1] = c.g
    colors[i + 2] = c.b
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  g.deleteAttribute('uv')
  return g
}

// A tapered limb from point a to point b (radius ra at a, rb at b): trunks and branches that can curve and fork.
export const UP = new THREE.Vector3(0, 1, 0)
export function limb(a, b, ra, rb, color, seg = 6) {
  const from = new THREE.Vector3(...a)
  const to = new THREE.Vector3(...b)
  const dir = to.clone().sub(from)
  const g = part(new THREE.CylinderGeometry(rb, ra, dir.length(), seg), color)
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().normalize()))
  g.translate(...from.clone().add(to).multiplyScalar(0.5).toArray())
  return g
}

export const cyl = (rt, rb, h, seg = 7) => new THREE.CylinderGeometry(rt, rb, h, seg)
export const cone = (r, h, seg = 7) => new THREE.ConeGeometry(r, h, seg)
export const ico = (r, d = 0) => new THREE.IcosahedronGeometry(r, d)
export const dodeca = (r) => new THREE.DodecahedronGeometry(r)
export const box = (w, h, d) => new THREE.BoxGeometry(w, h, d)
export const oct = (r) => new THREE.OctahedronGeometry(r)
// A flat, pointed leaf card (a diamond), for fringes of leaves that catch the light.
export const leaf = (w, h) => new THREE.CircleGeometry(1, 4).scale(w, h, 1)
// Scatters `n` leaf cards on a ring around (cx, cy, cz): hanging down and turned outward, in rotating shades.
export function leafFringe(n, cx, cy, cz, radius, colors, seed, drop = 0.35) {
  const rand = mulberry32(seed)
  const out = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rand() * 0.5
    const r = radius * (0.75 + rand() * 0.45)
    const y = cy + (rand() - 0.5) * 0.9 - drop
    out.push(part(leaf(0.2 + rand() * 0.1, 0.42 + rand() * 0.2), colors[i % colors.length], { x: cx + Math.cos(a) * r, y, z: cz + Math.sin(a) * r, rx: -0.5 - rand() * 0.6, ry: -a + Math.PI / 2, rz: (rand() - 0.5) * 0.7 }))
  }
  return out
}
export const dome = (r) => new THREE.SphereGeometry(r, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2)

