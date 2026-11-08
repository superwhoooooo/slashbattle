// The look of the free roam world (rules in logic/world.js): a vast floating continent under a twilight
// sky of two moons, its ground painted by biome, with scenery that streams in and out around the player.
//
//   createWorldArena()  - same shape as arena.js's createArena result, plus `arena.world`:
//       setProps(list)  - (re)build every instanced prop from the loaded chunks' props
//       update(pos, t)  - move the sky and fireflies with the player, tint the fog by biome
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { HEMI_LIGHT_INTENSITY, KEY_LIGHT_OFFSET, KEY_LIGHT_SHADOW_EXTENT, SHADOW_MAP_SIZE, SKY_RADIUS } from './config.js'
import { BIOMES, LAKES, WATER_LEVEL, WORLD_RADIUS, biomeAt, groundColorAt, heightAt, mulberry32 } from './logic/world.js'

// Stand-in for a logic/levels.js entry, so the sky/environment-map code can treat the world like a place.
export const WORLD_LEVEL = {
  name: 'The Wilds',
  sky: { top: '#0b0a2e', horizon: '#7a4fb0', ground: '#2a2352' },
  light: { key: 0xcfd8ff, hemiSky: 0xb8b0ff, hemiGround: 0x4a3d78, sun: 0xd9d2ff },
}

const FOG_COLOR = 0x2a2352
const MAX_PER_KIND = 500

// ---- scenery models ---------------------------------------------------------------------------

// One part of a model: a geometry, a colour, and where it sits. Parts are merged (with the colour baked
// into vertex colours) into one geometry per kind, so a whole forest is a few draw calls.
function part(geometry, color, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1 } = {}) {
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
const UP = new THREE.Vector3(0, 1, 0)
function limb(a, b, ra, rb, color, seg = 6) {
  const from = new THREE.Vector3(...a)
  const to = new THREE.Vector3(...b)
  const dir = to.clone().sub(from)
  const g = part(new THREE.CylinderGeometry(rb, ra, dir.length(), seg), color)
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().normalize()))
  g.translate(...from.clone().add(to).multiplyScalar(0.5).toArray())
  return g
}

