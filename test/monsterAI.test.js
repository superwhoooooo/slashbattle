import { describe, expect, it } from 'vitest'
import { parseMap } from '../src/logic/grid.js'
import { nextMonsterState } from '../src/logic/monsterAI.js'

const MAP = ['#####', '#...#', '#...#', '#...#', '#####']
const grid = parseMap(MAP)
const tileSize = 1

const cfg = {
  grid,
  tileSize,
  rng: () => 0.5, // deterministic: always lands on the center offset
  attackRange: 1.5,
  searchDuration: 3,
  wanderRadiusTiles: 1,
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
})
