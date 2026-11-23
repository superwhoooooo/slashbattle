// Buildings for the four storm cities, one architecture per people (logic/species.js): Dunekin adobe domes and wind-catchers,
// Frostkin igloos and snow-roofed longhouses, Embervolk basalt forge-houses, Mirefolk stilt huts over the bog.
// Same shape as worldArena.js's MODELS: kind -> () => { lit: [parts], glow: [parts] }. Models stand on y = 0, front toward +z.
import * as THREE from 'three'
import { box, cone, cyl, dodeca, dome, ico, oct, part } from './worldModelKit.js'

const torus = (r, tube, arc = Math.PI * 2, seg = 14) => new THREE.TorusGeometry(r, tube, 5, seg, arc)

// ---- Dunekin: sun-baked sandstone, domes, striped awnings -------------------------------------------------------
const SAND = 0xe3c58e
const SAND_DARK = 0xc9a56a
function duneHome(dome1, stripe) {
  return () => ({
    lit: [
      part(cyl(2.3, 2.5, 2.8, 10), SAND, { y: 1.4 }),
      part(dome(2.3), dome1, { y: 2.8, sy: 0.95 }),
      part(cyl(0.12, 0.12, 1.2, 5), 0x6a4a2a, { y: 5.4 }),
      part(box(1.0, 1.7, 0.16), 0x5a3a28, { y: 0.85, z: 2.35 }),
      part(box(2.0, 0.12, 1.3), stripe, { y: 2.0, z: 2.75, rx: 0.35 }), // an awning over the door
      part(box(3.6, 0.3, 0.3), SAND_DARK, { y: 2.85, z: 0, ry: 0.7 }),
      part(box(0.9, 4.6, 0.9), SAND_DARK, { x: -1.9, y: 2.3, z: -1.2 }), // a wind-catcher tower
      part(box(1.0, 0.25, 1.0), 0x7a5a3a, { x: -1.9, y: 4.7, z: -1.2 }),
    ],
    glow: [part(box(0.5, 0.8, 0.1), 0xffd070, { x: -1.4, y: 1.7, z: 2.2, ry: -0.5 }), part(box(0.5, 0.8, 0.1), 0xffd070, { x: 1.4, y: 1.7, z: 2.2, ry: 0.5 }), part(ico(0.2, 1), 0xffc870, { x: 0.9, y: 1.8, z: 2.6 })],
  })
}
function duneHall() {
  return {
    lit: [
      part(box(7.6, 0.4, 5.6), SAND_DARK, { y: 0.2 }),
      part(box(7.0, 3.4, 5.0), SAND, { y: 2.1 }),
      part(dome(2.7), 0xd8a24a, { y: 3.8, x: -1.6, sy: 1.1 }),
      part(dome(2.7), 0xd8a24a, { y: 3.8, x: 1.6, sy: 1.1 }),
      part(cyl(0.55, 0.7, 7.6, 8), SAND, { x: 3.7, y: 3.8, z: -2.0 }), // a minaret
      part(cone(0.8, 1.6, 8), 0xd8a24a, { x: 3.7, y: 8.4, z: -2.0 }),
      part(cyl(0.1, 0.1, 1.0, 5), 0xffe08a, { x: 3.7, y: 9.6, z: -2.0 }),
      part(box(1.7, 2.3, 0.16), 0x5a3a28, { y: 1.6, z: 2.55 }),
      part(box(4.0, 0.14, 1.6), 0xc0442e, { y: 3.3, z: 3.0, rx: 0.3 }), // striped awning
      part(box(4.0, 0.14, 0.4), 0xf4e6c0, { y: 3.3, z: 3.6, rx: 0.3 }),
    ],
    glow: [part(box(0.9, 1.1, 0.1), 0xffd070, { x: -2.5, y: 2.4, z: 2.52 }), part(box(0.9, 1.1, 0.1), 0xffd070, { x: 2.5, y: 2.4, z: 2.52 }), part(ico(0.3, 1), 0xffe08a, { x: 3.7, y: 7.9, z: -1.2 })],
  }
}
const duneLamp = () => ({
  lit: [part(cyl(0.07, 0.11, 3.0, 6), 0x7a5a2a, { y: 1.5 }), part(box(0.7, 0.1, 0.1), 0x7a5a2a, { x: 0.35, y: 3.0 }), part(box(0.5, 0.9, 0.04), 0xc0442e, { x: 0.2, y: 2.4, z: 0.1 })],
  glow: [part(ico(0.28, 1), 0xffb860, { x: 0.7, y: 2.8 })],
})
const duneWell = () => ({
  lit: [part(cyl(1.2, 1.3, 0.9, 10), SAND, { y: 0.45 }), part(box(0.16, 2.4, 0.16), 0x6a4a2a, { x: -1.0, y: 1.6 }), part(box(0.16, 2.4, 0.16), 0x6a4a2a, { x: 1.0, y: 1.6 }), part(box(2.6, 0.12, 1.8), 0xc0442e, { y: 2.8, rz: 0.12 })],
  glow: [part(cyl(0.9, 0.9, 0.05, 10), 0x6df0ff, { y: 0.9 })],
})
const duneFloor = () => ({
  lit: [part(cyl(12.5, 12.8, 0.1, 20), 0xd2b07a, { y: 0.05 }), part(cyl(9.8, 10.0, 0.18, 20), 0xe6c690, { y: 0.1 })],
  glow: [part(torus(7.4, 0.07, Math.PI * 2, 40), 0xffd070, { y: 0.22, rx: Math.PI / 2 }), part(torus(4.6, 0.05, Math.PI * 2, 32), 0xfff0b0, { y: 0.22, rx: Math.PI / 2 })],
})

