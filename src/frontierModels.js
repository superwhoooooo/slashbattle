// Scenery models for the Frontier biomes (Glowcap Hollow, Saltglass Flats, the Drowned Reach, Stormcrown
// Heights, the Bonewaste, the Skyshard Expanse) and for the landmarks (logic/world.js's LANDMARK_KINDS).
// Same shape as worldArena.js's MODELS: kind -> () => { lit: [parts], glow: [parts] }, merged and instanced
// per kind. Models stand on y = 0 with their front toward +z.
import * as THREE from 'three'
import { box, cone, cyl, dodeca, dome, ico, limb, oct, part } from './worldModelKit.js'
import { mulberry32 } from './logic/world.js'

const torus = (r, tube, arc = Math.PI * 2, seg = 14) => new THREE.TorusGeometry(r, tube, 5, seg, arc)
const BONE = 0xe6dbc0
const BONE_DARK = 0xb8a888

// A rib / tusk: a half-hoop of bone standing in the local XY plane.
const rib = (radius, tube, opts) => part(torus(radius, tube, Math.PI, 12), BONE, opts)

// A chain of links from a to b (alternately turned), for the sky anchor.
function chain(a, b, links, color) {
  const out = []
  for (let i = 0; i < links; i++) {
    const t = (i + 0.5) / links
    const x = a[0] + (b[0] - a[0]) * t
    const y = a[1] + (b[1] - a[1]) * t
    const z = a[2] + (b[2] - a[2]) * t
    out.push(part(torus(0.45, 0.12, Math.PI * 2, 8), color, { x, y, z, sy: 1.6, ry: i % 2 ? Math.PI / 2 : 0 }))
  }
  return out
}

// A floating rock island: an upside-down cone of rock with a grassy top (y = its top surface).
function isle(x, y, z, r, rand, { grass = 0x4f8a6a, rock = 0x4a4f6a, trees = 2 } = {}) {
  const lit = [
    part(cone(r, r * 1.6, 8), rock, { x, y: y - r * 0.8 - 0.3, z, rx: Math.PI }),
    part(cone(r * 0.55, r * 0.9, 6), 0x3a3f58, { x: x + r * 0.2, y: y - r * 1.7, z, rx: Math.PI }),
    part(cyl(r * 1.02, r * 0.98, 0.6, 9), grass, { x, y: y - 0.3, z }),
  ]
  for (let i = 0; i < trees; i++) {
    const a = rand() * Math.PI * 2
    const d = rand() * r * 0.5
    const tx = x + Math.cos(a) * d
    const tz = z + Math.sin(a) * d
    lit.push(part(cyl(0.12, 0.2, 1.6, 5), 0x4a3a30, { x: tx, y: y + 0.8, z: tz }))
    lit.push(part(cone(0.9, 2.2, 6), 0x2f7a7a, { x: tx, y: y + 2.4, z: tz }))
  }
  return lit
}

