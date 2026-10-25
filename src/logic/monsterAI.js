// Pure, Three-free monster AI state machine. Kept free of Three.js imports
// so Vitest can exercise it without WebGL; the Three-side driver lives in
// src/monster.js.
import { randomPointNear } from './arena.js'

export const MONSTER_STATES = {
  WANDER: 'wander',
  CHASE: 'chase',
  ATTACK: 'attack',
  SEARCH: 'search',
}

const DEFAULT_ARRIVAL_DISTANCE = 0.3
const DEFAULT_WANDER_MARGIN = 1.5
const DEFAULT_WANDER_TIMEOUT = 4
const DEFAULT_WANDER_BIAS_RADIUS = 15

function distanceBetween(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z)
}

// Picks a point near the monster's current position (kept wanderMargin
// away from the edge, like the margin that keeps steering targets on the
// platform generally) to wander toward next -- biased to within
// wanderBiasRadius of `position` so a wandering monster doesn't trek
// clean across a big arena. rng is injectable (default Math.random) for
// deterministic tests.
function pickWanderTarget(position, cfg) {
  const {
    rng = Math.random,
    arenaRadius,
    wanderMargin = DEFAULT_WANDER_MARGIN,
    wanderBiasRadius = DEFAULT_WANDER_BIAS_RADIUS,
  } = cfg
  return randomPointNear(rng, position, wanderBiasRadius, arenaRadius, wanderMargin)
}

// Advances one monster's AI state machine by one tick.
//
// `monster` carries its own position plus the current AI fields: state,
// stateEnteredAt, wanderTarget, wanderPickedAt, lastKnownPos, searchPhase,
// lookStartedAt. `perception` is computed by the caller every tick:
// { canSeePlayer, distanceToPlayer, playerPos, playerHidden }. A hidden
// player is always treated as not seen, regardless of canSeePlayer.
// `cfg` carries arenaRadius/wanderMargin/rng (for picking wander targets)
// plus the tunable thresholds: attackRange, searchDuration, wanderTimeout,
// arrivalDistance.
//
// Returns the next tick's AI fields; the caller merges them back onto the
// monster (it does not mutate `monster`).
export function nextMonsterState(monster, perception, now, cfg) {
  const arrivalDistance = cfg.arrivalDistance ?? DEFAULT_ARRIVAL_DISTANCE
  const wanderTimeout = cfg.wanderTimeout ?? DEFAULT_WANDER_TIMEOUT
  const playerVisible = perception.canSeePlayer && !perception.playerHidden

  switch (monster.state) {
    case MONSTER_STATES.CHASE: {
      if (!playerVisible) {
        return {
          state: MONSTER_STATES.SEARCH,
          stateEnteredAt: now,
          lastKnownPos: monster.lastKnownPos,
          searchPhase: 'approach',
          lookStartedAt: null,
        }
      }
      if (perception.distanceToPlayer <= cfg.attackRange) {
        return {
          state: MONSTER_STATES.ATTACK,
          stateEnteredAt: now,
          lastKnownPos: perception.playerPos,
        }
      }
      return {
        state: MONSTER_STATES.CHASE,
        stateEnteredAt: monster.stateEnteredAt,
        lastKnownPos: perception.playerPos,
      }
    }

    case MONSTER_STATES.ATTACK: {
      if (!playerVisible) {
        return {
          state: MONSTER_STATES.SEARCH,
          stateEnteredAt: now,
          lastKnownPos: monster.lastKnownPos,
          searchPhase: 'approach',
          lookStartedAt: null,
        }
      }
      if (perception.distanceToPlayer > cfg.attackRange) {
        return {
          state: MONSTER_STATES.CHASE,
          stateEnteredAt: now,
          lastKnownPos: perception.playerPos,
        }
      }
      return {
        state: MONSTER_STATES.ATTACK,
        stateEnteredAt: monster.stateEnteredAt,
        lastKnownPos: perception.playerPos,
      }
    }

    case MONSTER_STATES.SEARCH: {
      if (playerVisible) {
        return {
          state: MONSTER_STATES.CHASE,
          stateEnteredAt: now,
          lastKnownPos: perception.playerPos,
        }
      }

      const lastKnownPos = monster.lastKnownPos
      let searchPhase = monster.searchPhase ?? 'approach'
      let lookStartedAt = monster.lookStartedAt ?? null

      if (
        searchPhase === 'approach' &&
        lastKnownPos &&
        distanceBetween(monster.position, lastKnownPos) <= arrivalDistance
      ) {
        searchPhase = 'look'
        lookStartedAt = now
      }

      if (
        searchPhase === 'look' &&
        lookStartedAt !== null &&
        now - lookStartedAt >= cfg.searchDuration
      ) {
        return {
          state: MONSTER_STATES.WANDER,
          stateEnteredAt: now,
          lastKnownPos: null,
          wanderTarget: pickWanderTarget(monster.position, cfg),
          wanderPickedAt: now,
        }
      }

      return {
        state: MONSTER_STATES.SEARCH,
        stateEnteredAt: monster.stateEnteredAt,
        lastKnownPos,
        searchPhase,
        lookStartedAt,
      }
    }

    case MONSTER_STATES.WANDER:
    default: {
      if (playerVisible) {
        return {
          state: MONSTER_STATES.CHASE,
          stateEnteredAt: now,
          lastKnownPos: perception.playerPos,
        }
      }

      const hasTarget = monster.wanderTarget != null
      const arrived = hasTarget && distanceBetween(monster.position, monster.wanderTarget) <= arrivalDistance
      const timedOut = hasTarget && now - (monster.wanderPickedAt ?? now) >= wanderTimeout

      if (!hasTarget || arrived || timedOut) {
        return {
          state: MONSTER_STATES.WANDER,
          stateEnteredAt: monster.stateEnteredAt ?? now,
          wanderTarget: pickWanderTarget(monster.position, cfg),
          wanderPickedAt: now,
        }
      }

      return {
        state: MONSTER_STATES.WANDER,
        stateEnteredAt: monster.stateEnteredAt ?? now,
        wanderTarget: monster.wanderTarget,
        wanderPickedAt: monster.wanderPickedAt,
      }
    }
  }
}