// ---- Frostkin: snow, ice, warm windows ---------------------------------------------------------------------------
const SNOW = 0xf4fbff
const ICE = 0xaee0f4
function frostIgloo(trim) {
  return () => ({
    lit: [
      part(dome(2.9), SNOW, { y: 0.1, sy: 0.95 }),
      part(cyl(2.9, 3.0, 0.3, 12), 0xdcecf6, { y: 0.15 }),
      part(cyl(0.95, 1.0, 1.6, 8), SNOW, { y: 0.9, z: 2.6, rx: Math.PI / 2, sy: 1.2 }), // the entrance tunnel
      part(torus(1.0, 0.16, Math.PI, 10), trim, { y: 0.1, z: 3.35 }),
      part(cyl(0.3, 0.4, 0.9, 6), 0x9aa8b8, { x: 1.0, y: 3.0, z: -0.8 }),
      part(cone(0.4, 0.6, 6), SNOW, { x: 1.0, y: 3.7, z: -0.8 }),
    ],
    glow: [part(ico(0.2, 1), 0xffc070, { x: 0, y: 1.1, z: 3.3 }), part(box(0.5, 0.5, 0.1), 0xffd990, { x: -1.4, y: 1.6, z: 2.3, ry: -0.5 })],
  })
}
function frostLonghouse() {
  return () => ({
    lit: [
      part(box(5.0, 0.4, 4.0), 0x9aa8b8, { y: 0.2 }),
      part(box(4.4, 2.4, 3.4), 0x7a5a42, { y: 1.6 }),
      part(cone(3.6, 3.2, 4), SNOW, { y: 4.4, ry: Math.PI / 4, sz: 0.85 }), // a steep snow roof
      part(cone(3.7, 0.4, 4), 0xdcecf6, { y: 3.0, ry: Math.PI / 4, sz: 0.9 }),
      part(box(1.0, 1.8, 0.16), 0x4a3020, { y: 1.3, z: 1.76 }),
      part(cone(0.1, 1.2, 4), 0xe6dcc0, { x: -1.5, y: 6.4, z: 1.5, rz: 0.5 }), // crossed gable horns
      part(cone(0.1, 1.2, 4), 0xe6dcc0, { x: 1.5, y: 6.4, z: 1.5, rz: -0.5 }),
    ],
    glow: [part(box(0.8, 0.8, 0.1), 0xffc070, { x: -1.3, y: 2.0, z: 1.74 }), part(box(0.8, 0.8, 0.1), 0xffc070, { x: 1.3, y: 2.0, z: 1.74 }), part(ico(0.18, 1), 0xffa040, { x: 0, y: 2.1, z: 2.0 })],
  })
}
function frostHall() {
  return {
    lit: [
      part(box(7.6, 0.4, 5.2), 0x9aa8b8, { y: 0.2 }),
      part(box(7.0, 3.0, 4.6), 0x7a5a42, { y: 1.9 }),
      part(cone(4.5, 3.6, 4), SNOW, { x: -1.7, y: 5.2, ry: Math.PI / 4, sz: 0.95 }),
      part(cone(4.5, 3.6, 4), SNOW, { x: 1.7, y: 5.2, ry: Math.PI / 4, sz: 0.95 }),
      part(cyl(0.6, 0.8, 4.6, 7), 0x8a98a8, { x: 3.0, y: 4.2, z: -1.4 }), // great chimney
      part(cone(0.8, 0.6, 7), SNOW, { x: 3.0, y: 6.8, z: -1.4 }),
      part(box(1.6, 2.2, 0.16), 0x4a3020, { y: 1.5, z: 2.34 }),
      part(cone(0.14, 1.8, 4), 0xe6dcc0, { x: -3.4, y: 7.2, z: 2.0, rz: 0.4 }),
      part(cone(0.14, 1.8, 4), 0xe6dcc0, { x: 3.4, y: 7.2, z: 2.0, rz: -0.4 }),
    ],
    glow: [part(box(0.9, 0.9, 0.1), 0xffc070, { x: -2.4, y: 2.3, z: 2.32 }), part(box(0.9, 0.9, 0.1), 0xffc070, { x: 2.4, y: 2.3, z: 2.32 }), part(ico(0.5, 1), 0xffb050, { x: 3.0, y: 7.0, z: -1.4 })],
  }
}
const frostLamp = () => ({
  lit: [part(cyl(0.08, 0.12, 2.8, 6), 0x7a8ea0, { y: 1.4 }), part(cone(0.4, 0.5, 5), SNOW, { y: 3.55 })],
  glow: [part(oct(0.34), 0xbfeaff, { y: 3.05 }), part(ico(0.15, 1), 0xffd990, { y: 3.05 })],
})
const frostWell = () => ({
  lit: [part(cyl(1.3, 1.4, 0.9, 8), ICE, { y: 0.45 }), part(cone(0.3, 1.4, 5), ICE, { x: -1.0, y: 1.2, rz: 0.2 }), part(cone(0.25, 1.1, 5), ICE, { x: 1.0, y: 1.0, rz: -0.2 })],
  glow: [part(cyl(1.0, 1.0, 0.05, 8), 0xd8f6ff, { y: 0.9 })],
})
const frostFloor = () => ({
  lit: [part(cyl(12.5, 12.8, 0.1, 20), 0xc4dcee, { y: 0.05 }), part(cyl(9.8, 10.0, 0.18, 20), 0xe2f2fc, { y: 0.1 })],
  glow: [part(torus(7.4, 0.07, Math.PI * 2, 40), 0x9fe0ff, { y: 0.22, rx: Math.PI / 2 }), part(torus(4.6, 0.05, Math.PI * 2, 32), 0xffffff, { y: 0.22, rx: Math.PI / 2 })],
})