export const FRONTIER_MODELS = {
  // ---- Glowcap Hollow ----
  // A tall, slightly bent stem under a broad glowing cap, pale gills beneath and bright spots on top.
  giantShroom: () => ({
    lit: [
      part(cone(0.9, 0.8, 7), 0xcfc6e8, { y: 0.35 }),
      limb([0, 0.4, 0], [0.3, 3.0, 0.1], 0.45, 0.36, 0xe6def5, 7),
      limb([0.3, 3.0, 0.1], [0.1, 5.6, -0.1], 0.36, 0.3, 0xe6def5, 7),
      part(cone(2.7, 0.9, 12), 0x3a2a6a, { y: 5.4, rx: Math.PI }), // gills
      part(cyl(0.5, 0.5, 0.2, 8), 0xcfc6e8, { y: 4.4, x: 0.15 }), // a ring on the stem
    ],
    glow: [
      part(dome(2.8), 0x3ac8ff, { y: 5.6, sy: 0.6, x: 0.1 }),
      part(ico(0.28, 1), 0xd8f6ff, { x: 1.2, y: 6.9, z: 0.5 }),
      part(ico(0.22, 1), 0xd8f6ff, { x: -0.9, y: 7.0, z: -0.8 }),
      part(ico(0.3, 1), 0xd8f6ff, { x: -0.2, y: 7.3, z: 0.9 }),
      part(ico(0.18, 1), 0xd8f6ff, { x: 0.8, y: 7.2, z: -1.1 }),
    ],
  }),
  // A clump of little caps in mixed glows.
  shroomCluster: () => {
    const lit = []
    const glow = []
    const caps = [[0, 0, 1.4, 0xff6ad8], [0.9, 0.4, 1.0, 0x6aff9a], [-0.7, 0.6, 0.8, 0x3ac8ff], [0.2, -0.9, 1.1, 0xffc46a], [-0.8, -0.5, 0.6, 0xb46aff]]
    for (const [x, z, h, color] of caps) {
      lit.push(part(cyl(0.1 * h, 0.16 * h, h, 6), 0xe6def5, { x, y: h / 2, z }))
      glow.push(part(dome(0.45 * h), color, { x, y: h - 0.05, z, sy: 0.7 }))
    }
    return { lit, glow }
  },

  // ---- Saltglass Flats ----
  // A leaning stack of white salt prisms with a rosy crystal tip.
  saltPillar: () => ({
    lit: [
      part(cyl(1.0, 1.15, 2.2, 6), 0xf4eeea, { y: 1.1 }),
      part(cyl(0.8, 0.95, 2.0, 6), 0xe8e0e6, { y: 3.0, x: 0.15, ry: 0.4, rz: -0.06 }),
      part(cyl(0.6, 0.75, 1.8, 6), 0xf8f2ee, { y: 4.8, x: 0.35, ry: 0.8, rz: -0.1 }),
      part(cyl(1.4, 1.6, 0.3, 6), 0xd8cfd0, { y: 0.15, ry: 0.2 }),
    ],
    glow: [part(cone(0.35, 1.2, 5), 0xffb3d1, { x: 0.5, y: 6.2, rz: -0.12 })],
  }),
  // A low cluster of rosy salt crystals growing out of a white crust.
  saltCrystal: () => ({
    lit: [
      part(cyl(1.5, 1.7, 0.35, 7), 0xefe6e4, { y: 0.17 }),
      part(cone(0.45, 2.6, 5), 0xf2c6d8, { y: 1.3, rz: 0.2 }),
      part(cone(0.35, 2.0, 5), 0xf6d6e2, { x: 0.8, y: 1.0, rz: -0.45 }),
      part(cone(0.3, 1.6, 5), 0xeab6cc, { x: -0.7, y: 0.8, z: 0.4, rz: 0.55 }),
    ],
    glow: [part(oct(0.22), 0xffd6e6, { y: 2.65, x: -0.25 })],
  }),

  // ---- the Drowned Reach ----
  // A mangrove: a trunk on an arch of stilt roots, a broad flat canopy, glowing pods hanging from it.
  mangrove: () => {
    const wood = 0x3a3428
    const lit = [limb([0, 1.8, 0], [0.1, 4.6, 0.1], 0.36, 0.26, wood, 6)]
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.3
      lit.push(limb([Math.cos(a) * 1.8, 0, Math.sin(a) * 1.8], [Math.cos(a) * 0.6, 1.4, Math.sin(a) * 0.6], 0.12, 0.2, wood, 5))
      lit.push(limb([Math.cos(a) * 0.6, 1.4, Math.sin(a) * 0.6], [0, 2.1, 0], 0.2, 0.3, wood, 5))
    }
    lit.push(part(ico(2.4, 1), 0x1f6a52, { y: 5.2, sy: 0.42 }), part(ico(1.7, 1), 0x2a8a66, { x: 1.2, y: 5.6, z: 0.6, sy: 0.45 }), part(ico(1.6, 1), 0x1a5a4a, { x: -1.3, y: 5.4, z: -0.5, sy: 0.45 }))
    return {
      lit,
      glow: [
        part(ico(0.2, 1), 0x5affd8, { x: 1.6, y: 4.1, z: 0.4, sy: 1.5 }),
        part(ico(0.18, 1), 0x5affd8, { x: -1.4, y: 4.2, z: 1.0, sy: 1.5 }),
        part(ico(0.2, 1), 0xb6ff8a, { x: 0.2, y: 4.0, z: -1.6, sy: 1.5 }),
      ],
    }
  },
  // A fallen temple column, half sunk in the mud and furred with moss.
  sunkenColumn: () => ({
    lit: [
      part(cyl(0.6, 0.7, 5.5, 8), 0x8a9a94, { x: 0.8, y: 1.0, rz: 1.05 }),
      part(cyl(0.62, 0.62, 0.5, 8), 0x4f7a52, { x: 2.7, y: 2.1, rz: 1.05 }),
      part(box(1.6, 0.5, 1.6), 0x7a8a84, { x: -1.6, y: 0.1, ry: 0.4, rz: 0.2 }),
      part(cyl(0.65, 0.7, 1.4, 8), 0x7a8a84, { x: -2.2, y: 0.5, z: 1.5, rx: 1.4 }),
    ],
    glow: [part(box(0.06, 2.2, 0.06), 0x5affd8, { x: 0.8, y: 1.55, z: 0.62, rz: 1.05 })],
  }),

  // ---- Stormcrown Heights ----
  // An iron lightning rod: a thin mast with coil rings and a crackling orb on top.
  stormRod: () => ({
    lit: [
      part(box(1.2, 0.5, 1.2), 0x3a3f4a, { y: 0.25 }),
      part(cyl(0.08, 0.2, 7.5, 6), 0x5a6070, { y: 4.0 }),
      part(torus(0.45, 0.07), 0x8a6a4a, { y: 3.0, rx: Math.PI / 2 }),
      part(torus(0.38, 0.07), 0x8a6a4a, { y: 4.4, rx: Math.PI / 2 }),
      part(torus(0.3, 0.07), 0x8a6a4a, { y: 5.8, rx: Math.PI / 2 }),
    ],
    glow: [part(ico(0.32, 1), 0xbfe0ff, { y: 7.9 }), part(ico(0.6, 1), 0x6a9aff, { y: 7.9 })],
  }),
  // Dark slate slabs stacked at angles, like a cairn the storm built.
  slateStack: () => ({
    lit: [
      part(box(3.0, 0.6, 2.2), 0x3a4050, { y: 0.3, ry: 0.2 }),
      part(box(2.5, 0.55, 1.9), 0x4a5262, { y: 0.9, ry: 0.7, rz: 0.08 }),
      part(box(2.0, 0.5, 1.5), 0x3f4656, { y: 1.45, x: 0.2, ry: 1.3, rz: -0.1 }),
      part(box(1.2, 0.45, 1.0), 0x525a6c, { y: 1.9, x: -0.1, ry: 0.4 }),
    ],
    glow: [],
  }),
  // A boulder with veins of stored lightning.
  chargedRock: () => ({
    lit: [part(dodeca(1.4), 0x2a2e3c, { y: 0.8, sy: 0.75 }), part(dodeca(0.6), 0x343a4a, { x: 1.2, y: 0.3, sy: 0.7 })],
    glow: [
      part(box(0.08, 1.4, 0.08), 0x8fc8ff, { y: 1.0, z: 1.05, rz: 0.4 }),
      part(box(0.08, 1.1, 0.08), 0x8fc8ff, { x: 0.8, y: 0.9, z: 0.7, rz: -0.5 }),
      part(oct(0.18), 0xe0f0ff, { y: 1.9 }),
    ],
  }),

  // ---- the Bonewaste ----
  // A run of half-buried ribs (the prop is walk-through; the ribs arch over your head).
  ribcage: () => {
    const lit = [part(box(0.5, 0.4, 7.5), BONE_DARK, { y: 0.2 })]
    for (let i = 0; i < 5; i++) lit.push(rib(2.6 - Math.abs(i - 2) * 0.25, 0.22, { z: -3 + i * 1.5, y: 0, rz: 0, sx: 1, sy: 1.4 }))
    return { lit, glow: [] }
  },
  // A great curved tusk or horn jutting from the sand.
  boneSpike: () => ({
    lit: [
      limb([0, 0, 0], [0.4, 2.2, 0], 0.45, 0.32, BONE, 6),
      limb([0.4, 2.2, 0], [1.3, 3.8, 0], 0.32, 0.18, BONE, 6),
      part(cone(0.18, 0.9, 6), BONE, { x: 1.62, y: 4.3, rz: -0.6 }),
    ],
    glow: [],
  }),
  // A giant beast's skull, eyes still smouldering.
  skull: () => ({
    lit: [
      part(dodeca(1.8), BONE, { y: 1.4, sz: 1.3, sy: 0.85 }),
      part(box(2.4, 0.8, 1.8), BONE_DARK, { y: 0.4, z: 1.6 }), // jaw
      part(box(0.7, 0.6, 0.4), 0x2a2018, { x: -0.7, y: 1.7, z: 2.05 }), // sockets
      part(box(0.7, 0.6, 0.4), 0x2a2018, { x: 0.7, y: 1.7, z: 2.05 }),
      part(cone(0.3, 2.0, 6), BONE, { x: -1.3, y: 2.6, z: -0.3, rz: 0.7 }), // horns
      part(cone(0.3, 2.0, 6), BONE, { x: 1.3, y: 2.6, z: -0.3, rz: -0.7 }),
    ],
    glow: [part(ico(0.18, 1), 0xffb347, { x: -0.7, y: 1.7, z: 2.1 }), part(ico(0.18, 1), 0xffb347, { x: 0.7, y: 1.7, z: 2.1 })],
  }),

  // ---- the Skyshard Expanse ----
  // A small rocky island hanging in the air above the land (walk-through: it floats over your head).
  floatIsle: () => {
    const rand = mulberry32(61)
    return {
      lit: isle(0, 11, 0, 3.2, rand, { trees: 2 }),
      glow: [part(oct(0.5), 0xd6f0ff, { y: 11 - 3.2 * 1.9, sy: 1.6 }), part(oct(0.25), 0xa6d8ff, { x: 1.2, y: 8.2, z: 0.6 })],
    }
  },
  // Crystal shards hovering in a column over a carved base.
  shardPillar: () => ({
    lit: [part(cyl(1.0, 1.2, 0.8, 6), 0x5a6a8a, { y: 0.4 }), part(cyl(0.7, 0.9, 0.4, 6), 0x6a7a9a, { y: 0.95 })],
    glow: [
      part(oct(0.6), 0xbfe6ff, { y: 2.2, sy: 1.8 }),
      part(oct(0.45), 0xd6f0ff, { y: 4.0, x: 0.2, sy: 1.8, ry: 0.5 }),
      part(oct(0.3), 0xa6d8ff, { y: 5.4, x: -0.1, sy: 1.8 }),
    ],
  }),

  // ---- landmarks ----
  // A colossal stone head half-sunk in the ground, a broken crown on its brow and moss on its cheeks.
  colossusHead: () => ({
    lit: [
      part(dodeca(5), 0x9a94a8, { y: 2.6, sx: 0.95, sy: 1.15, sz: 1.0 }),
      part(box(6.4, 1.2, 1.6), 0x8a849a, { y: 5.2, z: 3.4 }), // brow
      part(box(1.2, 2.4, 1.6), 0x8a849a, { y: 3.4, z: 4.6, rx: -0.2 }), // nose
      part(box(3.2, 0.5, 1.0), 0x6a647a, { y: 1.4, z: 4.3 }), // lips
      part(box(1.4, 1.0, 0.6), 0x2a2538, { x: -1.6, y: 4.2, z: 4.3 }), // eyes
      part(box(1.4, 1.0, 0.6), 0x2a2538, { x: 1.6, y: 4.2, z: 4.3 }),
      part(cyl(4.2, 4.6, 1.2, 10), 0xb0965a, { y: 7.3 }), // crown band
      part(cone(0.8, 2.2, 5), 0xb0965a, { x: -2.6, y: 8.9 }),
      part(cone(0.8, 2.8, 5), 0xb0965a, { y: 9.2, z: 2.6 }),
      part(cone(0.8, 1.4, 5), 0xb0965a, { x: 2.8, y: 8.5, rz: -0.4 }), // a snapped point
      part(ico(2.2, 1), 0x4f7a52, { x: -3.6, y: 1.0, z: 2.0, sy: 0.5 }),
      part(ico(1.8, 1), 0x5f8a5a, { x: 3.4, y: 0.6, z: -2.4, sy: 0.5 }),
    ],
    glow: [part(ico(0.4, 1), 0x9ff0ff, { x: -1.6, y: 4.2, z: 4.6 }), part(ico(0.4, 1), 0x9ff0ff, { x: 1.6, y: 4.2, z: 4.6 }), part(oct(0.7), 0xffe08a, { y: 7.6, z: 4.4, sy: 1.4 })],
  }),
  // The colossus's stone hand, fingers curled up out of the earth.
  colossusHand: () => {
    const stone = 0x9a94a8
    const lit = [part(dodeca(2.0), stone, { y: 0.6, sy: 0.6, sx: 1.2 })]
    const fingers = [[-1.4, 0.3, 3.8, 0.25], [-0.5, 0.6, 4.6, 0.1], [0.5, 0.6, 4.4, -0.05], [1.4, 0.3, 3.6, -0.2]]
    for (const [x, z, h, lean] of fingers) {
      lit.push(limb([x, 0.6, z], [x + lean, h * 0.6, z + 0.3], 0.42, 0.38, stone, 6))
      lit.push(limb([x + lean, h * 0.6, z + 0.3], [x + lean * 2, h, z - 0.4], 0.38, 0.3, stone, 6))
    }
    lit.push(limb([2.2, 0.4, -0.4], [3.0, 1.8, 0.6], 0.5, 0.42, stone, 6)) // thumb
    return { lit, glow: [] }
  },
  // A stepped altar with a rune crystal floating over it.
  runeAltar: () => ({
    lit: [part(box(3.6, 0.4, 3.6), 0x6a6290, { y: 0.2 }), part(box(2.6, 0.5, 2.6), 0x7a72a0, { y: 0.65 }), part(box(1.4, 0.9, 1.4), 0x8a82b0, { y: 1.35 })],
    glow: [part(oct(0.7), 0xd6c6ff, { y: 3.0, sy: 1.6 }), part(torus(1.2, 0.05, Math.PI * 2, 24), 0xb9a6ff, { y: 3.0, rx: Math.PI / 2 }), part(box(3.0, 0.04, 3.0), 0x9f8bff, { y: 0.42 })],
  }),
  // A bonfire: a ring of stones, crossed logs, and leaping flames.
  bonfire: () => {
    const lit = [limb([-0.9, 0.1, -0.3], [0.9, 0.5, 0.3], 0.16, 0.14, 0x5a3a24, 5), limb([0.2, 0.1, -1.0], [-0.2, 0.5, 1.0], 0.16, 0.14, 0x4a3020, 5)]
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2
      lit.push(part(dodeca(0.28), 0x6a6878, { x: Math.cos(a) * 1.25, y: 0.15, z: Math.sin(a) * 1.25 }))
    }
    return { lit, glow: [part(cone(0.6, 1.8, 6), 0xff8a2a, { y: 0.9 }), part(cone(0.35, 1.3, 5), 0xffd060, { y: 1.0, x: 0.15 }), part(cone(0.3, 1.1, 5), 0xff5a1a, { y: 0.7, x: -0.35, z: 0.2 })] }
  },
  // A patched canvas tent (door toward +z), its pole poking out of the top and a lantern by the flap.
  campTent: () => ({
    lit: [
      part(cyl(0.01, 2.0, 3.0, 4), 0x9a7a5a, { y: 1.5, ry: Math.PI / 4, sz: 1.4 }),
      part(box(1.0, 1.4, 0.1), 0x3a2a20, { y: 0.7, z: 1.45 }),
      part(cyl(0.06, 0.06, 3.8, 5), 0x4a3020, { y: 1.9 }),
      part(box(0.8, 0.7, 0.05), 0xb0905a, { x: 0.9, y: 1.1, z: 1.1, ry: 0.5 }), // a patch
    ],
    glow: [part(ico(0.16, 1), 0xffc870, { x: 0.9, y: 0.9, z: 1.7 })],
  }),
  // A tall crooked pole flying a ragged banner.
  campBanner: () => ({
    lit: [part(cyl(0.07, 0.1, 5.2, 5), 0x4a3020, { y: 2.6, rz: 0.04 }), part(box(1.6, 1.1, 0.05), 0xb03a4a, { x: 0.85, y: 4.4 }), part(box(0.9, 0.5, 0.05), 0x8a2a3a, { x: 1.1, y: 3.6, rz: 0.1 })],
    glow: [part(oct(0.18), 0xffd060, { y: 5.3 })],
  }),
  // A great rock mound with a dark cave mouth (toward +z) glowing from deep inside.
  caveMound: () => ({
    lit: [
      part(dodeca(7), 0x4a4658, { y: 2.2, sy: 0.75 }),
      part(dodeca(3.5), 0x5a5668, { x: -4.5, y: 1.0, z: -2, sy: 0.7 }),
      part(dodeca(3.0), 0x3f3c4c, { x: 4.2, y: 0.8, z: 1.0, sy: 0.7 }),
      part(box(3.4, 3.6, 2.4), 0x0e0b18, { y: 1.8, z: 5.6 }), // the mouth
      part(box(4.4, 0.8, 1.4), 0x5a5668, { y: 3.9, z: 6.2 }),
    ],
    glow: [part(box(2.4, 2.2, 0.1), 0x8a5aff, { y: 1.6, z: 5.0 }), part(ico(0.3, 1), 0xd6c6ff, { x: -0.6, y: 1.2, z: 6.6 }), part(ico(0.2, 1), 0xd6c6ff, { x: 0.8, y: 0.8, z: 6.8 })],
  }),
  // A towering arch, two legs along x, a keystone glowing over the gap.
  greatArch: () => ({
    lit: [
      part(box(3.0, 14, 3.0), 0x8d86a3, { x: -6.2, y: 7 }),
      part(box(3.0, 13, 3.0), 0x7d7893, { x: 6.2, y: 6.5, rz: 0.02 }),
      part(box(3.6, 1.0, 3.6), 0x6a6480, { x: -6.2, y: 0.5 }),
      part(box(3.6, 1.0, 3.6), 0x6a6480, { x: 6.2, y: 0.5 }),
      part(box(16.5, 2.4, 3.4), 0x9b94b3, { y: 14.2 }),
      part(box(12, 1.0, 2.6), 0x8d86a3, { y: 15.9 }),
      part(ico(1.6, 1), 0x4f7a52, { x: -5.2, y: 15.6, sy: 0.4 }),
    ],
    glow: [part(oct(0.9), 0xffe08a, { y: 12.5, sy: 1.4 }), part(box(0.15, 10, 0.08), 0xb9a6ff, { x: -6.2, y: 6.5, z: 1.55 }), part(box(0.15, 10, 0.08), 0xb9a6ff, { x: 6.2, y: 6.5, z: 1.55 }), part(box(12, 0.12, 0.08), 0xb9a6ff, { y: 13.1, z: 1.75 })],
  }),
  // A mushroom the size of a house, brackets on its stem, a cap that lights the whole glade.
  elderShroom: () => ({
    lit: [
      part(cone(3.2, 2.0, 9), 0xcfc6e8, { y: 1.0 }),
      limb([0, 1.5, 0], [0.9, 8, 0.3], 1.7, 1.4, 0xe6def5, 9),
      limb([0.9, 8, 0.3], [0.4, 14, -0.2], 1.4, 1.2, 0xe6def5, 9),
      part(cone(9, 2.6, 16), 0x2a1f58, { y: 13.6, rx: Math.PI }),
      part(cyl(1.6, 1.4, 0.6, 9), 0xcfc6e8, { y: 10.2, x: 0.7 }),
      part(dome(1.4), 0xcfb8e0, { x: 1.8, y: 5.0, z: 0.6, sy: 0.4 }),
      part(dome(1.1), 0xcfb8e0, { x: -1.0, y: 7.0, z: -1.2, sy: 0.4 }),
    ],
    glow: [
      part(dome(9.2), 0x3ac8ff, { y: 14.0, sy: 0.5 }),
      part(ico(0.7, 1), 0xd8f6ff, { x: 3, y: 18, z: 2 }),
      part(ico(0.6, 1), 0xd8f6ff, { x: -4, y: 17.4, z: -1 }),
      part(ico(0.8, 1), 0xd8f6ff, { x: 0.5, y: 18.4, z: -3.5 }),
      part(ico(0.5, 1), 0xffa6f0, { x: -2, y: 18.2, z: 4 }),
    ],
  }),
  // The Thunder Spire: a tall iron needle on a stone foot, coils up its length and a storm-orb crowning it.
  stormSpire: () => ({
    lit: [
      part(cyl(2.6, 3.0, 2.0, 8), 0x3a3f4a, { y: 1.0 }),
      part(cyl(0.3, 1.4, 20, 8), 0x50566a, { y: 12 }),
      part(torus(1.6, 0.18), 0x8a6a4a, { y: 6, rx: Math.PI / 2 }),
      part(torus(1.2, 0.16), 0x8a6a4a, { y: 11, rx: Math.PI / 2 }),
      part(torus(0.8, 0.14), 0x8a6a4a, { y: 16, rx: Math.PI / 2 }),
      part(box(0.4, 3, 0.4), 0x50566a, { x: 1.8, y: 3.5, rz: -0.4 }),
      part(box(0.4, 3, 0.4), 0x50566a, { x: -1.8, y: 3.5, rz: 0.4 }),
    ],
    glow: [part(ico(0.9, 1), 0xd6e8ff, { y: 22.6 }), part(ico(1.6, 1), 0x6a9aff, { y: 22.6 }), part(box(0.1, 14, 0.1), 0x8fc8ff, { y: 10, z: 0.75 })],
  }),
  // The skull of a long-dead leviathan (toward +z): long jaws, horns, ember eyes.
  leviathanSkull: () => ({
    lit: [
      part(dodeca(3.4), BONE, { y: 2.6, sz: 1.5, sy: 0.8 }),
      part(box(3.4, 0.9, 5.4), BONE, { y: 2.6, z: 4.6 }), // upper jaw
      part(box(3.0, 0.7, 5.0), BONE_DARK, { y: 0.4, z: 4.2, rx: 0.12 }), // lower jaw
      part(box(1.2, 1.0, 0.6), 0x2a2018, { x: -1.4, y: 3.4, z: 2.6 }),
      part(box(1.2, 1.0, 0.6), 0x2a2018, { x: 1.4, y: 3.4, z: 2.6 }),
      limb([-2.2, 3.6, -1], [-4.6, 6.6, -3.4], 0.6, 0.2, BONE, 6),
      limb([2.2, 3.6, -1], [4.6, 6.6, -3.4], 0.6, 0.2, BONE, 6),
      ...[-1.2, -0.4, 0.4, 1.2].map((x) => part(cone(0.18, 0.9, 4), 0xfff6e0, { x, y: 1.7, z: 6.8, rx: Math.PI })),
    ],
    glow: [part(ico(0.32, 1), 0xffb347, { x: -1.4, y: 3.4, z: 2.75 }), part(ico(0.32, 1), 0xffb347, { x: 1.4, y: 3.4, z: 2.75 })],
  }),
  // A carved anchor stone, chains rising from it to a rocky island hanging in the sky.
  skyAnchor: () => {
    const rand = mulberry32(83)
    return {
      lit: [
        part(cyl(2.0, 2.4, 1.6, 8), 0x5a6a8a, { y: 0.8 }),
        part(box(1.0, 3.0, 1.0), 0x6a7a9a, { y: 3.0 }),
        part(torus(1.2, 0.3, Math.PI, 10), 0x4a4f6a, { y: 2.2, rz: Math.PI }),
        ...chain([0.4, 4.4, 0], [3.5, 22, 2], 18, 0x3a3f4a),
        ...chain([-0.4, 4.4, 0], [-2.5, 22, -2.8], 18, 0x3a3f4a),
        ...isle(0.5, 26, -0.2, 8, rand, { trees: 5 }),
      ],
      glow: [part(oct(0.6), 0xd6f0ff, { y: 4.9, sy: 1.5 }), part(oct(1.4), 0xbfe6ff, { x: 0.5, y: 26 - 8 * 1.9, sy: 1.8 }), part(box(1.06, 1.6, 0.04), 0xa6d8ff, { y: 3.0, z: 0.52 })],
    }
  },
}
