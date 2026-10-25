import * as THREE from 'three'
import {
  JELLY_EMISSIVE_INTENSITY,
  JELLY_METALNESS,
  JELLY_ROUGHNESS,
  MONSTER_TYPES,
  PLAYER_BODY_RADIUS,
  PLAYER_EDGE_COLOR,
  PLAYER_RADIUS,
} from './config.js'
import { createFaceTexture, PLAYER_FACE, randomGoofyFace } from './faces.js'
import { createJellyBody } from './jelly.js'

const PLAYER_BODY_COLOR = 0x3388ff

// A simple sword prop: a blade box plus a crossguard box, grouped so
// later milestones can animate the whole swing as one object. Attached
// directly to the body group (not the face anchor), so it stays rigid
// and doesn't pulse with the jelly bulge/hit state.
function createSword() {
  const group = new THREE.Group()

  const blade = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.8, 0.03),
    new THREE.MeshStandardMaterial({ color: 0xcfd4da, metalness: 0.6, roughness: 0.3 }),
  )
  blade.position.y = 0.4
  group.add(blade)

  const crossguard = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, 0.06, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x8b5a2b }),
  )
  group.add(crossguard)

  return group
}

function createFacePlane(texture, size) {
  return new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true }),
  )
}

const INDICATOR_SIZE = 0.4

// Draws a single bold glyph ("!" or "?") onto a small canvas for use as a
// sprite texture.
function createIndicatorTexture(glyph) {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, 64, 64)
  ctx.font = 'bold 48px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineWidth = 6
  ctx.strokeStyle = '#000000'
  ctx.strokeText(glyph, 32, 34)
  ctx.fillStyle = '#fff200'
  ctx.fillText(glyph, 32, 34)
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

function createIndicatorSprite(glyph) {
  const material = new THREE.SpriteMaterial({
    map: createIndicatorTexture(glyph),
    transparent: true,
    depthTest: false,
  })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(INDICATOR_SIZE, INDICATOR_SIZE, 1)
  sprite.visible = false
  return sprite
}

// Flat-shaded, faceted jelly material: a saturated base color, a little
// metalness/roughness, and a low emissive tint of the same color so
// bloom gives the body a faint glow without washing out the face.
// Remembers its own baseline emissive color (material.userData.baseEmissive)
// so the hit-flash animation (player.js, combat.js) can fade back to it
// instead of to black.
function createJellyMaterial(color) {
  const material = new THREE.MeshStandardMaterial({
    color,
    flatShading: true,
    metalness: JELLY_METALNESS,
    roughness: JELLY_ROUGHNESS,
    emissive: new THREE.Color(color),
    emissiveIntensity: JELLY_EMISSIVE_INTENSITY,
  })
  material.userData.baseEmissive = material.emissive.clone()
  return material
}

function createPlayerGeometry() {
  return new THREE.IcosahedronGeometry(PLAYER_BODY_RADIUS, 1)
}

function createBlobboGeometry(size) {
  return new THREE.DodecahedronGeometry(size / 2)
}

function createZippyGeometry(size) {
  const geometry = new THREE.OctahedronGeometry(size / 2)
  geometry.scale(1, 1.3, 1) // small, slightly stretched tall
  return geometry
}

function createGrumpusGeometry(size) {
  // A few segments per side (not a bare 8-vertex box), so there are
  // interior vertices for the jelly deformation to actually jiggle.
  return new THREE.BoxGeometry(size * 0.7, size, size * 0.7, 3, 3, 3)
}

const GEOMETRY_BUILDERS = {
  dodecahedron: createBlobboGeometry,
  octahedron: createZippyGeometry,
  box: createGrumpusGeometry,
}

// Builds the player's body: a faceted, flat-shaded icosahedron jelly body
// with glowing neon edges, the goofy preset face on a plane in front of
// it (riding a face anchor that pulses with the jelly's bulge/hit state),
// and a sword held at the side as a rigid child group.
export function createPlayerMesh() {
  const geometry = createPlayerGeometry()
  const material = createJellyMaterial(PLAYER_BODY_COLOR)
  const group = createJellyBody(geometry, material, PLAYER_EDGE_COLOR)

  const { body, edges, faceAnchor } = group.userData.jelly
  body.position.y = PLAYER_BODY_RADIUS
  body.castShadow = true
  edges.position.y = PLAYER_BODY_RADIUS

  faceAnchor.position.set(0, PLAYER_BODY_RADIUS * 1.1, PLAYER_BODY_RADIUS * 0.85)
  const face = createFacePlane(createFaceTexture(PLAYER_FACE), PLAYER_RADIUS * 2.4)
  faceAnchor.add(face)

  const sword = createSword()
  sword.position.set(PLAYER_BODY_RADIUS + 0.1, PLAYER_BODY_RADIUS * 0.6, 0)
  group.add(sword)

  group.userData.body = body
  group.userData.face = face
  group.userData.sword = sword

  return group
}

// Builds one monster of `type` (a key of MONSTER_TYPES) as a faceted,
// flat-shaded jelly body in its own shape with glowing neon edges, a
// randomly generated goofy face on its face anchor, and a pair of small
// "!"/"?" indicator sprites above its head that the AI milestone flashes
// briefly on entering chase or search. rng is injectable (default
// Math.random) so the face can be seeded deterministically in tests.
export function createMonsterMesh(type, rng = Math.random) {
  const stats = MONSTER_TYPES[type]
  const geometry = GEOMETRY_BUILDERS[stats.shape](stats.size)
  const material = createJellyMaterial(stats.color)
  const group = createJellyBody(geometry, material, stats.edgeColor)

  const { body, edges, faceAnchor } = group.userData.jelly
  body.position.y = stats.size / 2
  body.castShadow = true
  edges.position.y = stats.size / 2

  faceAnchor.position.set(0, stats.size * 0.55, stats.size * 0.35 + 0.01)
  const face = createFacePlane(randomGoofyFace(rng), stats.size * 0.6)
  faceAnchor.add(face)

  const chaseIndicator = createIndicatorSprite('!')
  const searchIndicator = createIndicatorSprite('?')
  chaseIndicator.position.set(0, stats.size + 0.3, 0)
  searchIndicator.position.set(0, stats.size + 0.3, 0)
  group.add(chaseIndicator)
  group.add(searchIndicator)

  group.userData.body = body
  group.userData.face = face
  group.userData.type = type
  group.userData.indicators = { chase: chaseIndicator, search: searchIndicator }
  group.userData.indicatorElapsed = null

  return group
}
