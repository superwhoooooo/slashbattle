// The paraglider: a ram-air parafoil over the player. Nine puffy inflated cells on a strongly arched wing (elliptical, tapering
// to the tips), in bold violet / magenta with yellow tips and a white centre cell, dark cell mouths along the leading edge, a
// glowing cyan trailing edge, and a fan of suspension lines from every rib down to two risers at the shoulders. It unfurls
// when opened and folds away; the trailing edge pulses while you fly. Parented to the player mesh (forward = +z).
import * as THREE from 'three'

const CELLS = 9
const PER_CELL = 4 // span segments in each cell
const CHORD_N = 12 // chord segments, leading edge to trailing edge
const ARC_R = 3.6 // the wing's arc (span curvature)
const ARC_SPREAD = 0.82 // half the arc's angle, radians
const ROOT_CHORD = 2.7
const LIFT = 4.0 // the wing's middle sits this high over the player's feet
const RISER = { x: 0.36, y: 1.35, z: 0.05 } // where the lines gather (one riser each side)

const PALETTE = [0xffd23a, 0xff3d8b, 0x6a2cff, 0xff3d8b, 0xffffff, 0xff3d8b, 0x6a2cff, 0xff3d8b, 0xffd23a]
const MOUTH = new THREE.Color(0x1a1030)

// Where a point of the wing is: span s in [-1, 1], chord u in [0 (leading), 1 (trailing)], height h off the chord line.
function wingPoint(s, u, h) {
  const theta = s * ARC_SPREAD
  const chord = ROOT_CHORD * Math.sqrt(Math.max(0.05, 1 - 0.72 * s * s))
  const cx = ARC_R * Math.sin(theta)
  const cy = ARC_R * Math.cos(theta) - ARC_R
  const z = chord * (0.42 - u) // leading edge forward (+z)
  return new THREE.Vector3(cx + Math.sin(theta) * h, cy + Math.cos(theta) * h, z)
}
// A flat-bottomed airfoil's half-thickness at chord u (a NACA-style curve, times the local chord).
function airfoil(u, chord) {
  const t = 0.16 * 5 * (0.2969 * Math.sqrt(u) - 0.126 * u - 0.3516 * u * u + 0.2843 * u ** 3 - 0.1036 * u ** 4)
  return t * chord
}

