import * as THREE from 'three'
import { TRAIL_MAX_POINTS, TRAIL_WIDTH } from './config.js'
import { pushTrailPoint, trailAlphaAt } from './logic/trail.js'

const UP = new THREE.Vector3(0, 1, 0)
const scratchDir = new THREE.Vector3()
const scratchSide = new THREE.Vector3()

// Builds an empty swing-trail ribbon: a pre-allocated triangle strip
// (two vertices per history point) with vertex colors used for the fade
// -- additive blending with the color darkening toward the oldest end
// gives the same visual falloff as per-vertex alpha would, without a
// custom shader. Create once per session (it's a free-floating mesh fed
// by the player's current sword tip, not owned by any one game run) and
// clear it on restart via clearSwingTrail.
export function createSwingTrail(color) {
  const maxVertices = TRAIL_MAX_POINTS * 2
  const positions = new Float32Array(maxVertices * 3)
  const colors = new Float32Array(maxVertices * 3)
  const indices = []
  for (let i = 0; i < TRAIL_MAX_POINTS - 1; i++) {
    const a = i * 2
    const b = i * 2 + 1
    const c = (i + 1) * 2
    const d = (i + 1) * 2 + 1
    indices.push(a, b, c, b, d, c)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setIndex(indices)
  geometry.setDrawRange(0, 0)

  const material = new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  })

  const mesh = new THREE.Mesh(geometry, material)
  mesh.frustumCulled = false

  return { mesh, history: [], color: new THREE.Color(color) }
}

// Appends the blade tip's current world position to the trail's history
// (capped at TRAIL_MAX_POINTS) and rewrites the ribbon's vertex
// positions/colors to match: each point offsets left/right (perpendicular
// to the segment direction and world up) for width, with color fading
// toward black at the oldest end. Call every frame a swing is in flight.
export function updateSwingTrail(trail, tipWorldPosition) {
  trail.history = pushTrailPoint(trail.history, tipWorldPosition.clone(), TRAIL_MAX_POINTS)
  const { history } = trail
  const position = trail.mesh.geometry.attributes.position
  const color = trail.mesh.geometry.attributes.color

  for (let i = 0; i < history.length; i++) {
    const point = history[i]
    const next = history[i + 1] ?? history[i - 1] ?? point
    scratchDir.subVectors(next, point)
    if (scratchDir.lengthSq() < 1e-8) scratchDir.set(0, 0, 1)
    scratchSide.crossVectors(scratchDir, UP).normalize().multiplyScalar(TRAIL_WIDTH / 2)

    const alpha = trailAlphaAt(i, history.length)
    const a = i * 2
    position.setXYZ(a, point.x + scratchSide.x, point.y + scratchSide.y, point.z + scratchSide.z)
    position.setXYZ(a + 1, point.x - scratchSide.x, point.y - scratchSide.y, point.z - scratchSide.z)
    color.setXYZ(a, trail.color.r * alpha, trail.color.g * alpha, trail.color.b * alpha)
    color.setXYZ(a + 1, trail.color.r * alpha, trail.color.g * alpha, trail.color.b * alpha)
  }

  position.needsUpdate = true
  color.needsUpdate = true
  const segments = Math.max(history.length - 1, 0)
  trail.mesh.geometry.setDrawRange(0, segments * 6)
}

// Clears the trail's history and draw range, so nothing renders. Call
// once the swing ends, or on restart.
export function clearSwingTrail(trail) {
  trail.history = []
  trail.mesh.geometry.setDrawRange(0, 0)
}