// ---- Embervolk: black basalt, glowing seams, chimneys -----------------------------------------------------------
const BASALT = 0x2e2a2e
const BASALT_LIGHT = 0x453e44
function emberForgeHouse(accent) {
  return () => ({
    lit: [
      part(box(4.8, 0.5, 4.2), 0x1e1a1e, { y: 0.25 }),
      part(box(4.2, 2.7, 3.6), BASALT, { y: 1.85 }),
      part(box(4.6, 0.4, 4.0), BASALT_LIGHT, { y: 3.4 }), // a flat slab roof
      part(cone(3.0, 1.4, 4), accent, { y: 4.3, ry: Math.PI / 4, sx: 0.9, sz: 0.65 }),
      part(cyl(0.45, 0.6, 3.4, 7), BASALT_LIGHT, { x: 1.4, y: 4.9, z: -0.8 }),
      part(box(1.0, 1.8, 0.16), 0x180f10, { y: 1.4, z: 1.84 }),
      part(box(0.8, 0.5, 0.6), 0x3a3a46, { x: -2.9, y: 0.75, z: 1.2 }), // an anvil by the wall
      part(box(0.4, 0.4, 0.4), 0x3a3a46, { x: -2.9, y: 0.3, z: 1.2 }),
    ],
    glow: [part(box(0.8, 0.8, 0.1), 0xff7a2a, { x: -1.35, y: 2.2, z: 1.82 }), part(box(0.8, 0.8, 0.1), 0xff7a2a, { x: 1.35, y: 2.2, z: 1.82 }), part(cone(0.4, 0.8, 5), 0xffa83a, { x: 1.4, y: 6.9, z: -0.8 }), part(box(0.12, 2.2, 0.1), 0xff5a1a, { x: 0, y: 1.9, z: 1.83 })],
  })
}
function emberHall() {
  return {
    lit: [
      part(box(7.6, 0.5, 5.2), 0x1e1a1e, { y: 0.25 }),
      part(box(7.0, 3.4, 4.6), BASALT, { y: 2.2 }),
      part(box(7.4, 0.5, 5.0), BASALT_LIGHT, { y: 4.1 }),
      part(cyl(0.9, 1.1, 5.0, 8), BASALT_LIGHT, { x: -2.2, y: 6.5, z: -0.8 }), // two stacks
      part(cyl(0.9, 1.1, 5.4, 8), BASALT_LIGHT, { x: 2.2, y: 6.7, z: -0.8 }),
      part(cone(1.1, 1.0, 8), 0x1e1a1e, { x: -2.2, y: 9.5, z: -0.8 }),
      part(cone(1.1, 1.0, 8), 0x1e1a1e, { x: 2.2, y: 9.9, z: -0.8 }),
      part(box(1.8, 2.5, 0.16), 0x180f10, { y: 1.75, z: 2.34 }),
      part(cone(0.18, 1.6, 4), 0x1e1a1e, { x: -3.4, y: 5.1, z: 2.1, rz: 0.4 }), // horn gables
      part(cone(0.18, 1.6, 4), 0x1e1a1e, { x: 3.4, y: 5.1, z: 2.1, rz: -0.4 }),
    ],
    glow: [part(box(1.4, 1.0, 0.1), 0xff7a2a, { y: 2.4, z: 2.32 }), part(cone(0.7, 1.4, 6), 0xffa83a, { x: -2.2, y: 9.1, z: -0.8 }), part(cone(0.7, 1.6, 6), 0xffa83a, { x: 2.2, y: 9.5, z: -0.8 }), part(box(0.1, 2.6, 0.1), 0xff5a1a, { x: -2.5, y: 2.2, z: 2.32 }), part(box(0.1, 2.6, 0.1), 0xff5a1a, { x: 2.5, y: 2.2, z: 2.32 })],
  }
}
const emberLamp = () => ({
  lit: [part(cyl(0.08, 0.14, 2.4, 6), 0x2a262a, { y: 1.2 }), part(cyl(0.4, 0.22, 0.4, 7), 0x3a343a, { y: 2.6 })],
  glow: [part(cone(0.3, 0.8, 6), 0xff8a2a, { y: 3.1 }), part(ico(0.16, 1), 0xffd070, { y: 2.95 })],
})
const emberWell = () => ({
  lit: [part(cyl(1.3, 1.45, 0.9, 7), BASALT, { y: 0.45 }), part(box(0.3, 2.2, 0.3), 0x3a343a, { x: -1.1, y: 1.5 }), part(box(0.3, 2.2, 0.3), 0x3a343a, { x: 1.1, y: 1.5 }), part(box(2.6, 0.2, 0.2), 0x3a343a, { y: 2.6 })],
  glow: [part(cyl(1.0, 1.0, 0.06, 7), 0xff6a1a, { y: 0.9 })],
})
const emberFloor = () => ({
  lit: [part(cyl(12.5, 12.8, 0.1, 20), 0x24202a, { y: 0.05 }), part(cyl(9.8, 10.0, 0.18, 20), 0x34303a, { y: 0.1 })],
  glow: [part(torus(7.4, 0.08, Math.PI * 2, 40), 0xff6a2a, { y: 0.22, rx: Math.PI / 2 }), part(torus(4.6, 0.06, Math.PI * 2, 32), 0xffc060, { y: 0.22, rx: Math.PI / 2 })],
})

