import * as THREE from 'three'
import {
  FACE_SCALE_BY_TYPE,
  JELLY_EMISSIVE_INTENSITY,
  JELLY_METALNESS,
  JELLY_ROUGHNESS,
  MONSTER_TYPES,
  PLAYER_BODY_RADIUS,
  PLAYER_EDGE_COLOR,
  SWORD_BLADE_COLOR,
  SWORD_GLOW_SCALE,
  SWORD_HILT_COLOR,
} from './config.js'
import { createFace3D } from './face3d.js'
import { createJellyBody } from './jelly.js'
import { PLAYER_FACE, pickFaceOptions } from './logic/faceOptions.js'
import { bodySurfaceDistance } from './logic/faceLayout.js'

const PLAYER_BODY_COLOR = 0x3388ff

const BLADE_LENGTH = 0.8

// A glowing energy sword: a bright emissive blade core plus a slightly
// larger, additive "glow" twin of the same shape (the same trick the
// jelly bodies use for their neon edges) so it blooms, on a dark metal
// hilt (grip + crossguard). Grouped so later milestones can animate the
// whole swing as one object; a `tip` child marks the blade's far end in
// local space, for the swing trail to read as a world position each
// frame. Attached directly to the body group (not the face anchor), so
// it stays rigid and doesn't pulse with the jelly bulge/hit state.
function createSword() {
  const group = new THREE.Group()

  const bladeGeometry = new THREE.BoxGeometry(0.05, BLADE_LENGTH, 0.025)
  const blade = new THREE.Mesh(
    bladeGeometry,
    new THREE.MeshStandardMaterial({
      color: SWORD_BLADE_COLOR,
      emissive: new THREE.Color(SWORD_BLADE_COLOR),
      emissiveIntensity: 1,
      metalness: 0.2,
      roughness: 0.2,
    }),
  )
  blade.position.y = BLADE_LENGTH / 2
  group.add(blade)

  const glow = new THREE.Mesh(
    bladeGeometry,
    new THREE.MeshBasicMaterial({
      color: SWORD_BLADE_COLOR,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  )
  glow.position.y = blade.position.y
  glow.scale.set(SWORD_GLOW_SCALE, 1, SWORD_GLOW_SCALE)
  group.add(glow)

  const hiltMaterial = new THREE.MeshStandardMaterial({ color: SWORD_HILT_COLOR, metalness: 0.7, roughness: 0.4 })

  const crossguard = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.06, 0.06), hiltMaterial)
  group.add(crossguard)

  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.22, 8), hiltMaterial)
  grip.position.y = -0.14
  group.add(grip)

  const tip = new THREE.Object3D()
  tip.position.y = BLADE_LENGTH
  group.add(tip)

  group.userData.tip = tip
  return group
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

// The body's resting center height so its lowest point touches the
// ground (y = 0, the platform's top surface per platformLayout).
// size/2 is correct for the dodecahedron/box (symmetric top-to-bottom),
// but zippy's octahedron is stretched 1.3x vertically (see
// createZippyGeometry), so centering it at size/2 used to leave its
// lower, stretched tip poking 0.15 * size below the ground; reusing
// faceLayout's own bodySurfaceDistance (straight down) gives the exact
// height instead (size * 0.65), so this stays correct if the stretch
// ever changes.
function monsterBodyCenterY(stats) {
  return stats.shape === 'octahedron' ? bodySurfaceDistance(stats.shape, stats.size, 0, -1, 0) : stats.size / 2
}

// Builds the player's body: a faceted, flat-shaded icosahedron jelly body
// with glowing neon edges, the goofy preset face built from 3D geometry
// (googly eyes, buck teeth, rosy cheeks) attached so it rides the
// jelly's deformation, and a sword held at the side as a rigid child
// group.
export function createPlayerMesh() {
  const geometry = createPlayerGeometry()
  const material = createJellyMaterial(PLAYER_BODY_COLOR)
  const group = createJellyBody(geometry, material, PLAYER_EDGE_COLOR, PLAYER_BODY_RADIUS)

  const { body } = group.userData.jelly
  body.castShadow = true

  const face = createFace3D({
    shape: 'icosahedron',
    size: PLAYER_BODY_RADIUS,
    bodyCenterY: PLAYER_BODY_RADIUS,
    bodyColor: PLAYER_BODY_COLOR,
    options: PLAYER_FACE,
  })
  group.add(face.group)
  group.userData.face3d = face

  const sword = createSword()
  sword.position.set(PLAYER_BODY_RADIUS + 0.1, PLAYER_BODY_RADIUS * 0.6, 0)
  group.add(sword)

  group.userData.body = body
  group.userData.sword = sword

  return group
}

// Builds one monster of `type` (a key of MONSTER_TYPES) as a faceted,
// flat-shaded jelly body in its own shape with glowing neon edges, a
// randomly generated goofy 3D face (googly eyes, a mouth shape, and
// maybe a unibrow/tongue/rosy cheeks/freckles) attached so it rides the
// jelly's deformation, and a pair of small "!"/"?" indicator sprites
// above its head that the AI milestone flashes briefly on entering chase
// or search. rng is injectable (default Math.random) so the face can be
// seeded deterministically in tests.
export function createMonsterMesh(type, rng = Math.random) {
  const stats = MONSTER_TYPES[type]
  const geometry = GEOMETRY_BUILDERS[stats.shape](stats.size)
  const material = createJellyMaterial(stats.color)
  const bodyCenterY = monsterBodyCenterY(stats)
  const group = createJellyBody(geometry, material, stats.edgeColor, bodyCenterY)

  const { body } = group.userData.jelly
  body.castShadow = true

  const face = createFace3D({
    shape: stats.shape,
    size: stats.size,
    bodyCenterY,
    bodyColor: stats.color,
    options: pickFaceOptions(rng),
    faceTypeScale: FACE_SCALE_BY_TYPE[type] ?? 1,
  })
  group.add(face.group)
  group.userData.face3d = face

  const chaseIndicator = createIndicatorSprite('!')
  const searchIndicator = createIndicatorSprite('?')
  chaseIndicator.position.set(0, stats.size + 0.3, 0)
  searchIndicator.position.set(0, stats.size + 0.3, 0)
  group.add(chaseIndicator)
  group.add(searchIndicator)

  group.userData.body = body
  group.userData.type = type
  group.userData.indicators = { chase: chaseIndicator, search: searchIndicator }
  group.userData.indicatorElapsed = null

  return group
}
