import {
  ARENA_RADIUS,
  MONSTER_ARRIVAL_DISTANCE,
  MONSTER_ATTACK_COOLDOWN,
  MONSTER_ATTACK_RANGE,
  MONSTER_ATTACK_WINDUP_DURATION,
  MONSTER_ATTACK_WINDUP_GROW,
  MONSTER_PLATFORM_MARGIN,
  MONSTER_TYPES,
  PLAYER_RADIUS,
  SEARCH_DURATION,
  SEARCH_SPIN_SPEED,
  SEPARATION_STRENGTH,
  SIGHT_RANGE,
  WANDER_TIMEOUT,
} from './config.js'
import { clampToPlatform, resolveArenaMove } from './logic/arena.js'
import { createCooldown } from './logic/combat.js'
import { nextMonsterState } from './logic/monsterAI.js'

const INDICATOR_DURATION = 0.6

// The AI/combat fields a monster needs on top of the type/hp/radius
// already set at spawn time (src/main.js) and the hit-reaction fields
// combat.js owns (hitFlashElapsed, etc.).
export function createMonsterAIState() {
  return {
    state: 'wander',
    stateEnteredAt: 0,
    wanderTarget: null,
    wanderPickedAt: 0,
    lastKnownPos: null,
    searchPhase: 'approach',
    lookStartedAt: null,
    attackCooldown: createCooldown(MONSTER_ATTACK_COOLDOWN),
    windUpElapsed: null,
    indicatorElapsed: null,
  }
}

// Moves `monster` a step toward targetPos at `speed`, resolved against
// obstacles (sliding along their edges). targetPos is first clamped to
// stay on the platform (MONSTER_PLATFORM_MARGIN in from the edge), so a
// monster's own steering -- wander, chase, or search -- never walks it
// off; only knockback can do that. If an obstacle blocks most of the
// intended move, nudges sideways too, so direct steering doesn't stick on
// its edge. Faces the mesh toward the direction actually moved.
function steerToward(monster, targetPos, speed, dt, obstacles) {
  const clampedTarget = clampToPlatform(targetPos, ARENA_RADIUS - MONSTER_PLATFORM_MARGIN)
  const dx = clampedTarget.x - monster.position.x
  const dz = clampedTarget.z - monster.position.z
  const distance = Math.hypot(dx, dz)
  if (distance < 1e-6) return

  const dirX = dx / distance
  const dirZ = dz / distance
  const step = Math.min(speed * dt, distance)
  const radius = monster.userData.radius

  const moved = resolveArenaMove(monster.position, { x: dirX * step, z: dirZ * step }, radius, obstacles)
  const movedDistance = Math.hypot(moved.x - monster.position.x, moved.z - monster.position.z)

  let finalPos = moved
  if (movedDistance < step * 0.5) {
    // Likely stuck against an obstacle's edge: nudge sideways so it can
    // slide around rather than stall there.
    const nudge = resolveArenaMove(moved, { x: -dirZ * step * 0.5, z: dirX * step * 0.5 }, radius, obstacles)
    finalPos = nudge
  }

  monster.position.x = finalPos.x
  monster.position.z = finalPos.z
  monster.rotation.y = Math.atan2(dirX, dirZ)
}

// Shows one indicator sprite ("chase" or "search") for INDICATOR_DURATION
// and hides the other.
function showIndicator(monster, key) {
  const indicators = monster.userData.indicators
  if (!indicators) return
  for (const [indicatorKey, sprite] of Object.entries(indicators)) {
    sprite.visible = indicatorKey === key
  }
  monster.userData.indicatorElapsed = 0
}

function updateIndicator(monster, dt) {
  if (monster.userData.indicatorElapsed === null) return
  monster.userData.indicatorElapsed += dt
  if (monster.userData.indicatorElapsed >= INDICATOR_DURATION) {
    for (const sprite of Object.values(monster.userData.indicators)) sprite.visible = false
    monster.userData.indicatorElapsed = null
  }
}