const cyl = (rt, rb, h, seg = 7) => new THREE.CylinderGeometry(rt, rb, h, seg)
const cone = (r, h, seg = 7) => new THREE.ConeGeometry(r, h, seg)
const ico = (r, d = 0) => new THREE.IcosahedronGeometry(r, d)
const dodeca = (r) => new THREE.DodecahedronGeometry(r)
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d)
const oct = (r) => new THREE.OctahedronGeometry(r)
// A flat, pointed leaf card (a diamond), for fringes of leaves that catch the light.
const leaf = (w, h) => new THREE.CircleGeometry(1, 4).scale(w, h, 1)
// Scatters `n` leaf cards on a ring around (cx, cy, cz): hanging down and turned outward, in rotating shades.
function leafFringe(n, cx, cy, cz, radius, colors, seed, drop = 0.35) {
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
const dome = (r) => new THREE.SphereGeometry(r, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2)

// kind -> { lit: [parts], glow: [parts] }. Lit parts are shaded stone / wood / ice; glow parts are bright
// bulbs, crystals and caps that shine on their own (and bloom).
const MODELS = {
  obelisk: () => ({
    lit: [part(cyl(0.35, 1.0, 8, 4), 0x6f63c9, { y: 4, ry: Math.PI / 4 }), part(box(2.6, 0.5, 2.6), 0x4d4496, { y: 0.25 })],
    glow: [part(oct(0.6), 0xe0d6ff, { y: 8.6, sy: 1.6 }), part(box(0.18, 5, 0.06), 0xb9a6ff, { y: 3.6, z: 0.62, sx: 1 })],
  }),
  standingStone: () => ({
    lit: [part(box(1.3, 3.4, 0.7), 0x7d7aa3, { y: 1.7, rz: 0.06 }), part(box(0.5, 1.2, 0.4), 0x5d5a85, { x: 0.9, y: 0.6, rz: -0.2 })],
    glow: [part(box(0.5, 0.08, 0.04), 0xb9a6ff, { y: 2.4, z: 0.36 })],
  }),
  mooncap: () => ({
    lit: [part(cyl(0.22, 0.34, 2.4, 7), 0xe9e2c8, { y: 1.2 })],
    glow: [part(dome(1.5), 0x45e0c4, { y: 2.3, sy: 0.75 }), part(dome(0.5), 0xd8fff2, { y: 2.9, x: 0.4, sy: 0.6 })],
  }),
  // A twisted, leaning trunk that flares into roots, forks into two boughs, and carries a lumpy canopy of teal,
  // blue and violet leaf-clumps studded with glowing spores.
  gloomTree: () => {
    const bark = 0x2b2038
    const bark2 = 0x3a2c4d
    return {
      lit: [
        part(cone(1.1, 1.0, 7), bark, { y: 0.45, sy: 1 }), // root flare
        part(cone(0.35, 1.6, 5), bark, { x: 0.8, y: 0.25, rz: -1.15 }),
        part(cone(0.3, 1.4, 5), bark, { x: -0.7, y: 0.25, z: 0.3, rz: 1.1 }),
        part(cone(0.3, 1.4, 5), bark, { x: 0.1, y: 0.25, z: -0.8, rx: 1.1 }),
        limb([0, 0.7, 0], [0.25, 2.2, 0.1], 0.5, 0.38, bark, 7),
        limb([0.25, 2.2, 0.1], [-0.1, 3.6, 0.35], 0.38, 0.3, bark2, 7),
        limb([-0.1, 3.6, 0.35], [-1.3, 5.0, 0.4], 0.3, 0.14, bark, 6), // left bough
        limb([-0.1, 3.6, 0.35], [1.2, 4.9, -0.2], 0.28, 0.13, bark, 6), // right bough
        limb([0.05, 3.0, 0.3], [0.9, 3.9, 0.9], 0.15, 0.07, bark2, 5),
        part(ico(1.25, 1), 0x1b8f7e, { x: -1.4, y: 5.4, z: 0.4, sy: 0.8 }),
        part(ico(1.5, 1), 0x23a88f, { x: 0.1, y: 5.9, z: 0.1, sy: 0.8 }),
        part(ico(1.2, 1), 0x2a6fb0, { x: 1.4, y: 5.2, z: -0.2, sy: 0.82 }),
        part(ico(0.95, 1), 0x4a4fc0, { x: 0.3, y: 6.6, z: -0.3, sy: 0.85 }),
        part(ico(0.85, 1), 0x7a4fd0, { x: -0.9, y: 6.2, z: -0.5, sy: 0.8 }),
        part(ico(0.8, 1), 0x1f8f9a, { x: 0.9, y: 6.3, z: 0.7, sy: 0.8 }),
        // Leaf cards fringing the canopy and drooping off the boughs.
        ...leafFringe(16, 0.1, 5.4, 0.1, 2.3, [0x2fd0b0, 0x35a0e0, 0x8a6cf0, 0x58e0c8], 11),
        ...leafFringe(9, -1.3, 4.8, 0.4, 1.2, [0x2fd0b0, 0x7a4fd0], 23, 0.6),
        ...leafFringe(9, 1.2, 4.7, -0.2, 1.2, [0x35a0e0, 0x58e0c8], 31, 0.6),
      ],
      glow: [
        part(ico(0.2, 1), 0xa6ffe6, { x: 1.2, y: 4.4, z: 0.6 }),
        part(ico(0.16, 1), 0xc9a6ff, { x: -1.5, y: 4.3, z: 0.7 }),
        part(ico(0.18, 1), 0x8ff5ff, { x: 0.4, y: 4.6, z: 1.5 }),
        part(ico(0.14, 1), 0xffa6f0, { x: -0.5, y: 5.2, z: 1.6 }),
        part(ico(0.15, 1), 0xa6ffe6, { x: 1.9, y: 5.0, z: -0.8 }),
      ],
    }
  },
  wisp: () => ({ lit: [], glow: [part(ico(0.34, 1), 0xbfffee, { y: 1.5 }), part(ico(0.6, 1), 0x6dffc9, { y: 1.5, sx: 1.2 })] }),
  crystal: () => ({
    lit: [part(dodeca(0.9), 0x6c4a8c, { y: 0.2, sy: 0.5 })],
    glow: [
      part(cyl(0.05, 0.5, 4.4, 6), 0xd89aff, { y: 2.2, rz: 0.1 }),
      part(cyl(0.04, 0.4, 3, 6), 0xff8be2, { x: 0.8, y: 1.4, rz: -0.35 }),
      part(cyl(0.04, 0.34, 2.2, 6), 0x9a8bff, { x: -0.7, y: 1.0, rz: 0.5 }),
    ],
  }),
  dunerock: () => ({ lit: [part(dodeca(1.6), 0x8a6aa8, { y: 0.7, sy: 0.65 }), part(dodeca(0.8), 0x6f5490, { x: 1.4, y: 0.3, sy: 0.6 })], glow: [] }),
  iceSpire: () => ({
    lit: [part(cone(0.9, 6, 5), 0xbfeaff, { y: 3 }), part(cone(0.5, 3.2, 5), 0x9bd6f5, { x: 1.0, y: 1.6, rz: -0.25 })],
    glow: [part(oct(0.3), 0xeaffff, { y: 5.4 })],
  }),
  // Wide drooping tiers, each turned a little from the last, with a cap of snow on every one and icicle glints.
  frostPine: () => ({
    lit: [
      part(cyl(0.16, 0.34, 2.0, 7), 0x4a3a30, { y: 1.0 }),
      part(cone(1.9, 1.7, 8), 0x2f6f80, { y: 1.9, ry: 0.0 }),
      part(cone(1.95, 0.5, 8), 0xeaf6ff, { y: 1.55 }),
      part(cone(1.55, 1.6, 8), 0x3b8294, { y: 3.0, ry: 0.4 }),
      part(cone(1.6, 0.45, 8), 0xeaf6ff, { y: 2.7, ry: 0.4 }),
      part(cone(1.2, 1.5, 7), 0x4a94a6, { y: 4.0, ry: 0.8 }),
      part(cone(1.25, 0.4, 7), 0xf2faff, { y: 3.75, ry: 0.8 }),
      part(cone(0.8, 1.5, 7), 0x5aa4b6, { y: 4.95, ry: 1.2 }),
      part(cone(0.85, 0.35, 7), 0xffffff, { y: 4.75, ry: 1.2 }),
      part(cone(0.35, 1.1, 6), 0xffffff, { y: 5.9 }),
    ],
    glow: [
      part(cone(0.07, 0.6, 4), 0xbff3ff, { x: 1.45, y: 1.25, z: 0.5, rx: Math.PI }),
      part(cone(0.07, 0.5, 4), 0xbff3ff, { x: -1.2, y: 1.25, z: -0.9, rx: Math.PI }),
      part(cone(0.06, 0.45, 4), 0xbff3ff, { x: 0.3, y: 2.5, z: 1.3, rx: Math.PI }),
      part(oct(0.16), 0xeaffff, { y: 6.5 }),
    ],
  }),
  obsidian: () => ({
    lit: [part(cone(0.9, 5, 4), 0x1a1620, { y: 2.5, ry: 0.4 }), part(cone(0.5, 3, 4), 0x2a2030, { x: 0.9, y: 1.5, rz: -0.3 })],
    glow: [part(box(0.08, 3.2, 0.08), 0xff6a2a, { y: 2.2, z: 0.35 })],
  }),
  emberRock: () => ({
    lit: [part(dodeca(1.5), 0x3a2420, { y: 0.8, sy: 0.75 })],
    glow: [part(oct(0.45), 0xff7a3a, { y: 1.9 }), part(oct(0.25), 0xffc060, { x: 0.8, y: 1.3 })],
  }),
  // A gnarled, forking snag with grasping roots and a hollow that glows from inside.
  deadTree: () => {
    const wood = 0x3a3a2a
    const grey = 0x4e4c3a
    return {
      lit: [
        part(cone(0.85, 0.9, 6), wood, { y: 0.4 }),
        part(cone(0.22, 1.5, 4), wood, { x: 0.8, y: 0.2, rz: -1.2 }),
        part(cone(0.2, 1.3, 4), wood, { x: -0.7, y: 0.2, z: 0.4, rz: 1.2 }),
        part(cone(0.2, 1.2, 4), wood, { x: 0.2, y: 0.2, z: -0.8, rx: 1.2 }),
        limb([0, 0.6, 0], [-0.2, 2.0, 0.1], 0.42, 0.3, wood, 6),
        limb([-0.2, 2.0, 0.1], [0.15, 3.4, -0.1], 0.3, 0.2, grey, 6),
        limb([0.15, 3.4, -0.1], [-0.2, 4.6, 0], 0.2, 0.08, wood, 5),
        limb([-0.2, 2.2, 0.1], [-1.5, 3.4, 0.4], 0.16, 0.06, wood, 5),
        limb([-1.0, 3.0, 0.3], [-1.6, 4.3, 0.2], 0.08, 0.03, wood, 4),
        limb([0.1, 3.0, -0.1], [1.4, 4.1, 0.1], 0.14, 0.05, wood, 5),
        limb([0.9, 3.7, 0.0], [1.3, 5.0, -0.3], 0.07, 0.025, wood, 4),
        limb([0.0, 4.0, -0.05], [0.7, 5.4, 0.3], 0.07, 0.025, wood, 4),
      ],
      glow: [part(ico(0.2, 1), 0xc6ff4a, { x: -0.05, y: 1.5, z: 0.33, sy: 1.6 })],
    }
  },
  lanternReed: () => ({
    lit: [part(cyl(0.04, 0.07, 2.8, 5), 0x4a5a2a, { y: 1.4, rz: 0.1 })],
    glow: [part(ico(0.28, 1), 0xdaff6a, { x: 0.15, y: 2.85 }), part(ico(0.55, 1), 0xa6e83a, { x: 0.15, y: 2.85 })],
  }),
  cottage: cottageModel(0x5a3d9a, 0x42306e),
  cottageTeal: cottageModel(0x2a8f9a, 0x1f6a76),
  cottageAmber: cottageModel(0xc9803a, 0x9a5f2a),
  hall: hallModel,
  well: () => ({
    lit: [
      part(cyl(1.15, 1.25, 0.9, 12), 0x8d86a3, { y: 0.45 }),
      part(cyl(0.95, 0.95, 0.12, 12), 0x5d5a85, { y: 0.92 }),
      part(box(0.18, 2.4, 0.18), 0x6a4a3a, { x: -1.0, y: 1.6 }),
      part(box(0.18, 2.4, 0.18), 0x6a4a3a, { x: 1.0, y: 1.6 }),
      part(cone(1.7, 0.9, 4), 0x5a3d9a, { y: 3.1, ry: Math.PI / 4 }),
    ],
    glow: [part(cyl(0.85, 0.85, 0.05, 12), 0x6df0ff, { y: 0.9 }), part(ico(0.2, 1), 0xffc870, { y: 2.3 })],
  }),
  lampPost: () => ({
    lit: [part(cyl(0.07, 0.12, 3.2, 6), 0x3a3550, { y: 1.6 }), part(cyl(0.22, 0.22, 0.12, 8), 0x3a3550, { y: 3.28 }), part(box(0.5, 0.1, 0.5), 0x3a3550, { y: 0.05 })],
    glow: [part(ico(0.32, 1), 0xffd990, { y: 3.65 }), part(ico(0.55, 1), 0xffb860, { y: 3.65 })],
  }),
  noticeBoard: () => ({
    lit: [
      part(box(0.2, 2.6, 0.2), 0x6a4a3a, { x: -1.0, y: 1.3 }),
      part(box(0.2, 2.6, 0.2), 0x6a4a3a, { x: 1.0, y: 1.3 }),
      part(box(2.4, 1.5, 0.12), 0x8a6a4a, { y: 1.9 }),
      part(box(2.6, 0.18, 0.3), 0x5a3d9a, { y: 2.78 }),
    ],
    glow: [
      part(box(0.5, 0.65, 0.04), 0xfff3d0, { x: -0.6, y: 1.95, z: 0.08 }),
      part(box(0.5, 0.65, 0.04), 0xffe3a0, { x: 0.1, y: 1.85, z: 0.08 }),
      part(box(0.4, 0.55, 0.04), 0xd0f0ff, { x: 0.7, y: 2.0, z: 0.08 }),
      part(ico(0.12, 1), 0xffc870, { x: 0, y: 2.95 }),
    ],
  }),
  ruinArch: () => ({
    lit: [
      part(box(1.1, 5.4, 1.1), 0x8d86a3, { x: -2.2, y: 2.7 }),
      part(box(1.1, 4.6, 1.1), 0x7d7893, { x: 2.2, y: 2.3, rz: 0.05 }),
      part(box(5.9, 1.0, 1.3), 0x9b94b3, { y: 5.6, rz: -0.03 }),
    ],
    glow: [part(box(2.6, 0.12, 0.05), 0xb9a6ff, { y: 5.05, z: 0.68 })],
  }),
  // A standing temple column: square plinth, fluted shaft, carved capital, a thread of rune light.
  column: () => ({
    lit: [
      part(box(1.7, 0.45, 1.7), 0x8d86a3, { y: 0.22 }),
      part(cyl(0.62, 0.72, 5.2, 8), 0xa7a0bd, { y: 3.05 }),
      part(cyl(0.78, 0.66, 0.4, 8), 0x9b94b3, { y: 5.85 }),
      part(box(1.8, 0.5, 1.8), 0x8d86a3, { y: 6.3 }),
    ],
    glow: [part(box(0.07, 3.4, 0.07), 0xb9a6ff, { x: 0.66, y: 3.0 }), part(ico(0.1, 1), 0xd9ccff, { y: 5.4, z: 0.7 })],
  }),
  // A snapped column: a jagged stump and a fallen drum lying beside it.
  columnBroken: () => ({
    lit: [
      part(box(1.7, 0.45, 1.7), 0x7d7893, { y: 0.22 }),
      part(cyl(0.62, 0.72, 2.2, 8), 0x9b94b3, { y: 1.55 }),
      part(cone(0.7, 0.9, 5), 0x8d86a3, { y: 3.1, ry: 0.4 }),
      part(cyl(0.6, 0.6, 1.4, 8), 0x8d86a3, { x: 1.5, y: 0.6, z: 0.6, rz: Math.PI / 2, ry: 0.5 }),
      part(box(0.8, 0.5, 0.6), 0x7d7893, { x: -1.3, y: 0.25, z: -0.8, ry: 0.7 }),
    ],
    glow: [],
  }),
  // A crumbling wall with a gap, a few stones tumbled at its foot, moss-green on the top course.
  ruinWall: () => ({
    lit: [
      part(box(3.4, 3.2, 0.9), 0x8d86a3, { x: -1.2, y: 1.6 }),
      part(box(2.2, 1.6, 0.9), 0x7d7893, { x: 2.2, y: 0.8 }),
      part(box(3.0, 0.3, 1.0), 0x5f7a52, { x: -1.2, y: 3.3 }),
      part(box(0.7, 0.5, 0.6), 0x9b94b3, { x: 1.0, y: 0.25, z: 0.9, ry: 0.5 }),
      part(box(0.5, 0.4, 0.5), 0x7d7893, { x: 3.2, y: 1.9, z: 0.1, ry: 0.2, rz: 0.2 }),
    ],
    glow: [],
  }),
  // The shrine: a stepped altar, an arch of two pillars and a lintel, a crystal hanging in the doorway.
  shrine: () => ({
    lit: [
      part(box(4.2, 0.35, 4.2), 0x8d86a3, { y: 0.17 }),
      part(box(3.0, 0.35, 3.0), 0x9b94b3, { y: 0.52 }),
      part(box(0.7, 3.6, 0.7), 0xa7a0bd, { x: -1.2, y: 2.5 }),
      part(box(0.7, 3.6, 0.7), 0xa7a0bd, { x: 1.2, y: 2.5 }),
      part(box(3.4, 0.6, 0.9), 0x8d86a3, { y: 4.6 }),
      part(cone(0.9, 0.7, 4), 0x7d7893, { y: 5.25, ry: Math.PI / 4 }),
    ],
    glow: [part(oct(0.5), 0x9ff0ff, { y: 2.6, sy: 1.5 }), part(ico(0.9, 1), 0x6dd8ff, { y: 2.6 }), part(box(2.2, 0.05, 2.2), 0xb9a6ff, { y: 0.72 })],
  }),
  // A ruined watchtower: a thick round shaft with arrow slits, a broken crown of battlements, a low doorway.
  tower: () => {
    const lit = [
      part(cyl(2.9, 3.2, 1.0, 10), 0x7d7893, { y: 0.5 }),
      part(cyl(2.4, 2.8, 10.5, 10), 0x8d86a3, { y: 6.0 }),
      part(cyl(2.8, 2.5, 0.7, 10), 0x9b94b3, { y: 11.5 }),
      part(box(1.4, 1.5, 0.3), 0x2a2540, { y: 1.9, z: 2.7 }),
      part(cone(1.1, 1.4, 5), 0x7d7893, { x: -1.6, y: 12.5, z: 1.0 }),
    ]
    for (let i = 0; i < 7; i++) {
      if (i === 2 || i === 5) continue // gaps in the battlements
      const a = (i / 7) * Math.PI * 2
      lit.push(part(box(0.95, 0.9 + (i % 3) * 0.3, 0.8), 0x9b94b3, { x: Math.cos(a) * 2.5, y: 12.1, z: Math.sin(a) * 2.5, ry: -a }))
    }
    return { lit, glow: [part(box(0.22, 1.3, 0.1), 0xffd990, { x: 0, y: 6.4, z: 2.45 }), part(box(0.22, 1.3, 0.1), 0xffd990, { x: 2.35, y: 8.4, z: 0.4, ry: 1.4 }), part(ico(0.4, 1), 0xb9a6ff, { y: 12.4 })] }
  },
  // The temple floor: two wide flagstone steps with a glowing rune ring (the columns, wall and shrine are props of their own).
  temple: () => ({
    lit: [part(cyl(12.5, 12.8, 0.1, 20), 0x8a84a0, { y: 0.05 }), part(cyl(9.8, 10.0, 0.18, 20), 0x9b94b3, { y: 0.1 })],
    glow: [part(new THREE.TorusGeometry(7.4, 0.07, 4, 40), 0xb9a6ff, { y: 0.22, rx: Math.PI / 2 }), part(new THREE.TorusGeometry(4.6, 0.05, 4, 32), 0x9ff0ff, { y: 0.22, rx: Math.PI / 2 })],
  }),
}

// ---- village buildings ---------------------------------------------------------------------------------

// A cottage: cream walls on a stone footing, a steep pitched roof in `roof`, a chimney, a door facing +z and
// two lit windows. The roof colour tells one house from the next.
function cottageModel(roof, roofDark) {
  return () => ({
    lit: [
      part(box(4.6, 0.5, 4.0), 0x8a8498, { y: 0.25 }), // footing
      part(box(4.2, 2.5, 3.6), 0xeadfc8, { y: 1.75 }), // walls
      part(cone(3.9, 2.4, 4), roof, { y: 4.2, ry: Math.PI / 4, sz: 0.88 }), // roof
      part(cone(3.95, 0.35, 4), roofDark, { y: 3.15, ry: Math.PI / 4, sz: 0.9 }), // eaves
      part(box(0.6, 1.8, 0.6), 0x7d7893, { x: 1.2, y: 4.8, z: -0.7 }), // chimney
      part(box(1.0, 1.7, 0.16), 0x4a3556, { y: 1.35, z: 1.84 }), // door
      part(box(0.14, 1.0, 0.14), 0x8a6a4a, { x: -2.15, y: 1.5, z: 1.78 }), // timber trim
      part(box(0.14, 1.0, 0.14), 0x8a6a4a, { x: 2.15, y: 1.5, z: 1.78 }),
    ],
    glow: [
      part(box(0.8, 0.8, 0.1), 0xffe3a0, { x: -1.35, y: 2.0, z: 1.82 }),
      part(box(0.8, 0.8, 0.1), 0xffe3a0, { x: 1.35, y: 2.0, z: 1.82 }),
      part(box(0.1, 0.8, 0.8), 0xffe3a0, { x: 2.12, y: 2.0, z: 0 }),
      part(ico(0.18, 1), 0xffc870, { x: 0, y: 2.05, z: 2.1 }), // a lantern by the door
    ],
  })
}

// The village hall: a long house with two gables and a bell turret.
function hallModel() {
  return {
    lit: [
      part(box(7.4, 0.5, 5.0), 0x8a8498, { y: 0.25 }),
      part(box(7.0, 3.0, 4.6), 0xf0e6d2, { y: 2.0 }),
      part(cone(4.2, 2.8, 4), 0x5a3d9a, { x: -1.8, y: 4.9, ry: Math.PI / 4, sz: 0.95 }),
      part(cone(4.2, 2.8, 4), 0x5a3d9a, { x: 1.8, y: 4.9, ry: Math.PI / 4, sz: 0.95 }),
      part(box(1.4, 2.2, 1.4), 0xeadfc8, { x: 0, y: 5.4, z: -0.4 }),
      part(cone(1.2, 1.5, 4), 0x3a8aa0, { x: 0, y: 7.3, z: -0.4, ry: Math.PI / 4 }),
      part(box(1.5, 2.1, 0.16), 0x4a3556, { y: 1.6, z: 2.34 }),
    ],
    glow: [
      part(box(0.9, 0.9, 0.1), 0xffe3a0, { x: -2.4, y: 2.3, z: 2.32 }),
      part(box(0.9, 0.9, 0.1), 0xffe3a0, { x: 2.4, y: 2.3, z: 2.32 }),
      part(box(0.5, 0.7, 0.1), 0xffe3a0, { x: 0, y: 5.5, z: 0.32 }),
      part(ico(0.22, 1), 0xffc870, { x: -1.1, y: 2.5, z: 2.6 }),
      part(ico(0.22, 1), 0xffc870, { x: 1.1, y: 2.5, z: 2.6 }),
    ],
  }
}

// Glow parts are drawn unlit and over-bright so the bloom pass picks them up.
const GLOW_BRIGHTNESS = 1.9

function createPropBatch(kind) {
  const model = MODELS[kind]()
  const make = (parts, material) => {
    if (!parts.length) return null
    const mesh = new THREE.InstancedMesh(mergeGeometries(parts), material, MAX_PER_KIND)
    mesh.count = 0
    mesh.frustumCulled = false
    return mesh
  }
  const lit = make(model.lit, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0.05, flatShading: true, side: THREE.DoubleSide }))
  if (lit) {
    lit.castShadow = true
    lit.receiveShadow = true
  }
  const glow = make(model.glow, new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color(GLOW_BRIGHTNESS, GLOW_BRIGHTNESS, GLOW_BRIGHTNESS), fog: true }))
  return { lit, glow }
}

