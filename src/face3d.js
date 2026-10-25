import * as THREE from 'three'
import {
  FACE_CHEEK_COLOR,
  FACE_EYE_RADIUS_FACTOR,
  FACE_EYE_WHITE_COLOR,
  FACE_FRECKLE_COLOR,
  FACE_MOUTH_COLOR,
  FACE_PUPIL_ACCEL_KICK,
  FACE_PUPIL_COLOR,
  FACE_PUPIL_FRONT_FACTOR,
  FACE_PUPIL_HIT_KICK,
  FACE_PUPIL_MAX_OFFSET_FACTOR,
  FACE_PUPIL_RADIUS_FACTOR,
  FACE_PUPIL_SPRING_DAMPING,
  FACE_PUPIL_SPRING_STIFFNESS,
  FACE_TEETH_COLOR,
  FACE_TONGUE_COLOR,
} from './config.js'
import { faceLayout } from './logic/faceLayout.js'
import { jellyOffset, springStep } from './logic/jelly.js'

// Builds the 3D face: googly eyes (a white eyeball, a jiggling pupil, and
// an optional eyelid cap for a squint), a 3D mouth shape, and the
// optional unibrow/tongue/rosy cheeks/freckles -- every feature a child
// of `group`, which the caller (characters.js) adds directly to the
// character group so it moves/rotates/scales with it for free. The
// per-frame jelly ripple-follow and the pupils' spring jiggle are driven
// separately by updateFace3D, since they need the jelly body's current
// deformation params (not known yet at construction time).
//
// `bodyColor` tints a squint eyelid so it reads as a fold of the body's
// own skin. `faceTypeScale` scales every feature up or down relative to
// the body (FACE_SCALE_BY_TYPE in config.js, so a small body like
// zippy's still reads clearly).

const UP_AXIS = new THREE.Vector3(0, 1, 0)
const FORWARD_AXIS = new THREE.Vector3(0, 0, 1)

// How far a cross-eyed pupil is biased inward, in the same canonical
// (eyeball radius = 1) units the pupil's spring jiggle offset uses.
const CROSS_EYED_BIAS = 0.3

function bodyRadiusEstimate(shape, size) {
  // Matches faceLayout's `size` convention: the icosahedron's size IS
  // its radius; everything else halves `size` into a radius.
  return shape === 'icosahedron' ? size : size / 2
}

function orientToNormal(object3D, dir, fromAxis = FORWARD_AXIS) {
  const to = new THREE.Vector3(dir.x, dir.y, dir.z).normalize()
  object3D.quaternion.setFromUnitVectors(fromAxis, to)
}

function clamp(value, limit) {
  return Math.max(-limit, Math.min(limit, value))
}

// One googly eye: a matte white eyeball (never emissive, and kept off
// pure white so bloom doesn't blow it out), a flattened black pupil
// sitting on its front face, and -- while squinting -- a body-colored
// hemisphere cap folded over it. All built at canonical size (eyeball
// radius 1); the caller scales the whole thing via the anchor group.
function createEye({ dir, squint, bodyColor }) {
  const group = new THREE.Group()

  const eyeball = new THREE.Mesh(
    new THREE.SphereGeometry(1, 16, 12),
    new THREE.MeshStandardMaterial({ color: FACE_EYE_WHITE_COLOR, roughness: 0.6, metalness: 0 }),
  )
  group.add(eyeball)

  const pupil = new THREE.Mesh(
    new THREE.SphereGeometry(FACE_PUPIL_RADIUS_FACTOR, 10, 8),
    new THREE.MeshStandardMaterial({ color: FACE_PUPIL_COLOR, roughness: 0.4, metalness: 0 }),
  )
  pupil.scale.z = 0.5 // flattened against the eyeball's front
  group.add(pupil)

  if (squint) {
    const eyelid = new THREE.Mesh(
      new THREE.SphereGeometry(1.05, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: bodyColor, flatShading: true, roughness: 0.45, metalness: 0.25 }),
    )
    orientToNormal(eyelid, dir, UP_AXIS)
    group.add(eyelid)
  }

  const frontOffset = {
    x: dir.x * FACE_PUPIL_FRONT_FACTOR,
    y: dir.y * FACE_PUPIL_FRONT_FACTOR,
    z: dir.z * FACE_PUPIL_FRONT_FACTOR,
  }
  pupil.position.set(frontOffset.x, frontOffset.y, frontOffset.z)

  return {
    group,
    pupil,
    frontOffset,
    springX: { value: 0, velocity: 0 },
    springY: { value: 0, velocity: 0 },
    crossBias: 0,
  }
}