// ---- Mirefolk: stilts over the bog, thatch, hanging lanterns ---------------------------------------------------
const THATCH = 0x9a8a3a
const PLANK = 0x6a5236
function mireStiltHut(roof) {
  return () => {
    const stilts = [[-1.7, -1.4], [1.7, -1.4], [-1.7, 1.4], [1.7, 1.4]].map(([x, z]) => part(cyl(0.16, 0.2, 2.4, 5), 0x4a3a28, { x, y: 1.2, z }))
    return {
      lit: [
        ...stilts,
        part(box(4.2, 0.25, 3.6), PLANK, { y: 2.4 }), // the raised floor
        part(box(3.6, 2.0, 3.0), 0x7a6a44, { y: 3.5 }),
        part(cone(3.2, 2.4, 9), roof, { y: 5.7, sy: 1.0 }), // a round thatched roof
        part(box(1.0, 0.2, 2.6), PLANK, { y: 1.3, z: 3.3, rx: 0.5 }), // a ramp
        part(box(0.9, 1.5, 0.14), 0x3a2a18, { y: 3.3, z: 1.55 }),
        part(cyl(0.05, 0.05, 1.4, 4), 0x6a8a3a, { x: 1.9, y: 3.1, z: 1.6 }), // a reed post
      ],
      glow: [part(ico(0.3, 1), 0xb8ff8a, { x: -0.9, y: 4.5, z: 1.7 }), part(ico(0.3, 1), 0xdaff6a, { x: 1.4, y: 4.2, z: 1.8 }), part(box(0.6, 0.6, 0.1), 0xc8ff9a, { x: -1.0, y: 3.7, z: 1.53 })],
    }
  }
}
function mireHall() {
  const stilts = [-3.0, -1.0, 1.0, 3.0].flatMap((x) => [-1.8, 1.8].map((z) => part(cyl(0.2, 0.26, 2.6, 5), 0x4a3a28, { x, y: 1.3, z })))
  return {
    lit: [
      ...stilts,
      part(box(7.4, 0.3, 4.6), PLANK, { y: 2.6 }),
      part(box(6.6, 2.4, 3.8), 0x7a6a44, { y: 4.0 }),
      part(cone(3.4, 3.0, 9), THATCH, { x: -1.9, y: 6.7, sz: 0.9 }),
      part(cone(3.4, 3.0, 9), THATCH, { x: 1.9, y: 6.7, sz: 0.9 }),
      part(cone(1.4, 2.0, 7), 0x3a8a4a, { x: 0, y: 8.4 }), // a lily-pad spire
      part(cyl(1.0, 1.0, 0.08, 10), 0x4aa85a, { y: 7.7, z: 0.4, rz: 0.0 }),
      part(box(1.6, 0.2, 3.0), PLANK, { y: 1.4, z: 3.8, rx: 0.5 }),
      part(box(1.4, 1.9, 0.14), 0x3a2a18, { y: 3.8, z: 1.95 }),
    ],
    glow: [part(ico(0.4, 1), 0xb8ff8a, { x: -2.4, y: 5.0, z: 2.2 }), part(ico(0.4, 1), 0xdaff6a, { x: 2.4, y: 5.0, z: 2.2 }), part(ico(0.3, 1), 0xa6e83a, { x: 0, y: 5.3, z: 2.3 }), part(box(0.9, 0.9, 0.1), 0xc8ff9a, { x: -2.2, y: 4.0, z: 1.93 }), part(box(0.9, 0.9, 0.1), 0xc8ff9a, { x: 2.2, y: 4.0, z: 1.93 })],
  }
}
const mireLamp = () => ({
  lit: [part(cyl(0.05, 0.09, 3.2, 5), 0x5a6a2a, { y: 1.6, rz: 0.08 }), part(box(0.6, 0.06, 0.06), 0x5a6a2a, { x: 0.3, y: 3.2 })],
  glow: [part(ico(0.3, 1), 0xdaff6a, { x: 0.6, y: 2.8 }), part(ico(0.55, 1), 0xa6e83a, { x: 0.6, y: 2.8 })],
})
const mireWell = () => ({
  lit: [part(cyl(1.5, 1.6, 0.5, 9), 0x4a6a3a, { y: 0.25 }), part(cyl(0.7, 0.7, 0.06, 9), 0x3a9a4a, { x: -0.5, y: 0.55, z: 0.3 }), part(cyl(0.5, 0.5, 0.06, 9), 0x4aa85a, { x: 0.6, y: 0.55, z: -0.4 }), part(cyl(0.05, 0.05, 2.0, 4), 0x6a8a3a, { x: 1.4, y: 1.0, z: 0.4 })],
  glow: [part(cyl(1.2, 1.2, 0.04, 9), 0x6ae8a0, { y: 0.52 }), part(ico(0.2, 1), 0xdaff6a, { x: 1.4, y: 2.1, z: 0.4 })],
})
const mireFloor = () => ({
  lit: [part(cyl(12.5, 12.8, 0.1, 20), 0x4a5a30, { y: 0.05 }), part(cyl(9.8, 10.0, 0.18, 20), 0x6a5a38, { y: 0.1 })],
  glow: [part(torus(7.4, 0.07, Math.PI * 2, 40), 0xb8ff8a, { y: 0.22, rx: Math.PI / 2 }), part(torus(4.6, 0.05, Math.PI * 2, 32), 0xdaff6a, { y: 0.22, rx: Math.PI / 2 })],
})


// ---- the four peoples' towns (logic/world.js's cityLayout) -------------------------------------------------------
// Dunekin: a walled oasis. Wall segments run ~8.6 long along x; the gate is two towers with a striped arch.
const duneOasis = () => ({
  lit: [part(cyl(6.2, 6.6, 0.35, 18), SAND_DARK, { y: 0.1 }), part(cyl(5.4, 5.4, 0.3, 18), 0x2a6a7a, { y: 0.12 })],
  glow: [part(cyl(5.2, 5.2, 0.05, 18), 0x5ad8e8, { y: 0.3 }), part(torus(3.2, 0.06, Math.PI * 2, 30), 0xbff6ff, { y: 0.34, rx: Math.PI / 2 })],
})
const palm = () => {
  const fronds = []
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2
    fronds.push(part(box(0.5, 0.06, 3.2), i % 2 ? 0x4a9a3a : 0x5aae44, { x: Math.cos(a) * 1.4, y: 6.6, z: Math.sin(a) * 1.4, ry: -a + Math.PI / 2, rx: 0.35 }))
  }
  return {
    lit: [part(cyl(0.2, 0.32, 6.8, 6), 0x8a6a3a, { y: 3.4, rz: 0.08 }), ...fronds, part(ico(0.35, 0), 0x6a4a2a, { x: 0.3, y: 6.3 }), part(ico(0.3, 0), 0x6a4a2a, { x: -0.2, y: 6.2, z: 0.3 })],
    glow: [],
  }
}
// A segment of the ring wall (31 out, 22 segments: each spans ~8.85 along the ring). It runs a little long, and a round
// buttress stands at each joint, so neighbours overlap into one unbroken wall.
const duneWall = () => ({
  lit: [
    part(box(9.4, 3.6, 1.4), SAND, { y: 1.8 }),
    part(box(9.4, 0.4, 1.7), SAND_DARK, { y: 3.7 }),
    ...[-3.4, -1.15, 1.15, 3.4].map((x) => part(box(1.1, 0.8, 1.5), SAND, { x, y: 4.3 })), // crenellations
    part(cyl(1.0, 1.15, 4.6, 8), SAND_DARK, { x: 4.45, y: 2.3 }), // the buttress at the joint
    part(cone(1.05, 0.9, 8), 0xd8a24a, { x: 4.45, y: 5.05 }),
  ],
  glow: [],
})
const duneGate = () => ({
  lit: [
    part(cyl(1.6, 1.9, 6.4, 8), SAND, { x: -3.4, y: 3.2 }),
    part(cyl(1.6, 1.9, 6.4, 8), SAND, { x: 3.4, y: 3.2 }),
    part(dome(1.7), 0xd8a24a, { x: -3.4, y: 6.4 }),
    part(dome(1.7), 0xd8a24a, { x: 3.4, y: 6.4 }),
    part(torus(3.4, 0.55, Math.PI, 14), SAND_DARK, { y: 4.4 }),
    part(box(5.2, 1.2, 0.12), 0xc0442e, { y: 6.6, z: 0.9 }), // a banner over the arch
  ],
  glow: [part(ico(0.35, 1), 0xffd070, { x: -3.4, y: 4.6, z: 1.8 }), part(ico(0.35, 1), 0xffd070, { x: 3.4, y: 4.6, z: 1.8 })],
})
const duneTent = () => ({
  lit: [
    part(cone(2.4, 3.2, 6), 0xf0e2c0, { y: 1.6 }),
    part(cone(2.5, 0.5, 6), 0xc0442e, { y: 0.9 }),
    part(cyl(0.06, 0.06, 1.2, 4), 0x6a4a2a, { y: 3.6 }),
    part(box(1.2, 1.6, 0.1), 0x8a3a2a, { y: 0.8, z: 1.7, rx: -0.4 }),
    part(box(1.6, 0.5, 1.0), 0x7a5a3a, { x: 2.6, y: 0.25, z: 0.6 }), // a crate of spice
  ],
  glow: [part(ico(0.18, 1), 0xffc870, { x: 1.2, y: 1.0, z: 1.8 })],
})
const duneStall = () => ({
  lit: [
    part(box(2.8, 0.9, 1.3), 0x8a6a3a, { y: 0.45 }),
    ...[[-1.3, -0.6], [1.3, -0.6], [-1.3, 0.6], [1.3, 0.6]].map(([x, z]) => part(cyl(0.07, 0.07, 2.8, 4), 0x6a4a2a, { x, y: 1.4, z })),
    part(box(3.2, 0.1, 2.0), 0xc0442e, { y: 2.9, rx: 0.15 }),
    part(box(3.2, 0.1, 0.5), 0xf4e6c0, { y: 2.95, z: 0.5, rx: 0.15 }),
    part(ico(0.25, 0), 0xe85a2a, { x: -0.8, y: 1.05 }), part(ico(0.25, 0), 0xffb030, { x: -0.3, y: 1.05 }), part(ico(0.22, 0), 0x9a3aa0, { x: 0.4, y: 1.05 }), part(cyl(0.2, 0.25, 0.4, 6), 0x2a8f9a, { x: 0.9, y: 1.1 }),
  ],
  glow: [part(ico(0.16, 1), 0xffd070, { x: 1.3, y: 2.4, z: 0.7 })],
})
// Each people's champion stands on a dais at the back of town: a low round stage with the people's own trimmings.
function dais(stone, trim, glowC, extras) {
  return () => ({
    lit: [part(cyl(3.2, 3.5, 0.6, 14), stone, { y: 0.3 }), part(cyl(2.6, 2.8, 0.3, 14), trim, { y: 0.7 }), ...extras.lit],
    glow: [part(torus(2.3, 0.06, Math.PI * 2, 32), glowC, { y: 0.88, rx: Math.PI / 2 }), ...extras.glow],
  })
}
const duneDais = dais(SAND_DARK, SAND, 0xffd070, {
  lit: [part(box(0.25, 4.5, 0.25), 0x6a4a2a, { x: -2.6, y: 2.2, z: -1.4 }), part(box(0.25, 4.5, 0.25), 0x6a4a2a, { x: 2.6, y: 2.2, z: -1.4 }), part(box(5.4, 0.2, 2.6), 0xc0442e, { y: 4.5, z: -0.4, rx: 0.2 }), part(box(1.4, 2.6, 0.08), 0xc0442e, { x: -2.6, y: 3.0, z: -1.2 }), part(box(1.4, 2.6, 0.08), 0x2a8f9a, { x: 2.6, y: 3.0, z: -1.2 })],
  glow: [part(cone(0.3, 0.8, 6), 0xffb040, { x: -2.6, y: 4.9, z: -1.4 }), part(cone(0.3, 0.8, 6), 0xffb040, { x: 2.6, y: 4.9, z: -1.4 })],
})