// ---- ground, sky ------------------------------------------------------------------------------

// A tiled speckle-and-blade texture that breaks up the flat vertex colours, so the ground has grain up close.
function createGroundDetail() {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#d9d9d9'
  ctx.fillRect(0, 0, size, size)
  const rand = mulberry32(77)
  for (let i = 0; i < 1400; i++) {
    const v = 150 + Math.floor(rand() * 105)
    ctx.fillStyle = `rgba(${v},${v},${v},${0.18 + rand() * 0.25})`
    ctx.fillRect(rand() * size, rand() * size, 1 + rand() * 3, 1 + rand() * 3)
  }
  // Tiny tufts and pebbles, wrapped at the edges so the tile is seamless.
  for (let i = 0; i < 420; i++) {
    const x = rand() * size
    const y = rand() * size
    const len = 3 + rand() * 7
    const light = rand() < 0.5
    ctx.strokeStyle = light ? 'rgba(255,255,255,0.28)' : 'rgba(40,40,60,0.22)'
    ctx.lineWidth = 1
    for (const ox of [-size, 0, size]) {
      for (const oy of [-size, 0, size]) {
        ctx.beginPath()
        ctx.moveTo(x + ox, y + oy)
        ctx.lineTo(x + ox + (rand() - 0.5) * 4, y + oy - len)
        ctx.stroke()
      }
    }
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(150, 150)
  texture.anisotropy = 8
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function createGround() {
  const size = WORLD_RADIUS * 2
  const segments = 220
  const geometry = new THREE.PlaneGeometry(size, size, segments, segments)
  geometry.rotateX(-Math.PI / 2)
  const pos = geometry.attributes.position
  const colors = new Float32Array(pos.count * 3)
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i)
    let z = pos.getZ(i)
    const d = Math.hypot(x, z)
    if (d > WORLD_RADIUS) {
      // Pull the square's corners onto the circle, so the continent's rim is round.
      x *= WORLD_RADIUS / d
      z *= WORLD_RADIUS / d
      pos.setXYZ(i, x, 0, z)
    }
    pos.setY(i, heightAt(x, z))
    const [r, g, b] = groundColorAt(x, z)
    colors[i * 3] = r
    colors[i * 3 + 1] = g
    colors[i * 3 + 2] = b
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.computeVertexNormals() // lit like real hills, not a flat sheet
  const ground = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ vertexColors: true, map: createGroundDetail(), roughness: 0.96, metalness: 0 }))
  ground.receiveShadow = true
  return ground
}

