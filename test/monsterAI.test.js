import { describe, expect, it } from 'vitest'
import { nextMonsterState } from '../src/logic/monsterAI.js'

// A tiny deterministic PRNG (so "many seeds" doesn't mean Math.random).
function createSeededRng(seed) {
  let state = seed + 1
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff
    return state / 0x7fffffff
  }
}

const cfg = {
  arenaRadius: 10,
  wanderMargin: 1,
  rng: () => 0.5, // deterministic: always lands on the same wander point
  attackRange: 1.5,
  searchDuration: 3,
  wanderTimeout: 4,
  arrivalDistance: 0.3,
}

describe('nextMonsterState', () => {
  it('transitions wander to chase when the player becomes visible', () => {
    const monster = {
      state: 'wander',
      position: { x: 2, z: 2 },
      stateEnteredAt: 0,
      wanderTarget: { x: 2.5, z: 2.5 },
      wanderPickedAt: 0,
    }
    const perception = {
      canSeePlayer: true,
      distanceToPlayer: 3,
      playerPos: { x: 2, z: 3 },
      playerHidden: false,
    }
    expect(nextMonsterState(monster, perception, 1, cfg).state).toBe('chase')
  })

  it('transitions chase to attack once within attack range', () => {
    const monster = { state: 'chase', position: { x: 2, z: 2 }, stateEnteredAt: 0 }
    const perception = {
      canSeePlayer: true,
      distanceToPlayer: 1,
      playerPos: { x: 2, z: 3 },
      playerHidden: false,
    }
    expect(nextMonsterState(monster, perception, 1, cfg).state).toBe('attack')
  })

  it('transitions attack back to chase once the player moves out of range', () => {
    const monster = { state: 'attack', position: { x: 2, z: 2 }, stateEnteredAt: 0 }
    const perception = {
      canSeePlayer: true,
      distanceToPlayer: 3,
      playerPos: { x: 2, z: 5 },
      playerHidden: false,
    }
    expect(nextMonsterState(monster, perception, 1, cfg).state).toBe('chase')
  })

  it('transitions chase to search when sight of the player is lost, keeping lastKnownPos', () => {
    const monster = {
      state: 'chase',
      position: { x: 2, z: 2 },
      stateEnteredAt: 0,
      lastKnownPos: { x: 2, z: 3 },
    }
    const perception = {
      canSeePlayer: false,
      distanceToPlayer: 2,
      playerPos: { x: 2, z: 3 },
      playerHidden: false,
    }
    const result = nextMonsterState(monster, perception, 1, cfg)
    expect(result.state).toBe('search')
    expect(result.lastKnownPos).toEqual({ x: 2, z: 3 })
  })

  it('transitions search to wander once the search timeout elapses', () => {
    const monster = {
      state: 'search',
      position: { x: 2, z: 2 },
      stateEnteredAt: 0,
      lastKnownPos: { x: 2, z: 2 }, // already arrived
      searchPhase: 'look',
      lookStartedAt: 0,
    }
    const perception = {
      canSeePlayer: false,
      distanceToPlayer: 10,
      playerPos: { x: 10, z: 10 },
      playerHidden: false,
    }
    const result = nextMonsterState(monster, perception, cfg.searchDuration + 0.1, cfg)
    expect(result.state).toBe('wander')
  })

  it('transitions search back to chase if the player is seen again', () => {
    const monster = {
      state: 'search',
      position: { x: 2, z: 2 },
      stateEnteredAt: 0,
      lastKnownPos: { x: 2, z: 3 },
      searchPhase: 'approach',
      lookStartedAt: null,
    }
    const perception = {
      canSeePlayer: true,
      distanceToPlayer: 1,
      playerPos: { x: 2, z: 2.5 },
      playerHidden: false,
    }
    expect(nextMonsterState(monster, perception, 1, cfg).state).toBe('chase')
  })

  it('biases a freshly picked wander target to within wanderBiasRadius of the monster', () => {
    // A roomy arena (so the platform's own edge never constrains the
    // result) with a tight wander bias radius, so any target the margin
    // of the arena wouldn't otherwise clamp must come from the bias.
    const roomyCfg = { ...cfg, arenaRadius: 1000, wanderMargin: 0, wanderBiasRadius: 15 }
    const monster = { state: 'wander', position: { x: 40, z: -40 }, stateEnteredAt: 0, wanderTarget: null }
    const perception = { canSeePlayer: false, distanceToPlayer: 999, playerPos: { x: 0, z: 0 }, playerHidden: false }

    for (let seed = 0; seed < 20; seed++) {
      const rng = createSeededRng(seed)
      const result = nextMonsterState(monster, perception, 1, { ...roomyCfg, rng })
      const distance = Math.hypot(
        result.wanderTarget.x - monster.position.x,
        result.wanderTarget.z - monster.position.z,
      )
      expect(distance).toBeLessThanOrEqual(15 + 1e-9)
    }
  })

  it('treats a hidden player as not seen, even when canSeePlayer is true', () => {
    const monster = {
      state: 'wander',
      position: { x: 2, z: 2 },
      stateEnteredAt: 0,
      wanderTarget: { x: 2.5, z: 2.5 },
      wanderPickedAt: 0,
    }
    const perception = {
      canSeePlayer: true,
      distanceToPlayer: 1,
      playerPos: { x: 2, z: 2.2 },
      playerHidden: true,
    }
    expect(nextMonsterState(monster, perception, 1, cfg).state).toBe('wander')
  })

  describe('losing the player to a pod', () => {
    const podPos = { x: 0, z: 0 }
    const hiddenPerception = {
      canSeePlayer: true,
      distanceToPlayer: 2,
      playerPos: podPos,
      playerHidden: true,
    }
    const hideCfg = { ...cfg, arenaRadius: 40, hideSearchMinDistance: 6, hideSearchMaxDistance: 10 }

    for (const state of ['chase', 'attack']) {
      it(`searches away from the pod, not at it, when a ${state}ing monster loses a hidden player`, () => {
        for (let seed = 0; seed < 50; seed++) {
          const monster = { state, position: { x: 3, z: 0 }, stateEnteredAt: 0, lastKnownPos: podPos }
          const next = nextMonsterState(monster, hiddenPerception, 1, { ...hideCfg, rng: createSeededRng(seed) })
          expect(next.state).toBe('search')
          const away = Math.hypot(next.lastKnownPos.x - podPos.x, next.lastKnownPos.z - podPos.z)
          expect(away).toBeGreaterThanOrEqual(6 - 1e-9)
          expect(away).toBeLessThanOrEqual(10 + 1e-9)
        }
      })
    }

    it('keeps the decoy search point on the platform', () => {
      const edgePod = { x: 38, z: 0 }
      for (let seed = 0; seed < 50; seed++) {
        const monster = { state: 'chase', position: { x: 36, z: 0 }, stateEnteredAt: 0, lastKnownPos: edgePod }
        const next = nextMonsterState(
          monster,
          { ...hiddenPerception, playerPos: edgePod },
          1,
          { ...hideCfg, rng: createSeededRng(seed) },
        )
        expect(Math.hypot(next.lastKnownPos.x, next.lastKnownPos.z)).toBeLessThanOrEqual(39 + 1e-9)
      }
    })

    it('still searches the last known spot when the player just ran out of sight', () => {
      const lastSeen = { x: 5, z: 5 }
      const monster = { state: 'chase', position: { x: 3, z: 0 }, stateEnteredAt: 0, lastKnownPos: lastSeen }
      const next = nextMonsterState(
        monster,
        { canSeePlayer: false, distanceToPlayer: 30, playerPos: { x: 30, z: 30 }, playerHidden: false },
        1,
        hideCfg,
      )
      expect(next.state).toBe('search')
      expect(next.lastKnownPos).toEqual(lastSeen)
    })
  })

  it('stops approaching a search spot it cannot reach and starts looking around', () => {
    const monster = {
      state: 'search',
      position: { x: 0, z: 0 },
      stateEnteredAt: 0,
      lastKnownPos: { x: 8, z: 0 },
      searchPhase: 'approach',
      lookStartedAt: null,
    }
    const hidden = { canSeePlayer: false, distanceToPlayer: 99, playerPos: { x: 0, z: 0 }, playerHidden: true }
    expect(nextMonsterState(monster, hidden, 5, cfg).searchPhase).toBe('approach')
    const next = nextMonsterState(monster, hidden, 6.5, { ...cfg, searchApproachTimeout: 6 })
    expect(next.searchPhase).toBe('look')
    expect(next.lookStartedAt).toBe(6.5)
  })
})