// A partial torus curved like a smile (the bottom arc of a ring),
// optionally tilted for a lopsided grin.
function createSmileArc(material, tilt) {
  const geometry = new THREE.TorusGeometry(0.42, 0.09, 8, 20, Math.PI * 0.8)
  const mesh = new THREE.Mesh(geometry, material)
  mesh.rotation.z = Math.PI * 1.1 + tilt
  return mesh
}

// A wavy tube (a sine curve extruded along a tube), for the derp mouth.
function createWavyTube(material) {
  const points = []
  const segments = 12
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const x = (t - 0.5) * 0.8
    const y = Math.sin(t * Math.PI * 2.5) * 0.12
    points.push(new THREE.Vector3(x, y, 0))
  }
  const curve = new THREE.CatmullRomCurve3(points)
  const geometry = new THREE.TubeGeometry(curve, 24, 0.06, 8, false)
  return new THREE.Mesh(geometry, material)
}

// A dark ring pulled slightly in, for a surprised "O" mouth.
function createOpenO(material) {
  const geometry = new THREE.TorusGeometry(0.22, 0.12, 10, 20)
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.z = -0.04
  return mesh
}

function createMouth(mouthOptions) {
  const group = new THREE.Group()
  const material = new THREE.MeshStandardMaterial({ color: FACE_MOUTH_COLOR, roughness: 0.6, metalness: 0 })

  switch (mouthOptions.type) {
    case 'buckTooth': {
      group.add(createSmileArc(material, 0))
      const teethMaterial = new THREE.MeshStandardMaterial({ color: FACE_TEETH_COLOR, roughness: 0.4 })
      for (const side of [-1, 1]) {
        const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.2, 0.1), teethMaterial)
        tooth.position.set(side * 0.13, -0.08, 0.05)
        group.add(tooth)
      }
      break
    }
    case 'derp':
      group.add(createWavyTube(material))
      break
    case 'openO':
      group.add(createOpenO(material))
      break
    case 'lopsided':
    default:
      group.add(createSmileArc(material, 0.35))
      break
  }

  return group
}

function createBrow() {
  const material = new THREE.MeshStandardMaterial({ color: FACE_MOUTH_COLOR, roughness: 0.6, metalness: 0 })
  return new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.1), material)
}

// A pink flattened capsule poking out and drooping slightly.
function createTongue() {
  const material = new THREE.MeshStandardMaterial({ color: FACE_TONGUE_COLOR, roughness: 0.5, metalness: 0 })
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.22, 4, 8), material)
  mesh.scale.y = 0.55
  mesh.rotation.x = Math.PI / 2 + 0.4
  return mesh
}

function createCheek() {
  const material = new THREE.MeshStandardMaterial({
    color: FACE_CHEEK_COLOR,
    roughness: 0.6,
    metalness: 0,
    transparent: true,
    opacity: 0.55,
  })
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), material)
  mesh.scale.z = 0.35
  return mesh
}

function createFreckles() {
  const group = new THREE.Group()
  const material = new THREE.MeshStandardMaterial({ color: FACE_FRECKLE_COLOR, roughness: 0.7, metalness: 0 })
  const spots = [[-0.08, 0.05], [0.07, 0.07], [0, -0.06], [0.1, -0.02]]
  for (const [x, y] of spots) {
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), material)
    dot.position.set(x, y, 0.05)
    group.add(dot)
  }
  return group
}