// Every lake's water: a translucent disc at the surface level. The lake beds dip below it, so the disc only shows
// where the ground is under water.
function createLakes() {
  const group = new THREE.Group()
  const material = new THREE.MeshStandardMaterial({ color: 0x2f9ad8, emissive: 0x0b3a66, emissiveIntensity: 0.55, roughness: 0.12, metalness: 0.15, transparent: true, opacity: 0.66, depthWrite: false })
  for (const lake of LAKES) {
    const disc = new THREE.Mesh(new THREE.CircleGeometry(lake.radius * 1.55, 56).rotateX(-Math.PI / 2), material)
    disc.position.set(lake.x, WATER_LEVEL, lake.z)
    disc.renderOrder = 2
    group.add(disc)
  }
  return group
}

// The continent is a floating island: a dark rocky cone hangs beneath it, and a thin glowing rim marks the edge.
function createUnderside() {
  const group = new THREE.Group()
  const rock = new THREE.Mesh(
    new THREE.ConeGeometry(WORLD_RADIUS, 150, 56, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x241b3a, roughness: 1, flatShading: true, side: THREE.DoubleSide }),
  )
  rock.rotation.x = Math.PI
  rock.position.y = -75.2
  const rim = new THREE.Mesh(
    new THREE.RingGeometry(WORLD_RADIUS - 2.2, WORLD_RADIUS, 160),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(1.1, 0.9, 1.9), side: THREE.DoubleSide }),
  )
  rim.rotation.x = -Math.PI / 2
  rim.position.y = 0.04
  group.add(rock, rim)
  return group
}

