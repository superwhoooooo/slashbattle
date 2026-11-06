import {
  ARENA_RADIUS,
  MONSTER_ARRIVAL_DISTANCE,
  MONSTER_ATTACK_COOLDOWN,
  MONSTER_ATTACK_RANGE,
  MONSTER_ATTACK_WINDUP_DURATION,
  MONSTER_ATTACK_WINDUP_INFLATE_RATE,
  MONSTER_PLATFORM_MARGIN,
  MONSTER_TYPES,
  PLAYER_RADIUS,
  HIDE_SEARCH_MAX_DISTANCE,
  HIDE_SEARCH_MIN_DISTANCE,
  SEARCH_APPROACH_TIMEOUT,
  SEARCH_DURATION,
  SEARCH_SPIN_SPEED,
  MONSTER_FACING_DAMPING,
  SEPARATION_STRENGTH,
  SIGHT_RANGE,
  WANDER_BIAS_RADIUS,
  WANDER_TIMEOUT,
} from './config.js'
import { clampToPlatform, resolveArenaMove } from './logic/arena.js'
import { createCooldown } from './logic/combat.js'
import { jellyHit } from './jelly.js'
import { BOSS_SPECIALS, stepSpecialTimer } from './logic/bosses.js'
import { nextMonsterState } from './logic/monsterAI.js'
import { predictPosition, RANGED_ATTACKS, smoothVelocity } from './logic/enemies.js'
import { dampAngle } from './logic/smoothing.js'

const INDICATOR_DURATION = 0.6
const MIRROR_TURN_SCALE = 0.12// how much of its usual turning a mirror enemy manages

// The AI/combat fields a monster needs on top of the type/hp/radius
// already set at spawn time (src/main.js) and the hit-reaction fields
// combat.js owns (hitFlashElapsed, etc.).
export function createMonsterAIState(stats = {}) {
  return {
    state: 'wander',
    stateEnteredAt: 0,
    wanderTarget: null,
    wanderPickedAt: 0,
    lastKnownPos: null,
    searchPhase: 'approach',
    lookStartedAt: null,
    attackCooldown: createCooldown(stats.attackCooldown ?? MONSTER_ATTACK_COOLDOWN),
    // A boss's special-move cooldowns, each starting part-way down so they
    // don't all fire the moment the fight starts; `special` is the move
    // currently winding up/running, `chargeRemaining` a charge dash's time left.
    specialTimers: Object.fromEntries(
      (stats.specials ?? []).map((name) => {
        const cfg = BOSS_SPECIALS[name]
        // A special with a long cooldown (summon) can name a short first
        // delay, so it still shows up early in a fight.
        const interval = stats.specialIntervals?.[name] ?? cfg.interval
        return [name, cfg.firstDelay != null ? cfg.firstDelay + Math.random() * 3 : interval * (0.55 + Math.random() * 0.35)]
      }),
    ),
    // Shooters (bloater, spinner): time to the next shot, plus a smoothed
    // read on where the player is heading so a lob can lead them.
    rangedTimer: 1.2 + Math.random() * 1.8,
    playerVel: { x: 0, z: 0 },
    prevPlayerPos: null,
    speedScale: 1,
    damageScale: 1,
    special: null,
    chargeRemaining: 0,
    leapY: 0, // height above its float/ground level while leaping
    windUpElapsed: null,
    indicatorElapsed: null,
    speed: 0, // world units/second, for the jelly movement bulge
    moveDir: { x: 0, z: 1 }, // normalized horizontal movement direction, for the jelly movement bulge
  }
}

