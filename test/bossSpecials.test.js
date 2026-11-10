import { describe, expect, it } from 'vitest'
import { MONSTER_TYPES } from '../src/config.js'
import { BOSS_SPECIALS } from '../src/logic/bosses.js'
import { RANGED_ATTACKS, SPLITS } from '../src/logic/enemies.js'
import { createMonsterAIState, updateMonster } from '../src/monster.js'

// A stand-in for the monster Three group: updateMonster only touches
// position/rotation/userData (and jellyHit's spring on userData.jelly).
function fakeBoss(id, x = 0, z = 0) {
  const stats = MONSTER_TYPES[id]
  return {
    position: { x, y: 0, z },
    rotation: { y: 0 },
    userData: {
      type: id,
      radius: stats.radius,
      hp: stats.hp,
      jelly: { hit: { value: 0, velocity: 0 } },
      telegraph: { visible: false, scale: { setScalar() {} }, material: { opacity: 0 } },
      ...createMonsterAIState(stats),
    },
  }
}

function fakePlayer(x, z, hidden = false) {
  const player = {
    position: { x, z },
    hidden,
    hits: [],
    damagePlayer(amount) {
      this.hits.push(amount)
      return true
    },
  }
  return player
}

// Runs the boss for `seconds` of game time, returning every event fired
// (each tagged with the time it fired).
function run(boss, player, seconds, { dt = 0.05, start = 0 } = {}) {
  const events = []
  for (let t = 0; t < seconds; t += dt) {
    const out = updateMonster(boss, player, [], dt, start + t)
    for (const event of out.events) events.push({ ...event, at: t })
  }
  return events
}

// Puts the boss in an engaged chase state with a short timer for `name`.
function engage(boss, name, timer = 0.2) {
  boss.userData.state = 'chase'
  boss.userData.stateEnteredAt = 0
  boss.userData.specialTimers[name] = timer
}