function createSkyTexture(sky) {
  const canvas = document.createElement('canvas')
  canvas.width = 16
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createLinearGradient(0, 0, 0, 256)
  gradient.addColorStop(0, sky.top)
  gradient.addColorStop(0.25, '#3a2a78')
  gradient.addColorStop(0.5, sky.horizon)
  gradient.addColorStop(1, sky.ground)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 16, 256)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function createSky() {
  const group = new THREE.Group()
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(SKY_RADIUS, 32, 16),
    new THREE.MeshBasicMaterial({ map: createSkyTexture(WORLD_LEVEL.sky), side: THREE.BackSide, fog: false, depthWrite: false }),
  )
  group.add(dome)

  // Stars.
  const rng = mulberry32(99)
  const starCount = 900
  const positions = new Float32Array(starCount * 3)
  for (let i = 0; i < starCount; i++) {
    const theta = rng() * Math.PI * 2
    const phi = Math.acos(0.05 + rng() * 0.95) // upper hemisphere
    const r = SKY_RADIUS * 0.94
    positions[i * 3] = Math.sin(phi) * Math.cos(theta) * r
    positions[i * 3 + 1] = Math.cos(phi) * r
    positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * r
  }
  const starGeometry = new THREE.BufferGeometry()
  starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  group.add(new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.85, depthWrite: false })))

  // Two moons and a ringed world, low in the sky.
  const moon = (radius, color, x, y, z) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(radius, 24, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(1.3), fog: false }))
    m.position.set(x, y, z)
    group.add(m)
    return m
  }
  moon(34, 0xe6e0ff, -250, 190, -300)
  moon(16, 0xffb6e9, 300, 140, -220)
  const giant = moon(52, 0x6f5ad6, 120, 120, 380)
  const ring = new THREE.Mesh(new THREE.RingGeometry(70, 102, 64), new THREE.MeshBasicMaterial({ color: 0xc9b8ff, transparent: true, opacity: 0.45, side: THREE.DoubleSide, fog: false, depthWrite: false }))
  ring.position.copy(giant.position)
  ring.rotation.x = Math.PI / 2.4
  group.add(ring)
  return group
}

