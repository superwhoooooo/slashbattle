// Pure, Three-free geometry for placing face features (eyes, brow,
// mouth, tongue, cheeks) on the SURFACE of a jelly body, so they
// protrude just outside it instead of being sunk inside it (the old
// flat face plane bug). Kept free of Three.js imports so Vitest can
// exercise it without WebGL; the Three-side driver lives in
// src/face3d.js.
//
// `size` follows the same convention each shape's geometry builder in
// characters.js already uses: the icosahedron's `size` is its radius
// directly (IcosahedronGeometry(size, 1), the player's body); the
// dodecahedron/octahedron's `size` is the stats.size that builder halves
// into a radius (DodecahedronGeometry(size / 2), OctahedronGeometry(size
// / 2)); the box's `size` is the stats.size that builder turns into
// half-extents (BoxGeometry(size * 0.7, size, size * 0.7)).

const PHI = (1 + Math.sqrt(5)) / 2

// The regular dodecahedron's insphere-to-circumsphere ratio: how much
// shorter the distance to a face's plane is than the distance to a
// vertex. (The icosahedron shares this same ratio, being its dual, but
// characters.js builds the player's icosahedron with one subdivision
// level -- see bodySurfaceDistance's 'icosahedron' case -- so only the
// dodecahedron needs it here.)
const DODECAHEDRON_INSPHERE_RATIO = Math.sqrt((25 + 11 * Math.sqrt(5)) / 10) / (Math.sqrt(3) * PHI)

// The dodecahedron's 12 face-normal directions. three.js builds both the
// icosahedron and the dodecahedron (its dual) from cyclic permutations of
// (0, 1, PHI); those are exactly the icosahedron's 12 vertex directions,
// and, by the dual relationship, the dodecahedron's 12 face-normal
// directions too.
const DODECAHEDRON_FACE_NORMALS = [
  [0, 1, PHI], [0, 1, -PHI], [0, -1, PHI], [0, -1, -PHI],
  [1, PHI, 0], [1, -PHI, 0], [-1, PHI, 0], [-1, -PHI, 0],
  [PHI, 0, 1], [PHI, 0, -1], [-PHI, 0, 1], [-PHI, 0, -1],
].map(([x, y, z]) => {
  const length = Math.hypot(x, y, z)
  return { x: x / length, y: y / length, z: z / length }
})

// The zippy octahedron is stretched 1.3x vertically after being built
// (see characters.js's createZippyGeometry), so the surface math needs
// the same factor.
export const OCTAHEDRON_VERTICAL_STRETCH = 1.3

function normalize(x, y, z) {
  const length = Math.hypot(x, y, z) || 1
  return { x: x / length, y: y / length, z: z / length }
}

