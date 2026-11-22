// 1v1 duels (co-op's PvP mode): two players on the Orbital Sundeck, no monsters, best of five rounds. Each player's own
// weapons, abilities, pets and hero traits hit the other (src/coop.js mirrors the rival as a hittable stand-in); a hit is
// sent to the player it landed on, whose game applies it. A round ends when someone is knocked out (0 HP) or rung out
// (knocked off the deck): the one who went down tells the other, both score it, and after a short pause both stand up
// again at their corners. First to DUEL_ROUNDS_TO_WIN takes the match; a new match starts by itself. Pure; no Three.
//
// The deck is smaller than the sundeck (DUEL_RADIUS) and everyone moves slower (DUEL_SPEED), so it's a close-up brawl.
// STAKES: the host can put something they own on the line (a hero, a pet, or crystals: `stakeOptions`). If the rival
// wins the match they get their own copy of it (`awardStake`); the host never loses it.
import { DEFAULT_HERO, HEROES } from './heroes.js'
import { PETS } from './items.js'

export const DUEL_RADIUS = 26 // the duel deck (the sundeck is 48)
export const DUEL_SPEED = 0.72 // everyone's move speed is scaled by this in a duel
export const DUEL_ROUNDS_TO_WIN = 3
export const DUEL_ROUND_PAUSE = 3 // s between a knockout and the next round
export const DUEL_MATCH_PAUSE = 6 // s on the result before the next match
export const DUEL_DAMAGE_SCALE = 0.45 // weapons are tuned for monsters' health: a player takes less
export const DUEL_MAX_HIT = 40 // and never more than this from one hit (no one-shots)
export const DUEL_SPAWN_DISTANCE = 7 // each corner this far from the middle (inside the prop-free centre, resortLayout's CENTER_CLEARANCE 8)
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

// ---------- stakes ----------
export const STAKE_CRYSTALS = [100, 250, 500, 1000, 2500]
export const NO_STAKE = { kind: 'none' }
const heroName = (id) => HEROES.find((h) => h.id === id)?.name ?? null
const petName = (id) => PETS[id]?.name ?? null

// Everything the host could put on the line (only what they own: banked crystals they have, heroes, pets in their collection).
export function stakeOptions(profile) {
  const out = [NO_STAKE]
  for (const amount of STAKE_CRYSTALS) if ((profile?.bank ?? 0) >= amount) out.push({ kind: 'crystals', amount })
  for (const id of profile?.heroesOwned ?? []) if (id !== DEFAULT_HERO && heroName(id)) out.push({ kind: 'hero', id })
  for (const id of profile?.collection ?? []) if (petName(id)) out.push({ kind: 'pet', id })
  return out
}

// A stake as it arrives over the network (or from a save): anything unknown becomes no stake.
export function cleanStake(raw) {
  if (!raw || typeof raw !== 'object') return NO_STAKE
  if (raw.kind === 'crystals' && STAKE_CRYSTALS.includes(Number(raw.amount))) return { kind: 'crystals', amount: Number(raw.amount) }
  if (raw.kind === 'hero' && raw.id !== DEFAULT_HERO && heroName(raw.id)) return { kind: 'hero', id: raw.id }
  if (raw.kind === 'pet' && petName(raw.id)) return { kind: 'pet', id: raw.id }
  return NO_STAKE
}

export const stakeKey = (stake) => (stake.kind === 'crystals' ? `crystals:${stake.amount}` : stake.kind === 'none' ? 'none' : `${stake.kind}:${stake.id}`)
export const sameStake = (a, b) => stakeKey(cleanStake(a)) === stakeKey(cleanStake(b))

export function stakeLabel(stake) {
  const s = cleanStake(stake)
  if (s.kind === 'crystals') return `${s.amount} crystals`
  if (s.kind === 'hero') return `the hero ${heroName(s.id)}`
  if (s.kind === 'pet') return `the pet ${petName(s.id)}`
  return 'nothing'
}

// Does the host (still) own it?
export function ownsStake(profile, stake) {
  const s = cleanStake(stake)
  if (s.kind === 'none') return stake?.kind === 'none' // (nothing is always yours to offer; an unknown thing never is)
  return stakeOptions(profile).some((o) => sameStake(o, s))
}

// The winner's copy. Returns { profile, gained } (`gained` false when they already had that hero / pet).
export function awardStake(profile, stake) {
  const s = cleanStake(stake)
  if (s.kind === 'crystals') return { profile: { ...profile, bank: (profile.bank ?? 0) + s.amount }, gained: true }
  if (s.kind === 'hero') {
    if ((profile.heroesOwned ?? []).includes(s.id)) return { profile, gained: false }
    return { profile: { ...profile, heroesOwned: [...(profile.heroesOwned ?? []), s.id] }, gained: true }
  }
  if (s.kind === 'pet') {
    if ((profile.collection ?? []).includes(s.id)) return { profile, gained: false }
    return { profile: { ...profile, collection: [...(profile.collection ?? []), s.id] }, gained: true }
  }
  return { profile, gained: false }
}

// The stake can only change before the first round of a match is scored (no swapping it out when you're losing).
export const stakeLocked = (duel) => duel.phase === 'between' || (duel.phase === 'fight' && duel.me + duel.them > 0)