// Drifting motes of light around the player, tinted by the biome they are in.
function createFireflies() {
  const count = 260
  const base = new Float32Array(count * 3)
  const rng = mulberry32(5)
  for (let i = 0; i < count; i++) {
    const a = rng() * Math.PI * 2
    const r = Math.sqrt(rng()) * 60
    base[i * 3] = Math.cos(a) * r
    base[i * 3 + 1] = 0.4 + rng() * 5
    base[i * 3 + 2] = Math.sin(a) * r
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(base), 3))
  const material = new THREE.PointsMaterial({ color: 0xffffff, size: 0.22, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })
  const points = new THREE.Points(geometry, material)
  points.frustumCulled = false
  return { points, base }
}

// ---- grass --------------------------------------------------------------------------------------

const MAX_GRASS = 9000
// Per biome: the shade of a tuft's root and of its tip (it lerps along the blade, and by each tuft's own `tint`).
const GRASS_STYLE = {
  sanctum: { base: 0x4a4388, tip: 0xc9bdff },
  whisperwood: { base: 0x0f5a4a, tip: 0x6dffc9 },
  amethyst: { base: 0x5a2f78, tip: 0xf0a8ff },
  frostveil: { base: 0x5b8fa8, tip: 0xeaffff },
  emberwaste: { base: 0x2a1410, tip: 0xff9a4a },
  gloomfen: { base: 0x2a3a12, tip: 0xc6ff4a },
}

