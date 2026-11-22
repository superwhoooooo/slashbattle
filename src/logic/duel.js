// 1v1 duels (co-op's PvP mode): two players on the Orbital Sundeck, no monsters, best of five rounds. Each player's own
// weapons, abilities, pets and hero traits hit the other (src/coop.js mirrors the rival as a hittable stand-in); a hit is
// sent to the player it landed on, whose game applies it. A round ends when someone is knocked out (0 HP) or rung out
// (knocked off the deck): the one who went down tells the other, both score it, and after a short pause both stand up
// again at their corners. First to DUEL_ROUNDS_TO_WIN takes the match; a new match starts by itself. Pure; no Three.
export const DUEL_ROUNDS_TO_WIN = 3
export const DUEL_ROUND_PAUSE = 3 // s between a knockout and the next round
export const DUEL_MATCH_PAUSE = 6 // s on the result before the next match
export const DUEL_DAMAGE_SCALE = 0.45 // weapons are tuned for monsters' health: a player takes less
export const DUEL_MAX_HIT = 40 // and never more than this from one hit (no one-shots)
export const DUEL_SPAWN_DISTANCE = 13 // each corner this far from the middle
export const DUEL_START_IFRAMES = 1.5

export const createDuel = () => ({ me: 0, them: 0, round: 1, phase: 'fight', until: 0, winner: null })

// What a hit from the rival does to us (before our own armour / i-frames).
export function duelDamage(amount) {
  const d = Number(amount)
  if (!Number.isFinite(d) || d <= 0) return 0
  return Math.min(DUEL_MAX_HIT, d * DUEL_DAMAGE_SCALE)
}

// Someone went down. `iWon`: the rival did. Returns the new state (no change outside a fight, so a double report is harmless).
export function scoreKo(duel, iWon, now) {
  if (duel.phase !== 'fight') return duel
  const me = duel.me + (iWon ? 1 : 0)
  const them = duel.them + (iWon ? 0 : 1)
  if (me >= DUEL_ROUNDS_TO_WIN || them >= DUEL_ROUNDS_TO_WIN) {
    return { ...duel, me, them, phase: 'over', until: now + DUEL_MATCH_PAUSE, winner: me >= DUEL_ROUNDS_TO_WIN ? 'me' : 'them' }
  }
  return { ...duel, me, them, phase: 'between', until: now + DUEL_ROUND_PAUSE }
}

// Moves the pauses on. Returns { duel, reset }: `reset` = both players stand up at their corners now.
export function stepDuel(duel, now) {
  if (duel.phase === 'between' && now >= duel.until) return { duel: { ...duel, phase: 'fight', round: duel.round + 1 }, reset: true }
  if (duel.phase === 'over' && now >= duel.until) return { duel: createDuel(), reset: true }
  return { duel, reset: false }
}

// Where a player stands at the start of a round: the host on one side, the guest facing them on the other.
export function duelSpawn(isHost) {
  const x = isHost ? -DUEL_SPAWN_DISTANCE : DUEL_SPAWN_DISTANCE
  return { x, z: 0, facing: isHost ? Math.PI / 2 : -Math.PI / 2 }
}

export const canHit = (duel) => duel.phase === 'fight'

export function duelScoreText(duel, rivalName = 'RIVAL') {
  const head = duel.phase === 'over' ? (duel.winner === 'me' ? 'YOU WIN THE DUEL!' : `${rivalName} WINS THE DUEL`) : `ROUND ${duel.round}`
  return `${head}  ·  YOU ${duel.me} - ${duel.them} ${rivalName}  ·  FIRST TO ${DUEL_ROUNDS_TO_WIN}`
}