// Frostkin: an eyrie. The spire is a towering column of ice and rock; perch-huts stand on tall stilts with a ladder.
const frostSpire = () => {
  const lit = [part(cyl(3.2, 5.0, 10, 7), 0x7a8ea0, { y: 5 }), part(cyl(2.4, 3.2, 10, 7), 0x8aa2b8, { y: 15, ry: 0.4 }), part(cone(2.4, 9, 7), ICE, { y: 24.5, ry: 0.2 })]
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2
    lit.push(part(box(3.6, 0.4, 1.6), 0x6a4a32, { x: Math.cos(a) * 3.8, y: 6 + i * 3.4, z: Math.sin(a) * 3.8, ry: -a })) // spiral perches
    lit.push(part(cone(0.6, 2.6, 5), SNOW, { x: Math.cos(a + 0.6) * 4.2, y: 2 + i * 4, z: Math.sin(a + 0.6) * 4.2, rz: Math.cos(a) * 0.5, rx: Math.sin(a) * 0.5 }))
  }
  return { lit, glow: [part(oct(1.3), 0xbfeaff, { y: 29.5, sy: 1.8 }), part(ico(0.5, 1), 0xffd990, { x: 3.8, y: 6.7 }), part(ico(0.5, 1), 0xffd990, { x: -3.0, y: 13.5, z: 2.2 })] }
}
const frostPerch = () => ({
  lit: [
    part(cyl(0.3, 0.42, 8, 6), 0x5a4030, { y: 4 }),
    part(cyl(0.12, 0.2, 8.4, 5), 0x5a4030, { x: 1.3, y: 4.2, z: 0.8, rz: -0.12 }),
    part(cyl(0.12, 0.2, 8.4, 5), 0x5a4030, { x: -1.3, y: 4.2, z: 0.8, rz: 0.12 }),
    part(cyl(2.4, 2.4, 0.3, 10), 0x6a4a32, { y: 8.1 }),
    part(cyl(1.8, 2.0, 2.0, 10), 0x7a5a42, { y: 9.2 }),
    part(cone(2.6, 2.8, 10), SNOW, { y: 11.6 }),
    part(box(0.6, 8.2, 0.1), 0x8a6a4a, { y: 4.1, z: 2.2, rx: 0.12 }), // a ladder
    ...[1, 2.5, 4, 5.5, 7].map((y) => part(box(0.7, 0.08, 0.12), 0x6a4a32, { y, z: 2.2 - (4.1 - y) * 0.12, })),
    part(cone(0.12, 1.2, 4), 0x3a7ac8, { x: 0.8, y: 13.4, rz: -0.3 }), // a feather pennant
  ],
  glow: [part(box(0.7, 0.7, 0.1), 0xffc070, { y: 9.3, z: 1.95 }), part(ico(0.2, 1), 0xffa040, { x: 2.2, y: 8.6, z: 0.6 })],
})
const frostRack = () => ({
  lit: [part(cyl(0.08, 0.1, 2.4, 4), 0x5a4030, { x: -1, y: 1.2 }), part(cyl(0.08, 0.1, 2.4, 4), 0x5a4030, { x: 1, y: 1.2 }), part(cyl(0.05, 0.05, 2.3, 4), 0x5a4030, { y: 2.3, rz: Math.PI / 2 }), part(box(0.4, 1.0, 0.06), 0xc0d8e8, { x: -0.5, y: 1.7 }), part(box(0.4, 0.9, 0.06), 0x8ab0c8, { x: 0.1, y: 1.75 }), part(box(0.4, 1.1, 0.06), 0xe0b080, { x: 0.6, y: 1.65 })],
  glow: [],
})
const frostTotem = () => ({
  lit: [part(cyl(0.4, 0.45, 3.6, 6), 0x6a4a32, { y: 1.8 }), part(cone(0.35, 0.8, 4), 0xffa040, { y: 3.2, z: 0.45, rx: Math.PI / 2 }), part(box(2.4, 0.3, 0.3), 0x3a7ac8, { y: 2.6 }), part(cone(0.25, 1.1, 4), 0xffffff, { y: 4.1 })],
  glow: [part(ico(0.12, 0), 0x9fe0ff, { x: 0.18, y: 3.3, z: 0.4 }), part(ico(0.12, 0), 0x9fe0ff, { x: -0.18, y: 3.3, z: 0.4 })],
})
const frostDais = dais(0x9aa8b8, 0xdcecf6, 0x9fe0ff, {
  lit: [part(cyl(0.18, 0.24, 5, 5), 0x5a4030, { x: 0, y: 2.8, z: -2.4 }), part(box(3.2, 0.24, 0.24), 0x5a4030, { y: 5.0, z: -2.4 }), part(cone(0.3, 1.4, 4), 0xffffff, { x: -1.4, y: 4.4, z: -2.3 }), part(cone(0.3, 1.4, 4), 0x3a7ac8, { x: 1.4, y: 4.4, z: -2.3 })],
  glow: [part(oct(0.4), 0xbfeaff, { y: 5.6, z: -2.4 })],
})

