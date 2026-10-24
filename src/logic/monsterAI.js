// Pure, Three-free monster AI state machine. Kept free of Three.js imports
// so Vitest can exercise it without WebGL; the Three-side driver lives in
// src/monster.js.
import { gridToWorld, isWalkable, worldToGrid } from './grid.js'

export const MONSTER_STATES = {
  WANDER: 'wander',
  CHASE: 'chase',
  ATTACK: 'attack',
  SEARCH: 'search',
}

const DEFAULT_ARRIVAL_DISTANCE = 0.3
const DEFAULT_WANDER_RADIUS_TILES = 3
const DEFAULT_WANDER_TIMEOUT = 4

function distanceBetween(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z)
}

// Picks a random walkable tile within wanderRadiusTiles of the monster's
// current tile (a few tries; falls back to staying put in a tight
// dead-end). rng is injectable (default Math.random) for deterministic
// tests.
function pickWanderTarget(monster, cfg) {
  const { grid, tileSize, rng = Math.random, wanderRadiusTiles = DEFAULT_WANDER_RADIUS_TILES } = cfg
  const center = worldToGrid(monster.position.x, monster.position.z, tileSize)
  const span = wanderRadiusTiles * 2 + 1

  for (let attempt = 0; attempt < 10; attempt++) {
    const gx = center.x + Math.floor(rng() * span) - wanderRadiusTiles
    const gz = center.z + Math.floor(rng() * span) - wanderRadiusTiles
    if (isWalkable(grid, gx, gz)) return gridToWorld(gx, gz, tileSize)
  }

  return { x: monster.position.x, z: monster.position.z }
}

// Advances one monster's AI state machine by one tick.
//
// `monster` carries its own position plus the current AI fields: state,
// stateEnteredAt, wanderTarget, wanderPickedAt, lastKnownPos, searchPhase,
// lookStartedAt. `perception` is computed by the caller every tick:
// { canSeePlayer, distanceToPlayer, playerPos, playerHidden }. A hidden
// player is always treated as not seen, regardless of canSeePlayer.
// `cfg` carries grid/tileSize/rng (for picking wander targets) plus the
// tunable thresholds: attackRange, searchDuration, wanderRadiusTiles,
// wanderTimeout, arrivalDistance.
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
          wanderTarget: pickWanderTarget(monster, cfg),
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
          wanderTarget: pickWanderTarget(monster, cfg),
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
