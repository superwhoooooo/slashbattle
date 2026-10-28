import { describe, expect, it } from 'vitest'
import { bodySurfaceDistance, faceLayout } from '../src/logic/faceLayout.js'

const SHAPES_AND_SIZES = [
  ['icosahedron', 0.6], // the player's body (size is its radius directly)
  ['dodecahedron', 1.4], // blobbo
  ['octahedron', 0.6], // zippy
  ['box', 1.1], // grumpus
]

describe('bodySurfaceDistance', () => {
  it('matches the box half-extents along each axis', () => {
    // BoxGeometry(size * 0.7, size, size * 0.7): half-extents are
    // size * 0.35 (x/z) and size * 0.5 (y).
    expect(bodySurfaceDistance('box', 2, 1, 0, 0)).toBeCloseTo(0.7, 5)
    expect(bodySurfaceDistance('box', 2, 0, 1, 0)).toBeCloseTo(1, 5)
    expect(bodySurfaceDistance('box', 2, 0, 0, 1)).toBeCloseTo(0.7, 5)
  })

  it('matches the octahedron radius along an unstretched axis', () => {
    // OctahedronGeometry(size / 2): vertices at radius size / 2 along x/z.
    expect(bodySurfaceDistance('octahedron', 2, 1, 0, 0)).toBeCloseTo(1, 5)
    expect(bodySurfaceDistance('octahedron', 2, 0, 0, 1)).toBeCloseTo(1, 5)
  })

  it('stretches the octahedron surface 1.3x vertically', () => {
    expect(bodySurfaceDistance('octahedron', 2, 0, 1, 0)).toBeCloseTo(1.3, 5)
  })

  it('returns the radius for the icosahedron in every direction (treated as a sphere)', () => {
    expect(bodySurfaceDistance('icosahedron', 0.6, 1, 0, 0)).toBeCloseTo(0.6, 5)
    expect(bodySurfaceDistance('icosahedron', 0.6, 0, 1, 1)).toBeCloseTo(0.6, 5)
    expect(bodySurfaceDistance('icosahedron', 0.6, 0.3, -0.2, 0.9)).toBeCloseTo(0.6, 5)
  })

  it('reaches exactly the circumradius toward a dodecahedron vertex', () => {
    // (1, 1, 1) is an actual dodecahedron vertex direction (three.js
    // builds it from permutations of (+-1, +-1, +-1)).
    expect(bodySurfaceDistance('dodecahedron', 2, 1, 1, 1)).toBeCloseTo(1, 5)
  })

  it('is shorter toward a dodecahedron face center than toward a vertex', () => {
    const toFaceCenter = bodySurfaceDistance('dodecahedron', 2, 0, 1, (1 + Math.sqrt(5)) / 2)
    const toVertex = bodySurfaceDistance('dodecahedron', 2, 1, 1, 1)
    expect(toFaceCenter).toBeLessThan(toVertex)
    expect(toFaceCenter / toVertex).toBeCloseTo(0.7947, 3)
  })
})

// Reproduces the bug: before the fix, characters.js positioned the flat
// face plane's anchor INSIDE the solid jelly body, so the body occluded
// it. These anchors are the exact numbers characters.js used.
describe('the original (pre-fix) face anchors sit inside the body surface', () => {
  it("the monster's old faceAnchor offset is inside a dodecahedron body (blobbo)", () => {
    const size = 1.4
    const bodyCenterY = size / 2
    // faceAnchor.position.set(0, stats.size * 0.55, stats.size * 0.35 + 0.01)
    const anchor = { x: 0, y: size * 0.55, z: size * 0.35 + 0.01 }
    const relative = { x: anchor.x, y: anchor.y - bodyCenterY, z: anchor.z }
    const distance = Math.hypot(relative.x, relative.y, relative.z)
    const surface = bodySurfaceDistance('dodecahedron', size, relative.x, relative.y, relative.z)
    expect(distance).toBeLessThan(surface) // sunk inside, not protruding
  })

  it("the player's old faceAnchor offset is inside the icosahedron body", () => {
    const radius = 0.6 // PLAYER_BODY_RADIUS
    // faceAnchor.position.set(0, PLAYER_BODY_RADIUS * 1.1, PLAYER_BODY_RADIUS * 0.85)
    const anchor = { x: 0, y: radius * 1.1, z: radius * 0.85 }
    const relative = { x: anchor.x, y: anchor.y - radius, z: anchor.z }
    const distance = Math.hypot(relative.x, relative.y, relative.z)
    const surface = bodySurfaceDistance('icosahedron', radius, relative.x, relative.y, relative.z)
    expect(distance).toBeLessThan(surface) // sunk inside, not protruding
  })
})