// Distance from a body's center to its surface along a direction
// (dirX, dirY, dirZ; not required to be normalized already), for one of
// the jelly body shapes characters.js builds ('icosahedron',
// 'dodecahedron', 'octahedron', 'box').
export function bodySurfaceDistance(shape, size, dirX, dirY, dirZ) {
  const d = normalize(dirX, dirY, dirZ)

  switch (shape) {
    case 'icosahedron': {
      // Built with IcosahedronGeometry(size, 1): every vertex, including
      // the ones added by that single subdivision level, is re-projected
      // onto the sphere of radius `size`, so the body is close enough to
      // a sphere that treating its surface as one is simple -- and
      // always safe, since every point of the actual mesh lies within
      // that sphere, so a feature placed there never sinks into a face.
      return size
    }

    case 'dodecahedron': {
      // Built with DodecahedronGeometry(size / 2): an exact regular
      // dodecahedron, so the exact surface distance along a direction is
      // the smallest, over the 12 face planes (each the same insphere
      // distance from the center) whose half-space the direction points
      // into, of insphere / (faceNormal . direction).
      const circumradius = size / 2
      const insphere = circumradius * DODECAHEDRON_INSPHERE_RATIO
      let minDistance = Infinity
      for (const n of DODECAHEDRON_FACE_NORMALS) {
        const alignment = n.x * d.x + n.y * d.y + n.z * d.z
        if (alignment > 1e-9) minDistance = Math.min(minDistance, insphere / alignment)
      }
      return minDistance
    }

    case 'octahedron': {
      // Built with OctahedronGeometry(size / 2) then scaled 1.3x
      // vertically: the unscaled octahedron's surface is the exact L1
      // ball |x| + |y| + |z| = radius, so scaling y by the stretch
      // factor gives |x| + |y| / stretch + |z| = radius along the scaled
      // axes.
      const radius = size / 2
      const denom = Math.abs(d.x) + Math.abs(d.y) / OCTAHEDRON_VERTICAL_STRETCH + Math.abs(d.z)
      return denom > 1e-9 ? radius / denom : radius
    }

    case 'box': {
      // Built with BoxGeometry(size * 0.7, size, size * 0.7): exact
      // half-extents, so the exact surface distance is the smallest of
      // each axis's half-extent divided by that axis's direction
      // component.
      const halfExtents = { x: size * 0.35, y: size * 0.5, z: size * 0.35 }
      let minDistance = Infinity
      if (Math.abs(d.x) > 1e-9) minDistance = Math.min(minDistance, halfExtents.x / Math.abs(d.x))
      if (Math.abs(d.y) > 1e-9) minDistance = Math.min(minDistance, halfExtents.y / Math.abs(d.y))
      if (Math.abs(d.z) > 1e-9) minDistance = Math.min(minDistance, halfExtents.z / Math.abs(d.z))
      return minDistance
    }

    default:
      throw new Error(`bodySurfaceDistance: unknown shape "${shape}"`)
  }
}

// Small perturbations (not true spherical angles) off the forward-ish
// direction the old flat face plane pointed along, spreading eyes/brow/
// mouth/tongue/cheeks out across a face-sized patch of the body.
const EYE_OUTWARD = 0.34
const EYE_UPWARD = 0.1
const BROW_UPWARD = EYE_UPWARD + 0.16
const MOUTH_UPWARD = -0.3
const TONGUE_UPWARD = MOUTH_UPWARD - 0.08
const CHEEK_OUTWARD = 0.46
const CHEEK_UPWARD = -0.02

// How far past the computed surface distance a feature's anchor sits, so
// it visibly protrudes (a googly eye socket, a lip) rather than merely
// grazing the surface.
const PROTRUSION = 1.06

function faceDirection(outward, upward) {
  return normalize(outward, 0.18 + upward, 1)
}

// Computes where each face feature's anchor sits, in positions relative
// to the character group (i.e. already including `bodyCenterY`, the
// body mesh's own y offset within that group -- size / 2 for monsters,
// PLAYER_BODY_RADIUS for the player, matching characters.js). Each
// anchor also carries `dir`, the unit outward surface normal it was
// placed along, which face3d.js uses to orient the feature and to give
// a googly pupil a front-of-the-eyeball axis to jiggle within.
export function faceLayout(shape, size, bodyCenterY) {
  const place = (outward, upward) => {
    const dir = faceDirection(outward, upward)
    const distance = bodySurfaceDistance(shape, size, dir.x, dir.y, dir.z) * PROTRUSION
    return { x: dir.x * distance, y: bodyCenterY + dir.y * distance, z: dir.z * distance, dir }
  }

  return {
    leftEye: place(-EYE_OUTWARD, EYE_UPWARD),
    rightEye: place(EYE_OUTWARD, EYE_UPWARD),
    brow: place(0, BROW_UPWARD),
    mouth: place(0, MOUTH_UPWARD),
    tongue: place(0, TONGUE_UPWARD),
    leftCheek: place(-CHEEK_OUTWARD, CHEEK_UPWARD),
    rightCheek: place(CHEEK_OUTWARD, CHEEK_UPWARD),
  }
}