function buildCanopy() {
  const positions = []
  const colors = []
  const indices = []
  const color = new THREE.Color()
  const push = (p, c) => {
    positions.push(p.x, p.y, p.z)
    colors.push(c.r, c.g, c.b)
    return positions.length / 3 - 1
  }
  for (let cell = 0; cell < CELLS; cell++) {
    const base = new THREE.Color(PALETTE[cell])
    const under = base.clone().multiplyScalar(0.55)
    for (const side of ['top', 'bottom']) {
      const start = positions.length / 3
      for (let i = 0; i <= PER_CELL; i++) {
        const local = i / PER_CELL // 0..1 across this cell
        const s = -1 + (2 * (cell + local)) / CELLS
        const chord = ROOT_CHORD * Math.sqrt(Math.max(0.05, 1 - 0.72 * s * s))
        const puff = 1 + 0.22 * Math.sin(Math.PI * local) // each cell bulges between its ribs
        for (let j = 0; j <= CHORD_N; j++) {
          const u = j / CHORD_N
          const t = airfoil(u, chord)
          const camber = 0.06 * chord * Math.sin(Math.PI * u)
          const h = side === 'top' ? camber + t * puff : camber - t * 0.3
          if (side === 'top') color.copy(base)
          else color.copy(u < 0.12 ? MOUTH : under) // the open cell mouths along the front, underneath
          push(wingPoint(s, u, h), color)
        }
      }
      const row = CHORD_N + 1
      for (let i = 0; i < PER_CELL; i++) {
        for (let j = 0; j < CHORD_N; j++) {
          const a = start + i * row + j
          const b = a + row
          if (side === 'top') indices.push(a, b, a + 1, b, b + 1, a + 1)
          else indices.push(a, a + 1, b, b, a + 1, b + 1)
        }
      }
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals() // (per cell, so the seams between cells read as ribs)
  return geometry
}

export function createGlider() {
  const group = new THREE.Group()
  group.visible = false
  const wing = new THREE.Group()
  wing.position.y = LIFT
  group.add(wing)

  const canopy = new THREE.Mesh(
    buildCanopy(),
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.05, side: THREE.DoubleSide, emissive: 0x2a0a40, emissiveIntensity: 0.35 }),
  )
  canopy.castShadow = true
  wing.add(canopy)

  // The glowing trailing edge.
  const trail = []
  for (let i = 0; i <= 40; i++) trail.push(wingPoint(-1 + (2 * i) / 40, 1, 0.01))
  const edgeMaterial = new THREE.MeshBasicMaterial({ color: 0x5ef2ff })
  const edge = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(trail), 48, 0.045, 5, false), edgeMaterial)
  wing.add(edge)
  // ...and a thin yellow piping along the leading edge.
  const lead = []
  for (let i = 0; i <= 40; i++) lead.push(wingPoint(-1 + (2 * i) / 40, 0, 0))
  wing.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(lead), 48, 0.035, 5, false), new THREE.MeshStandardMaterial({ color: 0xffd23a, emissive: 0x6a4a00, roughness: 0.4 })))

  // Suspension lines: from every rib (three points along the chord) down to the riser on that side.
  const points = []
  for (let rib = 0; rib <= CELLS; rib++) {
    const s = -1 + (2 * rib) / CELLS
    const riserX = s < 0 ? -RISER.x : s > 0 ? RISER.x : 0
    for (const u of [0.12, 0.45, 0.8]) {
      const chord = ROOT_CHORD * Math.sqrt(Math.max(0.05, 1 - 0.72 * s * s))
      const p = wingPoint(s, u, 0.06 * chord * Math.sin(Math.PI * u) - airfoil(u, chord) * 0.3)
      points.push(p.x, p.y + LIFT, p.z, riserX, RISER.y, RISER.z)
    }
  }
  // The risers themselves, down to the shoulders.
  points.push(-RISER.x, RISER.y, RISER.z, -0.3, 0.95, 0, RISER.x, RISER.y, RISER.z, 0.3, 0.95, 0)
  const lines = new THREE.LineSegments(
    new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(points, 3)),
    new THREE.LineBasicMaterial({ color: 0xf4ecff, transparent: true, opacity: 0.7 }),
  )
  group.add(lines)

  group.userData.open = 0
  group.userData.wing = wing
  group.userData.edge = edgeMaterial
  return group
}

const EDGE_A = new THREE.Color(0x5ef2ff)
const EDGE_B = new THREE.Color(0xd9fbff)

// Unfurl (open) or fold (closed) the canopy; it banks with the turn, breathes a little, and the trailing edge pulses.
export function updateGlider(glider, open, dt, time, bank = 0) {
  const target = open ? 1 : 0
  glider.userData.open += (target - glider.userData.open) * Math.min(1, dt * 9)
  const t = glider.userData.open
  glider.visible = t > 0.02
  // Unfurl from the middle outwards: the span opens wider than it grows tall.
  glider.scale.set(0.12 + 0.88 * t * t, 0.35 + 0.65 * t, 0.3 + 0.7 * t)
  glider.rotation.z = bank * 0.25 + Math.sin(time * 2.2) * 0.04
  glider.rotation.x = Math.sin(time * 1.7) * 0.03
  const wing = glider.userData.wing
  if (wing) {
    const breathe = 1 + Math.sin(time * 3.1) * 0.015
    wing.scale.set(1, breathe, 1)
    wing.rotation.x = -0.06 + Math.sin(time * 1.3) * 0.02 // a slight nose-up trim
  }
  glider.userData.edge?.color.copy(EDGE_A).lerp(EDGE_B, 0.5 + 0.5 * Math.sin(time * 4))
}
