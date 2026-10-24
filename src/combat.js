import * as THREE from 'three'
import {
  AMBUSH_WINDOW,
  ATTACK_ARC_RADIANS,
  ATTACK_COOLDOWN,
  ATTACK_DAMAGE,
  ATTACK_RANGE,
  ATTACK_SWING_DURATION,
  DEATH_POP_DURATION,
  HIT_FLASH_DURATION,
  HIT_SQUASH_DURATION,
  KNOCKBACK_STRENGTH,
} from './config.js'
import {
  applyDamage,
  computeDamage,
  createCooldown,
  isInAttackArc,
  knockbackVector,
} from './logic/combat.js'
import { resolveMove } from './logic/grid.js'
import { isAmbushActive } from './logic/hiding.js'

// The sword rotates through this arc (radians, around its local Z axis)
// over the swing, and the hit is checked once the swing crosses the
// midpoint, so it lands when the blade is roughly in front of the player.
const SWING_START_ANGLE = -Math.PI / 3
const SWING_END_ANGLE = Math.PI / 3
const SWING_HIT_FRACTION = 0.5

// Mutable state for the player's attack: the cooldown plus the current
// swing's progress, if one is in flight. Create once with
// createAttackState() and pass the same object into updatePlayerAttack
// every frame.
export function createAttackState() {
  return {
    cooldown: createCooldown(ATTACK_COOLDOWN),
    swingElapsed: null, // null when no swing is in flight
    hasHitThisSwing: false,
  }
}

// Drives the player's melee attack each frame: reads the attack button
// (left mouse or Space), animates the sword swing, and at the swing's hit
// moment checks every living monster for a hit, applying damage,
// knockback, and a hit flash/squash, starting a death pop on a lethal
// hit. Disabled entirely while hidden. Returns { ambushHit, hitAny }:
// ambushHit is true the one frame an ambush-boosted hit landed, so the
// caller can flash the "AMBUSH!" banner; hitAny is true the one frame any
// hit landed, so the caller can trigger a (smaller) screen shake.
export function updatePlayerAttack(
  attackState,
  { player, monsters, grid, tileSize, input, elapsedSeconds, deltaSeconds },
) {
  if (player.hidden) return { ambushHit: false, hitAny: false }

  const sword = player.mesh.userData.sword
  const attackPressed = input.isMouseDown(0) || input.isDown('Space')

  if (
    attackState.swingElapsed === null &&
    attackPressed &&
    attackState.cooldown.ready(elapsedSeconds)
  ) {
    attackState.swingElapsed = 0
    attackState.hasHitThisSwing = false
    attackState.cooldown.trigger(elapsedSeconds)
  }

  if (attackState.swingElapsed === null) return { ambushHit: false, hitAny: false }

  attackState.swingElapsed += deltaSeconds
  const progress = Math.min(attackState.swingElapsed / ATTACK_SWING_DURATION, 1)
  sword.rotation.z = THREE.MathUtils.lerp(SWING_START_ANGLE, SWING_END_ANGLE, progress)

  let ambushHit = false
  let hitAny = false
  if (!attackState.hasHitThisSwing && progress >= SWING_HIT_FRACTION) {
    attackState.hasHitThisSwing = true
    ;({ ambushHit, hitAny } = resolveAttackHits(player, monsters, grid, tileSize, elapsedSeconds))
  }

  if (progress >= 1) {
    attackState.swingElapsed = null
    sword.rotation.z = 0
  }

  return { ambushHit, hitAny }
}

// Checks every living monster against the attack arc and applies the hit:
// damage (boosted if the player is still within the ambush window after
// popping out of hiding), a wall-safe knockback, and the flash/squash
// reaction. A lethal hit starts the monster's death pop instead of
// removing it immediately, so updateMonsterHitReaction can animate it out
// first. Returns { ambushHit, hitAny } for the whole swing.
function resolveAttackHits(player, monsters, grid, tileSize, now) {
  const attackerPos = player.position
  const ambush = isAmbushActive(now, player.exitedAt, AMBUSH_WINDOW)
  let ambushHit = false
  let hitAny = false

  for (const monster of monsters) {
    if (monster.userData.dying) continue

    const targetPos = { x: monster.position.x, z: monster.position.z }
    if (
      !isInAttackArc(attackerPos, player.facing, targetPos, ATTACK_RANGE, ATTACK_ARC_RADIANS)
    ) {
      continue
    }

    const damage = computeDamage(ATTACK_DAMAGE, { ambush })
    const { hp, lethal } = applyDamage({ hp: monster.userData.hp }, damage)
    monster.userData.hp = hp
    hitAny = true
    if (ambush) ambushHit = true

    const knockback = knockbackVector(attackerPos, targetPos, KNOCKBACK_STRENGTH)
    const resolved = resolveMove(grid, tileSize, targetPos, monster.userData.radius, knockback)
    monster.position.x = resolved.x
    monster.position.z = resolved.z

    monster.userData.hitFlashElapsed = 0
    monster.userData.hitSquashElapsed = 0

    if (lethal) {
      monster.userData.dying = true
      monster.userData.deathPopElapsed = 0
    }
  }

  return { ambushHit, hitAny }
}

// Advances one monster's hit-flash, hit-squash, and death-pop animation by
// one frame. Call for every living monster every frame, hit or not; call
// it instead of updateWobble (never both) once a monster is dying. Returns
// true once the death pop has finished, meaning the caller should remove
// the monster from the scene and its monster list.
export function updateMonsterHitReaction(monster, deltaSeconds) {
  const body = monster.userData.body

  if (monster.userData.hitFlashElapsed != null) {
    monster.userData.hitFlashElapsed += deltaSeconds
    const t = Math.min(monster.userData.hitFlashElapsed / HIT_FLASH_DURATION, 1)
    body.material.emissive.setScalar(1 - t)
    if (t >= 1) monster.userData.hitFlashElapsed = null
  }

  if (monster.userData.hitSquashElapsed != null) {
    monster.userData.hitSquashElapsed += deltaSeconds
    const t = Math.min(monster.userData.hitSquashElapsed / HIT_SQUASH_DURATION, 1)
    // Compress on impact, then rebound back to normal.
    const squash = 1 - Math.sin(t * Math.PI) * 0.3
    monster.scale.y *= squash
    monster.scale.x *= 1 / Math.sqrt(squash)
    monster.scale.z *= 1 / Math.sqrt(squash)
    if (t >= 1) monster.userData.hitSquashElapsed = null
  }

  if (monster.userData.dying) {
    monster.userData.deathPopElapsed += deltaSeconds
    const t = Math.min(monster.userData.deathPopElapsed / DEATH_POP_DURATION, 1)
    const growPhase = 0.3
    const popScale =
      t < growPhase
        ? THREE.MathUtils.lerp(1, 1.4, t / growPhase)
        : THREE.MathUtils.lerp(1.4, 0, (t - growPhase) / (1 - growPhase))
    monster.scale.setScalar(Math.max(popScale, 0))
    return t >= 1
  }

  return false
}