// Embervolk: crags, boulder-burrows, a great forge, lava channels and mine carts.
const emberCrag = () => ({
  lit: [part(dodeca(5), BASALT, { y: 4, sy: 1.8, sx: 1.2 }), part(dodeca(3.2), BASALT_LIGHT, { x: 3.2, y: 2.6, z: 1, sy: 1.4 }), part(dodeca(2.4), 0x3a3238, { x: -3.4, y: 1.8, z: 0.6 })],
  glow: [part(box(0.25, 5, 0.2), 0xff5a1a, { x: -0.6, y: 5, z: 4.4, rz: 0.2 }), part(box(0.2, 3.6, 0.2), 0xff7a2a, { x: 1.6, y: 3.6, z: 4.1, rz: -0.35 })],
})
const emberBurrow = () => ({
  lit: [
    part(dodeca(3.3), 0x4a3a36, { y: 1.6, sy: 0.95 }),
    part(dodeca(1.6), 0x3a3034, { x: 2.0, y: 3.4, z: -0.8 }),
    part(torus(1.15, 0.35, Math.PI, 10), 0x2a2228, { y: 0.1, z: 3.0 }),
    part(cyl(0.3, 0.45, 2.2, 6), BASALT_LIGHT, { x: -1.4, y: 4.6, z: -1 }), // a smoking chimney
    part(box(1.0, 0.5, 0.7), 0x3a3a46, { x: 2.8, y: 0.25, z: 2.0 }),
  ],
  glow: [part(cyl(0.95, 0.95, 0.1, 10, 1), 0xff7a2a, { y: 1.05, z: 3.05, rx: Math.PI / 2, sy: 1 }), part(cone(0.35, 0.8, 5), 0xffa83a, { x: -1.4, y: 6.0, z: -1 })],
})
const emberForge = () => ({
  lit: [
    part(cyl(2.4, 2.8, 2.2, 8), BASALT, { y: 1.1 }),
    part(cyl(1.6, 2.2, 3.4, 8), BASALT_LIGHT, { y: 3.8 }),
    part(cyl(0.7, 0.9, 3.0, 8), BASALT, { y: 6.6 }),
    part(box(1.2, 0.6, 0.8), 0x3a3a46, { x: 3.4, y: 0.7 }), part(box(0.5, 0.4, 0.5), 0x3a3a46, { x: 3.4, y: 0.2 }),
    part(box(0.5, 2.2, 0.3), 0x5a3a2a, { x: -3.2, y: 1.1, z: 0.4, rz: 0.4 }), // bellows
  ],
  glow: [part(box(1.8, 1.2, 0.1), 0xff7a2a, { y: 1.4, z: 2.7 }), part(cyl(1.5, 1.5, 0.1, 8), 0xff8a2a, { y: 2.25 }), part(cone(0.6, 1.8, 6), 0xffa83a, { y: 8.6 })],
})
const emberLava = () => ({
  lit: [part(box(1.8, 0.3, 11), 0x1e1a1e, { y: 0.1 })],
  glow: [part(box(1.1, 0.06, 10.6), 0xff5a1a, { y: 0.28 }), part(box(0.4, 0.07, 10.4), 0xffb040, { y: 0.3 })],
})
const emberCart = () => ({
  lit: [
    part(box(0.12, 0.1, 6), 0x5a5a66, { x: -0.5, y: 0.05 }), part(box(0.12, 0.1, 6), 0x5a5a66, { x: 0.5, y: 0.05 }),
    ...[-2.4, -1.2, 0, 1.2, 2.4].map((z) => part(box(1.4, 0.08, 0.3), 0x4a3a2a, { y: 0.02, z })),
    part(box(1.3, 0.9, 1.7), 0x4a4a56, { y: 0.75 }),
    part(cyl(0.22, 0.22, 0.15, 8), 0x2a2a30, { x: -0.68, y: 0.3, z: 0.5, rz: Math.PI / 2 }), part(cyl(0.22, 0.22, 0.15, 8), 0x2a2a30, { x: 0.68, y: 0.3, z: 0.5, rz: Math.PI / 2 }),
    part(cyl(0.22, 0.22, 0.15, 8), 0x2a2a30, { x: -0.68, y: 0.3, z: -0.5, rz: Math.PI / 2 }), part(cyl(0.22, 0.22, 0.15, 8), 0x2a2a30, { x: 0.68, y: 0.3, z: -0.5, rz: Math.PI / 2 }),
    part(dodeca(0.4), 0x2a2228, { x: -0.2, y: 1.3 }), part(dodeca(0.35), 0x2a2228, { x: 0.3, y: 1.3, z: 0.4 }),
  ],
  glow: [part(oct(0.25), 0xffa83a, { y: 1.4, z: -0.4 })],
})
const emberAnvil = () => ({
  lit: [part(cyl(0.5, 0.6, 0.8, 6), 0x3a2a24, { y: 0.4 }), part(box(1.2, 0.35, 0.5), 0x3a3a46, { y: 1.0 }), part(cone(0.2, 0.5, 4), 0x3a3a46, { x: 0.8, y: 1.0, rz: -Math.PI / 2 })],
  glow: [part(box(0.5, 0.06, 0.25), 0xff8a2a, { y: 1.2 })],
})
const emberDais = dais(0x1e1a1e, BASALT_LIGHT, 0xff6a2a, {
  lit: [part(dodeca(1.1), BASALT, { x: -2.6, y: 1.4, z: -1.6 }), part(dodeca(1.1), BASALT, { x: 2.6, y: 1.4, z: -1.6 }), part(cyl(0.6, 0.8, 1.2, 7), 0x3a343a, { x: -2.6, y: 2.8, z: -1.6 }), part(cyl(0.6, 0.8, 1.2, 7), 0x3a343a, { x: 2.6, y: 2.8, z: -1.6 })],
  glow: [part(cone(0.5, 1.6, 6), 0xffa83a, { x: -2.6, y: 4.1, z: -1.6 }), part(cone(0.5, 1.6, 6), 0xffa83a, { x: 2.6, y: 4.1, z: -1.6 })],
})

