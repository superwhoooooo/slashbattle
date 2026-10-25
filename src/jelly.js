import * as THREE from 'three'
import {
  JELLY_BULGE_DAMPING,
  JELLY_BULGE_RESPONSE,
  JELLY_BULGE_STIFFNESS,
  JELLY_EDGE_SCALE,
  JELLY_FACE_PULSE_AMOUNT,
  JELLY_HIT_DAMPING,
  JELLY_HIT_STIFFNESS,
  JELLY_IDLE_AMPLITUDE,
  JELLY_IDLE_SPEED,
} from './config.js'
import { jellyOffset, springStep } from './logic/jelly.js'

// Builds a jelly body: `geometry`/`material` as the solid mesh, plus a
// second mesh sharing the SAME geometry (so it deforms right along with
// it) rendered as a bright wireframe, scaled up slightly so the glowing
// edges read as an outline rather than fighting the solid faces for
// depth. Also creates an empty `faceAnchor` child group, positioned by
// the caller, for attaching a face plane that pulses along with the
// body's overall bulge/hit state without having to track it per-vertex.
//
// Clones the geometry's original vertex positions once: every frame,
// updateJelly displaces each vertex as a pure function of ITS OWN
// original position (never the previous frame's displaced position), so
// faces never tear even though flat shading duplicates vertices per face.
export function createJellyBody(geometry, material, edgeColor) {
  const group = new THREE.Group()

  const body = new THREE.Mesh(geometry, material)
  group.add(body)

  const edges = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: edgeColor, wireframe: true }))
  edges.scale.setScalar(JELLY_EDGE_SCALE)
  group.add(edges)

  const faceAnchor = new THREE.Group()
  group.add(faceAnchor)

  const position = geometry.attributes.position
  group.userData.jelly = {
    body,
    edges,
    faceAnchor,
    originalPositions: Float32Array.from(position.array),
    idlePhase: Math.random() * Math.PI * 2,
    bulge: { value: 0, velocity: 0 },
    hit: { value: 0, velocity: 0 },
  }
  group.userData.faceAnchor = faceAnchor

  return group
}

// Advances a jelly body's idle wobble, movement bulge, and hit spring by
// one tick, and writes the deformed vertex positions back onto the
// shared geometry (so the solid body and the wireframe overlay move
// together). Also pulses the face anchor's scale to roughly track the
// overall bulge/hit state, which is close enough since the face doesn't
// need to follow individual vertices.
//
// `speed` is the character's current speed (world units/second, 0 when
// stopped); `moveDir` is its normalized horizontal movement direction.
export function updateJelly(jellyBody, dt, time, { speed = 0, moveDir = { x: 0, z: 1 } } = {}) {
  const jelly = jellyBody.userData.jelly
  if (!jelly) return

  jelly.bulge = springStep(jelly.bulge, speed * JELLY_BULGE_RESPONSE, JELLY_BULGE_STIFFNESS, JELLY_BULGE_DAMPING, dt)
  jelly.hit = springStep(jelly.hit, 0, JELLY_HIT_STIFFNESS, JELLY_HIT_DAMPING, dt)

  const params = {
    idleAmplitude: JELLY_IDLE_AMPLITUDE,
    idleSpeed: JELLY_IDLE_SPEED,
    idlePhase: jelly.idlePhase,
    bulge: jelly.bulge.value,
    bulgeDirX: moveDir.x,
    bulgeDirZ: moveDir.z,
    hit: jelly.hit.value,
  }

  const position = jelly.body.geometry.attributes.position
  const original = jelly.originalPositions
  for (let i = 0; i < position.count; i++) {
    const ox = original[i * 3]
    const oy = original[i * 3 + 1]
    const oz = original[i * 3 + 2]
    const [dx, dy, dz] = jellyOffset(ox, oy, oz, time, params)
    position.setXYZ(i, ox + dx, oy + dy, oz + dz)
  }
  position.needsUpdate = true
  jelly.body.geometry.computeBoundingSphere()

  const pulse = 1 + (jelly.bulge.value + Math.abs(jelly.hit.value)) * JELLY_FACE_PULSE_AMOUNT
  jelly.faceAnchor.scale.setScalar(pulse)
}

// Pushes an impulse into the hit spring: a positive `strength` flattens
// the body (the hit splat); a negative one inflates it (the attack
// wind-up and the death burst). The spring then naturally rebounds past
// zero before settling, so a flatten boings back taller and an inflate
// boings back smaller.
export function jellyHit(jellyBody, strength) {
  const jelly = jellyBody.userData.jelly
  if (!jelly) return
  jelly.hit.value += strength
}
