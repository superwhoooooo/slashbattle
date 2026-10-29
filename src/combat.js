import * as THREE from 'three'
import {
  AMBUSH_WINDOW,
  ATTACK_COOLDOWN,
  DEATH_POP_DURATION,
  BOSS_DEATH_SHARD_MULTIPLIER,
  DEATH_SHARD_COUNT,
  DEATH_SHARD_SPEED,
  HIT_FLASH_DURATION,
  HIT_SPARK_COUNT,
  HIT_SPARK_SPEED,
  HIT_SPARK_WHITE_COLOR,
  HIT_SPARK_WHITE_COUNT,
  HIT_SPARK_WHITE_SPEED,
  HITSTOP_BOSS,
  HITSTOP_HIT,
  HITSTOP_KILL,
  JELLY_DEATH_INFLATE_STRENGTH,
  JELLY_HIT_STRENGTH,
  MONSTER_TYPES,
} from './config.js'
import { resolveArenaMove } from './logic/arena.js'
import {
  applyDamage,
  computeDamage,
  createCooldown,
  isInAttackArc,
  knockbackVector,
} from './logic/combat.js'
import { isAmbushActive } from './logic/hiding.js'
import { triggerHitstop } from './logic/hitstop.js'
import { WEAPONS } from './logic/items.js'
import { jellyHit } from './jelly.js'
import { burst, shardBurst } from './particles.js'
import { clearSwingTrail, updateSwingTrail } from './trail.js'

const HIT_FLASH_COLOR = new THREE.Color(1, 1, 1)
const scratchTipPosition = new THREE.Vector3()

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
// knockback, a hit flash, and a jelly splat, starting a death pop on a
// lethal hit. Disabled entirely while hidden. Returns { ambushHit, hitAny }:
// ambushHit is true the one frame an ambush-boosted hit landed, so the
// caller can flash the "AMBUSH!" banner; hitAny is true the one frame any
// hit landed, so the caller can trigger a (smaller) screen shake.
export function updatePlayerAttack(
  attackState,
  { player, monsters, obstacles, input, elapsedSeconds, deltaSeconds, particleSystem, swingTrail, weaponId = 'sword', damageMultiplier = 1, hitstop = null },
) {
  const weapon = WEAPONS[weaponId]
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
    attackState.cooldown.trigger(elapsedSeconds, weapon.cooldown)
  }

  if (attackState.swingElapsed === null) return { ambushHit: false, hitAny: false }

  attackState.swingElapsed += deltaSeconds
  const progress = Math.min(attackState.swingElapsed / weapon.swing, 1)
  sword.rotation.z = THREE.MathUtils.lerp(SWING_START_ANGLE, SWING_END_ANGLE, progress)

  sword.userData.tip.getWorldPosition(scratchTipPosition)
  updateSwingTrail(swingTrail, scratchTipPosition)

  let ambushHit = false
  let hitAny = false
  if (!attackState.hasHitThisSwing && progress >= SWING_HIT_FRACTION) {
    attackState.hasHitThisSwing = true
    ;({ ambushHit, hitAny } = resolveAttackHits(player, monsters, obstacles, elapsedSeconds, particleSystem, weapon, damageMultiplier, hitstop))
  }

  if (progress >= 1) {
    attackState.swingElapsed = null
    sword.rotation.z = 0
    clearSwingTrail(swingTrail)
  }

  return { ambushHit, hitAny }
}