// Moves `monster` a step toward targetPos at `speed`, resolved against
// obstacles (sliding along their edges). targetPos is first clamped to
// stay on the platform (MONSTER_PLATFORM_MARGIN in from the edge), so a
// monster's own steering -- wander, chase, or search -- never walks it
// off; only knockback can do that. If an obstacle blocks most of the
// intended move, nudges sideways too, so direct steering doesn't stick on
// its edge. Turns the mesh smoothly (dampAngle, shortest way around)
// toward the direction actually moved, instead of snapping to face it.
// The labyrinth's navigator (logic/maze.js's createNavigator), or null on the
// open sundeck. With one set, monsters route around walls and can't see or
// hit through them.
let navigator = null
// True while the player is on a water room's surface: the deep dwellers are then out of reach
// (and can't see or hurt you). main.js sets it every frame.
let deepShield = false
export function setDeepShield(on) {
  deepShield = on
}
// Out of reach right now: a deep dweller while you're not diving.
export function isUntouchable(monster) {
  return deepShield && monster.userData.deep === true
}

export function setMonsterNavigator(nav) {
  navigator = nav
}

// True if nothing (a labyrinth wall) blocks the straight line a -> b. Always
// true on the open sundeck. Attacks, bullets and pets use it so nothing
// reaches through a wall.
export function hasWallLineOfSight(a, b) {
  return !navigator || navigator.hasLineOfSight(a, b)
}

// True if the point is inside a labyrinth wall (never on the sundeck).
export function isInsideWall(x, z) {
  return Boolean(navigator) && navigator.insideWall(x, z)
}

