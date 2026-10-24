import * as THREE from 'three'
import {
  MONSTER_TYPES,
  PLAYER_HEIGHT,
  PLAYER_RADIUS,
  WOBBLE_BOB_AMOUNT,
  WOBBLE_FACE_JIGGLE_AMOUNT,
  WOBBLE_SPEED,
  WOBBLE_SQUASH_AMOUNT,
} from './config.js'
import { createFaceTexture, PLAYER_FACE, randomGoofyFace } from './faces.js'

// A simple sword prop: a blade box plus a crossguard box, grouped so
// later milestones can animate the whole swing as one object.
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

// Builds the player's body: a chunky capsule, the goofy preset face on a
// plane just in front of the body's front (+Z local, so it faces whichever
// way the player is moving), and a sword held at the side as a child
// group that the combat milestone can animate.
export function createPlayerMesh() {
  const group = new THREE.Group()

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(PLAYER_RADIUS, PLAYER_HEIGHT - PLAYER_RADIUS * 2, 4, 8),
    new THREE.MeshStandardMaterial({ color: 0x3388ff }),
  )
  body.position.y = PLAYER_HEIGHT / 2
  group.add(body)

  const face = createFacePlane(createFaceTexture(PLAYER_FACE), PLAYER_RADIUS * 2.4)
  face.position.set(0, PLAYER_HEIGHT * 0.62, PLAYER_RADIUS + 0.01)
  group.add(face)

  const sword = createSword()
  sword.position.set(PLAYER_RADIUS + 0.1, PLAYER_HEIGHT * 0.35, 0)
  group.add(sword)

  group.userData.face = face
  group.userData.sword = sword
  group.userData.baseY = 0

  return group
}

function createBlobboBody(size, color) {
  const geometry = new THREE.SphereGeometry(size / 2, 16, 12)
  geometry.scale(1, 0.85, 1) // squat
  return new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color }))
}

function createZippyBody(size, color) {
  return new THREE.Mesh(
    new THREE.CapsuleGeometry(size * 0.25, size * 0.9, 4, 8),
    new THREE.MeshStandardMaterial({ color }),
  )
}

function createGrumpusBody(size, color) {
  return new THREE.Mesh(
    new THREE.BoxGeometry(size * 0.7, size, size * 0.7),
    new THREE.MeshStandardMaterial({ color }),
  )
}

const BODY_BUILDERS = {
  blobbo: createBlobboBody,
  zippy: createZippyBody,
  grumpus: createGrumpusBody,
}

// Builds one monster of `type` (a key of MONSTER_TYPES) with a randomly
// generated goofy face. rng is injectable (default Math.random) so the
// face can be seeded deterministically in tests.
export function createMonsterMesh(type, rng = Math.random) {
  const stats = MONSTER_TYPES[type]
  const group = new THREE.Group()

  const body = BODY_BUILDERS[type](stats.size, stats.color)
  body.position.y = stats.size / 2
  group.add(body)

  const face = createFacePlane(randomGoofyFace(rng), stats.size * 0.6)
  face.position.set(0, stats.size * 0.55, stats.size * 0.35 + 0.01)
  group.add(face)

  group.userData.face = face
  group.userData.baseY = 0
  group.userData.type = type

  return group
}

// Idle animation shared by player and monster meshes: a vertical bob, a
// slight squash-and-stretch, and a little jiggle of the face plane.
// `phase` offsets `time` so different characters don't move in lockstep.
export function updateWobble(mesh, time, phase = 0) {
  const t = time + phase
  const wave = Math.sin(t * WOBBLE_SPEED)
  const baseY = mesh.userData.baseY ?? 0

  mesh.position.y = baseY + wave * WOBBLE_BOB_AMOUNT

  const squash = 1 + wave * WOBBLE_SQUASH_AMOUNT
  mesh.scale.set(1 / Math.sqrt(squash), squash, 1 / Math.sqrt(squash))

  const face = mesh.userData.face
  if (face) {
    face.rotation.z = Math.sin(t * WOBBLE_SPEED * 1.5) * WOBBLE_FACE_JIGGLE_AMOUNT
  }
}