// Mirefolk: a glowing lantern pond with lily pads and boardwalks.
const mirePond = () => ({
  lit: [part(cyl(10.5, 11.2, 0.3, 24), 0x3a4a2a, { y: 0.08 }), part(cyl(9.8, 9.8, 0.3, 24), 0x1a3a3a, { y: 0.1 })],
  glow: [part(cyl(9.6, 9.6, 0.04, 24), 0x3ab89a, { y: 0.27 }), part(torus(6.5, 0.05, Math.PI * 2, 40), 0xb8ff8a, { y: 0.3, rx: Math.PI / 2 }), part(torus(3.4, 0.05, Math.PI * 2, 30), 0xdaff6a, { y: 0.3, rx: Math.PI / 2 })],
})
const mireWalk = () => ({
  lit: [...[-3.6, -2.4, -1.2, 0, 1.2, 2.4, 3.6].map((x, i) => part(box(1.0, 0.14, 1.8), i % 2 ? PLANK : 0x7a6244, { x, y: 0.38, ry: (i % 3 - 1) * 0.05 })), ...[-3.6, 0, 3.6].flatMap((x) => [part(cyl(0.1, 0.12, 0.8, 5), 0x4a3a28, { x, y: 0.2, z: 1.0 }), part(cyl(0.1, 0.12, 0.8, 5), 0x4a3a28, { x, y: 0.2, z: -1.0 })])],
  glow: [],
})
const mireLily = () => ({
  lit: [part(cyl(1.3, 1.3, 0.06, 12, 1), 0x3a9a4a, { y: 0.32 }), part(box(0.9, 0.08, 0.2), 0x1a3a3a, { x: 0.6, y: 0.33 })],
  glow: [part(ico(0.18, 1), 0xffb8e0, { x: -0.3, y: 0.5, z: 0.2 })],
})
const mireDais = dais(0x4a6a3a, 0x3a9a4a, 0xb8ff8a, {
  lit: [part(cyl(0.06, 0.08, 4.4, 5), 0x6a8a3a, { x: -2.4, y: 2.4, z: -1.6, rz: 0.1 }), part(cyl(0.06, 0.08, 4.8, 5), 0x6a8a3a, { x: 2.4, y: 2.6, z: -1.6, rz: -0.1 }), part(cyl(1.6, 1.6, 0.06, 12), 0x4aa85a, { y: 4.3, z: -2.2, rx: 0.4 })],
  glow: [part(ico(0.45, 1), 0xdaff6a, { x: -2.6, y: 4.6, z: -1.6 }), part(ico(0.45, 1), 0xb8ff8a, { x: 2.6, y: 5.0, z: -1.6 })],
})

// ---- the storms' sunken temples (the Depths; logic/stormTemples.js) ----------------------------------------------
// A vast round hall: three stepped tiers of dark stone, a broken outer wall with a great gate (front, +z), tall pillars
// with glowing seams, guardian statues and an altar in the middle (the heart floats over it, phenomenaFx.js).
const deepTemple = () => {
  const STONE = 0x3a3446
  const STONE2 = 0x4a4258
  const lit = [
    part(cyl(27, 28, 0.8, 32), 0x2a2434, { y: 0.2 }),
    part(cyl(19, 19.5, 0.8, 32), STONE, { y: 0.8 }),
    part(cyl(11, 11.5, 0.8, 28), STONE2, { y: 1.4 }),
    part(cyl(2.2, 2.8, 2.2, 8), STONE2, { y: 2.6 }), // the altar
  ]
  const glow = [part(torus(11.3, 0.12, Math.PI * 2, 48), 0xb68aff, { y: 1.85, rx: Math.PI / 2 }), part(torus(19.3, 0.1, Math.PI * 2, 56), 0x8a6aff, { y: 1.25, rx: Math.PI / 2 })]
  // The outer wall: arcs of tall blocks, gapped (it has fallen in places), open at the front for the gate.
  for (let i = 0; i < 30; i++) {
    const a = (i / 30) * Math.PI * 2
    if (Math.abs(Math.atan2(Math.sin(a - Math.PI / 2), Math.cos(a - Math.PI / 2))) < 0.3) continue // the gate (front, +z)
    if (i % 7 === 3) continue // a fallen stretch
    const h = 6 + ((i * 37) % 5)
    lit.push(part(box(5.4, h, 1.6), i % 2 ? STONE : STONE2, { x: Math.cos(a) * 26, y: h / 2, z: Math.sin(a) * 26, ry: -a + Math.PI / 2 }))
  }
  // The great gate: two towers and a lintel, with a glowing sigil.
  for (const x of [-4.8, 4.8]) lit.push(part(box(2.6, 14, 2.6), STONE2, { x, y: 7, z: 26 }))
  lit.push(part(box(12.4, 2.2, 2.8), STONE, { y: 14.6, z: 26 }))
  glow.push(part(oct(1.2), 0xd0a8ff, { y: 12, z: 27.4 }))
  // Tall pillars with glowing seams on the middle tier, and four guardian statues (hooded, kneeling).
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8
    const x = Math.cos(a) * 15.5
    const z = Math.sin(a) * 15.5
    lit.push(part(cyl(1.1, 1.3, 16, 8), STONE, { x, y: 9, z }), part(box(2.8, 0.8, 2.8), STONE2, { x, y: 17.2, z }))
    glow.push(part(box(0.18, 12, 0.18), 0x9a7aff, { x: x - Math.cos(a) * 1.15, y: 9, z: z - Math.sin(a) * 1.15 }))
  }
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2
    const x = Math.cos(a) * 8
    const z = Math.sin(a) * 8
    lit.push(part(cone(1.6, 4.4, 7), 0x2a2434, { x, y: 4, z }), part(dodeca(0.9), 0x2a2434, { x, y: 6.4, z }))
    glow.push(part(ico(0.18, 0), 0xd0a8ff, { x: x - Math.cos(a) * 0.8, y: 6.5, z: z - Math.sin(a) * 0.8 }))
  }
  return { lit, glow }
}