// Advances one monster's perception, AI state machine, movement, and (while
// attacking) damage dealing. `monster` is its Three.js group, carrying its
// AI fields on userData alongside the type/hp/radius set at spawn.
// `obstacles` (pods) is used for movement collision. There are no walls on
// the open platform, so line of sight is always clear: a monster sees the
// player whenever they're within SIGHT_RANGE and not hidden. Does nothing
// for a dying monster (hit-reaction/death-pop owns it instead).
// Returns { hitPlayer }: true the one frame this monster's attack actually
// damaged the player, so the caller can trigger a screen shake.
export function updateMonster(monster, player, obstacles, dt, now) {
  const ai = monster.userData
  if (ai.dying) return { hitPlayer: false }

  const stats = MONSTER_TYPES[ai.type]
  const monsterPos = { x: monster.position.x, z: monster.position.z }
  const distanceToPlayer = Math.hypot(
    player.position.x - monsterPos.x,
    player.position.z - monsterPos.z,
  )
  const canSeePlayer = distanceToPlayer <= SIGHT_RANGE

  const perception = {
    canSeePlayer,
    distanceToPlayer,
    playerPos: player.position,
    playerHidden: player.hidden === true,
  }

  const next = nextMonsterState(
    {
      state: ai.state,
      position: monsterPos,
      stateEnteredAt: ai.stateEnteredAt,
      wanderTarget: ai.wanderTarget,
      wanderPickedAt: ai.wanderPickedAt,
      lastKnownPos: ai.lastKnownPos,
      searchPhase: ai.searchPhase,
      lookStartedAt: ai.lookStartedAt,
    },
    perception,
    now,
    {
      arenaRadius: ARENA_RADIUS,
      wanderMargin: MONSTER_PLATFORM_MARGIN,
      attackRange: MONSTER_ATTACK_RANGE,
      searchDuration: SEARCH_DURATION,
      wanderTimeout: WANDER_TIMEOUT,
      arrivalDistance: MONSTER_ARRIVAL_DISTANCE,
    },
  )

  const enteredNewState = next.state !== ai.state
  Object.assign(ai, next)
  if (enteredNewState) {
    ai.windUpElapsed = null
    if (next.state === 'chase') showIndicator(monster, 'chase')
    else if (next.state === 'search') showIndicator(monster, 'search')
  }
  updateIndicator(monster, dt)

  let hitPlayer = false

  if (ai.state === 'wander' && ai.wanderTarget) {
    steerToward(monster, ai.wanderTarget, stats.speed, dt, obstacles)
  } else if (ai.state === 'chase') {
    steerToward(monster, player.position, stats.speed, dt, obstacles)
  } else if (ai.state === 'search') {
    if (ai.searchPhase === 'approach' && ai.lastKnownPos) {
      steerToward(monster, ai.lastKnownPos, stats.speed, dt, obstacles)
    } else {
      monster.rotation.y += dt * SEARCH_SPIN_SPEED
    }
  } else if (ai.state === 'attack') {
    const dx = player.position.x - monster.position.x
    const dz = player.position.z - monster.position.z
    monster.rotation.y = Math.atan2(dx, dz)

    if (ai.attackCooldown.ready(now)) {
      ai.windUpElapsed = (ai.windUpElapsed ?? 0) + dt
      const windUpProgress = Math.min(ai.windUpElapsed / MONSTER_ATTACK_WINDUP_DURATION, 1)
      const grow = 1 + windUpProgress * MONSTER_ATTACK_WINDUP_GROW
      monster.scale.multiplyScalar(grow)

      if (ai.windUpElapsed >= MONSTER_ATTACK_WINDUP_DURATION) {
        hitPlayer = player.damagePlayer(stats.damage, now)
        ai.attackCooldown.trigger(now)
        ai.windUpElapsed = null
      }
    } else {
      ai.windUpElapsed = null
    }
  }

  return { hitPlayer }
}

// Pushes apart any monsters (and the player) whose collision circles
// overlap, so they don't stack on each other. Only monsters move; the
// player's own position is left alone. Resolved through resolveArenaMove
// so the push never shoves anyone through a pod (it can, deliberately,
// push a monster off the platform's edge).
export function separateMonsters(monsters, player, obstacles) {
  for (let i = 0; i < monsters.length; i++) {
    const monster = monsters[i]
    if (monster.userData.dying) continue
    const radius = monster.userData.radius

    pushApart(monster, radius, player.position, PLAYER_RADIUS, obstacles)

    for (let j = i + 1; j < monsters.length; j++) {
      const other = monsters[j]
      if (other.userData.dying) continue
      pushApartPair(monster, radius, other, other.userData.radius, obstacles)
    }
  }
}

// The push vector that would move a point at posA away from a point at
// posB, scaled by how much their circles overlap. null when they don't.
function separationPush(posA, radiusA, posB, radiusB) {
  const dx = posA.x - posB.x
  const dz = posA.z - posB.z
  const distance = Math.hypot(dx, dz)
  const minDistance = radiusA + radiusB
  if (distance === 0 || distance >= minDistance) return null
  const factor = ((minDistance - distance) / distance) * SEPARATION_STRENGTH
  return { x: dx * factor, z: dz * factor }
}

function pushApart(monster, radius, otherPos, otherRadius, obstacles) {
  const push = separationPush(monster.position, radius, otherPos, otherRadius)
  if (!push) return
  const resolved = resolveArenaMove(monster.position, push, radius, obstacles)
  monster.position.x = resolved.x
  monster.position.z = resolved.z
}

function pushApartPair(monsterA, radiusA, monsterB, radiusB, obstacles) {
  const push = separationPush(monsterA.position, radiusA, monsterB.position, radiusB)
  if (!push) return

  const resolvedA = resolveArenaMove(monsterA.position, { x: push.x * 0.5, z: push.z * 0.5 }, radiusA, obstacles)
  monsterA.position.x = resolvedA.x
  monsterA.position.z = resolvedA.z

  const resolvedB = resolveArenaMove(monsterB.position, { x: -push.x * 0.5, z: -push.z * 0.5 }, radiusB, obstacles)
  monsterB.position.x = resolvedB.x
  monsterB.position.z = resolvedB.z
}