// One tuft: a fan of six bent blades, dark at the root and bright at the tip (baked into vertex colours),
// merged into one geometry so thousands of tufts are a single draw call. Normals point up so a blade never
// goes dark on its back face.
function createTuftGeometry() {
  const positions = []
  const colors = []
  const rand = mulberry32(31)
  const BLADES = 6
  for (let b = 0; b < BLADES; b++) {
    const angle = (b / BLADES) * Math.PI * 2 + rand() * 0.6
    const h = 0.75 + rand() * 0.6
    const w = 0.07 + rand() * 0.03
    const lean = 0.25 + rand() * 0.35
    const offset = 0.06 + rand() * 0.14
    // Blade-local points: base (left, right), mid (left, right), tip.
    const pts = [
      [-w, 0, 0, 0.0], [w, 0, 0, 0.0],
      [-w * 0.72, h * 0.55, lean * 0.3, 0.5], [w * 0.72, h * 0.55, lean * 0.3, 0.5],
      [0, h, lean, 1.0],
    ]
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const world = pts.map(([x, y, z, t]) => [x * cos + z * sin + Math.sin(angle) * offset, y, -x * sin + z * cos + Math.cos(angle) * offset, t])
    for (const [i, j, k] of [[0, 1, 3], [0, 3, 2], [2, 3, 4]]) {
      for (const idx of [i, j, k]) {
        const [x, y, z, t] = world[idx]
        positions.push(x, y, z)
        const shade = 0.35 + t * 0.65
        colors.push(shade, shade, shade) // the biome's base->tip colour is applied per tuft; this is just root-to-tip light
      }
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(positions.map((_, i) => (i % 3 === 1 ? 1 : 0)), 3))
  return geometry
}

// The grass: one InstancedMesh whose blades sway in the wind and shrink away with distance from the player
// (so tufts never pop in at the edge of the streamed area; they grow in as you approach).
function createGrass() {
  const uniforms = { uTime: { value: 0 }, uPlayer: { value: new THREE.Vector3() } }
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0, side: THREE.DoubleSide })
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime
    shader.uniforms.uPlayer = uniforms.uPlayer
    shader.vertexShader = `uniform float uTime;\nuniform vec3 uPlayer;\n${shader.vertexShader}`.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      vec4 tuftOrigin = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
      float fade = 1.0 - smoothstep(70.0, 112.0, length(tuftOrigin.xz - uPlayer.xz));
      transformed.y *= fade;
      float h = clamp(position.y / 1.1, 0.0, 1.0);
      float wind = sin(uTime * 1.6 + tuftOrigin.x * 0.31 + tuftOrigin.z * 0.23) * 0.24 + sin(uTime * 3.1 + tuftOrigin.x * 0.8 + tuftOrigin.z * 0.6) * 0.07;
      transformed.x += wind * h * h * fade;
      transformed.z += wind * 0.55 * h * h * fade;`,
    )
  }
  const mesh = new THREE.InstancedMesh(createTuftGeometry(), material, MAX_GRASS)
  mesh.count = 0
  mesh.frustumCulled = false
  mesh.receiveShadow = true
  return { mesh, uniforms }
}

// ---- drifting leaves, petals, flakes and embers ----------------------------------------------------

const LEAF_COUNT = 150
const LEAF_RANGE = 46
// What floats down (or, for embers, up) around the player in each biome.
const DRIFT = {
  sanctum: { colors: [0xe0d6ff, 0xb9a6ff], dir: -0.5, speed: 0.6, size: 0.1, spin: 1.2 },
  whisperwood: { colors: [0x2fd0b0, 0x6dffc9, 0xff9ae0, 0x8a6cf0], dir: -1, speed: 0.9, size: 0.16, spin: 2.4 },
  amethyst: { colors: [0xf0a8ff, 0xd89aff, 0xff8be2], dir: -0.7, speed: 0.7, size: 0.13, spin: 2.0 },
  frostveil: { colors: [0xffffff, 0xd8f4ff], dir: -1, speed: 1.3, size: 0.09, spin: 1.5 },
  emberwaste: { colors: [0xff7a3a, 0xffb060, 0xff4a1a], dir: 1, speed: 1.0, size: 0.08, spin: 3.0 },
  gloomfen: { colors: [0xc6ff4a, 0x8aff6a, 0xe0ff9a], dir: -0.35, speed: 0.5, size: 0.12, spin: 1.6 },
}

function createLeafFall() {
  const geometry = new THREE.CircleGeometry(1, 4).scale(0.6, 1, 1)
  const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, transparent: true, opacity: 0.95, fog: true, color: new THREE.Color(1.5, 1.5, 1.5) })
  const mesh = new THREE.InstancedMesh(geometry, material, LEAF_COUNT)
  mesh.frustumCulled = false
  const rand = mulberry32(404)
  const leaves = Array.from({ length: LEAF_COUNT }, () => ({ x: 0, y: 0, z: 0, phase: rand() * 10, spin: rand() * 2 - 1, tumble: rand() * Math.PI * 2, seed: rand(), placed: false }))
  mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(LEAF_COUNT * 3), 3)
  return { mesh, leaves, rand, lastTime: 0 }
}

// ---- the arena --------------------------------------------------------------------------------

export function createWorldArena() {
  const group = new THREE.Group()

  group.add(new THREE.HemisphereLight(WORLD_LEVEL.light.hemiSky, WORLD_LEVEL.light.hemiGround, HEMI_LIGHT_INTENSITY * 2.1))
  const keyLight = new THREE.DirectionalLight(WORLD_LEVEL.light.key, 1.8)
  keyLight.position.set(KEY_LIGHT_OFFSET.x, KEY_LIGHT_OFFSET.y, KEY_LIGHT_OFFSET.z)
  keyLight.castShadow = true
  keyLight.shadow.mapSize.set(SHADOW_MAP_SIZE, SHADOW_MAP_SIZE)
  Object.assign(keyLight.shadow.camera, { left: -KEY_LIGHT_SHADOW_EXTENT, right: KEY_LIGHT_SHADOW_EXTENT, top: KEY_LIGHT_SHADOW_EXTENT, bottom: -KEY_LIGHT_SHADOW_EXTENT, near: 1, far: 60 })
  group.add(keyLight)
  group.add(keyLight.target)

  group.add(createGround(), createUnderside())
  const lakes = createLakes()
  group.add(lakes)
  const sky = createSky()
  group.add(sky)

  const batches = {}
  for (const kind of Object.keys(MODELS)) {
    batches[kind] = createPropBatch(kind)
    if (batches[kind].lit) group.add(batches[kind].lit)
    if (batches[kind].glow) group.add(batches[kind].glow)
  }

  const flies = createFireflies()
  group.add(flies.points)
  const grass = createGrass()
  group.add(grass.mesh)
  const drift = createLeafFall()
  group.add(drift.mesh)
  const tmpColor = new THREE.Color()
  const tmpEuler = new THREE.Euler()
  const tmpScale = new THREE.Vector3()
  const tmpPos = new THREE.Vector3()

  const fog = new THREE.Fog(FOG_COLOR, 50, 185)
  const targetFog = new THREE.Color(FOG_COLOR)
  const flyColor = new THREE.Color(0xffffff)
  const matrix = new THREE.Matrix4()
  const quaternion = new THREE.Quaternion()
  const euler = new THREE.Euler()
  const up = new THREE.Vector3(0, 1, 0)

  const world = {
    // Rebuilds every instanced prop from the props of the chunks that are alive right now.
    setProps(props) {
      const counts = {}
      for (const p of props) {
        const batch = batches[p.kind]
        if (!batch) continue
        const i = counts[p.kind] ?? 0
        if (i >= MAX_PER_KIND) continue
        counts[p.kind] = i + 1
        quaternion.setFromAxisAngle(up, p.rot)
        matrix.compose(new THREE.Vector3(p.x, heightAt(p.x, p.z), p.z), quaternion, new THREE.Vector3(p.scale, p.scale, p.scale))
        batch.lit?.setMatrixAt(i, matrix)
        batch.glow?.setMatrixAt(i, matrix)
      }
      for (const [kind, batch] of Object.entries(batches)) {
        const n = counts[kind] ?? 0
        for (const mesh of [batch.lit, batch.glow]) {
          if (!mesh) continue
          mesh.count = n
          mesh.instanceMatrix.needsUpdate = true
        }
      }
    },
    // Rebuilds the grass from the loaded chunks' tufts, each tinted from its biome's base-to-tip colours.
    setGrass(chunks) {
      let i = 0
      const base = new THREE.Color()
      const tip = new THREE.Color()
      for (const chunk of chunks) {
        const style = GRASS_STYLE[chunk.biome] ?? GRASS_STYLE.sanctum
        base.set(style.base)
        tip.set(style.tip)
        for (const g of chunk.grass) {
          if (i >= MAX_GRASS) break
          quaternion.setFromAxisAngle(up, g.rot)
          matrix.compose(tmpPos.set(g.x, heightAt(g.x, g.z), g.z), quaternion, tmpScale.set(g.scale * 0.9, g.scale, g.scale * 0.9))
          grass.mesh.setMatrixAt(i, matrix)
          grass.mesh.setColorAt(i, tmpColor.copy(base).lerp(tip, 0.2 + g.tint * 0.6))
          i++
        }
      }
      grass.mesh.count = i
      grass.mesh.instanceMatrix.needsUpdate = true
      if (grass.mesh.instanceColor) grass.mesh.instanceColor.needsUpdate = true
    },
    update(pos, time) {
      sky.position.set(pos.x, 0, pos.z)
      grass.uniforms.uTime.value = time
      grass.uniforms.uPlayer.value.set(pos.x, 0, pos.z)
      // Leaves, petals, flakes and embers drift through the air around the player.
      const dt = Math.min(0.1, Math.max(0, time - drift.lastTime))
      drift.lastTime = time
      const style = DRIFT[biomeAt(pos.x, pos.z)]
      drift.leaves.forEach((l, i) => {
        const ground = heightAt(l.x, l.z)
        const gone = Math.hypot(l.x - pos.x, l.z - pos.z) > LEAF_RANGE || l.y < ground || l.y > ground + 14
        if (!l.placed || gone) {
          const a = drift.rand() * Math.PI * 2
          const r = Math.sqrt(drift.rand()) * LEAF_RANGE
          l.x = pos.x + Math.cos(a) * r
          l.z = pos.z + Math.sin(a) * r
          l.y = heightAt(l.x, l.z) + (style.dir < 0 ? 4 + drift.rand() * 8 : drift.rand() * 3)
          l.placed = true
          drift.mesh.setColorAt(i, tmpColor.set(style.colors[Math.floor(drift.rand() * style.colors.length)]))
          drift.mesh.instanceColor.needsUpdate = true
        }
        l.y += style.dir * style.speed * dt * (0.7 + l.seed * 0.6)
        l.x += Math.sin(time * 0.8 + l.phase) * 0.9 * dt + 0.5 * dt // a steady breeze with gusts
        l.z += Math.cos(time * 0.6 + l.phase * 1.3) * 0.7 * dt
        l.tumble += l.spin * style.spin * dt
        tmpEuler.set(l.tumble, l.phase + time * 0.3, l.tumble * 0.7)
        quaternion.setFromEuler(tmpEuler)
        const s = style.size * (0.7 + l.seed * 0.7)
        matrix.compose(tmpPos.set(l.x, l.y, l.z), quaternion, tmpScale.set(s, s, s))
        drift.mesh.setMatrixAt(i, matrix)
      })
      drift.mesh.instanceMatrix.needsUpdate = true
      const biome = BIOMES[biomeAt(pos.x, pos.z)]
      targetFog.set(biome.fog)
      fog.color.lerp(targetFog, 0.03)
      flyColor.set(biome.glow)
      flies.points.material.color.lerp(flyColor, 0.05)
      flies.points.position.set(Math.round(pos.x / 8) * 8, heightAt(pos.x, pos.z), Math.round(pos.z / 8) * 8)
      const arr = flies.points.geometry.attributes.position.array
      for (let i = 0; i < arr.length; i += 3) {
        arr[i] = flies.base[i] + Math.sin(time * 0.5 + i) * 1.4
        arr[i + 1] = flies.base[i + 1] + Math.sin(time * 0.9 + i * 1.7) * 0.7
        arr[i + 2] = flies.base[i + 2] + Math.cos(time * 0.45 + i * 0.6) * 1.4
      }
      flies.points.geometry.attributes.position.needsUpdate = true
    },
  }

  return {
    group,
    fog,
    backgroundColor: FOG_COLOR,
    level: WORLD_LEVEL,
    keyLight,
    pools: [],
    propObstacles: [],
    water: null,
    skyObjects: [],
    world,
    update: world.update,
  }
}