// ---- the storm colosseums (the Depths; logic/depths.js's colosseums) -----------------------------------------------
// A round arena of pale sand ringed by a two-storey arcade of arches, banked seating rising behind it, braziers on the
// wall and a great gate at the front (+z). The wall itself is solid (blockers in logic/depths.js's colosseumLayout).
const colosseum = () => {
  const STONE = 0x5a4e62
  const STONE2 = 0x6e6276
  const DARK = 0x2c2634
  const lit = [
    part(cyl(30.5, 31, 0.6, 40), DARK, { y: 0.1 }),
    part(cyl(23.6, 23.6, 0.3, 40), 0xb8a07a, { y: 0.3 }), // the sand
    part(cyl(5, 5.2, 0.2, 24), 0x9a8460, { y: 0.48 }), // the middle
  ]
  const glow = [part(torus(23.4, 0.12, Math.PI * 2, 64), 0xffc06a, { y: 0.5, rx: Math.PI / 2 }), part(torus(5.1, 0.1, Math.PI * 2, 32), 0xffd98a, { y: 0.6, rx: Math.PI / 2 })]
  const n = 32
  const gateAt = (a) => Math.abs(Math.atan2(Math.sin(a - Math.PI / 2), Math.cos(a - Math.PI / 2))) < 0.2
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    const mid = a + Math.PI / n
    const ry = -a + Math.PI / 2
    if (!gateAt(a)) {
      // The arcade: a pier at each step, a lintel to the next, and a second storey of smaller piers.
      lit.push(part(box(1.6, 7, 2.2), STONE2, { x: Math.cos(a) * 24.6, y: 3.5, z: Math.sin(a) * 24.6, ry }))
      lit.push(part(box(1.2, 4, 1.8), STONE, { x: Math.cos(a) * 24.8, y: 9.6, z: Math.sin(a) * 24.8, ry }))
    }
    if (!gateAt(mid)) {
      const mry = -mid + Math.PI / 2
      lit.push(part(box(5.2, 1.2, 2.4), STONE, { x: Math.cos(mid) * 24.6, y: 7.4, z: Math.sin(mid) * 24.6, ry: mry }))
      lit.push(part(box(5.2, 1, 2), STONE2, { x: Math.cos(mid) * 24.8, y: 12, z: Math.sin(mid) * 24.8, ry: mry }))
      // Banked seating behind the wall: three steps rising outward.
      for (let k = 0; k < 3; k++) lit.push(part(box(5.6 + k * 0.6, 2 + k * 2.2, 1.8), k % 2 ? STONE : DARK, { x: Math.cos(mid) * (26.6 + k * 1.6), y: 1 + k * 1.1, z: Math.sin(mid) * (26.6 + k * 1.6), ry: mry }))
    }
    if (i % 4 === 2 && !gateAt(a)) { // braziers on the wall
      lit.push(part(cyl(0.5, 0.3, 0.8, 8), DARK, { x: Math.cos(a) * 23.4, y: 7.6, z: Math.sin(a) * 23.4 }))
      glow.push(part(cone(0.45, 1.1, 6), 0xff8a3a, { x: Math.cos(a) * 23.4, y: 8.5, z: Math.sin(a) * 23.4 }))
    }
  }
  // The great gate: two towers and a lintel with a glowing sigil, facing the middle of the world.
  for (const x of [-5.2, 5.2]) lit.push(part(box(2.8, 15, 3), STONE2, { x, y: 7.5, z: 24.6 }), part(cone(2.1, 3, 4), DARK, { x, y: 16.5, z: 24.6, ry: Math.PI / 4 }))
  lit.push(part(box(13, 2.2, 3.2), STONE, { y: 13.6, z: 24.6 }))
  glow.push(part(oct(1.3), 0xffd98a, { y: 11.2, z: 26.3 }))
  // Four statues of champions past, kneeling round the sand.
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4
    const x = Math.cos(a) * 21
    const z = Math.sin(a) * 21
    lit.push(part(box(2.4, 1.2, 2.4), DARK, { x, y: 0.6, z }), part(cone(1.3, 3.6, 7), STONE, { x, y: 3, z }), part(dodeca(0.75), STONE, { x, y: 5.2, z }))
  }
  return { lit, glow }
}

export const CITY_MODELS = {
  deepTemple,
  colosseum,
  duneOasis, palm, duneWall, duneGate, duneTent, duneStall, duneDais,
  frostSpire, frostPerch, frostRack, frostTotem, frostDais,
  emberCrag, emberBurrow, emberForge, emberLava, emberCart, emberAnvil, emberDais,
  mirePond, mireWalk, mireLily, mireDais,
  duneHome: duneHome(0xd8a24a, 0xc0442e),
  duneHomeB: duneHome(0xb85a3a, 0x2a8f9a),
  duneHall, duneLamp, duneWell, duneFloor,
  frostIgloo: frostIgloo(0x8ac4e0),
  frostLonghouse: frostLonghouse(),
  frostHall, frostLamp, frostWell, frostFloor,
  emberHome: emberForgeHouse(0x8a2a1a),
  emberHomeB: emberForgeHouse(0x4a4a5a),
  emberHall, emberLamp, emberWell, emberFloor,
  mireHome: mireStiltHut(THATCH),
  mireHomeB: mireStiltHut(0x5a8a3a),
  mireHall, mireLamp, mireWell, mireFloor,
}
