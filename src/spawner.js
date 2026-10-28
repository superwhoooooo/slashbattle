import * as THREE from 'three'
import {
  SPAWN_BEAM_COLOR,
  SPAWN_BEAM_HEIGHT,
  SPAWN_BEAM_RADIUS,
  SPAWN_EFFECT_DURATION,
  SPAWN_INFLATE_STRENGTH,
  SPAWN_RING_COLOR,
  SPAWN_RING_RADIUS,
  SPAWN_SWIRL_COUNT,
  SPAWN_SWIRL_SPEED,
  SPAWN_SWIRL_UPWARD_BIAS,
} from './config.js'
import { jellyHit } from './jelly.js'
import { burst } from './particles.js'

const BLACK = new THREE.Color(0x000000)

// A glowing ring flush with the platform, marking where a monster is
// about to materialize.
function createPortalRing() {
  const geometry = new THREE.RingGeometry(SPAWN_RING_RADIUS * 0.7, SPAWN_RING_RADIUS, 32)
  const material = new THREE.MeshBasicMaterial({
    color: SPAWN_RING_COLOR,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
  })
  const ring = new THREE.Mesh(geometry, material)
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 0.02
  return ring
}

// A vertical light beam standing on the ring, additive-blended so it
// reads as glow rather than a solid object.
function createBeam() {
  const geometry = new THREE.CylinderGeometry(SPAWN_BEAM_RADIUS, SPAWN_BEAM_RADIUS, SPAWN_BEAM_HEIGHT, 12, 1, true)
  const material = new THREE.MeshBasicMaterial({
    color: SPAWN_BEAM_COLOR,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const beam = new THREE.Mesh(geometry, material)
  beam.position.y = SPAWN_BEAM_HEIGHT / 2
  return beam
}

// Builds the spawn-in effect at `spawnPoint` ({x, z}): a glowing portal
// ring flush with the platform plus a vertical light beam above it, both
// starting fully transparent. Returns { group, ring, beam, elapsed: 0 };
// the caller adds `group` to the scene and drives it every frame with
// updateSpawnEffect, then disposes `group` once that returns true.
export function createSpawnEffect(spawnPoint, { scale = 1, duration = SPAWN_EFFECT_DURATION } = {}) {
  const group = new THREE.Group()
  group.position.set(spawnPoint.x, 0, spawnPoint.z)
  group.scale.set(scale, 1, scale) // widens the ring/beam (a boss's portal) without stretching them upward

  const ring = createPortalRing()
  const beam = createBeam()
  group.add(ring)
  group.add(beam)

  return { group, ring, beam, elapsed: 0, duration }
}

// The portal's opacity envelope over the spawn: a quick fade in, a
// steady hold, then a fade out as the monster finishes materializing.
function portalOpacity(t) {
  const fadeIn = 0.2
  const fadeOut = 0.3
  if (t < fadeIn) return t / fadeIn
  if (t > 1 - fadeOut) return (1 - t) / fadeOut
  return 1
}

// Advances a spawn-in effect by one tick: fades the portal ring/beam in
// and out, and materializes `monster` -- scaling it up from 0 (with a
// one-shot jelly inflate impulse, so it wobbles as it grows in) while its
// body color fades in from black. A swirl of particles kicks off in the
// beam the moment the effect starts. The caller is responsible for
// keeping the monster out of AI/combat (e.g. a `spawning` flag) and for
// still ticking its jelly (idle ripple + the inflate wobble) every frame.
// Returns true once SPAWN_EFFECT_DURATION has elapsed, meaning the
// caller should dispose the effect's group and clear that flag.
export function updateSpawnEffect(effect, monster, dt, particleSystem) {
  if (effect.elapsed === 0) {
    monster.scale.setScalar(0)
    jellyHit(monster, SPAWN_INFLATE_STRENGTH)
    burst(
      particleSystem,
      { x: effect.group.position.x, y: 0.2, z: effect.group.position.z },
      SPAWN_RING_COLOR,
      SPAWN_SWIRL_COUNT,
      SPAWN_SWIRL_SPEED,
      SPAWN_SWIRL_UPWARD_BIAS,
    )
  }

  effect.elapsed += dt
  const t = Math.min(effect.elapsed / effect.duration, 1)

  const opacity = portalOpacity(t)
  effect.ring.material.opacity = opacity * 0.8
  effect.beam.material.opacity = opacity * 0.35

  monster.scale.setScalar(Math.sin((t * Math.PI) / 2)) // ease-out growth to 1

  const material = monster.userData.body.material
  if (!material.userData.spawnBaseColor) {
    material.userData.spawnBaseColor = material.color.clone()
  }
  material.color.lerpColors(BLACK, material.userData.spawnBaseColor, t)

  return effect.elapsed >= effect.duration
}