describe('boss specials', () => {
  it('gives every boss timers for exactly its own specials', () => {
    const boss = fakeBoss('boss_zipzilla')
    expect(Object.keys(boss.userData.specialTimers).sort()).toEqual(['barrage', 'blink', 'charge', 'summon'])
  })

  it('the new shooter bosses keep their long range', () => {
    expect(MONSTER_TYPES.boss_bloater.attackRange).toBeGreaterThan(10) // the shooters keep their long range
    expect(MONSTER_TYPES.boss_spinner.attackRange).toBeGreaterThan(10)
  })

  it('slam: winds up (showing its ring), then fires once with the right radius and damage', () => {
    const boss = fakeBoss('boss_gloop', 0, 0)
    const player = fakePlayer(0, 5)
    engage(boss, 'slam')
    const events = run(boss, player, 3)
    const slams = events.filter((e) => e.type === 'slam')
    expect(slams).toHaveLength(1)
    expect(slams[0].radius).toBe(BOSS_SPECIALS.slam.radius)
    expect(slams[0].damage).toBe(Math.round(MONSTER_TYPES.boss_gloop.damage * BOSS_SPECIALS.slam.damageMultiplier))
    // The wind-up delays it: not before timer (0.2s) + windup.
    expect(slams[0].at).toBeGreaterThanOrEqual(0.2 + BOSS_SPECIALS.slam.windup - 0.1)
  })

  it('stands still during the wind-up', () => {
    const boss = fakeBoss('boss_gloop', 0, 0)
    const player = fakePlayer(0, 20)
    engage(boss, 'slam', 0.05)
    run(boss, player, 0.2) // timer fires, wind-up begins
    expect(boss.userData.special?.phase).toBe('windup')
    const before = { ...boss.position }
    run(boss, player, 0.3, { start: 0.2 })
    expect(boss.position.x).toBeCloseTo(before.x)
    expect(boss.position.z).toBeCloseTo(before.z)
  })

  it('blink: teleports to within `distance` of the player', () => {
    const boss = fakeBoss('boss_zipzilla', 14, 14) // ~20 away: inside sight range
    const player = fakePlayer(0, 0)
    boss.userData.specialTimers.charge = 999
    engage(boss, 'blink')
    const events = run(boss, player, 2)
    const blink = events.find((e) => e.type === 'blink')
    expect(blink).toBeDefined()
    expect(Math.hypot(blink.to.x - player.position.x, blink.to.z - player.position.z)).toBeCloseTo(BOSS_SPECIALS.blink.distance, 1)
    expect(Math.hypot(blink.from.x - blink.to.x, blink.from.z - blink.to.z)).toBeGreaterThan(10) // it actually jumped
  })

  it('barrage: fires one event aimed at the player', () => {
    const boss = fakeBoss('boss_wobble', 0, 0)
    const player = fakePlayer(10, 0)
    boss.userData.specialTimers.summon = 999
    engage(boss, 'barrage')
    const barrage = run(boss, player, 2).find((e) => e.type === 'barrage')
    expect(barrage).toBeDefined()
    expect(barrage.aim).toBeCloseTo(Math.PI / 2, 1) // +x
    expect(barrage.count).toBe(BOSS_SPECIALS.barrage.count)
  })

  it('summon: asks for minions', () => {
    const boss = fakeBoss('boss_wobble', 0, 0)
    const player = fakePlayer(5, 0)
    boss.userData.specialTimers.barrage = 999
    engage(boss, 'summon')
    const summon = run(boss, player, 2).find((e) => e.type === 'summon')
    expect(summon).toMatchObject({ count: BOSS_SPECIALS.summon.count, maxMinions: BOSS_SPECIALS.summon.maxMinions })
  })

  it('summon: first call comes early in the fight, then one every ~22s', () => {
    const boss = fakeBoss('boss_wobble', 0, 0)
    const player = fakePlayer(5, 0)
    boss.userData.state = 'chase'
    boss.userData.stateEnteredAt = 0
    const summons = run(boss, player, 130).filter((e) => e.type === 'summon')
    expect(summons.length).toBeGreaterThanOrEqual(2)
    expect(summons[0].at).toBeLessThan(15)
    for (let i = 1; i < summons.length; i++) expect(summons[i].at - summons[i - 1].at).toBeGreaterThanOrEqual(BOSS_SPECIALS.summon.interval - 1)
  })

  it('spin: whirls for its duration, ticking damage at the tick interval', () => {
    const boss = fakeBoss('boss_grumpsalot', 0, 0)
    const player = fakePlayer(0, 6)
    engage(boss, 'spin')
    const events = run(boss, player, 0.2 + BOSS_SPECIALS.spin.windup + BOSS_SPECIALS.spin.duration + 0.5)
    const ticks = events.filter((e) => e.type === 'spinTick')
    expect(ticks.length).toBeGreaterThanOrEqual(Math.floor(BOSS_SPECIALS.spin.duration / BOSS_SPECIALS.spin.tickInterval) - 1)
    expect(ticks[0].radius).toBeCloseTo(MONSTER_TYPES.boss_grumpsalot.radius + BOSS_SPECIALS.spin.radiusBonus)
    expect(boss.userData.special).toBeNull() // finished
  })

  it('charge: dashes faster than normal speed, then settles back', () => {
    const boss = fakeBoss('boss_zipzilla', 0, 0)
    const player = fakePlayer(0, 22) // in sight but far enough to keep chasing
    boss.userData.specialTimers.blink = 999
    engage(boss, 'charge', 0.05)
    run(boss, player, 0.2)
    expect(boss.userData.chargeRemaining).toBeGreaterThan(0)
    expect(boss.userData.speed).toBeCloseTo(MONSTER_TYPES.boss_zipzilla.speed * BOSS_SPECIALS.charge.speedMultiplier)
    run(boss, player, BOSS_SPECIALS.charge.duration + 0.3, { start: 0.2 })
    expect(boss.userData.chargeRemaining).toBeLessThanOrEqual(0)
    expect(boss.userData.speed).toBeCloseTo(MONSTER_TYPES.boss_zipzilla.speed)
  })

  it('fizzles mid-wind-up if the player hides (it never fires)', () => {
    const boss = fakeBoss('boss_gloop', 0, 0)
    const player = fakePlayer(0, 5)
    engage(boss, 'slam', 0.05)
    run(boss, player, 0.3) // wind-up under way
    expect(boss.userData.special).not.toBeNull()
    player.hidden = true
    const events = run(boss, player, 2, { start: 0.3 })
    expect(events.filter((e) => e.type === 'slam')).toHaveLength(0)
    expect(boss.userData.special).toBeNull()
  })

  it('does not use specials while wandering (never engaged)', () => {
    const boss = fakeBoss('boss_gloop', 0, 0)
    const player = fakePlayer(500, 500) // far beyond sight range
    boss.userData.specialTimers.slam = 0.01
    expect(run(boss, player, 3)).toEqual([])
  })
})