// Builds the full 3D face for a body of `shape`/`size` (faceLayout's
// convention) whose own mesh sits at `bodyCenterY` within the character
// group. `options` is a pickFaceOptions()/PLAYER_FACE-shaped object.
// Returns { group, features, eyes } -- `group` is what the caller adds
// to the character; `features`/`eyes` are what updateFace3D needs every
// frame.
export function createFace3D({ shape, size, bodyCenterY, bodyColor, options, faceTypeScale = 1 }) {
  const layout = faceLayout(shape, size, bodyCenterY)
  const featureScale = bodyRadiusEstimate(shape, size) * faceTypeScale

  const group = new THREE.Group()
  const features = []

  // Registers a feature anchored at layout[key], scaled by `scale`;
  // records its rest position (group-local) and rel position (relative
  // to the body's own center, i.e. the SAME frame the jelly vertex
  // offsets use) so updateFace3D can ride the wobbling surface.
  function addFeature(key, scale) {
    const anchor = layout[key]
    const anchorGroup = new THREE.Group()
    anchorGroup.position.set(anchor.x, anchor.y, anchor.z)
    anchorGroup.scale.setScalar(scale)
    group.add(anchorGroup)
    features.push({
      anchorGroup,
      rest: { x: anchor.x, y: anchor.y, z: anchor.z },
      rel: { x: anchor.x, y: anchor.y - bodyCenterY, z: anchor.z },
    })
    return anchorGroup
  }

  const leftEyeGroup = addFeature('leftEye', featureScale * FACE_EYE_RADIUS_FACTOR * options.eyes.leftSize)
  const leftEye = createEye({ dir: layout.leftEye.dir, squint: options.eyes.squintEye === 'left', bodyColor })
  leftEyeGroup.add(leftEye.group)

  const rightEyeGroup = addFeature('rightEye', featureScale * FACE_EYE_RADIUS_FACTOR * options.eyes.rightSize)
  const rightEye = createEye({ dir: layout.rightEye.dir, squint: options.eyes.squintEye === 'right', bodyColor })
  rightEyeGroup.add(rightEye.group)

  if (options.eyes.crossEyed) {
    leftEye.crossBias = CROSS_EYED_BIAS
    rightEye.crossBias = -CROSS_EYED_BIAS
  }

  const mouthGroup = addFeature('mouth', featureScale)
  orientToNormal(mouthGroup, layout.mouth.dir)
  mouthGroup.add(createMouth(options.mouth))

  if (options.unibrow) {
    const browGroup = addFeature('brow', featureScale)
    orientToNormal(browGroup, layout.brow.dir)
    browGroup.add(createBrow())
  }

  if (options.mouth.tongueOut) {
    const tongueGroup = addFeature('tongue', featureScale)
    orientToNormal(tongueGroup, layout.tongue.dir)
    tongueGroup.add(createTongue())
  }

  if (options.rosyCheeks || options.freckles) {
    const leftCheekGroup = addFeature('leftCheek', featureScale)
    const rightCheekGroup = addFeature('rightCheek', featureScale)
    if (options.rosyCheeks) {
      leftCheekGroup.add(createCheek())
      rightCheekGroup.add(createCheek())
    }
    if (options.freckles) {
      leftCheekGroup.add(createFreckles())
      rightCheekGroup.add(createFreckles())
    }
  }

  return { group, features, eyes: { left: leftEye, right: rightEye } }
}

// Advances one pupil's spring jiggle: it lags opposite the character's
// current acceleration (approximated by the jelly movement-bulge
// spring's velocity, which is already computed every frame for the body
// wobble) and kicks on a hit (the jelly hit-spring's velocity), clamped
// so it stays within the eye's front face.
function updateEyePupil(eye, dt, moveDirX, bulgeVelocity, hitVelocity) {
  const targetX = clamp(-moveDirX * bulgeVelocity * FACE_PUPIL_ACCEL_KICK, FACE_PUPIL_MAX_OFFSET_FACTOR)
  const targetY = clamp(hitVelocity * FACE_PUPIL_HIT_KICK, FACE_PUPIL_MAX_OFFSET_FACTOR)
  eye.springX = springStep(eye.springX, targetX, FACE_PUPIL_SPRING_STIFFNESS, FACE_PUPIL_SPRING_DAMPING, dt)
  eye.springY = springStep(eye.springY, targetY, FACE_PUPIL_SPRING_STIFFNESS, FACE_PUPIL_SPRING_DAMPING, dt)

  let ox = eye.springX.value + eye.crossBias
  let oy = eye.springY.value
  const magnitude = Math.hypot(ox, oy)
  if (magnitude > FACE_PUPIL_MAX_OFFSET_FACTOR) {
    const scale = FACE_PUPIL_MAX_OFFSET_FACTOR / magnitude
    ox *= scale
    oy *= scale
  }

  eye.pupil.position.x = eye.frontOffset.x + ox
  eye.pupil.position.y = eye.frontOffset.y + oy
}

// Advances a character's attached 3D face by one tick: every feature's
// anchor is offset by jellyOffset evaluated at that anchor's ORIGINAL
// (undeformed) body-local position -- the same function the body's
// vertices use -- so the face rides the jelly body's idle ripple,
// movement squash/stretch, hit splat, and death/spawn inflate, all of
// which are folded into the jelly state's current `params`. No-op if
// `characterGroup` wasn't given a face (hiding.js's pods aren't).
export function updateFace3D(characterGroup, dt, time) {
  const face = characterGroup.userData.face3d
  if (!face) return

  const jelly = characterGroup.userData.jelly
  const params = jelly ? jelly.params : null

  if (params) {
    for (const feature of face.features) {
      const [dx, dy, dz] = jellyOffset(feature.rel.x, feature.rel.y, feature.rel.z, time, params)
      feature.anchorGroup.position.set(feature.rest.x + dx, feature.rest.y + dy, feature.rest.z + dz)
    }
  }

  const moveDirX = params ? params.bulgeDirX : 0
  const bulgeVelocity = jelly ? jelly.bulge.velocity : 0
  const hitVelocity = jelly ? jelly.hit.velocity : 0
  updateEyePupil(face.eyes.left, dt, moveDirX, bulgeVelocity, hitVelocity)
  updateEyePupil(face.eyes.right, dt, moveDirX, bulgeVelocity, hitVelocity)
}
