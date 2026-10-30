import * as THREE from 'three'
import {
  JELLY_BULGE_DAMPING,
  JELLY_BULGE_RESPONSE,
  JELLY_BULGE_STIFFNESS,
  JELLY_EDGE_OPACITY,
  JELLY_EDGE_SCALE,
  JELLY_HIT_DAMPING,
  JELLY_HIT_STIFFNESS,
  JELLY_IDLE_AMPLITUDE,
  JELLY_IDLE_SPEED,
} from './config.js'
import { jellyOffset, springStep } from './logic/jelly.js'

// Builds a jelly body: `geometry`/`material` as the solid mesh, plus a
// second mesh sharing the SAME geometry (so it deforms right along with
// it) rendered as a translucent wireframe, scaled up slightly so the
// edges read as a subtle outline rather than fighting the solid faces
// for depth or glowing too bright. `restY` is the body/edges' resting
// height within the character group (e.g. PLAYER_BODY_RADIUS, or
// stats.size/2) -- set here, rather than by the caller afterward, since
// updateJelly needs it every frame to keep the body's bottom pinned to
// the ground (see below).
//
// Clones the geometry's original vertex positions once: every frame,
// updateJelly displaces each vertex as a pure function of ITS OWN
// original position (never the previous frame's displaced position), so
// faces never tear even though flat shading duplicates vertices per face.
// It also stashes the frame's displacement params on `jelly.params`, so
// a 3D face feature (src/face3d.js) attached to the same group can
// evaluate the same jellyOffset at its own original anchor position and
// ride the wobbling surface instead of floating or sinking.
export function createJellyBody(geometry, material, edgeColor, restY = 0) {
  const group = new THREE.Group()

  const body = new THREE.Mesh(geometry, material)
  body.position.y = restY
  group.add(body)

  const edges = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({
      color: edgeColor,
      wireframe: true,
      transparent: true,
      opacity: JELLY_EDGE_OPACITY,
    }),
  )
  edges.position.y = restY
  edges.scale.setScalar(JELLY_EDGE_SCALE)
  // JELLY_EDGE_OPACITY 0 means the outline is fully transparent, so skip
  // drawing it rather than paying for an invisible wireframe pass.
  edges.visible = JELLY_EDGE_OPACITY > 0
  group.add(edges)

  const position = geometry.attributes.position

  // The lowest original vertex, in geometry-local space -- what
  // updateJelly tracks every frame to keep the body's bottom pinned to
  // the ground rather than drifting as the hit spring squashes/inflates
  // the whole shape around its (fixed) center.
  let bottomIndex = 0
  for (let i = 1; i < position.count; i++) {
    if (position.getY(i) < position.getY(bottomIndex)) bottomIndex = i
  }
  const bottomPoint = {
    x: position.getX(bottomIndex),
    y: position.getY(bottomIndex),
    z: position.getZ(bottomIndex),
  }

  group.userData.jelly = {
    body,
    edges,
    restY,
    bottomPoint,
    originalPositions: Float32Array.from(position.array),
    idlePhase: Math.random() * Math.PI * 2,
    bulge: { value: 0, velocity: 0 },
    hit: { value: 0, velocity: 0 },
    params: null,
    groundAnchorOffset: 0,
  }

  return group
}

// Advances a jelly body's idle wobble, movement bulge, and hit spring by
// one tick, and writes the deformed vertex positions back onto the
// shared geometry (so the solid body and the wireframe overlay move
// together).
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
  jelly.params = params

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

  // Keeps the body's lowest point pinned at its resting height (the
  // ground) even while the hit spring squashes or inflates the whole
  // shape: without this, the body/edges' group-local y never moves, so
  // a squash (which pulls the bottom vertex up toward center) lifts the
  // body off the floor, and an inflate (which pushes it further down)
  // sinks it into the floor. Shifting body/edges by the SAME amount the
  // bottom vertex itself moved cancels that out.
  const [, bottomDy] = jellyOffset(jelly.bottomPoint.x, jelly.bottomPoint.y, jelly.bottomPoint.z, time, params)
  jelly.groundAnchorOffset = -bottomDy
  jelly.body.position.y = jelly.restY + jelly.groundAnchorOffset
  jelly.edges.position.y = jelly.restY + jelly.groundAnchorOffset
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