describe('the new enemies', () => {
  it('a hopper leaps onto the player and lands with a stomp, then keeps still on the ground', () => {
    const hopper = fakeBoss('hopper', 0, 0)
    const player = fakePlayer(6, 0)
    engage(hopper, 'leap')
    let peak = 0
    const events = []
    for (let t = 0; t < 3; t += 0.05) {
      const out = updateMonster(hopper, player, [], 0.05, t)
      peak = Math.max(peak, hopper.userData.leapY)
      events.push(...out.events)
    }
    expect(peak).toBeGreaterThan(1) // it went up
    const stomp = events.find((e) => e.type === 'slam')
    expect(stomp).toBeTruthy()
    expect(Math.hypot(stomp.x - 6, stomp.z)).toBeLessThan(1.5) // came down on the player
    expect(stomp.radius).toBe(BOSS_SPECIALS.leap.radius)
    expect(stomp.damage).toBeGreaterThan(0)
    expect(hopper.userData.leapY).toBe(0)
  })
  it('a hopper has no ordinary melee swing (its jump is its attack)', () => {
    const hopper = fakeBoss('hopper', 0, 0)
    const player = fakePlayer(1, 0)
    hopper.userData.specialTimers.leap = 99
    run(hopper, player, 3)
    expect(player.hits).toEqual([])
  })
  it('a hopper out of reach waits instead of jumping', () => {
    const hopper = fakeBoss('hopper', 0, 0)
    const player = fakePlayer(30, 0)
    engage(hopper, 'leap')
    const events = run(hopper, player, 1)
    expect(events.some((e) => e.type === 'slam')).toBe(false)
  })
  it('a glimmer blinks next to the player', () => {
    const glimmer = fakeBoss('glimmer', 0, 0)
    const player = fakePlayer(5, 0)
    engage(glimmer, 'blink')
    const events = run(glimmer, player, 2)
    const blink = events.find((e) => e.type === 'blink')
    expect(blink).toBeTruthy()
    expect(Math.hypot(blink.to.x - 5, blink.to.z)).toBeLessThan(6) // close, but not on top of you
  })
  it('a diving player is seen from only a short way off', () => {
    const grumpus = fakeBoss('blobbo', 0, 0)
    const player = fakePlayer(14, 0)
    player.sightScale = 0.4
    for (let t = 0; t < 1; t += 0.05) updateMonster(grumpus, player, [], 0.05, t)
    expect(grumpus.userData.state).toBe('wander') // too far to notice a diver
    const surfaced = fakePlayer(14, 0)
    const other = fakeBoss('blobbo', 0, 0)
    for (let t = 0; t < 1; t += 0.05) updateMonster(other, surfaced, [], 0.05, t)
    expect(other.userData.state).toBe('chase')
  })
})

describe('the mirror enemy', () => {
  it('turns slowly toward the player, so its back can be reached', () => {
    const slow = fakeBoss('mirror', 0, 0)
    const quick = fakeBoss('blobbo', 0, 0)
    const player = fakePlayer(-6, 0) // to the monster's left: needs a big turn
    for (const m of [slow, quick]) {
      m.userData.state = 'chase'
      m.userData.stateEnteredAt = 0
      updateMonster(m, player, [], 0.1, 0)
    }
    expect(Math.abs(slow.rotation.y)).toBeLessThan(Math.abs(quick.rotation.y))
  })
})