// Applies `damage` to one monster (a sword hit, a pet's zap, a
// shockwave): hp, an optional knockback away from `fromPos` that slides
// around obstacles (but, deliberately, is not stopped by the platform's
// edge -- it can shove a monster off), a hit flash, a jelly splat, and a
// small spark burst (the monster's edge color plus a brief white spark).
// A lethal hit starts the monster's death pop (plus a one-shot jelly
// inflate burst and a big tumbling shard burst in the monster's color)
// instead of removing it immediately, so updateMonsterHitReaction can
// animate it out first. Returns whether the hit was lethal. `cause`
// ('sword'/'pet'/'shockwave') and `ambush` are stashed on the monster as
// lastHitBy/lastHitAmbush so main.js can name the kill's trick once it
// actually dies. `hitstop`, if given, is nudged toward the freeze this
// hit deserves: longest for a boss (taking the hit or dying), next for
// any kill, shortest for a plain non-lethal hit -- except a pet's zap,
// which only freezes on a kill, since it fires automatically and often.
export function damageMonster(monster, damage, { fromPos, knockback = 0, obstacles = [], particleSystem, cause = 'sword', ambush = false, hitstop = null }) {
  const { hp, lethal } = applyDamage({ hp: monster.userData.hp }, damage)
  monster.userData.hp = hp
  monster.userData.lastHitBy = cause
  monster.userData.lastHitAmbush = ambush

  if (hitstop && !(cause === 'pet' && !lethal)) {
    const isBoss = monster.userData.isBoss === true
    const duration = isBoss ? HITSTOP_BOSS : lethal ? HITSTOP_KILL : HITSTOP_HIT
    hitstop.remaining = triggerHitstop(hitstop, duration).remaining
  }

  if (knockback > 0 && fromPos) {
    const targetPos = { x: monster.position.x, z: monster.position.z }
    const push = knockbackVector(fromPos, targetPos, knockback * (monster.userData.knockbackScale ?? 1))
    const resolved = resolveArenaMove(targetPos, push, monster.userData.radius, obstacles)
    monster.position.x = resolved.x
    monster.position.z = resolved.z
  }

  monster.userData.hitFlashElapsed = 0
  jellyHit(monster, JELLY_HIT_STRENGTH)

  const stats = MONSTER_TYPES[monster.userData.type]
  const hitPoint = { x: monster.position.x, y: monster.position.y + stats.size * 0.5, z: monster.position.z }
  burst(particleSystem, hitPoint, stats.edgeColor, HIT_SPARK_COUNT, HIT_SPARK_SPEED)
  burst(particleSystem, hitPoint, HIT_SPARK_WHITE_COLOR, HIT_SPARK_WHITE_COUNT, HIT_SPARK_WHITE_SPEED)

  if (lethal) {
    monster.userData.dying = true
    monster.userData.deathPopElapsed = 0
    jellyHit(monster, JELLY_DEATH_INFLATE_STRENGTH)
    shardBurst(particleSystem, hitPoint, stats.color, DEATH_SHARD_COUNT * (stats.boss ? BOSS_DEATH_SHARD_MULTIPLIER : 1), DEATH_SHARD_SPEED)
  }
  return lethal
}

// Checks every living monster against the equipped weapon's hit zone
// (its range and arc) and applies the hit: the weapon's damage (boosted
// by `damageMultiplier`, e.g. Rage, and again if the player is still
// within the ambush window after popping out of hiding) and knockback.
// A monster still materializing in (spawning) can't be hit. Returns
// { ambushHit, hitAny } for the whole swing.
function resolveAttackHits(player, monsters, obstacles, now, particleSystem, weapon, damageMultiplier, hitstop) {
  const attackerPos = player.position
  const ambush = isAmbushActive(now, player.exitedAt, AMBUSH_WINDOW)
  let ambushHit = false
  let hitAny = false

  for (const monster of monsters) {
    if (monster.userData.dying || monster.userData.spawning) continue

    const targetPos = { x: monster.position.x, z: monster.position.z }
    if (!isInAttackArc(attackerPos, player.facing, targetPos, weapon.range + (monster.userData.reachBonus ?? 0), weapon.arc)) {
      continue
    }

    const damage = computeDamage(weapon.damage * damageMultiplier, { ambush })
    damageMonster(monster, damage, { fromPos: attackerPos, knockback: weapon.knockback, obstacles, particleSystem, cause: 'sword', ambush, hitstop })
    hitAny = true
    if (ambush) ambushHit = true
  }

  return { ambushHit, hitAny }
}

// Advances one monster's hit-flash and death-pop animation by one frame
// (the per-vertex jelly splat/wind-up/death-burst wobble is driven
// separately, by the caller's own updateJelly tick). Call for every
// living monster every frame, hit or not. Returns true once the death
// pop has finished, meaning the caller should remove the monster from
// the scene and its monster list.
export function updateMonsterHitReaction(monster, deltaSeconds) {
  const body = monster.userData.body

  if (monster.userData.hitFlashElapsed != null) {
    monster.userData.hitFlashElapsed += deltaSeconds
    const t = Math.min(monster.userData.hitFlashElapsed / HIT_FLASH_DURATION, 1)
    body.material.emissive.lerpColors(HIT_FLASH_COLOR, body.material.userData.baseEmissive, t)
    if (t >= 1) monster.userData.hitFlashElapsed = null
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