describe('faceLayout', () => {
  const EPSILON = 0.005

  for (const [shape, size] of SHAPES_AND_SIZES) {
    it(`places every feature strictly outside the ${shape} body's surface`, () => {
      const bodyCenterY = shape === 'icosahedron' ? size : size / 2
      const layout = faceLayout(shape, size, bodyCenterY)

      for (const [name, anchor] of Object.entries(layout)) {
        const relative = { x: anchor.x, y: anchor.y - bodyCenterY, z: anchor.z }
        const distance = Math.hypot(relative.x, relative.y, relative.z)
        const surface = bodySurfaceDistance(shape, size, relative.x, relative.y, relative.z)
        expect(distance, `${name} on ${shape}`).toBeGreaterThanOrEqual(surface + EPSILON)
      }
    })
  }

  it('keeps the left eye to one side and the right eye to the other', () => {
    const layout = faceLayout('icosahedron', 0.6, 0.6)
    expect(layout.leftEye.x).toBeLessThan(0)
    expect(layout.rightEye.x).toBeGreaterThan(0)
  })

  it('places the brow above the eyes and the mouth below them', () => {
    const layout = faceLayout('dodecahedron', 1.4, 0.7)
    expect(layout.brow.y).toBeGreaterThan(layout.leftEye.y)
    expect(layout.mouth.y).toBeLessThan(layout.leftEye.y)
    expect(layout.tongue.y).toBeLessThan(layout.mouth.y)
  })
})

describe('bodySurfaceDistance: boss shapes', () => {
  it('treats the sphere as a ball of radius size / 2', () => {
    expect(bodySurfaceDistance('sphere', 4, 1, 2, 3)).toBeCloseTo(2, 5)
  })

  it('puts the tetrahedron face 1/3 of the circumradius out along a face normal', () => {
    // size 6 -> circumradius 3 -> insphere 1; straight along a face normal.
    expect(bodySurfaceDistance('tetrahedron', 6, 1, 1, -1)).toBeCloseTo(1, 5)
    // ...and reaches a vertex (the full circumradius) pointing at one.
    expect(bodySurfaceDistance('tetrahedron', 6, 1, 1, 1)).toBeCloseTo(3, 5)
  })

  it('hits the cylinder side or a cap, whichever is first', () => {
    expect(bodySurfaceDistance('cylinder', 5, 1, 0, 0)).toBeCloseTo(2, 5) // radius 0.4 * 5
    expect(bodySurfaceDistance('cylinder', 5, 0, 1, 0)).toBeCloseTo(2.5, 5) // half height
    expect(bodySurfaceDistance('cylinder', 5, 0, -1, 0)).toBeCloseTo(2.5, 5)
  })

  it('narrows the cone toward its apex and flares to the base', () => {
    // size 4: base radius 2, height 4.4. Straight up reaches the apex; straight down the base.
    expect(bodySurfaceDistance('cone', 4, 0, 1, 0)).toBeCloseTo(2.2, 5)
    expect(bodySurfaceDistance('cone', 4, 0, -1, 0)).toBeCloseTo(2.2, 5)
    // Sideways from the middle: half the base radius (the slant is halfway up).
    expect(bodySurfaceDistance('cone', 4, 1, 0, 0)).toBeCloseTo(1, 5)
  })

  it('never returns a non-positive or infinite distance, in any direction', () => {
    for (const shape of ['sphere', 'tetrahedron', 'cylinder', 'cone']) {
      for (let i = 0; i < 200; i++) {
        const a = i * 0.731
        const b = i * 1.377
        const distance = bodySurfaceDistance(shape, 3, Math.cos(a) * Math.cos(b), Math.sin(b), Math.sin(a) * Math.cos(b))
        expect(distance).toBeGreaterThan(0)
        expect(Number.isFinite(distance)).toBe(true)
      }
    }
  })
})