function steerToward(monster, rawTarget, speed, dt, obstacles) {
  let targetPos = rawTarget
  if (navigator && (navigator.insideWall(rawTarget.x, rawTarget.z) || !navigator.hasLineOfSight(monster.position, rawTarget))) {
    targetPos = navigator.nextWaypoint(monster.position, rawTarget)
  }
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
  monster.rotation.y = dampAngle(monster.rotation.y, Math.atan2(dirX, dirZ), MONSTER_FACING_DAMPING, dt)
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

// Shows the red ground ring for a boss's slam/spin wind-up (and the
// spin's duration), hides it otherwise.
function updateTelegraph(monster, ai) {
  const ring = ai.telegraph
  if (!ring) return
  const special = ai.special
  const shown = special && (special.name === 'slam' || special.name === 'spin')
  ring.visible = Boolean(shown)
  if (!shown) return
  const progress = special.phase === 'windup' ? 1 - special.remaining / BOSS_SPECIALS[special.name].windup : 1
  ring.scale.setScalar(special.radius)
  ring.material.opacity = 0.18 + 0.5 * progress
}

// Starts one of a boss's specials (see BOSS_SPECIALS): a charge is an
// instant dash; everything else winds up first (the boss stops, puffs up,
// and slam/spin show their danger ring).
function beginSpecial(monster, ai, stats, name) {
  const cfg = BOSS_SPECIALS[name]
  showIndicator(monster, 'chase')
  if (name === 'charge') {
    ai.chargeRemaining = cfg.duration
    return
  }
  const radius = name === 'slam' || name === 'leap' ? cfg.radius : stats.radius + (cfg.radiusBonus ?? 0)
  ai.special = { name, phase: 'windup', remaining: cfg.windup, radius, tick: 0 }
}

// The moment a wind-up ends: pushes the event the caller turns into damage
// and visuals (slam, barrage, summon), teleports (blink), or flips a spin
// into its whirling phase. `events` is the caller's list to append to.
function fireSpecial(monster, ai, stats, player, obstacles, events) {
  const name = ai.special.name
  const cfg = BOSS_SPECIALS[name]
  const x = monster.position.x
  const z = monster.position.z
  const damage = Math.round(stats.damage * (cfg.damageMultiplier ?? 1))

  if (name === 'spin') {
    ai.special = { ...ai.special, phase: 'active', remaining: cfg.duration, tick: 0 }
    return
  }
  if (name === 'leap') {
    // Jump to where the player is standing now; the arc is flown in stepBossSpecials.
    const to = clampToPlatform({ x: player.position.x, z: player.position.z }, ARENA_RADIUS - MONSTER_PLATFORM_MARGIN)
    ai.special = { name: 'leap', phase: 'air', remaining: cfg.duration, total: cfg.duration, from: { x, z }, to, radius: cfg.radius, damage: Math.round(damage * (ai.damageScale ?? 1)) }
    return
  }
  ai.special = null

  if (name === 'slam') {
    events.push({ type: 'slam', x, z, radius: cfg.radius, damage })
  } else if (name === 'summon') {
    events.push({ type: 'summon', count: cfg.count, maxMinions: cfg.maxMinions })
  } else if (name === 'lob') {
    const lob = RANGED_ATTACKS.boss_bloater
    const lead = predictPosition(player.position, ai.playerVel, lob.flight)
    const target = clampToPlatform(lead, ARENA_RADIUS - 1)
    events.push({ type: 'lob', x, z, tx: target.x, tz: target.z, flight: lob.flight, radius: lob.puddleRadius, life: lob.puddleLife, tick: lob.tick, damage })
  } else if (name === 'barrage') {
    events.push({
      type: 'barrage',
      x,
      z,
      aim: Math.atan2(player.position.x - x, player.position.z - z),
      count: cfg.count,
      spread: cfg.spread,
      speed: cfg.speed,
      damage,
    })
  } else if (name === 'blink') {
    const angle = Math.random() * Math.PI * 2
    const target = clampToPlatform(
      { x: player.position.x + Math.sin(angle) * cfg.distance, z: player.position.z + Math.cos(angle) * cfg.distance },
      ARENA_RADIUS - MONSTER_PLATFORM_MARGIN,
    )
    // In the labyrinth a blink can't land in (or through) a wall.
    const blocked = navigator && (navigator.insideWall(target.x, target.z) || !navigator.hasLineOfSight(player.position, target))
    if (blocked) return
    monster.position.x = target.x
    monster.position.z = target.z
    events.push({ type: 'blink', from: { x, z }, to: target })
  }
}

// Runs a boss's special-move state machine for one tick, appending any
// resulting events. Returns { speed, busy }: the chase speed to use this
// tick (boosted during a charge), and whether the boss is mid-wind-up/spin
// and so shouldn't walk or attack normally.
function stepBossSpecials(monster, ai, stats, player, obstacles, dt, events) {
  let speed = stats.speed
  const engaged = ai.state === 'chase' || ai.state === 'attack'
  if (ai.special && !engaged && ai.special.phase !== 'air') ai.special = null // lost the player (they hid): fizzle
  if (!ai.special && !engaged) ai.chargeRemaining = 0

  if (ai.special) {
    const special = ai.special
    special.remaining -= dt
    if (special.phase === 'windup') {
      const dx = player.position.x - monster.position.x
      const dz = player.position.z - monster.position.z
      monster.rotation.y = dampAngle(monster.rotation.y, Math.atan2(dx, dz), MONSTER_FACING_DAMPING, dt)
      jellyHit(monster, -MONSTER_ATTACK_WINDUP_INFLATE_RATE * dt)
      if (special.remaining <= 0) fireSpecial(monster, ai, stats, player, obstacles, events)
      ai.speed = 0
    } else if (special.phase === 'air') {
      // Mid-leap: slides from the take-off spot to the landing spot along an arc, then stomps.
      const cfgLeap = BOSS_SPECIALS.leap
      const t = Math.min(1, 1 - Math.max(0, special.remaining) / special.total)
      monster.position.x = special.from.x + (special.to.x - special.from.x) * t
      monster.position.z = special.from.z + (special.to.z - special.from.z) * t
      ai.leapY = cfgLeap.height * Math.sin(Math.PI * t)
      monster.rotation.y = dampAngle(monster.rotation.y, Math.atan2(special.to.x - special.from.x, special.to.z - special.from.z), MONSTER_FACING_DAMPING, dt)
      ai.speed = stats.speed * 2
      if (special.remaining <= 0) {
        ai.leapY = 0
        events.push({ type: 'slam', x: monster.position.x, z: monster.position.z, radius: special.radius, damage: special.damage })
        jellyHit(monster, 0.7) // a squash on landing
        ai.special = null
      }
    } else {
      // Spinning: whirl in place-ish, creeping toward the player, and
      // hitting everything in range every tickInterval.
      const cfg = BOSS_SPECIALS.spin
      monster.rotation.y += 14 * dt
      const dx = player.position.x - monster.position.x
      const dz = player.position.z - monster.position.z
      const distance = Math.hypot(dx, dz)
      if (distance > 1e-6) {
        const step = stats.speed * 0.7 * dt
        const moved = resolveArenaMove(monster.position, { x: (dx / distance) * step, z: (dz / distance) * step }, stats.radius, obstacles)
        monster.position.x = moved.x
        monster.position.z = moved.z
      }
      ai.speed = stats.speed * 0.7
      special.tick -= dt
      if (special.tick <= 0) {
        special.tick = cfg.tickInterval
        events.push({
          type: 'spinTick',
          x: monster.position.x,
          z: monster.position.z,
          radius: special.radius,
          damage: Math.round(stats.damage * cfg.damageMultiplier),
        })
      }
      if (special.remaining <= 0) ai.special = null
    }
    return { speed, busy: true }
  }

  if (ai.chargeRemaining > 0) {
    ai.chargeRemaining -= dt
    speed = stats.speed * BOSS_SPECIALS.charge.speedMultiplier
  } else if (engaged) {
    for (const name of stats.specials) {
      // A charge only makes sense while closing in, not once in melee range.
      if (name === 'charge' && ai.state !== 'chase') continue
      const tick = stepSpecialTimer(ai.specialTimers[name], dt, stats.specialIntervals?.[name] ?? BOSS_SPECIALS[name].interval)
      ai.specialTimers[name] = tick.timer
      // A leap only goes off when the player is within its reach; otherwise try again shortly.
      if (tick.fire && name === 'leap') {
        const distance = Math.hypot(player.position.x - monster.position.x, player.position.z - monster.position.z)
        if (distance > BOSS_SPECIALS.leap.range || player.hidden) {
          ai.specialTimers[name] = 0.2
          continue
        }
      }
      if (tick.fire) {
        beginSpecial(monster, ai, stats, name)
        break
      }
    }
  }
  return { speed, busy: false }
}

// A shooter in range: backs off if you crowd it, otherwise holds its ground,
// puffing up for its wind-up and then firing. A bloater lobs poison at where
// you'll BE (your smoothed velocity times the glob's flight time); a spinner
// whirls and fires a small fan of orbs straight at you. Returns the speed
// it moved at (for the jelly bulge).
function stepRanged(monster, ai, ranged, player, obstacles, speed, dt, events) {
  const x = monster.position.x
  const z = monster.position.z
  const dx = player.position.x - x
  const dz = player.position.z - z
  const distance = Math.hypot(dx, dz)

  let moved = 0
  if (distance < ranged.keepAway && distance > 1e-6) {
    steerToward(monster, { x: x - (dx / distance) * 3, z: z - (dz / distance) * 3 }, speed * 0.9, dt, obstacles)
    moved = speed * 0.9
  }
  if (ranged.spins) monster.rotation.y += 9 * dt
  else if (moved === 0) monster.rotation.y = dampAngle(monster.rotation.y, Math.atan2(dx, dz), MONSTER_FACING_DAMPING, dt)

  ai.rangedTimer -= dt
  if (ai.rangedTimer <= ranged.windup) jellyHit(monster, -MONSTER_ATTACK_WINDUP_INFLATE_RATE * dt)
  if (ai.rangedTimer > 0) return moved
  // The faster they're scaled up, the sooner the next shot.
  ai.rangedTimer = ranged.interval / Math.max(1, 0.5 + ai.speedScale * 0.5)
  const damage = Math.round(MONSTER_TYPES[ai.type].damage * ai.damageScale)

  if (ranged.kind === 'lob') {
    const lead = predictPosition(player.position, ai.playerVel, ranged.flight)
    const target = clampToPlatform(lead, ARENA_RADIUS - 1)
    events.push({ type: 'lob', x, z, tx: target.x, tz: target.z, flight: ranged.flight, radius: ranged.puddleRadius, life: ranged.puddleLife, tick: ranged.tick, damage })
  } else {
    events.push({ type: 'shoot', x, z, aim: Math.atan2(dx, dz), count: ranged.count, spread: ranged.spread, speed: ranged.speed, size: ranged.orbSize, damage })
  }
  return moved
}

// Advances one monster's perception, AI state machine, movement, and (while
// attacking) damage dealing. `monster` is its Three.js group, carrying its
// AI fields on userData alongside the type/hp/radius set at spawn.
// `obstacles` (pods) is used for movement collision. There are no walls on
// the open platform, so line of sight is always clear: a monster sees the
// player whenever they're within SIGHT_RANGE and not hidden. Does nothing
// for a dying monster (hit-reaction/death-pop owns it instead).
// Returns { hitPlayer, events }: hitPlayer is true the one frame this
// monster's attack actually damaged the player, so the caller can trigger
// a screen shake; events lists the boss specials that fired this tick
// ({ type: 'slam' | 'spinTick' | 'barrage' | 'summon' | 'blink', ... }) for
// the caller to turn into damage, projectiles, minions and effects.
export function updateMonster(monster, player, obstacles, dt, now) {
  const ai = monster.userData
  if (ai.dying) return { hitPlayer: false, events: [] }

  const stats = MONSTER_TYPES[ai.type]

  // Confused (caught in a Warp Field): stumbles about at random, spinning,
  // too dizzy to chase or attack. Bosses shrug it off.
  if (!ai.isBoss && now < (ai.confusedUntil ?? -Infinity)) {
    ai.confuseTimer = (ai.confuseTimer ?? 0) - dt
    if (ai.confuseTimer <= 0 || !ai.confuseHeading) {
      ai.confuseTimer = 0.35 + Math.random() * 0.35
      ai.confuseHeading = Math.random() * Math.PI * 2
    }
    const speed = stats.speed * ai.speedScale
    steerToward(
      monster,
      { x: monster.position.x + Math.sin(ai.confuseHeading) * 4, z: monster.position.z + Math.cos(ai.confuseHeading) * 4 },
      speed * 0.9,
      dt,
      obstacles,
    )
    monster.rotation.y += dt * 11
    ai.speed = speed * 0.5
    ai.windUpElapsed = null
    if (ai.indicatorElapsed === null) showIndicator(monster, 'search')
    return { hitPlayer: false, events: [] }
  }

  const yawAtStart = monster.rotation.y
  const monsterPos = { x: monster.position.x, z: monster.position.z }
  const distanceToPlayer = Math.hypot(
    player.position.x - monsterPos.x,
    player.position.z - monsterPos.z,
  )
  let canSeePlayer = distanceToPlayer <= SIGHT_RANGE * (player.sightScale ?? 1) // a diver hides in the murk
  let perceivedDistance = distanceToPlayer
  if (navigator) {
    // Walls hide you from sight, but monsters hunt by sound/scent: anyone within
    // a few corridors comes looking. They can only strike what they can see.
    const clear = navigator.hasLineOfSight(monsterPos, player.position)
    canSeePlayer = clear ? distanceToPlayer <= SIGHT_RANGE * (player.sightScale ?? 1) : navigator.pathCells(monsterPos, player.position) <= 3
    if (!clear) perceivedDistance = Math.max(distanceToPlayer, 99)
  }

  const perception = {
    canSeePlayer,
    distanceToPlayer: perceivedDistance,
    playerPos: player.position,
    // Hiding in a pod and Ghost Form both make you unseen.
    playerHidden: player.hidden === true || now < (player.ghostUntil ?? -Infinity) || (deepShield && ai.deep === true),
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
      wanderBiasRadius: WANDER_BIAS_RADIUS,
      attackRange: stats.attackRange ?? MONSTER_ATTACK_RANGE,
      searchDuration: SEARCH_DURATION,
      wanderTimeout: WANDER_TIMEOUT,
      arrivalDistance: MONSTER_ARRIVAL_DISTANCE,
      searchApproachTimeout: SEARCH_APPROACH_TIMEOUT,
      hideSearchMinDistance: HIDE_SEARCH_MIN_DISTANCE,
      hideSearchMaxDistance: HIDE_SEARCH_MAX_DISTANCE,
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
  const events = []

  const ranged = RANGED_ATTACKS[ai.type]
  if (ranged || stats.specials?.includes('lob')) {
    ai.playerVel = smoothVelocity(ai.playerVel, ai.prevPlayerPos, player.position, dt)
    ai.prevPlayerPos = { x: player.position.x, z: player.position.z }
  }

  let speed = stats.speed * ai.speedScale
  let busy = false
  if (stats.specials) {
    ;({ speed, busy } = stepBossSpecials(monster, ai, stats, player, obstacles, dt, events))
  }
  updateTelegraph(monster, ai)

  if (busy) {
    // Mid wind-up/spin: stepBossSpecials already moved/turned it.
  } else if (ranged && ai.state === 'attack') {
    ai.speed = stepRanged(monster, ai, ranged, player, obstacles, speed, dt, events)
  } else if (ai.state === 'wander' && ai.wanderTarget) {
    steerToward(monster, ai.wanderTarget, speed, dt, obstacles)
    ai.speed = speed
  } else if (ai.state === 'chase') {
    steerToward(monster, player.position, speed, dt, obstacles)
    ai.speed = speed
  } else if (ai.state === 'search') {
    if (ai.searchPhase === 'approach' && ai.lastKnownPos) {
      steerToward(monster, ai.lastKnownPos, speed, dt, obstacles)
      ai.speed = speed
    } else {
      monster.rotation.y += dt * SEARCH_SPIN_SPEED
      ai.speed = 0
    }
  } else if (ai.state === 'attack') {
    const dx = player.position.x - monster.position.x
    const dz = player.position.z - monster.position.z
    monster.rotation.y = dampAngle(monster.rotation.y, Math.atan2(dx, dz), MONSTER_FACING_DAMPING, dt)
    ai.speed = 0

    if (!stats.noMelee && ai.attackCooldown.ready(now)) {
      ai.windUpElapsed = (ai.windUpElapsed ?? 0) + dt
      // Feeds the jelly hit spring a little inflate every frame of the
      // telegraph, so the body visibly puffs up as it charges the hit;
      // once the hit lands (or the state changes), the spring naturally
      // rebounds back past zero before settling.
      jellyHit(monster, -MONSTER_ATTACK_WINDUP_INFLATE_RATE * dt)

      if (ai.windUpElapsed >= MONSTER_ATTACK_WINDUP_DURATION) {
        hitPlayer = player.damagePlayer(Math.round(stats.damage * ai.damageScale), now)
        ai.attackCooldown.trigger(now)
        ai.windUpElapsed = null
      }
    } else {
      ai.windUpElapsed = null
    }
  }

  // A mirror is heavy to swing around: it turns slowly, so you can circle round to its unguarded back.
  if (stats.reflect) {
    const turned = monster.rotation.y - yawAtStart
    monster.rotation.y = yawAtStart + Math.atan2(Math.sin(turned), Math.cos(turned)) * MIRROR_TURN_SCALE
  }

  ai.moveDir = { x: Math.sin(monster.rotation.y), z: Math.cos(monster.rotation.y) }

  return { hitPlayer, events }
}

// Pushes apart any monsters (and the player) whose collision circles
// overlap, so they don't stack on each other. Only monsters move; the
// player's own position is left alone. Resolved through resolveArenaMove
// so the push never shoves anyone through a pod (it can, deliberately,
// push a monster off the platform's edge). Dying or still-spawning-in
// monsters aren't really physically present yet/anymore, so they're
// skipped on both sides of the push.
export function separateMonsters(monsters, player, obstacles) {
  for (let i = 0; i < monsters.length; i++) {
    const monster = monsters[i]
    if (monster.userData.dying || monster.userData.spawning) continue
    const radius = monster.userData.radius

    pushApart(monster, radius, player.position, PLAYER_RADIUS, obstacles)

    for (let j = i + 1; j < monsters.length; j++) {
      const other = monsters[j]
      if (other.userData.dying || other.userData.spawning) continue
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
